"""Las pausas viven en un solo lugar y Naza las pisa desde .env sin tocar código."""

from voz.pausas import CIERRES, MODOS_TRAMOS, PAUSAS_MS_DEFAULT, SEPARADOR_HISTORIA, modo_tramos, pausas_ms


def test_los_valores_pedidos_por_la_central():
    assert PAUSAS_MS_DEFAULT["coma"] == 250
    assert PAUSAS_MS_DEFAULT["punto"] == 500
    assert PAUSAS_MS_DEFAULT["suspensivos"] == 700
    assert PAUSAS_MS_DEFAULT["parrafo"] == 1000
    assert PAUSAS_MS_DEFAULT["historia"] == 1200
    assert set(CIERRES) == {"coma", "punto", "suspensivos", "parrafo", "historia", "ninguno"}
    assert SEPARADOR_HISTORIA == "* * *"


def test_env_pisa_solo_lo_que_nombra_y_lo_que_es_valido():
    v = pausas_ms({"PAUSAS_MS": "coma=300, punto=600 ,historia=abc,inventada=5"})
    assert v["coma"] == 300 and v["punto"] == 600
    assert v["historia"] == 1200  # "abc" no es un número: queda la de siempre
    assert "inventada" not in v
    assert pausas_ms({}) == PAUSAS_MS_DEFAULT
    assert pausas_ms({"PAUSAS_MS": ""}) == PAUSAS_MS_DEFAULT


def test_modo_de_tramos_por_env_con_default_seguro():
    assert modo_tramos({}) == "oracion"
    assert modo_tramos({"TRAMOS": "coma"}) == "coma"
    assert modo_tramos({"TRAMOS": " Coma "}) == "coma"
    assert modo_tramos({"TRAMOS": "cualquiera"}) == "oracion"
    assert set(MODOS_TRAMOS) == {"oracion", "coma"}
