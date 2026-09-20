"""Lectura del `narracion.json` que deja la fábrica en `{narrador}/paquete/`.

Lógica pura, sin red: parsea el contrato (ver `supabase/CONTRATO.md`, sección
"Narraciones (voz clonada)") y valida que los capítulos estén completos y
numerados 1..N sin huecos, en el orden en que vienen en el JSON.
"""

import json
from dataclasses import dataclass

from .pausas import SEPARADOR_HISTORIA


@dataclass(frozen=True)
class Historia:
    """Una respuesta con audio real, tal como la lista la fábrica (v2)."""

    respuesta_id: str
    pregunta_orden: int
    es_repregunta: bool
    audio_path: str
    segundos: int
    pregunta: str
    texto: str


@dataclass(frozen=True)
class Conectores:
    """Lo que la voz clonada dice entre historias (v2). Texto plano, primera persona."""

    entrada: str = ""
    entre: tuple[str, ...] = ()
    salida: str = ""


@dataclass(frozen=True)
class Capitulo:
    numero: int
    nombre: str
    texto: str
    modo: str = "clonado"  # "clonado" | "hibrido"
    historias: tuple[Historia, ...] = ()
    conectores: Conectores = Conectores()


def capitulos_de_narracion(texto_json: str) -> list[Capitulo]:
    """Los capítulos de `narracion.json`, v1 (solo `texto`, todo clonado) o v2
    (directiva 04: `modo`, `historias`, `conectores`). Valida el contrato:
    numerados 1..N, nombre, y en híbrido ≥ 1 historia con audio y un puente
    `entre` por cada par de historias."""
    datos = json.loads(texto_json)
    version = int(datos.get("version") or 1)
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
        modo = (crudo.get("modo") or "clonado") if version >= 2 else "clonado"
        if modo not in ("clonado", "hibrido"):
            raise ValueError(f"capítulo {numero}: modo desconocido {modo!r}")
        if modo == "clonado":
            if not texto.strip():
                raise ValueError(f"capítulo {numero} sin texto")
            capitulos.append(Capitulo(numero=numero, nombre=nombre, texto=texto))
            continue
        historias = tuple(
            Historia(
                respuesta_id=str(h.get("respuesta_id") or ""),
                pregunta_orden=int(h.get("pregunta_orden") or 0),
                es_repregunta=bool(h.get("es_repregunta", False)),
                audio_path=str(h.get("audio_path") or ""),
                segundos=int(h.get("segundos") or 0),
                pregunta=str(h.get("pregunta") or ""),
                texto=str(h.get("texto") or ""),
            )
            for h in crudo.get("historias") or []
        )
        if not historias or any(not h.audio_path for h in historias):
            raise ValueError(f"capítulo {numero} híbrido: toda historia necesita audio_path y tiene que haber al menos una")
        c = crudo.get("conectores") or {}
        entre = tuple(str(x or "") for x in (c.get("entre") or []))
        if len(entre) != len(historias) - 1:
            raise ValueError(
                f"capítulo {numero} híbrido: {len(historias)} historias piden {len(historias) - 1} puentes, vienen {len(entre)}"
            )
        if any(not x.strip() for x in entre):
            raise ValueError(f"capítulo {numero} híbrido: ningún puente `entre` puede venir vacío")
        capitulos.append(
            Capitulo(
                numero=numero,
                nombre=nombre,
                texto=texto,
                modo="hibrido",
                historias=historias,
                conectores=Conectores(entrada=str(c.get("entrada") or ""), entre=entre, salida=str(c.get("salida") or "")),
            )
        )
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


def textos_de_conectores(capitulo: Capitulo) -> list[tuple[str, str]]:
    """Lo que la voz clonada narra en un capítulo híbrido, en orden, como
    (nombre, texto): el anuncio con la entrada (si hay), cada puente, la salida
    (si hay). El anuncio y la entrada van juntos, separados por `* * *` (la
    pausa larga). Los que vienen vacíos no se narran."""
    c = capitulo.conectores
    entrada = anuncio_de(capitulo)
    if c.entrada.strip():
        entrada += f"\n\n{SEPARADOR_HISTORIA}\n\n{c.entrada.strip()}"
    piezas = [("c0_anuncio_entrada", entrada + "\n")]
    for k, puente in enumerate(c.entre, start=1):
        piezas.append((f"c{k}_entre", puente.strip() + "\n"))
    if c.salida.strip():
        piezas.append((f"c{len(c.entre) + 1}_salida", c.salida.strip() + "\n"))
    return piezas
