"""Lo poco que el worker lee de Supabase: las respuestas del narrador y sus audios.

Usa la service role key (el worker corre en una máquina de los socios, no en
el navegador de nadie). Solo lectura acá; lo que el worker escribe (el latido,
las frases en Storage) va en su propio módulo.
"""

from pathlib import Path

from supabase import Client, create_client

from .config import Config
from .muestras import Respuesta

BUCKET = "audios"


def cliente(config: Config) -> Client:
    return create_client(config.supabase_url, config.supabase_key)


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
