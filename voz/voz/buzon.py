"""El latido del worker: la fila del servicio 'voz' en la tabla `latidos`.

Hasta el 16/10/2026 este módulo también era el buzón `narraciones` (el
audiolibro con voz clonada); ese camino se sacó y solo quedó el latido.
"""

from datetime import datetime, timezone
import logging

log = logging.getLogger("voz.buzon")


def ahora() -> datetime:
    """Hora actual en UTC (Supabase guarda timestamptz en UTC)."""
    return datetime.now(timezone.utc)


def latir(sb, detalle: dict | None = None) -> None:
    """Avisa que el worker está vivo.

    Es lo que le permite al panel distinguir «no hay trabajo» de «la PC se
    cayó»: se pisa siempre la misma fila (interesa la última vez, no el
    historial). Si no se puede latir —sin red, la tabla sin crear— se avisa y
    se sigue: el latido no puede tumbar el worker.
    """
    try:
        sb.table("latidos").upsert(
            {"servicio": "voz", "ultimo_ping": ahora().isoformat(), "detalle": detalle}
        ).execute()
    except Exception as err:  # cualquier fallo se avisa; ninguno frena
        log.warning("no pude latir: %s", err)
