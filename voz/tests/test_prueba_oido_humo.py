"""Prueba de humo del orquestador con un motor falso (fixture `motor_falso`
en conftest.py): prueba el camino completo (venv del motor → subprocess → wav
→ mp3 → clave.txt) sin GPU ni modelos."""

import shutil
import subprocess

import pytest

from voz.prueba_oido import correr

pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="hace falta ffmpeg")


def test_camino_completo_con_motor_falso(tmp_path, motor_falso):
    muestras = tmp_path / "muestras"
    muestras.mkdir()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=300:duration=2", "-ac", "1", "-ar", "24000", str(muestras / "referencia.wav")], check=True)
    (muestras / "referencia.txt").write_text("hola", encoding="utf-8")
    (muestras / "texto.txt").write_text("Una frase. Otra frase. La tercera.", encoding="utf-8")

    clave = correr(muestras, tmp_path / "salida", [motor_falso], tmp_path / "modelos")

    assert clave == {"A": "falso"}
    assert (tmp_path / "salida" / "A.mp3").stat().st_size > 1000
    assert (tmp_path / "salida" / "clave.txt").read_text(encoding="utf-8") == "A = falso\n"
    log = (tmp_path / "salida" / "crudo" / "falso.log").read_text(encoding="utf-8")
    assert "3 frases" in log
