# Cazador de escenas (borrador, 26/09 noche)

**Estado: borrador v3 (26/09 noche): v2 con los ajustes de Fable + revisión de textos; pendiente de aprobación de Naza.** Propuesta de Naza: cada tantas preguntas, una llamada que lea lo contado y le pida al narrador lo que falta. Se enfoca en lo que el dashboard no cubre: **escenas**. Las dudas de nombres y fechas siguen yendo al dashboard.

Por qué: la prueba del 26/09 ([`prueba-libro-v5.md`](prueba-libro-v5.md)) mostró que el "formulario" viene de respuestas que describen en vez de contar un momento; con cuatro audios de "una vez concreta", el capítulo pasó de ficha a escenas.

## Cómo funciona (con los ajustes de Fable)

1. **Frecuencia por bloque**, no cada 15: se corre al cerrar cada bloque del banco. Máximo 2 por bloque; **3** si en ese bloque más de la mitad de las respuestas duraron menos de 40 s (cuota adaptativa, por regla, para el narrador parco). Tope total ~10 en Estándar. Nunca dos repreguntas seguidas. Ojo: con un narrador muy parco la cuota extra rinde poco, porque las respuestas de menos de 30 palabras no se eligen.
2. La llamada recibe la ficha, TODAS las respuestas hasta ahí y lo ya repreguntado (`<ya_repreguntado>`: id y tema de cada repregunta anterior); elige solo entre las respuestas del bloque que cerró, que van con `tanda="si"`.
3. Devuelve cada elección con un **ancla**: un pedazo copiado tal cual de la respuesta, de **6 a 20 palabras**, que se entienda solo y **sin nombres de personas que no estén en la ficha**, y con su **tema**.
4. El código **limpia el ancla** antes de controlarla y mostrarla: saca del principio "y", "pero", "que", "porque", "entonces", "bueno", "nada", "o sea", "eh" (repetido mientras haya), y del final ". , ; :" ("?" y "!" se quedan). No saca muletillas del medio: el ancla sigue siendo un pedazo contiguo de la respuesta.
5. El código verifica, sobre el ancla limpia: que sea un pedazo contiguo de su respuesta (comparando sin tildes, mayúsculas ni puntuación), 6 a 20 palabras, sin nombres fuera de la ficha, respuesta no sensible, id no repreguntado. Si algo falla, no se manda. Lo sensible usa la misma lista que el paso 1 del escritor; el modelo no elige esas respuestas, y el código solo puede verificar lo que el narrador marcó como "no quiero contar" en la entrevista. El tema no repreguntado lo controla el modelo (el código solo compara ids).
6. **Molde fijo, sin referencia de tiempo** ("hace un rato" puede ser hace cuatro días). El código elige la variante por el tratamiento y el país de la ficha. *Texto pendiente de aprobación de Naza.*
   - **vos:**
     > Me quedé pensando en algo que me contaste: «{ancla}». ¿Te acordás de algún día en particular? Contame ese día como si lo estuvieras viendo: dónde estabas, quién andaba por ahí, qué pasó. Y si no te acordás o no tenés ganas, decime «paso» y seguimos con otra cosa.
   - **tú (España):**
     > Me he quedado pensando en algo que me contaste: «{ancla}». ¿Te acuerdas de algún día en particular? Cuéntame ese día como si lo estuvieras viendo: dónde estabas, quién andaba por allí, qué pasó. Y si no te acuerdas o no te apetece, dime «paso» y seguimos con otra cosa.
   - **usted (Argentina):**
     > Me quedé pensando en algo que me contó: «{ancla}». ¿Se acuerda de algún día en particular? Cuénteme ese día como si lo estuviera viendo: dónde estaba, quién andaba por ahí, qué pasó. Y si no se acuerda o no tiene ganas, dígame «paso» y seguimos con otra cosa.
   - **usted (España):**
     > Me he quedado pensando en algo que me contó: «{ancla}». ¿Se acuerda de algún día en particular? Cuénteme ese día como si lo estuviera viendo: dónde estaba, quién andaba por allí, qué pasó. Y si no se acuerda o no tiene ganas, dígame «paso» y seguimos con otra cosa.
7. **Entra a la cola como una pregunta más**, nunca enseguida de la respuesta que la originó: mínimo tres preguntas después, ideal la sesión siguiente.
8. Si contesta con el mismo resumen, se acepta y no se insiste. La respuesta entra al material con el **mismo id** que la original, pegada a ella y sin el texto de la repregunta. El control de eco de preguntas del escritor (paso 4) no cuenta el ancla: son palabras del narrador.
9. El código registra cuántas veces una tanda sale sin elegidas, para ver si el modelo toma la cuota como meta o si le faltan candidatas.

Las dudas de nombres y fechas siguen yendo al dashboard. **Descartada** la repregunta fija por duración (sin modelo): la duración no distingue una respuesta corta y completa de una ficha (Fable).

Riesgos: en la v2 un modelo que leía el contexto metía errores ("ayer", hermanos mezclados, repetir lo dicho); acá el modelo solo elige y el narrador ve un texto fijo más sus propias palabras. Con mayores, sentirse examinados: bajo si la cita es literal y llega más tarde; alto si llega enseguida o se acumulan (por eso la cola, el tope y "nunca dos seguidas").

## Prompt

```
Sos el cazador de escenas de una entrevista para un libro de vida. No hablás con el narrador: elegís de qué respuesta vale la pena pedirle una escena.

Recibís la ficha, todas sus respuestas hasta ahora y lo que ya se le repreguntó. Mirá SOLO las respuestas con tanda="si" (las del bloque que acaba de cerrar). Una escena es un momento concreto: un día, un lugar, quién estaba, qué pasó, qué se dijo. Buscá respuestas que se quedaron en resumen o en descripción ("siempre había gente en la cocina", "ella es muy buena", "fue una época dura") pero nombran algo que seguro tuvo un momento que contar.

Elegí como mucho {{CUOTA}}. No elijas:
- una respuesta que ya cuenta una escena (aunque sea corta);
- algo que ya está contado como escena en otra respuesta, de esta tanda o de antes, o un tema por el que ya se repreguntó (<ya_repreguntado>), aunque sea en otra respuesta. Un tema es la cosa, el lugar o la persona de la que se habla, no la respuesta: "el taller de costura" y "las clientas del taller" son el mismo tema;
- temas sensibles: muerte, enfermedad, cárcel, drogas, delitos, abuso, violencia, sexo, suicidio, deudas, infidelidad;
- algo que el narrador dijo que no quiere contar;
- una respuesta de menos de 30 palabras.
Si ninguna vale la pena, devolvé una lista vacía: es mejor no preguntar que preguntar de más.

Para cada una, el "ancla": un pedazo de SU respuesta copiado tal cual, de 6 a 20 palabras, que se entienda solo, sin la pregunta ni el resto de la respuesta: tiene que decir de qué habla (sí: "los veranos ayudaba a mi tío a descargar el camión de la fruta"; no: "eso fue cuando pasó lo otro", que no dice qué). Sin nombres de personas que no estén en la ficha. El narrador la va a ver entre comillas, como algo suyo que nos quedó dando vueltas. Nunca cambies ni agregues palabras; si ningún pedazo textual cumple, no la elijas. "tema": de qué habla, en pocas palabras ("el camión de la fruta"). Y "por_que": una línea sobre qué escena podría salir.
```

Esquema de salida:

```json
{"elegidas": [{"id": "R..", "ancla": "", "tema": "", "por_que": ""}]}
```

## Prueba 1 (26/09 noche, sobre las 57 respuestas de Naza, 4 tandas, USD 0)

8 elegidas, las 8 pasaron el control del ancla. **La elección es buena**: el campo de chico, el viaje de egresados, la final del Mundial en Barcelona, el día que armaron el Deng Studio, la casa de Tortuguitas, la cadena de Don Roque, el viaje a Miami con Joaco; ninguna sensible. Fallas, ya corregidas arriba:
1. El molde "contaste que {ancla}" no funciona con anclas en primera persona → ahora es cita textual entre comillas.
2. Repitió tema en dos tandas (el viaje de egresados en la 1 y en la 4) → ahora recibe lo ya repreguntado, con su tema.
3. Dos anclas no se entendían solas ("lo vi acá en Barcelona", "cuando nos pusimos nuestro primer estudio") → ahora el ancla tiene que decir de qué habla, o no se elige.

## Pendiente de decisión (Naza/Fable)

- **K2 · Muerte y enfermedad:** para un público de 60+, la última vez con un padre o la viudez suelen ser las escenas centrales. ¿Se excluyen del todo o solo si el narrador las marcó? Hoy siguen excluidas.
- **K5 · Años de los títulos del libro:** ¿años calculados ("1998–2004") o "hacia 2004" cuando el corte no es seguro? (Del escritor; se anota acá para tener la lista junta.)
- **K6 · Piso de 600 palabras por capítulo:** el revisor recomienda confirmarlo con otro narrador. (Del escritor.)
- **K7 · ¿"Juancito" es Juan Damico?** Lo contesta Naza. (Del escritor.)
- **K8 · Cuota y largo del ancla:** 2 o 3 por bloque con tope ~10, y anclas de hasta 20 palabras en un WhatsApp para alguien de 75.
