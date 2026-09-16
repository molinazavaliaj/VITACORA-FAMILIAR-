"""`procesar_una`: el bucle del worker de a una narración, con fakes.

Sin pendientes no hace nada (pero antes libera las colgadas); sin
consentimiento la marca fallida sin tocar el motor; con el motor falso deja
`lista` con sus tres mp3; y si el motor explota, la marca fallida con el
error y sigue vivo."""

import json
import logging
import shutil
import subprocess

import pytest

import voz.narrar as narrar
import voz.worker as worker
from voz.config import Config
from voz.libro import ruta_capitulo
from voz.narrar import FaltanMinutos
from voz.worker import RUTA_NARRACION_JSON, procesar_una, una_vuelta

from fakes import FakeSupabase

con_ffmpeg = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="hace falta ffmpeg")

LIBRO = {
    "capitulos": [
        {"numero": 1, "nombre": "La infancia", "texto": "Nací en un pueblo chico. Había un río."},
        {"numero": 2, "nombre": "El trabajo", "texto": "Empecé a trabajar a los catorce. Era duro."},
        {"numero": 3, "nombre": "La familia", "texto": "Después llegaron los hijos. Todo cambió."},
    ]
}
RESUMEN = {"segundos_limpios": 886, "referencia": {"segundos": 21}}
FILA = {
    "id": "nar1", "narrador_id": "n1", "pedido_id": "p1", "estado": "procesando",
    "capitulos_paths": None, "tomada_at": "2026-09-16T10:00:00+00:00", "error": None,
}


def config_de(tmp_path, motor="falso"):
    return Config(
        supabase_url="", supabase_key="",
        carpeta_modelos=tmp_path / "modelos", carpeta_trabajo=tmp_path / "trabajo",
        motor=motor,
    )


def con_una_pendiente(fake, consentimiento="2026-09-01T00:00:00+00:00"):
    """Supabase contesta: nada colgado, una pendiente, y el narrador con (o sin) consentimiento."""
    fake.responder("narraciones", "update", [])  # retomar_colgadas
    fake.responder("narraciones", "select", [{"id": "nar1"}])
    fake.responder("narraciones", "update", [FILA])  # tomar_pendiente
    fake.responder("narradores", "select", [{"consentimiento_voz_at": consentimiento}])
    fake.storage.from_("audios").archivos[RUTA_NARRACION_JSON("n1")] = json.dumps(LIBRO).encode("utf-8")


def updates_de(fake):
    return [
        next(ll[1] for ll in c.llamadas if ll[0] == "update")
        for c in fake.ejecutadas
        if c.tabla == "narraciones" and c.operacion == "update"
    ]


def referencia_preparada(tmp_path):
    """Un `preparar_voz` de mentira: deja una referencia de 2 s y devuelve el resumen fijo."""

    def preparar(sb, narrador_id, carpeta):
        carpeta.mkdir(parents=True, exist_ok=True)
        wav = carpeta / "referencia.wav"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=2",
             "-ar", "24000", "-ac", "1", str(wav)],
            check=True,
        )
        txt = carpeta / "referencia.txt"
        txt.write_text("hola, soy la referencia", encoding="utf-8")
        return wav, txt, dict(RESUMEN)

    return preparar


def test_sin_pendientes_devuelve_false_y_antes_libera_las_colgadas(tmp_path):
    fake = FakeSupabase()
    fake.responder("narraciones", "update", [])
    fake.responder("narraciones", "select", [])

    assert procesar_una(fake, config_de(tmp_path), logging.getLogger("test.worker")) is False

    primera = fake.ejecutadas[0]
    assert primera.tabla == "narraciones" and primera.operacion == "update"
    assert ("eq", "estado", "procesando") in primera.llamadas
    assert any(ll[0] == "lt" and ll[1] == "actualizada_at" for ll in primera.llamadas)
    assert next(ll[1] for ll in primera.llamadas if ll[0] == "update")["estado"] == "pendiente"


def test_sin_consentimiento_la_marca_fallida_sin_tocar_el_motor(tmp_path, monkeypatch):
    fake = FakeSupabase()
    con_una_pendiente(fake, consentimiento=None)
    fake.responder("narraciones", "update", [{"id": "nar1"}])  # marcar fallida
    lanzamientos = []
    monkeypatch.setattr(narrar, "correr_motor_subprocess", lambda *a, **k: lanzamientos.append(a))

    assert procesar_una(fake, config_de(tmp_path), logging.getLogger("test.worker")) is True

    ultimo = updates_de(fake)[-1]
    assert ultimo["estado"] == "fallida"
    assert ultimo["error"] == "sin_consentimiento_voz"
    assert ultimo["motor"] == "falso"
    assert lanzamientos == []
    assert fake.storage.descargas == []
    assert not any(c.tabla == "respuestas" for c in fake.ejecutadas)


@con_ffmpeg
def test_camino_feliz_deja_lista_con_tres_capitulos_y_tres_mp3(tmp_path, monkeypatch, motor_falso):
    fake = FakeSupabase()
    con_una_pendiente(fake)
    for _ in range(3):
        fake.responder("narraciones", "update", [{"id": "nar1"}])  # checkpoints
    fake.responder("narraciones", "update", [{"id": "nar1"}])  # marcar lista
    monkeypatch.setattr(worker, "preparar_voz", referencia_preparada(tmp_path))

    assert procesar_una(fake, config_de(tmp_path, motor_falso), logging.getLogger("test.worker")) is True

    esperadas = [ruta_capitulo("n1", n) for n in (1, 2, 3)]
    ultimo = updates_de(fake)[-1]
    assert ultimo["estado"] == "lista"
    assert ultimo["capitulos_paths"] == esperadas
    assert ultimo["muestras"] == RESUMEN
    assert ultimo["motor"] == "falso"
    assert [s[1] for s in fake.storage.subidas] == esperadas
    for ruta in esperadas:
        assert len(fake.storage.archivos["audios"][ruta]) > 1000
    assert ("audios", RUTA_NARRACION_JSON("n1")) in fake.storage.descargas
    assert (tmp_path / "trabajo" / "narraciones" / "nar1" / "referencia.txt").exists()


def test_si_el_motor_explota_la_marca_fallida_con_el_error_y_no_muere(tmp_path, monkeypatch):
    fake = FakeSupabase()
    con_una_pendiente(fake)
    fake.responder("narraciones", "update", [{"id": "nar1"}])  # marcar fallida
    monkeypatch.setattr(worker, "preparar_voz", referencia_preparada(tmp_path))

    def explota(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(worker, "narrar_capitulos", explota)

    assert procesar_una(fake, config_de(tmp_path), logging.getLogger("test.worker")) is True

    ultimo = updates_de(fake)[-1]
    assert ultimo["estado"] == "fallida"
    assert ultimo["error"].startswith("RuntimeError: boom")
    assert "explota" in ultimo["error"]
    assert ultimo["motor"] == "falso"


def test_faltan_minutos_la_marca_fallida_con_los_segundos(tmp_path, monkeypatch):
    fake = FakeSupabase()
    con_una_pendiente(fake)
    fake.responder("narraciones", "update", [{"id": "nar1"}])  # marcar fallida

    def sin_minutos(sb, narrador_id, carpeta):
        raise FaltanMinutos(300.0)

    monkeypatch.setattr(worker, "preparar_voz", sin_minutos)

    assert procesar_una(fake, config_de(tmp_path), logging.getLogger("test.worker")) is True

    ultimo = updates_de(fake)[-1]
    assert ultimo["estado"] == "fallida"
    assert ultimo["error"] == "faltan_minutos_de_voz: 300 s"
    assert ultimo["motor"] == "falso"


def test_si_marcar_fallida_tambien_falla_el_worker_sigue_vivo(tmp_path, monkeypatch):
    fake = FakeSupabase()
    con_una_pendiente(fake)
    # sin respuesta encolada para el update de `marcar`: devuelve [] y `marcar` levanta RuntimeError

    def explota(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(worker, "preparar_voz", explota)

    assert procesar_una(fake, config_de(tmp_path), logging.getLogger("test.worker")) is True


def test_una_vuelta_no_muere_si_supabase_falla_al_sondear(tmp_path, monkeypatch):
    def caido(sb, config, log):
        raise RuntimeError("503 Service Unavailable")

    monkeypatch.setattr(worker, "procesar_una", caido)

    assert una_vuelta(FakeSupabase(), config_de(tmp_path), logging.getLogger("test.worker")) is False


def test_una_vuelta_devuelve_lo_que_dice_procesar_una(tmp_path, monkeypatch):
    monkeypatch.setattr(worker, "procesar_una", lambda sb, config, log: True)

    assert una_vuelta(FakeSupabase(), config_de(tmp_path), logging.getLogger("test.worker")) is True
