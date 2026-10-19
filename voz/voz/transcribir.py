"""Escuchar un audio con la API de Whisper de OpenAI (la misma que usa el
entrevistador) para tener cada palabra con su minuto: así se ubica la frase de
«Su voz» dentro de la respuesta. Es barato y evita cargar un whisper local
(faster-whisper hizo segfault en la laptop de Naza; no vale la pena depender de él).
"""

import os
from pathlib import Path

import httpx


def palabras_con_tiempos(ruta: Path) -> dict:
    """Las palabras del clip con su (inicio, fin) en segundos, para ubicar una
    frase en el audio (voz/frases.py). `whisper-1` con
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
        # RuntimeError, no SystemExit (revisión 21/09): un 429/413/5xx de Whisper
        # deja la frase pendiente para la vuelta siguiente, no tumba el worker.
        raise RuntimeError(f"Whisper falló ({respuesta.status_code}): {respuesta.text[:300]}")
    datos = respuesta.json()
    palabras = [{"palabra": w["word"].strip(), "inicio": float(w["start"]), "fin": float(w["end"])} for w in datos.get("words", [])]
    return {"texto": (datos.get("text") or "").strip(), "palabras": palabras}
