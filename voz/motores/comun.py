"""Lo que comparten los cuatro `generar.py`: leer los argumentos, partir el texto
en frases, pegar las frases con pausas y escribir el wav final a 24 kHz.

Cada motor corre en su propio venv (sus dependencias no conviven), así que este
módulo solo usa numpy y soundfile, que están en todos. Lo importan con
`sys.path.insert(0, raíz de voz/)`.
"""

import argparse
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

RAIZ = Path(__file__).resolve().parent.parent  # la carpeta voz/ del repo
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from voz.texto import partir_en_frases  # noqa: E402

TASA_SALIDA = 24000
PAUSA_FRASE_MS = 350


def leer_args(descripcion: str) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=descripcion)
    p.add_argument("--referencia", required=True, type=Path, help="wav con la voz a clonar (15-30 s)")
    p.add_argument("--referencia-texto", required=True, type=Path, help="txt con lo que dice la referencia")
    p.add_argument("--texto", required=True, type=Path, help="txt con el párrafo a narrar")
    p.add_argument("--salida", required=True, type=Path, help="wav de salida (24 kHz mono)")
    p.add_argument("--modelos", type=Path, default=None, help="carpeta donde caen los pesos (HF_HOME)")
    return p.parse_args()


def frases_del_texto(ruta: Path) -> list[str]:
    return partir_en_frases(ruta.read_text(encoding="utf-8"))


def texto_de(ruta: Path) -> str:
    return ruta.read_text(encoding="utf-8").strip()


def a_mono_float(audio) -> np.ndarray:
    """Cualquier cosa que devuelva un motor (torch o numpy, (T,) o (1,T)) a float32 (T,)."""
    if hasattr(audio, "detach"):
        audio = audio.detach().cpu().numpy()
    audio = np.asarray(audio, dtype=np.float32)
    if audio.ndim == 2:
        audio = audio[0] if audio.shape[0] < audio.shape[1] else audio[:, 0]
    return audio


def remuestrear(audio: np.ndarray, tasa: int, tasa_nueva: int = TASA_SALIDA) -> np.ndarray:
    if tasa == tasa_nueva:
        return audio
    n = int(round(len(audio) * tasa_nueva / tasa))
    x_viejo = np.linspace(0.0, 1.0, num=len(audio), endpoint=False)
    x_nuevo = np.linspace(0.0, 1.0, num=n, endpoint=False)
    return np.interp(x_nuevo, x_viejo, audio).astype(np.float32)


def pegar_frases(clips: list[np.ndarray], tasa: int = TASA_SALIDA, pausa_ms: int = PAUSA_FRASE_MS) -> np.ndarray:
    """Concatena con un silencio de `pausa_ms` entre frases."""
    if not clips:
        raise ValueError("no hay frases generadas")
    silencio = np.zeros(int(tasa * pausa_ms / 1000), dtype=np.float32)
    partes: list[np.ndarray] = []
    for i, clip in enumerate(clips):
        if i:
            partes.append(silencio)
        partes.append(clip)
    return np.concatenate(partes)


def escribir_wav(ruta: Path, audio: np.ndarray, tasa: int = TASA_SALIDA) -> Path:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    pico = float(np.max(np.abs(audio))) if len(audio) else 0.0
    if pico > 0.99:
        audio = audio * (0.99 / pico)
    sf.write(str(ruta), audio, tasa, subtype="PCM_16")
    return ruta


def preparar_entorno_modelos(modelos: Path | None) -> None:
    """Que los pesos caigan en CARPETA_MODELOS (el HDD de la PC), no en C:."""
    import os

    if modelos:
        modelos.mkdir(parents=True, exist_ok=True)
        os.environ.setdefault("HF_HOME", str(modelos))
        os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")


def narrar_frase_a_frase(frases: list[str], generar_una, log=print) -> np.ndarray:
    """El bucle común: `generar_una(frase) -> (audio, tasa)`; cada frase se lleva
    a 24 kHz y se pega todo con pausas. El log es una línea por frase."""
    clips = []
    for i, frase in enumerate(frases, 1):
        log(f"  frase {i}/{len(frases)}: {frase[:60]}{'…' if len(frase) > 60 else ''}", flush=True)
        audio, tasa = generar_una(frase)
        clips.append(remuestrear(a_mono_float(audio), int(tasa)))
    return pegar_frases(clips)


def correr_motor(nombre: str, descripcion: str, cargar, log=print) -> None:
    """El `main` de cada motor: args → cargar(args) devuelve `generar_una` →
    narrar → escribir. `cargar` recibe los args ya parseados (con HF_HOME puesto)."""
    import time

    args = leer_args(descripcion)
    preparar_entorno_modelos(args.modelos)
    t0 = time.time()
    generar_una = cargar(args)
    log(f"{nombre}: modelo listo en {time.time() - t0:.0f} s", flush=True)
    frases = frases_del_texto(args.texto)
    t0 = time.time()
    audio = narrar_frase_a_frase(frases, generar_una, log=log)
    escribir_wav(args.salida, audio)
    log(f"{nombre}: {len(frases)} frases, {len(audio) / TASA_SALIDA:.1f} s de audio en {time.time() - t0:.0f} s → {args.salida}", flush=True)
