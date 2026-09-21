import pytest

from voz.cortar_frases import (
    cuantas_cortadas,
    marcar_cortada,
    marcar_fallida,
    narradores_con_pedido,
    pendientes,
    RUTA_AUDIO_DE_FRASE,
    RUTA_FRASES_JSON,
    RUTA_FRASES_PEDIDO,
)


def frases_de_prueba():
    return {
        "version": 1,
        "narrador_id": "n1",
        "pedido_id": "p1",
        "confirmado_at": None,
        "capitulos": [
            {
                "numero": 1,
                "capitulo": "La infancia",
                "candidatas": [
                    {"id": "sf-1", "texto": "¿Quién se sacó diez?", "respuesta_id": "r9", "estado": "pendiente"},
                    {"id": "cita-1", "texto": "Y esa casa era todo.", "respuesta_id": None, "estado": "pendiente"},
                    {"id": "cita-2", "texto": "El mejor ring de mi vida.", "respuesta_id": "r1", "estado": "cortada"},
                    {"id": "cita-3", "texto": "Rosario, mi ciudad.", "respuesta_id": "r2", "estado": "fallida"},
                ],
            },
            {
                "numero": 2,
                "capitulo": "El amor",
                "candidatas": [
                    {"id": "sf-2", "texto": "La conocí bailando.", "respuesta_id": "r2", "estado": "pendiente"},
                ],
            },
        ],
    }


def test_las_rutas_son_las_del_contrato():
    assert RUTA_FRASES_JSON("n1") == "n1/paquete/frases.json"
    assert RUTA_FRASES_PEDIDO("n1") == "n1/paquete/frases_pedido.txt"
    assert RUTA_AUDIO_DE_FRASE("n1", "cita-7") == "n1/voz/frases/cita-7.mp3"


def test_pendientes_solo_las_que_se_pueden_cortar():
    assert [f.id for f in pendientes(frases_de_prueba())] == ["sf-1", "sf-2"]
    # Ni la que no salió de una respuesta (no es textual), ni la cortada, ni la fallada.
    assert pendientes({"capitulos": []}) == []


def test_marcar_cortada_anota_archivo_y_minuto():
    frases = marcar_cortada(frases_de_prueba(), "sf-1", audio_path="n1/voz/frases/sf-1.mp3", segundos=4.567, inicio=12.345, fin=16.912)
    candidata = frases["capitulos"][0]["candidatas"][0]
    assert candidata["estado"] == "cortada"
    assert candidata["audio_path"] == "n1/voz/frases/sf-1.mp3"
    assert (candidata["segundos"], candidata["inicio"], candidata["fin"]) == (4.57, 12.35, 16.91)
    # Y deja de estar pendiente.
    assert [f.id for f in pendientes(frases)] == ["sf-2"]


def test_marcar_fallida_no_tumba_nada():
    frases = marcar_fallida(frases_de_prueba(), "sf-2", "no se encontró la frase en el audio")
    candidata = frases["capitulos"][1]["candidatas"][0]
    assert candidata["estado"] == "fallida"
    assert "no se encontró" in candidata["error"]
    assert [f.id for f in pendientes(frases)] == ["sf-1"]


def test_marcar_una_frase_que_no_existe_avisa():
    with pytest.raises(KeyError):
        marcar_cortada(frases_de_prueba(), "sf-99", audio_path="x", segundos=1, inicio=0, fin=1)
    with pytest.raises(KeyError):
        marcar_fallida(frases_de_prueba(), "sf-99", "x")


def test_cuantas_cortadas_es_lo_que_mira_el_panel():
    assert cuantas_cortadas(frases_de_prueba()) == (1, 5)
    assert cuantas_cortadas({"capitulos": []}) == (0, 0)


class StorageFalso:
    """Lo mínimo de `sb.storage.from_(bucket)`: listar carpetas y archivos."""

    def __init__(self, carpetas: dict[str, list[str]]):
        self.carpetas = carpetas
        self.pedidos = []

    def from_(self, bucket: str):
        assert bucket == "audios"
        return self

    def list(self, ruta: str = ""):
        if ruta == "":
            return [{"name": nombre} for nombre in self.carpetas]
        carpeta = ruta[: -len("/paquete")] if ruta.endswith("/paquete") else ruta
        return [{"name": archivo} for archivo in self.carpetas.get(carpeta, [])]


def test_narradores_con_pedido_mira_storage():
    sb = type("Sb", (), {"storage": StorageFalso({
        "n1": ["frases.json", "frases_pedido.txt"],
        "n2": ["frases.json"],
        "n3": ["frases_pedido.txt"],
    })})()
    assert narradores_con_pedido(sb) == ["n1", "n3"]
    assert narradores_con_pedido(type("Sb", (), {"storage": StorageFalso({})})()) == []
