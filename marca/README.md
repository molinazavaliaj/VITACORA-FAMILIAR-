# Marca — Vitácora Familiar

**Identidad oficial desde el 2026-09-07 (sesión conjunta Naza + Joaquín): el
logo "Campo V·F"** — campo toroidal de 7 anillos con las iniciales. Blanco y
negro, con violeta `#5D3FD3` como único acento.

**Para construir cualquier pieza, leer `docs/design.md`** (tokens, escala de
grises, reglas). El porqué de cada decisión está en `docs/identidad-de-marca.md`.
El manual presentable es el PDF de acá. Lienzo editable:
https://claude.ai/code/artifact/7082af64-6171-48f1-bf19-09b70f67f4ca

## Archivos

| Archivo | Qué es | Dónde se usa |
|---|---|---|
| `logo-campo-vf-negro.svg` | Campo V·F completo, tinta sobre claro | La principal sobre fondos claros |
| `logo-campo-vf-blanco.svg` | Campo V·F completo, blanco sobre oscuro | La principal sobre fondos oscuros |
| `toroide-negro.svg` · `toroide-blanco.svg` | Solo los anillos, sin letras ni eje | Todo lo que sea chico |
| `avatar-toroide-negro.svg` · `-blanco.svg` | Toroide centrado en cuadrado 512 | Avatar de IG, favicon |
| `lockup-horizontal-negro.svg` · `-blanco.svg` | Toroide solo + VITÁCORA FAMILIAR | Encabezados de web y documentos |
| `Manual-de-marca-Vitacora-Familiar.pdf` | Manual de marca (6 páginas) | Presentable |
| `avatar-ig-vf-negro-1024.png` · `-blanco-1024.png` | Avatares en PNG | Donde no se pueda usar SVG |
| `sello-vf-vino.png` · `sello-vf-crema.png` · `logotipo-separador-crema.png` | Identidad anterior (Higgsfield) | ARCHIVO — ya no se usan |

## Versiones que NO existen

El **reducido de 3 anillos** y el **apilado** que aparecen en el PDF quedaron
**eliminados** el 07/09. La regla: **o el Campo completo, o el toroide solo.**
Nada intermedio. El lockup horizontal conserva su disposición pero lleva el
toroide solo.

## Dos cosas técnicas sobre los SVG

1. **Los que llevan letras dependen de Playfair Display.** Traen un `@import` de
   Google Fonts, así que en un navegador se ven bien — pero **para imprenta o PDF
   hay que vectorizar el texto**. El toroide solo no tiene ese problema: es
   geometría pura.
2. **Grosor mínimo de línea en papel: 0.25 mm.** Los siete anillos están muy
   juntos; más finos que eso se empastan. Por debajo de 120 px en papel va el
   toroide solo.

## Regla de uso de IA en imágenes

Ornamentos, sellos, texturas y objetos se pueden generar. **Caras humanas
generadas por IA, no** — la promesa de la marca es la voz y las historias
REALES, y un "abuelo de IA" en un ad la contradice. Dentro del libro de un
cliente, jamás imágenes generadas de su familia.
