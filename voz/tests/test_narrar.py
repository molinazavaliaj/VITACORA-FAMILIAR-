"""El worker narra capítulo por capítulo con el motor falso, sube cada mp3 a
un Storage en memoria y deja un checkpoint por capítulo; si se cae y vuelve,
saltea los que ya estaban."""

import json
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
    # Cada capítulo sube su mp3 masterizado y, detrás, el master.json del libro al día.
    mp3s = [s for s in fake.storage.subidas if s[1].endswith(".mp3")]
    masters = [s for s in fake.storage.subidas if s[1].endswith("master.json")]
    assert [s[1] for s in mp3s] == esperadas
    assert [s[1] for s in masters] == ["n1/voz/master.json"] * 3
    for bucket, ruta, opciones in mp3s:
        assert bucket == "audios"
        assert opciones == {"content-type": "audio/mpeg", "upsert": "true"}
        assert len(fake.storage.archivos["audios"][ruta]) > 1000
    assert checkpoints(fake) == [esperadas[:1], esperadas[:2], esperadas[:3]]
    for c in fake.ejecutadas:
        assert valores_del_update(c)["estado"] == "procesando"
        assert ("eq", "id", "nar1") in c.llamadas
    # El txt que lee el motor lleva el anuncio adelante, con la voz clonada
    # (CONTRATO), y el separador de historia después (pausa larga).
    assert (carpeta / "cap_02.txt").read_text(encoding="utf-8") == "Capítulo dos. El trabajo.\n\n* * *\n\n" + CAPITULOS[1].texto + "\n"
    # master.json: un capítulo por entrada, con medidas antes/después y el loudnorm del capítulo.
    master = json.loads((carpeta / "master.json").read_text(encoding="utf-8"))
    assert [c["capitulo"] for c in master["capitulos"]] == [1, 2, 3]
    assert master["libro"] == {"narracion": "nar1", "narrador": "n1", "motor": motor_falso, "objetivo_espectral": {}}
    for c in master["capitulos"]:
        assert c["loudnorm"]["despues"]["lufs"] is not None
        pieza = c["piezas"][0]
        assert pieza["tipo"] == "clonado" and pieza["nombre"] == f"cap_{c['capitulo']:02d}"
        assert set(pieza["antes"]) == set(pieza["despues"]) == {"duracion_s", "rms_db", "pico_db", "ruido_db"}
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
    assert [s[1] for s in fake.storage.subidas if s[1].endswith(".mp3")] == [ruta_capitulo("n1", 3)]
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


# --- el híbrido en el worker (directiva 04) ---

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

from voz.libro import Conectores, Historia  # noqa: E402


def _tono(segundos: float, f: float = 200.0) -> bytes:
    """Un wav sintético para meter en el storage falso como si fuera el audio real."""
    import io

    sr = 24000
    t = np.arange(int(sr * segundos)) / sr
    env = np.clip(np.sin(2 * np.pi * 1.5 * t) * 3.0, 0.0, 1.0).astype(np.float32)
    audio = (0.3 * env * np.sin(2 * np.pi * f * t)).astype(np.float32)
    buf = io.BytesIO()
    sf.write(buf, audio, sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def _restaurador_falso(entrada, salida, log=None, modelos=None):
    import subprocess

    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(entrada), "-ac", "1", "-ar", "44100", "-c:a", "pcm_f32le", str(salida)], check=True)
    return {"nivel": 0.7, "antes": {"ruido_dbfs": -50.0}, "despues": {"ruido_dbfs": -80.0}}


def _whisper_falso(ruta):
    return {"texto": "Bueno, esto es una historia.", "palabras": [{"palabra": "Bueno", "inicio": 0.1, "fin": 0.5}, {"palabra": "esto", "inicio": 0.7, "fin": 0.9}]}


HIBRIDO = Capitulo(
    1, "Las raíces", "texto escrito que en híbrido no se narra", modo="hibrido",
    historias=(
        Historia("a", 5, False, "n1/dia_05.wav", 6, "¿Abuelos?", "t1"),
        Historia("b", 5, True, "n1/dia_05_2.wav", 4, "¿Y?", "t2"),
    ),
    conectores=Conectores("Cuando me preguntaron por mis abuelos.", ("Eso me lo contó mi tía.",), "Esa es mi herencia."),
)


def _escenario_hibrido(tmp_path, monkeypatch, fake):
    referencia, referencia_texto, carpeta, lanzamientos = preparar_escenario(tmp_path, monkeypatch, fake)
    fake.storage.archivos.setdefault("audios", {})["n1/dia_05.wav"] = _tono(6.0, 200)
    fake.storage.archivos["audios"]["n1/dia_05_2.wav"] = _tono(4.0, 180)
    return referencia, referencia_texto, carpeta, lanzamientos


@con_ffmpeg
def test_capitulo_hibrido_historias_reales_y_conectores_clonados_en_orden(tmp_path, monkeypatch, motor_falso):
    fake = FakeSupabase()
    referencia, referencia_texto, carpeta, lanzamientos = _escenario_hibrido(tmp_path, monkeypatch, fake)
    restauradas, transcriptas = [], []

    def restaurador(entrada, salida, log=None, modelos=None):
        restauradas.append(entrada.name)
        return _restaurador_falso(entrada, salida)

    def transcriptor(ruta):
        transcriptas.append(ruta.name)
        return _whisper_falso(ruta)

    rutas = narrar_capitulos(
        fake, narracion_de(), [HIBRIDO, CAPITULOS[1]], motor_falso, referencia, referencia_texto,
        carpeta, tmp_path / "modelos", [], logging.getLogger("test.narrar"),
        restaurador=restaurador, transcriptor=transcriptor,
    )

    assert rutas == [ruta_capitulo("n1", 1), ruta_capitulo("n1", 2)]
    # la voz clonada narró 3 conectores del híbrido + el capítulo clonado entero = 4 lanzamientos del motor
    assert len(lanzamientos) == 4
    textos = [(carpeta / f).read_text(encoding="utf-8") for f in ("cap_01_c0_anuncio_entrada.txt", "cap_01_c1_entre.txt", "cap_01_c2_salida.txt")]
    assert textos[0] == "Capítulo uno. Las raíces.\n\n* * *\n\nCuando me preguntaron por mis abuelos.\n"
    assert textos[1] == "Eso me lo contó mi tía.\n" and textos[2] == "Esa es mi herencia.\n"
    assert not (carpeta / "cap_01.txt").exists()  # el texto escrito del híbrido no se narra
    # las dos historias se bajaron del bucket, se restauraron y pasaron por Whisper (en mp3)
    assert [d[1] for d in fake.storage.descargas] == ["n1/dia_05.wav", "n1/dia_05_2.wav"]
    assert restauradas == ["01_crudo.wav", "03_crudo.wav"]
    assert transcriptas == ["01_para_whisper.mp3", "03_para_whisper.mp3"]
    # master.json: modo, la secuencia y lo aplicado a cada historia
    master = json.loads((carpeta / "master.json").read_text(encoding="utf-8"))
    cap1, cap2 = master["capitulos"]
    assert cap1["modo"] == "hibrido" and cap2["modo"] == "clonado"
    assert [(p["nombre"], p["tipo"]) for p in cap1["piezas"]] == [
        ("c0_anuncio_entrada", "conector"), ("h1_p05", "real"), ("c1_entre", "conector"), ("h2_p05_re", "real"), ("c2_salida", "conector"),
    ]
    for p in cap1["piezas"]:
        if p["tipo"] == "real":
            assert p["restauracion"]["despues"]["ruido_dbfs"] == -80.0
            assert p["ritmo"]["arranque"] == "Bueno" and p["ritmo"]["arranque_cortado_s"] == 0.5
        else:
            assert "restauracion" not in p
    assert abs(cap1["loudnorm"]["despues"]["lufs"] + 19) <= 1.0
    # el mp3 subió, el checkpoint quedó y master.json fue después (03c)
    subidas = [s[1] for s in fake.storage.subidas]
    assert subidas.index("n1/voz/cap_01.mp3") < subidas.index("n1/voz/master.json")
    assert checkpoints(fake)[0] == [ruta_capitulo("n1", 1)]


@con_ffmpeg
def test_hibrido_si_restaurar_o_whisper_fallan_la_historia_sigue_sin_eso_y_queda_anotado(tmp_path, monkeypatch, motor_falso):
    fake = FakeSupabase()
    referencia, referencia_texto, carpeta, _ = _escenario_hibrido(tmp_path, monkeypatch, fake)

    def restaurador_roto(entrada, salida, log=None, modelos=None):
        raise RuntimeError("sin GPU")

    def whisper_roto(ruta):
        raise RuntimeError("Whisper falló (429)")

    rutas = narrar_capitulos(
        fake, narracion_de(), [HIBRIDO], motor_falso, referencia, referencia_texto,
        carpeta, tmp_path / "modelos", [], logging.getLogger("test.narrar"),
        restaurador=restaurador_roto, transcriptor=whisper_roto,
    )

    assert rutas == [ruta_capitulo("n1", 1)]  # el capítulo salió igual
    master = json.loads((carpeta / "master.json").read_text(encoding="utf-8"))
    reales = [p for p in master["capitulos"][0]["piezas"] if p["tipo"] == "real"]
    assert all("sin GPU" in p["restauracion"]["error"] for p in reales)
    assert all("Whisper" in p["ritmo"]["error"] and p["ritmo"]["arranque_cortado_s"] == 0.0 for p in reales)
    avisos = master["capitulos"][0]["avisos"]
    assert any("sin restaurar" in a for a in avisos) and any("sin ritmo" in a for a in avisos)


@con_ffmpeg
def test_hibrido_si_falla_un_conector_la_narracion_falla(tmp_path, monkeypatch, motor_falso):
    fake = FakeSupabase()
    referencia, referencia_texto, carpeta, _ = _escenario_hibrido(tmp_path, monkeypatch, fake)

    def motor_que_falla_en_el_puente(motor, ref, ref_txt, texto, salida, modelos, registro):
        if "entre" in texto.name:
            registro.write_text("CUDA out of memory", encoding="utf-8")
            return False, 1.0, "CUDA out of memory"
        return narrar.correr_motor_subprocess.__wrapped__(motor, ref, ref_txt, texto, salida, modelos, registro) if hasattr(narrar.correr_motor_subprocess, "__wrapped__") else _real(motor, ref, ref_txt, texto, salida, modelos, registro)

    import voz.motor_subprocess as ms

    _real = ms.correr_motor_subprocess
    monkeypatch.setattr(narrar, "correr_motor_subprocess", motor_que_falla_en_el_puente)

    with pytest.raises(RuntimeError, match="c1_entre"):
        narrar_capitulos(
            fake, narracion_de(), [HIBRIDO], motor_falso, referencia, referencia_texto,
            carpeta, tmp_path / "modelos", [], logging.getLogger("test.narrar"),
            restaurador=_restaurador_falso, transcriptor=_whisper_falso,
        )
    assert [s[1] for s in fake.storage.subidas if s[1].endswith(".mp3")] == []  # nada subido a medias
