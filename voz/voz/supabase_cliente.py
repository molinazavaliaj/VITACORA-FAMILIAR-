"""Lo poco que el worker lee de Supabase: el narrador, sus respuestas y sus audios.

Usa la service role key (el worker corre en una máquina de los socios, no en
el navegador de nadie). Solo lectura acá; lo que el worker escribe
(`narraciones`) va en su propio módulo.
"""

from pathlib import Path

from supabase import Client, create_client

from .config import Config
from .muestras import Respuesta

BUCKET = "audios"


def cliente(config: Config) -> Client:
    return create_client(config.supabase_url, config.supabase_key)


def narrador_por_nombre(sb: Client, nombre: str) -> dict:
    """Busca por nombre sin distinguir mayúsculas. Falla si hay cero o varios:
    adivinar mal no se nota nunca."""
    filas = (
        sb.table("narradores")
        .select("id, nombre, como_le_dicen, estado")
        .ilike("nombre", nombre)
        .execute()
        .data
    )
    if len(filas) != 1:
        nombres = ", ".join(f"{f['nombre']} ({f['id'][:8]})" for f in filas) or "ninguno"
        raise SystemExit(f"Narrador '{nombre}': esperaba 1, encontré {len(filas)}: {nombres}")
    return filas[0]


def narrador_por_id(sb: Client, narrador_id: str) -> dict:
    """El narrador por su id (lo que trae la narración). Falla si no existe."""
    filas = (
        sb.table("narradores")
        .select("id, nombre, como_le_dicen, estado")
        .eq("id", narrador_id)
        .limit(1)
        .execute()
        .data
    )
    if not filas:
        raise LookupError(f"no existe el narrador {narrador_id!r}")
    return filas[0]


def respuestas_de(sb: Client, narrador_id: str) -> list[Respuesta]:
    filas = (
        sb.table("respuestas")
        .select("id, pregunta_orden, audio_path, duracion_segundos, transcripcion")
        .eq("narrador_id", narrador_id)
        .order("pregunta_orden")
        .execute()
        .data
    )
    return [
        Respuesta(
            id=f["id"],
            pregunta_orden=f["pregunta_orden"],
            audio_path=f.get("audio_path"),
            duracion_segundos=f.get("duracion_segundos"),
            transcripcion=f.get("transcripcion"),
        )
        for f in filas
    ]


def descargar_audio(sb: Client, audio_path: str, destino: Path) -> Path:
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(sb.storage.from_(BUCKET).download(audio_path))
    return destino
