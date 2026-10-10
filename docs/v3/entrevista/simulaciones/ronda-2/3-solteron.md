# Ronda 2, simulación 3: el solterón (Aníbal, 77, inventado)

**Qué es:** la entrevista de un narrador **inventado** (Aníbal), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Plan: [`PLAN.md`](PLAN.md).

**Cuenta:** 83 preguntas del banco contestadas + 1 de la familia · **122 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas van juntas en ese mensaje); **Narrador** es lo que contestó. Los títulos de bloque y los IDs (entre corchetes) son para el equipo: el narrador no los ve.

**Biógrafo** `[BIEN]`:
> Hola, Aníbal, ¿cómo estás? Una persona que te quiere mucho te regaló un libro con la historia de tu vida, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.
>
> Funciona así: te mando una pregunta y vos me la contás en audio, como si me lo estuvieras contando en persona. Mandame todos los audios que quieras. Cuando termines, ya está: con un ratito de silencio, la pregunta que sigue te llega sola.
>
> Si alguna pregunta no tiene que ver con tu vida, me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro: esto lo hacemos al ritmo que vos quieras.

## Bloque 1 · Origen y raíces

**Biógrafo** `[OR1 + M1]`:
> Empecemos por cuando llegaste al mundo, según te contaron. No el día en sí, sino la época: dónde vivían, en qué andaban tu mamá y tu papá, cómo te esperaban. ¿Qué sabés de cómo era la vida de ellos en ese entonces? Contame.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR1]`: Mirá, mi viejo trabajaba en el taller desde hace años, tornero. Mi vieja estaba en la casa, como todas las mamás de entonces. No tenía mucho, ¿vos sabés? Pero me esperaban bien. La Olga ya tenía dieciocho, diecinueve, así que yo iba a ser el bebé de la casa. Me lo contaba mi vieja: que querían un varón. Y bueno, ahí llegué yo, en el 49. Nada de especial, una familia de barrio, Arroyito. Mi viejo con su trabajo, mi vieja en la casa. Eso era todo.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Aníbal. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR2]`: No, la verdad que no. Mi viejo no hablaba mucho de esas cosas. Lo que sí me contaba mi vieja, de vez en cuando, era que mi abuelo había venido de Italia, de muy chiquito, con nada. Trabajador. Pero historias así, de sobremesa, no. Eran otros tiempos, ¿vos sabés? Se hablaba del trabajo, de cómo andaba la cosa. Punto. Mi mamá, cuando envejeció, sí me contaba más cosas, pero de ella misma, no de los abuelos.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR5]`: Ah, eso sí. Se conocieron en un baile, en el club. Mi viejo era medio tímido, pero iba al club desde chico. Mi vieja iba con sus amigas. Se vieron, bailaron, y bueno, se gustaron. Mi vieja decía que se enamoró al toque, que mi viejo tenía buenos ojos. Nada raro, la historia de siempre en esos años. Se casaron, tuvieron a la Olga, y después con unos años más me tuvieron a mí.

**Biógrafo** `[M26 + CI1 + M31]`:
> Gracias, Aníbal.
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
> Ahora vamos a tu infancia, Aníbal: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Narrador** `[CA1]`: Me acuerdo del patio, principalmente. La casa daba a un patio grande, y yo con los otros chicos jugábamos ahí. Mi vieja miraba desde la cocina. Se ve que tendría cuatro, cinco años. Mi viejo iba y venía del taller. Y la Olga ya estaba grande, no se juntaba con nosotros. Me acuerdo de mi mamá sobre todo, del delantal, de cuando me llamaba para adentro.

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chico. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Narrador** `[CA2]`: Mi mamá era dulce. Muy de estar pendiente. Me acuerdo de cuando me enfermaba, me daba té con miel, me ponía paños fríos en la frente. Me mimaba, pero sin exagerar. Y me daba el mate después de la escuela. Era cuidadora, así. Una vez me lastimé jugando al fútbol, me caí y me rompí el brazo, y mi mamá me llevó al hospital. Se quedó conmigo toda la noche. Eso se me grabó. Era una mujer de esas que no se quejan, que están ahí nada más.

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chico? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Narrador** `[CA3]`: Mi viejo era tornero. Trabajaba en un taller metalúrgico acá en Arroyito. Me llevó un par de veces cuando era chico, aunque mi mamá no le gustaba mucho. Recuerdo el ruido, la máquina girando, el olor a metal y a grasa. Mi viejo estaba ahí, concentrado, con los anteojos para ver bien. Era un trabajador, en serio. No hablaba de sus cosas del laburo en casa, pero vos veías que se iba a las seis de la mañana y volvía cansado. Así fue toda la vida.

**Biógrafo** `[M3.6 + CA6 + M1]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Tuviste hermanos? Si ya salieron en la charla no importa, quiero saber más: contame con cuál eras más cercano de chico y alguna aventura que hayan hecho juntos; seguro tienen varias.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, tuve) (No tuve hermanos)]

**Narrador** `[CA6]`: [toca: Sí, tuve]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[CA6]`: La Olga, mi hermana. Ella era bastante mayor, casi quince años. Cuando yo era chico jugando en el patio, ella ya estaba grande, con sus amigas, yendo a fiestas. No éramos cercanos de chicos, para nada. Ya cuando era adolescente se casó, se fue a Santa Fe con su marido. Yo me quedé en la casa con mis viejos. Nos veíamos poco, pero siempre fue mi hermana, ¿vos sabés? Ahora tiene a Martín y Lucía, sus hijos, mis sobrinos. Pero de aventuras juntos de chicos, no hay.

**Biógrafo** `[M3.7 + CA16]`:
> Quedó guardado, Aníbal. Sigo con la que viene.
>
> Contame un día de chico que esperabas con muchas ganas: qué era, quién estaba, qué pasó. Y si no te vuelve un día en particular, contame qué cosas esperabas con ganas en esa época, que con eso me arreglo.

**Narrador** `[CA16]`: Mirá, de chico lo que esperaba era el domingo cuando iba al club con mi viejo. Se jugaba al fútbol, después había comidas, la gente ahí reunida. Mi viejo me llevaba de la mano, me mostraba cómo se jugaba. Eso era lo grande para mí. Y esperar a mi vieja cocinando algo especial, arroz con pollo o un guiso, para el almuerzo. Las cosas simples, ¿vos sabés? No mucho más que eso.

**Biógrafo** `[M26 + CA17]`:
> Gracias, Aníbal.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[CA17]`: [toca: Paso esta]

**Biógrafo** `[M27.1 + CI2]`:
> Está bien, Aníbal. Lo dejamos ahí y seguimos por otro lado.
>
> Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquilo, que hay tiempo.
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

**Narrador** `[ES1]`: Me llevó mi vieja, qué duda cabe. Me acuerdo que estaba asustado, no quería soltar la mano. La maestra me saludó, me mostró el banco, y cuando mi mamá se iba me largué a llorar. Pero pasó rápido. Después ya no me importaba ir a la escuela, estaba con otros chicos, jugábamos en el patio. Nada del otro mundo, como todos supongo.

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Narrador** `[ES2]`: Sí, Don Héctor. Era el maestro de quinto grado. Hombre serio, pero buena persona. Me acuerdo que una vez hice un trabajito en madera, unos carteles, y Don Héctor me llamó adelante de la clase para mostrárselo a todos. Me dijo que tenía buenas manos, que debería aprender un oficio. Eso se me quedó. Después trabajé con máquinas, así que en parte fue por eso. Don Héctor creía que los chicos como yo, de barrio, podíamos llegar a algo. No como otros maestros que te miraban de arriba.

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chico, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Narrador** `[ES5]`: Sí, Carlitos. Vivía a dos cuadras de mi casa. Nos juntábamos a jugar al fútbol en la cancha del club, o en la calle. Carlitos era más vivaz que yo, siempre metía la más, ¿vos sabés? Una vez se nos ocurrió robar frutas de un árbol de un huerto que quedaba al lado del barrio. Casi nos agarran, pero salimos corriendo y después nos moríamos de risa. Carlitos se mudó cuando tuvimos dieciocho, diecinueve años. Nos vimos poco después, pero eso que pasamos de chicos se quedó.

**Biógrafo** `[M3.3 + ES6]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chico, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Narrador** `[ES6]`: Eso, lo de las frutas con Carlitos fue lo más grande. Pero si no, una vez en la escuela volqué el tintero de la maestra sobre los papeles. Fue sin querer, pero la maestra pensó que había sido a propósito. Me quiso pegar con la regla, pero Don Héctor apareció y le dijo que no. Después me dejó limpiando todo el desorden. No fue una travesura grande, pero me asustó bastante. De chico aprendés a no meterte en quilombos, ¿vos sabés?

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Narrador** `[ES7]`: Quería trabajar con mis manos. Lo que me metió en la cabeza fue Don Héctor con eso de que tenía buenas manos. Pero también veía a mi viejo en el taller, con sus herramientas, precisión, trabajando en metal. Eso me gustaba. Un día mi viejo me llevó y me mostró cómo funciona el torno, cómo agarrás la pieza. Me quedé mirando. Dije "voy a hacer eso". Así que terminé la primaria, empecé la escuela técnica, y después a trabajar al taller.

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chico? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Narrador** `[ES9]`: Sí, había religión. Mi vieja era más creyente que mi viejo, pero iban los dos a la iglesia. Yo me acuerdo de mi primera comunión. Tenía como siete u ocho años, me pusieron un traje blanco chiquito, nuevito. Fuimos a la iglesia con mi vieja, mi viejo, la Olga. Después hubo una comidita en casa, nada grande. Mi vieja hizo un asado. No fue cosa de otro mundo, pero se veía que para ella era importante. Después de eso, iba menos a la iglesia, pero siempre respetamos eso en la casa.

**Biógrafo** `[M26 + CI3]`:
> Gracias, Aníbal.
>
> Con esto cerramos tus años de escuela. Antes de seguir, ¿te quedó alguna historia de esa época dando vueltas, algo que no entró en ninguna pregunta? Contámela ahora, con calma, que la quiero escuchar.
>
> [botones: (No, está todo)]

**Narrador** `[CI3]`: [toca: No, está todo]

## Bloque 4 · Adolescencia

**Biógrafo** `[M25.3 + EN4]`:
> Bien, entonces.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chico y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Narrador** `[AD2]`: Iba a la escuela técnica. Eso me gustaba más que la primaria, porque aprendía de máquinas, de herramientas. Pasaba las mañanas en clase, y las tardes en la casa o en el club. En el club empecé a jugar al básquet en esa época. Me acuerdo de un partido contra otro barrio, jugué bien y ganamos. Mi viejo estaba viendo desde las gradas. Cuando terminó, me miró y asintió con la cabeza. Para mí fue mucho eso. No decía nada, pero se notaba que estaba orgulloso.

**Biógrafo** `[M3.7 + AD3]`:
> Quedó guardado, Aníbal. Sigo con la que viene.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Narrador** `[AD3]`: Tenía unos cuantos. Estaban Carlitos, que ya te hablé, y otros de la escuela. Nos juntábamos en la cancha del club a jugar al fútbol, o en la esquina a boludear. A esa edad empezábamos a mirar chicas, ¿vos sabés? Se hacían bailes en el club y nosotros nos plantábamos en la puerta, haciéndonos los machos. Una noche fuimos un grupo a un baile, yo me anudé la corbata, me puse el único traje que tenía. Me morría de miedo de acercarme a una chica. Mis amigos se burlaban. Pero bueno, eso de la edad.

**Biógrafo** `[M3.8 + AD5]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche. Y si la primera no te vuelve, contame cómo eran esas salidas en general.

**Narrador** `[AD5]`: Fue en el club, un sábado. Me puse el traje, la corbata, mi vieja me ayudó a acomodarme. Pasé vergüenza. Fui con Carlitos y otros compañeros. Cuando llegamos, la música sonaba fuerte, había parejas bailando. Nos quedamos en el rincón, mirando. Yo querría bailar pero no tenía coraje. Un compañero me empujó hacia una chica, yo me acerqué sin saber qué decir, y bueno, terminamos bailando un tango. Me sudaban las manos. Después de eso empecé a ir más seguido a los bailes. Pero esa primera vez se me quedó grabada.

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Narrador** `[AD6]`: Ah, eso fue a los dieciséis, diecisiete. Se llamaba Marisa, vivía al lado del barrio. Trabajaba en una tienda. La veía cuando iba al club, se sentaba con sus amigas. Un día me animé a hablarle, me temblaban las piernas. Nos vimos un tiempo, íbamos al cine, caminábamos por el barrio de la mano. Ella era linda, morena, buena persona. Pero bueno, después terminó. Ella se fue a vivir a otra ciudad, se casó. Una vez me la encontré años después con su marido, sus chicos. Nos saludamos, nada más. Fue mi primer amor de verdad, eso sí.

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chico? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Narrador** `[AD12]`: Cuando me voy a hacer la colimba, en el 69. Tenía diecinueve, veinte años. De repente estoy en un cuartel en Paraná, sin mi mamá, sin mi casa, con militares gritándote, órdenes, disciplina. Te trata como un objeto. Eso fue duro. La primera noche no dormí, pensaba en volver. Pero tenía que aguantarla. Ahí sentí que tenía que depender de mí mismo, que nadie me iba a salvar. Volví y me puse a trabajar de verdad, en el taller. Eso fue el cambio. De la colimba en adelante eras grande.

**Biógrafo** `[M26 + AD15]`:
> Gracias, Aníbal.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[AD15]`: No sé, la verdad es que no. Fuerte como para dejar una marca, no. Claro que la plata era poca, la ropa no era nueva, los zapatos se te rompían. Pero todos eran así en el barrio. Mi viejo trabajaba, mi vieja cuidaba la casa, nos alimentaba. Había hambre de verdad en otros lados, nosotros no pasamos eso. Así que no, nada que me haya marcado de adolescente.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Aníbal. Queda guardado con cuidado.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquilo, que hay tiempo.
>
> [botones: (No, está todo)]

**Narrador** `[CI4]`: [toca: No, está todo]

## Bloque 5 · Juventud

**Biógrafo** `[M25.3 + EN5]`:
> Bien, entonces.
>
> Pasamos a tu juventud, Aníbal: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Narrador** `[JU1]`: No, no me fui nunca. Yo seguí viviendo en la casa con mis viejos. Algunos compañeros se fueron, se casaron, armaron su familia. Yo no. Me quedé ahí, en la misma casa donde nací. Mi mamá necesitaba ayuda con los gastos, mi viejo estaba envejeciendo. Después cuando mi viejo murió, en el 80, me quedé con mi mamá. Y cuando ella falleció en el 98, seguí en la misma casa. Es la casa de mis padres, así que para mí quedarse era lo natural. No necesitaba irme. ¿Vos sabés? A muchos les pasa que se van, pero yo siempre estuve ahí.

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Narrador** `[JU2]`: Terminé la técnica y después vino la colimba, como ya te dije. Cuando volví, en el 70, empecé a trabajar en el taller de metalurgia, como tornero. Ese fue mi trabajo de toda la vida. Mi viejo me había arreglado el lugar, quería que aprendiera bien. Los primeros años fueron duros, aprendiendo el oficio, las manos magulladas, quemadas. Pero me gustaba. Me acuerdo de mi primer sueldo, lo llevé a mi vieja y ella lloró. Era poco, pero era de mi trabajo. Desde ahí, todos los días al taller. Cuarenta años así. Punto.

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Narrador** `[JU4]`: Aprendí en el taller mismo, con los más viejos. Un maestro que se llamaba Don Gilberto me enseñó a agarrar el torno, la precisión, cómo colocabas la pieza. "Las manos son lo importante", me decía. Los primeros meses erraba un montón, rompía cosas, rechazaban las piezas. Pero fui aprendiendo. A los seis meses ya andaba bien. Recuerdo un día que hice una pieza perfecta, Don Gilberto la midió, sonrió y me la mostró a los otros. Eso me motivó. Después de eso me metí de lleno. Cincuenta años trabajando y aprendiendo todos los días algo nuevo del oficio.

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Narrador** `[JU5]`: Sí, la colimba en Paraná, en el 69. Un año entero. Te despiertan a las cinco de la mañana, corrés en el patio, te hacen hacer ejercicios hasta que te duele todo. Los sargentos te gritan por nada. Una vez me gritó porque el uniforme no estaba bien planchado. Te sentís un objeto, no un ser humano. Pero aprendés disciplina, a aguantar, a trabajar con otros. Hay compañeros que hacen amigos para toda la vida ahí. Yo no, la verdad. Quería terminar y volver a casa. Cuando terminó el año, volví a Arroyito y no volvería más. No fue malo, pero tampoco fue lo mío.

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Quedó guardado, Aníbal. Sigo con la que viene.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Capaz ya me contaste algo de esa mudanza; ahora contame la llegada: el primer día, dónde dormiste esa noche, quién te esperaba y qué fue lo que más te costó.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, me mudé) (No, nunca me mudé)]

**Narrador** `[JU8]`: [toca: No, nunca me mudé]

**Biógrafo** `[M25.2 + JU12]`:
> Bien, seguimos.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue? Si la noche justa no te vuelve, contame cómo eran los primeros tiempos ahí. Y si nunca te fuiste de la casa de tus viejos, contame el día en que esa casa pasó a ser tuya, o el rincón que siempre fue tuyo.

**Narrador** `[JU12]`: Mi pieza, arriba en la casa. Cuando empecé a trabajar, ahorré para ponerme un escritorio, una radio. Nada grande, pero era mío. Leía los diarios ahí, escuchaba música. Después, cuando mis viejos envejecieron, mi vieja necesitaba ayuda para todo. Cuidarla fue lo mío, ¿vos sabés? Limpiar la casa, ir a comprar, estar pendiente de que tomara la medicina. Pasé noches sin dormir cuando se enfermaba. La casa fue volviéndose mía porque yo era el que cuidaba. Pero no por irse, sino por la responsabilidad.

**Biógrafo** `[M3.8 + JU15]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Narrador** `[JU15]`: Del taller, teníamos un grupo que se juntaba después del laburo. Íbamos a tomar una cerveza a la esquina, o al club. Jugábamos al truco, al fútbol. Uno se llamaba Roberto, otro Héctor, buenos muchachos. Con ellos aprendía cosas nuevas, de la política, del fútbol, de las mujeres. Roberto decía que me tenía que enamorar de verdad, que no podía pasar la vida solo. Después, algunos se casaron, se fueron de Arroyito. Yo seguía igual. Pero en el club siempre hay gente para jugar una partida.

**Biógrafo** `[M26 + JU17]`:
> Gracias, Aníbal.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[JU17]`: Sí. Mi viejo murió en el 80. Tenía treinta y uno. Fue un accidente en el taller, un problema del corazón. Vino alguien a la casa a avisarme. No sé cómo llegué al hospital. Lo vi ahí y no pude hacer nada. Mi vieja quedó destrozada. Yo tenía que ser fuerte por ella, aunque por dentro me moría. Eso cambió todo. Yo tenía que trabajar, cuidar a mi vieja, ser el hombre de la casa. Fue duro. Pero bueno, la vida es así.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI5]`:
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.
>
> [botones: (No, está todo)]

**Narrador** `[CI5]`: [toca: No, está todo]

## Bloque 6 · Amor y pareja

**Biógrafo** `[M25.3 + AM0 + M1]`:
> Bien, entonces.
>
> Ahora vamos al amor. ¿Hubo alguien con quien tuviste una historia en serio? Si hubo, haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después te pregunto más de la primera que fue en serio, y de las que vinieron después también va a haber lugar. Y si no hubo, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, hubo) (No hubo)]

**Narrador** `[AM0]`: [toca: Sí, hubo]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[AM0]`: Una. Se llamaba Norma. Nos conocimos en una fiesta del club, a los veinticinco. Ella trabajaba en una oficina, era una mina linda, inteligente. Nos juntamos dos años, capaz un poco más. Ella quería casarse, tener hijos. Yo... no sé. No me daba. No era que no la quisiera, pero algo en mí no daba para eso. Quería que fuera diferente, que ella entendiera, pero bueno, la vida no es así. Después cortamos. Se casó con otro tipo, tiene hijos. A veces la veía por la calle con su familia, pero ya no hablábamos. Eso fue lo único en serio que tuve.

**Biógrafo** `[M3.2 + AM1]`:
> Te escuché. Vamos con la que sigue.
>
> Vamos a la primera que fue en serio. Contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron, y qué fue lo primero que te llamó la atención de esa persona. Si ya me lo contaste cuando hablamos de tu adolescencia, decímelo y vamos a lo que sigue.

**Narrador** `[AM1]`: En una fiesta del club, un sábado por la noche. Ella estaba con sus amigas, yo estaba con mis compañeros del taller. Carlitos, que siempre me empujaba, me acercó a ella. Dijo algo como "este es buen muchacho". Norma sonrió. Era una sonrisa hermosa, ¿vos sabés? Tenía unos ojos claros, el pelo castaño. Se vestía bien, diferente a las otras. Bailamos un tango, después nos quedamos hablando casi toda la noche. Al día siguiente, la fui a buscar a su trabajo. Desde entonces, nos vimos todo el tiempo.

**Biógrafo** `[M3.3 + AM3]`:
> Lo anoté, gracias. Sigo con otra.
>
> Y después, ¿llegaron a armar la vida juntos: casarse, irse a vivir, lo que haya sido? Si llegaron, contame ese momento: quién lo dijo primero, o si se fue dando solo, dónde estaban, qué se dijeron. Si ya me lo contaste recién, con decírmelo alcanza.
>
> [botones: (Sí) (No llegamos a eso)]

**Narrador** `[AM3]`: [toca: No llegamos a eso]

**Biógrafo** `[M25.1 + AM8]`:
> Bien, seguimos.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Narrador** `[AM8]`: Un domingo a la tarde, en el parque sobre el río. Habíamos caminado, había un banco de madera viejo. Nos sentamos, ella apoyó la cabeza en mi hombro. Hacía calor, había árboles grandes. Ella preguntó si yo pensaba en el futuro, en construir algo con alguien. Yo no supe qué contestar. Ella levantó la cabeza y me miró. En ese momento sentí que la amaba de verdad. Pero no sabía si podía darle lo que ella quería. Eso es lo que me quedó. Ella había puesto la cabeza en mi hombro, el río pasaba abajo, el sol dándose vuelta. Eso fue todo. Eso querría guardar.

**Biógrafo** `[M26 + AM9 + M1]`:
> Gracias, Aníbal.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, hubo un final) (Seguimos juntos) (Paso esta)]

**Narrador** `[AM9]`: [toca: Sí, hubo un final]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[AM9]`: Pasaron dos años así. Ella cada vez hablaba más de casarse, de mudarnos. Un día me pidió que hablemos en serio. Me dijo que no podía esperar toda la vida. Yo no sabía qué decirle. No es que ella me pedía algo malo, pero yo... no sé. Sentía que no podía. Quería casarme pero con miedo, ¿vos sabés? Y mi viejo estaba ya más viejo, mi vieja me necesitaba. Ella no entendía que yo no podía dejar solos a mis viejos. Así que cortamos. Lloré esa noche. Pero era lo que había que hacer. Cada uno siguió su camino.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[AM19]`:
> Y después, cuando quedaste por tu cuenta, ¿cómo fueron esos primeros tiempos? Qué cambió en la casa y en los días, quién anduvo cerca. Si ese tiempo es el de ahora, contame igual cómo lo estás llevando. Y si no hubo un tiempo así, con decírmelo alcanza.

**Narrador** `[AM19]`: Quedé en la casa con mis viejos. Eso fue lo importante. Mi vieja me cuidaba como siempre, mi viejo estaba más lento. Yo trabajaba, llegaba, comía con ellos, ayudaba en la casa. El taller, el club, la casa. Así fue. Mi viejo murió tres años después de que cortamos con Norma. Y bueno, después me quedé cuidando a mi vieja. No hay que pasarse la vida pensando en lo que no fue. Mi vieja me necesitaba, y eso fue suficiente. Ella falleció en el 98, con ochenta y tantos años. Yo seguí en la misma casa.

**Biógrafo** `[M3.5 + AM16]`:
> Guardado, Aníbal. Te mando la próxima.
>
> Y más adelante, ¿hubo otro amor? Si hubo, contame del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado.
>
> [botones: (Sí, hubo otro) (No, nadie más)]

**Narrador** `[AM16]`: [toca: No, nadie más]

**Biógrafo** `[M25.2 + AM14]`:
> Bien, seguimos.
>
> ¿Hubo algún amor que te marcó, aunque haya durado poco o no haya llegado a nada? Si lo hubo, contame cómo se cruzaron y el momento que más te acordás de esa persona. Y si no hubo, con un no alcanza.

**Narrador** `[AM14]`: No. Marisa cuando era chico, Norma después. No hubo otra que me marcara así. Habrá miradas en el club, o una que otra vez que sentí algo, pero nada importante. La vida te da lo que tiene que dar, y yo recibí lo que recibí.

**Biógrafo** `[M26 + CI6]`:
> Gracias, Aníbal.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI6]`: [toca: No, está todo]

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M25.3 + EN7]`:
> Bien, entonces.
>
> Ahora vamos al trabajo y a tu oficio, Aníbal: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Narrador** `[TR1]`: A los diecisiete, dieciocho, hacía trabajos chicos en el barrio. Reparar cosas de metal, herramientas. Mi viejo me presentaba con los vecinos. Un señor me pidió que le arreglara una puerta, unos cerrojos. Me pagó dos pesos. Dos pesos nada más, pero para mí fue como ganar un millón. Le llevé la plata a mi vieja. Ella lloró. Después empecé el aprendizaje de verdad en el taller, con Don Gilberto. Ahí sí ganaba, ganaba poco al principio, pero era oficial.

**Biógrafo** `[M3.7 + TR6]`:
> Quedó guardado, Aníbal. Sigo con la que viene.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Narrador** `[TR6]`: Un solo trabajo. El taller metalúrgico de Arroyito, desde 1970 hasta que me jubilé. Cuarenta años. Del mismo dueño, mismo lugar. Empecé de aprendiz, trabajando con Don Gilberto. Después fui oficial, después maestro. Los años 70 eran duros, poca plata, pero había trabajo. En los 80 y 90 fue similar. No cambié de taller, no busqué otro lado. Hice piezas de metal, maquinaria, lo que venía. Lo que más me quedó fue el día que Don Gilberto me dejó al mando de una máquina grande, la más importante. Estaba nervioso, pero salió bien. Y eso, los cuarenta años haciéndolo todos los días. Eso es mi vida de trabajo.

**Biógrafo** `[M3.8 + TR2]`:
> Te escuché bien. Vamos por la siguiente.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Narrador** `[TR2]`: Siempre igual. Me levantaba a las seis, desayunaba con mi vieja. A las seis y media salía para el taller. Llegaba a las siete, nos poníamos los monos de trabajo. Primero revisabas la máquina, los planos de las piezas que tenías que hacer ese día. Después arrancabas. El ruido, el calor, el olor a metal y grasa. Trabajabas ocho horas seguidas, casi sin parar. Para el almuerzo, comía algo en la esquina, rápido. Volvías, seguía el trabajo. A las tres y media, cuatro, te ibas. Llegabas a casa, te lavabas, comías con mi vieja. Por la tarde, descansabas un poco, después ibas al club. Siempre lo mismo. Un día fue fresco todavía, hace poco, cuando hice una pieza muy complicada y salió perfecta de primera. Eso todavía me da orgullo.

**Biógrafo** `[M3.1 + TR3]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Narrador** `[TR3]`: Don Gilberto. Maestro tornero, viejo cuando empecé yo. Calvo, bigotudo, las manos llenas de cicatrices. Sabía todo del oficio. Me enseñó con paciencia, que es lo que yo aprecio. No gritaba como otros maestros, sino que te explicaba. "Así no, Aníbal, mirá cómo se hace. Las manos acá, el torno así. Precisión, ese es todo el secreto." Cuando me equivocaba, no me insultaba, sino que lo hacía de nuevo. Una tarde, yo estaba mal, mi viejo acababa de morir. Don Gilberto lo notó, me sacó del taller y tomamos un café. No dijo mucho, pero sentía que entendía. Eso no se olvida. Murió el 91 y no pude ir al velorio. Pero esa persona me hizo lo que soy.

**Biógrafo** `[M3.2 + TR5]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuál fue el día de trabajo del que estás más orgulloso? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo. Y si no te viene un día puntual, contame de qué parte de tu trabajo estás más orgulloso.

**Narrador** `[TR5]`: Una vez, hace unos veinte años, un cliente grande nos pidió unas piezas muy precisas, complicadas. El dueño del taller me las pidió a mí en especial. Pasé días en eso, midiendo, haciendo pruebas, rechazando piezas que no estaban perfectas. Al final salieron todas correctas. El dueño me las mostró al cliente y el cliente quedó contento, volvió a traer más trabajo. Ese día sentí que valía la pena todo lo que había hecho. Que con tus manos podías hacer algo bien hecho, y la gente te lo reconocía. Eso fue lo más importante en cuarenta años. No es un sueldo, no es nada material, es saber que hiciste bien tu trabajo.

**Biógrafo** `[M26 + TR11]`:
> Gracias, Aníbal.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.
>
> [botones: (Paso esta)]

**Narrador** `[TR11]`: [toca: Paso esta]

**Biógrafo** `[M27.2 + TR8]`:
> Claro, sin problema. Vamos con otra.
>
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Narrador** `[TR8]`: No, nunca tuve. Siempre trabajé para el dueño del taller, en el mismo lugar. Algunos compañeros se pusieron con su propio taller, pero yo no. Era más cómodo así, no tenía que preocuparme por dinero ni clientes ni nada. Llegaba, hacía mi trabajo, me iba. Suficiente para mí.

**Biógrafo** `[M3.4 + CS1]`:
> Gracias por contármelo. Seguimos.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Narrador** `[CS1]`: Cuidar a mi vieja. Después que mi viejo murió, ella quedó sola en casa. Yo aprendí a cocinar, a limpiar, a hacer la compra. Cuando se enfermó en sus últimos años, yo estuve con ella todas las noches, le daba los remedios, le ayudaba a caminar. Los médicos decían que eso no tenía cura, que se iba a ir. Pero yo seguía cuidándola bien. Los vecinos veían cómo estaba, bien alimentada, limpia. A veces venían y decían "qué bien la cuidás, Aníbal". Eso me gustaba. No era trabajo pago, pero era lo más importante que hice en mi vida.

**Biógrafo** `[M3.5 + CP1]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chico o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Narrador** `[CP1]`: No. Siempre en Arroyito, en la ciudad. Barrio, taller, casa, club. Nunca el campo. Mi viejo tampoco, eran de ciudad. Una vez íbamos a algún lugar en el campo los domingos, pero no era nada regular. Yo soy de ciudad, de Arroyito.

**Biógrafo** `[M3.6 + TR9]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Narrador** `[TR9]`: Sí, me jubilé en el 2010. Cumplí sesenta y uno, cuarenta años de trabajo. El último día fue un martes. El dueño me dio la mano, me deseó lo mejor. Algunos compañeros me invitaron a un café. Fue raro, porque después de tantos años, ¿vos sabés? El día siguiente no fui al taller. Me desperté a las seis como siempre, sin saber qué hacer. Mi vieja me hizo un desayuno especial. Después me fui al club, me sentí extraño. Pero bueno, la vida sigue. Ahora juego al truco, estoy en el club casi todos los días. La jubilación alcanza para vivir, para no sufrir.

**Biógrafo** `[M26 + CI7]`:
> Gracias, Aníbal.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI7]`: [toca: No, está todo]

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M25.1 + EN8]`:
> Bien, seguimos.
>
> Volvemos a la familia, Aníbal, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Y si te tocó cuidarlos, contame cómo era un día de esos: qué hacías por ellos, qué te decían. Si no los tuviste cerca, contame cómo fue eso.

**Narrador** `[PG1]`: Mi viejo murió en el 80, como ya te conté. Después fue mi vieja la que envejeció. Un día me fijé que le temblaban las manos cuando servía la comida. Otra vez se perdió en el barrio, se la encontró un vecino. Eso me asustó. Yo empecé a ayudarla más, a ir con ella a la compra, a cocinar, a limpiar la casa. Los últimos años estaba con artrosis, no se movía bien. Una noche se caía en el patio, tuve que levantarla. Le dolía todo. Yo le hacía masajes, le daba té caliente. Ella me pedía que no la dejara sola. Yo no la dejaba. Dormía en la pieza de al lado, listo para si necesitaba algo. Eso fueron sus últimos años, hasta que murió en el 98.

**Biógrafo** `[M26 + HI0 + M1]`:
> Gracias, Aníbal.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Presentámelos de a uno, incluso si alguno ya apareció en lo que me venís contando: cómo se llama cada uno y cuándo llegó. Y si no tuviste, seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, tuve) (No tuve hijos)]

**Narrador** `[HI0]`: [toca: No tuve hijos]

**Biógrafo** `[M25.2 + HI10]`:
> Bien, seguimos.
>
> ¿Algún chico o joven fue importante en tu vida? Alguien que viste crecer, a quien le enseñaste algo o tuviste cerca. Contame quién es y una vez con esa persona que no te olvidás.

**Narrador** `[HI10]`: Mis sobrinos. Martín y Lucía. Hijos de mi hermana Olga que vive en Santa Fe. No los veía mucho de chicos, pero cuando crecieron, empezaron a venir al club conmigo. Martín aprendió a jugar al truco en mis rodillas, digamos. Es un buen muchacho, ahora es grande. Una vez lo llevé al taller, le mostré cómo funcionaba el torno, qué se hacía. Él estaba fascinado. Lucía, la más chica, crecía en las tardes que venía a visitarme. Comíamos juntos, me ayudaba en la casa. Son mis sobrinos, ¿vos sabés? La familia que tengo. Los quiero.

**Biógrafo** `[M26 + CI8]`:
> Gracias, Aníbal.
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

**Narrador** `[LU4]`: No viajo mucho, la verdad. Una vez con mi viejo, cuando yo tenía unos quince años, fuimos a Santa Fe a visitar a mi hermana Olga. El viaje en tren fue lo más interesante para mí. Iba mirando los campos por la ventana, las puebladas. Nunca había visto tanto espacio abierto. Llegamos a Santa Fe, los cuadriculones de la ciudad, muy diferente a Rosario. Comimos en casa de Olga, los sobrinos eran chiquitos entonces. Volvimos al otro día. Fue corto, pero me quedó. Después casi no viajé. Rosario es mi ciudad, Arroyito mi barrio. No necesitaba irme.

**Biógrafo** `[M3.1 + PA1]`:
> Gracias, Aníbal. Ya lo guardé.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Narrador** `[PA1]`: El club. El Social Arroyito. De chico jugaba al básquet, era lo mío. Cuando envejecí, dejé de jugar, pero seguí yendo. Aprendí a jugar al truco y quedé enganchado. Es lo que me gusta. Un día que le dediqué... cualquier día que voy al club es similar. Me levanto, desayuno, voy al club a las nueve. Juego una partida, después otra. Comemos algo, hablamos de la política, del fútbol. Juego de nuevo. Vuelvo a casa a las cinco, seis. Como con lo que hay, descanso. Y al otro día, lo mismo. El club ha sido mi vida. Es donde tengo amigos, donde me siento vivo. Hoy sigo yendo, aunque los dolores de la edad te limitan.

**Biógrafo** `[M26 + CI9]`:
> Gracias, Aníbal.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquilo.
>
> [botones: (No, está todo)]

**Narrador** `[CI9]`: [toca: No, está todo]

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M25.1 + EN10]`:
> Bien, seguimos.
>
> Hablemos de los amigos, Aníbal, y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Narrador** `[AS1]`: Roberto. Lo conocí en el taller, pero nos hicimos amigos de verdad en el club. Trabajaba en la misma metalúrgica. Él sí se casó, tiene hijos, pero los sábados iba al club y nos juntábamos a jugar. Es más charlatán que yo, siempre contando historias, bromeando. Una vez me pidió que lo acompañara a comprar un regalo para su hijo pequeño. Fuimos juntos, eligió un juguete. Después tomamos un café. Él me dijo que me veía solo, que debería tener mi propia familia. Yo no le contesté. Pero se veía que le importaba. Eso es lo que digo de la amistad: no necesitas que el otro entienda tu vida, solo que le importe.

**Biógrafo** `[M3.3 + AY1]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Narrador** `[AY1]`: Cuando mi viejo murió. No sé cómo actué esos días. Era como estar en tinieblas. Mi vieja lloraba, yo tenía que ser el fuerte, pero estaba destrozado. Don Gilberto vio que no me movía del taller, que estaba como ausente. Un día me llevó a su casa, me presentó a su familia, me dieron comida, bebida. No me pidieron que hablara, solo estaban ahí. Después, Don Gilberto me puso a trabajar en lo que más me gusta, hacer piezas complicadas. Me sacó del desgano. A cambio, cuando él envejeció, a los 80, le ayudé a limpiar su casa, lo acompañaba al médico. No fue mucho, pero fue lo que pude.

**Biógrafo** `[M3.4 + AS9]`:
> Gracias por contármelo. Seguimos.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Narrador** `[AS9]`: Mi hermana Olga, que vive en Santa Fe. Martín y Lucía, mis sobrinos. Roberto del club, y otros compañeros del taller que siguen vivos. Y si pudiera, mi vieja. Ella se merecería ver que estoy bien, que el trabajo que hizo cuidándome valió. Olga me cuidaba también a su manera, desde lejos. Los sobrinos son mi familia joven. Roberto me hizo reír en momentos oscuros. Los compañeros del taller, los que trabajaron conmigo todos esos años, son mis hermanos de verdad. Eso sería mi mesa. Gente que me importó, que me vio crecer, que no se olvidó de mí.

**Biógrafo** `[M26 + CI10]`:
> Gracias, Aníbal.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquilo.
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

**Narrador** `[PE1]`: Mi viejo, en el 80. Mi vieja, en el 98. La muerte de mi viejo fue de repente, no te prepara para eso. Pero mi vieja fue largo, la vi envejecer día a día. Los últimos años la cuidé, pasé las noches con ella. Ella me llamaba "hijo" en los momentos confusos. Cuando murió, quedó silencio en la casa. Se ve que yo esperaba ese silencio, pero cuando llegó, fue raro. Me dedicaba a limpiar la casa, a poner orden, como si eso me ayudara. Después fui al club y los compañeros me abrazaron sin decir nada. Eso fue suficiente. De mi vieja me queda una vez que estábamos en el patio, ella viendo el sol, sonriendo. No decía nada, solo estaba ahí conmigo.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Paso esta)]

**Narrador** `[PE5]`: Un infarto en el 2015. Tenía setenta y dos años. Fue en la tarde, estaba en casa. Sentí un dolor acá que me bajaba por el brazo. Llamé a la ambulancia, llegó rápido. Hospitalizado una semana. Creí que me moría. Los doctores vinieron, me hablaban, pero no entendía. Después, en la cama del hospital, empecé a pensar en todo lo que había hecho. Es raro cuando creés que te vas. Roberto vino, mis sobrinos mandaron recados. La Olga vino desde Santa Fe. Pasó, pero quedó la marca. Ahora tomo pastillas, voy al cardiólogo, no como sal. Los dolores quedan, a veces un pinchazo en el pecho me asusta. Pero sigo. La muerte está cerca a los setenta y siete, eso aprendí.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Aníbal. Queda guardado con cuidado.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Y si ya me la contaste, con decírmelo alcanza.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Paso esta)]

**Narrador** `[PE4]`: [toca: Paso esta]

**Biógrafo** `[M27.3 + CI11]`:
> Perfecto, Aníbal. No hace falta entrar ahí. Vamos con la que viene.
>
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

**Narrador** `[HG1]`: El 78 cuando ganamos el Mundial. Eso se recuerda. Estaba en el club con toda la gente viendo por un televisor blanco y negro. Cuando Kempes hizo el gol, la gente se volvía loca. Abrazos, gritos. Yo no era futbolista, pero ese día todos éramos iguales. Después el 82 con la Guerra de Malvinas. Eso fue difícil. Mucha gente joven se iba a la guerra. En el taller escuchabas a los compañeros preocupados por sus hijos. Fue una época rara, oscura. Muchos no volvieron. El país estaba dividido. Yo en mi casa con mi vieja, ella rezaba por los chicos que se iban. Esos momentos grandes no me tocaban mucho en lo personal, pero los vivías porque los demás los vivían.

**Biógrafo** `[M3.6 + HG4]`:
> Lo tengo, gracias. Vamos con otra.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado. Y si ninguno se te separa de los demás, contame cómo eran tus días entonces.

**Narrador** `[HG4]`: Un día en el 2020 cuando cierran todo. Yo estaba en la casa, el club cerró, no podía ir. Fue como perder mi vida, ¿vos sabés? Los primeros días pensé que era poco, dos semanas dijeron. Después pasaron meses. Yo solo en la casa, que es grande, que tiene silencios. No podía ver a Roberto ni a los otros compañeros. Un vecino me traía las compras, yo desde adentro recibía todo con las manos limpias. Tenía miedo de enfermo, a esa edad. Vi en la tele que la gente se moría. Me sentía como preso en mi propia casa. Pasaron los meses. Una vez pude hablar con Martín por teléfono, me pidió que cuide la salud. Eso fue suficiente para sentir que alguien me necesitaba. Pero fue duro. El club reabrió en el 21 y volví. Fue lo mejor del año.

**Biógrafo** `[M3.7 + DE1]`:
> Quedó guardado, Aníbal. Sigo con la que viene.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Narrador** `[DE1]`: No vivir con alguien sin estar casado. Cuando yo tenía veinticinco, treinta años, eso era pecado. Un compañero del taller conoció una chica en una fiesta, la invitó a vivir con él sin casarse. Su familia casi lo mata. La gente en el barrio hablaba mal de él. "Qué vergüenza", decían. Hoy eso es normal. La gente se junta, prueba, después se casan o no. Mi vieja lo decía: "Eso es deshonra". Yo no pensaba igual, pero no lo decía. A Norma, cuando éramos novios, su familia nos pedía que nos casáramos rápido. Hoy una relación así de tiempo sería... bueno, sin mucha presión. Y sobre el divorcios, imposible en esos años. Ahora se separa la gente y vida nueva. Son tiempos diferentes.

**Biógrafo** `[M3.8 + FI7]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Narrador** `[FI7]`: La política... no me mete mucho. En el taller hablábamos, pero yo prefería trabajar. Hubo épocas oscuras, cuando los militares estaban. Vos escuchabas cosas raras, desapariciones, pero en Arroyito era lejano. Después llegó la democracia y pensábamos que todo iba a cambiar. Pero la plata seguía siendo difícil. He visto muchos presidentes, muchas promesas. El peronismo, los radicales, gente que entra y sale. A vos en el barrio lo que te importa es si hay laburo, si comes. La política es de los que tienen tiempo para pensar en eso. Yo siempre traté de no meterme, de trabajar nada más. Pero se ve que eso nunca sirve. Igual ahora que estoy jubilado escucho las noticias en el club. El país sigue con los mismos problemas.

**Biógrafo** `[M26 + CI12]`:
> Gracias, Aníbal.
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

**Narrador** `[GI1]`: Un domingo en el club, cuando tenía unos treinta y cinco años. Hacía sol, estaba con Roberto, unos cuantos amigos. Habíamos ganado una partida de truco. Salimos al patio, nos tomamos una cerveza. Roberto dijo algo sobre la vida que pasa rápido. Yo miré el cielo, los árboles del club, la gente jugando. Sentí algo como... estoy donde tengo que estar. No tenía dinero, no tenía pareja, pero estaba contento. Eso fue un clic. Entendí que la vida no es tener, sino estar. Volverías ese día porque era simple, real, sin pretensiones. Ahora que estoy viejo, entiendo que eso fue lo mejor que tuve: la tranquilidad de saber quién soy.

**Biógrafo** `[M3.2 + GI2]`:
> Te escuché. Vamos con la que sigue.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó. Si ya me lo contaste, con decírmelo alcanza. Y si el día justo no te vuelve, contame lo que te acuerdes de esa época.

**Narrador** `[GI2]`: El día que murió mi viejo. Arrancó normal, me desperté, desayuné con él y mi vieja. Se fue al taller como siempre. Yo también fui. Pasado el mediodía, un compañero vino corriendo al taller: "Tu viejo, una ambulancia". Fui rápido pero ya no estaba. Lo encontré en el hospital. Ahí no hay vuelta atrás. Un momento sos uno, al siguiente sos otro. Vos no querés ser el hombre de la casa, pero lo sos. Mi vieja me necesitaba. Norma quería que nos casar amos, que tuviéramos una familia. Pero yo no podía dejarla sola. Ese día cambió todo. Entendí que tenía que cuidar a mi mamá antes que vivir mi vida. Y así pasó hasta que ella murió.

**Biógrafo** `[M3.3 + HJ1]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Narrador** `[HJ1]`: Casarme, tener familia. Cuando Norma me pidió que hablemos en serio, en mi mente supe que no podía. Fue como estar en una habitación oscura y saber que la salida está atrás pero no tenés coraje de irte. Ella lloraba, yo miraba para otro lado. Ese día entendí que eso no iba a ser para mí. Después pasaron años, envejeci, y se fue la ilusión. Ahora a los setenta y siete, veo que nunca pasó. Trabajo, club, mi vieja que cuidé. Fue suficiente, pero hay un hueco. No me arrepiento porque las cosas fueron así, pero sí hay un "qué hubiera pasado". Eso es de los viejos, quedarse pensando en los caminos que no tomaste.

**Biógrafo** `[M3.4 + GI9]`:
> Gracias por contármelo. Seguimos.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquito frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor. Y si no te vuelve un momento puntual, contame frente a qué cosas te pasa eso.

**Narrador** `[GI9]`: En el hospital, cuando mi viejo murió. Esperando en la sala, sin poder hacer nada. Yo que trabajaba con máquinas, que le ganaba a lo físico con mis manos, ahí no servía de nada. La muerte es más grande que vos. También cuando mi vieja envejeció y no podía pararla de temblar. Era pequeño, impotente. Y el río. Una vez fuimos con mis amigos al río, miraba el agua pasar, el tiempo pasando. Sentí que yo era como una hora en esa agua, una gota. Los árboles que están hace cien años siguen ahí y vos te vas. Eso te pone en tu lugar, ¿vos sabés? Que no sos nada grande. Que tu vida es pequeña pero es tuya, y eso es lo que importa.

**Biógrafo** `[M3.5 + FI1]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos mismo? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Narrador** `[FI1]`: La soledad es mi vida, qué voy a decir. Después que murió mi vieja, la casa se quedó vacía pero llena de recuerdos. La soledad duele al principio. Pero aprendí a llevarla. Las mañanas, desayuno en silencio, leo el diario. Es bueno, eso me ordena el día. En la pieza de mi vieja, a veces entro, cierro la puerta. Eso es soledad, pero no es malo. Después voy al club y eso me saca de la casa. La noche es lo más difícil. Cuando termino de comer, de limpiar, la casa hace ruido de vieja. Pero me acostumbré. Ahora a los setenta y siete, pienso que la soledad es lo que te queda al final. La gente se va muriendo. Los que quedan están ocupados con sus vidas. Yo tengo mis días, mi rutina. No es triste siempre. A veces es paz.

**Biógrafo** `[M3.6 + FI2]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Narrador** `[FI2]`: Una vez en el club, un chico joven, de veinte y poquitos, me pidió un consejo. Me llamó "Don Aníbal". Yo le dije que me hable de vos. Pero fue raro, ¿vos sabés? Ese "don" me golpeó. Yo no me sentía viejo. Pero para alguien de veinte, uno de setenta es un viejo. Y en el espejo, otra cosa. Hace poco me corté el pelo y me miré. Las manos llenas de manchas, la cara caída, los ojos hundidos. Dije "este es vos ahora, Aníbal". No te lo esperas. Vos sigues siendo joven adentro, pero el cuerpo traiciona. Y los amigos del taller que murieron. Don Gilberto, otros. Pasó el tiempo sin que te dieras cuenta. De golpe te despertás viejo.

**Biógrafo** `[M3.7 + FI3]`:
> Quedó guardado, Aníbal. Sigo con la que viene.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Narrador** `[FI3]`: El silencio de mi viejo. Él no era de hablar mucho, y yo tampoco. Roberto me lo decía, que era duro, que no expresaba mis cosas. Pero eso viene de mi papá. Él trabajaba, llegaba, comía, descansaba. Poco diálogo. Mi vieja era más cariñosa, más cálida. De ella heredé eso de cuidar. Cuando mi viejo envejeció, yo lo cuidé. Cuando fue mi vieja, lo mismo. No lo pensaba, era automático. Mi vieja dejaba todo por la familia. Y el trabajo, de mi viejo. Él se levantaba cada día, iba al taller, hacía su deber. Yo hice lo mismo cuarenta años. No buscaba reconocimiento, solo hacer el trabajo bien. Eso es ser hijo. Heredás sin darte cuenta y después es lo que sos.

**Biógrafo** `[M3.8 + FI4]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Narrador** `[FI4]`: No mucho, pero sí. La gente en el barrio hablaba cuando Norma se fue. Decían que era extraño un varón soltero viviendo con su vieja. Eso te molesta, aunque no lo muestres. Pero qué hago, ¿me voy? Mi vieja me necesitaba. Cuando hice el trabajo en el taller que salió bien, me sentí reconocido. Quizás sí me importa ser respetado como trabajador. Que digan "Aníbal hace bien las cosas". Eso sí. Pero la vida personal, lo que hago en mi casa, lo que decido, eso no. Robero me decía que me casara, que tuviera hijos. Yo escuchaba pero no lo hacía. Los vecinos veían que cuidaba bien a mi vieja, eso les importaba. Al final, si trabajás bien y cuidás a los tuyos, la gente respeta. El resto no cuenta.

**Biógrafo** `[M3.1 + FI6]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Narrador** `[FI6]`: No sé. Probablemente habrá máquinas que no entiendo, tecnología, otra gente. Yo estaré muerto hace mucho. Pero espero que no se pierda el respeto por el trabajo bien hecho. Que haya gente que como yo o Don Gilberto, haga las cosas con precisión, con cuidado. Que no todo sea rápido y mal. Y la familia, qué sé yo, que siga habiendo gente que se cuide mutuamente. Martín y Lucía van a ser viejos también en cien años, sus hijos y nietos. Espero que se acuerden que había un tío que se llamaba Aníbal que no tuvo hijos pero que quiso a su gente. El barrio de Arroyito probablemente sea otro. Pero que haya un lugar donde los viejos se junten, como el club. Eso es importante. El trabajo, la familia, los amigos. No necesitas mucho más.

**Biógrafo** `[M26 + CI13]`:
> Gracias, Aníbal.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquilo.
>
> [botones: (No, está todo)]

**Narrador** `[CI13]`: [toca: No, está todo]

## Bloque 14 · Hoy

**Biógrafo** `[M25.2 + EN14]`:
> Bien, seguimos.
>
> Dejamos el pasado un rato y venimos a hoy, Aníbal: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Narrador** `[HO1]`: Me levanto a las seis y media, como siempre. Costumbre de toda la vida. Desayuno té con tostadas, leo el diario. A las ocho me baño, me visto. A las nueve salgo para el club. Llego, saludé a los compañeros. Jugamos al truco hasta el mediodía. Nos vamos a comer algo en la cantina, hablamos de política, del fútbol. Después una partida más. A las tres, cuatro, vuelvo a casa. Descanso un poco, veo televisión. Preparo algo para cenar, algo simple. Come, lavo los platos. Antes de dormir leo un poco o escucho radio. Me meto en la cama a las nueve. Y mañana lo mismo. Todos los días igual. Algunos días viene Martín y salimos a caminar, o llama mi hermana. Pero en general es esto: el club, la casa, la comida, dormir. A mi edad ya no necesitas tanto.

**Biógrafo** `[M3.3 + HO2]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado. Y si la última no te vuelve, contame con qué te reís seguido.

**Narrador** `[HO2]`: Las bromas en el club. Un compañero viejo se olvidó su plata en la mesa y todos le decíamos que se la habían robado para gastársela en chicas. Él se molestaba y eso nos hacía reír más. También cuando ganan en el truco de manera rara, algún juego medio imposible. Y Roberto, que sigue haciendo chistes a pesar de los años. Habla de su mujer, de sus hijos que lo ignoran. Es chistoso pero triste. Reímos porque si no, lloramos. La última vez que me reí con ganas fue hace poco cuando me burlé de un compañero que se puso un pelo nuevo, un pelucón. Le dije que parecía un actor de cine. Se enojó pero bueno, después nos reímos todos. A mi edad la risa es medicina, ¿vos sabés?

**Biógrafo** `[M3.4 + HO5]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Narrador** `[HO5]`: La paz. No tener que preocuparme por nada. La jubilación alcanza, como te dije. El club, mis amigos, la rutina. Sé dónde voy a estar el lunes, el martes. Eso da tranquilidad. Esta semana, el miércoles, jugué tres partidas de truco seguidas y gané todas. Salí caminando del club al anochecer, el cielo naranja, el barrio tranquilo. Pensé "Aníbal, vos llegaste a viejo con salud, con amigos, con un lugar donde ir." Eso es lo que me gusta ahora: saber que tengo un lugar. La vida simple, sin sobresaltos. Algunos todavía buscan cosas, hacer negocios, conocer gente. Yo ya no. Tengo lo que necesito. Eso me gusta.

**Biógrafo** `[M3.5 + CO1]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Narrador** `[CO1]`: Un guiso de carne. Lo aprendí de mi vieja. Ella cocinaba eso cuando teníamos poco dinero. Carne, papas, cebolla, tomate. Simple pero que llena. Cuando mi vieja envejeció, yo le hacía todos los días. Se lo hacía bien hecho, como le gustaba. Ahora sigo haciendo lo mismo. A veces viene Martín y le digo que se quede a comer. Hago mi guiso y se lo doy. Él come y me dice "tío, está igual que lo hacía la abuela". Eso me pone contento. La receta es de mi vieja, pero ahora es mía. Es la comida que voy a dejar, si es que eso importa. Cuando muera, Martín va a acordarse del guiso de Aníbal. Eso es lo que te queda.

**Biógrafo** `[M3.6 + HO9]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Narrador** `[HO9]`: La casa es la de mis viejos. Nunca nos fuimos. Tiene setenta años, más o menos. Paredes gruesas, piso de baldosines, un patio grande. Se ve vieja. El techo gotea a veces, las ventanas son de otro tiempo. Pero es mía, es lo que tengo. El barrio, Arroyito, también envejeció. Hay casas que se caen de viejas. El club está ahí todavía, eso es lo importante. La verdulería de don José cierra, abren otras cosas. Los árboles de la calle crecieron. Es un barrio de gente trabajadora, como siempre. A veces paseo por ahí y veo casas que antes eran nuevas, ahora están destartaladas. Y los viejos del barrio desaparecen. Un día pasé por la casa de Roberto y vi que vivía gente nueva. Me asusté un poco. Pero mi casa sigue ahí, esperándome cada día.

**Biógrafo** `[M26 + CI14]`:
> Gracias, Aníbal.
>
> Con esto cerramos lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquilo.
>
> [botones: (No, está todo)]

**Narrador** `[CI14]`: [toca: No, está todo]

## Bloque 15 · Legado y cierre

**Biógrafo** `[M25.3 + EN15]`:
> Bien, entonces.
>
> Ya estamos en la última parte, Aníbal: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Narrador** `[LE1]`: Haber cuidado a mi vieja. Cuando murió, no tenía ni un remordimiento. La cuide bien, con amor, sin quejarme. Los años cuando más difícil fue, ahí estaba yo. Eso me da más orgullo que todos los trabajos del mundo. Y el trabajo bien hecho, cuarenta años haciendo lo mismo con precisión. Mucha gente probablemente usa algo que yo hice, una pieza que sale de mi taller. Eso es anónimo, pero está. Y la familia, que me respete. Martín y Lucía saben que tenían un tío que se preocupaba por ellos. Nadie lo notaba quizás, pero estaba. No soy un hombre que conquistó cosas grandes ni dinero. Pero soy un hombre que estuvo donde lo necesitaban. Eso me da orgullo. Que cuando se muera, alguien diga "Aníbal fue un buen tipo, sin quilombos."

**Biógrafo** `[M3.8 + LE2]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos mismo descifraste viviendo.

**Narrador** `[LE2]`: Que no todo lo que querés en la vida se da. Eso hay que aprenderlo. Yo quería casarme, tener hijos, quizás viajar. Nada de eso pasó. Pero la vida te da otras cosas, si sabés verlas. Que hay belleza en lo simple. Un truco ganado, un guiso bien hecho, un amigo que te escucha. No necesitas mucho. Que el trabajo honrado es importante, no porque te haga rico sino porque vos sabés que hiciste bien. Y lo más importante: que la familia importa. No esperes a que te lo digan, ponete a cuidarlos mientras vivos. Porque después no hay tiempo. Mi vieja no está más y hay cosas que quería decirle. Eso no se recupera. Y que no tengas vergüenza de estar solo. La soledad no es fracaso, es parte de la vida. Aprendé a vivir con vos mismo sin culpa. Eso es libertad.

**Biógrafo** `[M3.1 + FU1]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Narrador** `[FU1]`: Volver al taller. Entro, todo está igual pero no está. Otras máquinas, otros compañeros jóvenes. Me acerco al torno que era mío. El dueño me saluda, me deja tocar la máquina una última vez. Hago una pieza perfecta, como en los viejos tiempos. Veo salir la pieza y sonrío. Después Martín viene a buscarme, tomamos un café. Caminamos por Arroyito, él me muestra cómo cambió el barrio. Vamos al club juntos, jugamos al truco. Gano. Los compañeros me aplauden. Y eso es todo. Estar un día más en el club con mis amigos, eso es lo que me queda. Quizás un viaje con Olga antes de que sea tarde. Sentarse bajo el sol con ella, hablar sin prisa, saber que fuimos hermanos toda la vida. Eso me gustaría. El tiempo me lo va a decir si se da.

**Biógrafo** `[M3.2 + LE7]`:
> Te escuché. Vamos con la que sigue.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Narrador** `[LE7]`: "La casa de Arroyito". Porque nunca me fui de ahí. Es lo que define mi vida, la casa de mis viejos, el barrio, el club que está al lado. Todo pasó en ese mismo lugar. Nací ahí, crecí, trabajé, envejecí. Mientras otros andaban por el mundo, yo estaba en la misma casa mirando por la misma ventana. Algunos dirían que es triste. Pero para mí es la historia. La casa de Arroyito que vio nacer a un chico, envejecer a sus padres, quedarse solo a ese hombre. Es un título simple, como la vida misma. Y el club es lo que los demás no ven en la portada, pero está adentro en cada capítulo. La casa y el club. Eso es todo.

**Biógrafo** `[M3.3 + M15]`:
> Lo anoté, gracias. Sigo con otra.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> Tío, ¿es verdad que una vez salvaste al club con una rifa? Martín

**Narrador** `[FAM1]`: Sí, es verdad. Fue en los ochenta, cuando el club tenía deudas. Nadie sabía cómo pagar. Yo era tesorero por esos años. Se me ocurrió hacer una rifa, vender números. Trabajé con otros compañeros, armamos una rifa de un televisor que donó alguien. Vendimos todos los números en el barrio. Ganamos plata suficiente para pagar lo que debía el club. No fue nada del otro mundo, pero el club se salvó. Algunos compañeros dijeron que había sido idea mía, pero fue de todos. Yo solo llevé los números de un lado a otro. Martín, cuando lo hice no pensé que te acordarías. Fue hace cuarenta años. Pero me da alegría que lo hayas escuchado. Eso es lo que te dejo, que ayudés a tu gente cuando lo necesita.

**Biógrafo** `[M3.4 + FO1]`:
> Gracias por contármelo. Seguimos.
>
> Otra cosa, Aníbal. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Tomate el tiempo que necesites para buscarla: la pregunta que sigue te la mando cuando me llegue la foto o me digas algo. Y si no la encontrás, no pasa nada: el libro va igual, y la podés mandar más adelante.
>
> [botones: (No tengo foto)]

**Narrador** `[FO1]`: [toca: No tengo foto]

**Biógrafo** `[M25.1 + LE9]`:
> Bien, seguimos.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Narrador** `[LE9]`: Que le diga a Martín y a Lucía que los quiero. Que sigan adelante, que se cuiden. Martín, vos que sos varón como yo, aprendé a trabajar con honestidad, a cuidar a la gente que te ama. Lucía, vos sos mujer, siguen los tiempos cambiando, podés hacer lo que quieras. No como mi época. Y que se acuerden de Arroyito, del club, del lugar donde sus raíces están. Que no olviden de dónde vienen. Y a mi hermana Olga, que siga con salud. Nosotros ya andamos cerca del final, pero la vida fue buena. Nada fácil, pero buena. Y si alguien lee esto, que sepa que hubo un hombre llamado Aníbal que se quedó en el mismo barrio toda la vida, que trabajó, que quiso a su familia en silencio, y que eso está bien. No hace falta viajar ni tener mucho. Está bien quedarse en casa.

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Narrador** `[LE8]`: A Martín: vos que fuiste mi sobrino favorito aunque no debería decirlo. Que te vaya bien en la vida. Acordate que el día en el taller que te mostré las máquinas, vos sonreíste. Eso para mí fue importante. Cuidate, trabajá bien, sé un buen hombre.

A Lucía: sos hermosa. Sigue adelante como vos sabés, sin miedo. La vida es para vivirla, no para quedarse en la casa como yo. Vos tenés el derecho que yo no tuve.

A mi hermana Olga: gracias por existir. Por ser mi hermana. Aunque nos vimos poco, siempre eras parte de mí. Que vivas muchos años más.

Y a todos los que leen esto: no tengo dinero que dejarles. No tengo cosas grandes. Pero les dejo esta: que la vida está acá, en los simples. En trabajar bien, en cuidar a los tuyos, en estar cuando te necesitan. Eso es todo lo que tengo para dejar. Que les vaya bien. Que sean felices. Que no tengan miedo de quedarse solos. Aníbal.

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Aníbal. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Y si te quedó alguna foto por mandar, mandámela por acá cuando la encuentres: entra igual. Fue un gusto enorme escucharte.
