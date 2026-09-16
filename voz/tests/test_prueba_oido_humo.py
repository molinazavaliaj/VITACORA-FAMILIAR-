"""Prueba de humo del orquestador con un motor falso: prueba el camino completo
(venv del motor → subprocess → wav → mp3 → clave.txt) sin GPU ni modelos."""

import shutil
import subprocess
import sys
from pathlib import Path

import pytest

from voz.config import RAIZ
from voz.prueba_oido import correr

pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="hace falta ffmpeg")

GENERAR_FALSO = '''
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import numpy as np
from comun import correr_motor

def cargar(args):
    def una(frase):
        t = np.linspace(0, 0.3, 7200, endpoint=False)
        return (0.3 * np.sin(2 * np.pi * 440 * t)).astype(np.float32), 24000
    return una

if __name__ == "__main__":
    correr_motor("falso", "motor falso", cargar)
'''


@pytest.fixture
def motor_falso():
    carpeta = RAIZ / "motores" / "falso"
    if carpeta.exists():
        shutil.rmtree(carpeta)
    carpeta.mkdir(parents=True)
    (carpeta / "generar.py").write_text(GENERAR_FALSO, encoding="utf-8")
    subprocess.run([sys.executable, "-m", "venv", str(carpeta / ".venv")], check=True)
    pip = carpeta / ".venv" / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    subprocess.run([str(pip), "-m", "pip", "install", "-q", "numpy", "soundfile"], check=True)
    yield "falso"
    shutil.rmtree(carpeta)


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
