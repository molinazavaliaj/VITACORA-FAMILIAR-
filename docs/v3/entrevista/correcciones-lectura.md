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

### Frases de entrada: Naza aprueba las demás y pide 4 ajustes (30/09)
Aprobadas tal cual: 2, 3, 4, 5, 12, 14 (1, 6 y 11 sin entrada). Ajustes pedidos: 7 sin "y con tus manos"; 13 "algunas preguntas"; 15 sin "lo que te queda"; variar el comienzo de 3 o 4 que arrancan con "Ahora vamos a…". Propuesta de Fable (sin aprobar):
- 7: Ahora vamos al trabajo y a tu oficio, {{nombre}}: lo que hiciste con tus días.
- 8: Volvemos a la familia, {{nombre}}, pero en tu vida adulta. (sigue pendiente la elección del bloque 8)
- 9: Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.
- 10: Hablemos de los amigos, {{nombre}}, y de la gente que te dio una mano en la vida.
- 13: Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.
- 15: Ya estamos en la última parte, {{nombre}}: lo que te dejó todo esto y lo que querés dejarle a tu familia. (alternativa: "lo que aprendiste de todo esto")

## Ronda 2 (30/09): Fable lee la lectura corrida como Rogelio

Conclusión de Fable: se lee como una charla, no como un formulario; lo pesado es la maquinaria alrededor de las preguntas (224 mensajes del biógrafo para 89 preguntas).

| # | Decisión de Naza | Estado |
|---|---|---|
| 1 | El acuse (M3/M24) va como primera línea del mensaje que sigue; el sobrio (M4) va solo, aparte. | **Aplicado** (`armarTurno` en `mensajes.ts`). También M21 ("Dale, la salteamos…") va pegado. |
| 2 | Sin M10 ("Terminamos esta etapa…"): la entrada del bloque siguiente hace de pasaje. | **Aplicado**: después de cualquier cierre, M24. M10 queda en el banco marcado "sin uso". |
| 3 | Bienvenida y M6 en un solo mensaje. | **Propuesta de Fable, esperando aprobación** (abajo). |
| 4 | Acuse sobrio (M4) después de CA17, AD15, JU17 y TR11. | **Aplicado** (pasan a sensibles). |
| 5 | Final: LE7 → preguntas de la familia → FO1 → LE9 → LE8 → FIN; después de LE8, directo FIN. | **Aplicado.** |
| 6 | CI11 sin "Gracias por contarme esto; sé que no es fácil." | **Aplicado.** |
| 7 | Si un cierre se contesta con un "no" corto o "paso", acuse neutro. | **Propuesta de Fable, esperando aprobación** (abajo). La lógica se programa con los textos. |
| 8 | FI7 (la política) al bloque 12; FU1 (lo que todavía querés hacer) al bloque 15, antes de LE7. | **Aplicado.** |

**No cambia (decidido por Naza):** el "momento difícil" de cada época (CA17, AD15, JU17, PE4) queda en las cuatro; los cierres de todos los bloques siguen, incluidos CI9 y CI12; GI1 y GI2 siguen separadas.

**Resultado:** una vida completa pasa de 224 mensajes del biógrafo a **128 mensajes de WhatsApp** (8 agradecimientos sobrios van solos).

### Textos propuestos por Fable (sin aprobar)

**Bienvenida en un solo mensaje (BIEN + M6):**

> Hola, {{nombre}}. Juntos vamos a escribir la historia de tu vida, y quiero que sea bien tuya. Te cuento cómo es esto, así vamos tranquilos.
>
> Yo te pregunto cosas de tu vida, una por vez, y vos me las contás en audio, como se las contarías a alguien en la mesa. Si te salen dos o tres audios, mejor. Cuando quedás en silencio un ratito, entiendo que terminaste y te mando la próxima.
>
> Si alguna pregunta no tiene que ver con lo que viviste, no pasa nada: me decís que no, o me contás lo que en realidad te tocó a vos, que eso es lo que quiero saber. No hay apuro: vamos al paso que vos vayas marcando.

Sale solo lo repetido: el segundo {{nombre}} y la doble presentación ("te cuento cómo es esto" / "ahora te explico cómo va la entrevista").

**Acuses neutros (cierre contestado con un "no" corto o "paso"):**
1. "Bien, seguimos." (no va delante de una entrada que arranca con "Seguimos", la del bloque 3.)
2. "Dale."
3. "Bien, entonces."

Regla que propone Fable: si la entrada que sigue arranca con "Seguimos" o "Pasamos", usar la 2 o la 3.

### Para mirar en la próxima lectura (no decidido)
- Con el acuse pegado arriba de la pregunta, algunos M3 terminan anunciando lo que ya está a la vista ("Guardado, Rogelio. Te mando la próxima." y abajo la pregunta). Se podrían acortar.
- FO1 arranca con "Una última cosa" y ya no es la última: después vienen LE9 y LE8.

## Plan B (anotado, sin programar)

El código no entiende el contenido: a veces pregunta algo que no encaja ("¿esa historia tuvo un final?" cuando en el repaso del amor ya dijo que sigue con su pareja; "¿tuviste más hijos?" cuando ya dijo cuántos) o entiende mal un "no". **Por ahora se deja así.** Si en la prueba real pasa seguido: un modelo chico (Haiku) lee solo la respuesta de las preguntas que abren tema y contesta sí / no / no está claro (en el amor, también "¿sigue con esa pareja hoy?"; en hijos, "¿tuvo más de uno?"). El código decide con eso; si el modelo no está seguro, recién ahí un botón de WhatsApp. Costo estimado: menos de 1 centavo de dólar por entrevista.

### Respuesta de Naza a la ronda 2 (30/09)
- **Acuses neutros: aprobados** tal cual (M25.1 "Bien, seguimos.", M25.2 "Dale.", M25.3 "Bien, entonces."), con la regla de Fable: M25.1 no va delante de algo que arranca con "Seguimos" o "Pasamos". **Aplicado** (`acuseNeutro` en `mensajes.ts`). Un cierre con "paso" ahora lleva el neutro en vez de M21.
- **"Dale, la salteamos" pegado a lo que sigue:** Naza preguntó si podía salirle a quien no le toca. No: solo sale si esa persona dijo "paso" en la pregunta anterior y se pega solo a su próximo mensaje. Queda pegado.
- **Bienvenida junta: rechazada** ("no me gusta 'bien tuya'; más cálido, menos IA, que se presente como el entrevistador"). Fable propuso 3 opciones nuevas (sin aprobar):

**A — Directa y sencilla.**
> Hola, {{nombre}}. Soy quien te va a hacer la entrevista para el libro de tu vida. Lo vamos a armar entre los dos, de a poco, acá por WhatsApp.
>
> Te voy a ir mandando una pregunta por vez. Vos me contestás con un audio, contándome como se lo contarías a alguien en la mesa de tu casa. Si te salen dos o tres audios, mejor todavía. Cuando pasa un ratito y no llega nada más, entiendo que terminaste y te mando la siguiente.
>
> Si alguna pregunta no tiene que ver con lo que viviste, decime que no y listo, o contame lo que sí te pasó a vos. No hay ningún apuro. Vamos a tu ritmo.

**B — Arranca por el regalo** (la favorita de Fable; usa {{quien_regala}}; si falta ese dato, va la A).
> Hola, {{nombre}}, ¿cómo estás? {{quien_regala}} quiere que la historia de tu vida quede escrita en un libro, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.
>
> Funciona así: te mando una pregunta y vos me respondés en audio, como si me lo estuvieras contando tomando unos mates. Podés mandarme todos los audios que quieras. Cuando hace un rato que no llega nada, entiendo que terminaste con esa y te mando la que sigue.
>
> Si alguna pregunta no va con tu vida, no pasa nada: me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro, eh. Esto lo hacemos al ritmo que vos quieras.

**C — Charlada, con un poco de humor.**
> Hola, {{nombre}}. Mucho gusto. Soy quien te va a estar preguntando por tu vida de acá en adelante, para que quede escrita en un libro. Nada de exámenes: es una charla, nomás que por WhatsApp.
>
> Te pregunto algo y vos me lo contás en un audio, como se lo contarías a un amigo. Uno, dos, los que necesites. Si te vas por las ramas, mejor: ahí suelen estar las cosas lindas. Cuando pasa un rato sin audios, doy por hecho que terminaste y te mando otra pregunta.
>
> Si alguna no tiene que ver con lo que te pasó a vos, decime "esa no" y seguimos, o contame lo que sí fue. Y tomate el tiempo que quieras, acá no hay apuro.

### Bienvenida: Naza elige la B con cambios (30/09)
Cambios pedidos: sin "tomando unos mates" (el producto es internacional): "como si se lo estuvieras contando a tu mejor amigo"; y explicar mejor cómo llega la pregunta siguiente. Versión de Fable (sin aprobar):
> Hola, {{nombre}}, ¿cómo estás? {{quien_regala}} quiere que la historia de tu vida quede escrita en un libro, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.
>
> Funciona así: te mando una pregunta y vos me respondés en audio, como si se lo estuvieras contando a tu mejor amigo. Podés mandarme todos los audios que quieras. Y cuando termines de contar, no tenés que avisarme nada: cuando pasa un ratito sin que mandes nada, te llega sola la pregunta que sigue.
>
> Si alguna pregunta no va con tu vida, no pasa nada: me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro, eh. Esto lo hacemos al ritmo que vos quieras.

Palabras que Fable marca para España: "sin apuro" (allá "apuro" es vergüenza o aprieto: "sin prisa"), "armarlo" (allá "hacerlo").

## Pendiente grande: el banco entero está en "vos"
Al revisar la bienvenida para España apareció esto: **todos los textos del banco (preguntas y mensajes) están escritos con voseo** ("contame", "tenés", "vos"). La ficha no tiene un campo de "vos o tú" (`formaTrato` en `fabrica/src/v3/ficha.ts` es solo el género del trato) y `renderizar` no adapta nada. `flujo-vigente.md` dice que la ficha pide "si habla de vos o de tú": eso **no está programado**. Para vender en España hace falta: un campo en la ficha, una versión en "tú" de cada texto (la redacta Fable, la aprueba Naza) y que el código elija. También revisar palabras locales ("apuro", "armar", "colimba", "barra", "changa"…). No se hizo nada todavía.

### Bienvenida: aprobada (30/09)
Naza aprobó la B con un cambio: sin el nombre de quien regala, "Una persona que te quiere mucho te regaló un libro con la historia de tu vida…". **Aplicado** en BIEN (un solo mensaje con tres párrafos; M6 queda sin uso). El cambio de "vos" a "tú" y las palabras locales ("sin apuro", "armarlo") se hacen **cuando esté todo cerrado** (Naza).

## Ronda 3 (30/09): Fable releyó la versión 4 como Rogelio
Conclusión de Fable: mejoró mucho (un mensaje por silencio, las pausas sobrias funcionan, el final emociona).

| # | Decisión de Naza | Estado |
|---|---|---|
| 1 | Antes de un cierre y de LE9, el acuse común pegado es solo "Gracias, {{nombre}}." (antes: "Anotado. Sigo con otra." arriba de "Con esto cerramos…", 9 veces). | **Aplicado**: M26 nuevo, `acuseAntesDe` en `mensajes.ts`. |
| 2 | FO1: "Una última cosa" → "Otra cosa, {{nombre}}." | **Aplicado.** |
| 3 | Una sensible (AM9, CA17, AD15, JU17, TR11, bloque 11) contestada con un "no" corto o "paso" lleva el neutro M25, no el sobrio M4. | **Aplicado** (`mensajesDespues`). |
| 4 | Si el acuse pegado ya lleva el nombre, la entrada del bloque va sin el nombre. | **Aplicado** (`entradaSegunAcuse`). |
| 5 | M25.2 "Dale." → "Bien, seguimos." | **Aplicado.** Queda igual a M25.1; delante de algo que arranca con "Seguimos" o "Pasamos" va M25.3 ("Bien, entonces."). |

No se tocan HI2b ni JU1/JU8 (plan B). Resultado: **127 mensajes de WhatsApp** en la vida completa.
