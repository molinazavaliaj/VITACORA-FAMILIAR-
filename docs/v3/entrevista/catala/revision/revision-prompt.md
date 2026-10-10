# Revisión del prompt v3.1 en catalán (sección "## Prompt")

Revisión a ciegas (sin el original en castellano), normativa IEC. Copia previa: `prompt-v3-1-ca.antes-revision.md`.
Etiquetas, `pedido_dia`/`paso`, `{cita}`, `{pregunta}` y campos del JSON: sin tocar.

## Cambios

| # | Antes | Después | Por qué |
|---|---|---|---|
| 1 | "M'he quedat pensant en una cosa que em vas explicar…" (mensaje fijo, l. 12) y "començar amb "M'he quedat pensant"" (l. 56) | "He estat pensant en una cosa que em vas explicar…" / "començar amb "He estat pensant"" | Calco de "me quedé pensando". **Ojo: el mensaje fijo vive también en el código; hay que cambiarlo igual allí, si no el prompt y el mensaje real no coinciden.** |
| 2 | paso="si" (va contestar que no volia) | paso="si" (va preferir no contestar) | "no volia" sin complemento queda ambiguo (¿no quería qué?). |
| 3 | alguna cosa que segur que va tenir un dia per explicar | alguna cosa que segur que amaga un dia concret per explicar | La frase original no se entiende ("va tenir un dia per explicar"). |
| 4 | Un moment mitjà del qual… | Un moment de pes mitjà del qual… | "moment mitjà" es ambiguo; el criterio es el peso. |
| 5 | Val entre les teves dues triades | Val entre les dues que triïs | "triada" como sustantivo se confunde con "tríada"; más claro con verbo. |
| 6 | Camps de cada triada: | Camps de cada resposta triada: | Mismo motivo. |
| 7 | el que va dir que no vol explicar | el que va dir que no volia explicar | Concordancia de tiempos (estilo indirecto en pasado). |
| 8 | demanar-l'hi igualment | demanar-li-ho igualment | "l'hi" por "li ho" es coloquial; IEC: "li ho" → "demanar-li-ho". |
| 9 | Si a Adolescència explica | Si al bloc Adolescència explica | Sin "bloc" parece un lugar o una edad; ahora remite al `<bloque>`. |
| 10 | sense morbo | sense morbositat | "morbo" es castellanismo. |
| 11 | quin és l'especial | quin és el més especial | Más natural e inequívoco. |
| 12 | Al bloc Avui (al codi pot arribar com a "Hoy"), la pregunta… | Si <bloque> és "Avui", la pregunta… | Pedido: hablar del bloque "Avui" sin paréntesis raros; condición atada a la etiqueta, inequívoca para el modelo. **Supone que el código manda el nombre "Avui" en `<bloque>`; si manda "Hoy", la regla no se dispara.** |
| 13 | com és un dia seu d'ara | com és un dia normal de la seva vida d'ara | "un dia seu d'ara" es forzado. |
| 14 | Un gust, un plat o un costum petit tot sol no n'hi ha prou per triar-lo. | Un gust, un plat o un petit costum, tot sol, no és motiu per triar-lo. | Construcción incorrecta: "n'hi ha prou" pide "amb" ("amb X n'hi ha prou"). |
| 15 | acaba en "?" | acaba amb "?" | Más natural en catalán central ("acabar amb"). |
| 16 | Gairebé sempre la cita ja n'hi ha prou per a això | Gairebé sempre, amb la cita ja n'hi ha prou | Mismo error de "n'hi ha prou" sin "amb". |
| 17 | "avui" fora del bloc Avui … Per al bloc Avui valen | "avui" fora del bloc "Avui" … Al bloc "Avui" valen | Nombre del bloque entre comillas, coherente con la regla 12. |
| 18 | / (Avui) "Com ha estat… | / al bloc "Avui": "Com ha estat… | Quitar el paréntesis; misma forma que el resto. |

## Revisado y sin cambios

- Ejemplos de preguntas (sí/no), citas inventadas y ejemplos de repetición: naturales, catalán central correcto.
- "repregunta": aceptable (DIEC recoge "repreguntar").
- "d'això prefereixo no parlar-ne": correcto (dislocación con clítico).
- "tal qual", "si escau", "a punt per enganxar": correctos.
