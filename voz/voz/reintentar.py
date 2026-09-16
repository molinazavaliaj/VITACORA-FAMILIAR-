"""`python -m voz.reintentar <id>`: vuelve una narración `fallida` a `pendiente`.

Para cuando una quedó `fallida` por algo que ya se arregló (faltaba el
consentimiento, se cayó Supabase, el motor se quedó sin memoria). Limpia el
error y el worker la retoma en su próxima vuelta; los capítulos que ya se
subieron se saltean.

Solo una `fallida`: una `pendiente` ya está en cola, una `procesando` la
tiene el worker (ponerla `pendiente` haría que se narre dos veces) y una
`lista` ya está narrada. Mismo guardián que `npm run narracion -- reintentar`
en la fábrica.

Además borra el candado del aviso `fallida` que dejó la fábrica: el candado
es por (narración, motivo), y sin borrarlo un segundo fallo no avisaría a
nadie.
"""

import logging
import sys
from datetime import datetime, timezone

from .buzon import candado_aviso
from .config import cargar_config
from .supabase_cliente import BUCKET, cliente

log = logging.getLogger("voz.reintentar")


class NoReintentable(Exception):
    """La narración no está `fallida` (o no existe)."""


def reintentar(sb, id_narracion: str, ahora: datetime | None = None) -> None:
    momento = ahora if ahora is not None else datetime.now(timezone.utc)
    filas = (
        sb.table("narraciones")
        .update({"estado": "pendiente", "error": None, "actualizada_at": momento.isoformat()})
        .eq("id", id_narracion)
        .eq("estado", "fallida")
        .execute()
        .data
    )
    if not filas:
        raise NoReintentable(
            f"narración {id_narracion!r}: solo se reintenta una narración fallida (o el id no existe)"
        )
    candado = candado_aviso(filas[0]["narrador_id"], id_narracion, "fallida")
    try:
        sb.storage.from_(BUCKET).remove([candado])  # borrar lo que no está no es error
    except Exception as e:  # noqa: BLE001 — la narración ya volvió a pendiente; esto es secundario
        log.warning("no pude borrar el candado %s (%s); si vuelve a fallar no va a avisar", candado, e)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("uso: python -m voz.reintentar <id de la narración>")
    id_narracion = sys.argv[1].strip()
    sb = cliente(cargar_config())
    try:
        reintentar(sb, id_narracion)
    except NoReintentable as e:
        raise SystemExit(f"no pude reintentar: {e}")
    print(f"la narración {id_narracion[:8]} volvió a pendiente; el worker la retoma en su próxima vuelta")


if __name__ == "__main__":
    main()
