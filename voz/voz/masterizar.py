"""Masterizar: la cadena de audio de cada frase de «Su voz» antes del mp3.

Lo que usa `procesar_frases.py`: leer cualquier audio a mono 24 kHz, limpiar
(pasa-altos 80 Hz, afftdn suave si no viene restaurado, silencio de las
puntas), nivelar la voz, limitar los picos y `loudnorm` en dos pasadas a
−19 LUFS / TP −1,5 / LRA 7 (el nivel de la casa), con medición.

Hasta el 16/10/2026 también masterizaba los capítulos del audiolibro (EQ al
sonido del narrador, pegado con pausas, `master.json`); eso se sacó.

Solo ffmpeg (subprocess), numpy y soundfile.
"""

import json
import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import soundfile as sf

TASA = 24000

OBJETIVO_LUFS = -19.0
OBJETIVO_TP = -1.5
OBJETIVO_LRA = 7.0

LIMITE_PICO_DB = -3.5  # limitador suave antes de loudnorm: deja 2 dB de aire bajo el techo de −1,5 para que trabaje en lineal

# Limpieza por pieza. `silenceremove` con stop_periods no recorta "el final" (corta
# en la primera pausa): se recorta el principio, se da vuelta, se recorta y se vuelve a dar vuelta.
_RECORTE = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.25"
FILTRO_LIMPIEZA = f"highpass=f=80,afftdn=nr=10:nf=-28:tn=1,{_RECORTE},areverse,{_RECORTE},areverse"
# Una pieza real ya restaurada con modelo (directiva 02) no necesita afftdn: solo el pasa-altos y las puntas.
FILTRO_LIMPIEZA_RESTAURADA = f"highpass=f=80,{_RECORTE},areverse,{_RECORTE},areverse"


@dataclass
class Medida:
    duracion_s: float
    rms_db: float
    pico_db: float
    ruido_db: float


# ----------------------------------------------------------------- ffmpeg ---


def _ffmpeg(*args: str) -> str:
    """Corre ffmpeg y devuelve stderr (ahí imprime loudnorm su JSON)."""
    proceso = subprocess.run(["ffmpeg", "-y", "-nostdin", "-hide_banner", *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proceso.returncode != 0:
        raise RuntimeError(f"ffmpeg falló: {' '.join(args)}\n{proceso.stderr[-1500:]}")
    return proceso.stderr


def leer(ruta: Path) -> np.ndarray:
    """Mono float32 a 24 kHz. Lo que no es wav (ogg/opus de WhatsApp, mp3) pasa
    por ffmpeg, que libsndfile no lee opus."""
    ruta = Path(ruta)
    if ruta.suffix.lower() != ".wav":
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp) / "decodificado.wav"
            _ffmpeg("-i", str(ruta), "-ac", "1", "-ar", str(TASA), str(wav))
            return leer(wav)
    audio, tasa = sf.read(str(ruta), dtype="float32")
    if audio.ndim == 2:
        audio = audio[:, 0]
    if tasa != TASA:
        n = int(round(len(audio) * TASA / tasa))
        audio = np.interp(np.linspace(0, 1, n, endpoint=False), np.linspace(0, 1, len(audio), endpoint=False), audio).astype(np.float32)
    return audio


def escribir(ruta: Path, audio: np.ndarray, subtipo: str = "PCM_16") -> Path:
    """Los intermedios van en FLOAT: la EQ puede empujar picos por encima de
    0 dBFS y en 16 bit eso clipea antes de que loudnorm lo baje."""
    ruta.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(ruta), audio, TASA, subtype=subtipo)
    return ruta


# ---------------------------------------------------------------- medir ---


def _db(x) -> float:
    return float(20 * np.log10(max(float(x), 1e-9)))


def _rms_por_ventana(audio: np.ndarray, ms: int = 50) -> np.ndarray:
    """RMS de cada ventana de `ms`; un audio más corto que una ventana es una sola."""
    v = int(TASA * ms / 1000)
    if len(audio) < v:
        return np.array([np.sqrt(np.mean(audio**2))], dtype=np.float32)
    n = len(audio) // v
    return np.sqrt(np.mean(audio[: n * v].reshape(n, v) ** 2, axis=1))


def medir(audio: np.ndarray) -> Medida:
    """Nivel (RMS), pico y piso de ruido: la ventana de 50 ms más silenciosa,
    sin contar la primera y la última (los fades)."""
    if len(audio) == 0:
        return Medida(0.0, -99.0, -99.0, -99.0)
    ventanas = _rms_por_ventana(audio)
    interior = ventanas[1:-1] if len(ventanas) > 2 else ventanas
    return Medida(
        duracion_s=round(len(audio) / TASA, 2),
        rms_db=round(_db(np.sqrt(np.mean(audio**2))), 1),
        pico_db=round(_db(np.max(np.abs(audio))), 1),
        ruido_db=round(_db(interior.min()), 1),
    )


def medir_loudnorm(ruta: Path) -> dict:
    """Primera pasada de loudnorm: LUFS integrado, pico real y LRA de entrada."""
    err = _ffmpeg("-i", str(ruta), "-af", f"loudnorm=I={OBJETIVO_LUFS}:TP={OBJETIVO_TP}:LRA={OBJETIVO_LRA}:print_format=json", "-f", "null", "-")
    datos = _json_de_loudnorm(err)
    return {"lufs": _num(datos.get("input_i")), "tp_dbtp": _num(datos.get("input_tp")), "lra": _num(datos.get("input_lra")), "_crudo": datos}


def _json_de_loudnorm(err: str) -> dict:
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", err, re.S)
    if not m:
        raise RuntimeError("loudnorm no imprimió su JSON:\n" + err[-800:])
    return json.loads(m.group(0))


def _num(x) -> float | None:
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return None if v in (float("inf"), float("-inf")) or v != v else round(v, 1)


# ---------------------------------------------------------------- limpiar ---


def limpiar_pieza(entrada: Path, salida: Path, filtro: str = FILTRO_LIMPIEZA) -> Path:
    _ffmpeg("-i", str(entrada), "-af", filtro, "-ac", "1", "-ar", str(TASA), "-c:a", "pcm_f32le", str(salida))
    return salida


# ------------------------------------------------------ nivelar / loudnorm ---


NIVEL_PIEZA_DB = -17.0  # RMS de la voz de cada pieza antes de pegar (≈ −19 LUFS con sus pausas): loudnorm después solo retoca


def nivelar(audio: np.ndarray, objetivo_db: float = NIVEL_PIEZA_DB) -> np.ndarray:
    """Todas las piezas al mismo nivel de voz antes de pegar: así loudnorm
    después solo ajusta unos dB y el LRA de entrada no dispara el modo
    dinámico. RMS sobre las ventanas con voz (las 60 % más fuertes), no
    sobre las pausas."""
    if len(audio) == 0:
        return audio
    ventanas = _rms_por_ventana(audio)
    fuertes = np.sort(ventanas)[int(len(ventanas) * 0.4) :]
    rms = float(np.sqrt(np.mean(fuertes**2))) if len(fuertes) else 0.0
    if rms <= 0:
        return audio
    return (audio * 10 ** ((objetivo_db - _db(rms)) / 20)).astype(np.float32)


def limitar_picos(entrada: Path, salida: Path) -> Path:
    """Limitador suave sobre los picos aislados (golpes de "p", clicks) que
    impedirían a loudnorm subir a −19 LUFS sin pasar el techo. Con esto la
    segunda pasada queda en modo lineal (solo ganancia) casi siempre."""
    _ffmpeg("-i", str(entrada), "-af", f"alimiter=limit={10 ** (LIMITE_PICO_DB / 20):.4f}:attack=5:release=50:level=false:latency=true",
            "-ac", "1", "-ar", str(TASA), "-c:a", "pcm_f32le", str(salida))
    return salida


def loudnorm_dos_pasadas(entrada: Path, salida: Path) -> dict:
    """Mide, y después normaliza con lo medido (linear cuando se puede: sin
    compresión, solo ganancia). Devuelve lo que informa la segunda pasada."""
    primera = medir_loudnorm(entrada)["_crudo"]
    filtro = (
        f"loudnorm=I={OBJETIVO_LUFS}:TP={OBJETIVO_TP}:LRA={OBJETIVO_LRA}"
        f":measured_I={primera['input_i']}:measured_TP={primera['input_tp']}"
        f":measured_LRA={primera['input_lra']}:measured_thresh={primera['input_thresh']}"
        f":offset={primera.get('target_offset', 0)}:linear=true:print_format=json"
    )
    err = _ffmpeg("-i", str(entrada), "-af", filtro, "-ac", "1", "-ar", str(TASA), str(salida))
    segunda = _json_de_loudnorm(err)
    return {
        "antes": {"lufs": _num(primera["input_i"]), "tp_dbtp": _num(primera["input_tp"]), "lra": _num(primera["input_lra"])},
        "despues": {"lufs": _num(segunda.get("output_i")), "tp_dbtp": _num(segunda.get("output_tp")), "lra": _num(segunda.get("output_lra"))},
        "modo": segunda.get("normalization_type", "?"),  # "linear" (solo ganancia) o "dynamic" (comprimió para llegar al LRA)
    }
