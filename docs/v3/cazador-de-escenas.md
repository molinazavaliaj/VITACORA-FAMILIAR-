# Cazador de escenas (borrador, 26/09 noche)

**Estado: borrador v3 (26/09 noche): v2 con los ajustes de Fable + revisión de textos; pendiente de aprobación de Naza.** Propuesta de Naza: cada tantas preguntas, una llamada que lea lo contado y le pida al narrador lo que falta. Se enfoca en lo que el dashboard no cubre: **escenas**. Las dudas de nombres y fechas siguen yendo al dashboard.

Por qué: la prueba del 26/09 ([`prueba-libro-v5.md`](prueba-libro-v5.md)) mostró que el "formulario" viene de respuestas que describen en vez de contar un momento; con cuatro audios de "una vez concreta", el capítulo pasó de ficha a escenas.

## Cómo funciona (con los ajustes de Fable)

1. **Frecuencia por bloque**, no cada 15: se corre al cerrar cada bloque del banco. Máximo 2 por bloque; **3** si en ese bloque más de la mitad de las respuestas duraron menos de 40 s (cuota adaptativa, por regla, para el narrador parco). Tope total ~10 en Estándar. Nunca dos repreguntas seguidas. Ojo: con un narrador muy parco la cuota extra rinde poco, porque las respuestas de menos de 30 palabras no se eligen.
2. La llamada recibe la ficha, TODAS las respuestas hasta ahí y lo ya repreguntado (`<ya_repreguntado>`: id y tema de cada repregunta anterior); elige solo entre las respuestas del bloque que cerró, que van con `tanda="si"`.
3. Devuelve cada elección con un **ancla**: un pedazo copiado tal cual de la respuesta, de **6 a 14 palabras**, que se entienda solo y **sin nombres de personas que no estén en la ficha**, y con su **tema**.
4. El código **limpia el ancla** antes de controlarla y mostrarla: saca del principio "y", "pero", "que", "porque", "entonces", "bueno", "nada", "o sea", "eh" (repetido mientras haya), y del final ". , ; :" ("?" y "!" se quedan). No saca muletillas del medio: el ancla sigue siendo un pedazo contiguo de la respuesta.
5. El código verifica, sobre el ancla limpia: que sea un pedazo contiguo de su respuesta (comparando sin tildes, mayúsculas ni puntuación), 6 a 14 palabras, sin nombres fuera de la ficha, respuesta no sensible, id no repreguntado. Si algo falla, no se manda. Lo sensible usa la misma lista que el paso 1 del escritor; el modelo no elige esas respuestas, y el código solo puede verificar lo que el narrador marcó como "no quiero contar" en la entrevista. El tema no repreguntado lo controla el modelo (el código solo compara ids).
6. **Molde fijo, sin referencia de tiempo** ("hace un rato" puede ser hace cuatro días). El código elige la variante por el tratamiento y el país de la ficha. *Texto pendiente de aprobación de Naza.*
   - **vos:**
     > Me quedé pensando en algo que me contaste: «{ancla}». ¿Te acordás de algún día en particular? Contame ese día como si lo estuvieras viendo: dónde estabas, quién andaba por ahí, qué pasó. Y si no te acordás o no tenés ganas, decime «paso» y seguimos con otra cosa.
   - **tú (España):**
     > Me he quedado pensando en algo que me contaste: «{ancla}». ¿Te acuerdas de algún día en particular? Cuéntame ese día como si lo estuvieras viendo: dónde estabas, quién estaba, qué pasó. Y si no te acuerdas o no te apetece, dime «paso» y seguimos con otra cosa.
   - **usted (Argentina):**
     > Me quedé pensando en algo que me contó: «{ancla}». ¿Se acuerda de algún día en particular? Cuénteme ese día como si lo estuviera viendo: dónde estaba, quién andaba por ahí, qué pasó. Y si no se acuerda o no tiene ganas, dígame «paso» y seguimos con otra cosa.
   - **usted (España):**
     > Me he quedado pensando en algo que me contó: «{ancla}». ¿Se acuerda de algún día en particular? Cuénteme ese día como si lo estuviera viendo: dónde estaba, quién estaba, qué pasó. Y si no se acuerda o no tiene ganas, dígame «paso» y seguimos con otra cosa.
7. **Entra a la cola como una pregunta más**, nunca enseguida de la respuesta que la originó: mínimo tres preguntas después, ideal la sesión siguiente.
8. Si contesta con el mismo resumen, se acepta y no se insiste. La respuesta entra al material con el **mismo id** que la original, pegada a ella y sin el texto de la repregunta. El control de eco de preguntas del escritor (paso 4) no cuenta el ancla: son palabras del narrador.
9. El código registra cuántas veces una tanda sale sin elegidas, para ver si el modelo toma la cuota como meta o si le faltan candidatas.

Las dudas de nombres y fechas siguen yendo al dashboard. **Descartada** la repregunta fija por duración (sin modelo): la duración no distingue una respuesta corta y completa de una ficha (Fable).

Riesgos: en la v2 un modelo que leía el contexto metía errores ("ayer", hermanos mezclados, repetir lo dicho); acá el modelo solo elige y el narrador ve un texto fijo más sus propias palabras. Con mayores, sentirse examinados: bajo si la cita es literal y llega más tarde; alto si llega enseguida o se acumulan (por eso la cola, el tope y "nunca dos seguidas").

## Ubicar en el tiempo (idea de Naza, aprobada por Fable, 26/09 noche)

La misma llamada del cierre de bloque marca, además, **como mucho 1 historia del bloque que no se puede ubicar en el tiempo** y le pregunta al narrador cuándo fue, con botones. Mejor que el dashboard: la historia está fresca y la respuesta es un toque. Motivo: el índice por etapas depende del año de cada historia; en el libro de prueba de Naza, 8 historias quedaron sin año y la mayoría de las dudas eran de "cuándo".

Condiciones (Fable):
1. **Prioridad al cazador.** Entre las dos cosas, como mucho 2 intervenciones por bloque, nunca seguidas. Si hay que elegir, va la escena.
2. **Solo historias con peso:** más de ~80 palabras o escena. Lo demás lo ubica el escritor con "un tiempo después".
3. **Botones, nunca audio libre.** Si toca un botón, es dato. Si manda audio, se guarda como "dicho por él" y va a la línea de tiempo con la regla de los números.
4. **Nunca sobre historias sensibles** (misma lista que el cazador): esas van al dashboard, agrupadas por tema, o quedan sin fecha.

Mensaje (molde fijo; mismas variantes de tratamiento que el cazador):
> Me quedé pensando en algo que me contaste: «{ancla}». ¿Te acordás más o menos cuándo fue? Tocá una opción o contámelo.

(tú: "¿Te acuerdas más o menos cuándo fue? Toca una opción o cuéntamelo."; usted: "¿Se acuerda más o menos cuándo fue? Toque una opción o cuéntemelo.". Si contesta por audio, se guarda como dicho por él y va a la línea de tiempo con la regla de los números.)

Botones, armados por código, en este orden de fuentes (así ninguna vida se queda sin botones):
1. **Etapas fijas**, que existen para todos: [De chico/a] [En el secundario] [De joven, antes de los 25] [De grande] [Ya de mayor] (solo las que ya vivió). Alcanzan para el índice, que corta a los 13 y a los 18 y después por cambios de vida.
2. **Hechos que ya quedaron fechados** en bloques anteriores (con año o edad dichos por él o de la ficha): el código toma los dos o tres más cercanos y arma "Antes de…" / "Después de…" con sus palabras ("Antes de entrar a la fábrica" / "Después de casarme"). Salen del campo `fechados` que devuelve esta misma llamada en cada bloque.
3. **Hechos grandes del país** que ya contestó (bloque 12), como último recurso: [Antes de la pandemia] [Después].
Siempre, además: **[Tenía unos __ años]** (teclado numérico) y **[No me acuerdo]** (la historia va al escritor con la etiqueta "sin fecha" y la regla de vaguedad).

## Prompt

```
Sos el cazador de escenas de una entrevista para un libro de vida. No hablás con el narrador: elegís de qué respuesta vale la pena pedirle una escena.

Recibís la ficha, todas sus respuestas hasta ahora y lo que ya se le repreguntó. Mirá SOLO las respuestas con tanda="si" (las del bloque que acaba de cerrar). Una escena es un momento concreto: un día, un lugar, quién estaba, qué pasó, qué se dijo. Buscá respuestas que se quedaron en resumen o en descripción ("siempre había gente en la cocina", "ella es muy buena", "fue una época dura") pero nombran algo que seguro tuvo un momento que contar.

Elegí como mucho {{CUOTA}}. No elijas:
- una respuesta que ya cuenta una escena (aunque sea corta);
- algo que ya está contado como escena en otra respuesta, de esta tanda o de antes, o un tema por el que ya se repreguntó (<ya_repreguntado>), aunque sea en otra respuesta. Un tema es la cosa, el lugar o la persona de la que se habla, no la respuesta: "el taller de costura" y "las clientas del taller" son el mismo tema;
- temas sensibles: cárcel, drogas, delitos, abuso, violencia, sexo, suicidio, deudas, infidelidad; y muerte o enfermedad salvo lo que dice <permitido_sensible> (una muerte o enfermedad de una persona de la ficha que el narrador ya contó en un bloque anterior sin marcarla "suave" ni "no");
- algo que el narrador dijo que no quiere contar;
- una respuesta de menos de 30 palabras.
Si ninguna vale la pena, devolvé una lista vacía: es mejor no preguntar que preguntar de más.

Para cada una, el "ancla": un pedazo de SU respuesta copiado tal cual, de 6 a 14 palabras, que se entienda solo, sin la pregunta ni el resto de la respuesta: tiene que decir de qué habla (sí: "los veranos ayudaba a mi tío a descargar el camión de la fruta"; no: "eso fue cuando pasó lo otro", que no dice qué). Sin nombres de personas que no estén en la ficha. Tiene que nombrar al menos una cosa, lugar o persona concreta ("el estudio que armamos en el garaje" sí; "me quedé con ganas de seguir" no), y no puede apuntar a algo de afuera ("este", "eso", "ahí", "él"). El narrador la va a ver entre comillas, como algo suyo que nos quedó dando vueltas. Nunca cambies ni agregues palabras; si ningún pedazo textual cumple, no la elijas. "tema": de qué habla, en pocas palabras ("el camión de la fruta"). Y "por_que": una línea sobre qué escena podría salir.

Además, ubicar en el tiempo:
- "sin_fecha": como mucho UNA respuesta de la tanda que cuenta una historia con peso (más de 80 palabras, o una escena) y no dice cuándo pasó: ni año, ni edad, ni grado, ni etapa, ni un hecho que la ubique ("cuando me casé", "en la pandemia"). Nunca una sensible. Con su "ancla" (mismas reglas que arriba) y su "tema". Si no hay, null.
- "fechados": solo los CAMBIOS DE VIDA de la tanda (mudarse, empezar o dejar un colegio o un trabajo, casarse, un hijo, irse del país, una pérdida) que dicen cuándo pasaron, con el año o la edad TAL COMO los dijo él ("a los doce", "en el 2008") o de la ficha. Nada que no sea un cambio ("tener 27 años" no), nada repetido de <ya_repreguntado> o de tandas anteriores. Cada uno con "hecho" (pocas palabras, como él lo diría: "entrar a la fábrica"), "anio" o "edad" como número, y el id. No calcules nada.
```

Esquema de salida:

```json
{"elegidas": [{"id": "R..", "ancla": "", "tema": "", "por_que": ""}], "sin_fecha": {"id": "R..", "ancla": "", "tema": ""}, "fechados": [{"id": "R..", "hecho": "", "anio": null, "edad": null}]}
```

## Prueba 1 (26/09 noche, sobre las 57 respuestas de Naza, 4 tandas, USD 0)

8 elegidas, las 8 pasaron el control del ancla. **La elección es buena**: el campo de chico, el viaje de egresados, la final del Mundial en Barcelona, el día que armaron el Deng Studio, la casa de Tortuguitas, la cadena de Don Roque, el viaje a Miami con Joaco; ninguna sensible. Fallas, ya corregidas arriba:
1. El molde "contaste que {ancla}" no funciona con anclas en primera persona → ahora es cita textual entre comillas.
2. Repitió tema en dos tandas (el viaje de egresados en la 1 y en la 4) → ahora recibe lo ya repreguntado, con su tema.
3. Dos anclas no se entendían solas ("lo vi acá en Barcelona", "cuando nos pusimos nuestro primer estudio") → ahora el ancla tiene que decir de qué habla, o no se elige.

## Pendiente de decisión (Naza/Fable)

- **K2 · Resuelto (Fable):** muerte y enfermedad se permiten solo si el narrador ya lo contó en una respuesta no marcada "suave" ni "no", solo sobre personas de la ficha (padres, pareja, hijos, hermanos), y al cerrar el bloque SIGUIENTE, no el mismo. Siguen excluidos siempre: suicidio, abuso, drogas, cárcel, deudas, infidelidad, sexo, violencia, delitos.
- **K5 · Resuelto (Fable):** ver prompts-escritor-v3.md.
- **K6 · Piso del capítulo (7 % del libro, entre 600 y 900, propuesta de Fable ya en código):** confirmarlo con otro narrador. (Del escritor.)
- **K7 · Resuelto (Naza, 26/09):** "Juancito" es otra persona, no Juan Damico. (Del escritor.)
- **K8 · Resuelto (Fable):** cuota 2 por bloque, tope 10, ancla de 6 a 14 palabras (20 es un renglón y medio en WhatsApp); si no hay una de 14, no hay ancla.

## Prueba 2 (26/09 noche, cazador + ubicar en el tiempo, 4 bloques en secuencia con lo ya repreguntado, USD 0)

- **Escenas:** 8 elegidas, 8 pasan el control, **ningún tema repetido** (lo ya repreguntado funcionó): el Liceo, Ariel como padre, la final del Mundial, la competencia de rap que organizaban, el estudio de Tortuguitas, la cadena, el viaje de egresados, el viaje a Miami. Dos anclas flojas ("con mi estudio de música, hice un estudio de música increíble…", "…viajé a Miami con este chico": "este chico" no se entiende solo).
- **Ubicar en el tiempo casi no se usa:** marcó 1 sola historia sin fecha en 4 bloques (los dos días en la fábrica) y quedó sin lugar porque el cazador ya había usado las 2 intervenciones del bloque. Con "prioridad al cazador" y cuota 2, ubicar no corre nunca.
- **"fechados" trae ruido** ("tener 27 años", el mismo hecho dos veces).

Propuesta (a decidir): si en un bloque hay una historia sin fecha, el cupo es 1 escena + 1 "¿cuándo?" (el botón cuesta un toque; la escena, un audio). Además, que el ancla no tenga palabras que apuntan a algo de afuera ("este", "eso", "ahí") y que "fechados" sean solo cambios de vida con año o edad, sin repetir.

## Ajustes de Fable a la prueba 2 (26/09 noche) — aplicados en el diseño

1. **Cupo 2 por bloque.** La segunda plaza la gana el "¿cuándo fue?" solo si su historia tiene peso (escena o más de ~80 palabras); si no, la gana la segunda escena (el escritor ubica los resúmenes chicos con "un tiempo después"). Con mayores, que fechan menos, va a pasar más seguido, y el botón es barato.
2. **Palabras que apuntan afuera, por lista fija en código** (no por instrucción al modelo): este/esta/estos/estas, ese/esa/esos/esas, aquel/aquella, esto, eso, aquello, ahí, allá, allí, él, ella, ellos, ellas, entonces, "después de eso", "ahí mismo". Si el ancla tiene alguna, se rechaza y se le pide otra al modelo; si no hay otra, no hay intervención. **Ojo, decisión nuestra:** Fable listó también "lo, la, le", pero "la" y "lo" son artículos ("la fruta", "lo mejor") y el código no los distingue de los pronombres; quedan afuera de la lista (el modelo igual tiene la instrucción de que el ancla se entienda sola).
3. **Sustantivo concreto:** el ancla tiene que tener al menos uno ("el estudio que armamos en el garaje" sí; "me quedé con ganas de seguir" no). Esto lo juzga el modelo (instrucción en el prompt); el código solo exige al menos una palabra de contenido de 4 letras o más fuera de una lista de palabras vacías.
4. **"fechados"**: solo cambios de vida con año o edad **tal como los dijo** (no calculados), sin repetir, **ordenados por tiempo**. Los botones "Antes de… / Después de…" se arman con los **dos vecinos más cercanos a la etapa del bloque**, no con los dos últimos guardados.

Control con la lista fija, corrido sobre las anclas de la prueba 2: rechaza justo las dos flojas ("…ese fue un momento de felicidad…", "…viajé a Miami con este chico") y una tercera más ("…el carrito ese…"). En vivo, a cada rechazo se le pide otra ancla al modelo; si no hay, no hay intervención.

## Respuesta de Fable a la verificación (26/09 noche) — aplicada

- Mensajes OK; en España "quién estaba" en vez de "quién andaba por allí"; al "¿cuándo fue?" se le suma "Tocá una opción o contámelo".
- K2, K5, K8 y el título del capítulo: resueltos arriba y en prompts-escritor-v3.md.
- "lo, la, le": fuera de la lista fija; se rechazan solo **al principio** del ancla, donde el pronombre sin referente hace daño ("lo vi una sola vez").
