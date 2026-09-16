"""`python -m voz.reintentar <id>`: solo una `fallida` vuelve a `pendiente`, y
se borra el candado del aviso para que, si vuelve a fallar, la fábrica avise
de nuevo (el candado es por (narración, motivo); sin borrarlo, el segundo
fallo sería mudo)."""

from datetime import datetime, timezone

import pytest

import voz.reintentar as reintentar_mod
from voz.buzon import candado_aviso
from voz.reintentar import NoReintentable, reintentar

from fakes import FakeSupabase

MOMENTO = datetime(2026, 9, 16, 10, 0, 0, tzinfo=timezone.utc)


def test_candado_aviso_es_el_mismo_nombre_que_deja_la_fabrica():
    # fabrica/src/mail/socios.ts, CANDADO_AVISO: `aviso_narracion_{id}_{motivo}.txt` en paquete/.
    assert candado_aviso("n1", "abc", "fallida") == "n1/paquete/aviso_narracion_abc_fallida.txt"


def test_reintentar_una_fallida_la_vuelve_a_pendiente_y_borra_el_candado():
    fake = FakeSupabase()
    fake.storage.from_("audios").upload("n1/paquete/aviso_narracion_abc_fallida.txt", b"2026-09-16")
    fake.responder("narraciones", "update", [{"id": "abc", "narrador_id": "n1", "estado": "pendiente"}])

    reintentar(fake, "abc", ahora=MOMENTO)

    cadena = fake.ejecutadas[-1]
    assert cadena.tabla == "narraciones"
    assert ("update", {"estado": "pendiente", "error": None, "actualizada_at": MOMENTO.isoformat()}) in cadena.llamadas
    assert ("eq", "id", "abc") in cadena.llamadas
    assert ("eq", "estado", "fallida") in cadena.llamadas
    assert fake.storage.borrados == [("audios", ["n1/paquete/aviso_narracion_abc_fallida.txt"])]
    assert "n1/paquete/aviso_narracion_abc_fallida.txt" not in fake.storage.archivos["audios"]


def test_reintentar_sin_candado_previo_no_falla():
    fake = FakeSupabase()
    fake.responder("narraciones", "update", [{"id": "abc", "narrador_id": "n1", "estado": "pendiente"}])

    reintentar(fake, "abc", ahora=MOMENTO)

    assert fake.storage.borrados == [("audios", ["n1/paquete/aviso_narracion_abc_fallida.txt"])]


def test_reintentar_si_no_esta_fallida_o_no_existe_avisa_y_no_toca_storage():
    fake = FakeSupabase()
    fake.responder("narraciones", "update", [])  # el update condicionado no tocó ninguna fila

    with pytest.raises(NoReintentable, match="solo se reintenta una narración fallida"):
        reintentar(fake, "abc", ahora=MOMENTO)

    assert fake.storage.borrados == []


def test_main_sale_con_1_si_no_se_puede_reintentar(monkeypatch, capsys):
    fake = FakeSupabase()
    fake.responder("narraciones", "update", [])
    monkeypatch.setattr(reintentar_mod, "cargar_config", lambda: None)
    monkeypatch.setattr(reintentar_mod, "cliente", lambda config: fake)
    monkeypatch.setattr(reintentar_mod.sys, "argv", ["reintentar", "abc"])

    with pytest.raises(SystemExit) as salida:
        reintentar_mod.main()

    assert salida.value.code != 0
