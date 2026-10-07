# Escritor v5.5 — pruebas

## Por qué la v5.5 (06/10/2026)
Joaquín leyó su libro v5.3.1 (entrevista nueva, 110 respuestas): le gustó y el orden de la historia le pareció perfecto. Marcó entradas de capítulo que nombran algo que el lector todavía no sabe qué es, fórmulas de edad repetidas, una enumeración confusa, un párrafo de la intro flojo, un año de nacimiento mal y nombres mal escritos. Lo del año y los nombres venía del material (la ficha vieja y la transcripción), no del escritor: se corrigió en su ficha y en su "confirmado".

## Prueba en 3 piezas del libro de Joaquín (06/10/2026)
`workflow-tres.js` v5.5 sobre una copia de su libro v5.3.1, con sus correcciones cargadas; dos jueces Opus a ciegas por pieza.

| Pieza | v5.3.1 | v5.5 | Se lee mejor |
|---|---|---|---|
| Primera página | **7,25** | 7 | v5.3.1 / v5.3.1 |
| Capítulo II | 6 | **6,25** | v5.3.1 / v5.5 |
| Capítulo VI | 6 | **7,25** | v5.5 / v5.5 |
| Promedio | 6,4 | **6,8** | |

- Las dos entradas que marcó Joaquín ahora ubican antes del detalle (la mudanza a la casa antes de la pileta; quién, cuándo y qué plaza antes del "templo").
- Títulos del Paso 3t: los dos pasan el control y son concretos, sin adelantar el final.
- Los nombres corregidos quedaron bien en las tres piezas (0 restos de las formas mal transcriptas). La v5.3.1 los tiene mal porque se escribió antes de las correcciones: eso le pone tope a sus notas, así que el promedio favorece a la v5.5 de más.
- La primera página sigue floja (autocorrecciones del audio que el corrector dejó, ideas sueltas). Queda para la lectura de Joaquín.

Decisión: libro entero de Joaquín con la v5.5 y sus correcciones.

## Libro entero v5.5 de Joaquín (06/10/2026)
Con sus correcciones (ficha y "confirmado"); registro y plan de la v5.3.1. 9 capítulos con título (Paso 3t: los 9 pasaron el control), 11.018 palabras. PDF enviado: falta su lectura.

| Medida | v5.3.1 | v5.5 |
|---|---|---|
| De 10 a 30 palabras | 76 % | 73 % |
| Más de 40 palabras | 9 | 2 |
| Avisos de los controles al final | 60 | 40 |
| Presentaciones completas repetidas (C17) | — | 0 |
| Nombres corregidos mal escritos | — | 0 |

- El año de nacimiento sale 1999.
- Abierto: una entrada arranca con "también" sin decir respecto de qué (cap. VII); 22 de los "falta" de C18 siguen siendo respuestas que enteras son un "no".

## Prueba paga de un capítulo en la fábrica (07/10/2026)

Capítulo VI de Joaquín, escrito por API con el escritor de `fabrica/src/escritor/` (registro y plan de la corrida de la sesión), Opus 5.5, esfuerzo xhigh, con caché y Batch. Comando: `npx tsx scripts/escritor-correr.ts --carpeta prueba-v3-joaquin-fabrica --solo-capitulo 6 --tope 7 --si`. Terminó sin errores (la primera llamada no dio 400: `thinking: adaptive` + `output_config.effort` andan con el SDK 0.71.2).

**Gasto real: USD 6,90** (estimación típica 3,28, peor caso 6,37). 11 llamadas, 6 por lote.

| Llamada | Entrada | Salida (incl. pensamiento) | Escritura caché | USD |
|---|---|---|---|---|
| 2h armador | 28.747 | 27.049 | 0 | 0,66 |
| 3b capítulo | 28.869 | 43.099 | 2.152 | 0,99 |
| 3r resumen | 4.409 | 1.312 | 0 | 0,04 |
| 4 hechos (lote, **cortado a 64.000**) | 1.820 | 64.000 | 177.658 | 1,09 (perdido) |
| 4 hechos (directo, 128.000) | 1.820 | 61.306 | 177.658 | 2,12 |
| 5c veedor (lote) | 25.618 | 38.388 | 0 | 0,44 |
| 6 arreglo (lote) | 22.817 | 16.025 | 2.152 | 0,21 |
| 4 hechos repaso | 11.877 | 15.834 | 139.439 | 1,06 |
| 7 estilo ×2 (lote) | ~6.000 | ~12.700 | — | 0,28 |
| 3t título (lote) | 4.276 | 647 | 0 | 0,02 |

**Lo que se aprendió:**
1. **El pensamiento es casi todo el costo.** El capítulo tiene ~1.750 palabras (~2.500 tokens) y la llamada sacó 43.099 tokens de salida: lo demás es pensamiento con esfuerzo xhigh. Lo mismo en armador (27.049) y veedor (38.388).
2. **Los hechos sobre el libro entero son lo más caro** (entrada ~178k). Además el lote los cortó a 64.000 y se pagó dos veces: hay que pedirlos con 128.000 de entrada.
3. **La caché casi no ahorró** (2.152 tokens leídos): el prefijo que se repite es chico y las escrituras de caché de los hechos (178k) no se reusaron (el directo fue después del lote y no pegó).
4. **Proyección del libro entero con esta configuración: unos USD 25–30** (9 capítulos × ~1,7 de armador+capítulo+resumen, más hechos, repaso, ~11 arreglos, ~24 estilos, piezas fijas, registro y plan). Mucho más que lo estimado en el diseño (~9).
5. Calidad: el capítulo nuevo se le pasó a Naza junto al de la sesión (`capitulo-VI-sesion-vs-fabrica.pdf`) para que decida leyendo.

## Configuración económica, capítulo VI de Joaquín (07/10/2026)

Mismo capítulo, en una copia limpia (`fabrica/prueba-v3-joaquin-fabrica-eco/`), con `modelo/configuracion.ts`: Opus xhigh solo en el capítulo (y en la primera página, que acá no corre); Opus medio en armador, hechos, veedor, arreglo y repaso; Haiku 4.5 (presupuesto de pensamiento de 8.000) en resumen, estilo y título; todo por Batch, también las llamadas de a una; hechos con 128.000 y caché de 1 hora. Tope USD 3; estimado 2,84.

**Gasto real: USD 2,52**, 11 llamadas, todas por lote, sin fallas. Incluye una reescritura del capítulo por C30 (la primera versión dejó afuera 7 de 20 respuestas).

| Llamada | Modelo | Entrada | Salida (incl. pensamiento) | Caché | USD | xhigh (antes) |
|---|---|---|---|---|---|---|
| 2h armador | Opus medio | 28.747 | 6.858 | — | 0,13 | 0,66 |
| 3b capítulo | Opus xhigh | 27.057 | 52.771 | — | 0,59 | 0,99 |
| 3b capítulo, reescritura C30 | Opus xhigh | 28.048 | 44.444 | — | 0,51 | — |
| 3r resumen | Haiku | 3.425 | 1.129 | — | 0,005 | 0,04 |
| 4 hechos | Opus medio | 1.820 | 19.041 | 178.225 escritos (1 h) | 0,91 | 3,21 (dos veces) |
| 5c veedor | Opus medio | 25.612 | 10.694 | — | 0,16 | 0,44 |
| 6 arreglo | Opus medio | 21.916 | 5.473 | — | 0,10 | 0,21 |
| 4 hechos repaso | Opus medio | 10.559 | 3.636 | **139.439 leídos** | 0,07 | 1,06 |
| 7 estilo ×2 | Haiku | 12.646 | 19.057 | — | 0,05 | 0,28 |
| 3t título | Haiku | 3.211 | 1.974 | — | 0,007 | 0,02 |

Lo que se aprendió:
1. **El capítulo en xhigh es ahora casi todo el costo** (0,59 cada versión; con la reescritura, 1,10 de 2,52).
2. **La caché de 1 hora sirvió**: el repaso leyó 139.439 tokens de la caché de los hechos (0,07 en vez de 1,06), aunque fueron en lotes distintos.
3. Pensamiento medio bajó la salida a un cuarto en armador (6.858 vs 27.049), veedor (10.694 vs 38.388) y hechos (19.041 vs 61.306).
4. Haiku devolvió el título con ```json alrededor; el libro lo lee bien (parseo tolerante).

**Proyección del libro entero con esta configuración: unos USD 12 (entre 11 y 13,5)**, más que los 9:

| Parte | USD |
|---|---|
| 9 capítulos × (armador 0,13 + capítulo 0,59 + resumen, estilo ×2 y título 0,06) | 7,00 |
| Reescrituras C30 (0,51 cada una; supuestas 2 de 9) | 1,00 |
| Primera página (xhigh), carta y Antes de cerrar (medio), Sus frases (Haiku), estilo de esas piezas | 1,05 |
| Hechos, veedor, ~11 arreglos, repaso y disputas | 2,50 |
| Registro y plan (Etapa A, Opus medio; no medido) y correcciones (Haiku) | 0,85 |

Las palancas que quedan, de mayor a menor: el capítulo en `high` en vez de `xhigh` (si la salida baja a la mitad, unos 2,5 menos), evitar las reescrituras C30, el armador en `low`. Una sola pasada de estilo ya casi no ahorra (Haiku: 0,03 por pieza). Naza lee los tres capítulos VI (`capitulo-VI-tres-versiones.pdf`, carpeta principal) y decide.

## Capítulo VI de Joaquín con pensamiento alto y medio (07/10/2026)

Perfiles `eco-alto` y `eco-medio` (solo cambia el capítulo), con `--solo-escritura` y el armador ya pagado; se comparan los capítulos recién escritos (antes de revisión y estilo) contra el xhigh de la configuración económica (`sin-revision/`). Gasto real USD 0,53.

| Capítulo VI | Salida (incl. pensamiento) | USD | Reescritura C30 | Juez Opus | Juez Fable |
|---|---|---|---|---|---|
| xhigh | 52.771 + 44.444 | 1,10 | sí (7 de 20 afuera) | 7 | 7,5 |
| alto | 24.545 | 0,30 | no | 6,5 | 6,5 |
| medio | 16.189 | 0,22 | no | 7,5 | 6,5 |

- Ninguna inventa nada de peso. Las tres dejan afuera por qué se terminó Whanau (R39).
- Alto y medio ponen la pandemia después de la mudanza (R32/R79/R80: fue al revés); el xhigh es el único con ese orden bien. Es lo que la revisión de hechos tendría que marcar.
- La diferencia entre la mejor y la segunda es "chica" para los dos jueces. Naza lee `capitulo-VI-esfuerzos-a-ciegas.pdf` (carpeta principal; la clave está en la última página) y decide.

Proyección del libro entero con el capítulo en medio (más la reescritura en alto como mucho y el estilo de Haiku con 3.000): **~USD 8,5** (con alto, ~9,2). Sin contar la entrevista (~USD 2,5–3).

