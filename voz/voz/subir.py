"""Subir a Storage con reintentos: un corte de red no hace perder una frase."""

import time

from .supabase_cliente import BUCKET

REINTENTOS_SUBIDA = 3


def subir_con_reintentos(sb, ruta: str, datos: bytes, opciones: dict, log) -> bool:
    """Sube `datos` a `ruta` del bucket; True si salió, False si fallaron los tres intentos."""
    for intento in range(1, REINTENTOS_SUBIDA + 1):
        try:
            sb.storage.from_(BUCKET).upload(ruta, datos, opciones)
            return True
        except Exception as e:
            log.warning("subida de %s falló (%d/%d): %s", ruta, intento, REINTENTOS_SUBIDA, str(e)[:120])
            time.sleep(min(2**intento, 8))
    return False
