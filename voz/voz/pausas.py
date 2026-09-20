"""Las pausas del audiolibro, en un solo lugar (pedido de Naza, central 19/09).

El motor no decide las pausas: `texto.partir_en_tramos` corta por puntuación y
se acuerda de qué signo cerró cada tramo; `motores.comun.pegar_tramos` pone el
silencio que corresponde a ese signo, siempre el mismo. Lo que separa historias
(y el anuncio del capítulo del texto) es el separador tipográfico `* * *` en
una línea sola.

Naza las ajusta sin tocar código: en `voz/.env`,
    PAUSAS_MS=coma=250,punto=500,suspensivos=700,parrafo=1000,historia=1200
(las que no nombre quedan como acá). Y el modo de corte:
    TRAMOS=oracion   (a) un tramo por oración; las comas las pausa el motor y
                     se igualan a `coma` ms después
    TRAMOS=coma      (b) también se corta en comas; cada coma es un silencio
                     insertado de `coma` ms
"""

import os

# Solo numpy/soundfile en los venvs de los motores: este módulo no importa nada
# del resto de `voz` para que `motores/comun.py` lo pueda usar.

PAUSAS_MS_DEFAULT: dict[str, int] = {
    "coma": 250,  # , ; :
    "punto": 500,  # . ? !
    "suspensivos": 700,  # …
    "parrafo": 1000,  # línea en blanco
    "historia": 1200,  # `* * *`: entre historias y tras el anuncio del capítulo
    "ninguno": 350,  # el tramo no terminó en puntuación (corte por largo): la pausa de siempre
}

CIERRES = tuple(PAUSAS_MS_DEFAULT)
SEPARADOR_HISTORIA = "* * *"
MODOS_TRAMOS = ("oracion", "coma")


def pausas_ms(entorno: dict | None = None) -> dict[str, int]:
    """Las pausas vigentes: las de acá, pisadas por lo que haya en PAUSAS_MS."""
    entorno = os.environ if entorno is None else entorno
    vigentes = dict(PAUSAS_MS_DEFAULT)
    crudo = (entorno.get("PAUSAS_MS") or "").strip()
    if not crudo:
        return vigentes
    for par in crudo.split(","):
        if "=" not in par:
            continue
        clave, valor = (x.strip() for x in par.split("=", 1))
        if clave in vigentes and valor.isdigit():
            vigentes[clave] = int(valor)
    return vigentes


def modo_tramos(entorno: dict | None = None) -> str:
    entorno = os.environ if entorno is None else entorno
    modo = (entorno.get("TRAMOS") or "oracion").strip().lower()
    return modo if modo in MODOS_TRAMOS else "oracion"
