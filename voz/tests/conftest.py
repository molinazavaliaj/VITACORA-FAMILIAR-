"""Fixtures compartidas: el motor falso (un `generar.py` que devuelve un tono
en vez de voz, con su propio venv) para probar el camino subprocess → wav
sin GPU ni modelos. Se arma una vez por corrida porque crear el venv tarda."""

import shutil
import subprocess
import sys

import pytest

from voz.config import RAIZ

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


@pytest.fixture(scope="session")
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
