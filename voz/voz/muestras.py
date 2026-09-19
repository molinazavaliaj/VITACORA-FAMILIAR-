"""Qué audios del narrador se usan para clonar su voz. Lógica pura, sin red.

Reglas (spec, decisión de Naza 16/09): las respuestas más largas primero,
hasta 15 minutos; por debajo de 10 minutos limpios NO se clona. La referencia
para los motores zero-shot es una respuesta entera de 12-30 s con
transcripción, así el texto coincide exactamente con el audio.

La referencia se elige por riqueza fonética, no por duración (decisión de la
central 19/09, después de escuchar el libro de Joaquín): los motores zero-shot
copian el acento del clip que escuchan, así que si en la referencia no hay
"ll/y" (el "sh" rioplatense), voseo ni "ñ", el modelo no tiene de dónde
sacarlos. Con la referencia del día 02 (rica en eso) el libro sonó mejor que
con la del día 23 (la más larga).
"""

import re
from dataclasses import dataclass

PISO_SEGUNDOS = 600  # sin 10 min limpios no se clona
TOPE_SEGUNDOS = 900  # con 15 min alcanza; más solo hace lenta la preparación
MINIMO_CLIP = 20  # por debajo, casi todo es silencio y "hola"
REFERENCIA_MIN = 12
REFERENCIA_MAX = 30

# La referencia que oye el motor son los primeros ~25 s de la respuesta (recortados
# en una pausa), no la respuesta entera: se puntúa el arranque. Joaquín habla a
# ~12 caracteres por segundo (medido sobre sus 35 respuestas), así que 25 s son
# unos 300 caracteres de transcripción.
ARRANQUE_CHARS = 300

# Rasgos que un motor zero-shot solo reproduce si los oyó en la referencia.
# El peso es cuánto vale cada aparición; el "sh" es lo que más se nota cuando falta.
_VOSEO = (
    "vos|sos|tenés|tenes|sabés|sabes|querés|queres|podés|podes|hacés|haces|decís|decis|venís|venis|"
    "mirá|fijate|dale|che|viste|acordate|contame|imaginate|entendés|entendes"
)
_RASGOS = [
    ("sh", re.compile(r"ll|y(?=[aeiouáéíóú])", re.IGNORECASE), 3.0),  # calle, yo, playa, mayo; la "y" sola no (va seguida de espacio)
    ("voseo", re.compile(rf"\b(?:{_VOSEO})\b", re.IGNORECASE), 2.0),  # lista cerrada: "-ás" suelto daba "papás", "después"
    ("ñ", re.compile(r"ñ", re.IGNORECASE), 1.0),
    ("rr", re.compile(r"rr", re.IGNORECASE), 1.0),
    ("pregunta", re.compile(r"[¿?]"), 1.0),  # entonación
]


def riqueza_fonetica(texto: str | None) -> float:
    """Puntos por cada 100 caracteres: cuántos rasgos del habla rioplatense hay en
    el texto. Normalizado por largo para que un texto no gane solo por largo."""
    t = (texto or "").strip()
    if len(t) < 20:
        return 0.0
    puntos = sum(peso * len(patron.findall(t)) for _, patron, peso in _RASGOS)
    return round(100.0 * puntos / len(t), 2)


def riqueza_arranque(texto: str | None, chars: int = ARRANQUE_CHARS) -> float:
    """La riqueza de lo que va a quedar en el clip de referencia: el arranque."""
    return riqueza_fonetica((texto or "")[:chars])


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
    """Una respuesta entera de 12-30 s con transcripción; la fonéticamente más
    rica de esas (a igual riqueza, la más larga)."""
    aptas = [
        x
        for x in respuestas
        if x.audio_path and x.transcripcion and REFERENCIA_MIN <= _segundos(x) <= REFERENCIA_MAX
    ]
    # entera: el clip es toda la respuesta, se puntúa toda
    return max(aptas, key=lambda x: (riqueza_fonetica(x.transcripcion), _segundos(x))) if aptas else None


def elegir_para_recortar(respuestas: list[Respuesta], segundos_recorte: int) -> Respuesta | None:
    """Si no hay respuesta entera de 12-30 s, ¿de cuál respuesta se recortan los
    primeros `segundos_recorte`? De la que tiene el arranque fonéticamente más
    rico (a igual riqueza, la más larga). Cualquier respuesta con audio,
    transcripción y largo suficiente sirve, no solo las muestras: la referencia
    y las muestras son cosas distintas."""
    aptas = [
        x
        for x in respuestas
        if x.audio_path and x.transcripcion and _segundos(x) >= segundos_recorte + 5
    ]
    if not aptas:
        return None
    return max(aptas, key=lambda x: (riqueza_arranque(x.transcripcion), _segundos(x)))


def ranking_referencia(respuestas: list[Respuesta], por_arranque: bool = True) -> list[dict]:
    """Para dejar registrado en muestras.json por qué se eligió lo que se eligió."""
    puntuar = riqueza_arranque if por_arranque else riqueza_fonetica
    filas = [
        {
            "respuesta_id": x.id,
            "pregunta_orden": x.pregunta_orden,
            "segundos": _segundos(x),
            "riqueza_fonetica": puntuar(x.transcripcion),
        }
        for x in respuestas
        if x.audio_path and x.transcripcion
    ]
    return sorted(filas, key=lambda f: (f["riqueza_fonetica"], f["segundos"]), reverse=True)
