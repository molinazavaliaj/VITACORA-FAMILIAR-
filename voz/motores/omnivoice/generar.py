"""OmniVoice (k2-fsa / Next-gen Kaldi, Apache 2.0). Zero-shot con una referencia
de 3-10 s y su transcripción; 600+ idiomas. Lo trajo Naza de un reel el 16/09.

    python motores/omnivoice/generar.py --referencia REF.wav --referencia-texto REF.txt --texto TEXTO.txt --salida OUT.wav --modelos D:\vitacora-modelos

API verificada el 16/09/2026 (README de k2-fsa/OmniVoice):
    from omnivoice import OmniVoice
    m = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cuda:0", dtype=torch.float16)
    audios = m.generate(text=..., ref_audio="ref.wav", ref_text="...")   # lista de arrays (T,) a 24 kHz
Advertencia de sus autores: entrenado sobre todo en chino e inglés; la clonación
entre idiomas puede salir con acento. Por eso se escucha antes de elegir.

OmniVoice pide referencias cortas (3-10 s; más largas bajan la calidad): acá se
usan los primeros 8 s de la referencia y la parte de la transcripción que
corresponde no se puede saber exacta, así que se deja que la transcriba el
propio modelo (ref_text omitido → usa Whisper interno).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from comun import correr_motor  # noqa: E402

MODELO = "k2-fsa/OmniVoice"
SEGUNDOS_REFERENCIA = 8.0


def recortar_referencia(referencia: Path, segundos: float) -> Path:
    import numpy as np
    import soundfile as sf

    audio, sr = sf.read(str(referencia), dtype="float32")
    if audio.ndim == 2:
        audio = audio[:, 0]
    corta = referencia.with_name(f"{referencia.stem}_omnivoice_{int(segundos)}s.wav")
    sf.write(str(corta), np.asarray(audio[: int(sr * segundos)]), sr)
    return corta


def cargar(args):
    import torch
    from omnivoice import OmniVoice

    print(f"omnivoice: cargando {MODELO}…", flush=True)
    modelo = OmniVoice.from_pretrained(MODELO, device_map="cuda:0", dtype=torch.float16)
    referencia = str(recortar_referencia(args.referencia, SEGUNDOS_REFERENCIA))

    def una(frase: str):
        audios = modelo.generate(text=frase, ref_audio=referencia)
        return audios[0], 24000

    return una


if __name__ == "__main__":
    correr_motor("omnivoice", "OmniVoice — clonación zero-shot", cargar)
