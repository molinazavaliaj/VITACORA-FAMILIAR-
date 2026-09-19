import numpy as np
import pytest

from motores.comun import (
    a_mono_float,
    igualar_pausas_internas,
    narrar_tramos,
    pausas_internas,
    pegar_frases,
    pegar_tramos,
    remuestrear,
)
from voz.pausas import PAUSAS_MS_DEFAULT
from voz.texto import Tramo


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


# --- pausas por puntuacion (central 19/09, punto 6) ---


def test_pegar_tramos_pone_la_pausa_del_signo_que_cerro_cada_tramo():
    clip = _voz(0.5)
    pegado = pegar_tramos([clip, clip, clip, clip], ["coma", "punto", "historia", "punto"], PAUSAS_MS_DEFAULT, SR)
    esperado = 4 * len(clip) + int(SR * (0.250 + 0.500 + 1.200))  # el ultimo cierre no suma
    assert len(pegado) == esperado
    # un cierre desconocido cae en "ninguno"
    pegado = pegar_tramos([clip, clip], ["raro", "punto"], PAUSAS_MS_DEFAULT, SR)
    assert len(pegado) == 2 * len(clip) + int(SR * 0.350)


def test_pegar_tramos_exige_un_cierre_por_clip():
    with pytest.raises(ValueError):
        pegar_tramos([_voz(0.2)], [], PAUSAS_MS_DEFAULT, SR)


def _oracion_con_pausa(pausa_s: float) -> np.ndarray:
    """Voz, un silencio que dejo el motor (una coma), voz."""
    return np.concatenate([_voz(0.6), np.zeros(int(SR * pausa_s), dtype=np.float32), _voz(0.6)])


def test_pausas_internas_encuentra_lo_que_dejo_el_motor_y_no_los_bordes():
    encontradas = pausas_internas(_oracion_con_pausa(0.4), SR)
    assert len(encontradas) == 1
    ini, fin = encontradas[0]
    assert abs((fin - ini) / SR - 0.4) < 0.05
    assert pausas_internas(_voz(1.0), SR) == []  # sin pausas
    assert pausas_internas(_oracion_con_pausa(0.05), SR) == []  # muy corta: no cuenta


def test_igualar_pausas_internas_deja_cada_pausa_exactamente_en_el_objetivo():
    for pausa_del_motor in (0.12, 0.4, 0.9):
        igualado = igualar_pausas_internas(_oracion_con_pausa(pausa_del_motor), 250, SR)
        # dos trozos de voz de 0,6 s + la pausa de 250 ms, sin importar cuanto pauso el motor
        assert abs(len(igualado) / SR - (1.2 + 0.25)) < 0.06, pausa_del_motor
        assert len(pausas_internas(igualado, SR)) == 1
    assert len(igualar_pausas_internas(_voz(1.0), 250, SR)) == len(_voz(1.0))  # sin pausas: igual


def test_narrar_tramos_modo_oracion_iguala_comas_y_modo_coma_no_toca_adentro():
    tramos = [Tramo("Hola, que tal.", "punto"), Tramo("Chau.", "punto")]

    def motor(frase):
        return (_oracion_con_pausa(0.9) if "," in frase else _voz(0.5)), SR

    def callado(*a, **k):
        pass

    por_oracion = narrar_tramos(tramos, motor, PAUSAS_MS_DEFAULT, "oracion", log=callado)
    por_coma = narrar_tramos(tramos, motor, PAUSAS_MS_DEFAULT, "coma", log=callado)
    # en modo oracion la pausa de 0,9 s que hizo el motor bajo a 0,25: el total es mas corto
    assert len(por_coma) - len(por_oracion) > int(SR * 0.5)
    # la pausa entre los dos tramos es la de "punto" (500 ms), no la de siempre (350)
    esperado = len(_oracion_con_pausa(0.9)) + int(SR * 0.5) + len(_voz(0.5))
    assert abs(len(por_coma) - esperado) < SR * 0.25
