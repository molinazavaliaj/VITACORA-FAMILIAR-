# La entrevista leída de corrido

**Qué es:** la entrevista completa de una vida **inventada** (Rogelio, 72 años, varón, con hermanos, que se fue a otra ciudad, sigue con su primera pareja, tiene hijos y nietos; contesta "No, nada más." al cierre de lugares y "Paso" al de historia grande), tal como le llegaría por WhatsApp. Generada con el código de `fabrica/src/v3/entrevista/` por `fabrica/scripts/v3-entrevista-lectura.ts` (sin ronda extra).

**Cuenta:** 103 preguntas del banco (11 con la frase de "paso" debajo) + 1 de la familia · **141 mensajes de WhatsApp del biógrafo** en total. Los agradecimientos van como primera línea del mensaje que sigue; solo los 7 sobrios van solos. 12 frases de entrada de bloque.

Versión 8 (30/09, rondas 2 a 4, con la bienvenida final): CI14 sin el nombre; LE8 arranca sola, sin agradecimiento; bienvenida en un solo mensaje; agradecimiento pegado a lo que sigue (el sobrio va solo); "Gracias, {{nombre}}." antes de cada cierre y de LE9; neutro si un cierre o una pregunta difícil se contesta con un no o paso; la entrada sin el nombre si el agradecimiento ya lo dice; final LE7 → familia → FO1 → LE9 → LE8 → FIN. Registro en [`correcciones-lectura.md`](correcciones-lectura.md).

Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas debajo van juntas en ese mensaje); **Persona** es la respuesta (acá solo "[responde]"; en las preguntas que abren un tema va la respuesta corta de la vida de ejemplo). Los títulos de bloque y los IDs (entre corchetes) son para vos: la persona no los ve.

**Biógrafo** `[BIEN]`:
> Hola, Rogelio, ¿cómo estás? Una persona que te quiere mucho te regaló un libro con la historia de tu vida, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.
>
> Funciona así: te mando una pregunta y vos me la contás en audio, como si me lo estuvieras contando en persona. Mandame todos los audios que quieras. Cuando termines no hace falta que me avises: si pasan unos minutos sin audios nuevos, te mando la pregunta que sigue.
>
> Si alguna pregunta no tiene que ver con tu vida, me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro: esto lo hacemos al ritmo que vos quieras.

## Bloque 1 · Origen y raíces

**Biógrafo** `[OR1 + M1]`:
> Empecemos por cuando llegaste al mundo, según te contaron. No el día en sí, sino la época: dónde vivían, en qué andaban tu mamá y tu papá, cómo te esperaban. ¿Qué sabés de cómo era la vida de ellos en ese entonces? Contame.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde]

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Rogelio. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste, con el nombre de quien la vivió.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde]

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde]

**Biógrafo** `[M3.3 + OR6]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Por qué te pusieron Rogelio? En las casas siempre hay una historia atrás de un nombre: una discusión, un santo, alguien a quien querían mucho. Contame la que te contaron a vos, aunque sea cortita.

**Persona:** [responde]

**Biógrafo** `[M3.4 + OR6.2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Tenés o tuviste algún apodo? Si es así, contame cómo nació: quién te lo puso, por qué justo ese, y si te gusta. Casi siempre hay una anécdota atrás.

**Persona:** [responde]

**Biógrafo** `[M26 + CI1 + M31]`:
> Gracias, Rogelio.
>
> Hasta acá lo de tu familia de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora. Y si algo se te viene más tarde, a cualquier hora, mandámelo cuando quieras: va al libro igual.
>
> _Podés tocar el botón de abajo, o contestarme en audio como siempre._

**Persona:** [responde]

## Bloque 2 · La casa y la familia de la infancia

**Biógrafo** `[M24.1 + EN2]`:
> Gracias, Rogelio. Eso también va al libro.
>
> Ahora vamos a tu infancia: la casa donde creciste y la gente que vivía con vos.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Persona:** [responde]

**Biógrafo** `[M3.6 + CA2]`:
> Lo tengo, gracias. Vamos con otra.
>
> Viajemos un rato a cuando eras chico. Presentame a tu mamá con su nombre: ¿cómo era con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Persona:** [responde]

**Biógrafo** `[M3.7 + CA3]`:
> Quedó guardado, Rogelio. Sigo con la que viene.
>
> ¿Y tu papá? Decime su nombre y a qué se dedicaba cuando eras chico. Contame alguna vez que lo acompañaste o lo viste trabajando. Y si tu papá no estuvo, o preferís no entrar, contame lo que vos quieras de él.

**Persona:** [responde]

**Biógrafo** `[M3.8 + CA6 + M1]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Tuviste hermanos? Si ya salieron en la charla no importa, quiero saber más: decime sus nombres, contame con cuál eras más cercano de chico y alguna aventura que hayan hecho juntos; seguro tienen varias.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «Sí, éramos cuatro y con el más chico hicimos de todo en el patio.»]

**Biógrafo** `[M3.1 + CA10]`:
> Gracias, Rogelio. Ya lo guardé.
>
> Pensá en las fiestas y comidas en familia de cuando eras chico: una Navidad, un cumpleaños, un domingo. ¿Cómo eran en tu casa? Y si hubo una que recuerdes distinta a las demás, contámela.

**Persona:** [responde]

**Biógrafo** `[M3.2 + CA14]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Algún animal te acompañó de chico? Una mascota de la casa o el perro de algún vecino. Contame un recuerdo lindo que tengas con él.

**Persona:** [responde]

**Biógrafo** `[M3.3 + CA16]`:
> Lo anoté, gracias. Sigo con otra.
>
> Contame un día de chico que esperabas con muchas ganas: qué era, quién estaba, qué pasó.

**Persona:** [responde]

**Biógrafo** `[M26 + CA17]`:
> Gracias, Rogelio.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Persona:** [responde]

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Rogelio. Queda guardado con cuidado.

**Biógrafo** `[CI2]`:
> Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquilo, que hay tiempo.

**Persona:** [responde]

## Bloque 3 · La escuela y los juegos

**Biógrafo** `[M24.2 + EN3]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad.

**Biógrafo** `[ES1]`:
> ¿Cómo fue tu primer día de escuela? ¿Quién te llevó hasta la puerta, y qué sentiste cuando se fue? Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria.

**Persona:** [responde]

**Biógrafo** `[M3.5 + ES2]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo se llamaba? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Persona:** [responde]

**Biógrafo** `[M3.6 + ES5]`:
> Lo tengo, gracias. Vamos con otra.
>
> De chico, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? Contame quién era, con nombre, y qué hacían cuando andaban juntos. Contame una tarde con esa persona que todavía te hace sonreír.

**Persona:** [responde]

**Biógrafo** `[M3.7 + ES6]`:
> Quedó guardado, Rogelio. Sigo con la que viene.
>
> ¿Cuál fue la travesura más grande que hiciste de chico, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Persona:** [responde]

**Biógrafo** `[M3.8 + ES7]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Persona:** [responde]

**Biógrafo** `[M3.1 + ES8]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Cómo eran tus veranos de chico? El calor, los días largos, lo que se hacía en tu casa en esos meses. Contame.

**Persona:** [responde]

**Biógrafo** `[M3.2 + ES9]`:
> Te escuché. Vamos con la que sigue.
>
> ¿La religión estaba presente en tu casa cuando eras chico? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Persona:** [responde]

**Biógrafo** `[M26 + CI3]`:
> Gracias, Rogelio.
>
> Hasta acá lo de la escuela. ¿Te quedó alguna historia de esos años que no te pregunté? Puede ser de la primaria o del colegio de después. Si hay una, contámela ahora, con calma. Si no, tocá el botón.

**Persona:** [responde]

## Bloque 4 · Adolescencia

**Biógrafo** `[M24.3 + EN4]`:
> Bien, Rogelio. Lo sumo a lo que ya me contaste de eso.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chico y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Persona:** [responde]

**Biógrafo** `[M3.4 + AD3]`:
> Gracias por contármelo. Seguimos.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Persona:** [responde]

**Biógrafo** `[M3.5 + AD5]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche.

**Persona:** [responde]

**Biógrafo** `[M3.6 + AD6]`:
> Lo tengo, gracias. Vamos con otra.
>
> En esos años, ¿cuándo fue la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo se llamaba, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Persona:** [responde]

**Biógrafo** `[M3.7 + AD12]`:
> Quedó guardado, Rogelio. Sigo con la que viene.
>
> ¿Cuándo sentiste por primera vez que ya no eras chico? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Persona:** [responde]

**Biógrafo** `[M26 + AD15]`:
> Gracias, Rogelio.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.

**Persona:** [responde]

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI4]`:
> Hasta acá tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquilo, que hay tiempo.

**Persona:** [responde]

## Bloque 5 · Juventud

**Biógrafo** `[M24.4 + EN5]`:
> Gracias por eso, Rogelio. Queda guardado.
>
> Pasamos a tu juventud: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Persona:** [responde]

**Biógrafo** `[M3.1 + JU2]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Persona:** [responde]

**Biógrafo** `[M3.2 + JU4]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Persona:** [responde]

**Biógrafo** `[M3.3 + JU8 + M1]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Capaz ya me contaste algo de esa mudanza; ahora contame la llegada: el primer día, dónde dormiste esa noche, quién te esperaba y qué fue lo que más te costó.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «Sí, a los veinte me fui a otra ciudad a buscar trabajo con una valija.»]

**Biógrafo** `[M3.4 + JU12]`:
> Gracias por contármelo. Seguimos.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta. Capaz ya me nombraste ese lugar; ahora contámelo por dentro: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue? Si nunca te fuiste de la casa de tus viejos, contame el día en que esa casa pasó a ser tuya, o el rincón que siempre fue tuyo.

**Persona:** [responde]

**Biógrafo** `[M3.5 + JU13]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Hiciste alguna locura de joven? Un viaje a dedo, una apuesta, algo que hoy no harías. Contame esa vez desde que empezó, con todo lo que pasó.

**Persona:** [responde]

**Biógrafo** `[M3.6 + JU15]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Persona:** [responde]

**Biógrafo** `[M26 + JU17]`:
> Gracias, Rogelio.
>
> ¿Hubo algún momento duro en esos años de empezar tu vida que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.

**Persona:** [responde]

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[JU20]`:
> ¿Te mudaste muchas veces en tu vida, aunque sea de casa dentro del mismo lugar? Contame por qué casas o lugares fuiste pasando, más o menos en qué años, y cuál de esas mudanzas te quedó más grabada.

**Persona:** [responde]

**Biógrafo** `[M26 + CI5]`:
> Gracias, Rogelio.
>
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.

**Persona:** [responde]

## Bloque 6 · Amor y pareja

**Biógrafo** `[M24.1 + AM0 + M1]`:
> Gracias, Rogelio. Eso también va al libro.
>
> Ahora vamos al amor. ¿Hubo alguien con quien tuviste una historia en serio? Si hubo, haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio y más o menos en qué años. Después te pregunto más de la pareja de ahora, o de la última, y de las de antes también va a haber lugar. Y si no hubo, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «Una sola vez, con Marta, desde los veinte años hasta hoy.»]

**Biógrafo** `[M3.1 + AMH]`:
> Gracias, Rogelio. Ya lo guardé.
>
> Vamos a la pareja de ahora, o a la última si hoy no hay nadie. ¿Hoy estás en pareja? Si ya me lo contaste, con el botón alcanza.

**Persona:** [responde: «⟦botón:Sí, estoy en pareja⟧»]

**Biógrafo** `[M26 + AM1]`:
> Gracias, Rogelio.
>
> Empecemos por su nombre. Y contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron, y qué fue lo primero que te llamó la atención de esa persona. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.

**Persona:** [responde]

**Biógrafo** `[M3.2 + AM3]`:
> Te escuché. Vamos con la que sigue.
>
> Y después, ¿llegaron a armar la vida juntos: casarse, irse a vivir, lo que haya sido? Si llegaron, contame ese momento: quién lo dijo primero, o si se fue dando solo, dónde estaban, qué se dijeron. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.

**Persona:** [responde]

**Biógrafo** `[M3.3 + AM4]`:
> Lo anoté, gracias. Sigo con otra.
>
> Hay días que quedan grabados para siempre: el del casamiento, o el primero viviendo juntos. Contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.

**Persona:** [responde]

**Biógrafo** `[M3.4 + AM13]`:
> Gracias por contármelo. Seguimos.
>
> Contame una pelea que tuvieron, de esas que después dan risa: por qué fue, quién aflojó primero y cómo hicieron las paces. Si no hubo ninguna que hoy dé risa, con decírmelo alcanza.

**Persona:** [responde]

**Biógrafo** `[M3.5 + AM8]`:
> Guardado, Rogelio. Te mando la próxima.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Persona:** [responde]

**Biógrafo** `[M26 + AM21]`:
> Gracias, Rogelio.
>
> Ahora las de antes. Si en el repaso me nombraste otras historias que fueron en serio, este es su lugar, pero sin tanto detalle: de cada una, contame un momento que quieras que quede en el libro, el que se te venga primero, y si querés, cómo terminó. Y si hubo alguien que te marcó aunque no haya llegado a nada, también entra acá. Si esa fue la única, con el botón alcanza.

**Persona:** [responde]

**Biógrafo** `[M25.1 + CI6]`:
> Bien, seguimos.
>
> Hasta acá lo del amor. ¿Quedó alguien o algo de eso que no te pregunté? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Persona:** [responde]

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M24.2 + EN7]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ahora vamos al trabajo y a tu oficio, Rogelio: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Persona:** [responde]

**Biógrafo** `[M3.7 + TR6]`:
> Quedó guardado, Rogelio. Sigo con la que viene.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Persona:** [responde]

**Biógrafo** `[M3.8 + TR2]`:
> Te escuché bien. Vamos por la siguiente.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Persona:** [responde]

**Biógrafo** `[M3.1 + TR3]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame quién fue, con su nombre, cómo era esa persona, y una vez con ella que tengas bien clara.

**Persona:** [responde]

**Biógrafo** `[M3.2 + TR5]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuál fue el día de trabajo del que estás más orgulloso? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo.

**Persona:** [responde]

**Biógrafo** `[M26 + TR11]`:
> Gracias, Rogelio.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.

**Persona:** [responde]

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Lo guardo con cuidado.

**Biógrafo** `[TR8]`:
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Persona:** [responde]

**Biógrafo** `[M3.4 + CS1]`:
> Gracias por contármelo. Seguimos.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te salió tan bien que la gente lo notó.

**Persona:** [responde]

**Biógrafo** `[M3.5 + CP1]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chico o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Persona:** [responde]

**Biógrafo** `[M3.6 + TR9]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Persona:** [responde]

**Biógrafo** `[M26 + CI7]`:
> Gracias, Rogelio.
>
> Hasta acá lo de tu trabajo y tu oficio. ¿Quedó algo de eso que no te pregunté? Un lugar, una herramienta, un olor, una persona, un trabajo de unos días que nadie recuerda. Es el momento de contarlo, sin apuro.

**Persona:** [responde]

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M24.3 + EN8]`:
> Bien, Rogelio. Lo sumo a lo que ya me contaste de eso.
>
> Volvemos a la familia, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Y si te tocó cuidarlos, contame cómo era un día de esos: qué hacías por ellos, qué te decían. Si no los tuviste cerca, contame cómo fue eso.

**Persona:** [responde]

**Biógrafo** `[M26 + HI0 + M1]`:
> Gracias, Rogelio.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Presentámelos de a uno, incluso si alguno ya apareció en lo que me venís contando: cómo se llama cada uno y cuándo llegó. Y si no tuviste, seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «Sí, dos hijos, un varón y una nena, que hoy ya son grandes.»]

**Biógrafo** `[M3.8 + HI2]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Persona:** [responde]

**Biógrafo** `[M3.1 + HI3]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Persona:** [responde]

**Biógrafo** `[M3.2 + HS1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo fue criar a tus hijos? Quién estaba cerca, cómo se repartían las cosas, o si te tocó llevarla solo. Contame un día de esa época que te acuerdes bien.

**Persona:** [responde]

**Biógrafo** `[M3.3 + HI6]`:
> Lo anoté, gracias. Sigo con otra.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Persona:** [responde]

**Biógrafo** `[M3.4 + HI7]`:
> Gracias por contármelo. Seguimos.
>
> Un día los hijos se van de casa. ¿Te acordás del día en que se fue el primero? Cómo fue la despedida, y cómo quedó la casa esa noche. Si todavía no se fue ninguno, me decís nomás.

**Persona:** [responde]

**Biógrafo** `[M3.5 + HI12]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Cómo eligieron el nombre de cada hijo? De dónde salió, quién lo propuso, si hubo discusión. Contame la historia del nombre, aunque sea corta.

**Persona:** [responde]

**Biógrafo** `[M3.6 + HI8 + M1]`:
> Lo tengo, gracias. Vamos con otra.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Puede que ya los hayas mencionado; nombrámelos de a uno, y contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «Sí, el primero nació un invierno y fui corriendo al hospital a conocerlo.»]

**Biógrafo** `[M3.7 + HI9]`:
> Quedó guardado, Rogelio. Sigo con la que viene.
>
> ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada.

**Persona:** [responde]

**Biógrafo** `[M26 + CI8]`:
> Gracias, Rogelio.
>
> Hasta acá lo de la familia de grande. ¿Quedó alguien o algo que no te pregunté? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Persona:** [responde]

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M24.4 + EN9]`:
> Gracias por eso, Rogelio. Queda guardado.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Persona:** [responde]

**Biógrafo** `[M3.1 + PA1]`:
> Gracias, Rogelio. Ya lo guardé.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.

**Persona:** [responde]

**Biógrafo** `[M3.2 + PA3]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Sos hincha de algún club? Contame cómo empezó eso, si alguien te llevó, y un partido que no te olvidás más.

**Persona:** [responde]

**Biógrafo** `[M26 + CI9]`:
> Gracias, Rogelio.
>
> Hasta acá los lugares y las pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquilo.

**Persona:** [responde: «No, nada más.»]

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M25.2 + EN10]`:
> Bien, seguimos.
>
> Hablemos de los amigos, Rogelio, y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame de quién hablás, con su nombre, cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Persona:** [responde]

**Biógrafo** `[M3.4 + HE2]`:
> Gracias por contármelo. Seguimos.
>
> Ya de grandes, ¿con tus hermanos (o con tu hermano o hermana, si tuviste uno solo) también se hicieron amigos? Contame algún momento de adultos en que estuvieron bien cerca: un viaje, una charla, una mano que se dieron.

**Persona:** [responde]

**Biógrafo** `[M3.5 + AY1]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Persona:** [responde]

**Biógrafo** `[M3.6 + AS9]`:
> Lo tengo, gracias. Vamos con otra.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Persona:** [responde]

**Biógrafo** `[M3.7 + AS7]`:
> Quedó guardado, Rogelio. Sigo con la que viene.
>
> Hoy, cuando te pasa algo importante, ¿a quién se lo contás primero? Contame una vez que le hayas contado algo así.

**Persona:** [responde]

**Biógrafo** `[M26 + CI10]`:
> Gracias, Rogelio.
>
> Hasta acá los amigos y la gente que te ayudó. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquilo.

**Persona:** [responde]

## Bloque 11 · Pérdidas y momentos difíciles

**Biógrafo** `[M24.1 + AV11]`:
> Gracias, Rogelio. Eso también va al libro.
>
> Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás.

**Biógrafo** `[PE1 + M1]`:
> Puede que ya me hayas hablado de alguna pérdida; acá hay lugar para lo que no entró. Si perdiste a alguien importante, contame de cada uno lo que quieras: qué era para vos, cómo fueron los días de después y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde]

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Rogelio. Queda guardado con cuidado.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde]

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde]

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI11]`:
> Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.

**Persona:** [responde]

## Bloque 12 · La historia grande

**Biógrafo** `[M24.2 + EN12]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.

**Biógrafo** `[HG1]`:
> Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día.

**Persona:** [responde]

**Biógrafo** `[M3.1 + HG4]`:
> Gracias, Rogelio. Ya lo guardé.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado.

**Persona:** [responde]

**Biógrafo** `[M3.2 + DE1]`:
> Te escuché. Vamos con la que sigue.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Persona:** [responde]

**Biógrafo** `[M3.3 + FI7]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Persona:** [responde]

**Biógrafo** `[M26 + CI12]`:
> Gracias, Rogelio.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.

**Persona:** [responde: «Paso»]

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M25.3 + EN13]`:
> Bien, entonces.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.

**Persona:** [responde]

**Biógrafo** `[M3.5 + GI2]`:
> Guardado, Rogelio. Te mando la próxima.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.

**Persona:** [responde]

**Biógrafo** `[M3.6 + HJ1]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Persona:** [responde]

**Biógrafo** `[M3.7 + GI9]`:
> Quedó guardado, Rogelio. Sigo con la que viene.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquito frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor.

**Persona:** [responde]

**Biógrafo** `[M3.8 + FI1]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos mismo? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Persona:** [responde]

**Biógrafo** `[M3.1 + FI2]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Persona:** [responde]

**Biógrafo** `[M3.2 + FI3]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Persona:** [responde]

**Biógrafo** `[M3.3 + FI4]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Persona:** [responde]

**Biógrafo** `[M26 + CI13]`:
> Gracias, Rogelio.
>
> Hasta acá esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquilo.

**Persona:** [responde]

## Bloque 14 · Hoy

**Biógrafo** `[M24.3 + EN14]`:
> Bien, Rogelio. Lo sumo a lo que ya me contaste de eso.
>
> Dejamos el pasado un rato y venimos a hoy: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Persona:** [responde]

**Biógrafo** `[M3.5 + HO2]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado.

**Persona:** [responde]

**Biógrafo** `[M3.6 + HO4]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Hay algo en tu casa que no regalarías nunca, valga lo que valga? Contame de dónde vino, cómo llegó a vos, y la última vez que lo tuviste en las manos.

**Persona:** [responde]

**Biógrafo** `[M3.7 + HO5]`:
> Quedó guardado, Rogelio. Sigo con la que viene.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Persona:** [responde]

**Biógrafo** `[M3.8 + HO11]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Tenés alguna marca en el cuerpo que tenga historia? Una cicatriz, un tatuaje, una quemadura de la cocina. Contame cómo te la hiciste: dónde estabas, cuántos años tenías, quién estaba con vos y qué pasó después. Y si no tenés ninguna que valga la pena, contame de una que tenga alguien de tu familia y que siempre pregunten de dónde salió.

**Persona:** [responde]

**Biógrafo** `[M3.1 + CO1]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Persona:** [responde]

**Biógrafo** `[M3.2 + G1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Qué música ponés hoy cuando estás a tu aire? ¿Cuál fue la última canción que escuchaste, y qué estabas haciendo?

**Persona:** [responde]

**Biógrafo** `[M3.3 + HO9]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Persona:** [responde]

**Biógrafo** `[M3.4 + HO10]`:
> Gracias por contármelo. Seguimos.
>
> ¿Hay algo que te acompaña todos los días, el café de la mañana, el mate, un cigarrillo, el vino de la cena? Contame cómo empezó y un momento con eso.

**Persona:** [responde]

**Biógrafo** `[M3.5 + G3]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Te gusta leer, o sos más de mirar películas o series? ¿Con qué te enganchás? Contame la última vez que se te pasó la hora con algo así.

**Persona:** [responde]

**Biógrafo** `[M26 + CI14]`:
> Gracias, Rogelio.
>
> Hasta acá lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquilo.

**Persona:** [responde]

## Bloque 15 · Legado y cierre

**Biógrafo** `[M24.4 + EN15]`:
> Gracias por eso, Rogelio. Queda guardado.
>
> Ya estamos en la última parte: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Persona:** [responde]

**Biógrafo** `[M3.7 + LE2]`:
> Quedó guardado, Rogelio. Sigo con la que viene.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos mismo descifraste viviendo.

**Persona:** [responde]

**Biógrafo** `[M3.8 + FU1]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Persona:** [responde]

**Biógrafo** `[M3.1 + LE7]`:
> Gracias, Rogelio. Ya lo guardé.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Persona:** [responde]

**Biógrafo** `[M3.2 + M15]`:
> Te escuché. Vamos con la que sigue.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> [acá va la pregunta que escribió alguien de la familia]

**Persona:** [responde]

**Biógrafo** `[M3.3 + FO1]`:
> Lo anoté, gracias. Sigo con otra.
>
> Otra cosa, Rogelio. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Tomate el tiempo que necesites para buscarla: la pregunta que sigue te la mando cuando me llegue la foto o me digas algo. Y si no la encontrás, no pasa nada: el libro va igual, y la podés mandar más adelante.

**Persona:** [responde]

**Biógrafo** `[M26 + LE9]`:
> Gracias, Rogelio.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Persona:** [responde]

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Persona:** [responde]

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Rogelio. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Y si te quedó alguna foto por mandar, mandámela por acá cuando la encuentres: entra igual. Fue un gusto enorme escucharte.
