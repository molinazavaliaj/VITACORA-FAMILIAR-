# Simulación 2: la viuda (Amalia, 74, inventada)

**Qué es:** la entrevista de un narrador **inventado** (Amalia), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Plan: [`PLAN.md`](PLAN.md).

**Cuenta:** 91 preguntas del banco contestadas + 1 de la familia · **130 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

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

**Narrador** `[OR1]`: Ay, qué linda pregunta. Bueno, yo nací en el cincuenta y dos, en Mar del Plata. Mi papá era pescador, trabajaba muy temprano, se iba al agua cuando todavía estaba oscuro. Mi mamá cuidaba la casa y nos esperaba a todos. Vivíamos en una casita de barrio, nada grande, pero mi mamá la tenía impecable, siempre. Me contaban que cuando estaba por llegar yo, ella estaba muy nerviosa, era su primera hija. Mi papá estaba feliz, pero con ese silencio que él tenía, ¿viste? Los hombres de antes no hablaban mucho de esas cosas. Ella me esperaba en casa, mis abuelas estaban ahí cuando nací, todo muy natural, muy de la época. Era un momento lindo para ellos, aunque tenían lo justo para vivir. Pero eso no importaba: querían una hija.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Amalia. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR2]`: Mi papá contaba que su padre, mi abuelo, vino de chico con la familia de un pueblo del interior, no me acuerdo bien cuál. La cosa es que llegaron acá a Mar del Plata sin nada, sin conocer a nadie, y el abuelo se metió en la pesca porque había trabajo. Mi papá me decía que lo aprendió ahí mismo, en el agua, de grande para chico, como se hacía entonces. No tenía estudios pero tenía manos para trabajar, ¿viste? Y la abuela, que Dios la tenga, era una mujer fuerte, parió diez hijos en esa casa chiquita. Mi papá siempre decía que ella fue la que sostuvo todo: el hogar, la ropa, la comida. Eso me lo contaba en la cocina cuando tomábamos mate, con esa manera que tenía de hablar sin emoción pero con mucho respeto. Para él, su madre era una santa.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR5]`: Mi mamá siempre contaba eso con los ojos brillando. Se conocieron en un baile del barrio, creo que en la década del cuarenta y ocho o por ahí. Mi papá era este muchacho tímido, de los que miraban desde la pared, y mi mamá fue con unas amigas. Ella bailaba, estaba linda, y mi papá la vio. Se hizo valor, fue y le pidió un baile. Mi mamá decía que le gustó enseguida, que era serio pero tenía una cara que inspiraba confianza. Bailaron esa noche y después siguieron viéndose, en bailes, en paseos al puerto. No era rápido como ahora, ¿viste? Era lindo, tranquilo. Después pidió matrimonio, cosas de antes, todo muy formal. Mi mamá hablaba de eso como si fuese un sueño, aunque la vida fue dura después. Pero ese baile, eso nunca se le olvidó.

**Biógrafo** `[M26 + CI1]`:
> Gracias, Amalia.
>
> Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora.

**Narrador** `[CI1]`: No, creo que con eso está. Mi papá no era de muchas palabras, así que uno se quedaba con lo que contaba mi mamá. Ella era la que guardaba las historias, la que las contaba en las sobremesas. Lo que más recuerdo es verlo a mi papá en el patio, reparando cosas, siempre con las manos ocupadas. Eso era él: un hombre de hacer, no de hablar. Y eso es lo que me quedó.

## Bloque 2 · La casa y la familia de la infancia

**Biógrafo** `[M24.1 + EN2]`:
> Gracias, Amalia. Eso también va al libro.
>
> Ahora vamos a tu infancia: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Narrador** `[CA1]`: Mi primer recuerdo fuerte es estar con mi mamá en la cocina, tempranito por la mañana. Ella estaba haciendo pan, y yo debía tener cinco o seis años. Recuerdo el olor, eso no se me olvida: el aroma del pan recién sacado del horno. La casa de madera, blanca, con esa ventana grande que daba al patio de atrás. Mi mamá me dejaba amasar un pedacito de masa, y yo estaba concentrada, tratando de hacerlo como ella. Mi hermana Teresa no había nacido todavía, así que era la casa quietita, mi mamá y yo nada más. Ella me hablaba mientras cocinaba, me enseñaba cosas. Y después venía mi papá del puerto, cansado, pero yo le mostraba lo que había hecho. Era un momento bonito, simple. De eso es lo primero que recuerdo claro.

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chica. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Narrador** `[CA2]`: Mi mamá era muy dulce, pero exigente. Nos enseñaba a mantener todo en su lugar, a ser ordenadas. Recuerdo una vez que yo tenía unos ocho años, quería ayudarla a lavar ropa en la batea, en el patio. Ella me dejaba, pero me corregía todo: "así no, Amalia, mirá", y me mostraba cómo se hacía bien. No era áspera, pero era clara. Lo que más recuerdo es que siempre estaba ahí, ¿viste? Aunque tuviera poco, se aseguraba de que yo comiera bien, de que fuera a la escuela limpia y peinada. Cuando empecé el colegio, ella me compró un delantal blanco y lo lavaba cada fin de semana para que siempre estuviera impecable. Eso se me quedó grabado: esa dedicación de una mujer que hacía lo imposible con lo que tenía.

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chica? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Narrador** `[CA3]`: Mi papá se iba muy temprano al puerto, antes de que saliera el sol. A veces me despertaba y lo escuchaba moverse en la casa, calladito. Cuando fui más grande, de chica todavía pero ya de diez u once años, mi mamá me dejaba acompañarlo a veces al puerto, en el camino. Recuerdo la bruma, el olor a sal y a pescado, los botes. Mi papá me dejaba en un lugar seguro mientras él se iba a trabajar. Los otros pescadores lo saludaban, él sonreía pero seguía callado. Trabajaba limpiando el pescado, arreglando las redes. Sus manos olían siempre a pescado, por mucho que se lavara. Yo volvía con mi mamá y después íbamos juntas al mercado a vender lo que él traía. Eso era la vida: el trabajo del puerto, el barrio, la casa. Todo así de repetido, pero eso era lo normal para nosotros.

**Biógrafo** `[M3.6 + CA6 + M1]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste hermanos? Si tuviste, ¿con cuál eras más cercana de chica? Contame alguna aventura que hayan hecho juntos; seguro tienen varias.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[CA6]`: Sí, tengo dos hermanas menores: Teresa y Luisa. Las quiero un montón. Teresa nació cuando yo tenía unos cuatro años, y Luisa dos años después. Con Teresa era más cercana porque había menos diferencia de edad. Recuerdo que jugábamos en el patio, hacíamos casitas con piedras y ramitas. Y cuando vino Luisa, las dos hermanas grandes la cuidábamos, la enseñábamos. Una aventura que recuerdo, tenía unos diez años, las tres nos escapamos para ir al puerto sin decirle a mi mamá. Queríamos ver cómo traían los botes. Mi mamá nos encontró y nos retó bien, pero yo recuerdo que después en casa, mientras nos preparaba la comida, estaba sonriendo de eso. Teresa y Luisa siguen vivas, gracias a Dios, y las veo seguido. Son mis hermanas, ¿viste? A esa edad, sin entenderlo bien, uno ya siente que son parte de la vida de uno para siempre.

**Biógrafo** `[M3.7 + CA16]`:
> Listo, quedó guardado. Sigo.
>
> Contame un día de chica que esperabas con muchas ganas: qué era, quién estaba, qué pasó.

**Narrador** `[CA16]`: Recuerdo el día de mi Primera Comunión. Eso fue un acontecimiento en la familia. Mi mamá me hizo un vestido blanco, me peinó con flores, y mi papá se vistió de lo mejor que tenía. Fue en la iglesia del barrio, a la que vamos todos los domingos. Recuerdo estar nerviosa, concentrada, pensando en todo lo que me habían enseñado. Mi papá estaba serio pero orgulloso, mis hermanas veían desde atrás con sus vestidos nuevos. Después vinieron mis abuelos, mis tías. En casa hicimos un asadito con lo que se podía, nada sofisticado, pero estaban todos contentos. Recuerdo el sabor del pan de mi mamá, ese pan que hacía especial. Era un día en que todo el barrio se enteraba de que ya eras una mujercita, ¿viste? Eso se me quedó marcado, ese sentimiento de que mi familia estaba entera y orgullosa.

**Biógrafo** `[M3.8 + CA17]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[CA17]`: Sí, hay algo. Recuerdo un temporal muy fuerte, cuando yo tenía unos doce años. Llovía muchísimo, hacía un viento que parecía que iba a volar la casa. Mi papá estaba en el agua, pescando, y mi mamá estaba muy preocupada. Me enseñó a rezar con ella, de rodillas, pidiendo que volviera. Pasaron horas así, y yo estaba asustada, no entendía bien pero sentía el miedo de mi mamá. Cuando mi papá llegó, mojado, cansado, mi mamá lloró. Eso me marcó: entender que la vida de mi papá estaba siempre en peligro, que el mar es hermoso pero también es peligroso. Después de eso, cada vez que era malo el tiempo, yo me acordaba de ese momento. No lo hablábamos, pero quedó ahí.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Amalia. Queda guardado con cuidado.

**Biógrafo** `[CI2]`:
> Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquila, que hay tiempo.

**Narrador** `[CI2]`: No, creo que está. Lo que me viene a la cabeza es que la infancia fue simple, tranquila, a pesar de los miedos. Fue una infancia de barrio, de puerto, de mi mamá en la cocina y mi papá en el agua. Eso es.

## Bloque 3 · La escuela y los juegos

**Biógrafo** `[M24.2 + EN3]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad.

**Biógrafo** `[ES1]`:
> ¿Cómo fue tu primer día de escuela? ¿Quién te llevó hasta la puerta, y qué sentiste cuando se fue? Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria.

**Narrador** `[ES1]`: Mi mamá me llevó. Recuerdo el delantal blanco impecable, como te conté, y la mano de mi mamá que me soltó en la puerta del colegio. Yo no quería soltar, me acuerdo, tenía miedo. Ella me dijo "vas a estar bien, Amalia, hacé caso a la maestra" y se fue. Yo me quedé ahí parada, mirando a otros nenes que tampoco querían. La maestra fue dulce, me agarró de la mano y me llevó adentro. En la clase había un pizarrón grande, olor a tiza, otros nenes. Recuerdo estar concentrada aprendiendo a escribir mi nombre. No fue un día terrible, pero sí largo. Cuando mi mamá vino a buscarme, yo salí corriendo. Después uno se acostumbra, ¿viste? La escuela fue bonita, tenía buenos maestros y me fue bien.

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Amalia. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Narrador** `[ES2]`: Sí, tenía una maestra de cuarto grado, la señorita Rodríguez. Era una mujer ya grande, con el pelo gris recogido, muy seria en la cara pero con el corazón dulce. Un día yo no había hecho la tarea, me acuerdo, porque mi mamá no había tenido tiempo de ayudarme, estaban todas ocupadas en casa. Cuando la maestra me preguntó por qué no la había hecho, empecé a llorar. Ella me hizo salir de la clase, me sentó en un banco en el pasillo, y me habló sin gritar. Me preguntó si en casa había problemas. Yo le conté, así de grande, a una adulta que no era mi mamá. Ella me escuchó y después me dijo que fuera a terminar la tarea a su escritorio durante los recreos. Lo hizo durante semanas. A mí me marcó que alguien que no era de mi familia se preocupara así. Eso me enseñó que hay gente buena en el mundo.

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chica, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Narrador** `[ES5]`: Sí, tenía una amiga que se llamaba Beatriz, del barrio. Nos conocíamos desde chiquitas, ella vivía a dos cuadras de mi casa. Pasábamos horas juntas, a veces ayudando a nuestras mamás, a veces en el patio jugando. Recuerdo una tarde que hicimos un picnic, ella y yo, robándonos un poco de pan y queso de nuestras casas, y nos fuimos a la orilla del puerto, escondidas. Nos sentamos en una piedra y mirábamos el agua, hablando de nuestras cosas de chicas, de chicos que nos gustaban, de qué queríamos ser cuando grandes. Para mí era un tesoro esa amistad. Beatriz se fue después, se casó y se mudó a Buenos Aires. La vimos poco después. Pero esa amistad, esa tarde en el agua, se me quedó guardada. Las amistades de chica son así de importantes para moldear a uno.

**Biógrafo** `[M3.3 + ES6]`:
> Anotado. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chica, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Narrador** `[ES6]`: Ay, tengo una. Tenía unos catorce años, en la secundaria. Con Beatriz y otras compañeras, fuimos a la heladería y una de ellas metió la mano sin pagar un helado. Fue tan rápido que casi no me entero. Nos escapamos corriendo, todas riendo. Yo estaba asustada porque sabía que si mi mamá se enteraba me mataba. Escondidas en una esquina, comimos el helado rápido, y una de nosotras quedó de guardia por si venía el heladero. Nunca nos pasó nada, pero durante semanas tuve miedo de que tocaran la puerta y fuera la policía. Era una pavada, pero para mí fue lo peor que hice. Después de eso, nunca más hice algo así. Mi mamá me había enseñado bien, y eso me pesó en la conciencia. Ahora me da risa pensar en eso, en nosotras corriendo, asustadas por un helado. Pero eso me enseñó que las cosas mal hechas pesan.

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Narrador** `[ES7]`: Yo quería ser maestra. Creo que vino de verla a la señorita Rodríguez, como te conté. Me gustaba enseñar, explicar cosas, ver que alguien aprendía. De grande, cuando terminé la primaria, empecé a ayudar en un jardín de infantes del barrio, casi sin cobrar, los sábados. Era una experiencia, ¿viste? Me encantaba estar con los nenes chiquitos, enseñarles a leer, a escribir, hacerlos reír. Mi mamá veía que eso me gustaba y me apoyaba. Después, cuando me casé con Horacio y formé familia, seguí queriendo trabajar con nenes. Eventualmente estudié para ser maestra jardinera y trabajé eso durante veinte años. Fue lo mejor que hice con mi vida además de formar una familia. Cada nene que pasó por mis manos fue importante para mí.

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chica? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Narrador** `[ES9]`: Sí, la iglesia estaba en todo. Mi mamá nos llevaba a misa los domingos, todos juntos. Mi papá no era tan creyente en lo de hablar, pero iba porque la familia iba. Yo ya conté la Primera Comunión, que fue el gran acontecimiento religioso. Pero antes de eso, cuando era muy chica, estaba en catecismo, aprendiendo sobre Dios, sobre los santos. Recuerdo la iglesia con ese olor a incienso que todavía me lleva a ese tiempo. Las mujeres en la primera fila, los hombres atrás. La misa en latín, que no entendía pero respetaba. Mi mamá me enseñó a rezar desde muy chica, por la mañana y antes de dormir. Eso quedó: yo sigo yendo a misa todos los domingos. La fe ha sido importante en mi vida, ayuda a pasar las cosas que vienen.

**Biógrafo** `[M26 + CI3]`:
> Gracias, Amalia.
>
> Con esto cerramos tus años de escuela. Antes de seguir, ¿te quedó alguna historia de esa época dando vueltas, algo que no entró en ninguna pregunta? Contámela ahora, con calma, que la quiero escuchar.

**Narrador** `[CI3]`: No, creo que está. La escuela fue importante, pero lo que más recuerdo es el sentimiento de que todo era más lento, más tranquilo. Teníamos el tiempo de crecer sin tanta prisa como ahora.

## Bloque 4 · Adolescencia

**Biógrafo** `[M24.3 + EN4]`:
> Bien, Amalia. Lo sumo a lo que ya me contaste de eso.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chica y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Narrador** `[AD2]`: Había empezado el secundario, en una escuela que estaba a unas cuadras de casa. Pasaba los días entre la escuela, ayudando en casa y empezando a andar con chicos. A esa edad, descubrís que hay otro mundo afuera, ¿viste? Recuerdo una tarde que fui con un grupo de compañeras a un paseo por la costanera. Era un día hermoso, hacía sol, y uno de los chicos del curso me pidió que caminara con él. Fue una cosa simple, nada especial, pero yo estaba nerviosa, emocionada. Caminamos hablando de todo y nada. Después dejé de verlo porque las cosas de adolescente son así, fugaces. Pero esa tarde me marcó porque fue la primera vez que sentí ese nerviosismo de que le gustabas a alguien. Llegué a casa diferente, mi mamá me miró y supo algo había pasado. No me preguntó, respetó mi mundo.

**Biógrafo** `[M3.7 + AD3]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Narrador** `[AD3]`: Sí, tenía una barra linda. Eran los años sesenta, así que la música estaba en todo: los Beatles, los Beatniks, todo muy emocionante. Nosotras queríamos bailar, queríamos vivir. A los dieciséis pasábamos tiempo en la heladería, en las matiné de cine, en bailes del barrio. Recuerdo una noche que fuimos a un baile en el club, con mis amigas. Había una banda en vivo, la música estaba linda, había mucha gente joven. Bailábamos entre nosotras, pero también esperábamos a que algún chico nos pidiera un baile. Era todo así de simple pero tan emocionante. Una amiga se fue con un chico para el lado oscuro del club, y nosotras la cuidábamos, mirando de cerca. Eran travesuras de adolescente, nada grave, pero había mucha vida en eso. Esa sensación de libertad, de que el mundo te estaba esperando, eso es lo que recuerdo de esos años.

**Biógrafo** `[M3.8 + AD5]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche.

**Narrador** `[AD5]`: Tenía quince años, creo. Mi mamá me dejó ir a un baile en el club, con mis amigas, pero con la condición de que llegara temprano. Recuerdo que me puse un vestido que mi mamá me había ayudado a arreglar, nada lujoso, pero para mí era lo mejor. Me peluquería, me arreglé como pude. Estaba nerviosa, emocionada. Mis amigas vinieron a buscarme a casa, y mi papá las miraba desde el patio, serio. Mi mamá me dijo "cuidate y disfruta". Era la primera vez que salía de noche sin mis papás. Entramos al baile, la música, las luces, todo me parecía mágico. Bailé toda la noche, conocí a otros chicos, me sentí adulta. Cuando volví a casa, mis papás estaban esperando. Mi mamá me preguntó cómo había sido, sonriendo. Era como si hubiera cruzado una línea, de verdad. Después de eso, salí más seguido a bailes y fiestas.

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Amalia. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Narrador** `[AD6]`: Sí, tenía un novio a los dieciséis, se llamaba Juan. Lo conocí en la heladería, estaba con mis amigas y él pasó. Empezamos a hablar, de esas conversaciones boludas que uno tiene. Me gustó al toque. Era un chico que jugaba fútbol, mayor que yo un par de años, con esa seguridad que los más grandes tienen. Nos empezamos a ver, salíamos a pasear por la costanera. Recuerdo una tarde que nos sentamos en una piedra, y él me besó por primera vez. Yo tenía mariposas en el estómago, no sabía qué hacer con mis manos. Fue lindo, pero también pasó rápido. Duramos unos meses, después él se fue a trabajar a otra ciudad y nos perdimos. Pero ese beso, esa sensación de ser importante para alguien, eso quedó. Fue mi introducción al amor, aunque después aprendería qué era el amor de verdad.

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chica? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Narrador** `[AD12]`: Creo que fue cuando mi hermana Luisa se enfermó de algo grave, debía tener yo unos diecisiete años. Estuvo con fiebre alta, y mi mamá estaba asustada. Mi papá estaba trabajando, no había teléfono para avisarle. Mi mamá me pidió que fuera al puerto a buscarlo. Yo sola, con miedo, caminé hasta el puerto, pregunté a los hombres donde estaba mi papá. Lo encontré, le conté. Volvimos corriendo a casa. Mi hermana se recuperó, fue una falsa alarma, pero en ese viaje descubrí que yo podía hacer cosas importantes, que mi mamá confiaba en mí. No era una chica que jugaba más, era alguien que podía resolver. Después de eso, me empecé a ocupar más de la casa, de mis hermanas. Crecí rápido, como pasa en muchas familias.

**Biógrafo** `[M3.3 + AD15]`:
> Anotado. Sigo con otra.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[AD15]`: Sí. Cuando tenía dieciocho años, mi mejor amiga Beatriz, la que te mencioné, se enteró que yo había salido con un chico que ella también le gustaba. Se enojó conmigo, me dejó de hablar. Fue durísimo porque estábamos juntas en todo. Durante semanas no me dirigía la palabra. Yo estaba confundida, triste, no sabía cómo solucionarlo. Finalmente hablamos y arreglamos, pero quedó una grieta. No fue lo mismo después. Ella se fue a Buenos Aires y eso cerró el capítulo. Aprendí que la amistad es frágil a esa edad, que a veces uno hace cosas sin pensar que lastiman a la gente que ama. Fue duro, pero me hizo crecer.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquila, que hay tiempo.

**Narrador** `[CI4]`: No, creo que con eso está. La adolescencia pasó rápido, fue esa mezcla de alegría y dolor que todos tenemos. Después vinieron otras cosas, más importantes. Pero eso quedó atrás.

## Bloque 5 · Juventud

**Biógrafo** `[M24.4 + EN5]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Pasamos a tu juventud, Amalia: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Narrador** `[JU1]`: Me fui cuando me casé con Horacio, en mil novecientos setenta y cuatro. Tenía veintidós años. No fue una despedida dramática, porque Horacio alquiló una casa cerca de la de mis papás, en el mismo barrio. Mi mamá lloró un poco cuando empecé a llevar mis cosas, pero sabía que era lo que tenía que pasar. Mi papá no dijo mucho, pero me abrazó antes de que me fuera. Yo estaba asustada pero emocionada, empezaba mi vida de casada. Los primeros meses iba seguido a la casa de mis papás, mi mamá me enseñaba cosas de la casa, de cómo manejar un hogar. Mi papá envejecía, y después de algunos años, él murió. Mi mamá se quedó con mis hermanas. Yo la visitaba, la ayudaba, pero mi vida ya era otra: la de Horacio, nuestros hijos, nuestro hogar.

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Narrador** `[JU2]`: Después del colegio trabajé. Primero ayudé a Horacio en el taller que él tenía, en la administración. Atendía clientes, llevaba las cuentas, lo que fuera necesario. Fue lindo porque pasábamos tiempo juntos. Pero cuando nacieron nuestros hijos, decidí que quería algo distinto. Estudié para ser maestra jardinera, algo que siempre quise. Recuerdo los primeros días en el instituto donde estudiaba, con otras mujeres de mi edad, aprendiendo sobre desarrollo infantil. Fue emocionante. Después trabajé como maestra durante veinte años. Recuerdo un día que una mamá me vino a buscar a la salida, llorando, porque su hijo había aprendido a leer conmigo. Eso era lo que me daba sentido: saber que contribuía en la vida de esos nenes. Era cansador, pero satisfecho.

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Narrador** `[JU4]`: Aprendí a ser maestra en el instituto, pero la verdadera lección vino después, en el trabajo. Mi primer día de clase como maestra, estaba nerviosa, con treinta nenes de cinco años. No sabía si podía. Entré al aula, puse música, y los nenes empezaron a bailar. Fue como un click: vi que para ellos, yo era todo, toda la autoridad, toda la contención que necesitaban. Empecé a hablarles con calma, a enseñarles a sentarse, a escuchar. Uno de ellos, Carlitos, era un poco rebelde. Lo observé, entendí que estaba triste porque sus papás se separaban. Ese día, en lugar de gritarle, me senté con él y le hablé. Se calmó. Eso me enseñó que ser maestra no era transmitir conocimiento, era ver a los nenes, entender qué les pasaba. Eso aprendí durante esos veinte años, día a día.

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Narrador** `[JU5]`: No, eso no fue para mí. Yo soy mujer, así que no hice la mili. Pero sí tuve disciplina dura en casa, como te conté. Mi mamá era ordenada, exigente. Y en el colegio, los maestros también eran así. Recuerdo que si no hacías bien las cosas, te llamaban la atención. Nada violento, pero era clara la autoridad. Eso me marcó: yo después también fui así con mis nenes en clase, pero sin perder la dulzura.

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Si te pasó, contame cómo lo decidiste: qué te empujó y a quién se lo dijiste primero.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[JU8]`: No, siempre viví en Mar del Plata. Horacio nunca quiso irse, el taller estaba acá, mis papás estaban acá. Nuestros hijos nacieron y crecieron acá. Para mí, Mar del Plata fue mi casa para toda la vida. Visitamos Buenos Aires, algunos pueblos de alrededor, pero vivir en otro lado, no.

**Biógrafo** `[M3.8 + JU12]`:
> Escuchado. Vamos por la siguiente.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue?

**Narrador** `[JU12]`: La primera casa que fue mía fue la que alquilé con Horacio cuando nos casamos. Era pequeña, de dos ambientes, con un patio atrás. La empezamos a armar poco a poco: mi mamá nos ayudó con sábanas, toallas; amigos regalaron cosas; Horacio trabajaba en el taller y con eso comprábamos lo que faltaba. Una mesa de madera que él mismo reparó, sillas, una cama que fue nuestro lujo. Las paredes eran blancas, las pintamos juntos un domingo. Por la ventana de la cocina se veía el patio de los vecinos, muy tranquilo. La primera noche fue rara: estábamos los dos solos, en una casa vacía, escuchando ruidos que no conocía. Yo estaba nerviosa, emocionada, como si fuera una cosa prohibida. Horacio me abrazó, me dijo que todo iba a estar bien, que esa era nuestra casa. Eso fue lo más importante: saber que teníamos un lugar que era nuestro.

**Biógrafo** `[M3.1 + JU15]`:
> Gracias, Amalia. Ya lo guardé.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Narrador** `[JU15]`: Tenía amigos que conocía del barrio, de la época en que andaba de novia. Horacio tenía sus amigos del taller, otros mecánicos. A veces nos juntábamos en la casa, hacíamos un asado, tomábamos vino, hablábamos. Recuerdo una noche que vinieron unos amigos con sus parejas, y las mujeres nos fuimos a la cocina mientras los hombres jugaban cartas. Cocinamos juntas, reíamos de cosas que pasaban, de los maridos, de la vida. Una amiga, Marta, estaba embarazada de su primer hijo, asustada. Yo ya tenía a Marcelo, así que le contaba mis experiencias. Fue un momento lindo, de complicidad entre mujeres. A medida que pasó el tiempo, tuvimos menos tiempo para esos encuentros porque vinieron más hijos, más trabajo, pero esos amigos siempre estaban. La vida adulta es así: los amigos van siendo menos frecuentes, pero más profundos.

**Biógrafo** `[M3.2 + JU17]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[JU17]`: Sí, hay algo. Estaba embarazada de nuestro cuarto hijo, entre mis otros dos. Era un embarazo que queríamos, pero pasó algo, perdí el bebé. No... prefiero no hablar mucho de eso. Fue duro. Horacio me cuidó, mi mamá estuvo ahí. Pero el dolor de perder un hijo que no llegó a nacer... de eso no quiero hablar ahora. Lo que importa es que después tuvimos a Diego, y eso ayudó. Dejémoslo ahí.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI5]`:
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.

**Narrador** `[CI5]`: No, creo que está. La juventud fue eso: armar una vida con Horacio, nuestros hijos llegando, la casa, el trabajo. Fue lleno y rápido. Después vino todo lo demás.

## Bloque 6 · Amor y pareja

**Biógrafo** `[M24.1 + AM0 + M1]`:
> Gracias, Amalia. Eso también va al libro.
>
> Ahora vamos al amor. Haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después vamos de a una, empezando por la primera que fue en serio. Si no hubo, decímelo nomás, que también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM0]`: Bueno, si contamos los enamoramientos, hubo varios. Pero en serio, hubo uno de adolescente, Juan, que duramos unos meses. Después en la juventud temprana, cuando empecé a trabajar, estuve de novia con otros chicos, nada serio. Pero la relación de verdad fue con Horacio. Lo conocí en mil novecientos setenta y dos en un baile, nos casamos en mil novecientos setenta y cuatro, y estuvimos casados cincuenta años hasta que murió hace dos años. Eso fue el amor serio de mi vida. Los otros fueron noviazgos de chica, pero Horacio fue otra cosa. Empecemos por ahí.

**Biógrafo** `[M3.3 + AM1]`:
> Anotado. Sigo con otra.
>
> Contame el día que se conocieron. ¿Dónde fue, quién los presentó o cómo se cruzaron? ¿Y qué fue lo primero que te llamó la atención de esa persona?

**Narrador** `[AM1]`: Fue en un baile en el club del barrio, como te conté. Yo iba con mis amigas, como siempre, a pasar la noche. Horacio estaba ahí con sus amigos. Yo lo vi al entrar, no lo conocía. Era un hombre que se notaba que trabajaba, las manos grandes, los hombros anchos. Tenía una cara seria pero con una mirada que era cálida. En un momento me pidió un baile. Yo acepté nerviosa. Mientras bailábamos, me preguntaba cosas sobre mí, me escuchaba. No era como los otros chicos que solo querían alardear. Él hablaba poco pero escuchaba mucho. Después de ese baile, volvió a buscarme. Y así empezó. Lo que me enamoró fue su quietud, su seriedad, la sensación de que era un hombre de verdad, no un chico. Y después, con los años, descubrí que debajo de esa seriedad había un hombre bueno, que me amaba sin decirlo todo el tiempo.

**Biógrafo** `[M3.4 + AM3]`:
> Gracias por contármelo. Seguimos.
>
> Y después, ¿cómo decidieron armar la vida juntos: casarse, irse a vivir, lo que haya sido? ¿Quién lo dijo primero, o se fue dando solo? Contame ese momento: dónde estaban, qué se dijeron.

**Narrador** `[AM3]`: Después de un tiempo de andar juntos, Horacio llegó a la casa de mis papás un domingo. Tenía los nervios escritos en la cara. Pidió hablar con mi papá en privado. Yo estaba en la cocina con mi mamá, muerta de curiosidad. Cuando mi papá volvió, estaba sonriendo. Después Horacio me pidió que fuera con él, al patio. Me pidió matrimonio, así, sin anillo siquiera, pero con toda la intención. Me dijo que quería que fuera su esposa, que quería una vida conmigo. Yo lloré, no sabía si de felicidad o de miedo. Dije que sí. Mi mamá estaba llorando adentro cuando volvimos. Fue rápido todo: nos casamos dos años después, el matrimonio fue pequeño, en la iglesia, con la familia. No fue elegante pero fue lindo. Lo importante era Horacio y yo, haciéndonos promesas que cumpliríamos durante cincuenta años.

**Biógrafo** `[M3.5 + AM4]`:
> Guardado, Amalia. Te mando la próxima.
>
> Hay días que quedan grabados para siempre. ¿Hubo uno en que se casaron, o en que empezaron a vivir juntos? Si lo hubo, contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó.

**Narrador** `[AM4]`: Ay, ese día. Fue el veintidós de septiembre de mil novecientos setenta y cuatro. Me acuerdo del vestido, que mi mamá me había hecho, blanco, simple pero elegante. Ella me peinó y lloró mientras me arreglaba. Mi papá vino a buscarme a la pieza y se quedó mirándome, sin palabras. Caminé hacia la iglesia del brazo de mi papá, con mis hermanas atrás. Cuando entré y vi a Horacio esperando en el altar, en un traje gris que se veía incómodo, algo cambió en mí. Era real. El cura dio la misa, y cuando llegó el momento de los votos, Horacio me miró a los ojos y dijo su voto con una voz tranquila que me tranquilizó. Yo casi no podía hablar de los nervios. Después fue la salida de la iglesia, la gente tirándonos arroz, el clima hermoso. Volvimos a casa de mis papás, hicimos un asadito, mi mamá había preparado todo. Horacio y yo bailamos nuestro primer baile como casados, a una canción que no recuerdo bien, pero me acuerdo del sentimiento. Esa noche llegamos a nuestra casita, solos, marido y mujer. Fue lo más importante que pasó en mi vida.

**Biógrafo** `[M3.6 + AM8]`:
> Lo tengo. Vamos con otra.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Narrador** `[AM8]`: Uy, es difícil elegir una. Pero si tuviera que guardar una... Fue una tarde de primavera, hace unos años, cuando Horacio estaba todavía bien. Nos sentamos en el patio de atrás, en la mueblita que él mismo había reparado tantas veces. Estaba lindo el día, había flores que mi mamá había plantado hace años. Horacio me tomó la mano sin decir nada. Nos quedamos así, mirando el patio, el cielo, sin hablar. No necesitábamos hablar. Después de cincuenta años juntos, sabíamos lo que sentía el otro. En un momento me dijo, simplemente: "nos salió bien, Amalia". Eso fue todo. Yo lloré. Porque fue cierto: nos salió bien. Los hijos, la casa, la vida que construimos. Fue un momento perfecto de quietud y de saber que habíamos hecho algo bueno juntos. Si pudiera guardar algo, sería eso: la mano de Horacio en la mía, en ese patio, en esa tarde.

**Biógrafo** `[M3.7 + AM9 + M1]`:
> Listo, quedó guardado. Sigo.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM9]`: Sí, tuvo un final. Horacio enfermó hace dos años, un cáncer que... que duró un año. Lo cuidé. No fue... fue lo más difícil de mi vida, ver a un hombre como ese, fuerte, debilitarse. Pero él no se quejaba. Hasta el final fue como era. Murió en casa, con nuestros hijos alrededor. Yo estaba ahí, en la cama con él, hasta el final. Fue un hombre bueno, nada más. Eso es lo que recuerdo: que era un hombre bueno. Hace dos años de eso. Sigo viviendo en la misma casa, sola. Mi mamá murió hace años, mis hermanas vienen a visitarme. Mis hijos me cuidan. Pero la casa está más silenciosa ahora. Perdoná, me cuesta todavía.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[AM19]`:
> Y después de esa historia, ¿hubo un tiempo en que seguiste por tu cuenta? Contame cómo era un día tuyo entonces: qué hacías, quién andaba cerca. Si no hubo un tiempo así, decime no nomás.

**Narrador** `[AM19]`: Sí, hay un tiempo después. Vivo sola, en la casa que siempre fue de nosotros. Me despierro temprano, como es costumbre. Hago el café, desayuno. Después limpio la casa, cosa que siempre hago porque no puedo vivir en desorden. A veces vienen los nietos, eso me alegra. Los miércoles voy a un grupo de viudas en el barrio, mujeres como yo que quedaron solas. Compartimos, hablamos, es bueno estar con gente que entiende. Los domingos voy a misa. Paso tiempo con mis hijos y mis hermanas cuando vienen. Pero hay momentos solos, noches en que la casa está muy silenciosa, que pienso en Horacio. Me siento en el patio donde nos sentamos ese día bonito y me pregunto si él estaría orgulloso de cómo estoy llevando esto. Así es mi vida ahora. No es lo que planifiqué, pero es lo que es.

**Biógrafo** `[M3.8 + AM16]`:
> Escuchado. Vamos por la siguiente.
>
> Si después de esa historia hubo otro amor, contame del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado. Si no lo hubo, decime no nomás.

**Narrador** `[AM16]`: No, no hubo otro. Para mí, Horacio fue único. Tengo setenta y cuatro años, y no creo que eso vaya a cambiar. Me conformo con los recuerdos, con mis hijos y mis nietos, con el grupo de viudas. A esta edad, el corazón ya está ocupado con lo que fue.

**Biógrafo** `[M3.1 + AM13]`:
> Gracias, Amalia. Ya lo guardé.
>
> Contame una pelea que tuvieron, de esas que después dan risa. Por qué fue, quién aflojó primero y cómo hicieron las paces.

**Narrador** `[AM13]`: Ay, tuvimos varias. Recuerdo una que me hace reír todavía. Horacio trajo a unos amigos a la casa sin avisarme, un viernes a la noche. Yo tenía la casa relativa, como estaba, sin nada preparado para comer. Me enojé. Él pensaba que eso era chico, que la casa estaba bien así. Yo le dije que no podía recibir gente así, que necesitaba tiempo para preparar. Fue una tonta pelea porque básicamente él pensaba que yo era exagerada y yo pensaba que él no me respetaba. Nos estuvimos sin hablar un par de horas. Después me pidió disculpas, y yo le preparé unas empanadas que tenía en el congelador. Sus amigos comieron y dijeron que estaban ricas. Horacio me miró y sonrió, como diciendo "ves, con o sin aviso, salió bien". Eso fue lo lindo: que al final siempre podía verlo con humor. Las peleas de verdad nunca las tuvimos.

**Biógrafo** `[M3.2 + AM14]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Tuviste algún amor que te marcó y no fue el de toda la vida? Uno que dejó huella, aunque haya durado poco. Si te pasó, contame cómo se cruzaron y el momento que más te acordás de esa persona.

**Narrador** `[AM14]`: Sí, Juan, el que te mencioné. Duramos poco, pero dejó marca. Él tenía algo que Horacio no tenía: era más expresivo, más romántico, me decía cosas bonitas. Con Horacio era todo más silencioso, pero más profundo. Juan me mostró que era linda, que merecía ser amada de esa manera expresiva. Cuando se fue, lloré mucho. Pero después entendí que lo que pasó con Horacio era más real, más duradero. Sin embargo, Juan me enseñó que uno puede amar de distintas maneras. El momento que más me acuerdo es cuando me pidió que bailara con él en el puerto, al atardecer. Fue romántico, de esos que parecen de película. A veces me pregunto dónde estará, si tendrá una vida buena. Pero Horacio fue mi verdadero amor.

**Biógrafo** `[M26 + CI6]`:
> Gracias, Amalia.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI6]`: No, creo que está. El amor fue eso: una cosa linda de adolescente, una cosa seria y profunda con Horacio. Eso fue mi vida en el amor.

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M24.2 + EN7]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ahora vamos al trabajo y a tu oficio, Amalia: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Narrador** `[TR1]`: Sí, recuerdo el primer trabajo sin cobrar. Cuando tenía dieciséis, diecisiete años, empecé a ayudar en un jardín de infantes del barrio, los sábados. Casi no cobraba, era más que nada por experiencia, porque quería ser maestra. Iba, ayudaba a la maestra, cuidaba nenes, les enseñaba cosas. Mi mamá me decía que eso no era trabajo, que necesitaba cobrar, pero para mí era lo que quería hacer. Después, un día, la dueña del jardín me dio un sobre con dinero. Recuerdo que salí de ahí con ese dinero, no mucho, pero era mío, ganado por mí. Lo usé para comprarme un vestido que quería, nada del otro mundo. Pero sentía que había ganado algo más que dinero: sentía que era valiosa, que mis manos podían hacer cosas que tenían valor. Desde entonces, trabajé casi siempre en algo que amaba, aunque fuera poco dinero.

**Biógrafo** `[M3.4 + TR6]`:
> Gracias por contármelo. Seguimos.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Narrador** `[TR6]`: Bueno, empecé siendo maestra jardinera, pero antes ayudé en el jardín cuando iba a aprender. Después, cuando me casé con Horacio, trabajé en la administración del taller que él tenía. Atendía gente, controlaba las cuentas, todo eso. Fue lindo porque estábamos juntos. Pero cuando nacieron los nenes, dejé eso y me dediqué al hogar. Después, cuando los nenes fueron más grandes, empecé a trabajar nuevamente, ahora como maestra jardinera en serio, durante veinte años. Eso fue lo que más me quedó grabado: ver crecer a esos nenes, enseñarles, ser importante en su vida en ese momento. Después me jubilé. Ahora estoy viuda, sin trabajo. Lo que me quedó de todo eso es que pude hacer lo que amaba: estar con nenes, enseñar, ayudar. No fui rica, pero fui útil. Eso creo que es lo importante.

**Biógrafo** `[M3.5 + TR2]`:
> Guardado, Amalia. Te mando la próxima.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Narrador** `[TR2]`: Un día común empezaba temprano. Me despertaba, desayunaba algo ligero, me arreglaba. Llegaba al jardín unos minutos antes de que llegaran los nenes, ordeno el aula, preparo las actividades del día. Después llegaban, a veces llorando, a veces contentos. Yo los recibía con dulzura, les decía que todo iba a estar bien. Pasábamos horas: actividades, juegos, enseñanza de letras y números, tiempo de descanso. Había conflictos: uno no quería compartir, otro quería ir al baño cada cinco minutos. Yo mantenía el orden pero con amor. A media mañana había merienda, y los nenes comían mientras les contaba historias. Después más actividades, dibujo, música, movimiento. Al final del día, antes de que los buscaran sus papás, les contaba cuentos. Recuerdo un día específico: estaba lluvia afuera, uno de los nenes que era tímido se paró y empezó a bailar en el medio del aula. Los otros lo imitaron. Yo puse música y nos pusimos a bailar todos juntos. Fue un momento perfecto. Eso era mi trabajo: crear esos momentos.

**Biógrafo** `[M3.6 + TR3]`:
> Lo tengo. Vamos con otra.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Narrador** `[TR3]`: Sí, la directora del jardín donde trabajé más tiempo, la señora Elena. Ella fue la que realmente me abrió las puertas. Cuando empecé, yo tenía ciertos miedos sobre si podía hacerlo bien. Ella me vio, me observó y después me llamó a solas. Me dijo que tenía un don para estar con los nenes, que viera que yo podría ser una excelente maestra. Me animó a que siguiera estudiando, a que me perfeccionara. Me dio confianza. Años después, cuando un nene tuvo un problema grave en el aula, ella me apoyó y me enseñó cómo manejarlo. Recuerdo estar en su oficina, llorando porque había sido duro, y ella me dijo "vos hiciste lo mejor que pudiste, eso es suficiente". Esas palabras las cargo todavía. Elena se jubiló hace años, pero siempre que la veo le agradezco lo que hizo por mí. Sin ella, no habría sido lo que fui.

**Biógrafo** `[M3.7 + TR5]`:
> Listo, quedó guardado. Sigo.
>
> ¿Cuál fue el día de trabajo del que estás más orgullosa? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo.

**Narrador** `[TR5]`: Hay uno que todavía me emociona. Fue con un nene llamado Lucas, que tenía serias dificultades para aprender. Otros maestros pensaban que no iba a poder, que le faltaba capacidad. Pero yo vi que solo necesitaba otro ritmo, otra forma de enseñanza. Trabajé con él durante meses, paciencia, métodos distintos. Un día, leyó su primer palabra entera, "MAMÁ". El nene lloró, yo lloré. Su mamá vino a buscarle y le conté. Ella se arrodilló y me abrazó. Dijo que Lucas era su esperanza, que ella había pensado lo peor. Eso para mí fue el éxito más grande: no era que Lucas hubiera aprendido una palabra, era que recuperamos la esperanza en él. Eso me pasó años después, la mamá vino a verme justo cuando me jubilaba y me dijo que Lucas estaba bien, que siguió aprendiendo, que le debía todo a eso. Ese día estoy más orgullosa que de cualquier otra cosa.

**Biógrafo** `[M3.8 + TR11]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.

**Narrador** `[TR11]`: No, gracias a Dios siempre tuve trabajo. Hubo épocas más ajustadas que otras, pero siempre Horacio y yo tuvimos algo. Cuando el taller andaba bien, vivíamos mejor. Cuando andaba mal, nos apretábamos un poco. Pero nunca nos faltó nada esencial. Supongo que fuimos afortunados.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Amalia. Queda guardado con cuidado.

**Biógrafo** `[TR8]`:
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Narrador** `[TR8]`: No, negocio propio no. El taller era de Horacio, y yo trabajaba ahí en la administración, pero no era mío. Después dejé eso para ser maestra. No me arrepiento. A Horacio le fue bien con el taller, fue suficiente para vivir bien. Yo preferí estar con los nenes.

**Biógrafo** `[M3.1 + CS1]`:
> Gracias, Amalia. Ya lo guardé.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Narrador** `[CS1]`: Sí, la cocina. Yo siempre fui buena cocinera. Mi mamá me enseñó, y después lo llevé a otro nivel. A Horacio le encantaba mi comida, mis guisos, mis tartas. Cuando se enfermó, yo hacía cosas que sabía que le gustaban, aunque estuviera malo. Recuerdo una vez que vinieron mis hijos con sus parejas a cenar. Hice un asado, ensaladas, una tarta de chocolate. Los nenes comieron sin parar, y después me dijeron que mi comida era lo mejor de sus vidas. Mi nuera me pidió las recetas. Fue un momento en que sentí que mi cocina era una forma de amar, de cuidar a los que amo. Ahora, viuda, sigo cocinando, aunque sea para mí sola. Es una cosa que me hace sentir que estoy bien.

**Biógrafo** `[M3.2 + CP1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chica o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Narrador** `[CP1]`: No, nunca viví en el campo. Siempre en el pueblo, en Mar del Plata. Mi papá era del puerto, no del campo. Lo que sí conocía era el mar, las tormentas del mar, el clima de la costa. Pero campo, no.

**Biógrafo** `[M3.3 + TR9]`:
> Anotado. Sigo con otra.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Narrador** `[TR9]`: Sí, me jubilé hace años. Mi último día de trabajo fue un día que la escuela me hizo una sorpresa. Los nenes prepararon un acto para mí, canciones, dibujos. Yo lloré. Sabía que se venía ese día, pero cuando llegó fue diferente. Los papás me trajeron flores, regalos. Fue emocionante y triste a la vez. Cuando salí ese día de la escuela, sentí que dejaba una parte de mí. El día siguiente me desperté sin saber qué hacer. Por primera vez en veinte años, no tenía que ir a la escuela. Fue raro. Horacio me dijo que tenía tiempo para hacer otras cosas, para descansar. Pero yo no sabía descansar. Pasó tiempo hasta que aprendí que la vida sin trabajo podía ser buena también, aunque diferente.

**Biógrafo** `[M26 + CI7]`:
> Gracias, Amalia.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.

**Narrador** `[CI7]`: No, creo que está. Lo que más recuerdo del trabajo es que siempre me pagó con algo más que dinero: me pagó con sonrisas de nenes, con la confianza de sus papás, con la sensación de ser útil. Eso es lo importante.

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M24.3 + EN8]`:
> Bien, Amalia. Lo sumo a lo que ya me contaste de eso.
>
> Volvemos a la familia, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Si no los tuviste cerca, contame cómo fue eso.

**Narrador** `[PG1]`: Mi papá envejeció rápido. Recuerdo una vez que estaba de visita en la casa de mis papás, debía tener yo unos veintiocho, veintinueve años. Mi papá intentó arreglar algo en la casa, algo que siempre hacía con facilidad. Pero le temblaban las manos. Se dio cuenta que yo lo veía, se quedó mirando sus manos como si no fueran suyas. En ese momento entendí que mi papá era mortal. Después pasó algo que me marcó para siempre. Mi papá salió a pescar una mañana, como hacía todos los días. Hubo una tormenta inesperada. Nunca volvió. Tenía yo treinta años. Mi mamá quedó destrozada, y mis hermanas pequeñas también. Yo tuve que ser la fuerte para la familia. Fue duro entender que el mar que lo había alimentado toda la vida fue lo que se lo llevó. Desde entonces, cuando miro el mar, pienso en mi papá.

**Biógrafo** `[M3.5 + HI0 + M1]`:
> Guardado, Amalia. Te mando la próxima.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Si sí, contame quiénes son, así los voy conociendo. Y si no, decímelo nomás y seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI0]`: Sí, tuve tres hijos. El primero fue Marcelo, nació en mil novecientos setenta y cinco. Después Silvia, en mil novecientos setenta y ocho. Y el tercero Diego, en mil novecientos ochenta y tres. Marcelo es ingeniero, vive acá en Mar del Plata con su familia. Silvia es contadora, también vive acá. Y Diego estudió administración de empresas. Los tres fueron buenos hijos, nos dieron alegría. Marcelo es serio como su papá, Silvia es más expresiva como yo, Diego es el más rebelde, siempre lo fue. Tengo cinco nietos en total, de los tres hijos. Ahora que enviudé, mis hijos me cuidan, me visitan, me ayudan con lo que necesito. Estoy orgullosa de ellos. Hicimos un buen trabajo con Horacio.

**Biógrafo** `[M3.6 + HI2]`:
> Lo tengo. Vamos con otra.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Narrador** `[HI2]`: Fue en el hospital de Mar del Plata, en mil novecientos setenta y cinco. Yo tenía veintitrés años. Me acuerdo del miedo, del dolor, de no saber bien qué estaba pasando. Horacio estaba en la sala de espera, nervioso. Mi mamá estaba conmigo, sosteniéndome. Fue un parto largo, cansador. Cuando Marcelo nació, la partera lo limpió y me lo puso en los brazos. Fue lo más increíble que pasó en mi vida. Era chiquito, rosadito, dormía. Yo no sabía si reír o llorar. Mi mamá me miraba con una sonrisa que no se le borraba. Cuando Horacio entró en la habitación, se quedó mirando a su hijo sin palabras. Se sentó a mi lado y puso un dedo en la manita de Marcelo. Ese momento, los tres ahí, en silencio, fue perfecto. Después de todo lo que vino, ese momento de quietud con nuestro primer hijo es sagrado para mí.

**Biógrafo** `[M3.7 + HI2b]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tuviste más hijos, o hay alguien más que sentís que criaste o cuidaste como propio? Si fue así, contame cómo fue la llegada de cada uno, con el tiempo que necesites. Cada llegada tiene su historia.

**Narrador** `[HI2b]`: Sí, tuve dos más. Silvia llegó en mil novecientos setenta y ocho, cuando Marcelo tenía tres años. Con Silvia fue diferente porque ya sabía lo que venía. El embarazo fue más fácil, el parto también. Cuando nació, Marcelo entró a la habitación y vio a su hermana. No sabía qué decir. Recuerdo que le preguntaba a la partera si era de verdad. Silvia fue más fácil, más sonriente, diferente a Marcelo. Y después Diego, en mil novecientos ochenta y tres. Para entonces ya tenía cinco años de experiencia, así que fue casi natural. Diego nació en una noche de lluvia, creo que era invierno. Horacio manejaba rápido para llegar al hospital. Diego era el más inquieto, lloraba mucho. Pero después se convirtió en el más cariñoso de los tres. Cada nacimiento fue una bendición. Fueron naciendo y creciendo en la casa, en Mar del Plata, rodeados de nuestro amor.

**Biógrafo** `[M3.8 + HI3]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Narrador** `[HI3]`: Marcelo era serio, ordenado como su papá. Le gustaba jugar solo, con sus juguetes, construía cosas. Silvia era traviesa, curiosa, siempre quería ayudar en la cocina. Y Diego era cariñoso, buscaba los abrazos constantemente. Recuerdo una vez que los tres estaban jugando en el patio. Marcelo había construido un auto con cajas, Silvia y Diego lo querían destruir para hacer otra cosa. Empezó una guerra de cajas, risas, gritos. Yo estaba viendo desde la puerta con un mate. En un momento, los tres se cayeron al patio juntos, muertos de risa, cubiertos de tierra. Después vinieron adentro peleándose por quién iba a ir primero a bañarse. Eso fue lo que hicieron: pelearon, bromearon, amaron. Fue la infancia perfecta, caótica pero llena de vida. Eso es lo que recuerdo: la risa de mis hijos en el patio.

**Biógrafo** `[M3.1 + HS1]`:
> Gracias, Amalia. Ya lo guardé.
>
> ¿Cómo viviste la crianza de tus hijos? ¿La llevaste sola, o tuviste alguna ayuda cerca? Contame un día de esa época que te acuerdes bien.

**Narrador** `[HS1]`: Viví la crianza con Horacio, los dos juntos. Él trabajaba en el taller, yo estaba más en la casa con los nenes. Mi mamá me ayudaba cuando podía, especialmente cuando nació el tercero. Recuerdo un día en que estaba de madrugada con Diego, que lloraba sin parar. Horacio se levantó, me dijo que durmiera, él se lo llevó para que yo descansara. Se lo llevó al patio, caminó con él hasta que se durmió. Cuando volvió a la cama, yo estaba despierta, llorando de cansancio. Él me abrazó y me dijo que iba a estar todo bien. En ese momento entendí que la crianza no era solo mía, era de los dos. Horacio no era un papá que se involucraba en todo, pero estaba ahí cuando se necesitaba. Eso hizo la diferencia.

**Biógrafo** `[M3.2 + HI6]`:
> Te escuché. Vamos con la que sigue.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Narrador** `[HI6]`: Ay, hay muchas. Recuerdo cuando Marcelo se graduó de ingeniero. Vimos a nuestro hijo en el acto, en la toga, diciendo su discurso. Horacio me tomó la mano, los dos llorábamos. Ese chico que jugaba con cajas en el patio ahora tenía una profesión, un futuro. Cuando Silvia tuvo a su primer hijo, la vi siendo mamá, cuidándolo con la dedicación que yo le había enseñado, y vi que yo había transmitido algo bueno. Y Diego, el rebelde, el que nos daba los mayores sustos, cuando decidió asentarse, casarse, trabajar, vi que crecía. Ahora es un buen papá y un hombre responsable. Hay un momento que no puedo olvidar: los tres juntos en el patio de nuestra casa, en un cumpleaños, todos ya con sus familias, sus hijos jugando alrededor. Miré a Horacio, sonrió. Sin palabras, supe que nos había salido bien. Eso es lo que llevo en el pecho.

**Biógrafo** `[M3.3 + HI8 + M1]`:
> Anotado. Sigo con otra.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, me lo decís y pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI8]`: Sí, tengo cinco nietos. El primero llegó con Marcelo. Recuerdo que Silvia me llamó para decirme que el bebé había nacido. Horacio y yo salimos corriendo para el hospital. Cuando lo ví por primera vez, fue como si se cerrara un círculo. Este chiquito era la continuación de Marcelo, y de mí, y de Horacio. Lo cargué, y sentí eso que había sentido con Marcelo: la responsabilidad de amar a este nuevo ser. Su nombre es Lucas, como el nene del jardín. Cuando salimos del hospital, le propuse a Horacio que fuéramos los dos a caminar al puerto al atardecer, para festejar. Caminamos en silencio, mirando el agua. Después Horacio me dijo: "Ahora somos abuelos". Fue un momento perfecto. Los otros cuatro nietos llegaron después, y con cada uno, ese sentimiento se renovó. Mis nietos son la alegría de mi vida ahora.

**Biógrafo** `[M3.4 + HI9]`:
> Gracias por contármelo. Seguimos.
>
> ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada.

**Narrador** `[HI9]`: Sí, hay algo que es nuestro. Cuando vienen a visitarme, los llevo a la cocina y hacemos pan juntos. Les enseño a amasar, a sentir la masa en las manos. Los nenes más chicos juegan, los grandes aprenden en serio. Después ponemos el pan al horno y esperamos juntos a que suba, oliendo ese aroma que yo amaba cuando tenía su edad. Cuando sale del horno, lo partimos y comemos tibio con manteca. Ahí contamos historias, reímos. Es algo que solo hacemos acá, con la abuela. Mis hijos me dijeron que es lo que los nenes más esperan. La semana pasada vino mi nieto Lucas, el de Marcelo, que tiene ocho años, y me dijo: "Abuela, hoy quiero aprender a hacer tu pan especial". Eso fue lo que quería escuchar. Ese pan es una forma de transmitir lo que soy yo a la próxima generación.

**Biógrafo** `[M26 + CI8]`:
> Gracias, Amalia.
>
> Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI8]`: No, creo que está. La familia fue lo importante de mi vida. Con Horacio y nuestros hijos, después los nietos. Ese es el libro, ¿viste? La familia.

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M24.4 + EN9]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Narrador** `[LU4]`: Fuimos una vez a Buenos Aires con Horacio, cuando los chicos ya eran grandes. Fue una sorpresa que me armó. Nos fuimos en micro un viernes, sin que yo supiera bien para dónde. Cuando llegamos a la Capital, Horacio tenía todo planeado. Fuimos a ver la Casa Rosada, caminamos por la Boca, vimos el teatro Colón. Recuerdo una noche que cenamos en un restaurante lindo, con vistas al río, y Horacio me pidió el baile. Bailamos al lado de la mesa, los otros clientes nos miraban sonriendo. Para un hombre como Horacio, que no era romántico, eso fue inusual. Me dijo que quería que viera que el mundo era grande, que no todo era Mar del Plata. Ese viaje me mostró que con el hombre correcto, las cosas simples se vuelven mágicas. Fue importante porque me recorió que después de años juntos, Horacio seguía sorprendiéndome.

**Biógrafo** `[M3.6 + PA1]`:
> Lo tengo. Vamos con otra.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Narrador** `[PA1]`: La iglesia siempre fue importante para mí. Pero después de que Horacio murió, la fe se volvió algo más fuerte. Empecé a ir más seguido, a ayudar en el grupo de viudas del barrio. Es un grupo de mujeres como yo, que quedaron solas. Nos reunimos los miércoles en la sacristía, tomamos té, hablamos de nuestras vidas, de cómo llevar el duelo. Un miércoles recuerdo que una de las mujeres, Rosa, estaba muy triste porque era el aniversario de la muerte de su marido. Todas nos acercamos, la escuchamos, rezamos con ella. Yo preparé unos bizcochos que había hecho en casa. Compartimos, lloramos, reímos un poco. Fue un día donde sentí que hacía algo importante, que el dolor compartido es menos dolor. Ese grupo se volvió mi familia ahora, mis hermanas de fe. Me dedico a eso, a estar presente para ellas.

**Biógrafo** `[M26 + CI9]`:
> Gracias, Amalia.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquila.

**Narrador** `[CI9]`: El patio de atrás. Ese rincón fue mío durante toda mi vida. Ahí tendía la ropa, sembraba flores, me sentaba a descansar. Con Horacio, ese patio fue testigo de todo. Ahora, viuda, sigo yendo al patio. Es el lugar donde siento que él está más cerca.

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M24.1 + EN10]`:
> Gracias, Amalia. Eso también va al libro.
>
> Hablemos de los amigos y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Narrador** `[AS1]`: Sí, tengo una amiga que se llama Marta. La conocí cuando mis hijos estaban en la escuela, nuestros chicos jugaban juntos. Ella vivía cerca de casa. Empezamos a tomar café juntas mientras los nenes jugaban. Con el tiempo, se volvió una amistad profunda. Cuando Horacio estaba enfermo, ella venía a estar conmigo. Se sentaba en silencio, me escuchaba llorar, no necesitaba hablar. Cuando Horacio murió, fue de las primeras en venir. Ahora, viuda, Marta es alguien en quien puedo confiar. Recuerdo una vez que tuve un mal día, no quería hablar con nadie. Ella vino a la casa, me hizo té, se sentó en el patio conmigo. Nos quedamos calladas, mirando el patio, y eso fue suficiente. Eso es una amistad: estar sin necesidad de palabras. Marta es importante para mí.

**Biógrafo** `[M3.8 + AY1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Narrador** `[AY1]`: Sí, cuando Horacio se enfermó. Fue lo más duro de mi vida, cuidarlo, verlo deteriorarse. Mis hijos vinieron a ayudar, pero fueron mis hermanas y Marta las que estuvieron todos los días. Mi hermana Teresa venía a hacer comida, para que yo no tuviera que cocinar. Mi hermana Luisa venía a limpiar la casa. Marta venía a estar con Horacio para que yo pudiera descansar un poco. Mi papá ya había muerto, así que mi mamá no estaba para ayudar, pero mis hermanas lo hicieron. Un día me derrumbé, no podía más. Fue Luisa la que me vio, me llevó a la cama y se quedó durmiendo conmigo. Fue un acto simple pero que lo cambió todo. Después, cuando Horacio murió, esa ayuda continuó. Ahora, viuda, intento devolver esa ayuda. Cuando Marta tuvo un problema con su hijo, yo estuve para ella. Cuando una de mis hermanas necesita algo, voy. Es como un círculo: la ayuda que recibís, la devolvés.

**Biógrafo** `[M3.1 + AS9]`:
> Gracias, Amalia. Ya lo guardé.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Narrador** `[AS9]`: Ah, eso sería hermoso. En esa mesa se sentarían mis hijos: Marcelo, Silvia y Diego, con sus parejas e hijos. Se sentaría Marta, porque es mi hermana de corazón. Se sentarían Teresa y Luisa, mis hermanas de sangre. Quizás la abuela de mi papá, si pudiera. Y Horacio. Él estaría ahí, aunque sea en el espíritu. Serían los que construyeron mi vida, los que estuvieron cuando necesité, los que me amaron sin condiciones. Yo haría mi mejor comida, ese pan que amo, un buen asado. Nos comeríamos la mano mirando esa mesa llena de gente que amo. Escucharíamos risas, historias, los nenes jugando. Eso sería el cielo para mí: estar rodeada de mi gente, viéndolos felices, sabiendo que hicimos algo bien en esta vida. Esa cena sería la confirmación de que vivimos bien.

**Biógrafo** `[M26 + CI10]`:
> Gracias, Amalia.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquila.

**Narrador** `[CI10]`: No, creo que está. La gente importante está. Los demás fueron pasando, pero estos fueron los que se quedaron.

## Bloque 11 · Pérdidas y momentos difíciles

**Biógrafo** `[M24.2 + AV11]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás.

**Biógrafo** `[PE1 + M1]`:
> ¿Perdiste a alguien importante en tu vida? Si querés, contame quiénes fueron, qué eran para vos y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE1]`: Sí, perdí a varias personas importantes. Primero a mi papá, cuando tenía treinta años. Después a mi mamá, cuando era más grande, debía tener unos sesenta. Y hace dos años, a Horacio, mi marido de cincuenta años. Mi papá se fue demasiado pronto, no estaba listo. Con mi mamá tuvimos más años, la vi envejecer, fue más fácil de llevar. Pero Horacio, no. Horacio fue la pérdida más grande. Lo cuidé hasta el final, vi cómo se iba, y no pude hacer nada. Cada muerte fue diferente, cada una dejó una marca distinta. Mi papá dejó un vacío que nunca se llenó del todo. Mi mamá dejó sus enseñanzas, que sigo usando. Horacio dejó un silencio en la casa que todavía duele. Pero recordarlos es una forma de mantenerlos vivos. A mi papá le debo la fortaleza. A mi mamá le debo el orden y la dedicación. A Horacio le debo el ejemplo de que la vida es lo que construimos con quien amamos. Los cargo conmigo.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE5]`: Nada grave, gracias a Dios. He tenido mis achaquitos, como dicen: presión alta a veces, un poco de artrosis en las manos. Cosas de la edad, nada del otro mundo. Lo que más me afectó fue el estrés de cuidar a Horacio cuando estaba enfermo. Eso me cayó mal, me bajó las defensas. Pero mis hijos me obligaban a descansar, a cuidarme. Ahora estoy mejor, tomo mis remedios, voy al médico cuando tengo que ir. No me quejo. He vivido bien.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE4]`: Creo que ya te las conté: la muerte de mi papá, el aborto, la enfermedad de Horacio. Esos fueron los momentos difíciles. Ahora, viuda, hay momentos en que me siento sola, aunque esté rodeada de gente. Pero eso es normal, supongo. La vida tiene sus momentos duros. Uno sigue adelante.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[CI11]`:
> Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.

**Narrador** `[CI11]`: No, creo que está. Lo más duro ya lo conté.

## Bloque 12 · La historia grande

**Biógrafo** `[M25.1 + EN12]`:
> Bien, seguimos.
>
> Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.

**Biógrafo** `[HG1]`:
> Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día.

**Narrador** `[HG1]`: Viví varios momentos importantes. Recuerdo la Copa del Mundo del 78, cuando Maradona jugaba. Todo el país estaba enloquecido, éramos campeones. Yo lo vi en casa con Horacio, nuestros hijos eran chicos. Salimos a la calle a festejar, el barrio estaba de fiesta. Fue lindo sentir ese orgullo del país. Después vino la guerra de Malvinas, en el 82. Eso fue más duro. Teníamos miedo, porque algunos vecinos tenían hijos que fueron a la guerra. Recuerdo rezar en la iglesia, pidiendo que volvieran bien. Fue un momento tenso, oscuro. Después pasó la dictadura, aunque yo no hablaba mucho de eso. Se respiraba miedo en el aire. Pero en Mar del Plata, seguíamos viviendo nuestras vidas, intentando ser felices. Lo que pasaba en el país nos afectaba, pero estábamos ocupadas en nuestras cosas: los hijos, el trabajo, la familia.

**Biógrafo** `[M3.3 + HG4]`:
> Anotado. Sigo con otra.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado.

**Narrador** `[HG4]`: Recuerdo un día en particular. Era principios de la cuarentena, cuando no podíamos ver a la gente. Estaba en casa, sola, porque Horacio ya estaba enfermo. Mis hijos me llamaban por teléfono para ver si estaba bien. Ese día en particular, mis nietos quisieron verme por video. Se sentaron frente a la cámara, me mostraban sus dibujos. Yo no podía tocarlos, no podía abrazarlos. Cuando se terminó la llamada, lloré. Era raro vivir en un mundo donde no podías tocar a los que amas. Horacio estaba mal ese día, y yo me dediqué a cuidarlo sin poder dejarme llevar por la tristeza. La pandemia fue una época dura: miedo de que Horacio se enfermara de covid, encerrada en la casa. Pero ese día con mis nietos por video, aunque fue triste, también me conectó con ellos. Fue un día que entendí que incluso en las peores circunstancias, el amor encuentra una manera.

**Biógrafo** `[M3.4 + DE1]`:
> Gracias por contármelo. Seguimos.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Narrador** `[DE1]`: Sí, cuando me casé con Horacio, la idea era que me quedara en la casa cuidando a los nenes. Eso era lo normal, lo esperado. Pero cuando los chicos crecieron, yo quería trabajar, quería ser maestra jardinera. Mi suegra me dijo que no era correcto, que Horacio no lo iba a permitir. Que mi lugar era la casa. Pero Horacio, a pesar de ser serio, me apoyó. Así que me fui a estudiar y trabajé durante veinte años. Algunas mujeres del barrio hablaban, decían que era raro que trabajara, que descuidaba mi casa. Yo me reía. Mi casa estaba impecable, mis hijos estaban bien. Pero el mundo ha cambiado. Ahora una mujer que trabaja es lo normal. Cuando veo a mis nietas, veo que tienen oportunidades que yo no tuve. Eso me da alegría. Las cosas que eran mal vistas para nosotras, ahora son naturales. Eso es bueno.

**Biógrafo** `[M3.5 + FI7]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Narrador** `[FI7]`: Para mí, la política nunca fue algo que hablara mucho. Pasé por la dictadura sin entender bien qué estaba pasando, solo sabía que había miedo. Después, cuando vinieron los gobiernos, yo votaba pero no me metía en discusiones fuertes. Mi preocupación era mi familia, mi trabajo, mi casa. A mis hijos les enseñé que pensaran por sí mismos, que eligieran según su conciencia. Ahora, viuda, sigo sin entender mucho de política, pero veo el país y me preocupa. Quisiera que mis nietos tuvieran mejor futuro. Eso es lo que pienso: que los que gobiernen hagan lo mejor para el país y para la gente. No sé si es ingenuo, pero es lo que pienso.

**Biógrafo** `[M26 + CI12]`:
> Gracias, Amalia.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.

**Narrador** `[CI12]`: No, creo que está. Viví mi vida en Mar del Plata, el país pasaba afuera de mi casa, más o menos. Lo que importaba era lo que pasaba adentro.

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M24.3 + EN13]`:
> Bien, Amalia. Lo sumo a lo que ya me contaste de eso.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó.

**Narrador** `[GI1]`: Hay varios, pero si tuviera que elegir uno, sería el día que conocí a Horacio. Ese baile donde todo cambió. Me gustaría vivir eso de nuevo, con la inocencia de no saber lo que venía: que nos íbamos a amar durante cincuenta años, que tendríamos tres hijos increíbles, que viviríamos una vida bien. Si lo reviviera sabiendo lo que sé ahora, lo disfrutaría aún más. Pero hay otro que me hizo clic: fue cuando me llamaron del jardín de infantes para ofrecerme trabajar como maestra. Estaba en mi casa, embarazada de Marcelo, y recibí esa llamada. La directora me dijo que creyeran en mí. Ahí entendí que podía ser algo más que ama de casa, que tenía talento para algo. Eso cambió mi vida. Desde ese día, entendí que podía hacer una diferencia en el mundo, aunque fuera pequeña. Esos dos momentos, ese baile y esa llamada, fueron los que trazaron mi destino.

**Biógrafo** `[M3.7 + GI2]`:
> Listo, quedó guardado. Sigo.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó.

**Narrador** `[GI2]`: Sí, ese día. Hace dos años, el día que el doctor nos dijo que Horacio tenía cáncer. La mañana fue normal: me desperté, hice el café, Horacio se levantó callado como siempre. Íbamos a ir al médico a hacerse algunos análisis porque había estado muy cansado. Yo pensaba que era la presión, la edad. Esperamos en el consultorio, entre gente con sus papelitos. El médico nos llamó. Primero habló con Horacio en privado, yo esperaba afuera. Cuando salió Horacio, vi en su cara que algo había cambiado. El médico me pidió que entrara. Me dijo las palabras: cáncer, avanzado, un año, quizás. Creo que no escuché bien. Horacio se tomó mi mano, fuerte. Salimos del consultorio en silencio. Manejé hasta casa, y recién ahí Horacio lloró. Fue la primera vez que lo vi llorar. Ese día terminó mi vida anterior. Comenzó el tiempo del cuidado, del miedo, del adiós que ya no tenía fin. Desde ese día, cada mañana fue diferente.

**Biógrafo** `[M3.8 + HJ1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Narrador** `[HJ1]`: Quería viajar más con Horacio. Visitamos Buenos Aires, pero quería conocer otros países, Europa, aunque sea. Cuando Horacio enfermó, eso se acabó. Ese día cuando el doctor nos lo dijo, entendí que los viajes que soñábamos no iban a ser. Ahora, viuda, miro fotos de lugares y pienso en lo que pude haber sido. Pero bueno, tuve cincuenta años con Horacio. Eso fue suficiente. No todos tiene eso. Mis hijos me animan a que viaje con mis nietos, pero a esta edad y viuda, los viajes son diferentes. Pero no me quejo. Viví una buena vida.

**Biógrafo** `[M3.1 + GI9]`:
> Gracias, Amalia. Ya lo guardé.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquita frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor.

**Narrador** `[GI9]`: Sí, en el mar. Una vez, cuando era joven, Horacio me llevó al puerto una madrugada. Hacía poco que nos habíamos casado. Nos sentamos en las piedras y miramos el cielo. Eran las tres de la mañana, no había nadie. El cielo estaba lleno de estrellas, el mar movía suave. Yo me sentí tan chiquita en ese momento, tan insignificante. Pero al mismo tiempo, me sentía parte de algo enorme, algo eterno. Horacio me tomó de la mano y me dijo: "esto es la libertad, Amalia. Sentirse chiquita pero estar en paz". No lo olvidé. Después, cuando enfermé mi papá, cuando murió, cuando nos casamos, cuando nacieron nuestros hijos, siempre volvía a ese momento en el puerto. Me acordaba de que soy chiquita, pero que estoy en paz.

**Biógrafo** `[M3.2 + FI1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos misma? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Narrador** `[FI1]`: La soledad ahora es mi compañera. Después de cincuenta años con Horacio, estar sola es raro. Pero tiene su lado bueno. Me hago un té, me siento en el patio, y pienso. Pienso en mi vida, en lo que pasó, en lo que viene. Es un tiempo para estar conmigo misma, para hablar con Dios, para recordar. A veces me siento en la cocina de madrugada, cuando no puedo dormir, y cocino. Hago pan, bizcochos, solo para mí. Eso me calma. La soledad no es mala si la sabes llevar. Algunos creen que estar solo es estar triste, pero no es verdad. Yo estoy sola pero acompañada por mis recuerdos, por mi fe, por mis hijos que me llaman. La soledad es un espacio para respirar. A veces la necesito.

**Biógrafo** `[M3.3 + FI2]`:
> Anotado. Sigo con otra.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Narrador** `[FI2]`: Hubo un momento cuando mi nieto Lucas, el primero, empezó la secundaria. Lo vi entrar al colegio el primer día, y me di cuenta de que el tiempo había volado. Este chico que yo cargaba de bebé, ahora era un adolescente. Me fui a casa, me siento en el patio, y lloré. Lloré de alegría pero también de angustia de que el tiempo se iba tan rápido. Otra vez fue cuando una mujer joven me pidió un consejo en la iglesia, como si yo fuera una señora sabia. Yo pensé: soy vieja ahora. No me di cuenta de cuándo pasó. Un día tenía veinticinco años y estaba armando mi vida con Horacio, y al siguiente día tenía setenta y cuatro, viuda, sin mis papás, con mis nietos casi adultos. El tiempo no avisa cuando se va. Solo cuando miro atrás, entiendo cuánto pasó.

**Biógrafo** `[M3.4 + FI3]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Narrador** `[FI3]`: Heredé mucho de mi mamá: el orden, la dedicación, la forma de cuidar a la gente que amo. También de mi papá: el silencio, la fortaleza, la manera de trabajar sin quejarse. Un día me dieron cuenta fue cuando uno de mis hijos me dijo: "Mamá, vos sos igual a la abuela, ordenada como ella". Yo me reí pero fue como si viera a mi mamá en mí. Otro momento fue cuando estaba cuidando a Horacio, en la enfermedad. Vi que estaba usando las manos de la misma manera que mi papá usaba las suyas: cuidando, reparando, intentando hacer la vida mejor. No me había dado cuenta hasta ese momento. Somos transmisores de nuestros papás, aunque no nos lo propongamos. Ahora intento pasar eso a mis hijos y a mis nietos: ese orden, esa dedicación, esa forma de amar sin decir mucho. Eso es lo que dejamos.

**Biógrafo** `[M3.5 + FI4]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Narrador** `[FI4]`: Cuando era joven, me importaba. Me importaba si la gente del barrio hablaba de mí, si decían que mi casa no estaba bien, si criticaban cómo criaba a mis hijos. Pero con los años aprendí que no puedo vivir por los demás. Recuerdo el momento: estaba en la puerta de la iglesia, y unas mujeres hablaban mal de mí porque trabajaba fuera de casa. En ese momento pensé: para qué le hago caso a estas mujeres que probablemente están solas en sus casas sin hacer nada. Decidí que mi vida era mía. A Horacio le importaba lo que yo pensaba, mis hijos me importaban, mi fe me importaba. Lo demás, era ruido. Ahora, viuda, me importa aún menos. Tengo setenta y cuatro años, he vivido mi vida, y sigo igual. Hago lo que creo que está bien. Si alguien no está de acuerdo, tiene todo el derecho, pero eso no me detiene. Eso es lo que aprendí: que la vida es tuya, y debes vivirla como tú quieras.

**Biógrafo** `[M3.6 + FI6]`:
> Lo tengo. Vamos con otra.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Narrador** `[FI6]`: No sé bien cómo será. Supongo que todo va a ser más rápido, más tecnología, menos tiempo para estar juntos. Eso me da miedo. Lo que me gustaría que no se pierda es la familia, la fe, el tiempo para sentarse a tomar un café y hablar. Que los abuelos sigan pasando sus historias a los nietos. Que el pan se siga haciendo con las manos, no todo por máquinas. Que el mar siga siendo hermoso. Que la gente se siga queriendo, aunque sea de formas diferentes. No sé si voy a estar, pero mis nietos sí estarán. Les pido que se acuerden de que la vida no es solo dinero y trabajo, sino las personas que amas y los momentos que compartís. Eso es lo que espero que no se pierda.

**Biógrafo** `[M26 + CI13]`:
> Gracias, Amalia.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquila.

**Narrador** `[CI13]`: No, creo que con todo esto alcanza. Mi vida está contada. Fue una vida normal, llena de pequeñas cosas que son las cosas importantes. Estoy conforme.

## Bloque 14 · Hoy

**Biógrafo** `[M24.4 + EN14]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Dejamos el pasado un rato y venimos a hoy, Amalia: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Narrador** `[HO1]`: Me despierto temprano, sin reloj. Todavía tengo esa costumbre de Horacio, que se levantaba con el sol. Me hago un café, desayuno algo ligero. Después de desayunar, limpio la casa. No es mucho, pero lo hago porque es lo que sé hacer. A media mañana, si tengo energía, voy a la panadería del barrio, compro pan, hablo con las amigas. Si es miércoles, voy al grupo de viudas. Si no, me quedo en casa. Almuerzo algo simple: un guiso, una milanesa. Por la tarde leo el diario, miro televisión un poco. A veces vienen mis nietos, jugamos, los ayudo con la tarea. Si no vienen, me siento en el patio, coso, o simplemente pienso. A la tardecita preparo algo para la cena. Después como, lavo los platos. Por la noche miro televisión un poco más, rezo. Antes de dormirme, pienso en el día, en Horacio, en mis hijos. Me duermo. Es una vida simple, sin sobresaltos, pero es tranquila. Eso es lo que valoro ahora: la tranquilidad.

**Biógrafo** `[M3.8 + HO2]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado.

**Narrador** `[HO2]`: Con mis nietos me río mucho. Son locos, dicen cosas que no esperás. La última vez fue hace poco, mi nieta más chica me vio bajar las escaleras lentamente, con cuidado, y me dijo: "Abuela, ¿vos también tenés problemas como el abuelo?" Sin mala intención, pero la ingenuidad de los chicos es buena. Me reí, todos nos reímos. También con Marta, mi amiga. Nos reímos de cosas que antes no nos hacían gracia, de la vejez, de que nos duele todo. Reír de las propias miserias es una forma de vivir. Una tarde estábamos en el patio de mi casa, ella me contaba sobre un médico que le atendió mal, y yo le decía mis propias anécdotas. Nos reímos hasta que nos dolió la panza. Mi mamá decía que la risa es la mejor medicina. Tenía razón.

**Biógrafo** `[M3.1 + HO5]`:
> Gracias, Amalia. Ya lo guardé.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Narrador** `[HO5]`: Lo que más me gusta es el tiempo con mi familia, sin apuro. Mi hijo Diego vino el domingo con sus dos hijos, y nos pasamos la tarde en el patio. Los nenes jugaban, Diego me ayudaba a arreglar una maceta, su esposa hablaba conmigo en la cocina. Fue simple, nada especial. Pero eso es lo que amo: estar juntos sin necesidad de estar haciendo cosas importantes. También me gusta poder descansar, no tener que correr. Mi vida de ahora es más lenta, pero es mía. Puedo comer lo que quiero, dormir la siesta si quiero, rezar cuando quiero. Nadie me apura. Eso es un lujo que no aprecié cuando tenía a Horacio, cuando tenía trabajo. Ahora lo veo claro: la mejor vida es estar con tu gente, en paz, sin sobresaltos.

**Biógrafo** `[M3.2 + CO1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Narrador** `[CO1]`: Mi pan. Ese es el plato que es mío. Lo aprendí de mi mamá, cuando era chiquita, en la cocina juntas. Cada vez que me reúno con alguien, me piden pan de Amalia. Recuerdo una vez que Diego se fue a vivir con su pareja, y ella quería aprender mi receta. Pasé horas mostrándole cómo se hace, con las manos, cómo sentir la masa, cuándo está lista. Después vino a comer a casa y me presentó un pan que había hecho ella, basado en mi receta pero diferente. Cuando lo comí, lloré un poco. Era el primer pan de su vida, hecho con amor, intentando copiar el mío. Eso fue especial. Mis nietos esperan que cuando vengan, haya pan recién hecho de la abuela. Ese pan es mi firma, es la forma en que digo "te quiero" sin palabras. Mi mamá me enseñó a hacer pan, y yo lo pasé. Eso es lo que queda.

**Biógrafo** `[M3.3 + HO9]`:
> Anotado. Sigo con otra.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Narrador** `[HO9]`: Vivo en la misma casa donde viví con Horacio hace cincuenta años. Es una casa de dos ambientes, pequeña, con un patio atrás. Las paredes están pintadas de blanco, como siempre. Tiene los muebles de toda la vida, arreglados una y otra vez. La cocina es donde paso más tiempo. El patio es mi lugar favorito, donde tenemos flores y donde me siento a pensar. El barrio es tranquilo, la gente me conoce. Hay otros abuelos, otras abuelas como yo. La iglesia está a cinco cuadras, voy caminando. La panadería está cerca. Ayer estaba en la puerta de casa, mirando cómo el sol tocaba la pared, y pensé: esta casa es mi vida. Aquí nacieron mis hijos, aquí crecieron mis nietos. En esa esquina Horacio reparaba algo. En esa habitación lo cuidé hasta el final. Esta casa está impregnada de nosotros. Es vieja como yo, pero es nuestro hogar. No me la cambio por nada.

**Biógrafo** `[M26 + CI14]`:
> Gracias, Amalia.
>
> Con esto cerramos lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquila.

**Narrador** `[CI14]`: No, creo que está todo. Mi vida es lo que conté.

## Bloque 15 · Legado y cierre

**Biógrafo** `[M25.2 + EN15]`:
> Bien, seguimos.
>
> Ya estamos en la última parte, Amalia: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Narrador** `[LE1]`: Lo que más me da orgullo es haber sido una buena mamá y una buena maestra. Mis tres hijos salieron bien: son personas decentes, que trabajan, que aman a su familia. Eso es mérito de Horacio y mío. Pero también me da orgullo mi trabajo con los nenes. Sé que cambié vidas, aunque sea de pequeñas maneras. Ese Lucas que no podía leer, ahora es un muchacho de dieciséis años que va bien en la escuela. Cuando lo veo, en el almacén del barrio, y me dice "hola señora Amalia", yo siento que hice algo bueno. Pero el mayor orgullo es que Horacio fue un buen marido, un buen papá, y que estuvimos juntos cincuenta años sin grandes conflictos. Que nuestro amor fue real, fue visto por nuestros hijos. Cuando lo recuerdo, pienso: eso fue mérito de nosotros dos. Armamos una vida bien. Ese es mi mayor orgullo.

**Biógrafo** `[M3.5 + LE2]`:
> Guardado, Amalia. Te mando la próxima.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos misma descifraste viviendo.

**Narrador** `[LE2]`: Lo primero es que la vida es corta. Cuando te dás cuenta, los hijos ya son grandes, el marido se fue, y vos estás sola. Así que no dejes para mañana los abrazos, las conversaciones, estar juntos. Lo segundo es que el dinero es importante, pero no es lo más importante. Trabajen, ganen lo que puedan, pero no a costa de la familia. Horacio nunca tuvo mucho, pero siempre estaba ahí. Eso vale más que cualquier dinero. Tercero, el amor no es como en las películas. El amor es cotidiano, es hacer pan para tu familia, es cuidar a alguien cuando está enfermo, es estar ahí sin palabras. Cuarto, la fe. Tengan fe, sea en Dios o en la vida. Te sostiene cuando todo se cae. Y por último, perdonen. A su mamá cuando les levanta la mano, a su marido cuando es insensible, a sus hijos cuando no entienden. El perdón es lo que nos mantiene unidos. La vida es eso: familia, fe, trabajo y perdón. Eso es todo.

**Biógrafo** `[M3.6 + FU1]`:
> Lo tengo. Vamos con otra.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Narrador** `[FU1]`: Me gustaría viajar con mis nietos, llevarlos a conocer lugares. Estoy sentada en el puerto de Buenos Aires, con Lucas y mi nieta, mirando el agua. Les estoy contando historias del abuelo Horacio, de cómo él conocía el mar. Les enseño que hay un mundo más allá de Mar del Plata, pero que nada es tan bonito como el hogar. También me gustaría ver crecer a todos mis nietos, verlos que se enamoren, que formen sus propias familias. Y me gustaría, antes de irme, dejarles un cuaderno escrito con todas mis recetas, mis historias. Que sepan quién fue su abuela, que sepan que la quisé con toda mi fuerza. Eso es lo que me queda por hacer: ser la abuela que mis nietos necesitan, y dejarles un rastro de mí para que no me olviden.

**Biógrafo** `[M3.7 + LE7]`:
> Listo, quedó guardado. Sigo.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Narrador** `[LE7]`: "La tranquilidad de amar". Porque eso fue mi vida: tranquila, sin sobresaltos grandes, pero llena de amor. No hice cosas importantes para el mundo, no viajé, no tuve dinero. Pero amé bien. Amé a mi familia, amé mi trabajo, amé a Horacio. La vida fue tranquila porque tenía a quién amar y quién me amaba. Eso es todo lo que necesitábamos. Un libro de alguien que no fue famoso, que no hizo nada grande, pero que vivió bien y en paz. Porque la verdadera importancia está en los pequeños detalles: el pan recién hecho, la mano de Horacio en la mía, los ojos de mis nietos cuando aprenden algo. Eso es la tranquilidad de amar.

**Biógrafo** `[M3.8 + M15]`:
> Escuchado. Vamos por la siguiente.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> Abuela, ¿qué fue lo primero que te enamoró del abuelo Horacio? Sofi

**Narrador** `[FAM1]`: Ay, Sofi. Lo primero que me enamoró del abuelo fue su silencio. Cuando lo conocí en ese baile, vi a un hombre que no hablaba mucho, pero cuando hablaba, valía la pena escuchar. Sus ojos tenían algo que te hacía sentir segura. Después, fue su forma de trabajar, su dedicación, la manera en que cuidaba lo que amaba. No era un hombre de flores ni de palabras bonitas, pero era de actos. Y eso, Sofi, es lo más importante. Un hombre que con sus manos repara lo que está roto, que con su presencia te sostiene. Cuando estabas con tu abuelo, sabías que estabas en buenas manos. Eso fue lo que me enamoró. No fue la pasión de las películas, fue la tranquilidad de saber que alguien me cuidaría por siempre. Y eso fue exacto: cincuenta años de tranquilidad y de amor. Espero que vos encuentres eso, Sofi. A alguien que te haga sentir segura.

**Biógrafo** `[M3.1 + FO1]`:
> Gracias, Amalia. Ya lo guardé.
>
> Otra cosa, Amalia. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés a mano, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Y si no encontrás ninguna, no pasa nada: el libro va igual.

**Narrador** `[FO1]`: Sí, tengo una. Voy a buscarlo. Es una foto de Horacio y yo en el puerto, hace muchos años, cuando éramos jóvenes. Estábamos en el puerto al atardecer, tomados de la mano, mirando el agua. Alguien nos la sacó. Es en blanco y negro, pero se ve el cielo hermoso detrás. Voy a mandártela ahora. Es la foto que tiene todo: a Horacio, a mí, el mar, la tranquilidad. Es la que quiero que quede.

**Biógrafo** `[M26 + LE9]`:
> Gracias, Amalia.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Narrador** `[LE9]`: Hay algo que quiero que quede claro: que Horacio fue el amor de mi vida, pero que su muerte no es el final de mi historia. Yo sigo acá, sigo viviendo, sigo cuidando a mi familia. Algunos podrían pensar que cuando él murió, yo me terminé. Pero no. Aprendí que la vida continúa, que hay forma de estar feliz aunque estés sola. Eso es lo que me gustaría que mi familia entienda: que no es necesario un hombre para ser completa, aunque yo lo haya tenido. Que las viudas, las solas, las que se quedan, pueden seguir sonriendo. Eso me gustaría que quedara en el libro.

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Narrador** `[LE8]`: A mis hijos, a Marcelo, Silvia y Diego: ustedes fueron mi orgullo. Los criamos Horacio y yo con lo que teníamos, y salieron bien. Están buenos, trabajan, quieren a sus familias. Eso es lo más importante. Sigan así. A sus parejas: gracias por quererlos, por cuidarlos, por dejarme ser abuela de sus hijos. A mis nietos: ustedes son mi futuro, mi esperanza. Aprendan a amar bien, a respetar a la gente, a valorar lo simple. No necesitan ser ricos para ser felices. Necesitan a su familia. Marta, mi amiga: gracias por estar conmigo, por ser mi hermana del corazón. A mis hermanas Teresa y Luisa: las quiero, siempre estamos juntas en esto. Y a Horacio, aunque no pueda oírme: te extraño, pero tengo paz sabiendo que fue una buena vida juntos. Este libro es para que me recuerden, no como una persona importante, sino como alguien que amó bien. Eso es todo lo que quería ser. Que me lean, que se acuerden de los días en el patio, del pan recién hecho, de que la tranquilidad y el amor son posibles. Eso es lo que les dejo.

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Amalia. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre, y es bien tuyo. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Fue un gusto enorme escucharte.
