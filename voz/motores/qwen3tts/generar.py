"""Qwen3-TTS 1.7B Base (Alibaba, Apache 2.0). Zero-shot con referencia + su
transcripción; `language="Spanish"`.

    python motores/qwen3tts/generar.py --referencia REF.wav --referencia-texto REF.txt --texto TEXTO.txt --salida OUT.wav --modelos D:\vitacora-modelos

API verificada el 16/09/2026 (README de QwenLM/Qwen3-TTS):
    from qwen_tts import Qwen3TTSModel
    m = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-Base", device_map="cuda:0", dtype=torch.bfloat16)
    wavs, sr = m.generate_voice_clone(text=..., language="Spanish", ref_audio="ref.wav", ref_text="...")
Sin `attn_implementation="flash_attention_2"`: flash-attn no compila fácil en
Windows; sin él usa más VRAM pero anda en 8 GB.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from comun import correr_motor, texto_de  # noqa: E402

MODELO = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"


def cargar(args):
    import torch
    from qwen_tts import Qwen3TTSModel

    print(f"qwen3tts: cargando {MODELO}…", flush=True)
    modelo = Qwen3TTSModel.from_pretrained(MODELO, device_map="cuda:0", dtype=torch.bfloat16)
    referencia = str(args.referencia)
    referencia_texto = texto_de(args.referencia_texto)

    def una(frase: str):
        wavs, sr = modelo.generate_voice_clone(text=frase, language="Spanish", ref_audio=referencia, ref_text=referencia_texto)
        return wavs[0], sr

    return una


if __name__ == "__main__":
    correr_motor("qwen3tts", "Qwen3-TTS — clonación zero-shot", cargar)
