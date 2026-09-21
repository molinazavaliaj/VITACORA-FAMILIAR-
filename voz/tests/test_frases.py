from voz.frases import normalizar_palabra, recorte_con_aire, ubicar_frase


def oidas(*pares):
    """Lo que devuelve transcribir.palabras_con_tiempos, armado a mano."""
    return [{"palabra": p, "inicio": a, "fin": b} for p, a, b in pares]


def test_normaliza_igual_que_la_fabrica():
    assert normalizar_palabra("¡Joaquín!") == "joaquin"
    assert normalizar_palabra("«causalidades…»") == "causalidades"
    assert normalizar_palabra("Rosario,") == "rosario"


def test_encuentra_la_frase_en_el_medio():
    palabras = oidas(
        ("Bueno", 0.0, 0.4),
        ("yo", 0.5, 0.7),
        ("creo", 0.75, 1.0),
        ("en", 1.05, 1.2),
        ("las", 1.25, 1.45),
        ("causalidades", 1.5, 2.2),
    )
    assert ubicar_frase("Yo creo en las causalidades.", palabras) == (0.5, 2.2)


def test_una_palabra_escrita_distinto_no_rompe_la_frase():
    # «para» que el ASR oyó «pa'»: el libro la da por textual, acá falta una de once.
    palabras = oidas(
        ("Joaquín", 0.0, 0.5),
        ("esto", 0.55, 0.8),
        ("lo", 0.85, 1.0),
        ("hago", 1.05, 1.4),
        ("pa", 1.45, 1.7),
        ("que", 1.75, 2.0),
        ("nunca", 2.05, 2.5),
        ("te", 2.55, 2.7),
        ("mueras", 2.75, 3.2),
        ("de", 3.25, 3.4),
        ("hambre", 3.45, 3.9),
    )
    assert ubicar_frase("Joaquín, esto lo hago para que nunca te mueras de hambre.", palabras) == (0.0, 3.9)


def test_se_banca_una_muletilla_en_el_medio():
    palabras = oidas(
        ("Yo", 0.0, 0.2),
        ("sabía", 0.25, 0.6),
        ("eh", 0.65, 0.8),
        ("que", 0.85, 1.0),
        ("había", 1.05, 1.3),
        ("que", 1.35, 1.5),
        ("apoyarlo", 1.55, 2.1),
    )
    assert ubicar_frase("Yo sabía que había que apoyarlo.", palabras) == (0.0, 2.1)


def test_cuando_la_frase_aparece_dos_veces_se_queda_con_la_mas_ajustada():
    # Primera aparición con muletillas en el medio (recorte más largo), segunda al hilo.
    palabras = oidas(
        ("Salí", 0.0, 0.4),
        ("a", 0.45, 0.5),
        ("bueno", 0.6, 1.0),
        ("eh", 1.1, 1.3),
        ("buscar", 2.0, 2.4),
        ("lo", 2.45, 2.5),
        ("tuyo", 2.55, 3.0),
        ("Salí", 5.0, 5.4),
        ("a", 5.45, 5.5),
        ("buscar", 5.55, 5.9),
        ("lo", 5.95, 6.0),
        ("tuyo", 6.05, 6.4),
    )
    assert ubicar_frase("Salí a buscar lo tuyo.", palabras) == (5.0, 6.4)


def test_si_no_esta_no_adivina():
    # Parafraseada: comparte «nací» y «Rosario» con lo que dijo, pero no es la frase.
    palabras = oidas(("Nací", 0.0, 0.5), ("en", 0.6, 0.8), ("Rosario", 0.85, 1.5))
    assert ubicar_frase("Rosario, la ciudad donde nací.", palabras) is None
    assert ubicar_frase("El mejor ring que tuve en mi vida fue esa casa.", palabras) is None
    assert ubicar_frase("", palabras) is None
    assert ubicar_frase("Salí a buscar lo tuyo.", []) is None


def test_recorte_con_aire_a_los_dos_lados():
    assert recorte_con_aire(2.0, 3.0) == (1.8, 3.35)


def test_recorte_con_aire_no_se_sale_del_archivo():
    assert recorte_con_aire(0.05, 3.0, duracion=3.2) == (0.0, 3.2)
    # Un recorte al revés (o de duración cero) igual dura algo.
    assert recorte_con_aire(4.0, 4.0, duracion=4.5) == (3.8, 4.35)
