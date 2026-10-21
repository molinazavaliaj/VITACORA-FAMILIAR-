# Mensajes fijos · aprobados

Lo que Naza aprobó de `mensajes-ronda-1-borrador.md`. Lo redactó Fable. Los demás son iguales a V3 (ver la lista del borrador).

## Tanda A · aprobada por Naza tal cual (22/10/2026)

| ID | Cuándo sale | Texto |
|---|---|---|
| BIEN-H | Plantilla Meta, para uno mismo. {{1}} cómo le dicen, {{2}} la historia | Hola, {{1}}, ¿cómo estás? Soy quien te va a entrevistar para armar tu libro sobre {{2}}. Lo hacemos acá, por WhatsApp, tranquilos. Te mando una pregunta por vez y vos me la contás en audio, como si me lo estuvieras contando en persona. ¿Arrancamos? Contestame SÍ. Con eso me das permiso para guardar lo que me mandes. |
| BIEN-HR | Plantilla Meta, regalo con tema. {{1}} cómo le dicen, {{2}} quién regala, {{3}} la historia | Hola, {{1}}, ¿cómo estás? Te escribo porque {{2}} te hizo un regalo. Es un libro sobre {{3}}, contado por vos, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos. Te mando una pregunta por vez y vos me la contás en audio, como si me lo estuvieras contando en persona. ¿Arrancamos? Contestame SÍ. Con eso me das permiso para guardar lo que me mandes. |
| BIEN-HR-A | Plantilla Meta, regalo con tema abierto. {{1}}, {{2}} | Hola, {{1}}, ¿cómo estás? Te escribo porque {{2}} te hizo un regalo. Es un libro sobre una historia de tu vida, la que vos elijas, contado por vos. Yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos. Te mando una pregunta por vez y vos me la contás en audio, como si me lo estuvieras contando en persona. ¿Arrancamos? Contestame SÍ. Con eso me das permiso para guardar lo que me mandes. |
| TEMA-ABIERTO | Después del SÍ, si el tema quedó abierto | Dale, {{nombre}}. {{quien_regala}} quiso que la historia la elijas vos. Pensá en un capítulo de tu vida que ya pasó y que valga un libro entero. Puede ser cualquier cosa que te haya marcado. Contame cuál es, en audio o escrito, con una frase alcanza. Si no sabés por dónde arrancar, decímelo y te tiro algunas ideas. |
| TEMA-LISTA | Si duda en TEMA-ABIERTO | Te dejo algunas ideas, {{nombre}}. Son solo para ayudarte a pensar.<br><br>Irse a vivir lejos. Emigrar, cambiar de ciudad, empezar de cero.<br>El negocio propio. Abrir el local, los primeros clientes, sacarlo adelante.<br>Salir de una enfermedad. El diagnóstico, el tratamiento, quién estuvo al lado.<br>Cómo se conocieron. El primer encuentro, la primera cita, el casamiento.<br>El primer hijo. La noticia, el nacimiento, las primeras noches sin dormir.<br>El trabajo de tu vida. El primer sueldo, el oficio, los compañeros de siempre.<br>Otra historia. Un viaje, el club, una amistad de toda la vida.<br><br>Contame cuál te tienta, o una que no esté acá. Es tu libro. |
| TEMA-OK | Primera línea de COMO si el tema vino de TEMA-ABIERTO | Queda anotado, {{nombre}}. De eso va a ser tu libro. |
| COMO | Después del SÍ (o de TEMA-OK); enseguida HC1 | Funciona así. Son unas quince preguntas sobre esa historia, de a una. Te mando una, vos me la contás en audio cuando tengas un rato, como si me lo estuvieras contando en persona, y cuando pasan unos minutos sin audios nuevos te mando la que sigue. Mandame todos los audios que quieras. Si alguna pregunta no va con vos, me decís paso y seguimos con otra. Cuando terminamos, con todo eso se escribe el libro. Sin apuro, esto lo hacemos al ritmo que vos quieras. Ahí va la primera. |
| PR-H1 | 1.ª pregunta del que regala (después de HC9, antes de HC10) | Esta te la manda {{quien_regala}}, {{nombre}}. La dejó escrita para vos y te la paso tal cual.<br><br>«{{pregunta}}»<br><br>Contale a {{quien_regala}}, aunque el audio me llegue a mí. |
| PR-H2 | 2.ª | Otra de {{quien_regala}}, que quiso saber esto.<br><br>«{{pregunta}}»<br><br>Contestale como si estuviera ahí con vos. |
| PR-H3 | 3.ª | La última de {{quien_regala}}.<br><br>«{{pregunta}}»<br><br>Hablale a {{quien_regala}}, aunque llegue por acá. |

## Tanda B · aprobada por Naza tal cual (22/10/2026)

Cambios de Claude sobre el borrador de Fable, que Naza aprobó: en FIN-H vuelve la frase de V3 «vas a poder repasar» (el panel tiene «Cerrar libro») y se saca «Ahora me toca a mí». HC1-A es nueva.

| ID | Cuándo sale | Texto |
|---|---|---|
| FOTO-H | Después de la última del tema, antes de HC5; espera fotos o audio hasta 24 h; botón [No tengo fotos] + M31 | Otra cosa, {{nombre}}. ¿Tenés fotos de esa época? Buscá entre tres y diez, en el celular o en algún cajón, y mandámelas por acá. Si son de papel, sacales una foto con el celular. Después, si querés, contame en un audio qué se ve y quiénes están. Tomate el tiempo que necesites para buscarlas. La pregunta que sigue te la mando cuando me llegue algo o me digas que no tenés. Si no las encontrás ahora, no pasa nada, el libro va igual y las podés mandar más adelante. |
| FIN-H | Después de HC10 | Hasta acá llegamos, {{nombre}}. Gracias por cada audio y por la confianza de contarme esta historia así, de cerca. Con todo lo que me diste se escribe el libro. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo.«sino:FOTO-H:  ‖  Si te quedó alguna foto de esa época por mandar, mandámela por acá cuando la encuentres, entra igual.» Fue un gusto enorme escucharte. |
| HC1-A | Reemplaza a HC1 solo con tema abierto (estado.temaAbierto) | Empecemos por el antes, {{nombre}}. Antes de que empezara esta historia que elegiste, vos ya tenías una vida andando. Contame un día común de esa época, de poco antes de que pasara todo esto. Dónde vivías, en qué andabas, quién estaba cerca. |
