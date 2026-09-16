"""Chatterbox Multilingual (Resemble AI, MIT). Zero-shot con una referencia de
15-30 s; `language_id="es"`. No necesita la transcripción de la referencia.

    python motores/chatterbox/generar.py --referencia REF.wav --referencia-texto REF.txt --texto TEXTO.txt --salida OUT.wav --modelos D:\vitacora-modelos

API verificada el 16/09/2026 (README de resemble-ai/chatterbox):
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    m = ChatterboxMultilingualTTS.from_pretrained(device="cuda")
    wav = m.generate(texto, language_id="es", audio_prompt_path="ref.wav")   # tasa: m.sr
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from comun import correr_motor  # noqa: E402


def cargar(args):
    import torch
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    dispositivo = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"chatterbox: cargando el modelo en {dispositivo}…", flush=True)
    modelo = ChatterboxMultilingualTTS.from_pretrained(device=dispositivo)
    referencia = str(args.referencia)

    def una(frase: str):
        return modelo.generate(frase, language_id="es", audio_prompt_path=referencia), modelo.sr

    return una


if __name__ == "__main__":
    correr_motor("chatterbox", "Chatterbox Multilingual — clonación zero-shot", cargar)
