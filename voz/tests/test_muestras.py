from voz.muestras import PISO_SEGUNDOS, Respuesta, elegir_muestras, elegir_referencia


def r(id, dur, texto="hola", audio="x.ogg"):
    return Respuesta(id=id, pregunta_orden=int(id), audio_path=audio, duracion_segundos=dur, transcripcion=texto)


def test_descarta_cortas_y_sin_audio_y_ordena_por_duracion():
    sel = elegir_muestras([r("1", 19), r("2", 120), r("3", 300), r("4", 60, audio=None)])
    assert [x.id for x in sel.respuestas] == ["3", "2"]
    assert sel.segundos_totales == 420
    assert sel.alcanza_piso is False


def test_acumula_hasta_el_tope_y_marca_el_piso():
    sel = elegir_muestras([r(str(i), 200) for i in range(10)])  # 2000 s disponibles
    assert sel.segundos_totales <= 900
    assert sel.segundos_totales >= PISO_SEGUNDOS
    assert sel.alcanza_piso is True
    assert len(sel.respuestas) == 4  # 200*4 = 800; la quinta pasaría el tope


def test_referencia_es_una_respuesta_entera_entre_12_y_30_s_con_texto():
    ref = elegir_referencia([r("1", 8), r("2", 25), r("3", 29, texto=None), r("4", 45), r("5", 18)])
    assert ref is not None and ref.id == "2"


def test_referencia_none_si_no_hay_candidata():
    assert elegir_referencia([r("1", 8), r("2", 45)]) is None


# --- referencia por riqueza fonética (central, 19/09) ---

from voz.muestras import (  # noqa: E402
    ARRANQUE_CHARS,
    elegir_para_recortar,
    ranking_referencia,
    riqueza_arranque,
    riqueza_fonetica,
)

# Arranques reales de Joaquín (lo que termina en el clip de 25 s).
DIA_02 = (
    "Bueno, arrancando por mi mamá. Mi mamá fue ama de casa hasta los 17 años. Ella había estudiado "
    "publicidad, pero ejerció muy poquito y después se dedicó a criarnos a mí y a mis hermanos, que se "
    "llaman Sol e Iñaki. Mi mamá después estudió abogacía. Hace nueve años arrancó a estudiar."
)
DIA_23 = (
    "La verdad lo que me hizo volver a creer en Dios fue el hinduismo, quizás un libro. Yo me había ido "
    "por el lado de la meditación y de a poco fui entendiendo que había algo más grande que uno. Fue "
    "un proceso largo, de mucha lectura, de mucho silencio, de mucho pensar en lo que uno hace."
)


def test_riqueza_cuenta_sh_voseo_enie_y_normaliza_por_largo():
    assert riqueza_fonetica("calle") == 0.0  # muy corto: no se puede juzgar
    con_sh = riqueza_fonetica("Ella vive en la calle Yatay, ¿vos sabés dónde? Allá, cerca del arroyo.")
    sin_sh = riqueza_fonetica("Mi padre trabajaba en una oficina del centro, cerca de la estación de tren.")
    assert con_sh > sin_sh
    # el mismo texto repetido no cambia el puntaje (es por cada 100 caracteres)
    texto = "Ella vive en la calle Yatay, ¿vos sabés dónde? Allá, cerca del arroyo."
    assert abs(riqueza_fonetica(texto) - riqueza_fonetica(texto + " " + texto)) < 0.3  # el espacio de la unión mueve el "por 100 chars" un poco


def test_la_y_sola_no_cuenta_como_sh_y_el_voseo_es_lista_cerrada():
    assert riqueza_fonetica("Juan y Pedro y María y José fueron al centro con Ana y Luis.") == 0.0
    # "papás", "nomás", "después" terminan en -ás/-és pero no son voseo
    assert riqueza_fonetica("Mis papás, nomás, después de todo, se fueron al centro con Ana.") == 0.0
    assert riqueza_fonetica("Vos sabés que tenés que venir, mirá, fijate lo que te digo, dale.") > 5


def test_la_y_entre_vocales_cuenta_como_sh():
    # Revisión 19/09: "playa", "mayo", "ayer" son el "sh" rioplatense tanto
    # como "calle"; el regex las dejaba afuera.
    assert riqueza_fonetica("En la playa de mayo, ayer, con apoyo.") > 0
    assert riqueza_fonetica("Ayer vi a Ana.") == riqueza_fonetica("Calle vi a Ana.")


def test_el_arranque_es_lo_que_se_puntua():
    rico_al_final = "Mi padre trabajaba en una oficina del centro, cerca de la estación. " * 6 + "Ella y yo, ¿vos sabés? Allá."
    assert riqueza_fonetica(rico_al_final) > riqueza_arranque(rico_al_final)
    assert riqueza_arranque(rico_al_final, chars=len(rico_al_final)) == riqueza_fonetica(rico_al_final)
    assert 200 <= ARRANQUE_CHARS <= 400  # ~25 s a ~12 chars/s


def test_dia_02_le_gana_al_dia_23_como_en_el_libro_de_joaquin():
    # 19/09: con la referencia del día 23 (la más larga) el libro sonó peor que con la del día 02.
    assert riqueza_arranque(DIA_02) > riqueza_arranque(DIA_23)


def test_referencia_entera_elige_la_mas_rica_no_la_mas_larga():
    rica = r("2", 18, texto="Ella vive en la calle Yatay, ¿vos sabés dónde? Allá, cerca del arroyo, ya llegamos.")
    larga = r("3", 29, texto="Mi padre trabajaba en una oficina del centro, cerca de la estación de tren, todo el día.")
    assert elegir_referencia([r("1", 8), rica, larga, r("4", 45)]).id == "2"


def test_recorte_sale_del_arranque_mas_rico_entre_todas_las_respuestas_largas():
    todas = [
        r("23", 345, texto=DIA_23),
        r("2", 331, texto=DIA_02),
        r("24", 221, texto="hola " * 80),
        r("9", 28, texto=DIA_02),  # demasiado corta para recortar 25 s
        r("10", 200, texto=None),  # sin transcripción
    ]
    sel = elegir_muestras(todas)
    assert sel.respuestas[0].id == "23"  # para acumular minutos sigue mandando la duración...
    assert elegir_para_recortar(todas, 25).id == "2"  # ...pero la referencia sale del arranque más rico
    assert elegir_para_recortar([r("9", 28, texto=DIA_02)], 25) is None
    assert elegir_para_recortar([], 25) is None


def test_ranking_registra_puntaje_y_orden():
    filas = ranking_referencia([r("23", 345, texto=DIA_23), r("2", 331, texto=DIA_02), r("9", 50, texto=None)])
    assert [f["pregunta_orden"] for f in filas] == [2, 23]  # sin transcripción no entra
    assert filas[0]["riqueza_fonetica"] > filas[1]["riqueza_fonetica"]
    assert set(filas[0]) == {"respuesta_id", "pregunta_orden", "segundos", "riqueza_fonetica"}
