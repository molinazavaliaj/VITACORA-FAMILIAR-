"""Paso 2 de la prueba de oído: el mismo párrafo con cada motor, barajado en
A, B, C, D para elegir escuchando sin saber cuál es cuál.

    python -m voz.prueba_oido [--muestras prueba/muestras] [--salida prueba] [--motores chatterbox,qwen3tts,f5tts,omnivoice]

Cada motor corre en su propio venv (`motores/<motor>/.venv`), por subprocess.
Si uno falla, se anota el error y se sigue con los otros: la prueba vale con
los que salieron. La clave (qué letra es qué motor) queda en `clave.txt`: no se
abre hasta haber elegido.
"""

import argparse
import datetime as dt
import logging
import os
import random
import subprocess
import sys
import time
from pathlib import Path

from .audio import a_mp3
from .config import RAIZ, cargar_config

log = logging.getLogger("voz.prueba")

MOTORES = ["chatterbox", "qwen3tts", "f5tts", "omnivoice"]
LETRAS = "ABCDEFGH"


def barajar(motores: list[str], semilla: str) -> dict[str, str]:
    """Letra → motor, al azar pero repetible para la misma semilla."""
    orden = list(motores)
    random.Random(semilla).shuffle(orden)
    return {LETRAS[i]: m for i, m in enumerate(orden)}


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


def generar_con(motor: str, muestras: Path, crudo: Path, modelos: Path) -> tuple[bool, float, str]:
    """Corre `motores/<motor>/generar.py` en su venv. Devuelve (salió bien, segundos, cola del log)."""
    salida = crudo / f"{motor}.wav"
    registro = crudo / f"{motor}.log"
    comando = [
        str(python_del_motor(motor)),
        str(RAIZ / "motores" / motor / "generar.py"),
        "--referencia", str(muestras / "referencia.wav"),
        "--referencia-texto", str(muestras / "referencia.txt"),
        "--texto", str(muestras / "texto.txt"),
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


def correr(muestras: Path, salida: Path, motores: list[str], modelos: Path) -> dict[str, str]:
    for nombre in ("referencia.wav", "referencia.txt", "texto.txt"):
        if not (muestras / nombre).exists():
            raise SystemExit(f"falta {muestras / nombre}: corré antes `python -m voz.preparar_muestras --narrador ...`")
    crudo = salida / "crudo"
    crudo.mkdir(parents=True, exist_ok=True)

    buenos: list[str] = []
    for motor in motores:
        log.info("── %s: generando…", motor)
        try:
            ok, segundos, cola = generar_con(motor, muestras, crudo, modelos)
        except FileNotFoundError as e:
            log.error("%s: %s", motor, e)
            continue
        if ok:
            log.info("── %s: listo en %.0f s", motor, segundos)
            buenos.append(motor)
        else:
            log.error("── %s: FALLÓ a los %.0f s. Cola del log (%s):\n%s", motor, segundos, crudo / f"{motor}.log", cola)

    if not buenos:
        raise SystemExit("ningún motor produjo audio; mirá los .log en " + str(crudo))

    clave = barajar(buenos, semilla=dt.date.today().isoformat())
    for letra, motor in clave.items():
        a_mp3(crudo / f"{motor}.wav", salida / f"{letra}.mp3")
    (salida / "clave.txt").write_text("".join(f"{letra} = {motor}\n" for letra, motor in sorted(clave.items())), encoding="utf-8")
    letras = ", ".join(sorted(clave))
    log.info("Listo: %s en %s. La clave está en %s: no la abras hasta elegir.", letras, salida, salida / "clave.txt")
    return clave


def main() -> None:
    # La consola de Windows arranca en cp1252 y no sabe imprimir "→" ni "…".
    for flujo in (sys.stdout, sys.stderr):
        if hasattr(flujo, "reconfigure"):
            flujo.reconfigure(encoding="utf-8", errors="replace")
    logging.basicConfig(level=logging.INFO, format="%(message)s", stream=sys.stdout)
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--muestras", type=Path, default=None, help="carpeta que dejó preparar_muestras (por defecto CARPETA_TRABAJO/muestras)")
    p.add_argument("--salida", type=Path, default=None, help="dónde dejar A.mp3… (por defecto CARPETA_TRABAJO)")
    p.add_argument("--motores", default=",".join(MOTORES), help="lista separada por comas")
    args = p.parse_args()
    config = cargar_config()
    muestras = args.muestras or config.carpeta_trabajo / "muestras"
    salida = args.salida or config.carpeta_trabajo
    motores = [m.strip() for m in args.motores.split(",") if m.strip()]
    desconocidos = [m for m in motores if m not in MOTORES]
    if desconocidos:
        raise SystemExit(f"motores desconocidos: {desconocidos}; los que hay: {MOTORES}")
    correr(muestras, salida, motores, config.carpeta_modelos)


if __name__ == "__main__":
    main()
