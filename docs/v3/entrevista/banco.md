# Banco de la entrevista

**Qué es:** el banco de preguntas y mensajes de la entrevista V3, limpio y en el orden en que se mandan. Es la **fuente de verdad** para el código (`fabrica/src/v3/entrevista/`): el json se genera desde acá.

**Fecha:** 30/09/2026. **Estado:** aprobado por Naza pregunta por pregunta en [`metodo-entrevista.md`](../metodo-entrevista.md). Los textos están copiados tal cual de [`banco-final-borrador.md`](../banco-final-borrador.md) (la última versión de cada pregunta); acá solo cambian los IDs provisorios (ver "Equivalencias de IDs" al final) y la variante de tiempo de AM7, escrita con la notación de abajo.

## Notación

- **Orden:** el de las tablas es el orden de envío (bloque 1 a 15, fila por fila).
- **Depende de:**
  - vacío = le llega a todos;
  - `si:X` = solo si X se mandó y se contestó con un "sí": tocó un botón de "Sí", contó algo, dijo "ya te lo conté" o no se acordó (un olvido cuenta como "sí": mejor una pregunta de más que un capítulo de menos). No se cumple si X fue un "no" corto, un botón de "No", un "paso" o un botón [Prefiero no contarla] (Naza, 30/09, simulaciones; el botón se llamaba [Paso esta] hasta la prueba de Naza en la página);
  - `sino:X` = solo si la respuesta a X fue un "no" corto o un botón de "No";
  - `paso:X` = solo si X se contestó con "paso" o con el botón [Prefiero no contarla] (hoy sin uso: la usaba AM16, que salió del banco después de la prueba de Naza en la página; Naza, 30/09, ronda 2);
  - varias condiciones separadas por ` o ` = alcanza con que se cumpla una;
  - condiciones unidas por ` y ` (dentro de un ` o `) = tienen que cumplirse todas (AM19: `sino:AMH y si:AM3`, solo si esa persona ya no está y habían armado la vida juntos; Naza, 30/09, ronda 2 y prueba en la página).
  - Una pregunta solo puede depender de otra que se manda **antes**.
- **"No" corto:** hasta 15 palabras y empieza con no / nunca / jamás / ninguno / nada / tampoco (sin importar mayúsculas, tildes ni signos); en los 14 cierres, en LE9, en las sensibles y en las 8 que abren tema (CA6, JU8, AM0, AMH, AM3, AM21, HI0, HI8) el tope es **40 palabras**. "Pero" o "aunque" en las primeras 5 palabras lo dan vuelta (salvo en los cierres). "Paso", un olvido y "ya te lo conté" no son un "no". Las reglas completas, en "Reglas del flujo" (Naza, 30/09, simulaciones; antes: menos de 15 palabras en todas).
- **Botones:** los de la sección "Botones" (antes de "Reglas del flujo"): una fila por botón, con lo que vale tocarlo (`sí`, `no` o `paso`). Si tocó un botón, manda el botón.
- **Parte:** `núcleo` (lo que se manda a todos) o `extra` (la ronda extra, si la persona la acepta).
- **Clase:** `historia` (pregunta de historia), `cierre` (pregunta de cierre de bloque), `aviso` (mensaje que no espera respuesta), `foto` (la única pregunta de fotos), `final` (el mensaje final).
- **Sensible:** `sí` = después de la respuesta va un acuse sobrio (M4) en vez de M3.
- **Saltos de línea:** `<br>` dentro de una celda es un salto de línea en el mensaje (`<br><br>` = párrafo nuevo).
- **Marcas dentro del texto** (FIN usa la variante con FO1: sin la frase de la foto si contestó [No tengo foto]): `{{o/a}}` y `{{padre/madre}}` según el género (o la forma de trato); `{{nombre}}`; `{{etapa}}`; `{{quien_regala}}`. **Variante según una respuesta:** `«sino:X: a ‖ b»` = si la respuesta a X fue un "no" corto va *a*; si no (o si X no se contestó), va *b*.

## Arranque

| ID | Cuándo | Texto |
|---|---|---|
| BIEN | Primer mensaje (bienvenida y cómo va, en un solo mensaje; `<br>` = salto de línea) | Hola, {{nombre}}, ¿cómo estás? Una persona que te quiere mucho te regaló un libro con la historia de tu vida, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.<br><br>Funciona así: te mando una pregunta y vos me la contás en audio, como si me lo estuvieras contando en persona. Mandame todos los audios que quieras. Cuando termines no hace falta que me avises: si pasan unos minutos sin audios nuevos, te mando la pregunta que sigue.<br><br>Si alguna pregunta no tiene que ver con tu vida, me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro: esto lo hacemos al ritmo que vos quieras. |
| M6 | **Sin uso desde el 30/09** (Naza): su contenido va dentro de BIEN. Antes: después de la bienvenida | Ahora te explico cómo va la entrevista, {{nombre}}. Te mando una pregunta y vos me la contás en audio. Si te salen dos o tres audios, mejor. Cuando quedás en silencio un ratito, entiendo que terminaste y te mando la próxima. No hay apuro: vamos al paso que vos vayas marcando. |

## Mensajes fijos

| ID | Cuándo | Texto |
|---|---|---|
| M1 | Al final de la pregunta, en línea aparte y en cursiva: solo en las 3 primeras de la entrevista, en CA6, JU8, AM0, AM9, HI0 y HI8 y en las del bloque 11 | _Si no va con vos, decí paso y vamos a otra._ |
| M3.1 | Acuses, rotan. Van como primera línea del mensaje que sigue (Naza, 30/09) | Gracias, {{nombre}}. Ya lo guardé. |
| M3.2 | Acuses, rotan. Van como primera línea del mensaje que sigue (Naza, 30/09) | Te escuché. Vamos con la que sigue. |
| M3.3 | Acuses, rotan. Van como primera línea del mensaje que sigue (Naza, 30/09) | Lo anoté, gracias. Sigo con otra. |
| M3.4 | Acuses, rotan. Van como primera línea del mensaje que sigue (Naza, 30/09) | Gracias por contármelo. Seguimos. |
| M3.5 | Acuses, rotan. Van como primera línea del mensaje que sigue (Naza, 30/09) | Guardado, {{nombre}}. Te mando la próxima. |
| M3.6 | Acuses, rotan. Van como primera línea del mensaje que sigue (Naza, 30/09) | Lo tengo, gracias. Vamos con otra. |
| M3.7 | Acuses, rotan. Van como primera línea del mensaje que sigue (Naza, 30/09) | Quedó guardado, {{nombre}}. Sigo con la que viene. |
| M3.8 | Acuses, rotan. Van como primera línea del mensaje que sigue (Naza, 30/09) | Te escuché bien. Vamos por la siguiente. |
| M4.1 | Acuses sobrios, después de algo difícil (AM9, CA17, AD15, JU17, TR11 y todo el bloque 11), si contó algo (con un "no" corto va M25; con "paso", M27; con un olvido, M28.1). Van solos, en mensaje aparte | Gracias por contarme esto, {{nombre}}. Queda guardado con cuidado. |
| M4.2 | Acuses sobrios, después de algo difícil (AM9, CA17, AD15, JU17, TR11 y todo el bloque 11), si contó algo (con un "no" corto va M25; con "paso", M27; con un olvido, M28.1). Van solos, en mensaje aparte | Te escuché. Gracias por confiármelo. |
| M4.3 | Acuses sobrios, después de algo difícil (AM9, CA17, AD15, JU17, TR11 y todo el bloque 11), si contó algo (con un "no" corto va M25; con "paso", M27; con un olvido, M28.1). Van solos, en mensaje aparte | Lo guardo tal como lo contaste. Gracias. |
| M4.4 | Acuses sobrios, después de algo difícil (AM9, CA17, AD15, JU17, TR11 y todo el bloque 11), si contó algo (con un "no" corto va M25; con "paso", M27; con un olvido, M28.1). Van solos, en mensaje aparte | Gracias por animarte a contarlo. Lo guardo con cuidado. |
| M8 | Recordatorio a la persona, a los pocos días sin respuesta | Hola, {{nombre}}. Pasaron unos días y quería saber cómo andás. Tu historia está acá, guardada tal como la dejaste. Cuando tengas un rato me contestás la que quedó pendiente. Sin apuro. |
| M9 | Aviso a la familia, una semana sin audios | Hola, {{quien_regala}}. Te aviso que {{nombre}} hace una semana que no manda audios. Puede ser cualquier cosa: que ande con otras cosas, que no mire mucho el celular o que le cueste un poco arrancar de nuevo. Si podés, pegale un llamado o hacele una visita y preguntale cómo viene con el libro; muchas veces con una charla con alguien de la familia se vuelve a enganchar. Lo que ya contó está guardado. Si hay algo que tenga que saber, me avisás. |
| M10 | **Sin uso desde el 30/09** (Naza): la frase de entrada del bloque siguiente hace de pasaje. Antes: fin de etapa (bloques 2 a 5), después del cierre | Terminamos esta etapa, {{nombre}}. Pasamos a la siguiente. |
| M15 | Pregunta de la familia (todas juntas, después de LE7 y antes de FO1) | Esta pregunta te la hace tu familia. |
| M21 | Después de "paso" en una pregunta común (en una sensible va M27; en un cierre, M25). Va como primera línea del mensaje que sigue | Dale, la salteamos. Vamos con otra. |
| M22 | Si manda texto | Lo leí, gracias. Si podés, contámelo también en audio: así queda tu voz y tu manera de decirlo, que es lo que va al libro. Y si te resulta más cómodo escribir, escribí nomás. |
| M23 | Audio cortado | Se me cortó el audio o no llegó bien, {{nombre}}. ¿Me lo mandás de nuevo cuando puedas? Sin apuro. |
| M24.1 | Después del cierre de cualquier bloque (1 a 14), rotan. Van como primera línea del mensaje que sigue (la frase de entrada) | Gracias, {{nombre}}. Eso también va al libro. |
| M24.2 | Después del cierre de cualquier bloque (1 a 14), rotan. Van como primera línea del mensaje que sigue (la frase de entrada) | Anotado, gracias. Quedó guardado junto con el resto. |
| M24.3 | Después del cierre de cualquier bloque (1 a 14), rotan. Van como primera línea del mensaje que sigue (la frase de entrada) | Bien, {{nombre}}. Lo sumo a lo que ya me contaste de eso. |
| M24.4 | Después del cierre de cualquier bloque (1 a 14), rotan. Van como primera línea del mensaje que sigue (la frase de entrada) | Gracias por eso. Cada detalle que agregás suma. |
| M25.1 | Después de un "no" corto o de un botón de "No" en cualquier pregunta, de un "paso" en un cierre y de un "ya te lo conté" corto (Naza, 30/09, simulaciones); rotan. Primera línea del mensaje que sigue; si ese mensaje arranca con "Seguimos" o "Pasamos", va M25.3 | Bien, seguimos. |
| M25.2 | Después de un "no" corto o de un botón de "No" en cualquier pregunta, de un "paso" en un cierre y de un "ya te lo conté" corto (Naza, 30/09, simulaciones); rotan. Primera línea del mensaje que sigue; si ese mensaje arranca con "Seguimos" o "Pasamos", va M25.3 | Bien, seguimos. |
| M25.3 | Después de un "no" corto o de un botón de "No" en cualquier pregunta, de un "paso" en un cierre y de un "ya te lo conté" corto (Naza, 30/09, simulaciones); rotan. Primera línea del mensaje que sigue; si ese mensaje arranca con "Seguimos" o "Pasamos", va M25.3 | Bien, entonces. |
| M26 | En lugar del acuse común (M3) cuando lo que sigue es un cierre de bloque, LE9, AM21 o una sensible (CA17, AD15, JU17, TR11, AM9, PE1, PE5, PE4): no anuncia "otra pregunta" antes de "Hasta acá lo de…"; y siempre después de PG1 y de AMH (Naza, 30/09, simulaciones y prueba en la página) | Gracias, {{nombre}}. |
| M27.1 | Se niega en una sensible (toca [Prefiero no contarla], dice "paso" o una frase de la lista); rotan; primera línea del mensaje que sigue. Delante de algo que arranca con "Seguimos" o "Pasamos" no va M27.1 sino M27.2 | Está bien, {{nombre}}. Lo dejamos ahí y seguimos por otro lado. |
| M27.2 | Se niega en una sensible (toca [Prefiero no contarla], dice "paso" o una frase de la lista); rotan; primera línea del mensaje que sigue | Claro, sin problema. Vamos con otra. |
| M27.3 | Se niega en una sensible (toca [Prefiero no contarla], dice "paso" o una frase de la lista); rotan; primera línea del mensaje que sigue | Entiendo, {{nombre}}. No hace falta entrar ahí. Vamos con la que viene. |
| M28.1 | Después de un olvido ("no me acuerdo", "no sé"…), en lugar de M3 o M4; primera línea del mensaje que sigue. Es el único de olvido en uso (Naza, 30/09) | No pasa nada, {{nombre}}. Vamos con otra. |
| M28.2 | **Reserva, sin uso** (Naza, 30/09): solo si con alguien que se olvida mucho se nota la repetición de M28.1 | Está bien, no hay problema. Te pregunto otra cosa. |
| M28.3 | **Reserva, sin uso** (Naza, 30/09): solo si con alguien que se olvida mucho se nota la repetición de M28.1 | Tranquil{{o/a}}, no importa. Seguimos con la que viene. |
| M28.4 | Olvido a medias: la respuesta arranca con una frase de olvido y sigue contando (más de 20 palabras o con "pero/aunque"); en lugar de M3 o M4; rota con M28.5 (nunca dos iguales seguidos); primera línea del mensaje que sigue; delante de un cierre o de LE9 va M26. No suma al contador de M29 (Naza, 30/09, ronda 2) | Con ese pedacito me alcanza, {{nombre}}. Gracias. |
| M28.5 | Olvido a medias, rota con M28.4 (Naza, 30/09, prueba en la página: "Con ese pedacito" salió dos veces seguidas); mismas reglas que M28.4 | Con eso me alcanza, gracias. Vamos con otra. |
| M29 | Una sola vez en toda la entrevista, al tercer olvido seguido, en lugar de M28 y arriba de la pregunta que sigue (primera línea del mensaje que sigue) | Una cosa, {{nombre}}: no te hagas problema si algo no te acordás. Para el libro alcanza con lo que sí tenés. Y si de alguna te acordás a medias, contame ese pedacito nomás: un olor, una cara, cómo era en general. Eso también es tu historia. |
| M30 | Cuando toca un botón de "Sí" en una pregunta que abre tema; mensaje solo, y se espera el audio en la misma pregunta | Contame, te escucho. |
| M31 | Una sola vez: debajo del primer mensaje de la entrevista que lleva botones (CI1 en una vida completa), en línea aparte y en cursiva, como M1 | _Podés tocar el botón de abajo, o contestarme en audio como siempre._ |
| M32.1 | Se negó pero siguió contando: la respuesta arranca con una frase de la lista del paso y sigue larga (no es paso); rotan; en lugar de M3 o M4; primera línea del mensaje que sigue; delante de un cierre o de LE9 va M26 (Naza, 30/09, ronda 2) | Con lo que me dijiste alcanza, {{nombre}}. Lo demás queda tuyo. Vamos con otra. |
| M32.2 | Se negó pero siguió contando: la respuesta arranca con una frase de la lista del paso y sigue larga (no es paso); rotan; en lugar de M3 o M4; primera línea del mensaje que sigue; delante de un cierre o de LE9 va M26 (Naza, 30/09, ronda 2) | Está bien. Lo que me contaste queda, y lo que no, no hace falta. Seguimos. |
| DD1 | Dashboard (no WhatsApp): la ficha dice que sí y en la entrevista contestó que no. Botones: [Lo dejo así] [Quiero contar algo] [Error de la ficha] | Una duda chiquita sobre {{tema}}, {{nombre}}. En la ficha aparece y en la entrevista no salió. No hay nada que corregir si no querés: el libro se escribe con lo que vos contaste. Pero si hay algo que quieras sumar, o si la ficha está mal, acá podés decírmelo. |
| DD2 | Dashboard (no WhatsApp): la ficha dice que no y en la entrevista contó algo. Botones: [Dejalo como lo conté] [Quiero agregar algo] [Sacalo del libro] | {{nombre}}, sobre {{tema}}: en la ficha no figuraba, pero en la entrevista lo nombraste. Quiero asegurarme de que en el libro quede como vos querés. Podemos dejarlo tal cual lo contaste, podés agregar algo, o si se coló por error, lo saco. |

## Entradas de bloque

Una frase al empezar cada bloque, antes de su primera pregunta; no espera respuesta. Los bloques 1 (OR1 ya arranca así), 6 (AM0) y 11 (el aviso AV11) no llevan. Redactadas por Fable, aprobadas por Naza el 30/09 ([`correcciones-lectura.md`](correcciones-lectura.md)).

| ID | Cuándo | Texto |
|---|---|---|
| EN2 | Antes de la primera pregunta del bloque 2 | Ahora vamos a tu infancia, {{nombre}}: la casa donde creciste y la gente que vivía con vos. |
| EN3 | Antes de la primera pregunta del bloque 3 | Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad. |
| EN4 | Antes de la primera pregunta del bloque 4 | Ahora vamos a tu adolescencia: esos años en que uno deja de ser chic{{o/a}} y todavía no es grande. |
| EN5 | Antes de la primera pregunta del bloque 5 | Pasamos a tu juventud, {{nombre}}: cuando empezaste a armar tu propia vida. |
| EN7 | Antes de la primera pregunta del bloque 7 | Ahora vamos al trabajo y a tu oficio, {{nombre}}: lo que hiciste con tus días. |
| EN8 | Antes de la primera pregunta del bloque 8 | Volvemos a la familia, {{nombre}}, pero en tu vida adulta. |
| EN9 | Antes de la primera pregunta del bloque 9 | Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron. |
| EN10 | Antes de la primera pregunta del bloque 10 | Hablemos de los amigos, {{nombre}}, y de la gente que te dio una mano en la vida. |
| EN12 | Antes de la primera pregunta del bloque 12 | Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida. |
| EN13 | Antes de la primera pregunta del bloque 13 | Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato. |
| EN14 | Antes de la primera pregunta del bloque 14 | Dejamos el pasado un rato y venimos a hoy, {{nombre}}: cómo son tus días y qué te gusta ahora. |
| EN15 | Antes de la primera pregunta del bloque 15 | Ya estamos en la última parte, {{nombre}}: lo que te dejó todo esto y lo que querés dejarle a tu familia. |

## Bloque 1 · Origen y raíces

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| OR1 | Empecemos por cuando llegaste al mundo, según te contaron. No el día en sí, sino la época: dónde vivían, en qué andaban tu mamá y tu papá, cómo te esperaban. ¿Qué sabés de cómo era la vida de ellos en ese entonces? Contame. |  | núcleo | historia |  |
| OR2 | En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste. |  | núcleo | historia |  |
| OR5 | ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron. |  | núcleo | historia |  |
| OR6 | ¿Por qué te pusieron {{nombre}}? En las casas siempre hay una historia atrás de un nombre: una discusión, un santo, alguien a quien querían mucho. Contame la que te contaron a vos, aunque sea cortita. |  | núcleo | historia |  |
| OR6.2 | ¿Tenés o tuviste algún apodo? Si es así, contame cómo nació: quién te lo puso, por qué justo ese, y si te gusta. Casi siempre hay una anécdota atrás. |  | núcleo | historia |  |
| CI1 | Hasta acá lo de tu familia de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora. Y si algo se te viene más tarde, a cualquier hora, mandámelo cuando quieras: va al libro igual. |  | núcleo | cierre |  |

## Bloque 2 · La casa y la familia de la infancia

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| CA1 | Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí. |  | núcleo | historia |  |
| CA2 | Viajemos un rato a cuando eras chic{{o/a}}. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó. |  | núcleo | historia |  |
| CA3 | ¿Y tu papá? ¿A qué se dedicaba cuando eras chic{{o/a}}? Contame alguna vez que lo acompañaste o lo viste trabajando. Y si tu papá no estuvo, o preferís no entrar, contame lo que vos quieras de él. |  | núcleo | historia |  |
| CA4 | Pensá en el día que alguien de tu casa te enseñó a hacer algo por primera vez: andar en bicicleta, nadar, silbar. Cómo fue ese día. |  | extra | historia |  |
| CA5 | Vamos a la vez que más te retaron o te castigaron de chic{{o/a}}: qué habías hecho, quién te retó y cómo terminó. |  | extra | historia |  |
| CA6 | ¿Tuviste hermanos? Si ya salieron en la charla no importa, quiero saber más: contame con cuál eras más cercan{{o/a}} de chic{{o/a}} y alguna aventura que hayan hecho juntos; seguro tienen varias. |  | núcleo | historia |  |
| CA7 | ¿Y con tus otros hermanos? Contame alguna historia de chicos con alguno de ellos. | si:CA6 | extra | historia |  |
| CA8 | De chic{{o/a}}, ¿a qué jugabas en casa? Uno se arma un mundo con cualquier cosa: una sábana, un patio, un perro. ¿Te acordás de un día que te quedaste jugando hasta que te llamaron a comer? Contámelo. |  | extra | historia |  |
| CA9 | ¿Había alguien más que viviera con ustedes o que estuviera siempre en tu casa, como un abuelo, una tía o alguien que ayudaba? Si había alguien, contame alguna vez con esa persona que se te quedó grabada. |  | extra | historia |  |
| CA10 | Pensá en las fiestas y comidas en familia de cuando eras chic{{o/a}}: una Navidad, un cumpleaños, un domingo. ¿Cómo eran en tu casa? Y si hubo una que recuerdes distinta a las demás, contámela. |  | núcleo | historia |  |
| CA12 | De chic{{o/a}}, ¿hubo algo que costó mucho tener en tu casa, o algo que vos esperaste mucho tiempo hasta que por fin llegó? Contame cómo fue ese día. |  | extra | historia |  |
| CA13 | ¿A qué edad empezaste a salir a jugar sin que nadie te cuidara? Contame la primera vez que saliste sol{{o/a}}: a dónde fuiste y qué pasó. |  | extra | historia |  |
| CA14 | ¿Algún animal te acompañó de chic{{o/a}}? Una mascota de la casa o el perro de algún vecino. Contame un recuerdo lindo que tengas con él. |  | núcleo | historia |  |
| CA15 | ¿A qué le tenías miedo de chic{{o/a}}, y por qué? ¿Te acordás de alguna vez que te hayas asustado mucho? Contame qué pasó. |  | extra | historia |  |
| CA16 | Contame un día de chic{{o/a}} que esperabas con muchas ganas: qué era, quién estaba, qué pasó. Y si no te vuelve un día en particular, contame qué cosas esperabas con ganas en esa época, que con eso me arreglo. |  | núcleo | historia |  |
| CA17 | ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. |  | núcleo | historia | sí |
| CI2 | Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquil{{o/a}}, que hay tiempo. |  | núcleo | cierre |  |

## Bloque 3 · La escuela y los juegos

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| ES1 | ¿Cómo fue tu primer día de escuela? ¿Quién te llevó hasta la puerta, y qué sentiste cuando se fue? Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria. |  | núcleo | historia |  |
| ES2 | ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día. |  | núcleo | historia |  |
| ES3 | ¿Cómo eras en la escuela? ¿Te gustaba ir, tenías alguna materia que esperabas? Contame un día de esa época que te quedó grabado: un acto, una prueba, un boletín que llevaste a tu casa. |  | extra | historia |  |
| ES5 | De chic{{o/a}}, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír. |  | núcleo | historia |  |
| ES6 | ¿Cuál fue la travesura más grande que hiciste de chic{{o/a}}, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también. |  | núcleo | historia |  |
| ES7 | ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo. |  | núcleo | historia |  |
| ES8 | ¿Cómo eran tus veranos de chic{{o/a}}? El calor, los días largos, lo que se hacía en tu casa en esos meses. Contame. |  | núcleo | historia |  |
| ES9 | ¿La religión estaba presente en tu casa cuando eras chic{{o/a}}? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas. |  | núcleo | historia |  |
| ES10 | De chic{{o/a}}, ¿qué se escuchaba en tu casa: radio, discos, alguien que cantaba mientras cocinaba? Seguro hay una canción que, apenas la oís, te devuelve ahí. ¿Cuál es, y adónde te lleva? |  | extra | historia |  |
| ES13 | ¿Fuiste siempre a la misma escuela, o te tocó cambiarte? Si te cambiaste, contame cómo fue el primer día en la nueva: cómo llegaste, qué te encontraste. |  | extra | historia |  |
| ES14 | ¿Cómo eran los recreos en tu escuela? ¿A qué se jugaba, dónde te metías vos? Contame algún recreo que se te haya quedado grabado. |  | extra | historia |  |
| ES15 | ¿Había algún compañero o compañera que no te caía bien? ¿Por qué? Contame alguna vez que se cruzaron. |  | extra | historia |  |
| CI3 | Hasta acá lo de la escuela. ¿Te quedó alguna historia de esos años que no te pregunté? Puede ser de la primaria o del colegio de después. Si hay una, contámela ahora, con calma. Si no, tocá el botón. |  | núcleo | cierre |  |

## Bloque 4 · Adolescencia

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| AD2 | Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada. |  | núcleo | historia |  |
| AD1 | ¿Cómo eras a los quince? Cómo te vestías, qué te gustaba hacer, qué te daba vergüenza. Y contame un día de esa edad que te acuerdes bien, como si lo estuvieras viviendo de nuevo. |  | extra | historia |  |
| AD2b | ¿Qué recordás de tu último año en el colegio, o del último año que fuiste? Es un año que marca. Contame lo que te quedó de esos meses: algún momento, algo que pasó, cómo fue la despedida. |  | extra | historia |  |
| AD3 | ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas. |  | núcleo | historia |  |
| AD5 | ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche. Y si la primera no te vuelve, contame cómo eran esas salidas en general. |  | núcleo | historia |  |
| AD6 | ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado. |  | núcleo | historia |  |
| AD8 | A esa edad uno choca con los de la casa. ¿Cuál fue la pelea más grande que tuviste con tu mamá o con tu papá? Contame por qué fue y cómo se vivió en tu casa. |  | extra | historia |  |
| AD9 | ¿En qué lío te metiste de adolescente, de esos que ya no eran travesuras de chic{{o/a}}? Contame qué pasó y quién te sacó del apuro, o cómo saliste. |  | extra | historia |  |
| AD10 | En esos años, ¿había alguien mayor que te entendía y a quien escuchabas de verdad, un tío, la mamá de un amigo, el amigo de un hermano? Contame cómo era con vos y una vez que estuvo de tu lado cuando lo necesitabas. |  | extra | historia |  |
| AD11 | ¿Qué cosas te gustaban a los dieciséis, qué te sacaba de la cama? Un deporte, un taller, la música, lo que fuera. Contame qué eran, y un día de eso en particular. |  | extra | historia |  |
| AD12 | ¿Cuándo sentiste por primera vez que ya no eras chic{{o/a}}? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento. |  | núcleo | historia |  |
| AD15 | ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Y si ya me lo contaste, decime "ya te lo conté" y seguimos. |  | núcleo | historia | sí |
| AD16 | Cuando se terminaba el colegio, o esa etapa para vos, ¿qué planes tenías? ¿Qué te imaginabas para lo que venía? Si te acordás de alguna charla o algún momento en que lo pensaste, contámelo. |  | extra | historia |  |
| AD17 | ¿Aprendiste a manejar? Contame la primera vez que agarraste un volante: quién te enseñó, dónde fue, cómo te fue. |  | extra | historia |  |
| CI4 | Hasta acá tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquil{{o/a}}, que hay tiempo. |  | núcleo | cierre |  |

## Bloque 5 · Juventud

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| JU1 | ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande. |  | núcleo | historia |  |
| JU2 | ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado. |  | núcleo | historia |  |
| JU2b | ¿Te pasó de empezar a estudiar algo y dejarlo? Si te pasó, contame cómo fue ese momento: qué pasaba en tu vida, si lo hablaste con alguien. |  | extra | historia |  |
| JU4 | ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas. |  | núcleo | historia |  |
| JU5 | ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás. |  | núcleo | historia |  |
| JU8 | ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Capaz ya me contaste algo de esa mudanza; ahora contame la llegada: el primer día, dónde dormiste esa noche, quién te esperaba y qué fue lo que más te costó. |  | núcleo | historia |  |
| JU10 | Cuando llegaste a vivir a ese lugar nuevo, ¿hubo alguien que te dio una mano? Alguien que te abrió la puerta, te explicó cómo eran las cosas. Contame una vez que te ayudó. | si:JU8 | extra | historia |  |
| JU11 | Un día uno se da cuenta de que ya es de ahí: conoce las calles, lo saludan, se siente en casa. ¿Te pasó con ese lugar nuevo? Contame ese momento. | si:JU8 | extra | historia |  |
| JU9 | De joven, ¿qué lugares recorriste? Vacaciones, viajes, escapadas. Contame un viaje de esos años que se te haya quedado. |  | extra | historia |  |
| JU22 | ¿Cómo fueron tus primeros años por tu cuenta? ¿Cómo te arreglabas, qué hacías para salir adelante? Contame algún momento de esa época que te acuerdes. |  | extra | historia |  |
| JU12 | Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue? Si la noche justa no te vuelve, contame cómo eran los primeros tiempos ahí. Y si nunca te fuiste de la casa de tus viejos, contame el día en que esa casa pasó a ser tuya, o el rincón que siempre fue tuyo. |  | núcleo | historia |  |
| JU13 | ¿Hiciste alguna locura de joven? Un viaje a dedo, una apuesta, algo que hoy no harías. Contame esa vez desde que empezó, con todo lo que pasó. |  | núcleo | historia |  |
| JU15 | ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también. |  | núcleo | historia |  |
| JU16 | Pensá en un momento muy feliz de tu juventud. No hace falta que sea algo grande: una tarde, una noticia, un lugar. ¿Dónde estabas, qué pasó? Contámelo como si estuvieras ahí de nuevo. |  | extra | historia |  |
| JU17 | ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Y si ya me lo contaste, decime "ya te lo conté" y seguimos. |  | núcleo | historia | sí |
| JU18 | ¿Cómo eran las fiestas y las salidas en tu juventud? Los bailes, los cumpleaños, las noches largas. Contame una que no te olvidás. Y si se te vienen más, contalas también. |  | extra | historia |  |
| JU19 | ¿Tuviste algún flechazo en esos años, alguien que te movió el piso? Contame cómo fue: dónde se cruzaron, qué pasó. |  | extra | historia |  |
| JU20 | ¿Te mudaste muchas veces en tu vida? Contame por qué casas o lugares fuiste pasando, más o menos en qué años, y cuál de esas mudanzas te quedó más grabada. |  | extra | historia |  |
| CI5 | Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma. |  | núcleo | cierre |  |

## Bloque 6 · Amor y pareja

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| AM0 | Ahora vamos al amor. ¿Hubo alguien con quien tuviste una historia en serio? Si hubo, haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años, y si hoy hay alguien a tu lado. Después te pregunto más de la pareja de ahora, o de la última, y de las de antes también va a haber lugar. Y si no hubo, también vale. |  | núcleo | historia |  |
| AMH | Vamos a la pareja de ahora, o a la última si hoy no hay nadie. Antes de preguntarte por esa historia, decime desde dónde te pregunto: ¿esa persona sigue hoy a tu lado? | si:AM0 | núcleo | historia |  |
| AM1 | Contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron, y qué fue lo primero que te llamó la atención de esa persona. Si ese día ya me lo contaste antes, decime "ya te lo conté" y seguimos con lo que vino después. | si:AM0 | núcleo | historia |  |
| AM2 | ¿Cómo fue el noviazgo, o esos primeros tiempos? Pensá en un momento: una cita, un paseo, una tarde que todavía tenés fresca. Contámela como si la vieras de vuelta. Si se te vienen más, contalas también. | si:AM0 | extra | historia |  |
| AM3 | Y después, ¿llegaron a armar la vida juntos: casarse, irse a vivir, lo que haya sido? Si llegaron, contame ese momento: quién lo dijo primero, o si se fue dando solo, dónde estaban, qué se dijeron. Si ya me lo contaste recién, con decírmelo alcanza. | si:AM0 | núcleo | historia |  |
| AM4 | Hay días que quedan grabados para siempre: el del casamiento, o el primero viviendo juntos. Contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó. Si ya me lo contaste recién, con decírmelo alcanza. | si:AM3 | núcleo | historia |  |
| AM5 | Contame a dónde se mudaron juntos por primera vez: cómo llegaron a ese lugar, cómo era por dentro, y cómo fue esa primera noche ahí, con todo lo que tenía y todo lo que le faltaba. | si:AM3 | extra | historia |  |
| AM6 | ¿Tuvieron una época difícil entre ustedes? Si la hubo, contame qué pasaba y cómo la fueron llevando: qué hizo cada uno, si hubo un día que lo cambió. Si preferís no entrar, también está bien. | si:AM0 | extra | historia |  |
| AM13 | Contame una pelea que tuvieron, de esas que después dan risa: por qué fue, quién aflojó primero y cómo hicieron las paces. Si no hubo ninguna que hoy dé risa, con decírmelo alcanza. | si:AM3 | núcleo | historia |  |
| AM8 | Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también. | si:AM0 | núcleo | historia |  |
| AM9 | Si querés, contame cómo fue el final de esa historia: una separación, una despedida, lo que haya sido. Solo lo que vos quieras, y hasta donde quieras. Si preferís no entrar ahí, con el botón alcanza; lo demás de tu historia sigue igual. | sino:AMH | núcleo | historia | sí |
| AM7 | Contame algo muy de esa persona: una frase que «sino:AMH: repetía ‖ repite», una costumbre, una manía. Y una vez puntual en que salió eso, para que quien lea la tenga enfrente. | si:AM0 | extra | historia |  |
| AM19 | Y después, cuando quedaste por tu cuenta, ¿cómo fueron esos primeros tiempos? Qué cambió en la casa y en los días, quién anduvo cerca. Si ese tiempo es el de ahora, contame igual cómo lo estás llevando. Y si no hubo un tiempo así, con decírmelo alcanza. | sino:AMH y si:AM3 | núcleo | historia |  |
| AM21 | Ahora las de antes. Si en el repaso me nombraste otras historias que fueron en serio, este es su lugar, pero sin tanto detalle: de cada una, contame un momento que quieras que quede en el libro, el que se te venga primero, y si querés, cómo terminó. Y si hubo alguien que te marcó aunque no haya llegado a nada, también entra acá. Si esa fue la única, con el botón alcanza. | si:AM0 | núcleo | historia |  |
| AM17 | En el amor, ¿alguna vez alguien te cuidó cuando lo necesitabas, en una enfermedad o un mal momento? Si te pasó, contame qué hizo y qué te dijo. | si:AM0 | extra | historia |  |
| AM14 | ¿Hubo algún amor que te marcó, aunque haya durado poco o no haya llegado a nada? Si lo hubo, contame cómo se cruzaron y el momento que más te acordás de esa persona. Y si no hubo, con un no alcanza. | sino:AM0 | núcleo | historia |  |
| AM15 | ¿Quiénes son hoy las personas con las que compartís la vida: un hermano, una amiga, un vecino, quien sea? Pensá en una y contame un día de ustedes que tengas bien guardado. | sino:AM0 | núcleo | historia |  |
| CI6 | Hasta acá lo del amor. ¿Quedó alguien o algo de eso que no te pregunté? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro. |  | núcleo | cierre |  |

## Bloque 7 · Trabajo y oficio

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| TR1 | ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo. |  | núcleo | historia |  |
| TR6 | Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí. |  | núcleo | historia |  |
| OF1 | Hay un momento en que uno deja de sentirse nuev{{o/a}} en lo suyo y se da cuenta de que ya sabe. ¿Te pasó? Contame ese día: qué estabas haciendo, quién estaba, qué sentiste. |  | extra | historia |  |
| MA1 | ¿Hay algo que sepas hacer bien con las manos? Cocinar, arreglar, coser, sembrar, curar, lo que sea. Contame cómo lo hacés, y la última vez que lo hiciste: para quién fue, cómo salió. |  | extra | historia |  |
| TR2 | Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco. |  | núcleo | historia |  |
| TR3 | ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara. |  | núcleo | historia |  |
| OF2 | ¿Hay alguien a quien atendiste, cuidaste o le enseñaste algo, y que no te olvidás? Contame cómo era, y esa vez que te quedó grabada. |  | extra | historia |  |
| TR5 | ¿Cuál fue el día de trabajo del que estás más orgullos{{o/a}}? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo. Y si no te viene un día puntual, contame de qué parte de tu trabajo estás más orgullos{{o/a}}. |  | núcleo | historia |  |
| TR4 | ¿Pasaste por un día, o una época, en que lo tuyo se te hizo cuesta arriba? Contame cómo era levantarse entonces, qué te sostenía, y el momento en que sentiste que empezaba a pasar. |  | extra | historia |  |
| OF4 | Todos metemos la pata alguna vez trabajando. ¿Cuál fue tu error más grande? Contame ese día: qué pasó, quién se enteró, qué hiciste después. |  | extra | historia |  |
| OB1 | ¿Tuviste compañeros? Si los tuviste, contame cómo eran, y una vez que uno te cubrió, o vos a él, cuando hacía falta. |  | extra | historia |  |
| OB2 | ¿Alguna vez tuviste un choque fuerte en tu oficio, o alguien que te decepcionó: un patrón, un socio, un compañero? Si te pasó, contame ese día: qué pasó, de qué lado estabas, cómo terminó. |  | extra | historia |  |
| TR11 | ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando. |  | núcleo | historia | sí |
| TR8 | Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora. |  | núcleo | historia |  |
| CS1 | Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó. |  | núcleo | historia |  |
| CP1 | ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chic{{o/a}} o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta. |  | núcleo | historia |  |
| PR1 | ¿Terminaste algún estudio, un curso, un oficio, una carrera? Si fue así, contame el día que te recibiste o que terminaste: dónde estabas, si había alguien tuyo mirando, qué hiciste esa noche. |  | extra | historia |  |
| TR9 | ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir. |  | núcleo | historia |  |
| CI7 | Hasta acá lo de tu trabajo y tu oficio. ¿Quedó algo de eso que no te pregunté? Un lugar, una herramienta, un olor, una persona, un trabajo de unos días que nadie recuerda. Es el momento de contarlo, sin apuro. |  | núcleo | cierre |  |

## Bloque 8 · Hijos y nietos

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| PG1 | Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Y si te tocó cuidarlos, contame cómo era un día de esos: qué hacías por ellos, qué te decían. Si no los tuviste cerca, contame cómo fue eso. |  | núcleo | historia |  |
| HI0 | Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Presentámelos de a uno, incluso si alguno ya apareció en lo que me venís contando: cómo se llama cada uno y cuándo llegó. Y si no tuviste, seguimos por otro lado. |  | núcleo | historia |  |
| HI1 | Hay noticias que te cambian la vida. ¿Cómo fue el día que te enteraste de que ibas a ser {{padre/madre}} por primera vez? Dónde estabas, quién estaba con vos, y lo primero que pensaste. | si:HI0 | extra | historia |  |
| HI2 | ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez. | si:HI0 | núcleo | historia |  |
| HI3 | ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír. | si:HI2 | núcleo | historia |  |
| HI4 | Pensá en un día cualquiera en tu casa cuando los chicos eran chicos. Las mañanas, la comida, el ruido, la hora de dormir. Y contame un día de esos que tengas bien grabado. | si:HI0 | extra | historia |  |
| HI5 | Ser {{padre/madre}} también tiene sus tiempos duros. ¿Cuál fue la época más difícil para vos como {{padre/madre}}? Qué pasaba, cómo la fuiste llevando, y un día de esa época que te haya marcado. | si:HI0 | extra | historia |  |
| HS1 | ¿Cómo fue criar a tus hijos? Quién estaba cerca, cómo se repartían las cosas, o si te tocó llevarla sol{{o/a}}. Contame un día de esa época que te acuerdes bien. | si:HI2 | núcleo | historia |  |
| HI6 | Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno. | si:HI2 | núcleo | historia |  |
| HI7 | Un día los hijos se van de casa. ¿Te acordás del día en que se fue el primero? Cómo fue la despedida, y cómo quedó la casa esa noche. Si todavía no se fue ninguno, me decís nomás. | si:HI0 | núcleo | historia |  |
| HI12 | ¿Cómo eligieron el nombre de cada hijo? De dónde salió, quién lo propuso, si hubo discusión. Contame la historia del nombre, aunque sea corta. | si:HI0 | núcleo | historia |  |
| HI13 | ¿Qué cosa tuya ves hoy en tus hijos? Un gesto, una manía, una forma de hablar. Contame una vez que lo viste y te diste cuenta. | si:HI0 | extra | historia |  |
| HI10 | ¿Algún chico o joven fue importante en tu vida? Alguien que viste crecer, a quien le enseñaste algo o tuviste cerca. Contame quién es y una vez con esa persona que no te olvidás. | sino:HI0 | núcleo | historia |  |
| HI8 | Ahora, los nietos. ¿Llegaron nietos a tu vida? Puede que ya los hayas mencionado; contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, pasamos a otra cosa. | si:HI0 | núcleo | historia |  |
| HI9 | ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada. | si:HI8 | núcleo | historia |  |
| NC1 | A veces a los abuelos les toca criar a un nieto, o tenerlo a cargo un tiempo. Si te pasó, contame cómo se dio y cómo fue el primer día. Y si no te tocó, decímelo y seguimos. | si:HI8 | extra | historia |  |
| CI8 | Hasta acá lo de la familia de grande. ¿Quedó alguien o algo que no te pregunté? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro. |  | núcleo | cierre |  |

## Bloque 9 · Lugares y pasiones

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| LU3 | Fuera de tu casa, ¿hubo un lugar al que volvías siempre? Un club, por ejemplo, o cualquier lugar que fuera un poco tuyo. Contame cómo era y una vez ahí que todavía te acuerdes. |  | extra | historia |  |
| LU4 | Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto. |  | núcleo | historia |  |
| PA1 | Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo. |  | núcleo | historia |  |
| LU5 | Hay vehículos que terminan siendo casi de la familia. ¿Tuviste uno así? Contame cómo llegó a vos y un día arriba de él que todavía te acuerdes. |  | extra | historia |  |
| LU6 | ¿Cuál es tu barrio preferido, o el lugar donde te sentís más cómod{{o/a}}? Si pudieras estar ahí ahora mismo, contame cómo sería ese momento: qué ves, quién está, qué hacés. |  | extra | historia |  |
| LU7 | De grande, ¿hubo un lugar adonde ibas de vacaciones una y otra vez? Contame cómo era eso, cómo llegaban, y un día de esas vacaciones que tengas guardado. |  | extra | historia |  |
| PA3 | ¿Sos hincha de algún club? Contame cómo empezó eso, si alguien te llevó, y un partido que no te olvidás más. |  | núcleo | historia |  |
| LU8 | ¿Hay un lugar al que te gustaría volver, aunque sea por un rato? Contame qué lugar es, y la última vez que estuviste ahí. |  | extra | historia |  |
| CI9 | Hasta acá los lugares y las pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquil{{o/a}}. |  | núcleo | cierre |  |

## Bloque 10 · Amistades y ayudas

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| AS1 | Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad. |  | núcleo | historia |  |
| HE2 | Ya de grandes, ¿tus hermanos también se volvieron amigos? Contame algún momento de adultos en que estuvieron bien cerca: un viaje, una charla, una mano que se dieron. Si no tuviste hermanos, decime y seguimos. | si:CA6 | núcleo | historia |  |
| AS1b | Volviendo a esa amistad: contame algo que hicieron juntos hace poco. Aunque sea una charla por teléfono. | si:AS1 | extra | historia |  |
| AY1 | ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver. |  | núcleo | historia |  |
| AS4 | A veces una amistad se enfría sin que nadie lo decida. ¿Te pasó con alguna? Contame cómo era esa amistad y qué fue pasando, hasta donde tengas ganas. |  | extra | historia |  |
| AS5 | ¿Formaste parte alguna vez de un grupo que se juntaba por algo, un club, una comisión del barrio, o un grupo de amigos? Contame una vez que hicieron algo juntos que todavía recuerdes. |  | extra | historia |  |
| RE1 | ¿Hubo una vez en que nada te ayudaba y te sostuvo algo en lo que creías? La fe, o lo que sea para vos. Contame ese momento y cómo te agarraste de eso. |  | extra | historia |  |
| AS9 | Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar. |  | núcleo | historia |  |
| AY2 | ¿Y te tocó ser vos quien le dio una mano a alguien que la necesitaba? Contame qué pasó y qué hiciste ese día. |  | extra | historia |  |
| AS7 | Hoy, cuando te pasa algo importante, ¿a quién se lo contás primero? Contame una vez que le hayas contado algo así. |  | núcleo | historia |  |
| CI10 | Hasta acá los amigos y la gente que te ayudó. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquil{{o/a}}. |  | núcleo | cierre |  |

## Bloque 11 · Pérdidas y momentos difíciles

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| AV11 | Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás. |  | núcleo | aviso | sí |
| PE1 | Puede que ya me hayas hablado de alguna pérdida; acá hay lugar para lo que no entró. Si perdiste a alguien importante, contame de cada uno lo que quieras: qué era para vos, cómo fueron los días de después y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también. |  | núcleo | historia | sí |
| PE5 | Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale. |  | núcleo | historia | sí |
| PE6 | Hay equivocaciones que uno arrastra años. Si tenés una así, y querés contarla, decime qué pasó, quién la pagó, y en qué quedó todo después. |  | extra | historia | sí |
| ID1 | Mucha gente durante años tuvo que guardarse una parte de lo que era, o de lo que sentía. Si a vos te pasó, y querés que quede en tu historia, contámelo como vos quieras. |  | extra | historia | sí |
| PE4 | ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Y si ya me la contaste, con decírmelo alcanza. |  | núcleo | historia | sí |
| CI11 | Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá. |  | núcleo | cierre | sí |

## Bloque 12 · La historia grande

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| HG1 | Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día. |  | núcleo | historia |  |
| HG2 | Con los años pasan muchas cosas en un país. ¿Hay otra que te haya tocado a vos de lleno? Contame cómo te enteraste y qué pasó en tu casa ese día. | si:HG1 | extra | historia |  |
| HG4 | Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado. Y si ninguno se te separa de los demás, contame cómo eran tus días entonces. |  | núcleo | historia |  |
| HG3 | Hay cosas de todos los días que ya no se hacen como antes, hablar por teléfono, por ejemplo. Pensá en una y contame una escena: dónde estabas, qué hacías, cómo era. |  | extra | historia |  |
| DE1 | Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron. |  | núcleo | historia |  |
| HG7 | ¿Te acordás de cuando llegó a tu casa algo que cambió la vida de todos, como la primera tele? Contame ese día: quién lo trajo, dónde lo pusieron, quiénes vinieron a verlo. |  | extra | historia |  |
| HG8 | ¿Y alguna vez fuiste a votar y sentiste que era importante? Contame ese día: con quién fuiste, cómo estaba la calle, qué esperabas que pasara. |  | extra | historia |  |
| FI7 | ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy. |  | núcleo | historia |  |
| CI12 | Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó. |  | núcleo | cierre |  |

## Bloque 13 · Puntos altos, bajos y giros

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| GI1 | ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó. Si es uno que ya me contaste, decímelo y, si querés, agregale lo que te faltó. |  | núcleo | historia |  |
| GI2 | Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó. Si ya me lo contaste, con decírmelo alcanza. Y si el día justo no te vuelve, contame lo que te acuerdes de esa época. |  | núcleo | historia |  |
| GI8 | ¿Cuál fue el golpe de suerte más grande que tuviste? Algo que no dependió de vos y te cambió las cosas. Contame cómo fue ese día: dónde estabas cuando te enteraste y qué hiciste después. |  | extra | historia |  |
| HJ1 | ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día. |  | núcleo | historia |  |
| GI4 | ¿Te pasó de ser valiente y que nadie se enterara? No hace falta que sea algo grande, a veces es decir algo que costaba decir. Contame ese momento: dónde estabas y qué hiciste. |  | extra | historia |  |
| GI9 | ¿Hubo algún momento en tu vida en que te sentiste chiquit{{o/a}} frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor. Y si no te vuelve un momento puntual, contame frente a qué cosas te pasa eso. |  | núcleo | historia |  |
| HJ5 | Ya con tu propia vida armada, ¿cómo fue volver a la casa donde te criaste? Contame la vez que más te acordás, mirando todo con ojos de visita: cómo llegaste, qué encontraste distinto y qué te pasó por dentro. |  | extra | historia |  |
| FI1 | ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos mism{{o/a}}? Contame alguno que te acuerdes: dónde estabas y qué hacías. |  | núcleo | historia |  |
| FI2 | ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó. |  | núcleo | historia |  |
| FI3 | ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos. |  | núcleo | historia |  |
| FI4 | ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó. |  | núcleo | historia |  |
| FI6 | ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda. |  | extra | historia |  |
| CI13 | Hasta acá esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquil{{o/a}}. |  | núcleo | cierre |  |

## Bloque 14 · Hoy

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| HO1 | Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo. |  | núcleo | historia |  |
| PA2 | ¿Qué hacés cuando tenés un momento sol{{o/a}}, en tu casa o donde te toque? Contame la última vez que tuviste un rato así y qué hiciste. |  | extra | historia |  |
| HO2 | ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado. Y si la última no te vuelve, contame con qué te reís seguido. |  | núcleo | historia |  |
| HO2.2 | ¿Y qué es lo que más te hace enojar o te agota la paciencia? Contame la última vez que te pasó: dónde estabas, qué había pasado y qué hiciste. |  | extra | historia |  |
| HO4 | ¿Hay algo en tu casa que no regalarías nunca, valga lo que valga? Contame de dónde vino, cómo llegó a vos, y la última vez que lo tuviste en las manos. |  | núcleo | historia |  |
| HO5 | ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste. |  | núcleo | historia |  |
| HO6 | ¿Hay algo de tu forma de ser que todos los que te conocen reconocen enseguida? Una frase que repetís, una manía, tu carácter. Contame una vez que alguien te lo marcó. |  | extra | historia |  |
| HO11 | ¿Tenés alguna marca en el cuerpo que tenga historia? Una cicatriz, un tatuaje, una quemadura de la cocina. Contame cómo te la hiciste: dónde estabas, cuántos años tenías, quién estaba con vos y qué pasó después. Y si no tenés ninguna que valga la pena, contame de una que tenga alguien de tu familia y que siempre pregunten de dónde salió. |  | núcleo | historia |  |
| CO1 | ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien. |  | núcleo | historia |  |
| G1 | ¿Qué música ponés hoy cuando estás a tu aire? ¿Cuál fue la última canción que escuchaste, y qué estabas haciendo? |  | núcleo | historia |  |
| HO9 | ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte. |  | núcleo | historia |  |
| HO10 | ¿Algo te acompañó muchos años, el cigarrillo, el vino, el café de la mañana? Contame cómo empezó y un momento con eso. Y si en algún momento te costó dejarlo, contame eso también. |  | núcleo | historia |  |
| G2 | ¿Y lo que más te gusta comer, así, sin pensarlo mucho? Contame la última vez que lo comiste: quién lo hizo y dónde. |  | extra | historia |  |
| G3 | ¿Te gusta leer, o sos más de mirar películas o series? ¿Con qué te enganchás? Contame la última vez que se te pasó la hora con algo así. |  | núcleo | historia |  |
| G4 | ¿Cuál es tu placer chiquito de todos los días? Una siesta, un chocolate, lo que sea. Contame el de hoy: a qué hora fue y cómo estuvo. |  | extra | historia |  |
| G5 | ¿Y un gusto grande? ¿En qué te gusta darte el lujo de gastar tu plata? Contame la última vez que te diste ese gusto. |  | extra | historia |  |
| CI14 | Hasta acá lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquil{{o/a}}. |  | núcleo | cierre |  |

## Bloque 15 · Legado y cierre

| ID | Pregunta | Depende de | Parte | Clase | Sensible |
|---|---|---|---|---|---|
| LE1 | Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta. |  | núcleo | historia |  |
| LE2 | ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos mism{{o/a}} descifraste viviendo. |  | núcleo | historia |  |
| LE6 | Cuando la gente que te quiere piensa en vos, ¿qué te gustaría que se le venga a la cabeza? Una frase tuya, una imagen, una escena. |  | extra | historia |  |
| FU1 | ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves. |  | núcleo | historia |  |
| LE7 | Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese. |  | núcleo | historia |  |
| FO1 | Otra cosa, {{nombre}}. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Tomate el tiempo que necesites para buscarla: la pregunta que sigue te la mando cuando me llegue la foto o me digas algo. Y si no la encontrás, no pasa nada: el libro va igual, y la podés mandar más adelante. |  | núcleo | foto |  |
| LE9 | Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas. |  | núcleo | historia |  |
| LE8 | Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre. |  | núcleo | historia |  |
| FIN | Hasta acá llegamos, {{nombre}}. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo.«sino:FO1:  ‖  Y si te quedó alguna foto por mandar, mandámela por acá cuando la encuentres: entra igual.» Fue un gusto enorme escucharte. |  | núcleo | final |  |


## Botones

Los botones de respuesta de WhatsApp que van debajo de la pregunta (Naza, 30/09, después de las simulaciones; textos de Fable en [`simulaciones/textos-finales.md`](simulaciones/textos-finales.md)). Una fila por botón, en el orden en que se muestran. **Vale como:** `sí` = la pregunta cuenta como contestada que sí (se manda M30 solo y se espera el audio en la misma pregunta; en AMH no: es una pregunta de ubicación y la respuesta queda cerrada); `no` = un "no" corto (M25 arriba de lo que sigue; no van las que dependen con `si:`); `paso` = paso (M27 en una sensible). WhatsApp acepta hasta 3 botones por mensaje y hasta 20 letras por botón: el parser lo valida. La pregunta va entera en el mensaje, así se puede contestar tocando o en audio; si manda audio sin tocar, valen las reglas de respaldo (Reglas del flujo, 5).

| ID | Botón | Vale como |
|---|---|---|
| CA6 | Sí, tuve | sí |
| CA6 | No tuve hermanos | no |
| JU8 | Sí, me mudé | sí |
| JU8 | No, nunca me mudé | no |
| AM0 | Sí, hubo | sí |
| AM0 | No hubo | no |
| AMH | Sí, seguimos juntos | sí |
| AMH | Ya no está conmigo | no |
| AM3 | Sí | sí |
| AM3 | No llegamos a eso | no |
| AM9 | Prefiero no contarla | paso |
| AM21 | Sí, hubo otras | sí |
| AM21 | Fue la única | no |
| HI0 | Sí, tuve | sí |
| HI0 | No tuve hijos | no |
| HI8 | Sí, llegaron | sí |
| HI8 | No hay nietos | no |
| CA17 | Prefiero no contarla | paso |
| CA17 | No, nada así | no |
| AD15 | Prefiero no contarla | paso |
| AD15 | No, nada así | no |
| JU17 | Prefiero no contarla | paso |
| JU17 | No, nada así | no |
| TR11 | Prefiero no contarla | paso |
| TR11 | No, nada así | no |
| PE1 | Prefiero no contarla | paso |
| PE5 | Prefiero no contarla | paso |
| PE4 | Prefiero no contarla | paso |
| PE4 | No, nada así | no |
| CI1 | No, está todo | no |
| CI2 | No, está todo | no |
| CI3 | No, está todo | no |
| CI4 | No, está todo | no |
| CI5 | No, está todo | no |
| CI6 | No, está todo | no |
| CI7 | No, está todo | no |
| CI8 | No, está todo | no |
| CI9 | No, está todo | no |
| CI10 | No, está todo | no |
| CI11 | No, está todo | no |
| CI12 | No, está todo | no |
| CI13 | No, está todo | no |
| CI14 | No, está todo | no |
| FO1 | No tengo foto | no |

## Reglas del flujo

Todas salen de [`metodo-entrevista.md`](../metodo-entrevista.md) (secciones 20 a 25 y las últimas vueltas); el código las implementa en `fabrica/src/v3/entrevista/flujo.ts`.

1. **Arranque:** BIEN (bienvenida y cómo va, en un solo mensaje; M6 ya no se manda); después, la primera pregunta (Naza, 30/09).
2. **Una pregunta por vez.** Si la pregunta lleva botones (sección "Botones"), van debajo del mensaje; la primera vez en la entrevista que un mensaje lleva botones (CI1 en una vida completa), debajo va M31, una sola vez, en línea aparte y en cursiva, como M1 (Naza, 30/09, simulaciones). M1 va debajo, en línea aparte y en cursiva, **solo** en las 3 primeras preguntas que se mandan, en CA6, JU8, AM0, AM9, HI0 y HI8 y en las preguntas de historia del bloque 11 (AMH y AM21 no llevan M1). En el resto, la pregunta va sin esa línea. Nunca debajo de cierres, aviso, foto ni final (Naza, 30/09, después de leer la entrevista de corrido; antes iba debajo de todas las de historia).
3. **Audios:** los que llegan mientras la pregunta está abierta se suman a esa respuesta; la siguiente llega sola cuando pasan unos minutos sin audios nuevos. No hay botón [Siguiente] (§20, vuelta 2).
4. **Acuses:** después de cada respuesta, uno de M3 (rotan); después de una pregunta `sensible`, uno de M4 (o M25 si la contestó con un "no" corto; M27 si dijo "paso"); si lo que sigue es un cierre, LE9 o una sensible, en lugar de M3 va M26 ("Gracias, {{nombre}}."); después de PG1 y de AMH, siempre M26; delante de AM21, M26 en lugar de M3; si el acuse pegado lleva el nombre, la frase de entrada que va en el mismo mensaje se manda sin el nombre (y FO1 también: "Otra cosa. ¿Hay alguna foto…"); después de un cierre, M24 (o M25, neutro, si el cierre se contestó con un "no" corto o "paso"); después de LE9 y de LE8, nada (LE8 arranca sola y después de LE8 va directo FIN). M3, M21, M24, M25 y M26 van como **primera línea del mensaje que sigue** (la frase de entrada si hay, si no la pregunta); M4 va **solo**, en mensaje aparte (Naza, 30/09, ronda 2). Después de "paso" en una pregunta que no es cierre, M21. Si manda texto, M22; si el audio llega cortado, M23 (§22.3). **Desde las simulaciones (Naza, 30/09):** un "no" corto o un botón de "No" lleva M25 en **todas** las preguntas; "paso" lleva M21 en una común, M27 en una sensible (rotan; delante de algo que arranca con "Seguimos" o "Pasamos" no va M27.1 sino M27.2) y M25 en un cierre; un olvido lleva M28.1; un olvido a medias, M28.4 o M28.5 (rotan); al tercer olvido seguido va M29 en su lugar, una sola vez en toda la entrevista; un "ya te lo conté" corto lleva M25. M27, M28 y M29 van pegados, como M25. Después de tocar un botón de "Sí" va M30 solo y no va acuse; el audio que llega después lleva el acuse normal de esa pregunta.
5. **Qué dijo (reglas de respaldo, cuando contesta en audio en vez de tocar un botón; Naza, 30/09, simulaciones).** Si tocó un botón, manda el botón, aunque después mande audio. Si no:
   - **Paso:** tocar [Prefiero no contarla] (antes [Paso esta]); "paso" como primera palabra, sin tope de largo, salvo que siga "a", "por", "de", "que", "el", "la", "los", "las", "un", "una", "mucho", "tiempo" o "todo" ("paso a contarte…", "paso el río…"); o "paso" como última palabra de una respuesta de hasta 12 palabras; o una respuesta de hasta 12 palabras con una de estas frases sola, seguida de un signo o del final (admitiendo "eso", "esa", "de eso", "ahí" o "mejor" adelante): siguiente · otra · salteala · esa no · eso no · de eso no · prefiero no · mejor no; o con una negativa completa, aunque siga algo: no quiero hablar de eso · prefiero no hablar de eso · prefiero no contarlo · prefiero no contarla · eso me lo guardo · me lo guardo · dejémoslo ahí · mejor otra. Si la frase aparece pero la respuesta es larga, o sigue algo que cuenta ("Otra vez fuimos al río"), no es paso (Revisión del 30/09 (Naza, decisión A en las frases)).
   - **"Ya te lo conté":** hasta 15 palabras con "ya te lo conté", "ya te conté", "ya lo conté" o "ya te lo dije", si no es un "no" corto ("No tuve hijos, ya te lo conté" es un "no"). Cuenta como "sí" para las que dependen.
   - **AMH (Naza, 30/09, prueba en la página):** un "no" corto (hasta 40 palabras) o una respuesta que arranca con "ya no" o con una palabra de final (falleció, murió, enviudé, nos separamos, me separé, nos divorciamos, me divorcié, terminamos, cortamos) vale "no" (ya no está); "sí" vale sí. El botón [Sí, seguimos juntos] no lleva M30: cierra la respuesta.
   - **Olvido:** hasta 20 palabras, sin "pero" ni "aunque", que arrancan con "no me acuerdo", "no recuerdo", "no sé" (sin "si", "por", "cómo", "qué", "cuál", "dónde" ni "cuándo" después), "ni idea" o "no tengo idea"; o con "se me borró" en las primeras 8 palabras; o con "la memoria"/"la cabeza" junto a "me falla", "me está fallando", "se me borró" o "no me da" (Revisión del 30/09 (Naza, decisión A en las frases)). No es "no" ni "contó algo"; para las que dependen cuenta como "sí" (mejor una pregunta de más que un capítulo de menos).
   - **Ronda 2 (Naza, 30/09):** en los cierres y en LE9, "está todo", "es todo", "ya está" o "nada más" en las primeras 6 palabras es un "no", aunque no empiece con "no" y sin tope de largo ("Sí, está todo. Fue una vida plena"), salvo "pero/aunque" en las primeras 5. Una respuesta que arranca con una frase de olvido y sigue contando (más de 20 palabras o con "pero/aunque") es un **olvido a medias**: contó algo, lleva M28.4 y no suma ni corta la cuenta de M29. Una que arranca negándose con una frase de la lista y sigue larga **contó algo** y lleva M32. **Revisión de la ronda 2 (30/09):** la fórmula de cierre tiene que empezar en las primeras 4 palabras y cerrar la frase; si no arranca con "no", después quedan como mucho 6 palabras (o "lo que…" hasta 12 en total); con una señal de que agrega algo (agregar, sumar, me acordé, me acuerdo de, quiero contar, "ah, y") no es "no". El olvido es olvido si después de la frase quedan como mucho 6 palabras que no estén en la pregunta (desde la prueba de Naza en la página: "No recuerdo, la verdad, algún maestro o maestra que me haya marcado en la primaria" repite la pregunta y es olvido); si sigue contando, es olvido a medias (M28.4/M28.5). Para M32 la frase tiene que ser una negativa completa o ir seguida de un signo fuerte (punto, punto y coma, dos puntos, exclamación; no una coma), y nunca de "dijo / decía / me dijo" ("Otra, dijo mi mamá…" cuenta). M32.2 termina en "Seguimos.": delante de "Seguimos…" o "Pasamos…" va M32.1.
   - **"No" corto:** empieza con no / nunca / jamás / ninguno / nada / tampoco y tiene hasta 15 palabras; hasta 40 en los 14 cierres, en LE9, en las sensibles y en las 8 que abren tema. "Pero" o "aunque" en las primeras 5 palabras lo dan vuelta; en los cierres, nunca. No cuentan como "no" "nada que ver…", "nunca me voy a olvidar…", "no sabés…", "no te imaginás…", "no me lo vas a creer…" ni "no sé…"; en HI0, "propios", "crié/criamos…" o "como mi hijo" cuentan como "sí" (Revisión del 30/09 (Naza, decisión A en las frases)).
   - Si la pregunta que abre un tema recibe un "no" corto (o un botón de "No") o un "paso", las que dependen de ella no se mandan (§22.4). Antes (hasta el 30/09): menos de 15 palabras y "paso" solo como primera palabra de una respuesta de hasta 8.
6. **Entradas y cierres:** antes de la primera pregunta de cada bloque (la primera que se manda de ese bloque) va su frase de entrada EN, si tiene (Naza, 30/09). Además, todos los bloques del 1 al 14 terminan con su cierre (CI1 a CI14), siempre, en el núcleo. Después del cierre, M24 en todos (desde la ronda 2 no va M10: la entrada del bloque siguiente hace de pasaje). Antes solo iban CI2 a CI5 (Naza, 30/09).
7. **Bloque 11:** antes de la primera, el aviso AV11; después de cada una, M4 (§22.6).
8. **Núcleo y ronda extra:** primero el núcleo completo; después se ofrece la ronda extra. **El texto de esa oferta todavía no está redactado: a redactar con Fable, pendiente de Naza** (§24, "Tamaños: opinión de Fable"). Si la acepta, van las `extra` en el orden del banco.
9. **Preguntas de la familia:** todas al final de la entrevista, después de LE7 y antes de FO1 (orden del final: LE7 → familia → FO1 → LE9 → LE8 → FIN), cada una precedida por M15 ("Cierre del proceso, vuelta 3").
10. **Si deja de contestar:** a los pocos días M8 a la persona; a la semana M9 a quien regaló (§22.8).
11. **La ficha no decide qué se manda.** Solo la usan los textos (nombre, género, forma de trato, quién regaló). Si la ficha contradice una respuesta que abre un tema (hermanos, pareja, hijos, nietos, mudarse), se respeta la respuesta y queda como duda para el dashboard ("Cierre del proceso, vuelta 2 y 3"; §21).
12. **La foto (FO1):** después de FO1 no corre el reloj de minutos: se espera una foto o un audio, hasta 24 horas (si pasa, llega LE9 igual). El botón [No tengo foto] vale como "no" (M25 y sigue LE9). Una foto que llega en cualquier momento después de FO1 (aunque ya haya llegado LE9, LE8 o FIN) se guarda con FO1; los audios que llegan mientras FO1 está abierta son su descripción. Esto lo hace el entrevistador; el flujo avisa con `esperaFoto` (Naza, 30/09, simulaciones).
13. **Lo que no hay:** sin pausa (§20, vuelta 2), sin preguntas de datos (§21), sin tamaños (un solo producto: núcleo + ronda extra, §24-25), sin pedidos de fotos salvo FO1 (§20), cazador de escenas en pausa (§20).

## Dudas

Cosas ambiguas que encontré al armar este banco. No cambian ningún texto; las decide Naza.

1. **Orden del bloque 2.** El borrador anota "Orden propuesto en el doc: CA1, CA2, CA10, CA3, CA6/CA8, CA16", pero la tabla va CA1, CA2, CA3, CA4… Seguí el orden de la tabla (la regla fue "el orden del borrador es el de envío"). Con CA10 en Extra, el núcleo del bloque 2 queda igual en los dos órdenes salvo la posición de CA16.
2. **"Paso" en una pregunta que abre un tema.** Tomé "paso" como ni sí ni no: las que dependen con `si:` o `sino:` no se mandan. Con AM0 está bien (no entra al tema), pero con AM9 ("con decir 'paso' alcanza") quien tuvo un final y no lo quiere contar no recibe AM19 ni AM16 (ni AM13), y AM7 dice "repetía". ¿Va así, o "paso" en AM9 debería contar como que hubo un final?
3. **Dónde va la ronda extra.** LE1 ("Mirando toda tu vida hasta hoy"), LE8 ("Ahora sí, hablale a tu familia"), FO1 ("Una última cosa") y LE9 ("Llegamos al final") suponen que son lo último. Por eso el código trata al bloque 15 entero como tramo final: núcleo de los bloques 1 a 14 → oferta de la ronda extra → extra (bloques 1 a 14 y LE6) → bloque 15. Si Naza prefiere la oferta después de LE9, es un cambio chico en `flujo.ts`.
4. **Preguntas de la familia dentro del bloque 15.** "Antes de LE9" deja dos lugares: antes o después de FO1. Las puse antes de FO1 (después de LE8), para que "Una última cosa" siga siendo cierto.
5. **{{etapa}} no tiene texto aprobado.** M10 y CI2 lo usan. El único ejemplo escrito es "Terminamos tu infancia" (diseno-v3.md). El código recibe la etapa de afuera y, si no llega, deja `{{etapa}}` sin reemplazar.
6. **No hay CI15.** El bloque 15 no tiene fila de cierre: termina con FIN. Los cierres van de CI1 a CI14.
7. **IDs viejos con otro sentido.** Se mantuvieron los IDs del borrador, pero cinco existían en `banco-v3.md` con otra pregunta: AM13 (antes "un día de ustedes dos ahora"), AM16 (antes la puerta del bloque 6), LU6 (antes la puerta del bloque 9), AD12 (antes "qué ibas a hacer después del colegio"; hoy eso está en AD16) y JU9 (antes "el viaje y la llegada al lugar nuevo"). banco-descartadas.md ya anota AM16 y LU6; AM13, AD12 y JU9 no.
8. **HE2 no depende de CA6.** Le llega a todos y deja decir "no tuve hermanos" (así está en el borrador). Si CA6 fue un "no" corto igual se manda. **Resuelta (Naza, 30/09, prueba en la página): HE2 pasa al núcleo con `si:CA6`.**
9. **M1 debajo de qué.** La regla dice "debajo de cada pregunta de historia". Lo apliqué a la clase `historia`; los cierres, FO1, el aviso y el final van sin M1. ¿Los cierres también llevan M1? **Resuelta (Naza, 30/09): no.**
10. **Género "otro" sin forma de trato.** `{{o/a}}` y `{{padre/madre}}` usan la forma femenina si el género es "otro" y la ficha no dice cómo prefiere que le hablen (el mismo criterio que `seleccion.ts` viejo).
11. **Acuse después de un cierre.** Los bloques 2 a 5 cierran con M10; en los demás cierres el código manda un M3 común. No está escrito si va M3, M10 o nada. **Resuelta (Naza, 30/09): M10 en las etapas y M24 en los demás.**
12. **Pendientes que siguen abiertos en el borrador** y no tocan este banco: la regla del dashboard de FI7 (si dice algo delicado); la sugerencia de Fable de repartir las filosóficas entre bloques (no decidida: quedan en el bloque 13).

## Equivalencias de IDs

| ID del borrador | ID nuevo |
|---|---|
| Bienvenida | BIEN |
| M6 (después de la bienvenida) | M6 |
| OR7 (cierre) | CI1 |
| Cierre (A1) | CI2 |
| Cierre (bloque 3) | CI3 |
| Cierre (bloque 4) | CI4 |
| N3 (bl. 5) | JU22 |
| Cierre (bloque 5) | CI5 |
| AM9 (sensible) | AM9 |
| Cierre (bloque 6) | CI6 |
| N1 (bl. 7) | TR11 |
| Cierre (bloque 7) | CI7 |
| N1 (bl. 8) | HI12 |
| N2 (bl. 8) | HI13 |
| Cierre (bloque 8) | CI8 |
| PA3 (hincha) | PA3 |
| Cierre (bloque 9) | CI9 |
| Cierre (bloque 10) | CI10 |
| Aviso | AV11 |
| Cierre (bloque 11) | CI11 |
| HG4 (pandemia, fija) | HG4 |
| N1 (bl. 12) | HG7 |
| N3 (bl. 12) | HG8 |
| Cierre (bloque 12) | CI12 |
| FI1 (soledad) | FI1 |
| FI2 (el tiempo) | FI2 |
| FI3 (lo heredado) | FI3 |
| FI4 (lo que piensan los demás) | FI4 |
| FI6 (el futuro) | FI6 |
| FI7 (la política) | FI7 |
| Cierre (bloque 13) | CI13 |
| PA2 (momento solo) | PA2 |
| HO10 (vicios, liviana) | HO10 |
| G1 (música) | G1 |
| G2 (comer) | G2 |
| G3 (ver o leer) | G3 |
| G4 (placer chiquito) | G4 |
| G5 (gusto grande) | G5 |
| Cierre (bloque 14) | CI14 |
| FOTO | FO1 |
| Mensaje final | FIN |
| M3 (los 8 acuses) | M3.1 a M3.8, en el mismo orden |
| M4 (los 4 acuses sobrios) | M4.1 a M4.4, en el mismo orden |

Las demás filas vivas del borrador mantienen su ID. Las filas "sale" no están en este banco (ver [`banco-descartadas.md`](../banco-descartadas.md)).

## Cambios del 30/09 (Naza, después de armar este banco)
- M10 sin {{etapa}}: "Terminamos esta etapa, {{nombre}}. Pasamos a la siguiente." CI2 dice "tu infancia" (el texto aprobado del cierre A1).
- La ronda extra **por ahora no se ofrece**: después del núcleo de los bloques 1 a 14 va el bloque 15. Las preguntas "extra" quedan en el banco para más adelante (`ofrecerExtra` en el código).
- "Paso" en una pregunta que abre tema: se sigue a otro tema (como estaba).
- "Paso" en una pregunta que abre tema (CA6, JU8, AM0, AM9, AM16, HI0, HI8, AS1, HG1): no van las que dependen, y el cierre de ese bloque llega en el núcleo aunque sea extra (Naza, 30/09). _Más tarde el mismo día todos los cierres pasaron al núcleo: esta regla ya no hace falta (ver abajo)._
- Las dudas ficha-respuesta quedan solo en el dashboard (Naza, 30/09).
- Aprobados por Naza (30/09): M24.1-M24.4 (después del cierre de un bloque que no es etapa) y DD1-DD2 (dudas del dashboard, con {{tema}}: "tus hermanos", "el amor", "tus hijos", "tus nietos", "vivir en otro lugar").

## Cambios del 30/09, después de leer la entrevista de corrido (Naza)
Registro en [`correcciones-lectura.md`](correcciones-lectura.md).
- Los cierres de todos los bloques (CI1, CI6 a CI14) pasan al **núcleo**: llegan siempre, no solo después de un "paso". Después de cada uno, M24 (o M10 en las etapas).
- M1 solo en las 3 primeras preguntas, en las 6 que abren tema (CA6, JU8, AM0, AM9, HI0, HI8) y en las del bloque 11.
- Después de LE9, directo FIN (sin acuse).
- Aprobado después (30/09): las frases de entrada (EN2 a EN15, sección "Entradas de bloque"); el CI14 nuevo (antes: "Hasta acá lo de hoy. Ya te conozco un poco más: cómo son tus días y qué te gusta. Gracias por contármelo con tanta paciencia."); los M24 más cortos, sin frases de cierre que suenen a que terminó la entrevista (antes: "Gracias, {{nombre}}. Con eso cerramos acá. Pasamos a otra cosa." / "Anotado. Ya quedó guardado. Vamos con lo que sigue." / "Bien, {{nombre}}. Eso queda ahí, bien guardado. Cambiamos de tema." / "Gracias por eso. Damos vuelta la página y seguimos.").

## Cambios del 30/09, ronda 2 (Naza, después de que Fable leyó la lectura corrida como el narrador)
Registro en [`correcciones-lectura.md`](correcciones-lectura.md).
- M3, M21 y M24 van como primera línea del mensaje que sigue; M4 va solo.
- M10 sin uso: la entrada del bloque siguiente hace de pasaje. Después de cualquier cierre, M24 (más tarde el mismo día: M25 si el cierre se contestó con un "no" corto o "paso").
- CA17, AD15, JU17 y TR11 pasan a sensibles (acuse sobrio M4).
- Final: LE7 → preguntas de la familia → FO1 → LE9 → LE8 → FIN; después de LE8 no va acuse. FU1 pasa al bloque 15, antes de LE7. FI7 pasa al bloque 12, antes de CI12.
- CI11 sin su primera frase (antes: "Gracias por contarme esto; sé que no es fácil. Si hay otro momento difícil…").
- Aprobados después (30/09): los acuses neutros M25.1-M25.3 para cuando un cierre se contesta con un "no" corto o "paso" (redactados por Fable). La bienvenida y M6 en un solo mensaje: aprobada más tarde el mismo día (ver abajo).
- Bienvenida en un solo mensaje (Naza, 30/09): la opción B de Fable, sin "tomando unos mates" y sin el nombre de quien regala ("Una persona que te quiere mucho te regaló…"). M6 queda sin uso. Antes, BIEN: "Hola, {{nombre}}. Juntos vamos a escribir la historia de tu vida, y quiero que sea bien tuya. Te cuento cómo es esto, así vamos tranquilos: yo te pregunto cosas de tu vida, una por vez, y vos me las contás como se las contarías a alguien en la mesa. Si alguna pregunta no tiene que ver con lo que viviste, no pasa nada: me decís que no, o me contás lo que en realidad te tocó a vos, que eso es lo que quiero saber."

## Cambios del 30/09, ronda 3 (Naza, después de que Fable releyó la versión 4 como Rogelio)
Registro en [`correcciones-lectura.md`](correcciones-lectura.md).
- M26 nuevo, "Gracias, {{nombre}}.": en lugar de M3 cuando lo que sigue es un cierre o LE9 (antes quedaba "Anotado. Sigo con otra." y abajo "Con esto cerramos…").
- FO1 arranca con "Otra cosa, {{nombre}}." (antes: "Una última cosa, {{nombre}}."; después vienen LE9 y LE8).
- Una sensible contestada con un "no" corto o "paso" lleva el neutro M25, no el sobrio M4.
- Si el acuse pegado lleva el nombre, la frase de entrada del mismo mensaje va sin el nombre.
- M25.2 pasa de "Dale." a "Bien, seguimos."; delante de algo que arranca con "Seguimos" o "Pasamos" va M25.3 ("Bien, entonces.").
- No se tocan HI2b ni JU1/JU8 (plan B).

## Cambios del 30/09, ronda 4 (Naza, después de que Fable leyó la versión 6)
- CI14 sin el nombre (el acuse de antes, M26, ya lo dice). Antes: "Con esto cerramos lo de hoy, {{nombre}}, y ya te conozco un poco más…".
- Después de LE9 no va acuse: LE8 ("Ahora sí, hablale a tu familia…") arranca sola (antes quedaban dos mensajes seguidos que empezaban "Gracias, {{nombre}}.").

## Cambios del 30/09, ronda 4: bienvenida final (Naza)
BIEN, párrafos 2 y 3: la versión B de Fable (sin "eh", sin "mejor amigo", sin "nada", sin "dejalo ahí nomás"). Antes: "Funciona así: te mando una pregunta y vos me respondés en audio, como si se lo estuvieras contando a tu mejor amigo. Podés mandarme todos los audios que quieras. Y cuando termines de contar, no tenés que avisarme nada: cuando pasa un ratito sin que mandes nada, te llega sola la pregunta que sigue. / Si alguna pregunta no va con tu vida, no pasa nada: me decís que no, o me contás lo que en realidad te pasó a vos. Y sin apuro, eh. Esto lo hacemos al ritmo que vos quieras." M25.1 y M25.2 quedan los dos "Bien, seguimos." (Naza).

## Cambios del 30/09, después de las simulaciones (Naza)
Registro en [`simulaciones/hallazgos.md`](simulaciones/hallazgos.md) (decisiones de Naza) y los textos en [`simulaciones/textos-finales.md`](simulaciones/textos-finales.md), con los cambios de [`simulaciones/PLAN-codigo.md`](simulaciones/PLAN-codigo.md). La versión anterior de este banco: [`historial/banco-2026-09-30-antes-de-las-simulaciones.md`](historial/banco-2026-09-30-antes-de-las-simulaciones.md).
- **Botones** (sección nueva "Botones"): Sí/No en las 9 que abren tema (CA6, JU8, AM0, AM3, AM9, AM16, AM20, HI0, HI8; AM9 además [Paso esta]); [Paso esta] en CA17, AD15, JU17, TR11, PE1, PE5 y PE4; [No, está todo] en los 14 cierres; [No tengo foto] en FO1. Mensajes nuevos: M30 (después de tocar "Sí") y M31 (una vez, debajo del primer mensaje con botones).
- **Reglas de respaldo** para quien contesta en audio (Reglas del flujo, 5): "no" corto hasta 15 palabras (40 en cierres, LE9, sensibles y las que abren tema; antes: menos de 15 en todas); "paso" sin tope como primera palabra, como última en hasta 12, y la lista de frases; olvido; "ya te lo conté".
- **Acuses:** M26 antes de una sensible y siempre después de PG1; un "no" corto lleva M25 en todas; M27.1-M27.3 (se niega en una sensible), M28.1 (olvido), M29 (tercer olvido seguido, una vez). M28.2 y M28.3 en reserva, sin uso. M3.3, M3.6, M3.7 y M3.8 con texto nuevo (antes: "Anotado. Sigo con otra." / "Lo tengo. Vamos con otra." / "Listo, quedó guardado. Sigo." / "Escuchado. Vamos por la siguiente.").
- **Dependencias y orden:** AM4 y AM5 dependen de AM3 (antes de AM0); AM13 depende de AM3 (antes: `sino:AM9 o si:AM16`) y va después de AM6, antes de AM8; AM20 nueva (núcleo, `si:AM16`, después de AM16); HI8 depende de HI0; HI3, HS1 y HI6 dependen de HI2; HI2b sale del banco (a [`banco-descartadas.md`](../banco-descartadas.md), con el motivo).
- **Textos de preguntas:** CA6, CA16, AD5, JU8, JU12, AM0, AM1, AM3, AM4, AM13, AM19, AM16, AM14, PG1, HI0, HS1, HI8, TR5, HG4, GI1, GI2, GI9, HO2, PE1, PE4, CI1, FO1 y FIN (sin "y es bien tuyo", con la frase de la foto). Los textos anteriores están en el historial.
- **La foto:** después de FO1 se espera una foto o un audio sin reloj de minutos (Reglas del flujo, 12).

## Cambios del 30/09, ronda 2 de simulaciones (Naza)
Registro en [`simulaciones/hallazgos.md`](simulaciones/hallazgos.md), "Ronda 2 (30/09)"; el porqué en [`simulaciones/ronda-2/`](simulaciones/ronda-2/).
- En cierres y LE9, "está todo / es todo / ya está / nada más" al principio = "no" (Reglas del flujo, 5).
- Botón [No, nada así] (vale "no") en CA17, AD15, JU17, TR11 y PE4.
- AM16 y AM20 con texto nuevo. Antes: AM16 "Y más adelante, ¿hubo otro amor? Si hubo, contame del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado."; AM20 "Y entre la primera y esta última, ¿hubo otras historias que fueron en serio? …".
- AM19 depende de `si:AM9 y si:AM3` (antes `si:AM9`); AM16 de `si:AM9 o paso:AM9` (antes `si:AM9`). Notación nueva: ` y ` y `paso:X`.
- M27.3 sin "Perfecto" (antes: "Perfecto, {{nombre}}. No hace falta entrar ahí. Vamos con la que viene.").
- M32.1-M32.2 (se negó pero siguió contando) y M28.4 (olvido a medias), nuevos.
- FIN sin la frase de la foto si FO1 se contestó con [No tengo foto]. M26 delante de AM20.

## Cambios del 30/09, después de la prueba de Naza en la página (Naza)
Registro con todos los ANTES y DESPUÉS en [`simulaciones/textos-prueba-naza.md`](simulaciones/textos-prueba-naza.md); la decisión en [`simulaciones/hallazgos.md`](simulaciones/hallazgos.md), "Prueba de Naza en la página web (30/09)". La versión anterior de este banco: [`historial/banco-2026-09-30-antes-de-la-prueba-de-naza.md`](historial/banco-2026-09-30-antes-de-la-prueba-de-naza.md).
- Cierres: "Con esto cerramos…" pasa a "Hasta acá lo de…" (CI1, CI3, CI4, CI6 a CI10, CI13, CI14); CI3 y CI7 con texto nuevo.
- EN2 ("la gente que vivía con vos") y BIEN, párrafo 2 ("Cuando termines no hace falta que me avises…").
- El botón [Paso esta] pasa a [Prefiero no contarla] (vale paso) en CA17, AD15, JU17, TR11, PE1, PE5, PE4 y AM9.
- G1 al núcleo (bloque 14, después de CO1); HE2 al núcleo (bloque 10, después de AS1, `si:CA6`); FI6 a extra.
- HO11 nueva (una marca en el cuerpo con historia), núcleo, bloque 14, después de HO6 y antes de CO1 (Naza, 30/09). Iba a llamarse HO7, pero HO7 ya existió con otro sentido (la puerta vieja del bloque 14, en banco-descartadas.md).
- Salidas: CA3 (si el papá no estuvo), AD15 y JU17 ("decime 'ya te lo conté' y seguimos"), AM1 nuevo.
- Bloque 6 nuevo: AM0 con texto nuevo; AMH nueva ("¿esa persona sigue hoy a tu lado?", botones [Sí, seguimos juntos] [Ya no está conmigo], M26 siempre después, sin M30); AM9 con texto nuevo, `sino:AMH`, solo [Prefiero no contarla]; AM19 `sino:AMH y si:AM3`; AM21 nueva (las de antes, un momento de cada una); AM14 `sino:AM0`; AM7 «sino:AMH: repetía ‖ repite». AM16 y AM20 salen del banco (a [`../banco-descartadas.md`](../banco-descartadas.md)).
- Acuses: M4.4 "…Lo guardo con cuidado."; M28.5 nuevo (rota con M28.4); el olvido que solo repite la pregunta es olvido, no olvido a medias; FO1 sin el nombre si el acuse pegado ya lo dice.
