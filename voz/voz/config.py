"""Configuración del worker: un `.env` en la carpeta `voz/` que carga Naza a mano.

Claude no maneja las claves. Si falta una variable, el error dice cuál.
"""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

RAIZ = Path(__file__).resolve().parent.parent  # la carpeta voz/ del repo


@dataclass(frozen=True)
class Config:
    supabase_url: str
    supabase_key: str
    carpeta_modelos: Path  # pesos de los modelos (en D:\vitacora-modelos)
    carpeta_trabajo: Path  # temporales, muestras, salidas de la prueba
    motor: str = ""  # el motor elegido en la prueba de oído; solo el worker lo exige
    intervalo_segundos: int = 30  # cada cuánto sondea el buzón cuando no hay trabajo


def cargar_config() -> Config:
    load_dotenv(RAIZ / ".env")
    faltan = [k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") if not os.environ.get(k)]
    if faltan:
        raise SystemExit(
            f"Falta {', '.join(faltan)} en {RAIZ / '.env'} (copiá .env.ejemplo y completalo)."
        )
    return Config(
        supabase_url=os.environ["SUPABASE_URL"].strip(),
        supabase_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"].strip(),
        carpeta_modelos=Path(os.environ.get("CARPETA_MODELOS", str(RAIZ / "modelos"))),
        carpeta_trabajo=Path(os.environ.get("CARPETA_TRABAJO", str(RAIZ / "prueba"))),
        motor=os.environ.get("MOTOR", "").strip(),
        intervalo_segundos=int(os.environ.get("INTERVALO_SEGUNDOS", "30")),
    )
