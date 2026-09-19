from voz.texto import parrafos_de, partir_en_frases, texto_de_prueba


def test_corta_por_puntuacion_y_conserva_el_texto():
    frases = partir_en_frases("Nací en Rosario. Mi padre era ferroviario; mi madre cosía. ¿Qué más? Nada.")
    assert frases == ["Nací en Rosario.", "Mi padre era ferroviario;", "mi madre cosía.", "¿Qué más?", "Nada."]


def test_una_frase_larguisima_se_parte_por_comas_sin_romper_palabras():
    larga = ", ".join(["palabra"] * 60) + "."
    frases = partir_en_frases(larga, maximo=50)
    assert all(len(f) <= 50 for f in frases)
    assert all(f.startswith("palabra") for f in frases)
    assert " ".join(frases) == larga


def test_una_frase_sin_comas_se_parte_por_espacios():
    larga = " ".join(["casa"] * 30) + "."
    frases = partir_en_frases(larga, maximo=24)
    assert all(len(f) <= 24 for f in frases)
    assert " ".join(frases) == larga


def test_parrafos_respetan_lineas_en_blanco():
    assert parrafos_de("Uno. Dos.\n\nTres.") == [["Uno.", "Dos."], ["Tres."]]


def test_texto_de_prueba_toma_frases_de_otra_transcripcion():
    t = texto_de_prueba(
        ["Corta.", "Primera frase. Segunda frase. Tercera frase. Cuarta. Quinta. Sexta. Séptima. Octava."],
        excluir="Corta.",
        frases=3,
    )
    assert t == "Primera frase. Segunda frase. Tercera frase."


def test_texto_de_prueba_sin_transcripciones_es_vacio():
    assert texto_de_prueba([], excluir=None) == ""


# --- tramos con su cierre (pausas por puntuación, central 19/09) ---

from voz.texto import Tramo, partir_en_tramos  # noqa: E402

TEXTO = (
    "Capítulo dos. Las raíces.\n\n* * *\n\n"
    "Bueno, si hablo de mis raíces tengo que arrancar por mis abuelos.\n\n"
    "Mi abuela Babu, que se llama Dora, es la única abuela; es una genia... ¿Viste? Ella vive en Córdoba.\n\n"
    "* * *\n\nOtra historia: la del barco, la de Roberto."
)


def test_modo_oracion_un_tramo_por_oracion_con_su_cierre():
    tramos = partir_en_tramos(TEXTO, modo="oracion")
    assert [(t.texto, t.cierre) for t in tramos] == [
        ("Capítulo dos.", "punto"),
        ("Las raíces.", "historia"),  # lo que sigue es `* * *`
        ("Bueno, si hablo de mis raíces tengo que arrancar por mis abuelos.", "parrafo"),
        ("Mi abuela Babu, que se llama Dora, es la única abuela;", "coma"),  # el ; corta y pausa como coma
        ("es una genia...", "suspensivos"),
        ("¿Viste?", "punto"),
        ("Ella vive en Córdoba.", "historia"),
        ("Otra historia: la del barco, la de Roberto.", "punto"),  # el último no cierra nada
    ]


def test_modo_coma_tambien_corta_en_comas_y_dos_puntos():
    tramos = partir_en_tramos("Otra historia: la del barco, la de Roberto. Fin.", modo="coma")
    assert [(t.texto, t.cierre) for t in tramos] == [
        ("Otra historia:", "coma"),
        ("la del barco,", "coma"),
        ("la de Roberto.", "punto"),
        ("Fin.", "punto"),
    ]


def test_comillas_y_parentesis_de_cierre_no_esconden_el_signo():
    assert partir_en_tramos('Dijo "basta". Y se fue…')[0].cierre == "punto"
    assert partir_en_tramos("(Se rió.) Después…")[0].cierre == "punto"
    assert partir_en_tramos("Después… y nada.")[0].cierre == "suspensivos"
    assert partir_en_tramos("Después... y nada.")[0].cierre == "suspensivos"


def test_tramo_largo_se_parte_y_los_pedazos_internos_cierran_en_coma_o_ninguno():
    largo = "uno, " * 60 + "fin."  # 300 caracteres, una sola oración
    tramos = partir_en_tramos(largo, modo="oracion", maximo=100)
    assert len(tramos) > 1
    assert all(len(t.texto) <= 100 for t in tramos)
    assert all(t.cierre == "coma" for t in tramos[:-1])
    assert tramos[-1].cierre == "punto"
    sin_comas = "palabra " * 40 + "fin."
    tramos = partir_en_tramos(sin_comas, maximo=100)
    assert all(t.cierre == "ninguno" for t in tramos[:-1])


def test_pegar_los_tramos_devuelve_el_texto_sin_los_separadores():
    tramos = partir_en_tramos(TEXTO, modo="oracion")
    assert " ".join(t.texto for t in tramos) == " ".join(l for l in TEXTO.split("\n") if l.strip() and l.strip() != "* * *")
    assert isinstance(tramos[0], Tramo)
