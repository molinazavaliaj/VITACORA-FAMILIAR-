"""F5-TTS (MIT) con un checkpoint comunitario en español, en zero-shot
(referencia + su transcripción). El afinado con los 10-15 min del narrador
queda para una segunda vuelta si F5 gana o empata.

    python motores/f5tts/generar.py --referencia REF.wav --referencia-texto REF.txt --texto TEXTO.txt --salida OUT.wav --modelos D:\vitacora-modelos

API (paquete `f5-tts`, `src/f5_tts/api.py`):
    from f5_tts.api import F5TTS
    f5 = F5TTS(model="F5TTS_Base", ckpt_file=..., vocab_file=..., hf_cache_dir=...)
    wav, sr, _ = f5.infer(ref_file=..., ref_text=..., gen_text=...)

Checkpoint en español: `jpgallegoar/F5-Spanish` en Hugging Face (arquitectura
F5TTS_Base). Se baja con `snapshot_download` a la carpeta de modelos la primera
vez. Si ese repo cambia de nombre o de archivos, el error sale acá con la ruta.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from comun import correr_motor, texto_de  # noqa: E402

REPO_ESPANOL = "jpgallegoar/F5-Spanish"


def bajar_checkpoint_espanol(modelos: Path | None) -> tuple[Path, Path | None]:
    from huggingface_hub import snapshot_download

    carpeta = Path(snapshot_download(REPO_ESPANOL, cache_dir=str(modelos) if modelos else None))
    ckpts = sorted(carpeta.rglob("*.safetensors")) + sorted(carpeta.rglob("*.pt"))
    if not ckpts:
        raise SystemExit(f"f5tts: no encontré un checkpoint (.safetensors/.pt) en {carpeta}")
    vocabs = sorted(carpeta.rglob("vocab.txt"))
    return ckpts[0], (vocabs[0] if vocabs else None)


def cargar(args):
    from f5_tts.api import F5TTS

    print(f"f5tts: bajando/ubicando {REPO_ESPANOL}…", flush=True)
    ckpt, vocab = bajar_checkpoint_espanol(args.modelos)
    print(f"f5tts: checkpoint {ckpt.name}, vocab {vocab.name if vocab else '(por defecto)'}", flush=True)
    f5 = F5TTS(
        model="F5TTS_Base",
        ckpt_file=str(ckpt),
        vocab_file=str(vocab) if vocab else "",
        hf_cache_dir=str(args.modelos) if args.modelos else None,
    )
    referencia = str(args.referencia)
    referencia_texto = texto_de(args.referencia_texto)

    def una(frase: str):
        wav, sr, _ = f5.infer(ref_file=referencia, ref_text=referencia_texto, gen_text=frase)
        return wav, sr

    return una


if __name__ == "__main__":
    correr_motor("f5tts", "F5-TTS (checkpoint español) — clonación zero-shot", cargar)
