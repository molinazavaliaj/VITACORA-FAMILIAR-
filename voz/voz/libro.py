"""Lectura del `narracion.json` que deja la fábrica en `{narrador}/paquete/`.

Lógica pura, sin red: parsea el contrato (ver `supabase/CONTRATO.md`, sección
"Narraciones (voz clonada)") y valida que los capítulos estén completos y
numerados 1..N sin huecos, en el orden en que vienen en el JSON.
"""

import json
from dataclasses import dataclass


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
