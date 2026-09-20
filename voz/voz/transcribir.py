"""Transcribir un clip corto con la API de Whisper de OpenAI (la misma que usa
el entrevistador). Solo hace falta cuando la referencia no es una respuesta
entera y la transcripción guardada no coincide con el recorte: un clip de
25 s cuesta centavos, y evita cargar un whisper local (faster-whisper hizo
segfault en la laptop de Naza; no vale la pena depender de él).
"""

import os
from pathlib import Path

import httpx


def transcribir_clip(ruta: Path) -> str:
    clave = os.environ.get("OPENAI_API_KEY", "").strip()
    if not clave:
        raise SystemExit(
            "Hace falta OPENAI_API_KEY en voz/.env para transcribir la referencia "
            "(no hay ninguna respuesta entera de 12-30 s con transcripción)."
        )
    with ruta.open("rb") as f:
        respuesta = httpx.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {clave}"},
            data={"model": "whisper-1", "language": "es", "response_format": "text"},
            files={"file": (ruta.name, f, "audio/wav")},
            timeout=120,
        )
    if respuesta.status_code != 200:
        # RuntimeError, no SystemExit: si algún día corre dentro del worker, el
        # `except Exception` del bucle lo marca `fallida` en vez de matar el proceso.
        raise RuntimeError(f"Whisper falló ({respuesta.status_code}): {respuesta.text[:300]}")
    return respuesta.text.strip()


def palabras_con_tiempos(ruta: Path) -> dict:
    """Las palabras del clip con su (inicio, fin) en segundos, para arreglar el
    ritmo de un original (voz/ritmo.py). `whisper-1` con
    `timestamp_granularities=word`: devuelve {"texto" (con puntuación),
    "palabras": [{"palabra", "inicio", "fin"}, …]}."""
    clave = os.environ.get("OPENAI_API_KEY", "").strip()
    if not clave:
        raise RuntimeError("Hace falta OPENAI_API_KEY en voz/.env para las marcas de tiempo por palabra.")
    with ruta.open("rb") as f:
        respuesta = httpx.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {clave}"},
            data={
                "model": "whisper-1",
                "language": "es",
                "response_format": "verbose_json",
                "timestamp_granularities[]": ["word"],
            },
            files={"file": (ruta.name, f, "audio/wav")},
            timeout=300,
        )
    if respuesta.status_code != 200:
        raise SystemExit(f"Whisper falló ({respuesta.status_code}): {respuesta.text[:300]}")
    datos = respuesta.json()
    palabras = [{"palabra": w["word"].strip(), "inicio": float(w["start"]), "fin": float(w["end"])} for w in datos.get("words", [])]
    return {"texto": (datos.get("text") or "").strip(), "palabras": palabras}
