# Simulación 4: la de muchas parejas (Chela, 71, inventada)

**Qué es:** la entrevista de un narrador **inventado** (Chela), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Plan: [`PLAN.md`](PLAN.md).

**Cuenta:** 91 preguntas del banco contestadas + 1 de la familia · **130 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas van juntas en ese mensaje); **Narrador** es lo que contestó. Los títulos de bloque y los IDs (entre corchetes) son para el equipo: el narrador no los ve.

**Biógrafo** `[BIEN]`:
> Hola, Chela, ¿cómo estás? Una persona que te quiere mucho te regaló un libro con la historia de tu vida, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.
>
> Funciona así: te mando una pregunta y vos me la contás en audio, como si me lo estuvieras contando en persona. Mandame todos los audios que quieras. Cuando termines, ya está: con un ratito de silencio, la pregunta que sigue te llega sola.
>
> Si alguna pregunta no tiene que ver con tu vida, me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro: esto lo hacemos al ritmo que vos quieras.

## Bloque 1 · Origen y raíces

**Biógrafo** `[OR1 + M1]`:
> Empecemos por cuando llegaste al mundo, según te contaron. No el día en sí, sino la época: dónde vivían, en qué andaban tu mamá y tu papá, cómo te esperaban. ¿Qué sabés de cómo era la vida de ellos en ese entonces? Contame.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR1]`: Bueno, mirá, nadie me cuenta esto de "cómo llegué" sin que sea una anécdota de humor. Mi papá, don Miguel, era viñatero en Mendoza, tenía sus vides, era un laburo bravo eso. Mi mamá, Margarita, era modista, cosía de todo para afuera, tenía un taller en la casa casi. Cuando me nací, en 1955, un poco antes habían llegado mis tres hermanos, así que cuando yo llegué era la reina del hogar para todos. Mi papá, que era medio machista como todos los de esa época, creo que quería un varón más, ¿viste?, pero bueno, me tocó ser la hembra de la casa. Mi mamá estaba feliz porque podía vestirme con sus manos, con sus diseños, hacerme modelito a mí. Los hermanos, Miguel, Carlos y Fernando, se reían de mí porque era la consentida. La vida era simple, Mendoza es lindo, el vino está ahí nomás, el sol todo el tiempo, mis papás trabajaban mucho. Eso es lo que me contaban, porque obvio yo no me acuerdo de ser bebé.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Chela. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR2]`: Ay, sí, eso sí me lo contaban siempre en la mesa. Mi abuela, la mamá de mi papá, vino de Italia con el abuelo, con dos valijas nomás. Los que hablaban de viñas en Italia eran gente de plata, pero mis abuelos eran pobres, así que se vinieron a probar suerte a Mendoza porque habían escuchado que acá el vino era un negocio. El abuelo empezó de peón en las viñas ajenas, trabajaba como loco en el sol, y la abuela cocía ropa para la gente. Después de años consiguieron una parcela pequeñita y ahí empezó mi papá desde chico, trabajando con el viejo. Mi abuela siempre decía en las sobremesas "ustedes no saben lo que fue llegar sin nada", y nosotros la escuchábamos como si fuera una película. Cuando murió mi abuelo, creo que fue en los sesenta, ella se quedó en la casa de las vides, y mi papá siguió con el negocio. Es raro porque nunca la vi realmente cocinando, pero sus historias se quedaban ahí, en la mesa, con nosotros comiendo.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR5]`: Eso me lo contaba mi mamá con unos ojos que se le iluminaban toda. Ella estaba cosiendo en el taller, para las señoras de Mendoza, arreglaba trajes, hacia vestidos, y mi papá pasaba una tarde por la casa de una prima que vivía enfrente, casi casi. Se lo cruzó en la puerta y empezó a charlar de nada, así nomás, como se hacía antes. Mi mamá dice que él entró al taller a "ver si podía arreglar un pantalón", pero después se supo que fue a verla a ella de nuevo. Se vieron como tres o cuatro tardes, así hablando mientras ella trabajaba con la máquina, y después él le propuso ir al cine en Mendoza. Iban a ver películas así, sin decirle mucho a la familia, que era más estricto todo. Lo que me mata es que mi papá era medio tímido en realidad, no como te lo imaginas después. Una vez mi mamá dijo que él se estaba muriendo de nervios el primer día que la besó, que casi se cae de un banco en la plaza. Se casaron, no sé si uno, dos años después, fue bastante rápido. La química les gustaba, supongo.

**Biógrafo** `[M26 + CI1]`:
> Gracias, Chela.
>
> Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora.

**Narrador** `[CI1]`: Ay, mirá, hay una que siempre me acuerdo. Mis hermanos mayores, cuando éramos chicos, armaban un quilombo terrible en la casa, ¿viste?, y mi papá nos llevaba a todos a la viña para que vieran cómo se trabajaba. Yo tenía unos cinco, seis años, y me subían a caballo con mi papá, ¡con caballo! Eso no se olvida. Mis hermanos más grandes iban tocando las vides, aprendiendo dónde hay que cortar, y yo nomás iba viendo el paisaje, los cerros de Mendoza al fondo. Mi mamá no iba mucho porque estaba en el taller, pero mi papá era el que nos unía a todos ahí. Recuerdo el calor, el polvo, mi papá canjeando botellas viejas con otros viñateros, bueno, eso sería más después cuando entendía mejor. Pero eso de la viña, el caballo, es lo primero que veo cuando cierro los ojos de mi infancia.

## Bloque 2 · La casa y la familia de la infancia

**Biógrafo** `[M24.1 + EN2]`:
> Gracias, Chela. Eso también va al libro.
>
> Ahora vamos a tu infancia: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Narrador** `[CA1]`: Ay, mi primer recuerdo, ay, sí. Estoy en la cocina con mi mamá, ella está planchando con una plancha grande de hierro, vieja, la calentaba en la hornalla. Yo tendría tres años, capaz cuatro. Estaba jugando con unos frascos de costura, botones de todos los colores, ¿viste?, y mi mamá me dice "Chela, andá a jugar al patio, no me molestes". Yo salgo corriendo, y afuera hay una higuera gigante, enorme, con los higos maduros, y mis hermanos estaban ahí subidos trepando la rama más baja. Me quería subir yo también, pero era chiquita, así que me quedé abajo agarrando los que caían. El sol era terrible, todo era verde, polvoso. Eso es lo primero, después todo se mezcla.

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chica. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Narrador** `[CA2]`: Mi mamá era amorosa, pero también era de las que te decían las cosas así nomás, sin filtro. Me acuerdo de que un día llegué a casa con un vestido roto, me lo había roto jugando con los chicos, ¿viste?, y ella me vio y en vez de enojarse me llevó al taller. Sacó un retazo de tela de color, creo que azul, y me dijo "mirá lo que te voy a hacer". Me cosió un parche que parecía un corazón, bien hecho, con la máquina de coser que manejaba como si fuera una varita mágica. Después me lo arreglaba todo, los vestidos, los delantales de la escuela. Ella me quería un montón, pero también me decía, así medio en broma, "vos sos mi muñequita bonita, pero cuidado que se te caen los botones si no te portas". Tenía humor para todo. A mis hermanos los quería igual, pero conmigo era distinto, porque podía peinarme, vestirme como a ella le gustaba. No sé, eso que una mamá hace, ¿viste?, cuando sos la única hija.

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Chela. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chica? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Narrador** `[CA3]`: Ay, mi papá era viñatero, eso ya te conté, ¿no? Pero lo de verlo trabajar era cosa seria. Me lo llevaba a veces a la viña, en el taller que tenía cerca, y había un montón de cosas pasando ahí. Él estaba siempre con los peones, hablaba con ellos, pero de una manera que parecía que estaba estudiando las vides, observando. Yo lo veía checando las ramas, tocando la tierra, hablando de cuándo era el momento para podar. Un día me subió a sus hombros y me dijo "mirá, Chela, ves esa rama de ahí, esa es la que da la mejor uva, la que tiene más sol". Yo no entendía nada, pero él estaba fascinado, así que yo también lo estaba. Después llegaba a casa cansado, sucio de tierra, se lavaba las manos en el balde y se dormía. Mi mamá lo cargaba, "mirá el famoso viñatero, durmiendo como un bebé en el sillón". Pero él se quería más que nada en el mundo, eso se veía.

**Biógrafo** `[M3.6 + CA6 + M1]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste hermanos? Si tuviste, ¿con cuál eras más cercana de chica? Contame alguna aventura que hayan hecho juntos; seguro tienen varias.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[CA6]`: Ay sí, tenía tres hermanos, Miguel el mayor, después Carlos, y Fernando el que me llevaba menos años. Era más cercana a Fernando porque era el más chico después de mí, así que andábamos juntos todo el tiempo. Un día, no sé, tendría como ocho años, nos fuimos a escondidas al pueblo con Fernando, que tendría seis, para ir a la plaza. Nos dijimos que íbamos a recoger higos, pero mentíamos, queríamos ver si podíamos comprar unos caramelos que había en la almacén de don Julio. Fernando metió la mano en el bolsillo de mi papá y sacó unas monedas, así nomás, y nos fuimos corriendo como locos. Compramos caramelos, nos los comimos en la plaza, y después cuando llegamos a casa nos pegaban una paliza los dos. Pero Fernando me protegía, así que la mía fue un poco menor porque él decía que había sido idea de él. Él era un genio, Fernando, siempre protegiéndome. Después se hizo peón de viña también, como mi papá, pero esa complicidad que teníamos de chicos nunca se fue.

**Biógrafo** `[M3.7 + CA16]`:
> Listo, quedó guardado. Sigo.
>
> Contame un día de chica que esperabas con muchas ganas: qué era, quién estaba, qué pasó.

**Narrador** `[CA16]`: Ay, mi cumpleaños. Yo esperaba mi cumpleaños como si fuera el fin del mundo. Mi mamá me hacía un vestido nuevo siempre, y mi papá metía la mano en los ahorros para traer cosas. Un año, creo que cumplía diez, llegó mi prima de Buenos Aires, la hermana de mi papá, que vivía en la capital y era como una reina para nosotros. Ella vino con un regalo, una muñeca grande que no se veía en Mendoza, y yo casi me muero del entusiasmo. Toda la familia se sentaba en el patio, comíamos cosas que mi mamá preparaba especial, empanadas, postres. Mi papá brindaba conmigo aunque fuera chica, en broma. Ese día era mío, ¿viste?, de una manera que no era mío el resto del año. Estaban todos, estaban juntos, mi mamá estaba feliz viéndome contenta, mis hermanos no me molestaban. Eso era lo que esperaba, esos días donde la familia paraba todo para celebrarse conmigo. Eso no vuelve igual después.

**Biógrafo** `[M3.8 + CA17]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[CA17]`: Mirá, eso fue cuando tenía como doce años. Mi abuela, la mamá de mi papá, se enfermó. Fue rápido, muy rápido. Ella estaba en la casa de la viña, donde vivía sola, y un día mi papá volvió del trabajo y la encontró en el piso. La llevaron al hospital, pero no sé, los doctores dijeron que era algo en el corazón. Yo no entendía mucho, pero mi mamá lloraba, y mi papá no era él. Fuimos al hospital una vez, me acuerdo de mi abuela en la cama con la cara blanca, y ella me agarró la mano y me dijo algo que no recuerdo bien, pero sentí que era importante. Murió una semana después. Eso fue lo primero que vi así, la muerte de cerca. Mi papá se hundió un poco por un tiempo, no hablaba mucho, estaba en el patio solo mirando las vides. Mi mamá lo cuidaba, pero era como si un pedazo de la familia se hubiera ido. Fue raro porque yo tenía a mis hermanos, tenía a mis papás, pero sentía que algo faltaba. Eso me marcó, la idea de que la gente se va, así nomás.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Chela. Queda guardado con cuidado.

**Biógrafo** `[CI2]`:
> Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquila, que hay tiempo.

**Narrador** `[CI2]`: Ay, sí, una boluda. Estaba pensando en la escuela, en cómo mis hermanos iban a la misma escuela que yo, pero en otros grados, así que iba como la hermana menor, ¿viste? A veces me protegían, a veces me querían matar por andar detrás de ellos. Había un chiquito que me molestaba, que me quería pegar, y mis hermanos se enteraron y fueron y lo agarraron mal. No fue nada grave, pero después ningún chico se metía conmigo en la escuela. Eso es raro, ser niña con hermanos mayores, porque estás sola pero no estás sola, ¿entendés? Tenés protección sin pedirla casi.

## Bloque 3 · La escuela y los juegos

**Biógrafo** `[M24.2 + EN3]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad.

**Biógrafo** `[ES1]`:
> ¿Cómo fue tu primer día de escuela? ¿Quién te llevó hasta la puerta, y qué sentiste cuando se fue? Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria.

**Narrador** `[ES1]`: Ay, me acuerdo. Fue mi mamá la que me llevó, tempranito, el sol estaba saliendo. Ella me había hecho un delantal blanco nuevo con un moño en la espalda, y yo estaba nerviosa, no sé por qué, si nunca había ido a un lugar tan raro. Ella me tomaba la mano, y cuando llegamos a la puerta de la escuela me pidió que entrara sola, que la maestra estaba ahí. Yo voltié a mirarla, y veo a mi mamá que se va, así nomás, sin mirar para atrás, y yo sentí que se me caía el mundo. Empecé a llorar, claro, me querían soltar de otro lado, una maestra me agarraba, y mi mamá ya se iba por la calle. Duró poco, creo, porque después los otros chicos me mostraban dónde sentarme, pero eso de verla partir fue lo que más me quedó. Después cuando pasaban los días me encantaba ir, tenía una maestra que me quería un montón, la señorita Rosa, que me enseñaba a leer, y me sentía importante. Pero esos primeros días fueron de miedo.

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Chela. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Narrador** `[ES2]`: La señorita Rosa, esa que te dije. Ella era joven, debía tener veinticinco, treinta años, y nos enseñaba como si fuéramos sus amigos. Un día, teníamos que leer en voz alta, y yo me equivoqué en una palabra, no sé qué palabra era, pero me puse colorada. Los otros chicos se rieron, y yo casi me muero. La señorita Rosa levantó la mano, pidió silencio, y me dijo "Chela, leé de nuevo, pero esta vez piensa en lo que estás leyendo, no en si te equivocás". Yo leí de nuevo, me volví a equivocar en la maldita palabra, pero esta vez no lloré. La señorita Rosa sonrió, y después en el recreo me llevó aparte, me enseñó bien la palabra, me explicó de dónde venía. Desde ese momento yo la amaba. Ella también enseñaba teatro, así que después empecé a ir a esas clases, a recitar, a meterme en los actos de la escuela. Creo que por eso después me fui a Buenos Aires a estudiar teatro, la señorita Rosa plantó esa semilla. La vi después de años, cuando volvía a Mendoza, y ella se acordaba de mí.

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chica, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Narrador** `[ES5]`: Ay sí, Marisa. Marisa vivía dos casas de la mía, y nos conocimos en la escuela, primer grado casi. Éramos inseparables, todo el tiempo juntas. Después de la escuela nos íbamos a la casa de ella, que su mamá nos daba leche con galletas, y nos metíamos en el patio a jugar a las casitas. Marisa era hija única, así que tenía un montón de cosas, juguetes que yo no tenía. Nos hacíamos casas con mantas, sábanas, y nos pasábamos horas ahí contando historias, inventando vidas para las muñecas. Ella era callada, pero cuando estábamos juntas era como si ella tuviera un montón de cosas para decir. Después crecimos, empezaron los adolescentes, los chicos, y Marisa se fue enamorando de un chico del barrio, y yo empecé a estar más en la casa con la señorita Rosa en las clases de teatro, así que nos alejamos un poco. Pero hay una tarde que no me olvido, teníamos como trece años, y Marisa vino a mi casa llorando porque ese chico le había roto el corazón, y nosotras nos abrazamos en la cama, sin hablar casi, y con eso fue suficiente. Ella se mudó después a otro lado, y perdimos contacto.

**Biógrafo** `[M3.3 + ES6]`:
> Anotado. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chica, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Narrador** `[ES6]`: Ay, eso. Bueno, la de los caramelos ya te la conté con Fernando. Pero hay una que es bien boluda. Estábamos en la escuela, tendría como once años, y habíamos descubierto que la maestra de lengua, la señorita Marta, que era medio amargada, le daba miedo una cosa: las ratas. Yo no sé cómo nos enteramos, pero nos enteramos. Entonces, un chico de la clase, Pablo, que era un pelotudo, metió una rata viva en una caja de cartón que dejó en el escritorio de la maestra, debajo de unos papeles. Cuando ella fue a agarrar un papel, la rata salió corriendo, y ella gritó que casi la mata. Gritó que casi la mata, en serio. Todo el mundo se reía, la directora vino, armó un quilombo. A nosotros nos metieron los dedos en la boca de puro miedo de que nos castiguen. Nunca supieron quién fue porque Pablo se hizo pasar por un ángel, y a mí no me culparon porque era "la buena de la clase". Eso me dolió un poco, porque yo sí lo sabía, y me quedé callada. Pero era una pelotudez, la maestra después bromeaba sobre eso.

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Narrador** `[ES7]`: Actriz. Quería ser actriz, directa. Fue por la señorita Rosa, como te dije, ella me metía en los actos de la escuela, me daba papeles para recitar. Después empecé a ver películas en el cine de Mendoza, películas argentinas, y veía a las actrices en la pantalla y me morí. Quería ser eso, estar en la pantalla, que la gente me mirara. Tenía como catorce, quince años, y empecé a ir a un grupo de teatro que había en el pueblo, que ensayaban en una iglesia vieja. Era de lo más loco, gente mayor, gente joven, todos haciendo teatro. A veces tocaba el rol de la abuela, a veces el de la chica joven. Yo me sentía viva ahí, en serio. Mi mamá me apoyaba, mi papá decía que era una locura, que no había futuro, pero yo quería irme a Buenos Aires, donde estaba todo la acción. A los diecinueve finalmente me fui.

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Chela. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chica? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Narrador** `[ES9]`: Sí, bastante. Mi mamá era católica, practicante. Íbamos a misa los domingos cuando podíamos, aunque mi papá era medio de los que iban a Navidad nomás. Me hizo hacer la Primera Comunión, a los ocho años creo fue. Mi mamá me hizo un vestido blanco hermoso, de esos de novia de chica, con un moño atrás, todo bordado por ella. Me acuerdo de estar en la iglesia, nerviosa, con el velo y la cartera blanca, y mis hermanos se reían porque estaba tan formal. Fue un día de familia, después vinimos a casa, mi papá invitó a unos amigos, comimos y comimos. Mi abuela estaba ahí, la que después se enfermó, y me regaló un crucifijo de plata que todavía tengo. Fue importante porque todos estaban juntos por mí, otra vez ese día era mío, ¿viste? Después la religión fue diluyéndose un poco, cuando crecí, pero esos días de pequeña iglesia, de misa, de sentir que eras especial porque estabas en lo de Dios, eran bonitos.

**Biógrafo** `[M26 + CI3]`:
> Gracias, Chela.
>
> Con esto cerramos tus años de escuela. Antes de seguir, ¿te quedó alguna historia de esa época dando vueltas, algo que no entró en ninguna pregunta? Contámela ahora, con calma, que la quiero escuchar.

**Narrador** `[CI3]`: Ay sí, una cosa. Cuando terminé la primaria, la última vez que vi a todos mis compañeros, la escuela hizo una despedida, una salida a un río que había cerca de Mendoza, el Río Mendoza. Fuimos todos los de sexto grado, con maestros. Me acuerdo de estar en el agua, de que alguien gritaba, y la señorita Rosa estaba sentada en la orilla viéndónos jugar. Marisa estaba conmigo, y bromeábamos sobre quién iba a la secundaria, si nos íbamos a ver. Fue un día feliz, pero también fue un día triste sin saberlo, porque sabía que las cosas iban a cambiar, que no íbamos a volver a estar todos ahí. Y no volvimos. La amistad se disolvió, la escuela se quedó atrás, y todos nos fuimos por caminos distintos.

## Bloque 4 · Adolescencia

**Biógrafo** `[M24.3 + EN4]`:
> Bien, Chela. Lo sumo a lo que ya me contaste de eso.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chica y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Narrador** `[AD2]`: Estaba en la secundaria, pero la verdad es que pasaba más tiempo en el grupo de teatro que en la escuela. Iba a clase, pero con un ojo puesto en el ensayo que tenía por la tarde. El grupo de teatro ocupaba una iglesia vieja que ya no usaban, y ahí nos juntábamos gente de todas las edades. Yo era la más chica en algunos momentos, pero me trataban como a una más. Un día recuerdo que estábamos ensayando una obra de Lorca, qué sé yo, algo dramático, y yo hacía de una chica que se muere de amor, y todos aplaudían cuando terminaba. Eso era lo que yo necesitaba, que me viera como una persona seria, no como la nena de la casa que cosía con mamá. Mi papá me iba a buscar después del ensayo a veces, y me preguntaba cuándo iba a dejar eso de lado y concentrarme en la escuela. Pero yo sentía que la escuela no era nada, el teatro era todo. Tenía amigas en el grupo, chicas mayores que me enseñaban a moverme, a hablar, a sentir el personaje. Esos fueron los mejores años en Mendoza, en serio.

**Biógrafo** `[M3.7 + AD3]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Narrador** `[AD3]`: Ay, sí. A esa edad la barra era el grupo de teatro, básicamente. Había un chico que se llamaba Carlitos que era el que dirigía todo, él tenía como veinticinco años, y éramos como sus discípulos. Salíamos después de los ensayos al bar que quedaba cerca de la iglesia, uno medio destartalado, pero que nos dejaba estar. Carlitos pedía vino para él, nosotros pedíamos refrescos o un café. Hablábamos de teatro, de actores que habíamos visto, de películas, de qué personaje queríamos hacer en la próxima obra. Una noche, recuerdo que teníamos como dieciséis, estábamos en el bar, y Carlitos nos dijo que iba a haber una gira, que una compañía de teatro iba a venir a Mendoza de Buenos Aires, y que podíamos ir a verla. Fue como si nos dijera que nos íbamos a la Luna. Fuimos todas, vimos la obra, que era moderna y loca, y después estuvimos hablando de eso toda la noche. Sentía que estaba viviendo una vida de verdad, que era parte de algo importante. Eso duró un tiempo, después el grupo se disolvió un poco, Carlitos se fue, pero esos años fueron mágicos.

**Biógrafo** `[M3.8 + AD5]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche.

**Narrador** `[AD5]`: Ay, la primera salida formal. Fue un baile que hacía un colegio en Mendoza, y mis hermanas del grupo de teatro me obligaron a ir. Tenía dieciséis años. Me puse el único vestido que tenía que era medio elegante, que me había hecho mi mamá, un vestido rojo oscuro, y me maquillé en secreto porque mi papá no dejaba. Fui con dos amigas, en colectivo. Cuando llegamos al lugar donde era el baile, sentí que me moría de miedo, porque había un montón de gente, música, chicos que uno no conocía. Pero después me largué a bailar, y fue como si el miedo desapareciera. Ese miedo de la gente, de lo que dirían, se esfumó cuando me empecé a mover. Un chico, no me acuerdo el nombre, me pidió que bailara con él, y yo bailé. Fue un baile lento, y él me apretaba un poco, y yo me sentía mujer por primera vez de verdad. No pasó nada importante, pero esa sensación de estar viva, de que los chicos te vieran, fue como si girara un interructor. Volvimos a casa de madrugada, y mi papá no dijo nada, pero sé que se dio cuenta de que algo había cambiado en mí.

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Chela. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Narrador** `[AD6]`: Ay, Beto. Mi primer amor. Lo conocí en el teatro, él era más viejo que yo, tendría como veintiún, veintidós años, y yo dieciséis. Él hacía de galán, muy seguro, muy confiado. Una noche, después de un ensayo, me preguntó si quería tomar algo, y yo dije que sí sin pensar. Fuimos solos al café, y empezó a hablarme de sus sueños de ser actor de cine, de irse a Buenos Aires. Yo lo escuchaba como si fuera el hombre más importante del mundo. Después me pidió que saliera con él, así formalmente, como novio. Lo que me acuerdo más es de que me besó por primera vez en una plaza de Mendoza, de noche, él me agarró la cara con las dos manos, y yo sentí que me estallaba el corazón. Fue el beso más lindo de mi vida, en serio, porque era nuevo, era de verdad. Duramos un tiempo, no mucho, unos meses creo, porque él quería irse a Buenos Aires y yo todavía estaba en la escuela, en Mendoza. Nos separamos, fue triste, pero fue lindo mientras duró. Él sí se fue a Buenos Aires después, se convirtió en un extra en las películas, lo vi en una película años después, fue raro. Pero ese beso, ese momento en la plaza, eso quedó para siempre.

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chica? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Narrador** `[AD12]`: Ay, eso fue cuando mi papá enfermó. No fue nada grave, pero tuvo que quedarse en cama un tiempo, dolor de espalda que lo dejó ahí tirado. Mi mamá estaba con el taller, y de repente todo se me vino encima. Yo tenía dieciocho años, estaba en los últimos años de la secundaria. Mis hermanos, que eran mayores, estaban trabajando en las vides o fuera de la casa. De repente tuve que cuidar a mi papá, traerle comida, que tomara la medicina, ayudar en las cosas de la casa que mi mamá no podía hacer. Fue como si alguien pusiera un cartel que decía "ya no sos una nena". No es que quisiera ser una nena, pero la responsabilidad de verdad fue rara. Y además, fue en ese tiempo que empecé a hablar en serio sobre irme a Buenos Aires a estudiar teatro. Mi papá desde la cama me decía que estaba loca, que cómo me iba a ir dejándolo, y yo le decía que tenía que hacerlo. Eso fue un punto de quiebre, porque él entendió que yo era una persona que tenía sus propios sueños, y que aunque me quisiera, tenía que dejarme ir.

**Biógrafo** `[M3.3 + AD15]`:
> Anotado. Sigo con otra.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[AD15]`: Ay, sí. Fueron un par de cosas. Una fue cuando mis papás me prohibieron ir a una gira de teatro que hacía el grupo, porque decían que era peligroso, que me iba con gente que no conocían. Yo quería morir, en serio. Lloré durante días. Fue un castigo que no me lo merecía, o al menos eso pensaba yo. Después entiendo que mis papás tenían miedo, nada más, miedo de que algo me pasara. Pero en el momento fue como que me quitaran lo único que me importaba. Otra fue cuando una amiga del grupo de teatro me traicionó, le conté un secreto, algo sobre Beto, y ella se lo contó a otro chico que luego se burló de mí. Eso fue feo, porque confié en alguien y me hizo daño. Fue la primera vez que sentí que el mundo no era tan bonito como pensaba, que la gente te podía fallar así de fácil. Tuve depresión un tiempo, nada que se vea, pero andaba triste, no iba a los ensayos, estaba cerrada en mi cuarto. Mi mamá me preguntaba qué pasaba, pero yo no sabía qué decir, así que solo lloraba sola. Pasó con el tiempo, pero fue duro.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquila, que hay tiempo.

**Narrador** `[CI4]`: Ay, sí. La última noche antes de irme a Buenos Aires. Fue raro porque no sabía si volvería, si iba a poder con esto de irme sola a la capital. Mis papás nos llevaron a un restaurante a la familia, a todos juntos. Comimos sin hablar mucho, pero con cuidado, como si cada mordida fuera importante. Después fuimos a la plaza de Mendoza, y mi papá me tomó la mano, algo que casi nunca hacía. Me dijo "cuidate mucho, ¿viste?", y yo sentí que me quebraba. Esa noche me acosté en mi cuarto, en la cama donde había crecido, rodeada de mis cosas, y pensé en toda la vida que dejaba atrás. A la mañana siguiente me subí al tren a Buenos Aires, y Mendoza se quedó atrás.

## Bloque 5 · Juventud

**Biógrafo** `[M24.4 + EN5]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Pasamos a tu juventud, Chela: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Narrador** `[JU1]`: Sí, con diecinueve años. Me fui en tren con mis papás al anden, despedida formal. Mi mamá lloró bastante, mi papá trataba de no llorar, así que hacía bromas. Llevaba una valija con mi ropa, mis libros de teatro, dinero que mis papás me dieron, poco pero me lo dieron. El viaje fue largo, miraba por la ventana y veía el paisaje de Mendoza desaparecer. Buenos Aires fue un shock, en serio. Me bajé en la Estación Retiro, y una prima hermana de mi mamá, que vivía en Flores, me fue a buscar. Me quedé en su casa los primeros meses, dormía en un cuarto compartido con su hija. Fue raro, porque Buenos Aires era grande, era ruido, era gente, era todo. Me inscribí en una escuela de teatro que era medio cara, daba clases en la noche porque durante el día trabajaba de vendedora en una tienda de ropa. La casa de mis papás quedó atrás, y aunque iba una vez por año en vacaciones, nunca volvería a vivir ahí. Crecí en Buenos Aires, eso es lo que pasó. Mendoza quedó en la infancia.

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Narrador** `[JU2]`: Ay, eso. Bueno, empecé a estudiar teatro en una escuela que no era la más cara pero tampoco era mala. Pero la realidad golpea duro, ¿viste? Necesitaba plata para comer, para vivir. Trabajaba de vendedora en una tienda de ropa en el centro, vendía zapatos, carteras, cosas de moda. El dueño era un boludo que me pagaba poco, pero era cerca de donde vivía y podía ir después a los ensayos. Los primeros años fueron así, trabajar de día, estudiar de noche, vivir en la casa de la prima. Duré un par de años en la escuela, creo que casi dos años, pero después los compromisos se armaron. Conocí a gente, me llamaron para actrices, pero eran papeles de nada, figurante, una línea. Después empecé a trabajar de secretaria en una oficina, fue mejor la plata, pero el horario era fijo, y los horarios de la escuela también. Fue un quilombo. Un día simplemente dejé la escuela, no finiquitué nada, solo paré. Fue triste, pero sentía que la realidad me estaba diciendo que actriza no iba a ser. Así que de secretaria estuve un tiempo, después empecé a ayudar en una boutique en Palermo que estaba de moda, y ahí se me vio una luz, porque el dueño era un señor que me quería, que me decía que tenía ojo para las cosas, para la moda, para los clientes.

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Chela. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Narrador** `[JU4]`: La boutique. Eso es lo que fue mío de verdad. El dueño se llamaba Roberto, y cuando empecé a trabajar ahí de verdad, me enseñó todo. No era como las clases de la escuela de teatro que te decían teoría. Roberto me mostraba cómo elegir la ropa, cómo saber qué tela, qué color le va a cada mujer cuando entra a la tienda. Un día, una mujer grande, de esas de la sociedad porteña, entró y quería un vestido para una cena. Roberto me dijo "fijate en ella, Chela, dile qué necesita antes de que lo sepa ella". Yo la miré, vi que tenía los hombros anchos, que era blanquita, que quería verse importante. Le mostré un vestido azul oscuro con los hombros cuadrados. Ella se lo probó y cuando se miró al espejo lloró, en serio lloró. Eso me voló la cabeza. Ese día entendí que no era teatro, que era darle a la gente lo que necesitaban para sentirse hermosas, y que eso era más real que cualquier acto de teatro. Roberto me dejó solo en la boutique después de un tiempo, y empecé a comprar ropa para revender, a armar mis propias colecciones. Así nació la idea de tener mi propia boutique.

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Narrador** `[JU5]`: Bueno, no, nunca fui a nada militar. Soy mujer, así que eso no existía para nosotros. Pero sí había disciplina en casa, la de mis papás era bastante estricta. Mi papá era de los que si decía una cosa, la cosa pasaba. Un día, tenía como catorce años, me pidió que le traiga algo de la viña, y yo quería ir al cine con las amigas. Le mentí, le dije que iba a casa de una amiga a estudiar, y después me fui al cine. Cuando volvés a casa, mi papá estaba esperando, había preguntado en la viña y se enteró de que no había ido. Me metió un castigo que no podía salir de la casa durante un mes. Un mes sin ver a nadie, sin ir al cine, sin amigos. Fue como estar presa. Pero después lo entendí, no porque estuviera de acuerdo, sino porque vi que mi papá era serio, que lo que decía valía. Eso de la disciplina me ayudó después, cuando tuve mi boutique, porque sabía que si querías algo, había que trabajar, no mentir.

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Si te pasó, contame cómo lo decidiste: qué te empujó y a quién se lo dijiste primero.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[JU8]`: Paso, porque ya te conté que me fui de Mendoza a Buenos Aires a los diecinueve años, ¿viste? Eso fue el cambio grande. No me fui a otro país, pero Buenos Aires fue como otro mundo para mí.

**Biógrafo** `[M3.8 + JU12]`:
> Escuchado. Vamos por la siguiente.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue?

**Narrador** `[JU12]`: Ay, mi primer depto. Eso fue cuando empecé a trabajar con Roberto en la boutique. Con lo que ahorraba, y ayudada por mi papá que me prestó un poquito, me mudé a un deptito en Palermo, cerquita de donde era la boutique. Tenía una cocina chiquita, un cuarto, una sala. Nada del otro mundo, pero era mío. Lo primero que hice fue pintarlo todo de un color lindo, beige con toques de naranja. Compré una cama, una silla que encontré en una tienda de segunda mano, cosas viejas pero que tenían carácter. La ventana daba a una calle con árboles, sobre Avenida Las Heras, con mucho movimiento. La primera noche que dormí sola en ese depto, fue raro. Extrañaba el ruido de la casa de la prima, los hermanos de su hija, el movimiento. Pero también era como un alivio, como decir "ahora soy grande, esto es lo mío". Me acuerdo de estar acostada mirando el techo, escuchando los autos de la calle, pensando que había logrado algo importante. Hice un cafecito al otro día en mi cocina, y eso me pareció el acto más adulto del mundo.

**Biógrafo** `[M3.1 + JU15]`:
> Gracias, Chela. Ya lo guardé.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Narrador** `[JU15]`: Ay sí. Los amigos de la boutique, de Palermo. Había una chica que se llamaba Sofía que trabajaba conmigo, era diseñadora de ropa, nos llevábamos genial. Ella me introdujo a un mundo de gente bohemia, artistas, gente que vivía sin mucha plata pero que vivía, ¿viste? Nos juntábamos en bares de Palermo, que había uno que era barato, donde ponían música, y nos quedábamos hasta tarde. Sofía tenía un novio que era músico, así que a veces la música era en vivo, en esos lugares pequeños con piso de tierra casi. Un día, Sofía me presentó a un tipo que pintaba, Alejandro, y nos hicimos amigos. Él estaba enamorado de Sofía, pero ella no le daba bola. Una noche, después de unos vinos, Alejandro me pidió que lo ayude a elegir unos cuadros para una exposición que iba a hacer. Nos fuimos a su estudio, que era un galpón en San Telmo, y pasamos toda la noche viendo sus obras, hablando de la vida, del arte, de qué significa ser artista en Buenos Aires. Fue una noche importante porque sentí que estaba rodeada de gente que vivía por lo que le gustaba, no por lo que la sociedad decía que tenían que hacer. Eso me ayudó a sentirme menos sola.

**Biógrafo** `[M3.2 + JU17]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[JU17]`: Ay, sí. Fue cuando tenía unos veinticuatro años. Mi mamá se enfermó, cáncer. Fue rapidísimo, y de repente yo tenía que volver a Mendoza, dejar la boutique, el depto, mis amigos, todo, para estar con ella. Pasé tres meses en Mendoza, en la casa de mis papás, con ella enferma, viéndola desaparecer. Fue lo más duro que había vivido. Mi papá se hundió de nuevo como cuando murió mi abuela, y yo estaba en el medio tratando de sostener todo. Ella murió un día de primavera, recuerdo que había una ventana abierta y entraba luz. Fue como que se fue tranquila. Pero yo me quedé destrozada. Volvía a Buenos Aires, pero estaba vacía, no podía trabajar, no podía nada. Pasé depresión de verdad, donde no querías levantarte de la cama. Las amigas me iban a buscar, Sofía sobre todo, y me decían que mi mamá no querría que me quedara ahí tirada. Así que poco a poco salí. Pero eso cambió algo en mí, el haber visto morir a mi mamá. Te hace más fuerte, pero también más triste, si se entiende.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI5]`:
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.

**Narrador** `[CI5]`: Ay sí, una cosa. Después que mi mamá murió, volví a Mendoza para estar con mi papá, y fuimos a la casa, a la viña. Él caminaba por ahí como un fantasma. Un día le pedí que me mostrara la tierra de nuevo, que me explicara cómo funcionaba todo. Él casi no hablaba, pero empezó a mostrarme cómo se podan las vides, cómo se elegía el momento de la cosecha. Sentí que me estaba pasando su conocimiento, como si supiera que pronto se iba a ir también. Fue una tarde hermosa, con sol, y mi papá finalmente sonrió cuando vio que yo de verdad quería entender. Eso no me quedó en la vida laboral, pero se quedó en mi corazón, esa imagen de mi papá en la viña, enseñándome sus secretos.

## Bloque 6 · Amor y pareja

**Biógrafo** `[M24.1 + AM0 + M1]`:
> Gracias, Chela. Eso también va al libro.
>
> Ahora vamos al amor. Haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después vamos de a una, empezando por la primera que fue en serio. Si no hubo, decímelo nomás, que también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM0]`: Ay, eso. Bueno, me enamoré un par de veces. Beto fue el primero, a los dieciséis, eso ya te conté, fue lindo pero duró poco. Después en Buenos Aires conocí a Raúl, que era músico, toquero, y eso sí fue en serio. Me casé con él, me casé por primera vez. Fue hermoso al principio, después no tanto por culpa de sus infidelidades. Tuvimos dos hijos, Julián y Paula. Nos separamos después de siete años, más o menos. Él se quedó tocando, yo me quedé con los chicos y la boutique. Después me enamoré de Eduardo, que era contador, medio aburrido pero era estable. Me casé de nuevo, eso fue a fines de los ochenta. Tuvimos a Federico, mi tercer hijo. Eso duró casi diez años, pero nos separamos porque nos aburríamos, así simple. Después tuve cosas cortas, un pintor uruguayo que era una locura, un profesor de tango que era guapo pero boludo, cosas que no iban a ningún lado. Y después, a los cincuenta años más o menos, conocí a Alberto, viudo, nos casamos grandes los dos. Eso duró como catorce años, hasta que murió en el 2019. Ahora estoy con Hugo, que es mi novio, nos queremos pero cada uno en su casa. Así que tres matrimonios serios, varias cosas cortas, un montón de aprendizajes. La vida amorosa mía fue bastante.

**Biógrafo** `[M3.3 + AM1]`:
> Anotado. Sigo con otra.
>
> Contame el día que se conocieron. ¿Dónde fue, quién los presentó o cómo se cruzaron? ¿Y qué fue lo primero que te llamó la atención de esa persona?

**Narrador** `[AM1]`: ¿Cuál de todos? Porque tengo un par. Pero bueno, te voy a contar de Raúl, el primero de verdad. Lo conocí en una actuación, una cosa de teatro que había en Palermo, en un café que hacía música en vivo. Yo estaba ahí con Sofía, mirando el show, y Raúl estaba tocando guitarra. Tenía unos treinta años, pelo largo, barba, las manos sucias de música. Cuando terminó de tocar vino a la barra donde estábamos nosotros, pidió un trago, y empezó a hablar conmigo como si ya nos conociéramos. Era una seguridad que me enamoró al toque. Me pidió que saliera con él, así nomás, sin miedo. Lo primero que me llamó la atención fue eso, su seguridad, su manera de tocar la guitarra como si fuera una extensión de su cuerpo. Tenía algo artístico que me atraía, porque yo había dejado el teatro pero seguía queriendo estar cerca de eso. Salimos un tiempo, nos enamoramos como locos, y cuando me quedé embarazada de Julián, decidimos casarnos. Fue en 1977, yo tenía veintidós años. Fue un acto boludo, porque nos casamos en el juzgado con dos testigos, nada de boda. Pero fue nuestro, ¿viste?

**Biógrafo** `[M3.4 + AM3]`:
> Gracias por contármelo. Seguimos.
>
> Y después, ¿cómo decidieron armar la vida juntos: casarse, irse a vivir, lo que haya sido? ¿Quién lo dijo primero, o se fue dando solo? Contame ese momento: dónde estaban, qué se dijeron.

**Narrador** `[AM3]`: Bueno, nos mudamos juntos cuando empecé a sospechchar que estaba embarazada. Raúl tenía un departamento en San Telmo, chiquito, con todo destartalado, pero teníamos espacio. Una noche me dijo que quería que viviera con él, que me quería, que aunque fuera loco podía hacerlo. Yo le dije que sí. Después cuando confirme que estaba embarazada de Julián, Raúl me dijo "nos casamos, ¿viste?", así natural, como si fuera lo más obvio. No fue una propuesta romántica, pero fue honesto. Nos fuimos al juzgado con dos amigos, les pedimos que sean testigos, y listo. Fue en un día gris de Buenos Aires, me acuerdo de estar nerviosa, pensando que mi papá se iba a enojar, que mi mamá iba a llorar. Pero también fue emocionante, porque era la vida que estaba armando. Raúl era un boludo, pero en ese momento me quería, o al menos eso creía.

**Biógrafo** `[M3.5 + AM4]`:
> Guardado, Chela. Te mando la próxima.
>
> Hay días que quedan grabados para siempre. ¿Hubo uno en que se casaron, o en que empezaron a vivir juntos? Si lo hubo, contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó.

**Narrador** `[AM4]`: Ay sí. El día que nos casamos en el juzgado fue en 1977, un día que me acuerdo de estar nublado, de esos días porteños donde está todo gris. Yo me puse un vestido blanco que no era de novia, era un vestido de algodón que me había hecho años atrás, pero lo elegí porque era el más blanco que tenía. Raúl se puso un pantalón oscuro y una camisa, nada del otro mundo. Los testigos eran amigos de él, músicos también. El juez nos hizo preguntas aburridas, "¿vos Raúl consentís?", "¿vos Chela consentís?", y nosotros sí consentíamos. Después salimos del juzgado y fuimos a un bar, a comer algo. Yo tenía una panza que no se veía casi, pero yo sabía que Julián estaba ahí. En el bar, Raúl me tomó la mano y me besó, así, en la mesa, sin importarle nada. Después nos fuimos al departamento, y esa noche me acuerdo de estar en la cama con él, pensando que había hecho la decisión más importante de mi vida, que iba a ser madre, que iba a ser su esposa. No sabía que las cosas iban a ser tan difíciles después.

**Biógrafo** `[M3.6 + AM8]`:
> Lo tengo. Vamos con otra.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Narrador** `[AM8]`: Ay, mirá. Hay un momento que todavía me emociona. Fue cuando nació Julián. Yo estaba en el hospital, en el parto, y fue complicado, fue largo. Raúl estaba en la sala de espera, y cuando el doctor me dijo "es un varón", él entró corriendo. Estaba sucio de sudor, despeinado, y cuando vio a Julián llorando en mis brazos, se le llenaron los ojos de lágrimas. Se sentó al lado mío en la cama, y me tomó la mano, y nos quedamos mirando a Julián los dos. No dijimos nada, pero fue como que en ese momento todo valía la pena, todas las dificultades, todo. Raúl me besó la frente, y me dijo "gracias". Solo eso, "gracias". En esa noche yo creí que íbamos a estar juntos para siempre, que habíamos hecho algo hermoso. Después pasó lo que pasó, las infidelidades, las idas y vueltas, pero ese momento, en el hospital con Julián entre nosotros, eso quedó. Eso es lo que guardaría.

**Biógrafo** `[M3.7 + AM9 + M1]`:
> Listo, quedó guardado. Sigo.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM9]`: Ay sí, bueno, hay que contarlo porque es la realidad. Raúl me engañó. No una vez, no dos, sino varias. Empecé a sospechar cuando Julián tenía unos tres años. Él llegaba tarde, con olor a perfume que no era mío, a cigarrillo que no fumaba. Me quedé callada un tiempo, pensando que era una fase, que se le pasaría. Pero no se le pasó. Una día encontré un recibo de un hotel en su bolsillo, y me rompió. Le encaré, él negó, después confesó, después pidió perdón. Eso pasó varias veces. Yo aguantaba porque tenía dos hijos, porque en esos tiempos no era tan fácil divorciarse, porque todavía lo quería. Pero llegó un momento en que me cansé de llorar, de cuestionarme qué estaba haciendo mal. Raúl seguía con la música, seguía siendo el mismo flojo que era. Cuando Julián tenía siete años, decidí que basta. Me separé de él. Fue doloroso porque seguía queriendo que los chicos tuvieran padre, pero no podía seguir así. Raúl se fue a vivir con otra mina. Los chicos lo veían, pero la relación mía con él nunca más fue la misma.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[AM19]`:
> Y después de esa historia, ¿hubo un tiempo en que seguiste por tu cuenta? Contame cómo era un día tuyo entonces: qué hacías, quién andaba cerca. Si no hubo un tiempo así, decime no nomás.

**Narrador** `[AM19]`: Ay sí. Fue poco tiempo, pero fue intenso. Después de dejar a Raúl, quedé sola con los chicos, Julián de siete y Paula de cinco. La boutique estaba creciendo, así que trabajaba como una loca, llegaba cansada, les daba de comer a los chicos, los acostaba, y después caía a la cama. Era un ciclo. Pero había momentos bonitos, como cuando los chicos crecían viendo que su mamá podía hacerlo sola, que no necesitaba de un tipo para sobrevivir. Iba a trabajar, volvía, cocinaba, limpiaba, los ayudaba con los deberes. Los fines de semana nos íbamos a pasear, al parque, cosas así. Era agotador pero era mío, ¿viste? No estaba de humor para otro tipo, estaba enfocada en los chicos y en la boutique. Pero después de un año más o menos, empecé a conocer a Eduardo, que era amigo de Sofía, contador. Era estable, era cariñoso con los chicos, era todo lo contrario a Raúl. Me propuso vivir juntos, y después un tiempo me pidió que nos casemos. Acepté porque sentía que era lo mejor para los chicos, que necesitaban una figura paterna, una familia más estructurada.

**Biógrafo** `[M3.8 + AM16]`:
> Escuchado. Vamos por la siguiente.
>
> Si después de esa historia hubo otro amor, contame del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado. Si no lo hubo, decime no nomás.

**Narrador** `[AM16]`: Ay sí. Ahora estoy con Hugo, mi novio. Tengo setenta y uno, él setenta y cuatro. Nos conocimos en un viaje, una excursión que hizo una amiga a Bariloche. Hugo estaba ahí solo, viudo desde hace años, y nos sentamos juntos en el colectivo. Empezamos a hablar, y él tiene una manera de escuchar que es rara, te mira a los ojos y presta atención. Cuando llegamos a Bariloche, él me pidió que caminara con él, y caminamos horas, hablando de la vida, de los hijos, de lo que significa envejecer. Fue lindo porque no había presión, no había necesidad de armar una familia, nada de eso. Cuando volvimos a Buenos Aires, seguimos viéndonos. Es mi novio, pero cada uno tiene su casa, vamos al cine, comemos juntos, nos queremos. Un día, Hugo me llevó a ver el atardecer en La Boca, sentados en un banco mirando el río. Él me tomó la mano y me dijo "estoy contento de tenerte aquí", sin más. Eso fue todo lo que necesitaba, esa tranquilidad, esa certeza de que a mi edad, alguien quiere estar conmigo sin dramas, sin engaños. Eso es lo que el amor es ahora para mí.

**Biógrafo** `[M3.1 + AM13]`:
> Gracias, Chela. Ya lo guardé.
>
> Contame una pelea que tuvieron, de esas que después dan risa. Por qué fue, quién aflojó primero y cómo hicieron las paces.

**Narrador** `[AM13]`: Ay, sí. Una vez Hugo me invitó al cine, y yo quería ver una película de dramatismo, de esas con premios, y él quería ver una de acción. Nos peleamos en el cine, en serio, peleamos como chicos. Yo le dije que él era un boludo por querer ver eso, que teníamos que aprovechar a mi edad, ver algo inteligente. Él me dijo que a su edad también tenía derecho a ver lo que quería, que no todo tenía que ser depresión. Nos sentamos en la fila sin hablar, viendo su película de acción. A mitad, una escena ridícula pasó, una explosión que era tan boluda que nos largamos a reír los dos. Nos empezamos a carcajear como locos en el cine, la gente nos miraba. Después cuando salimos, nos abrazamos en la puerta, sin hablar. Fuimos a tomar algo, él pidió lo que quería, yo pedí lo que quería, y fue como un acuerdo silencioso de que a esta edad, no vale pelear por esas cosas. Después siempre vemos sus películas de acción, pero yo elijo la próxima.

**Biógrafo** `[M3.2 + AM14]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Tuviste algún amor que te marcó y no fue el de toda la vida? Uno que dejó huella, aunque haya durado poco. Si te pasó, contame cómo se cruzaron y el momento que más te acordás de esa persona.

**Narrador** `[AM14]`: Ay sí, Martín. Un pintor uruguayo que se cruzó en mi vida cuando tenía cuarenta y algo. Fue después de separarme de Eduardo. Martín era de Montevideo, vivía en Buenos Aires, era de esos tipos que no sabe qué quiere pero vive como si lo supiera. Lo conocí en una galería, en una exposición de arte. Él estaba exponiendo unos cuadros que eran locos, abstractos, llenos de color. Nos miramos y nos dijimos "hola" sin más. Después nos vimos unas semanas, intensamente. Hacía cosas raras, como llevarme a medianoche a la costanera para picar algo que había preparado, o pintarme la cara con sus propios colores, boludeces así. Pero era divertido, era como volver a ser joven. Lo que me quedó más de él fue una noche que fuimos a escuchar música a un sótano en San Telmo, y cuando empezó la música, él me levantó y me hizo bailar como si nadie nos viera. Yo me sentía hermosa, viva. Pero Martín se fue, simplemente un día dijo que volvía a Montevideo, que no podía estar en Buenos Aires, que era demasiado. Me quedé con un vacío. Pero también me quedó esa noche de danza, esa sensación de que todavía podía sentirme joven a pesar de mi edad.

**Biógrafo** `[M26 + CI6]`:
> Gracias, Chela.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI6]`: Ay sí, una cosa. Quiero contar algo de Alberto, mi tercer marido, que murió hace poco. Él fue lo más tranquilo que tuve en pareja. Nos casamos porque nos queremos y punto, sin drama. A veces la gente piensa que cuando te casás tiene que ser fuegos artificiales, pero con Alberto fue más como entrar en una casa cálida. Él era viudo, yo era viuda de emociones, así que nos entendíamos. Un día que me queda especial fue cuando nos fuimos a Córdoba de vacaciones, vimos el atardecer en las sierras, y él me dijo que había vivido una vida complicada pero que yo le había enseñado a estar tranquilo. Se murió en el 2019, enfermedad. Fue duro porque lo quería, pero era como si dijera "tuvimos lo que teníamos que tener", sin recriminaciones. Eso fue bonito.

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M24.2 + EN7]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ahora vamos al trabajo y a tu oficio, Chela: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Narrador** `[TR1]`: Mi primer trabajo fue en la tienda de ropa en el centro, como te conté. El dueño se llamaba don Julio, un tipo medio roto que pagaba poco pero era lo que había. Yo tendría veintiún años, había llegado hacía poco a Buenos Aires. El primer día me mostraron cómo doblar la ropa, cómo atender clientes, cómo no dejar robar las cosas. El primer dinero que me ganó fue una miseria, pero para mí fue como si hubiera ganado una fortuna. Estábamos a fin de mes, y cuando don Julio me pagó, guaré ese dinero como si fuera oro. Me fui a una confitería, compré un café con medialunas, y me senté sola a comerlo, pensando que había hecho algo importante. La mitad de esa plata se la mandé a mis papás a Mendoza, para que vieran que no estaba perdiendo el tiempo en Buenos Aires. La otra mitad me la guardé para los gastos. Trabajar fue lo que me dio libertad, ¿viste? Fue la puerta a la independencia.

**Biógrafo** `[M3.4 + TR6]`:
> Gracias por contármelo. Seguimos.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Narrador** `[TR6]`: Bueno, desde los veintiuno trabajé de vendedora en esa tienda de ropa, unos tres, cuatro años. Después me cansé de ganar poco y trabajé de secretaria en una oficina, eso fue a principios de los ochenta, unos cinco años. Después llegué a la boutique de Roberto, aprendí el oficio, y eso fue lo importante. Cuando tenía unos treinta y cinco años, abrí mi propia boutique en Palermo, y eso duró quince años, bastante tiempo. Después, cuando los chicos crecieron, dejé la boutique, el mercado cambió, el comercio no era lo mismo. Después ahí ya no trabajé en serio, me dediqué a mis hijos, a estar en la casa, a viajar. Lo que me quedó más grabado fue la boutique mía, en Palermo. Esos quince años fueron los de más energía, donde yo llamaba todas las decisiones, donde elegía la ropa que vendía, donde conocía a mis clientes por sus nombres. Era exigente, iba de lunes a sábado, pero era mío. Algunos de mis clientes siguen siendo mis amigas ahora, décadas después. Eso fue lo que me dio más satisfacción, no tanto por el dinero, sino porque creé algo de la nada.

**Biógrafo** `[M3.5 + TR2]`:
> Guardado, Chela. Te mando la próxima.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Narrador** `[TR2]`: Un día común en la boutique era así: llegaba a las ocho de la mañana, abría la persiana, prendía las luces, ponía música. Tenía una chica que trabajaba conmigo, Sofía, la que te mencioné antes. Mientras ella sacudía la ropa, yo veía qué necesitaba reponerme, qué vendía poco, qué se había movido. Después llegaban los clientes, desde las diez de la mañana empieza el movimiento. Yo atendía personalmente, porque para mí cada cliente era importante. Un día que me quedó fue cuando llegó una señora mayor, medio tímida, que quería algo para ir a un bautismo de su nieta. Estaba insegura de qué se ponía, decía que ya no le quedaba nada. Yo le mostré varias opciones, ella se probó, y cuando se vio con ese vestido lila que le había elegido, se miró al espejo y se largó a llorar. Después me contó que era viuda, que el nieto era lo más importante para ella. Yo le regalé un pañuelo para que no llorara más, y ella se fue feliz. Eso fue una jornada típica, ganar dinero pero también sentir que hacía algo importante en la vida de la gente. Me iba a las seis de la tarde, a veces más tarde, cansada pero satisfecha. Llegaba a casa, veía a los chicos, cocinaba, y después me dormía pensando en qué ropa comprar para la semana siguiente.

**Biógrafo** `[M3.6 + TR3]`:
> Lo tengo. Vamos con otra.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Narrador** `[TR3]`: Roberto. Eso fue un regalo de la vida. Él era el dueño de la boutique donde empecé a trabajar en serio. Cuando llegué ahí, yo no sabía nada, era una vendedora más. Pero Roberto vio algo en mí, una manera de hablar con la gente, una inteligencia para los negocios. Me enseñó cómo elegir tela, cómo mirar a una mujer y saber qué le va a gustar. Pero además me enseñó a creer en mí misma. Un día, cuando yo dudaba de poder abrir mi propia boutique, él me dijo que yo tenía lo que necesitaba, que solo tenía que atarme los cordones y hacerlo. Él me prestó dinero, me presentó con proveedores, me enseñó cómo hacer los tratos. Una vez, un proveedor me estaba queriendo cagar, me quería vender ropa de baja calidad a precio alto, y yo iba a decir que sí. Roberto estaba en la oficina, me escuchó, después me pidió que salga, habló con el tipo, y cuando volvimos, yo había ganado. Me dijo "Chela, vos tenés poder, no lo regales". Eso cambió mi forma de ver los negocios y la vida.

**Biógrafo** `[M3.7 + TR5]`:
> Listo, quedó guardado. Sigo.
>
> ¿Cuál fue el día de trabajo del que estás más orgullosa? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo.

**Narrador** `[TR5]`: El día que abrí mi boutique. Fue un lunes, creo que en 1989 o 1990, no recuerdo exacto. Había trabajado como loca para juntar plata, para conseguir proveedores, para hacer los arreglos del local. La noche anterior no pude dormir. A la mañana siguiente, llegué temprano, arreglé la vidriera, puse la ropa en el orden correcto, la música, todo. Cuando abrí la puerta, entró una cliente, no la conocía de nada, y me preguntó si iba a estar abierto. Yo le dije "sí, desde hoy", con una sonrisa que creo que fue de oreja a oreja. Ella se probó algo, le gustó, me compró. Eso fue lo primero que vendí en mi propia boutique, con dinero propio, con riesgo propio. Llamé a Roberto y le dije lo que había pasado, y él se largó a llorar, en serio. Eso me hizo entender que lo que yo hacía importaba, que no era solo ganar dinero, era crear algo, era mostrar que si creés en vos misma, las cosas pueden salir bien. Ese día me siento orgullosa de mí misma, todavía, a los setenta años.

**Biógrafo** `[M3.8 + TR11]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.

**Narrador** `[TR11]`: Ay sí. Fue cuando cerré la boutique. El mercado cambió, la ropa que vendía no se movía, tenía que renovar pero no tenía dinero, y los chicos crecieron. Fue un par de años donde no sabía qué hacer, no estaba ni en casa ni trabajando. Pasé un tiempo sin plata, pidiéndole a Eduardo o pidiendo créditos para vivir. Fue feo porque yo estaba acostumbrada a manejar mi propio dinero. Un día, recuerdo estar sentada en la casa, mirando por la ventana, y pensar que se me estaba pasando la vida. Sofía en ese momento me propuso trabajar con ella en un emprendimiento de ropa, pero yo no estaba lista. Pasaron años, después me fui a viajar, después me casé con Alberto. Pero esos años fueron grises, no tenía propósito. Lo que me salvó fue que tenía a los chicos, que me necesitaban todavía, y tenía a mis amigas. Ellas me decían que la vida es larga, que iba a encontrar algo. Y bueno, no trabajé de nuevo en lo que antes, pero la vida me dio otras cosas.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Chela. Queda guardado con cuidado.

**Biógrafo** `[TR8]`:
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Narrador** `[TR8]`: Ya te conté bastante de la boutique, así que creo que está. Eso fue mi negocio propio, lo mío de verdad.

**Biógrafo** `[M3.1 + CS1]`:
> Gracias, Chela. Ya lo guardé.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Narrador** `[CS1]`: Ay, cocinar. Yo sé cocinar bien, y cuando hago una cena, es un acontecimiento. Mis amigas siempre me piden que las visite para que cocine. Hago cosas simples pero bien hechas, pasta, un buen guiso, empanadas como mi mamá. Un día, hice una comida para los amigos de Julián cuando se recibió, hice todo yo, el menú, la decoración, todo. Había gente que no conocía, y los que llegaron sin saber qué esperar, terminaron comentando la comida. Alguien me dijo "Chela, deberías tener un restaurante", y yo les dije "no, eso sería trabajo, cocino porque me gusta". La casa también, me gusta que esté linda, que sea un lugar donde la gente quiera estar. He organizado fiestas de cumpleaños para mis nietos, cosas así. Lo que la gente nota es que lo hago con corazón, no porque tenga que hacerlo.

**Biógrafo** `[M3.2 + CP1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chica o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Narrador** `[CP1]`: Ay sí, Mendoza. La viña de mi papá fue como mi segunda casa de chica. Un día de los que me acuerdo era así: llegábamos al lugar donde estaban las plantaciones, el sol estaba arriba, casi no podías mirar. Mi papá y los peones estaban podando las vides, y yo andaba corriendo entre las plantas, metiendo los pies en la tierra roja que tenía Mendoza. Era calor seco, no como aquí, y después me daba sed que casi me muero. Mi papá me llevaba a tomar agua del pozo que había ahí, agua fría que sacaba con una cuerda. Un día, recuerdo que fue una seca terrible, una sequía que duraba meses. Los peones estaban preocupados porque las vides se estaban muriendo. Mi papá regaba nomás, con palas, llenando de agua. Yo lo ayudaba, agarrando el balde, mojando las raíces. Fue un día que sentí lo que es el trabajo de verdad, luchar contra la naturaleza. Después una tormenta pasó, granizo en Mendoza, y perdió todas las vides de ese año. Fue la primera vez que vi a mi papá llorar de verdad, no de muerte, sino de frustración.

**Biógrafo** `[M3.3 + TR9]`:
> Anotado. Sigo con otra.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Narrador** `[TR9]`: Ya lo dejé hace años. El último día de la boutique fue raro. Yo sabía que se vino el final, así que estuve un tiempo preparándome. El último día llegué a la mañana, miré alrededor, toda la ropa que había vendido a lo largo de años, los carteles, los espejos. Atendí un par de clientes que llegaron, y cuando cerré la persiana a las seis de la tarde, fue como cerrar un capítulo. No lloré, pero sentí algo, como un alivio y una pena a la vez. Llegué a casa, me senté, y fue raro no tener que volver al día siguiente. Los primeros días sin ir a la boutique fueron extraños, como cuando se despiertan sin ir a la escuela. Me faltaba el movimiento, la gente, las decisiones de todos los días. Pero después pasó el tiempo, empecé a disfrutar de estar en la casa, de estar con Alberto, de viajar. Los chicos crecieron, y yo tuve otros propósitos. Pero la boutique fue mi vida durante esos quince años, nadie me lo va a quitar.

**Biógrafo** `[M26 + CI7]`:
> Gracias, Chela.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.

**Narrador** `[CI7]`: No, creo que está todo. Ya conté bastante de lo que hice.

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M25.1 + EN8]`:
> Bien, seguimos.
>
> Volvemos a la familia, Chela, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Si no los tuviste cerca, contame cómo fue eso.

**Narrador** `[PG1]`: Ay sí. Mi papá envejeció rápido después que mi mamá murió. Antes estaban juntos, se peleaban, se querían, había un equilibrio. Cuando ella se fue, él se quedó vacío. Un día volví a Mendoza, y lo vi sentado en la terraza mirando las vides, y pensé "este no es mi papá". Estaba flaco, tenía los ojos como perdidos. Le pregunté si comía bien, y me dijo que a veces. Sentí que ahora yo tenía que cuidarlo a él, que se había invertido todo. Le ayudé en la casa, fui a una vez por mes durante un tiempo, pero estaba lejos, en Buenos Aires. Él nunca se quiso venir conmigo, decía que Mendoza era su vida. Un gesto que me quedó: una vez le llevé ropa nueva, pantalones y camisas, y cuando se los probó, parecía un chiquito con la ropa grande. Se miró al espejo y me dijo "mirá cómo estoy, Chela, ya no soy el viñatero". Fue una frase que me rompió. Después él murió, así nomás, de un paro, cuando tenía como setenta y dos años. Fue rápido, no sufrió. Pero me quedó esa imagen de mi papá viejo, flaco, perdido.

**Biógrafo** `[M3.5 + HI0 + M1]`:
> Guardado, Chela. Te mando la próxima.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Si sí, contame quiénes son, así los voy conociendo. Y si no, decímelo nomás y seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI0]`: Ay sí, tengo tres hijos. Julián, nació en 1978, hijo de Raúl. Paula, 1980, también de Raúl. Y Federico, que nació en 1988, hijo de Eduardo. Julián es varón, Paula es mi hija, y Federico también varón. Los tres son grandes ya, tienen sus vidas, sus trabajos, sus familias. Julián es el que más me quiere así, está pendiente de mí. Paula siempre fue más independiente, pero me quiere a su manera. Y Federico, el más chiquito, es el que está más cerca porque vive en Buenos Aires. Tengo cuatro nietos entre los tres, cosa que me enorgullece. Fueron mi razón de ser durante muchos años, sobre todo cuando me separé de Raúl y tuve que estar sola con ellos. Después creció el entendimiento, nos vimos menos porque tienen sus vidas, pero siguen siendo lo más importante que tengo.

**Biógrafo** `[M3.6 + HI2]`:
> Lo tengo. Vamos con otra.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Narrador** `[HI2]`: Ay, Julián. Fue el 15 de junio de 1978. Yo estaba embarazada de mi primer hijo con Raúl, y ese día sentí que algo pasaba. Los dolores empezaron a la mañana temprano, y Raúl me llevó al hospital corriendo. Fueron horas de parto, de dolor que no sabía que existía, de estar tirada en una camilla sin poder moverte. Raúl estaba en la sala de espera, yo después supe que estaba fumando como loco, asustado. Cuando Julián nació, fue una mezcla de dolor y alivio que no puedo explicar. El doctor me lo puso en el pecho, mojado todavía, llorando, y yo no sabía si llorar de felicidad o de miedo de que algo le pasara. Me acuerdo de tocarle la cara, contar sus dedos, sus uñas, sus dedos de pies. Eran los dedos más chiquitos que había visto. Después entró Raúl, corriendo, como te conté, y nos quedamos mirando a Julián los tres, en silencio. Esa noche no dormí, pasé toda la noche mirándolo dormir, asustada de que no respirara. Pero respiraba, y estaba ahí, y era mío. Ese fue el día más importante de mi vida, sin dudas.

**Biógrafo** `[M3.7 + HI2b]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tuviste más hijos, o hay alguien más que sentís que criaste o cuidaste como propio? Si fue así, contame cómo fue la llegada de cada uno, con el tiempo que necesites. Cada llegada tiene su historia.

**Narrador** `[HI2b]`: Sí, tengo dos más. Paula llegó dos años después de Julián, en 1980. Fue diferente porque ya sabía qué esperar, pero fue también especial. Cuando la vi, fue la primera vez que una hija mujer llegaba a mi familia. Raúl quería un varón, pero yo estaba feliz de tener una nena. La tomé en brazos y lloré, porque me acordé de mi mamá, de cómo ella me quería a mí siendo mujer, siendo distinta. Después Federico llegó en 1988, pero fue con Eduardo, así que la historia fue distinta. Yo ya era divorciada de Raúl, y con Eduardo estábamos en un momento más estable. Federico fue como un nuevo comienzo, más tranquilo. El parto también fue menos complicado. Cuando lo tuve en brazos, era un bebé hermoso, quieto, diferente a Julián. Raúl fue a verlo al hospital, porque era mi hijo igual, y fue raro verlos a los dos en la misma habitación. Pero eso es la vida, los hijos vienen de lugares distintos, de momentos distintos. Hoy los tres son adultos, y los amo a los tres por igual, aunque cada uno me haya dado cosas diferentes en la vida.

**Biógrafo** `[M3.8 + HI3]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Narrador** `[HI3]`: Julián era el malo, en el mejor sentido de la palabra. Travieso, se metía en problemas, hacía bromas, quería ser el centro de atención. Paula era más sensible, más introvertida, le gustaba estar conmigo en la casa, ayudarme en cosas. Federico fue más tranquilo, observador, miraba mucho antes de hacer. Un día que me hace sonreír es cuando Julián y Paula estaban peleando por un juguete, y yo les dije "el que lo comparta gana un premio". Julián agarró el juguete y lo partió por la mitad, le dio un pedazo a Paula y dijo "listo, compartí, dónde está mi premio". Yo me largué a reír, era tan lógico, tan boludo. Otra era cuando Federico era bebé, yo lo llevaba a la boutique, y una clienta le daba caramelos. Federico no quería soltar el caramelo, y cuando lo tomaba para limpiarle la boca, él gritaba. Pasaba eso todos los días, y después la clienta dejó de venir porque decía que no podía soportar que el chiquito llorara. Cada uno fue distinto, cada uno me enseñó algo diferente de ser mamá.

**Biógrafo** `[M3.1 + HS1]`:
> Gracias, Chela. Ya lo guardé.
>
> ¿Cómo viviste la crianza de tus hijos? ¿La llevaste sola, o tuviste alguna ayuda cerca? Contame un día de esa época que te acuerdes bien.

**Narrador** `[HS1]`: La viví duro. Cuando me separé de Raúl, fue yo sola con los dos chicos, sin dinero, trabajando como loca. No tenía ayuda de ningún lado, Raúl pagaba poco o no pagaba. Mis amigas me ayudaban, sobre todo Sofía, que a veces se quedaba con los chicos mientras yo iba a trabajar. Mi taller de la boutique quedaba cerca, así que en el almuerzo me escapaba a darles de comer. Un día que me acuerdo, fue invierno, Julián estaba resfriado, Paula tenía fiebre, y yo tenía que ir a la boutique porque había una cliente importante que venía. Sofía se quedó con ellos, y yo la verdad lloraba en el trabajo, pensando si estarían bien. Cuando llegué a casa, Sofía estaba haciendo té, había limpiado todo, los chicos estaban tranquilos. Me senté en la cocina y me largué a llorar. Sofía me dijo "Chela, vos sos fuerte, los chicos están bien porque los criás con amor, eso es lo que importa". Después cuando me casé con Eduardo, la cosa cambió, él ayudaba con los gastos, pero esos años de sola fueron los más duros que pasé. Pero también me enorgullecen, porque lo hice, sin quejarme demasiado, con lo que tenía.

**Biógrafo** `[M3.2 + HI6]`:
> Te escuché. Vamos con la que sigue.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Narrador** `[HI6]`: Ay, montones. Cuando Julián se recibió de lo suyo, lo que estudió, y vino a mostrarme el título, me puse a llorar. Yo había dejado todo para que estudiara, y él lo logró. Paula se casó y tiene familia, y verla feliz con su marido fue una emoción. Cuando veo a mis nietos crecer, veo que ella está haciendo lo que yo no siempre pude, estar presente sin angustia. Y Federico, que es el que vive cerca mío, cuando me ayuda sin que le pida, cuando me llama para ver cómo estoy, eso me llena el alma. Una vez, Federico llegó a mi casa con un regalo que él mismo había hecho, una caja de madera donde guardar mis cosas de la boutique, con fotos de la tienda. Me senté en la cama y lloré como una boba. Esos momentos son los que valen, ¿viste?, no los viajes, no las cosas. Que tus hijos te vean, que te cuiden, que hayan crecido como buenas personas. Eso es lo que uno busca, que hayan pasado el amor que les diste, a sus hijos, a su gente.

**Biógrafo** `[M3.3 + HI8 + M1]`:
> Anotado. Sigo con otra.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, me lo decís y pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI8]`: Ay sí. El primer nieto fue hijo de Julián. Recuerdo que fui al hospital, y cuando lo vi, fue como ver a Julián de nuevo de bebé, pero con la cara de su mamá. Lo agarré en brazos y pensé "ahora soy abuela, ahora mi vida cambió de nuevo". El nieto se llama Santiago, y fue como un regalo. Después llegaron los otros: dos de Paula, uno de Federico. Cuatro en total. Cuando tengo a Santiago o a los otros en brazos, siento que es diferente a los hijos. Con los hijos era responsabilidad total, era angustia constante. Con los nietos es puro amor, puedo darles lo que no pude darles a los hijos, que es tiempo sin obligación de trabajar, de angustia, de que salgan bien. Los llevo al cine, los mimó, después me los doy los papás y listo. Es un amor más liviano, si se entiende. A Santiago lo veo mucho, porque Julián vive cerca, y cada vez que me ve grita "¡abuela!" y me abraza. Eso para mí es lo máximo.

**Biógrafo** `[M3.4 + HI9]`:
> Gracias por contármelo. Seguimos.
>
> ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada.

**Narrador** `[HI9]`: Ay sí. Cuando vienen a mi casa, les hago lo que yo llamo "la moda de abuela". Me traen unas trapos viejos, cosas que no usan, y entre los dos armamos disfraces. Yo le muestro cómo combinar colores, cómo usar un pañuelo como cinturón, cómo verse importante con poco. Después ellos desean por la casa, se miran al espejo, y yo les hago las fotos. Santiago, mi nieto mayor, una vez agarró un vestido viejo de un maniquí que tengo en casa, se lo puso encima, y dijo "abuela, me siento como vos, importante". Me largué a llorar. Los otros nietos hacen lo mismo, y cuando vienen sus papás a buscarlos, andan toda la ropa revuelta, pero estuvieron horas conmigo, creando, imaginando, viéndose hermosos. Eso es lo nuestro, la moda de abuela. Lo hacemos nomás con ellos, mis amigas me dicen que ando loca, que por qué les dejo desorden, pero eso es lo que importa, que se diviertan, que aprendan que pueden ser lo que quieran.

**Biógrafo** `[M26 + CI8]`:
> Gracias, Chela.
>
> Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI8]`: Ay sí, una cosa. Mis hermanos. Tengo tres hermanos, y no hablé mucho de ellos. Miguel es el mayor, vive todavía en Mendoza, con su familia. Carlos se fue a vivir a Córdoba. Y Fernando, el que era mi compinche de chica, está en Buenos Aires. A veces nos juntamos, pero la vida nos dispersó. Fernando vive solo ahora, su mujer se murió hace años, y yo lo invito a comer. Es raro estar con los hermanos de adultos, porque nos acordamos de cosas de cuando éramos chicos, nos reímos, nos hacemos bromas como si nada hubiera pasado. Pero el tiempo pasó, cada uno tiene sus historias, sus vidas separadas. Eso es lo que quedaba sin contar, que la familia se dispersa, que los hermanos se ven poco, pero que el amor está ahí.

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M24.3 + EN9]`:
> Bien, Chela. Lo sumo a lo que ya me contaste de eso.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Narrador** `[LU4]`: Ay, el viaje a Italia. Fue con Alberto, hace años, en el 2010 más o menos. Siempre quise ir, porque mi abuela era italiana, porque quería ver de dónde venía mi sangre, viste. Fuimos una semana, recorrimos Toscana, Roma, todo. Un día que me quedó fue cuando estábamos en un pequeño pueblo de Toscana, un lugar donde vivía una rama de los parientes de mi abuelo. Encontramos la casa donde habían vivido. Fue como cerrar un círculo, porque mi abuelo se fue de ahí, y yo volvía. Me senté afuera de la casa, en una plaza, y lloré. Alberto me agarraba la mano, sin hablar. Ese día entendí de dónde era mi raíz, por qué mi papá era como era, por qué mi abuela tenía esa manera de hablar. Fue mágico, como si encontrara una parte de mí que no sabía que estaba ahí. Después viajé más, a Brasil, a Uruguay, pero ese a Italia fue el que me marcó. Alberto fue importante en eso, porque él me alentó, me dijo que fuera a buscar mis orígenes. Eso es lo que un compañero bien hace, te ayuda a encontrar lo que está perdido adentro.

**Biógrafo** `[M3.6 + PA1]`:
> Lo tengo. Vamos con otra.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Narrador** `[PA1]`: El tango. De grande me enamoré del tango. Pasó después que cerré la boutique, cuando tenía tiempo y los chicos eran más grandes. Empecé a tomar clases en un lugar de San Telmo, una escuela donde enseñaban. El primer día estaba muerta de vergüenza, tenía como cuarenta y tantos años, rodeada de chicos jóvenes. Pero el maestro, que era un boludo con mucho carisma, me dijo que el tango es de gente grande, que yo tenía más para dar que los chicos. Así que me quedé. Un día entero de tango era así: llegaba a las dos de la tarde, empezaba con calentamiento, después aprendíamos pasos nuevos, coreografía. A las seis salía, comía algo rápido, y a las ocho volvía a clase de tango de noche. Pasaba ocho horas danzando, y no me cansaba. El tango me dio lo que el teatro me había prometido pero nunca cumplió: una manera de expresarme, de sentirme viva, de estar presentes. Después conocí gente linda ahí, amigos, y hasta tuve una relación corta con el profesor, que fue un boludo pero fue. La danza cambió mi vida de grande, me dio razón para estar de pie.

**Biógrafo** `[M26 + CI9]`:
> Gracias, Chela.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquila.

**Narrador** `[CI9]`: La Boca. Siempre me encantó La Boca, desde chica cuando venía con mis papás a Buenos Aires, después cuando viví. Es raro porque es un lugar pobre pero hermoso, con esos colores en las casas. Hugo y yo vamos seguido, nos sentamos en la banquina, miramos el río, el atardecer. No necesitamos hablar. Eso es lo que significa La Boca para mí a esta edad, un lugar donde puedo estar sin pretender nada, sin ser nadie importante. Solo estar ahí, con alguien que me quiere, viendo cómo el día se termina.

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M24.4 + EN10]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Hablemos de los amigos, Chela, y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Narrador** `[AS1]`: Sofía. Sofía fue mi mejor amiga, de verdad. La conocí cuando trabajaba en la boutique de Roberto, ella era una diseñadora que iba a vender sus diseños. Nos vimos y fue como magia. Empezamos a tomar café, después salir juntas, después fue mi compañera de trabajo en mi boutique. Sofía fue la que estuvo cuando me separé de Raúl, cuando mi mamá murió, cuando no sabía si podía seguir. Una vez, yo estaba en la boutique, había sido un día de mierda, un cliente me había tratado mal, la ropa no se vendía, todo era un desastre. Llegó Sofía y vio que yo estaba en el borde de llorar. Me agarró, me llevó a la trastienda, me hizo sentar, y me dijo cosas que no recuerdo bien, pero lo que me quedó fue que ella creía en mí, que yo era capaz, que no podía rendirme. Pasó el tiempo, ella se fue del país, se casó, formó familia. Nos alejamos un poco, pero siempre hay esa conexión. Cada vez que nos vemos, es como si no hubiera tiempo, empezamos a hablar como si fuera ayer. Eso es una amistad de verdad, alguien que te vio en el fondo y te levantó sin pedirte nada a cambio.

**Biógrafo** `[M3.8 + AY1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Narrador** `[AY1]`: Roberto, el dueño de la boutique. Cuando me separé de Raúl, fue un caos. Yo no sabía cómo vivir sin un ingreso, cómo pagar el alquiler, la comida de los chicos. Raúl no me pasaba nada. Un día le conté a Roberto, sin que me pidiera, que estaba en problemas. Él, sin decir nada, me dijo que me daba un adelanto de dinero, sin interés, sin nada. Me dio una cantidad que me permitió respirar durante un par de meses. Después cuando empecé a tener ingresos de nuevo, le comencé a devolver. Pero lo importante fue que en el momento que lo necesité, alguien confió en mí, me ayudó sin juzgarme. Años después, cuando Roberto tuvo problemas con su familia, yo estuve para él, lo visité, lo escuché. No fue dinero, pero fue tiempo, fue presencia. Eso es lo que significa ayudar de verdad, confiar en la otra persona sin condiciones.

**Biógrafo** `[M3.1 + AS9]`:
> Gracias, Chela. Ya lo guardé.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Narrador** `[AS9]`: Mis tres hijos, Julián, Paula y Federico. Hugo, mi novio, porque es parte de mi vida ahora. Sofía si está en el país, porque es mi hermana de corazón. Mi hermano Fernando, porque es mi compañero de infancia. Y mis cuatro nietos, porque para mí el futuro está en ellos. Alrededor de esa mesa estaría toda la gente que me importa, la gente que ve quién soy sin necesidad de que les explique nada. Les haría de comer algo rico, algo que se me ocurra en el momento, no algo muy armado. Y nos caeríamos de risa contando historias, hablando de la vida, de las cosas tontas. Eso sería mi cena perfecta, no necesito lujos, necesito que la gente que amo esté ahí, comiendo, hablando, siendo feliz. Eso es todo.

**Biógrafo** `[M26 + CI10]`:
> Gracias, Chela.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquila.

**Narrador** `[CI10]`: Paso, creo que está todo. La gente importante está, los amigos del trabajo, los hermanos, mi gente. Eso es lo que importa.

## Bloque 11 · Pérdidas y momentos difíciles

**Biógrafo** `[M24.1 + AV11]`:
> Gracias, Chela. Eso también va al libro.
>
> Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás.

**Biógrafo** `[PE1 + M1]`:
> ¿Perdiste a alguien importante en tu vida? Si querés, contame quiénes fueron, qué eran para vos y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE1]`: Ay sí, perdí gente importante. Mi mamá, cuando tenía veinticuatro años, fue lo más duro. Mi papá años después. Mi abuela cuando era chica, también dejó marca. Y Alberto, mi tercer marido, murió en el 2019, fue una muerte que duele pero no tanto como las otras, porque fue una vida hecha juntos, fue completa, ¿viste? Lo que me pasó es que aprendí a vivir con el dolor. No se va, pero cambias de ropa, cambias de cara, y seguís. Un momento que me gusta recordar con mi mamá fue cuando ella me ayudó a probarme un vestido para ir a una fiesta de la escuela. Me lo hizo, me lo arreglaba, me miraba y decía "vos sos hermosa, Chela, acordate siempre de eso". Ese mensaje de mi mamá me quedó, y cada vez que me veo en el espejo, pienso en eso, en lo que ella me dijo. Con mi papá, un momento fue cuando me vio a través de las vides, cuando me enseñó el oficio. Con Alberto, un viaje en auto, íbamos por la ruta, y él agarró mi mano sin decir nada. Esos momentos con la gente que murió, son los que uno guarda, los que hacen que sigan vivos adentro.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE5]`: Ay sí. Hace poco tuve un infarto leve, o un susto del corazón, no sé bien. Fue un mediodía, estaba en mi casa, sentía un dolor en el pecho que no era normal. Pensé que era indigestión, pero el dolor no se iba. Llamé a Federico, que vino rápido y me llevó al hospital. Estuve tres días ahí, con estudios, con doctores que me hablaban con palabras que no entendía. Fue asustador porque uno dice "así que esto es, así que me voy", ¿viste? Pero no, fue un susto. Estuve en observación, me dieron medicinas, y ahora estoy bien. Lo que aprendí es que la salud es lo más importante, que uno cree que es indestructible a los setenta y después dice ay, no es cierto. Hugo estuvo conmigo en el hospital, me agarraba la mano. Mis hijos vinieron todos. Fue un momento donde me vieron vulnerable, donde entendieron que me tengo que cuidar. Ahora tomo medicinas, como bien, camino, intento estar tranquila. A veces me asusta pensar en que podría pasar de nuevo, pero también le pregunto al doctor qué puedo hacer. Así se vive a esta edad, con un poquito de miedo pero mucha fe.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE4]`: La muerte de Alberto fue duro. Fueron años donde veía que se iba, la enfermedad lo estaba comiendo. Él no quería que lo viera mal, pero yo estaba ahí. Era una muerte lenta, no como la de mi mamá que fue rápida, rabioso casi. Fue una enfermedad que duró meses. Yo lo cuidaba, le daba medicinas, lo veía sufrir. Un día me dijo "Chela, quiero que cuando me vaya, vos sigas viviendo, quiero que vos estés bien". Eso me partió el corazón, porque sabía lo que se venia. Cuando murió, fue como si una parte de mi vida cerrara. No fue como con Raúl, que fue dolor y rabia. Fue un dolor dulce, porque lo amaba y él se fue tranquilo. Después fue años sin saber qué hacer conmigo misma, sin tener propósito. Viajé, estuve con mis amigos, poco a poco volví a la vida. Hugo llegó después y me ayudó a entender que todavía hay vida, que todavía tengo cosas por vivir. Eso fue lo más duro de mi vida de adulta, ver morir a alguien que amas desde adentro.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[CI11]`:
> Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.

**Narrador** `[CI11]`: Creo que está, la verdad. Ya conté lo que duele, lo que marcó, lo que me hizo quién soy.

## Bloque 12 · La historia grande

**Biógrafo** `[M24.2 + EN12]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.

**Biógrafo** `[HG1]`:
> Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día.

**Narrador** `[HG1]`: Ay, varios. El Mundial del 78, cuando éramos muy chicos todavía en Mendoza, mi papá veía los partidos en la tele con un grupo de amigos, y nosotros gritábamos. Después cuando me vine a Buenos Aires, viví más de cerca las cosas políticas de Argentina. La Guerra de Malvinas fue un lío, estábamos todos asustados, los periódicos hablaban de soldados, de muertes. Recuerdo a Roberto, mi jefe, que tenía un sobrino que se fue a la guerra. Fue terrible porque todos conocían a alguien que estaba ahí. Cuando terminó, fue una mezcla de alivio y angustia. Después el mundial del 86, viví eso con Julián y Paula, estaban chiquitos, viendo el partido en la casa, los tres gritando, Maradona era Dios. Eso fueron buenos tiempos. En los 90 pasaron cosas de política que no entendía bien, inflación, boludeces de gobierno. Pero lo que recuerdo es que uno seguía viviendo, iba a trabajar, vendía ropa, los hijos iban a la escuela. Los eventos grandes te rodean, pero tu vida sigue, es raro.

**Biógrafo** `[M3.3 + HG4]`:
> Anotado. Sigo con otra.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado.

**Narrador** `[HG4]`: Un día que recuerdo es cuando empezó el encierro, el primer día que decían que no podías salir. Yo estaba en mi casa, sola porque Alberto estaba en el hospital por la enfermedad, y de repente la tele decía que todos metidos adentro. Me asusté. Llamé a mis hijos, les dije que viniera alguien, que estaba sola y asustada. Federico llegó rápido, se quedó conmigo. Salimos al balcón, y las calles de Buenos Aires estaban vacías, las persianas bajadas de los negocios. Fue como una película de terror. Federico me dijo que nos íbamos a cuidar, que era temporal. Pasaron los días, After, los meses. Lo que más me quedó fue la soledad, aunque fuera con mis hijos cerca. No podía visitar a nadie, no podía ir a la boutique que ya había cerrado años atrás. Pasaba el tiempo mirando la tele, escuchando noticias malas. Hugo me llamaba por teléfono, pero no era lo mismo. Fue una época gris, y eso fue cuando Alberto murió, durante la pandemia, cuando ni siquiera podía llevar gente al funeral. Eso marcó esa época, la soledad, la muerte, el miedo.

**Biógrafo** `[M3.4 + DE1]`:
> Gracias por contármelo. Seguimos.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Narrador** `[DE1]`: Ay, montones. Cuando me separé de Raúl, fue como si hubiera cometido un crimen. Mi familia de Mendoza hablaba mal, decían que era un fracaso. Las mujeres divorciadas eran "esas mujeres", ¿viste? Hoy es normal divorciarse, tener pareja sin casarse, salir sola. Pero en los ochenta no era así. Un día, cuando ya estaba sola, quería ir al cine con mis amigas, sin marido, y mi papá me dijo que era peligroso, que qué iban a pensar los vecinos. Qué iban a pensar de qué, no sé. También cuando quería trabajar en la boutique, gente me decía que debería estar en la casa con los hijos, que eso de trabajar "de todas las formas" no era bien visto. Trabajar y ser madre era visto como que descuidabas a los chicos. Ahora es lo normal. Y cuando viajaba sola, o cuando tuve pareja sin casarme, la gente te miraba feo. Hoy una mujer de setenta hace lo que quiere, viaja, trabaja, anda con quien quiere, y nadie dice nada. O bueno, dicen, pero ya no te hunde.

**Biógrafo** `[M3.5 + FI7]`:
> Guardado, Chela. Te mando la próxima.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Narrador** `[FI7]`: Para mí la política es un caos. Nunca entendí bien, siempre hay gente gritando, diciendo que es lo mejor, que el otro es lo peor. Viví en Argentina durante tiempos feos, cuando había miedo en la calle, cuando la gente desaparecía, cuando después había inflación y la comida costaba cada vez más. Lo que me tocó de cerca fue cuando el dinero empezó a valer menos, cuando tenía la boutique y de repente las cosas que vendía eran cada vez más caras para la gente. Pensaba si subía mis precios o no. Y después cuando cerré la boutique, fue en parte por los problemas económicos, porque la gente no compraba como antes. Hoy en día no pienso mucho en política, me parece que todos dicen que van a arreglar y nadie arregla nada. Lo que sí pienso es en mis hijos, en mis nietos, en que vivan mejor que nosotros. Eso es lo que importa. La política viene y va, pero la familia es lo que queda.

**Biógrafo** `[M26 + CI12]`:
> Gracias, Chela.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.

**Narrador** `[CI12]`: No, creo que está. Ya conté los momentos que marcaron.

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M25.2 + EN13]`:
> Bien, seguimos.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó.

**Narrador** `[GI1]`: Ay sí, hay un momento que si pudiera vivirlo de nuevo lo haría. Fue cuando abrí la boutique. Eso fue el día que algo hizo clic en mi vida. Estaba asustada, no dormí la noche anterior, pensaba si era una locura o no. Llegué al local tempranito, abrí la persiana, prendí las luces, puse música, arreglé las cosas. Cuando abrí la puerta era como abrir una puerta a mi propia vida, a mi libertad. Entró la primera cliente, me compró algo, y en ese momento entendí que podía hacerlo, que yo podía ser dueña de algo propio, que no dependía de un hombre, de un trabajo, de nada. Fue como nacer de nuevo. Si pudiera vivir ese día una vez más, lo haría, porque fue el día que me volví a mí misma. Después pasaron cosas, buenas y malas, pero ese día fue cuando entendí que Chela era capaz de algo.

**Biógrafo** `[M3.7 + GI2]`:
> Listo, quedó guardado. Sigo.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó.

**Narrador** `[GI2]`: Ay, el día que le encaré a Raúl sobre las infidelidades. Fue un día normal, así, de esos que no esperas nada. Me desperté, Raúl ya se había ido a tocar, los chicos estaban en la escuela. Estaba limpiando cuando encontré una tarjeta de un hotel en el pantalón que mandé a lavar. Mi corazón se paró. Llamé a Raúl, le pregunté de qué era eso. Él negó, después dijo que era por un amigo. Yo le dije que no, que sabía lo que estaba pasando, que ya no podía más. Ese día fue cuando todo cambió. Él salió de la casa, volvió después, pidió perdón, pero yo en ese momento entendí que no podía seguir. Pasaron meses donde seguimos viviendo juntos pero todo estaba roto. La noche que tomé la decisión de que nos separemos, fue una noche donde no podía dormir. Me levanté a las tres de la mañana, hice café, y pensé "mañana le digo". A la mañana siguiente, le dije que esto se acababa. Fue tranquilo, casi frío de mi parte. Ese día, aunque fue duro, fue el día que recuperé mi dignidad, que entendí que no merecía vivir así. No había vuelta atrás.

**Biógrafo** `[M3.8 + HJ1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Narrador** `[HJ1]`: La actuación. Quería ser actriz de verdad, estar en películas, en teatro importante, viajar, ser famosa, boludeces así. Cuando llegué a Buenos Aires lo tenía claro, eso era todo para mí. Pero la vida no me lo permitió. Trabajar de día, estudiar de noche, no tenía dinero, no tenía tiempo, después quedé embarazada, tuve que estar con los chicos. Un día, estaba viendo una audición para una película, tenía edad para hacerla, pero estaba agotada. Era el momento de elegir: ir a la audición y dejar a los chicos, o quedarse con los chicos. Elegí a los chicos. Eso fue el día que entendí que actriza no iba a ser. Fue un día gris, me acuerdo de estar en la casa, sola, cuando todos estaban en la escuela, y lloré. Lloraba de rabia, de frustración, de entender que mis sueños de diecinueve años no iban a ser. Pero después pasó el tiempo, hice la boutique, y encontré otra forma de expresarme. No fue el teatro, pero fue algo mío. Eso es lo que aprendí, que a veces los sueños cambian, y está bien, porque la vida te da otras oportunidades si estás abierta.

**Biógrafo** `[M3.1 + GI9]`:
> Gracias, Chela. Ya lo guardé.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquita frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor.

**Narrador** `[GI9]`: Ay sí. Fue en Italia, en las sierras de Toscana donde fui con Alberto. Estábamos en un pueblo chiquito, de noche, y salimos a caminar. El cielo estaba lleno de estrellas, más estrellas de las que había visto en mi vida. Buenos Aires tiene un cielo contaminado, no ves mucho. Pero ahí, en Italia, el cielo estaba de verdad, gigante, infinito. Me detuve, y sentí que era un punto, nada, polvo. Alberto me agarraba la mano, pero yo estaba pensando en toda mi vida, en los años que pasaron, en todo lo que hice, y sentí que era tan chiquito comparado con eso, con ese universo. Me largué a llorar. Fue de esas lágrimas que no sabés de dónde vienen. Alberto me preguntó si estaba bien, y yo le dije que sí, que estaba viendo cosas grandes. Eso me cambió un poco la perspectiva. Entendí que mis problemas, mis angustias, eran chiquitos frente a la vastedad de la vida. Ahora, cuando ando depresiva, me acuerdo de esa noche en Italia, y respiro un poco mejor.

**Biógrafo** `[M3.2 + FI1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos misma? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Narrador** `[FI1]`: La soledad tiene un papel importante. A mi edad necesito momentos solos, para pensar, para estar conmigo misma. Un momento que me acuerdo es cuando cerraba la boutique y quedaba sola un rato, antes de irme. Apagaba la música, la luz, y me quedaba sentada en el mostrador, viendo la ropa que había vendido durante el día. Pensaba en las mujeres que la llevaban, en cómo se veían, en si estaban felices. Eso me daba paz. También un viaje que hice sola a Córdoba, sin los chicos, sin Alberto, nomás yo. Estuve en un hotel, salí a pasear, me senté en una plaza, tomé un café. Estaba sola pero no me sentía sola, ¿entendés? Me sentía acompañada por mí misma. Es raro decirlo, pero cuando empecé a estar bien conmigo, la soledad no fue un castigo, fue un lujo. Ahora con Hugo disfruto mucho, pero también valoro cuando él se va a su casa y yo puedo estar en la mía, tranquila, sin tener que hablar de nada.

**Biógrafo** `[M3.3 + FI2]`:
> Anotado. Sigo con otra.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Narrador** `[FI2]`: Ay, un día que estaba en la boutique, entraron unos chicos de unos veinte años, pareja, y me pidieron si les podía ayudar a buscar algo para ella. Yo empecé a mostrarles cosas, daba consejos sobre qué le quedaba bien. En un momento uno de los chicos, el novio, me preguntó algo y me dijo "señora". Señora. Yo me quedé ahí, como si me hubiera golpeado. ¿Cuándo pasé a ser "la señora"? Antes era "la chica", "la muchacha". Un momento que duró un segundo cambió mi manera de verme. Salieron del local, y yo me miré al espejo que había en la pared. Vi mis manos con manchitas, vi mis arrugas, vi que sí, que era una señora. Después lloré un rato, pero fue de esos lloros que te liberan, porque acepté que el tiempo había pasado y que no tenía nada de malo. Ahora tengo setenta y uno, y a veces la gente me dice "abuela", y eso sí que me gusta más que "señora".

**Biógrafo** `[M3.4 + FI3]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Narrador** `[FI3]`: Mi mamá y mi papá me dieron cosas. De mi mamá heredé la capacidad de crear, de hacer cosas con mis manos, de darle belleza a lo simple. Lo veo en cómo hago la ropa en la boutique, cómo arreglo mi casa. De mi papá heredé la terquedad, la capacidad de luchar contra todo, de no rendirse. Él se quedó sin nada, con una viña, y se hizo un hombre. Eso está en mí. Un momento que lo vi claro fue cuando estaba cerrando la boutique, me sentía fracasada, y pensé en mi papá. ¿Qué hubiera hecho él? Hubiera agachado la cabeza, hablado con el vendedor, visto qué se podía hacer. Yo hice eso, hablé con la gente, arreglé todo, cerré bien. De mis hermanos heredé el humor, la manera de reírse de las cosas. Mi papá decía boludeces en los momentos más serios, y yo hago lo mismo, me río cuando debería estar triste. Eso viene de familia, de Mendoza, de esa manera de no tomarse todo tan en serio. Eso es lo que me salvó, la capacidad de reír.

**Biógrafo** `[M3.5 + FI4]`:
> Guardado, Chela. Te mando la próxima.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Narrador** `[FI4]`: Cuando era joven me importaba un montón. Quería que todos me vieran, que me aprobaran. Por eso estudié teatro, por eso quería ser famosa, para que la gente me viera y dijera "mirá qué buena". Un día, era fiesta en la escuela, tenía que decir un discurso, y me puse nerviosa porque pensaba qué iba a pensar la gente de lo que decía. Después crecí, y pasé por cosas que me hicieron darme cuenta de que el que te ama, te ama igual, y el que no, no. A los cuarenta y tantos, cuando tuve la boutique, me dejé de importar. Vendía ropa cara, algunos pensaban que era pretenciosa. Otros pensaban que era una buena empresaria. A mí me importaba que mis clientes estuvieran felices, nada más. Ahora a los setenta, me importa lo que piensan mis hijos y mis amigos. Eso es todo. Si alguien opina de mi vida, mi forma de vestir, mi relación con Hugo, me importa un bledo. Pasé mucha vida preocupándome de lo que dirían, era una pérdida de tiempo. La vida es muy corta para vivirla para los demás.

**Biógrafo** `[M3.6 + FI6]`:
> Lo tengo. Vamos con otra.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Narrador** `[FI6]`: Ay, no sé. Probablemente sea un quilombo, con máquinas haciendo todo, la gente sin saber cómo es un abrazo de verdad, sin tocarse. Lo que me asusta es que se pierda la familia, que todo sea por teléfono, por máquinas. Que nadie sepa qué es cocinar para alguien, qué es decirle a tu hijo que lo amás mirándolo a los ojos. Lo que quiero que quede es el amor. Que mis nietos, cuando sean abuelos, sepan que el amor es lo importante, no la plata, no las cosas. Que se acuerden de mí, de que su abuela les enseñó a jugar con trapo viejo y sentirse hermosos. Que sigan siendo felices, eso es todo lo que pido. El mundo va a cambiar, va a haber cosas que no entiendo, pero si la gente sigue amándose, creo que sobreviven.

**Biógrafo** `[M26 + CI13]`:
> Gracias, Chela.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquila.

**Narrador** `[CI13]`: No, creo que está todo. Hablé de casi todo, de lo bueno y lo malo. Pasé hambre de historias.

## Bloque 14 · Hoy

**Biógrafo** `[M24.3 + EN14]`:
> Bien, Chela. Lo sumo a lo que ya me contaste de eso.
>
> Dejamos el pasado un rato y venimos a hoy: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Narrador** `[HO1]`: Ay, ayer fue un día de esos. Me desperté a las seis de la mañana, como siempre, mis articulaciones duelen. Hago un ejercicio que me enseñó el doctor, estiro, camino un poco por la casa. Después preparo café, me siento en el balcón a mirar la calle, la gente yendo a trabajar. A veces Hugo duerme aquí, ayer no durmió, así que fue solo yo. Desayuno, tomo mis medicinas, una multitud de pastillas. Después salgo a caminar, llego a La Boca si puedo, me siento un rato. Vuelvo, hago la comida, something simple, una pasta, una sopa. Después llama alguno de los chicos, hoy fue Federico, le pregunto cómo está, si come bien. Descuelgo, veo un poco de tele, alguna serie que me gusta. Hugo llegó sobre las ocho de la noche, traía flores, boludeces así. Comimos juntos, hablamos de nada importante, nos reímos. Después se fue a su casa. Me acosté, leí un poco, a las diez apagué la luz. Eso es un día mío, simple, sin drama. Antes eran días llenos de cosas, ahora son días vacíos de obligación pero llenos de paz. Me gusta, es lo que me merezco.

**Biógrafo** `[M3.8 + HO2]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado.

**Narrador** `[HO2]`: Ay, mis nietos me hacen reír. Hace poco vino Santiago y Paula, la hija de Paula, y hacíamos la moda de abuela. Paula metió un sombrero viejo mío en la cabeza, y se veía como una vendedora de frutas en el mercado, con el sombrero gigante. La nena se largó a reír, yo me largué a reír. Hugo que estaba ahí también se reía, sin saber bien por qué. Fue un momento tonto, de esos que no tienen importancia pero que llenas los ojos de luz. También me hacen reír mis amigas cuando nos juntamos, nos acordamos de las boludes que pasamos, de los hombres que tuvimos, los errores. Una vez nos estábamos acordando de cuando íbamos al cine de jóvenes, y una se acordó que yo quería agarrar un chico y casi me veo con el novio de mi amiga. Eso hace poco pasó en una junta, y nos morimos de risa. La risa es lo que me gusta ahora, cualquier risa, boba, importante, no importa. Eso es lo que queda, después de todo.

**Biógrafo** `[M3.1 + HO5]`:
> Gracias, Chela. Ya lo guardé.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Narrador** `[HO5]`: La libertad. La libertad de no tener obligaciones, de hacer lo que quiero cuando quiero. Hace tres días fui al cine nomás, sin avisar a nadie, sin pensar si alguien me necesitaba. Me senté, vi una película, salí feliz. Después fui a un café con una amiga, sin hora de llegada, sin apuro. Eso es lo que me gusta, la libertad que conseguí de grande. También me gusta saber que tengo a mis hijos cerca, que me llaman, que se preocupan. Pero una libertad de no tener que cuidarlos, ellos se cuidan solos. Hugo me gusta porque está, pero no está, cada uno en su casa, sin drama. Eso es lo mejor de la vida de ahora, la tranquilidad de no tener que luchar constantemente. Toda la vida luché, trabajé, cuité, lloré. Ahora puedo respirer. Hace poco, estaba sentada en mi casa, mirando por la ventana, tomando un café, y pensé "estoy en paz". Eso fue lo que más me gustó de esta semana, ese momento de paz absoluta.

**Biógrafo** `[M3.2 + CO1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Narrador** `[CO1]`: Las empanadas. Mi mamá me enseñó a hacerlas, desde chica. Ella me metía en la cocina, me mostrada cómo hacer la masa, cómo rellenar, cómo cerrar para que no se abran. Las mías salieron bien, ahora mis amigas y mis hijos me piden que las haga. Un día, hace poco, invité a los chicos a comer, y preparé empanadas. Mis hijas, Paula, las probó y me dijo "mamá, las tuyas siguen siendo las mejores". Eso me tocó el corazón porque significa que las hice bien, que el que mi mamá me enseñó quedó en mí y pasó a ellos. Federico comió tres, Hugo comió mucho. Mi mamá de alguna manera estuvo en la mesa ese día, a través de las empanadas. Eso es lo que me encanta de cocinar, que es como dejar un pedazo de vos en la gente que amas.

**Biógrafo** `[M3.3 + HO9]`:
> Anotado. Sigo con otra.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Narrador** `[HO9]`: Vivo en un depto en Palermo, cerquita de donde fue mi boutique. Es un lugar que conozco como la palma de mi mano, tengo historia ahí. El depto es chiquito, cómodo, me organicé bien con los muebles que tengo desde hace años. Las paredes las pinté de colores que me gustan, tengo fotos de los chicos y los nietos. El balcón es lo mejor, doy a una calle con árboles. El barrio es lindo ahora, lleno de bares, de gente joven, de movimento. Me gusta estar en un lugar con vida. Un momento de estos días: estaba en el balcón, de mañana, y pasaba la gente yendo al trabajo. Una pareja joven caminaba tomada de la mano, sonriendo. Yo me acordé de cuando era joven yo, cuando caminaba como esa chica. Me dio nostalgia pero también paz, porque viví eso, ahora me toca verlo desde otro lado. Mi depto es pequeño pero es mío, tiene mis historias, mis recuerdos. Es lo que quería cuando me vine a Buenos Aires a los diecinueve.

**Biógrafo** `[M26 + CI14]`:
> Gracias, Chela.
>
> Con esto cerramos lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquila.

**Narrador** `[CI14]`: No, creo que ya dije todo. Mi vida de ahora es simple, está todo bien.

## Bloque 15 · Legado y cierre

**Biógrafo** `[M24.4 + EN15]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Ya estamos en la última parte, Chela: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Narrador** `[LE1]`: Mis hijos. De verdad. Pasé lo que pasé, pero saqué adelante tres hijos, solos cuando fue necesario. Julián es un hombre de bien, Paula es una madre amorosa, Federico me ayuda sin que le pida. Eso es lo que me da orgullo. El día que me di cuenta fue cuando Federico empezó a trabajar, ganaba su propio dinero, y me dijo que me iba a ayudar con los gastos de la casa. Yo no le pedía nada, pero él quería hacerlo. En ese momento entendí que mis hijos no solo salieron adelante, sino que se volvieron buenas personas. Criaron a sus hijos así, la cadena continuó. La boutique fue importante, pero los hijos son el legado verdadero. Eso es lo que me enorgullece más, que la gente me vea en mis hijos, que vea que hicimos bien algo. Ellos son mi victoria más grande.

**Biógrafo** `[M3.5 + LE2]`:
> Guardado, Chela. Te mando la próxima.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos misma descifraste viviendo.

**Narrador** `[LE2]`: Que no se dejen dominar por el miedo. Yo viví mucho del miedo, al fracaso, al qué dirán, a si podía o no podía. Cuando finalmente dejé el miedo de lado y simplemente actué, las cosas salieron bien. Mis hijos tienen que entender que la vida es rápida, que no hay tiempo para lamentos. Si se equivocan, que se equivoquen. Si fracasan, que fracasen. Lo importante es que intenten, que vivan, que no se queden esperando que alguien los rescate. También quiero que sepan que la familia es lo que queda, el dinero se va, la juventud se va, pero si tienes a la gente que te ama cerca, ya ganaste. Y que se amen los unos a los otros, que no se pierdan de vista, que llamen, que visiten. Mis nietos que sepan que la abuela está aquí, que pueden contar conmigo para cualquier cosa, que no hay nada que me importe más que verlos bien.

**Biógrafo** `[M3.6 + FU1]`:
> Lo tengo. Vamos con otra.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Narrador** `[FU1]`: Ay sí, una cosa. Quiero hacer un último viaje a Europa, con Hugo si quiere venir. Quiero volver a Italia, pero esta vez con tiempo, no una semana, un mes si es posible. Quiero volver a ese pueblo en Toscana, quiero mostrarle a Hugo dónde estaba la raíz de mi abuela. Quiero verme vieja en esas calles, con mi pareja, viviendo el final de mi vida de otra manera. También quiero escribir las recetas que mi mamá me enseñó, que no se pierdan. Quiero hacer un cuaderno con las historias de mi vida, para que mis nietos las lean cuando sean abuelos. Quiero ver a mis nietos crecer más, quiero ver si se casan, si tienen hijos. Y quiero morirme en paz, en mi cama, sabiendo que viví, que no me guardé nada. Estoy ahí, en Italia, con Hugo, tomando un café en una plaza, sin prisa, sin obligación, viendo la vida pasar. Eso es lo que todavía quiero.

**Biógrafo** `[M3.7 + LE7]`:
> Listo, quedó guardado. Sigo.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Narrador** `[LE7]`: "Tres Veces Mujer", porque me casé tres veces, porque renací tres veces, porque cada ruptura fue una muerte y un nuevo nacimiento. Pero también porque fui mujer de distintas maneras: mujer amada, mujer madre, mujer trabajadora, mujer sola, mujer acompañada. Cada persona que tuve al lado me enseñó a ser una mujer distinta. Raúl me enseñó a ser madre valiente. Eduardo me enseñó a ser estable. Alberto me enseñó a ser tranquila. Hugo me enseña a ser libre. Eso es: tres casamientos, pero muchas más transformaciones. Mi vida fue una montaña rusa de siendo mujer.

**Biógrafo** `[M3.8 + M15]`:
> Escuchado. Vamos por la siguiente.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> Mamá, ¿de cuál de tus tres casamientos tenés el mejor recuerdo y por qué? Paula

**Narrador** `[FAM1]`: Paula, mi amor, el mejor recuerdo es de Alberto. Sé que el de tu papá Raúl fue intenso, apasionado, pero fue un caos. El de Eduardo fue ordenado pero chato, nos aburríamos los dos. Pero Alberto, Paula, fue diferente. Yo tenía cincuenta años, él tenía más, éramos adultos de verdad. No había drama, no había infidelidades, no había resentimiento. Cuando nos casamos fue en una sala chiquita, con ustedes, los chicos, fue íntimo y bonito. Lo que me quedó de Alberto fue la tranquilidad, la manera de amarse sin necesidad de gritar, sin necesidad de demostrar nada al mundo. Eso es lo mejor que viví en un matrimonio, Paula, porque era yo siendo yo, sin tener que ser de otra manera. Eso es lo que quiero que tengas vos, mi hija, una relación donde puedas ser la Paulita que siempre fuiste, sin cambiar. Alberto me enseñó eso, a estar en paz. Por eso ese es mi mejor recuerdo de casamiento.

**Biógrafo** `[M3.1 + FO1]`:
> Gracias, Chela. Ya lo guardé.
>
> Otra cosa, Chela. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés a mano, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Y si no encontrás ninguna, no pasa nada: el libro va igual.

**Narrador** `[FO1]`: Ay, sí, tengo fotos. Pero ahora no las tengo a mano, están en un cajón. Te voy a mandar una por WhatsApp después, cuando la encuentre. Tengo una que me encanta de cuando estaba en la boutique, de los noventa, me ves joven, sonriendo, con la ropa detrás. Tengo otra de toda la familia junta, hace poco, en un cumpleaños. Y tengo una de Beto, ese primer amor, que la guardé aunque sea boludo. Te las mando, no te preocupes.

**Biógrafo** `[M26 + LE9]`:
> Gracias, Chela.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Narrador** `[LE9]`: Ay, una cosa. Quiero que quede en el libro que la vida es un regalo, aunque sea difícil. Que es normal equivocarse, casarse tres veces, divorciarse, fracasar. Que no hay nada de malo en eso, es la vida. Quiero que mi historia le sirva a alguien que está pasando lo mismo, que está asustada, que piensa que es un fracaso. Que no lo es. Yo estoy acá, a los setenta y uno, feliz, en paz, con mis hijos crecidos, mis nietos, mi novio. Viví, cometí errores, pero viví. Eso es lo que importa.

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Narrador** `[LE8]`: A Julián, Paula y Federico: gracias por ser mis hijos, por ser quiénes son, por amarme cuando no fue fácil. Les pido que se amen los unos a los otros, que se llamen, que no se pierdan. A mis nietos: conozcan sus historias, sepan de dónde vienen, sean valientes. A Hugo: gracias por aparecer cuando me necesitaba, por enseñarme que a esta edad todavía se puede estar enamorada. A Sofía: vos sos mi hermana, seguimos siendo hermanas. A todos los que me conocen: vivan, no tengan miedo, cometan errores, amen, coman bien, canten, bailen, rían. La vida es un regalo que no se repite. Yo la viví, tuve suerte en algunas cosas, desgracia en otras, pero viví. Eso es todo lo que importa.

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Chela. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre, y es bien tuyo. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Fue un gusto enorme escucharte.
