"""Pasar a mp3 con el ffmpeg del sistema (en la PC está en el PATH).

Lo demás del audio (leer, limpiar, nivelar, loudnorm) vive en `masterizar.py`.
"""

import subprocess
from pathlib import Path


def _ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True, capture_output=True, text=True)


def a_mp3(entrada: Path, salida: Path) -> Path:
    _ffmpeg("-i", str(entrada), "-ac", "1", "-b:a", "128k", str(salida))
    return salida
