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
