"""Paso 1 de la prueba de oído: bajar los audios del narrador, limpiarlos y
dejar listos la referencia y el texto.

    python -m voz.preparar_muestras --narrador Joaquin [--salida prueba/muestras]

Deja en la carpeta de salida:
    limpias/dia_NN_xxxx.wav  las muestras limpias (mono 24 kHz, sin silencios, volumen parejo)
    referencia.wav           el clip que oyen los motores zero-shot (una respuesta entera de 12-30 s)
    referencia.txt           exactamente lo que dice referencia.wav
    texto.txt                el párrafo que van a leer los cuatro motores (editable)
    muestras.json            qué se usó y cuántos segundos limpios hay
"""

import argparse
import json
import logging
import sys
from pathlib import Path

from .audio import a_wav_limpio, duracion, recortar_en_pausa
from .config import cargar_config
from .muestras import PISO_SEGUNDOS, Respuesta, elegir_muestras, elegir_referencia
from .supabase_cliente import cliente, descargar_audio, narrador_por_nombre, respuestas_de
from .texto import texto_de_prueba

log = logging.getLogger("voz.preparar")

SEGUNDOS_RECORTE = 25  # si no hay una respuesta entera de 12-30 s, se recorta la más larga (en una pausa)


def preparar(nombre: str, salida: Path) -> dict:
    """La versión de línea de comandos: busca al narrador por nombre con su
    propio cliente y solo avisa si no llega al piso (la prueba de oído sigue
    igual). El worker usa `narrar.preparar_voz`, que sí se planta."""
    config = cargar_config()
    sb = cliente(config)
    narrador = narrador_por_nombre(sb, nombre)
    respuestas = respuestas_de(sb, narrador["id"])
    return preparar_de(sb, narrador, respuestas, salida)


def preparar_de(sb, narrador: dict, respuestas: list[Respuesta], salida: Path) -> dict:
    """Baja, limpia y deja en `salida` las muestras, la referencia y el texto
    de prueba. Devuelve el resumen (lo mismo que queda en `muestras.json`)."""
    log.info("narrador %s (%s): %d respuestas", narrador["nombre"], narrador["id"][:8], len(respuestas))

    crudas = salida / "crudas"
    limpias = salida / "limpias"
    limpias.mkdir(parents=True, exist_ok=True)

    seleccion = elegir_muestras(respuestas)
    if not seleccion.respuestas:
        raise SystemExit("no hay ninguna respuesta con audio de 20 s o más: nada que clonar")

    detalle = []
    segundos_limpios = 0.0
    for r in seleccion.respuestas:
        nombre_wav = f"dia_{r.pregunta_orden:02d}_{r.id[:8]}.wav"
        cruda = descargar_audio(sb, r.audio_path, crudas / Path(r.audio_path).name)
        limpia = a_wav_limpio(cruda, limpias / nombre_wav)
        seg = duracion(limpia)
        segundos_limpios += seg
        detalle.append(
            {
                "respuesta_id": r.id,
                "pregunta_orden": r.pregunta_orden,
                "archivo": nombre_wav,
                "segundos_limpios": round(seg, 1),
            }
        )
        log.info("  día %02d: %.0f s crudos → %.0f s limpios", r.pregunta_orden, r.duracion_segundos or 0, seg)

    if segundos_limpios < PISO_SEGUNDOS:
        log.warning(
            "SOLO %.0f s limpios (el piso para producción son %d s). "
            "La prueba de oído sigue igual; el worker no clonaría con esto.",
            segundos_limpios,
            PISO_SEGUNDOS,
        )

    ref = elegir_referencia(respuestas)
    if ref is not None:
        cruda = descargar_audio(sb, ref.audio_path, crudas / Path(ref.audio_path).name)
        a_wav_limpio(cruda, salida / "referencia.wav")
        referencia_texto = (ref.transcripcion or "").strip()
        log.info(
            "referencia: día %02d entera (%.0f s), con su transcripción",
            ref.pregunta_orden,
            ref.duracion_segundos or 0,
        )
    else:
        from .transcribir import transcribir_clip

        mas_larga = seleccion.respuestas[0]
        cruda = descargar_audio(sb, mas_larga.audio_path, crudas / Path(mas_larga.audio_path).name)
        limpia_tmp = a_wav_limpio(cruda, salida / "referencia_larga.wav")
        recortar_en_pausa(limpia_tmp, salida / "referencia.wav", maximo=SEGUNDOS_RECORTE, minimo=12)
        log.info(
            "no hay respuesta entera de 12-30 s: recorto %d s del día %02d y la transcribo con Whisper (API de OpenAI)",
            SEGUNDOS_RECORTE,
            mas_larga.pregunta_orden,
        )
        referencia_texto = transcribir_clip(salida / "referencia.wav")
        ref = mas_larga
    (salida / "referencia.txt").write_text(referencia_texto, encoding="utf-8")

    texto = texto_de_prueba([r.transcripcion or "" for r in respuestas], excluir=ref.transcripcion)
    (salida / "texto.txt").write_text(texto, encoding="utf-8")

    resumen = {
        "narrador": {"id": narrador["id"], "nombre": narrador["nombre"]},
        "muestras": detalle,
        "segundos_limpios": round(segundos_limpios, 1),
        "alcanza_piso": segundos_limpios >= PISO_SEGUNDOS,
        "referencia": {
            "respuesta_id": ref.id,
            "pregunta_orden": ref.pregunta_orden,
            "segundos": round(duracion(salida / "referencia.wav"), 1),
        },
    }
    (salida / "muestras.json").write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info(
        "listo: %d muestras, %.0f s limpios, referencia de %.0f s. Texto de la prueba en %s (editalo si querés otro párrafo).",
        len(detalle),
        segundos_limpios,
        resumen["referencia"]["segundos"],
        salida / "texto.txt",
    )
    return resumen


def main() -> None:
    # La consola de Windows arranca en cp1252 y no sabe imprimir "→" ni "…".
    for flujo in (sys.stdout, sys.stderr):
        if hasattr(flujo, "reconfigure"):
            flujo.reconfigure(encoding="utf-8", errors="replace")
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--narrador", required=True, help="nombre del narrador tal como está en la tabla (sin distinguir mayúsculas)")
    p.add_argument("--salida", default=None, help="carpeta de salida (por defecto CARPETA_TRABAJO/muestras)")
    args = p.parse_args()
    salida = Path(args.salida) if args.salida else cargar_config().carpeta_trabajo / "muestras"
    preparar(args.narrador, salida)


if __name__ == "__main__":
    main()
