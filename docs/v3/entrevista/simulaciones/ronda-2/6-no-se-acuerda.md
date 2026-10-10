# Ronda 2, simulación 6: la que no se acuerda (Elsa, 80, inventada)

**Qué es:** la entrevista de un narrador **inventado** (Elsa), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Plan: [`PLAN.md`](PLAN.md).

**Cuenta:** 90 preguntas del banco contestadas + 1 de la familia · **136 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

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

**Narrador** `[OR1]`: Ay, bueno, según me contaba mi mamá, ella y mi papá estaban muy contentos. Mi papá tenía la almacén en Villaguay, le iba bastante bien por esos años. Yo llegué en el medio de varios hermanos, así que mi mamá ya tenía experiencia. Mi papá estaba muy ilusionado de tener otra hija, eso me contaba. Mi mamá trabaja todo el día en la casa, ocupándose de todos nosotros. Éramos en una casita de adobe, muy linda para ese tiempo. Era un tiempo tranquilo en Villaguay, mi papá con su almacén y mi mamá en la casa. Me decían que fue un nacimiento fácil, lloré y todo bien, los vecinos vinieron cuando nací.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Elsa. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR2]`: Ay, la historia que siempre me contaba mi mamá era la del abuelo, el papá de ella. Él llegó a Villaguay desde no sé dónde, desde lejos en todo caso, con muy poco en las manos. Consiguió trabajo en una estancia, ahorró, y después se hizo de sus tierras. Mi mamá me decía que él era un hombre trabajador, muy serio, muy de principios. Mi abuela fue una mujer muy fuerte también, ella lo apoyaba en todo. Los dos tenían esa cosa de venirse de la nada y hacer algo. Mis tíos me contaban también que el abuelo sabía de caballos, que era respetado en la zona. Pero bueno, eso era lo que me contaban. Después la vida pasó y todo cambió.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR5]`: Ay, no me acuerdo bien. Me parece que fue en algún baile, o puede ser que se hayan conocido por alguien de la zona. Mi papá trabajaba en la almacén desde joven, así que tal vez se la cruzó por ahí. Pero las historias de los abuelos se me confunden un poco, viste, pasó hace tanto. Lo que sí me acuerdo es que eran amigos de algunos, y que mi papá le gustaba bailar. Pero no me acuerdo los detalles bien, querido.

**Biógrafo** `[M26 + CI1 + M31]`:
> Gracias, Elsa.
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
> Ahora vamos a tu infancia, Elsa: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Narrador** `[CA1]`: Mi primer recuerdo... Ay, me veo en el patio de la casa, debe haber sido cuando tenía poquito. Yo estaba jugando con los hermanos menores en la tierra, haciendo unos montoncitos con mis manitas. Mi mamá estaba adentro trabajando, y mi papá andaba en la almacén. Hacía calor, bastante calor, y había unas gallinas en el patio que iban y venían. Me acuerdo que me enojé con un hermano por no sé qué cosa de nada, y mi mamá me llamó desde adentro. Era una casa grande, de adobe, con un patio que parecía no acabar nunca cuando eras chica. Y los árboles frutales al fondo, había durazneros creo.

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chica. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Narrador** `[CA2]`: Mi mamá era muy cariñosa, pero firme también. Ella tenía esa cosa de las mujeres de ese tiempo, viste, que criaban a muchos hijos a la vez y no se quejaban. Me acuerdo de ella cosiendo en la galería, con la máquina de coser manual, y yo me le pegaba en la falda. Ella me cantaba mientras cosía, unas canciones viejas que no me acuerdo cómo eran, pero sí me acuerdo de la voz. Una vez me enferma, debe haber tenido unos siete u ocho años, me acuerdo que estaba muy afebrada. Mi mamá no se me separó para nada, me ponía paños fríos en la cabeza, y todo el tiempo hablándome, calmándome. Me hacía sentir que yo estaba en las mejores manos. Ella era así, muy entregada a nosotros. Trabajaba sin parar, desde que salía el sol. Pero para sus hijos, estaba.

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chica? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Narrador** `[CA3]`: Mi papá tenía la almacén en Villaguay, un almacén de ramos generales. Yo lo acompañé varias veces cuando era chica, y me encantaba estar con él ahí. La almacén era un lugar grande, oscuro para mis ojos de chica, con mucho olor a cosas: a granos, a café, a azúcar. Mi papá estaba siempre atendiendo gente, pesando cosas en la balanza, anotando en unos papeles. Me acuerdo que yo quería tocar la balanza, me fascinaba cómo marcaba. Mi papá era muy respetuoso con los clientes, les hablaba con consideración, sabía quién era cada uno. A algunos les fiaba productos, porque eran del pueblo. Él era hombre de palabra, así lo conocía todo el mundo. Me hacía sentir orgullosa, viste, tener a mi papá así, importante en la zona.

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

**Narrador** `[CA6]`: Ay, sí, tuve varios hermanos. Éramos cinco en total, y yo estaba en el medio. Me acuerdo bien de Ramón, el mayor, él era muy serio, muy varón, siempre cuidando a los demás. Después estaba yo, y después los más chicos: Chiquita, que era mi hermana, una cosa dulce, siempre con nosotros. Y Hugo, que era muy travieso, ese sí que nos daba trabajo. Con Chiquita éramos muy unidas, viste, porque éramos las dos únicas mujeres en ese momento. Nos ayudábamos una a la otra en las tareas de la casa, y salíamos a jugar juntas al patio. Una vez nos escapamos hacia el río, cerca de Villaguay, Chiquita y yo, sin decirle a nadie. Nuestro papá se enojó mucho cuando se enteró, pero mi mamá se río. Esos eran nuestros tiempos, tranquilos, de hermanas. Los otros dos hermanos, bueno, de ellos no me acuerdo tanto bien.

**Biógrafo** `[M3.7 + CA16]`:
> Quedó guardado, Elsa. Sigo con la que viene.
>
> Contame un día de chica que esperabas con muchas ganas: qué era, quién estaba, qué pasó. Y si no te vuelve un día en particular, contame qué cosas esperabas con ganas en esa época, que con eso me arreglo.

**Narrador** `[CA16]`: Me esperaba mucho el día de la fiesta del pueblo, en Villaguay. Eso sí me acuerdo. Todos los años hacían una fiesta con música, con gente que vendía cosas para comer. Mi papá nos daba un poco de dinero para comprar algo dulce. Yo iba toda nerviosa, con mis vestiditos limpios, mirando a los otros chicos jugando. Era lindo esperar eso, viste, era lo más lindo que podía pasar en Villaguay.

**Biógrafo** `[M26 + CA17]`:
> Gracias, Elsa.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[CA17]`: Bueno, sí. Una cosa que me marcó mucho fue cuando mi abuela, mamá de mi papá, se enfermó en la casa. Yo era chica todavía, tendría unos diez años, no más. Ella vivía con nosotros, y de repente se enfermó muy grave. Toda la casa cambió. Mi mamá estaba preocupada de día y de noche, cuidándola. Yo veía a mi papá serio, callado. La gente venía a visitarla, y había un ambiente raro en casa. Mi abuela se quejaba de dolores, y yo tenía miedo. Después ella se recuperó un poco, pero quedó diferente, más débil. Eso fue duro de ver siendo chica. Me acuerdo de sentir que el mundo era más frágil, que las cosas que parecían sólidas no lo eran tanto.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Elsa. Queda guardado con cuidado.

**Biógrafo** `[CI2]`:
> Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquila, que hay tiempo.
>
> [botones: (No, está todo)]

**Narrador** `[CI2]`: [toca: No, está todo]

## Bloque 3 · La escuela y los juegos

**Biógrafo** `[M25.3 + EN3]`:
> Bien, entonces.
>
> Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad.

**Biógrafo** `[ES1]`:
> ¿Cómo fue tu primer día de escuela? ¿Quién te llevó hasta la puerta, y qué sentiste cuando se fue? Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria.

**Narrador** `[ES1]`: Me acuerdo que mi mamá me llevó. Ella caminaba conmigo hasta la escuela, que quedaba a unas cuantas manzanas de la casa. Yo estaba nerviosa, me acuerdo que tenía un uniforme nuevo, oscuro, y mi mamá me había hecho un moño. Cuando llegamos a la puerta, ella me besó en la cabeza y me dijo que fuera valiente, que me portar bien. Cuando se fue, yo me sentí un poco perdida, pero rápido entré con las otras chicas. La maestra era una señora mayor, seria, pero no era mala. Había un pizarrón negro muy grande, y letras escritas. No me acuerdo bien del nombre de la maestra, pero sí me acuerdo de sentir que era un lugar nuevo, importante.

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Narrador** `[ES2]`: Sí, la señora Inés, mi maestra de cuarto grado. Esa señora era diferente a las otras. Ella enseñaba con entusiasmo, viste, como si lo que hacía fuera lo más importante del mundo. Una vez yo cometí un error en un problema de aritmética, y en vez de regarearme como hacía la otra maestra, ella me llamó y me explicó con paciencia dónde estaba el error. Me dijo que estaba bien equivocarse, que lo importante era aprender. Eso me quedó grabado. Me alentaba a que levantara la mano en clase, a que participa. Cuando iba a la escuela, yo esperaba llegar a la clase de la señora Inés. Fue la primera persona que me hizo sentir que yo tenía capacidad de aprender, de ser algo más.

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chica, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Narrador** `[ES5]`: Sí, mi mejor amiga era Mercedes. Esa sí que fue importante. Nos conocimos en primer grado, casi desde el primer día de escuela, y de ahí en adelante no nos separamos. Mercedes era una chica muy alegre, siempre con ganas de jugar, de reír. Vívía cerca de la escuela, así que muchas tardes cuando salía de clase, yo me iba a su casa. Su mamá nos daba leche con pan dulce, y nosotras nos poníamos a jugar en el patio. Nos hacíamos unas amigas imaginarias, unas historias muy raras que teníamos, viste como los chicos. Una vez nos escapamos de la clase para ir a la plaza, y cuando volvimos nos mataron de retos. Pero eso nos hizo más amigas, nos reímos mucho después. Mercedes se mudó cuando tenía unos doce años, y eso me dolió. La verdad es que nunca más volví a tener una amiga como ella, tan de verdad.

**Biógrafo** `[M3.3 + ES6]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chica, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Narrador** `[ES6]`: Ay, bueno, una que me viene a la cabeza es cuando me robe unos caramelos de la almacén de mi papá. Yo tendría unos nueve años. Pensé que mi papá no se iba a dar cuenta, que era muy poco, pero él se dio cuenta de todo. Me llamó, me pidió que le dijera la verdad, y bueno, tuve que reconocer. Mi papá me explicó que eso no se hacía, que él nos daba lo que necesitábamos. No me pegó, pero la charla que me dio me dolió más que un castigo. Me acuerdo que después me pidió disculpas a mi papá, y él me dijo que estaba perdonada, pero que no volviera a hacerlo. Y no volví. Eso me quedó.

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Narrador** `[ES7]`: Ay, no me acuerdo bien. Me parece que en algún momento quise ser maestra, porque me gustaba la escuela y la señora Inés me había marcado. Pero después no sé, la vida fue pasando. Mis papás nunca me presionaron a nada, ellos querían que sea feliz. Yo veía a mi mamá trabajando todo el día en la casa, cosiendo, y pensaba que eso era lo natural, viste. Cuando crecés en un pueblo chico, los sueños son diferentes, más modestos. Pero no, no me acuerdo exactamente cuándo decidí una cosa u otra. La vida fue los que decidió, supongo.

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chica? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Narrador** `[ES9]`: Sí, mi casa era católica. Íbamos a la iglesia los domingos, en Villaguay. Mi mamá era muy devota, viste. Tengo muy presente el día de mi primera comunión. Tenía unos ocho años, me hicieron un vestido blanco muy bonito, con un velo. Me sentía muy importante. Mi papá, que no era tan religioso, fue igual. Toda la familia estaba ahí. Después de la ceremonia, mi mamá invitó a unas vecinas a la casa para celebrar, hicieron un locro. Fue un día especial, con la iglesia llena de chicas de mi edad. Nos habían preparado desde meses antes. Eso me quedó como algo de mucha solemnidad, como si hubiera un before y un after de ese día. Después, íbamos a la iglesia, pero no fue lo mismo. Esa ceremonia fue lo más importante de mi infancia en ese sentido.

**Biógrafo** `[M26 + CI3]`:
> Gracias, Elsa.
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

**Narrador** `[AD2]`: Ay, bueno, a esa edad yo estaba en la casa, empezaba a ayudar a mi mamá en los trabajos. Iba a la escuela, claro, pero cada vez me quedaba más tiempo en casa haciendo cosas. Mi mamá me enseñaba a coser en la máquina, porque ella cosía para afuera, para ganar dinero. Eso me gustaba, viste, el trabajo de las manos, ver como un trozo de tela se transformaba en algo. A los catorce años ya estaba ayudando a mi mamá en eso. Me acuerdo que una vez una vecina encargó un vestido muy bonito, y mi mamá me dejó que yo hiciera parte del trabajo, cosa de que yo aprendiera. Fue un vestido de fiesta, con encajes. Cuando la vecina vino a retirar el vestido y se lo puso, me sentí tan orgullosa de haber puesto mis manos en eso. Eso fue importante, viste, sentir que yo podía hacer algo que valía.

**Biógrafo** `[M3.7 + AD3]`:
> Quedó guardado, Elsa. Sigo con la que viene.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Narrador** `[AD3]`: Sí, tenía amigas. Estábamos siempre en la plaza de Villaguay, varias de nosotras. Ríamos muchísimo, viste como son los quince años, que todo te parece importante y a la vez cómico. Mi hermana Chiquita andaba con nosotras también. Íbamos a pasear, nos sentábamos en unos bancos de la plaza, mirábamos a los muchachos que andaban por ahí, y nos reíamos como tontas. Una vez fuimos a un baile que hicieron en la iglesia, y ay, qué cosa. Nosotras estábamos todas nerviosas, arregladas, con nuestros vestidos limpios. A mí me pedía un muchacho, creo que se llamaba Roberto, y yo no sabía dónde meterme de la vergüenza. No fui al baile porque me daba mucha vergüenza. Pero mis amigas sí fueron y después me contaban todo. Esa edad fue linda, pero también complicada, como cuando los cuerpos empiezan a cambiar y vos no sabés bien cómo manejarte.

**Biógrafo** `[M3.8 + AD5]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche. Y si la primera no te vuelve, contame cómo eran esas salidas en general.

**Narrador** `[AD5]`: La primera vez que salí a un baile de noche, me acuerdo que estaba nerviosa toda la tarde anterior. Mi mamá me ayudó a hacerme los rullos para tener el cabello rizado, y después me peiné con cuidado. Me puse un vestido que mi mamá había cosido, algo más arreglado, de color celeste. Mi papá no quería que saliera, pero mi mamá le convenció. Fui con mis amigas, caminando por las calles oscuras de Villaguay hasta la casa donde hacían el baile. Adentro había música, bastante gente. Yo estaba tímida al principio, pero después me soltó un poco. Bailé con un muchacho que me invitó, y aunque me daba vergüenza, fue lindo. Cuando volví a casa, mi papá estaba esperándome, un poco enojado, pero también entiendo que estaba preocupado.

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Narrador** `[AD6]`: Ay, bueno, la primera persona que me gustó en serio fue un muchacho que se llamaba Andrés. Yo tendría unos diecisiete años. Él era amigo de mi hermano Ramón, así que lo veía de vez en cuando en casa. Era tímido también, y lindo. Cuando nos cruzábamos, a los dos nos daba vergüenza. Un día fuimos a la plaza con mis amigas, y Andrés estaba con otros muchachos. Él se acercó y me pidió que diera una vuelta con él. Caminamos alrededor de la plaza, y él me hablaba de sus cosas, de que quería trabajar en otra ciudad. Fue una charla simple, pero a mí me pareció lo más importante del mundo. Yo pensé que se iba a declarar, pero no. Después se mudó, y no volví a verlo. Eso me dolió, viste, como duele cuando tenés esa edad. Años después me enteré de que se había casado con alguien de otra provincia. Eso fue mi primer enamoramiento, creo.

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chica? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Narrador** `[AD12]`: Fue cuando me fui a Paraná. Yo tenía veinte años, y mis papás me permitieron ir a trabajar a una tienda en Paraná. Fue la primera vez que me iba de Villaguay, de mi casa, de mi familia. Mi mamá lloraba cuando me despedía, aunque ella nunca lo dijo directamente. Yo me fui en colectivo, sola, con una valija pequeña. Cuando llegué a Paraná, fue como entrar en otro mundo: la ciudad era más grande, había más gente, había que moverte diferente. Yo tenía que trabajar, ganar mi dinero, arreglarme sola. No estaba mi mamá para que me hiciera la ropa, no estaban mis hermanos, nadie. Eso me hizo crecer de un día para otro. Acuerdo que en el trabajo, mi jefe me pedía cosas que yo nunca había hecho, y tenía que resolverlas sola. Eso fue lo que me hizo sentir grande, realmente.

**Biógrafo** `[M26 + AD15]`:
> Gracias, Elsa.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[AD15]`: Sí, una cosa que fue difícil fue cuando me enteré de que mis papás tenían problemas económicos. Yo tendría unos dieciséis años, no era nada oficial, pero uno se da cuenta de las cosas. Mi papá era más serio, más callado. En casa había menos dinero para ciertas cosas. Por eso fue que ellos me permitieron irme a trabajar tan joven, aunque me dolía dejar la escuela. Fue duro entender que mi papá, que era tan respetado, que tenía su almacén, estaba luchando con la vida también. Eso me quitó como una inocencia, viste. Empecé a entender que la vida no era tan segura como parecía, que había que trabajar duro, que nada estaba garantizado.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquila, que hay tiempo.
>
> [botones: (No, está todo)]

**Narrador** `[CI4]`: [toca: No, está todo]

## Bloque 5 · Juventud

**Biógrafo** `[M25.3 + EN5]`:
> Bien, entonces.
>
> Pasamos a tu juventud, Elsa: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Narrador** `[JU1]`: Bueno, técnicamente me fui primero cuando tenía veinte años a Paraná para trabajar. Pero la despedida de verdad fue cuando me casé con Ernesto, en 1968. Yo tenía veintitrés años, él era empleado del correo. Nos casamos en la iglesia de Paraná, donde yo estaba viviendo. Mi papá vino desde Villaguay para la boda, mi mamá también, toda la familia. Fue una ceremonia linda, con amigos que había hecho en Paraná. Después me fui con Ernesto a una casa que él tenía, que no era grande, pero era nuestra. El día que dejé la casa de mis papás en Villaguay, mi mamá me abrazó un largo rato, lloraba sin hablar. Mi papá me dijo una sola cosa: que fuera fuerte y que cuidara a Ernesto. Eso es lo que recuerdo, sus palabras. Era como que él me confiaba mi vida a otro hombre. Fue un momento grande, viste.

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Narrador** `[JU2]`: No seguí estudiando, la vida no daba para eso. Me fui a trabajar a una tienda de ropa en Paraná cuando tenía veinte años. Mi trabajo era arreglar las vitrinas, recibir ropa nueva, atender clientes. Aprendí sobre telas, sobre cortes, sobre qué le quedaba bien a cada persona. Me iba bien en el trabajo, el dueño me daba más responsabilidades. Conocí amigas allá, mujeres que estaban solas también, como yo. Vivía en una pieza que alquilaba, muy modesta, pero era mía. Después que conocí a Ernesto en una de las calles de Paraná, todo cambió. Él era un hombre serio, de trabajo, empleado del correo. Cuando nos casamos dejé el trabajo de la tienda, porque Ernesto quería que yo esté en casa. Así que esa época de trabajadora en Paraná fue corta, pero me dio mucha experiencia, mucha madurez.

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Narrador** `[JU4]`: La costura. Eso es lo que siempre fue mío. Empecé con mi mamá de muy chica, como te conté, pero aprendí de verdad cuando tenía unos quince o dieciséis años. Mi mamá me decía: "Mirá cómo hago esto", y yo miraba cómo sus manos iban rápido en la máquina, cómo medía la tela, cómo cosía recta. Me dejaba hacer los trabajos más simples al principio: un doblez, un ojal. Después me encomendó cosas más complicadas. Pasé horas con ella, viendo cómo trabajaba para la gente del pueblo. Cuando me casé, Ernesto me compró una máquina de coser nueva, y fue como si me regalara el mundo. Empecé a coser para los clientes de Paraná, hice amistades así. Algunos me encargaban vestidos, otros arreglaban ropa vieja. El dinero que hacía era mío, y eso fue muy importante. La costura me permitió tener una vida, una identidad. Fue mi forma de demostrar que yo tenía valor, que mis manos podían hacer algo importante.

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Narrador** `[JU5]`: No, nada de eso. Pero la disciplina en mi casa fue muy fuerte, viste. Mi papá era de los que cuando hablaba, obedecías. No gritaba, pero su palabra era ley. En la escuela también había maestras muy estrictas. Las monjas de la escuela de la primaria eran así, muy disciplinadas. Pero nada militar, no.

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Quedó guardado, Elsa. Sigo con la que viene.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Capaz ya me contaste algo de esa mudanza; ahora contame la llegada: el primer día, dónde dormiste esa noche, quién te esperaba y qué fue lo que más te costó.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, me mudé) (No, nunca me mudé)]

**Narrador** `[JU8]`: [toca: Sí, me mudé]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[JU8]`: Ay, sí. Me mudé de Villaguay a Paraná cuando tenía veinte años. Mi primer día fue algo que no me olvido. Bajé del colectivo en el centro de Paraná, y me quedé parada un rato mirando alrededor. Había tanta gente, tanta movida. Las casas eran más grandes, más altas. Yo me sentía como una chica de pueblo perdida. Una tía de mi mamá vivía ahí, así que fui a su casa. Ella me esperaba, porque mi mamá le había mandado un telegrama. Esa noche dormí en una pieza que ella me prestó, muy modesta, pero era donde empezaba mi nueva vida. Lo que más me costó fue acostumbrarme al ruido, a las luces de noche, a los autos. En Villaguay todo era tranquilo, oscuro. Acá todo era diferente. También me costó mucho dejar a mi familia, a mis amigos. Pero tenía que ser valiente, como me había dicho mi papá.

**Biógrafo** `[M3.8 + JU12]`:
> Te escuché bien. Vamos por la siguiente.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue? Si la noche justa no te vuelve, contame cómo eran los primeros tiempos ahí. Y si nunca te fuiste de la casa de tus viejos, contame el día en que esa casa pasó a ser tuya, o el rincón que siempre fue tuyo.

**Narrador** `[JU12]`: Mi primer lugar de verdad fue una pieza pequeña que alquilaba en Paraná. Muy chica, con una cama, una pequeña mesa, una silla. La dueña de la casa me dejaba usar la cocina compartida. Por la ventana veía la calle, las personas pasando, otros edificios cercanos. No era nada especial, pero era mío. Yo lo arreglé poco a poco con lo que podía. Colgué un cuadro que había traído de Villaguay, una imagen de un santo. Me compraba flores de vez en cuando para poner en una botella, aunque fuera una flor sola. Esa primera noche que dorm ahí sola, me acuerdo que lloré un poco, por la nostalgia. Pero después fue lindo sentir que yo podía estar ahí, que yo había arreglado eso, que era mío solamente. Cuando me pagaban en la tienda, parte del dinero me lo gastaba en cosas para la pieza: un almohadón, una frazada mejor. Eso fue muy importante para mí, tener algo que fuera solamente mío.

**Biógrafo** `[M3.1 + JU15]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Narrador** `[JU15]`: En Paraná conocí a otras chicas que estaban solas también. Una se llamaba Rosa, trabajaba como costurera. Otra, Lidia, trabajaba en un almacén. Nos veíamos después del trabajo, íbamos a la plaza o a tomar algo en una confitería. Hablábamos de nuestras cosas, de lo que echábamos de menos de nuestras casas, de los muchachos. Una vez, Rosa me convenció de que fuéramos a un baile en un club. Yo no quería, porque estaba tímida, pero fui igual. Nos reímos toda la noche, bailamos, flirteamos con algunos muchachos. Eso me ayudó a sentirme más cómoda en la ciudad. Esas amistades fueron importantes porque me hicieron sentir menos sola. Cuando me casé con Ernesto, esas amigas desaparecieron un poco de mi vida, porque uno se mete en la vida matrimonial y los amigos se quedan atrás.

**Biógrafo** `[M26 + JU17]`:
> Gracias, Elsa.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[JU17]`: No me acuerdo bien de algún momento especialmente duro. Bueno, lo que sí fue difícil fue conocer a Ernesto y saber que iba a casarme. No era difícil por él, sino porque era una responsabilidad muy grande. Yo tenía miedo de no estar lista para ser una mujer de un hombre, para cuidar una casa, para todo eso. Tenía veintitrés años y sentía que tenía el mundo en los hombros. Pero bueno, las cosas pasaron como tenían que pasar.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI5]`:
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.
>
> [botones: (No, está todo)]

**Narrador** `[CI5]`: [toca: No, está todo]

## Bloque 6 · Amor y pareja

**Biógrafo** `[M25.2 + AM0 + M1]`:
> Bien, seguimos.
>
> Ahora vamos al amor. ¿Hubo alguien con quien tuviste una historia en serio? Si hubo, haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después te pregunto más de la primera que fue en serio, y de las que vinieron después también va a haber lugar. Y si no hubo, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, hubo) (No hubo)]

**Narrador** `[AM0]`: [toca: Sí, hubo]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[AM0]`: Bueno, como te conté, el primero de verdad fue Andrés cuando tenía diecisiete años, pero eso no llegó a nada serio. Él se fue, y yo quedé triste, pero era de chica, era diferente. Después tuve ese noviazgo corto en Paraná, con un muchacho que trabajaba en una tienda, pero tampoco fue nada importante. Pero lo que fue en serio fue Ernesto. Yo lo conocí en 1967, en una calle de Paraná. Él era empleado del correo, un hombre muy trabajador y responsable. Cuando empezamos a salir, yo enseguida sentí que era diferente. No era apasionado como uno se imagina en las novelas, pero era seguro, era constante. Nos casamos en 1968. Eso fue mi única historia de verdad, la que importó. Con Ernesto tuve cincuenta años de matrimonio, hasta que él murió en 2015. Fue mi hombre, mi compañero. Las otras cosas eran cosa de chica, viste.

**Biógrafo** `[M3.3 + AM1]`:
> Lo anoté, gracias. Sigo con otra.
>
> Vamos a la primera que fue en serio. Contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron, y qué fue lo primero que te llamó la atención de esa persona. Si ya me lo contaste cuando hablamos de tu adolescencia, decímelo y vamos a lo que sigue.

**Narrador** `[AM1]`: Nos conocimos en la calle, en Paraná. Yo iba apurada a algo, no me acuerdo bien dónde. Él estaba parado esperando a un colega que trabajaba con él en el correo. Nos cruzamos, y él me preguntó si me había caído algo, porque llevaba una bolsa y se había abierto un poco. Fue algo muy simple, pero lo hizo con una educación que me llamó la atención. Él se ofreció a ayudarme a arreglar la bolsa. Después me preguntó dónde iba, y yo le conté. Él dijo que era por el mismo barrio, así que me acompañó. Caminamos hablando, y me gustó cómo hablaba, sin mucho adorno, directo, serio. Cuando llegamos a donde yo iba, él me pidió si podía volver a verme. Fue así, simple, sin romanticismo. Pero a partir de ahí, empezamos a vernos.

**Biógrafo** `[M3.4 + AM3]`:
> Gracias por contármelo. Seguimos.
>
> Y después, ¿llegaron a armar la vida juntos: casarse, irse a vivir, lo que haya sido? Si llegaron, contame ese momento: quién lo dijo primero, o si se fue dando solo, dónde estaban, qué se dijeron. Si ya me lo contaste recién, con decírmelo alcanza.
>
> [botones: (Sí) (No llegamos a eso)]

**Narrador** `[AM3]`: [toca: Sí]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[AM3]`: Fue todo muy natural. Estuvimos de novios un poco más de un año, desde 1967. Él me llevaba al cine, a pasear, a tomar algo. Mis amigas me decían que era un hombre serio, que parecía de verdad. Yo sentía que era diferente, que conmigo era atento. Después, Ernesto me pidió que nos casáramos. No fue una sorpresa romántica, simplemente me dijo que quería que fuera su esposa, que tenía una casa, que podía mantenerme. Yo dije que sí. Fue un "sí" tranquilo, sin gritos de felicidad, pero seguro. Nos casamos en 1968 en la iglesia de Paraná, en una ceremonia simple pero bonita. Mi familia vino desde Villaguay. Después fuimos a vivir a la casa que Ernesto tenía. Fue el comienzo de mi vida de casada, y aunque no era apasionado, fue tranquilo, fue seguro. Eso es lo que yo necesitaba.

**Biógrafo** `[M3.5 + AM4]`:
> Guardado, Elsa. Te mando la próxima.
>
> Hay días que quedan grabados para siempre: el del casamiento, o el primero viviendo juntos. Contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó. Si ya me lo contaste recién, con decírmelo alcanza.

**Narrador** `[AM4]`: Ay, ese día. Lo veo claramente todavía. Fue en una mañana de octubre, hacía calor. Mi vestido de novia fue blanco, simple, hecho por una costurera amistad de mi mamá. No era un vestido grande y ostentoso, sino elegante, con un velo largo. Mi mamá me ayudó a ponerme los aretes, que eran de mi abuela. Mi papá vino de Villaguay con mi mamá. Cuando estábamos esperando en la iglesia, mi papá me tomó del brazo, y yo estaba nerviosa, temblando un poco. Él me dijo: "Mirá para adelante, hija." En la iglesia estaba Ernesto, esperando. Veía a mis amigos de Paraná, a la familia. El cura hizo la ceremonia, y cuando Ernesto me puso el anillo, sentí que entraba en una nueva vida. Después, en la casa de mi tía, hicimos una pequeña recepción. Comimos locro, bebimos vino. Mi mamá lloraba, pero de alegría. Al final del día, Ernesto y yo nos quedamos solos en la casa que era ahora nuestra. Eso fue un momento importante, el comienzo de todo.

**Biógrafo** `[M3.6 + AM13]`:
> Lo tengo, gracias. Vamos con otra.
>
> Contame una pelea que tuvieron, de esas que después dan risa: por qué fue, quién aflojó primero y cómo hicieron las paces. Si no hubo ninguna que hoy dé risa, con decírmelo alcanza.

**Narrador** `[AM13]`: Ay, sí. Una que me acuerdo es que Ernesto traía cosas a casa, ropa, herramientas, sin decirme. La casa se llenaba de sus cosas. Yo me enojé mucho una vez porque no había espacio en el armario para mi ropa. Me dice: "Elsa, hay lugar en el sótano." Y yo le grito: "¡El sótano! ¿Creés que soy un muñeco?" Nos reímos después porque fue tonto que me enoj por eso. Él me hizo un hueco para mis cosas, pero siempre fue así, un poco desorganizado. Eso nos hizo reír muchas veces después.

**Biógrafo** `[M3.7 + AM8]`:
> Quedó guardado, Elsa. Sigo con la que viene.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Narrador** `[AM8]`: Ay, sí. Hay un día que revivo en mi cabeza constantemente. Era un atardecer, después de varios años de casados. Habíamos ido a la plaza de Paraná, en silencio, tomados de la mano. No hacía falta hablar, viste. El sol se estaba poniendo, y la plaza estaba tranquila. Ernesto me paró en el medio del camino, y me miró a los ojos. Me dijo: "Elsa, estoy agradecido de haber te elegido." Eso fue todo. No fue una declaración romántica, pero fue lo más importante que me dijo nunca. Porque Ernesto no era de palabras dulces. Me besó en la frente, y seguimos caminando. Después compramos helado y nos sentamos en un banco. Ese momento, para mí, fue todo lo que necesitaba saber: que él era feliz conmigo, que yo había hecho bien en decir que sí. Es algo que guardo como el tesoro más grande de mi vida con él.

**Biógrafo** `[M26 + AM9 + M1]`:
> Gracias, Elsa.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, hubo un final) (Seguimos juntos) (Paso esta)]

**Narrador** `[AM9]`: [toca: Sí, hubo un final]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[AM9]`: Ernesto murió en 2015. Habíamos estado juntos cincuenta años, casi. Él se enfermó, fue algo del corazón. Pasó rápido. Uno sabe que estas cosas van a venir, que los años pasan, pero cuando llega, es como si no lo esperaras, viste. Yo estaba con él en el hospital, en su cama, y en un momento dejó de respirar. No hubo drama, fue tranquilo, como él. Después todos sus amigos, la familia. Mis hijas lloraban, mis nietos. Yo no sé si lloré, creo que estaba en shock. Lo único que podía pensar era que se fue mi compañero, la persona que me acompañó toda la vida adulta. Después de eso quedé en la casa sola. Mis hijas me pidieron que me fuera con ellas, pero yo quería quedarme en la casa donde había vivido con Ernesto. Con el tiempo, Claudia, mi hija, empieza a venir todos los días. Eso me ayudó a sobrevivir esos años.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[AM19]`:
> Y después, cuando quedaste por tu cuenta, ¿cómo fueron esos primeros tiempos? Qué cambió en la casa y en los días, quién anduvo cerca. Si ese tiempo es el de ahora, contame igual cómo lo estás llevando. Y si no hubo un tiempo así, con decírmelo alcanza.

**Narrador** `[AM19]`: Fue muy duro al principio. La casa se quedó silenciosa. Yo me levantaba, y Ernesto no estaba. Iba a la cocina esperando ver sus cosas, y nada. Los primeros meses no sé cómo hice. Creo que Claudia, mi hija, fue lo que me salvó. Ella empezó a venir todos los días a visitarme, a ayudarme con las cosas. Me traía comida, me ayudaba a limpiar. Paulatinamente, la rutina empezó a cambiar. Yo dejé de coser para afuera, porque mi vista no es tan buena, y me cuesta más. Ahora paso muchas horas sola, en la casa. Veo tele, sigo cosiendo un poco, cosas chiquitas. Mis amigas de esa época ya no están, la mayoría se murieron. Pero tengo a mis hijas, a mis nietos. Claudia sigue viniendo todos los días, es como si no se fuera de mi lado. Es lo que me mantiene viva, que alguien te visite, que te hable, que te demuestre que estás ahí.

**Biógrafo** `[M3.1 + AM16]`:
> Gracias, Elsa. Ya lo guardé.
>
> Y más adelante, ¿hubo otro amor? Si hubo, contame del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado.
>
> [botones: (Sí, hubo otro) (No, nadie más)]

**Narrador** `[AM16]`: [toca: No, nadie más]

**Biógrafo** `[M25.3 + AM14]`:
> Bien, entonces.
>
> ¿Hubo algún amor que te marcó, aunque haya durado poco o no haya llegado a nada? Si lo hubo, contame cómo se cruzaron y el momento que más te acordás de esa persona. Y si no hubo, con un no alcanza.

**Narrador** `[AM14]`: Sí, Andrés. Como te conté, fue mi primer amor de verdad, de adolescente. Aunque no llegó a nada serio, me marcó. Años después, me enteré que se había casado, que tenía hijos. A veces pienso en él, en cómo habría sido la vida si él no se hubiera ido. Pero bueno, la vida sigue otro camino. Andés me enseñó lo que era sentir algo por alguien que no sea tu familia. Eso es importante cuando sos chica, viste, ese primer sentimiento.

**Biógrafo** `[M26 + CI6]`:
> Gracias, Elsa.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI6]`: [toca: No, está todo]

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M25.1 + EN7]`:
> Bien, seguimos.
>
> Ahora vamos al trabajo y a tu oficio, Elsa: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Narrador** `[TR1]`: Claro, era muy chica. Debe haber tenido unos ocho años cuando mi mamá me pidió que la ayudara a lavar la ropa. No era trabajo para ganar dinero, era parte de ser parte de la familia. Hacíamos la ropa en una batea, con agua y jabón. Era duro para mis manitas, pero yo lo hacía. Después, cuando ya tenía más edad, empecé a ayudar a mi mamá con la costura. Ella me decía: "Vos hembrás este bajo, yo te pago." Y me daba unos centavos. Eso fue importante, ganarme mi dinero de verdad. Con ese dinero, me compraba cosas para mí, un peine, cinta. Cuando tenía diecisiete años, empecé a trabajar en la tienda en Paraná, y ahí ganaba un sueldito. Parte lo mandaba a casa, parte me lo quedaba para mí.

**Biógrafo** `[M3.3 + TR6]`:
> Lo anoté, gracias. Sigo con otra.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Narrador** `[TR6]`: Bueno, cuando era joven, trabajé en la tienda de ropa en Paraná, eso fue de los veinte hasta los veintitrés años. Después me casé con Ernesto, y dejé ese trabajo. Pero no dejé de trabajar, viste, empecé a coser para afuera. Eso fue durante toda mi vida de casada, prácticamente. Cosía en la casa, tenía mis clientes, ganaba un dinero. Cuando Mónica y Claudia eran chicas, yo cosía en las noches después que se dormían. Eso fue lo que más me quedó grabado: la máquina de coser, el sonido que hace, la sensación de mover la tela bajo la aguja. Era como si la máquina y yo fuéramos una sola. Eso me definió por muchos años, hasta que la vista me empezó a fallar. Ahora que ya no puedo coser tanto, me siento un poco perdida. La costura fue mi trabajo, mi oficio, mi vida.

**Biógrafo** `[M3.4 + TR2]`:
> Gracias por contármelo. Seguimos.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Narrador** `[TR2]`: Un día común era así: Me levantaba temprano, hacía el desayuno para Ernesto, después lo acompañaba hasta la puerta. Las chicas iban a la escuela, yo las ayudaba a prepararse. Cuando se iban todas, me quedaba con la casa vacía. Empezaba con las tareas de la casa: limpiar, lavar platos. Después, alrededor de las diez de la mañana, me sentaba a la máquina de coser. Tenía varios encargos: un vestido en confección, unos arreglos a un pantalón, un bordado. Las horas pasaban rápido. A veces venían las clientes a buscar su ropa, entraban a la casa, me pagaban. Yo seguía cosiendo hasta que era hora de hacer el almuerzo. Almorzábamos todos juntos cuando volvían de la escuela. Después, nuevamente la máquina. Por la tarde, cosía hasta que tenía que dejar todo listo para que Ernesto volviera, para cocinar la cena. Por las noches, después que se dormían todos, me sentaba nuevamente a la máquina, por una hora o dos. Era agotador, pero era mi vida.

**Biógrafo** `[M3.5 + TR3]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Narrador** `[TR3]`: Claro, mi mamá. Ella fue todo. Me enseñó a coser, a trabajar, a ser mujer. Sin mi mamá yo no habría sido nada, viste. Ella se levantaba antes que el sol, cosía para los clientes, cuidaba a todos nosotros, hacía la comida. Un día que recuerdo muy bien: yo tenía unos dieciocho años, y una cliente quería que le arreglara un vestido de novia muy complicado. Mi mamá me vio nerviosa, y me sentó. Me dijo: "Elsa, vos podés hacer esto. La máquina es solo una herramienta, pero vos tenes las manos y el corazón. Si vos le ponés corazón a lo que hacés, sale bien." Yo lo hice, y quedó perfecto. Mi mamá me abrazó cuando terminé. Eso fue como una bendición, viste. A partir de ahí, yo sentí que podía hacer cualquier cosa que ella me enseñara. Sin ella no sería la persona que soy.

**Biógrafo** `[M3.6 + TR5]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Cuál fue el día de trabajo del que estás más orgullosa? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo. Y si no te viene un día puntual, contame de qué parte de tu trabajo estás más orgullosa.

**Narrador** `[TR5]`: Un día que nunca voy a olvidar fue cuando una cliente importante de Paraná me pidió que le hiciera un vestido de fiesta muy complicado. Tenía bordados, tela cara, todo tenía que ser perfecto. Yo trabajé semanas en ese vestido, de noche, estudiando cada punto. Cuando ella vino a retirar el vestido, se lo probó, y de verdad se vio hermoso. Ella lloró, me abrazó. Me dijo que era lo más lindo que le habían hecho nunca. Después supe que lo usó para una fiesta importante, y todos sus amigas le preguntaban quién se lo había hecho. Eso fue lo que me hizo sentir que yo tenía talento, que mis manos podían hacer algo importante. No fue por el dinero que me pagó, sino por saber que yo había creado algo que la hacía feliz. Ese día entendí por qué yo nací para coser.

**Biógrafo** `[M26 + TR11]`:
> Gracias, Elsa.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.
>
> [botones: (Paso esta)]

**Narrador** `[TR11]`: Sí, hubo momentos. Cuando éramos jóvenes, en los años setenta, pasamos unos tiempos difíciles en el país, y Ernesto a veces tenía períodos donde el correo tenía poco trabajo. Yo cosía más para poder ayudar con los gastos. Un invierno me acuerdo bien: hacía mucho frío, no teníamos dinero para la leña, así que usábamos lo que podíamos. Las chicas tuvieron que usar ropa abrigada en las noches. Yo vendía lo que podía de la casa para tener dinero. Fue duro, pero no fue desesperado, porque Ernesto siempre tuvo trabajo. No pasamos hambre, gracias a Dios. Pero aprendí lo que era preocuparse por cómo ibas a llenar la mesa. Eso me hizo fuerte.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Elsa. Queda guardado con cuidado.

**Biógrafo** `[TR8]`:
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Narrador** `[TR8]`: Mi negocio era la costura, viste. No era grande, pero era mío. Empezó porque mi mamá cosía para afuera, y cuando me casé, yo seguí. Los clientes de ella empezaron a pedirme que les cosiera a mí. Después me hice de otros clientes porque mis trabajos eran buenos. No tuve un local, trabajaba desde la casa. Mis clientes pasaban por casa, me dejaban la ropa, y yo la hacía. Pagaban por encargo. No fue mucho dinero, pero fue lo mío. En los mejores años, cuando Claudia y Mónica eran chicas, yo tenía bastantes clientes, varios encargos todo el tiempo. Eso me permitió tener dinero para cosas de la casa, para ayudar. Cuando la vista empezó a fallar, tuve que dejar de coser tanto. Ahora ya no puedo.

**Biógrafo** `[M3.8 + CS1]`:
> Te escuché bien. Vamos por la siguiente.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Narrador** `[CS1]`: Ay, la cocina. Siempre me dijeron que cocino bien. Aprendí de mi mamá, como todo lo demás. Mis locros eran famosos en el barrio, viste. Una vez hice un locro para una fiesta de un amigo de Ernesto, y la gente no paraba de hablar de mi comida. Mi especialidad era el locro y los guisos. Con las chicas, yo hacía comidas especiales para sus cumpleaños, trataba de hacer algo distinto. Claudia siempre dice que sus amigas se mueren por venir a comer a casa porque cozino rico. No es que sea la mejor cocinera del mundo, pero le pongo amor a lo que hago. Eso es lo que la gente nota, cuando alguien cocina con amor para vos.

**Biógrafo** `[M3.1 + CP1]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chica o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Narrador** `[CP1]`: No, nunca trabajé en el campo. Villaguay era un pueblo, no era el campo de verdad. Teníamos un patio con árboles frutales, eso sí, pero mi papá tenía la almacén, no la chacra. Cuando me fui a Paraná, fue a la ciudad directamente. Así que no, del campo no tengo historias.

**Biógrafo** `[M3.2 + TR9]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Narrador** `[TR9]`: Sí, lo dejé. Fue gradual, pero llegó un momento en que ya no podía más. La vista empezó a fallar, las manos a doler. Hace algunos años, una cliente me pidió un vestido, y cuando empecé a coser, simplemente no podía ver bien el puntillo. Me frustré tanto. Ese fue como mi último encargo importante. Llamé a la cliente y le dije que no podía continuar. Ella entendió. Ese día fue triste para mí, porque sabía que ahí se terminaba una época. El día siguiente me levanté, y no había que coser. No me levantaba con esa ansia de sentarme a la máquina. La casa era tranquila, pero vacía. Fue duro aceptar que mi cuerpo ya no me permitía lo que mi mente quería hacer. Ahora costura cosas muy simples, arreglos chiquitos, pero no es lo mismo.

**Biógrafo** `[M26 + CI7]`:
> Gracias, Elsa.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI7]`: [toca: No, está todo]

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M25.2 + EN8]`:
> Bien, seguimos.
>
> Volvemos a la familia, Elsa, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Y si te tocó cuidarlos, contame cómo era un día de esos: qué hacías por ellos, qué te decían. Si no los tuviste cerca, contame cómo fue eso.

**Narrador** `[PG1]`: Un día que no me olvido: estaba visitando a mis papás en Villaguay, como hacía cada tanto con Ernesto. Mi papá estaba sentado, y noté que sus manos temblaban. No mucho, pero temblaban. Él siempre había sido tan fuerte, tan seguro de sí mismo. Ver eso me rompió algo adentro. Mi mamá estaba más lenta también, subía las escaleras agarrándose. Yo me ofrecí a cuidarlos, pero mis papás eran orgullosos. Decían que estaban bien. Mi papá murió cuando yo tenía unos treinta y poco años. Mi mamá siguió unos años más. Cuando ella quedó sola, yo iba frecuente, le llevaba comida, la ayudaba con las cosas. Ella vivía en Villaguay, yo estaba en Paraná, así que no era fácil. Pero cuando podía, iba. Ella se fue muriendo lentamente, y al final quedó muy frágil. Creo que fue lo más duro de mi vida adulta, ver a mis padres envejecer y desaparecer.

**Biógrafo** `[M26 + HI0 + M1]`:
> Gracias, Elsa.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Presentámelos de a uno, incluso si alguno ya apareció en lo que me venís contando: cómo se llama cada uno y cuándo llegó. Y si no tuviste, seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, tuve) (No tuve hijos)]

**Narrador** `[HI0]`: [toca: Sí, tuve]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[HI0]`: Sí, tuve dos hijas. Mónica llegó en 1969, un año después de que me casé con Ernesto. Fue una alegría grande, aunque fue difícil cuando nació. Yo no sabía nada de ser mamá, todo era nuevo. Mónica fue una beba tranquila, dormía mucho. Después llegó Claudia en 1972, tres años después. Claudia fue más activa, más despierta. Son muy diferentes las dos. Mónica siempre fue más seria, más parecida a su papá. Claudia es más alegre, más como yo. Las dos me dieron mucho trabajo, pero también mucha alegría. Mis hijas fueron lo más importante de mi vida, después de Ernesto. Dediqué años a criarlas, a trabajar para ellas, a verlas crecer.

**Biógrafo** `[M3.4 + HI2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Narrador** `[HI2]`: Ay, ese día. Me acuerdo claramente. Fue en 1969, en una madrugada. Yo estaba durmiendo, y de repente los dolores empezaron. Ernesto se despertó, se asustó un poco porque era la primera vez. Me llevó corriendo a la clínica en Paraná. Estuve muchas horas en trabajo de parto. Las enfermeras me decían que respire, que me tranquilice. Ernesto estaba afuera, esperando. No era como ahora que los papás entran. Después de horas, escuché el llanto. Una enfermera entró sonriendo, y me dijo: "Es una nena." Cuando me la pusieron en los brazos, por primera vez, me quedé mirándola. Tenía los ojos cerrados, los puñitos cerrados. Tenía todo tan chiquito. Lloré. Ernesto entró después y lloró también. Yo no sabía qué hacer con ella, tenía miedo de romperla. Pero el amor que sentí fue instantáneo. Era mío, era de nosotros. Ese momento fue lo más importante de mi vida hasta ese instante.

**Biógrafo** `[M3.5 + HI3]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Narrador** `[HI3]`: Mónica era seria de chica. Le gustaba jugar sola, con muñecas, cosas tranquilas. Era muy obediente, nunca me daba problemas. Cuando entré a la escuela, era buena estudiante. Tenía amigas, pero no era de hacer mucho ruido. Era ordenada, limpia, muy pulcra. Claudia, en cambio, fue un torbellino. Desde chica quería tocar todo, explorar. Se metía en problemas constantemente. Una vez se subió a un árbol y se cayó, se rompió un brazo. Yo estaba cosiendo cuando escuché el grito. Claudia era más cariñosa también, siempre quería estar conmigo, pegada, ayudándome a coser. Una escena que me hace sonreír: Claudia tenía cinco años, Mónica ocho. Estábamos en el patio, y Claudia estaba jugando con un charco de agua. Se mojó toda. Mónica la miraba desde lejos, seria, pensando que estaba muy sucia. Pero después Mónica se metió al charco también, y se rieron juntas como locas. Eso fue lindo, verlas divertirse juntas.

**Biógrafo** `[M3.6 + HS1]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Cómo fue criar a tus hijos? Quién estaba cerca, cómo se repartían las cosas, o si te tocó llevarla sola. Contame un día de esa época que te acuerdes bien.

**Narrador** `[HS1]`: Fue intenso. Yo no tenía quien me ayudara mucho, porque Ernesto trabajaba todo el día en el correo. Yo tenía que hacerlo todo: cocinar, limpiar, lavar ropa, cuidar a las chicas, y coser para ganar dinero. Un día típico: me levantaba muy temprano, antes que todos. Hacía el desayuno, preparaba a las chicas para la escuela, les daba de comer. Después las acompañaba hasta la escuela. Volvía a la casa y trabajaba: limpiaba, preparaba la comida. Cuando volvían de la escuela, las ayudaba con las tareas. Por la tarde, se iba a jugar, y yo cosía mientras las miraba desde la ventana. Cuando Ernesto volvía, preparábamos la cena juntos. Después, cuando las chicas dormían, yo volvía a la máquina y cosía hasta tarde. Fue cansador, pero lo hice con amor. Lo único que me molestaba a veces era que Ernesto no ayudaba mucho en la casa, ese era trabajo de mujeres para él. Pero nunca me quejé mucho. Eso era lo que se hacía en esa época.

**Biógrafo** `[M3.7 + HI6]`:
> Quedó guardado, Elsa. Sigo con la que viene.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Narrador** `[HI6]`: Con Mónica, cuando se graduó de la escuela secundaria. Ella fue a un colegio bueno, y se esforzó muchísimo. Cuando le dieron el diploma, yo estaba en el acto, y lloré de orgullo. Ver que mi hija había logrado eso, que era formada, que tenía un futuro. Eso fue enorme para mí, porque yo no había podido terminar mis estudios. Con Claudia, cuando empezó a trabajar. Claudia se metió en una escuela de enfermería, y ahora es enfermera. El día que pasó los exámenes finales, me lo dijo llorando. Yo lloré también. Mi Claudia, que era la rebelde, la que se metía en problemas, se había convertido en una profesional. Eso me hizo tan feliz. Mis hijas logaron cosas que yo no pude. Eso es lo que uno quiere como mamá: que tus hijos sean más que vos, que tengan más oportunidades.

**Biógrafo** `[M3.8 + HI8 + M1]`:
> Te escuché bien. Vamos por la siguiente.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Puede que ya los hayas mencionado; contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, llegaron) (No hay nietos)]

**Narrador** `[HI8]`: [toca: Sí, llegaron]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[HI8]`: Ay, sí. Cuando llegó el primer nieto, creo que fue el hijo de Mónica, fue emocionante. Yo estaba haciendo cosas en la casa cuando Mónica me llamó por teléfono. Me dijo que había nacido, que era un nene. Ernesto y yo nos fuimos corriendo a la clínica. Cuando lo vi, fue como si volviera a vivir ese momento que viví cuando nació Mónica. Este era mi nieto, el hijo de mi hija. Tenía la cara de Mónica, eso me pareció lindo. Lo cargué en brazos, y lloré de felicidad. Mónica me miraba sonriendo. El nieto fue abriendo un mundo nuevo para mí. Los nietos son como una segunda oportunidad de abuelo, viste. Ya no tenés la responsabilidad de criarlos todos los días, pero tenes la alegría de verlos crecer. Después llegaron más nietos, de Claudia, y cada uno fue especial. Ahora tengo cuatro nietos, y un bisnieto.

**Biógrafo** `[M3.1 + HI9]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada.

**Narrador** `[HI9]`: Mis nietos aman que yo les cuente historias. Cuando vienen a casa, se sientan conmigo, y yo les cuento cosas de cuando yo era joven, de mis papás, de Villaguay. Les cuento sobre sus tatarabuelos, sobre cómo era la vida antes. Ellos me escuchan como si fuera magia. Una vez, el más chico me pidió que le contara de cuando no había autos, de cuando había caballos. Yo le conté, y él me miraba con los ojos muy abiertos. Después me pidió que le cantara una canción que cantaba mi mamá. Yo la canté, aunque la voz no me sale como antes. Eso es lo que es de nosotros: esas historias, esas canciones. Es como si yo les pasara mi memoria, mi historia, a través de mis palabras. Eso es importante, creo.

**Biógrafo** `[M26 + CI8]`:
> Gracias, Elsa.
>
> Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI8]`: [toca: No, está todo]

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M25.3 + EN9]`:
> Bien, entonces.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Narrador** `[LU4]`: Ay, no me acuerdo bien de viajes grandes. Viajaba a Villaguay a visitar a mis papás, pero no eran viajes lejanos, eran cercanos, en colectivo. Creo que una vez Ernesto quiso llevarme a Buenos Aires, cuando las chicas eran pequeñas. Fuimos unos días. Me acuerdo que quedé sorprendida por lo grande que era la ciudad, por el río. Vimos monumentos, caminamos mucho. Pero honestamente, los detalles se me escapan. No era alguien de viajar, yo estaba más en la casa, con mis cosas. Los viajes nunca fueron lo importante en mi vida, viste. Lo importante para mí fue estar con mi familia, tener un hogar.

**Biógrafo** `[M3.3 + PA1]`:
> Lo anoté, gracias. Sigo con otra.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Narrador** `[PA1]`: La iglesia fue importante para mí. No es que sea una cosa fuera del trabajo y la familia, pero era un tiempo que era solo mío. Todos los domingos iba a la iglesia, me sentaba, rezaba. Era tranquilo, un momento de paz. Después, cuando quedé viuda, empecé a ir más seguido, casi todos los días. Era como que necesitaba ese espacio, esa conexión. Charlaba con las otras señoras que iban. A veces organizábamos rosarios, eventos de la iglesia. Eso me dio un propósito, me hizo sentir que seguía siendo útil. Ahora que estoy más grande, la iglesia es mi refugio. Voy con Claudia a veces, a misa los domingos. Es lo que me mantiene conectada con algo más grande que mi propia vida.

**Biógrafo** `[M26 + CI9]`:
> Gracias, Elsa.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquila.
>
> [botones: (No, está todo)]

**Narrador** `[CI9]`: [toca: No, está todo]

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M25.1 + EN10]`:
> Bien, seguimos.
>
> Hablemos de los amigos, Elsa, y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Narrador** `[AS1]`: Sí, una amiga muy importante fue Mirta. Nos conocimos en Paraná cuando yo estaba cosiendo para afuera. Ella vino a que le hiciera un arreglo a un vestido, en los años ochenta. Nos pusimos a hablar mientras le tomaba medidas, y enseguida sentí que era alguien especial. Mirta era viuda también, así que teníamos cosas en común. Después empezamos a vernos, no solo para costura, sino para tomar un café, para compartir charlas. Pasamos años juntas. Un día que me acuerdo bien: estábamos las dos en mi casa, cosiendo. Mirta había pasado un mal momento con sus hijos, y estaba triste. Yo simplemente la dejé hablar, la escuché. Después nos preparé té, y nos sentamos en el patio. Ella lloró un poco, y yo la abracé. No dijimos nada importante, pero fue suficiente. Eso es lo que era nuestra amistad: presencia, escucha. Mirta murió hace unos años, y la echo mucho de menos.

**Biógrafo** `[M3.5 + AY1]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Narrador** `[AY1]`: Una vez tuve un problema serio con Claudia. Ella tenía unos quince años, y se había metido en malas compañías. Estaba saliendo de noche, llegaba tarde, yo no sabía dónde estaba. Ernesto y yo estábamos muy preocupados, casi desesperados. No sabíamos qué hacer. Un día, una profesora de Claudia en la escuela me buscó. Me pidió que la visitara en su casa. Cuando llegué, ella me habló con mucho cuidado sobre lo que estaba pasando con Claudia, pero también me dijo que ella podía ayudar. Esa maestra se ofreció a seguir de cerca a Claudia en la escuela, a hablar con ella, a guiarla. Yo estaba tan agradecida. Esa maestra fue lo que nos salvó como familia. Con el tiempo, Claudia salió de eso, y ahora es la profesional que es. Yo nunca pude devolverle a esa maestra directamente lo que hizo, pero sí le mostré toda mi gratitud. Varias veces fui a visitarla, le llevé cosas que cosía para ella. Fue mi forma de decirle gracias.

**Biógrafo** `[M3.6 + AS9]`:
> Lo tengo, gracias. Vamos con otra.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Narrador** `[AS9]`: En la cabecera estaría Ernesto. Aunque no está, me gustaría que estuviera. Después, Mónica y Claudia, mis hijas. Ellas son todo para mí. Sus esposos también, aunque no sean mis sangre, porque los elegí mis hijas. Mis cuatro nietos, cada uno en su lugar especial. Después estaría Claudia en la mesa, la que me visita todos los días, porque después de Ernesto, ella es lo más importante que tengo. Invitaría también a algunos vecinos que fueron buenos conmigo, gente que me ayudó en los momentos difíciles. Si pudiera, invitaría a mi mamá también, a mi papá. Y a Mirta, mi amiga que murió. Eso sería mi mesa: mi sangre, la gente que me sostuvo, la gente que amé.

**Biógrafo** `[M26 + CI10]`:
> Gracias, Elsa.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquila.
>
> [botones: (No, está todo)]

**Narrador** `[CI10]`: [toca: No, está todo]

## Bloque 11 · Pérdidas y momentos difíciles

**Biógrafo** `[M25.2 + AV11]`:
> Bien, seguimos.
>
> Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás.

**Biógrafo** `[PE1 + M1]`:
> Puede que ya me hayas hablado de alguna pérdida; acá hay lugar para lo que no entró. Si perdiste a alguien importante, contame de cada uno lo que quieras: qué era para vos, cómo fueron los días de después y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Paso esta)]

**Narrador** `[PE1]`: Ya te conté de Ernesto, mis papás y Mirta. Son las pérdidas grandes de mi vida. Después de Ernesto murió, tardé años en sentirme normal nuevamente. Los primeros meses fue como caminar por la niebla, viste. No sabía qué me estaba pasando. Mis hijas fueron lo que me salvó. Claudia especialmente, visitándome todos los días. Poco a poco, la vida empezó a tener sentido nuevamente porque Claudia estaba. Uno piensa que cuando una persona se va, se lleva todo, pero no. Se llevan su presencia, su voz, pero te dejan sus huellas. Yo veo a Ernesto en Mónica, en su seriedad. Veo a mi mamá en Claudia, en su calidez. Esas pérdidas fueron terribles, pero también me enseñaron que la vida sigue, que los que quedan son quienes te sostienen.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Paso esta)]

**Narrador** `[PE5]`: La vista. La vista es lo que me ha frenado más. Cuando empecé a perder la vista, fue duro. Yo soy costurera, y mis ojos eran mi herramienta. Cuando el oculista me dijo que tenía una enfermedad en los ojos y que iba a perder visión, me quería morir. Pasé un tiempo oscuro, muy oscuro. Pero después Claudia me apoyó, me llevó a hacerme tratamientos, me cuidó. La vida se adaptó. Ahora uso lentes, uso lupas para las cosas pequeñas. No puedo coser como antes, pero sigo viviendo. También he tenido algunos dolores, en las articulaciones, en la espalda, cosas de la edad. Pero nada que me haya dejado en la cama. Sigo aquí, sigo de pie, aunque sea lentamente.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Y si ya me la contaste, con decírmelo alcanza.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Paso esta)]

**Narrador** `[PE4]`: Creo que ya te conté la mayoría. Pero sí, aquellos años cuando Claudia estaba en malas compañías fueron duros. Yo estaba angustiada, preocupada, no dormía. Sentía que estaba fracasando como mamá. Eso fue lo más duro de mi vida adulta, además de la muerte de Ernesto.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[CI11]`:
> Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.
>
> [botones: (No, está todo)]

**Narrador** `[CI11]`: [toca: No, está todo]

## Bloque 12 · La historia grande

**Biógrafo** `[M25.3 + EN12]`:
> Bien, entonces.
>
> Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.

**Biógrafo** `[HG1]`:
> Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día.

**Narrador** `[HG1]`: Me acuerdo de la Guerra de Malvinas. Eso fue 1982. Yo estaba en casa con mis hijas cuando pasó. Las noticias hablaban de jóvenes que se iban a la guerra. Era angustia en todas partes, miedo. Conocía a algunos muchachos del barrio que se fueron a pelear. Algunos volvieron, otros no. Recuerdo que en la casa de mi vecina murió su hijo en esa guerra. Fue muy triste, toda la calle lloró. Yo también lloré por él, aunque no era mi hijo, era el hijo de una amiga. Eso me mostró que la política y las guerras tienen cara de gente, de jóvenes inocentes. También me acuerdo de varios Mundiales. En 1978 ganamos uno, y la gente estaba loca de alegría. Pero la mayoría del tiempo, yo estaba metida en mi vida, en mi costura, en mis hijas. Lo grande del mundo no me tocaba mucho.

**Biógrafo** `[M3.8 + HG4]`:
> Te escuché bien. Vamos por la siguiente.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado. Y si ninguno se te separa de los demás, contame cómo eran tus días entonces.

**Narrador** `[HG4]`: Un día que recuerdo muy bien fue el primero que no pude salir de casa. La gente hablaba del virus, y Claudia me dijo que tenía que quedarme en casa, que no saliera. Yo estaba asustada. Es un día de 2020, debe haber sido en marzo. Me quedé en la casa sola durante el día. No podía ir a la iglesia. No podía ver a mis amigas. Claudia venía de vez en cuando, pero tenía que estar cuidada, con barbijo. Yo me sentía prisionera, aunque sabía que era por mi salud. Pasé los días viendo tele, cosiendo cosas simples. Fue lo más duro porque yo soy de movimiento, de estar con gente. Esos meses fueron largos. Lo único que me salvó fue que Claudia seguía viniendo, aunque fuera a la puerta. Después, cuando me vacunaron, me sentí un poco mejor, pero el mundo ya había cambiado.

**Biógrafo** `[M3.1 + DE1]`:
> Gracias, Elsa. Ya lo guardé.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Narrador** `[DE1]`: De joven, cuando quise irme de mi casa para trabajar en Paraná sola, fue algo que mi papá no vio bien al principio. Una mujer sola, en una ciudad grande, sin familia cercana. Mi mamá me defendió, y al final me dejaron ir. Pero fue complicado. Hoy en día, una chica de veinte años se va de su casa sola y nadie dice nada. Cuando yo tenía novio, no podía salir con él sin permiso, sin que alguien nos viera. Ahora los chicos salen juntos sin problemas. También, cuando quise trabajar de costurera, algunos pensaban que estaba mal que una mujer casada ganara dinero. Como si fuera poco femenino. Hoy no solo trabajan las mujeres, sino que tienen profesiones importantes. A veces pienso que hubiera tenido más opciones si hubiera vivido hoy.

**Biógrafo** `[M3.2 + FI7]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Narrador** `[FI7]`: La política nunca fue algo que me apasionara. Yo siempre estuve más ocupada con mi casa, mi familia, mi trabajo. Pero viví momentos políticos difíciles en el país. Recuerdo golpes, incertidumbre. Mucha gente desaparecía, había desorden. Eso nos asustaba a todos. Ernesto y yo simplemente tratábamos de vivir nuestras vidas lo mejor posible, sin meternos en problemas. Hoy veo que la política sigue siendo complicada. Creo que lo importante es que haya paz, que la gente pueda vivir sin miedo, que las familias puedan estar juntas. Eso es lo que yo siempre quise: tranquilidad para mi familia.

**Biógrafo** `[M26 + CI12]`:
> Gracias, Elsa.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.
>
> [botones: (No, está todo)]

**Narrador** `[CI12]`: [toca: No, está todo]

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M25.1 + EN13]`:
> Bien, seguimos.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó. Si es uno que ya me contaste, decímelo y, si querés, agregale lo que te faltó.

**Narrador** `[GI1]`: Hay un día que viviría mil veces. Fue en nuestra casa en Paraná, años después de casarme con Ernesto. Las chicas estaban en la escuela. Yo estaba cosiendo en la máquina cuando Ernesto llegó del trabajo al medio día. Eso era raro, nunca venía a esa hora. Me preguntó qué estaba haciendo, y le dije que cosiendo, como siempre. Él me pidió que parara, que saliera un rato con él. Fuimos al centro de Paraná, sin apuro, caminando. Entramos a una confitería, y él pidió dos cafés. Estábamos mirando la calle, sin hablar mucho, y él me tomó la mano. Me dijo: "Vos sabés que no soy de palabras bonitas, pero quiero que sepas que sos lo mejor que me pasó en la vida." Yo lloré ahí mismo, en la confitería. Fue un momento en que sentí que todo, todos los sacrificios, la costura, el trabajo, valía la pena. Porque tenía a un hombre que me amaba, de verdad. Ese día hizo clic en mi cabeza: esta es tu vida, esta es la buena.

**Biógrafo** `[M3.4 + GI2]`:
> Gracias por contármelo. Seguimos.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó. Si ya me lo contaste, con decírmelo alcanza. Y si el día justo no te vuelve, contame lo que te acuerdes de esa época.

**Narrador** `[GI2]`: El día que Ernesto murió. Fue un día cualquiera, casi. Nos despertamos juntos, como siempre. Él se preparó para ir al correo, y yo le hice el desayuno. Le dije que tuviera cuidado, que hacía calor. Él se fue. No sabía que no lo volvería a ver con vida. Alrededor de las tres de la tarde, recibí una llamada del hospital. Ernesto había sentido un dolor en el pecho en el trabajo, y lo llevaron de urgencia. Salí corriendo. Cuando llegué al hospital, él ya estaba en terapia intensiva. Los médicos me dijeron que había tenido un infarto muy grave. Pasé horas ahí, viéndolo respirar con dificultad. A la noche murió. Cuando me lo dijeron, fue como si el mundo se parara. Hasta ese momento, yo era una mujer casada con un trabajo, una vida. Después de eso, soy una viuda. No hay vuelta atrás de eso. Ese día partió mi vida en dos: antes y después. Nunca pensé que un día cualquiera sería el último día con la persona que más amé.

**Biógrafo** `[M3.5 + HJ1]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Narrador** `[HJ1]`: Hubiera querido seguir estudiando. Cuando era joven, dejé la escuela para trabajar. Siempre pensé que cuando tuviera tiempo, volvería. Pero los años pasaron, las hijas crecieron, Ernesto envejeció, yo envejecí. Nunca tuve ese tiempo. Ahora que soy vieja, me gustaría haber terminado la escuela, haber estudiado algo. Eso me hubiera dado más oportunidades, más confianza. El día que me di cuenta fue cuando una vecina se sacó el diploma de primaria a los sesenta años. Yo la miré y pensé: "Yo podría haber hecho eso hace años." Pero ya era tarde. Ahora con ochenta años, seguir es casi imposible. Ese fue un momento en que sentí que había desperdiciado una oportunidad. Pero bueno, la vida es así: no todas las puertas se abren.

**Biógrafo** `[M3.6 + GI9]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquita frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor. Y si no te vuelve un momento puntual, contame frente a qué cosas te pasa eso.

**Narrador** `[GI9]`: Sí. De noche, en el patio de mi casa en Paraná. Muchas veces me quedaba sola después que todos dormían, y miraba el cielo. Había noches de luna llena que iluminaba todo. Y yo me quedaba mirando las estrellas, pensando. Sentía que yo era tan pequeña, tan insignificante. Con todos mis problemas, mis preocupaciones, mis dolores. Y ahí arriba había infinito, había estrellas que llevan luz de hace años, planetas que tal vez no existen ya. Eso me hacía sentir humilde. Me hacía dar cuenta de que mis problemas no eran tan grandes en el contexto del universo. También en la iglesia, cuando estaba en el silencio, frente al altar con la luz de los cirios. Sentía algo grande, algo que me superaba. Esos momentos me calmaban, me hacían sentir conectada con algo más allá de mi vida pequeña.

**Biógrafo** `[M3.7 + FI1]`:
> Quedó guardado, Elsa. Sigo con la que viene.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos misma? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Narrador** `[FI1]`: La soledad es parte de mi vida ahora. Cuando Ernesto murió, la soledad fue terrible, dolorosa. Pero con el tiempo, aprendí a vivir con ella. Ahora, cuando Claudia no está, me quedo sola en la casa. A veces me hace bien. Me siento en el patio, con una taza de té, y simplemente pienso. A veces hablo sola, le cuento a Ernesto cómo estuvo mi día. Suena raro, pero me hace bien. En las noches, miro la tele, coso cosas chiquitas. La soledad no es tan mala cuando aprendés a no tenerle miedo. Lo que sí es difícil es la soledad cuando querés hablar con alguien y no hay nadie. Por eso Claudia viene todos los días. Ella me salva de esa soledad que duele. Pero los momentos solos, reflexivos, me hacen bien. Me dejan pensar en mi vida, en lo que fue.

**Biógrafo** `[M3.8 + FI2]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Narrador** `[FI2]`: Un momento fue cuando me miré al espejo después de una ducha, y no reconocí a la persona que veía. Las arrugas, el pelo blanco, las manos manchadas de vejez. Fue como un golpe, viste. Pero más que eso, fue cuando mis nietos comenzaron a tener sus propios hijos. Yo estaba ahí, mirando a mi bisnieto, y pensé: "Pasó todo tan rápido." Tenía veinticinco años ayer, después tenía treinta, después cincuenta, y ahora tengo ochenta. El tiempo te pasa así, sin aviso. También cuando fui a Villaguay a visitar, y la gente me dijo: "Ay, Elsa, qué abuela te ves," con cariño, pero me lastimó. Eso me hizo dar cuenta de que no era la chica bonita que fue una vez, era una abuela vieja.

**Biógrafo** `[M3.1 + FI3]`:
> Gracias, Elsa. Ya lo guardé.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Narrador** `[FI3]`: De mi mamá heredé la capacidad de trabajar sin parar, de ser cariñosa con la familia. Mi mamá nunca se quejaba, simplemente hacía lo que había que hacer. Yo heredé eso. De mi papá heredé la seriedad, el ser de palabra. Cuando prometo algo, lo cumplo, como él. También heredé una cierta desconfianza en hablar de emociones, que eso también venía de mi papá. Me di cuenta cuando mis hijas me pedían que hablara de mis sentimientos, y yo no podía. Eso lo había visto en mi papá: él no era de palabras dulces, pero sabías que te amaba. También heredé la dificultad de pedir ayuda, de depender de otros. Eso es de mi papá, su independencia, aunque a veces te aísla. Veo todo esto en mis hijas también, y en mis nietos. Es como un árbol donde las ramas salen del mismo tronco.

**Biógrafo** `[M3.2 + FI4]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Narrador** `[FI4]`: De joven sí me importaba mucho. Cuando me fui a Paraná sola, me importaba lo que la gente pensara de una chica sola en la ciudad. Cuando me casé, me importaba ser la "buena esposa" que todos esperaban. Ahora, honestamente, no me importa nada. Tengo ochenta años, ¿para qué voy a preocuparme? Hago lo que me parece bien. Si la gente habla, que hablen. Una vez, años atrás, la vecina me criticó porque seguía cosiendo para afuera, aunque Ernesto trabajaba. Dijo que era de mala esposa no estar todo el tiempo en casa. Yo le respondí que necesitaba tener mi dinero, mi independencia. Ella se quedó mirándome como si hubiera cometido un crimen. Pero yo seguí cosiendo. Así que sí, cambié. Antes obedecía lo que la sociedad esperaba; ahora hago lo que me parece correcto.

**Biógrafo** `[M3.3 + FI6]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Narrador** `[FI6]`: No me lo imagino bien, sinceramente. Veo tanta tecnología, tanta velocidad, que no sé cómo será. Espero que en cien años haya más paz, menos guerra, menos gente sufriendo. Me gustaría que las familias sigan siendo importantes, que la gente no se pierda en las máquinas. Que sigan amándose, cuidándose. También que no se pierdan las historias, las tradiciones. Que alguien se siente con sus abuelos a escuchar sus historias, como mis nietos me escuchan a mí. Me gustaría que mis historias, los recuerdos de mi vida, sigan viviendo en alguien. Que mi nombre no se olvide. Eso es lo que espero: que la humanidad no se olvide de sus raíces, de dónde vienen.

**Biógrafo** `[M26 + CI13]`:
> Gracias, Elsa.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquila.
>
> [botones: (No, está todo)]

**Narrador** `[CI13]`: [toca: No, está todo]

## Bloque 14 · Hoy

**Biógrafo** `[M25.2 + EN14]`:
> Bien, seguimos.
>
> Dejamos el pasado un rato y venimos a hoy, Elsa: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Narrador** `[HO1]`: Un día cualquiera ahora: me despierto alrededor de las siete de la mañana. Me levanto lentamente, porque las articulaciones duelen un poco. Voy al baño, me lavo la cara, me peino. Me hago un té con tostadas para el desayuno. Veo un poco de tele, las noticias. Después me siento en el patio si hace buen tiempo, o me quedo en la casa. Si tengo algo que coser, lo hago, aunque sea poco. A las once o doce, Claudia llama para saber cómo estoy. Si no está ocupada, viene a verme. Comemos juntas o ella me trae comida. Después de comer, una siesta corta. Por la tarde, sigo viendo tele, a veces leo un poco, aunque la vista no me ayuda. Hacia las cinco, tomo otro té. Si Claudia está, charlamos, si no, me quedo sola. Hago algo de cena, algo simple. Como mirando tele. Antes de acostarme rezo un poco, pienso en mis cosas. Me acuesto alrededor de las nueve. Eso es mi vida ahora: tranquila, sin sorpresas, pero acompañada por Claudia, que es lo más importante.

**Biógrafo** `[M3.5 + HO2]`:
> Guardado, Elsa. Te mando la próxima.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado. Y si la última no te vuelve, contame con qué te reís seguido.

**Narrador** `[HO2]`: Con mis nietos. El más chico es chistoso, trata de hacer cosas de grande y no puede. Una vez estaba viendo un juego en mi tele, y intentaba jugar como los mayores. Se equivocaba constantemente, y él mismo se reía de sí mismo. Eso me hizo reír a mí también. Nos reímos juntos. Claudia también me hace reír a veces con cosas que me cuenta de sus días, de la gente que conoce. Hay un momento que mi vecina hizo algo raro, y Claudia me lo imitó, y yo no podía parar de reír. También me hago reír sola a veces, con mis propios pensamientos tontos, o recordando algo ridículo de cuando era joven. La risa es importante ahora, viste. En la oscuridad de los años, la risa es como una luz.

**Biógrafo** `[M3.6 + HO5]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Narrador** `[HO5]`: Lo que más me gusta es cuando Claudia viene y nos sentamos a conversar. No es nada especial, solo charlar de sus cosas, de mi día. A veces me trae un postre que ella hizo, y comemos juntas. Eso es lo mejor de mi día. También me gusta cuando mis nietos vienen, y me cuentan de la escuela, de sus amigos. Ver que crecen, que están felices. Y me gusta coser todavía, aunque sea poco, esas cosas chiquitas. Me gusta salir al patio en una tarde bonita, sentir el sol. Esos momentos simples. A veces pienso que cuando era joven, estaba tan ocupada en conseguir cosas, en trabajar, que me perdía estos momentos simples. Ahora que tengo poco tiempo, es lo que más valoro.

**Biógrafo** `[M3.7 + CO1]`:
> Quedó guardado, Elsa. Sigo con la que viene.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Narrador** `[CO1]`: Mi plato es el locro. Me lo enseñó mi mamá, quien a su vez lo aprendió de su mamá. Es un guiso con maíz, carne, papa, ajo, cebolla, y especias. Cada vez que lo hago, es diferente según los ingredientes, pero tiene siempre la misma alma. Una vez lo hice para el cumpleaños de Ernesto, con amigos. Pasé todo el día cocinando, probando. Cuando lo sirvieron, la gente no paraba de comer. Un amigo de Ernesto me dijo: "Elsa, esto es lo más rico que probé en mi vida." Ernesto estaba tan orgulloso. Eso fue lindo, viste, que mi comida haya hecho feliz a la gente. Ahora, cuando Claudia viene, a veces le pido que coma locro. No es lo mismo que lo haga ella, ella dice que me falta la "mano de bruja." Yo lo veo como una carga, una responsabilidad: mantener la receta, mantener la tradición. Mis nietos comen mi locro, y espero que alguno aprenda a hacerlo para que no se pierda.

**Biógrafo** `[M3.8 + HO9]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Narrador** `[HO9]`: Vivo en la misma casa donde viví con Ernesto toda mi vida en Paraná. Es una casa vieja, de adobe, con un patio grande. Tiene cuatro cuartos, una cocina, una sala. Está gastada por el tiempo, pero es mía. Los vecinos me conocen desde hace décadas, algunos se han ido, otros nuevos llegaron. Pero el barrio sigue siendo tranquilo. Hay árboles viejos, casas como la mía. No es un barrio rico, pero es honesto. Hace poco, una mañana, me senté en el patio cuando salía el sol. Las plantas estaban mojadas por el rocío. Los pájaros cantaban. Un gato que no es mío pasó caminando lentamente. Todo estaba en paz. En ese momento, pensé: "Esta casa es mi testigo. Vio nacer a mis hijas, vio envejecer a Ernesto, vio mi vida entera." La casa está lista para recibirme cuando me vaya.

**Biógrafo** `[M26 + CI14]`:
> Gracias, Elsa.
>
> Con esto cerramos lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquila.
>
> [botones: (No, está todo)]

**Narrador** `[CI14]`: [toca: No, está todo]

## Bloque 15 · Legado y cierre

**Biógrafo** `[M25.3 + EN15]`:
> Bien, entonces.
>
> Ya estamos en la última parte, Elsa: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Narrador** `[LE1]`: Lo que más me da orgullo es mis hijas. Que hayan salido adelante, que sean mujeres responsables, que trabajen, que tengan hijos. Que Claudia sea enfermera, que Mónica sea una mujer trabajadora. Eso, mi familia, es mi legado. También me da orgullo haber sido una buena costurera, que la gente confiaba en mis manos para sus vestidos importantes. Haber mantenido una casa, haber amado a Ernesto durante cincuenta años. Cuando me doy cuenta de eso, me siento completa. Creo que no desperdicié mi vida, que la viví lo mejor que pude con lo que tenía. No fui a la universidad, no viajé a lugares exóticos, pero construí una familia que se ama. Eso es lo que me da más orgullo. Cuando veo a mis nietos, cuando veo a Claudia, siento que hice bien las cosas.

**Biógrafo** `[M3.2 + LE2]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos misma descifraste viviendo.

**Narrador** `[LE2]`: Quiero que sepan que lo importante en la vida es tener a quién amar. La familia, los amigos, la gente que te rodea. Porque el dinero no te acompaña a ningún lado, pero el amor sí. Quiero que valoren los momentos chiquitos, los de todos los días. Una taza de té con alguien que amas, una charla, una risa. Eso es la vida, no los grandes eventos. También quiero que entiendan que trabajar da dignidad. Que hagan lo que tengan que hacer con dedicación, con amor. Que no busquen atajos. Y que perdonen, a los demás y a ustedes mismos. Que no carguen con rencores como yo cargué a veces. Que sean valientes, que se animen a vivir sus vidas como quieran, no como otros esperan. Que cuidén a su familia, porque la familia es lo único que te queda al final. Cuando estés viejo, vieja, lo que va a importar es tener gente que te quiere cerca.

**Biógrafo** `[M3.3 + FU1]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Narrador** `[FU1]`: Me gustaría poder contar todas mis historias a mis nietos, grabar mi voz para que después cuando ya no esté, ellos puedan escucharme. Estar sentada con ellos, contarles quién soy de verdad, no solo la abuela que les cocina y les cuenta cosas. Quiero que sepan mi nombre, Elsa, quiero que sepan de dónde vino, qué hizo, cómo amó. Quiero viajar a Villaguay una vez más, ver el pueblo donde nací, las casas que reconozco, el río. Aunque sea una última vez. Y quiero que Claudia sepa cuánto la amo, que le diga en la cara, sin vergüenza, cómo ella me salvó cuando quedé sola. Eso es lo que todavía quiero hacer. No es nada grande, son cosas chiquitas. Pero son mis cosas.

**Biógrafo** `[M3.4 + LE7]`:
> Gracias por contármelo. Seguimos.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Narrador** `[LE7]`: "La costurera de Paraná". Porque toda mi vida giró alrededor de la máquina de coser, de mis manos, de los hilos. Y porque Paraná es donde construí mi vida adulta, donde amé, donde tuve a mis hijas. Ese título resume todo: el trabajo, el lugar, la persona que soy. La costurera de Paraná suena modesto, sin pretensiones, como mi vida. Una vida tejida con paciencia, con amor, con dedicación. Como un vestido que se va armando puntada a puntada. Eso es lo que fui: una mujer que cosía vidas, la de su familia.

**Biógrafo** `[M3.5 + M15]`:
> Guardado, Elsa. Te mando la próxima.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> Mamá, ¿te acordás de la canción que nos cantabas para dormir? Mónica

**Narrador** `[FAM1]`: No me acuerdo bien, Mónica. Las canciones de cuna que cantaba eran unas viejas que mi mamá me cantaba a mí. Eran en español, sencillas. Algo de "duermete mi niño, duermete mi amor," algo así. Pero los detalles se me borraron. Me duele porque fueron canciones que les canté para dormir, y no me acuerdo bien. Pero sí me acuerdo de tu carita de chica, mirándome con los ojos cerrándose lentamente mientras yo cantaba. Eso me acuerdo perfectamente, cariño. Eso es lo importante, ¿viste?

**Biógrafo** `[M3.6 + FO1]`:
> Lo tengo, gracias. Vamos con otra.
>
> Otra cosa, Elsa. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Tomate el tiempo que necesites para buscarla: la pregunta que sigue te la mando cuando me llegue la foto o me digas algo. Y si no la encontrás, no pasa nada: el libro va igual, y la podés mandar más adelante.
>
> [botones: (No tengo foto)]

**Narrador** `[FO1]`: [toca: No tengo foto]

**Biógrafo** `[M25.1 + LE9]`:
> Bien, seguimos.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Narrador** `[LE9]`: Sí, una cosa. Quiero que quede claro cuánto amo a Claudia. No es que ame menos a Mónica, pero Claudia fue quien me cuidó cuando quedé viuda y perdida. Ella vino todos los días, sin falta. Me salvó de la soledad. Quiero que se sepa eso. También quiero dejar registro de mi hermana Chiquita, que la quería mucho. Ella murió hace años, y a veces me pregunto qué hubiera sido de nuestras vidas si no nos separaran por la distancia. Y Ramón, mi hermano mayor, que fue muy importante en mi infancia. A veces siento que me olvidé de ellos, que no cuento lo suficiente sobre ellos. Quiero que este libro deje constancia de que existieron, de que fueron parte de mí. Eso es lo que quiero agregar.

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Narrador** `[LE8]`: A Mónica: querida mía, sé que fui una mamá seria a veces, que no siempre te dije lo que sentía. Pero te amo, y estoy orgullosa de quién eres. Cuidate, que la vida es corta, muy corta. A Claudia: mi tesoro. Vos sabés lo que vos significas para mí. Seguí siendo como sos, seguí viniendo todos los días si podés, porque tu presencia es lo que me mantiene viva. A mis nietos: ustedes son el futuro, son la esperanza. Aprendan a trabajar, aprendan a amar, aprendan a cuidarse los unos a los otros. Y escuchen las historias de los viejos, porque en ellas está la raíz de quiénes son ustedes. A los que vayan a leer esto: yo no soy nadie importante, soy una costurera de Paraná, una abuela. Pero mi vida fue vida, fue verdad, fue amor. Vivan así ustedes también. No busquen ser ricos, busquen ser buenos. Amen sin miedo. Y nunca olviden de dónde vienen. Eso es todo. Los amo a todos.

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Elsa. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Y si te quedó alguna foto por mandar, mandámela por acá cuando la encuentres: entra igual. Fue un gusto enorme escucharte.
