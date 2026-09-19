"""Lectura del `narracion.json` que deja la fábrica en `{narrador}/paquete/`.

Lógica pura, sin red: parsea el contrato (ver `supabase/CONTRATO.md`, sección
"Narraciones (voz clonada)") y valida que los capítulos estén completos y
numerados 1..N sin huecos, en el orden en que vienen en el JSON.
"""

import json
from dataclasses import dataclass

from .pausas import SEPARADOR_HISTORIA


@dataclass(frozen=True)
class Capitulo:
    numero: int
    nombre: str
    texto: str


def capitulos_de_narracion(texto_json: str) -> list[Capitulo]:
    datos = json.loads(texto_json)
    crudos = datos.get("capitulos", [])
    capitulos = []
    for posicion, crudo in enumerate(crudos, start=1):
        numero = crudo.get("numero")
        if numero != posicion:
            raise ValueError(
                f"narracion.json: numeración de capítulos esperaba {posicion}, encontré {numero!r}"
            )
        nombre = crudo.get("nombre") or ""
        if not nombre.strip():
            raise ValueError(f"capítulo {numero} sin nombre")
        texto = crudo.get("texto") or ""
        if not texto.strip():
            raise ValueError(f"capítulo {numero} sin texto")
        capitulos.append(Capitulo(numero=numero, nombre=nombre, texto=texto))
    return capitulos


def ruta_capitulo(narrador_id: str, numero: int) -> str:
    return f"{narrador_id}/voz/cap_{numero:02d}.mp3"


# --- El anuncio del capítulo (CONTRATO, regla de la central 19/09) ---
# En el audiolibro clonado no suena ninguna voz que no sea la del narrador: la
# fábrica dejó de pegar la intro TTS de OpenAI y el worker narra él mismo
# "Capítulo uno. La infancia." antes del texto, con la voz clonada. El número va
# en palabras (un motor lee "1" de cualquier manera), cada parte termina en
# punto para que el partidor de frases las deje solas y el pegado meta la pausa.

_UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"]
_ESPECIALES = {
    10: "diez", 11: "once", 12: "doce", 13: "trece", 14: "catorce", 15: "quince",
    16: "dieciséis", 17: "diecisiete", 18: "dieciocho", 19: "diecinueve", 20: "veinte",
    21: "veintiuno", 22: "veintidós", 23: "veintitrés", 24: "veinticuatro", 25: "veinticinco",
    26: "veintiséis", 27: "veintisiete", 28: "veintiocho", 29: "veintinueve",
}
_DECENAS = {30: "treinta", 40: "cuarenta", 50: "cincuenta", 60: "sesenta", 70: "setenta", 80: "ochenta", 90: "noventa"}


def numero_en_palabras(n: int) -> str:
    """1..99 en palabras; fuera de eso, el número tal cual (no hay libros de 100 capítulos)."""
    if 1 <= n <= 9:
        return _UNIDADES[n]
    if n in _ESPECIALES:
        return _ESPECIALES[n]
    if 30 <= n <= 99:
        decena, unidad = (n // 10) * 10, n % 10
        return _DECENAS[decena] if unidad == 0 else f"{_DECENAS[decena]} y {_UNIDADES[unidad]}"
    return str(n)


def anuncio_de(capitulo: Capitulo) -> str:
    """'Capítulo dos. Las raíces.' — lo que el narrador dice antes del texto."""
    nombre = capitulo.nombre.strip()
    if nombre and nombre[-1] not in ".!?…":
        nombre += "."
    return f"Capítulo {numero_en_palabras(capitulo.numero)}. {nombre}"


def texto_a_narrar(capitulo: Capitulo) -> str:
    """El anuncio, el separador de historia (la pausa larga de voz/pausas.py) y
    después el texto del capítulo."""
    return f"{anuncio_de(capitulo)}\n\n{SEPARADOR_HISTORIA}\n\n{capitulo.texto.strip()}\n"
