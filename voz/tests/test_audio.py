import shutil
import subprocess

import pytest

from voz.audio import a_mp3, a_wav_limpio, duracion, pausas_de, pegar_con_pausas, recortar, recortar_en_pausa

pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="hace falta ffmpeg")


def tono(ruta, segundos, silencio_bordes=0.0, sr=44100):
    """Un tono de 440 Hz, opcionalmente con silencio antes y después."""
    filtro = f"sine=frequency=440:duration={segundos}"
    if silencio_bordes:
        filtro += f",adelay={int(silencio_bordes * 1000)}|{int(silencio_bordes * 1000)},apad=pad_dur={silencio_bordes}"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", filtro, "-ar", str(sr), "-ac", "2", str(ruta)],
        check=True,
    )
    return ruta


def test_a_wav_limpio_deja_mono_24k_y_saca_los_silencios(tmp_path):
    crudo = tono(tmp_path / "crudo.wav", 3, silencio_bordes=1.0)
    assert 4.8 < duracion(crudo) < 5.2
    limpio = a_wav_limpio(crudo, tmp_path / "limpio.wav")
    assert 2.6 < duracion(limpio) < 3.6  # quedan ~0,2 s de margen a cada lado, a propósito
    info = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=channels,sample_rate", "-of", "csv=p=0", str(limpio)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    assert info == "24000,1"


def test_pegar_con_pausas_suma_las_pausas(tmp_path):
    a = tono(tmp_path / "a.wav", 1)
    b = tono(tmp_path / "b.wav", 1)
    pegado = pegar_con_pausas([a, b], tmp_path / "pegado.wav", pausa_ms=500)
    assert 2.4 < duracion(pegado) < 2.6


def test_recortar_y_mp3(tmp_path):
    largo = tono(tmp_path / "largo.wav", 4)
    corto = recortar(largo, tmp_path / "corto.wav", 1.5)
    assert 1.4 < duracion(corto) < 1.6
    mp3 = a_mp3(corto, tmp_path / "corto.mp3")
    assert mp3.stat().st_size > 1000


def test_a_wav_limpio_conserva_las_pausas_internas(tmp_path):
    """Una respuesta de WhatsApp tiene pausas: solo se recortan los bordes."""
    a = tono(tmp_path / "a.wav", 2)
    b = tono(tmp_path / "b.wav", 2)
    con_pausa = pegar_con_pausas([a, b], tmp_path / "con_pausa.wav", pausa_ms=1500)  # 2 + 1.5 + 2
    assert 5.3 < duracion(con_pausa) < 5.7
    limpio = a_wav_limpio(con_pausa, tmp_path / "limpio.wav")
    assert 5.0 < duracion(limpio) < 5.8  # la pausa del medio sigue ahí


def test_recortar_en_pausa_corta_en_la_ultima_pausa_antes_del_maximo(tmp_path):
    a = tono(tmp_path / "a.wav", 2)
    b = tono(tmp_path / "b.wav", 2)
    c = tono(tmp_path / "c.wav", 2)
    con_pausas = pegar_con_pausas([a, b, c], tmp_path / "p.wav", pausa_ms=800)  # pausas en ~2.0-2.8 y ~4.8-5.6
    pausas = pausas_de(con_pausas)
    assert len(pausas) == 2 and 1.9 < pausas[0][0] < 2.2 and 4.7 < pausas[1][0] < 5.0
    corto = recortar_en_pausa(con_pausas, tmp_path / "corto.wav", maximo=4.5, minimo=1.0)
    assert 1.9 < duracion(corto) < 2.5  # la última pausa que empieza antes de 4,5 s es la primera (~2,0 s)


def test_recortar_en_pausa_sin_pausas_corta_al_maximo(tmp_path):
    a = tono(tmp_path / "a.wav", 4)
    corto = recortar_en_pausa(a, tmp_path / "corto.wav", maximo=2.5, minimo=1.0)
    assert 2.4 < duracion(corto) < 2.6
