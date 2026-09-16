"""Correr `motores/<motor>/generar.py` en el venv del motor, por subprocess.

Lo comparten la prueba de oído (un párrafo por motor) y el worker (un
capítulo por vez con el motor elegido). El motor lee referencia, texto y
modelos de la línea de comandos y deja un wav; acá solo se arma el comando,
se manda la salida a un archivo de log y se devuelve cómo le fue.
"""

import os
import subprocess
import time
from pathlib import Path

from .config import RAIZ


def python_del_motor(motor: str) -> Path:
    venv = RAIZ / "motores" / motor / ".venv"
    candidatos = [venv / "Scripts" / "python.exe", venv / "bin" / "python"]
    for c in candidatos:
        if c.exists():
            return c
    raise FileNotFoundError(
        f"el motor {motor} no tiene venv: crealo con "
        f"`python -m venv motores/{motor}/.venv` y `motores\\{motor}\\.venv\\Scripts\\pip install -r motores/{motor}/requirements.txt`"
    )


def correr_motor_subprocess(
    motor: str,
    referencia: Path,
    referencia_texto: Path,
    texto: Path,
    salida: Path,
    modelos: Path,
    registro: Path,
) -> tuple[bool, float, str]:
    """Genera `salida` (wav) leyendo `texto` con la voz de `referencia`.

    Devuelve (salió bien, segundos, cola del log). Sale bien si el proceso
    terminó en 0 y el wav existe; la cola del log son los últimos 1500
    caracteres de `registro`, para mostrar el error sin abrir el archivo.
    """
    comando = [
        str(python_del_motor(motor)),
        str(RAIZ / "motores" / motor / "generar.py"),
        "--referencia", str(referencia),
        "--referencia-texto", str(referencia_texto),
        "--texto", str(texto),
        "--salida", str(salida),
        "--modelos", str(modelos),
    ]
    entorno = {**os.environ, "HF_HOME": str(modelos), "HF_HUB_DISABLE_SYMLINKS_WARNING": "1", "PYTHONIOENCODING": "utf-8"}
    t0 = time.time()
    with registro.open("w", encoding="utf-8") as f:
        proceso = subprocess.run(comando, stdout=f, stderr=subprocess.STDOUT, env=entorno, cwd=str(RAIZ))
    segundos = time.time() - t0
    cola = registro.read_text(encoding="utf-8", errors="replace")[-1500:]
    return proceso.returncode == 0 and salida.exists(), segundos, cola
