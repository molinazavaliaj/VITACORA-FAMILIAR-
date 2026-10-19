"""El worker: corta las frases de «Su voz» y avisa que está vivo.

Corre en la PC de música como tarea programada (ver README, "El worker").
Cada vuelta late (tabla `latidos`, servicio 'voz') y atiende los pedidos de
corte de frases que haya en el paquete de cada narrador: son audios reales, sin
motor de voz. Si no hubo nada, duerme `INTERVALO_SEGUNDOS`. Una frase que falla
no tira abajo el bucle: se anota el error (también en `logs/worker.log`) y se
sigue con lo próximo.

Antes (hasta el 16/10/2026) también narraba el audiolibro con voz clonada desde
la tabla `narraciones`; ese camino se sacó entero porque el producto ya no lo
vende.
"""

import logging
import sys
import time
from logging.handlers import RotatingFileHandler

from .buzon import latir
from .config import RAIZ, Config, cargar_config
from .procesar_frases import procesar_pedido
from .supabase_cliente import cliente

log = logging.getLogger("voz.worker")


def procesar_pedidos(sb, config: Config, log: logging.Logger) -> int:
    """Los pedidos de corte de «Su voz» de una vuelta: cuántas frases cortó.

    Si Storage no contesta, el JSON está roto o cualquier cosa del audio se
    cae, se anota y se devuelve 0 — el worker nunca se muere por una frase. El
    pedido queda en su lugar, así que la vuelta siguiente lo vuelve a intentar.
    """
    try:
        cortadas = procesar_pedido(sb, config, log)
    except Exception:  # noqa: BLE001 — el worker no se muere por un pedido
        log.exception("los pedidos de frases fallaron; sigo en la próxima vuelta")
        return 0
    if cortadas:
        log.info("corté %d frases de «Su voz»", cortadas)
    return cortadas


def una_vuelta(sb, config: Config, log: logging.Logger) -> bool:
    """Una vuelta del bucle. Devuelve True si cortó algo: así el bucle no
    duerme cuando quedó trabajo hecho (puede haber más pedidos esperando)."""
    return procesar_pedidos(sb, config, log) > 0


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
    sb = cliente(config)
    log.info("worker arriba (frases de «Su voz»); sondeo cada %d s", config.intervalo_segundos)
    vueltas = 0  # seguidas sin trabajo
    try:
        while True:
            # Late en cada vuelta, antes de buscar trabajo: es lo que mira el
            # panel para distinguir «no hay pedidos» de «la PC se cayó».
            latir(sb, {"trabajo": "frases", "vueltas": vueltas})
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
