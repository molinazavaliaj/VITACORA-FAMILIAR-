"""El pedido de corte de «Su voz»: qué frases hay que cortar y cómo se anotan.

Por qué existe: la fábrica elige las frases y deja dos cosas en el paquete —
`frases.json` (las 24 elegidas y las alternativas, cada una con la respuesta de
la que sale) y `frases_pedido.txt` (el pedido, cuya sola presencia quiere decir
"hay algo para cortar"). Este módulo es la mitad barata y pura de ese trabajo:
saber cuáles faltan, con qué nombre va cada audio y cómo se anota lo cortado. El
audio en sí (bajar la respuesta, escucharla con marcas de tiempo, cortar con
ffmpeg, restaurar y emparejar nivel) se engancha en `procesar_pedido`, que corre
en la PC de música — ahí sí se prueba de verdad, con oído.

El contrato con la fábrica (`fabrica/src/libro/publicar-frases.ts`):
`{narrador}/paquete/frases.json` con `capitulos[].candidatas[]`, cada candidata
con `id`, `texto`, `respuesta_id` y `estado` ('pendiente' → 'cortada'); y
`{narrador}/paquete/frases_pedido.txt` que el worker borra al terminar.
"""

from dataclasses import dataclass

BUCKET = "audios"


def RUTA_FRASES_JSON(narrador_id: str) -> str:
    return f"{narrador_id}/paquete/frases.json"


def RUTA_FRASES_PEDIDO(narrador_id: str) -> str:
    return f"{narrador_id}/paquete/frases_pedido.txt"


def RUTA_AUDIO_DE_FRASE(narrador_id: str, frase_id: str) -> str:
    """Dónde queda el recorte. El id de la fábrica es `cita-7` / `sf-3`: sirve tal cual como nombre."""
    return f"{narrador_id}/voz/frases/{frase_id}.mp3"


@dataclass(frozen=True)
class Pendiente:
    id: str
    texto: str
    respuesta_id: str


def narradores_con_pedido(sb) -> list[str]:
    """Los narradores que tienen un pedido de corte esperando.

    Se sondea Storage y no la base a propósito: el pedido es un archivo y la
    carpeta de cada narrador es su id, así que no hace falta consultar tablas
    (el worker nunca toca `pedidos`). Si Storage falla, tira: el bucle del
    worker anota y sigue.
    """
    carpetas = sb.storage.from_(BUCKET).list()
    con_pedido = []
    for carpeta in carpetas or []:
        nombre = carpeta.get("name") if isinstance(carpeta, dict) else getattr(carpeta, "name", None)
        if not nombre:
            continue
        archivos = sb.storage.from_(BUCKET).list(f"{nombre}/paquete")
        nombres = {
            (a.get("name") if isinstance(a, dict) else getattr(a, "name", "")) for a in (archivos or [])
        }
        if "frases_pedido.txt" in nombres:
            con_pedido.append(nombre)
    return con_pedido


def pendientes(frases: dict) -> list[Pendiente]:
    """Las frases que todavía no tienen audio, en el orden del libro.

    Solo entran las que salieron de una respuesta concreta y no están cortadas
    ni falladas: una frase sin `respuesta_id` ya viene descartada por la fábrica
    (no es textual) y no se puede cortar de ningún lado.
    """
    faltan: list[Pendiente] = []
    for capitulo in frases.get("capitulos") or []:
        for candidata in capitulo.get("candidatas") or []:
            if candidata.get("estado") in ("cortada", "fallida"):
                continue
            respuesta_id = candidata.get("respuesta_id")
            if not respuesta_id:
                continue
            faltan.append(
                Pendiente(
                    id=str(candidata.get("id") or ""),
                    texto=str(candidata.get("texto") or ""),
                    respuesta_id=str(respuesta_id),
                )
            )
    return [f for f in faltan if f.id and f.texto]


def marcar_cortada(
    frases: dict,
    frase_id: str,
    *,
    audio_path: str,
    segundos: float,
    inicio: float,
    fin: float,
) -> dict:
    """Anota una frase cortada en el JSON (devuelve el mismo dict, ya tocado).

    Se guarda el minuto además del archivo: si mañana hay que recortar distinto
    (otro aire, otra restauración), no hace falta volver a escuchar la respuesta
    entera para saber dónde estaba.
    """
    for capitulo in frases.get("capitulos") or []:
        for candidata in capitulo.get("candidatas") or []:
            if str(candidata.get("id")) == str(frase_id):
                candidata["estado"] = "cortada"
                candidata["audio_path"] = audio_path
                candidata["segundos"] = round(float(segundos), 2)
                candidata["inicio"] = round(float(inicio), 2)
                candidata["fin"] = round(float(fin), 2)
                return frases
    raise KeyError(f"no está la frase {frase_id} en frases.json")


def marcar_fallida(frases: dict, frase_id: str, motivo: str) -> dict:
    """La frase queda sin audio pero se sigue: el libro ya salió, esto no lo tumba."""
    for capitulo in frases.get("capitulos") or []:
        for candidata in capitulo.get("candidatas") or []:
            if str(candidata.get("id")) == str(frase_id):
                candidata["estado"] = "fallida"
                candidata["error"] = motivo[:500]
                return frases
    raise KeyError(f"no está la frase {frase_id} en frases.json")


def cuantas_cortadas(frases: dict) -> tuple[int, int]:
    """(cortadas, totales): lo que el panel muestra como \"Su voz se está preparando\"."""
    totales = cortadas = 0
    for capitulo in frases.get("capitulos") or []:
        for candidata in capitulo.get("candidatas") or []:
            totales += 1
            if candidata.get("estado") == "cortada":
                cortadas += 1
    return cortadas, totales
