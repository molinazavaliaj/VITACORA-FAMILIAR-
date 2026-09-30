# Ronda 2, simulación 2: la viuda (Amalia, 74, inventada)

**Qué es:** la entrevista de un narrador **inventado** (Amalia), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Plan: [`PLAN.md`](PLAN.md).

**Cuenta:** 88 preguntas del banco contestadas + 1 de la familia · **125 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas van juntas en ese mensaje); **Narrador** es lo que contestó. Los títulos de bloque y los IDs (entre corchetes) son para el equipo: el narrador no los ve.

**Biógrafo** `[BIEN]`:
> Hola, Amalia, ¿cómo estás? Una persona que te quiere mucho te regaló un libro con la historia de tu vida, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.
>
> Funciona así: te mando una pregunta y vos me la contás en audio, como si me lo estuvieras contando en persona. Mandame todos los audios que quieras. Cuando termines, ya está: con un ratito de silencio, la pregunta que sigue te llega sola.
>
> Si alguna pregunta no tiene que ver con tu vida, me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro: esto lo hacemos al ritmo que vos quieras.

## Bloque 1 · Origen y raíces

**Biógrafo** `[OR1 + M1]`:
> Empecemos por cuando llegaste al mundo, según te contaron. No el día en sí, sino la época: dónde vivían, en qué andaban tu mamá y tu papá, cómo te esperaban. ¿Qué sabés de cómo era la vida de ellos en ese entonces? Contame.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR1]`: Ay, bueno, nací en el cincuenta y dos, en Mar del Plata, en una casa cerca del puerto. Mi papá era pescador, vos, trabajaba en el mar casi todos los días. Mi mamá, en cambio, se dedicaba a la casa, a nosotras. Yo fui la mayor, así que llegué cuando ellos todavía estaban bien nuevos juntos. Me contaba mi mamá que mi papá estaba tan contento cuando nací, que salió corriendo a decírselo a todos sus amigos. Era un hombre muy cariñoso, muy presente. Después vinieron mis hermanas, Teresa y Luisa, con unos años de diferencia. Eso sí, en esa época no era como ahora; la gente vivía más junta en las casas, la familia grande, los abuelos. Éramos una familia de pescador, así que no sobraba nada, pero nos querían mucho.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Amalia. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR2]`: Ah, sí. Mi abuelo paterno fue pescador también, como mi papá. Mi abuela contaba que él llegó a Mar del Plata en los años treinta, creo, desde Italia, en un barco. Venía con casi nada en el bolsillo. Contaba que cuando bajó en el puerto, vio el mar tan inmenso que le dio miedo, pero al final se enamoró de ese puerto, ¿vos? Se quedó, empezó a pescar, conoció a mi abuela que era la hija de otro pescador también. Fue como una vuelta de tuerca: los italianos llegaban acá buscando fortuna en el mar, y muchos se quedaban. Mi abuela decía que esa fue la historia de muchos en Mar del Plata. Nosotros también éramos italianos por parte de mi papá. Ella siempre contaba eso en las comidas, cómo el abuelo bajó del barco sin nada y terminó siendo un pescador respetado en el puerto. Era una historia linda de esfuerzo, vos.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR5]`: En un baile, en el club. Mi papá andaba con unos amigos, y mi mamá fue con su hermana. Dice que él la vio y quedó loco. Le pidió para bailar y listo, ahí empezó todo. Eso es lo que contaba mi papá, que fue flechazo.

**Biógrafo** `[M26 + CI1 + M31]`:
> Gracias, Amalia.
>
> Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora. Y si algo se te viene más tarde, a cualquier hora, mandámelo cuando quieras: va al libro igual.
>
> _Podés tocar el botón de abajo, o contestarme en audio como siempre._
>
> [botones: (No, está todo)]

**Narrador** `[CI1]`: [toca: No, está todo]

## Bloque 2 · La casa y la familia de la infancia

**Biógrafo** `[M25.1 + EN2]`:
> Bien, seguimos.
>
> Ahora vamos a tu infancia, Amalia: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Narrador** `[CA1]`: Mi primer recuerdo fuerte es de la galería de la casa, al atardecer. Recuerdo estar ahí con mi mamá, y ella planchando ropa. Yo tendría cuatro o cinco años. La casa quedaba cerca del puerto, así que se sentía el olor a sal, a pescado. Mi papá llegaba cuando se metía el sol, con la ropa mojada, cansado. Recuerdo que mi mamá le tenía un mate listo, y él se sentaba en una sillita de mimbre. Yo estaba jugando por ahí, en el piso, con una muñeca que me había hecho papá con trapos. Era una casa no muy grande, pero para nosotras era todo. Había una luz hermosa a esa hora, muy amarilla. Eso es lo que me queda.

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chica. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Narrador** `[CA2]`: Mi mamá era muy cuidadosa, muy atenta a los detalles. Recuerdo que un día, yo tendría como seis años, me mandaron a la escuela y se me olvidó el guardapolvo en casa. Salí corriendo y empecé a llorar porque tenía miedo de que me reten en la escuela. Mi mamá me vio en la puerta, me abrazó sin decir nada, entré corriendo a buscarlo, me lo dio y me acarició la cabeza. No me regañó por nada. Luego, cuando llegué de la escuela, ella me había preparado un postre que me encantaba, con dulce de leche. Mientras comía, me explicó con mucha paciencia que tenía que dejarle todo listo la noche anterior, pero de una forma tan tierna que no me sentí mal. Era así: ordenada, pero con un corazón enorme. Ella nos enseñaba las cosas de la vida sin alzar la voz, con gestos, con su forma de estar presente. Fue una mamá hermosa, vos.

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chica? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Narrador** `[CA3]`: Mi papá era pescador, como te dije. Pocas veces podía ir con él al puerto, porque eran viajes largos en barco, pero me acuerdo de una vez que lo acompañé... íbamos de madrugada. Fue hermoso, la verdad. Él me llevaba tomado de la mano, me mostraba cómo revisaba las redes, cómo trabajaban con los otros hombres. Tenía una manera de estar en el mar que era... no sé, como si ese fuera su lugar en el mundo, ¿vos? Yo no entendía mucho, pero veía cómo le brillaban los ojos.

**Biógrafo** `[M3.6 + CA6 + M1]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Tuviste hermanos? Si ya salieron en la charla no importa, quiero saber más: contame con cuál eras más cercana de chica y alguna aventura que hayan hecho juntos; seguro tienen varias.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, tuve) (No tuve hermanos)]

**Narrador** `[CA6]`: [toca: Sí, tuve]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[CA6]`: Sí, tuve dos hermanas menores: Teresa y Luisa. Yo era la grande, así que medio que las cuidaba. Con Teresa éramos muy unidas, solo nos llevábamos dos años. Recuerdo que una vez nos escapamos a la playa en la mañana sin avisar, cuando mamá estaba ocupada con la ropa. Nos metimos en el agua en las corpiños, como unas locas, y cuando volvemos a casa toda mojadas, mi mamá casi nos mata de susto. Pero no nos gritó, ¿vos? Se dio cuenta que habíamos estado juntas, que era cosa de hermanas. Me hizo acordar que aunque a veces uno se equivoca, estar juntas valía la pena. Luisa era más chica, más callada. Las quiero como a nada en el mundo, la verdad.

**Biógrafo** `[M3.7 + CA16]`:
> Quedó guardado, Amalia. Sigo con la que viene.
>
> Contame un día de chica que esperabas con muchas ganas: qué era, quién estaba, qué pasó. Y si no te vuelve un día en particular, contame qué cosas esperabas con ganas en esa época, que con eso me arreglo.

**Narrador** `[CA16]`: Los viernes cuando llegaba mi papá. Yo terminaba la escuela y corría para el puerto a verlo llegar. Traía siempre algo para nosotras, un pescado, camarones, y su risa. Eso esperaba.

**Biógrafo** `[M26 + CA17]`:
> Gracias, Amalia.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[CA17]`: [toca: Paso esta]

**Biógrafo** `[M27.1 + CI2]`:
> Está bien, Amalia. Lo dejamos ahí y seguimos por otro lado.
>
> Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquila, que hay tiempo.
>
> [botones: (No, está todo)]

**Narrador** `[CI2]`: No, creo que está todo bien. La infancia fue linda, la verdad.

## Bloque 3 · La escuela y los juegos

**Biógrafo** `[M25.3 + EN3]`:
> Bien, entonces.
>
> Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad.

**Biógrafo** `[ES1]`:
> ¿Cómo fue tu primer día de escuela? ¿Quién te llevó hasta la puerta, y qué sentiste cuando se fue? Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria.

**Narrador** `[ES1]`: Mi primer día de escuela me llevó mi papá. Yo estaba con miedo, no sé, agarrada de su mano. Él me acompañó hasta la puerta, me presentó con la maestra, que era muy dulce, la señorita Carmen. Cuando él se fue, yo quería llorar, pero la maestra me distrajo rápido, me mostró dónde sentarme. Al rato ya estaba jugando con otras nenas. Pero cuando lo vi llegar al atardecer, me acuerdo que corrí para sus brazos. Fue un día raro, de esos que no se olvidan.

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Amalia. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Narrador** `[ES2]`: Sí, la señorita Carmen, claro. Ella me enseñó que está bien tener miedo si después salís adelante. Una vez me llamó para que leyera en voz alta enfrente de todos, y yo temblaba. Ella me puso la mano en el hombro y dijo "Vos podés, Amalia", y lo hice. Nunca lo olvidé.

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chica, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Narrador** `[ES5]`: Sí, una nena que se llamaba Constanza. Vivía a pocas cuadras de mi casa, en una casita con patio. Íbamos a su patio y jugábamos con botellas de vidrio, las hacíamos casitas. Nos pasábamos tardes enteras imaginando, vos. Ella era más tímida que yo, así que yo la sacaba de la timidez. Nos reíamos de todo. Después ella se fue a vivir a Buenos Aires cuando teníamos doce o trece años, y no nos vimos más. Pero a veces me acuerdo de esas tardes de construcción de casitas y me sonrío.

**Biógrafo** `[M3.3 + ES6]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chica, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Narrador** `[ES6]`: Ay, una vez metí una rana en la cartera de la maestra. Todos nos reímos, pero fue bastante travieso. Me castigaron, claro, pero valía la pena.

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Narrador** `[ES7]`: Quería ser maestra. Me encantaba la idea de ayudar a otros chicos como lo hizo la señorita Carmen conmigo. Luego estudié para maestra jardinera, y durante veinte años trabajé en un jardín acá en Mar del Plata. Fue hermoso, vos, trabajar con los chiquitos, verlos crecer. Fue una decisión que no me arrepiento nada.

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chica? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Narrador** `[ES9]`: Sí, mucha. Mi mamá era muy devota, muy de iglesia. Me acuerdo de mi primera comunión, que fue importante. Tenía ocho años. Me compraron un vestidito blanco, con un velo, y mis hermanas fueron con cintas en el pelo. Fuimos a la iglesia con toda la familia, papá inclusive, que no era tan de iglesia pero asistía. La misa me pareció eterna, pero después había una fiesta en casa: mis abuelos, vecinos, mi mamá había preparado torta, sandwiches. Fue lindo, la verdad. Recuerdo la cara de mi papá mirándome en el altar, como si fuera lo más importante del mundo. Ahí me di cuenta de que la fe para mi mamá era una cosa seria, y que nosotros formábamos parte de eso. Eso quedó en mí siempre.

**Biógrafo** `[M26 + CI3]`:
> Gracias, Amalia.
>
> Con esto cerramos tus años de escuela. Antes de seguir, ¿te quedó alguna historia de esa época dando vueltas, algo que no entró en ninguna pregunta? Contámela ahora, con calma, que la quiero escuchar.
>
> [botones: (No, está todo)]

**Narrador** `[CI3]`: [toca: No, está todo]

## Bloque 4 · Adolescencia

**Biógrafo** `[M25.3 + EN4]`:
> Bien, entonces.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chica y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Narrador** `[AD2]`: Estaba en el colegio, haciendo la secundaria. Iba al Liceo Municipal, aquí en Mar del Plata. Era la época de cambios, vos, empecé a estar más pendiente de cómo me veía, de la ropa. Tenía amigas, íbamos juntas al colegio, nos sentábamos a charlar después de clase. Recuerdo que una vez, con un grupo de amigas, nos escapamos a la playa después del colegio sin avisar en casa, y volvimos con arena en el uniforme. Mi mamá casi se vuelve loca cuando me vio. Pero bueno, eran travesuras de esa edad.

**Biógrafo** `[M3.7 + AD3]`:
> Quedó guardado, Amalia. Sigo con la que viene.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Narrador** `[AD3]`: Sí, tenía un grupo. Éramos un montón de chicas del liceo, y los fines de semana nos juntábamos. A veces íbamos a la playa, a veces a alguna fiesta que había en casa de alguien. Recuerdo una noche que fuimos a un baile en el club, y fue hermoso. Estábamos todas lindas, con nuestros vestiditos. Bailábamos, reíamos sin parar. Fue en esa época cuando empecé a fijarme en los hombres, ¿vos? Todo era nuevo, todo emocionante. Esa fue una época linda de mi vida.

**Biógrafo** `[M3.8 + AD5]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche. Y si la primera no te vuelve, contame cómo eran esas salidas en general.

**Narrador** `[AD5]`: La primera vez que salí a un baile de verdad, fue con mi mamá y mis hermanas. Tardé horas en arreglarme. Me puse un vestido que mi mamá me había hecho, peinado, un poco de rouge en las mejillas. Mi papá me miraba desde el sillón con una sonrisa rara, como si no supiera si dejarse ir o no. Mi mamá me dijo "Te ves hermosa, hija." Fue en el club, había música, chicos. Fue emocionante, claro que sí.

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Amalia. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Narrador** `[AD6]`: Un chico del liceo. Se llamaba Fernando. Me enamoré de él de verdad, por primera vez. Era alto, moreno, me miraba y se me cortaba la respiración. Él me invitó a salir al cine, y fue lo más hermoso que me pasaba en ese momento. Pero duró poco, después se fue de Mar del Plata. Fue mi primer corazón roto.

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chica? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Narrador** `[AD12]`: Cuando mi mamá enfermó durante una temporada, y tuve que cuidar de mis hermanas. Tenía diecisiete años. Mi mamá no era nada grave, pero estaba débil, y de pronto yo tuve que cocinar, limpiar, ir al mercado, todo. Fue el momento en que me di cuenta de que no podía ser chica más tiempo. Tenía que ser responsable. Mis hermanas me preguntaban qué hacer, y yo tenía que saber las respuestas. Fue entonces cuando sentí que crecí.

**Biógrafo** `[M26 + AD15]`:
> Gracias, Amalia.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[AD15]`: La muerte de mi papá fue lo más duro. Pero de eso no quiero hablar ahora, si me permitís.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Amalia. Queda guardado con cuidado.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquila, que hay tiempo.
>
> [botones: (No, está todo)]

**Narrador** `[CI4]`: Creo que está todo, gracias.

## Bloque 5 · Juventud

**Biógrafo** `[M24.1 + EN5]`:
> Gracias, Amalia. Eso también va al libro.
>
> Pasamos a tu juventud: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Narrador** `[JU1]`: Me fui cuando me casé con Horacio. Fue el 1974, un año después de que nos comprometiéramos. Me fuimos a una casa pequeña que alquilábamos, cerca de acá todavía en Mar del Plata. Cuando dejé la casa de mi papá y mi mamá, lloré. Recuerdo que mi mamá me daba las cosas que había hecho para la nueva casa, mantelería, cosas así. Mi papá me cargaba la valija al auto. Fue un adiós que se sentía definitivo, aunque siguiera viendo a mis viejos casi todos los días. Horacio me sostenía la mano en el auto.

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Narrador** `[JU2]`: Estudié para maestra jardinera. Eran tres años, y me encantaba. Iba a clase, estudiaba con mis amigas, tenía prácticas en los jardines. Era una época linda, de mucha ilusión.

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Narrador** `[JU4]`: Mi primer día como maestra jardinera fue un desastre hermoso, la verdad. Entré al aula y los chiquitos me rodearon, todos querían hablar a la vez. Yo no sabía qué hacer. Pero después de un rato, los senté en ronda, canté una canción, y todo cambió. Ellos me miraban atentos, como si fuera lo más importante del mundo. Ese fue el momento en que entendí que era lo mío. Pasé veinte años haciendo eso, trabajando con chicos de tres a cinco años, enseñándoles, cuidándolos.

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Narrador** `[JU5]`: No, nada de eso. El liceo era bastante normal. Mi papá era estricto pero no militar. Éramos una familia de pescador, así que lo que había era orden en casa, porque mi mamá lo exigía.

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Quedó guardado, Amalia. Sigo con la que viene.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Capaz ya me contaste algo de esa mudanza; ahora contame la llegada: el primer día, dónde dormiste esa noche, quién te esperaba y qué fue lo que más te costó.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, me mudé) (No, nunca me mudé)]

**Narrador** `[JU8]`: [toca: No, nunca me mudé]

**Biógrafo** `[M25.1 + JU12]`:
> Bien, seguimos.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue? Si la noche justa no te vuelve, contame cómo eran los primeros tiempos ahí. Y si nunca te fuiste de la casa de tus viejos, contame el día en que esa casa pasó a ser tuya, o el rincón que siempre fue tuyo.

**Narrador** `[JU12]`: La casita que alquilaba con Horacio cuando nos casamos. Era chiquita, de dos cuartos, con un patio. La ventana de la cocina daba a la calle, y yo podía ver a los vecinos pasar. La primera noche fue especial, vos. Horacio me cargó en brazos para entrar, como en las películas. Yo había decorado todo con lo que mi mamá me daba: cortinas que ella me había hecho, fotos. La cama era nueva, de hierro. Recuerdo que esa noche no dormí de emoción. Horacio durmió, pero yo me quedé despierta, tocando las paredes, sintiendo que era mío. Esa casa fue la primera en la que pude armar algo. Pasamos años bonitos ahí, hasta que nos compramos la que seguimos después.

**Biógrafo** `[M3.8 + JU15]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Narrador** `[JU15]`: Teníamos un círculo de amigos, parejas como nosotros. Íbamos a la casa de unos, después a la de otros. Nos juntábamos a jugar a las cartas, a charlar, a cenar. Recuerdo una noche que fuimos a casa de unos amigos, y Horacio peleó al póker toda la noche. Yo estaba con las mujeres en el patio, hablando de cosas de la vida, de los chicos que iban naciendo. Fue tranquilo, bonito. Esos amigos siguieron siendo amigos durante años.

**Biógrafo** `[M26 + JU17]`:
> Gracias, Amalia.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[JU17]`: [toca: Paso esta]

**Biógrafo** `[M27.2 + CI5]`:
> Claro, sin problema. Vamos con otra.
>
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.
>
> [botones: (No, está todo)]

**Narrador** `[CI5]`: Sí, creo que está todo. Fue una época linda, la verdad.

## Bloque 6 · Amor y pareja

**Biógrafo** `[M24.2 + AM0 + M1]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ahora vamos al amor. ¿Hubo alguien con quien tuviste una historia en serio? Si hubo, haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después te pregunto más de la primera que fue en serio, y de las que vinieron después también va a haber lugar. Y si no hubo, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, hubo) (No hubo)]

**Narrador** `[AM0]`: [toca: Sí, hubo]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[AM0]`: Sí, hubo. Una sola en serio, la verdad. Horacio. Lo conocí en un baile en el club, como te conté, en 1972. Me enamoré al toque. Nos casamos en 1974 y estuvimos juntos cincuenta años. Tuvimos tres hijos, una vida. No fue siempre fácil, como todas las vidas, pero fue real. Fue profundo. Horacio murió el año pasado, después de luchar contra un cáncer. Eso fue... bueno, la verdad es que no quiero hablar de eso ahora, si me permitís. Pero Horacio fue el amor de mi vida, vos. Eso está claro.

**Biógrafo** `[M3.2 + AM1]`:
> Te escuché. Vamos con la que sigue.
>
> Vamos a la primera que fue en serio. Contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron, y qué fue lo primero que te llamó la atención de esa persona. Si ya me lo contaste cuando hablamos de tu adolescencia, decímelo y vamos a lo que sigue.

**Narrador** `[AM1]`: En el club, en un baile, como ya te dije. Yo andaba con mis amigas, y él estaba con unos compañeros de trabajo. Se me acercó, me pidió para bailar una cumbia. Mientras bailábamos, él no paraba de hablar, de hacerme reír. Me fijé en sus manos grandes, en su sonrisa. Era seguro de sí mismo, pero no prepotente. Después de ese baile bailamos todas las piezas. Nos intercambiamos direcciones, así como se hacía en esa época. Al otro día fue a buscarme a casa. Mi papá lo miró de arriba a abajo, pero después dio el visto bueno.

**Biógrafo** `[M3.3 + AM3]`:
> Lo anoté, gracias. Sigo con otra.
>
> Y después, ¿llegaron a armar la vida juntos: casarse, irse a vivir, lo que haya sido? Si llegaron, contame ese momento: quién lo dijo primero, o si se fue dando solo, dónde estaban, qué se dijeron. Si ya me lo contaste recién, con decírmelo alcanza.
>
> [botones: (Sí) (No llegamos a eso)]

**Narrador** `[AM3]`: [toca: Sí]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[AM3]`: Estábamos en la casa que compartíamos, en el patio. Era una tarde de primavera, muy bonita. Horacio me pidió que me sentara con él. Yo no sabía qué pasaba. Sacó una caja chiquita, me pidió matrimonio. Lloré. Le dije que sí sin pensar. Nos casamos al año siguiente, en 1974, en la iglesia. Mi mamá me ayudó a hacer el vestido. Fue un matrimonio chiquito, íntimos, pero hermoso.

**Biógrafo** `[M3.4 + AM4]`:
> Gracias por contármelo. Seguimos.
>
> Hay días que quedan grabados para siempre: el del casamiento, o el primero viviendo juntos. Contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó. Si ya me lo contaste recién, con decírmelo alcanza.

**Narrador** `[AM4]`: La iglesia estaba llena de velas. Mi vestido lo hizo mi mamá, blanco, sencillo pero precioso. Horacio estaba nervoso, me acuerdo que sudaba. Cuando nos casamos el cura, Horacio me miraba como si fuera lo único que existía en el mundo. Después fuimos a la casa de mi mamá, donde hicimos una comidita. Mi papá me bailo, con los ojos llorar. Mi mamá había hecho una torta, mis hermanas ayudaban en la cocina. Fue todo muy sencillo, muy de familia. Pero lo que más me quedó fue esa sensación de estar en los brazos de Horacio, de saber que ahora éramos un equipo. Era felicidad pura, vos. Eso no se borra nunca.

**Biógrafo** `[M3.5 + AM13]`:
> Guardado, Amalia. Te mando la próxima.
>
> Contame una pelea que tuvieron, de esas que después dan risa: por qué fue, quién aflojó primero y cómo hicieron las paces. Si no hubo ninguna que hoy dé risa, con decírmelo alcanza.

**Narrador** `[AM13]`: Una vez peleamos porque Horacio llegó tarde a comer y la comida se enfrió. Yo estaba furiosa, no le hablé en toda la tarde. Él llegó con un ramo de flores que había cortado del patio, toda roto. Me pidió perdón de una forma tan ridícula que no pude evitar reír. Después comimos algo rápido y listo, eso fue todo.

**Biógrafo** `[M3.6 + AM8]`:
> Lo tengo, gracias. Vamos con otra.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Narrador** `[AM8]`: Ay, Dios. Hay tantos. Pero si tengo que elegir uno... Una tarde que Horacio llegó del taller con un regalo que no me esperaba. Era un prendedor antiguo que había encontrado. Me lo puso en el pelo, me besó, y nos quedamos en el patio viendo atardecer. Él me contaba del día, de qué había reparado, cómo había estado el trabajo. Yo escuchaba, y de repente me di cuenta de que ese era todo lo que necesitaba en el mundo: estar en ese patio, con Horacio, sin más. No había ruido, no había problemas, era pura paz. Me acuerdo que pensé "esto, así, todos los días, estaría feliz." Ese momento lo tengo guardado como un tesoro, vos. Porque después la vida te da otras cosas, cambios, cansancio. Pero esa paz, esa sensación de total estabilidad con alguien, eso fue lo más hermoso que tuve.

**Biógrafo** `[M26 + AM9 + M1]`:
> Gracias, Amalia.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, hubo un final) (Seguimos juntos) (Paso esta)]

**Narrador** `[AM9]`: [toca: Paso esta]

**Biógrafo** `[M27.3 + AM14]`:
> Perfecto, Amalia. No hace falta entrar ahí. Vamos con la que viene.
>
> ¿Hubo algún amor que te marcó, aunque haya durado poco o no haya llegado a nada? Si lo hubo, contame cómo se cruzaron y el momento que más te acordás de esa persona. Y si no hubo, con un no alcanza.

**Narrador** `[AM14]`: No, ya te conté del Fernando en la adolescencia. Pero después de Horacio, solo él. Nadie más. Fue suficiente una vida entera con un solo hombre.

**Biógrafo** `[M26 + CI6]`:
> Gracias, Amalia.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI6]`: No, creo que está todo. Fue un amor grande, el de Horacio.

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M25.2 + EN7]`:
> Bien, seguimos.
>
> Ahora vamos al trabajo y a tu oficio, Amalia: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Narrador** `[TR1]`: Mi primer trabajo de verdad fue como maestra jardinera. Tenía veintitrés años, recién graduada. Me contrataron en un jardín de acá de Mar del Plata. Recuerdo el primer sueldo que me pagaron: fue poco, pero para mí era una fortuna. Me compré un reloj que quería, una cosa que había visto en una joyería. Me puse tan contenta que le mostré a todos. Después empecé a ayudar en casa con parte del dinero. Fue emocionante sentir que podía ganarme el pan, vos.

**Biógrafo** `[M3.1 + TR6]`:
> Gracias, Amalia. Ya lo guardé.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Narrador** `[TR6]`: Bueno, trabajé veinte años como maestra jardinera. Empecé en los setenta, cuando Horacio y yo nos empezábamos. Mientras trabajaba en el jardín, tuve a mis tres hijos, Marcelo, Silvia y Diego. Combinaba todo como podía. Después, cuando mis hijos fueron más grandes, Horacio me pidió que ayudara en el taller de mecánica que tenía. Yo llevaba la administración, las cuentas, todo eso. Fue trabajo pesado, pero juntos lo hacíamos. Pasé muchos años entre el jardín y el taller. Lo que más me quedó grabado fue el jardín, sin dudas. Ver crecer a esos chiquitos, enseñarles, verlos aprender letras, números, cantar. Eso tiene un sabor que ningún otro trabajo tiene. El taller fue importante también, pero diferente. El jardín era pura ternura, puro futuro.

**Biógrafo** `[M3.2 + TR2]`:
> Te escuché. Vamos con la que sigue.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Narrador** `[TR2]`: Me levantaba temprano, preparaba el desayuno de mis hijos, y después iba al jardín. Llegaba alrededor de las ocho, y los chiquitos ya estaban ahí, con sus mamás. Yo los recibía, los sentaba en la ronda, cantábamos, después hacíamos actividades: dibujo, lectura, juego. Había un recreo donde vigilaba que no se lastimaran. A mediodía servía la colación. Después, más actividades hasta las tres de la tarde. Un día que me quedó fue uno que una nena chiquita, la maga, no sabía sumar. Le enseñé con piedritas, con caramelos. De repente lo entendió, y la cara que puso... era pura alegría. Ese trabajo cambió mi vida, vos. Cada día era importante.

**Biógrafo** `[M3.3 + TR3]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Narrador** `[TR3]`: Mi profesora en la carrera, la señora Dora. Ella me enseñó que un maestro no solo enseña contenidos, sino que toca vidas. Ella era rigurosa, pero amorosa. Una vez que estuve a punto de abandonar, porque sentía que no podía, ella me llamó a su oficina, me hizo un té, y me dijo que veía en mí la vocación. Me pidió que no lo dejara. Creo que sin ella, sin ese empujón, no habría terminado. Ella me acompañó hasta que me gradué, y después fui a verla varias veces al jardín. Le mostraba mis avances. Fue una mentora, vos.

**Biógrafo** `[M3.4 + TR5]`:
> Gracias por contármelo. Seguimos.
>
> ¿Cuál fue el día de trabajo del que estás más orgullosa? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo. Y si no te viene un día puntual, contame de qué parte de tu trabajo estás más orgullosa.

**Narrador** `[TR5]`: Cuando un chiquito que tenía problemas para hablar, porque era muy tímido, logró leer en voz alta en una obra que hicimos en el jardín. Era un nene de cinco años. Sus papás lloraban de la emoción. Yo también lloré. Ese fue el día que supe que lo mío valía la pena.

**Biógrafo** `[M26 + TR11]`:
> Gracias, Amalia.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.
>
> [botones: (Paso esta)]

**Narrador** `[TR11]`: [toca: Paso esta]

**Biógrafo** `[M27.1 + TR8]`:
> Está bien, Amalia. Lo dejamos ahí y seguimos por otro lado.
>
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Narrador** `[TR8]`: No, negocio propio no. El taller era de Horacio. Yo manejaba la administración, pero era de él. Eso me alcanzaba, honestamente.

**Biógrafo** `[M3.6 + CS1]`:
> Lo tengo, gracias. Vamos con otra.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Narrador** `[CS1]`: Cocinar. Yo cocino bien, la verdad. Me encanta hacer milanesas, empanadas, postres. En cada cumpleaños de mis hijos, yo hacía toda la comida. Los amigos de mis chicos venían al cumpleaños esperando la comida que yo hacía. Una vez un amigo de Marcelo le dijo: "La torta de tu mamá es la mejor del barrio." Eso me quedó. También la casa: siempre la tuve limpia, ordenada, con flores en los rincones. Eso era importante para mí.

**Biógrafo** `[M3.7 + CP1]`:
> Quedó guardado, Amalia. Sigo con la que viene.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chica o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Narrador** `[CP1]`: No, nunca. Yo soy de ciudad, siempre en Mar del Plata. El campo no era mi mundo, vos.

**Biógrafo** `[M3.8 + TR9]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Narrador** `[TR9]`: Sí, dejé de trabajar cuando me jubilé. Fue hace bastantes años. El último día en el jardín, mis compañeras organizaron una sorpresita, un té, un regalo. Yo no sabía si estar feliz o estar triste. Porque estar toda la vida con esos chiquitos, y de repente no ir más... fue raro. El día siguiente, me desperté a la hora de siempre, lista para ir al trabajo, y tuve que acordarme de que no. Fue desorientador. Pero poco a poco te acostumbrás.

**Biógrafo** `[M26 + CI7]`:
> Gracias, Amalia.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI7]`: No, creo que está bien. Fueron años linda de trabajo.

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M25.3 + EN8]`:
> Bien, entonces.
>
> Volvemos a la familia, Amalia, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Y si te tocó cuidarlos, contame cómo era un día de esos: qué hacías por ellos, qué te decían. Si no los tuviste cerca, contame cómo fue eso.

**Narrador** `[PG1]`: Mi papá murió cuando yo era joven todavía, así que no pasó mucho tiempo conmigo ya mayor. Mi mamá, en cambio, vivió bastante. Recuerdo un día que le pedí que me ayudara a colgar un cuadro en la pared, algo que ella hacía cuando era joven. Me pidió una silla, y cuando se la di, notamos que tenía miedo de subirse. Sus manos temblaban. Era un gesto chiquito, pero me golpeó. Mi mamá, la que siempre arreglaba todo, ya no podía. Yo la ayudé. Después, pasé más tiempo con ella, hasta que falleció. Esos años de cuidarla fueron importantes.

**Biógrafo** `[M26 + HI0 + M1]`:
> Gracias, Amalia.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Presentámelos de a uno, incluso si alguno ya apareció en lo que me venís contando: cómo se llama cada uno y cuándo llegó. Y si no tuviste, seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, tuve) (No tuve hijos)]

**Narrador** `[HI0]`: [toca: Sí, tuve]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[HI0]`: Tuve tres hijos. Marcelo, el mayor, nació en 1975. Después vino Silvia en 1978. Y después Diego, en 1983. Todos nacieron en Mar del Plata, en la casa. Fueron tres embarazos tranquilos, sin complicaciones. Horacio quería varones, pero cuando vio a Silvia, se enamoró. Fue el momento más hermoso de nuestras vidas. De repente, los dos siendo papás.

**Biógrafo** `[M3.2 + HI2]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Narrador** `[HI2]`: Fue en la casa, con una partera. Estos eran otros tiempos, vos. Horacio me ayudaba, me daba ánimos. Yo tenía miedo, pero también emoción. Mi mamá y mi hermana estaban esperando afuera. Cuando Marcelo nació, lloré. Horacio también. El partera me lo puso en los brazos, y fue como si el mundo desapareciera. Solo existía este chiquito que acababa de llegar. Sus ojos cerrados, su carita arrugadita, sus manitos diminutas. Horacio puso su mano sobre la mía, y sentí que en ese momento, juntos, habíamos hecho lo más importante que podríamos hacer. Mi mamá entró llorando de la emoción. Fue mágico, vos. Eso no se olvida nunca.

**Biógrafo** `[M3.3 + HI3]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Narrador** `[HI3]`: Marcelo era tranquilo, pensador. De chico era sensible, le costaba hablar de sus cosas. Silvia era la dinámica, la que no paraba, siempre metida en algo. Diego era cómico, travieso, nos hacía reír a todos. Una vez, Marcelo agarró la máquina de escribir de Horacio y empezó a escribir historias. Tenía siete años. Las guardaba debajo de la cama. Un día las encontré, y eran hermosas, llenas de imaginación. Silvia, mientras tanto, organizaba a sus muñecas como si fueran en una escuela, daba clases. Ella tenía claro desde chica que quería ser algo así, estar con la gente. Diego se metía en todo, rompía todo, después se disculpaba con una sonrisa que te quitaba el enojo. Fue hermoso verlos crecer, cada uno con su mundo.

**Biógrafo** `[M3.4 + HS1]`:
> Gracias por contármelo. Seguimos.
>
> ¿Cómo fue criar a tus hijos? Quién estaba cerca, cómo se repartían las cosas, o si te tocó llevarla sola. Contame un día de esa época que te acuerdes bien.

**Narrador** `[HS1]`: Criar a los tres fue un trabajo de los dos. Horacio trabajaba, yo también, pero yo estaba más en casa con ellos. Recuerdo un día que Marcelo se cayó del árbol y se rompió un brazo. Yo estaba trabajando en el jardín, me avisaron, dejé todo, corrí al colegio, lo llevé al médico. Horacio llegó después al médico, pero ya estábamos ahí. Esos días fueron de miedo, de cuidados. Pero Horacio estaba, me ayudaba por las noches cuando el nene estaba dolorido. Era un equipo, vos. No siempre fue fácil, pero fue junto.

**Biógrafo** `[M3.5 + HI6]`:
> Guardado, Amalia. Te mando la próxima.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Narrador** `[HI6]`: Cuando Marcelo se graduó de la universidad. Yo estaba ahí, lloré de la emoción. Un hijo mío, que había llegado arrugadito al mundo, ahora tenía un título. Silvia cuando consiguió su primer trabajo importante. Yo le dije que estaba orgullosa de ella. Y Diego, cuando se casó. Lo vi ahí, en el altar, hecho un hombre, y pensé "Lo hice. Lo criamos." Esos momentos te llenan de un orgullo que no se puede describir.

**Biógrafo** `[M3.6 + HI8 + M1]`:
> Lo tengo, gracias. Vamos con otra.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Puede que ya los hayas mencionado; contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, llegaron) (No hay nietos)]

**Narrador** `[HI8]`: [toca: Sí, llegaron]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[HI8]`: Sí, tengo cinco nietos hermosos. El primero llegó a través de Marcelo. Fue una nena, mi Sofía. Recuerdo que Marcelo me llamó al trabajo, me dijo que era nena. Me puse a llorar en el jardín, mis colegas me abrazaban. Cuando la conocí, que la tuve en brazos, fue como volver a vivir ese momento del nacimiento de mis hijos. Pero diferente, vos. Como si fuera más tranquilo, sin miedo. Solo pura ternura. Sus manitas pequeñas agarraban mi dedo. Pensé "Esto es un regalo del cielo."

**Biógrafo** `[M3.7 + HI9]`:
> Quedó guardado, Amalia. Sigo con la que viene.
>
> ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada.

**Narrador** `[HI9]`: Hacemos postres juntos. Cuando vienen a visitarme, vamos a la cocina, y yo les enseño a hacer facturas, tartas, lo que sea. Ellos revuelven, manchan de harina, se comen la masa. Nos reímos. Después comemos juntos lo que hicimos. Una vez, el más chiquito metió una botella de agua en la masa, y casi desastres. Pero fue tan cómico que todos terminamos riendo. Ese momento de estar juntos en la cocina es puro amor, vos.

**Biógrafo** `[M26 + CI8]`:
> Gracias, Amalia.
>
> Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI8]`: Creo que ya está todo. La familia fue lo más importante de mi vida.

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M24.3 + EN9]`:
> Bien, Amalia. Lo sumo a lo que ya me contaste de eso.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Narrador** `[LU4]`: Horacio me llevó a Buenos Aires una vez. Fuimos solos, un fin de semana. Fue especial porque casi nunca nos íbamos, siempre estábamos en Mar del Plata, ocupados con el taller y todo. Visitamos la Catedral, tomamos café en un lugar lindo, caminamos. Horacio me compró una bufanda en la calle. Recuerdo que entramos a la iglesia del Pilar, y nos sentamos en un banco, sin hablar. Fue un momento de paz, de estar juntos sin necesidad de palabras. Ese viaje me enseñó que a veces lo hermoso está en lo simple.

**Biógrafo** `[M3.1 + PA1]`:
> Gracias, Amalia. Ya lo guardé.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Narrador** `[PA1]`: La iglesia. Siempre fui, pero de grande la iglesia se convirtió en más que un lugar. Fue mi comunidad, mis amigas, mi paz. Los domingos iba a misa, después nos quedábamos charlando. Hace años que soy parte del grupo de viudas del barrio. Eso fue mi salvación, honestamente.

**Biógrafo** `[M26 + CI9]`:
> Gracias, Amalia.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquila.
>
> [botones: (No, está todo)]

**Narrador** `[CI9]`: Sí, está todo. Fue una vida plena, la verdad.

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M24.4 + EN10]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Hablemos de los amigos, Amalia, y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Narrador** `[AS1]`: Sí. Mi amiga Graciela. La conocí en la iglesia, hace muchos años. Nos sentamos juntas en una misa, después nos quedamos charlando. Desde ese día somos amigas. Ella también tuvo dificultades en la vida, perdió a su marido años atrás. Nos entendíamos sin necesidad de hablar mucho. Un día, Horacio estaba muy mal, en la cama, y Graciela vino a visitarlo, le traía sopitas, cuidaba. Eso mostró quién era ella. Una amiga de verdad. Hoy, ella está aquí, en el grupo de viudas conmigo. Es una hermana, vos.

**Biógrafo** `[M3.3 + AY1]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Narrador** `[AY1]`: Cuando Horacio estaba enfermo, yo no sabía qué hacer. Mis vecinas, las chicas que vivían a mi lado, se turnaban para venir. Una me ayudaba con la limpieza, otra me traía comida. No me dejaron sola en ese tiempo oscuro. Después, cuando Horacio falleció, ellas estuvieron. Años después, una de ellas tuvo un problema, y yo fui para ella como ella fue para mí. Eso es lo que te quedas, esas redes de amor.

**Biógrafo** `[M3.4 + AS9]`:
> Gracias por contármelo. Seguimos.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Narrador** `[AS9]`: Mi Horacio, por supuesto, aunque no pueda estar. Mis tres hijos, Marcelo, Silvia y Diego. Mis cinco nietos, que le dan alegría a mis días. Graciela, mi amiga, que es como una hermana. Mis hermanas, Teresa y Luisa, aunque una está lejos, pero la siento cerca. Mi mamá estaría ahí también, en mi corazón. Nos sentaríamos alrededor de mi mesa, la que está en esta casa, donde hemos compartido tantas cosas. Yo cocinaría, claro, mis facturas, mis tartas. Horacio estaría ahí en el recuerdo, en el brindis. Esa es mi gente, vos. La que me hizo quien soy.

**Biógrafo** `[M26 + CI10]`:
> Gracias, Amalia.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquila.
>
> [botones: (No, está todo)]

**Narrador** `[CI10]`: No, creo que están todos. Fueron las personas más importantes.

## Bloque 11 · Pérdidas y momentos difíciles

**Biógrafo** `[M25.1 + AV11]`:
> Bien, seguimos.
>
> Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás.

**Biógrafo** `[PE1 + M1]`:
> Puede que ya me hayas hablado de alguna pérdida; acá hay lugar para lo que no entró. Si perdiste a alguien importante, contame de cada uno lo que quieras: qué era para vos, cómo fueron los días de después y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Paso esta)]

**Narrador** `[PE1]`: [toca: Paso esta]

**Biógrafo** `[M27.2 + PE5 + M1]`:
> Claro, sin problema. Vamos con otra.
>
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Paso esta)]

**Narrador** `[PE5]`: Nada grave. Tengo mis cosas, como todos a esta edad. La tensión a veces, algún dolor de espalda. Pero sigo adelante, vos.

**Biógrafo** `[M25.2 + PE4 + M1]`:
> Bien, seguimos.
>
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Y si ya me la contaste, con decírmelo alcanza.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Paso esta)]

**Narrador** `[PE4]`: [toca: Paso esta]

**Biógrafo** `[M27.3 + CI11]`:
> Perfecto, Amalia. No hace falta entrar ahí. Vamos con la que viene.
>
> Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.
>
> [botones: (No, está todo)]

**Narrador** `[CI11]`: No, ya está. Hay cosas que no quiero revivir.

## Bloque 12 · La historia grande

**Biógrafo** `[M25.3 + EN12]`:
> Bien, entonces.
>
> Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.

**Biógrafo** `[HG1]`:
> Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día.

**Narrador** `[HG1]`: El Mundial del setenta y ocho. Ay, eso fue importante. Yo estaba con Horacio, Marcelo tendría tres años. Toda la Argentina estaba de fiesta. Veíamos los partidos en la casa, en la tele, con vecinos. Cuando ganamos, nos salimos a la calle, abrazábamos a desconocidos. Horacio estaba tan emocionado que me levantaba en brazos. Fue un momento de alegría pura, de unidad. Todo parecía estar bien, aunque después entendimos que las cosas no eran como parecían. Pero ese momento, ese tiempo, fue felicidad.

**Biógrafo** `[M3.6 + HG4]`:
> Lo tengo, gracias. Vamos con otra.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado. Y si ninguno se te separa de los demás, contame cómo eran tus días entonces.

**Narrador** `[HG4]`: La pandemia. Ay, eso fue terrible. Recuerdo el primer día que no salí. Horacio y yo en la casa, viendo las noticias. Tenía miedo. No podía ver a mis nietos, mis hijos iban al supermercado con cuidados. Una vez, mi nieta más chica, Sofi, me llamó por video. Yo la veía en la pantalla y quería tocarla. Lloraba. Eso fue lo más duro: la soledad de no abrazar a los que amaba. Pasamos meses así. Horacio y yo cuidándonos, leyendo, rezando. Fue una época de mucho miedo, la verdad.

**Biógrafo** `[M3.7 + DE1]`:
> Quedó guardado, Amalia. Sigo con la que viene.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Narrador** `[DE1]`: Andar sola. Cuando era joven, una mujer no salía sola de noche. Yo quería ir a un baile con amigas, y mi papá me decía que no. Ahora las chicas salen cuando quieren. También la ropa. Yo no podía usar pantalones sin que la gente murmurara. Esas cosas que hoy parecen tontas, en esa época eran serias.

**Biógrafo** `[M3.8 + FI7]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Narrador** `[FI7]`: La política nunca fue mi cosa, honestamente. Pero vivimos la dictadura, eso sí. Fueron años de miedo. No sabías qué podías decir. Horacio nunca se metía en nada, pero teníamos vecinos que desaparecían. Eso quedó marcado. Ahora voto cuando hay que votar, pero no le doy muchas vueltas. Creo que la gente hace lo que puede. Lo que para mí siempre fue importante es la familia, la iglesia, tener paz. Eso es más importante que cualquier político.

**Biógrafo** `[M26 + CI12]`:
> Gracias, Amalia.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.
>
> [botones: (No, está todo)]

**Narrador** `[CI12]`: Creo que está todo. La vida fue lo que fue.

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M24.1 + EN13]`:
> Gracias, Amalia. Eso también va al libro.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó. Si es uno que ya me contaste, decímelo y, si querés, agregale lo que te faltó.

**Narrador** `[GI1]`: El día que conocí a Horacio. Fue en ese baile del club, te lo conté. Pero lo que no te conté bien es cómo me sentí. Yo estaba ahí, con mis amigas, intentando pasar desapercibida, un poco tímida en el fondo. Horacio apareció, me pidió para bailar, y de repente fue como si el mundo desapareciera. Su seguridad, su sonrisa, la forma en que me miraba. Eso fue el clic. Yo supe en ese momento que algo cambiaba en mi vida. Y fue así: cambió para siempre. Si pudiera revivir un momento, sería ese. Esa inocencia de creer que una vida entera estaba por venir, con esa persona. Eso fue lo más hermoso que me pasó.

**Biógrafo** `[M3.2 + GI2]`:
> Te escuché. Vamos con la que sigue.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó. Si ya me lo contaste, con decírmelo alcanza. Y si el día justo no te vuelve, contame lo que te acuerdes de esa época.

**Narrador** `[GI2]`: El día que nací Marcelo, probablemente. O el día que Horacio me pidió que fuera su esposa. Empezó como un día normal, él llegó del taller, e hizo lo que hizo. Esos días que no ves venir, pero que cuando pasa sabés que tu vida tomó un giro hacia la felicidad. Es difícil elegir uno solo. Mi vida estuvo llena de días así, la verdad.

**Biógrafo** `[M3.3 + HJ1]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Narrador** `[HJ1]`: Quería estudiar algo más, quizás seguir estudiando. Pero cuando fueron los hijos, quedó en el camino. No me arrepiento, porque la vida que tuve valió la pena. Pero a veces pienso qué hubiera pasado si hubiera tenido más tiempo solo para mí.

**Biógrafo** `[M3.4 + GI9]`:
> Gracias por contármelo. Seguimos.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquita frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor. Y si no te vuelve un momento puntual, contame frente a qué cosas te pasa eso.

**Narrador** `[GI9]`: El mar. Yo vivo aquí en Mar del Plata toda la vida, pero a veces iba con Horacio de madrugada, a caminar por la orilla. Veía el mar oscuro, infinito, y me sentía tan pequeña. Horacio me agarraba la mano. Yo pensaba en lo insignificante que somos todos frente a eso, frente a la naturaleza, frente a Dios. También en la iglesia, cuando rezaba, sentía eso: que hay algo más grande que yo. Eso me ayudaba a ponerle en perspectiva a los problemas, a la vida misma.

**Biógrafo** `[M3.5 + FI1]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos misma? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Narrador** `[FI1]`: Ahora tengo mucha soledad. Al principio fue difícil. Pero poco a poco aprendí que es bueno. Tengo mis tardes en la casa, me siento en el patio, tomando un té, mirando las plantas que cuido. Recuerdo, pienso. A veces leo. Los domingos voy a misa, después al grupo de viudas, y eso me ayuda a no estar tan sola. Pero esos momentos en el patio, en paz, son míos. La soledad no siempre es algo malo, vos. A veces es curativa.

**Biógrafo** `[M3.6 + FI2]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Narrador** `[FI2]`: Una vez, una chica joven en el supermercado me cedió el asiento en la cola porque yo estaba parada. Me quedé mirándola, y pensé "Ah, entonces ya soy vieja." No era una cosa mala, pero fue un moment de darse cuenta. Fue rápido.

**Biógrafo** `[M3.7 + FI3]`:
> Quedó guardado, Amalia. Sigo con la que viene.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Narrador** `[FI3]`: El orden. Mi mamá era muy ordenada, muy detallista. Yo heredé eso. La casa tiene que estar limpia, las cosas en su lugar. También la dedicación a los otros. Mi papá no hablaba mucho, pero actuaba. Él estaba presente. Yo traté de ser así con mis hijos. Una vez, mi Silvia me dijo "Mamá, vos sos como la abuela con la limpieza," y en ese momento supe que eso que mi mamá me pasó, yo ya se lo había pasado a mis hijos. Es una cadena, vos.

**Biógrafo** `[M3.8 + FI4]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Narrador** `[FI4]`: De joven, sí. Mucho. Cuando era chica me preocupaba qué pensaran de mí en el liceo. Ahora, con la edad, no tanto. Tengo setenta y cuatro años, no tengo tiempo para eso. Digo lo que pienso, hago lo que creo que está bien. Eso es libertad, vos.

**Biógrafo** `[M3.1 + FI6]`:
> Gracias, Amalia. Ya lo guardé.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Narrador** `[FI6]`: Creo que va a ser diferente, más avanzado en tecnología, pero espero que la gente siga teniendo amor. La familia, los amigos, eso. Me gustaría que no se pierda el trabajo de las manos, las cosas hechas con cuidado, la cocina hecha en casa. Me gustaría que mis bisnietos, cuando lleguen, sepan que sus abuelos vivieron con amor, con esfuerzo. Eso es lo que uno quiere dejar, vos. Una huella de calidez.

**Biógrafo** `[M26 + CI13]`:
> Gracias, Amalia.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquila.
>
> [botones: (No, está todo)]

**Narrador** `[CI13]`: No, creo que está bien. Ya está mi vida toda acá.

## Bloque 14 · Hoy

**Biógrafo** `[M25.1 + EN14]`:
> Bien, seguimos.
>
> Dejamos el pasado un rato y venimos a hoy, Amalia: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Narrador** `[HO1]`: Me despierto alrededor de las seis. No necesito despertador, mi cuerpo lo sabe. Hago una taza de té con tostadas. Después me arreglo, me aseo. Si es domingo, me visto para ir a misa a las diez. Después de misa, si es domingo, voy al grupo de viudas. Hablamos, nos contamos cosas, es como una familia. Si es entre semana, hago compras, limpias, riego mis plantas. A veces vienen mis hijos, mis nietos. Comemos juntos. A las siete de la tarde, enciendo la tele, veo una novela. Ceno algo liviano, rezo antes de dormir, y apago la luz alrededor de las nueve. Es una vida tranquila, sin grandes emoción, pero es mi vida y está bien así. Hay momentos en que el silencio pesa, pero la rutina ayuda.

**Biógrafo** `[M3.3 + HO2]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado. Y si la última no te vuelve, contame con qué te reís seguido.

**Narrador** `[HO2]`: Los chistes de mis nietos. Ellos llegan con cosas que dicen, y me muero de risa. También con mis amigas del grupo, compartimos historias. A veces nos reímos de nosotras mismas, de lo difícil que es envejecer. La última vez, la más chica de mis nietas hizo una imitación de mí diciendo "¿Dónde están mis lentes?" Nos reímos todos un montón.

**Biógrafo** `[M3.4 + HO5]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Narrador** `[HO5]`: La libertad, honestamente. Después de tanta vida juntos, ahora hago lo que quiero. Si quiero quedarme en bata todo el día, me quedo. Si quiero rezar una hora, rezo. Si quiero cocinar algo especial, lo hago. Esta semana, el jueves, me desperté, y simplemente pinté mis uñas de rojo. Rojo, así de repente. Me miré las manos y pensé "Todavía tengo ganas de vida." Eso fue.

**Biógrafo** `[M3.5 + CO1]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Narrador** `[CO1]`: Las milanesas. Las hago como mi mamá me enseñó, pero con mi toque. La gente lo nota. Mis hijos, cuando vienen, piden milanesas. Una vez, Marcelo trajo a su novia, ahora esposa. Le dije "te voy a hacer milanesas." Ella comentó después que eran las mejores que había comido. Horacio también las adoraba. Es una cosa simple, pero hecha con amor, vos. Eso es lo que diferencia.

**Biógrafo** `[M3.6 + HO9]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Narrador** `[HO9]`: Vivo en la misma casa de siempre, en Mar del Plata. Ya no es la casita chiquita que alquilábamos, es más grande. Horacio y yo la compramos hace años. El barrio es tranquilo, con gente que se conoce. Tengo vecinos que han estado desde siempre. Hay tiendas, una iglesia cerca. Mi patio es mi refugio, lleno de flores y plantas que cuido. Hace poco, una mañana, salí a regar y el sol estaba perfecto. Las plantas brillaban. Un pajarito cantaba en el limonero. Eso fue un momento. Simple, pero lleno de paz. Eso es lo que me gusta de donde vivo, la paz.

**Biógrafo** `[M26 + CI14]`:
> Gracias, Amalia.
>
> Con esto cerramos lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquila.
>
> [botones: (No, está todo)]

**Narrador** `[CI14]`: No, creo que está todo. Mi vida de ahora es simple, pero está completa.

## Bloque 15 · Legado y cierre

**Biógrafo** `[M25.2 + EN15]`:
> Bien, seguimos.
>
> Ya estamos en la última parte, Amalia: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Narrador** `[LE1]`: Mis hijos. Que crecieron bien, que son personas de verdad, que cuidan de otros. Marcelo es sensible, Silvia es fuerte, Diego es amoroso. Los tres tienen sus propias familias, sus propias vidas. Y es porque nosotros, Horacio y yo, hicimos algo bien. No fue fácil, hubo momentos difíciles, pero los hijos salieron bien. Eso es lo que me enorgullece. El momento en que me dije "Mira, lo lograste" fue cuando vi a Marcelo con su familia, siendo papá como lo fue su papá. Eso, para mí, es un logro. Haber criado gente buena, eso es lo que va a quedar.

**Biógrafo** `[M3.8 + LE2]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos misma descifraste viviendo.

**Narrador** `[LE2]`: Que la familia lo es todo. Los amigos, el dinero, el trabajo, todo eso es importante, pero la familia es el corazón. También que el amor no es solo sentimiento, es acción. Es estar, es cuidar, es cocinar, es limpiar, es perdonar. Que aprovechen el tiempo con los que aman, porque se va rápido. No dejen pasar los días sin decirle a alguien que lo quieren. Y que confíen en Dios, en lo que sea que sea para cada uno. La fe te sostiene en los momentos oscuros. Y por último, que disfruten. La vida es para vivir, no para sufrir. Hay que encontrar las pequeñas alegrías, los momentos sencillos que valen más que cualquier cosa.

**Biógrafo** `[M3.1 + FU1]`:
> Gracias, Amalia. Ya lo guardé.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Narrador** `[FU1]`: Ver crecer a mis bisnietos. Que lleguen mis bisnietos, quiero verles la cara, agarrarles la mano. Y quiero seguir cocinando para mi familia, que sigan viniendo a comer a mi casa. Eso es lo que me queda por hacer.

**Biógrafo** `[M3.2 + LE7]`:
> Te escuché. Vamos con la que sigue.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Narrador** `[LE7]`: "Una vida de amor." Porque eso fue todo: amor a una persona, amor a mis hijos, amor a Dios. Fue una vida vivida en el amor, y eso es lo que importa.

**Biógrafo** `[M3.3 + M15]`:
> Lo anoté, gracias. Sigo con otra.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> Abuela, ¿qué fue lo primero que te enamoró del abuelo? Sofi

**Narrador** `[FAM1]`: Sofi, mi amor. Primero fue su seguridad. Él entraba como si dueño del mundo, pero no de una manera prepotente, sino con una tranquilidad que me hipnotizaba. Después fue su sonrisa. Cuando me miraba y sonreía, yo sentía que estaba en el lugar correcto. Pero lo que más me enamoró fue verlo después, años más tarde, siendo papá. Verlo acariciar a tu papá como bebé, cantarle, cuidarlo. Ese hombre seguro de sí mismo se transformaba en algo más dulce cuando estaban ustedes. Eso fue lo que me quedó para siempre de tu abuelo, Sofi. No fue un momento, fue toda una vida de descubrir por qué lo amaba. Cada día había algo nuevo. Espero que vos encuentres alguien que te ame así, que te sorprenda cada día. Te quiero mucho, nena.

**Biógrafo** `[M3.4 + FO1]`:
> Gracias por contármelo. Seguimos.
>
> Otra cosa, Amalia. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Tomate el tiempo que necesites para buscarla: la pregunta que sigue te la mando cuando me llegue la foto o me digas algo. Y si no la encontrás, no pasa nada: el libro va igual, y la podés mandar más adelante.
>
> [botones: (No tengo foto)]

**Narrador** `[FO1]`: [toca: No tengo foto]

**Biógrafo** `[M25.3 + LE9]`:
> Bien, entonces.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Narrador** `[LE9]`: No. Creo que ya está todo. Mi vida está acá, en cada cosa que conté.

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Narrador** `[LE8]`: A mis hijos, Marcelo, Silvia y Diego, les quiero decir que estoy orgullosa de ustedes. De cómo viven, de cómo aman, de cómo crían a sus hijos. No fueron fáciles los años, pero ustedes hacen que todo haya valido la pena. A mis nietos, que se amen entre ustedes, que se cuiden. La familia es lo que les queda. A mis hermanas, Teresa y Luisa, aunque no las veo seguido, las llevo siempre en el corazón. Y al abuelo Horacio, si de alguna manera puede leer esto desde donde esté, quiero que sepa que lo amo más cada día que pasa. Que fue el mejor hombre, el mejor papá, el mejor compañero. Que disfruten la vida, que amen sin miedo, que perdonen, que rían. La vida es corta, y hay que vivirla con el corazón. Y si en algún momento se sienten solos o perdidos, recuerden que aquí hubo una abuela que los amó, que cocina para ustedes en su patio, que reza por ustedes cada noche. Eso no se borra nunca.

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Amalia. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Y si te quedó alguna foto por mandar, mandámela por acá cuando la encuentres: entra igual. Fue un gusto enorme escucharte.
