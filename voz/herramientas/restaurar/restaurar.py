"""Restaurar una nota de voz con resemble-enhance (denoise + enhance a 44,1 kHz).
Corre en SU venv (`herramientas/restaurar/.venv`), llamado por `voz/restaurar.py`.

    python herramientas/restaurar/restaurar.py --entrada in.wav --salida out.wav --nivel 0.85

`--nivel` 0..1 gradúa cuánto trabaja el modelo (su fuerza de denoise, `lambd`):
la voz tiene que seguir siendo la de él, no "de locutor". 0 = no se toca.
La salida es wav mono 44,1 kHz float, SIEMPRE 100 % restaurada.

NUNCA mezclar en el tiempo la salida con la entrada (lo hice el 19/09 y sonó
"muy malo"): el enhancer re-sintetiza la voz con un vocoder y la onda que
devuelve no está en fase con la original (correlación medida: 0,00; 51 % de
las ventanas se cancelan). Sumarlas da una voz doblada y hueca, aunque el
espectro promedio parezca normal.

Notas de la PC de música (19/09/2026):
- deepspeed no compila en Windows y solo sirve para entrenar: en este venv hay
  un stub (`site-packages/deepspeed/`) que deja importar la inferencia.
- El hparams.yaml del modelo trae rutas PosixPath: se mapea a WindowsPath.
- numpy < 2 (resemble-enhance hace float() sobre arrays de un elemento).
- torchaudio nuevo pide torchcodec para cargar wav: se carga con soundfile.
"""

import argparse
import os
import pathlib
import sys
import time

import numpy as np
import soundfile as sf

# HF_HOME lo pone quien llama (voz/restaurar.py, desde CARPETA_MODELOS); sin eso, el default de Hugging Face.
if os.name == "nt":
    pathlib.PosixPath = pathlib.WindowsPath  # el hparams.yaml del modelo trae PosixPath; solo hace falta en Windows

TASA_SALIDA = 44100
NFE = 64  # pasos del solver; 64 (el doble del default) tiembla menos, cuesta ~30 % más de GPU
LAMBD_MIN, LAMBD_MAX = 0.2, 0.9  # `--nivel` recorre este rango: cuánto denoise mete el enhancer
TAU = 0.3  # temperatura del prior; 0,5 es el default, más bajo = menos aleatorio = menos temblor


def remuestrear(audio: np.ndarray, tasa: int, tasa_nueva: int) -> np.ndarray:
    if tasa == tasa_nueva:
        return audio
    import torch
    import torchaudio.functional as F

    return F.resample(torch.from_numpy(audio).unsqueeze(0), tasa, tasa_nueva)[0].numpy()


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--entrada", required=True)
    p.add_argument("--salida", required=True)
    p.add_argument("--nivel", type=float, default=0.7)
    args = p.parse_args()

    audio, tasa = sf.read(args.entrada, dtype="float32")
    if audio.ndim == 2:
        audio = audio[:, 0]
    nivel = min(1.0, max(0.0, args.nivel))
    if nivel == 0.0:
        original = remuestrear(audio, tasa, TASA_SALIDA).astype(np.float32)
        sf.write(args.salida, original, TASA_SALIDA, subtype="FLOAT")
        print(f"restaurar: nivel 0, copia sin tocar ({len(original) / TASA_SALIDA:.1f} s)", flush=True)
        return

    import torch
    from resemble_enhance.enhancer.inference import enhance

    dispositivo = "cuda" if torch.cuda.is_available() else "cpu"
    lambd = LAMBD_MIN + (LAMBD_MAX - LAMBD_MIN) * nivel
    t0 = time.time()
    restaurado, tasa_r = enhance(torch.from_numpy(audio), tasa, dispositivo, nfe=NFE, solver="midpoint", lambd=lambd, tau=TAU)
    restaurado = remuestrear(restaurado.cpu().numpy().astype(np.float32), tasa_r, TASA_SALIDA)
    sf.write(args.salida, restaurado, TASA_SALIDA, subtype="FLOAT")
    print(
        f"restaurar: {len(audio) / tasa:.1f} s en {time.time() - t0:.1f} s ({dispositivo}), nivel {nivel:.2f} "
        f"(lambd {lambd:.2f}, tau {TAU}, nfe {NFE}), 100 % restaurado → {args.salida}",
        flush=True,
    )


if __name__ == "__main__":
    sys.exit(main())
