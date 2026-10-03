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
