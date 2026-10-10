# Simulación 5: el que dice paso a su manera (Manuel, 70, inventado)

**Qué es:** la entrevista de un narrador **inventado** (Manuel), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Plan: [`PLAN.md`](PLAN.md).

**Cuenta:** 90 preguntas del banco contestadas + 1 de la familia · **128 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas van juntas en ese mensaje); **Narrador** es lo que contestó. Los títulos de bloque y los IDs (entre corchetes) son para el equipo: el narrador no los ve.

**Biógrafo** `[BIEN]`:
> Hola, Manuel, ¿cómo estás? Una persona que te quiere mucho te regaló un libro con la historia de tu vida, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.
>
> Funciona así: te mando una pregunta y vos me la contás en audio, como si me lo estuvieras contando en persona. Mandame todos los audios que quieras. Cuando termines, ya está: con un ratito de silencio, la pregunta que sigue te llega sola.
>
> Si alguna pregunta no tiene que ver con tu vida, me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro: esto lo hacemos al ritmo que vos quieras.

## Bloque 1 · Origen y raíces

**Biógrafo** `[OR1 + M1]`:
> Empecemos por cuando llegaste al mundo, según te contaron. No el día en sí, sino la época: dónde vivían, en qué andaban tu mamá y tu papá, cómo te esperaban. ¿Qué sabés de cómo era la vida de ellos en ese entonces? Contame.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR1]`: Eso... bueno, me acuerdo de lo que me contaba mi madre. Nací en 1956, en una aldea muy pequeña en Galicia, provincia de Ourense. Mis padres eran campesinos, trabajaban la tierra, tenían vacas, un huerto. No era mucho, pero se arreglaban. Yo era el segundo, mi hermano José era mayor. Cuando nací, estábamos en tiempos duros para España todavía, pero para mi padre y mi madre era normal. Ellos querían hijos, eso lo sabía. Mi padre trabajaba desde la mañana hasta la noche en el campo, mi madre en la casa y también en las labores. Me decía que cuando nací, toda la gente del pueblo fue a verme, porque así era en esos lugares, vos sabés. Una criatura era una bendición. Yo crecí entre animales, entre el campo, entre gente que se conocía de toda la vida.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Manuel. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR2]`: Mira, la que más me acuerdo es de mi abuela, la madre de mi padre. Dicen que cuando era joven emigró a América, a Cuba, creo que sería 1920 y pico. Trabajó en una casa como sirvienta, juntó dinero durante años, y después volvió a Galicia. Para entonces ya tenía sus ahorros. Eso fue lo que permitió que mi abuelo y ella compraran más tierra, un pedazo más de finca. Es raro, vos, porque ella fue la que trajo la plata de afuera. Mis padres siempre hablaban de eso con respeto, de que ella se fue sola, que trabajó, que volvió y mejoró a la familia. Eso me impresionaba de chiquito. Tal vez por eso después yo también me animé a irme.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR5]`: Eso me lo contó muchas veces mi madre. Se conocieron en la iglesia del pueblo, en una misa de Pascua. Ella era de una aldea al lado, había ido con su familia. Mi padre la vio, le pareció linda, y después le pidió a un amigo que le ayude a saber quién era. Al tiempo fue con su padre a hablar con la familia de ella, como se hacía en esos días. Mi padre no era mucho de palabras, pero según mi madre le cayó bien. Se casaron un año después, en 1945. Nada complicado, vos, como eran las cosas en el pueblo.

**Biógrafo** `[M26 + CI1]`:
> Gracias, Manuel.
>
> Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora.

**Narrador** `[CI1]`: No, creo que está todo. De eso no hay mucho más que contar, vos. La vida en la aldea era tranquila, siempre igual.

## Bloque 2 · La casa y la familia de la infancia

**Biógrafo** `[M24.1 + EN2]`:
> Gracias, Manuel. Eso también va al libro.
>
> Ahora vamos a tu infancia: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Narrador** `[CA1]`: Uy, eso está grabado. Me veo a mí mismo, debe ser que tendría tres años, cuatro a lo sumo. Estaba en la cocina, hacía frío, y mi madre estaba calentando algo en el fuego. La casa era de piedra, grande para lo que es, con un corredor que daba a la cocina. Yo estaba jugando con una cuchara de madera, golpeándola contra el piso. Mi hermano José estaba en la puerta mirando hacia afuera, hacia la huerta. Mi padre llega en ese momento, viene del campo, y me levanta, me pone en el aire. Recuerdo sus manos grandes, el olor a tierra que traía. Mi madre se ríe y me da algo de comer. Eso es todo, pero está ahí todavía, vos. Está ahí.

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chico. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Narrador** `[CA2]`: Mi madre era... cómo te digo. Era una mujer fuerte, trabajadora, pero cálida con nosotros. Me acuerdo que me curaba las heridas cuando me caía jugando, me hacía sopitas cuando estaba enfermo. Un día me metí en un charco de barro cerca de la casa y volví hecho un desastre. Ella se reía, me metía en la tina y me lavaba. No me gritaba, vos. Me decía "Manuel, vos que tonto", pero riendo. Eso es lo que recuerdo. Que me cuidaba. Que siempre estaba ahí cuando la necesitaba.

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chico? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Narrador** `[CA3]`: Mi papá trabajaba la tierra, tenía las vacas. Salía al alba y volvía cuando empezaba a oscurecer. Una vez, siendo yo pequeño, me llevó con él a ordeñar las vacas. Yo no tendría más de cinco años. Me mostró cómo hacerlo, con paciencia, aunque mis manos no llegaban bien. Él trabajaba sin parar, sin quejarse. Eso me quedó. Que el hombre trabaja porque tiene que mantener a la familia, y punto. No había más que hablar de eso. Después yo hice lo mismo toda mi vida.

**Biógrafo** `[M3.6 + CA6 + M1]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste hermanos? Si tuviste, ¿con cuál eras más cercano de chico? Contame alguna aventura que hayan hecho juntos; seguro tienen varias.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[CA6]`: Sí, tengo un hermano mayor, José. De chicos hacíamos cosas normales de aldea, vos. Nos íbamos al río a buscar ranas, a nadar cuando hacía calor. José era mayor, así que me cuidaba, me protegía si alguno del pueblo me molestaba. Teníamos una cabeza de árbol donde nos subíamos y mirábamos hacia la montaña. Eso era lo más lejos que alcanzábamos a ver. José me decía "mirá hacia allá, ahí hay ciudades grandes", pero yo no podía imaginar. Eran buenos tiempos, tranquilos.

**Biógrafo** `[M3.7 + CA16]`:
> Listo, quedó guardado. Sigo.
>
> Contame un día de chico que esperabas con muchas ganas: qué era, quién estaba, qué pasó.

**Narrador** `[CA16]`: Uy, sí. La fiesta del pueblo, en agosto. Duraba tres días. Mi madre me compraba ropa nueva, y mi padre me daba dinero, poco pero para mí era un tesoro. Había música, gente, comida en las mesas afuera de la iglesia. Yo iba con José y con otros chicos a jugar, a correr, a meterse en todos lados. Había una rueda, una cosa que hacía vueltas, que era lo más moderno que yo había visto. Un año pude andar en ella, y sentía que me moría del miedo y de la alegría al mismo tiempo. La espera empezaba meses antes. Contaba los días. Era lo mejor del año.

**Biógrafo** `[M3.8 + CA17]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[CA17]`: De la infancia, no mucho. Pasaba hambre a veces, como todos, pero no era drama. Lo difícil vino después, cuando fui más grande.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Manuel. Queda guardado con cuidado.

**Biógrafo** `[CI2]`:
> Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquilo, que hay tiempo.

**Narrador** `[CI2]`: No, creo que ya contamos todo de eso. La infancia fue la aldea, la familia, el trabajo en el campo. Nada más que contar.

## Bloque 3 · La escuela y los juegos

**Biógrafo** `[M24.2 + EN3]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad.

**Biógrafo** `[ES1]`:
> ¿Cómo fue tu primer día de escuela? ¿Quién te llevó hasta la puerta, y qué sentiste cuando se fue? Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria.

**Narrador** `[ES1]`: Mi madre me llevó. Salimos temprano, la escuela era en la aldea, no lejos de la casa. Ella me agarraba la mano. Yo tenía miedo, creo, porque había muchos chicos que no conocía, y el maestro era severo, un señor grande que hablaba fuerte. Mi madre me soltó en la puerta, me dio un beso y se fue. Yo me quedé ahí parado, mirando a los otros. Después el maestro me puso en un banco con otros chicos. Aprendí a leer, a escribir. La escuela era en gallego y en español. El maestro pegaba si uno no sabía la lección. Yo aprendí rápido porque tenía miedo.

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Narrador** `[ES2]`: Sí, la señorita Margarita. Era la maestra de los últimos años. Ella sí era diferente, vos. No pegaba. Nos enseñaba a leer novelas, a escribir historias. Un día yo escribí una cosa sobre mi pueblo, la aldea, y ella la leyó en voz alta a toda la clase. Me puse colorado, pero ella después me dijo "Manuel, vos podés escribir bien, si querés". Eso me quedó. No cambió mi vida ni nada, pero fue la única que me dijo que yo podía hacer algo más que trabajar en la tierra.

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chico, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Narrador** `[ES5]`: Sí, mi amigo Ramón. Vivía al lado de la escuela. Nos pasábamos todo el tiempo juntos. Íbamos a robar manzanas de un huerto que había cerca, nos bañábamos en el río, jugábamos a la pelota en las tardes. Una vez nos perdimos en el monte, no encontrábamos la vuelta, y empezó a oscurecer. Nos asustamos, pero después aparecimos en una aldea al lado y nos pidieron que llamemos a nuestras madres. Me acuerdo de que mi madre fue a buscarme furiosa, pero después se rió contándole a mi padre. Ramón y yo siempre estábamos metidos en algo.

**Biógrafo** `[M3.3 + ES6]`:
> Anotado. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chico, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Narrador** `[ES6]`: Una vez, con unos chicos de la aldea, metimos un ternero en la casa del cura. Fue en invierno, un ternero que teníamos suelto. Alguien tuvo la idea, una cosa de pavos, vos. El cura abrió la puerta de la casa y se encontró el ternero. No sé cómo llegó ahí. El cura bajó a la iglesia furioso, preguntando quién había sido. Nadie habló. Yo estaba muerto de risa, escondido con los otros. Mi padre se enteró después, me pegó un palmazo, pero vos veías que no le importaba mucho. Era cosa de chicos.

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Narrador** `[ES7]`: De chico no pensaba en eso como vos pensás ahora. Veía a mi padre trabajando, y suponía que yo iba a hacer lo mismo. La aldea era así, vos no soñabas con ser piloto de avión ni nada. Trabajabas la tierra si tenías tierra, o trabajabas para alguien si no. Cuando empecé a crecer, viendo a los chicos mayores que emigraban, que se iban a Buenos Aires o a otras ciudades, ahí empecé a pensar en algo diferente. Varias veces escuché "Manuel, si querés vivir mejor, te tenés que ir". Eso me quedó.

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chico? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Narrador** `[ES9]`: Sí, mucha. Mi madre era muy católica. La misa de los domingos era obligatoria. Mi Comunión fue algo importante. Me compraron un traje blanco, muy raro para mí. Iba con otros chicos de la aldea, algunos amigos. Después hicieron una comida en casa, nada grande, pero estaba la gente, había carne. Mi abuelo me regaló una cruz pequeña que todavía tengo, vos. Era importante la religión, aunque mi padre era más tranquilo con eso. Pero la iglesia, las misas, las procesiones, todo eso formaba parte de la vida normal en la aldea.

**Biógrafo** `[M26 + CI3]`:
> Gracias, Manuel.
>
> Con esto cerramos tus años de escuela. Antes de seguir, ¿te quedó alguna historia de esa época dando vueltas, algo que no entró en ninguna pregunta? Contámela ahora, con calma, que la quiero escuchar.

**Narrador** `[CI3]`: No, creo que dijimos todo. La escuela, los maestros, los amigos. Eso es.

## Bloque 4 · Adolescencia

**Biógrafo** `[M25.1 + EN4]`:
> Bien, seguimos.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chico y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Narrador** `[AD2]`: Después de la primaria, la verdad es que no continué estudiando. Mi padre necesitaba ayuda en el campo, y yo andaba trabajando con él. Levantarme al alba, ordeñar, trabajar en la tierra. Iba a la aldea de vez en cuando, veía a Ramón y a otros chicos, pero la realidad era que ya estaba en otra cosa. Trabajar. Mi hermano José ya se había plantado en que se quedaba en la aldea, que trabajaría en la finca. Yo... no sé, algo me decía que eso no era para mí. Veía que otros chicos se iban a ciudades más grandes, buscaban otra vida. Eso me daba vueltas en la cabeza.

**Biógrafo** `[M3.7 + AD3]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Narrador** `[AD3]`: Sí, andábamos siempre con los mismos. Ramón, Xosé, Miguel, otros. Nos juntábamos en la noche en la plaza o cerca de la iglesia. Fumábamos, hablábamos de boludeces, de chicas, de la vida. En esa época lo que más nos ilusionaba era poder ir a Ourense, la ciudad más cercana, una o dos veces al año. Allá sí había cines, bares, la sensación de que había más mundo. Una vez fuimos con Ramón a un baile, en un pueblo grande. Pasamos toda la noche en un bar, escuchando música. Eso era la aventura más grande que teníamos entonces. La aldea era muy chica.

**Biógrafo** `[M3.8 + AD5]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche.

**Narrador** `[AD5]`: Era en un pueblo al lado, no sé si a unos cinco kilómetros. Fui con Ramón y otros chicos. Me puse una camisa que mi madre me planchó, un pantalón limpio. Estaba nervioso, vos, quería que me viera alguna chica. Había un grupo tocando, música de entonces, baladas. Ramón me dijo "ándate a bailar", pero yo no sabía. Una chica me sacó a bailar, no me acuerdo el nombre. Fue un desastre, pisé, choqué con otra pareja, pero ella se reía. Después tomamos vino malo en la barra. Volvimos a pie a la aldea, cantando. Fue una buena noche.

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Narrador** `[AD6]`: Una chica, Consuelo, del pueblo al lado. Nos conocimos en un baile, como te decía. Ella era rubia, morena de cara, con unos ojos... bueno. Me enamoré al toque. Empecé a ir al pueblo donde ella vivía, cualquier excusa. Mi madre lo sabía y se burlaba. Pasábamos tardes caminando, sentados bajo unos árboles que había, hablando de nada. Un día le agarré la mano, y ella no la sacó. Así estuvimos un tiempo. Pero ella tenía un novio antes, un tipo de la ciudad que volvía los fines de semana, y apareció. Ella no sabía qué hacer. Yo le dije que elija, y ella eligió al otro. Me dolió en ese momento, claro, pero después pasó.

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chico? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Narrador** `[AD12]`: Cuando decidí irme. Tenía diecinueve años. Mi padre no sabía que yo tenía en la cabeza irme, así que se sorprendió. Pero también entendía. Mi tío, el hermano de mi padre, vivía en Buenos Aires desde hacía años. Me escribió una carta diciendo que si quería, me daba trabajo, que había laburo, que la vida era diferente. Yo fui hablando con mis padres, especialmente con mi madre, que no quería. Una noche tomé la decisión en serio, sola en mi cama. Me dije "me voy". No fue fácil. Empecé a juntar plata, a prepararme. Eso fue adulto de repente. Dejar todo.

**Biógrafo** `[M3.3 + AD15]`:
> Anotado. Sigo con otra.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[AD15]`: De eso no. La adolescencia fue normal, trabajar, amigos. Lo difícil llegó cuando crecí más.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquilo, que hay tiempo.

**Narrador** `[CI4]`: No, nada especial. Eso es todo.

## Bloque 5 · Juventud

**Biógrafo** `[M25.3 + EN5]`:
> Bien, entonces.
>
> Pasamos a tu juventud, Manuel: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Narrador** `[JU1]`: Me fui con un tío que viajaba cada tanto de Argentina a Galicia. Fue en 1975. La despedida fue en el puerto. Mi madre lloró mucho, eso me dolió. Mi padre estaba callado, serio. Yo le pregunté qué si estaba enojado, y él me dijo que no, que entendia que yo necesitaba irme. Igual se notaba que le dolía. Me abrazó fuerte. Viajé en barco, tardaba semanas. Mi tío compartía camarote conmigo. Me llevaba una valija con ropa, cartas de mi madre, dinero que mis viejos habían juntado. Iba asustado y emocionado al mismo tiempo. No sabía lo que me esperaba. Mi tío me decía que no me preocupara, que había trabajo, que Buenos Aires era grande.

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Narrador** `[JU2]`: Después de llegar a Buenos Aires, no continué con nada formal. Mi tío me consiguió trabajo en un bar en Villa Crespo, como mozo. Era trabajo duro, vos, limpiador, juntando platos, levantando cosas pesadas. Trabajaba de mañana a noche, iba aprendiendo cómo funcionaba un negocio. Después de un par de años, el dueño me puso como encargado. Ya empezaba a entender cómo se maneja un lugar así. Conocí gente, clientes que venían todos los días. Esos años fueron de aprendizaje. No iba a la escuela, pero aprendía en el trabajo. Eso me preparó para después, cuando tuve mi almacén.

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Narrador** `[JU4]`: En 1990 compré mi almacén. Fue con plata que ahorraba de trabajar en bares, más un préstamo que conseguí. Era un almacén chiquito en Villa Crespo, entre vecinos que se conocían. El primer día me pasé atrás del mostrador, sin saber casi qué hacer. Tenía un cuaderno donde anotaba todo: qué vendía, qué compraba, quién me debía. Aprendí de los clientes, que me contaban cómo era antes el barrio. Empecé a conocer a los proveedores, a negociar precios. Los primeros meses fueron de mucho laburo y poco dinero. Pero poco a poco el almacén creció. Conocía a la gente por su nombre, sabía qué compraba cada uno. Eso fue lo que hizo que funcione.

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Narrador** `[JU5]`: No pasé por eso. Me fui de Galicia a los diecinueve, así que no hice servicio militar en España. En Argentina... no era lo mismo. Pero la disciplina la aprendí de mi padre, que era un hombre exigente. Y en el trabajo, en el bar, el dueño también era severo. Eso fue mi mili, digamos. Aprender a cumplir, a no andar con excusas.

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Si te pasó, contame cómo lo decidiste: qué te empujó y a quién se lo dijiste primero.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[JU8]`: Sí, me fui de Galicia a Buenos Aires en 1975. Le conté primero a mi padre, en privado. Él me preguntó por qué, si la aldea no era buena. Le dije que necesitaba otra cosa, que la aldea era pequeña. Mi padre escuchó, pensó, y me dijo que estaba bien, que me fuera. Después le conté a mi madre, que fue la que más sufrió. Mi hermano José no dijo nada, se quedó en Galicia. Yo sabía que si no me iba en ese momento, no lo iba a hacer nunca. Tenía miedo, pero más miedo me daba quedarme.

**Biógrafo** `[M3.8 + JU12]`:
> Escuchado. Vamos por la siguiente.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue?

**Narrador** `[JU12]`: Después de estar con mi tío unos años, alquilé una pieza en una casa grande, en Villa Crespo también. Era una pieza chiquita, con una ventana que daba a un patio. Había una cama, una silla, un ropero pequeño. Los otros inquilinos eran tranquilos, todos trabajaban. La dueña era una señora mayor que cuidaba la casa. Yo iba decorando poco a poco, con ahorros. Una foto de mi familia en Galicia que llevé desde allá, una radio. La primera noche dormí ahí solo, sin mi tío. Sentía que era mío, vos. Miedo tenía, por la noche, nuevo en un país, en una ciudad tan grande. Pero también sentía que había hecho bien. Que era el camino.

**Biógrafo** `[M3.1 + JU15]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Narrador** `[JU15]`: Conocí a otros españoles, sobre todo gallegos como yo. Con ellos nos juntábamos en el bar de mi tío o en la casa de alguno. Hablábamos de Galicia, de cómo era la vida acá, de las chicas. Uno era Pepe, que después se fue de nuevo a España. Otro era Fermín, que se quedó acá. Nos conocimos en el bar donde yo trabajaba. Una noche fuimos a un cine, los cuatro, a ver una película de Almodóvar, que estaba de moda. Después nos fuimos caminando por la ciudad. Iban contándome historias de Buenos Aires que yo no conocía. Eso fue lindo, tener gente que me entendía, que hablaba como yo.

**Biógrafo** `[M3.2 + JU17]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[JU17]`: De eso no. Hay cosas que prefiero guardarme.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI5]`:
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.

**Narrador** `[CI5]`: No, creo que está todo. Esos años fueron de trabajo y aprendizaje, y después llegó lo demás.

## Bloque 6 · Amor y pareja

**Biógrafo** `[M24.3 + AM0 + M1]`:
> Bien, Manuel. Lo sumo a lo que ya me contaste de eso.
>
> Ahora vamos al amor. Haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después vamos de a una, empezando por la primera que fue en serio. Si no hubo, decímelo nomás, que también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM0]`: Bueno, hubo una en Galicia, Consuelo, cuando era chico, pero eso no llegó a nada. Después, acá en Buenos Aires, conocí a Rosa en 1980. Eso fue en serio. Nos casamos en 1982. Desde entonces estamos juntos. No hubo muchas más, vos. Rosa fue la que contó.

**Biógrafo** `[M3.3 + AM1]`:
> Anotado. Sigo con otra.
>
> Contame el día que se conocieron. ¿Dónde fue, quién los presentó o cómo se cruzaron? ¿Y qué fue lo primero que te llamó la atención de esa persona?

**Narrador** `[AM1]`: Rosa vino al bar donde yo trabajaba con su hermana. Fue un sábado por la noche. Yo estaba atendiendo, y ella pidió una cerveza. Cuando le la pasé, nuestros ojos se cruzaron. Ella sonrió. Volvió la semana siguiente, con su hermana de nuevo. Esta vez me puse a hablar con ella mientras tomaban. Me dijo que era argentina, pero que sus padres eran gallegos, de la provincia de Pontevedra. Eso fue lo primero que me gustó, que nos entendíamos en ese sentido. Después de algunas visitas, le pedí que saliera conmigo. Aceptó. Fue en un cine. Nos gustamos desde el principio. Ella era inteligente, directa, bonita.

**Biógrafo** `[M3.4 + AM3]`:
> Gracias por contármelo. Seguimos.
>
> Y después, ¿cómo decidieron armar la vida juntos: casarse, irse a vivir, lo que haya sido? ¿Quién lo dijo primero, o se fue dando solo? Contame ese momento: dónde estaban, qué se dijeron.

**Narrador** `[AM3]`: Pasó de a poco. Después de un tiempo saliendo, ella se fue a vivir conmigo a la pieza que yo alquilaba. Eso no era lo ideal, porque era muy chica, pero nos arreglamos. Un día, después de unos meses, nos sentamos en un banco del parque Rivadavia. Era una tarde de otoño. Yo le pregunté si quería que nos casemos. Ella dijo que sí, rápido, como si lo hubiera estado esperando. No fue romántico con anillo ni nada, fue simple. Nos casamos en 1982 en un juzgado. Después de eso empezamos a buscar un lugar mejor para vivir, algo que fuera realmente nuestro. Fue tranquilo todo, sin drama. Como nosotros.

**Biógrafo** `[M3.5 + AM4]`:
> Guardado, Manuel. Te mando la próxima.
>
> Hay días que quedan grabados para siempre. ¿Hubo uno en que se casaron, o en que empezaron a vivir juntos? Si lo hubo, contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó.

**Narrador** `[AM4]`: Claro que sí. Fue en un juzgado, nada de iglesia ni grandes cosas. Yo estaba nervioso, me puse un traje que me había comprado. Rosa estaba hermosa, de blanco. Su hermana fue con nosotros, y mi tío también. El juez fue rápido, cinco minutos de trámites. Después salimos del juzgado y fuimos a un restaurante, no lejos. Comimos, brindamos, sus padres llegaron más tarde. Mi padre no pudo venir, estaba en Galicia. Eso me dolió un poco. Pero Rosa estaba ahí, sonriendo. Yo sentía que era el día más importante de mi vida hasta ese momento. Que estaba haciendo lo correcto. Fuimos a pasear después, caminamos por la ciudad. Ella me agarro del brazo. Fue un buen día.

**Biógrafo** `[M3.6 + AM8]`:
> Lo tengo. Vamos con otra.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Narrador** `[AM8]`: Uy, hay varias. Una de las que más me gusta es cuando compramos el almacén. Fue un día de verano, 1990. Fuimos caminando por Villa Crespo, mirando el negocio que acabábamos de comprar. Estaba vacío, sin nada, pero yo veía que podía ser. Rosa estaba emocionada también. Nos sentamos en el piso de cemento, en la esquina del local, y nos besamos. Ella me dijo "lo logramos". Eso fue importante para mí. No era un momento de lujo ni nada, era simple. Pero representaba todo lo que habíamos trabajado. La miro y me sigue pareciendo que está ahí, sentada en el piso, sonriendo.

**Biógrafo** `[M3.7 + AM9 + M1]`:
> Listo, quedó guardado. Sigo.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM9]`: No, seguimos juntos. Cuarenta y tantos años. No fue fácil siempre, pero no nos separamos. Ella está ahí todavía.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[AM19]`:
> Y después de esa historia, ¿hubo un tiempo en que seguiste por tu cuenta? Contame cómo era un día tuyo entonces: qué hacías, quién andaba cerca. Si no hubo un tiempo así, decime no nomás.

**Narrador** `[AM19]`: No, de ahí en adelante fue con Rosa. Eso es todo.

**Biógrafo** `[M3.8 + AM16]`:
> Escuchado. Vamos por la siguiente.
>
> Si después de esa historia hubo otro amor, contame del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado. Si no lo hubo, decime no nomás.

**Narrador** `[AM16]`: No, nada de eso. Solo Rosa.

**Biógrafo** `[M3.1 + AM14]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Tuviste algún amor que te marcó y no fue el de toda la vida? Uno que dejó huella, aunque haya durado poco. Si te pasó, contame cómo se cruzaron y el momento que más te acordás de esa persona.

**Narrador** `[AM14]`: Consuelo, la de Galicia. Eso fue cuando era joven, chico todavía. Me dolió cuando se fue con otro, pero era la vida, vos. Una de esas cosas.

**Biógrafo** `[M26 + CI6]`:
> Gracias, Manuel.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI6]`: No, está todo. Rosa es la historia. El resto son recuerdos que pasan.

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M25.3 + EN7]`:
> Bien, entonces.
>
> Ahora vamos al trabajo y a tu oficio, Manuel: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Narrador** `[TR1]`: De chico, trabajaba con mi padre sin cobrar, ordeñando, trabajando la tierra. Eso era normal. El primer dinero que gané fue cuando llegué a Buenos Aires, en el bar del tío. Mi tío me pagaba poco, pero algo era. Con eso primero me compré ropa, cosas que necesitaba. Después, cuando pasé a encargado, ganaba un poco mejor. Era importante ese dinero, porque era prueba de que me podía arreglar solo, que no dependía totalmente de mi tío.

**Biógrafo** `[M3.3 + TR6]`:
> Anotado. Sigo con otra.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Narrador** `[TR6]`: Trabajé en la tierra con mi padre hasta que me fui en 1975. Después, en Buenos Aires, pasé unos quince años en el bar, como mozo primero, después de encargado. Esos años aprendí cómo funciona un negocio. En 1990 compré el almacén, y ahí estuve treinta años. La verdad es que el almacén fue lo mío. Ahí quedé tantos años, tantos días iguales. Levantarme temprano, abrir la puerta, atender a los mismos clientes, conocer sus historias. Eso fue mi vida. El almacén era como mi hijo. Sé que suena raro, pero era así. Cuando cerré hace algunos años fue como despedirme de una parte de mí.

**Biógrafo** `[M3.4 + TR2]`:
> Gracias por contármelo. Seguimos.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Narrador** `[TR2]`: Levantarme a las seis, desayunar algo rápido, Rosa me hacía mate. Salía de casa a las seis y media, caminaba hasta el almacén. Llegaba alrededor de las siete, abría, barraba adentro, organizaba lo que había quedado del día anterior. Después llegaban los primeros clientes, gente que se iba al trabajo. Ellos pedían lo de siempre. Yo atendía, cobraba, anotaba en el cuaderno qué se vendía. Al mediodía venían amas de casa, gente del barrio que compraba para la comida. Después, más tranquilo. A las dos de la tarde comía algo, descansaba un rato. A las cinco abrían de nuevo. Rosa me traía algo para tomar, té. De noche, más tranquilo de nuevo. A las nueve cerraba, contaba la plata, apuntaba todo. Volvía a casa a las diez. Era siempre igual. Eso era mi vida.

**Biógrafo** `[M3.5 + TR3]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Narrador** `[TR3]`: Mi tío. Sin él, yo no estaría acá. Me invitó cuando yo no tenía nada, cuando salía de una aldea chiquita sin saber qué hacer. Me dio trabajo en su bar, me enseñó cómo funcionaba un negocio, me permitió quedarme en su casa. Después me ayudó a conseguir un lugar para alquilar. No estaría acá sin él. Era un hombre serio, no muy cariñoso, pero trabajador. Una vez, cuando yo estaba dudando si comprar el almacén, me dijo "vos tenés que hacerlo, sos capaz". Eso fue importante. Él murió hace muchos años, pero lo guardo en la cabeza.

**Biógrafo** `[M3.6 + TR5]`:
> Lo tengo. Vamos con otra.
>
> ¿Cuál fue el día de trabajo del que estás más orgulloso? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo.

**Narrador** `[TR5]`: El día que abrí el almacén, 1990. Fue algo mío. No trabajar para otro, sino ser dueño. El primer mes fue difícil, ganábamos poco. Pero un día, después de dos meses, conté la caja y me di cuenta de que estábamos llegando a los números que necesitábamos. No fue mucho dinero, pero era suficiente. Llamé a Rosa, le mostré el cuaderno. Ella me abrazó. Eso fue el día de trabajo del que más orgulloso estoy. Porque no era el dinero, era que había hecho algo bien, que mi esfuerzo estaba rindiendo.

**Biógrafo** `[M3.7 + TR11]`:
> Listo, quedó guardado. Sigo.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.

**Narrador** `[TR11]`: 2001. La crisis. Eso fue lo peor que me pasó. La economía se fue a la mierda, valía decir. Las líneas de crédito que había sacado para el almacén se volvieron imposibles de pagar. La gente no compraba. Una semana vendía para dos pesos. El banco me perseguía. Una mañana me despierto, Rosa está llorando, dice que no sabe cómo vamos a pagar el alquiler de la casa. Nunca me lo había visto así. Fui al almacén ese día, me sentí en el piso en la trastienda, solo, y lloré. Pensé que lo iba a perder todo. Pasaron meses duros. Pedimos ayuda, redujimos gastos. Al final logramos salir, pero fue difícil.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Manuel. Queda guardado con cuidado.

**Biógrafo** `[TR8]`:
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Narrador** `[TR8]`: La idea del almacén vino lentamente. Trabajando en bares durante años, veía que el dueño ganaba dinero, pero que yo ganaba poco. Un día le pregunté a mi tío si alguna vez pensó en tener su propio negocio. Me dijo que sí, pero que requería valentía. Rosa y yo empezamos a ahorrar todo lo que podíamos, sin gastar en nada que no fuera necesario. Vivimos en un barrio barato, comíamos comida simple. Así durante años. Un amigo mío que vendía en el mercado mayorista me dijo que conocía un local que se vendía en Villa Crespo. Fuimos a verlo. Era viejo, necesitaba arreglándose, pero el precio era justo. Juntamos ahorros, sacamos un préstamo, metimos lo que teníamos. Y compramos.

**Biógrafo** `[M3.8 + CS1]`:
> Escuchado. Vamos por la siguiente.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Narrador** `[CS1]`: Soy buen cocinero, para las cosas gallegas. Pulpo a la gallega, empanadas, caldo. Los hijos siempre me lo decían. Rosa también. Los fines de semana, a veces, cocinaba algo especial. Eso era mío, vos. El momento en que yo estaba de buen humor era cuando podía cocinar bien para la familia.

**Biógrafo** `[M3.1 + CP1]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chico o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Narrador** `[CP1]`: Sí, claro, la aldea era eso. Levantarme temprano, irme al campo con mi padre. Ordeñábamos las vacas, después arreglábamos cercas, sembrábamos si era época. En invierno, Galicia es fría, llueve mucho. Un día recuerdo que llovía fuerte, viento terrible. Mi padre dice que igualmente hay que ir, que los animales necesitan comer. Fuimos mojados, con el agua hasta el cuello prácticamente. Las vacas estaban asustadas por el ruido. Mi padre me decía "sin quejarse, Manuel", aunque yo temblaba de frío. Limpiamos el establo, les dimos de comer. Volvimos a las horas. Mi madre nos esperaba con ropa seca. Fueron días duros, pero normales. El campo enseña a soportar.

**Biógrafo** `[M3.2 + TR9]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Narrador** `[TR9]`: Lo dejé hace algunos años. El último día... sabía que venía, había decidido hace tiempo. Pero no quería que sea un día especial, así que lo hice como cualquier otro. Atendí clientes toda la mañana. Al mediodía conté la caja, como siempre. A las tres llegó un comprador, alguien que quería el local. Le vendí, cerramos el trato. Después fui limpiando, llevándome las fotos que tenía colgadas. Rosa vino al atardecer. Nos sentamos afuera, en el mostrador. No dijimos mucho. Caminamos hasta casa. Al día siguiente no fui. Dormí hasta tarde. Fue raro. Los primeros meses no sabía qué hacer con el tiempo.

**Biógrafo** `[M26 + CI7]`:
> Gracias, Manuel.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.

**Narrador** `[CI7]`: No, creo que está todo. El almacén fue mi vida, y lo conté. El resto es tiempo.

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M24.4 + EN8]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Volvemos a la familia, Manuel, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Si no los tuviste cerca, contame cómo fue eso.

**Narrador** `[PG1]`: Eso no. Mejor otra.

**Biógrafo** `[M3.4 + HI0 + M1]`:
> Gracias por contármelo. Seguimos.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Si sí, contame quiénes son, así los voy conociendo. Y si no, decímelo nomás y seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI0]`: Sí, tengo dos. Pablo nació en 1984 y Lucía en 1987. Los dos con Rosa. Pablo es abogado, trabaja en una oficina en la zona de San Nicolás. Lucía es maestra, trabaja en una escuela pública. Los dos son buenos, responsables. Sacaron lo mejor de Rosa, creo. Crecieron entre el almacén y la escuela, vieron cómo trabajaba yo, cómo se movía Rosa para que ellos tuvieran todo. De chicos venían al almacén después de la escuela, hacían la tarea ahí, me ayudaban.

**Biógrafo** `[M3.5 + HI2]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Narrador** `[HI2]`: Fue en un hospital, 1984. Yo estaba nervioso como no tenés idea, caminando por los pasillos. Rosa estaba adentro, en trabajo de parto. Las horas pasaban. Un médico me decía "tranquilo, todo va bien". Pero yo no podía estar tranquilo. Finalmente, a media tarde, nace Pablo. La enfermera me lo trae, envuelto en una sábana blanca. Me lo pone en los brazos. Era tan chiquito, vos. Tenía los ojos cerrados. Yo miraba su carita y no podía respirar. Lloraba, no sé si de alegría o de susto. Rosa me llamaba desde la cama, sonriendo, aunque estaba agotada. Yo le mostré al nene. Ese momento, con mi hijo en los brazos por primera vez, fue... el más importante de mi vida.

**Biógrafo** `[M3.6 + HI2b]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste más hijos, o hay alguien más que sentís que criaste o cuidaste como propio? Si fue así, contame cómo fue la llegada de cada uno, con el tiempo que necesites. Cada llegada tiene su historia.

**Narrador** `[HI2b]`: Lucía nació en 1987, tres años después de Pablo. Para entonces yo ya sabía qué esperar, pero fue igual de emocionante. Esa vez fui al hospital con Pablo, que tenía tres años, con mi hermana. Mientras Rosa estaba adentro, yo le explicaba al nene que va a tener una hermanita. Él no entendía mucho. Cuando me la traen, más grande que Pablo, con más pelo, Lucía, le digo a Pablo "mirá, es tu hermana". Él la toca con una manita, con cuidado. Después corre con mi hermana al pasillo a jugar. Rosa y yo nos miramos y sonreímos. Teníamos nuestros dos hijos. Ya estaba todo.

**Biógrafo** `[M3.7 + HI3]`:
> Listo, quedó guardado. Sigo.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Narrador** `[HI3]`: Pablo era quieto, pensador. De chico armaba cosas con bloques, pasaba horas. Lucía era un torbellino, ruidosa, siempre queriendo correr, saltar. Una vez, Lucía tenía como cinco años, se escapó del almacén. Yo estaba atendiendo, Rosa estaba atrás. De repente alguien me dice "Manuel, tu hija está en la calle". Salgo corriendo, la encuentro doscientos metros hacia adelante, intentando cruzar sola. Me asustó, pero cuando la agarro, ella se reía. "Papá, quería ver dónde está el barrio", me decía. Pablo en cambio vino al almacén una vez, se sentó con su cuadernito y empezó a anotar lo que se vendía. "Papá, se ve que la leche vende más", me dijo, con seis años. Era muy observador.

**Biógrafo** `[M3.8 + HS1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Cómo viviste la crianza de tus hijos? ¿La llevaste solo, o tuviste alguna ayuda cerca? Contame un día de esa época que te acuerdes bien.

**Narrador** `[HS1]`: Rosa fue quien más se dedicó a los hijos, eso hay que decirlo claro. Yo estaba en el almacén casi todo el día. Pero cuando llegaba, me encargaba de ayudar, de ayudanles con la tarea, de jugar. Los fines de semana eran míos, casi. Un sábado me acuerdo, fueron los dos, Pablo y Lucía, pequeños todavía, al almacén. Fue tranquilo, no había mucha gente. Yo cerraba la puerta, me los llevaba con ellos al parque que había al lado. Ellos corrían, yo me sentaba con un café en una banca. Rosa me traía algo para comer. Fue un día normal, pero fue lindo. Eso era nuestra vida: simple.

**Biógrafo** `[M3.1 + HI6]`:
> Gracias, Manuel. Ya lo guardé.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Narrador** `[HI6]`: Cuando Pablo se graduó de abogado. Fue en la universidad, una fiesta grande. Lo vi en el acto, con su toga, sonriendo. Pensé en todo lo que habíamos trabajado Rosa y yo para que él pudiera estudiar. Me vine una cosa... no sé cómo explicar. Lágrimas. Después vino hacia mí y me abrazó, me dijo "gracias papá por todo". Eso fue lo más importante. Con Lucía fue distinto pero igual de especial. La vi dando clases en una escuela, en el acto de fin de año, los nenes la adoraban. Ella los hacía reír, los enseñaba. Pensé que eso es lo que yo quería para mis hijos: que hicieran algo que les guste, que ayudaran a otros. Eso está hecho.

**Biógrafo** `[M3.2 + HI8 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, me lo decís y pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI8]`: Sí, tengo un nieto. Tomás, hijo de Pablo. Nació en 2020, así que todavía es muy chico. Fui al hospital con Rosa. Cuando Pablo me lo mostró, lo primero que pensé es que se parecía a él cuando era bebé, pero con los ojos de su mamá. Lo tomé en brazos, y fue la misma sensación que con Pablo, pero amplificada. Yo con más años, vos, pero la sensación fue igual. Le dije a Pablo "es un portento". Él se rió. Rosa estaba al lado llorando de la emoción. Tomás dormía. Vimos cómo dormía ese bebé, como si fuera lo más importante del mundo. Probablemente lo sea. Ahora cuando viene al almacén, lo dejo que gatee por el mostrador.

**Biógrafo** `[M3.3 + HI9]`:
> Anotado. Sigo con otra.
>
> ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada.

**Narrador** `[HI9]`: Todavía es muy pequeño Tomás. Pero cuando viene, lo que más le gusta es que yo le enseñe a barrer. Tiene su escobita pequeñita, y él intenta barrer donde yo barro. Se cae, se ríe. Nadie más le hace eso con él. Es cosa nuestra. Y después le doy un mate vacío, un juego que es entre nosotros dos. Eso es lo nuestro.

**Biógrafo** `[M26 + CI8]`:
> Gracias, Manuel.
>
> Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI8]`: No, está todo. Los hijos, el nieto. La familia es lo importante, y ya conté.

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M24.1 + EN9]`:
> Gracias, Manuel. Eso también va al libro.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Narrador** `[LU4]`: Volví a Galicia cuando mi padre estaba enfermo. Fue en los noventa, no me acuerdo el año exacto, pero fue importante. Viajé con Rosa y con Pablo, que tenía unos diez años. El niño no conocía la aldea, la casa donde creció su papá. Mi padre estaba en la cama, débil. Cuando me vio, lloramos los dos. Caminamos por la aldea con Pablo, le mostré dónde jugué de chico, el río, los árboles. Le conté historias. Mi padre desde la ventana nos veía. Eso fue lindo, poder compartir con mi hijo mi infancia, mi lugar. Fue la última vez que vi a mi padre bien. El viaje de regreso a Buenos Aires fue duro. Dejé a mi padre en esa casa. Pero fue importante estar ahí, con mi hijo, en el lugar de donde vinimos.

**Biógrafo** `[M3.5 + PA1]`:
> Guardado, Manuel. Te mando la próxima.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Narrador** `[PA1]`: La música. Cuando era más joven, en Buenos Aires, me fascinaba escuchar música en las radios. Tango, boleros. Me compraba discos de Gardel, de Piazzolla. Un día entero era escuchar, tomar vino, estar en la casa con Rosa, sin hablar mucho. Los domingos, a veces, iba a escuchar una orquesta en vivo, en una plaza, en un parque. Eso me hacía feliz. No era como un hobby, era más... necesario. La música me hacía sentir que no era solo trabajo y dinero. Que había otras cosas. Ahora, de grande, sigo escuchando. Cuando cierro los ojos escuchando Gardel, por un momento vuelvo a Galicia, a mi infancia.

**Biógrafo** `[M26 + CI9]`:
> Gracias, Manuel.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquilo.

**Narrador** `[CI9]`: No, creo que está todo. La música, el almacén, los lugares. Fue una vida simple.

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M24.2 + EN10]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Hablemos de los amigos, Manuel, y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Narrador** `[AS1]`: Sí, Carmelo. Lo conocí en el almacén, cuando acababa de abrir. Él venía a comprar todos los días. Era portugués, de la zona de Oporto, así que hablábamos en gallego también, medio entendíamos. Un día empieza a venir a la tarjeta, vos sabe, a fiado. Semanas pasan, meses. Al final le perdono la deuda. Se da cuenta, viene, llora. "Manuel", me dice, "nadie me ha hecho eso". Desde ahí fuimos amigos. Cuando yo tenía problemas con el almacén, él estaba. Cuando él tuvo un accidente, yo cuidé su casa. Eso es amistad de verdad. Murió hace unos años. Lo echo de menos.

**Biógrafo** `[M3.7 + AY1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Narrador** `[AY1]`: En 2001, con la crisis, necesitaba plata para no perder el almacén. Un vecino mío, Don Alberto, que tenía una casa al lado, me presentó a un tipo que prestaba plata. Don Alberto hasta salió de avalista. Cuando le dije que cómo le pagaba eso, él me dijo "Manuel, todos necesitamos en algún momento". Pasó la crisis, pagué la deuda con el prestamista, y después le dije a Don Alberto que quería devolverle algo. Él no quería. "Vos trabajaste honestamente para salir adelante", me dijo. Años después, cuando su nieta quería un lugar para arrendar, yo le ayudé a conseguir uno que conocía. No era lo mismo que lo que él hizo, pero fue lo que pude.

**Biógrafo** `[M3.8 + AS9]`:
> Escuchado. Vamos por la siguiente.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Narrador** `[AS9]`: Rosa primero. Ella es todo. Pablo y Lucía, por supuesto. Tomás, el nieto. Don Alberto, porque me salvó en la crisis. Si Carmelo estuviera vivo, estaría en la mesa. Mi amigo Pepe, que se fue a España pero cuando vuelve nos sentamos. Y tal vez dejaría una silla vacía, por mi padre. Porque aunque no está, forma parte de quien soy. Eso es mi gente. Los que trabajaron conmigo, los que estuvieron cuando lo necesitaba. Los que vieron crecer al almacén. La familia.

**Biógrafo** `[M26 + CI10]`:
> Gracias, Manuel.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquilo.

**Narrador** `[CI10]`: No, creo que están los principales. Algunas personas vienen y van, pero esos son los que quedaron.

## Bloque 11 · Pérdidas y momentos difíciles

**Biógrafo** `[M24.3 + AV11]`:
> Bien, Manuel. Lo sumo a lo que ya me contaste de eso.
>
> Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás.

**Biógrafo** `[PE1 + M1]`:
> ¿Perdiste a alguien importante en tu vida? Si querés, contame quiénes fueron, qué eran para vos y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE1]`: Paso. De eso no hablo.

**Biógrafo** `[M25.1 + PE5 + M1]`:
> Bien, seguimos.
>
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE5]`: Nada grave. Presión alta de vez en cuando, lo normal para la edad. Me cuido. Rosa me obliga a comer bien, a no trabajar tanto. Por ahora anda bien.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE4]`: 2001 ya lo conté. Eso fue lo más duro del negocio. Pero hay otras cosas. Asuntos de familia que prefiero no tocar. Con mi hermano José hubo... bueno, eso me lo guardo. Ya viejo, uno no tiene ánimo de revolver eso.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI11]`:
> Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.

**Narrador** `[CI11]`: No, creo que dijimos lo importante. La vida tiene sus momentos duros y uno los pasa. Punto.

## Bloque 12 · La historia grande

**Biógrafo** `[M24.4 + EN12]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.

**Biógrafo** `[HG1]`:
> Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día.

**Narrador** `[HG1]`: El mundial 78, en Argentina. Yo estaba recién casado con Rosa, viviendo en Villa Crespo. Todo Buenos Aires era loco con el fútbol. Argentina ganaba, y la gente salía a la calle a gritar. Yo no era un fanático, pero te agarraba la onda. Rosa y yo mirábamos en una casa con vecinos, en la tele. Cuando Argentina ganó el campeonato, la gente en las calles gritaba como locos. Fue un día de fiesta total. Pasó que la gente se olvidaba de los problemas que había en el país en esa época, la dictadura, la inseguridad. Un día todos eran iguales en la calle, gritando "somos campeones". Fue raro. Lindo, pero raro.

**Biógrafo** `[M3.2 + HG4]`:
> Te escuché. Vamos con la que sigue.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado.

**Narrador** `[HG4]`: Un día en el confinamiento, debe haber sido mayo del 2020. Pasábamos el tiempo en casa, Rosa y yo. No podías salir. Yo estaba acostumbrado a caminar al almacén todos los días, así que eso fue difícil. Ese día, me desperté temprano por costumbre, aunque no tenía a dónde ir. Rosa estaba asustada por el virus, no quería que saliera ni a la farmacia. Pasamos toda la mañana juntos, mirando por la ventana. Después Pablo me llamó para saber si estábamos bien. Tomás estaba en la casa de ellos. Dijo que no podía venir a visitarnos. Eso fue lo que más me dolió ese día. Estar encerrado, no poder ver al nieto. La casa se sentía grande y chica al mismo tiempo.

**Biógrafo** `[M3.3 + DE1]`:
> Anotado. Sigo con otra.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Narrador** `[DE1]`: Vivir con Rosa antes de casarnos. En Galicia, en mi casa, mi madre se habría horrorizado. Aquí en Buenos Aires también estaba mal visto. Pero nosotros lo hicimos de todas formas. Algunos vecinos no saludaban a Rosa. Yo no le importaba. Eso era entre nosotros. Hoy nadie dice nada. El mundo cambió para eso está bien.

**Biógrafo** `[M3.4 + FI7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Narrador** `[FI7]`: Eso me lo guardo. Viví tiempos difíciles de política acá en Argentina, pero no quiero hablar de eso. Prefiero pensar en mi trabajo, en mi familia. La política divide mucho.

**Biógrafo** `[M26 + CI12]`:
> Gracias, Manuel.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.

**Narrador** `[CI12]`: No, están los principales. El mundial, la pandemia. Lo demás es vivirlo y ya.

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M25.2 + EN13]`:
> Bien, seguimos.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó.

**Narrador** `[GI1]`: El día que llegué a Buenos Aires. Bajar del barco en La Boca, viendo la ciudad por primera vez, con mi valija en la mano, asustado y emocionado al mismo tiempo. Mi tío me esperaba en el puerto. Vimos la ciudad, enorme, con gente que no conocía, idiomas que no entendía bien. Caminamos por las calles, y mi tío me decía "mirá Manuel, acá hay de todo, acá la gente viene de todas partes". Ese día sentí que podía empezar de nuevo. Que la aldea estaba lejos, pero que todo era posible. Si pudiera vivirlo de nuevo lo haría, pero con lo que sé ahora. Sin el miedo, disfrutando más. Porque resultó bien.

**Biógrafo** `[M3.6 + GI2]`:
> Lo tengo. Vamos con otra.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó.

**Narrador** `[GI2]`: El día que Rosa me dijo que estaba embarazada de Pablo. Fue un martes, ella se lo decía mientras cenábamos. Yo no esperaba, habíamos hablado de esperar un tiempo, de primero establecernos. Le puse una cara... no sé. Rosa se asustó, pensó que me enojaba. Pero no. Era que de repente la vida se volvía enorme. Dejé la cuchara, la miré, y entendí que nada volvería a ser igual. Que ya no era solo yo y Rosa. Que iba a ser papá. Eso me aterró y me alegró al mismo tiempo. Esa noche no dormí. Pensé en todo. En el dinero, en cómo íbamos a hacerlo, en qué clase de papá sería. El día siguiente desperté distinto. Con otro peso, pero también con otro propósito.

**Biógrafo** `[M3.7 + HJ1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Narrador** `[HJ1]`: Quería tener una casa en Galicia. Volverme ahí cuando estuviera viejo. No para vivir siempre, pero para pasar tiempo. La aldea, la casa de mi infancia. Ahorré para eso, pensé en comprarlo, restaurarlo. Pero la crisis de 2001 consumió los ahorros. Y después, cuando pude nuevamente, estaba mayor, cansado. Rosa no quería volver a Galicia, ella es porteña. Los hijos tampoco. Me quedé la idea, pero pasó. Hoy es tarde. Extraño la aldea, pero aquí está mi vida, mi gente, mi familia.

**Biógrafo** `[M3.8 + GI9]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquito frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor.

**Narrador** `[GI9]`: Una noche, cuando estaba de novio con Rosa, fuimos a la zona norte, a Bariloche. Era enero, verano. La noche estaba clara, sin nubes. Miramos las estrellas sentados en una piedra. Rosa estaba callada. Yo sentí que la ciudad, Buenos Aires, toda mi preocupación por el trabajo, era nada comparado con eso. Con todas esas estrellas. Ese momento me hizo entender que hay cosas que no controlamos. Que la vida es más grande que yo. Rosa me agarró la mano. No dijimos nada. Solo miramos.

**Biógrafo** `[M3.1 + FI1]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos mismo? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Narrador** `[FI1]`: No me gusta la soledad. De chico en la aldea no estaba solo, siempre había gente. Acá, después de cerrar el almacén, hay momentos que siento la soledad. Rosa me mantiene ocupado, los hijos llaman. Pero hay tardes donde no pasa nada. Me siento en el patio, escucho música, y está la soledad. No está mal, supongo. Te deja pensar. Pero prefiero estar con gente.

**Biógrafo** `[M3.2 + FI2]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Narrador** `[FI2]`: Hace poco, un cliente del almacén, un nene que yo viera crecer, viene con su hijo de la mano. Él debe tener treinta y algo, el nene cinco años. El tipo me dice "Don Manuel, mirá mi hijo". Ese "Don" me pegó. Nunca me había dicho eso. Siempre fue Manuel. De repente estoy viejo. Estoy siendo abuelo, y otros están siendo padres. El tiempo pasó sin que lo vea venir.

**Biógrafo** `[M3.3 + FI3]`:
> Anotado. Sigo con otra.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Narrador** `[FI3]`: La disciplina del trabajo. Mi padre era así, se levantaba a la misma hora, trabajaba sin quejarse. Yo heredé eso. Treinta años en el almacén fue lo mismo. Levantarme, ir, atender. La responsabilidad. Mi madre me enseñó a cuidar a la gente, a ver si los demás estaban bien. Los hijos vieron eso en mí. Un día Pablo me dice "papá, vos enseñaste que el trabajo es importante", y me doy cuenta que él lo aprendió. Eso viene de mi padre, pasó a mí, pasó a mis hijos. Es como una cadena.

**Biógrafo** `[M3.4 + FI4]`:
> Gracias por contármelo. Seguimos.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Narrador** `[FI4]`: No, no me importa mucho. Cuando vivíamos con Rosa antes de casarnos, algunos vecinos nos juzgaban. A mí me valía. Mientras Rosa y yo estuviéramos bien, el resto no importaba. En el almacén, algunos clientes me criticaban porque no les daba crédito indefinido, porque cobraba bien. "Manuel es un tacaño", decían. Yo sabía que si no cobraba, desaparecía el negocio. No me importaba lo que pensaran. He vivido la vida como pensé que debía vivirla, y eso es lo importante.

**Biógrafo** `[M3.5 + FI6]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Narrador** `[FI6]`: No sé. Espero que sea mejor. Que haya menos guerra, menos gente peleando. Lo que me gustaría que no se pierda es la familia, la gente reunida, comiendo juntos. En estas épocas se pierde eso, todo es teléfono, internet. Los valores de trabajar honestamente, de cuidar a los que amás. Eso. Tomás, dentro de cien años será viejo, o no estará. Pero espero que sus hijos sepan que hubo un abuelo que trabajó todos los días, que amó a su familia. Eso no se tiene que perder.

**Biógrafo** `[M26 + CI13]`:
> Gracias, Manuel.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquilo.

**Narrador** `[CI13]`: No, creo que conté bastante. La infancia, la emigración, la familia, el trabajo. Está todo.

## Bloque 14 · Hoy

**Biógrafo** `[M24.1 + EN14]`:
> Gracias, Manuel. Eso también va al libro.
>
> Dejamos el pasado un rato y venimos a hoy: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Narrador** `[HO1]`: Me levanto alrededor de las seis, por costumbre. Rosa ya está en la cocina. Tomamos mate juntos, sin hablar mucho, mirando por la ventana. Desayunamos. Si es fin de semana, vamos al barrio a caminar, a la panadería que conocemos de toda la vida. Si es entre semana, me quedo en casa. Leo el diario, escucho un poco de música. Almuerzo con Rosa, casi siempre lo que ella cocina. Después, una siesta corta. A la tarde, a veces Pablo llama, a veces viene con Tomás. Cuando viene el nene, jugamos un rato. Si no, me quedo leyendo o escuchando. A la noche, miramos tele con Rosa. Cenamos algo ligero. Antes de acostarme, pienso en el día, en la vida. Me duermo tranquilo.

**Biógrafo** `[M3.7 + HO2]`:
> Listo, quedó guardado. Sigo.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado.

**Narrador** `[HO2]`: Tomás hace poco. Vino con Pablo, tenía el uniforme del colegio. Se le cayó un zapatito, se lo recogí yo. Él se lo puso y empezó a caminar como si fuera grande, como papá. Rosa estaba mirando, se largó a reír. Yo también. El nene no entendía qué era tan gracioso. Eso me hizo reír con ganas. Las cosas simples, vos. Un nene caminando como adulto. Eso es lo que me gusta ahora.

**Biógrafo** `[M3.8 + HO5]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Narrador** `[HO5]`: La paz. No tener que levantarme pensando en si vendo lo suficiente, si hay dinero para pagar, si el banco va a llamar. Eso fue treinta años. Ahora no. Ahora simplemente es estar con Rosa, ver a los hijos, jugar con Tomás. El otro día estábamos Rosa y yo sentados en la vereda, tomando mate, sin hacer nada. Un domingo tranquilo. Ella me agarró la mano, sin decir nada. Eso es lo que me gusta ahora. La paz. Poder estar vivo, con salud, con la gente que amo. Eso es enorme.

**Biógrafo** `[M3.1 + CO1]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Narrador** `[CO1]`: El pulpo a la gallega. Me lo enseñó mi madre, en la aldea. Agua hirviendo con sal, el pulpo adentro, después lo cortás, le ponés aceite de oliva, paprika, sal fina. Simple. Los hijos me lo piden. Lucía especialmente. Hace poco hizo un cumpleaños de colegas en la casa, le dije que cocinaba. Hice el pulpo. Cuando probaron todos dijeron "está delicioso, ¿dónde lo compraste?" Le conté a Lucía "le dije que en Galicia, hace sesenta años". Se rió. Ese plato es de allá, de mi madre, de mi infancia. Cuando lo cocino, es como si ella estuviera.

**Biógrafo** `[M3.2 + HO9]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Narrador** `[HO9]`: Vivo en Villa Crespo, en la misma zona donde estuvo el almacén. Compramos la casa hace treinta años, cuando el almacén ya funcionaba. Es una casa de dos plantas, pintada de blanco. Tiene un patio chiquito, donde meto plantitas que Rosa cuida. El barrio cambió mucho, ahora es más joven, hay restaurantes, bares. Pero los que conocemos de siempre seguimos. El otro día, una vecina me dice "Manuel, ya casi no te veo pasar por la calle como antes". Tiene razón. Pasé treinta años caminando esa cuadra todos los días, abriendo el almacén, cerrándolo. Ahora paso menos. La casa es tranquila, lo que necesito a esta edad.

**Biógrafo** `[M26 + CI14]`:
> Gracias, Manuel.
>
> Con esto cerramos lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquilo.

**Narrador** `[CI14]`: No, creo que la mayoría está. Los días tranquilos, la familia, Rosa. Es poco pero es mío.

## Bloque 15 · Legado y cierre

**Biógrafo** `[M24.2 + EN15]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ya estamos en la última parte, Manuel: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Narrador** `[LE1]`: Haber mantenido el almacén treinta años. Eso no fue fácil. Hubo crisis, momentos donde pensé que no podía. Pero lo logré. Eso prueba que un inmigrante gallego, sin mucha educación, pudo hacer algo. Segundo, mis hijos. Pablo es abogado, Lucía es maestra. Ellos en sus trabajos ayudan a la gente. Eso es lo que cuenta. Yo les enseñé a trabajar, a ser honestos. Tercero, que Rosa y yo seguimos juntos cuarenta y tantos años. Hay gente que no lo logra. Nosotros sí. Y Tomás. Que hay una nueva generación que va a seguir. Ese es el orgullo. Que dejé algo, aunque sea chiquito.

**Biógrafo** `[M3.4 + LE2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos mismo descifraste viviendo.

**Narrador** `[LE2]`: Que el trabajo honesto es lo que vale. Que no hay atajos. Que la familia es lo más importante, porque el dinero se va, la salud se va, pero la familia queda. Que haya que tomar riesgos a veces, pero con cuidado, sabiendo qué se pierde si falla. Que la paciencia es importante. Que no hay que enojarse por lo que dice la gente. Que si amás a alguien, decíselo. No esperes. Que los momentos pasan, y después te arrepentís. Mi consejo a Tomás, cuando crezca, es que disfrute lo que haga, pero que no olvide que alguien trabajó para que él tenga lo que tiene. Y que ame a su gente. Todo lo demás es secundario.

**Biógrafo** `[M3.5 + FU1]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Narrador** `[FU1]`: Ver a Tomás grande. Verlo que termine la escuela, que tenga su vida. Eso me gustaría. Estar ahí para él, aunque sea viejo. Compartir cosas con él. Quizás llevarlo a Galicia algún día, mostrarle donde nació su abuelo. Que sepa de dónde viene. Que entienda que su nombre es Tomás Otero, que viene de una familia de trabajadores. Eso me gustaría hacer antes de irme.

**Biógrafo** `[M3.6 + LE7]`:
> Lo tengo. Vamos con otra.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Narrador** `[LE7]`: "El que se fue sin saber si volvía". Porque eso fue, vos. Un chico que se fue de la aldea sin saber si algún día volvería, sin saber qué le esperaba. Y construyó una vida. No fue fácil, pero fue suya.

**Biógrafo** `[M3.7 + M15]`:
> Listo, quedó guardado. Sigo.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> Papá, ¿qué llevabas en la valija cuando bajaste del barco? Lucía

**Narrador** `[FAM1]`: Lucía, mi amor. En esa valija llevaba ropa, poco. Un traje que mi padre me había comprado. Unos zapatos. Fotos de la familia, de vos ni existías todavía. Cartas que mi madre me escribió para que las leyera en el viaje, porque ella sabía que iba a estar solo, asustado. Dinero que mis viejos juntaron durante meses. Un rosario que me bendijo el cura del pueblo. Y llevaba miedo. Mucho miedo. Pero llevaba también esperanza, la ilusión de que en Buenos Aires podría ser alguien. Que podría construir algo. Cuando bajé del barco en La Boca, esa valija pesaba como una montaña. Hoy, viéndote a ti, a tu hermano, a Tomás, pienso que esa valija valió la pena. Que todo lo que cargué para acá, para que ustedes estén bien, fue lo correcto.

**Biógrafo** `[M3.8 + FO1]`:
> Escuchado. Vamos por la siguiente.
>
> Otra cosa, Manuel. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés a mano, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Y si no encontrás ninguna, no pasa nada: el libro va igual.

**Narrador** `[FO1]`: Tengo una de hace años, cuando abrimos el almacén. Es 1990. Estamos Rosa y yo adentro, con el local medio vacío, pero limpio. Ella está con un brazo mío, y yo estoy sonriendo pero se ve que estoy nervioso. En la pared se ve parte del letrero que acabábamos de poner. Es una foto que mi hermana me sacó con una cámara que alguien le prestó. La tengo en un cajón, un poco amarilla por el tiempo. Esa foto es importante porque muestra el momento en que empezó todo. Donde nuestro esfuerzo empezaba a tomar forma. Te la mando ahora, espera.

**Biógrafo** `[M26 + LE9]`:
> Gracias, Manuel.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Narrador** `[LE9]`: Quiero que quede claro que yo no soy un héroe. Que no hice nada grande. Que simplemente viví, trabajé, amé a mi familia, y aquí estoy. Que la gente como yo, la gente normal, también tiene historias que contar. No es fácil siempre, pero se puede. Si hay alguien que lee esto y se siente pequeño, que sepa que yo también lo fui. Y aquí estoy.

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Narrador** `[LE8]`: A Rosa: gracias. Gracias por estar todos estos años. Por creer en el almacén cuando yo no creía. Por aguantarme los días malos. Por hacer que todo sea posible. Te amo, aunque no te lo diga todos los días. A Pablo y Lucía: se que les pedí mucho. Que trabajara, que estudiara, que se portara bien. Pero lo hicieron. Y ahora veo que ustedes ayudan a otros, que tienen sus vidas en orden. Eso es lo que quería. Que sean mejores que yo. Que logren cosas que yo no pude. Tomás, mi amor, cuando crezcas y leas esto, quiero que sepas que tu abuelo trabajó todos los días para que vos puedas ir a la escuela, para que no tengas hambre, para que seas libre. Que tengas la vida que yo no tuve. Y a todos: no olviden de dónde vienen. De una aldea en Galicia, de una familia de trabajadores. Eso está en la sangre. Cuidénse, quiéranse. Es lo único que importa.

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Manuel. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre, y es bien tuyo. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Fue un gusto enorme escucharte.
