"""El ritmo de un original (directiva 02 B), sin red: texto y marcas por palabra
como las devuelve Whisper, y el plan que sale de ahí."""

import numpy as np

from voz.ritmo import (
    ARRANQUES_A_CORTAR,
    CORTE_ARRANQUE_MAX_S,
    SILENCIO_MAX_S,
    SILENCIO_OBJETIVO_S,
    Plan,
    aplicar_plan,
    corte_de_arranque,
    plan_de_ritmo,
    resumen,
    silencios_largos,
)


def marcas(*pares):
    """('palabra', inicio, fin), … → lo que devuelve palabras_con_tiempos."""
    return [{"palabra": p, "inicio": i, "fin": f} for p, i, f in pares]


def test_arranque_hasta_la_primera_coma():
    palabras = marcas(("Bueno", 1.76, 2.30), ("mi", 2.46, 2.54), ("abuela", 2.54, 2.84))
    corte, que = corte_de_arranque("Bueno, mi abuela Babu es la única.", palabras)
    assert corte == 2.30 and que == "Bueno"


def test_arranque_encadenado_sigue_mientras_sean_muletillas_y_quepa():
    # "Sí, exacto, claramente…" → corta "Sí, exacto," (1,1 s desde la primera palabra) y para en "claramente"
    palabras = marcas(("Sí", 3.78, 4.34), ("exacto", 4.34, 4.90), ("claramente", 5.36, 5.78), ("ahí", 5.78, 6.22))
    corte, que = corte_de_arranque("Sí, exacto, claramente ahí podrás entender.", palabras)
    assert corte == 4.90 and que == "Sí exacto"


def test_el_limite_se_mide_desde_la_primera_palabra_no_desde_el_cero():
    # 3,8 s de silencio antes de "Sí": no cuentan para el límite de 2,5 s
    palabras = marcas(("Sí", 3.78, 4.34), ("claramente", 4.5, 5.0))
    assert corte_de_arranque("Sí, claramente.", palabras)[0] == 4.34
    # pero si el arranque en sí dura más de 2,5 s, no se corta
    palabras = marcas(("No", 0.0, 0.5), ("no", 0.6, 0.9), ("recuerdo", 1.0, 1.5), ("nada", 1.6, 2.9))
    assert corte_de_arranque("No, no recuerdo nada. Lo que sé…", palabras)[0] == 0.5  # solo "No,"
    palabras = marcas(("No", 0.0, 0.5), ("no", 0.6, 0.9), ("recuerdo", 1.0, 1.5), ("nada", 1.6, 2.4))
    assert corte_de_arranque("No, no recuerdo nada. Lo que sé…", palabras)[0] == 2.4  # entra: hasta el punto


def test_sin_muletilla_o_sin_puntuacion_no_se_corta():
    assert corte_de_arranque("Mi abuela vive en Córdoba.", marcas(("Mi", 0, 0.2), ("abuela", 0.2, 0.6)))[0] == 0.0
    assert corte_de_arranque("Bueno mi abuela", marcas(("Bueno", 0, 0.4), ("mi", 0.5, 0.6)))[0] == 0.0
    assert corte_de_arranque("", [])[0] == 0.0
    assert "bueno" in ARRANQUES_A_CORTAR and "sí" in ARRANQUES_A_CORTAR and CORTE_ARRANQUE_MAX_S == 2.5


def test_silencios_largos_se_acortan_al_objetivo_dejando_la_mitad_a_cada_lado():
    palabras = marcas(("uno", 0.0, 0.5), ("dos", 0.9, 1.2), ("tres", 4.2, 4.5), ("cuatro", 4.8, 5.0))
    assert silencios_largos(palabras) == [(1.55, 3.85)]  # el hueco de 3 s entre "dos" y "tres" queda en 0,7
    assert SILENCIO_MAX_S == 1.5 and SILENCIO_OBJETIVO_S == 0.7
    assert silencios_largos(marcas(("a", 0, 1), ("b", 2.4, 3))) == []  # 1,4 s: no llega


def test_plan_no_acorta_silencios_que_quedaron_dentro_del_arranque_cortado():
    palabras = marcas(("Bueno", 0.0, 0.4), ("eh", 2.5, 2.7), ("mi", 2.9, 3.0), ("abuela", 6.0, 6.5))
    plan = plan_de_ritmo("Bueno, eh, mi abuela.", palabras)
    # "Bueno, eh," duraría 2,7 s desde la primera palabra: supera el límite → solo "Bueno,"
    assert plan.corte_arranque_s == 0.4 and plan.arranque == "Bueno"
    # y los silencios largos que quedan después del corte se acortan igual
    assert plan.silencios == [(0.75, 2.15), (3.35, 5.65)]


def test_plan_real_de_joaquin_dia_06():
    palabras = marcas(("Sí", 3.78, 4.34), ("exacto", 4.34, 4.90), ("claramente", 5.36, 5.78), ("ahí", 5.78, 6.22), ("podrás", 6.22, 6.54), ("fin", 9.0, 9.3))
    plan = plan_de_ritmo("Sí, exacto, claramente ahí podrás entender. Fin.", palabras)
    assert plan.arranque == "Sí exacto" and plan.corte_arranque_s == 4.90
    assert plan.silencios == [(6.89, 8.65)]


def test_aplicar_plan_corta_lo_planeado_con_fundidos_y_nunca_voz():
    sr = 1000
    audio = np.ones(10 * sr, dtype=np.float32)  # 10 s de "voz" constante
    plan = Plan(corte_arranque_s=2.0, silencios=[(5.0, 6.0), (8.0, 8.5)], arranque="x")
    salida = aplicar_plan(audio, sr, plan)
    assert len(salida) == (10 - 2.0 - 1.0 - 0.5) * sr
    assert salida[0] == 0.0 and salida[20] > 0.9  # fade in de 12 ms al arranque
    assert salida[-1] == 1.0  # el final no se toca
    assert np.all(salida[100:2900] == 1.0)  # el medio de la primera parte intacto
    assert len(aplicar_plan(audio, sr, Plan())) == len(audio)  # sin plan, igual


def test_resumen_para_master_json():
    plan = Plan(corte_arranque_s=1.8, silencios=[(1.0, 2.0), (3.0, 3.5)], arranque="No")
    r = resumen(plan, 80.0, 76.7)
    assert r == {
        "arranque_cortado_s": 1.8,
        "arranque": "No",
        "silencios_acortados": 2,
        "silencio_sacado_s": 1.5,
        "duracion_antes_s": 80.0,
        "duracion_despues_s": 76.7,
    }
