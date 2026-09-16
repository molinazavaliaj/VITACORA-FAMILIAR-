"""Partir el texto del libro en frases que un motor de voz lea bien. Lógica pura.

Los motores leen bien de a una o dos frases y mal de a páginas: se corta por
`.?!;…`, y si una frase sigue larga, por comas; si tampoco, por espacios.
Nunca dentro de una palabra. Pegar las frases con un espacio devuelve el
texto original (salvo espacios repetidos).
"""

import re

MAX_FRASE = 220

_FIN_DE_FRASE = re.compile(r"(?<=[.!?;…])\s+")
_COMA = re.compile(r"(?<=,)\s+")
_PARRAFO = re.compile(r"\n\s*\n")


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
