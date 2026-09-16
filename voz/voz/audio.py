"""Lo que se hace con ffmpeg: limpiar, recortar, pegar con pausas, pasar a mp3.

Todo por subprocess sobre el ffmpeg del sistema (en la PC está en el PATH).
Cada función devuelve la ruta de salida para poder encadenarlas.
"""

import subprocess
import tempfile
from pathlib import Path

TASA = 24000  # lo que esperan los motores; la salida final también va así

# Silencios de los bordes fuera, volumen parejo (-19 LUFS es voz hablada cómoda).
_FILTRO_LIMPIEZA = (
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.2:"
    "stop_periods=1:stop_threshold=-45dB:stop_silence=0.2,"
    "loudnorm=I=-19:TP=-1.5:LRA=11"
)


def _ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True, capture_output=True, text=True)


def duracion(ruta: Path) -> float:
    salida = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(ruta)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(salida)


def a_wav_limpio(entrada: Path, salida: Path) -> Path:
    """Mono 24 kHz, sin silencio en los bordes, volumen normalizado."""
    _ffmpeg("-i", str(entrada), "-af", _FILTRO_LIMPIEZA, "-ac", "1", "-ar", str(TASA), str(salida))
    return salida


def recortar(entrada: Path, salida: Path, segundos: float) -> Path:
    _ffmpeg("-i", str(entrada), "-t", f"{segundos:.3f}", "-ac", "1", "-ar", str(TASA), str(salida))
    return salida


def pegar_con_pausas(clips: list[Path], salida: Path, pausa_ms: int = 350) -> Path:
    """Concatena los clips con un silencio de `pausa_ms` entre cada par."""
    if not clips:
        raise ValueError("no hay clips para pegar")
    with tempfile.TemporaryDirectory() as tmp:
        silencio = Path(tmp) / "silencio.wav"
        _ffmpeg("-f", "lavfi", "-i", f"anullsrc=r={TASA}:cl=mono", "-t", f"{pausa_ms / 1000:.3f}", str(silencio))
        lista = Path(tmp) / "lista.txt"
        lineas = []
        for i, clip in enumerate(clips):
            # El demuxer concat exige la misma tasa y canales en todos: se
            # normaliza cada clip antes (los motores no siempre salen a 24 kHz).
            normal = Path(tmp) / f"clip_{i:04d}.wav"
            _ffmpeg("-i", str(clip), "-ac", "1", "-ar", str(TASA), str(normal))
            if i:
                lineas.append(f"file '{silencio.as_posix()}'")
            lineas.append(f"file '{normal.as_posix()}'")
        lista.write_text("\n".join(lineas) + "\n", encoding="utf-8")
        _ffmpeg("-f", "concat", "-safe", "0", "-i", str(lista), "-ac", "1", "-ar", str(TASA), str(salida))
    return salida


def a_mp3(entrada: Path, salida: Path) -> Path:
    _ffmpeg("-i", str(entrada), "-ac", "1", "-b:a", "128k", str(salida))
    return salida
