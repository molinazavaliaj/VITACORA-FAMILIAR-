"""Qué audios del narrador se usan para clonar su voz. Lógica pura, sin red.

Reglas (spec, decisión de Naza 16/09): las respuestas más largas primero,
hasta 15 minutos; por debajo de 10 minutos limpios NO se clona. La referencia
para los motores zero-shot es una respuesta entera de 12-30 s con
transcripción, así el texto coincide exactamente con el audio.
"""

from dataclasses import dataclass

PISO_SEGUNDOS = 600  # sin 10 min limpios no se clona
TOPE_SEGUNDOS = 900  # con 15 min alcanza; más solo hace lenta la preparación
MINIMO_CLIP = 20  # por debajo, casi todo es silencio y "hola"
REFERENCIA_MIN = 12
REFERENCIA_MAX = 30


@dataclass(frozen=True)
class Respuesta:
    id: str
    pregunta_orden: int
    audio_path: str | None
    duracion_segundos: int | None
    transcripcion: str | None


@dataclass(frozen=True)
class Seleccion:
    respuestas: list[Respuesta]  # en el orden en que se acumulan (duración desc)
    segundos_totales: int
    alcanza_piso: bool


def _segundos(x: Respuesta) -> int:
    return x.duracion_segundos or 0


def _candidatas(respuestas: list[Respuesta]) -> list[Respuesta]:
    return sorted(
        (x for x in respuestas if x.audio_path and _segundos(x) >= MINIMO_CLIP),
        key=_segundos,
        reverse=True,
    )


def elegir_muestras(respuestas: list[Respuesta]) -> Seleccion:
    """Las más largas primero, hasta el tope. La que no entra entera no entra."""
    elegidas: list[Respuesta] = []
    total = 0
    for x in _candidatas(respuestas):
        if total + _segundos(x) > TOPE_SEGUNDOS:
            continue
        elegidas.append(x)
        total += _segundos(x)
    return Seleccion(respuestas=elegidas, segundos_totales=total, alcanza_piso=total >= PISO_SEGUNDOS)


def elegir_referencia(respuestas: list[Respuesta]) -> Respuesta | None:
    """Una respuesta entera de 12-30 s con transcripción; la más larga de esas."""
    aptas = [
        x
        for x in respuestas
        if x.audio_path and x.transcripcion and REFERENCIA_MIN <= _segundos(x) <= REFERENCIA_MAX
    ]
    return max(aptas, key=_segundos) if aptas else None
