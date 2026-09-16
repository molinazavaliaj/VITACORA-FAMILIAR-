"""`python -m voz.reintentar <id>`: vuelve una narración a `pendiente`.

Para cuando una quedó `fallida` por algo que ya se arregló (faltaba el
consentimiento, se cayó Supabase, el motor se quedó sin memoria). Limpia el
error y el worker la retoma en su próxima vuelta; los capítulos que ya se
subieron se saltean.
"""

import sys

from .buzon import marcar
from .config import cargar_config
from .supabase_cliente import cliente


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("uso: python -m voz.reintentar <id de la narración>")
    id_narracion = sys.argv[1].strip()
    sb = cliente(cargar_config())
    try:
        marcar(sb, id_narracion, "pendiente", error=None)
    except RuntimeError as e:
        raise SystemExit(f"no pude reintentar: {e}")
    print(f"la narración {id_narracion[:8]} volvió a pendiente; el worker la retoma en su próxima vuelta")


if __name__ == "__main__":
    main()
