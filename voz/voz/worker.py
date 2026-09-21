"""El worker: sondea el buzón `narraciones` y los pedidos de frases de «Su voz».

Corre en la PC de música como tarea programada (ver README, "El worker").
Cada vuelta atiende los pedidos de corte de frases que haya en el paquete de
cada narrador (no usan el motor ni la tabla `narraciones`: son audios reales) y
después libera las narraciones colgadas, toma la pendiente más vieja y la lleva
a `lista` o a `fallida`; si no hay nada, duerme `INTERVALO_SEGUNDOS`. Ni una
narración ni una frase que fallan tiran abajo el bucle: se anota el error (y en
`logs/worker.log`) y se sigue con lo próximo.
"""

import logging
import sys
import time
import traceback
from logging.handlers import RotatingFileHandler

from .buzon import consentimiento_de, marcar, retomar_colgadas, tomar_pendiente
from .config import RAIZ, Config, cargar_config
from .libro import capitulos_de_narracion
from .narrar import FaltanMinutos, narrar_capitulos, preparar_voz
from .procesar_frases import procesar_pedido
from .supabase_cliente import BUCKET, cliente

log = logging.getLogger("voz.worker")


def RUTA_NARRACION_JSON(narrador_id: str) -> str:
    """Dónde deja la fábrica el libro para narrar (`supabase/CONTRATO.md`)."""
    return f"{narrador_id}/paquete/narracion.json"


def descargar_texto(sb, ruta: str) -> str:
    return sb.storage.from_(BUCKET).download(ruta).decode("utf-8")


def resumen_traceback(e: BaseException) -> str:
    """`Tipo: mensaje` más los últimos tres frames, para que quepa en la fila."""
    cabecera = f"{type(e).__name__}: {e}"
    frames = "".join(traceback.format_tb(e.__traceback__)[-3:])
    return f"{cabecera}\n{frames}".strip()[:1500]


def procesar_una(sb, config: Config, log: logging.Logger) -> bool:
    """Toma una narración y la procesa entera. Devuelve True si tomó algo."""
    retomar_colgadas(sb)
    n = tomar_pendiente(sb)
    if n is None:
        return False

    log.info("tomé la narración %s de %s", n.id[:8], n.narrador_id[:8])
    try:
        if consentimiento_de(sb, n.narrador_id) is None:
            log.warning("fallida: sin_consentimiento_voz")
            _marcar_fallida(sb, n.id, "sin_consentimiento_voz", config, log)
            return True
        carpeta = config.carpeta_trabajo / "narraciones" / n.id
        carpeta.mkdir(parents=True, exist_ok=True)
        capitulos = capitulos_de_narracion(descargar_texto(sb, RUTA_NARRACION_JSON(n.narrador_id)))
        referencia, referencia_texto, resumen = preparar_voz(sb, n.narrador_id, carpeta)
        rutas = narrar_capitulos(
            sb, n, capitulos, config.motor, referencia, referencia_texto, carpeta,
            config.carpeta_modelos, n.capitulos_paths, log,
        )
        marcar(sb, n.id, "lista", capitulos_paths=rutas, muestras=resumen, motor=config.motor)
        log.info("listo: %d capítulos", len(rutas))
    except FaltanMinutos as e:
        motivo = f"faltan_minutos_de_voz: {e.segundos:.0f} s"
        log.warning("fallida: %s", motivo)
        _marcar_fallida(sb, n.id, motivo, config, log)
    except Exception as e:
        log.exception("fallida: %s: %s", type(e).__name__, e)
        _marcar_fallida(sb, n.id, resumen_traceback(e), config, log)
    return True


def _marcar_fallida(sb, id: str, motivo: str, config: Config, log: logging.Logger) -> None:
    """Anota el error en la fila; si ni eso se puede (Supabase caído), solo lo loguea."""
    try:
        marcar(sb, id, "fallida", error=motivo, motor=config.motor)
    except Exception:
        log.exception("no pude marcar fallida la narración %s; sigo", id[:8])


def procesar_pedidos(sb, config: Config, log: logging.Logger) -> int:
    """Los pedidos de corte de «Su voz» de una vuelta: cuántas frases cortó.

    Es el gancho al bucle, con el mismo cuidado de siempre: si Storage no
    contesta, el JSON está roto o cualquier cosa del audio se cae, se anota y
    se devuelve 0 — el worker nunca se muere por una frase. El pedido queda en
    su lugar, así que la vuelta siguiente lo vuelve a intentar.
    """
    try:
        cortadas = procesar_pedido(sb, config, log)
    except Exception:  # noqa: BLE001 — el worker no se muere por un pedido
        log.exception("los pedidos de frases fallaron; sigo con las narraciones")
        return 0
    if cortadas:
        log.info("corté %d frases de «Su voz»", cortadas)
    return cortadas


def una_vuelta(sb, config: Config, log: logging.Logger) -> bool:
    """Una vuelta del bucle: primero los pedidos de frases, después una narración.

    Devuelve True si hubo trabajo (de cualquiera de las dos cosas): así el bucle
    no duerme cuando quedó algo hecho. Cada mitad va en su propio `try`: si
    Supabase o la red fallan, se anota y se sigue (el worker duerme y vuelve a
    intentar, no se cae).
    """
    hubo_frases = procesar_pedidos(sb, config, log) > 0
    try:
        return procesar_una(sb, config, log) or hubo_frases
    except Exception:
        log.exception("la narración de esta vuelta falló; sigo con la próxima")
        return hubo_frases


def preparar_logs() -> None:
    # La consola de Windows arranca en cp1252 y no sabe imprimir "→" ni "…".
    for flujo in (sys.stdout, sys.stderr):
        if hasattr(flujo, "reconfigure"):
            flujo.reconfigure(encoding="utf-8", errors="replace")
    carpeta = RAIZ / "logs"
    carpeta.mkdir(exist_ok=True)
    formato = logging.Formatter("%(asctime)s %(levelname)s %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    archivo = RotatingFileHandler(carpeta / "worker.log", maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8")
    consola = logging.StreamHandler(sys.stdout)
    for h in (archivo, consola):
        h.setFormatter(formato)
    logging.basicConfig(level=logging.INFO, handlers=[archivo, consola])


def main() -> None:
    preparar_logs()
    config = cargar_config()
    if not config.motor:
        raise SystemExit("Falta MOTOR en .env: el ganador de la prueba de oído (chatterbox | qwen3tts | f5tts | omnivoice).")
    sb = cliente(config)
    log.info("worker arriba con el motor %s; sondeo cada %d s", config.motor, config.intervalo_segundos)
    vueltas = 0  # seguidas sin trabajo
    try:
        while True:
            if una_vuelta(sb, config, log):
                vueltas = 0
                continue
            vueltas += 1
            if vueltas % 10 == 0:
                log.info("esperando… (%d vueltas sin trabajo)", vueltas)
            time.sleep(config.intervalo_segundos)
    except KeyboardInterrupt:
        log.info("hasta luego")
        sys.exit(0)


if __name__ == "__main__":
    main()
