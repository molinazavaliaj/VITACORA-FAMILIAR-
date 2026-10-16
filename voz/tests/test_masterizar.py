"""masterizar con audio sintético: lo que usa el corte de frases de «Su voz»
(medir, nivelar, limitar y loudnorm a −19 LUFS en dos pasadas)."""

import shutil
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

from voz import masterizar as m
from voz.masterizar import leer, limitar_picos, loudnorm_dos_pasadas, medir, nivelar

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


@con_ffmpeg
def test_limitar_y_loudnorm_dejan_la_frase_a_menos_19_lufs(tmp_path):
    entrada = _escribir(tmp_path / "floja.wav", _voz(6.0, 0.03))
    limitado = limitar_picos(entrada, tmp_path / "limitado.wav")
    loud = loudnorm_dos_pasadas(limitado, tmp_path / "master.wav")
    assert abs(loud["despues"]["lufs"] - m.OBJETIVO_LUFS) <= 1.0
    assert loud["despues"]["tp_dbtp"] <= -1.0
    assert loud["antes"]["lufs"] < loud["despues"]["lufs"]  # estaba floja: subió
    assert len(leer(tmp_path / "master.wav")) > 0
