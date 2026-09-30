# Correcciones de la lectura corrida

**Qué es:** lo que Naza marcó al leer la entrevista de punta a punta ([`lectura-corrida.md`](lectura-corrida.md), vida inventada de 72 años), qué se decidió y en qué estado está. Lo que cambia se aplica en [`banco.md`](banco.md) y en `fabrica/src/v3/entrevista/`; lo que se descarta se anota acá, no se borra.

## Ronda 1 (30/09)

| # | Marca | Decisión de Naza | Estado |
|---|---|---|---|
| 1 | Del bloque 6 al 14 no hay nada que marque el cambio de tema (los cierres eran extra). | a) Una **frase de entrada** al empezar cada bloque, sin pedir respuesta; las redacta Fable; se respetan las preguntas que ya arrancan así. b) Los **cierres de todos los bloques** (CI1, CI6 a CI14) van siempre en el núcleo, con M24 después (M10 en las etapas). | b) **Aplicado** (banco.md + código + tests). a) **Propuesta de Fable, esperando aprobación** (abajo). |
| 2 | La frase del "paso" (M1) va debajo de 88 preguntas: se repite mucho. | M1 solo en las 3 primeras preguntas de la entrevista, en las 6 que abren tema (CA6, JU8, AM0, AM9, HI0, HI8) y en todas las del bloque 11. | **Aplicado** (`llevaM1` en flujo.ts). Vida completa: 12 preguntas con M1. |
| 3 | Después de LE9 ("¿algo que no te pregunté?") va un acuse común antes del final. | Después de LE9, directo FIN. | **Aplicado** (`mensajesDespues`). |
| 4 | CI14 no pregunta nada ("Hasta acá lo de hoy… Gracias por contármelo con tanta paciencia.") y ahora, en el núcleo, espera respuesta. | — | **Propuesta de Fable, esperando aprobación** (abajo). |

Conteo de una vida completa (Rogelio): **89 preguntas** de historia (igual que antes), **105 turnos** (antes 95: +10 cierres) y **212 mensajes del biógrafo** (antes 193: +10 cierres, +10 M24, −1 acuse de LE9). Con las 12 entradas propuestas serían **224**.

### Frases de entrada propuestas por Fable (sin aprobar)

| Bloque | Primera pregunta | Entrada propuesta |
|---|---|---|
| 1 | OR1 | No hace falta: OR1 ya arranca así y antes vienen BIEN y M6. |
| 2 | CA1 | Ahora vamos a tu infancia, {{nombre}}: la casa donde creciste y los de tu casa de entonces. |
| 3 | ES1 | Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad. |
| 4 | AD2 | Ahora vamos a tu adolescencia: esos años en que uno deja de ser chic{{o/a}} y todavía no es grande. |
| 5 | JU1 | Pasamos a tu juventud, {{nombre}}: cuando empezaste a armar tu propia vida. |
| 6 | AM0 | No hace falta: AM0 ya dice "Ahora vamos al amor". |
| 7 | TR1 | Ahora vamos al trabajo y a tu oficio, {{nombre}}: lo que hiciste con tus días y con tus manos. |
| 8 | PG1 | Ahora vamos a tu familia de grande, {{nombre}}. Empezamos por tus viejos. |
| 9 | LU4 | Ahora vamos a los lugares que fueron tuyos y a las cosas que te apasionaron. |
| 10 | AS1 | Ahora vamos a los amigos, {{nombre}}, y a la gente que te dio una mano en la vida. |
| 11 | AV11 | No hace falta: el aviso AV11 ya es la entrada. |
| 12 | HG1 | Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida. |
| 13 | GI1 | Ahora vamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y un par de preguntas para pensar un rato. |
| 14 | HO1 | Dejamos el pasado un rato y venimos a hoy, {{nombre}}: cómo son tus días y qué te gusta ahora. |
| 15 | LE1 | Ya estamos en la última parte, {{nombre}}: lo que te queda de todo esto y lo que querés dejarle a tu familia. |

**CI14 propuesto:** Con esto cerramos lo de hoy, {{nombre}}, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquil{{o/a}}.

**Observaciones de Fable, para decidir:**
- Con las entradas, en los bloques que no son etapa quedan tres transiciones seguidas: el cierre ("Con esto cerramos…"), M24 ("…Pasamos a otra cosa.") y la entrada ("Ahora vamos a…"). Fable propone que M24 pierda la cola de transición y quede solo el agradecimiento ("Gracias, {{nombre}}. Con eso cerramos acá."), porque la entrada ya dice a dónde vamos.
- Bloque 8: la entrada ("Empezamos por tus viejos") y PG1 ("Contame de tus viejos cuando vos ya eras grande") repiten "viejos". Alternativa: dejar solo "Ahora vamos a tu familia de grande, {{nombre}}."

### Respuesta de Naza (30/09) y segunda vuelta de Fable
- **M24 más corto: aprobado**, con una condición: que ninguno dé a entender que terminan las preguntas. Fable propuso (sin aprobar todavía):
  - M24.1 Gracias, {{nombre}}. Eso también va al libro.
  - M24.2 Anotado, gracias. Quedó guardado junto con el resto.
  - M24.3 Bien, {{nombre}}. Lo sumo a lo que ya me contaste de eso.
  - M24.4 Gracias por eso. Cada detalle que agregás suma.
- **Bloque 8:** Naza dudó de "tu familia de grande" (se lee como "familia grande"). Alternativas de Fable: A "Ahora vamos a la familia otra vez, {{nombre}}, pero en tu vida adulta." (favorita) · B "Ahora vamos a tu familia, {{nombre}}: los que venían de antes y los que fueron llegando." (riesgo: supone que llegó alguien) · C "Ahora vamos a tu familia de adult{{o/a}}, {{nombre}}. Primero, los que te criaron."
