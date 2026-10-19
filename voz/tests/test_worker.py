"""El bucle del worker con fakes: una vuelta atiende los pedidos de frases de
«Su voz», dice si hubo trabajo y nunca se muere porque un pedido explote."""

import logging

import voz.worker as worker
from voz.config import Config
from voz.cortar_frases import RUTA_FRASES_PEDIDO
from voz.worker import una_vuelta

from fakes import FakeSupabase

LOG = logging.getLogger("test.worker")


def config_de(tmp_path):
    return Config(
        supabase_url="", supabase_key="",
        carpeta_modelos=tmp_path / "modelos", carpeta_trabajo=tmp_path / "trabajo",
    )


def test_una_vuelta_con_frases_cortadas_dice_que_hubo_trabajo(tmp_path, monkeypatch):
    """Cortar frases es trabajo: si el worker cortó dos, la vuelta no duerme."""
    monkeypatch.setattr(worker, "procesar_pedido", lambda sb, config, log: 2)

    assert una_vuelta(FakeSupabase(), config_de(tmp_path), LOG) is True


def test_una_vuelta_sin_pedidos_dice_que_no_hubo_trabajo(tmp_path, monkeypatch):
    monkeypatch.setattr(worker, "procesar_pedido", lambda sb, config, log: 0)

    assert una_vuelta(FakeSupabase(), config_de(tmp_path), LOG) is False


def test_procesar_pedidos_devuelve_cuantas_frases_corto(tmp_path, monkeypatch):
    monkeypatch.setattr(worker, "procesar_pedido", lambda sb, config, log: 3)

    assert worker.procesar_pedidos(FakeSupabase(), config_de(tmp_path), LOG) == 3


def test_si_los_pedidos_de_frases_explotan_el_worker_sigue_vivo(tmp_path, monkeypatch):
    def explota(sb, config, log):
        raise RuntimeError("503 Service Unavailable")

    monkeypatch.setattr(worker, "procesar_pedido", explota)

    assert worker.procesar_pedidos(FakeSupabase(), config_de(tmp_path), LOG) == 0
    assert una_vuelta(FakeSupabase(), config_de(tmp_path), LOG) is False


def test_una_vuelta_atiende_un_pedido_de_frases_de_verdad(tmp_path):
    """El gancho completo contra Storage: un pedido sin `frases.json` no se puede
    atender nunca, así que la vuelta lo limpia (y no se muere haciéndolo)."""
    fake = FakeSupabase()
    archivos = fake.storage.archivos.setdefault("audios", {})
    archivos[RUTA_FRASES_PEDIDO("n1")] = b"2026-09-21T00:00:00Z"

    assert una_vuelta(fake, config_de(tmp_path), LOG) is False
    assert RUTA_FRASES_PEDIDO("n1") not in archivos
    assert fake.storage.borrados == [("audios", [RUTA_FRASES_PEDIDO("n1")])]

