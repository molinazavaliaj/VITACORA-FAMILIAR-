# Las preguntas de la familia: textos (APROBADOS por Naza el 20/10, las tres tandas)

**Qué es.** En la página de su historia (Familiar V3) aparece una sección nueva arriba de lo que contó.
Lista las preguntas que sumó la familia, tal cual se escribieron, y abajo de cada una en qué quedó.
Solo aparece si la familia sumó al menos una. Debajo sigue el botón «+ Sumar una pregunta» de siempre.

Los textos viven en `web/src/lib/preguntas-familia-textos.ts`. Hoy la página de su historia solo
distingue vos (Argentina) y tú (España). El catalán queda listo para cuando la página se vea en catalán.

Cada estado tiene dos versiones. La normal habla del narrador («se la hicimos»). La otra es para cuando
el que mira es el mismo narrador («te la hicimos»): es la misma frase cambiando la persona.

## Tanda 1. Argentina (vos). Aprobada

| # | Dónde | Texto |
|---|---|---|
| 1 | Título | Las preguntas de la familia |
| 2 | Debajo del título | Las que sumó la familia, con las mismas palabras. |
| 3 | Ya contestó | Ya la contestó. Su respuesta está más abajo. |
| 4 | Se la mandamos y falta que conteste | Ya se la hicimos. Falta que conteste. |
| 5 | Se la mandamos y la pasó sin contar | Se la hicimos y la dejó pasar. |
| 6 | Todavía no le llegó | Todavía no se la hicimos. Le llega antes de terminar la entrevista. |
| 7 | Llegó después del final | Llegó tarde y ya no se la hacemos. |

Para el mismo narrador: «Ya la contestaste. Tu respuesta está más abajo.» · «Ya te la hicimos. Falta que
contestes.» · «Te la hicimos y la dejaste pasar.» · «Todavía no te la hicimos. Te llega antes de terminar
la entrevista.» · «Llegó tarde y ya no te la hacemos.»

## Tanda 2. España (tú). Aprobada

| # | Dónde | Texto |
|---|---|---|
| 1 | Título | Las preguntas de la familia |
| 2 | Debajo del título | Las que ha sumado la familia, con las mismas palabras. |
| 3 | Ya contestó | Ya la ha contestado. Su respuesta está más abajo. |
| 4 | Falta que conteste | Ya se la hemos hecho. Falta que conteste. |
| 5 | La pasó sin contar | Se la hemos hecho y la ha dejado pasar. |
| 6 | Todavía no le llegó | Todavía no se la hemos hecho. Le llega antes de terminar la entrevista. |
| 7 | Llegó después del final | Ha llegado tarde y ya no se la hacemos. |

## Tanda 3. Catalán. Aprobada

| # | Dónde | Texto |
|---|---|---|
| 1 | Título | Les preguntes de la família |
| 2 | Debajo del título | Les que ha afegit la família, amb les mateixes paraules. |
| 3 | Ya contestó | Ja l'ha contestada. La seva resposta és més avall. |
| 4 | Falta que conteste | Ja l'hi hem fet. Falta que contesti. |
| 5 | La pasó sin contar | L'hi hem fet i l'ha deixat passar. |
| 6 | Todavía no le llegó | Encara no l'hi hem fet. Li arriba abans d'acabar l'entrevista. |
| 7 | Llegó después del final | Ha arribat tard i ja no l'hi farem. |

## Cómo se sabe el estado

La pregunta se guarda en `preguntas` (tipo `familia`) y el bot la hace con la clave `F:<id>`, justo antes
de la foto del final (FO1). La web mira `entrevistas_v3.estado`. Contestada si hay respuesta con esa clave.
Esperando si es la pregunta abierta. La dejó pasar si salió y no hay respuesta. Tarde si la entrevista ya
llegó a FO1 sin hacerla. Si no, todavía no le llegó. Lógica en `preguntasDeLaFamiliaV3` (`web/src/lib/v3.ts`).
