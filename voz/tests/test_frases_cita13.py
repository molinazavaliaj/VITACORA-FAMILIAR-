"""El caso real que falló: la cita-13 del narrador 3691baf4.

La frase está verbatim en la transcripción guardada de la respuesta, así que el
audio es el bueno y la frase es la que él dijo: lo que falló fue ubicarla. Al
volver a escuchar el audio, Whisper se comió el segundo «en» de «…gastarlo en
ella **y en** lo que me hacía feliz…»; el tanteo en línea se corría un lugar a
partir de ahí y devolvía None, así que la frase quedaba `fallida` con el motivo
«no se encontró» aunque estaba entera en la base.

El fixture `cita13_3691baf4.json` son las 544 palabras que devolvió Whisper sobre
el audio real de esa respuesta (`dia_14.ogg`, 226 s), con sus `inicio`/`fin`, tal
como las da `transcribir.palabras_con_tiempos`. El tramo esperado es el que marcó
Whisper: de 177,42 («Todo») a 186,30 («sonrisa»), o sea las 24 palabras de la
frase menos el «en» que no quedó en ningún lado.

Además del caso real, acá quedan clavadas las dos tolerancias de las que depende
el arreglo —que una palabra que el ASR escribió distinto gaste un lugar y que una
que se comió no lo gaste— y el límite del otro lado: lo que no se empalma cuando
a la frase le falta el medio.
"""

import json
from pathlib import Path

from voz.frases import normalizar_palabra, palabras_de, recorte_con_aire, ubicar_frase

CASO = json.loads((Path(__file__).parent / "cita13_3691baf4.json").read_text(encoding="utf-8"))


def oidas(*pares):
    """Lo que devuelve transcribir.palabras_con_tiempos, armado a mano."""
    return [{"palabra": p, "inicio": a, "fin": b} for p, a, b in pares]


# El caso en chiquito: el mismo patrón (el ASR se come «que» y todo lo que sigue
# queda un lugar adelantado), sin depender de Whisper ni del audio.
MINI = oidas(
    ("El", 0.0, 0.2),
    ("perro", 0.25, 0.6),
    ("corría", 0.65, 1.0),
    ("por", 1.05, 1.2),
    ("la", 1.25, 1.4),
    ("playa", 1.45, 1.8),
    ("cuando", 1.85, 2.1),
    ("era", 2.15, 2.4),
    ("chico", 2.45, 2.9),
)

# Relleno que no dice nada de la frase: lo que se escucha entre palabra y palabra.
RELLENO = ("bueno", "después", "fui", "otro", "pueblo", "casa")


def test_cita_13_la_encuentra_donde_esta():
    ubicada = ubicar_frase(CASO["frase"], CASO["palabras"])
    assert ubicada is not None, (
        "la frase está verbatim en la transcripción de esta misma respuesta: "
        "si no se ubica, se pierde (así quedó «fallida»)"
    )
    assert abs(ubicada[0] - CASO["esperado"]["inicio"]) < 0.01
    assert abs(ubicada[1] - CASO["esperado"]["fin"]) < 0.01


def test_cita_13_el_tramo_es_lo_que_dijo():
    """Arranca en «Todo» y termina en «sonrisa»: no le falta el final."""
    inicio, fin = ubicar_frase(CASO["frase"], CASO["palabras"])
    tramo = [normalizar_palabra(p["palabra"]) for p in CASO["palabras"] if p["inicio"] >= inicio and p["fin"] <= fin]
    assert len(tramo) == CASO["esperado"]["palabras"]
    assert tramo[0] == "todo"
    assert tramo[-1] == "sonrisa"


def test_cita_13_el_fixture_tiene_el_hueco_que_lo_hacia_fallar():
    """Lo único que falta adentro del tramo es el «en» de «y en lo que».

    Ese hueco es todo el caso: el narrador dijo la frase entera (está verbatim en
    la transcripción), pero en lo que volvió a escuchar Whisper esa palabra no
    está, y con el tanteo en línea eso corría la alineación un lugar y la frase no
    se encontraba.
    """
    inicio, fin = ubicar_frase(CASO["frase"], CASO["palabras"])
    tramo = [normalizar_palabra(p["palabra"]) for p in CASO["palabras"] if p["inicio"] >= inicio and p["fin"] <= fin]
    buscadas = palabras_de(CASO["frase"])
    assert buscadas[13] == "en" and buscadas[12] == "y" and buscadas[14] == "lo"  # «…y en lo…»
    del buscadas[13]
    assert buscadas == tramo


def test_el_asr_que_se_come_una_palabra_no_corre_la_alineacion():
    """«El perro que corría…» sin el «que»: tiene que encontrar la frase igual.

    Es la cita-13 en chiquito. Con el tanteo en línea, el «que» que falta gasta un
    lugar de lo oído, la alineación queda un lugar adelantada y solo acierta
    «El perro» (2 de 10): la frase se perdía.
    """
    assert ubicar_frase("El perro que corría por la playa cuando era chico.", MINI) == (0.0, 2.9)


def test_sin_las_palabras_no_esta_no_se_adivina():
    """Sigue siendo verdad que antes que un recorte que dice otra cosa, sin audio.

    Nada de esto se parece a lo que se dijo ahí: ninguna palabra, o las mismas
    palabras en otro orden. La única respuesta buena es None.
    """
    assert ubicar_frase("Una casa de piedra en el campo.", MINI) is None
    assert ubicar_frase("Chico por playa el corría cuando era la perro.", MINI) is None
    assert ubicar_frase("El campo estaba lleno de girasoles amarillos.", CASO["palabras"]) is None
    assert ubicar_frase("Salí a buscar lo tuyo y no estaba en ningún lado.", CASO["palabras"]) is None


def test_la_palabra_que_el_asr_escribio_distinto_gasta_un_lugar():
    """Una palabra de la frase que el ASR escribió distinto ocupa un lugar de lo oído.

    El «sabía» que Whisper no entendió queda como un ruido más, así que la frase
    se corre un lugar: sin eso, el «que» que sigue (cinco lugares después) queda
    fuera de alcance y la frase se pierde.
    """
    palabras = oidas(
        ("Yo", 0.0, 0.3),
        ("mh", 0.35, 0.6),
        ("eh", 0.65, 0.8),
        ("bueno", 0.85, 1.2),
        ("viste", 1.25, 1.5),
        ("mirá", 1.55, 1.8),
        ("que", 1.85, 2.0),
        ("había", 2.05, 2.4),
        ("que", 2.45, 2.6),
        ("apoyarlo", 2.65, 3.2),
    )
    assert ubicar_frase("Yo sabía que había que apoyarlo.", palabras) == (0.0, 3.2)


def test_no_empalma_una_frase_con_palabras_a_lo_largo_de_la_respuesta():
    """Están todas las palabras, en orden, pero repartidas: eso no es la frase.

    Cada palabra de la frase está separada de la siguiente por seis de relleno
    —más que `HUECO_MAXIMO`—, así que no hay tramo que las contenga: el narrador
    no dijo esta frase acá. Empalmarlas daría un recorte de 18 segundos que dice
    cualquier cosa, así que la respuesta buena es None (la frase queda sin audio).
    """
    guion = ["El", *RELLENO, "perro", *RELLENO, "corría", *RELLENO, "por", *RELLENO, "la", *RELLENO, "playa"]
    palabras = [{"palabra": p, "inicio": 0.5 * i, "fin": 0.5 * i + 0.4} for i, p in enumerate(guion)]
    assert ubicar_frase("El perro corría por la playa.", palabras) is None


def test_cita_13_el_recorte_con_aire_no_se_sale_del_audio():
    inicio, fin = ubicar_frase(CASO["frase"], CASO["palabras"])
    desde, hasta = recorte_con_aire(inicio, fin, CASO["duracion_segundos"])
    assert 0.0 <= desde < inicio and fin < hasta <= CASO["duracion_segundos"]
