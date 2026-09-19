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


# --- post-proceso por frase (central, 19/09) ---

from motores.comun import (  # noqa: E402
    COLCHON_MS,
    FADE_OUT_MS,
    emparejar_volumen,
    fundir_bordes,
    limpiar_frase,
    narrar_frase_a_frase,
    recortar_cola,
)

SR = 24000


def _voz(segundos: float, amplitud: float = 0.3) -> np.ndarray:
    t = np.arange(int(SR * segundos)) / SR
    return (amplitud * np.sin(2 * np.pi * 220 * t)).astype(np.float32)


def test_recortar_cola_saca_el_ruido_del_final_y_deja_un_colchon():
    voz = _voz(1.0)
    cola_sucia = (0.003 * np.random.default_rng(0).standard_normal(SR)).astype(np.float32)  # 1 s a ~-50 dB
    clip = np.concatenate([voz, cola_sucia])
    limpio = recortar_cola(clip, SR)
    assert len(limpio) < len(clip)
    assert abs(len(limpio) - (len(voz) + SR * COLCHON_MS / 1000)) <= SR * 0.02  # voz + colchón, ± una ventana


def test_recortar_cola_no_toca_una_frase_que_ya_termina_bien():
    voz = _voz(1.0)
    assert len(recortar_cola(voz, SR)) == len(voz)


def test_fundir_bordes_arranca_y_termina_en_cero():
    clip = np.ones(SR, dtype=np.float32)
    f = fundir_bordes(clip, SR)
    assert f[0] == 0.0 and f[-1] == 0.0
    assert f[SR // 2] == 1.0  # el medio no se toca
    assert f[-int(SR * FADE_OUT_MS / 1000) - 1] == 1.0  # justo antes del fade sigue entero


def test_una_frase_sin_voz_no_se_amplifica_a_volumen_de_voz():
    # Revisión 19/09: si el motor deja una frase en (casi) silencio (una frase
    # de solo puntuación, respiración), recortar_cola no encontraba voz,
    # devolvía el clip entero y emparejar_volumen lo subía a -20 dB RMS: un
    # soplido audible entre dos frases normales. Sin voz, la frase queda vacía.
    rng = np.random.default_rng(0)
    ruido = (0.003 * rng.standard_normal(24000)).astype(np.float32)  # ~-50 dB
    assert len(recortar_cola(ruido, 24000)) == 0
    assert len(limpiar_frase(ruido, 24000)) == 0
    assert len(limpiar_frase(np.zeros(24000, dtype=np.float32), 24000)) == 0


def test_emparejar_volumen_deja_todas_las_frases_al_mismo_rms():
    fuerte, floja = _voz(1.0, 0.5), _voz(1.0, 0.05)
    a, b = emparejar_volumen(fuerte), emparejar_volumen(floja)
    rms = lambda x: float(np.sqrt(np.mean(x**2)))  # noqa: E731
    assert abs(rms(a) - rms(b)) < 0.005
    assert float(np.max(np.abs(a))) <= 0.98
    assert len(emparejar_volumen(np.zeros(100, dtype=np.float32))) == 100  # silencio: no explota


def test_narrar_frase_a_frase_limpia_cada_frase_antes_de_pegar():
    sucia = np.concatenate([_voz(0.5, 0.5), (0.003 * np.ones(SR, dtype=np.float32))])  # voz + cola
    floja = _voz(0.5, 0.02)
    salida = narrar_frase_a_frase(["uno", "dos"], lambda frase: (sucia if frase == "uno" else floja, SR), log=lambda *a, **k: None)
    # la cola de 1 s desapareció: largo ≈ 0,5 + colchón + pausa 0,35 + 0,5 + colchón
    assert len(salida) < len(sucia) + int(SR * 0.35) + len(floja)
    assert len(salida) > int(SR * (0.5 + 0.35 + 0.5))
    # y las dos frases quedaron al mismo volumen aunque entraron con 28 dB de diferencia
    mitad = len(salida) // 2
    rms = lambda x: float(np.sqrt(np.mean(x**2)))  # noqa: E731
    assert abs(rms(salida[: int(SR * 0.4)]) - rms(salida[-int(SR * 0.4) :])) < 0.03


def test_limpiar_frase_es_idempotente_en_lo_que_importa():
    clip = limpiar_frase(_voz(1.0), SR)
    otra = limpiar_frase(clip, SR)
    assert abs(len(clip) - len(otra)) <= SR * 0.1
