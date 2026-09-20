import httpx
import pytest

from voz import transcribir


def test_un_error_http_de_whisper_es_runtimeerror_no_systemexit(monkeypatch, tmp_path):
    # Revisión 21/09: un 429/413/5xx tiene que caer en el `except Exception`
    # de preparar_real ("sigo sin ritmo"), no tumbar el worker.
    monkeypatch.setenv("OPENAI_API_KEY", "x")
    monkeypatch.setattr(httpx, "post", lambda *a, **k: httpx.Response(429, text="rate limit"))
    audio = tmp_path / "a.wav"
    audio.write_bytes(b"RIFF")
    with pytest.raises(RuntimeError, match="429"):
        transcribir.palabras_con_tiempos(audio)
