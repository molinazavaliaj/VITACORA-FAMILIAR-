# Banco de preguntas V3

**Estado: borrador para aprobar — 25/09/2026.** Todas las filas están "pendiente de aprobación": Naza aprueba cada texto antes de que llegue a un narrador.

Este archivo es el banco completo. El diseño (por qué, cómo funciona, escritor, pruebas) está en [`diseno-v3.md`](diseno-v3.md).

Sale de: banco del informe 1 (C.2) + cambios del informe 2 (sin repregunta, pandemia y Mundial) + todo el informe 3 (secciones 3, 4 y 5) + las decisiones de Naza. Donde se contradicen, ganan las decisiones de Naza.

## Cómo leer este banco

### La frase de "paso"

Toda pregunta de historia termina con esta frase. No se repite en las tablas:

> Si esto no te pasó o preferís no contarlo, decí *paso* y seguimos con otra.

Si la respuesta empieza con "paso", la pregunta queda saltada y no se vuelve a mandar.

### Columnas

| Columna | Qué quiere decir |
|---|---|
| ID | Código fijo de la pregunta. `XX1b` = cierre de lector (cómo terminó, cuánto duró, qué fue de esa persona) que antes era seguimiento. `XX1.2` = segunda mitad de una pregunta que pedía dos historias y se partió. |
| Tipo | **O** = obligatoria. **C:DATO** = solo si el dato está confirmado (ficha o botón). **C:¬DATO** = solo si la ficha o el botón dicen "no tiene". **S** = sensible. **E:edad** = según la edad (sale del año de nacimiento). |
| Tamaño | **B** = Breve (entra en los tres). **E** = Estándar (entra en Estándar y Completo). **C** = solo Completo. |
| Estado | Todas: pendiente de aprobación. |

### Notación de los textos

| Marca | Qué hace | Ejemplo |
|---|---|---|
| `{{campo}}` | Se llena con la ficha (o con la pregunta de datos). | `{{pareja_1}}` → Marta |
| `, {{madre}},` | Nombre en aposición. Si falta, se borra el nombre y su coma. | "tu mamá, Elsa," / "tu mamá" |
| `{{o/a}}`, `{{padre/madre}}` | Forma para varón / forma para mujer, según el **género del narrador**. Si en la ficha dice "otro", se usa la forma que eligió en "cómo prefiere que le hablen". | "orgullos{{o/a}}" → orgullosa |
| `«pl: … ‖ sg: …»` | Plural o singular, según cuántos nombres hay en la lista. | "«pl: alguno de tus hermanos ‖ sg: {{hermanos}}»" |
| `[…]` | Versión genérica si el campo está vacío. **Solo en preguntas no sensibles.** Una sensible sin dato no se manda. | "{{lugar_destino}} [al lugar nuevo]" |

Las listas (`{{hijos}}`, `{{nietos}}`, `{{hermanos}}`) se leen como "Pablo y Ana" o "Pablo". Las preguntas sobre terceros se escribieron sin él/ella para no necesitar el género de cada persona.

### Voseo y tuteo

El banco está en voseo rioplatense. Para quien habla de tú (sale de "país de residencia" y se puede cambiar en la ficha: "cómo habla: vos / tú") hay una **tabla de reemplazo**, no otro banco. La del informe 1: contame → cuéntame, acordate → acuérdate, decí → di, tenés → tienes, vos → tú. **Falta completarla** con todas las formas del banco (querés, sabés, elegí, hacés, pensá, describime, presentame…). Menú de historia grande y "colimba / mili" también cambian por país.

### Reglas de armado

- **Una sola pendiente.** El narrador nunca tiene más de una pregunta abierta. Los audios que llegan con la pregunta abierta se suman a la misma respuesta; la siguiente llega sola a los 3-5 minutos sin audios nuevos, o antes con [Siguiente].
- **Orden.** Bloques en el orden de la tabla (1 a 15); dentro del bloque, el orden de la tabla. El narrador puede elegir entre dos temas (ver mensajes fijos); lo obligatorio no elegido vuelve a la cola.
- **Datos primero.** Al abrir un bloque, si falta un dato que el bloque necesita, primero va la pregunta de datos (tabla más abajo).
- **Cierres `b`.** Van en el turno siguiente a su pregunta madre. Si la madre fue "paso", la `b` no se manda. Tamaño: el de la madre, salvo que la madre sea B (entonces la `b` es E, porque Breve no lleva cierres).
- **Sensibles.** Solo con dato confirmado, excluibles desde la ficha, "paso" siempre, acuse sobrio. El aviso va como mensaje justo antes de la primera sensible del bloque, en el mismo turno. Una vez por bloque.
- **Sin contenido previo.** Ninguna pregunta nombra algo que el narrador dijo ("ya hablamos", "ayer", "me contaste"). Los `b` repiten el tema desde el texto del banco, no desde la respuesta. Única excepción: la válvula "más" dice "de lo que contaste de esta época", sin nombrar nada puntual.
- **Repeticiones.** AM1–AM8 se repiten por segunda pareja; HI2–HI3 por cada hijo (ver notas de cada bloque).

### Cómo se asignaron los tamaños

El informe 3 marca el tamaño de sus filas y el informe 1 marca con ★ las de la versión corta, pero nadie marcó el tamaño de las demás filas del informe 1. Regla usada (sale del informe 2, C.5):

- **B** = las 46 ★ del informe 1 + las B del informe 3 (OF1, MA1, PA2, AY1) + pandemia y Mundial 2022.
- **E** = las E del informe 3 + las condicionales de pareja e hijos + los cierres `b` de preguntas B o E + CA8 (par de AM15 y HI10) + LE7 y LE8 (las usa el escritor: título y carta final).
- **C** = todo lo demás del informe 1 (incluidas las opcionales por edad) + las C del informe 3.

Esta asignación es de este documento, no de Naza: **hay que aprobarla.**

### Bloque 1 · Origen y raíces

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| OR1 | Contame dónde y cómo naciste, según lo que te contaron en tu casa: en qué lugar, quién estaba, si hubo alguna historia alrededor de ese día. | O | B | pendiente de aprobación |
| OR2 | ¿De dónde venía la familia de tu mamá, {{madre}}? Contame lo que sepas de tus abuelos por ese lado: cómo se llamaban, de dónde eran, a qué se dedicaban. | O | B | pendiente de aprobación |
| OR3 | ¿De dónde venía la familia de tu papá, {{padre}}? Contame lo que sepas de tus abuelos por ese lado: cómo se llamaban, de dónde eran, a qué se dedicaban. | O | B | pendiente de aprobación |
| OR4 | Contame una historia que se contaba en tu familia sobre algún antepasado: un viaje, una desgracia, una hazaña, algo que se repetía en las sobremesas. | O | C | pendiente de aprobación |
| OR5 | ¿Cómo se conocieron tu mamá y tu papá? Contame lo que te contaron: dónde, cuándo, quién dio el primer paso. | O | C | pendiente de aprobación |
| OR6 | ¿Por qué te pusieron {{nombre}}? Contame lo que te contaron de cómo eligieron tu nombre. | O | C | pendiente de aprobación |
| OR6.2 | Contame de dónde salió que te digan {{apodo}}: quién te lo puso y cuándo. | C:APODO | C | pendiente de aprobación |

Notas: OR6 se partió en dos (nombre / apodo). OR6.2 se manda solo si "cómo le dicen" en la ficha es distinto del nombre.

### Bloque 2 · La casa y la familia de la infancia

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| CA1 | Describime la casa donde viviste de chic{{o/a}}, la primera que recuerdes bien: cómo era por dentro, dónde dormías, qué se veía desde la puerta. | O | B | pendiente de aprobación |
| CA2 | Contame cómo era tu mamá, {{madre}}: cómo era físicamente, cómo hablaba, qué hacía en un día común. Elegí un momento concreto en que la veas haciendo algo. | O | B | pendiente de aprobación |
| CA3 | Contame cómo era tu papá, {{padre}}: cómo era físicamente, cómo hablaba, en qué trabajaba. Elegí un momento concreto en que lo veas haciendo algo. | O | B | pendiente de aprobación |
| CA4 | Contame una vez que tu mamá o tu papá te enseñaron algo que todavía hacés o pensás hoy. Una vez concreta: qué pasó y qué te dijeron. | O | C | pendiente de aprobación |
| CA5 | Contame una vez que te retaron o te castigaron de chic{{o/a}}: qué habías hecho, quién te retó y cómo terminó. | O | C | pendiente de aprobación |
| CA6 | «pl: Contame de tus hermanos, {{hermanos}}: quién era el mayor, cómo eran de chicos, con cuál te llevabas mejor. Presentame a cada uno como si yo no los conociera. ‖ sg: Contame de {{hermanos}}: cómo era de chico o chica, cómo se llevaban. Contámelo como si yo no conociera a nadie de tu familia.» | C:HERMANOS | B | pendiente de aprobación |
| CA7 | Contame una travesura o una aventura que hiciste con «pl: alguno de tus hermanos ‖ sg: {{hermanos}}». Una vez concreta. | C:HERMANOS | C | pendiente de aprobación |
| CA8 | Fuiste hij{{o/a}} únic{{o/a}}. Contame cómo era un día tuyo en casa sin hermanos: con quién jugabas, qué hacías sol{{o/a}}. | C:¬HERMANOS | E | pendiente de aprobación |
| CA9 | ¿Quién más vivía en tu casa o estaba siempre: un abuelo, una tía, alguien que trabajaba ahí? Contame quién era y un recuerdo con esa persona. | O | C | pendiente de aprobación |
| CA9b | Si en tu casa de chic{{o/a}} vivía o estaba siempre alguien más que tus padres y hermanos, contame qué fue de esa persona después. | O | C | pendiente de aprobación |
| CA10 | Contame un domingo típico de tu infancia, de la mañana a la noche: qué se comía, quién cocinaba, qué se hacía después. | O | B | pendiente de aprobación |
| CA11 | Contame cómo se pasaba la Navidad o la fiesta más importante del año en tu casa: dónde, quiénes venían, qué se hacía. Elegí una en particular que recuerdes. | O | C | pendiente de aprobación |
| CA12 | ¿Cómo andaban de plata en tu casa cuando eras chic{{o/a}}? Contame una vez concreta en que se notara, para bien o para mal. | O | C | pendiente de aprobación |
| CA13 | Contame cómo era el barrio o el pueblo donde creciste, {{ciudad_infancia}}: qué había en la cuadra, quiénes eran los vecinos, a dónde ibas a jugar. | O | C | pendiente de aprobación |
| CA14 | ¿Tuviste algún animal de chic{{o/a}}? Contame cómo llegó a tu casa y qué pasó con él. | O | C | pendiente de aprobación |
| CA15 | Contame una vez que tuviste mucho miedo de chic{{o/a}}: qué pasó, dónde estabas, quién te calmó. | O | C | pendiente de aprobación |
| CA16 | Contame un momento muy feliz de tu infancia, uno concreto: qué pasó, quién estaba, qué sentiste. | O | B | pendiente de aprobación |
| CA17 | Contame un momento triste o difícil de tu infancia, uno concreto: qué pasó y cómo lo pasaste. | O | C | pendiente de aprobación |

Notas: CA9b es el cierre de lector que el informe 1 tenía como seguimiento ("¿Qué fue de esa persona después?").

### Bloque 3 · La escuela y los juegos

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| ES1 | Contame tu primer día de escuela o lo primero que recuerdes de la escuela primaria: cómo se llamaba la escuela, quién te llevó, qué sentiste. | O | B | pendiente de aprobación |
| ES2 | Contame de una maestra o un maestro que te marcó: cómo se llamaba, cómo era, y una vez concreta que recuerdes con esa persona. | O | B | pendiente de aprobación |
| ES3 | ¿Qué tipo de alumn{{o/a}} eras? Contame una vez que te fue muy bien o muy mal en la escuela. | O | C | pendiente de aprobación |
| ES4 | Contame a qué jugabas de chic{{o/a}} y con quién: un juego concreto, dónde se jugaba, quiénes eran los amigos de esa época. Decime sus nombres. | O | B | pendiente de aprobación |
| ES5 | Contame de tu mejor amigo o amiga de la infancia: cómo se llamaba, cómo se conocieron, qué hacían juntos. | O | C | pendiente de aprobación |
| ES5b | Contame qué fue de tu mejor amigo o amiga de la infancia: si se volvieron a ver, la última vez que supiste de esa persona. | O | C | pendiente de aprobación |
| ES6 | Contame una travesura grande de la escuela o del barrio, una que todavía te haga reír o te dé vergüenza. | O | C | pendiente de aprobación |
| ES7 | ¿Qué querías ser cuando fueras grande? Contame de dónde salió esa idea. | O | C | pendiente de aprobación |
| ES8 | Contame cómo eran las vacaciones o el verano cuando eras chic{{o/a}}: a dónde se iba (o por qué no se iba), y un día concreto de esas vacaciones. | O | C | pendiente de aprobación |
| ES9 | Contame un momento concreto de la religión en tu infancia: tu comunión, una misa, una fiesta religiosa. Qué pasó, quién te llevaba. | C:RELIGIÓN | C | pendiente de aprobación |
| ES10 | ¿Qué se escuchaba en tu casa: radio, discos, alguien que cantaba? Contame una canción o un programa que recuerdes y con quién lo escuchabas. | E:60+ | C | pendiente de aprobación |
| ES11 | Contame de un objeto que fue muy importante para vos de chic{{o/a}}: un juguete, una bicicleta, un libro. Cómo llegó a tus manos y qué pasó con él. | O | C | pendiente de aprobación |

Notas: ES9 se reescribió para que no pregunte "¿había religión?" (eso lo resuelve el gate). ES10 queda solo en Completo (el informe 2 saca las opcionales por edad del Estándar y fundía ES10 con ES11; acá no se funden para no mezclar dos cosas).

### Bloque 4 · Adolescencia

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| AD1 | Contame cómo eras a los quince: cómo te vestías, cómo te peinabas, qué te gustaba, qué te daba vergüenza. Elegí un día concreto de esa edad. | O | B | pendiente de aprobación |
| AD2 | Contame de la escuela secundaria (o de lo que hacías a esa edad si no fuiste): cómo se llamaba, cómo llegaste ahí, y una escena concreta de esos años. | O | B | pendiente de aprobación |
| AD2b | Contame cómo terminó tu secundaria: si la terminaste, cómo fue el último día; si la dejaste, por qué y qué hiciste en vez de eso. | O | E | pendiente de aprobación |
| AD3 | Contame de tu grupo de amigos de la adolescencia: cómo se llamaban, dónde se juntaban, qué hacían. Presentame a cada uno como si yo no los conociera. | O | B | pendiente de aprobación |
| AD4 | Contame una noche o una salida de esa época que recuerdes bien: a dónde fueron, cómo llegaron, qué pasó. | O | C | pendiente de aprobación |
| AD5 | ¿Qué música escuchabas y dónde se bailaba? Contame una vez que fuiste a bailar o a un recital. | O | C | pendiente de aprobación |
| AD6 | Contame de tu primer amor o la primera persona que te gustó en serio: cómo se llamaba, cómo se conocieron, qué pasó. | O | B | pendiente de aprobación |
| AD6b | Contame cómo terminó lo de tu primer amor y qué fue de esa persona después. | O | E | pendiente de aprobación |
| AD7 | Contame la primera vez que ganaste plata: qué hiciste, cuántos años tenías, qué hiciste con esa plata. | O | C | pendiente de aprobación |
| AD8 | Contame una pelea o un desacuerdo grande que tuviste con tus padres de adolescente: por qué fue y cómo terminó. | O | C | pendiente de aprobación |
| AD9 | Contame una vez que te metiste en un lío de adolescente: qué pasó, quién te sacó y qué aprendiste. | O | C | pendiente de aprobación |
| AD10 | ¿Había alguien mayor que vos que fue como un guía en esos años: un tío, un profesor, un cura, un entrenador? Contame quién era y una vez concreta que te ayudó. | O | C | pendiente de aprobación |
| AD10b | Si en tu adolescencia hubo alguien mayor que fue como un guía para vos, contame qué fue de esa persona después. | O | C | pendiente de aprobación |
| AD11 | ¿Hacías algún deporte o tenías alguna pasión a esa edad? Contame un partido, una carrera, un día concreto de eso. | O | C | pendiente de aprobación |
| AD12 | Contame el momento en que decidiste qué ibas a hacer con tu vida después del colegio, o el momento en que alguien lo decidió por vos. Qué opciones había y por qué salió así. | O | C | pendiente de aprobación |

Notas: AD2b, AD6b y AD10b son cierres de lector que antes eran seguimiento.

### Bloque 5 · Juventud: estudios, servicio militar, migración, irse de casa

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| JU1 | Contame el día que te fuiste de la casa de tus padres: cuántos años tenías, a dónde te fuiste, con quién, y cómo fue la despedida. | O | B | pendiente de aprobación |
| JU2 | Contame de lo que estudiaste después del colegio: qué, dónde, por qué eso y no otra cosa, y un día concreto de esa época de estudiante. | C:ESTUDIOS | C | pendiente de aprobación |
| JU2b | Contame el momento en que dejaste de estudiar: por qué fue, quién lo supo primero, y qué hiciste después. | C:ESTUDIOS_SIN_TERMINAR | C | pendiente de aprobación |
| JU3 | Contame de un amigo o una amiga que hiciste en esa época de estudio y que fue importante: cómo se llamaba, cómo se conocieron. | C:ESTUDIOS | C | pendiente de aprobación |
| JU3b | Contame qué fue de ese amigo o esa amiga de la época de estudio: si siguen en contacto, la última vez que se vieron. | C:ESTUDIOS | C | pendiente de aprobación |
| JU4 | Contame cómo aprendiste tu oficio o tu trabajo, si no fue estudiando: quién te enseñó, dónde, cuánto tardaste en manejarte sol{{o/a}}. | C:¬ESTUDIOS | C | pendiente de aprobación |
| JU5 | Contame el día que entraste al servicio militar (la colimba, la mili): a dónde te mandaron, cómo fue la llegada, qué sentiste. | C:MILITAR | C | pendiente de aprobación |
| JU6 | Contame de un compañero del servicio militar que recuerdes: cómo se llamaba, de dónde era, y una vez concreta con él. | C:MILITAR | C | pendiente de aprobación |
| JU6b | Contame qué fue de ese compañero del servicio militar: si lo volviste a ver, cuándo fue la última vez. | C:MILITAR | C | pendiente de aprobación |
| JU7 | Contame lo más duro del servicio militar: una escena, un día concreto. | C:MILITAR | C | pendiente de aprobación |
| JU7.2 | Contame lo más lindo del servicio militar: una escena, un día concreto. | C:MILITAR | C | pendiente de aprobación |
| JU8 | Contame el día que decidiste irte de {{lugar_origen}} [del lugar donde creciste]: por qué te fuiste, quién lo supo primero, qué dijeron. | C:MIGRACIÓN | B | pendiente de aprobación |
| JU9 | Contame el viaje y la llegada a {{lugar_destino}} [al lugar nuevo]: cómo viajaste, qué llevabas, quién te esperaba (o nadie), y la primera noche. | C:MIGRACIÓN | B | pendiente de aprobación |
| JU10 | Contame quién te dio una mano en los primeros meses en {{lugar_destino}} [el lugar nuevo]: cómo se llamaba, qué era tuyo, y una vez concreta en que te ayudó. | C:MIGRACIÓN | E | pendiente de aprobación |
| JU10b | Contame qué fue de la persona que te dio una mano en tus primeros meses en {{lugar_destino}} [el lugar nuevo]: si la seguiste viendo, si le pudiste devolver el favor. | C:MIGRACIÓN | E | pendiente de aprobación |
| JU11 | Contame el momento en que sentiste por primera vez que ya eras de {{lugar_destino}} [del lugar nuevo], o el momento en que entendiste que nunca lo ibas a ser del todo. | C:MIGRACIÓN | E | pendiente de aprobación |
| MI1 | Contame una vez que te hicieron sentir de afuera cuando llegaste a {{lugar_destino}} [al lugar nuevo], por cómo hablabas o de dónde venías. | C:MIGRACIÓN | C | pendiente de aprobación |
| MI1.2 | Contame una vez que te hicieron sentir de adentro en {{lugar_destino}} [el lugar nuevo]: quién fue, qué pasó. | C:MIGRACIÓN | C | pendiente de aprobación |
| JU12 | Contame el primer lugar donde viviste por tu cuenta: cómo era, con quién, cómo lo pagabas, y una escena de un día común ahí. | O | C | pendiente de aprobación |
| JU12b | Contame cuánto tiempo viviste en el primer lugar que tuviste por tu cuenta y por qué te fuiste de ahí. | O | C | pendiente de aprobación |
| JU13 | Contame una locura o una aventura de tu juventud: un viaje, una apuesta, algo que hoy no harías. | O | C | pendiente de aprobación |

Notas: JU5 ya no tiene seguimiento "¿cuánto tiempo estuviste?": ese dato se pide en la pregunta de datos del servicio militar. JU7 y MI1 se partieron en dos. JU10 se partió: el "qué fue de esa persona" del informe 3 pasó a JU10b. JU2b es nueva (sale del seguimiento "¿Terminaste?") y solo va si el botón dijo [Lo dejé].

### Bloque 6 · Amor y pareja

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| AM1 | Contame el día que conociste a {{pareja_1}}: dónde fue, quién los presentó o cómo se cruzaron, qué pensaste esa primera vez. | C:PAREJA | B | pendiente de aprobación |
| AM2 | Contame cómo fue el noviazgo con {{pareja_1}}: cuánto duró, a dónde salían, y una salida concreta que recuerdes. | C:PAREJA | B | pendiente de aprobación |
| AM3 | Contame el momento en que decidieron juntarse, casarse o irse a vivir juntos: quién lo propuso, cómo, qué dijo el otro. | C:PAREJA | E | pendiente de aprobación |
| AM4 | Contame el día que se casaron o se fueron a vivir juntos: dónde fue, quiénes estaban, qué salió bien y qué salió mal. | C:PAREJA | B | pendiente de aprobación |
| AM5 | Contame cómo era la primera casa de ustedes dos cuando se juntaron: cómo era, cómo la consiguieron, y una escena de un día común ahí. | C:PAREJA | E | pendiente de aprobación |
| AM6 | Contame una pelea o una época difícil con {{pareja_1}} y cómo la pasaron. Una vez concreta. | C:PAREJA | E | pendiente de aprobación |
| AM7 | Contame algo que {{pareja_1}} hacía o decía que era muy suyo: una costumbre, una frase, una manía. | C:PAREJA | E | pendiente de aprobación |
| AM8 | Contame un momento muy feliz con {{pareja_1}}, uno concreto: qué pasó, dónde estaban. | C:PAREJA | E | pendiente de aprobación |
| CS3 | Contame cómo era la familia de {{pareja_1}}: tu suegra, tu suegro, los cuñados. Contame el primer día que fuiste a su casa y cómo te recibieron. | C:PAREJA | E | pendiente de aprobación |
| AM9 | Contame cómo y por qué terminó la relación con {{pareja_1}}: qué pasó, cuándo fue, cómo lo vivieron. | C:PAREJA_TERMINÓ · S | B | pendiente de aprobación |
| AM9b | Contame cómo quedó la relación con {{pareja_1}} después de la separación: si se siguieron viendo, cómo es hoy. | C:PAREJA_TERMINÓ · S | E | pendiente de aprobación |
| AM10 | Contame cómo fue tu vida en los meses después de separarte de {{pareja_1}}: dónde viviste, quién te acompañó. | C:PAREJA_TERMINÓ · S | E | pendiente de aprobación |
| AM11 | Contame cómo fue la última época con {{pareja_1}} y el día que se fue: lo que quieras contar, al ritmo que quieras. | C:PAREJA_FALLECIÓ · S | B | pendiente de aprobación |
| AM12 | Contame cómo fue tu vida después de perder a {{pareja_1}}: quién te acompañó, cómo fueron los primeros meses, qué te ayudó a seguir. | C:PAREJA_FALLECIÓ · S | E | pendiente de aprobación |
| AM13 | Contame un día de ustedes dos ahora, vos y {{pareja_actual}}: uno concreto de estos días, de la mañana a la noche. | C:PAREJA_ACTUAL | E | pendiente de aprobación |
| AM14 | ¿Hubo algún amor importante en tu vida además de {{parejas}}, antes o entre medio? Contame quién era y qué pasó. | O | C | pendiente de aprobación |
| AM14b | Si hubo en tu vida un amor importante además de {{parejas}}, contame cómo terminó y qué fue de esa persona. | O | C | pendiente de aprobación |
| AM15 | Contame cómo fue tu vida sin pareja estable: quiénes fueron las personas más cercanas, y un día concreto con alguna de ellas. | C:¬PAREJA | E | pendiente de aprobación |
| PI1 | Contame de {{persona_importante}}: cómo se conocieron, qué fue esa persona en tu vida, y un día concreto con ella. | C:PERSONA_IMPORTANTE | E | pendiente de aprobación |
| PI2 | ¿Qué fue de {{persona_importante}}? ¿Siguen juntos, se vieron hasta el final, se perdieron? Contame cómo siguió. | C:PERSONA_IMPORTANTE | E | pendiente de aprobación |

Notas: AM1–AM8 se repiten para {{pareja_2}} si hay segunda pareja (gate SEGUNDA_PAREJA), con el prefijo "Ahora sobre {{pareja_2}}:". AM9–AM12 no tienen versión genérica: sin dato confirmado no se mandan. AM13 quedó solo con la escena (se sacó "qué creés que hizo que duraran"). AM14 ya no dice "del que no hablamos". AM15 y los "¬" se mandan solo con "no tiene" confirmado. Donde el texto viejo decía "casamiento", ahora dice "se casaron o se fueron a vivir juntos".

### Bloque 7 · Trabajo y oficio

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| TR1 | Contame la primera vez que trabajaste, con o sin sueldo: qué hacías, quién te lo pidió o te lo dio, cuántos años tenías, y cómo fue el primer día. | O | B | pendiente de aprobación |
| TR1b | Contame cuánto tiempo seguiste en ese primer trabajo, con o sin sueldo, y por qué lo dejaste. | O | E | pendiente de aprobación |
| OF1 | Contame el día que sentiste que ya sabías hacer tu trabajo: qué pasó ese día, quién estaba, qué hiciste que antes no podías. | O | B | pendiente de aprobación |
| MA1 | ¿Qué sabés hacer con las manos? Contame cómo lo aprendiste, quién te lo enseñó y la última vez que lo hiciste. | O | B | pendiente de aprobación |
| TR2 | Contame un día común de tu trabajo como {{trabajo_principal}} [en el trabajo al que más años le diste], de que te levantabas hasta que volvías: horarios, tareas, con quién. | C:OFICIO_AFUERA | B | pendiente de aprobación |
| TR3 | Contame de una persona del trabajo que te marcó: un jefe, un compañero, un cliente. Cómo se llamaba, qué era tuyo, y una vez concreta con esa persona. | C:OFICIO_AFUERA | B | pendiente de aprobación |
| TR3b | Contame qué fue, con los años, de la persona del trabajo que más te marcó: si la volviste a ver, qué sabés de ella hoy. | C:OFICIO_AFUERA | E | pendiente de aprobación |
| TR4 | Contame el peor día o la peor época de tu trabajo: qué pasó y cómo saliste. | C:OFICIO_AFUERA | C | pendiente de aprobación |
| TR5 | Contame el día de trabajo del que estás más orgullos{{o/a}}: qué hiciste, quién lo vio. | C:OFICIO_AFUERA | C | pendiente de aprobación |
| OF2 | Contame de una persona a la que atendiste, llevaste, enseñaste, curaste o le hiciste algo con tus manos, y que no te olvidás: quién era, qué pasó ese día, por qué te quedó. | O | E | pendiente de aprobación |
| OF3 | Contame de una herramienta o un objeto de tu trabajo que fue tuyo: cómo era, cómo lo conseguiste, qué pasó con él. | O | C | pendiente de aprobación |
| OF4 | Contame un error grande que cometiste trabajando: qué pasó, quién se enteró, cómo lo arreglaste o qué aprendiste. | O | C | pendiente de aprobación |
| OB1 | Contame de los compañeros de trabajo como grupo: cómo se cuidaban entre ustedes, y una vez que uno te cubrió o vos lo cubriste. | C:OFICIO_AFUERA | C | pendiente de aprobación |
| OB2 | Contame el día de una huelga, un conflicto grande o una pelea con la empresa en tu trabajo: dónde estabas, qué se jugaba, cómo terminó. | C:OFICIO_AFUERA | C | pendiente de aprobación |
| TR6 | Contame, en orden, los otros trabajos que tuviste: qué hacías en cada uno, cuánto tiempo, y por qué pasaste de uno al otro. | C:OFICIO_AFUERA | B | pendiente de aprobación |
| TR8 | ¿Tuviste un negocio propio o un emprendimiento? Contame cómo empezó, un día concreto de eso, y cómo terminó. | O | C | pendiente de aprobación |
| PR1 | Contame el día que te recibiste o terminaste tu formación: dónde fue, quién estaba, qué hiciste esa noche. | C:ESTUDIOS_TERMINADOS | E | pendiente de aprobación |
| CS1 | Contame el trabajo que hiciste en tu casa y que nadie llamaba trabajo: cocinar, coser, lavar, cuidar, hacer rendir la plata. Elegí un día en que hiciste de todo y contámelo de la mañana a la noche. | O | E | pendiente de aprobación |
| CS2 | Contame una vez que la plata no alcanzaba y vos la hiciste alcanzar: qué inventaste, qué se dejó de comprar, a quién le pediste. | O | C | pendiente de aprobación |
| CP1 | Contame un día de trabajo en el campo, de antes de que saliera el sol hasta la noche: los animales, la tierra, quién trabajaba con vos, qué se comía. | C:CAMPO | E | pendiente de aprobación |
| CP2 | Contame una vez que el clima mandó: una sequía, una inundación, una helada, una tormenta. Qué pasó con lo de ustedes y qué hicieron. | C:CAMPO | E | pendiente de aprobación |
| CP3 | Contame cómo era ir al pueblo desde el campo: cada cuánto, en qué, qué se hacía allá y qué se traía. | C:CAMPO | C | pendiente de aprobación |
| TR9 | Contame el día que te jubilaste o dejaste de trabajar: cómo fue el último día, qué sentiste, qué hiciste al día siguiente. | C:JUBILADO · E:45+ | C | pendiente de aprobación |

Notas: Antes "Trabajo". TR7 se sacó (lo reemplaza CR1, bloque 11). OFICIO_AFUERA = la ficha tiene oficio o el botón dijo [Trabajé afuera] o [Las dos]. TR1b es cierre de lector (antes seguimiento de TR1); TR3b idem.

### Bloque 8 · Hijos y nietos

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| HI1 | Contame el día que supiste que ibas a ser {{padre/madre}} por primera vez: dónde estabas, quién te lo dijo o a quién se lo dijiste, qué sentiste. | C:HIJOS | B | pendiente de aprobación |
| HI2 | Contame el día que nació {{hijo_n}}: dónde, cómo fue, qué pasó alrededor. | C:HIJOS (una por hijo) | B | pendiente de aprobación |
| HI3 | Contame cómo era {{hijo_n}} en su infancia y una escena concreta que te haga sonreír. | C:HIJOS (una por hijo) | E | pendiente de aprobación |
| HI3b | Contame una escena de la casa llena de chicos: un día cualquiera con {{hijos}}, cuando eran chicos. | C:HIJOS>4 | E | pendiente de aprobación |
| HI4 | Contame un día común de la infancia de {{hijos}}, de la mañana a la noche: quién hacía qué, cómo se llegaba a la noche. | C:HIJOS | B | pendiente de aprobación |
| HI5 | Contame la época más difícil como {{padre/madre}}: qué pasó, cómo lo manejaste, qué harías distinto. | C:HIJOS | E | pendiente de aprobación |
| HI6 | Contame un momento con «pl: alguno de tus hijos ‖ sg: {{hijos}}» del que estés especialmente orgullos{{o/a}}, uno concreto. | C:HIJOS | E | pendiente de aprobación |
| HI7 | «pl: Contame cómo fue cuando tus hijos se fueron de casa: el día que se fue el primero, cómo quedó la casa. ‖ sg: Contame cómo fue cuando {{hijos}} se fue de casa: ese día, cómo quedó la casa.» | C:HIJOS | E | pendiente de aprobación |
| HI8 | Contame el día que conociste a tu primer nieto o nieta: cómo se llama, dónde fue, qué sentiste. | C:NIETOS | B | pendiente de aprobación |
| HI9 | Contame algo que hacés con {{nietos}} que es de ustedes: un juego, un paseo, una comida. Una vez concreta. | C:NIETOS | E | pendiente de aprobación |
| NC1 | Contame cómo pasó que {{nieto_a_cargo}} vino a vivir con vos o quedó a tu cargo, y cómo fue el primer día. | C:NIETOS_A_CARGO | E | pendiente de aprobación |
| NC2 | Contame un día común criando a {{nieto_a_cargo}}: qué hacías distinto de cuando criaste a tus hijos, y qué te costó más. | C:NIETOS_A_CARGO | E | pendiente de aprobación |
| HI10 | Contame de los chicos o jóvenes que fueron importantes en tu vida: sobrinos, alumnos, ahijados, vecinos. Quiénes son y una vez concreta con alguno. | C:¬HIJOS | E | pendiente de aprobación |

Notas: HI2 y HI3 se repiten por cada hijo, en orden de nacimiento, en turnos distintos; con más de cuatro hijos, HI3 va solo para el primero y el último y se suma HI3b. {{hijos}} es la lista de nombres ("Pablo y Ana" o "Pablo"). HF1 y HF2 (hijo fallecido) están en el bloque 11.

### Bloque 9 · Lugares y pasiones

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| LU1 | De todas las casas donde viviste, contame de la que más sentís tuya: dónde estaba, cómo llegaste a ella, y una escena de un día común ahí. | O | B | pendiente de aprobación |
| LU1b | Contame qué pasó con la casa que más sentís tuya: si seguís ahí, cuándo y por qué te fuiste, qué fue de ella. | O | E | pendiente de aprobación |
| LU2 | Contame una mudanza que te haya marcado: por qué se mudaron, cómo fue el día, qué dejaste atrás. | C:MUDANZA | C | pendiente de aprobación |
| LU3 | Contame de un lugar al que volvías siempre: un club, un bar, una plaza, una iglesia, un campo. Qué hacías ahí y con quién. | O | C | pendiente de aprobación |
| LU4 | Contame el viaje más importante de tu vida: a dónde, con quién, y un día concreto de ese viaje. | O | B | pendiente de aprobación |
| HE1 | Contame el día que tuviste tu propia casa, o el día que entendiste que nunca la ibas a tener: cómo fue, quién te ayudó, la primera noche. | O | C | pendiente de aprobación |
| PA1 | Contame de algo que te apasionó de grande, fuera del trabajo y de la familia: el fútbol, la huerta, la música, los autos, el tejido, la pesca. Cómo empezó y un día entero entregado a eso. | O | E | pendiente de aprobación |
| LU5 | Contame de un auto, una moto o un vehículo que fue importante: cómo lo conseguiste, a dónde te llevó, qué pasó con él. | E:60+ | C | pendiente de aprobación |

Notas: Antes "Casas, mudanzas y lugares". LU2 tiene versión genérica si la ficha no trae lugares (no es sensible).

### Bloque 10 · Amistades y ayudas

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| AS1 | Contame de tu amigo o amiga de toda la vida: cómo se llama, cómo se conocieron, y una vez concreta que muestre cómo es esa amistad. | O | B | pendiente de aprobación |
| AS1b | Contame la última vez que viste a tu amigo o amiga de toda la vida: dónde fue, qué hicieron. | O | E | pendiente de aprobación |
| AY1 | Contame una vez que alguien te ayudó cuando de verdad lo necesitabas, sea quien sea: un desconocido, un vecino, un jefe, un hermano. Quién era, qué hizo ese día, y si le pudiste devolver. | O | B | pendiente de aprobación |
| AS4 | Contame de una amistad que se perdió: quién era, por qué se perdió, si te gustaría recuperarla. | O | C | pendiente de aprobación |
| AS4b | Si hay una amistad que se te perdió, contame qué sabés hoy de esa persona. | O | C | pendiente de aprobación |
| AS5 | Contame de un grupo o una causa de la que fuiste parte de grande: el club, la peña, la cooperadora, el sindicato, la parroquia, una campaña. Quiénes eran y una vez que dieron pelea por algo juntos. | O | C | pendiente de aprobación |
| RE1 | Contame una vez que la fe te sostuvo cuando nada más lo hacía: qué pasaba, dónde estabas, qué hiciste. | C:RELIGIÓN | E | pendiente de aprobación |
| RE2 | Contame de tu comunidad: la parroquia, el templo, el grupo. Quiénes eran, qué hacían juntos, y una vez concreta que recuerdes. | C:RELIGIÓN | C | pendiente de aprobación |

Notas: Antes "Amistades". AY1 reemplaza a AS2; AS3 se sacó. AS1b es el cierre de lector de AS1, pedido como escena ("la última vez que lo viste") en vez de "¿sigue vivo?".

### Bloque 11 · Pérdidas y crisis (bloque sensible)

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| PE1 | Contame cómo fue cuando murió tu mamá, {{madre}}: cuándo fue, cómo te enteraste o dónde estabas, y algo que recuerdes de esos días. | C:MADRE_FALLECIÓ · S | B | pendiente de aprobación |
| PE2 | Contame cómo fue cuando murió tu papá, {{padre}}: cuándo fue, cómo te enteraste o dónde estabas, y algo que recuerdes de esos días. | C:PADRE_FALLECIÓ · S | B | pendiente de aprobación |
| PE3 | Contame de una persona que perdiste y que todavía extrañás: quién era, qué era tuyo, cómo te enteraste, y qué te quedó de ella. | O · S | E | pendiente de aprobación |
| HF1 | Contame de {{hijo_fallecido}}: cómo era, y una escena juntos que quieras que quede en este libro para siempre. | C:HIJO_FALLECIÓ · S | E | pendiente de aprobación |
| HF2 | Contame cómo seguiste después de perder a {{hijo_fallecido}}: quién te acompañó, qué te ayudó a levantarte, y qué hacés hoy para mantener vivo su recuerdo. | C:HIJO_FALLECIÓ · S | E | pendiente de aprobación |
| PE4 | Contame la peor época de tu vida: qué pasó, cuánto duró, y el día o el momento en que empezó a mejorar. | O · S | B | pendiente de aprobación |
| CR1 | Contame una vez que perdiste algo grande de golpe: la casa, el negocio, los ahorros, el trabajo de toda la vida. Qué pasó ese día y qué hiciste al día siguiente. | O · S | E | pendiente de aprobación |
| PE5 | Contame una vez que el cuerpo te dijo basta: un accidente, una enfermedad, un dolor que te obligó a parar. Qué pasó ese día, quién te atendió y qué cambiaste después. | O · S | E | pendiente de aprobación |
| EC1 | Contame cómo cambió tu día a día cuando empezaste a vivir con {{enfermedad}} [esto]: qué dejaste, qué aprendiste a hacer distinto, quién te ayuda. | C:ENFERMEDAD_LARGA · S | E | pendiente de aprobación |
| PE6 | Contame una vez que te equivocaste feo con alguien y cómo lo arreglaste, o por qué no lo arreglaste. | O · S | C | pendiente de aprobación |
| PE8 | Contame una vez que alguien en quien confiabas te falló: qué pasó, cómo te enteraste, y cómo lo atravesaste. No hace falta que digas el nombre si no querés. | O · S | E | pendiente de aprobación |
| ID1 | ¿Hubo una parte de vos que tuviste que esconder durante años? Contá lo que quieras y como quieras: cuándo empezó, quién lo supo, y si hoy es distinto. | O · S | E | pendiente de aprobación |
| HJ7 | Contame algo que empezó muy bien y terminó mal: cómo era al principio, qué pasó en el medio, y cómo lo recordás hoy. | O · S | C | pendiente de aprobación |

Notas: Todo el bloque es sensible: aviso antes de la primera pregunta sensible del bloque (una vez), excluible desde la ficha, acuse sobrio. PE1, PE2, HF1, HF2 y EC1 no tienen versión genérica. PE3 ya no nombra "un hijo" ni dice "aparte de las que ya hablamos". En EC1, "[esto]" es el reemplazo si la ficha confirma la enfermedad pero no le pone nombre.

### Bloque 12 · La historia grande

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| HG1 | De los hechos grandes que le pasaron al país mientras vivías ahí, elegí UNO que te haya tocado de cerca y contame dónde estabas y qué te pasó a vos ese día o esa época. Argentina: la dictadura, Malvinas, la vuelta de la democracia, la hiperinflación, el 2001. España: la posguerra, la muerte de Franco, la Transición, el 23-F, el 92, el 11-M. | O | B | pendiente de aprobación |
| HG2 | ¿Hay otro hecho grande del país que te haya tocado de cerca? Contame igual: dónde estabas, qué te pasó a vos. | O | C | pendiente de aprobación |
| HG4 | Contame un día concreto de la pandemia: dónde estabas, con quién, qué hacías para pasar el tiempo. | O | B | pendiente de aprobación |
| HG5 | ¿Dónde viste la final del Mundial 2022 y con quién? Contame ese día. | C:ARGENTINA · E:6+ en 2022 | B | pendiente de aprobación |
| HG6 | ¿Dónde viste la final del Mundial {{anio_mundial}} y con quién? Contame ese día. | C:ARGENTINA · E:6+ en 1978 o 1986 | C | pendiente de aprobación |
| HG3 | Contame cómo era la vida cotidiana en algo que hoy no existe más: cómo se llamaba por teléfono, cómo se enteraban de las noticias, cómo se pagaba, cómo se viajaba. Elegí una cosa y contame una escena. | E:60+ | C | pendiente de aprobación |
| DE1 | Contame algo que hoy es normal y en tu juventud no se podía, para las mujeres o para la gente como vos: trabajar, salir sola, estudiar, decidir. Una vez que lo viviste en carne propia. | O | C | pendiente de aprobación |

Notas: Pandemia (HG4) y Mundial (HG5) van siempre y salieron del menú de HG1. HG6 = el primer Mundial que ganó Argentina que vivió con 6 años o más ({{anio_mundial}} = 1978 o 1986, según el año de nacimiento); es opcional y está pendiente (ver dudas). El menú de HG1 sale del país (ficha); para otros países, HG1 va sin menú. Este bloque no tiene puerta abierta.

### Bloque 13 · Puntos altos, bajos y giros

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| GI1 | Si tuvieras que elegir el día más feliz de tu vida, uno solo, ¿cuál sería? Contame ese día: dónde estabas, quién estaba, qué pasó. | O | B | pendiente de aprobación |
| GI2 | Contame el día que hiciste algo de lo que ya no había vuelta atrás: firmar, subirte a un tren, decir que sí o que no. Qué hiciste esa mañana, quién lo supo, y cómo era tu vida antes y después. | O | B | pendiente de aprobación |
| GI3 | Contame una decisión difícil que tomaste sol{{o/a}}, sin que nadie te dijera qué hacer: cuál era la disyuntiva y qué elegiste. | O | C | pendiente de aprobación |
| HJ1 | Contame algo que quisiste hacer con tu vida y no hiciste: qué era, el día o la época en que se cerró esa puerta, y qué hiciste con esas ganas. | O | E | pendiente de aprobación |
| HJ2 | Contame una época mala de la que salió algo bueno: qué era lo malo, y el día que te diste cuenta de que te había dejado algo que hoy no cambiarías. | O | E | pendiente de aprobación |
| GI5 | Contame algo de lo que te arrepentís o que harías distinto. Una cosa concreta. | O | C | pendiente de aprobación |
| GI6 | Contame una vez que le diste un buen consejo a alguien o resolviste un problema con cabeza fría. Una vez concreta. | O | C | pendiente de aprobación |
| GI9 | ¿Hubo algún momento en que sentiste algo más grande que vos: en una iglesia, en la naturaleza, en un nacimiento, en una despedida? Contame ese momento. | O | C | pendiente de aprobación |
| GI4 | Contame una vez que fuiste valiente, aunque nadie se haya enterado. | O | C | pendiente de aprobación |
| GI7 | Contame una vez que te reíste hasta llorar. Qué pasó y con quién. | O | C | pendiente de aprobación |
| GI8 | Contame el golpe de suerte más grande que tuviste: qué pasó y qué habría sido de tu vida sin eso. | O | C | pendiente de aprobación |
| HJ5 | Contame la vez que volviste, después de muchos años, al lugar donde creciste: qué encontraste igual, qué ya no estaba, a quién viste. | E:45+ | C | pendiente de aprobación |
| HJ6 | Contame un día que empezó como cualquier otro y terminó cambiándote algo: qué estabas haciendo, qué pasó, qué fue distinto desde entonces. | O | C | pendiente de aprobación |
| HJ8 | De todos los papeles que hiciste en la vida (hijo, hermana, madre, amigo, compañero, jefe, vecina), ¿cuál te salió mejor? Contame una vez concreta en que lo hiciste bien. | O | C | pendiente de aprobación |
| HJ9 | Contame algo que deseaste mucho y, cuando lo tuviste, no era lo que esperabas: qué era, el día que lo tuviste, qué entendiste. | O | C | pendiente de aprobación |

Notas: GI2 es la reescrita del informe 3 ("el día sin vuelta atrás"). Este bloque no tiene puerta abierta.

### Bloque 14 · Hoy

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| HO1 | Contame un día común tuyo de ahora, de que te levantás hasta que te acostás: qué hacés, a quién ves, qué comés. | O | B | pendiente de aprobación |
| PA2 | ¿Qué hacés hoy cuando nadie te pide nada? Contame la última vez que lo hiciste: dónde, cuánto rato, qué sentís mientras lo hacés. | O | B | pendiente de aprobación |
| HO2 | Contame qué te hace reír hoy, con un ejemplo concreto: la última vez que te reíste así. | O | C | pendiente de aprobación |
| HO2.2 | Contame qué te hace enojar hoy, con un ejemplo concreto: la última vez que te pasó. | O | C | pendiente de aprobación |
| HO4 | Contame de un objeto que tenés hoy en tu casa y que no regalarías nunca: qué es, de dónde vino, qué historia tiene. | O | C | pendiente de aprobación |
| HO5 | Contame qué es lo que más te gusta de la vida que tenés ahora y qué es lo que más te cuesta. | O | C | pendiente de aprobación |
| HO6 | Contame una costumbre tuya que todos en la familia conocen: una frase, una comida, una manía. Cómo empezó. | O | C | pendiente de aprobación |
| CO1 | Contame un plato que sea tuyo: cómo se hace, quién te lo enseñó, y una vez que lo cocinaste para alguien. | O | E | pendiente de aprobación |

Notas: PA2 reemplaza a HO3. HO2 se partió en dos (reír / enojar). HO5 queda entera: es opinión del presente, no historia (ver dudas).

### Bloque 15 · Legado y cierre

| ID | Pregunta | Tipo | Tamaño | Estado |
|---|---|---|---|---|
| LE1 | Mirando toda tu vida, ¿de qué estás más orgullos{{o/a}}? Puede ser algo grande o algo chico. | O | B | pendiente de aprobación |
| LE2 | ¿Qué aprendiste de la vida que te gustaría que {{destinatarios}} [tu familia] sepan? Decilo como se lo dirías a ellos. | O | B | pendiente de aprobación |
| LE3 | ¿Hay algo que querés decirle a alguien de la familia y que nunca dijiste, o que querés volver a decir? Decilo ahora, con nombre. | O | B | pendiente de aprobación |
| LE4 | Pensá en {{hijos}} y en {{nietos}}. ¿Qué deseás para cada uno? Nombralos uno por uno. (Sin nietos se borra "y en {{nietos}}".) | C:HIJOS | E | pendiente de aprobación |
| LE5 | ¿Qué deseás para las personas más importantes de tu vida? Nombralas una por una. | C:¬HIJOS | E | pendiente de aprobación |
| LE6 | ¿Cómo te gustaría que te recuerden? Una frase, una imagen, una escena. (Menos de 45 años: "¿Cómo te gustaría que te recuerden dentro de muchos años?") | O | B | pendiente de aprobación |
| LE7 | Si tu vida fuera un libro, ¿qué título le pondrías? Y si tuviera capítulos, ¿cuáles serían? | O | E | pendiente de aprobación |
| LE8 | Este libro es para {{destinatarios}} [tu familia]. Decile algo directamente a cada uno, como si lo tuvieras enfrente. Tomate el tiempo que quieras. | O | E | pendiente de aprobación |
| DES1 | Cuando llegue el día en que no estés, ¿cómo te gustaría que te despidan? Decilo con tus palabras. | E:60+ · S | C | pendiente de aprobación |

Notas: Único bloque donde se aceptan opiniones y no escenas: son la carta final del libro. LE9 ("Última: ¿hay algo que no te pregunté...") es la puerta abierta de este bloque y está en la tabla de cierres.

## Cierres de bloque: puerta abierta y válvula "más"

Al terminar cada bloque van dos turnos: la puerta abierta (algo que no se preguntó) y la válvula "más" (el narrador elige qué ampliar; no lo elige un modelo). Los bloques 12 y 13 no tienen puerta ni válvula. El 15 cierra con LE9 y sin válvula.

Texto de la válvula (informe 2), igual en todos los bloques que la llevan:

> De lo que contaste de esta época, ¿hay algo que quieras contar más largo? Elegí vos y contalo.

| ID | Bloque | Puerta abierta | Válvula | Tamaño | Estado |
|---|---|---|---|---|---|
| OR7 | 1 | ¿Hay algo de tus orígenes o de tu familia de antes de que nacieras que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| CA18 | 2 | ¿Hay algo de tu casa o de tu familia de chic{{o/a}} que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| ES12 | 3 | ¿Hay algo de la escuela, los amigos o los juegos de chic{{o/a}} que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| AD13 | 4 | ¿Hay algo de tu adolescencia que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| JU14 | 5 | ¿Hay algo de tu juventud (estudios, servicio militar, mudanzas, la vida por tu cuenta) que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| AM16 | 6 | ¿Hay algo del amor o de tus parejas que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| TR10 | 7 | ¿Hay algo de tu vida de trabajo que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| HI11 | 8 | ¿Hay algo de tus hijos o nietos (o de los chicos importantes de tu vida) que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| LU6 | 9 | ¿Hay algún lugar, alguna casa o alguna pasión de tu vida que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| AS6 | 10 | ¿Hay algún amigo, amiga o alguien que te ayudó, que no te pregunté y querés que esté en el libro? | sí | E | pendiente de aprobación |
| PE7 | 11 | ¿Hay algún momento difícil que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| HO7 | 14 | ¿Hay algo de tu vida de hoy que no te pregunté y querés contar? | sí | E | pendiente de aprobación |
| LE9 | 15 | Última: ¿hay algo que no te pregunté en todo este tiempo y que tenés ganas de que esté en el libro? | no | E | pendiente de aprobación |

Notas: LU6 y AS6 suman "pasión" y "ayuda" por el cambio de nombre de sus bloques. Puertas y válvulas van en Estándar y Completo (informe 2, C.5). **Breve queda sin puertas ni válvula: a decidir** (ver dudas en `diseno-v3.md`).

## Preguntas de datos (gates)

Se mandan al abrir el bloque, **solo si la ficha no trae el dato**. Son datos, no historias: acá sí se pueden pedir varias cosas juntas. Si el narrador contesta por audio en vez de tocar el botón, vale la primera palabra ("sí", "no", "ninguno", "nunca"). Si igual no se resuelve: versión genérica en las no sensibles; las sensibles no se mandan. WhatsApp deja hasta 3 botones por mensaje.

| ID | Cuándo | Pregunta | Botones o respuesta | Qué resuelve | Estado |
|---|---|---|---|---|---|
| D1 | Abre bloque 1 | ¿Cómo se llaman (o se llamaban) tu mamá y tu papá? Decime los dos nombres. | Audio | `{{madre}}`, `{{padre}}` | pendiente de aprobación |
| D1.1 | Abre bloque 1 | ¿Vive tu mamá? | [Sí] [No] | MADRE_FALLECIÓ (PE1) | pendiente de aprobación |
| D1.2 | Abre bloque 1 | ¿Vive tu papá? | [Sí] [No] | PADRE_FALLECIÓ (PE2) | pendiente de aprobación |
| D2 | Abre bloque 2 | ¿Tuviste hermanos? | [Sí] [No] → si Sí: "Decime sus nombres, del mayor al menor." (audio) | HERMANOS, `{{hermanos}}`, CA8 | pendiente de aprobación |
| D3 | Abre bloque 3 | ¿La religión fue parte de tu vida? | [Sí] [No] | RELIGIÓN (ES9, RE1, RE2) | pendiente de aprobación |
| D4 | Abre bloque 5 | ¿Estudiaste algo después del colegio? | [Sí] [No] → si Sí: "¿Qué estudiaste y dónde?" (audio) → "¿Lo terminaste?" [Lo terminé] [Lo dejé] [Sigo] | ESTUDIOS, ESTUDIOS_TERMINADOS (PR1), ESTUDIOS_SIN_TERMINAR (JU2b) | pendiente de aprobación |
| D5 | Abre bloque 5 | ¿Hiciste el servicio militar? | [Sí] [No] → si Sí: "Decime dónde lo hiciste y cuánto tiempo estuviste." (audio) | MILITAR; reemplaza el viejo seguimiento de JU5 | pendiente de aprobación |
| D6 | Abre bloque 5 | ¿Viviste en otra provincia, región o país distinto del lugar donde creciste? | [Sí] [No] → si Sí: "Decime de dónde a dónde te fuiste y cuántos años tenías." (audio) | MIGRACIÓN, `{{lugar_origen}}`, `{{lugar_destino}}` | pendiente de aprobación |
| D7 | Abre bloque 6 | ¿Tuviste pareja en tu vida: marido, mujer, compañero o compañera? | [Sí] [No] → si Sí: "Decime su nombre. Si hubo más de una pareja importante, decime los nombres en orden." (audio) | PAREJA, ¬PAREJA, SEGUNDA_PAREJA, `{{pareja_1}}`, `{{pareja_2}}` | pendiente de aprobación |
| D7.1 | Después de D7, por cada pareja | ¿Siguen juntos con {{pareja_n}}? | [Sí] [No] → si No: "¿Se separaron o falleció?" [Separación] [Falleció] | PAREJA_ACTUAL, PAREJA_TERMINÓ, PAREJA_FALLECIÓ | pendiente de aprobación |
| D8 | Abre bloque 7 | ¿Trabajaste fuera de tu casa, en tu casa, o las dos cosas? | [Trabajé afuera] [En mi casa] [Las dos] → si afuera o las dos: "¿A qué te dedicás o te dedicaste? Si tuviste varios trabajos, decime los principales, empezando por el que más años hiciste." (audio) | OFICIO_AFUERA (TR2–TR6, OB1, OB2), `{{trabajo_principal}}` | pendiente de aprobación |
| D9 | Abre bloque 7 (45+) | ¿Ya dejaste de trabajar? | [Sí] [No] | JUBILADO (TR9) | pendiente de aprobación |
| D10 | Abre bloque 7 | ¿Viviste o trabajaste en el campo? | [Sí] [No] | CAMPO (CP1–CP3) | pendiente de aprobación |
| D11 | Abre bloque 8 | ¿Tuviste hijos? | [Sí] [No] → si Sí: "Decime sus nombres, del mayor al menor, si es hijo o hija, y el año en que nació cada uno." (audio) | HIJOS, ¬HIJOS, `{{hijos}}`, `{{hijo_n}}` | pendiente de aprobación |
| D12 | Abre bloque 8 | ¿Tenés nietos? | [Sí] [No] → si Sí: "Decime sus nombres." (audio) | NIETOS, `{{nietos}}` | pendiente de aprobación |
| D13 | Abre bloque 8, si D12 = Sí | ¿Criaste o tuviste a tu cargo a alguno de tus nietos? | [Sí] [No] → si Sí: "Decime su nombre." (audio) | NIETOS_A_CARGO, `{{nieto_a_cargo}}` | pendiente de aprobación |

**Solo por ficha, sin botón** (preguntarlo por botón sería una intromisión): HIJO_FALLECIÓ, PERSONA_IMPORTANTE, ENFERMEDAD_LARGA, temas que no tocar. Sin ese dato, esas preguntas no se mandan.

**Sin pregunta de datos:** APODO y ARGENTINA/edad (salen de campos obligatorios de la ficha); MUDANZA (si la ficha no trae lugares, LU2 va en genérico).

Los nombres que llegan por audio en D1, D2, D6, D7, D11, D12 y D13 quedan "sin confirmar" hasta que el narrador revise los nombres al final. Hasta entonces entran en las preguntas como los escribió la transcripción.

## Pedidos de fotos

Reglas (informe 1, C.3): **un pedido por turno, una sola foto por pedido, epígrafe por audio.** Cada pedido va en su propio turno al cerrar el bloque y está atado a un tema ya preguntado. Si el narrador manda dos fotos, se queda la primera. Cada pedido termina con:

> Mandá una sola foto y después contame en un audio quiénes están, dónde es y de qué año más o menos.

| ID | Al cerrar | Pedido | Epígrafe que se pide | Condición | Estado |
|---|---|---|---|---|---|
| F1 | Bloque 1 | Una foto de tus abuelos o de tus padres de jóvenes, la más vieja que tengas. | Quiénes son, dónde, año aproximado | — | pendiente de aprobación |
| F2 | Bloque 2 | Una foto tuya de chic{{o/a}}, la que más te guste. | Cuántos años tenías, dónde, quién la sacó si sabés | — | pendiente de aprobación |
| F3 | Bloque 2 | Una foto de la casa o del barrio de tu infancia, si existe. | Qué se ve | — | pendiente de aprobación |
| F4 | Bloque 3 | Una foto de la escuela o con compañeros de la primaria. | Quiénes son, qué grado | — | pendiente de aprobación |
| F5 | Bloque 4 | Una foto tuya de adolescente con amigos. | Quiénes son, dónde, año aproximado | — | pendiente de aprobación |
| F6 | Bloque 5 | Una foto de esa época: del estudio, del servicio militar o del viaje. | Qué se ve, año | El sistema elige una según el gate activo; nunca se ofrecen las tres | pendiente de aprobación |
| F7 | Bloque 6 | Una foto con {{pareja_1}}, la que más te guste. | Dónde, año, qué estaba pasando | C:PAREJA | pendiente de aprobación |
| F8 | Bloque 6 | Una foto del día que se casaron o se fueron a vivir juntos, si hay. | Quiénes están | C:PAREJA | pendiente de aprobación |
| F9 | Bloque 7 | Una foto tuya trabajando o con compañeros de trabajo. | Quiénes son, dónde, año | — | pendiente de aprobación |
| F10 | Bloque 8 | Una foto con {{hijos}} de chicos. | Quién es quién, dónde, año | C:HIJOS | pendiente de aprobación |
| F11 | Bloque 8 | Una foto con {{nietos}}. | Quién es quién | C:NIETOS | pendiente de aprobación |
| F12 | Bloque 9 | Una foto del viaje más importante de tu vida. Si no hay, de la casa que sentís más tuya. | Qué se ve, año | Una sola: la del viaje si LU4 no fue "paso" | pendiente de aprobación |
| F13 | Bloque 14 | Una foto tuya de ahora, la que quieras para la contratapa. | Ninguno: el escritor pone la fecha | — | pendiente de aprobación |
| F14 | Bloque 14 | Una foto del objeto que no regalarías nunca. | Qué es | Solo si se mandó HO4 y no fue "paso" (HO4 es de Completo) | pendiente de aprobación |

Notas: F8 decía "del casamiento"; ahora no presume casamiento. F10 usa `{{hijos}}` y sirve para uno o varios. Con 8–10 fotos recibidas el libro se arma bien (informe 1). Cuántos pedidos van en cada tamaño: **a decidir**.

## Mensajes fijos

Ninguno lleva contenido de lo que el narrador contó. Donde los informes traen texto, se usa; si no, queda "a redactar".

| ID | Cuándo | Texto | De dónde sale | Estado |
|---|---|---|---|---|
| M1 | Al final de toda pregunta de historia | Si esto no te pasó o preferís no contarlo, decí *paso* y seguimos con otra. | Informe 1, C.1 | pendiente de aprobación |
| M2 | Primer mensaje: se presenta el biógrafo | A redactar. Ejemplo de Fable: "Soy Clara, tu biógrafa". Nombre y voz: a decidir. | Informe 2, C.6 | a redactar |
| M3 | Acuse cálido después de cada respuesta (rotan 8–10) | Uno de ejemplo: "Gracias, {{nombre}}. Quedó guardado. Esto va a quedar lindo en el libro." Los otros 7–9: a redactar. | Informe 2, C.6 | a redactar |
| M4 | Acuse sobrio después de una sensible y en el bloque 15 | A redactar. Regla: nunca "qué linda historia" ni nada que suene a festejo. | Informe 2, C.6 | a redactar |
| M5 | Aviso de sensibles: mismo turno, justo antes de la primera sensible del bloque | Las próximas preguntas son sobre momentos difíciles. Podés decir *paso* en cualquiera. | Informe 1, bloque 11 (cambia el momento: ya no "el día anterior") | pendiente de aprobación |
| M6 | Explicar la pausa (en la presentación) | Decí *pausa* y paramos hasta que digas *seguimos*. | Informe 2, C.3 | pendiente de aprobación |
| M7 | Respuesta cuando dice "pausa" y cuando dice "seguimos" | A redactar. | — | a redactar |
| M8 | Recordatorio suave al narrador si pasan días sin respuesta | A redactar. Cuántos días: a decidir (Fable proponía 48 h). | Informe 2, C.3 | a redactar |
| M9 | Recordatorio a la familia si el narrador no responde | A redactar. Fable proponía uno a los 7 días con el consejo "llamalo". | Informe 2, C.3 | a redactar |
| M10 | Conteo al cerrar un bloque | En esta etapa contaste {{n_historias}} historias y nombraste a {{n_personas}} personas. Ya están guardadas. | Informe 2, C.6 | pendiente de aprobación |
| M11 | Hito al cerrar un bloque | Terminó {{etapa}}: {{n}} de {{total}} etapas. | Informe 2, C.3 | pendiente de aprobación |
| M12 | Avance y progreso dotado (desde el primer mensaje) | Tu libro ya tiene {{n}} páginas. | Informe 2, C.3 | pendiente de aprobación |
| M13 | Elegir el tema del siguiente turno | ¿Seguimos con {{tema_a}} o pasamos a {{tema_b}}? [botón] [botón] | Informe 2, C.3 (sin "hoy") | pendiente de aprobación |
| M14 | Reacción de la familia | {{quien}} escuchó lo que contaste y te manda esto. | Informe 2, C.6 (se sacó "lo de ayer") | pendiente de aprobación |
| M15 | Pregunta que manda la familia | Esta te la manda {{quien}}. | Informe 2, C.6 | pendiente de aprobación |
| M16 | Pie de cada pedido de foto | Mandá una sola foto y después contame en un audio quiénes están, dónde es y de qué año más o menos. | Informe 1, C.3 | pendiente de aprobación |
| M17 | Si manda dos fotos | Me quedé con la primera. Si querés mandar otra, esperá al próximo pedido. | Informe 1, C.3 | pendiente de aprobación |
| M18 | Fin de la entrevista: aviso de que sigue la revisión de nombres | A redactar. | — | a redactar |
| M19 | Mail a quien regala pidiendo datos que faltan | A redactar (cómo le llega: tema abierto). | — | a redactar |
| M20 | Botón [Siguiente] cuando manda varios audios (propuesta P1, aprobada) | A redactar. | Propuesta de Claude | a redactar |

`{{quien}}` = nombre y relación, de la ficha o del dashboard ("tu nieta Juli", "tu hijo Pablo").

## Resumen de conteos

Contado sobre las tablas de arriba (solo preguntas de historia; puertas, válvulas, datos y fotos van aparte).

- **Filas B / E / C:** cuántas filas tienen esa marca.
- **Breve / Estándar / Completo:** cuántas filas entran en ese tamaño (B; B+E; B+E+C), sin mirar los gates.
- **Vida típica:** lo que le llega a una persona de 60+ en Argentina, con hermanos, una pareja actual, dos hijos, nietos, padres fallecidos, que trabajó afuera y se jubiló, sin estudios después del colegio, sin servicio militar, sin migración, sin campo, sin religión y con apodo. Cuenta HI2 y HI3 dos veces (dos hijos).

| Bloque | Filas B | Filas E | Filas C | Breve | Estándar | Completo | Breve típica | Estándar típica | Completo típica | Puerta | Válvula |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 Origen y raíces | 3 | 0 | 4 | 3 | 3 | 7 | 3 | 3 | 7 | 1 | 1 |
| 2 La casa y la familia de la infancia | 6 | 1 | 11 | 6 | 7 | 18 | 6 | 6 | 17 | 1 | 1 |
| 3 La escuela y los juegos | 3 | 0 | 9 | 3 | 3 | 12 | 3 | 3 | 11 | 1 | 1 |
| 4 Adolescencia | 4 | 2 | 9 | 4 | 6 | 15 | 4 | 6 | 15 | 1 | 1 |
| 5 Juventud: estudios, servicio militar, migración, irse de casa | 3 | 3 | 15 | 3 | 6 | 21 | 1 | 1 | 5 | 1 | 1 |
| 6 Amor y pareja | 5 | 13 | 2 | 5 | 18 | 20 | 3 | 10 | 12 | 1 | 1 |
| 7 Trabajo y oficio | 6 | 7 | 10 | 6 | 13 | 23 | 6 | 10 | 19 | 1 | 1 |
| 8 Hijos y nietos | 4 | 9 | 0 | 4 | 13 | 13 | 5 | 11 | 11 | 1 | 1 |
| 9 Lugares y pasiones | 2 | 2 | 4 | 2 | 4 | 8 | 2 | 4 | 8 | 1 | 1 |
| 10 Amistades y ayudas | 2 | 2 | 4 | 2 | 4 | 8 | 2 | 3 | 6 | 1 | 1 |
| 11 Pérdidas y crisis (bloque sensible) | 3 | 8 | 2 | 3 | 11 | 13 | 3 | 8 | 10 | 1 | 1 |
| 12 La historia grande | 3 | 0 | 4 | 3 | 3 | 7 | 3 | 3 | 7 | — | — |
| 13 Puntos altos, bajos y giros | 2 | 2 | 11 | 2 | 4 | 15 | 2 | 4 | 15 | — | — |
| 14 Hoy | 2 | 1 | 5 | 2 | 3 | 8 | 2 | 3 | 8 | 1 | 1 |
| 15 Legado y cierre | 4 | 4 | 1 | 4 | 8 | 9 | 4 | 7 | 8 | 1 | — |
| **Total** | 52 | 54 | 91 | **52** | **106** | **197** | **49** | **82** | **159** | 13 | 12 |

**Total de filas de historia en el banco: 197.**

### Lo que le llega a la vida típica

| | Breve | Estándar | Completo |
|---|---|---|---|
| Preguntas de historia | 49 | 82 | 159 |
| Puertas abiertas | a decidir (hoy 0) | 13 | 13 |
| Válvulas "más" | a decidir (hoy 0) | 12 | 12 |
| **Historia + puertas** | **49** | **95** | **172** |
| **Historia + puertas + válvulas** | **49** | **107** | **184** |
| Preguntas de datos | 0 si la ficha está llena; si viene vacía, hasta 16 con botón más los pedidos de nombres por audio | igual | igual |
| Pedidos de foto | a decidir | hasta 14 | hasta 14 |

Lectura: con puertas, el Estándar da **95**, igual que los ~95 del informe 3. El Breve da **49–52** (52 filas B; la vida típica no recibe JU8, JU9, AM9 ni AM11 y suma un HI2 por el segundo hijo). El Completo da **172**, más que los ~145 del informe 3: la diferencia son los 17 cierres `b`, las 4 preguntas partidas y el Mundial viejo, que el informe 3 no contaba.

## Qué cambió respecto de los informes

- **Sacadas:** AS2 (la reemplaza AY1), AS3, HO3 (la reemplaza PA2), TR7 (la reemplaza CR1).
- **Reescritas con el texto del informe 3:** TR1, JU8, JU9, JU10, JU11, AM13, AM15, HI10, AS5, PE3, PE5, GI2.
- **Nuevas del informe 3:** CS1–CS3, DE1, MA1, OB1, OB2, PR1, CP1–CP3, MI1, RE1, RE2, PI1, PI2, ID1, HF1, HF2, NC1, NC2, EC1, CR1, CO1, HE1, DES1, HJ1, HJ2, HJ5–HJ9, OF1–OF4, PA1, PA2, AY1, PE8.
- **Nuevas por decisión de Naza (con redacción del informe 2):** HG4 pandemia, HG5 Mundial 2022. HG6 (primer Mundial ganado, 1978 o 1986) queda pendiente.
- **Cierres de lector que antes eran seguimiento (17):** CA9b, ES5b, AD2b, AD6b, AD10b, JU2b, JU3b, JU6b, JU10b, JU12b, AM9b, AM14b, TR1b, TR3b, LU1b, AS1b, AS4b. Redacción de este documento a partir del seguimiento del informe 1.
- **Partidas en dos:** OR6 (nombre / apodo), JU7 (lo más duro / lo más lindo), MI1 (afuera / adentro), HO2 (reír / enojar), JU10 (la ayuda / qué fue de esa persona). AM13 quedó solo con la escena.
- **Frases de contenido previo sacadas:** AM14 ("del que no hablamos"), PE3 ("aparte de las que ya hablamos"; ya venía sacada en la reescritura del informe 3).
- **Retoques menores de este documento:** "madre/padre" → "mamá/papá" con el nombre en aposición; ES9 pregunta la escena y no "¿había religión?"; AM1 sin "al verla o verlo"; HI3, HI4 y HF1 sin pronombres de género del hijo; LE4 con plural simple; "casamiento" → "se casaron o se fueron a vivir juntos" (AM3, AM4, AM5, F8); LU6 y AS6 suman pasión y ayuda. Todo pendiente de aprobación.
- **Gates nuevos que no estaban en ningún informe:** OFICIO_AFUERA también para TR6, OB1 y OB2; ESTUDIOS_TERMINADOS para PR1; ESTUDIOS_SIN_TERMINAR para JU2b; APODO para OR6.2; ARGENTINA para el Mundial.
