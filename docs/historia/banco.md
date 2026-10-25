# Vitácora de una historia · Banco (vigente)

Aprobado por Naza el 21 y el 22/10/2026 (las variantes de `padres` y `trabajo`, el 22/10). Lo redactó Fable. Se compiló tal cual desde [`banco-armado/`](banco-armado/) (parte común, preguntas por tema y mensajes fijos aprobados), sin cambiar ningún texto. Los mensajes que vienen de V3 están copiados palabra por palabra de [`docs/v3/entrevista/banco.md`](../v3/entrevista/banco.md), con los mismos IDs. Es la **fuente de verdad** para el código (`fabrica/src/historia/entrevista/`). Los archivos de es-ES y catalán (`idiomas/`) llevan solo los textos por ID, como en V3.

## Notación

- **Formato:** el de `docs/v3/entrevista/banco.md`. Las tablas de preguntas suman dos columnas **al final**:
  - `Tema` = `comun` (le llega a todos los temas) o la clave del tema (`mudanza`, `negocio`, `enfermedad`, `conocimos`, `padres`, `trabajo`, `otra`, las de [`temas.md`](temas.md));
  - `Reemplaza` = vacío, o el ID de la común que esa fila reemplaza en su tema (por ejemplo `HC8-Q` reemplaza a `HC8` en `conocimos`).
- **Orden:** el de las tablas es el orden de envío. Las preguntas de un tema solo le llegan a ese tema. Las variantes van al final de las tablas, pero se mandan en el lugar de la común que reemplazan.
- **Depende de:** vacío en todas (le llega a todos los de ese tema). **Parte:** todas `núcleo` (no hay ronda extra).
- **Clase:** `historia`, y `cierre` en HC10 (la última pregunta). Los mensajes que no son preguntas (FOTO-H, FIN-H) van en "Mensajes fijos".
- **Sensible:** `sí` = después de la respuesta va un acuse sobrio (M4) en vez de M3.
- **Saltos de línea:** `<br>` dentro de una celda es un salto de línea en el mensaje (`<br><br>` = párrafo nuevo).
- **Marcas dentro del texto:** `{{nombre}}`; `{{historia}}` (la historia elegida, en segunda persona y en minúscula: «sobre cuando te fuiste a vivir lejos», «sobre la llegada de tu primer hijo»; sale de la tabla «En la pregunta» de [`temas.md`](temas.md), Naza, 23/10); `{{quien_regala}}`; `{{pregunta}}` (la pregunta que dejó escrita quien regala); `{{o/a}}` según el género. En las plantillas de Meta van `{{1}}`, `{{2}}` y `{{3}}`. **Variante según una respuesta:** `«sino:X: a ‖ b»` = si la respuesta a X fue un "no" corto (o el botón de "No") va *a*; si no, va *b*.

## Arranque

Las tres bienvenidas son plantillas de Meta (el primer mensaje lo manda el negocio). Después del SÍ siguen TEMA-ABIERTO (solo con tema abierto) y COMO.

| ID | Cuándo | Texto | Notas |
|---|---|---|---|
| BIEN-H | Plantilla Meta, para uno mismo. {{1}} cómo le dicen, {{2}} la historia | Hola, {{1}}, ¿cómo estás? Soy quien te va a entrevistar para armar tu libro sobre {{2}}. Lo hacemos acá, por WhatsApp, tranquilos. Te mando una pregunta por vez y vos me la contás en audio, como si me lo estuvieras contando en persona. ¿Arrancamos? Contestame SÍ. Con eso me das permiso para guardar lo que me mandes. | Ejemplo para Meta: {{1}} = Marta, {{2}} = irse a vivir lejos |
| BIEN-HR | Plantilla Meta, regalo con tema. {{1}} cómo le dicen, {{2}} quién regala, {{3}} la historia | Hola, {{1}}, ¿cómo estás? Te escribo porque {{2}} te hizo un regalo. Es un libro sobre {{3}}, contado por vos, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos. Te mando una pregunta por vez y vos me la contás en audio, como si me lo estuvieras contando en persona. ¿Arrancamos? Contestame SÍ. Con eso me das permiso para guardar lo que me mandes. | Ejemplo para Meta: {{1}} = Marta, {{2}} = Pablo, {{3}} = el primer hijo |
| BIEN-HR-A | Plantilla Meta, regalo con tema abierto. {{1}}, {{2}} | Hola, {{1}}, ¿cómo estás? Te escribo porque {{2}} te hizo un regalo. Es un libro sobre una historia de tu vida, la que vos elijas, contado por vos. Yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos. Te mando una pregunta por vez y vos me la contás en audio, como si me lo estuvieras contando en persona. ¿Arrancamos? Contestame SÍ. Con eso me das permiso para guardar lo que me mandes. | Ejemplo para Meta: {{1}} = Marta, {{2}} = Pablo |
| TEMA-ABIERTO | Después del SÍ, si el tema quedó abierto | Dale, {{nombre}}. {{quien_regala}} quiso que la historia la elijas vos. Pensá en un capítulo de tu vida que ya pasó y que valga un libro entero. Puede ser cualquier cosa que te haya marcado. Contame cuál es, en audio o escrito, con una frase alcanza. Si no sabés por dónde arrancar, decímelo y te tiro algunas ideas. |  |
| TEMA-LISTA | Si duda en TEMA-ABIERTO | Te dejo algunas ideas, {{nombre}}. Son solo para ayudarte a pensar.<br><br>Irse a vivir lejos. Emigrar, cambiar de ciudad, empezar de cero.<br>El negocio propio. Abrir el local, los primeros clientes, sacarlo adelante.<br>Salir de una enfermedad. El diagnóstico, el tratamiento, quién estuvo al lado.<br>Cómo se conocieron. El primer encuentro, la primera cita, el casamiento.<br>El primer hijo. La noticia, el nacimiento, las primeras noches sin dormir.<br>El trabajo de tu vida. El primer sueldo, el oficio, los compañeros de siempre.<br>Otra historia. Un viaje, el club, una amistad de toda la vida.<br><br>Contame cuál te tienta, o una que no esté acá. Es tu libro. |  |
| TEMA-OK | Primera línea de COMO si el tema vino de TEMA-ABIERTO | Queda anotado, {{nombre}}. De eso va a ser tu libro. |  |
| COMO | Después del SÍ (o de TEMA-OK); enseguida HC1 | Funciona así. Son unas quince preguntas sobre esa historia, de a una. Te mando una, vos me la contás en audio cuando tengas un rato, como si me lo estuvieras contando en persona, y cuando pasan unos minutos sin audios nuevos te mando la que sigue. Mandame todos los audios que quieras. Si alguna pregunta no va con vos, me decís paso y seguimos con otra. Cuando terminamos, con todo eso se escribe el libro. Sin apuro, esto lo hacemos al ritmo que vos quieras. Ahí va la primera. |  |

## Mensajes fijos

Los nuevos de historia van primero. Después van los de V3, con la fila copiada tal cual (su "Cuándo" nombra preguntas de V3; cómo se usan acá lo dicen las "Reglas del flujo").

| ID | Cuándo | Texto |
|---|---|---|
| PR-H1 | 1.ª pregunta del que regala (después de HC9, antes de HC10) | Esta te la manda {{quien_regala}}, {{nombre}}. La dejó escrita para vos y te la paso tal cual.<br><br>«{{pregunta}}»<br><br>Contale a {{quien_regala}}, aunque el audio me llegue a mí. |
| PR-H2 | 2.ª | Otra de {{quien_regala}}, que quiso saber esto.<br><br>«{{pregunta}}»<br><br>Contestale como si estuviera ahí con vos. |
| PR-H3 | 3.ª | La última de {{quien_regala}}.<br><br>«{{pregunta}}»<br><br>Hablale a {{quien_regala}}, aunque llegue por acá. |
| PF-H1 | 1.ª pregunta sumada desde el panel (después de las de quien regala, antes de HC10) | Una pregunta más, {{nombre}}, que quedó anotada para vos. Te la paso tal cual.<br><br>«{{pregunta}}»<br><br>Contámela en audio, como las demás. |
| PF-H2 | 2.ª y siguientes sumadas desde el panel | Otra que quedó anotada para vos.<br><br>«{{pregunta}}»<br><br>Como siempre, en audio. |
| FOTO-H | Después de la última del tema, antes de HC5; espera fotos o audio hasta 24 h; botón [No tengo fotos] + M31 | Otra cosa, {{nombre}}. ¿Tenés fotos de esa época? Buscá entre tres y diez, en el celular o en algún cajón, y mandámelas por acá. Si son de papel, sacales una foto con el celular. Después, si querés, contame en un audio qué se ve y quiénes están. Tomate el tiempo que necesites para buscarlas. La pregunta que sigue te la mando cuando me llegue algo o me digas que no tenés. Si no las encontrás ahora, no pasa nada, el libro va igual y las podés mandar más adelante. |
| FIN-H | Después de HC10 | Hasta acá llegamos, {{nombre}}. Gracias por cada audio y por la confianza de contarme esta historia así, de cerca. Con todo lo que me diste se escribe el libro. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo.«sino:FOTO-H:  ‖  Si te quedó alguna foto de esa época por mandar, mandámela por acá cuando la encuentres, entra igual.» Fue un gusto enorme escucharte. |
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
| M21 | Después de "paso" en una pregunta común (en una sensible va M27; en un cierre, M25). Va como primera línea del mensaje que sigue | Dale, la salteamos. Vamos con otra. |
| M22 | Si manda texto | Lo leí, gracias. Si podés, contámelo también en audio: así queda tu voz y tu manera de decirlo, que es lo que va al libro. Y si te resulta más cómodo escribir, escribí nomás. |
| M23 | Audio cortado | Se me cortó el audio o no llegó bien, {{nombre}}. ¿Me lo mandás de nuevo cuando puedas? Sin apuro. |
| M25.1 | Después de un "no" corto o de un botón de "No" en cualquier pregunta, de un "paso" en un cierre y de un "ya te lo conté" corto (Naza, 30/09, simulaciones); rotan. Primera línea del mensaje que sigue; si ese mensaje arranca con "Seguimos" o "Pasamos", va M25.3 | Bien, seguimos. |
| M25.2 | Después de un "no" corto o de un botón de "No" en cualquier pregunta, de un "paso" en un cierre y de un "ya te lo conté" corto (Naza, 30/09, simulaciones); rotan. Primera línea del mensaje que sigue; si ese mensaje arranca con "Seguimos" o "Pasamos", va M25.3 | Bien, seguimos. |
| M25.3 | Después de un "no" corto o de un botón de "No" en cualquier pregunta, de un "paso" en un cierre y de un "ya te lo conté" corto (Naza, 30/09, simulaciones); rotan. Primera línea del mensaje que sigue; si ese mensaje arranca con "Seguimos" o "Pasamos", va M25.3 | Bien, entonces. |
| M26 | En lugar del acuse común (M3) cuando lo que sigue es un cierre de bloque, LE9, AM21 o una sensible (CA17, AD15, JU17, TR11, AM9, PE1, PE5, PE4): no anuncia "otra pregunta" antes de "Hasta acá lo de…"; y siempre después de PG1 y de AMH (Naza, 30/09, simulaciones y prueba en la página) | Gracias, {{nombre}}. |
| M27.1 | Se niega en una sensible (toca [Prefiero no contarla], dice "paso" o una frase de la lista); rotan; primera línea del mensaje que sigue (hasta el 30/09 delante de "Seguimos" o "Pasamos" iba M27.2: M27.1 terminaba en "seguimos por otro lado") | Está bien, {{nombre}}. Lo dejamos ahí. |
| M27.2 | Se niega en una sensible (toca [Prefiero no contarla], dice "paso" o una frase de la lista); rotan; primera línea del mensaje que sigue | Claro, sin problema. Vamos con otra. |
| M27.3 | Se niega en una sensible (toca [Prefiero no contarla], dice "paso" o una frase de la lista); rotan; primera línea del mensaje que sigue | Entiendo, {{nombre}}. No hace falta entrar ahí. Vamos con la que viene. |
| M28.1 | Después de un olvido ("no me acuerdo", "no sé"…), en lugar de M3 o M4; primera línea del mensaje que sigue. Es el único de olvido en uso (Naza, 30/09) | No pasa nada, {{nombre}}. Vamos con otra. |
| M28.4 | Olvido a medias: la respuesta arranca con una frase de olvido y sigue contando (más de 20 palabras o con "pero/aunque"); en lugar de M3 o M4; rota con M28.5 (nunca dos iguales seguidos); primera línea del mensaje que sigue; delante de un cierre o de LE9 va M26. No suma al contador de M29 (Naza, 30/09, ronda 2) | Con ese pedacito me alcanza, {{nombre}}. Gracias. |
| M28.5 | Olvido a medias, rota con M28.4 (Naza, 30/09, prueba en la página: "Con ese pedacito" salió dos veces seguidas); mismas reglas que M28.4 | Con eso me alcanza, gracias. Vamos con otra. |
| M29 | Una sola vez en toda la entrevista, al tercer olvido seguido, en lugar de M28 y arriba de la pregunta que sigue (primera línea del mensaje que sigue) | Una cosa, {{nombre}}: no te hagas problema si algo no te acordás. Para el libro alcanza con lo que sí tenés. Y si de alguna te acordás a medias, contame ese pedacito nomás: un olor, una cara, cómo era en general. Eso también es tu historia. |
| M31 | Una sola vez: debajo del primer mensaje de la entrevista que lleva botones (CI1 en una vida completa), en línea aparte y en cursiva, como M1 | _Podés tocar el botón de abajo, o contestarme en audio como siempre._ |
| M32.1 | Se negó pero siguió contando: la respuesta arranca con una frase de la lista del paso y sigue larga (no es paso); rotan; en lugar de M3 o M4; primera línea del mensaje que sigue; delante de un cierre o de LE9 va M26 (Naza, 30/09, ronda 2) | Con lo que me dijiste alcanza, {{nombre}}. Lo demás queda tuyo. Vamos con otra. |
| M32.2 | Se negó pero siguió contando: la respuesta arranca con una frase de la lista del paso y sigue larga (no es paso); rotan; en lugar de M3 o M4; primera línea del mensaje que sigue; delante de un cierre o de LE9 va M26 (Naza, 30/09, ronda 2) | Está bien. Lo que me contaste queda, y lo que no, no hace falta. Seguimos. |

## Bloque 1 · El antes

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC1 | Empecemos por el antes, {{nombre}}. Este libro es sobre {{historia}}, pero antes de que empezara vos ya tenías una vida andando. Contame un día común de esa época, de poco antes de que pasara todo esto. Dónde vivías, en qué andabas, quién estaba cerca. |  | núcleo | historia |  | comun |  |
| HC2 | ¿Cómo eras vos en ese entonces? Contame algo que te pasó en esa época y que muestra cómo eras, aunque sea una pavada. Un enojo, una ocurrencia, una vez que te mandaste algo. |  | núcleo | historia |  | comun |  |

## Bloque 2 · El comienzo

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC3 | Ahora vamos a cómo empezó. Hubo un momento en que todo esto dejó de ser una idea y se volvió real. Una charla, una noticia, una decisión que tomaste. Contame ese momento, dónde estabas y qué pasó. |  | núcleo | historia |  | comun |  |
| HC4 | Contame el primer día. El día que todo esto empezó de verdad, desde que te levantaste hasta que te fuiste a dormir. Qué hiciste, con quién hablaste, qué te pasaba por dentro. Si es el mismo día de recién, contame cómo siguió. |  | núcleo | historia |  | comun |  |

## Bloque 3 · Lo propio del tema

De 4 a 5 preguntas por tema, agrupadas por tema. A cada narrador le llegan solo las de su tema. Después de la última va FOTO-H.

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HM1 | Contame la valija. El día que la armaste, qué entró, qué quedó afuera y qué fue lo último que metiste. Si hubo algo que no entraba y te lo llevaste igual, contame qué era. |  | núcleo | historia |  | mudanza |  |
| HM2 | Contame la despedida. El último abrazo antes de irte, en la puerta de tu casa, en la terminal o en el aeropuerto. Quién estaba, qué te dijeron y qué fue lo último que viste al irte. |  | núcleo | historia |  | mudanza |  |
| HM3 | Contame la primera casa. El primer lugar donde dormiste cuando llegaste, aunque fuera una pieza prestada. Cómo era, qué tenía, qué le faltaba y qué hiciste para que fuera un poco tuya. |  | núcleo | historia |  | mudanza |  |
| HM4 | Contame la primera vez que no entendiste algo. Una palabra, una costumbre, una manera de saludar o de comer que allá era normal y para vos no. Qué pasó, quién estaba y cómo saliste del paso. |  | núcleo | historia |  | mudanza |  |
| HM5 | ¿Qué era lo que más extrañabas? Contame un día en que lo sentiste fuerte. Un olor, una comida, un llamado a casa, una fecha que allá no se festejaba. Dónde estabas y qué hiciste con eso. |  | núcleo | historia |  | mudanza |  |
| HN1 | Contame el lugar. La primera vez que entraste al local, al taller o a donde fuera que iba a funcionar, cuando todavía estaba vacío. Qué viste, qué olía, qué te imaginaste ahí adentro. |  | núcleo | historia |  | negocio |  |
| HN2 | ¿De dónde salió la plata para empezar? Contame el día en que conseguiste lo que faltaba, o el día en que decidiste poner lo que tenías. Con quién hablaste, qué firmaste, con qué cara volviste a tu casa. |  | núcleo | historia |  | negocio |  |
| HN3 | Contame el primer cliente. La primera vez que alguien pagó por lo tuyo. Quién era, qué le vendiste, qué hiciste con esa primera plata. |  | núcleo | historia |  | negocio |  |
| HN4 | Contame un día cuando el negocio ya andaba. Un día cualquiera, de esos que tuviste mil. A qué hora abrías, quién entraba, qué se vendía, quién te daba una mano, a qué hora cerrabas. |  | núcleo | historia |  | negocio |  |
| HE1 | Contame de la gente que te atendió. Un médico, una enfermera, alguien del hospital que te trató de una manera que no te olvidaste, para bien o para mal. Contame una vez concreta con esa persona. |  | núcleo | historia | sí | enfermedad |  |
| HE2 | ¿Cómo era un día de tratamiento, {{nombre}}? Desde que salías de tu casa hasta que volvías. El viaje, la espera, lo que te hacían, cómo volvías. Si preferís no entrar, con un paso alcanza. |  | núcleo | historia | sí | enfermedad |  |
| HE3 | ¿Cómo se lo contaste a los demás? Elegí a una persona, la primera que lo supo o la que más te costó. Contame esa charla, dónde fue y qué te contestó. Si preferís no entrar, con un paso alcanza. |  | núcleo | historia | sí | enfermedad |  |
| HE4 | Mientras tanto, la vida seguía. Contame un momento de esa época en que te olvidaste un rato de todo esto. Una risa, una comida, una salida, algo chiquito que te sacó de ahí. |  | núcleo | historia |  | enfermedad |  |
| HQ1 | Contame cómo era esa persona cuando la conociste. Qué te llamó la atención primero, la voz, la risa, una manera de hacer algo. Contame una vez de esos primeros tiempos en que la miraste y pensaste algo que no le dijiste. |  | núcleo | historia |  | conocimos |  |
| HQ2 | Contame la primera vez que salieron. A dónde fueron, cómo te preparaste, de qué hablaron y cómo terminó esa tarde o esa noche. |  | núcleo | historia |  | conocimos |  |
| HQ3 | Contame el día en que conoció a tu familia, o vos a la suya. Quién abrió la puerta, qué se dijo en la mesa, qué te dijeron después, cuando ya se había ido. |  | núcleo | historia |  | conocimos |  |
| HQ4 | Hubo un momento en que dejaron de ser dos que salían y pasaron a ser una pareja de verdad. Una propuesta, una charla, una mudanza, un casamiento. Contame ese día, dónde estaban y qué se dijeron. |  | núcleo | historia |  | conocimos |  |
| HQ5 | Contame algo que hacían siempre, los dos solos, en esa época. Un café, una caminata, un programa de radio, una manera de despedirse. Contame una de esas veces como si fuera hoy. |  | núcleo | historia |  | conocimos |  |
| HP1 | Contame la espera. El tiempo antes de que llegara, cómo preparaste la casa, qué compraste o qué te prestaron, qué te daba vueltas en la cabeza de noche. |  | núcleo | historia |  | padres |  |
| HP2 | Contame del nombre. Quién lo propuso, en qué charla quedó decidido, qué otros quedaron en el camino. Si el nombre ya venía puesto, contame qué te pasó cuando lo escuchaste por primera vez. |  | núcleo | historia |  | padres |  |
| HP3 | Contame la primera noche en tu casa, cuando se fueron las visitas y quedaron solos. Qué hiciste, cuánto dormiste, qué pensabas a las tres de la mañana. |  | núcleo | historia |  | padres |  |
| HP4 | Contame un día entero de esos primeros tiempos, de los que se repetían. A qué hora empezaba, quién hacía qué, en qué momento te sentabas un rato, cómo terminaba. |  | núcleo | historia |  | padres |  |
| HT1 | Contame qué hacías, con las manos o con la cabeza. Elegí una tarea de las de todos los días y contámela paso a paso, como si me la estuvieras enseñando. |  | núcleo | historia |  | trabajo |  |
| HT2 | ¿Quién te enseñó? Un jefe, un compañero de años, alguien que te tuvo paciencia. Contame una vez en que te corrigió algo o te mostró cómo se hacía de verdad. |  | núcleo | historia |  | trabajo |  |
| HT3 | Contame de los compañeros. Un almuerzo, un mate o un café en el descanso, un chiste que se repetía todos los días. Contame una de esas veces, con nombres, como si estuviéramos ahí. |  | núcleo | historia |  | trabajo |  |
| HT4 | Contame el día que cobraste el primer sueldo. Cómo te lo dieron, qué hiciste con esa plata, a quién se lo contaste primero. |  | núcleo | historia |  | trabajo |  |
| HT5 | Contame una vez que te salió algo muy bien. Un trabajo terminado, un problema que nadie podía resolver y vos sí, un día en que te felicitaron. Dónde estabas y quién lo vio. |  | núcleo | historia |  | trabajo |  |
| HO1 | Llevame al lugar donde pasaba todo esto. Elegí un rincón y contámelo como si me estuvieras mostrando una foto. Qué se veía, qué se escuchaba, qué olor tenía. |  | núcleo | historia |  | otra |  |
| HO2 | ¿Quiénes estaban? Presentame a la gente de esta historia con sus nombres. Elegí a una persona y contame una vez con ella que la muestre tal cual era. |  | núcleo | historia |  | otra |  |
| HO3 | Contame un día de esos que se repetían. Desde la mañana hasta la noche, lo que se hacía siempre, lo que nunca faltaba, lo que vos esperabas de ese día. |  | núcleo | historia |  | otra |  |
| HO4 | Pensá en una cosa de esa época. Una foto, una camiseta, una carta, una herramienta, algo que guardaste o que se perdió. Contame cómo llegó a tus manos y qué pasó con eso. |  | núcleo | historia |  | otra |  |
| HO5 | Hay una historia de esa época que contás siempre, la que sale en las mesas. Contámela entera, con todos los detalles que ya te sabés de memoria. |  | núcleo | historia |  | otra |  |

## Bloque 4 · Lo más difícil

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC5 | Ahora vamos a lo más difícil, {{nombre}}. En toda historia hay un momento en que uno piensa que no va a poder. Contame cuál fue el tuyo, qué pasó ese día y qué hiciste. Si preferís no entrar, con un paso alcanza. |  | núcleo | historia | sí | comun |  |
| HC6 | En ese momento tan duro, ¿quién estuvo? Contame una vez concreta en que alguien te dio una mano o te dijo algo que te quedó. Si lo pasaste sol{{o/a}}, eso también es parte de la historia, contámelo. |  | núcleo | historia | sí | comun |  |

## Bloque 5 · El giro

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC7 | ¿Cuándo empezó a cambiar? Hubo un día, o un momento chiquito, en que sentiste que la cosa empezaba a darse vuelta. Contame ese momento, dónde estabas y qué te hizo pensar que ahora sí iba para adelante. |  | núcleo | historia |  | comun |  |

## Bloque 6 · El después

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC8 | Contame cómo terminó esta historia. El día en que sentiste que ya había pasado, que estabas del otro lado. Dónde estabas, con quién, qué hiciste ese día. |  | núcleo | historia |  | comun |  |
| HC9 | ¿Qué te dejó todo esto? Contame una vez, ya con todo esto pasado, en que te diste cuenta de que algo en vos había cambiado. Qué estabas haciendo y qué pensaste. |  | núcleo | historia |  | comun |  |

## Bloque 7 · El cierre

Antes de HC10 van las preguntas de quien regala (PR-H1 a PR-H3), si dejó alguna, y después las sumadas desde el panel (PF-H1 la primera, PF-H2 las siguientes; Naza, 23/10).

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC10 | Ya llegamos al final, {{nombre}}. Imaginate que tenés enfrente a quien eras antes de todo esto, el día antes de que empezara. ¿Qué le dirías? Hablale como si te estuviera escuchando, sin apuro. |  | núcleo | cierre |  | comun |  |

## Bloque 8 · Variantes

Se mandan en el lugar de la común que reemplazan. HC5-Q, HC8-Q y HC9-Q son solo para `conocimos`; HC8-P y HC9-P, para `padres`; HC8-T y HC9-T, para `trabajo`. **HC1-A reemplaza a HC1 solo cuando el tema quedó abierto** (`estado.temaAbierto`: el narrador eligió su historia en TEMA-ABIERTO), en cualquier tema; con tema elegido en la compra va HC1. **También con `otra`** (Naza, 23/10): HC1 nombraría lo que escribieron con sus palabras, que suele venir en primera persona. Eso lo decide el código, no la columna `Tema`.

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC5-Q | Ahora vamos a lo más difícil, {{nombre}}. En toda historia de dos hay un momento en que uno piensa que ahí se termina. Contame cuál fue el de ustedes, qué pasó ese día y qué hiciste. Si preferís no entrar, con un paso alcanza. |  | núcleo | historia | sí | conocimos | HC5 |
| HC8-Q | Contame cómo siguió esta historia después de esos primeros tiempos. Elegí un día de mucho después, cuando ya sabías lo que esa persona era para vos. Dónde estaban, qué hacían, qué se dijeron. |  | núcleo | historia | sí | conocimos | HC8 |
| HC9-Q | ¿Qué te dejó esa persona? Contame una vez en que te diste cuenta de que algo en vos había cambiado por haberla conocido. Qué estabas haciendo y qué pensaste. |  | núcleo | historia |  | conocimos | HC9 |
| HC8-P | Contame cómo terminaron esos primeros tiempos. El día en que sentiste que ya sabías ser mamá o papá, que te salía solo, sin tener que pensarlo. Dónde estabas, qué estabas haciendo, quién estaba con vos. |  | núcleo | historia |  | padres | HC8 |
| HC9-P | ¿En qué te cambió ser mamá o papá? Contame una vez, cuando ya habían pasado esos primeros tiempos, en que te diste cuenta de que algo en vos era distinto. Qué estabas haciendo y qué pensaste. |  | núcleo | historia |  | padres | HC9 |
| HC8-T | Contame el último día, si lo hubo. El de la jubilación, el cierre, el día que te fuiste o te dijeron que no seguías. Qué hiciste al salir y cómo llegaste a tu casa. Si todavía seguís, contame cómo es un día de ahora al lado de aquellos. |  | núcleo | historia | sí | trabajo | HC8 |
| HC9-T | ¿Qué te dejó ese trabajo, aparte del sueldo? Contame una vez, fuera del trabajo, en que te diste cuenta de que algo tuyo venía de ahí. Una manera de hacer las cosas, de tratar a la gente, de aguantar. Qué estabas haciendo y qué pensaste. |  | núcleo | historia |  | trabajo | HC9 |
| HC1-A | Empecemos por el antes, {{nombre}}. Antes de que empezara esta historia que elegiste, vos ya tenías una vida andando. Contame un día común de esa época, de poco antes de que pasara todo esto. Dónde vivías, en qué andabas, quién estaba cerca. |  | núcleo | historia |  | comun | HC1 |

## Reglas del flujo

Salen del diseño ([`../superpowers/specs/2026-10-21-vitacora-de-una-historia-design.md`](../superpowers/specs/2026-10-21-vitacora-de-una-historia-design.md) §4) y de las "Reglas del flujo" de V3, que valen acá salvo lo que se dice abajo.

1. **Arranque:** la plantilla de bienvenida (BIEN-H si es para uno mismo, BIEN-HR si es regalo con tema, BIEN-HR-A si es regalo con tema abierto). Contesta SÍ (con eso da permiso para guardar lo que mande).
2. **Tema abierto:** si el tema quedó abierto, después del SÍ va TEMA-ABIERTO. Si duda o pide ideas, va TEMA-LISTA y se vuelve a esperar. Cuando dice cuál, queda anotado (`estado.temaAbierto`, con su tema y sus palabras) y COMO arranca con TEMA-OK como primera línea. Si el tema vino de la compra, después del SÍ va COMO directo.
3. **Orden:** COMO → HC1 (o HC1-A con tema abierto) → HC2 → HC3 → HC4 → las preguntas de su tema, en el orden de la tabla → **FOTO-H** → HC5 → HC6 → HC7 → HC8 → HC9 → **PR-H1, PR-H2, PR-H3** (las que haya dejado quien regala, en ese orden) → **PF-H1, PF-H2…** (las sumadas desde el panel, en el orden en que se sumaron) → HC10 → **FIN-H**.
4. **Variantes por tema:** una fila con `Reemplaza = X` ocupa el lugar de X en su tema, y X no se manda. En `conocimos` van HC5-Q, HC8-Q y HC9-Q en lugar de HC5, HC8 y HC9. En `padres`, HC8-P y HC9-P en lugar de HC8 y HC9. En `trabajo`, HC8-T y HC9-T en lugar de HC8 y HC9. HC1-A reemplaza a HC1 con tema abierto (regla 2) y con `otra` (Naza, 23/10).
5. **M1** va debajo, en línea aparte y en cursiva, en las 3 primeras preguntas: HC1 (o HC1-A), HC2 y HC3. En el resto, no.
6. **La foto (FOTO-H):** va después de la última pregunta del tema y antes de HC5, como FO1 en V3. Lleva el botón [No tengo fotos], que vale como "no", y debajo M31 (es el primer mensaje con botones). No corre el reloj de minutos: se espera una foto o un audio hasta 24 horas (si pasa, llega HC5 igual). Las fotos que lleguen después, en cualquier momento, se guardan con FOTO-H. FIN-H usa `«sino:FOTO-H: … ‖ …»`: sin la frase de la foto si contestó [No tengo fotos].
7. **Preguntas de quien regala:** PR-H1, PR-H2 y PR-H3 (la primera, la segunda y la tercera que dejó escritas) van después de HC9 y antes de HC10. Se suman a las de la tabla. Reemplazan a M15 de V3. Después van las que se sumaron desde el panel (cualquiera, también quien se compró el libro para sí): PF-H1 presenta la primera y PF-H2 cada una de las siguientes, sin nombrar a nadie, porque el bot no sabe quién la escribió (Naza, 23/10). Las que se suman cuando HC10 ya salió no llegan.
8. **Acuses:** como en V3. Después de cada respuesta, uno de M3 (rotan); después de una sensible (HC5, HC6, HE1, HE2, HE3, HC5-Q, HC8-Q, HC8-T), uno de M4, solo, en mensaje aparte (o M25 con un "no" corto, M27 con "paso"). Delante de una sensible o de HC10, M26 en lugar de M3. "Paso" en una común, M21. Olvido, M28.1; olvido a medias, M28.4 o M28.5; al tercer olvido seguido, M29, una sola vez. Se negó pero siguió contando, M32. Texto en vez de audio, M22. Audio cortado, M23. Después de HC10 no va acuse: va FIN-H directo (M24 no se usa).
9. **Cazador de escenas:** si la respuesta es general, pide una vez un momento concreto. **Como mucho una repregunta por bloque**, y nunca dos sobre la misma respuesta (Naza, 23/10: antes decía «por pregunta»; así son unas 6 como máximo en toda la entrevista y no se le corta tanto el hilo). El prompt está en [`cazador/prompt.md`](cazador/prompt.md).
10. **Si deja de contestar:** a los pocos días M8 a la persona; a la semana M9 a quien regaló (si hay alguien que regaló).
11. **Lo que no se usa de V3:** M6, M10, M15 (lo reemplaza PR-H), M24, M30, M33.x, EN2-EN15, DD1/DD2, ni BIEN, FO1 y FIN de V3. Tampoco hay ronda extra, botones en las preguntas ni la segunda oportunidad (M33).
12. **No se recorta por cansancio.** Si dice "paso" o no tiene más para contar, se sigue. No se rellena.
