"""Partir el texto del libro en frases que un motor de voz lea bien. Lógica pura.

Los motores leen bien de a una o dos frases y mal de a páginas: se corta por
`.?!;…`, y si una frase sigue larga, por comas; si tampoco, por espacios.
Nunca dentro de una palabra. Pegar las frases con un espacio devuelve el
texto original (salvo espacios repetidos).

Desde el 19/09 cada tramo se acuerda de qué signo lo cerró (`Tramo.cierre`),
para que el pegado ponga siempre la misma pausa por signo (ver `voz/pausas.py`).
"""

import re
from dataclasses import dataclass

from .pausas import SEPARADOR_HISTORIA

MAX_FRASE = 220

# Fin de frase: el signo, o el signo seguido de una comilla/paréntesis de cierre
# (`dijo "basta". Y…`, `(se rió.) Después`). Dos alternativas porque el
# lookbehind tiene que ser de ancho fijo.
_FIN_DE_FRASE = re.compile(r"(?<=[.!?;…][\"”’)\]»])\s+|(?<=[.!?;…])\s+")
_COMA = re.compile(r"(?<=,)\s+")
_COMA_O_PUNTO_Y_COMA = re.compile(r"(?<=[,;:])\s+")
_PARRAFO = re.compile(r"\n\s*\n")
# Con qué termina un tramo, ignorando comillas o paréntesis de cierre.
_CIERRE = re.compile(r"(\.{3}|…|[.!?]|[,;:])[\"”’)\]»]*$")


@dataclass(frozen=True)
class Tramo:
    texto: str
    cierre: str  # una clave de pausas.PAUSAS_MS: coma | punto | suspensivos | parrafo | historia | ninguno


def _cierre_de(trozo: str) -> str:
    m = _CIERRE.search(trozo)
    if not m:
        return "ninguno"
    signo = m.group(1)
    if signo in ("...", "…"):
        return "suspensivos"
    if signo in ",;:":
        return "coma"
    return "punto"


def partir_en_tramos(texto: str, modo: str = "oracion", maximo: int = MAX_FRASE) -> list[Tramo]:
    """Los tramos que lee el motor, cada uno con el signo que lo cerró.

    modo="oracion": un tramo por oración (`.?!;…`); las comas quedan adentro y
    las pausa el motor. modo="coma": también se corta en `,;:`. En los dos, un
    tramo más largo que `maximo` se parte por comas y, si hace falta, por
    espacios (cierre "ninguno"). El último tramo de un párrafo cierra con
    "parrafo", y con "historia" si lo que sigue es el separador `* * *`.
    """
    parrafos = [p.strip() for p in _PARRAFO.split(texto.strip()) if p.strip()]
    salida: list[Tramo] = []
    for i, parrafo in enumerate(parrafos):
        if parrafo == SEPARADOR_HISTORIA:
            if salida:
                salida[-1] = Tramo(salida[-1].texto, "historia")
            continue
        tramos = _tramos_del_parrafo(parrafo, modo, maximo)
        if not tramos:
            continue
        sigue_algo = any(p != SEPARADOR_HISTORIA for p in parrafos[i + 1 :])
        if sigue_algo:
            tramos[-1] = Tramo(tramos[-1].texto, "parrafo")
        salida.extend(tramos)
    return salida


def _tramos_del_parrafo(parrafo: str, modo: str, maximo: int) -> list[Tramo]:
    salida: list[Tramo] = []
    for oracion in _FIN_DE_FRASE.split(parrafo):
        oracion = oracion.strip()
        if not oracion:
            continue
        pedazos = _COMA_O_PUNTO_Y_COMA.split(oracion) if modo == "coma" else [oracion]
        for pedazo in pedazos:
            pedazo = pedazo.strip()
            if not pedazo:
                continue
            partes = _partir_larga(pedazo, maximo)
            for k, parte in enumerate(partes):
                ultima = k == len(partes) - 1
                cierre = _cierre_de(parte) if ultima else ("coma" if parte.endswith((",", ";", ":")) else "ninguno")
                salida.append(Tramo(parte, cierre))
    return salida


def partir_en_frases(texto: str, maximo: int = MAX_FRASE) -> list[str]:
    salida: list[str] = []
    for trozo in _FIN_DE_FRASE.split(texto.strip()):
        trozo = trozo.strip()
        if trozo:
            salida.extend(_partir_larga(trozo, maximo))
    return salida


def _acumular(pedazos: list[str], maximo: int) -> list[str]:
    """Junta pedazos con espacios sin pasar el máximo; un pedazo solo siempre entra."""
    partes: list[str] = []
    actual = ""
    for pedazo in pedazos:
        candidato = f"{actual} {pedazo}".strip() if actual else pedazo
        if len(candidato) <= maximo or not actual:
            actual = candidato
        else:
            partes.append(actual)
            actual = pedazo
    if actual:
        partes.append(actual)
    return partes


def _partir_larga(frase: str, maximo: int) -> list[str]:
    if len(frase) <= maximo:
        return [frase]
    por_comas = _acumular(_COMA.split(frase), maximo)
    salida: list[str] = []
    for parte in por_comas:
        salida.extend([parte] if len(parte) <= maximo else _acumular(parte.split(" "), maximo))
    return salida


def parrafos_de(texto: str) -> list[list[str]]:
    """Los párrafos (separados por línea en blanco), cada uno ya partido en frases."""
    return [partir_en_frases(p) for p in _PARRAFO.split(texto.strip()) if p.strip()]


def texto_de_prueba(transcripciones: list[str], excluir: str | None = None, frases: int = 7) -> str:
    """El párrafo de la prueba de oído: las primeras `frases` de la transcripción
    más larga que NO sea la de la referencia (para que el motor no repita lo que oyó)."""
    candidatas = [t for t in transcripciones if t and t != excluir]
    if not candidatas:
        return ""
    fuente = max(candidatas, key=len)
    return " ".join(partir_en_frases(fuente)[:frases])
