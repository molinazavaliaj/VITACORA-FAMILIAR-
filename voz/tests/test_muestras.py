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
