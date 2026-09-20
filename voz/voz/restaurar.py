"""Restaurar los audios originales del narrador (directiva 02, parte A): las
notas de WhatsApp son Opus a ~16 kbps (nada por encima de ~8 kHz, mic de
celular, ambiente) y `highpass + afftdn` no alcanza. Se pasa cada original por
resemble-enhance (denoise + enhance a 44,1 kHz) ANTES de todo lo demás (EQ,
loudnorm, lecho de ruido).

El modelo corre en su propio venv (`herramientas/restaurar/.venv`), por
subprocess, como los motores. `RESTAURACION_NIVEL` (0..1, en `.env`) gradúa
cuánto trabaja el modelo (la fuerza de denoise): la voz tiene que seguir siendo
la de él, no "de locutor". 0 = no se toca. La salida es siempre 100 % restaurada:
mezclarla en el tiempo con el original (vocoder, sin fase) suena doblada.

Se mide antes y después: ruido de fondo en las pausas (dBFS), nivel de voz,
SNR y ancho de banda (kHz hasta donde llega el espectro).
"""

import os
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import soundfile as sf

RAIZ = Path(__file__).resolve().parent.parent  # la carpeta voz/ del repo
RESTAURACION_NIVEL_DEFAULT = 0.7  # fuerza del modelo (lambd 0,2..0,9); el temblor se ataca con tau/nfe en el corredor


@dataclass(frozen=True)
class Calidad:
    ruido_dbfs: float  # RMS del 5 % de ventanas más silenciosas: el fondo en las pausas
    voz_dbfs: float  # RMS del 20 % de ventanas más fuertes
    snr_db: float
    ancho_banda_khz: float  # hasta dónde llega el espectro (a 45 dB del pico de la voz)


def nivel_de_restauracion(entorno: dict | None = None) -> float:
    entorno = os.environ if entorno is None else entorno
    crudo = (entorno.get("RESTAURACION_NIVEL") or "").strip()
    try:
        return min(1.0, max(0.0, float(crudo))) if crudo else RESTAURACION_NIVEL_DEFAULT
    except ValueError:
        return RESTAURACION_NIVEL_DEFAULT


def python_de_restaurar() -> Path:
    venv = RAIZ / "herramientas" / "restaurar" / ".venv"
    for c in (venv / "Scripts" / "python.exe", venv / "bin" / "python"):
        if c.exists():
            return c
    raise FileNotFoundError(
        "no está el venv de restauración: `python -m venv herramientas/restaurar/.venv` y "
        "`herramientas\\restaurar\\.venv\\Scripts\\pip install -r herramientas/restaurar/requirements.txt`"
    )


def medir_calidad(audio: np.ndarray, tasa: int) -> Calidad:
    """Ruido en las pausas, nivel de voz, SNR y ancho de banda."""
    if len(audio) < tasa:
        return Calidad(-99.0, -99.0, 0.0, 0.0)
    v = int(tasa * 0.05)
    n = len(audio) // v
    rms = np.sqrt(np.mean(audio[: n * v].reshape(n, v) ** 2, axis=1))
    db = lambda x: float(20 * np.log10(max(float(x), 1e-9)))  # noqa: E731
    ruido, voz = db(np.percentile(rms, 5)), db(np.percentile(rms, 80))
    N = 4096
    m = len(audio) // N
    espectro = np.abs(np.fft.rfft(audio[: m * N].reshape(m, N) * np.hanning(N), axis=1)) ** 2
    psd = 10 * np.log10(np.maximum(espectro.mean(axis=0), 1e-12))
    psd = np.convolve(psd, np.ones(9) / 9, mode="same")
    f = np.fft.rfftfreq(N, 1 / tasa)
    pico = psd[(f > 200) & (f < 4000)].max()
    arriba = f[psd > pico - 45]
    return Calidad(round(ruido, 1), round(voz, 1), round(voz - ruido, 1), round(float(arriba.max()) / 1000, 1) if len(arriba) else 0.0)


def _leer(ruta: Path) -> tuple[np.ndarray, int]:
    audio, tasa = sf.read(str(ruta), dtype="float32")
    return (audio[:, 0] if audio.ndim == 2 else audio), tasa


def restaurar(entrada: Path, salida: Path, nivel: float | None = None, registro: Path | None = None, log=None, modelos: Path | None = None) -> dict:
    """Deja en `salida` el audio restaurado (wav 44,1 kHz) y devuelve las
    medidas antes/después. `entrada` tiene que ser wav (el que llama decodifica).
    Con nivel 0 no se toca nada: copia a 44,1 kHz sin venv ni torch (revisión 03a)."""
    nivel = nivel_de_restauracion() if nivel is None else nivel
    log = log or (lambda *a, **k: None)
    antes = medir_calidad(*_leer(entrada))
    if nivel <= 0.0:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(entrada), "-ac", "1", "-ar", "44100", "-c:a", "pcm_f32le", str(salida)], check=True)
        log(f"  restaurar {Path(entrada).name}: nivel 0, sin tocar")
        return {"nivel": 0.0, "antes": asdict(antes), "despues": asdict(antes)}
    comando = [str(python_de_restaurar()), str(RAIZ / "herramientas" / "restaurar" / "restaurar.py"), "--entrada", str(entrada), "--salida", str(salida), "--nivel", f"{nivel:.2f}"]
    entorno = {**os.environ, "PYTHONIOENCODING": "utf-8", "HF_HUB_DISABLE_SYMLINKS_WARNING": "1"}
    # Los pesos caen en CARPETA_MODELOS (el worker la pasa); si no, en lo que ya diga HF_HOME.
    if modelos:
        entorno["HF_HOME"] = str(modelos)
    elif os.environ.get("CARPETA_MODELOS"):
        entorno.setdefault("HF_HOME", os.environ["CARPETA_MODELOS"])
    proceso = subprocess.run(comando, capture_output=True, text=True, encoding="utf-8", errors="replace", env=entorno, cwd=str(RAIZ))
    if proceso.returncode != 0 or not Path(salida).exists():
        raise RuntimeError(f"restaurar falló ({proceso.returncode}):\n{(proceso.stdout + proceso.stderr)[-1500:]}")
    if registro:
        Path(registro).write_text(proceso.stdout + proceso.stderr, encoding="utf-8")
    despues = medir_calidad(*_leer(salida))
    resultado = {"nivel": nivel, "antes": asdict(antes), "despues": asdict(despues)}
    log(f"  restaurar {Path(entrada).name}: ruido {antes.ruido_dbfs} → {despues.ruido_dbfs} dBFS, ancho {antes.ancho_banda_khz} → {despues.ancho_banda_khz} kHz (nivel {nivel:.2f})")
    return resultado
