# La entrevista leída de corrido

**Qué es:** la entrevista completa de una vida **inventada** (Rogelio, 72 años, varón, con hermanos, que se fue a otra ciudad, sigue con su primera pareja, tiene hijos y nietos; contesta "No, nada más." al cierre de lugares y "Paso" al de historia grande), tal como le llegaría por WhatsApp. Generada con el código de `fabrica/src/v3/entrevista/` por `fabrica/scripts/v3-entrevista-lectura.ts` (sin ronda extra).

**Cuenta:** 89 preguntas del banco (12 con la frase de "paso" debajo) + 1 de la familia · **129 mensajes de WhatsApp del biógrafo** en total. Los agradecimientos van como primera línea del mensaje que sigue; solo los 8 sobrios van solos. 12 frases de entrada de bloque.

Versión 4 (30/09, ronda 2): agradecimiento pegado a lo que sigue, sin "Terminamos esta etapa", acuse sobrio en los momentos difíciles de cada época, el final LE7 → familia → FO1 → LE9 → LE8 → FIN, la política en la historia grande y "lo que todavía querés hacer" en el legado. El acuse neutro (M25) cuando un cierre se contesta con un "no" corto o "paso". La bienvenida sigue en dos mensajes hasta que Naza elija la versión en uno. Registro en [`correcciones-lectura.md`](correcciones-lectura.md).

Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas debajo van juntas en ese mensaje); **Persona** es la respuesta (acá solo "[responde]"; en las preguntas que abren un tema va la respuesta corta de la vida de ejemplo). Los títulos de bloque y los IDs (entre corchetes) son para vos: la persona no los ve.

**Biógrafo** `[BIEN]`:
> Hola, Rogelio. Juntos vamos a escribir la historia de tu vida, y quiero que sea bien tuya. Te cuento cómo es esto, así vamos tranquilos: yo te pregunto cosas de tu vida, una por vez, y vos me las contás como se las contarías a alguien en la mesa. Si alguna pregunta no tiene que ver con lo que viviste, no pasa nada: me decís que no, o me contás lo que en realidad te tocó a vos, que eso es lo que quiero saber.

**Biógrafo** `[M6]`:
> Ahora te explico cómo va la entrevista, Rogelio. Te mando una pregunta y vos me la contás en audio. Si te salen dos o tres audios, mejor. Cuando quedás en silencio un ratito, entiendo que terminaste y te mando la próxima. No hay apuro: vamos al paso que vos vayas marcando.

## Bloque 1 · Origen y raíces

**Biógrafo** `[OR1 + M1]`:
> Empecemos por cuando llegaste al mundo, según te contaron. No el día en sí, sino la época: dónde vivían, en qué andaban tu mamá y tu papá, cómo te esperaban. ¿Qué sabés de cómo era la vida de ellos en ese entonces? Contame.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde]

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Rogelio. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
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

**Biógrafo** `[M3.3 + CI1]`:
> Anotado. Sigo con otra.
>
> Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora.

**Persona:** [responde]

## Bloque 2 · La casa y la familia de la infancia

**Biógrafo** `[M24.1 + EN2]`:
> Gracias, Rogelio. Eso también va al libro.
>
> Ahora vamos a tu infancia, Rogelio: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Persona:** [responde]

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chico. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Persona:** [responde]

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chico? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Persona:** [responde]

**Biógrafo** `[M3.6 + CA6 + M1]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste hermanos? Si tuviste, ¿con cuál eras más cercano de chico? Contame alguna aventura que hayan hecho juntos; seguro tienen varias.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «Sí, éramos cuatro y con el más chico hicimos de todo en el patio.»]

**Biógrafo** `[M3.7 + CA16]`:
> Listo, quedó guardado. Sigo.
>
> Contame un día de chico que esperabas con muchas ganas: qué era, quién estaba, qué pasó.

**Persona:** [responde]

**Biógrafo** `[M3.8 + CA17]`:
> Escuchado. Vamos por la siguiente.
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

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Persona:** [responde]

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chico, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Persona:** [responde]

**Biógrafo** `[M3.3 + ES6]`:
> Anotado. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chico, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Persona:** [responde]

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Persona:** [responde]

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chico? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Persona:** [responde]

**Biógrafo** `[M3.6 + CI3]`:
> Lo tengo. Vamos con otra.
>
> Con esto cerramos tus años de escuela. Antes de seguir, ¿te quedó alguna historia de esa época dando vueltas, algo que no entró en ninguna pregunta? Contámela ahora, con calma, que la quiero escuchar.

**Persona:** [responde]

## Bloque 4 · Adolescencia

**Biógrafo** `[M24.3 + EN4]`:
> Bien, Rogelio. Lo sumo a lo que ya me contaste de eso.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chico y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Persona:** [responde]

**Biógrafo** `[M3.7 + AD3]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Persona:** [responde]

**Biógrafo** `[M3.8 + AD5]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche.

**Persona:** [responde]

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Persona:** [responde]

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chico? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Persona:** [responde]

**Biógrafo** `[M3.3 + AD15]`:
> Anotado. Sigo con otra.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Persona:** [responde]

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquilo, que hay tiempo.

**Persona:** [responde]

## Bloque 5 · Juventud

**Biógrafo** `[M24.4 + EN5]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Pasamos a tu juventud, Rogelio: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Persona:** [responde]

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Persona:** [responde]

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Persona:** [responde]

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Persona:** [responde]

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Si te pasó, contame cómo lo decidiste: qué te empujó y a quién se lo dijiste primero.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «Sí, a los veinte me fui a otra ciudad a buscar trabajo con una valija.»]

**Biógrafo** `[M3.8 + JU12]`:
> Escuchado. Vamos por la siguiente.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue?

**Persona:** [responde]

**Biógrafo** `[M3.1 + JU15]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Persona:** [responde]

**Biógrafo** `[M3.2 + JU17]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Persona:** [responde]

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI5]`:
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.

**Persona:** [responde]

## Bloque 6 · Amor y pareja

**Biógrafo** `[M24.1 + AM0 + M1]`:
> Gracias, Rogelio. Eso también va al libro.
>
> Ahora vamos al amor. Haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después vamos de a una, empezando por la primera que fue en serio. Si no hubo, decímelo nomás, que también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «Una sola vez, con Marta, desde los veinte años hasta hoy.»]

**Biógrafo** `[M3.3 + AM1]`:
> Anotado. Sigo con otra.
>
> Contame el día que se conocieron. ¿Dónde fue, quién los presentó o cómo se cruzaron? ¿Y qué fue lo primero que te llamó la atención de esa persona?

**Persona:** [responde]

**Biógrafo** `[M3.4 + AM3]`:
> Gracias por contármelo. Seguimos.
>
> Y después, ¿cómo decidieron armar la vida juntos: casarse, irse a vivir, lo que haya sido? ¿Quién lo dijo primero, o se fue dando solo? Contame ese momento: dónde estaban, qué se dijeron.

**Persona:** [responde]

**Biógrafo** `[M3.5 + AM4]`:
> Guardado, Rogelio. Te mando la próxima.
>
> Hay días que quedan grabados para siempre. ¿Hubo uno en que se casaron, o en que empezaron a vivir juntos? Si lo hubo, contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó.

**Persona:** [responde]

**Biógrafo** `[M3.6 + AM8]`:
> Lo tengo. Vamos con otra.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Persona:** [responde]

**Biógrafo** `[M3.7 + AM9 + M1]`:
> Listo, quedó guardado. Sigo.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «No, seguimos juntos.»]

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[AM13]`:
> Contame una pelea que tuvieron, de esas que después dan risa. Por qué fue, quién aflojó primero y cómo hicieron las paces.

**Persona:** [responde]

**Biógrafo** `[M3.8 + AM14]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Tuviste algún amor que te marcó y no fue el de toda la vida? Uno que dejó huella, aunque haya durado poco. Si te pasó, contame cómo se cruzaron y el momento que más te acordás de esa persona.

**Persona:** [responde]

**Biógrafo** `[M3.1 + CI6]`:
> Gracias, Rogelio. Ya lo guardé.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Persona:** [responde]

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M24.2 + EN7]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ahora vamos al trabajo y a tu oficio, Rogelio: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Persona:** [responde]

**Biógrafo** `[M3.2 + TR6]`:
> Te escuché. Vamos con la que sigue.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Persona:** [responde]

**Biógrafo** `[M3.3 + TR2]`:
> Anotado. Sigo con otra.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Persona:** [responde]

**Biógrafo** `[M3.4 + TR3]`:
> Gracias por contármelo. Seguimos.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Persona:** [responde]

**Biógrafo** `[M3.5 + TR5]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Cuál fue el día de trabajo del que estás más orgulloso? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo.

**Persona:** [responde]

**Biógrafo** `[M3.6 + TR11]`:
> Lo tengo. Vamos con otra.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.

**Persona:** [responde]

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Rogelio. Queda guardado con cuidado.

**Biógrafo** `[TR8]`:
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Persona:** [responde]

**Biógrafo** `[M3.7 + CS1]`:
> Listo, quedó guardado. Sigo.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Persona:** [responde]

**Biógrafo** `[M3.8 + CP1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chico o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Persona:** [responde]

**Biógrafo** `[M3.1 + TR9]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Persona:** [responde]

**Biógrafo** `[M3.2 + CI7]`:
> Te escuché. Vamos con la que sigue.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.

**Persona:** [responde]

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M24.3 + EN8]`:
> Bien, Rogelio. Lo sumo a lo que ya me contaste de eso.
>
> Volvemos a la familia, Rogelio, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Si no los tuviste cerca, contame cómo fue eso.

**Persona:** [responde]

**Biógrafo** `[M3.3 + HI0 + M1]`:
> Anotado. Sigo con otra.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Si sí, contame quiénes son, así los voy conociendo. Y si no, decímelo nomás y seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «Sí, dos hijos, un varón y una nena, que hoy ya son grandes.»]

**Biógrafo** `[M3.4 + HI2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Persona:** [responde]

**Biógrafo** `[M3.5 + HI2b]`:
> Guardado, Rogelio. Te mando la próxima.
>
> ¿Tuviste más hijos, o hay alguien más que sentís que criaste o cuidaste como propio? Si fue así, contame cómo fue la llegada de cada uno, con el tiempo que necesites. Cada llegada tiene su historia.

**Persona:** [responde]

**Biógrafo** `[M3.6 + HI3]`:
> Lo tengo. Vamos con otra.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Persona:** [responde]

**Biógrafo** `[M3.7 + HS1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Cómo viviste la crianza de tus hijos? ¿La llevaste solo, o tuviste alguna ayuda cerca? Contame un día de esa época que te acuerdes bien.

**Persona:** [responde]

**Biógrafo** `[M3.8 + HI6]`:
> Escuchado. Vamos por la siguiente.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Persona:** [responde]

**Biógrafo** `[M3.1 + HI8 + M1]`:
> Gracias, Rogelio. Ya lo guardé.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, me lo decís y pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde: «Sí, el primero nació un invierno y fui corriendo al hospital a conocerlo.»]

**Biógrafo** `[M3.2 + HI9]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada.

**Persona:** [responde]

**Biógrafo** `[M3.3 + CI8]`:
> Anotado. Sigo con otra.
>
> Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Persona:** [responde]

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M24.4 + EN9]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Persona:** [responde]

**Biógrafo** `[M3.4 + PA1]`:
> Gracias por contármelo. Seguimos.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Persona:** [responde]

**Biógrafo** `[M3.5 + CI9]`:
> Guardado, Rogelio. Te mando la próxima.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquilo.

**Persona:** [responde: «No, nada más.»]

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M25.1 + EN10]`:
> Bien, seguimos.
>
> Hablemos de los amigos, Rogelio, y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Persona:** [responde]

**Biógrafo** `[M3.6 + AY1]`:
> Lo tengo. Vamos con otra.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Persona:** [responde]

**Biógrafo** `[M3.7 + AS9]`:
> Listo, quedó guardado. Sigo.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Persona:** [responde]

**Biógrafo** `[M3.8 + CI10]`:
> Escuchado. Vamos por la siguiente.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquilo.

**Persona:** [responde]

## Bloque 11 · Pérdidas y momentos difíciles

**Biógrafo** `[M24.1 + AV11]`:
> Gracias, Rogelio. Eso también va al libro.
>
> Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás.

**Biógrafo** `[PE1 + M1]`:
> ¿Perdiste a alguien importante en tu vida? Si querés, contame quiénes fueron, qué eran para vos y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde]

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde]

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Persona:** [responde]

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

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
> Anotado. Sigo con otra.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Persona:** [responde]

**Biógrafo** `[M3.4 + CI12]`:
> Gracias por contármelo. Seguimos.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.

**Persona:** [responde: «Paso»]

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M25.2 + EN13]`:
> Dale.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó.

**Persona:** [responde]

**Biógrafo** `[M3.5 + GI2]`:
> Guardado, Rogelio. Te mando la próxima.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó.

**Persona:** [responde]

**Biógrafo** `[M3.6 + HJ1]`:
> Lo tengo. Vamos con otra.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Persona:** [responde]

**Biógrafo** `[M3.7 + GI9]`:
> Listo, quedó guardado. Sigo.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquito frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor.

**Persona:** [responde]

**Biógrafo** `[M3.8 + FI1]`:
> Escuchado. Vamos por la siguiente.
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
> Anotado. Sigo con otra.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Persona:** [responde]

**Biógrafo** `[M3.4 + FI6]`:
> Gracias por contármelo. Seguimos.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Persona:** [responde]

**Biógrafo** `[M3.5 + CI13]`:
> Guardado, Rogelio. Te mando la próxima.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquilo.

**Persona:** [responde]

## Bloque 14 · Hoy

**Biógrafo** `[M24.3 + EN14]`:
> Bien, Rogelio. Lo sumo a lo que ya me contaste de eso.
>
> Dejamos el pasado un rato y venimos a hoy, Rogelio: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Persona:** [responde]

**Biógrafo** `[M3.6 + HO2]`:
> Lo tengo. Vamos con otra.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado.

**Persona:** [responde]

**Biógrafo** `[M3.7 + HO5]`:
> Listo, quedó guardado. Sigo.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Persona:** [responde]

**Biógrafo** `[M3.8 + CO1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Persona:** [responde]

**Biógrafo** `[M3.1 + HO9]`:
> Gracias, Rogelio. Ya lo guardé.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Persona:** [responde]

**Biógrafo** `[M3.2 + CI14]`:
> Te escuché. Vamos con la que sigue.
>
> Con esto cerramos lo de hoy, Rogelio, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquilo.

**Persona:** [responde]

## Bloque 15 · Legado y cierre

**Biógrafo** `[M24.4 + EN15]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Ya estamos en la última parte, Rogelio: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Persona:** [responde]

**Biógrafo** `[M3.3 + LE2]`:
> Anotado. Sigo con otra.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos mismo descifraste viviendo.

**Persona:** [responde]

**Biógrafo** `[M3.4 + FU1]`:
> Gracias por contármelo. Seguimos.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Persona:** [responde]

**Biógrafo** `[M3.5 + LE7]`:
> Guardado, Rogelio. Te mando la próxima.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Persona:** [responde]

**Biógrafo** `[M3.6 + M15]`:
> Lo tengo. Vamos con otra.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> [acá va la pregunta que escribió alguien de la familia]

**Persona:** [responde]

**Biógrafo** `[M3.7 + FO1]`:
> Listo, quedó guardado. Sigo.
>
> Una última cosa, Rogelio. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés a mano, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Y si no encontrás ninguna, no pasa nada: el libro va igual.

**Persona:** [responde]

**Biógrafo** `[M3.8 + LE9]`:
> Escuchado. Vamos por la siguiente.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Persona:** [responde]

**Biógrafo** `[M3.1 + LE8]`:
> Gracias, Rogelio. Ya lo guardé.
>
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Persona:** [responde]

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Rogelio. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre, y es bien tuyo. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Fue un gusto enorme escucharte.
