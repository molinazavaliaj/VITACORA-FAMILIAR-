from voz.prueba_oido import barajar


def test_barajar_es_determinista_y_biyectivo():
    motores = ["chatterbox", "qwen3tts", "f5tts", "omnivoice"]
    a = barajar(motores, semilla="2026-09-17")
    b = barajar(motores, semilla="2026-09-17")
    assert a == b
    assert sorted(a.keys()) == ["A", "B", "C", "D"]
    assert sorted(a.values()) == sorted(motores)


def test_barajar_con_menos_motores_usa_menos_letras():
    assert sorted(barajar(["x", "y"], semilla="s").keys()) == ["A", "B"]
