# Bitácora del piloto — Ciro / Angel Fernandez (segundo narrador de prueba)

> Naza pidió (22/09) abrir un archivo aparte para los fallos **nuevos** que salieron
> entrevistando a Ciro. Los de Joaquín siguen en `piloto-bitacora-errores.md`;
> acá no se repite nada de aquello salvo cuando un fallo viejo **reincidió** con
> otro narrador, que es información nueva y se dice.
>
> Misma regla de la casa: **se anota, no se arregla**. Una entrada por hallazgo:
> fecha · qué pasó · dónde está · qué se hizo a mano · qué queda para repasar.
>
> **Por qué un archivo nuevo y no una sección más:** el 22/09 la bitácora vieja ya
> vivía en tres versiones distintas (`main`, `manual-sin-voz`, `primer-capitulo`) con
> los mismos números usados para hallazgos diferentes. Un archivo propio, con
> numeración propia (C1, C2…), no puede chocar al mergear.

**Quién es el narrador:** 28 años, trato `vos`, infancia en Concordia con la madre,
la abuela Estela y los primos; padre ausente con adicciones; a los 12 se fue a vivir
con el padre a Buenos Aires (Núñez); hermanas Annaclara, Maia y Lola de la nueva
familia de la madre. Ficha cargada a mano por la puerta manual. Al 22/09 va por la
pregunta 12 de 26.

---

## Triage

### 🔴 Graves — ensucian el libro o rompen la herramienta

| # | Qué | Por qué es grave |
|---|---|---|
| C6 | El biógrafo pone los recuerdos **en la ciudad equivocada** (3 de 3) | Es un error de hecho, no de tono: las salidas de la adolescencia fueron en Buenos Aires y las preguntó "en Concordia". La fábrica escribe el libro con el mismo material, así que el error viaja al texto impreso. **Reproducido el 22/09 contra `main` al día (3t.29 incluido): no lo arregla nada de lo de hoy.** |
| C8 | La puerta manual quedó **rota entera** por un módulo borrado | `3t.28` borró `src/ia/voz.ts` y dejó el import en `scripts/manual.ts`: cualquier comando moría. Tercera vez que muerde la misma causa — `tsconfig.json` tiene `include: ["src"]`, así que `tsc` **nunca** mira `scripts/`. Arreglado el 22/09; la causa raíz sigue abierta. |
| C11 | La personalización **devuelve la pregunta entera en usted** a un narrador de vos | No es un verbo suelto como en C6: la 13 arranca "Mirá, vos dijiste…" y sigue "¿cómo **conoció** al amor de su vida? **Lléveme** a ese día… qué **pensó** cuando **la** vio". Si se manda así, el narrador siente que le escribe otra persona. Cuarta aparición de la mezcla, la peor. |
| C3 | Pregunta por la infancia **como si hubiera sido un lujo** | Pedido explícito de Naza. A un narrador con infancia dura, preguntarle por "las fiestas y las tradiciones" le dice que no lo escucharon — y encima desperdicia la pregunta del día. |

### 🟠 Medios — le sacan valor a la entrevista

| # | Qué | Por qué importa |
|---|---|---|
| C2 | Dar por **muerta (o viva)** a una persona sin saberlo | Ciro contestó "está viva todavía, no me la mates". Del otro lado, hablarle en presente de alguien que murió es peor. |
| C1 | La repregunta **pide lo que ya contó** | La evaluación no ve la historia: solo la pregunta y la respuesta de hoy. |
| C4 | La repregunta **insiste donde pidió cambiar de tema** | Dijo literal "vamos por otro lado" y el biógrafo fue derecho ahí. |
| C5 | La personalización **repite lo recién contestado** y lidera con las sustancias | Pregunta lo que el narrador acaba de decir que no pasó; y convierte el consumo en el gancho de la pregunta. |
| C12 | Da por hecho que **hubo** un amor y que **es mujer** | La 13 pregunta "qué pensó cuando **la** vio" a un narrador de 28 sin estado civil ni pareja en la ficha. Mismo fallo que las tres preguntas de "Los hijos" a quien no tiene. |
| C7 | **Dos sesiones sobre el mismo narrador se pisan** | Casi archiva una respuesta en el capítulo equivocado. |

### 🟡 Suaves

| # | Qué |
|---|---|
| C9 | Nombres propios inconsistentes (Bausa/Bausá, Chupín→"Chupine", Maia→"Maya", Annaclara→"Clara") |
| C10 | La API key de Anthropic desfasada entre los dos `.env` |

---

## Las entradas

### C1 · La repregunta pide lo que el narrador YA contó
**16/09.** Respuesta 5: "no sé nada de mis abuelos ni de cómo se llevaban". La
repregunta salió: *"¿de tus abuelos te acordás de alguno, aunque sea de verlo en una
foto o de escuchar su nombre?"*. Pero en la **respuesta 1** había contado que su
abuela cocinaba en la casa todos los días: se crió con ella.

**Causa:** `evaluarRespuesta()` (`entrevistador/src/ia/cerebro.ts`) recibe solo la
pregunta y la respuesta del día — ni la memoria de capítulos ni las respuestas
previas, que la personalización sí recibe.

**Hecho a mano:** repregunta descartada; se mandó una anclada en la abuela que él
ya había nombrado. **Para repasar:** pasarle `memoriaDeCapitulos` a la evaluación
(es barata) para que no pida lo que ya está dado.

### C2 · Dar por muerta (o viva) a alguien que el narrador no dijo si vive
**17/09.** La repregunta de reemplazo, escrita a mano, decía *"a tu abuela la tuviste
cerca… ¿cómo se llamaba, cómo era?"* — todo en pasado. Ciro abrió su respuesta así:

> "Mi abuela se llama… **está viva todavía, no me la mates, hijo de puta.**"

Al revés duele igual: hablar en presente de alguien que murió.

**Regla propuesta para todos los prompts del biógrafo** (personalizar, repregunta,
adaptativas, reemplazo): de una persona de la que no se sabe si vive, no se asume —
se pregunta anclado en la época ("cómo la recordás de esos años", "cómo era en esa
casa") o sin verbo copulativo ("su nombre"), nunca "se llamaba" ni "cómo está".

**Para repasar:** (a) esa regla en los prompts, con casos de prueba; (b) que la
ficha pueda decir quiénes ya no están — la familia lo sabe y cambia todas las
preguntas sobre esa persona; (c) revisar las 26 fijas con el mismo ojo ("si tus
nietos escucharan esto" es la misma clase de suposición).

### C3 · Pregunta por la infancia como si hubiera sido un lujo
**18/09. Pedido de Naza:** *"el biógrafo tiene que de alguna manera saber si la vida
de la persona fue dura de infancia para no hacerle preguntas sobre su infancia como
si hubiese sido un lujo"*.

La pregunta 7 salió: *"¿Qué tradiciones había? Las milanesas, la chocolatada… ¿cómo
eran los domingos, las fiestas con tu abuela Estela, tu tío, tus primos?"*. La
respuesta:

> "¿Cómo eran los domingos? Una mierda, amigo. Mi familia era un desastre, tenés que
> entender. **Hay algo que vos no estás entendiendo** y es que mi familia estaba
> totalmente desarticulada… El tío estaba re duro y la abuela queriendo rescatarlo…
> Esto no era una película de Disney, todo lo contrario."

**Las señales ya estaban** en las respuestas 2 y su ampliación: padre ausente con
drogas y alcohol, "todos los grandes se llevaban mal", se fue a los 12. El biógrafo
las tenía a la vista (entran en las últimas 6 respuestas) y aun así encuadró la
pregunta en clave nostálgica.

**Causas:** (a) las 26 fijas están escritas para una infancia feliz ("tradiciones",
"fiestas", "travesuras que todavía lo hagan reír") y la personalización conserva ese
encuadre, porque su regla es enganchar detalles, no leer el tono; (b) el prompt pide
"cálido" y nada le dice que la calidez a veces es no adornar; (c) ningún lugar guarda
*cómo fue esta vida* — la memoria de capítulos resume hechos, no clima.

**Para repasar:** que la memoria del biógrafo lleve una línea de **tono** por capítulo
("infancia dura: padre ausente con adicciones, familia desarticulada") y que
personalizar / adaptativas / repregunta la reciban con una regla explícita: si la
infancia fue dura, no preguntar por fiestas, tradiciones ni domingos como si hubieran
existido — preguntar qué había, quién sostenía, qué se rescataba. Y revisar las 26
fijas con ese ojo.

### C4 · La repregunta insiste donde el narrador pidió cambiar de tema
**18/09.** En esa misma respuesta 7 dijo, literal: *"mi tío se drogaba, o sea, **vamos
por otro lado** porque, porque por ahí, boludo"*. La repregunta generada fue derecho
al tío y a las drogas (y en usted, por el bug de evaluar contra la pregunta genérica).

**Hecho a mano:** descartada; el tema entró a `contexto.evitar` para el resto de la
entrevista. **Para repasar:** si la respuesta trae un pedido explícito de cambiar de
tema ("vamos por otro lado", "no quiero hablar de eso"), no hay repregunta sobre eso
y el tema entra solo a `evitar`.

### C5 · La personalización repite lo recién contestado y lidera con las sustancias
**18/09.** Respuesta 8: salía de miércoles a domingo, "mucho vino, mucha pastilla,
mucho clonazepam", y que con el Pelado Bausa y el Beto *"no salíamos mucho los tres
juntos, creo que nunca salimos los tres juntos"*. La pregunta 9 generada: *"…cumbia,
rock and roll, alcohol. ¿El Pelado Bausa y el Beto estaban en esa onda con vos? ¿Cómo
era salir con ellos?"* — pregunta lo que acaba de decir que no pasó, y encuadra a los
amigos desde el alcohol. El hueco real ("los pibes de Chupín y Chombita", nombrados
al pasar) no lo tomó.

A diferencia de C1, acá el personalizador **sí** tenía la respuesta a la vista: la
regla "CONSERVÁ TODAS LAS PREGUNTAS del original" le pesa más que "no repitas lo
contado".

**Hecho a mano:** reescrita sobre Chupín y Chombita; la respuesta trajo la banda
entera (el Reto/Mariano, el Lolo, el Pochi, el Mono, el Nachito, el Sebi) y la plaza.
**Para repasar:** (a) si una sub-pregunta del guion ya quedó contestada en la
respuesta anterior, se reemplaza por lo que quedó abierto; (b) el biógrafo no lidera
con consumo de sustancias aunque el narrador las haya nombrado — si él las trae, se
escucha; no se convierten en el gancho.

### C6 · Pone los recuerdos en la ciudad equivocada (3 de 3)
**21-22/09.** Pregunta 11: *"Vos **en Concordia** salías toda la semana"*. Pregunta 12:
*"esos sábados a la noche **en Concordia**"*. Las salidas fueron en **Buenos Aires**:
la pregunta 8 preguntaba literalmente por *"un sábado a la noche en Buenos Aires"* y
él se fue de Concordia a los 12.

**Verificado contra el código de hoy:** el 22/09, ya en `main` al día (con 3t.29 "los
temas de la entrevista" incluido, 303 tests verdes), se borró la 12 del caché y se
regeneró: **volvió a decir Concordia**. No es una rama vieja ni un modelo de otro día.

El personalizador tiene las dos ciudades en la historia y Concordia le queda como
"el lugar" del narrador. La 12 además mezcló el trato: *"¿de la que **se salvó**
raspando?"* dentro de una pregunta que arranca "vos que…" — tercera vez que aparece
esa mezcla (con Joaquín fueron "regálenos" y "cuéntame").

**Hecho a mano:** las tres corregidas en `contexto.preguntasEnviadas` antes de
mandarlas. **Para repasar:** que la ficha y la memoria lleven una **línea de tiempo
con lugares** ("Concordia hasta los 12, Buenos Aires desde los 12") para que el
biógrafo no pueda mezclarlas. Vale igual para la fábrica: el libro se escribe con el
mismo material.

### C7 · Dos sesiones sobre el mismo narrador se pisan
**21/09.** Al retomar, la pregunta 11 ya estaba generada y anotada (`dia_actual` = 11)
por otra sesión, con la repregunta de la 10 todavía sin responder — y el audio que
llegó contestaba **la repregunta**, no la 11. Cargarlo por orden habría archivado la
respuesta sobre Núñez y el colegio grande como "mi primer laburo".

**Hecho:** se transcribió el audio aparte, sin tocar la base, para ver a qué pregunta
respondía; recién ahí se cargó con `--repregunta --orden 10`.

**Para repasar:** (a) que `estado` avise "hay una repregunta de la orden N sin
responder" (ya estaba pedido para Joaquín y sigue abierto); (b) que `cargar` pueda
decir a qué pregunta se parece la respuesta antes de escribir.

### C8 · La puerta manual quedó rota por un módulo borrado
**22/09.** `3t.28` ("las preguntas van en texto, no en audio") borró
`entrevistador/src/ia/voz.ts` pero dejó el import y el flag `--voz` en
`scripts/manual.ts`: **cualquier** comando de la puerta manual moría con
`Cannot find module voz.js`. Se descubrió al cargar la respuesta 11 de Ciro, y estaba
igual de roto en `main`.

Tercera vez que muerde la misma causa: `entrevistador/tsconfig.json` tiene
`include: ["src"]`, así que `tsc` **nunca** mira `scripts/`. Las otras dos fueron
`guardarRepreguntaEnviada` faltando en el `return` de `modulos()` (dos veces).

**Hecho:** sacado el camino de voz (commit `1f512f7` en `main`).
**Para repasar, en serio:** sumar `scripts` al include del tsconfig — son tres bugs de
la misma causa, y el próximo también va a aparecer en medio de una entrevista.

### C9 · Nombres propios inconsistentes en la transcripción
**16-22/09.** Acumulado para la revisión de nombres antes del libro: **Bausa / Bausá**
(el mejor amigo), **"el Beto de Leite Villalba"**, **Chupín** y **Chombita**
(transcriptos "Chupine"), **Maia → "Maya"**, **Annaclara → "Clara"** (así la llama él,
puede ser correcto), **Estela** (la abuela). También una frase a escuchar con el audio
en la mano antes de darla por buena: *"nos robábamos en la plaza"*.

Es el mismo fallo que ya estaba anotado con Joaquín (NASA/Naza, Herrera/Herrero); se
repite acá con nombres nuevos. La ficha mejora lo que anticipa, pero los apodos del
barrio no los puede adivinar.

### C10 · La API key de Anthropic desfasada entre los dos `.env`
**18/09.** El entrevistador tiraba `401 authentication_error` al evaluar: alguien
rotó la key y la pegó en `fabrica/.env` pero no en `entrevistador/.env`. La
transcripción (OpenAI) seguía andando, así que el audio se cargaba y se caía después,
dejando el trabajo a medias.

**Hecho:** copiada la key buena. **Regla:** al rotar una clave hay que pegarla en los
**dos** `.env`. **Para repasar:** que la puerta manual avise claro "la key de X no
sirve" en vez de escupir el 401 crudo a mitad de camino.

### C11 · La personalización devuelve la pregunta entera en usted
**22/09.** La pregunta 13, para un narrador con `contexto.trato = 'vos'`, salió:

> "**Mirá, vos dijiste** que en Buenos Aires los primeros meses fueron complicados con
> tu viejo. En algún momento de esos años en la capital, ¿cómo **conoció** al amor de su
> vida? **Lléveme** a ese día: dónde fue, qué **pensó** cuando la vio, quién dio el primer
> paso."

La primera oración en vos y **todo el resto en usted**, calcado de la fija del guion
(«¿Cómo conoció al amor de su vida? Lléveme a ese día…»). Las tres veces anteriores
—"regálenos", "cuéntame" (Joaquín) y "se salvó" (C6)— eran una palabra suelta; acá el
modelo copió la fija entera y solo tradujo el enganche que él mismo agregó.

**La hipótesis que esto sugiere:** cuanto más "pegada" al original queda la
personalización, más se arrastra el trato del original — y la regla «CONSERVÁ TODAS LAS
PREGUNTAS del original» empuja justo hacia ahí. Es la misma raíz que C5.

**Hecho a mano:** reescrita en vos antes de mandarla. **Para repasar:** además de la
línea «Tratalo de X», que el prompt muestre el trato **en las reglas de estilo** y que
`esPersonalizacionValida` pueda rechazar una versión que trae formas de usted cuando el
trato es vos (y al revés) — hoy solo cuenta signos de pregunta y palabras.

### C12 · Da por hecho que hubo un amor, y que es mujer
**22/09.** La misma pregunta 13 dice *"qué pensó cuando **la** vio"* a un narrador de 28
años cuyo `contexto` **no tiene** `estadoCivil` ni `arbol.conyuge`. La fija del guion ya
viene así («¿Cómo conoció al amor de su vida?… qué pensó cuando la vio»), pensada para
un abuelo casado, y la personalización la conserva.

Es la misma familia que las tres preguntas de «Los hijos» a quien dijo que no tiene, y
que C2 (dar por muerta a la abuela): **el guion asume una vida y la pregunta no deja
lugar a otra**. Con un cliente real que enviudó joven, que no tuvo pareja, o cuya pareja
es un hombre, la pregunta duele o directamente no se puede contestar.

**Hecho a mano:** reescrita sin suponer. **Para repasar:** (a) el checkout ya pide
estado civil (21/09) pero Ciro se dio de alta antes — para los de antes, `manual ficha`;
(b) las fijas de «El amor» deberían estar escritas sin género y sin dar por hecho que
hubo pareja, como se hizo con «Los hijos»; (c) si la ficha no dice nada, la pregunta
tiene que preguntar **si** hubo, no **cómo fue**.
