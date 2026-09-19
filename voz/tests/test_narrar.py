"""El worker narra capítulo por capítulo con el motor falso, sube cada mp3 a
un Storage en memoria y deja un checkpoint por capítulo; si se cae y vuelve,
saltea los que ya estaban."""

import logging
import shutil

import pytest

import voz.narrar as narrar
from voz.buzon import Narracion
from voz.libro import Capitulo, ruta_capitulo
from voz.narrar import FaltanMinutos, narrar_capitulos, preparar_voz

from fakes import FakeSupabase

con_ffmpeg = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="hace falta ffmpeg")

CAPITULOS = [
    Capitulo(1, "La infancia", "Nací en un pueblo chico. Había un río."),
    Capitulo(2, "El trabajo", "Empecé a trabajar a los catorce. Era duro."),
    Capitulo(3, "La familia", "Después llegaron los hijos. Todo cambió."),
]


def narracion_de(narrador_id="n1", ya=()):
    return Narracion(
        id="nar1", narrador_id=narrador_id, pedido_id="p1", estado="procesando",
        capitulos_paths=list(ya), tomada_at=None, error=None,
    )


def preparar_escenario(tmp_path, monkeypatch, fake):
    """Referencia (el motor falso no la lee), carpeta de trabajo y contador de lanzamientos."""
    referencia = tmp_path / "referencia.wav"
    referencia.write_bytes(b"")
    referencia_texto = tmp_path / "referencia.txt"
    referencia_texto.write_text("hola", encoding="utf-8")
    carpeta = tmp_path / "trabajo"
    carpeta.mkdir()
    for _ in CAPITULOS:
        fake.responder("narraciones", "update", [{"id": "nar1"}])

    lanzamientos = []
    real = narrar.correr_motor_subprocess

    def contando(*args, **kwargs):
        lanzamientos.append(args)
        return real(*args, **kwargs)

    monkeypatch.setattr(narrar, "correr_motor_subprocess", contando)
    return referencia, referencia_texto, carpeta, lanzamientos


def valores_del_update(cadena):
    return next(llamada[1] for llamada in cadena.llamadas if llamada[0] == "update")


def checkpoints(fake):
    return [
        valores_del_update(c)["capitulos_paths"]
        for c in fake.ejecutadas
        if c.tabla == "narraciones" and c.operacion == "update"
    ]


@con_ffmpeg
def test_narra_tres_capitulos_sube_tres_mp3_y_deja_checkpoint_por_capitulo(tmp_path, monkeypatch, motor_falso):
    fake = FakeSupabase()
    referencia, referencia_texto, carpeta, lanzamientos = preparar_escenario(tmp_path, monkeypatch, fake)
    log = logging.getLogger("test.narrar")

    rutas = narrar_capitulos(
        fake, narracion_de(), CAPITULOS, motor_falso, referencia, referencia_texto,
        carpeta, tmp_path / "modelos", [], log,
    )

    esperadas = [ruta_capitulo("n1", n) for n in (1, 2, 3)]
    assert rutas == esperadas
    assert len(lanzamientos) == 3
    assert [s[1] for s in fake.storage.subidas] == esperadas
    for bucket, ruta, opciones in fake.storage.subidas:
        assert bucket == "audios"
        assert opciones == {"content-type": "audio/mpeg", "upsert": "true"}
        assert len(fake.storage.archivos["audios"][ruta]) > 1000
    assert checkpoints(fake) == [esperadas[:1], esperadas[:2], esperadas[:3]]
    for c in fake.ejecutadas:
        assert valores_del_update(c)["estado"] == "procesando"
        assert ("eq", "id", "nar1") in c.llamadas
    # El txt que lee el motor lleva el anuncio adelante, con la voz clonada (CONTRATO).
    assert (carpeta / "cap_02.txt").read_text(encoding="utf-8") == "Capítulo dos. El trabajo.\n\n" + CAPITULOS[1].texto + "\n"
    # El wav intermedio (decenas de MB por capítulo) se borra apenas sale el
    # mp3; el mp3 y el txt quedan para mirar si algo sonó mal.
    assert sorted(p.name for p in carpeta.glob("cap_*.wav")) == []
    assert sorted(p.name for p in carpeta.glob("cap_*.mp3")) == ["cap_01.mp3", "cap_02.mp3", "cap_03.mp3"]


@con_ffmpeg
def test_reanuda_saltando_los_capitulos_ya_subidos(tmp_path, monkeypatch, motor_falso):
    fake = FakeSupabase()
    referencia, referencia_texto, carpeta, lanzamientos = preparar_escenario(tmp_path, monkeypatch, fake)
    ya = [ruta_capitulo("n1", 1), ruta_capitulo("n1", 2)]

    rutas = narrar_capitulos(
        fake, narracion_de(ya=ya), CAPITULOS, motor_falso, referencia, referencia_texto,
        carpeta, tmp_path / "modelos", ya, logging.getLogger("test.narrar"),
    )

    assert rutas == [ruta_capitulo("n1", n) for n in (1, 2, 3)]
    assert len(lanzamientos) == 1
    assert [s[1] for s in fake.storage.subidas] == [ruta_capitulo("n1", 3)]
    assert checkpoints(fake) == [rutas]


def test_preparar_voz_con_pocos_minutos_levanta_faltan_minutos_sin_bajar_nada(tmp_path):
    fake = FakeSupabase()
    fake.responder("narradores", "select", [{"id": "n1", "nombre": "Joaquín", "como_le_dicen": "Joaco", "estado": "activo"}])
    fake.responder(
        "respuestas",
        "select",
        [
            {"id": f"r{i}", "pregunta_orden": i, "audio_path": f"n1/audios/{i}.ogg", "duracion_segundos": 100, "transcripcion": "algo"}
            for i in range(1, 4)
        ],
    )

    with pytest.raises(FaltanMinutos) as info:
        preparar_voz(fake, "n1", tmp_path / "muestras")

    assert info.value.segundos == 300
    assert fake.storage.descargas == []
    assert ("eq", "id", "n1") in fake.ejecutadas[0].llamadas
