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

from voz.pausas import modo_tramos, pausas_ms  # noqa: E402
from voz.texto import Tramo, partir_en_frases, partir_en_tramos  # noqa: E402

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


# Post-proceso de cada frase antes de pegar (central, 19/09). Medido sobre el
# libro de Joaquín: los motores siguen emitiendo sonido hasta el último instante
# (colas a -21…-28 dB, apenas por debajo de la voz) y el pegado cortaba eso en
# seco contra 350 ms de ceros: se oía como "ruido raro" al final de cada frase.
# Además el RMS variaba hasta 5 dB entre frases consecutivas ("cambia de sonido").
UMBRAL_VOZ_DB = -38.0  # por debajo de esto, y a más de 30 dB del pico de la frase, no es voz
COLCHON_MS = 80  # lo que se deja después de la última voz
FADE_IN_MS, FADE_OUT_MS = 12, 60
RMS_OBJETIVO_DB = -20.0
_VENTANA_MS = 20


def _db(x: np.ndarray | float) -> np.ndarray | float:
    return 20 * np.log10(np.maximum(x, 1e-9))


def recortar_cola(clip: np.ndarray, tasa: int = TASA_SALIDA) -> np.ndarray:
    """Corta lo que hay antes de la primera voz y después de la última (más un
    colchón). Voz = ventana de 20 ms por encima del umbral."""
    v = int(tasa * _VENTANA_MS / 1000)
    n = len(clip) // v
    if n == 0:
        return clip
    envolvente = _db(np.sqrt(np.mean(clip[: n * v].reshape(n, v) ** 2, axis=1)))
    umbral = max(UMBRAL_VOZ_DB, float(envolvente.max()) - 30)
    con_voz = np.where(envolvente > umbral)[0]
    if len(con_voz) == 0:
        # Ninguna ventana con voz (frase de solo puntuación, respiración):
        # vacía, así emparejar_volumen no la sube a volumen de voz.
        return clip[:0]
    colchon = int(tasa * COLCHON_MS / 1000)
    ini = max(0, con_voz[0] * v - colchon)
    fin = min(len(clip), (con_voz[-1] + 1) * v + colchon)
    return clip[ini:fin]


def fundir_bordes(clip: np.ndarray, tasa: int = TASA_SALIDA) -> np.ndarray:
    """Fade in corto y fade out un poco más largo: la voz no aparece ni desaparece de golpe."""
    clip = clip.copy()
    fi = min(int(tasa * FADE_IN_MS / 1000), len(clip) // 4)
    fo = min(int(tasa * FADE_OUT_MS / 1000), len(clip) // 4)
    if fi:
        clip[:fi] *= np.linspace(0.0, 1.0, fi, dtype=np.float32)
    if fo:
        clip[-fo:] *= np.linspace(1.0, 0.0, fo, dtype=np.float32)
    return clip


def emparejar_volumen(clip: np.ndarray, objetivo_db: float = RMS_OBJETIVO_DB) -> np.ndarray:
    """Todas las frases al mismo RMS, sin pasar el pico de 0,98."""
    rms = float(np.sqrt(np.mean(clip**2))) if len(clip) else 0.0
    if rms <= 0:
        return clip
    ganancia = 10 ** ((objetivo_db - _db(rms)) / 20)
    ganancia = min(ganancia, 0.98 / (float(np.max(np.abs(clip))) + 1e-9))
    return (clip * ganancia).astype(np.float32)


def limpiar_frase(clip: np.ndarray, tasa: int = TASA_SALIDA) -> np.ndarray:
    """Lo que se le hace a cada frase antes de pegarla: recortar, fundir, emparejar."""
    return emparejar_volumen(fundir_bordes(recortar_cola(clip, tasa), tasa))


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


# --- pausas por puntuación (central 19/09, punto 6) ---
# El motor no decide las pausas: cada tramo viene con el signo que lo cerró y
# acá se pone el silencio que le toca, siempre el mismo (voz/pausas.py).
PAUSA_INTERNA_MIN_MS = 120  # una pausa que hizo el motor dentro de un tramo, para igualarla
# Pausa = aire del motor, no voz floja: umbral absoluto (revisión 20/09). Con la
# frase ya a −20 dB RMS, una "s" final o una sílaba átona anda por −30…−40 dBFS;
# lo que el motor deja entre comas, por debajo de −55.
UMBRAL_PAUSA_DB = -50.0


def pegar_tramos(clips: list[np.ndarray], cierres: list[str], pausas: dict[str, int], tasa: int = TASA_SALIDA) -> np.ndarray:
    """Concatena; después del clip i va el silencio de `pausas[cierres[i]]`.
    El cierre del último tramo no importa (no sigue nada). Un clip vacío
    (frase sin voz) no aporta audio pero sí su pausa."""
    if not clips:
        raise ValueError("no hay frases generadas")
    if len(cierres) != len(clips):
        raise ValueError("cada clip necesita su cierre")
    partes: list[np.ndarray] = []
    for i, (clip, cierre) in enumerate(zip(clips, cierres)):
        partes.append(clip)
        if i < len(clips) - 1:
            ms = pausas.get(cierre, pausas.get("ninguno", PAUSA_FRASE_MS))
            partes.append(np.zeros(int(tasa * ms / 1000), dtype=np.float32))
    return np.concatenate(partes)


def pausas_internas(clip: np.ndarray, tasa: int = TASA_SALIDA, minimo_ms: int = PAUSA_INTERNA_MIN_MS) -> list[tuple[int, int]]:
    """(inicio, fin) en muestras de cada silencio de al menos `minimo_ms` que el
    motor dejó dentro del clip (sin contar los bordes)."""
    v = int(tasa * _VENTANA_MS / 1000)
    n = len(clip) // v
    if n < 3:
        return []
    envolvente = _db(np.sqrt(np.mean(clip[: n * v].reshape(n, v) ** 2, axis=1)))
    callado = envolvente <= UMBRAL_PAUSA_DB
    minimo = max(1, int(round(minimo_ms / _VENTANA_MS)))
    pausas: list[tuple[int, int]] = []
    i = 0
    while i < n:
        if callado[i]:
            j = i
            while j < n and callado[j]:
                j += 1
            if j - i >= minimo and i > 0 and j < n:  # solo las internas
                pausas.append((i * v, j * v))
            i = j
        else:
            i += 1
    return pausas


def igualar_pausas_internas(clip: np.ndarray, objetivo_ms: int, tasa: int = TASA_SALIDA) -> np.ndarray:
    """Modo (a): el tramo es una oración entera y las comas las pausó el motor a
    su gusto. Cada pausa interna se lleva exactamente a `objetivo_ms`: si era
    más larga se le saca el medio, si era más corta se le mete silencio en el
    medio. Se conserva el aire del motor a los dos lados (no ceros digitales:
    revisión 20/09), con un fundido corto a cada lado."""
    pausas = pausas_internas(clip, tasa)
    if not pausas:
        return clip
    objetivo = int(tasa * objetivo_ms / 1000)
    borde = min(int(tasa * 0.010), objetivo // 4)
    partes: list[np.ndarray] = []
    cursor = 0
    for ini, fin in pausas:
        voz = clip[cursor:ini].copy()
        if borde and len(voz) > borde:
            voz[-borde:] *= np.linspace(1.0, 0.0, borde, dtype=np.float32)
        partes.append(voz)
        aire = clip[ini:fin]
        mitad = objetivo // 2
        if len(aire) >= objetivo:
            pausa = np.concatenate([aire[:mitad], aire[len(aire) - (objetivo - mitad) :]])
        else:
            corte = len(aire) // 2
            pausa = np.concatenate([aire[:corte], np.zeros(objetivo - len(aire), dtype=np.float32), aire[corte:]])
        partes.append(pausa.astype(np.float32))
        cursor = fin
    resto = clip[cursor:].copy()
    if borde and len(resto) > borde:
        resto[:borde] *= np.linspace(0.0, 1.0, borde, dtype=np.float32)
    partes.append(resto)
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
    a 24 kHz, se limpia (cola, bordes, volumen) y se pega todo con pausas. El log
    es una línea por frase."""
    clips = []
    for i, frase in enumerate(frases, 1):
        log(f"  frase {i}/{len(frases)}: {frase[:60]}{'…' if len(frase) > 60 else ''}", flush=True)
        audio, tasa = generar_una(frase)
        clips.append(limpiar_frase(remuestrear(a_mono_float(audio), int(tasa))))
    return pegar_frases(clips)


def narrar_tramos(tramos: list[Tramo], generar_una, pausas: dict[str, int], modo: str, log=print) -> np.ndarray:
    """Como `narrar_frase_a_frase`, pero la pausa después de cada tramo la pone
    su cierre, y en modo "oracion" las pausas que el motor dejó dentro del
    tramo (las comas) se igualan a `pausas["coma"]`."""
    clips = []
    for i, tramo in enumerate(tramos, 1):
        log(f"  tramo {i}/{len(tramos)} [{tramo.cierre}]: {tramo.texto[:60]}{'…' if len(tramo.texto) > 60 else ''}", flush=True)
        audio, tasa = generar_una(tramo.texto)
        clip = limpiar_frase(remuestrear(a_mono_float(audio), int(tasa)))
        if modo == "oracion":
            clip = igualar_pausas_internas(clip, pausas["coma"])
        clips.append(clip)
    return pegar_tramos(clips, [t.cierre for t in tramos], pausas)


def correr_motor(nombre: str, descripcion: str, cargar, log=print) -> None:
    """El `main` de cada motor: args → cargar(args) devuelve `generar_una` →
    narrar → escribir. `cargar` recibe los args ya parseados (con HF_HOME puesto).
    Las pausas y el modo de corte salen de voz/pausas.py (y de .env si Naza los
    pisó); el worker los pasa por el entorno del subproceso."""
    import time

    args = leer_args(descripcion)
    preparar_entorno_modelos(args.modelos)
    t0 = time.time()
    generar_una = cargar(args)
    log(f"{nombre}: modelo listo en {time.time() - t0:.0f} s", flush=True)
    pausas, modo = pausas_ms(), modo_tramos()
    tramos = partir_en_tramos(args.texto.read_text(encoding="utf-8"), modo=modo)
    log(f"{nombre}: {len(tramos)} tramos (modo {modo}; pausas " + ", ".join(f"{k}={v}" for k, v in pausas.items()) + ")", flush=True)
    t0 = time.time()
    audio = narrar_tramos(tramos, generar_una, pausas, modo, log=log)
    escribir_wav(args.salida, audio)
    log(f"{nombre}: {len(tramos)} tramos, {len(audio) / TASA_SALIDA:.1f} s de audio en {time.time() - t0:.0f} s → {args.salida}", flush=True)
