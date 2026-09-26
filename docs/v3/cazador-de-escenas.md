# Cazador de escenas (borrador, 26/09 noche)

**Estado: borrador v2 con los ajustes de Fable (26/09 noche), pendiente de aprobación de Naza.** Propuesta de Naza: cada tantas preguntas, una llamada que lea lo contado y le pida al narrador lo que falta. Se enfoca en lo que el dashboard no cubre: **escenas**. Las dudas de nombres y fechas siguen yendo al dashboard.

Por qué: la prueba del 26/09 ([`prueba-libro-v5.md`](prueba-libro-v5.md)) mostró que el "formulario" viene de respuestas que describen en vez de contar un momento; con cuatro audios de "una vez concreta", el capítulo pasó de ficha a escenas.

## Cómo funciona (con los ajustes de Fable)

1. **Frecuencia por bloque**, no cada 15: se corre al cerrar cada bloque del banco. Máximo 2 por bloque; **3** si en ese bloque más de la mitad de las respuestas duraron menos de 40 s (cuota adaptativa, por regla, para el narrador parco). Tope total ~10 en Estándar. Nunca dos repreguntas seguidas.
2. La llamada recibe la ficha, TODAS las respuestas hasta ahí y lo ya repreguntado (`<ya_repreguntado>`); elige solo entre las respuestas del bloque que cerró.
3. Devuelve cada elección con un **ancla**: un pedazo copiado tal cual de la respuesta, de **6 a 20 palabras**, que se entienda solo y **sin nombres de personas que no estén en la ficha**.
4. El código verifica: ancla textual en su respuesta (sin tildes ni mayúsculas), 6 a 20 palabras, sin nombres fuera de la ficha, respuesta no sensible, tema no repreguntado. Si algo falla, no se manda.
5. **Molde fijo, sin referencia de tiempo** ("hace un rato" puede ser hace cuatro días):
   > Me contaste esto: «{ancla}». ¿Te acordás de una vez concreta? Contame ese día: dónde estabas, quién estaba, qué pasó. Si preferís, decí paso.
6. **Entra a la cola como una pregunta más**, nunca enseguida de la respuesta que la originó: mínimo tres preguntas después, ideal la sesión siguiente.
7. Si contesta con el mismo resumen, se acepta y no se insiste. La respuesta entra al material pegada a la original.

Las dudas de nombres y fechas siguen yendo al dashboard. **Descartada** la repregunta fija por duración (sin modelo): la duración no distingue una respuesta corta y completa de una ficha (Fable).

Riesgos: en la v2 un modelo que leía el contexto metía errores ("ayer", hermanos mezclados, repetir lo dicho); acá el modelo solo elige y el narrador ve un texto fijo más sus propias palabras. Con mayores, sentirse examinados: bajo si la cita es literal y llega más tarde; alto si llega enseguida o se acumulan (por eso la cola, el tope y "nunca dos seguidas").

## Prompt

```
Sos el cazador de escenas de una entrevista para un libro de vida. No hablás con el narrador: elegís de qué respuesta vale la pena pedirle una escena.

Recibís la ficha, todas sus respuestas hasta ahora y lo que ya se le repreguntó. Mirá SOLO las respuestas marcadas "tanda" (las del bloque que acaba de cerrar). Una escena es un momento concreto: un día, un lugar, quién estaba, qué pasó, qué se dijo. Buscá respuestas que se quedaron en resumen o en descripción ("siempre íbamos al campo", "ella es muy buena", "fue una época dura") pero nombran algo que seguro tuvo un momento que contar.

Elegí como mucho {{CUOTA}}. No elijas:
- una respuesta que ya cuenta una escena (aunque sea corta);
- algo que ya está contado como escena en otra respuesta, de esta tanda o de antes, o un tema por el que ya se repreguntó (<ya_repreguntado>), aunque sea en otra respuesta;
- temas sensibles: muerte, enfermedad, cárcel, drogas, delitos, abuso, violencia, sexo, deudas;
- algo que el narrador dijo que no quiere contar;
- una respuesta de menos de 30 palabras.
Si ninguna vale la pena, devolvé una lista vacía: es mejor no preguntar que preguntar de más.

Para cada una, el "ancla": un pedazo de SU respuesta copiado tal cual, de 6 a 20 palabras, que se entienda solo, sin la pregunta ni el resto de la respuesta: tiene que decir de qué habla (sí: "los fines de semana nos íbamos al campo con mis hermanos"; no: "lo vi acá con un amigo", que no dice qué). Sin nombres de personas que no estén en la ficha. Va entre comillas después de "Me contaste esto:". Nunca cambies ni agregues palabras; si ningún pedazo textual cumple, no la elijas. Y "por_que": una línea sobre qué escena podría salir.
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
