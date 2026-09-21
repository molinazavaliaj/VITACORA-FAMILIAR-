from voz.buzon import latir

from fakes import FakeSupabase


class SupabaseQueFalla:
    """Un cliente que no puede ni abrir la tabla: el caso de la red caída."""

    def table(self, nombre):
        raise RuntimeError("fetch failed")


def test_late_con_el_servicio_voz_y_su_detalle():
    fake = FakeSupabase()

    latir(fake, {"motor": "qwen3tts", "vueltas": 7})

    cadena = fake.ejecutadas[-1]
    assert cadena.tabla == "latidos"
    assert cadena.operacion == "upsert"

    (_, fila), = [l for l in cadena.llamadas if l[0] == "upsert"]
    assert fila["servicio"] == "voz"
    assert fila["detalle"] == {"motor": "qwen3tts", "vueltas": 7}
    assert isinstance(fila["ultimo_ping"], str) and fila["ultimo_ping"]


def test_sin_detalle_tambien_late():
    fake = FakeSupabase()

    latir(fake)

    (_, fila), = [l for l in fake.ejecutadas[-1].llamadas if l[0] == "upsert"]
    assert fila["servicio"] == "voz"
    assert fila["detalle"] is None


def test_si_no_puede_latir_avisa_y_no_tira():
    # La PC de música puede quedarse sin red: el latido no puede tumbar el worker.
    latir(SupabaseQueFalla(), {"motor": "qwen3tts"})
