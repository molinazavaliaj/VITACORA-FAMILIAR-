# Escritor v4 — pruebas

## Banco 1 (02/10/2026)
Prueba corta (`fabrica/scripts/escritor-v4/workflow-capitulo.js`): registro, plan y dos capítulos por narrador, una ronda de arreglo y lectura final. Juez **Opus** a ciegas con `vara.md`, tres versiones por capítulo (anterior, v3.2, v4). Escritor y juez son Opus: la nota filtra; decide Naza leyendo. Salidas fuera de git.

| Narrador | Capítulo | Anterior | v3.2 | v4 | Techo de la entrevista |
|---|---|---|---|---|---|
| Naza | Hecho fuerte (negocio y lo que pasó) | **8** | 6 | 6,5 | 9 |
| Naza | Último | 6,5 | 5,5 | **8** | 9,5 |
| Joaquín | Hecho fuerte (separación de los padres) | 6 | 7 | **8** | 9,5 |
| Joaquín | Último | 6 | 6,5 | **8** | 9,5 |

La vara nueva pone la v3.2 debajo del libro anterior en el capítulo que Naza leyó: coincide con su lectura (la vara vieja daba lo contrario).

Lo que se repite (para la próxima vuelta, después de la lectura de Naza):
- **Lo de hoy se cuela en capítulos del pasado** sin la palabra "hoy" (C28 no lo ve): en Naza, el capítulo del negocio mezcla 2020, 2021, 2022 y hoy y entierra el hecho fuerte; en Joaquín, un párrafo de "soy así… hoy".
- **Frases de la entrevista que entran al libro** ("de mi salud, paso").
- El final del último capítulo de Joaquín es un inventario de hoy.

Falsas alarmas del código encontradas al correr con material real (arregladas con test): `hilo_de_hoy_ids` con episodios, "mamá" contra "su mamá" en C19, y el último capítulo sin escenas de hoy (fbe4135, 5d7a635).

## Banco 2 — v4.1 (02/10/2026)
Receta v4.1: un hilo por capítulo, entrar en un momento, imagen que vuelve, golpe preparado. Juez Opus a ciegas con la vara v4.1; en el capítulo fuerte de Naza compite también el "novelista" (ejercicio que Naza leyó y prefirió a todo).

| Narrador | Capítulo | Anterior | v4 | v4.1 | Novelista | Se lee mejor |
|---|---|---|---|---|---|---|
| Naza | Hecho fuerte | 7,5 | 6 | 7,5 | **8** | novelista |
| Naza | Último | 6 | 7 | **7,5** | — | v4.1 |
| Joaquín | Separación | 6 | **7,5** | 6 | — | v4 |
| Joaquín | Último | 6 | 7,5 | 7,5 | — | v4 |

- La v4.1 sube en Naza (el capítulo fuerte pasa de 6 a 7,5 y empata con el anterior) pero no llega al novelista: deja lo más grave en una línea.
- En Joaquín baja el capítulo de la separación por un hecho cambiado (atribuye a Agustín lo que la entrevista da a Naza; el juez marca que R04 y R07 se contradicen).

## Banco 3 — v5, novelista con red (02/10/2026)
Mismo registro y plan que la v4.1 (solo cambia el escritor). Juez Opus a ciegas.

| Narrador | Capítulo | Anterior | v4 | v4.1 | v5 | Novelista |
|---|---|---|---|---|---|---|
| Naza | Hecho fuerte | 6 | — | 7 | 7 | **8** |
| Naza | Último | 5,5 | — | **8** | 7 | — |
| Joaquín | Separación | 6 | **8** | 6 | 5,5 | — |
| Joaquín | Último | 5,5 | 7 | 6,5 | **7** (se lee mejor) | — |

- La v5 no supera a la v4.1; el novelista del ejercicio sigue arriba en el capítulo fuerte de Naza.
- **Ruido del juez:** el mismo texto (el capítulo fuerte del libro anterior de Naza) sacó 8, 7,5 y 6 en tres corridas. Diferencias de menos de 1,5 puntos entre versiones no dicen nada; decide la lectura de Naza.
- Diferencia de proceso que queda por probar: el capítulo del novelista no pasó por revisión ni arreglo; los de v4.1 y v5 sí.

## Libro entero v5 de Naza, con revisión solo de hechos (02-03/10/2026)
`workflow-libro.js` v5 con `soloHechos`: el arreglo recibe solo hechos y lo que falta (no lector ni cotejo); mismo registro y plan que la v4.1. 7 capítulos, 7.399 palabras, sin marcas impresas; el novelista dejó afuera de su capítulo entre 0 y 2 respuestas por capítulo (todas reubicadas). Con revisión completa el capítulo fuerte recibía 23 pedidos de cambio; solo de hechos, 2 (y ninguno en el libro: quedó tal cual se escribió).

Juicio a ciegas (Opus) del capítulo fuerte:

| Versión | Nota |
|---|---|
| Ejercicio del novelista (sin plan, sin guía, sin revisión) | **8,5** — se lee mejor |
| v5 con revisión completa (banco 3) | 7,5 |
| v5 del libro (sin revisión) | 7,5 — la más fiel (Verdad 10) |
| Libro anterior | 6 |

Lectura: la revisión completa no fue lo que separaba al novelista (las dos v5 empatan; son corridas distintas, no el mismo texto antes y después). Lo que sigue separando al ejercicio: recibió solo sus respuestas y el pedido corto, sin plan ni guía. Pendientes que marca el juez: que entre la frase central del tramo; no mover un motivo de una persona a otra; no poner al narrador entre comillas dentro de su propia voz; pasarle al juez el índice del libro.

## Libro entero "novelista puro" (03/10/2026)
`Paso 3b puro` (pedido corto del ejercicio, sin guía ni plan) + revisión solo de hechos; mismo registro y plan. Naza: 7 capítulos, 7.342 palabras; Joaquín: 6 capítulos, 7.251 palabras. Juicio a ciegas (Opus):

| Capítulo de Naza | Ejercicio | Puro (libro) | v5 (libro) |
|---|---|---|---|
| Hecho fuerte | **7,5** (se lee mejor) | 5,5 | 7 |
| Último | — | 7 (se lee mejor) | **8** |

**Hallazgo:** lo que hacía bueno al ejercicio no era el pedido sino el material. El ejercicio recibió las respuestas que el capítulo de la v4 ya había juntado, entre ellas tres de OTRAS etapas que arman el arco del hermano (la Navidad en que supo que estaban presos, la detención en la época de Chiara, la última caída). El puro recibió solo las de su etapa: sin eso no puede preparar el golpe y la cárcel queda como "su último problema". Próximo paso: que el plan elija el hilo de cada capítulo y le pase al escritor, además de sus respuestas, las de otras etapas que lo preparan (para recordarlas en una línea, no para volver a contarlas).
