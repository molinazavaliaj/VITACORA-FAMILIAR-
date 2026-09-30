# Simulación 6: la que no se acuerda (Elsa, 80, inventada)

**Qué es:** la entrevista de un narrador **inventado** (Elsa), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Plan: [`PLAN.md`](PLAN.md).

**Cuenta:** 91 preguntas del banco contestadas + 1 de la familia · **130 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas van juntas en ese mensaje); **Narrador** es lo que contestó. Los títulos de bloque y los IDs (entre corchetes) son para el equipo: el narrador no los ve.

**Biógrafo** `[BIEN]`:
> Hola, Elsa, ¿cómo estás? Una persona que te quiere mucho te regaló un libro con la historia de tu vida, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.
>
> Funciona así: te mando una pregunta y vos me la contás en audio, como si me lo estuvieras contando en persona. Mandame todos los audios que quieras. Cuando termines, ya está: con un ratito de silencio, la pregunta que sigue te llega sola.
>
> Si alguna pregunta no tiene que ver con tu vida, me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro: esto lo hacemos al ritmo que vos quieras.

## Bloque 1 · Origen y raíces

**Biógrafo** `[OR1 + M1]`:
> Empecemos por cuando llegaste al mundo, según te contaron. No el día en sí, sino la época: dónde vivían, en qué andaban tu mamá y tu papá, cómo te esperaban. ¿Qué sabés de cómo era la vida de ellos en ese entonces? Contame.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR1]`: Ay, bueno, la verdad es que no me acuerdo bien cómo era todo eso. Mis papás vivían en Villaguay, ese pueblo chico, vos sabés. Papá tenía el almacén y mamá se quedaba en casa. Creo que me esperaban, supongo, pero no me contaron mucho. Eso era hace mucho, viste.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Elsa. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR2]`: No sé, la verdad que mi papá hablaba poco de esas cosas. Creo que él venía de no sé dónde, de Córdoba tal vez, o de la zona. Pero no me acuerdo bien. Mi mamá tampoco hablaba de eso. Yo de chica estaba pendiente de otras cosas. Ni idea, querido. Eso se lo tendrías que preguntar a alguien más grande que yo, si es que queda.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR5]`: Ay, creo que se conocieron en el pueblo, en algún lado. Un baile, tal vez. Pero no me acuerdo bien la historia. Eso se la habrían contado a mis hermanos cuando éramos chicos, pero no sé. Mis papás no hablaban mucho de esas cosas. Uy, eso no me acuerdo, pasó hace mucho.

**Biógrafo** `[M26 + CI1]`:
> Gracias, Elsa.
>
> Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora.

**Narrador** `[CI1]`: No, no me viene nada a la mente. Eso quedó muy atrás y la cabeza no me ayuda, viste. Creo que después me voy a acordar de algo en la madrugada, pero ahora no. Mejor seguimos.

## Bloque 2 · La casa y la familia de la infancia

**Biógrafo** `[M24.1 + EN2]`:
> Gracias, Elsa. Eso también va al libro.
>
> Ahora vamos a tu infancia: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Narrador** `[CA1]`: Ah, la casa de Villaguay. Ay, me acuerdo de eso. Era una casa con un patio grande al fondo, de barro. Mi mamá sembraba cosas ahí, verduras. Yo andaba jugando en ese patio con mis hermanos, los que estaban. Hacía mucho calor. Me acuerdo de estar descalza en el barro, corriendo. Y la casa era de adobe, viste, esos ladrillos que se hacían allá. Había un zaguán al entrar. Sí, eso me acuerdo bien.

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chica. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Narrador** `[CA2]`: Mi mamá era buena, trabajadora. Hacía comida, limpiaba. Pero no era de esas que te abrazaban mucho, viste. Era más seria. Me acuerdo que me enseñaba a coser cuando era chica, a cocinar también. Estábamos en la cocina y ella me mostraba cómo hacer las cosas. Creo que me quería, pero de otra forma, no tan cariñosa como podría ser. Eso me acuerdo, sí.

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chica? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Narrador** `[CA3]`: Ah, papá tenía el almacén, viste. No me acuerdo bien cómo era el lugar, pero me acuerdo de ir con él algunas veces cuando era pequeña. Había como bolsas de harina, azúcar, así. Él atendía gente. Creo que hablaba con los clientes, vendía cosas. Pero no me acuerdo mucho de detalles. Él era un hombre serio también, trabajador. No nos hablaba mucho, pero te querías.

**Biógrafo** `[M3.6 + CA6 + M1]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste hermanos? Si tuviste, ¿con cuál eras más cercana de chica? Contame alguna aventura que hayan hecho juntos; seguro tienen varias.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[CA6]`: ¿Hermanos? Creo que éramos muchos, no me acuerdo bien cuántos. Sí, tenía hermanos. Creo que uno se llamaba Ramón, y había una Chiquita, y un Hugo. Pero no me acuerdo bien de qué jugábamos o qué hacíamos juntos. Eso era hace demasiado. Me acuerdo que andábamos en el patio, eso sí, pero los detalles... No sé. La memoria me traiciona, querido.

**Biógrafo** `[M3.7 + CA16]`:
> Listo, quedó guardado. Sigo.
>
> Contame un día de chica que esperabas con muchas ganas: qué era, quién estaba, qué pasó.

**Narrador** `[CA16]`: No me acuerdo. Uy, de chica habrá habido días especiales pero no me vienen a la mente. Tal vez cuando iba al pueblo con papá a la plaza, o cuando venía algún pariente. Pero los detalles no me los acuerdo. Ni idea, querido.

**Biógrafo** `[M3.8 + CA17]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[CA17]`: No sé, la verdad. De chica no recuerdo momentos muy difíciles. Habrá habido, pero no me acuerdo. Estábamos todos ahí, hacíamos lo que podíamos. La pobreza era la que había, pero eso era normal para todos, así que no lo veía como algo tan malo. No me acuerdo de algo traumático, como te digo.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Elsa. Queda guardado con cuidado.

**Biógrafo** `[CI2]`:
> Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquila, que hay tiempo.

**Narrador** `[CI2]`: No, no se me viene nada ahora. Capaz que después me llega algo a la mente, pero en este momento no.

## Bloque 3 · La escuela y los juegos

**Biógrafo** `[M24.2 + EN3]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad.

**Biógrafo** `[ES1]`:
> ¿Cómo fue tu primer día de escuela? ¿Quién te llevó hasta la puerta, y qué sentiste cuando se fue? Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria.

**Narrador** `[ES1]`: Ay, eso no me acuerdo. Hace demasiados años. Debió haber ido a una escuela chiquita en el pueblo, pero de qué día fue o quién me llevó, no sé. La memoria, viste, la cabeza no me ayuda con esas cosas.

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Narrador** `[ES2]`: No, no me acuerdo de ningún maestro en especial. Debió haber tenido varios pero los nombres se me borraron. Eran maestras, creo, pero no me viene nada a la memoria de alguna en particular que me haya marcado.

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chica, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Narrador** `[ES5]`: No me acuerdo. Habrá habido amigas, pero no me vienen los nombres. De chica jugábamos, correteábamos, pero no me acuerdo de nada en particular. Eso quedó muy atrás, viste.

**Biógrafo** `[M3.3 + ES6]`:
> Anotado. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chica, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Narrador** `[ES6]`: Ay, no me acuerdo de ninguna travesura grande. Debía ser una nena bastante tranquila. No me vienen a la mente esas cosas. Seguro hicimos algo de chicas, pero no me acuerdo ahora.

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Narrador** `[ES7]`: Ay, no me acuerdo muy bien. De chica no pensaba en esas cosas. Supongo que como todas, quería casarme y tener una familia. Eso era lo que se esperaba de una nena en esa época, viste. Pero no recuerdo haberlo pensado muy en serio cuando era chiquita.

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chica? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Narrador** `[ES9]`: Sí, éramos católicos, creo. Habrá habido misa, iglesia. Pero no me acuerdo bien de ninguna ceremonia que me haya marcado. Tal vez mi primera comunión o algo así, pero los detalles no me vienen a la cabeza. Ni idea, querido.

**Biógrafo** `[M26 + CI3]`:
> Gracias, Elsa.
>
> Con esto cerramos tus años de escuela. Antes de seguir, ¿te quedó alguna historia de esa época dando vueltas, algo que no entró en ninguna pregunta? Contámela ahora, con calma, que la quiero escuchar.

**Narrador** `[CI3]`: No, nada me viene a la mente ahora. Mejor seguimos.

## Bloque 4 · Adolescencia

**Biógrafo** `[M25.1 + EN4]`:
> Bien, seguimos.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chica y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Narrador** `[AD2]`: A esa edad estaba en Villaguay todavía, en el pueblo. No sé bien qué hacía, la verdad. Debía estar en la escuela o ayudando en casa, cosa de mujeres, viste. No me acuerdo bien de esos años. Eso era hace mucho.

**Biógrafo** `[M3.7 + AD3]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Narrador** `[AD3]`: No, no me acuerdo de una barra en especial. Debía haber amigas pero no me quedan los nombres. A esa edad habremos salido al pueblo, ida a la iglesia, cosas así. Pero no me vienen recuerdos claros de ninguna salida especial.

**Biógrafo** `[M3.8 + AD5]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche.

**Narrador** `[AD5]`: Ay, no me acuerdo. Habrá ido a algún baile en el pueblo, pero no me vienen los detalles. No sé cómo me preparé ni con quién fui. Todo eso se me borrró.

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Narrador** `[AD6]`: No sé. Probablemente Ernesto fue el primero, mi marido. Lo conocí no sé bien cómo, debe haber sido en Paraná cuando me fui a trabajar. Pero de antes no me acuerdo de ninguno. Ernesto era un buen hombre, trabajador. Nos casamos en el 68. Eso me acuerdo.

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chica? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Narrador** `[AD12]`: Cuando me fui a Paraná a trabajar, creo. Tenía 20 años, un poco más. Me fui sola a trabajar de empleada en una tienda. Eso fue un cambio, dejar el pueblo, dejar a la familia. Ahí sentí que tenía que arreglármelas sola. Eso me acuerdo bien, ese momento.

**Biógrafo** `[M3.3 + AD15]`:
> Anotado. Sigo con otra.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[AD15]`: No, no me acuerdo de nada muy duro. Habrá cosas normales de la edad, pero no me vienen a la mente. Supongo que tener que dejar el pueblo fue difícil, pero es lo que debía hacer.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquila, que hay tiempo.

**Narrador** `[CI4]`: No, no se me viene nada ahora. Sigo.

## Bloque 5 · Juventud

**Biógrafo** `[M25.3 + EN5]`:
> Bien, entonces.
>
> Pasamos a tu juventud, Elsa: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Narrador** `[JU1]`: Ay, me fui para Paraná, sí. Tenía 20 años. Me acuerdo que me despedí de mis papás pero no recuerdo bien cómo fue. Debe haber sido triste pero también tenía que irme, a buscar trabajo. En Paraná alquilé un lugar, trabajaba en una tienda, eso me acuerdo.

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Narrador** `[JU2]`: Después de la primaria no seguí estudiando. Me fui a trabajar, como te dije. Trabajé en una tienda en Paraná. Eso era mi vida, trabajar. Luego conocí a Ernesto y nos casamos. Eran años de trabajo, de arreglárselas como podía.

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Narrador** `[JU4]`: Ah, la costura. Eso me lo enseñó mi mamá cuando era chica. Cuando me casé con Ernesto, cosía en casa, arreglaba ropa para la familia. Luego empecé a coser para otras personas, para ganar dinero. Me gustaba hacer eso, me entretenía. No me acuerdo bien cuándo empecé a coser para afuera, pero lo hacía.

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Narrador** `[JU5]`: No, no. Yo soy mujer, no me tocaba eso. Pero supongo que en la casa de mis papás había disciplina, como en todas. Nada de militar aunque.

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Si te pasó, contame cómo lo decidiste: qué te empujó y a quién se lo dijiste primero.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[JU8]`: Bueno, me fui de Villaguay a Paraná, eso ya lo conté. No me acuerdo bien cómo lo decidí o quién fue el primero en saberlo. Mis papás lo sabían, supongo. Paraná quedaba no tan lejos. Pero no me acuerdo de los detalles de esa decisión.

**Biógrafo** `[M3.8 + JU12]`:
> Escuchado. Vamos por la siguiente.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue?

**Narrador** `[JU12]`: Ay, eso no me acuerdo bien. Cuando me fui a Paraná alquilé algo chiquito, supongo. Una pieza o una casita, no sé. Habrá tenido una ventana pero no me acuerdo qué se veía. Eso fue hace mucho, la cabeza no me ayuda con esos detalles.

**Biógrafo** `[M3.1 + JU15]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Narrador** `[JU15]`: No me acuerdo de amigos en especial de esa época. Debía haber gente en la tienda donde trabajaba, pero los nombres se me borraron. No tenía mucho tiempo para amigos, estaba muy ocupada trabajando.

**Biógrafo** `[M3.2 + JU17]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[JU17]`: No me acuerdo de nada muy duro. Supongo que habrá dificultades con dinero, como siempre, pero nada que me haya marcado especialmente. La verdad es que no recuerdo.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI5]`:
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.

**Narrador** `[CI5]`: No, nada me viene a la mente ahora. Mejor seguimos.

## Bloque 6 · Amor y pareja

**Biógrafo** `[M25.3 + AM0 + M1]`:
> Bien, entonces.
>
> Ahora vamos al amor. Haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después vamos de a una, empezando por la primera que fue en serio. Si no hubo, decímelo nomás, que también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM0]`: Me enamoré de Ernesto, mi marido. Eso fue lo serio para mí, la única vez que fue en serio. Nos conocimos en Paraná, debe haber sido a mediados de los 60, y nos casamos en el 68. Eso es todo. No hubo otros amores.

**Biógrafo** `[M3.3 + AM1]`:
> Anotado. Sigo con otra.
>
> Contame el día que se conocieron. ¿Dónde fue, quién los presentó o cómo se cruzaron? ¿Y qué fue lo primero que te llamó la atención de esa persona?

**Narrador** `[AM1]`: No me acuerdo bien. Debió haber sido en Paraná, en la ciudad. Tal vez nos conocimos en la calle o en algún lado. Ernesto era empleado del correo. Me pareció un buen hombre, serio, trabajador. Eso me llamó la atención, que era trabajador.

**Biógrafo** `[M3.4 + AM3]`:
> Gracias por contármelo. Seguimos.
>
> Y después, ¿cómo decidieron armar la vida juntos: casarse, irse a vivir, lo que haya sido? ¿Quién lo dijo primero, o se fue dando solo? Contame ese momento: dónde estaban, qué se dijeron.

**Narrador** `[AM3]`: Nos casamos en el 68. Cómo fue la decisión, no me acuerdo bien. Supongo que fue de común acuerdo, que queríamos casarnos. Debió haber sido en la iglesia, la costumbre de esa época. Pero los detalles no me los acuerdo.

**Biógrafo** `[M3.5 + AM4]`:
> Guardado, Elsa. Te mando la próxima.
>
> Hay días que quedan grabados para siempre. ¿Hubo uno en que se casaron, o en que empezaron a vivir juntos? Si lo hubo, contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó.

**Narrador** `[AM4]`: Ah, la boda. Me acuerdo de eso. Fue en el 68, en la iglesia de Paraná. Yo llevaba un vestido blanco, hermoso. Ernesto estaba tan guapo en ese traje oscuro. Había gente, amigos, aunque no recuerdo bien quiénes. La iglesia tenía flores. Cuando salimos, la gente nos tiraba arroz. Fue un día muy bonito, muy especial. Eso me acuerdo bien, sí.

**Biógrafo** `[M3.6 + AM8]`:
> Lo tengo. Vamos con otra.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Narrador** `[AM8]`: Ay, tantos momentos. Cuando nació Mónica, nuestra primera hija. Ernesto estaba tan contento, tan feliz. Nos quedamos mirando a la nena, los dos juntos en la cama. Él me agarraba la mano. Fue un momento de tanta felicidad, tanta pureza. Eso me gustaría guardar para siempre.

**Biógrafo** `[M3.7 + AM9 + M1]`:
> Listo, quedó guardado. Sigo.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM9]`: Ernesto murió en el 2015. Fue muy duro. Estuvimos juntos muchos años, casi 50 años de casados. Él se enfermó, se fue debilitando. Fue un proceso lento. Cuando se fue, me quedé sola. Pero fue una vida buena la que tuvimos. Lo echo de menos todavía, pero bueno, así es la vida.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[AM19]`:
> Y después de esa historia, ¿hubo un tiempo en que seguiste por tu cuenta? Contame cómo era un día tuyo entonces: qué hacías, quién andaba cerca. Si no hubo un tiempo así, decime no nomás.

**Narrador** `[AM19]`: Sí, después de que Ernesto murió. Mis días eran tranquilos, sola en el departamento. Claudia, mi hija, me visita todos los días. Ella me ayuda con las cosas. Nos juntamos, miramos televisión, conversamos. Es mi compañía, mi Claudia.

**Biógrafo** `[M3.8 + AM16]`:
> Escuchado. Vamos por la siguiente.
>
> Si después de esa historia hubo otro amor, contame del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado. Si no lo hubo, decime no nomás.

**Narrador** `[AM16]`: No, no hubo otro amor. Solo Ernesto. Después de que él se fue, no fue lo mismo. Yo no busqué a nadie más. Tengo a mis hijas, a mis nietos, a Claudia que me cuida. Con eso me alcanza.

**Biógrafo** `[M3.1 + AM13]`:
> Gracias, Elsa. Ya lo guardé.
>
> Contame una pelea que tuvieron, de esas que después dan risa. Por qué fue, quién aflojó primero y cómo hicieron las paces.

**Narrador** `[AM13]`: No me acuerdo de ninguna pelea grande. Supongo que como todos, tendremos tenido desacuerdos, pero no me vienen a la memoria. Éramos bastante tranquilos, yo pienso. No era una pareja de gritos.

**Biógrafo** `[M3.2 + AM14]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Tuviste algún amor que te marcó y no fue el de toda la vida? Uno que dejó huella, aunque haya durado poco. Si te pasó, contame cómo se cruzaron y el momento que más te acordás de esa persona.

**Narrador** `[AM14]`: No, no hubo otro. Solo Ernesto para mí.

**Biógrafo** `[M26 + CI6]`:
> Gracias, Elsa.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI6]`: No, nada más. Ernesto fue mi vida, y eso está contado ya.

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M25.1 + EN7]`:
> Bien, seguimos.
>
> Ahora vamos al trabajo y a tu oficio, Elsa: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Narrador** `[TR1]`: Cuando me fui a Paraná, con 20 años, empecé a trabajar en la tienda. Era empleada, vendía cosas. Me ganaba algo para vivir, para alquilar el lugar, para comer. No era mucho pero me bastaba. Ese era mi primer trabajo de verdad.

**Biógrafo** `[M3.4 + TR6]`:
> Gracias por contármelo. Seguimos.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Narrador** `[TR6]`: Primero trabajé en la tienda hasta que me casé en el 68. Luego, cuando me casé con Ernesto, dejé la tienda. Fui ama de casa, hice la casa, cuidé a mis hijas. Después empecé a coser para afuera, para tener un poco de dinero. Eso fue lo que más hice, coser. Me pasé muchos años cosiendo ropa para gente. Eso fue mi vida, la costura.

**Biógrafo** `[M3.5 + TR2]`:
> Guardado, Elsa. Te mando la próxima.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Narrador** `[TR2]`: Un día cosiendo. Me levantaba, hacía la limpieza, preparaba la comida. Luego me sentaba en la máquina a coser. Pasaba muchas horas ahí, con la aguja, el hilo, los retales. La máquina hacía tac, tac, tac. A veces la gente me traía ropa para arreglar o hacer. Yo medía, marcaba, cortaba la tela. Miraba por la ventana mientras cosía. Los dedos se me cansaban pero seguía. Era una vida simple, tranquila.

**Biógrafo** `[M3.6 + TR3]`:
> Lo tengo. Vamos con otra.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Narrador** `[TR3]`: Mi mamá me enseñó a coser cuando era chica. Ella fue la que me abrió ese camino. Sin ella, no sabría nada. Cuando ya estaba grande, cosía para la familia, y después para otros. Eso me permitió tener dinero, ayudar en la casa. Mi mamá fue importante en eso.

**Biógrafo** `[M3.7 + TR5]`:
> Listo, quedó guardado. Sigo.
>
> ¿Cuál fue el día de trabajo del que estás más orgullosa? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo.

**Narrador** `[TR5]`: No me acuerdo bien de un día en especial. Supongo que cuando hacía un vestido para alguien y le quedaba hermoso, eso me hacía feliz. Ver que la persona se probaba la ropa y quedaba contenta. Pero los detalles exactos no me los acuerdo.

**Biógrafo** `[M3.8 + TR11]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.

**Narrador** `[TR11]`: Sí, habrá habido épocas difíciles con dinero. Cuando no tenía trabajo, cuando la tienda cerraba, o cuando había menos gente que traía ropa a coser. Pero no me acuerdo bien de días en especial. Solo sé que pasaban esas cosas y uno se las arreglaba como podía.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Elsa. Queda guardado con cuidado.

**Biógrafo** `[TR8]`:
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Narrador** `[TR8]`: No, no tuve un negocio propio. La costura la hacía desde casa, para amigos y conocidos. No era un negocio formal, solo gente que me traía ropa y yo les hacía los arreglos. Simple así.

**Biógrafo** `[M3.1 + CS1]`:
> Gracias, Elsa. Ya lo guardé.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Narrador** `[CS1]`: Cocinar. Yo siempre cociné bien. Hacía comidas ricas para la familia, para Ernesto y las chicas. Mis hijas siempre decían que cocinaba muy bien. También cuidé a mis nietos cuando eran chiquitos. Eso me lució, creo. La gente me lo reconocía.

**Biógrafo** `[M3.2 + CP1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chica o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Narrador** `[CP1]`: No, no trabajé en el campo. Crecí en el pueblo pero no era campo de verdad. Hacía calor, habrá habido lluvias, pero no recuerdo momentos específicos de eso. Eso quedó muy atrás.

**Biógrafo** `[M3.3 + TR9]`:
> Anotado. Sigo con otra.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Narrador** `[TR9]`: Sí, dejé de coser. No sé bien cuándo. Los dedos empezaron a fallarme, la vista también. Cada vez cosía menos. Un día simplemente dejé de hacer. No fue un último día especial, solo que no pude más.

**Biógrafo** `[M26 + CI7]`:
> Gracias, Elsa.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.

**Narrador** `[CI7]`: No, nada. Creo que ya está todo ahí.

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M25.2 + EN8]`:
> Bien, seguimos.
>
> Volvemos a la familia, Elsa, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Si no los tuviste cerca, contame cómo fue eso.

**Narrador** `[PG1]`: No, no los tenía cerca. Me fui a Paraná y ellos se quedaron en Villaguay. No viajaba mucho para visitarlos. Tenía que vivir mi vida, trabajar, cuidar a mis hijas. Supongo que los vería de vez en cuando, pero no me acuerdo bien de esas visitas. Mis papás envejecieron allá, lejos de mí.

**Biógrafo** `[M3.5 + HI0 + M1]`:
> Guardado, Elsa. Te mando la próxima.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Si sí, contame quiénes son, así los voy conociendo. Y si no, decímelo nomás y seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI0]`: Sí, tengo dos hijas. Mónica nació en el 69 y Claudia en el 72. Las dos con Ernesto. Mónica y Claudia. Ellas son mi vida, mis hijas hermosas.

**Biógrafo** `[M3.6 + HI2]`:
> Lo tengo. Vamos con otra.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Narrador** `[HI2]`: Ay, cuando nació Mónica. Fue en el hospital de Paraná. Yo estaba nerviosa, asustada también. Fue un parto largo, cansador. Pero cuando la puse en brazos... ay, era tan pequeña, tan hermosa. Tenía unos ojitos, me miraba. Ernesto estaba al lado mío, tan contento. Fue el momento más hermoso de mi vida. Nunca me voy a olvidar eso.

**Biógrafo** `[M3.7 + HI2b]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tuviste más hijos, o hay alguien más que sentís que criaste o cuidaste como propio? Si fue así, contame cómo fue la llegada de cada uno, con el tiempo que necesites. Cada llegada tiene su historia.

**Narrador** `[HI2b]`: Sí, Claudia, mi segunda hija. Nació tres años después, en el 72. Ese parto fue más fácil, más rápido. Ella también era hermosa. Tan pequeña, tan delicada. Con dos nenas ya, mi vida estaba llena. Las cuidé con todo el corazón.

**Biógrafo** `[M3.8 + HI3]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Narrador** `[HI3]`: Mónica era más vivaz, más traviesa. Claudia era más tranquila, más dócil. Mónica se movía por todos lados, Claudia se quedaba quieta mirando. Las dos eran hermosas. Me acuerdo de ellas jugando juntas en la casa, corriendo, riendo. Eso me hacía feliz, verlas así.

**Biógrafo** `[M3.1 + HS1]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Cómo viviste la crianza de tus hijos? ¿La llevaste sola, o tuviste alguna ayuda cerca? Contame un día de esa época que te acuerdes bien.

**Narrador** `[HS1]`: La crianza fue difícil, la verdad. Ernesto trabajaba en el correo, así que yo me quedaba con las chicas. Las cuidaba, las alimentaba, las bañaba, todo. Él llegaba y las saludaba, pero el trabajo de todos los días era mío. Pero bueno, lo hice con amor. Un día típico era levantarme temprano, preparar el desayuno, limpiar, cuidar a las nenas. Así pasaban los días.

**Biógrafo** `[M3.2 + HI6]`:
> Te escuché. Vamos con la que sigue.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Narrador** `[HI6]`: Me acuerdo de Mónica en la escuela, cuando sacaba buenas notas. Yo me sentía tan orgullosa. Y Claudia, cuando empezó a ayudarme en la casa, era tan responsable. Me hacía feliz verlas crecer, verlas tener éxito, ser buenas personas.

**Biógrafo** `[M3.3 + HI8 + M1]`:
> Anotado. Sigo con otra.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, me lo decís y pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI8]`: Sí, tengo nietos. Cuatro nietos, creo. Pero no me acuerdo bien cuándo nació el primero. Hay un bisnieto también. No sé los nombres bien, la memoria no me ayuda. Claudia puede decirte, ella los cuida más que yo.

**Biógrafo** `[M3.4 + HI9]`:
> Gracias por contármelo. Seguimos.
>
> ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada.

**Narrador** `[HI9]`: No me acuerdo bien. Supongo que les cuento historias, o les doy algo de comer. Pero no tengo una cosa especial que solo sea mía con ellos. La memoria me falla, querido.

**Biógrafo** `[M26 + CI8]`:
> Gracias, Elsa.
>
> Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI8]`: No, nada más. La familia está ahí.

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M25.3 + EN9]`:
> Bien, entonces.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Narrador** `[LU4]`: No me acuerdo de viajes grandes. Viajé a Villaguay de vez en cuando para ver a mis papás, pero no fueron viajes especiales. Nunca fui a otros lados lejos, con avión o así. Mi vida fue en Paraná, en la casa.

**Biógrafo** `[M3.6 + PA1]`:
> Lo tengo. Vamos con otra.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Narrador** `[PA1]`: No, no tuvo pasiones grandes aparte del trabajo y la familia. Cosía, cuidaba a la familia, y eso fue mi vida. No me dedicaba a otras cosas. Era simple mi vida.

**Biógrafo** `[M26 + CI9]`:
> Gracias, Elsa.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquila.

**Narrador** `[CI9]`: No, nada más se me viene a la mente. La casa es lo que más amo, Paraná, donde viví y viví la vida.

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M24.3 + EN10]`:
> Bien, Elsa. Lo sumo a lo que ya me contaste de eso.
>
> Hablemos de los amigos y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Narrador** `[AS1]`: No, no tuve una amistad muy importante de verdad. La gente que conocía en Paraná, algunos clientes que me traían ropa. Pero amigos de verdad, así como deben ser, no. Mi vida fue la familia, Ernesto y mis hijas. Eso fue lo importante.

**Biógrafo** `[M3.8 + AY1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Narrador** `[AY1]`: No me acuerdo de momentos así donde alguien me haya ayudado en especial. Supongo que Ernesto siempre me ayudaba en lo que podía, pero eso era normal. No me vienen casos de verdad en mente.

**Biógrafo** `[M3.1 + AS9]`:
> Gracias, Elsa. Ya lo guardé.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Narrador** `[AS9]`: Mis hijas, Mónica y Claudia. Mis nietos. A Ernesto, si pudiera, aunque no está. Ellos son mi gente cercana. Nadie más tiene un lugar especial en mi vida. La familia lo es todo.

**Biógrafo** `[M26 + CI10]`:
> Gracias, Elsa.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquila.

**Narrador** `[CI10]`: No, nadie más se me viene a la mente.

## Bloque 11 · Pérdidas y momentos difíciles

**Biógrafo** `[M25.1 + AV11]`:
> Bien, seguimos.
>
> Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás.

**Biógrafo** `[PE1 + M1]`:
> ¿Perdiste a alguien importante en tu vida? Si querés, contame quiénes fueron, qué eran para vos y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE1]`: Sí, perdí a Ernesto en el 2015. Eso fue lo más duro de mi vida. Estuvimos juntos 47 años. Cuando se fue, sentí que se me iba todo. Pero Claudia me ayudó a seguir. Me acuerdo de los últimos momentos con él, cuando estaba enfermo. Le agarraba la mano, le hablaba. Fueron momentos difíciles, muy dolorosos.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE5]`: Bueno, la memoria me falla hace un tiempo. La vista también. Estos últimos años he tenido que dejar de hacer cosas. Los dolores de huesos, de espalda. Pero nada grave que me haya frenado completamente. Es la edad, supongo. Claudia me cuida, me ayuda.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE4]`: La muerte de Ernesto fue lo más duro. Eso ya lo conté. Aparte de eso, la vida fue llevable, tranquila.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[CI11]`:
> Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.

**Narrador** `[CI11]`: No, nada más. Creo que ya está todo.

## Bloque 12 · La historia grande

**Biógrafo** `[M25.2 + EN12]`:
> Bien, seguimos.
>
> Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.

**Biógrafo** `[HG1]`:
> Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día.

**Narrador** `[HG1]`: No me acuerdo bien de esos eventos grandes. Habrá habido cosas en el país, cambios, pero no me vienen a la memoria en especial. Yo estaba ocupada con mi familia, con el trabajo. Las noticias veía en la tele, pero no me marcaron mucho.

**Biógrafo** `[M3.3 + HG4]`:
> Anotado. Sigo con otra.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado.

**Narrador** `[HG4]`: No me acuerdo bien. Fue un tiempo raro, tenía miedo de salir. Claudia me ayudaba, me traía cosas. Pasaba mucho tiempo en casa mirando televisión. Fue aburrido, largo. Pero un día en especial, no me acuerdo.

**Biógrafo** `[M3.4 + DE1]`:
> Gracias por contármelo. Seguimos.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Narrador** `[DE1]`: No me acuerdo de algo específico. Pero sí, eran tiempos más cerrados. Las mujeres teníamos que ser más recatadas. No se podía hablar de ciertas cosas. Pero no recuerdo un momento en particular que me haya marcado por eso.

**Biógrafo** `[M3.5 + FI7]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Narrador** `[FI7]`: La política nunca fue importante para mí. Yo votaba, eso sí, pero no me metía mucho en eso. Estaba ocupada con la familia, con el trabajo. Las cosas que pasaban en el país, las veía en la tele, pero no me afectaban personalmente. Vivía mi vida nomás.

**Biógrafo** `[M26 + CI12]`:
> Gracias, Elsa.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.

**Narrador** `[CI12]`: No, nada más se me viene a la mente.

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M25.3 + EN13]`:
> Bien, entonces.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó.

**Narrador** `[GI1]`: Ay, mi boda con Ernesto. Ese día quería vivirlo de nuevo. Fue tan hermoso, tan especial. El vestido blanco, la iglesia, todo fue perfecto. Ese día siento que fue el comienzo de una vida hermosa, aunque después tuviera alegrías y tristezas. Pero ese día, ese día fue mágico.

**Biógrafo** `[M3.7 + GI2]`:
> Listo, quedó guardado. Sigo.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó.

**Narrador** `[GI2]`: No me acuerdo bien de un día así. Supongo que cuando nació Mónica fue un cambio grande, pero eso no fue un día que empezó normal. O cuando me fui de Villaguay a Paraná, eso cambió mi vida. Pero los detalles de esos días no me los acuerdo.

**Biógrafo** `[M3.8 + HJ1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Narrador** `[HJ1]`: No, yo creo que mi vida fue como debía ser. Casarme, tener hijas, trabajar, cuidar la familia. Eso fue lo que quería, y lo logré. No creo que me haya quedado con algo grande sin hacer.

**Biógrafo** `[M3.1 + GI9]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquita frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor.

**Narrador** `[GI9]`: No me acuerdo de algo así. Viví en pueblos y ciudades, pero no me acuerdo de un momento que me haya dejado chiquita frente a algo grande. La vida fue simple para mí.

**Biógrafo** `[M3.2 + FI1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos misma? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Narrador** `[FI1]`: La soledad, sí. Ahora vivo sola, aunque Claudia me visita todos los días. Cuando cosía, estaba sola en casa, con la máquina. Eso me gustaba, el silencio. Me daba paz. Ahora que no coso, a veces me quedo mirando por la ventana, pensando. La soledad no me asusta, pero a veces la siento.

**Biógrafo** `[M3.3 + FI2]`:
> Anotado. Sigo con otra.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Narrador** `[FI2]`: Cuando Ernesto murió, me di cuenta de que ya habíamos pasado la mitad de la vida, o más. Estábamos viejos. Cuando mis hijas tuvieron hijos, también me pasó. De repente tenía nietos. El tiempo pasa rápido, no te das cuenta.

**Biógrafo** `[M3.4 + FI3]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Narrador** `[FI3]`: La costura, sin duda. Mi mamá me lo enseñó y yo lo heredé. También creo que heredé el carácter de trabajadora, de no rendirme. Mi papá era trabajador, mi mamá también. Eso lo llevo en las venas.

**Biógrafo** `[M3.5 + FI4]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Narrador** `[FI4]`: No mucho. Siempre hice lo que tenía que hacer, lo que creía que era correcto. No me preocupaba lo que dijera la gente. Mis hijas, Ernesto, mi familia, eso era lo importante. El resto, no me tocaba tanto.

**Biógrafo** `[M3.6 + FI6]`:
> Lo tengo. Vamos con otra.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Narrador** `[FI6]`: No sé. No pienso en eso. Yo tengo 80 años, no voy a ver el mundo en cien años. Espero que mis bisnietos y sus hijos sean felices. Que la familia siga unida, eso es lo que importa. Lo demás no lo sé.

**Biógrafo** `[M26 + CI13]`:
> Gracias, Elsa.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquila.

**Narrador** `[CI13]`: No, creo que ya está todo contado. Mi vida está ahí, en lo que conté.

## Bloque 14 · Hoy

**Biógrafo** `[M24.4 + EN14]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Dejamos el pasado un rato y venimos a hoy, Elsa: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Narrador** `[HO1]`: Me levanto cuando amanece. Desayuno algo liviano, mate, pan. Miro un poco de tele. Cuando viene Claudia, que es todos los días, conversamos. Ella me trae comida, me ayuda con las cosas de la casa. Miramos tele juntas. Cuando se va, me quedo sola. Como algo. A la noche, cenamos algo tranquilo. Me acuesto temprano. Los días son lentos, repetidos. Pero así es la vida a esta edad.

**Biógrafo** `[M3.8 + HO2]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado.

**Narrador** `[HO2]`: Ay, no me acuerdo bien. Claudia a veces me hace reír con cosas que dice. La tele también, cuando hay algo cómico. Pero una risa de verdad con ganas, no me acuerdo. La edad hace que rías menos, viste.

**Biógrafo** `[M3.1 + HO5]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Narrador** `[HO5]`: Lo que más me gusta es cuando viene Claudia. Verla entrar por la puerta, conversar con ella. Ella es lo mejor que tengo ahora. Eso me hace feliz, eso me da propósito. Sin ella no sé qué haría. Es todo para mí.

**Biógrafo** `[M3.2 + CO1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Narrador** `[CO1]`: Las milanesas. Eso era mi plato, que me pedían todos. Aprendí de mi mamá. Las hacía tiernas, bien fritas. Ernesto las amaba, mis hijas también. Cocinaba milanesas de pollo, de carne. Eran simples pero ricas. Eso me lució siempre en la cocina.

**Biógrafo** `[M3.3 + HO9]`:
> Anotado. Sigo con otra.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Narrador** `[HO9]`: Vivo en un departamento en Paraná. Es chiquito, tranquilo. Hace años que estoy ahí. El barrio es quieto, hay árboles, vecinos buenos. Mi vida es tranquila acá. Claudia sabe dónde es, me visita. Es lo que necesito a esta edad, un lugar tranquilo donde pasar mis días.

**Biógrafo** `[M26 + CI14]`:
> Gracias, Elsa.
>
> Con esto cerramos lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquila.

**Narrador** `[CI14]`: No, creo que está todo. La vida es simple ahora, sin sorpresas.

## Bloque 15 · Legado y cierre

**Biógrafo** `[M25.1 + EN15]`:
> Bien, seguimos.
>
> Ya estamos en la última parte, Elsa: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Narrador** `[LE1]`: Mis hijas. Eso me enorgullece más que nada. Las crié lo mejor que pude, con amor, con dedicación. Son buenas personas. Eso es lo más grande que tengo. El resto, el trabajo, la costura, todo eso está bien, pero mis hijas, mis nietos, eso es todo para mí.

**Biógrafo** `[M3.5 + LE2]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos misma descifraste viviendo.

**Narrador** `[LE2]`: La familia es lo primero. Cuidala, quérela. No importa lo demás, el dinero, las cosas. Lo importante es estar juntos, apoyarse. Y trabajar con dedicación, sin quejarse. Eso es lo que yo viví y lo que les digo a mis hijas. La familia y el trabajo, eso es todo.

**Biógrafo** `[M3.6 + FU1]`:
> Lo tengo. Vamos con otra.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Narrador** `[FU1]`: A esta edad, no. Quería vivir para ver crecer a mis nietos, eso ya lo hice. Ahora solo quiero estar tranquila, con Claudia, viendo pasar los días. No tengo grandes sueños ya.

**Biógrafo** `[M3.7 + LE7]`:
> Listo, quedó guardado. Sigo.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Narrador** `[LE7]`: Ay, no sé. "Una vida de trabajo y amor", quizás. O "La vida de Elsa". Simple, como fue mi vida. Porque fue eso, trabajo y amor. Nada especial, nada grande, pero llena de las cosas que importan.

**Biógrafo** `[M3.8 + M15]`:
> Escuchado. Vamos por la siguiente.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> Mamá, ¿te acordás de la canción que nos cantabas para dormir? Mónica

**Narrador** `[FAM1]`: Ay, Mónica. Cantaba "Duerme, duerme, mi amor" o algo así. Una canción de cuna que me enseñó mi mamá. Los versos no me los acuerdo bien, pero era linda. Te la cantaba cuando eras chiquita, para que durmieras. Supongo que era algo de "cielito", "estrellita". Perdoname, mi amor, la cabeza no me ayuda. Pero esa canción era para vos, para que durmieras tranquila.

**Biógrafo** `[M3.1 + FO1]`:
> Gracias, Elsa. Ya lo guardé.
>
> Otra cosa, Elsa. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés a mano, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Y si no encontrás ninguna, no pasa nada: el libro va igual.

**Narrador** `[FO1]`: Ay, sí tengo fotos. Déjame buscar. Ay, acá tengo una de hace años, cuando Ernesto aún estaba vivo. Estamos los dos en el patio, con mis hijas chiquitas. Ernesto tiene un traje, yo estoy al lado suyo sonriendo. Las chicas están abajo. Es una foto hermosa. Me la mando, dale. Se ve la casa atrás, era verano. Fue un buen día ese.

**Biógrafo** `[M26 + LE9]`:
> Gracias, Elsa.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Narrador** `[LE9]`: No, creo que ya está todo. Toda mi vida está ahí. Gracias por escucharme, por hacerme recordar. Fue lindo hablar de todo esto.

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Narrador** `[LE8]`: A Mónica y Claudia, mis hijas, les digo que las quiero muchísimo. Ustedes son mi vida, mi orgullo. Sigan adelante, cuiden a sus hijos, a sus familias. Sean felices. A mis nietos, crezcán con amor, con ganas de vivir. Recuerden a la abuela que los quiere. Y a Claudia, especialmente, le digo que sin ti no sé qué haría. Eres lo mejor que tengo en esta vida. Gracias por estar siempre. Los quiero a todos, son mi familia, mi todo.

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Elsa. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre, y es bien tuyo. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Fue un gusto enorme escucharte.
