# Escritor v5.2 — pruebas

Sigue a [`docs/v4/escritor/pruebas.md`](../../v4/escritor/pruebas.md) (bancos 1–3, v5, puro y v5.1). Salidas fuera de git, en `audios-crudos/v3-web/nazareno/escritor-v5-2-prueba/` y `escritor-v5-2/`.

## Prueba en 3 capítulos de Naza (03/10/2026)
`fabrica/scripts/escritor-v52/workflow-tres.js`: registro de la v5.1, plan nuevo (borde 18, golpe), armador v5.2, novelista v5.2, revisión solo de hechos y una ronda de arreglo. Todo con Opus. Juicio a ciegas (Opus, `docs/v5/escritor/vara.md`) contra los capítulos del libro puro y de la v5.1; **dos jueces por capítulo con el orden cambiado** (el juez varía hasta 2 puntos con el mismo texto).

| Capítulo | Puro | v5.1 | v5.2 | Se lee mejor (juez 1 / juez 2) |
|---|---|---|---|---|
| Infancia | **8** (8 / 8) | 6,75 (6,5 / 7) | 7,75 (8 / 7,5) | puro / puro |
| Secuestro (negocio con el hermano) | 6 (6 / 6) | 7,25 (7,5 / 7) | **8** (8 / 8) | v5.2 / v5.2 |
| Último | 7 (7 / 7) | 5,5 (6 / 5) | **7,75** (7,5 / 8) | v5.2 / v5.2 |
| Promedio | 7 | 6,5 | **7,8** | |

Medidas de prosa por código (`medidas.mjs`):

| Texto | Palabras por oración | De 10 a 30 | Más de 40 | Menos de 6 | Arrancan con "Y" | "No" de la entrevista |
|---|---|---|---|---|---|---|
| v5.2 infancia / secuestro / último | 21,8 / 20,3 / 22,4 | 83 / 83 / 76 % | 0 / 0 / 0 | 2 / 0 / 1 | 0 | 0 |
| Puro último | 12,2 | 58 % | 1 | 15 | 9 | 3 |
| v5.1 último | 33,4 | 42 % | 10 | 1 | 0 | 0 |

Lo que marcan los jueces de la v5.2 (para la próxima vuelta):
- Infancia: la ausencia del padre se cuenta antes de la Navidad que la explica (el puro la prepara mejor); los hermanos se presentan dos veces; faltan dos frases suyas.
- Último: el plan no le dio golpe (vacío) y la cárcel del hermano aparece recién en el sueño del auto, sin la mesa de la cena que la prepara; falta casi toda la cena.
- Ningún "no" de la entrevista quedó en los tres capítulos (el novelista no usó `no_entra`: los "no" estaban dentro de respuestas mixtas).

Decisión (pedido de Naza: "si gana, libro entero"): gana en 2 de 3 y en el promedio → libro entero de Naza con la v5.2.

## Libro entero v5.2 de Naza (03/10/2026)
`workflow-libro.js` v5.2 (`puro`, `soloHechos`), todo con Opus; plan de la prueba de 3 capítulos. 8 capítulos, 7.270 palabras, sin marcas impresas, títulos con números romanos. PDF enviado a Naza: falta su lectura.

| Medida (libro entero) | Puro | v5.1 | v5.2 |
|---|---|---|---|
| Palabras por oración | 13,5 | 29,0 | 23,4 |
| Oraciones de 10 a 30 palabras | 62 % | 45 % | 75 % |
| Más de 40 palabras | 4 | 63 | 8 |
| Menos de 6 palabras | 79 | 7 | 5 |
| Arrancan con "Y" | 36 | 0 | 0 |
| "No" de la entrevista (C32) | 3 | 0 | 0 |

Lo que quedó abierto (controles finales, una sola ronda de arreglo):
- **La primera página repite el capítulo I** (32 avisos de C7: los hermanos, el motor del auto a la madrugada, la guerra de almohadas) y algo del VIII (la casa de Berga y el estudio). El plan le pasó a la primera página respuestas que también son de capítulos.
- Una frase suya ("que te pase varias veces es peor…") está en el IV y en el VI.
- 8 oraciones de más de 40 palabras (primera página, III, VII, VIII y Antes de cerrar).
- El VII no marca lo que prepara su golpe (C33, el secuestro y la deuda con Ivo, que están en el VI).
- Lo de hoy en capítulos del pasado (C28: II, III, VI) y la lista de invitados a la cena (R62) que no entró.
- Los 6 "falta" restantes de C18 son respuestas que enteras son un "no" ("No tengo foto", "Paso esta", "No, está todo"): bien afuera. El novelista no usó `no_entra`; C18 debería aceptarlas solas (pendiente).
