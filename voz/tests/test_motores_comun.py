import numpy as np

from motores.comun import a_mono_float, pegar_frases, remuestrear


def test_pegar_frases_mete_la_pausa_entre_medio():
    a = np.ones(2400, dtype=np.float32)  # 0,1 s a 24 kHz
    b = np.ones(2400, dtype=np.float32)
    pegado = pegar_frases([a, b], tasa=24000, pausa_ms=500)
    assert len(pegado) == 2400 + 12000 + 2400
    assert pegado[2400:14400].max() == 0.0


def test_remuestrear_cambia_el_largo_y_no_el_contenido():
    tono = np.sin(np.linspace(0, 2 * np.pi * 440, 48000)).astype(np.float32)  # 1 s a 48 kHz
    a24 = remuestrear(tono, 48000, 24000)
    assert len(a24) == 24000
    assert abs(float(a24.max()) - 1.0) < 0.05


def test_a_mono_float_aplana_2d():
    assert a_mono_float(np.zeros((1, 100))).shape == (100,)
    assert a_mono_float(np.zeros((100, 2))).shape == (100,)
