# Viaje V2 · Paso 2, parte 1, ronda 4 (30/09/2026)

## Decisiones de Naza (sobre la ronda 3)
- **AS1, variante "ya de viaje": aprobada.**
- **ID1:** prefiere la H2. Claude recomendó respetarla y limpiarle las palabras repetidas de AS2.
- **¿Qué le falta?:** entran (a) lo que no podía faltar en la valija, (b) el último rato en casa y (c) la imagen del lugar antes de conocerlo. **Sale** el "mostrame" de la previa.

## Lo que trajo Fable

### ID1 · H2 sin repeticiones
Hoy fue el día del viaje, {{nombre}}. No me cuentes horarios: contame un rato del camino en el que no estabas haciendo nada, solo yendo, y te diste cuenta de que ya estabas lejos. Qué había del otro lado de la ventanilla y qué pensabas.

### VA1 · (a) Lo que va sí o sí en la valija
- Busca: un objeto que cuenta quién es; la valija como retrato, no como inventario. Riesgo: la lista, o lo obvio.
- **A (Fable elige):** Contame una cosa que va en la valija sí o sí, {{nombre}}. No el cargador ni los documentos: algo tuyo. Qué es y por qué va con vos.
- **B:** Siempre hay algo que uno mete en la valija aunque no entre. ¿Qué es lo tuyo en este viaje? Contame de esa cosa y qué tiene que ver con vos.
- Ya de viaje (A): Ya estás en camino y la valija está cerrada. Contame una cosa que metiste y que no podía faltar, {{nombre}}. No el cargador ni los documentos: algo tuyo. Qué es y por qué va con vos.

### UC1 · (b) El último rato en casa
- Busca: la escena de cerrar la puerta. Riesgo: la lista de tareas, o que llegue antes de que pase.
- **A (Fable elige):** Hoy es el día, {{nombre}}. Cuando ya hayas cerrado la puerta, contame el último rato en casa: qué estabas haciendo justo antes de salir y si hubo una última mirada para atrás.
- **B:** Hoy te vas. Ese rato antes de cerrar la puerta tiene algo: la casa medio en pausa, uno dando vueltas. Contame cómo fue el tuyo, {{nombre}}, y en qué momento sentiste que ya era hora.

### IM1 · (c) La imagen del lugar antes de conocerlo
- Busca: la expectativa como imagen, para que el libro la compare con lo que encontró. Riesgo: datos de guía ("hay que ver tal cosa").
- **A (Fable elige):** Antes de conocerlo, ¿cómo te imaginás el lugar adonde vas? No lo que leíste ni lo que hay que ver: la imagen que se te aparece cuando pensás en estar ahí, aunque sea una calle o un olor. Contame esa imagen y de dónde te viene.
- **B:** Todo lugar existe en la cabeza antes de pisarlo. ¿Qué imagen tenés del tuyo, {{nombre}}? Una sola, la primera que se te aparece: qué se ve y de dónde la sacaste.
- Ya de viaje (A): Todavía no llegaste, así que esta vale igual. ¿Cómo te imaginás el lugar adonde vas? (sigue igual)
- Fable avisa: se pisa un poco con AS2 ("qué esperás encontrar allá").

### El orden que propone Fable
| Cuándo | Pregunta | Cómo sale |
|---|---|---|
| Al activarse | AS1 | Enseguida |
| Contesta AS1 | AS2 | Encadenada |
| Contesta AS2 | IM1 (la imagen del lugar) | Encadenada |
| Contesta IM1 | VA1 (la valija) | Encadenada |
| Día de salida, a la mañana | UC1 (último rato en casa) | Por fecha. "Cuando ya hayas cerrado la puerta" resuelve que no sepamos la hora |
| Día de salida, a la noche | ID1 | Por fecha |

Si la cadena no terminó el día de salida, UC1 e ID1 salen igual y la cadena sigue después con las variantes "ya de viaje".

## Control de reglas (Claude)
| Texto | Nota |
|---|---|
| IM1, variante ya de viaje | "Todavía no llegaste" puede mentir: si la cadena sigue días después, ya llegó. Hay que reescribirla. |
| IM1 | "El lugar adonde vas" da por hecho un solo destino (muchos viajes son de varias ciudades). |
| UC1 A | "Y si hubo una última mirada para atrás" es una segunda cosa, de sí o no. |
| Bienvenida | Decía "dos preguntas y después silencio"; ahora son cuatro. Se corrige en el paso 3. |
| ID1 | Si sale de noche (a las 23:00), ID1 le llega antes de irse y "Hoy fue el día" miente. Fable propone: si a la noche no contesta, mandarla a la mañana siguiente, en pasado. Decide Naza. |
