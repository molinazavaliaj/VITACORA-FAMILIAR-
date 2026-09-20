"""masterizar con audio sintético: piezas a distinto nivel y color entran, y sale
un capítulo a −19 LUFS con las pausas pedidas, medido antes y después."""

import json
import shutil
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

from voz import masterizar as m
from voz.masterizar import Pieza, agregar_a_master, masterizar_capitulo, medir, nivelar, pegar_piezas, perfil_espectral

con_ffmpeg = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="hace falta ffmpeg")
SR = m.TASA


def _voz(segundos: float, amplitud: float = 0.2, f: float = 180.0, brillo: float = 0.3) -> np.ndarray:
    """Un habla sintética: tono con armónicos, modulado como sílabas, con un poco de aire."""
    t = np.arange(int(SR * segundos)) / SR
    rng = np.random.default_rng(int(f))
    silabas = (np.sin(2 * np.pi * 4 * t) > -0.3).astype(np.float32)  # ~4 sílabas por segundo
    onda = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + brillo * np.sin(2 * np.pi * 8 * f * t)
    aire = brillo * 0.05 * rng.standard_normal(len(t))
    return (amplitud * silabas * onda + aire).astype(np.float32)


def _escribir(ruta: Path, audio: np.ndarray) -> Path:
    sf.write(str(ruta), audio, SR, subtype="PCM_16")
    return ruta


def _restaurador_falso(entrada, salida, log=None, nivel=None):
    """Como el de verdad: deja un wav a 44,1 kHz (acá, el mismo audio remuestreado) y mide."""
    import subprocess

    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(entrada), "-ac", "1", "-ar", "44100", "-c:a", "pcm_f32le", str(salida)], check=True)
    return {"nivel": 0.85, "antes": {"ruido_dbfs": -50.0}, "despues": {"ruido_dbfs": -80.0}}


def _transcriptor_sin_cortes(ruta):
    """Whisper de mentira que no encuentra nada que cortar."""
    return {"texto": "Mi abuela vive en Córdoba.", "palabras": [{"palabra": "Mi", "inicio": 0.1, "fin": 0.3}, {"palabra": "abuela", "inicio": 0.4, "fin": 0.9}]}


def test_medir_devuelve_nivel_pico_y_ruido_razonables():
    med = medir(_voz(2.0, 0.2))
    assert med.duracion_s == 2.0
    assert -30 < med.rms_db < -5
    assert med.pico_db > med.rms_db
    assert med.ruido_db < med.rms_db
    assert medir(np.zeros(0, dtype=np.float32)).duracion_s == 0.0


def test_nivelar_lleva_piezas_distintas_al_mismo_nivel_de_voz():
    fuerte, floja = nivelar(_voz(2.0, 0.5)), nivelar(_voz(2.0, 0.02))
    assert abs(medir(fuerte).rms_db - medir(floja).rms_db) < 1.5  # el RMS total incluye el "aire", que no escala igual
    assert len(nivelar(np.zeros(100, dtype=np.float32))) == 100


def test_pegar_piezas_mete_la_pausa_y_devuelve_donde_quedo_cada_una():
    a, b = _voz(1.0), _voz(0.5)
    pegado, posiciones = pegar_piezas([a, b], pausa_ms=1200)
    assert len(pegado) == len(a) + int(SR * 1.2) + len(b)
    assert posiciones == [(0, len(a)), (len(a) + int(SR * 1.2), len(pegado))]
    assert pegado[0] == 0.0 and pegado[len(a) - 1] == 0.0  # fades en los bordes


def test_perfil_espectral_distingue_una_voz_brillante_de_una_opaca():
    brillante, opaca = perfil_espectral(_voz(5.0, brillo=1.0)), perfil_espectral(_voz(5.0, brillo=0.05))
    assert brillante[-1] > opaca[-1]  # la banda de 8 kHz
    assert brillante[3] == 0.0 == opaca[3]  # 1 kHz es la referencia


@con_ffmpeg
def test_masterizar_capitulo_deja_menos_19_lufs_pausas_pedidas_y_master_json(tmp_path):
    fuerte = _escribir(tmp_path / "real_fuerte.wav", _voz(6.0, 0.5, f=170, brillo=0.2))
    floja = _escribir(tmp_path / "conector_flojo.wav", _voz(3.0, 0.03, f=190, brillo=1.0))  # bajo y brillante
    piezas = [Pieza(fuerte, "dia_01", "real"), Pieza(floja, "c1", "conector"), Pieza(fuerte, "dia_02", "real")]
    salida = tmp_path / "cap_01.wav"

    entrada = masterizar_capitulo(
        1, piezas, salida, pausas={"historia": 1200}, log=print,
        restaurador=_restaurador_falso, transcriptor=_transcriptor_sin_cortes,
    )

    assert salida.exists()
    assert entrada["capitulo"] == 1 and entrada["salida"] == "cap_01.wav"
    d = entrada["loudnorm"]["despues"]
    assert abs(d["lufs"] - m.OBJETIVO_LUFS) <= m.TOLERANCIA_LUFS
    assert d["tp_dbtp"] <= m.TP_MAXIMO
    assert entrada["pausa_entre_piezas_ms"] == 1200
    # las tres piezas quedaron al mismo nivel aunque entraron con 24 dB de diferencia
    niveles = [p["despues"]["rms_db"] for p in entrada["piezas"]]
    assert max(niveles) - min(niveles) < 3.0
    assert abs(entrada["piezas"][0]["antes"]["rms_db"] - entrada["piezas"][1]["antes"]["rms_db"]) > 12
    # el conector brillante se acercó al color de las reales: la EQ le bajó los agudos
    assert entrada["piezas"][1]["eq_db"][-1] < 0
    # y las reales, que son el objetivo, casi no se tocaron
    assert all(abs(g) <= 1.0 for g in entrada["piezas"][0]["eq_db"])
    # duración ≈ piezas + dos pausas de 1,2 s (± lo que recortó silenceremove)
    assert abs(entrada["duracion_s"] - (6 + 3 + 6 + 2 * 1.2)) < 1.0
    for p in entrada["piezas"]:
        assert set(p["antes"]) == set(p["despues"]) == {"duracion_s", "rms_db", "pico_db", "ruido_db"}

    master = tmp_path / "master.json"
    agregar_a_master(master, entrada, libro={"narracion": "x"})
    agregar_a_master(master, {**entrada, "capitulo": 2, "salida": "cap_02.wav"})
    agregar_a_master(master, {**entrada, "capitulo": 1})  # repetir un capítulo lo pisa, no lo duplica
    datos = json.loads(master.read_text(encoding="utf-8"))
    assert [c["capitulo"] for c in datos["capitulos"]] == [1, 2]
    assert datos["libro"] == {"narracion": "x"}
    assert datos["objetivos"] == {"lufs": -19.0, "tp_dbtp": -1.5, "lra": 7.0}
    assert isinstance(datos["avisos"], list)


def test_avisos_cuando_algo_queda_fuera_de_rango():
    capitulo = {
        "loudnorm": {"despues": {"lufs": -16.0, "tp_dbtp": -0.2, "lra": 5.0}, "modo": "dynamic"},
        "piezas": [{"nombre": "x", "despues": {"ruido_db": -30.0, "duracion_s": 0.1}}],
    }
    avisos = m.avisos_de(capitulo)
    assert any("LUFS" in a for a in avisos)
    assert any("pico real" in a for a in avisos)
    assert any("dinámico" in a for a in avisos)
    assert any("ruido" in a for a in avisos)
    assert any("recortó" in a for a in avisos)
    limpio = {"loudnorm": {"despues": {"lufs": -19.2, "tp_dbtp": -1.5, "lra": 6.0}, "modo": "linear"}, "piezas": []}
    assert m.avisos_de(limpio) == []


def test_un_capitulo_sin_piezas_es_error():
    with pytest.raises(ValueError):
        masterizar_capitulo(1, [], Path("x.wav"))


# --- directiva 02: las piezas reales pasan por restaurar + ritmo antes de todo ---


def _transcriptor_falso(ruta):
    """Whisper de mentira: 'Bueno,' en el primer medio segundo y una pausa larga en el medio."""
    return {
        "texto": "Bueno, esto es una historia. Con una pausa larga en el medio.",
        "palabras": [
            {"palabra": "Bueno", "inicio": 0.05, "fin": 0.5},
            {"palabra": "esto", "inicio": 0.6, "fin": 0.8},
            {"palabra": "historia", "inicio": 0.9, "fin": 2.0},
            {"palabra": "Con", "inicio": 4.5, "fin": 4.7},  # 2,5 s de silencio antes → se acorta a 0,7
            {"palabra": "medio", "inicio": 4.8, "fin": 5.9},
        ],
    }


@con_ffmpeg
def test_las_piezas_reales_se_restauran_y_se_les_arregla_el_ritmo(tmp_path):
    real = _escribir(tmp_path / "dia_01.wav", _voz(6.0, 0.3))
    conector = _escribir(tmp_path / "c1.wav", _voz(2.0, 0.2, f=200))
    llamadas = []

    def restaurador(entrada, salida, log=None):
        llamadas.append(("restaurar", entrada.name))
        return _restaurador_falso(entrada, salida)

    def transcriptor(ruta):
        llamadas.append(("whisper", ruta.name))
        return _transcriptor_falso(ruta)

    entrada = masterizar_capitulo(
        3, [Pieza(real, "dia_01", "real"), Pieza(conector, "c1", "conector")], tmp_path / "cap_03.wav",
        pausas={"historia": 1200}, restaurador=restaurador, transcriptor=transcriptor,
    )

    # solo la real pasó por el modelo y por Whisper; el conector no
    assert llamadas == [("restaurar", "00_crudo.wav"), ("whisper", "00_para_whisper.mp3")]  # a Whisper va mp3 64k (03b)
    p_real, p_con = entrada["piezas"]
    assert p_real["restauracion"]["despues"]["ruido_dbfs"] == -80.0
    assert p_real["ritmo"]["arranque"] == "Bueno" and p_real["ritmo"]["arranque_cortado_s"] == 0.5
    assert p_real["ritmo"]["silencios_acortados"] == 1 and abs(p_real["ritmo"]["silencio_sacado_s"] - 1.8) < 0.01
    assert "restauracion" not in p_con and "ritmo" not in p_con
    # la real quedó más corta: 6 s − 0,5 de arranque − 1,8 de silencio (± lo que recorta silenceremove)
    assert abs(p_real["despues"]["duracion_s"] - 3.7) < 0.6
    assert abs(entrada["loudnorm"]["despues"]["lufs"] - m.OBJETIVO_LUFS) <= m.TOLERANCIA_LUFS


# --- revisión 03: caché de Whisper, master.json atómico y a medias ---


def test_marcas_de_whisper_se_cachean_por_hash_del_audio(tmp_path):
    from voz.masterizar import marcas_con_cache

    fuente = _escribir(tmp_path / "restaurado.wav", _voz(2.0))
    llamadas = []

    def transcriptor(ruta):
        llamadas.append(ruta.suffix)
        return {"texto": "hola.", "palabras": []}

    cache = tmp_path / "whisper"
    a = marcas_con_cache(transcriptor, fuente, tmp_path / "w.mp3", cache, "clave1")
    b = marcas_con_cache(transcriptor, fuente, tmp_path / "w2.mp3", cache, "clave1")  # misma clave: no paga
    c = marcas_con_cache(transcriptor, fuente, tmp_path / "w3.mp3", cache, "clave2")
    assert a == b == c
    assert llamadas == [".mp3", ".mp3"]  # dos claves distintas, dos llamadas; y a Whisper va mp3
    assert (cache / "clave1.json").exists() and (cache / "clave2.json").exists()
    # sin caché, llama siempre
    marcas_con_cache(transcriptor, fuente, tmp_path / "w4.mp3", None, "clave1")
    assert len(llamadas) == 3


def test_master_json_a_medias_no_explota_y_se_escribe_atomico(tmp_path):
    from voz.masterizar import leer_master

    master = tmp_path / "master.json"
    master.write_text('{"libro": {"x": 1}, "capitulos": [', encoding="utf-8")  # quedó a medias
    assert leer_master(master) is None
    entrada = {"capitulo": 1, "salida": "cap_01.wav", "loudnorm": {"despues": {"lufs": -19.0, "tp_dbtp": -2.0, "lra": 5.0}, "modo": "linear"}, "piezas": [], "avisos": []}
    datos = agregar_a_master(master, entrada, libro={"narracion": "n"})
    assert datos["libro"] == {"narracion": "n"} and [c["capitulo"] for c in datos["capitulos"]] == [1]
    assert not master.with_suffix(".json.tmp").exists()  # el tmp se renombró
    assert json.loads(master.read_text(encoding="utf-8")) == datos
