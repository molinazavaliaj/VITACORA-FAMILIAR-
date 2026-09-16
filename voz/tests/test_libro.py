import json

import pytest

from voz.libro import Capitulo, capitulos_de_narracion, ruta_capitulo

NARRACION_VALIDA = {
    "narrador_id": "n1",
    "pedido_id": "p1",
    "titulo": "Mi vida",
    "capitulos": [
        {"numero": 1, "nombre": "La infancia", "texto": "Nací en Rosario.\n\nMi padre era ferroviario."},
        {"numero": 2, "nombre": "La juventud", "texto": "Me fui a Buenos Aires."},
    ],
}


def test_parsea_el_contrato_y_devuelve_capitulos_en_orden():
    capitulos = capitulos_de_narracion(json.dumps(NARRACION_VALIDA))

    assert capitulos == [
        Capitulo(numero=1, nombre="La infancia", texto="Nací en Rosario.\n\nMi padre era ferroviario."),
        Capitulo(numero=2, nombre="La juventud", texto="Me fui a Buenos Aires."),
    ]


def test_rechaza_capitulo_sin_texto():
    datos = json.loads(json.dumps(NARRACION_VALIDA))
    datos["capitulos"][1]["texto"] = "   "

    with pytest.raises(ValueError, match="capítulo 2"):
        capitulos_de_narracion(json.dumps(datos))


def test_rechaza_capitulo_sin_nombre():
    datos = json.loads(json.dumps(NARRACION_VALIDA))
    datos["capitulos"][0]["nombre"] = ""

    with pytest.raises(ValueError, match="capítulo 1"):
        capitulos_de_narracion(json.dumps(datos))


def test_rechaza_numeracion_con_huecos():
    datos = json.loads(json.dumps(NARRACION_VALIDA))
    datos["capitulos"][1]["numero"] = 3  # salto de 1 a 3

    with pytest.raises(ValueError, match="numeración"):
        capitulos_de_narracion(json.dumps(datos))


def test_rechaza_numeracion_fuera_de_orden():
    datos = json.loads(json.dumps(NARRACION_VALIDA))
    datos["capitulos"] = list(reversed(datos["capitulos"]))  # 2 antes que 1

    with pytest.raises(ValueError, match="numeración"):
        capitulos_de_narracion(json.dumps(datos))


def test_lista_vacia_de_capitulos_no_es_error():
    datos = {**NARRACION_VALIDA, "capitulos": []}
    assert capitulos_de_narracion(json.dumps(datos)) == []


def test_ruta_capitulo_usa_narrador_y_numero_con_dos_digitos():
    assert ruta_capitulo("n1", 1) == "n1/voz/cap_01.mp3"
    assert ruta_capitulo("n1", 12) == "n1/voz/cap_12.mp3"
