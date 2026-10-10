# Prueba E4 · infancia con preguntas de momentos (kit para mandar a mano)

**Estado: textos pendientes de aprobación de Naza (27/09).**

**Qué prueba:** la premisa de la regla de momentos (D7 del diseño). ¿Una persona de 60+ contesta "contame ese día" con una **escena**, o igual con un resumen? En el material de Naza (27 años, preguntas viejas) las escenas eran el 15 %. **Sigue si** más de la mitad de las respuestas son escenas; **frena** si quedan por debajo del 40 % (ahí se reabre cómo preguntar).

**Cómo:** Naza se lo manda por WhatsApp a 2 o 3 personas de 60+, **a mano, de a una pregunta**. Manda la siguiente cuando llega el audio, sin comentar nada (a lo sumo "¡Gracias!"). Al final, con sus respuestas, se arman 2 mensajes del cazador y se mandan también, para probar si la repregunta saca escenas. Los audios se guardan en `fabrica/prueba-e4/<nombre>/` (carpeta ignorada por git); se transcriben en la máquina con vosk (gratis) y se clasifican escena / resumen / dato.

Las 15 salen de los bloques 1 a 3 del banco. **Corrección de Naza (27/09):** ninguna pregunta da por muerta, perdida ni terminada a una persona o una cosa (le pasó con padres, amigos y objetos): "el nombre de" en vez de "cómo se llamaba", "se dedica o se dedicaba", y el pasado se ata a la época ("de cuando eras chico"), no a la persona. Naza contestó la versión anterior. Las que pedían describir se pasaron a momento; las de personas, a la forma mixta (primero el dato, al final la escena). El género va a mano: "chico" o "chica".

## Mensaje de arranque (y consentimiento)

> Hola, {nombre}. Estoy probando un proyecto: un libro con la historia de vida de cada uno, armado con preguntas por WhatsApp. ¿Me ayudás? Te mando 15 preguntas sobre tu infancia, de a una. Contestás con un audio cuando puedas, lo que te salga, sin apuro. Si alguna no la querés contestar, decime «paso» y seguimos. Los audios son solo para esta prueba: no se publican ni se comparten, y los borro cuando termine.

## Las 15 preguntas

| # | Del banco | Pregunta |
|---|---|---|
| 1 | OR1 | Contame dónde y cómo naciste, según lo que te contaron en tu casa: en qué lugar, quién estaba, si hubo alguna historia alrededor de ese día. |
| 2 | OR2+OR3 (mixta) | Decime los nombres de tus abuelos y de dónde son o eran, y contame una vez concreta con alguno de ellos cuando eras {chico/chica}: dónde estaban, qué pasó. |
| 3 | CA1 (antes "describime la casa") | Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí. |
| 4 | CA2 (mixta) | Decime el nombre de tu mamá y a qué se dedica o se dedicaba, y contame una vez con ella de cuando eras {chico/chica} que tengas guardada: dónde estaban, qué pasó. |
| 5 | CA3 (mixta) | Decime el nombre de tu papá y en qué trabaja o trabajaba, y contame una vez con él de cuando eras {chico/chica} que tengas guardada: dónde estaban, qué pasó. |
| 6 | CA6 (mixta) | Decime los nombres de tus hermanos, del mayor al menor, y contame una vez con alguno de ellos cuando eran chicos. |
| 7 | CA10 (antes "un domingo típico") | Contame un domingo de tu infancia que recuerdes por algo: qué se comió, quiénes estaban, qué pasó ese día. |
| 8 | CA11 | Contame una Navidad, o la fiesta más importante del año en tu casa, que recuerdes por algo en particular: dónde fue, quiénes estaban, qué pasó. |
| 9 | CA13 (antes "cómo era el barrio") | Contame una tarde en tu barrio cuando eras {chico/chica}: dónde estabas, con quién, a qué jugaban, qué pasó. |
| 10 | CA5 | Contame una vez que te retaron o te castigaron de {chico/chica}: qué habías hecho, quién te retó y cómo terminó. |
| 11 | ES1 | Contame tu primer día de escuela o lo primero que recuerdes de la escuela primaria: el nombre de la escuela, quién te llevó, qué sentiste. |
| 12 | ES2 (mixta) | Decime el nombre de una maestra o un maestro que te marcó en la primaria, y contame una vez concreta con esa persona en la escuela. |
| 13 | ES5 (mixta) | Decime el nombre de tu mejor amigo o amiga de cuando eras {chico/chica}, y contame una vez concreta con esa persona de esa época: dónde estaban, qué hacían. |
| 14 | ES11 (antes "un objeto importante") | Contame el día que te llegó algo muy importante para vos de {chico/chica}: un juguete, una bicicleta, un libro. Quién te lo dio, qué pasó ese día. |
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

## Piloto: Naza contestó las 15 (27/09) — resultado

Transcripción con vosk (gratis), clasificación a ciegas por un agente, revisada a mano en tres respuestas. La 5 no vale: se guardó el mismo audio que la 4.

**3 escenas de 14 = 21 %** (su material viejo: 15 %). **Por debajo del 50 %.** Dos de las tres son débiles.

Lo que dice el detalle (lo importante):
| Tipo de pregunta | Ejemplos | Resultado |
|---|---|---|
| **Un hecho único** ("el día que te llegó algo", "tu primer día de escuela", "el primer recuerdo de la casa") | 14, 11, 3 | **escena** (las 3 escenas salen de acá) |
| **Elegí uno de muchos** ("un domingo que recuerdes", "una tarde en el barrio", "un momento feliz", "tu mejor amigo") | 7, 9, 15, 13 | **costumbre**: contesta cómo eran los domingos, "casi siempre", una lista de amigos |
| Mixta de persona (nombre + "una vez con…") | 2, 4, 6, 12 | dato + resumen; en 4 respuestas quedó **a una repregunta** de ser escena (la madrugada que le abría la puerta al hermano, la expulsión, la visita a la cárcel, el viaje con un amigo) |

Conclusiones:
1. **Pedir "una vez" no alcanza si el tema es repetido** (domingos, tardes, amigos): el narrador describe la costumbre. Funciona cuando la pregunta nombra un **hecho único** ("el día que…", "la primera vez que…", "la última vez que…").
2. **La repregunta específica es la que saca escenas:** ayer, 4 de 4 audios de "contame esa noche / ese día" (sobre algo que ya había nombrado) fueron escenas. Hoy, 4 respuestas quedaron a una repregunta de serlo. El cazador de escenas es la palanca principal, no solo el banco.
3. Para el banco: preferir "el día que / la primera vez / la última vez" a "un X que recuerdes"; para personas, "la última vez que lo viste" o "el día que…" antes que "una vez con él".
4. Límites: una sola persona, de 28, que ya había contado estos temas y contestó rápido (mediana ~44 s). **E4 con mayores sigue siendo la prueba que decide.**

## Piloto del cazador con Naza (27/09): 4 repreguntas sobre sus respuestas de hoy

| # | Ancla (sus palabras) | Qué salió |
|---|---|---|
| C1 | "él es el que hace la oferta, es muy bueno negociando" | casi escena: un auto que perdieron; sobre todo costumbre ("siempre mirábamos coches con mi papá") |
| C2 | "cuando se escuchaba llegar el auto" | costumbre con detalle nuevo y vivo (la ventana del segundo piso, el auto con asientos naranja), pero "sea la hora que sea" |
| C3 | "a veces íbamos a Rosario, a veces venían los primos" | **rechazo:** "eso ya te conté todo" (13 s) |
| C4 | "…me ha llevado de viaje con su familia a Punta del Este" | descripción viva (la casa como un hotel, la heladera de chocolates "como la fábrica de Willy Wonka"), no un día |

**0 escenas claras de 4, pero más detalle concreto que en la primera respuesta.** Contra ayer (4 de 4 escenas): ayer las anclas eran **hechos únicos** ("la noche de la fiesta", "la primera noche en el piso", "la última vez con tu hermano"); hoy eran **costumbres** (negociar, el auto que llegaba, los domingos, los viajes). Con una costumbre, "¿te acordás de algún día en particular?" vuelve a dar la costumbre.

Propuestas para el cazador (a decidir):
1. **Elegir anclas que nombren un hecho único** (una vez, una noche, un viaje, la primera o la última); descartar las que son costumbre ("siempre", "a veces", "cada domingo").
2. **Si solo hay costumbre, otro molde:** "¿Te acordás de la primera vez, o de una vez que fue distinta a las demás?" (pedir la excepción es lo que rompe la costumbre).
3. **No repreguntar un tema que ya salió en dos respuestas:** la C3 cansó ("ya te conté todo").
Límite: Naza contestó rápido (mediana ~36 s) y cansado de repetir su vida; con un mayor que cuenta por primera vez puede ser distinto.
