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
