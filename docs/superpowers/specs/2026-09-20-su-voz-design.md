# "Su voz" — las mejores frases del narrador, en su voz — diseño

Fecha: 2026-09-20 (madrugada). Aprobado por Naza parte por parte en la sesión de
brainstorming (superpowers) del 20/09. **Reemplaza al producto "El audiolibro"**, descartado
ese mismo día (el porqué está en `ESTADO.md`, entrada del 20/09). La mitad "voz clonada" de
`ROADMAP 3t.14` queda sin uso activo: ver "Qué se descarta".

## El dolor que ataca

De él van a quedar fotos. Y quizá un audio suelto, un mensaje que nadie borró. Lo que no queda
es **lo que decía**: sus frases, sus dichos, la forma de contarlo.

"Su voz" es eso: un archivo de sus mejores frases y anécdotas **en su voz real** — no clonada,
no narrada, no resumida — que se escucha en el panel, se descarga, se imprime en el libro (con
un código al lado) y se reenvía por WhatsApp.

**La frase que lo vende:** *"De él vas a tener fotos. Con esto, lo que decía."*

## Decisiones de producto (Naza, 20/09)

- **El audiolibro se descarta.** La voz clonada compite contra la voz real que la familia ya
  escuchó en el anticipo, 70 minutos son un compromiso y un TTS lo hace cualquiera.
- **Los tres escalones** (los tres, prometidos ya en `web/src/lib/productos.ts`):
  1. **Base — PDF del libro + Su voz.** "Su voz" va **incluida**, no es línea aparte.
  2. **Base + libro impreso tapa dura.**
  3. **Base + impreso + marco con su foto** (el NFC: "se acerca el teléfono y suena su voz").
- **El base es descargable** y aparece **cuando el libro está cerrado** (`libro_aprobado_at`).
- **La familia puede cambiar las frases** desde el panel: escucharlas, quitar, reemplazar por
  otra candidata, reordenar. Si nadie toca nada, va lo que eligió el modelo.
- **Cuándo se cierra la selección: cuando aprietan "imprimir"** (decidido el 20/09). La base se
  entrega al cerrar el libro con la selección del biógrafo y el panel queda abierto para
  cambiarla todo lo que quieran. El QR impreso es la selección que esté puesta en ese momento.
  **A los 15 días sin ninguna confirmación se manda un mail de recordatorio**; si aun así nadie
  responde, la selección del biógrafo queda como definitiva (y el panel lo dice).
- **Automatizado de punta a punta:** el **mismo modelo que escribe el libro** propone las
  candidatas y, en una **segunda pasada con contexto fresco**, elige las finales. No hay
  curaduría manual frase por frase.
- **Nada se envía hasta que el libro esté terminado.** El panel muestra lo que va apareciendo;
  el anticipo (3ª respuesta) sigue como está.
- **El audio es tal cual lo dijo.** El worker **corta, restaura y empareja nivel**: no corta el
  arranque que responde a la pregunta, no acorta silencios, no cambia velocidad, no mete pausas.
  (A diferencia de los capítulos del híbrido, que sí pasaban por `ritmo.py`.)
- El destino del código impreso y del chip NFC es **la misma página pública** que el panel.

## La unidad: qué es una frase

- **10-25 s** de audio real, cortados donde él la dijo (arranca en la frase, no antes).
- Se **imprime**: la frase, su capítulo y el código.
- Se **escucha**: la frase; y debajo, **"escuchar la historia completa (2:14)"** = la respuesta
  original entera, restaurada. Sale gratis: ese audio ya existe en Storage.
- **3 por capítulo** (24 en un libro de 8), editable en el panel — decidido el 20/09.
- Las **5 candidatas por capítulo se cortan todas**, no solo las 3 elegidas: así el panel cambia
  una frase al instante, sin esperar a la PC.
- Máximo una frase por tema: dos veces el mismo tema no entra.

## Arquitectura

```
fábrica (Railway)
  1. propone: el modelo que escribió el libro marca candidatas por capítulo (5 por capítulo)
  2. aprueba: segunda pasada, contexto fresco, elige 3 y explica por qué (queda en el panel)
  3. escribe {narrador}/paquete/frases.json y lo deja en el paquete
  4. arma la sección impresa (frase + código) y el PDF
  5. arma el paquete final y entrega; el panel y la página pública leen el paquete

worker de voz (PC de música, GPU)
  tarea nueva del buzón, encolada por la fábrica en el paquete:
  ubica cada corte alineando el texto de la cita contra las marcas por palabra de Whisper
  (ya cacheadas por hash del audio); si la cita junta pedazos distintos de la respuesta, toma
  el pedazo más largo y lo anota → corta → restaura (RESTAURACION_NIVEL) → masteriza a −19 LUFS
  → sube {narrador}/voz/frases/cNN_MM.mp3 y completa inicio, fin y segundos en frases.json

web (Vercel)
  /tablero/[narradorId]/frases   escuchar y cambiar (la familia)
  /voz/[token]                   público, sin login: el destino del QR y del NFC
  checkout                       sale la línea "El audiolibro"
```

Sin migración: las frases viven en el paquete (`frases.json` + mp3), y la web ya sabe leer el
paquete del narrador (`web/src/lib/muestra.ts` lista `{narrador}/paquete`). **`CONTRATO.md` no
cambia en la base**, solo suma la sección del paquete nuevo.

## Contrato: `{narrador}/paquete/frases.json`

```json
{
  "version": 1,
  "narrador_id": "uuid",
  "pedido_id": "uuid",
  "confirmado_at": "2026-09-20T23:40:00Z | null",
  "capitulos": [
    {
      "numero": 3,
      "capitulo": "La juventud",
      "candidatas": [
        {
          "id": "c03-01",
          "texto": "Yo nunca quise ser como mi viejo.",
          "respuesta_id": "uuid | null",
          "pregunta_orden": 11,
          "inicio": 41.2,
          "fin": 53.6,
          "segundos": 12.4,
          "audio_path": "3691baf4-.../voz/frases/c03_01.mp3 | null",
          "estado": "cortada | fallida",
          "por_que": "una línea que se repite en la mesa",
          "elegida": true,
          "elegida_por": "modelo | familia"
        }
      ]
    }
  ]
}
```

Escritores: la **fábrica** crea el archivo con las candidatas y marca las elegidas (pasos 1-3);
el **worker** completa `audio_path`, `segundos`, `inicio`, `fin` y `estado: "cortada"` (es el
único que mide el audio); la **web** marca `elegida`/`elegida_por` y `confirmado_at` cuando la
familia guarda. Un escritor por campo, como todo el repo.

## Cómo se eligen (los prompts y las dos pasadas)

Criterios, en orden (los usan las dos pasadas):

1. La que se repetiría en una mesa, años después.
2. Escrita **en su voz** (no información: "nació en 1943" no es una frase).
3. Que **se entienda sola**, sin el resto de la historia.
4. Que no hiera a alguien que está vivo (nombres, peleas, plata).
5. Una por tema: no repetir.
6. Nunca una respuesta con `reservada` (hallazgo 19).

La primera pasada devuelve 5 candidatas por capítulo con el **tramo textual** de cada una
(para poder alinearla con el audio). La segunda elige 3 y escribe `por_que` en una línea — ese
texto es el que la familia ve en el panel al lado de cada frase, y es lo que hace confiable
una selección automática.

Los textos de los prompts al modelo los aprueba Naza antes de mergear (regla de la casa).

## El panel de la familia

- Página nueva `web/src/app/tablero/[narradorId]/frases`, hermana de "nombres" (esa ya hace
  que la familia revise y corrija lo que propuso el sistema): se escucha, se cambia, se guarda.
- Aparece junto con la descarga: libro cerrado.
- **Portón de impresión:** la selección se cierra cuando aprietan **"imprimir"**, no antes; el
  archivo digital ya lo tienen con lo que eligió el biógrafo. Recordatorio por mail a los 15 días
  sin confirmación; sin respuesta, se imprime la selección del biógrafo.

## La página pública (el QR y el NFC)

- `/voz/[token]`: **sin login**, pensada para el celular, la tipografía grande. La frase, el
  play, "escuchar la historia completa", y debajo las otras frases (por capítulo).
- Cada frase con su ancla (`/voz/[token]#f3`) para mandar **una sola** por WhatsApp.
- Respeta `reservada`. Nombre del narrador solo como lo muestra el libro.
- Reusa el patrón que ya existe para la muestra (`/libro/[token]` + `/api/libro-muestra/[token]/audio`).

## Qué se descarta / qué queda sin uso

- **Checkout:** sale "El audiolibro" y sus dos voces (`Voz = "clonada" | "real"`).
- **La narración de capítulos y los conectores** quedan sin uso activo. Los motores de TTS
  (`voz/motores/`) no se borran: si algún día vuelve un producto narrado, están.
- `voz/ritmo.py` **no** se usa para las frases. Sí se usan `restaurar.py` y `masterizar.py`.
- La corrida híbrida encolada el 20/09 queda solo como veredicto de oído, no como entrega.

## Costos (lo que cambia)

| | Audiolibro (lo que se descarta) | Su voz |
|---|---|---|
| GPU por cliente | ~1 h (70 min de audio) | segundos de cómputo (~13 min de audio a restaurar: 40 candidatas × 20 s) |
| Modelo | conectores por capítulo | 2 pasadas por capítulo (~16 llamadas cortas) |
| Dependencia | la PC para todo el libro | la PC unos minutos (corte + restauración) |

Se mide el costo real de las dos pasadas con el set dorado antes de mergear (método de la casa).

## Lo que hay que construir (borrador para el plan)

**fábrica** — `src/libro/frases.ts` (prompts, las dos pasadas, `frases.json`), la sección impresa
en el libro y el PDF, el encolado del corte, la entrega cuando las frases están listas (con
fallback: si el worker no contesta, el libro se entrega igual y las frases llegan después, con
el panel diciendo "Su voz se está preparando").

**web (Joaquín)** — quitar la línea del audiolibro del checkout y su copy; la página
`/tablero/[narradorId]/frases`; `/voz/[token]` y su API de audio; la descarga del base.

**voz (PC de música)** — tarea nueva del buzón: "cortar frases" (`frases.json` → mp3
restaurados, sin ritmo), con candado y reintento. Directiva aparte.

## Fuera de alcance

- La impresión física y el proveedor (fase 2, ya mapeada).
- Elegir la estética del libro (fase 2).
- La contratapa ya usa **una** frase del narrador elegida por el editor: ahora puede salir de
  este archivo, pero es otro cambio.

## Decisiones abiertas

1. ~~Cuántas frases por capítulo~~ — **3** (decidido el 20/09).
2. ~~Cuántos días se espera la confirmación~~ — **no es un plazo: se cierra al apretar
   "imprimir"**, con recordatorio por mail a los 15 días y la selección del biógrafo como
   definitiva si nadie responde (decidido el 20/09).
3. El marco NFC: ¿arranca en las frases o en la historia completa? (propuesto: las frases, con
   el botón de historia completa) — sin respuesta todavía.
4. El texto de los prompts de las dos pasadas (lo aprueba Naza).
