"""Una respuesta del narrador tal como la lee el worker de `respuestas`.

Hasta el 16/10/2026 acá también se elegían las muestras y la referencia para
clonar la voz (el audiolibro); eso se sacó y quedó solo el tipo.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Respuesta:
    id: str
    pregunta_orden: int
    audio_path: str | None
    duracion_segundos: int | None
    transcripcion: str | None
