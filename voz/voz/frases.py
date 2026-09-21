"""Ubicar una frase del libro dentro del audio de una respuesta.

Por qué existe: «Su voz» imprime las mejores frases del narrador y las hace
escuchar con un QR. Lo que suena es un RECORTE de la respuesta donde él dijo esa
frase, así que hay que saber en qué segundo empieza y en qué segundo termina — y
eso no lo sabe nadie todavía: la fábrica deja la frase y de qué respuesta sale,
pero no el minuto.

Dos cuidados que vienen de cómo se arma el libro:

- La transcripción que se guarda en la base la escribió el entrevistador; acá se
  vuelve a escuchar el audio, así que las palabras no coinciden letra por letra
  ("pa'" por "para", números escritos distinto, puntuación de más). A veces
  escribe distinto y a veces se come una palabra entera que el narrador dijo;
  las dos cosas están contempladas (ver `_mejor_alineacion`). Por eso se compara
  por palabra normalizada, en orden y con tolerancia.
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


def _mejor(a: tuple, b: tuple) -> tuple:
    """La mejor de dos alineaciones: más aciertos y, a igualdad, la más ajustada."""
    return a if _clave(a) >= _clave(b) else b


def _clave(alineacion: tuple[int, int, int]) -> tuple[int, int, int]:
    """Con qué se comparan dos alineaciones: aciertos, ajuste y dónde arranca.

    El ajuste es cuántos lugares oídos ocupa (de la primera palabra encontrada a
    la última) y el arranque temprano desempata siempre para el mismo lado.
    """
    aciertos, primera, ultima = alineacion
    return (aciertos, -(ultima - primera), -primera)


def _mejor_alineacion(
    buscadas: list[str],
    oidas: list[str],
    hueco_maximo: int,
) -> tuple[int, int, int]:
    """Dónde encaja mejor la frase en lo oído: (aciertos, primera, última).

    Recorre las palabras de la frase con el cursor de lo oído como estado y, por
    cada una, contempla los tres finales posibles:

    - **está** dentro de los próximos `hueco_maximo` lugares (una muletilla en el
      medio): el cursor salta detrás de ella;
    - el ASR **escribió otra cosa** en su lugar: el cursor avanza uno;
    - el ASR **se la comió** —el narrador la dijo y no quedó en ningún lado—: el
      cursor no se mueve.

    El tercero es el que faltaba. Tanteando en línea, «se la comió» gasta un lugar
    de lo oído igual que «escribió otra cosa», así que la alineación se corre un
    lugar y ya no vuelve: la frase aparece por partes y ninguna corrida llega al
    `minimo`. Es lo que pasó con la cita-13 del narrador 3691baf4: Whisper se
    comió el «en» de «…en ella **y en** lo que me hacía feliz…», el tanteo en
    línea se corrió y quedó en 14/24 aciertos (0,58 < 0,6) → `None` → frase
    fallida con la frase entera y verbatim en la transcripción. Con los dos casos
    como opciones, la alineación espera a la palabra que sigue en vez de gastar el
    lugar y encuentra las 23 de 24.

    Se guarda, por estado (palabra de la frase × cursor), la mejor alineación que
    llega ahí. Alcanza con eso: lo que venga después depende solo de dónde quedó
    el cursor, así que una alineación peor en el mismo estado no puede ganar más
    adelante por más que empiece distinto.
    """
    vacia = (0, -1, -1)  # (aciertos, índice oído de la primera, de la última)
    estados = [[vacia] * (len(oidas) + 1) for _ in range(len(buscadas) + 1)]
    for i, buscada in enumerate(buscadas):
        actuales, siguientes = estados[i], estados[i + 1]
        for cursor in range(len(oidas) + 1):
            actual = actuales[cursor]
            if cursor < len(oidas):
                # Escribió otra cosa: el lugar queda gastado.
                siguientes[cursor + 1] = _mejor(siguientes[cursor + 1], actual)
            # Se la comió: no hay lugar que gastar, se espera a la que sigue.
            siguientes[cursor] = _mejor(siguientes[cursor], actual)
            for k in range(cursor, min(cursor + hueco_maximo + 1, len(oidas))):
                if oidas[k] == buscada:
                    aciertos, primera, _ = actual
                    encontrada = (aciertos + 1, primera if primera >= 0 else k, k)
                    siguientes[k + 1] = _mejor(siguientes[k + 1], encontrada)
    mejor = vacia
    for cursor in range(len(oidas) + 1):
        mejor = _mejor(mejor, estados[len(buscadas)][cursor])
    return mejor


def ubicar_frase(
    texto: str,
    palabras: list[dict],
    *,
    minimo: float = MINIMO_ACIERTOS,
    hueco_maximo: int = HUECO_MAXIMO,
) -> Frase | None:
    """Dónde está la frase en el audio, en segundos; None si no se la encuentra.

    `palabras` es lo que devuelve `transcribir.palabras_con_tiempos`:
    `[{"palabra", "inicio", "fin"}, …]`. Se alinea la frase sobre lo oído palabra
    por palabra: se banca que alguna no esté (el ASR escribe distinto o se come
    una) y que haya hasta `hueco_maximo` palabras de más en el medio (una
    muletilla). Se queda con la alineación de más aciertos y, a igualdad, la más
    ajustada, y solo la devuelve si acierta al menos `minimo` de las palabras de
    la frase.
    """
    buscadas = palabras_de(texto)
    if not buscadas or not palabras:
        return None
    oidas = [normalizar_palabra(str(p.get("palabra", ""))) for p in palabras]

    aciertos, primera, ultima = _mejor_alineacion(buscadas, oidas, hueco_maximo)
    if primera < 0 or aciertos / len(buscadas) < minimo:
        return None
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
