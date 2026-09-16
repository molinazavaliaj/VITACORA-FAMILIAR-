from datetime import datetime, timedelta, timezone

import pytest

from voz.buzon import Narracion, consentimiento_de, marcar, retomar_colgadas, tomar_pendiente

from fakes import FakeSupabase

MOMENTO = datetime(2026, 9, 16, 10, 0, 0, tzinfo=timezone.utc)


def test_tomar_pendiente_sin_pendientes_devuelve_none():
    fake = FakeSupabase()
    fake.responder("narraciones", "select", [])

    assert tomar_pendiente(fake) is None

    cadena = fake.ejecutadas[-1]
    assert cadena.tabla == "narraciones"
    assert ("eq", "estado", "pendiente") in cadena.llamadas
    assert ("order", "created_at") in cadena.llamadas
    assert ("limit", 1) in cadena.llamadas


def test_tomar_pendiente_toma_la_mas_vieja_y_registra_el_update_condicional():
    fake = FakeSupabase()
    fake.responder("narraciones", "select", [{"id": "abc"}])
    fake.responder(
        "narraciones",
        "update",
        [
            {
                "id": "abc",
                "narrador_id": "n1",
                "pedido_id": "p1",
                "estado": "procesando",
                "capitulos_paths": None,
                "tomada_at": MOMENTO.isoformat(),
                "error": None,
            }
        ],
    )

    resultado = tomar_pendiente(fake, ahora=MOMENTO)

    assert resultado == Narracion(
        id="abc",
        narrador_id="n1",
        pedido_id="p1",
        estado="procesando",
        capitulos_paths=[],
        tomada_at=MOMENTO.isoformat(),
        error=None,
    )

    cadena_update = fake.ejecutadas[-1]
    assert (
        "update",
        {
            "estado": "procesando",
            "tomada_at": MOMENTO.isoformat(),
            "actualizada_at": MOMENTO.isoformat(),
        },
    ) in cadena_update.llamadas
    assert ("eq", "id", "abc") in cadena_update.llamadas
    assert ("eq", "estado", "pendiente") in cadena_update.llamadas


def test_tomar_pendiente_si_otro_worker_la_gano_devuelve_none():
    fake = FakeSupabase()
    fake.responder("narraciones", "select", [{"id": "abc"}])
    fake.responder("narraciones", "update", [])  # el update condicional no tocó nada

    assert tomar_pendiente(fake, ahora=MOMENTO) is None


def test_retomar_colgadas_filtra_por_actualizada_at_viejo_y_cuenta_las_filas():
    """"Colgada" es sin avance en 6 h: se mira `actualizada_at` (cada checkpoint
    la mueve), no `tomada_at` — un libro largo lleva más de 6 h sin colgarse."""
    fake = FakeSupabase()
    fake.responder("narraciones", "update", [{"id": "a"}, {"id": "b"}])

    cantidad = retomar_colgadas(fake, horas=6.0, ahora=MOMENTO)

    assert cantidad == 2
    cadena = fake.ejecutadas[-1]
    assert ("eq", "estado", "procesando") in cadena.llamadas
    limite_esperado = (MOMENTO - timedelta(hours=6.0)).isoformat()
    assert ("lt", "actualizada_at", limite_esperado) in cadena.llamadas
    assert not any(llamada[:2] == ("lt", "tomada_at") for llamada in cadena.llamadas)
    assert (
        "update",
        {"estado": "pendiente", "actualizada_at": MOMENTO.isoformat()},
    ) in cadena.llamadas


def test_retomar_colgadas_sin_colgadas_devuelve_cero():
    fake = FakeSupabase()
    fake.responder("narraciones", "update", [])

    assert retomar_colgadas(fake, ahora=MOMENTO) == 0


def test_marcar_actualiza_estado_y_campos_extra():
    fake = FakeSupabase()
    fake.responder("narraciones", "update", [{"id": "x"}])

    marcar(fake, "x", "lista", ahora=MOMENTO, capitulos_paths=["n1/voz/cap_01.mp3"])

    cadena = fake.ejecutadas[-1]
    assert (
        "update",
        {
            "estado": "lista",
            "actualizada_at": MOMENTO.isoformat(),
            "capitulos_paths": ["n1/voz/cap_01.mp3"],
        },
    ) in cadena.llamadas
    assert ("eq", "id", "x") in cadena.llamadas


def test_marcar_sin_fila_encontrada_tira_runtime_error():
    fake = FakeSupabase()
    fake.responder("narraciones", "update", [])

    with pytest.raises(RuntimeError):
        marcar(fake, "no-existe", "fallida", ahora=MOMENTO, error="boom")


def test_consentimiento_de_devuelve_la_fecha():
    fake = FakeSupabase()
    fake.responder("narradores", "select", [{"consentimiento_voz_at": "2026-09-01T00:00:00+00:00"}])

    assert consentimiento_de(fake, "n1") == "2026-09-01T00:00:00+00:00"

    cadena = fake.ejecutadas[-1]
    assert ("eq", "id", "n1") in cadena.llamadas


def test_consentimiento_de_sin_narrador_devuelve_none():
    fake = FakeSupabase()
    fake.responder("narradores", "select", [])

    assert consentimiento_de(fake, "no-existe") is None
