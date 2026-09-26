# Cazador de escenas (borrador, 26/09 noche)

**Estado: borrador de prueba, pendiente de aprobación de Naza.** Propuesta de Naza: cada 15 preguntas, una llamada que lea lo contado y le pida al narrador lo que falta. Se enfoca en lo que el dashboard no cubre: **escenas**. Las dudas de nombres y fechas siguen yendo al dashboard.

Por qué: la prueba del 26/09 ([`prueba-libro-v5.md`](prueba-libro-v5.md)) mostró que el "formulario" viene de respuestas que describen en vez de contar un momento; con cuatro audios de "una vez concreta", el capítulo pasó de ficha a escenas.

## Cómo funciona

1. Cada 15 respuestas, una llamada recibe la ficha, TODAS las respuestas hasta ahí y las repreguntas que ya se hicieron (`<ya_repreguntado>`); elige solo entre las últimas 15.
2. Devuelve como mucho 2 elecciones, cada una con un **ancla**: un pedazo copiado tal cual de la respuesta (de 3 a 15 palabras).
3. El código verifica que el ancla esté textual en esa respuesta (sin tildes ni mayúsculas); si no está, no se manda. Tampoco se manda si la respuesta es sensible, si ya se repreguntó por esa respuesta o si el ancla nombra a alguien que no está en la ficha ni en la respuesta.
4. El mensaje es un molde fijo, no lo redacta el modelo:
   > Hace un rato me dijiste: «{ancla}». ¿Te acordás de una vez concreta? Contame ese día: dónde estabas, quién estaba, qué pasó.

   (Primera versión: "Hace un rato contaste que {ancla}". Falló en la prueba: el ancla es suya, en primera persona, y quedaba "contaste que me fui a vivir solo". Con la cita entre comillas vale en cualquier persona y el modelo no reescribe nada.)
5. La respuesta entra al material como una respuesta más, pegada a la original.

Riesgo que cuida el diseño: en la v2 un modelo que leía el contexto metía errores ("ayer", hermanos mezclados, repetir lo dicho). Acá el modelo solo elige; el texto que ve el narrador es fijo más sus propias palabras.

## Prompt

```
Sos el cazador de escenas de una entrevista para un libro de vida. No hablás con el narrador: elegís de qué respuesta vale la pena pedirle una escena.

Recibís la ficha y todas sus respuestas hasta ahora. Mirá SOLO las respuestas marcadas "tanda" (las últimas 15). Una escena es un momento concreto: un día, un lugar, quién estaba, qué pasó, qué se dijo. Buscá respuestas que se quedaron en resumen o en descripción ("siempre íbamos al campo", "ella es muy buena", "fue una época dura") pero nombran algo que seguro tuvo un momento que contar.

Elegí como mucho 2. No elijas:
- una respuesta que ya cuenta una escena (aunque sea corta);
- algo que ya está contado como escena en otra respuesta, de esta tanda o de antes, o un tema por el que ya se repreguntó (<ya_repreguntado>), aunque sea en otra respuesta;
- temas sensibles: muerte, enfermedad, cárcel, drogas, delitos, abuso, violencia, sexo, deudas;
- algo que el narrador dijo que no quiere contar;
- una respuesta de menos de 30 palabras.
Si ninguna vale la pena, devolvé una lista vacía: es mejor no preguntar que preguntar de más.

Para cada una, el "ancla": un pedazo de SU respuesta copiado tal cual, de 3 a 15 palabras, que se entienda solo, sin la pregunta ni el resto de la respuesta: tiene que decir de qué habla (sí: "los fines de semana nos íbamos al campo"; no: "lo vi acá con un amigo", que no dice qué). Va entre comillas después de "Hace un rato me dijiste:". Nunca cambies ni agregues palabras; si ningún pedazo textual se entiende solo, no la elijas. Y "por_que": una línea sobre qué escena podría salir.
```

Esquema de salida:

```json
{"elegidas": [{"id": "R..", "ancla": "", "por_que": ""}]}
```

## Prueba 1 (26/09 noche, sobre las 57 respuestas de Naza, 4 tandas, USD 0)

8 elegidas, las 8 pasaron el control del ancla. **La elección es buena**: el campo de chico, el viaje de egresados, la final del Mundial en Barcelona, el día que armaron el Deng Studio, la casa de Tortuguitas, la cadena de Don Roque, el viaje a Miami con Joaco; ninguna sensible. Fallas, ya corregidas arriba:
1. El molde "contaste que {ancla}" no funciona con anclas en primera persona → ahora es cita textual entre comillas.
2. Repitió tema en dos tandas (el viaje de egresados en la 1 y en la 4) → ahora recibe lo ya repreguntado.
3. Dos anclas no se entendían solas ("lo vi acá en Barcelona", "cuando nos pusimos nuestro primer estudio") → ahora el ancla tiene que decir de qué habla, o no se elige.
