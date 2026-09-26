# Prueba E4 · infancia con preguntas de momentos (kit para mandar a mano)

**Estado: textos pendientes de aprobación de Naza (27/09).**

**Qué prueba:** la premisa de la regla de momentos (D7 del diseño). ¿Una persona de 60+ contesta "contame ese día" con una **escena**, o igual con un resumen? En el material de Naza (27 años, preguntas viejas) las escenas eran el 15 %. **Sigue si** más de la mitad de las respuestas son escenas; **frena** si quedan por debajo del 40 % (ahí se reabre cómo preguntar).

**Cómo:** Naza se lo manda por WhatsApp a 2 o 3 personas de 60+, **a mano, de a una pregunta**. Manda la siguiente cuando llega el audio, sin comentar nada (a lo sumo "¡Gracias!"). Al final, con sus respuestas, se arman 2 mensajes del cazador y se mandan también, para probar si la repregunta saca escenas. Los audios se guardan en `fabrica/prueba-e4/<nombre>/` (carpeta ignorada por git); se transcriben en la máquina con vosk (gratis) y se clasifican escena / resumen / dato.

Las 15 salen de los bloques 1 a 3 del banco. Las que pedían describir se pasaron a momento; las de personas, a la forma mixta (primero el dato, al final la escena). El género va a mano: "chico" o "chica".

## Mensaje de arranque (y consentimiento)

> Hola, {nombre}. Estoy probando un proyecto: un libro con la historia de vida de cada uno, armado con preguntas por WhatsApp. ¿Me ayudás? Te mando 15 preguntas sobre tu infancia, de a una. Contestás con un audio cuando puedas, lo que te salga, sin apuro. Si alguna no la querés contestar, decime «paso» y seguimos. Los audios son solo para esta prueba: no se publican ni se comparten, y los borro cuando termine.

## Las 15 preguntas

| # | Del banco | Pregunta |
|---|---|---|
| 1 | OR1 | Contame dónde y cómo naciste, según lo que te contaron en tu casa: en qué lugar, quién estaba, si hubo alguna historia alrededor de ese día. |
| 2 | OR2+OR3 (mixta) | Decime cómo se llamaban tus abuelos y de dónde eran, y contame una vez concreta que estuviste con alguno de ellos: dónde estaban, qué pasó. |
| 3 | CA1 (antes "describime la casa") | Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí. |
| 4 | CA2 (mixta) | Decime cómo se llamaba tu mamá y a qué se dedicaba, y contame una vez con ella que tengas guardada: dónde estaban, qué pasó. |
| 5 | CA3 (mixta) | Decime cómo se llamaba tu papá y en qué trabajaba, y contame una vez con él que tengas guardada: dónde estaban, qué pasó. |
| 6 | CA6 (mixta) | Decime cómo se llaman tus hermanos, del mayor al menor, y contame una vez con alguno de ellos cuando eran chicos. |
| 7 | CA10 (antes "un domingo típico") | Contame un domingo de tu infancia que recuerdes por algo: qué se comió, quiénes estaban, qué pasó ese día. |
| 8 | CA11 | Contame una Navidad, o la fiesta más importante del año en tu casa, que recuerdes por algo en particular: dónde fue, quiénes estaban, qué pasó. |
| 9 | CA13 (antes "cómo era el barrio") | Contame una tarde en tu barrio cuando eras {chico/chica}: dónde estabas, con quién, a qué jugaban, qué pasó. |
| 10 | CA5 | Contame una vez que te retaron o te castigaron de {chico/chica}: qué habías hecho, quién te retó y cómo terminó. |
| 11 | ES1 | Contame tu primer día de escuela o lo primero que recuerdes de la escuela primaria: cómo se llamaba la escuela, quién te llevó, qué sentiste. |
| 12 | ES2 (mixta) | Decime cómo se llamaba una maestra o un maestro que te marcó, y contame una vez concreta con esa persona. |
| 13 | ES5 (mixta) | Decime cómo se llamaba tu mejor amigo o amiga de la infancia, y contame una vez concreta con esa persona: dónde estaban, qué hacían. |
| 14 | ES11 (antes "un objeto importante") | Contame el día que te llegó algo que fue muy importante para vos de {chico/chica}: un juguete, una bicicleta, un libro. Quién te lo dio, qué pasó. |
| 15 | CA16 | Contame un momento muy feliz de tu infancia, uno concreto: qué pasó, quién estaba, qué sentiste. |

## Después de las 15: dos del cazador

Con sus respuestas, se eligen 2 que hayan quedado en resumen y se manda el molde del cazador (versión vos), con una frase textual suya de 6 a 14 palabras:

> Me quedé pensando en algo que me contaste: «{frase}». ¿Te acordás de algún día en particular? Contame ese día como si lo estuvieras viendo: dónde estabas, quién andaba por ahí, qué pasó. Y si no te acordás o no tenés ganas, decime «paso» y seguimos con otra cosa.

## Qué se mide

| Qué | Cómo |
|---|---|
| % de escenas | Cada respuesta: escena (un momento concreto: cuándo, dónde, quién, qué pasó), resumen o dato |
| Duración | Segundos de cada audio |
| "paso" | Cuántas |
| Cazador | ¿Las 2 repreguntas trajeron escena? |
| Cómo se sintió | Al final, preguntarles: "¿Alguna pregunta te pareció rara o difícil? ¿Te dieron ganas de seguir?" |

## Cierre para mandar

> ¡Terminamos! Muchísimas gracias. Una última cosa, si querés: ¿alguna pregunta te pareció rara o difícil de contestar? ¿Te dieron ganas de seguir contando?
