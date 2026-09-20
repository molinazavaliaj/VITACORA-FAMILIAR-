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


# --- el anuncio del capítulo con la voz clonada (CONTRATO, central 19/09) ---

from voz.libro import anuncio_de, numero_en_palabras, texto_a_narrar  # noqa: E402
from voz.texto import partir_en_frases  # noqa: E402


def test_numero_en_palabras_cubre_los_capitulos_posibles():
    assert [numero_en_palabras(n) for n in (1, 2, 8, 10, 16, 21, 30, 31, 45, 99)] == [
        "uno", "dos", "ocho", "diez", "dieciséis", "veintiuno", "treinta", "treinta y uno", "cuarenta y cinco", "noventa y nueve",
    ]
    assert numero_en_palabras(100) == "100"  # fuera de rango: tal cual, no explota


def test_anuncio_es_numero_en_palabras_punto_nombre_punto():
    assert anuncio_de(Capitulo(2, "Las raíces", "x")) == "Capítulo dos. Las raíces."
    assert anuncio_de(Capitulo(1, " La infancia ", "x")) == "Capítulo uno. La infancia."
    assert anuncio_de(Capitulo(3, "¿Y después?", "x")) == "Capítulo tres. ¿Y después?"  # no duplica el signo


def test_texto_a_narrar_pone_el_anuncio_como_parrafo_aparte_y_el_partidor_lo_deja_solo():
    cap = Capitulo(2, "Las raíces", "Bueno, si hablo de mis raíces tengo que arrancar por mis abuelos.\n\nMi abuela Babu.")
    t = texto_a_narrar(cap)
    # después del anuncio va el separador de historia: la pausa larga de voz/pausas.py
    assert t.startswith("Capítulo dos. Las raíces.\n\n* * *\n\nBueno, si hablo")
    assert t.endswith("Mi abuela Babu.\n")
    # el motor lo lee como frases propias, con la pausa del pegado entre medio y antes del texto
    assert partir_en_frases(t)[:2] == ["Capítulo dos.", "Las raíces."]
    # y con los cierres: el anuncio cierra en "historia" (1,2 s), el separador no es un tramo
    from voz.texto import partir_en_tramos

    tramos = partir_en_tramos(t)
    assert [(x.texto, x.cierre) for x in tramos[:3]] == [
        ("Capítulo dos.", "punto"),
        ("Las raíces.", "historia"),
        ("Bueno, si hablo de mis raíces tengo que arrancar por mis abuelos.", "parrafo"),
    ]
