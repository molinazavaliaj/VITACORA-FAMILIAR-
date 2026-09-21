"""El corte de las frases de «Su voz»: del pedido en Storage al mp3 de cada frase.

Por qué existe: `cortar_frases.py` sabe cuáles faltan y cómo se anotan; esto es
la otra mitad —la que corre en la PC de música, con el audio real del narrador—.
Por cada narrador con `frases_pedido.txt`: baja `frases.json` y, por cada
candidata pendiente, baja el audio de su respuesta, lo vuelve a escuchar con
marcas de tiempo por palabra, ubica la frase, corta el tramo con el aire que ya
calcula `recorte_con_aire`, lo restaura, lo empareja al nivel de la casa
(−19 LUFS, igual que un capítulo) y lo sube a `{narrador}/voz/frases/{id}.mp3`,
anotando `inicio`, `fin` y `segundos` en el mismo JSON.

Cuatro reglas que vienen del producto y de dónde corre esto:

- **Nunca se adivina el minuto**: si la frase no aparece en el audio, esa frase
  queda `fallida` con el motivo y se sigue con la próxima. Un recorte que dice
  otra cosa es peor que una frase sin audio (esa se imprime igual, sin QR).
- **Es tal cual lo dijo**: acá NO se usa `plan_de_ritmo`. Al híbrido se le
  sacaba el arranque que responde a la pregunta y se le acortaban los silencios
  internos; para las frases el producto pide lo contrario. Se corta el tramo y
  se empareja el nivel, nada más.
- **Una frase no tumba nada**: cada candidata va en su propio `try`. Y la falla
  se anota según se pueda arreglar sola o no (ver `NoSePuedeCortar`): lo
  definitivo queda `fallida`, lo pasajero sigue `pendiente` y se reintenta en la
  vuelta siguiente sin perder el pedido.
- **Idempotente**: `pendientes()` no devuelve las que ya están `cortada`, así
  que volver a correrlo no rehace ni reescribe lo ya cortado.

Los wav intermedios (tramo, restaurado, limpia, master) quedan en la carpeta de
trabajo, al lado del mp3: son chicos y son lo que se escucha cuando una frase
suena rara.
"""

import json
import logging
from dataclasses import asdict
from pathlib import Path

from .audio import a_mp3
from .cortar_frases import (
    Pendiente,
    RUTA_AUDIO_DE_FRASE,
    RUTA_FRASES_JSON,
    RUTA_FRASES_PEDIDO,
    marcar_cortada,
    marcar_fallida,
    narradores_con_pedido,
    pendientes,
)
from .frases import recorte_con_aire, ubicar_frase
from .masterizar import (
    FILTRO_LIMPIEZA,
    FILTRO_LIMPIEZA_RESTAURADA,
    TASA,
    escribir,
    leer,
    limitar_picos,
    limpiar_pieza,
    loudnorm_dos_pasadas,
    medir,
    nivelar,
)
from .muestras import Respuesta
from .narrar import subir_con_reintentos
from .restaurar import restaurar
from .supabase_cliente import BUCKET, descargar_audio, respuestas_de
from .transcribir import palabras_con_tiempos


class NoSePuedeCortar(Exception):
    """La frase no se puede cortar con lo que hay: la respuesta no está en la
    base, no tiene audio, o la frase no aparece en el audio de esa respuesta.

    Es la falla *definitiva*: reintentarla daría exactamente lo mismo. La frase
    queda `fallida` con este motivo (el panel la muestra y el libro la imprime
    sin QR). Lo que NO es definitivo —Storage, Whisper, ffmpeg, la subida— tira
    otra excepción y la frase queda `pendiente`: se reintenta en la próxima
    vuelta y el pedido no se borra.
    """


def nombre_de(entrada) -> str:
    """El nombre de una entrada del listado de Storage.

    El cliente real devuelve objetos con `.name` y los fakes de los tests,
    diccionarios (misma tolerancia que `cortar_frases.narradores_con_pedido`).
    """
    if isinstance(entrada, dict):
        return str(entrada.get("name") or "")
    return str(getattr(entrada, "name", "") or "")


def hay_frases_json(sb, narrador_id: str) -> bool:
    """¿Está `frases.json` en el paquete?

    Se pregunta por el listado y no por el error del `download`: un 500 de
    Storage se ve igual que un archivo que no está, y borrar el pedido por un
    hipo de la red perdería el trabajo que encoló la fábrica. Un pedido sin
    JSON es un pedido que no se puede atender nunca: se limpia.
    """
    archivos = sb.storage.from_(BUCKET).list(f"{narrador_id}/paquete")
    return any(nombre_de(archivo) == "frases.json" for archivo in archivos or [])


def leer_frases(sb, narrador_id: str) -> dict:
    """`frases.json` ya parseado.

    Si el archivo no se puede bajar o no se entiende, tira: el pedido queda (la
    fábrica lo vuelve a publicar) y no se anota nada sobre un archivo que no se
    entiende. El que llama a `procesar_narrador` se encarga de que eso no tumbe
    al resto de los narradores ni al worker.
    """
    return json.loads(sb.storage.from_(BUCKET).download(RUTA_FRASES_JSON(narrador_id)).decode("utf-8"))


def subir_frases(sb, narrador_id: str, frases: dict, log: logging.Logger) -> None:
    """Sube `frases.json` con lo que se fue anotando (es lo que mira el panel).

    Si no sube, tira a propósito: sin el archivo actualizado nadie ve el
    progreso y el pedido no se puede borrar (se perdería el trabajo), así que
    el que llama corta la vuelta y lo reintenta en la próxima.
    """
    datos = json.dumps(frases, ensure_ascii=False, indent=2).encode("utf-8")
    if not subir_con_reintentos(sb, RUTA_FRASES_JSON(narrador_id), datos, {"content-type": "application/json", "upsert": "true"}, log):
        raise RuntimeError(f"no pude subir {RUTA_FRASES_JSON(narrador_id)}")


def borrar_pedido(sb, narrador_id: str, log: logging.Logger) -> None:
    """Borra `frases_pedido.txt`: el pedido lo borra el worker cuando terminó."""
    sb.storage.from_(BUCKET).remove([RUTA_FRASES_PEDIDO(narrador_id)])


def emparejar_frase(
    tramo: Path,
    salida: Path,
    *,
    restaurador=restaurar,
    modelos: Path | None = None,
    log: logging.Logger | None = None,
) -> dict:
    """El tramo crudo → el mp3 de la frase, con el sonido y el nivel de la casa.

    Es la misma cadena que `masterizar_capitulo` —restaurar, limpiar (pasa-altos
    y puntas), emparejar el nivel de la voz, limitar los picos, loudnorm a
    −19 LUFS y mp3— salteando el ritmo: para las frases el producto pide «tal
    cual lo dijo». Devuelve lo medido, que es lo que se loguea.

    Si restaurar falla (GPU ocupada, modelo sin bajar), la frase sale igual,
    sin restaurar y con el filtro de siempre (el que lleva `afftdn`), igual que
    hacen las historias del híbrido en `preparar_real`. Marcarla `fallida` acá
    perdería la frase para siempre por un hipo de la placa, y la frase se
    imprime igual (solo suena un poco más sucia).
    """
    restaurado = tramo.with_name(f"{tramo.stem}_restaurado.wav")
    fuente, filtro = restaurado, FILTRO_LIMPIEZA_RESTAURADA
    try:
        restaurador(tramo, restaurado, log=(log.info if log else None), modelos=modelos)
    except Exception as e:  # noqa: BLE001 — cualquier cosa del modelo deja la frase viva
        fuente, filtro = tramo, FILTRO_LIMPIEZA
        if log:
            log.warning("  restaurar de %s falló (%s: %s); la frase sale sin restaurar", tramo.name, type(e).__name__, str(e)[:120])
    limpia = limpiar_pieza(fuente, tramo.with_name(f"{tramo.stem}_limpia.wav"), filtro)
    nivelado = escribir(tramo.with_name(f"{tramo.stem}_nivelado.wav"), nivelar(leer(limpia)), subtipo="FLOAT")
    limitado = limitar_picos(nivelado, tramo.with_name(f"{tramo.stem}_limitado.wav"))
    master = tramo.with_name(f"{tramo.stem}_master.wav")
    medida = loudnorm_dos_pasadas(limitado, master)
    a_mp3(master, salida)
    return {"restaurada": fuente is restaurado, "loudnorm": medida, "final": asdict(medir(leer(master)))}


def cortar_una(
    sb,
    config,
    log: logging.Logger,
    narrador_id: str,
    frase: Pendiente,
    respuesta: Respuesta | None,
    carpeta: Path,
    *,
    transcriptor=palabras_con_tiempos,
    restaurador=restaurar,
) -> dict:
    """Corta una frase, sube su mp3 y devuelve lo que hay que anotar.

    El tramo se corta sobre las muestras ya decodificadas (`masterizar.leer`
    deja mono float32 a 24 kHz y decodifica cualquier formato, que las notas de
    WhatsApp son Ogg/Opus): los segundos que devuelve Whisper son de ese audio,
    y recortar en el contenedor volvería a decodificar desde cero.

    Tira `NoSePuedeCortar` cuando no hay forma y cualquier otra cosa cuando el
    problema es pasajero; el que llama distingue las dos.
    """
    if respuesta is None:
        raise NoSePuedeCortar(f"la respuesta {frase.respuesta_id} no está en la base")
    if not respuesta.audio_path:
        raise NoSePuedeCortar(f"la respuesta {frase.respuesta_id} no tiene audio en la base")
    carpeta.mkdir(parents=True, exist_ok=True)
    origen = descargar_audio(sb, respuesta.audio_path, carpeta / f"respuesta_{frase.id}{Path(respuesta.audio_path).suffix}")
    audio = leer(origen)
    if len(audio) == 0:
        raise NoSePuedeCortar(f"el audio de la respuesta {frase.respuesta_id} vino vacío")
    ubicada = ubicar_frase(frase.texto, (transcriptor(origen).get("palabras")) or [])
    if ubicada is None:
        raise NoSePuedeCortar(f"no se encontró «{frase.texto[:80]}» en el audio de la respuesta {respuesta.id}")
    desde, hasta = recorte_con_aire(ubicada[0], ubicada[1], len(audio) / TASA)
    muestras = audio[int(desde * TASA) : int(hasta * TASA)]
    if len(muestras) == 0:
        raise NoSePuedeCortar(f"el tramo de {frase.id} quedó vacío (el audio dura {len(audio) / TASA:.1f} s)")
    tramo = escribir(carpeta / f"{frase.id}_tramo.wav", muestras, subtipo="FLOAT")
    mp3 = carpeta / f"{frase.id}.mp3"
    emparejado = emparejar_frase(tramo, mp3, restaurador=restaurador, modelos=config.carpeta_modelos, log=log)
    ruta = RUTA_AUDIO_DE_FRASE(narrador_id, frase.id)
    if not subir_con_reintentos(sb, ruta, mp3.read_bytes(), {"content-type": "audio/mpeg", "upsert": "true"}, log):
        raise RuntimeError(f"no pude subir {ruta}")
    log.info(
        "frase %s (%s): de %.2f a %.2f del audio de la respuesta %s, %.1f s, %s LUFS → %s",
        frase.id, frase.texto[:40], desde, hasta, respuesta.id[:8], hasta - desde,
        emparejado["loudnorm"]["despues"].get("lufs"), ruta,
    )
    return {"audio_path": ruta, "segundos": round(hasta - desde, 2), "inicio": round(desde, 2), "fin": round(hasta, 2)}


def procesar_narrador(
    sb,
    config,
    log: logging.Logger,
    narrador_id: str,
    *,
    transcriptor=palabras_con_tiempos,
    restaurador=restaurar,
) -> int:
    """Atiende el pedido de un narrador y devuelve cuántas frases cortó.

    El pedido se borra solo cuando no queda ninguna candidata `pendiente`: con
    alguna sin cortar, el JSON se sube igual (el panel ve el progreso) y el
    pedido queda, así el worker vuelve a intentarla en la vuelta siguiente.
    """
    if not hay_frases_json(sb, narrador_id):
        log.warning("el pedido de %s no tiene frases.json en el paquete; lo borro", narrador_id[:8])
        borrar_pedido(sb, narrador_id, log)
        return 0
    frases = leer_frases(sb, narrador_id)
    faltan = pendientes(frases)
    if not faltan:
        log.info("frases de %s: no queda nada pendiente, borro el pedido", narrador_id[:8])
        borrar_pedido(sb, narrador_id, log)
        return 0
    respuestas = {r.id: r for r in respuestas_de(sb, narrador_id)}
    carpeta = config.carpeta_trabajo / "frases" / narrador_id
    log.info("frases de %s: %d por cortar", narrador_id[:8], len(faltan))
    cortadas = 0
    for frase in faltan:
        try:
            anotado = cortar_una(
                sb, config, log, narrador_id, frase, respuestas.get(frase.respuesta_id), carpeta,
                transcriptor=transcriptor, restaurador=restaurador,
            )
        except NoSePuedeCortar as e:
            # Definitivo: reintentarla daría lo mismo. Queda fallida (sin audio,
            # el libro la imprime igual) y se sigue con la próxima.
            log.warning("frase %s: fallida (%s)", frase.id, e)
            marcar_fallida(frases, frase.id, str(e))
        except Exception as e:  # noqa: BLE001 — una frase no puede tumbar el resto
            # Pasajero: Storage, la API de Whisper, ffmpeg o la subida. La frase
            # queda `pendiente` a propósito —marcarla `fallida` la perdería para
            # siempre por un 429 y el pedido se borraría con ella— y se reintenta.
            log.warning("frase %s: no se pudo cortar ahora (%s: %s); queda pendiente", frase.id, type(e).__name__, str(e)[:150])
        else:
            marcar_cortada(frases, frase.id, **anotado)
            cortadas += 1
        # Después de cada frase, el JSON arriba: el panel ve el progreso y si el
        # worker se cae a mitad, la vuelta siguiente no rehace lo ya cortado.
        subir_frases(sb, narrador_id, frases, log)
    quedan = pendientes(frases)
    if quedan:
        log.info("frases de %s: quedan %d pendientes; el pedido queda para la próxima vuelta", narrador_id[:8], len(quedan))
    else:
        log.info("frases de %s: listo, %d cortadas; borro el pedido", narrador_id[:8], cortadas)
        borrar_pedido(sb, narrador_id, log)
    return cortadas


def procesar_pedido(sb, config, log: logging.Logger, *, transcriptor=palabras_con_tiempos, restaurador=restaurar) -> int:
    """Atiende todos los pedidos de frases que haya y devuelve cuántas cortó.

    Un narrador que se cae no se lleva a los demás ni al worker: se anota y se
    sigue con el próximo. Si Storage no contesta al buscar los pedidos, esto
    tira; el bucle del worker lo anota y sigue durmiendo.
    """
    cortadas = 0
    for narrador_id in narradores_con_pedido(sb):
        try:
            cortadas += procesar_narrador(sb, config, log, narrador_id, transcriptor=transcriptor, restaurador=restaurador)
        except Exception:  # noqa: BLE001 — un pedido roto no se lleva a los otros
            log.exception("el pedido de frases de %s falló; sigo con el próximo", narrador_id[:8])
    return cortadas
