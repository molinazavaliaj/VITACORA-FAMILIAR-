"""Ubicar una frase del libro dentro del audio de una respuesta.

Por qué existe: «Su voz» imprime las mejores frases del narrador y las hace
escuchar con un QR. Lo que suena es un RECORTE de la respuesta donde él dijo esa
frase, así que hay que saber en qué segundo empieza y en qué segundo termina — y
eso no lo sabe nadie todavía: la fábrica deja la frase y de qué respuesta sale,
pero no el minuto.

Dos cuidados que vienen de cómo se arma el libro:

- La transcripción que se guarda en la base la escribió el entrevistador; acá se
  vuelve a escuchar el audio, así que las palabras no coinciden letra por letra
  ("pa'" por "para", números escritos distinto, puntuación de más). Por eso se
  compara por palabra normalizada, en orden y con tolerancia.
- Si la frase no aparece, se devuelve None. **Nunca se adivina**: un recorte que
  dice otra cosa es peor que una frase sin audio (esa se imprime igual, sin QR, y
  el panel la muestra como pendiente).
"""

import re
import unicodedata

MINIMO_ACIERTOS = 0.6  # proporción de palabras de la frase que hay que encontrar
HUECO_MAXIMO = 4  # palabras de más que puede meter entre dos palabras de la frase
AIRE_INICIO = 0.20  # segundos antes de la primera palabra (no cortarle el ataque)
AIRE_FIN = 0.35  # y después de la última (no cortarle la cola)

_LETRAS = re.compile(r"[^0-9a-z ]+")

Frase = tuple[float, float]


def normalizar_palabra(palabra: str) -> str:
    """Minúsculas, sin acentos y sin puntuación.

    Es la misma regla que usa la fábrica para decidir si una cita es textual
    (`normalizar` en `fabrica/src/libro/frases.ts`): si acá se normalizara
    distinto, una frase que el libro da por textual podría no encontrarse nunca.
    """
    plano = unicodedata.normalize("NFD", palabra.lower())
    return _LETRAS.sub("", "".join(c for c in plano if unicodedata.category(c) != "Mn")).strip()


def palabras_de(texto: str) -> list[str]:
    """Las palabras comparables de un texto, en orden."""
    return [p for p in (normalizar_palabra(trozo) for trozo in texto.split()) if p]


def ubicar_frase(
    texto: str,
    palabras: list[dict],
    *,
    minimo: float = MINIMO_ACIERTOS,
    hueco_maximo: int = HUECO_MAXIMO,
) -> Frase | None:
    """Dónde está la frase en el audio, en segundos; None si no se la encuentra.

    `palabras` es lo que devuelve `transcribir.palabras_con_tiempos`:
    `[{"palabra", "inicio", "fin"}, …]`. La búsqueda recorre la frase palabra por
    palabra y avanza sobre lo oído: se banca que falte alguna (el ASR escribe
    distinto) y que haya hasta `hueco_maximo` palabras de más en el medio (una
    muletilla). Se queda con el mejor intento —más aciertos y, a igualdad, el
    recorte más corto— y solo lo devuelve si acierta al menos `minimo`.
    """
    buscadas = palabras_de(texto)
    if not buscadas or not palabras:
        return None
    oidas = [normalizar_palabra(str(p.get("palabra", ""))) for p in palabras]

    mejor: tuple[float, float, int, int] | None = None  # (aciertos, -duración, inicio, fin)
    for arranque in range(len(oidas)):
        posicion = arranque
        aciertos = 0
        primera: int | None = None
        ultima: int | None = None
        for buscada in buscadas:
            hallada = None
            for k in range(posicion, min(posicion + hueco_maximo + 1, len(oidas))):
                if oidas[k] == buscada:
                    hallada = k
                    break
            if hallada is None:
                posicion += 1  # no está esa palabra: se sigue desde la próxima oída
                continue
            aciertos += 1
            if primera is None:
                primera = hallada
            ultima = hallada
            posicion = hallada + 1
        if primera is None or ultima is None:
            continue
        duracion = float(palabras[ultima]["fin"]) - float(palabras[primera]["inicio"])
        candidato = (aciertos / len(buscadas), -duracion, primera, ultima)
        if mejor is None or candidato[:2] > mejor[:2]:
            mejor = candidato

    if mejor is None or mejor[0] < minimo:
        return None
    _, _, primera, ultima = mejor
    return (float(palabras[primera]["inicio"]), float(palabras[ultima]["fin"]))


def recorte_con_aire(
    inicio: float,
    fin: float,
    duracion: float | None = None,
    *,
    aire_inicio: float = AIRE_INICIO,
    aire_fin: float = AIRE_FIN,
) -> Frase:
    """El recorte con un poco de aire a cada lado, sin salirse del archivo.

    El aire importa: el ASR marca el tiempo de la palabra, y arrancar exactamente
    ahí le come el ataque a la sílaba; terminar en la última palabra le come la
    cola. Si el resultado quedaría al revés (o vacío), se garantiza que dure algo.
    """
    desde = max(0.0, float(inicio) - aire_inicio)
    hasta = max(float(fin) + aire_fin, desde + 0.1)
    if duracion is not None:
        hasta = min(hasta, float(duracion))
        desde = min(desde, hasta)
    return (desde, hasta)
