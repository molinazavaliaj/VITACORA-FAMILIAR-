"""El buzón `narraciones`: cómo el worker toma pedidos y avisa cómo le fue.

Un escritor por columna (`supabase/CONTRATO.md`, sección "Narraciones (voz
clonada)"): la fábrica crea la fila en `pendiente`; el worker escribe
`estado`, `motor`, `muestras`, `capitulos_paths`, `error`, `tomada_at` y
`actualizada_at`. Nunca toca `pedidos`.

Cada función que necesita "ahora" acepta un `ahora` opcional (un
`datetime`) para que los tests inyecten un reloj fijo en vez de parchear el
módulo; en producción se deja en None y se usa la hora real.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass(frozen=True)
class Narracion:
    id: str
    narrador_id: str
    pedido_id: str
    estado: str
    capitulos_paths: list[str]
    tomada_at: str | None
    error: str | None


def ahora() -> datetime:
    """Hora actual en UTC (Supabase guarda timestamptz en UTC)."""
    return datetime.now(timezone.utc)


def tomar_pendiente(sb, ahora: datetime | None = None) -> Narracion | None:
    """Toma la narración pendiente más vieja, si hay alguna.

    Selecciona la más vieja y después la reclama con un update condicionado
    a que siga en 'pendiente': si otro worker la ganó justo antes, el update
    no toca ninguna fila y devolvemos None (el próximo tick reintenta).
    """
    pendientes = (
        sb.table("narraciones")
        .select("id")
        .eq("estado", "pendiente")
        .order("created_at")
        .limit(1)
        .execute()
        .data
    )
    if not pendientes:
        return None

    momento = ahora if ahora is not None else datetime.now(timezone.utc)
    momento_iso = momento.isoformat()
    id_narracion = pendientes[0]["id"]

    tomadas = (
        sb.table("narraciones")
        .update({"estado": "procesando", "tomada_at": momento_iso, "actualizada_at": momento_iso})
        .eq("id", id_narracion)
        .eq("estado", "pendiente")
        .execute()
        .data
    )
    if not tomadas:
        return None

    fila = tomadas[0]
    return Narracion(
        id=fila["id"],
        narrador_id=fila["narrador_id"],
        pedido_id=fila["pedido_id"],
        estado=fila["estado"],
        capitulos_paths=fila.get("capitulos_paths") or [],
        tomada_at=fila.get("tomada_at"),
        error=fila.get("error"),
    )


def retomar_colgadas(sb, horas: float = 6.0, ahora: datetime | None = None) -> int:
    """Vuelve a 'pendiente' las 'procesando' sin avance en más de `horas`.

    Un worker que se cuelga o se apaga a mitad de una narración la deja en
    'procesando' para siempre; esto las libera para que el mismo bucle las
    retome. "Sin avance" se mide por `actualizada_at`, que cada checkpoint
    de capítulo mueve — no por `tomada_at`: un libro largo con el motor
    lento lleva más de 6 h narrándose bien, y medir desde la toma lo
    devolvería a 'pendiente' para que otro lo narre dos veces. El filtro es
    del lado del servidor (`.lt`).
    """
    momento = ahora if ahora is not None else datetime.now(timezone.utc)
    limite = momento - timedelta(hours=horas)
    filas = (
        sb.table("narraciones")
        .update({"estado": "pendiente", "actualizada_at": momento.isoformat()})
        .eq("estado", "procesando")
        .lt("actualizada_at", limite.isoformat())
        .execute()
        .data
    )
    return len(filas)


def marcar(sb, id: str, estado: str, ahora: datetime | None = None, **campos) -> None:
    """Actualiza estado (y lo que venga en `campos`); `actualizada_at` siempre."""
    momento = ahora if ahora is not None else datetime.now(timezone.utc)
    filas = (
        sb.table("narraciones")
        .update({"estado": estado, "actualizada_at": momento.isoformat(), **campos})
        .eq("id", id)
        .execute()
        .data
    )
    if not filas:
        raise RuntimeError(f"marcar: no encontré la narración {id!r} para pasarla a estado={estado!r}")


def candado_aviso(narrador_id: str, id: str, motivo: str) -> str:
    """Ruta del candado que la fábrica deja en Storage cuando avisa a los
    socios de una narración atascada (un archivo por narración y motivo).

    Es el mismo nombre que arma `CANDADO_AVISO` en
    `fabrica/src/mail/socios.ts`: si cambia uno, cambia el otro.
    """
    return f"{narrador_id}/paquete/aviso_narracion_{id}_{motivo}.txt"


def consentimiento_de(sb, narrador_id: str) -> str | None:
    """`narradores.consentimiento_voz_at`; None si no hay fecha o el narrador no existe."""
    filas = (
        sb.table("narradores")
        .select("consentimiento_voz_at")
        .eq("id", narrador_id)
        .limit(1)
        .execute()
        .data
    )
    if not filas:
        return None
    return filas[0].get("consentimiento_voz_at")
