import shutil
import subprocess

import pytest

from voz.audio import a_mp3

pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="hace falta ffmpeg")


def test_a_mp3_deja_un_mp3_mono(tmp_path):
    wav = tmp_path / "tono.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=1.5", "-ac", "2", str(wav)],
        check=True,
    )
    mp3 = a_mp3(wav, tmp_path / "tono.mp3")
    assert mp3.stat().st_size > 1000
    canales = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=channels", "-of", "csv=p=0", str(mp3)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    assert canales == "1"
