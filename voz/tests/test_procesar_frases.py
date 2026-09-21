"""El corte de las frases de «Su voz», con fakes: sin red, sin GPU y sin ffmpeg.

Lo que se prueba de verdad es la lógica del cortador: qué se ubica en el audio
real (un wav sintético que se decodifica y se corta con numpy, así se ve el
tramo exacto que se sube), qué queda anotado en el `frases.json`, y qué pasa con
el pedido. Las cuatro partes de la cadena que necesitan ffmpeg (limpiar, limitar
picos, loudnorm y el mp3) se reemplazan por copias: lo demás corre igual que en
la PC de música.
"""

import io
import json
import logging
import shutil
from pathlib import Path

import numpy as np
import soundfile as sf

import voz.procesar_frases as pf
from voz.config import Config
from voz.cortar_frases import RUTA_AUDIO_DE_FRASE, RUTA_FRASES_JSON, RUTA_FRASES_PEDIDO

from fakes import FakeSupabase

NARRADOR = "n1"
OTRO = "n2"
DURACION = 10.0  # el audio de la respuesta (el wav de mentira)
PEDIDO = "2026-09-21T00:00:00Z"

# Lo que "dice" el audio de la respuesta: Whisper devuelve esto con sus tiempos.
MARCAS = {
    "texto": "Bueno, yo nunca quise ser como mi viejo.",
    "palabras": [
        {"palabra": "Bueno", "inicio": 0.5, "fin": 0.9},
        {"palabra": "yo", "inicio": 1.0, "fin": 1.2},
        {"palabra": "nunca", "inicio": 1.3, "fin": 1.7},
        {"palabra": "quise", "inicio": 1.8, "fin": 2.1},
        {"palabra": "ser", "inicio": 2.2, "fin": 2.4},
        {"palabra": "como", "inicio": 2.5, "fin": 2.8},
        {"palabra": "mi", "inicio": 2.9, "fin": 3.0},
        {"palabra": "viejo", "inicio": 3.1, "fin": 3.6},
    ],
}
# La frase que está en ese audio, con el aire de `recorte_con_aire`: 1.0 - 0.20 a 3.6 + 0.35
FRASE = "Yo nunca quise ser como mi viejo"
DESDE, HASTA = 0.8, 3.95

RESPUESTAS = [
    {"id": "r1", "pregunta_orden": 1, "audio_path": f"{NARRADOR}/audios/r1.wav", "duracion_segundos": DURACION, "transcripcion": ""},
    {"id": "r2", "pregunta_orden": 2, "audio_path": f"{NARRADOR}/audios/r2.wav", "duracion_segundos": DURACION, "transcripcion": ""},
]


def wav_de(segundos: float = DURACION) -> bytes:
    """Un wav de verdad para hacer de audio de la respuesta, sin ffmpeg."""
    t = np.arange(int(24000 * segundos)) / 24000
    buf = io.BytesIO()
    sf.write(buf, (0.2 * np.sin(2 * np.pi * 220 * t)).astype(np.float32), 24000, format="WAV", subtype="PCM_16")
    return buf.getvalue()


WAV = wav_de()
LOG = logging.getLogger("test.procesar_frases")


def config_de(tmp_path) -> Config:
    return Config(
        supabase_url="", supabase_key="",
        carpeta_modelos=tmp_path / "modelos", carpeta_trabajo=tmp_path / "trabajo",
        motor="",
    )


def candidata(frase_id: str, texto: str, respuesta_id: str = "r1", estado: str = "pendiente") -> dict:
    return {
        "id": frase_id, "texto": texto, "respuesta_id": respuesta_id, "estado": estado,
        "audio_path": None, "segundos": None, "inicio": None, "fin": None,
    }


def frases_json(candidatas: list[dict], narrador: str = NARRADOR) -> dict:
    return {
        "version": 1, "narrador_id": narrador, "pedido_id": "p1", "confirmado_at": None,
        "capitulos": [{"numero": 1, "capitulo": "La infancia", "candidatas": candidatas}],
    }


def armar(fake, narrador: str, candidatas: list[dict], respuestas: list[dict], *, con_json=True, con_pedido=True) -> FakeSupabase:
    """Deja en el Storage de mentira el paquete del narrador y el audio de sus respuestas."""
    archivos = fake.storage.archivos.setdefault("audios", {})
    if con_json:
        archivos[RUTA_FRASES_JSON(narrador)] = json.dumps(frases_json(candidatas, narrador)).encode("utf-8")
    if con_pedido:
        archivos[RUTA_FRASES_PEDIDO(narrador)] = PEDIDO.encode("utf-8")
    for r in respuestas:
        if r.get("audio_path"):
            archivos[r["audio_path"]] = WAV
    fake.responder("respuestas", "select", respuestas)
    return fake


def escenario(candidatas: list[dict], respuestas: list[dict] | None = None, **kwargs) -> FakeSupabase:
    """El caso común: un narrador con su pedido, su JSON y dos respuestas con audio."""
    return armar(FakeSupabase(), NARRADOR, candidatas, RESPUESTAS if respuestas is None else respuestas, **kwargs)


def copiar(entrada, salida) -> Path:
    """El reemplazo de las partes que necesitan ffmpeg: deja el archivo igual."""
    shutil.copyfile(entrada, salida)
    return Path(salida)


def cadena_sin_ffmpeg(monkeypatch, registro: dict) -> None:
    """Limpiar, limitar picos, loudnorm y mp3, de mentira (copian el wav).

    Se anota con qué filtro se limpió cada tramo: es lo que distingue una frase
    restaurada de una que salió sin restaurar.
    """
    registro.setdefault("filtros", [])

    def limpiar(entrada, salida, filtro=None):
        registro["filtros"].append(filtro)
        return copiar(entrada, salida)

    def loudnorm(entrada, salida):
        copiar(entrada, salida)
        return {"antes": {"lufs": -30.0, "tp_dbtp": -3.0, "lra": 5.0}, "despues": {"lufs": -19.0, "tp_dbtp": -1.6, "lra": 5.0}, "modo": "linear"}

    monkeypatch.setattr(pf, "limpiar_pieza", limpiar)
    monkeypatch.setattr(pf, "limitar_picos", copiar)
    monkeypatch.setattr(pf, "loudnorm_dos_pasadas", loudnorm)
    monkeypatch.setattr(pf, "a_mp3", copiar)


def cadena_ordenada(monkeypatch, orden: list[str]) -> None:
    """Anota el orden de los pasos que emparejan el nivel (ya tienen su fake).

    Se arma DESPUÉS de `cadena_sin_ffmpeg`: lo que envuelve son esos fakes.
    """
    reales = {nombre: getattr(pf, nombre) for nombre in ("nivelar", "limitar_picos", "loudnorm_dos_pasadas", "a_mp3")}
    for nombre, real in reales.items():
        monkeypatch.setattr(pf, nombre, lambda *a, _n=nombre, _r=real, **k: (orden.append(_n), _r(*a, **k))[1])


def restaurador_falso(restaurados: list[str] | None = None, error: str | None = None):
    """El restaurador de mentira: deja el archivo igual (no hay GPU acá)."""

    def restaurar(entrada, salida, log=None, modelos=None):
        if error:
            raise RuntimeError(error)
        if restaurados is not None:
            restaurados.append(Path(entrada).name)
        copiar(entrada, salida)
        return {"nivel": 0.7, "antes": {"ruido_dbfs": -50.0}, "despues": {"ruido_dbfs": -80.0}}

    return restaurar


def marcas_ok(ruta):
    return MARCAS


def audio_de(fake, ruta: str) -> tuple[np.ndarray, int]:
    """Lo que se subió en `ruta`, leído como audio (el mp3 de los tests es un wav copiado)."""
    return sf.read(io.BytesIO(fake.storage.archivos["audios"][ruta]), dtype="float32")


def frases_publicadas(fake, narrador: str = NARRADOR) -> dict:
    """El `frases.json` tal como quedó en Storage."""
    return json.loads(fake.storage.archivos["audios"][RUTA_FRASES_JSON(narrador)].decode("utf-8"))


def candidatas_publicadas(fake, narrador: str = NARRADOR) -> dict[str, dict]:
    return {c["id"]: c for c in frases_publicadas(fake, narrador)["capitulos"][0]["candidatas"]}


def pedido_esta(fake, narrador: str = NARRADOR) -> bool:
    return RUTA_FRASES_PEDIDO(narrador) in fake.storage.archivos["audios"]


def mp3_subidos(fake) -> list[str]:
    return [s[1] for s in fake.storage.subidas if s[1].endswith(".mp3")]


# --- el camino feliz ---


def test_corta_la_frase_sube_el_mp3_y_anota_minuto_archivo_y_segundos(tmp_path, monkeypatch):
    registro: dict = {}
    cadena_sin_ffmpeg(monkeypatch, registro)
    restaurados: list[str] = []
    fake = escenario([candidata("sf-1", FRASE)])

    cortadas = pf.procesar_pedido(
        fake, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso(restaurados),
    )

    assert cortadas == 1
    ruta = RUTA_AUDIO_DE_FRASE(NARRADOR, "sf-1")
    # El mp3 que queda en el bucket es el tramo exacto: del 0.8 al 3.95 (el aire de
    # `recorte_con_aire` alrededor de la frase ubicada en 1.0 - 3.6).
    audio, tasa = audio_de(fake, ruta)
    assert abs(len(audio) / tasa - (HASTA - DESDE)) < 0.02
    # La respuesta se bajó, se decodificó y se restauró antes de emparejar el nivel.
    assert ("audios", f"{NARRADOR}/audios/r1.wav") in fake.storage.descargas
    assert restaurados == ["sf-1_tramo.wav"]
    assert registro["filtros"] == [pf.FILTRO_LIMPIEZA_RESTAURADA]
    # Lo anotado: el minuto en la respuesta y el nombre del archivo.
    anotada = candidatas_publicadas(fake)["sf-1"]
    assert anotada["estado"] == "cortada"
    assert anotada["audio_path"] == ruta
    assert (anotada["inicio"], anotada["fin"]) == (DESDE, HASTA)
    assert anotada["segundos"] == round(HASTA - DESDE, 2)
    # Y como no quedaba nada pendiente, el pedido se borró.
    assert not pedido_esta(fake)
    assert fake.storage.borrados == [("audios", [RUTA_FRASES_PEDIDO(NARRADOR)])]


def test_emparejar_frase_deja_el_mp3_con_el_nivel_de_la_casa(tmp_path, monkeypatch):
    """La cadena del nivel: restaurar → limpiar → nivelar → limitar → loudnorm → mp3."""
    registro: dict = {}
    cadena_sin_ffmpeg(monkeypatch, registro)
    orden: list[str] = []
    cadena_ordenada(monkeypatch, orden)
    fake = escenario([candidata("sf-1", FRASE)])

    pf.procesar_pedido(fake, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso())

    assert orden == ["nivelar", "limitar_picos", "loudnorm_dos_pasadas", "a_mp3"]
    assert len(fake.storage.archivos["audios"][RUTA_AUDIO_DE_FRASE(NARRADOR, "sf-1")]) > 0


def test_si_restaurar_falla_la_frase_sale_igual_sin_restaurar(tmp_path, monkeypatch):
    """Un hipo de la GPU no puede costar la frase: se corta sin restaurar, con el
    filtro de siempre, en vez de marcarla fallida."""
    registro: dict = {}
    cadena_sin_ffmpeg(monkeypatch, registro)
    fake = escenario([candidata("sf-1", FRASE)])

    cortadas = pf.procesar_pedido(
        fake, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso(error="sin GPU"),
    )

    assert cortadas == 1
    assert candidatas_publicadas(fake)["sf-1"]["estado"] == "cortada"
    assert registro["filtros"] == [pf.FILTRO_LIMPIEZA]
    assert len(fake.storage.archivos["audios"][RUTA_AUDIO_DE_FRASE(NARRADOR, "sf-1")]) > 0


# --- lo que falla ---


def test_una_frase_que_no_se_encuentra_queda_fallida_y_las_demas_siguen(tmp_path, monkeypatch):
    registro: dict = {}
    cadena_sin_ffmpeg(monkeypatch, registro)
    fake = escenario([
        candidata("sf-1", "El campo estaba lleno de girasoles amarillos"),
        candidata("sf-2", FRASE),
    ])

    cortadas = pf.procesar_pedido(fake, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso())

    assert cortadas == 1  # la que no se encontró no se adivina: no hay recorte con otro audio
    publicadas = candidatas_publicadas(fake)
    assert publicadas["sf-1"]["estado"] == "fallida"
    assert "no se encontró" in publicadas["sf-1"]["error"]
    assert publicadas["sf-1"]["audio_path"] is None
    assert publicadas["sf-2"]["estado"] == "cortada"
    assert mp3_subidos(fake) == [RUTA_AUDIO_DE_FRASE(NARRADOR, "sf-2")]
    # Y la fallida no deja el pedido colgado para siempre: no queda ninguna pendiente.
    assert not pedido_esta(fake)


def test_una_respuesta_sin_audio_queda_fallida_y_no_frena_el_resto(tmp_path, monkeypatch):
    registro: dict = {}
    cadena_sin_ffmpeg(monkeypatch, registro)
    sin_audio = [dict(RESPUESTAS[0], audio_path=None), RESPUESTAS[1]]
    fake = escenario(
        [candidata("sf-1", FRASE, respuesta_id="r1"), candidata("sf-2", FRASE, respuesta_id="r2")],
        respuestas=sin_audio,
    )

    cortadas = pf.procesar_pedido(fake, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso())

    assert cortadas == 1
    publicadas = candidatas_publicadas(fake)
    assert publicadas["sf-1"]["estado"] == "fallida" and "no tiene audio" in publicadas["sf-1"]["error"]
    assert publicadas["sf-2"]["estado"] == "cortada"


def test_el_pedido_no_se_borra_si_una_frase_queda_pendiente_y_si_cuando_estan_todas(tmp_path, monkeypatch):
    registro: dict = {}
    cadena_sin_ffmpeg(monkeypatch, registro)
    fake = escenario([candidata("sf-1", FRASE), candidata("sf-2", FRASE, respuesta_id="r2")])

    def whisper_caido(ruta):
        if "sf-2" in Path(ruta).name:
            raise RuntimeError("Whisper falló (429)")
        return MARCAS

    # Primera vuelta: la de r1 se corta, la de r2 se cae por algo pasajero.
    assert pf.procesar_pedido(fake, config_de(tmp_path), LOG, transcriptor=whisper_caido, restaurador=restaurador_falso()) == 1
    publicadas = candidatas_publicadas(fake)
    assert publicadas["sf-1"]["estado"] == "cortada"
    # La que se cayó NO queda fallida: sigue pendiente y sin error, para reintentarla.
    assert publicadas["sf-2"]["estado"] == "pendiente" and "error" not in publicadas["sf-2"]
    assert mp3_subidos(fake) == [RUTA_AUDIO_DE_FRASE(NARRADOR, "sf-1")]
    # Y por eso el pedido sigue ahí (el panel ve el progreso y el worker vuelve).
    assert pedido_esta(fake)
    assert fake.storage.borrados == []
    assert publicadas["sf-2"]["estado"] == "pendiente"

    # Segunda vuelta con el problema arreglado: corta la que faltaba y ahí sí se va el pedido.
    fake.responder("respuestas", "select", RESPUESTAS)  # cada vuelta vuelve a consultar la base
    assert pf.procesar_pedido(fake, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso()) == 1
    assert candidatas_publicadas(fake)["sf-2"]["estado"] == "cortada"
    assert not pedido_esta(fake)


def test_volver_a_correrlo_no_toca_la_frase_ya_cortada(tmp_path, monkeypatch):
    registro: dict = {}
    cadena_sin_ffmpeg(monkeypatch, registro)
    ya = candidata("sf-1", FRASE)
    ya.update({"estado": "cortada", "audio_path": RUTA_AUDIO_DE_FRASE(NARRADOR, "sf-1"), "segundos": 99.0, "inicio": 11.0, "fin": 110.0})
    fake = escenario([ya, candidata("sf-2", FRASE, respuesta_id="r2")])

    assert pf.procesar_pedido(fake, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso()) == 1

    # Solo se trabajó la que faltaba: ni se bajó el audio de la respuesta de la otra.
    assert [d[1] for d in fake.storage.descargas if d[1].endswith(".wav")] == [f"{NARRADOR}/audios/r2.wav"]
    assert mp3_subidos(fake) == [RUTA_AUDIO_DE_FRASE(NARRADOR, "sf-2")]
    # Y lo ya cortado quedó tal cual (si se rehiciera, estos números cambiarían).
    intocada = candidatas_publicadas(fake)["sf-1"]
    assert (intocada["segundos"], intocada["inicio"], intocada["fin"]) == (99.0, 11.0, 110.0)


def test_sin_pedido_o_sin_frases_json_no_explota(tmp_path, monkeypatch):
    registro: dict = {}
    cadena_sin_ffmpeg(monkeypatch, registro)

    # Sin pedido no hay nada que atender (el pedido es el que dice "hay algo para cortar").
    sin_pedido = escenario([candidata("sf-1", FRASE)], con_pedido=False)
    assert pf.procesar_pedido(sin_pedido, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso()) == 0
    assert sin_pedido.storage.descargas == []

    # Un pedido huérfano (sin frases.json) no se puede atender nunca: se limpia y no explota.
    huerfano = escenario([], con_json=False)
    assert pf.procesar_pedido(huerfano, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso()) == 0
    assert not pedido_esta(huerfano)
    assert huerfano.storage.descargas == []

    # Un frases.json sin candidatas es lo mismo: no queda nada pendiente.
    vacio = escenario([])
    assert pf.procesar_pedido(vacio, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso()) == 0
    assert not pedido_esta(vacio)

    # Y un frases.json que no se entiende se anota sin romper nada: el pedido queda
    # (la fábrica lo vuelve a publicar) y no se sube ni se borra nada.
    roto = escenario([candidata("sf-1", FRASE)])
    roto.storage.archivos["audios"][RUTA_FRASES_JSON(NARRADOR)] = b"{esto no es json"
    assert pf.procesar_pedido(roto, config_de(tmp_path), LOG, transcriptor=marcas_ok, restaurador=restaurador_falso()) == 0
    assert pedido_esta(roto)
    assert roto.storage.subidas == [] and roto.storage.borrados == []


def test_un_narrador_que_falla_no_se_lleva_al_otro(tmp_path, monkeypatch):
    """Dos pedidos en la misma vuelta: el que se cae por algo pasajero conserva el
    suyo para reintentarlo y el otro se corta igual."""
    registro: dict = {}
    cadena_sin_ffmpeg(monkeypatch, registro)
    fake = FakeSupabase()
    armar(fake, NARRADOR, [candidata("sf-1", FRASE)], RESPUESTAS)
    armar(fake, OTRO, [candidata("cita-9", FRASE, respuesta_id="r9")], [dict(RESPUESTAS[0], id="r9", audio_path=f"{OTRO}/audios/r9.wav")])

    def whisper_caido(ruta):
        if "sf-1" in Path(ruta).name:
            raise RuntimeError("Whisper falló (429)")
        return MARCAS

    cortadas = pf.procesar_pedido(fake, config_de(tmp_path), LOG, transcriptor=whisper_caido, restaurador=restaurador_falso())

    assert cortadas == 1  # el pedido de n2 se atendió igual
    assert candidatas_publicadas(fake, OTRO)["cita-9"]["estado"] == "cortada"
    assert not pedido_esta(fake, OTRO)
    # El que se cayó conserva su frase pendiente y su pedido: se reintenta en la próxima.
    assert candidatas_publicadas(fake, NARRADOR)["sf-1"]["estado"] == "pendiente"
    assert pedido_esta(fake, NARRADOR)
