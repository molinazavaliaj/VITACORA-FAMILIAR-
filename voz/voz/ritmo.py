"""El ritmo de un audio original (directiva 02, parte B): con las marcas de
tiempo por palabra de Whisper se arreglan dos cosas, sin cortar nunca voz.

1. El arranque que responde a la pregunta ("Sí, exacto…", "No, no recuerdo…",
   "Bueno, …"): se corta hasta la primera coma o punto, solo si eso dura menos
   de 2,5 s. Qué arranques cuentan está en `ARRANQUES_A_CORTAR` (Naza la edita).
2. Los silencios internos de más de 1,5 s se llevan a 0,7 s.

Lógica pura: `plan_de_ritmo` decide qué cortar mirando texto y marcas;
`aplicar_plan` corta el audio con fundidos. Las muletillas ("eh", "este") no se
tocan todavía: primero que Naza escuche la v2.
"""

import re
from dataclasses import dataclass, field

import numpy as np

# Palabras con las que una respuesta arranca contestándole al entrevistador.
# Se compara la primera palabra, en minúsculas y sin puntuación.
# Revisión 20/09: fuera "y", "o", "a", "si", "tal" — "Y mi papá…", "Si mal no
# recuerdo…", "Tal vez…" son la historia, no una respuesta al entrevistador.
ARRANQUES_A_CORTAR = (
    "sí", "no", "bueno", "claro", "exacto", "dale", "eh", "este", "mirá", "mira",
    "bien", "ok", "okay", "obvio",
)
CORTE_ARRANQUE_MAX_S = 2.5  # más largo que esto ya es contenido, no un "sí, claro"
SILENCIO_MAX_S = 1.5  # una pausa interna más larga que esto se acorta…
SILENCIO_OBJETIVO_S = 0.7  # …a esto
FADE_IN_MS = 12  # al arranque, después del corte
FADE_MS = 40  # a cada lado de un silencio acortado

_PUNTUACION = re.compile(r"[,;:.!?…]")


@dataclass(frozen=True)
class Plan:
    corte_arranque_s: float = 0.0  # cuánto se saca del principio
    silencios: list[tuple[float, float]] = field(default_factory=list)  # (inicio, fin) de cada tramo de silencio que se saca
    arranque: str = ""  # las palabras que se sacaron, para el registro


def _limpia(palabra: str) -> str:
    return _PUNTUACION.sub("", palabra).strip().lower()


def corte_de_arranque(texto: str, palabras: list[dict], arranques: tuple[str, ...] = ARRANQUES_A_CORTAR) -> tuple[float, str]:
    """Cuántos segundos sacar del principio y qué palabras son. 0 si no aplica.

    `texto` es la transcripción con puntuación (de Whisper); `palabras` las
    marcas por palabra, sin puntuación. Se avanza de signo en signo mientras
    el tramo empiece con una palabra de `arranques` ("Sí, exacto, claramente…"
    corta "Sí, exacto,") y todo dure menos de CORTE_ARRANQUE_MAX_S contado
    desde la primera palabra (el silencio inicial no cuenta y se va igual)."""
    if not palabras or not texto.strip():
        return 0.0, ""
    if _limpia(palabras[0]["palabra"]) not in arranques:
        return 0.0, ""
    inicio = palabras[0]["inicio"]
    cuantas = 0
    pos = 0
    while True:
        m = _PUNTUACION.search(texto, pos)
        if not m:
            break
        tramo = texto[pos : m.start()].split()
        if not tramo or _limpia(tramo[0]) not in arranques:
            break
        candidatas = cuantas + len(tramo)
        if candidatas > len(palabras) or palabras[candidatas - 1]["fin"] - inicio > CORTE_ARRANQUE_MAX_S:
            break
        cuantas = candidatas
        pos = m.end()
    if cuantas == 0:
        return 0.0, ""
    return palabras[cuantas - 1]["fin"], " ".join(w["palabra"] for w in palabras[:cuantas])


def silencios_largos(palabras: list[dict], maximo_s: float = SILENCIO_MAX_S, objetivo_s: float = SILENCIO_OBJETIVO_S) -> list[tuple[float, float]]:
    """Entre dos palabras consecutivas con más de `maximo_s` de silencio, el
    tramo que se saca para que quede `objetivo_s` (la mitad a cada lado)."""
    salida = []
    for a, b in zip(palabras, palabras[1:]):
        hueco = b["inicio"] - a["fin"]
        if hueco > maximo_s:
            sobra = hueco - objetivo_s
            ini = a["fin"] + objetivo_s / 2
            salida.append((round(ini, 3), round(ini + sobra, 3)))
    return salida


def plan_de_ritmo(texto: str, palabras: list[dict], arranques: tuple[str, ...] = ARRANQUES_A_CORTAR) -> Plan:
    corte, que = corte_de_arranque(texto, palabras, arranques)
    silencios = [(i, f) for i, f in silencios_largos(palabras) if i >= corte]
    return Plan(corte_arranque_s=corte, silencios=silencios, arranque=que)


def _fade(audio: np.ndarray, sr: int, entrada_ms: float, salida_ms: float) -> np.ndarray:
    audio = audio.copy()
    fi = min(int(sr * entrada_ms / 1000), len(audio) // 2)
    fo = min(int(sr * salida_ms / 1000), len(audio) // 2)
    if fi:
        audio[:fi] *= np.linspace(0.0, 1.0, fi, dtype=np.float32)
    if fo:
        audio[-fo:] *= np.linspace(1.0, 0.0, fo, dtype=np.float32)
    return audio


def aplicar_plan(audio: np.ndarray, sr: int, plan: Plan) -> np.ndarray:
    """Saca el arranque y los tramos de silencio, con fundidos en cada unión.
    Nunca toca voz: los cortes salen de las marcas de palabra."""
    cortes = [(0.0, plan.corte_arranque_s)] if plan.corte_arranque_s > 0 else []
    cortes += sorted(plan.silencios)
    partes: list[np.ndarray] = []
    cursor = 0
    for ini, fin in cortes:
        i, f = int(ini * sr), min(int(fin * sr), len(audio))
        if i > cursor:
            partes.append(audio[cursor:i])
        cursor = max(cursor, f)
    partes.append(audio[cursor:])
    partes = [p for p in partes if len(p)]
    if not partes:
        return audio[:0]
    salida = []
    for k, parte in enumerate(partes):
        entrada = FADE_IN_MS if (k == 0 and plan.corte_arranque_s > 0) else (FADE_MS if k else 0)
        salida_fade = FADE_MS if k < len(partes) - 1 else 0
        salida.append(_fade(parte, sr, entrada, salida_fade))
    return np.concatenate(salida)


def resumen(plan: Plan, duracion_antes_s: float, duracion_despues_s: float) -> dict:
    return {
        "arranque_cortado_s": round(plan.corte_arranque_s, 2),
        "arranque": plan.arranque,
        "silencios_acortados": len(plan.silencios),
        "silencio_sacado_s": round(sum(f - i for i, f in plan.silencios), 2),
        "duracion_antes_s": round(duracion_antes_s, 2),
        "duracion_despues_s": round(duracion_despues_s, 2),
    }
