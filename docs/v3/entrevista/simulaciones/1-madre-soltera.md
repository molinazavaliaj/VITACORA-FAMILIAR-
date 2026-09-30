# Simulación 1: la madre soltera (Nelly, 68, inventada)

**Qué es:** la entrevista de un narrador **inventado** (Nelly), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Plan: [`PLAN.md`](PLAN.md).

**Cuenta:** 91 preguntas del banco contestadas + 1 de la familia · **130 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas van juntas en ese mensaje); **Narrador** es lo que contestó. Los títulos de bloque y los IDs (entre corchetes) son para el equipo: el narrador no los ve.

**Biógrafo** `[BIEN]`:
> Hola, Nelly, ¿cómo estás? Una persona que te quiere mucho te regaló un libro con la historia de tu vida, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.
>
> Funciona así: te mando una pregunta y vos me la contás en audio, como si me lo estuvieras contando en persona. Mandame todos los audios que quieras. Cuando termines, ya está: con un ratito de silencio, la pregunta que sigue te llega sola.
>
> Si alguna pregunta no tiene que ver con tu vida, me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro: esto lo hacemos al ritmo que vos quieras.

## Bloque 1 · Origen y raíces

**Biógrafo** `[OR1 + M1]`:
> Empecemos por cuando llegaste al mundo, según te contaron. No el día en sí, sino la época: dónde vivían, en qué andaban tu mamá y tu papá, cómo te esperaban. ¿Qué sabés de cómo era la vida de ellos en ese entonces? Contame.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR1]`: Ay, bueno, eso me lo contó mi mamá. Mirá, yo nací en Villa María, allá en Córdoba, año 58. Mi papá trabajaba en el ferrocarril, viste, era ferroviario de oficio. Mi mamá cosía, cosía todo el día en casa pero también por encargo. Me decía que cuando yo iba a nacer estaban en una casa de alquiler, nada de lujo, pero bueno. Mi papá feliz porque yo iba a ser la primer mujer de la familia, viste, después nacería mi hermano Rubén, pero primero fui yo. Mi mamá decía que me esperaban con ganas, aunque la vida era de apretarse el cinturón, ¿viste? Pero eso, eso fue el 58 cuando me dijeron que era el principio de todo para nosotros.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Nelly. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR2]`: Uh, sí sí, mi papá contaba mucho sobre los abuelos. Mi abuelo paterno fue ferroviario también, de los que laburaban en la vía, arreglaban los tramos, un laburante como decían. Mi papá contaba que el abuelo viajaba en los trenes, que él había viajado incluso a Buenos Aires cuando era más joven, cosa que nosotros no hacíamos. Una vez mi papá contó en la mesa que el abuelo se había quedado dormido en un tren cerca de Rosario y bajó en una estación que no era, todo oscuro, con las valijas y todo, pensando que estaba perdido. La gente del andén le decía dónde estaba. Nos reíamos, viste, porque después terminó bajando en el lugar correcto. Era la historia de un hombre que trabajaba fuerte pero que la vida le daba esos sustos. Mi mamá contaba menos, la verdad, pero sí recuerdo que su papá había sido zapatero, y que hacía zapatos con las manos. Esas cosas, viste, historias de laburar.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR5]`: Ay, eso mi mamá lo contaba con una sonrisa, viste. Ella decía que se conocieron en un baile en Villa María, en la plaza o en algún salón, no me acuerdo bien. Mi papá había ido con unos amigos del ferrocarril, y mi mamá estaba ahí con su hermana. Mi papá le pidió un baile, me decía que fue directo, sin vueltas. Mi mamá al principio no quería porque era tímida, pero bueno, bailaron. Después mi papá empezó a ir a visitarla a casa de mi abuela, se tomaban unos mates, conversaban. Mi mamá contaba que mi papá era un hombre callado pero trabajador, que le gustaba que una mujer supiera trabajar también, viste. Se casaron cuando eran jóvenes, todavía, y comenzaron a armar la familia. Era una historia simple, de esas que pasaban, pero bueno, eso nos trajo a nosotros.

**Biógrafo** `[M26 + CI1]`:
> Gracias, Nelly.
>
> Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora.

**Narrador** `[CI1]`: Bueno, mirá, una cosa que se me viene a la cabeza ahora... Mi mamá cosía en una pieza de la casa, y yo me acuerdo de que había telas por todos lados, maniquíes, cajas con botones y cierres. Mi papá en cambio era todo orden, todo en su lugar. Ellos se peleaban por eso, viste, mi mamá le decía "dejame los retazos, que de eso hago las cosas", y mi papá se quejaba del desorden. Pero bueno, se querían, eso se notaba. Otra cosa que me acuerdo es que mi abuela materna iba a visitarnos y se sentaban a coser juntas, mi mamá y mi abuela, hablando de la vida, de los maridos, de los hijos. Yo las escuchaba desde otro lado, pequeña, sin entender mucho. Eso sí, eso se me quedó grabado, viste, el sonido de la máquina de coser y sus voces. Eso es familia para mí.

## Bloque 2 · La casa y la familia de la infancia

**Biógrafo** `[M24.1 + EN2]`:
> Gracias, Nelly. Eso también va al libro.
>
> Ahora vamos a tu infancia: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Narrador** `[CA1]`: Uh, mirá que viejo ese recuerdo, viste. Me acuerdo de estar en el patio de la casa, no era grande, pero tenía un árbol de duraznos. Yo estaba ahí, tendría cuatro años, cinco años, sacando fruta que se había caído. Mi mamá estaba adentro cosiendo, podía oír la máquina. Mi papá llegó del trabajo, me vio ahí con las manos llenas de durazno, y se rió. Me levantó en peso, así, con todo el tizne que tenía. Me acuerdo del olor de su ropa de trabajo, a sudor, a polvo del ferrocarril. Mi hermano Rubén estaba más grande, andaba por la calle con otros chicos. Eso, ese momento, con mi papá levantándome, la máquina de coser de fondo, el árbol. Cuando pienso en la infancia, vuelvo a ese lugar, a eso. Después todo se mezcla, pero ese primer momento está claro.

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chica. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Narrador** `[CA2]`: Mi mamá era cálida, viste, pero siempre estaba ocupada. Siempre había algo que hacer. Pero yo me acuerdo de que cuando terminaba de coser un vestido que le encargaban, me lo mostraba primero a mí. Me decía "mirá, vos qué te parece", aunque yo fuera chica y no entendiera mucho. Eso me hacía sentir importante, viste. Una vez me enseñó a enhebrar la aguja, me puse toda nerviosa. Ella me tomaba la mano, bien pacientemente, y me guiaba. Eramos las dos ahí, al lado de la ventana para que entrara la luz. No decía mucho, mi mamá, era de pocas palabras, pero sentías el cariño. Cuando me dolía algo, me metía en la cama, me hacía un té con miel y limón, me tapaba con una cobija vieja que tenía para mí. Ella no era de besos y abrazos, así, medio exagerado, pero vos sabías que estabas protegida, ¿viste? Que ella estaba ahí para vos.

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Nelly. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chica? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Narrador** `[CA3]`: Mi papá trabajaba en el ferrocarril, eso de por sí. Arreglaba la vía, montaba cambios de rieles, esas cosas. Una vez, tendría yo unos siete u ocho años, me llevó a la estación. Quería mostrarme dónde trabajaba. Fue un viaje especial, viste, porque no era común que hiciera eso. Me mostró los rieles, los vagones estacionados, los talleres. Había otros ferroviarios ahí, amigos de mi papá, y le decían que era linda mi hermana. Yo me sentía orgullosa de que fuera mi papá, que tuviera una responsabilidad, que fuera alguien. Vi cómo hablaba con los otros trabajadores, con respeto, como igual. Mi papá volvía del trabajo siempre cansado, eso era lo normal. Se lavaba las manos en el patio, se cambiaba, se sentaba a tomar mate con mi mamá. La ropa le olía a trabajo, a esfuerzo. Cuando venía enfermo, no decía nada, sólo se acostaba y se recuperaba. Así era él, sin quejas.

**Biógrafo** `[M3.6 + CA6 + M1]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste hermanos? Si tuviste, ¿con cuál eras más cercana de chica? Contame alguna aventura que hayan hecho juntos; seguro tienen varias.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[CA6]`: Sí, tuve un hermano, Rubén, que en paz descanse. Él era mayor que yo, unos años mayor. No éramos muy unidos de chica, viste, porque él siempre estaba con sus amigos, andaba en la calle, en la cancha. Yo era la hermana menor, la que molestaba un poco. Una vez me acuerdo que me llevó a ver un partido de fútbol en un terreno baldío, allá en Villa María. Yo no entendía mucho de fútbol, pero me sentía importante de estar con él. Rubén era más bravo que yo, más impetuoso, decía lo que pensaba. Yo era más callada. Después cuando crecimos, la relación cambió, nos vimos más de adultos que de chicos, si me entendés. Rubén pasó por sus cosas, yo pasé por las mías. Pero siempre fue mi hermano, viste, se lo quería. Cuando murió, fue duro. Ahora que está el tiempo, pienso en eso, en que qué hubiera pasado si nos hubiéramos visto más. Pero bueno, la vida, es así.

**Biógrafo** `[M3.7 + CA16]`:
> Listo, quedó guardado. Sigo.
>
> Contame un día de chica que esperabas con muchas ganas: qué era, quién estaba, qué pasó.

**Narrador** `[CA16]`: Ay, sí me acuerdo. El día del cumpleaños de mi mamá, ella no era de hacer fiestas grandes, pero ese día era especial. Mi papá compraba algo de carne, mi mamá hacía unos fideos caseros, y Rubén y yo ayudábamos. Yo estaba toda emocionada, viste, todo el día preparando. Mi abuela venía a visitarnos, y traía un budín o una torta que hacía ella. Ese día mi mamá no cosía, eso era lo importante. Se sentaba con nosotros, hablábamos, reíamos. Yo le hacía algún dibujo, algo de nada, pero para ella era. Después nos tomábamos una foto, si había máquina, o simplemente nos sentábamos en el patio a mirar las nubes. Esos días eran raros, viste, porque la casa era diferente, como si respiraras distinto. Todo el año estábamos en el trabajo, en los quehaceres, pero ese día era para ella, para que supiera que la queríamos. Eso es lo que me acuerdo, eso me gustaba.

**Biógrafo** `[M3.8 + CA17]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[CA17]`: Uh, mirá, una cosa que me marcó fue cuando me enfermé grave siendo chica, tendría unos diez años. Fue una neumonía o algo así, no me acuerdo bien el nombre. Estuve en cama mucho tiempo, con fiebre, toda adolorida. Mi mamá prácticamente no se separó de mí. Se sentaba al lado, me daba medicinas, me hacía bebidas calientes. Mi papá traía los remedios, estaba preocupado. Rubén iba y venía. Recuerdo que tenía miedo, viste, de que no fuera a mejorar, de que algo malo pasara. Pasé unos días en los que me dolía todo. Mi mamá lloraba en silencio cuando pensaba que no me veía. Eso me marcó, ver a mi mamá así de asustada. Cuando finalmente mejoré, fue como si toda la familia respirara de nuevo. Desde ese momento entendí que la vida era frágil, que podía pasar cualquier cosa. Aprendí también que mi mamá me quería mucho, mucho, de una manera que no se podía negar. Eso me quedó adentro, para siempre.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Nelly. Queda guardado con cuidado.

**Biógrafo** `[CI2]`:
> Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquila, que hay tiempo.

**Narrador** `[CI2]`: Sí, sí, me viene una cosa. La escuela, viste. Yo iba a una escuela pública en Villa María, y ahí me llevaba bien con mis compañeras, pero no era de tener una mejor amiga de esas que son para toda la vida. Éramos amigas de ida, de jugar en el recreo. Lo que sí me acuerdo es que la maestra, la señorita Rosa, nos enseñaba a leer y a escribir con una paciencia... Ella nos traía libros, nos leía historias. A mí me encantaba. Creo que ahí nació en mí el gusto por aprender, por leer. Los fines de semana, mi mamá me compraba revistas viejas, o conseguía libros de vecinas, y yo los leía todo el rato. Mi papá no entendía mucho por qué yo estaba siempre con la cabeza en un libro, pero mi mamá me dejaba. Eso fue formando quien soy, creo, ese gusto por los historias, por saber qué pasaba más allá de Villa María.

## Bloque 3 · La escuela y los juegos

**Biógrafo** `[M24.2 + EN3]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad.

**Biógrafo** `[ES1]`:
> ¿Cómo fue tu primer día de escuela? ¿Quién te llevó hasta la puerta, y qué sentiste cuando se fue? Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria.

**Narrador** `[ES1]`: Me lo acuerdo bien, sí. Mi mamá me llevó de la mano, yo tendría cinco o seis años, iba con uniforme nuevo que mi mamá había cosido con tanto cuidado. Estaba nerviosa, me acuerdo que caminábamos hacia la escuela, y mi mamá me decía "no tengas miedo, la maestra es buena, vas a aprender cosas lindas". Entramos al patio, había otros chicos, para mí era un montón. La maestra nos recibió en la puerta del aula. Mi mamá me dejó en la silla, me dijo que me portara bien, que no hiciera lío. Cuando se fue, yo sentí que se me caía el mundo, viste, fue la primera vez que quedaba sola entre extraños. Lloré, pero la maestra me sentó al lado de otra nena y rápido me distrajo. Me acuerdo de los pupitres de madera, del olor a tiza, de la pizarra verde. El primer día fue largo, pero cuando mi mamá volvió a buscarme, corrí a sus brazos como si no la viera hace meses. Después la escuela se convirtió en mi lugar, en donde aprendía y estaba bien.

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Nelly. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Narrador** `[ES2]`: Sí, la Señorita Rosa fue especial para mí. Era una maestra joven, pero con autoridad, viste. Te miraba a los ojos cuando te hablaba, como si realmente le importaras. Una vez, cuando yo estaba en tercero o cuarto grado, cometí un error en la tarea, no sé qué error bobo. Ella me pidió que me quedara después de clase. Pensé que me iba a retar, estaba asustada. Pero no, me explicó con paciencia dónde estaba el error, me lo mostró en la pizarra, me dijo que yo tenía cabeza para aprender mejor que eso. Después me preguntó por mi casa, por mi familia, cómo andábamos. Le conté que mi mamá cosía, que mi papá trabajaba en el ferrocarril. Ella sonrió y me dijo "tu mamá trabaja duro, vos tenés que trabajar duro también en la escuela, así conseguís algo mejor que eso para vos". No lo dijo mal, viste, lo dijo con cariño. Pero me quedó, eso de que la escuela era mi camino. La Señorita Rosa me marcó de esa forma, me enseñó que había alguien que creía en mí.

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chica, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Narrador** `[ES5]`: Sí, sí, había una nena, Graciela, que vivía cerca de casa. Íbamos juntas a la escuela, volver era toda una aventura, viste. Nos parábamos a mirar los vidrios de las tiendas, inventábamos historias sobre la gente que veíamos. Ella me hacía reír mucho, era más bravia que yo, decía cualquier cosa sin filtro. Una vez fuimos al río que pasaba por Villa María, nada de loco, pero para nosotras fue como ir a la selva. Nos sentamos en las piedras, sacamos unos sanguchitos que mi mamá me había preparado, y Graciela empezó a cantar canciones que aprendía en casa, canciones de folclore. Yo la escuchaba y pensaba que ella era especial, que tenía algo que yo no tenía. Después Graciela se mudó, su papá consiguió trabajo en otra ciudad. Nos dijimos que nos íbamos a escribir, pero bueno, la vida... Uno se pierde. Pero ese momento, en las piedras del río, con ella cantando, eso me quedó. Esa amistad duró poco, pero fue bonita.

**Biógrafo** `[M3.3 + ES6]`:
> Anotado. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chica, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Narrador** `[ES6]`: Ay, no era de hacer muchas travesuras, viste, era bastante chica callada, obediente. Pero una vez, tendría unos ocho años, me meti en problemas. Estábamos en la escuela, en el recreo, y encontré en el aula una tiza de color que no era de nadie. Yo dibujé en la pared del patio un caballo, nada de cosas malas, solo un caballo. Pero era la pared del colegio, viste, no se podía. Me vieron otros chicos y corrieron a avisar a la directora. La directora me llevó a la dirección, estaba furiosa. Yo temblaba, pensé que me iba a expulsar. Llamó a mi mamá y todo. Mi mamá llegó preocupada, dispuesta a defenderme. Pero la directora explicó que había sido una travesura, nada grave. Mi mamá me miró con tal decepción que eso fue peor que cualquier castigo. Después limpié la pared como pude. Mi mamá no me gritó, pero me dijo que había defraudado la confianza de la escuela, y eso me dolió más. Desde ese día, fui bastante cuidadosa con las reglas.

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Narrador** `[ES7]`: Bueno, mirá, de chica no tenía un gran sueño, viste. Veía a mi mamá cosiendo y pensaba que eso era lo que hacían las mujeres, trabajar con las manos. Pero también la veía cansada, dolida de los hombros, de los ojos, de tanto coser. Yo no quería eso para mí, aunque le tenía respeto al trabajo de ella. Lo que sí me atraía era la idea de trabajar en una oficina, algo así, donde fuera más limpio, con gente, sin tanto esfuerzo físico. Mi papá a veces hablaba de que yo estudiara, que terminara la escuela y después viera. La Señorita Rosa también me decía que podía llegar a más. Así que fui pensando en estudiar algo comercial, algo que me permitiera estar adentro, en un escritorio. No era un sueño grande como ser doctora o abogada, pero para mí, era lo máximo. Quería que mi vida fuera diferente a la de mi mamá, que fuera un poco más fácil. Eso me movía, ese miedo de terminar igual de cansada que ella.

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Nelly. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chica? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Narrador** `[ES9]`: Sí, sí, éramos católicos, todos. Mi mamá iba a la iglesia cuando podía, aunque estaba ocupada. Mi papá iba a veces, en días de fiesta. Yo me acuerdo de mi primera comunión, ay, eso fue un día importante. Tendría unos ocho años. Mi mamá me cosió un vestido blanco, ella misma, especial para ese día. Pasó todo un mes trabajando en eso, entre los encargos y el vestido. Yo estaba tan emocionada, viste, sentía que era un día mío. El día de la comunión, fuimos a la iglesia con la familia. El cura nos bendijo, nos dieron la hostia. Yo estaba nerviosa, pero sentía algo importante, algo grande. Mi papá estaba ahí, en el banco de la iglesia, con el único traje que tenía. Mi mamá lloraba de emoción cuando salí del altar. Después fuimos a casa, y aunque no fue una fiesta grande, mi abuela vino, nos hizo un asado, comimos todos juntos. Mi mamá me mostró a los abuelos el vestido que había hecho, estaba orgullosa. Eso quedó grabado, ese sentimiento de ser importante, de que mi mamá había hecho algo especial para mí.

**Biógrafo** `[M26 + CI3]`:
> Gracias, Nelly.
>
> Con esto cerramos tus años de escuela. Antes de seguir, ¿te quedó alguna historia de esa época dando vueltas, algo que no entró en ninguna pregunta? Contámela ahora, con calma, que la quiero escuchar.

**Narrador** `[CI3]`: Ay, sí, me viene algo. Los días de lluvia. Villa María llovía bastante, y cuando llovía, la escuela era diferente. Había un olor a tierra mojada que entra por las ventanas, todo se ponía gris. La maestra nos juntaba adentro, no había recreo en el patio. Nosotros nos aburríamos un poco, pero ella nos contaba historias, o nos hacía escribir sobre nuestros sueños. Yo escribía sobre viajes, sobre lugares que nunca había visto. Me acuerdo que una vez escribí sobre un tren que viajaba a Buenos Aires, algo que mi papá nos había contado. La maestra leyó mi texto y me dijo que escribía lindo. Eso fue importante para mí, porque confirmó que había algo en mí, en las palabras que yo escribía, que les gustaba a otros. Esos días de lluvia, aunque parecía que nada pasaba, fueron días en los que yo crecía, en donde me daban herramientas para soñar con algo más que Villa María.

## Bloque 4 · Adolescencia

**Biógrafo** `[M24.3 + EN4]`:
> Bien, Nelly. Lo sumo a lo que ya me contaste de eso.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chica y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Narrador** `[AD2]`: A los trece, catorce años estaba en el secundario comercial. Me había inscripto mi papá, porque decía que eso me daba una salida laboral. Pasaba los días en la escuela, aprendiendo taquigrafía, mecanografía, contabilidad, esas cosas. Después llegaba a casa y ayudaba a mi mamá un poco, hacía tareas, estudiaba. Mi papá seguía en el ferrocarril, mi mamá seguía cosiendo. Los domingos iba a la misa con mi mamá, después caminábamos un poco por Villa María. Una vez me acuerdo que una compañera de la escuela, Beatriz, me invitó a ir a un baile de los viernes en una plaza. Yo quería ir pero no sabía si mi papá me dejaría. Le pregunté, y al final me dejó, con la condición de que fuera con mi mamá o con alguien de confianza. Así que fuimos Beatriz y yo, y mi mamá nos llevaba y volvía a buscarnos. Era un baile para adolescentes, con música, muchachos. Yo estaba toda nerviosa, no sabía muy bien qué hacer. Una vez un chico me pidió un baile, pero yo me asusté y dije que no. Beatriz se burlaba, viste. Pero eso, esos bailes, eran los momentos en que dejábamos de ser chicas y empezábamos a mirar a los chicos de otra forma.

**Biógrafo** `[M3.7 + AD3]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Narrador** `[AD3]`: Sí, a los quince, dieciséis tenía una barra, nada de cosas locas, viste, éramos adolescentes de pueblo. Estaban Beatriz, que ya te mencioné, estaba Marisa, que vivía cerca, y después Susana. Nos juntábamos los viernes o los sábados a la tarde en la plaza, nos tomábamos un helado si había plata, o simplemente caminábamos. Hablábamos de los chicos que nos gustaban, de la escuela, de qué íbamos a hacer cuando termináramos. Marisa tenía un novio, el primer novio de la barra, así que ella era la que más sabía. Nos contaba historias, nos reía un poco de que nosotras aún no tuviéramos. Una vez, tendría dieciséis años, fuimos todas juntas a una fiesta que hacía el padre de una compañera de la escuela. Fue en una casa grande, bueno, para nosotras era grande. Había música, gente que bailaba, y de repente aparece Héctor. Era un chico que trabajaba con mi papá en el ferrocarril, un poco mayor que nosotras, viste. Me miró, y yo sentí que se me caía. Bailamos esa noche, todo el tiempo. Al final me pidió direcciones, me dijo que quería volver a verme. Yo estaba en las nubes.

**Biógrafo** `[M3.8 + AD5]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche.

**Narrador** `[AD5]`: Esa noche de la fiesta fue mi primera salida de noche de verdad, viste. Me preparé todo el día, nerviosa. Me puse un vestido que mi mamá me había hecho, nada de loco, pero me sentía linda. Ella me peinó, me dijo que me portara bien, que volviera temprano. Mi papá medio gruñía, desconfiado de que yo saliera de noche, pero mi mamá le explicaba que iba a ir acompañada. Fuimos Beatriz y yo caminando hasta la casa donde era la fiesta. Llegamos y estaba lleno de gente, música a todo volumen, un ruido que no estábamos acostumbradas. Nos asustamos un poco, pero entramos. Después vio a Héctor y para mí el mundo desapareció. Como te dije, bailamos toda la noche. Él me decía cosas lindas, me hacía reír. Yo sentía que algo pasaba dentro mío, algo nuevo, algo que no sabía bien qué era. Cuando llegó la hora de irme, Héctor me acompañó hasta cerca de la casa. Me dio un beso en la mejilla, me pidió direcciones. Volví caminando con Beatriz como en una nube. Esa noche cambió algo para mí, abrió una puerta a otra Nelly, a la Nelly que empezaba a ser mujer.

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Nelly. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Narrador** `[AD6]`: Eso fue Héctor. Él fue el primer muchacho que me gustó en serio. Después de esa noche de la fiesta, empezó a venir a visitarme a casa. Mi papá lo veía venir y fruncía el ceño, pero mi mamá era más tolerante. Héctor era trabajador, tenía un buen cuerpo de los trabajos en el ferrocarril, tenía una sonrisa que te hipnotizaba. No era de muchas palabras, pero cuando hablaba, decía cosas importantes. Nos sentábamos en el patio o en la sala, y conversábamos de todo. Él me contaba de su familia, que vivía en el sur, que quería ahorrar para poder mudarse y progresar. Yo soñaba con que quizás yo iría con él. Una noche, estábamos los dos solos en el patio, bajo las estrellas. Él me pidió que fuera su novia, y me besó. Fue mi primer beso de verdad, viste, algo que te marca toda la vida. Yo estaba enamorada, segura de que él iba a estar para siempre. Pasamos casi dos años juntos, haciendo planes, viéndonos a escondidas de mi papá a veces. Pero después vino la oportunidad de trabajo en el sur, en la Patagonia, y él decidió irse. Me dijo que volvería, que solo eran unos meses para ahorrar. Pero no volvió.

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chica? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Narrador** `[AD12]`: Uy, eso fue después de que Héctor se fue. Un mes, dos meses después, me di cuenta de que algo raro estaba pasando en mi cuerpo. Tardé en comprender, viste, yo era chica, no sabía mucho. Pero empecé a sospechar. Fui a una farmacia, compré una prueba, no sé bien cómo, y me encerré en el baño de la casa. Cuando vi el resultado, sentí que el mundo se caía. Estaba embarazada. Yo tenía diecinueve años, recién cumplidos. No sabía qué hacer, me quería morir. Mi primer pensamiento fue en mi papá, en cómo se lo iba a decir. Llamé a Héctor, le conté por teléfono. Él quedó mudo. Después me dijo que no podía volver, que las cosas estaban complicadas, que necesitaba tiempo para pensar. Eso fue el fin. Me quedé sola con la noticia, con todo el peso encima. Tuve que decirle a mi mamá. Fue una noche terrible, viste, ella lloró, no de tristeza sino de rabia, de frustración. Mi papá casi no habló, solo dijo que tenía que ser fuerte. Y eso hice. Decidí que iba a tener al bebé, que iba a salir adelante. Ese fue el momento en que dejé de ser chica. Fue de un día para otro. De repente tenía una responsabilidad grande, un hijo que cuidar, un futuro que armar.

**Biógrafo** `[M3.3 + AD15]`:
> Anotado. Sigo con otra.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[AD15]`: Bueno, de todo eso, lo más duro fue el embarazo mismo. Porque cuando la gente se enteró, empezaron los comentarios, viste. Villa María es pueblo, todos se conocen, todos hablan. Yo que había sido la chica tranquila, la que estudiaba, de repente era la chica madre. Mis amigas, incluso Beatriz, empezaron a alejarse. Algunos me miraban mal en la calle, las madres de compañeras me cuidaban, como si fuera a contagiarles el mal. Mi papá no quería salir porque le daba vergüenza. Mi mamá me decía que no importaba lo que pensaran, pero vos veías el cansancio en su cara. El embarazo fue difícil, me dolía todo, estaba asustada. Cuando llegó el momento del parto, fue doloroso, pero cuando vi a Pablo, cuando lo tuve en los brazos, todo cambió. Ese bebé fue mi razón, mi fuerza. Lo miré a los ojos y pensé que valía la pena todo lo que había sufrido. Pero esos meses antes, las miradas, los comentarios, eso me marcó. Aprendí a endurecer la piel, a no importarme lo que pensaran, porque mi hijo era lo único que importaba.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquila, que hay tiempo.

**Narrador** `[CI4]`: Mi mama fue lo mas importante despues de tener a Pablo. Ella dejo sus encargos de ropa para ayudarme con mi hijo. Yo estaba asustada, no sabia que hacer. Mi mama me ensenaba, me guiaba cada paso. Una noche Pablo lloraba y yo no sabia que hacer, estaba cansada. Mi mama se levanto, me lo quito de los brazos y lo acuno. Me dijo descansa, yo me encargo. Y me dormi con una calma que no tenia antes. Eso fue clave para mi. Entendi que mi mama iba a estar ahi siempre, aunque estuviera cansada. Mi papa cambio cuando conocio a Pablo. Vino al hospital, lo miro dormido, y se le caian las lagrimas. Nunca lo habia visto asi. Desde ese momento fue otro abuelo. Esos primeros meses con Pablo, rodeada de mi mama y mi papa, fueron duros pero hermosos.

## Bloque 5 · Juventud

**Biógrafo** `[M24.4 + EN5]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Pasamos a tu juventud, Nelly: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Narrador** `[JU1]`: Ay, eso fue un día importante. Cuando Pablo tenia nueve anos, yo consigui un trabajo mejor en la ciudad de Cordoba, en una cooperativa electrica. El sueldo era mejor, habia mas trabajo estable. Mi papa se puso triste pero mi mama entendio que tenia que hacer eso para crecer. Nos mudamos Pablo y yo, en una casa de alquiler, nada de lujo, pero era nuestra. El primer dia que salimos de Villa Maria, Pablo estaba asustado, no conocia la ciudad. Yo estaba nerviosa tambien. Mi mama lloro en la puerta, mi papa me dijo que fuera fuerte, que lo iba a lograr. Despues visito a los viejos cada dos o tres meses, cuando tenia plata para viajar. La ciudad fue dura al principio, Pablo tuvo que adaptarse a la escuela nueva, yo tenia que trabajar full time, cuidarlo, arreglarmelas. Pero poco a poco, nos fuimos acomodando. Cordoba fue nuestro hogar, viste, ese fue el lugar donde Pablo crecio, donde conoci a otras personas, donde me hice mujer de verdad.

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Narrador** `[JU2]`: Despues del colegio no segui estudiando en la universidad, viste, no era para mi. Termine el comercial y necesitaba trabajar. Mi primer trabajo fue en un supermercado en Villa Maria, de cajera. Me levantaba temprano, trabajaba ocho horas, volvia cansada. Con Pablo chiquito, tenia que arreglarmelas entre el trabajo y el hijo. Mi mama siempre estaba ahi para ayudarme. Cuando me mude a Cordoba, primero estuve desempleada un tiempo, eso fue duro, porque no sabia si iba a conseguir nada. Despues cai en la cooperativa electrica como administrativa, entrando datos, ayudando en el departamento. Ese trabajo fue estable, me permitio vivir un poco mejor. Un dia que me acuerdo, estaba trabajando en el supermercado y un senor me pregunto si queria aprender a hacer otra cosa, me dijo que yo tenia cara de ser inteligente. Eso me motivo, viste, me hizo pensar que podia ser algo mas que una cajera. Eso fue lo que me movio, ese comentario bobo de un senor, me dio fuerzas para seguir adelante.

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Nelly. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Narrador** `[JU4]`: Ay, eso es la costura, viste. Mi mama me la enseno de chica, pero no la hice en serio hasta despues. Cuando me mude a Cordoba y tuve que trabajar en la cooperativa, me di cuenta que el sueldo no me alcanzaba. Un fin de semana, mi mama vino a visitarme y vio que yo estaba agobiada por la plata. Me dijo por que no cosias de noche, en mis tiempos libres. Yo al principio dude, porque estaba cansada, pero bueno, probar. Compre una maquina de coser usada, la arregle como pude, y empece a coser. Los primeros trabajos eran malos, torpemente hechos. Pero poco a poco me fui afinando. Aprendi a arreglar pantalones, a hacer vestidos simples, cortinas, lo que fuera. Eso me dio ingresos extra. Pasaba los viernes y sabados cosiendo en la noche, con Pablo durmiendo en la habitacion de al lado. Fue duro, dormir poco, trabajar mucho, pero eso me permitio tener un poquito mas en el bolsillo. La costura se convirtio en mi segunda vida, viste, algo que hacia con las manos y que me daba dinero.

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Narrador** `[JU5]`: No, yo no tuve experiencia militar, soy mujer y eso no era para nosotras en esa epoca. Pero lo militar como disciplina, si, lo vivia en casa. Mi papa era un hombre de orden, de autoridad, y cuando se enojaba, se enojaba. Me enseño a levantarme temprano, a no quejarme, a hacer lo que tenia que hacer sin excusas. En el colegio comercial, la directora era una mujer seria, casi militar en su forma de ser. Castigos si llegas tarde, si hablas en clase, si no haces las tareas. Yo tenia miedo de ella, pero tambien le tenia respeto. Una vez llegue tarde a la escuela y la directora me hizo quedarme sin recreo, de castigo. Fue humillante, viste, porque todos mis compañeros se iban al patio y yo me quedaba barriendo un aula. Eso no me gusto, pero entendia que habia consecuencias. Esa disciplina dura, aunque no me gustaba, me forma. Aprendi que los compromisos hay que cumplirlos, que la responsabilidad es importante. No era una disciplina maltratadora, pero era firme, viste.

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Si te pasó, contame cómo lo decidiste: qué te empujó y a quién se lo dijiste primero.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[JU8]`: Si, ya te conté que me mude a Cordoba. Eso fue el viaje mas importante que hice. Primero fui sola a entrevistarme para el trabajo, estaba nerviosa, no conocia la ciudad. La cooperativa me contrato y me dijeron que tenia que empezar en dos semanas. Fui a Villa Maria y se lo dije a mis papas. Mi papa casi se cae, no queria que me fuera. Mi mama lo entendia, sabia que eso era una oportunidad. Fue duro avisarle a Pablo que nos ibamos, el estaba en la escuela, tenia amigos. Pero le explique que era para vivir mejor. Viajamos en autobus, Pablo y yo, con dos maletas nada mas. Cuando llegamos a Cordoba, me senti chiquita, asustada. Pero tenia que ser fuerte. Encontre un departamento para alquilar en un barrio humilde, y empece a trabajar. No me arrepenti, viste, eso fue el mejor paso que pude haber hecho. Ahora mi vida en Cordoba es normal, es mi hogar, aunque extraño a mis viejos.

**Biógrafo** `[M3.8 + JU12]`:
> Escuchado. Vamos por la siguiente.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue?

**Narrador** `[JU12]`: Ay, ese departamento fue lo mio. Era pequeño, en una casa vieja dividida en muchos departamentos, en el barrio del Abasto. Una pieza para dormir, una cocina chiquita, un bano compartido. No tenia agua caliente los primeros meses, era helado ducharse. La ventana daba a la calle, veia pasar a la gente, vecinos que se volvian amigos, el movimiento de la ciudad. Lo arme poco a poco. Mi mama me regalo unas sabanas viejas, mi papa arreglo una cama que consiguio usado. Yo compre cortinas en el mercado, las cosi yo misma para que no fuera tan triste. Habia humedad en las paredes, pero poco a poco le fui agregando cosas. Un cuadro que dibuje, plantas, lo basico. La primera noche fue rara, viste, escuchaba ruidos de otros departamentos, gente en la calle. Pablo tenia miedo, se metio en mi cama. Yo estaba asustada tambien, pero le dije que erabamos seguras, que ese era nuestro lugar. Despacio, ese departamento se convirtio en hogar. No era lindo, pero era mio, habia trabajado duro para tenerlo. Eso me hizo sentir orgullosa.

**Biógrafo** `[M3.1 + JU15]`:
> Gracias, Nelly. Ya lo guardé.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Narrador** `[JU15]`: Mis amigas de esos años eran vecinas del departamento, otras mujeres que criaban solas a sus hijos como yo. Estaba Marta, que vivia en el departamento de abajo, y su hija tenia la edad de Pablo. Estaba Rosa, que cosía conmigo en la noche, nos hacíamos compañia. Nos juntabamos en la cocina de alguna, haciamos té, hablábamos de nuestras vidas, de los hijos, del trabajo. Eso fue terapia, viste, poder hablar con otras mujeres que entendiân lo que era criar sola, trabajar, conseguir plata. Una vez, Marta organizo una cena entre vecinas, trajo unos fideos que habíamos cocinado todas. Nos sentamos en el pasillo porque no habia espacio, reiamos, contábamos historias. Una de las chicas contó que su ex la habia dejado por otra, y todas le dimos animo. Eso, eso fue un momento que me quedó. Esas mujeres fueron mi familia en esos años duros. Con Rosa, aprendí tecnicas nuevas de costura, nos ayudábamos. Fue una amistad de necesidad, de sobrevivencia, pero fue sincera, sin falsedades.

**Biógrafo** `[M3.2 + JU17]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[JU17]`: Ay, si. Fue en los años dos mil uno, dos mil dos. La economia de Argentina colapso. La gente perdia sus trabajos, los bancos cerraban, la plata no valia nada. Yo estaba en la cooperativa pero el sueldo cada vez valia menos. No alcanzaba para nada. Pablo tenia hambre, viste, y yo no podia comprarle comida como antes. Fue la epoca mas dura de mi vida, peor que cuando estaba embarazada siendo chica. Habia momentos en que tenia que elegir entre comer yo o que comiera Pablo, y obvio elegia a mi hijo. Me puse flaca, enfermiza. La costura me permitio un poquito mas, pero habia meses que casi no tenia encargos. Yo lloraba de noche, en la cama, pensando si íbamos a poder salir de esa. Mi mama me enviaba cosas desde Villa Maria cuando podia, para ayudar. Fue un tiempo de pobreza real, viste, no es un dicho. Pasamos esa crisis porque fuimos fuertes, porque conocía a Marta y a otras que compartían comida, que se ayudaban. Cuando la economia empezo a mejorar, fue como respirar de nuevo. Eso me marcó para siempre, esa sensacion de no saber si iba a poder alimentar a mi hijo.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI5]`:
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.

**Narrador** `[CI5]`: Me acuerdo de las tardes de lluvia en Cordoba, cuando Pablo llegaba del colegio y nos sentábamos en el balcón a mirar llover. Yo le contaba historias mientras comíamos algo simple, un té con galletas. Él me contaba de la escuela, de sus amigos, de sus sueños. Esos momentos eran caros para mí, viste, porque eran nuestros, tranquilos, sin preocupaciones. Una vez Pablo me pregunto por qué Héctor no venia a vernos, y yo tuve que explicarle de la forma más suave que pude. Él lloró un poco, pero después entendio. Esas conversaciones duras entre madre e hijo me envejecieron, pero también me hicieron fuerte. Recuerdo también mi primer dia de trabajo en la cooperativa, estaba tan nerviosa. Una de las chicas de la oficina me invitó a almorzar, me mostró el camino, me ayudó a sentirme menos sola. Eso fue importante, viste. Todo eso, esos pequeños momentos, fue lo que me hizo sobrevivir esos años.

## Bloque 6 · Amor y pareja

**Biógrafo** `[M24.1 + AM0 + M1]`:
> Gracias, Nelly. Eso también va al libro.
>
> Ahora vamos al amor. Haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después vamos de a una, empezando por la primera que fue en serio. Si no hubo, decímelo nomás, que también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM0]`: Bueno, mirá, eso no fue nada, la verdad. Una sola vez fue en serio, y eso fue Héctor, de lo que ya te conté. Despues hubo algunos que pasaron, viste, hombres que me miraban, que querían salir, pero yo estaba demasiado ocupada con Pablo, con el trabajo, con la costura. Habia uno que se llamaba Juan, en el departamento, que me traía cosas, que queria ser algo mas conmigo. Pero yo le dije que no, que mi vida estaba con mi hijo, que no tenia tiempo ni cabeza para eso. Los anos pasaron y la verdad es que no tuve pareja de verdad. Hubo algunos flirteos, nada serio. El tiempo se fue y de repente ya tenia treinta anos, cuarenta anos. Los hombres ya no miraban igual, claro. Eso no me importaba mucho, viste, yo habia hecho una vida, tenia a Pablo, tenia mis amigas, tenia mi trabajo y mi costura. Algunos hombres vinieron y fueron, pero ninguno fue para quedarse. Es un poco triste decirlo asi, pero bueno, eso fue mi vida. No fue una historia de romance, fue una historia de sobrevivencia y de hijo.

**Biógrafo** `[M3.3 + AM1]`:
> Anotado. Sigo con otra.
>
> Contame el día que se conocieron. ¿Dónde fue, quién los presentó o cómo se cruzaron? ¿Y qué fue lo primero que te llamó la atención de esa persona?

**Narrador** `[AM1]`: Fue en una fiesta en Villa María, como ya te dije. Yo tenía dieciséis años, iba con mis amigas. Héctor estaba ahí con unos compañeros del ferrocarril, donde trabajaba con mi papá. Él no era del pueblo, había llegado a trabajar tiempo atrás. Cuando lo vi, me quedé mirando, viste. Tenía una forma de moverse, seguro de sí mismo pero sin arrogancia. Los ojos oscuros. Lo que me llamó la atención fue que me miró a mí, de todas las chicas ahí, y algo pasó. Él se acercó, me pidió un baile sin mucho preámbulo. Yo estaba nerviosa, pero bailamos. Me hablaba mientras bailaban, me contaba de sus sueños de progresar, de ahorro. Me besó al final de la noche, en la puerta de la fiesta. Fue mi primer beso de verdad, viste, algo que te marca. A partir de ahí, empezó a venir a casa de mi papá, a visitarme. Mi papá lo veía venir y gruñía, desconfiado. Pero yo estaba completamente enamorada. Eso duró casi dos años, hasta que decidió irse al sur a buscar mejor vida. Yo creía que iba a volver, pero no volvió. Eso fue lo que fue.

**Biógrafo** `[M3.4 + AM3]`:
> Gracias por contármelo. Seguimos.
>
> Y después, ¿cómo decidieron armar la vida juntos: casarse, irse a vivir, lo que haya sido? ¿Quién lo dijo primero, o se fue dando solo? Contame ese momento: dónde estaban, qué se dijeron.

**Narrador** `[AM3]`: Ay, eso no pasó, viste. Nosotros nunca vivimos juntos, nunca nos casamos. Él visitaba a mi casa, yo lo veía en secreto a veces porque mi papá no quería. Hablábamos de casarnos, de tener hijos, de armar una vida. Pero eran planes de chicos, viste, suenos sin peso. Después él empezó a hablar de la oportunidad de trabajo en el sur, en la Patagonia. Me dijo que si se iba, volvería en unos meses, que ahorraría y que después podríamos estar juntos. Yo le creí, le creí todo. Cuando se fue, fue un día normal, se despidió, me besó, me dijo que me quería. Pero los meses pasaron y no volvió. Después me enteré que estaba embarazada de Pablo, y fue para mí lo más difícil del mundo. Lo llamé, le conté, y de repente se alejó. No volvió, no se hizo cargo, no me preguntó cómo estábamos. Eso fue el fin. No nos casamos, no convivimos, fue un noviazgo de adolescente que terminó en dolor. Después de eso, la verdad es que me cerré, viste. No quería volver a pasar por eso.

**Biógrafo** `[M3.5 + AM4]`:
> Guardado, Nelly. Te mando la próxima.
>
> Hay días que quedan grabados para siempre. ¿Hubo uno en que se casaron, o en que empezaron a vivir juntos? Si lo hubo, contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó.

**Narrador** `[AM4]`: Paso, eso no me pasó. Nunca me casé ni conviví con nadie. Fue solo yo, Pablo, y después mis otros hijos, pero sin marido, sin pareja permanente. Eso fue mi vida, viste, la vida de una madre soltera. No es lo que soñabas de chica, pero es lo que tocó.

**Biógrafo** `[M3.6 + AM8]`:
> Lo tengo. Vamos con otra.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Narrador** `[AM8]`: Bueno, si pudiera guardar un momento... Me acuerdo una vez que fuimos al río, en un atardecer de primavera, cuando todo estaba floreciendo. Éramos solo nosotros dos. Héctor traía algo para comer, pan y queso, y una botella de vino barato que había ahorrado. Nos sentamos en las piedras y mirábamos el agua pasar. Él me tomaba la mano, me contaba sus planes, sus sueños. Me dijo que quería que fuera la madre de sus hijos, que quería vivir conmigo toda la vida. Yo creía cada palabra. Después nos acostamos en el pasto, mirabamos las nubes, y era todo tan simple, tan perfecto. No había preocupaciones, no había mi papá enojado, no había nada malo. Solo éramos dos chicos enamorados. Si pudiera guardar un momento, sería ese. Porque después todo se volvió complicado, doloroso. Pero en ese atardecer al río, fue real, fue hermoso. Eso es lo que guardo.

**Biógrafo** `[M3.7 + AM9 + M1]`:
> Listo, quedó guardado. Sigo.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM9]`: Paso, mejor no. Ya lo conté, viste, se fue y no volvió. Eso fue suficiente.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[AM19]`:
> Y después de esa historia, ¿hubo un tiempo en que seguiste por tu cuenta? Contame cómo era un día tuyo entonces: qué hacías, quién andaba cerca. Si no hubo un tiempo así, decime no nomás.

**Narrador** `[AM19]`: Si, claro, muchos anos de eso. Un dia tipico mio era levantarme a las cinco de la manana, hacer desayuno para Pablo, mandarlo a la escuela, irme al trabajo en la cooperativa. Trabajaba ocho horas, volvia a buscar a Pablo, comíamos lo que podia. Despues lo ayudaba con las tareas, lo mandaba a la cama, y me ponía a coser en la noche hasta las dos, tres de la manana. Sábado y domingo lo mismo, cosía. Los domingos ibamos a misa, después visitabamos a mis papas si tenia plata para viajar a Villa Maria. Eso fue la rutina durante anos, viste. No habia salidas, no habia diversiones, era trabajo y mas trabajo. Pablo crecía viendo a su mama cosiendo de noche, escuchando el ruido de la máquina. Aunque yo estaba cansada, lo hacia con amor. Mis amigas Marta y Rosa me ayudaban, nos juntábamos un rato los fines de semana, compartíamos comida. Eso era mi vida, rutina, trabajo, amor por mi hijo. No era emocionante, pero era mía.

**Biógrafo** `[M3.8 + AM16]`:
> Escuchado. Vamos por la siguiente.
>
> Si después de esa historia hubo otro amor, contame del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado. Si no lo hubo, decime no nomás.

**Narrador** `[AM16]`: No, no hubo otro amor de verdad. Ya te dije, quedé cerrada después de Héctor. Pasó el tiempo, los anos, y la verdad es que los hombres ya no miraban de la misma forma. Yo estaba ocupada con Pablo, con el trabajo, con vivir día a día. Algunos hombres fueron pasando por mi vida, que si, pero nada serio. A veces pienso que quizás perdí algo, quizás debería haber dejado que alguien se acercara más. Pero cuando miro hacia atrás, veo que logré lo importante: criar a mi hijo, que salga adelante, que sea un buen hombre. Eso fue mi amor, viste, mi verdadero amor fue mi hijo. No necesité un hombre para sentirme completa, aunque duele a veces pensar que envejecí sola.

**Biógrafo** `[M3.1 + AM13]`:
> Gracias, Nelly. Ya lo guardé.
>
> Contame una pelea que tuvieron, de esas que después dan risa. Por qué fue, quién aflojó primero y cómo hicieron las paces.

**Narrador** `[AM13]`: Bueno, si te cuento de una pelea con Pablo, mi hijo, que fue gracioso. Él tenia como quince anos, andaba en esa edad rebelde. Yo le pedí que limpie el departamento, que no habia limpiado en dos semanas. Él me dijo que no, que estaba cansado de la escuela. Me molestó su actitud, le grité un poco. Él se enojó y me dijo que por eso no tenia padre, que yo era muy dura. Eso me dolió, pero en lugar de llorar, exploté. Le dije que justamente por eso yo trabajaba día y noche, para que él tuviera comida, techo, escuela. Nos gritamos un rato, después él se metió en la pieza, yo me puse a limpiar sola, llorando de rabia. Después de un rato, Pablo salió de la pieza con una escoba en la mano y me dijo disculpame, vamos a limpiar juntos. Nos reímos después, viste, de lo bobo de la pelea. Limpiamos toda la casa juntos, con música. Eso es lo que recuerdo, la paz después de la tormenta. Con Pablo tuvimos esas peleas, pero siempre se arreglaba rápido porque nos queríamos mucho.

**Biógrafo** `[M3.2 + AM14]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Tuviste algún amor que te marcó y no fue el de toda la vida? Uno que dejó huella, aunque haya durado poco. Si te pasó, contame cómo se cruzaron y el momento que más te acordás de esa persona.

**Narrador** `[AM14]`: Bueno, después de Héctor, hace muchos anos, conocí a un señor en el trabajo, se llamaba Carlos. Él estaba separado, tenia hijos, era mayor que yo como diez anos. Un dia me invitó a tomar café después del trabajo. Yo tenia miedo, pero acepté. Él fue muy atento conmigo, me escuchaba, me hacia reír. Duró poco, como dos meses, pero me gustó la forma en que me trataba, con respeto. No fue amor como con Héctor, fue algo más suave. Pero me enseñó que todavía era capaz de sentir algo por alguien, que no estaba completamente muerta emocionalmente. Lo que más recuerdo es una tarde en una plaza, nos sentamos a mirar a los chicos jugar. Él me dijo que le gustaría tener una nena conmigo, que sería hermoso. Eso me tocó, viste, pero en ese momento yo no podía pensar en eso, Pablo era suficiente. Cuando le dije que no podía continuar, él lo entendió, fue maduro al respecto. Eso me quedó, que existieron hombres buenos que pasaron y que sin ellos fue mi vida. Pero Pablo fue lo importante.

**Biógrafo** `[M26 + CI6]`:
> Gracias, Nelly.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI6]`: No, creo que está todo. La verdad es que mi historia de amor es corta, viste. No fue una vida de película, fue una vida real, simple, con un hijo y trabajo. Está bien así. Ahora tengo mis amigas, mis hijos, mis nietos, mi costura. Eso es lo que llena mi corazón.

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M24.2 + EN7]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ahora vamos al trabajo y a tu oficio, Nelly: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Narrador** `[TR1]`: Mi primer trabajo sin cobrar fue ayudando a mi mamá a coser cuando era chica. Ella me enseñaba y yo lo hacía por que me lo pedía, viste, sin pensar en dinero. Pero mi primer trabajo de verdad, donde gané dinero, fue siendo cajera en un supermercado en Villa Maria. Tendría diecioch o diecinueve anos. El primer día estaba nerviosa, no sabía ni cómo manejar la máquina registradora. La supervisora fue dura conmigo, me gritaba si me equivocaba. Pero aprendí rápido. El primer sueldo que cobré, ay, eso fue un día feliz. No era mucho dinero, pero era mío, lo había ganado con mis manos. Me compré un vestido nuevo y unos zapatos que quería hace tiempo. El resto lo guardé, lo di a mi mamá para ayudar en casa. Ese dinero significó libertad, viste, la posibilidad de tener algo que era solamente mío. Desde ese día en adelante, trabajé. Nunca dejé de trabajar, viste, eso fue lo que me definió como persona.

**Biógrafo** `[M3.4 + TR6]`:
> Gracias por contármelo. Seguimos.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Narrador** `[TR6]`: Bueno, mirá. Primero fue el supermercado, como cajera, desde los dieciocho, veinte anos, unos cuatro anos. Después me mude a Cordoba y entré a la cooperativa eléctrica como administrativa. Eso fue mi vida durante veinticinco anos, viste, veinticinco anos en el mismo lugar. Levantarme, ir al trabajo, volver, cuidar a Pablo, ayudar en casa. Y en las noches, los fines de semana, la costura. La costura fue lo que más me pasionó porque era mío, era mi oficio, algo que había aprendido de mi mamá. En la cooperativa, fue rutina, viste, trabajo de oficina, datos, documentos, gente. Pero la costura, eso era distinto. Cuando tenía la máquina bajo las manos, sentía que estaba creando algo, transformando tela en prendas. Lo que quedó más grabado fue la cooperativa, porque pasé casi treinta anos ahí si contás hasta mi jubilación. Fue mi sostén, mi estabilidad. Pero lo que me amaba era coser. Ambos trabajos fueron mí, viste, uno por necesidad, otro por pasión.

**Biógrafo** `[M3.5 + TR2]`:
> Guardado, Nelly. Te mando la próxima.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Narrador** `[TR2]`: Un día en la cooperativa era siempre igual, viste. Me levantaba a las seis, me preparaba, tomaba un café rápido. Iba en el colectivo hasta la oficina, llegaba antes de las ocho. Abría mi escritorio, la computadora, revisaba que había que hacer. Pasaba el día entrando datos, haciendo facturas, resolviendo problemas de clientes que llamaban. Tenía colegas, mujeres mayormente, nos llevábamos bien. A las diez había un café con las chicas, a las doce iba a almorzar en la casa de una compañera a veces. Después seguía hasta las cinco de la tarde. Me iba a buscar a Pablo si lo necesitaba, o directamente a casa. Había días locos, cuando había cortes de electricidad o reclamos de clientes. Un día que me acuerdo, llegó un cliente furioso porque le cortaron el servicio sin aviso. Yo estuve dos horas ayudándole a resolver el problema, hablé con el supervisor, lo conseguí. El señor se fue contento. Eso es lo que me quedó, que aunque era rutina, habia momentos en que podía ayudar a la gente, resolver sus problemas. Eso le daba sentido a mi trabajo.

**Biógrafo** `[M3.6 + TR3]`:
> Lo tengo. Vamos con otra.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Narrador** `[TR3]`: Si, muchísimas personas me ayudaron. Mi mamá fue la más importante, claro. Pero en el trabajo, había una supervisora que se llamaba Lidia. Ella fue la que me entrenó cuando entré a la cooperativa. Yo llegué asustada, no sabía cómo trabajar con computadora, no tenía experiencia. Ella fue paciente, me enseñó paso a paso, me explicaba todo sin burlarse. Un día me equivoqué y borrré por accidente un archivo importante. Yo estaba asustada, creía que iba a perder el trabajo. Lidia vio que estaba angustiada, me llevó a un lado y me dijo que los errores eran normales, que lo importante era aprender de ellos. Recuperó el archivo, nadie se enteró. Desde ese día, ella fue como una mentora para mí. Me enseñó a manejarme con los clientes, a ser fuerte en el trabajo, a no dejarme dominar. Cuando me jubilé, ella fue una de las pocas que vino a despedirme. Me dio un abrazo y me dijo que había sido una colega valiosa. Eso quedó en mí, sabe, una persona que creyó en mí cuando yo no creía en mi misma.

**Biógrafo** `[M3.7 + TR5]`:
> Listo, quedó guardado. Sigo.
>
> ¿Cuál fue el día de trabajo del que estás más orgullosa? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo.

**Narrador** `[TR5]`: Hay dos cosas que me hacen sentir orgullosa. En la cooperativa, una vez logré resolver un problema de un cliente que había estado enojado durante meses. Nadie más había podido ayudarle. Yo investigué, busqué en archivos viejos, encontré el error que había cometido otro compañero. Hablé con el supervisor, arreglamos la cuenta. El señor lloró de felicidad cuando se enteró, viste. Ese día sentí que había valido la pena todo esos anos de trabajo. Pero lo que más me llena de orgullo es un vestido que cosí hace anos. Una señora me lo encargó, era un vestido para la boda de su hija. Yo lo hice con tanto cuidado, tanto amor, cada puntada era perfecta. Cuando me lo vino a buscar, se probó el vestido, y comenzó a llorar. Me dijo que era el vestido más lindo que había visto, que su hija iba a ser la más linda de la boda. Eso, eso fue lo mejor que pasó en mi vida laboral. Ver que lo que hice con mis manos le daba felicidad a otra persona.

**Biógrafo** `[M3.8 + TR11]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.

**Narrador** `[TR11]`: Si, eso fue en la crisis de dos mil uno y dos. Ya te lo conté un poco, pero hay un día que me quedó grabado. Era un lunes, y fue el día que decidí que tenia que vender mi máquina de coser porque necesitaba dinero para pagar el alquiler. Yo estaba sentada al lado de la máquina, mirándola, llorando. Esa máquina era lo único que tenia que era completamente mío, que me había costado aos de ahorros. Un vecino me había ofrecido dinero por ella, pero yo no quería venderla. Ese día, viendo a Pablo con hambre, sin saber qué cocinarle, decidí que tenia que hacerlo. Fui de puerta en puerta ofreciendo mis servicios de costura a precio casi regalado, para conseguir dinero extra. Un día me llamó una señora para que le arreglara un montón de ropa. Trabajé día y noche sin máquina, cosiendo a mano, me dolían las manos, estaban rojas y hinchadas. Pero gané lo suficiente para no vender la máquina ese mes. Ese fue el día que entendí hasta dónde podía llegar por mi hijo, que no había límite en lo que estaba dispuesta a hacer.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Nelly. Queda guardado con cuidado.

**Biógrafo** `[TR8]`:
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Narrador** `[TR8]`: La costura fue mi negocio, viste. No fue registrado ni nada, pero fue mío. Empezó cuando llegué a Cordoba sin dinero suficiente. Mi mamá me insistió que empezara a coser de nuevo como lo hacía cuando era chica. Con los primeros ingresos que tenia en la cooperativa, compré una máquina de coser usada en un mercadillo, no tenía garantía pero funcionaba. Empecé de noche, viernes y sábados, con Pablo durmiendo al lado. Los primeros clientes fueron vecinas, después se corrió la voz. Una señora le contaba a otra, y así. Después de años, tenia una clientela fija que me encargaba arreglos, vestidos para eventos, cortinas. No era mucho dinero, pero era constante. Eso me permitió ahorrar un poco, darle a Pablo lo que necesitaba. Cuando empezó a irle bien, me arreglé mejor el taller en una esquina de la pieza, compré una mejor máquina. Eso fue lo más mío que tuve, viste. No tenia patente ni nada, pero era mí trabajo, mi orgullo. Hoy, jubilada, sigo cosiendo porque es lo que sé hacer, lo que amo.

**Biógrafo** `[M3.1 + CS1]`:
> Gracias, Nelly. Ya lo guardé.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Narrador** `[CS1]`: Si, la cocina. Yo cocino bien, desde siempre. Aprendí de mi mamá a hacer comidas simples pero sabrosas. Mis ravioles los domingos son famosos en la familia. Todos mis hijos, mis nietos, vienen a comerlos. Una vez, hice una comida grande para mis vecinas, comida Argentina de verdad. Hice empanadas, ravioles, ensalada, todo de mi mano. Cuando lo probaron, sus caras cambiaron, viste, fue como una comunión. Una vecina me dijo que hacía años no comía algo tan delicioso, tan hecho con amor. Eso fue bonito, que la gente reconociera que la comida de una persona lleva alma. Ahora que estoy jubilada, cuido a mi nieta dos tardes por semana. Y ella adora cuando la voy a buscar a la escuela porque sabe que vamos a hacer algo rico juntos, alfajores, galletas, lo que sea. Es algo que no me pagan dinero, pero que llena mi corazón. Ver que mi nieta crece conmigo, aprendiendo a cocinar, a disfrutar de la comida como un acto de amor. Eso es más valioso que cualquier dinero.

**Biógrafo** `[M3.2 + CP1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chica o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Narrador** `[CP1]`: Paso, no trabajé en el campo. Villa María donde nací es un pueblo, pero no era del campo. De chica visitaba a mi abuela que vivía en las afueras, en un lugar más rural, pero no era mi vida. Mis papás trabajaban en pueblo, mi papá en el ferrocarril, mi mamá cosía. Después me mudé a la ciudad de Córdoba donde pasé mi vida de adulta. Así que el campo no fue para mí, viste.

**Biógrafo** `[M3.3 + TR9]`:
> Anotado. Sigo con otra.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Narrador** `[TR9]`: Si, dejé la cooperativa. Fueron treinta anos, casi. Cumplí la edad para jubilarme y pedí mi retiro. El último día fue un viernes. Todos sabían que me iba, porque lo había anunciado. Mis compañeras me hicieron una pequeña fiesta en la oficina, con pastelería, champagne barato. Fue emotivo, viste, porque ese lugar fue mi sustento, mi rutina, mi identidad durante tanto tiempo. El supervisor me despidió formal pero con respeto. Yo guardé mis cosas en una caja, fotos de mis hijos, un regalo que me habían dado años atrás. Cuando salí ese viernes, caminé lentamente, mirando el edificio. Sentía que dejaba una parte de mí adentro. El sábado siguiente no fui. Me desperté sin alarma, sin la prisa de siempre. Fue raro, viste, como no saber quién era. Pasé el día en casa, cosiendo, sin prisa. Poco a poco me acostumbré a estar jubilada. Ahora disfruto del tiempo libre, pero a veces extraño la rutina, el propósito que tenía cada día.

**Biógrafo** `[M26 + CI7]`:
> Gracias, Nelly.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.

**Narrador** `[CI7]`: Me acuerdo del olor a tinta que tenía la cooperativa. Cada vez que entraba, ese olor me hablaba, viste, era como entrar en mi lugar. Mis manos también quedaron marcadas, con callos de tanto escribir, de tanto coser. Todavía los tengo, aunque estoy jubilada. Eso soy yo, los callos de mis manos son mi historia, viste. El trabajo no fue glamoroso, pero fue honesto. Cada paso que di en esas oficinas durante treinta anos, cada costura que hice de noche, fue para que mi hijo tuviera algo. Eso es lo que llevo, eso es de lo que estoy orgullosa.

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M24.3 + EN8]`:
> Bien, Nelly. Lo sumo a lo que ya me contaste de eso.
>
> Volvemos a la familia, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Si no los tuviste cerca, contame cómo fue eso.

**Narrador** `[PG1]`: Mi mamá envejeció, viste. Yo me daba cuenta cuando iba a visitarla a Villa María. Sus manos no cosían igual, se las temblaban. Un día fue a visitarme en Cordoba, y cuando caminaba por mi departamento, me pasé de lado y se tropezó con una silla. Se cayó, nada grave, pero en ese momento sentí que mi mamá ya no era la mujer fuerte que la conocía. Lloré después de acostarla, viendo que se había envejecido. Ella se murió años después, en el 2003. Fue de repente, una enfermedad. No alcancé a despedirme como debía. Eso fue lo más duro de mi vida, viste, la muerte de mi mamá. Porque aunque estábamos separadas por la distancia, ella era mi brújula, mi fuerza. Mi papá también se puso viejo, se quedó solo en Villa María. Yo lo iba a visitar, lo ayudaba como podía. Pero no era lo mismo que tener a mi mamá. Eso cambió todo en mi vida, la muerte de mi mamá. Me hizo sentir adulta de verdad, responsable de llevar la familia adelante. Ya no había nadie a quien pedir ayuda.

**Biógrafo** `[M3.5 + HI0 + M1]`:
> Guardado, Nelly. Te mando la próxima.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Si sí, contame quiénes son, así los voy conociendo. Y si no, decímelo nomás y seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI0]`: Si, tengo dos hijos. Pablo nació en 1981, como ya sabe, de Héctor. Es mi primer hijo, el que creció conmigo en esos anos duros. Ahora tiene su vida, está casado, tiene dos hijos. Es un hombre bueno, trabajador como su abuela. Después tuve a Carina en 1987. Ella es de otro hombre, viste, pero bueno, no voy a hablar mucho de eso. Su papá no quiso saber nada, así que nuevamente me quedé sola criando. Carina fue diferente a Pablo, más rebelde, más viva. Ahora ella tiene una hija, y es una mujer fuerte. Ambos me hicieron feliz, viste, aunque fue duro criarlos sola. Esos anos con mis dos hijos eran caos, pero también los mejores años. Yo trabajaba, cosía, los llevaba a la escuela, los alimentaba. A veces no tenía un peso, pero tenia a mis hijos. Eso fue suficiente.

**Biógrafo** `[M3.6 + HI2]`:
> Lo tengo. Vamos con otra.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Narrador** `[HI2]`: Fue en un hospital público en Villa María, un día de junio, hace muchos anos. Estuve en labor todo el día, era doloroso, no sabía lo que estaba pasando. Las enfermeras fueron duras, me gritaban que pujara más. Mi mamá estaba conmigo, sosteniéndome la mano, diciéndome que fuera fuerte. Mi papá andaba afuera en el pasillo, nervioso. Cuando finalmente llegó Pablo, lo primero que sentí fue alivio. Después lloré de alegría. Lo pusieron en mis brazos, mojado, todo sucio, los ojos cerrados. Era tan pequeño, tan frágil. Lo miré y todas mis dudas desaparecieron. Este bebé era lo mío, era mi responsabilidad, pero también mi amor. Mi mamá lloró cuando lo vio, dijo que era hermoso, que tenía mis ojos. Eso momento, viéndolo a Pablo por primera vez, sintiendo su peso en mis brazos, cambió todo en mi vida. De repente, todo tenía sentido. Mi sufrimiento tenía un propósito. Este bebé era mi razón de ser, de luchar, de vivir. Eso es lo que recuerdo, viste, como si fuera ayer.

**Biógrafo** `[M3.7 + HI2b]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tuviste más hijos, o hay alguien más que sentís que criaste o cuidaste como propio? Si fue así, contame cómo fue la llegada de cada uno, con el tiempo que necesites. Cada llegada tiene su historia.

**Narrador** `[HI2b]`: Si, Carina. Ella llegó seis anos después de Pablo. Nuevamente fue en un hospital, esta vez en Cordoba porque ya me había mudado. Fue diferente, porque ya sabía qué esperar. El parto fue más fácil, más rápido. Cuando me la pusieron en brazos, fue igual de especial que con Pablo. Pero Carina era diferente desde el principio, más activa, más fuerte. Lloraba mucho, comía mucho, era un bebé exigente. Mi mamá vino a ayudarme cuando nació, se quedó una semana. Viendo a mi mamá con Carina, ayudándome, fue bonito. Pablo estaba celoso al principio, tenia seis anos, no entendía muy bien por qué había una bebé en casa. Pero poco a poco aprendió a ser hermano mayor. Los primeros anos con Carina fueron caóticos, viste, porque tenía a Pablo que iba a la escuela, y Carina bebé que demandaba todo el tiempo. Cosía de noche, trabajaba de día, criaba dos hijos. Pero cuando la miré en sus ojos, como con Pablo, sentí que todo valía la pena. Mis dos hijos fueron mi vida, mi razón de existir.

**Biógrafo** `[M3.8 + HI3]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Narrador** `[HI3]`: Pablo era tranquilo, serio de chico. Estudiaba, quería estar siempre correcto, obediente. Se parecía a mi papá en eso. Carina era todo lo opuesto, inquieta, rebelde, siempre metida en problemas. Tenia el pelo largo, quería pintárselo de colores, quería ropa que no le permitía. Me daban dolores de cabeza. Una escena que me hace sonreír es cuando Pablo tenia como ocho anos. Yo estaba cosiendo un vestido para una cliente, estaba nerviosa porque tenia que entregarlo rápido. Pablo vino, se sentó al lado mío, en silencio, viéndome trabajar. Después me pidió que le enseñe a coser. Yo le mostré, le puse una aguja en la mano, le guié. Él hizo unos puntos torpes pero hermosos. Me dijo que quería aprender para ayudarme. Se me saltaron las lágrimas, viste. Eso es lo que recuerdo de Pablo, a un chico preocupado por su mamá, tratando de ayudar. Con Carina era diferente. Una vez estábamos en una plaza, ella tendría como cinco anos, y se escapó de mis manos corriendo detrás de una mariposa. Yo corrí tras ella, asustada. Cuando la agarré, ella estaba riendo como loca, sin entender que había hecho algo peligroso. Esa es Carina, viste, siempre buscando la aventura, sin miedo.

**Biógrafo** `[M3.1 + HS1]`:
> Gracias, Nelly. Ya lo guardé.
>
> ¿Cómo viviste la crianza de tus hijos? ¿La llevaste sola, o tuviste alguna ayuda cerca? Contame un día de esa época que te acuerdes bien.

**Narrador** `[HS1]`: La llevé sola, viste, pero tuve ayuda de mi mamá y mis amigas. Mi mamá venía a Cordoba cada vez que podía, me ayudaba con los chicos, con la casa, con la costura. Sin ella no sé qué hubiera hecho. Mis amigas Marta y Rosa fueron clave también, cuidaban a los chicos cuando yo tenia que ir al trabajo, compartían comida. Un día que me acuerdo bien es cuando Pablo se enfermó de varicela. Tenia fiebre alta, lloraba de dolor. Yo estaba asustada, llamé al médico de emergencia. Me dijeron que era varicela, que tenía que dejar que se curara. Pasé toda la noche con Pablo en brazos, mojándole la frente con agua fría, dándole té. A las cuatro de la mañana, Marta se presentó en mi puerta sin que la llamara. Ella había sentido que algo pasaba, y vino a ayudar. Se sentó conmigo, cuidó a Pablo mientras yo dormía un poco. Eso fue amor, viste, la solidaridad de una mujer que entiende lo que es criar sola. Ese día entendí que no estaba completamente sola, que había gente que cuidaba de mí y mis hijos.

**Biógrafo** `[M3.2 + HI6]`:
> Te escuché. Vamos con la que sigue.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Narrador** `[HI6]`: Ay, muchas veces. Una vez Pablo terminó la primaria, fue el primero de la clase. Me acuerdo que el director lo llamó a recibir su diploma, y cuando lo vi subir al escenario, se me llenaron los ojos de lágrimas. Mi hijo, que yo había criado sola, que había sufrido conmigo, había salido adelante. Cuando bajó del escenario, me abrazó y me dijo que me quería, que todo lo que lo hizo posible fue yo. Eso, viste, eso no se olvida. Con Carina, el orgullo fue diferente. Ella decidió ser maestra, enseñar a chicos. Yo que la criaba, que la veía rebelde y sin rumbo, la vi encontrar su camino. El día que comenzó a trabajar en una escuela, llevaba un uniforme nuevo, estaba seria pero feliz. Cuando llegó a casa ese primer día, me contó de sus alumnos, de cómo había hablado en la clase. Sentí que toda la lucha, todo lo que hicimos, había valido la pena. Mis hijos salieron adelante, se hicieron personas buenas, responsables. Eso es lo que me enorgullece más que cualquier otra cosa en la vida.

**Biógrafo** `[M3.3 + HI8 + M1]`:
> Anotado. Sigo con otra.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, me lo decís y pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI8]`: Si, tengo tres nietos. El primero fue el hijo de Pablo, se llama Martín. Fue un día especial, viste. Pablo vino a decirme que su esposa Marisa estaba embarazada. Yo grité de felicidad. Cuando nació Martín, Pablo me llamó por teléfono para avisarme. Manejé hasta el hospital rápido, estaba nerviosa, emocionada. Cuando entré a la sala, vi a Pablo sosteniendo a un bebé pequeño, y en ese momento sentí que mi corazón se detendría. Martín, mi primer nieto. Lo tuve en brazos, lo miré, y fue como volver al día en que Pablo nació. El círculo se cerraba, viste. Después tuve otro nieto, también hijo de Pablo, que se llama Tomás. Y de Carina tengo una nieta, Valeria, que es la que cuido ahora dos tardes por semana. Valeria es especial, viste, cuando me ve, corre a mis brazos. Con ella vuelvo a ser joven, a disfrutar de los momentos simples. La abuelo, viste, es un regalo que no esperaba en la vida.

**Biógrafo** `[M3.4 + HI9]`:
> Gracias por contármelo. Seguimos.
>
> ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada.

**Narrador** `[HI9]`: Con Martín y Tomás, cuando vienen, les hago ravioles. Pero lo especial es que metemos las manos en la masa juntos. Yo les enseño cómo se hace, ellos me ayudan. Es desordenado, la harina les cae en el pelo, pero es nuestro momento. Hablan de la escuela, de sus amigos, mientras trabajamos. Es simple, pero es conexión. Con Valeria es diferente. Ella es más chica. Las tardes que la cuido, hacemos alfajores. Yo preparo todo, ella va metiendo las manos en la masa, haciendo bolitas, riendo. Después los horneamos y los rellenamos de dulce de leche. Ella probó el primer alfajor que hizo, sus ojos se iluminaron. Me dijo que cuando sea grande quiere hacer alfajores como yo. Eso es lo especial, viste. No es un juego ruidoso como otros abuelos. Es un juego de manos, de comida, de amor. Eso es lo nuestro, eso es de nosotras.

**Biógrafo** `[M26 + CI8]`:
> Gracias, Nelly.
>
> Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI8]`: Me acuerdo de los cumpleaños. Aunque no tuviera mucho dinero, siempre hacía algo especial para Pablo y Carina. Un pastel casero, velas, un regalito pequeño pero hecho con amor. Esos cumpleaños en el departamento de Cordoba, con mis amigas cantando, con mis hijos sonriendo, fueron los más ricos de mi vida. No necesitaban mucho, necesitaban que su mamá estuviera ahí, que los celebrara. Eso es lo que quedó, esas tardes de cumpleaños simples pero llenas de amor.

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M24.4 + EN9]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Narrador** `[LU4]`: El viaje más importante fue cuando me mudé a Cordoba con Pablo, ya te lo conté. Pero hay otro viaje que fue especial. Años después, cuando tenia dinero gracias a la costura y el trabajo, decidí llevar a Pablo y a Carina a la playa. Fue en verano, ahorramos durante años para eso. Nunca habían visto el mar. Cuando llegamos a la playa, al atardecer, vi sus caras. Pablo tenia como dieciocho anos, Carina unos doce. Se quedaron mirando el mar, en silencio, asombrados. Después corrieron hacia el agua, descalzos. Yo me senté en la arena y los miré jugar. Sentí que había logrado algo grande, que había sacado a mis hijos de la ciudad, que les había dado ese regalo. Nos quedamos una semana, en una posada pequeña. Por la noche, estábamos en el balcón mirando las olas, y Pablo me dijo que me quería, que gracias a mí estaba ahí. Ese viaje, eso fue lo máximo de mi vida, viste. Ver a mis hijos felices, libres, jugando en la playa. Eso me validó todo el esfuerzo.

**Biógrafo** `[M3.6 + PA1]`:
> Lo tengo. Vamos con otra.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Narrador** `[PA1]`: Si, el tejido. Hace años que voy a un taller de tejido. Comenzo cuando una amiga me invitó a una clase. Yo pensé que no iba a poder aprender, que era vieja, que no tenia talento. Pero me sorprendió. El tejido es parecido a la costura, viste, es con las manos. Ahora voy dos veces por semana al taller, en la zona de Nueva Cordoba. Nos juntamos un grupo de mujeres, algunas más viejas que yo, algunas más jóvenes. Pasamos las tardes tejiendo, conversando, escuchando música. Es terapéutico, viste, las agujas, el hilo, el movimiento de las manos. Un día de esos, llegué al taller a las cuatro de la tarde. Teníamos un proyecto grande, una frazada para una chica que estaba enferma en el barrio. Tejimos todo el día, hasta las ocho de la noche. Conversábamos de la vida, de nuestros problemas, pero con las manos ocupadas. Cuando terminamos la frazada, todas lloramos. La llevamos a la chica al día siguiente, y verla usando la frazada que hicimos, fue como si el universo reconociera nuestro trabajo. Eso es lo que amo del tejido, que haces algo con amor y después ves que la gente lo usa, lo disfruta.

**Biógrafo** `[M26 + CI9]`:
> Gracias, Nelly.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquila.

**Narrador** `[CI9]`: Me encanta el folclore, la música de mi tierra. Los domingos a veces pongo música de folclore, canciones de Atahualpa Yupanqui, de Facundo Cabral, y me siento en la cocina con un mate, y viajo en el tiempo. Eso me da paz. También hay un rincón en mi departamento que es lo mío, donde está mi máquina de coser vieja, donde estoy sola. Ahí paso horas cosiendo, tejiendo, pensando en la vida. Es mi refugio, viste, cuando necesito desaparecer de todo.

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M24.1 + EN10]`:
> Gracias, Nelly. Eso también va al libro.
>
> Hablemos de los amigos y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Narrador** `[AS1]`: Marta fue la amistad más importante que tuve de grande. Nos conocimos cuando me mudé a Cordoba, ella vivía en el departamento de abajo. Tenía una hija de la edad de Pablo. Un día vino a pedirme sal prestada, y eso abrió la puerta. Nos hicimos amigas instantáneamente. Ella entendía lo que era ser madre sola, porque ella también lo era. Pasábamos tardes juntas, nuestros hijos jugaban, nosotras conversábamos de la vida. Una vez, estaba ella de cumpleaños y no tenía dinero ni para comprar algo. Yo le cociné ravioles, hicimos una cena pequeña en su departamento. Su hijo le había hecho un dibujo. Ella lloró viendo ese dibujo, viéndonos ahí. Marta me apoyo en la crisis de 2001, compartía comida conmigo cuando no tenia. Estuvimos juntas durante más de veinte años. Ahora ella se mudó, los años pasan, pero sigue siendo muy importante para mí. Esa amistad me salvó en los momentos más duros.

**Biógrafo** `[M3.8 + AY1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Narrador** `[AY1]`: Una vez me operaron, de la vesícula. Fue una cirugía pequeña pero necesaria. Pasé unos días en el hospital, después en casa recuperándome. Yo estaba sola, no tenía quien me cuidara. Mis amigas se enteraron, y se organizaron para ir a mi departamento. Una iba a cocinar, otra a limpiar, otra a cuidarme. Mi mamá vino desde Villa María y se quedó una semana. Entre todas me cuidaron, me dieron de comer, me ayudaron con la higiene. Yo lloraba de agradecimiento. Después, cuando empecé a recuperarme, devolvía esa ayuda como podía. Cosía para ellas, les hacía comida, las acompañaba en sus problemas. Eso es lo que aprendí, que la ayuda es un ciclo, viste. Cuando das, después recibes. Y cuando recibes, tienes que estar listo para dar.

**Biógrafo** `[M3.1 + AS9]`:
> Gracias, Nelly. Ya lo guardé.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Narrador** `[AS9]`: Primero, mis dos hijos, Pablo y Carina, con sus familias. Después mis amigos del taller de tejido, esa gente que me acompaña los martes y jueves. Invitaría a Marta, aunque esté lejos, le pediría que viniera por una noche. A mis amigas de toda la vida que me ayudaron en los momentos duros, a Rosa que cosía conmigo. A Lidia, mi supervisora en la cooperativa, que creyó en mí. Todos alrededor de una mesa larga, llena de ravioles caseros, de comida hecha con amor. Habríamos brindado por las amistades, por la vida, por todo lo que logramos. Eso sería mi cena, viste, simple, pero llena de gente que realmente importa.

**Biógrafo** `[M26 + CI10]`:
> Gracias, Nelly.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquila.

**Narrador** `[CI10]`: Hay un señor, Don Mario, que fue vecino mío en los primeros anos en Cordoba. Él era jubilado, no tenía familia cerca. A veces me ayudaba a arreglar cosas en el departamento, sin cobrar nada. Una vez se enfermó, y yo le llevaba sopa casera. Cuando mejoró, me dijo que yo le había salvado la vida. Fue simple, pero fue importante. Después Don Mario se mudó, pero lo recordo con cariño. Eso es la vida, viste, encuentros pequeños que dejan marca.

## Bloque 11 · Pérdidas y momentos difíciles

**Biógrafo** `[M24.2 + AV11]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás.

**Biógrafo** `[PE1 + M1]`:
> ¿Perdiste a alguien importante en tu vida? Si querés, contame quiénes fueron, qué eran para vos y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE1]`: Si, perdí a mi mamá en 2003. Fue de repente, una enfermedad que no detectamos a tiempo. Fue lo más duro que me pasó. Mi mamá era mi refugio, mi fuerza, mi brújula. Cuando se murió, sentí que se me caía todo. Durante años después, no pude hablar de ella sin llorar. Ahora, tantos años después, puedo recordarla con cariño. Hay un momento que me gusta recordar: una tarde en Villa María, años antes de que muriera. Ella y yo estábamos en su cocina, haciendo dulce de leche. Ella me enseñaba cómo remover, cómo sentir cuando estaba listo. Yo le preguntaba por la vida, por los hombres, por todo. Ella me daba consejos sin juzgar. Eso fue lo último que me enseñó, viste, que la vida es como el dulce de leche, requiere paciencia y cuidado. También perdí a mi hermano Rubén hace anos. Él no se cuidó, tuvo problemas. Pero era mi hermano, viste, lo quería. Son dos pérdidas que la vida me quitó. Pero aprendí que los muertos se quedan en el corazón, en los recuerdos, en las formas que nos enseñaron a vivir.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE5]`: Tuve la operación de vesícula hace años, como ya conté. Fue duro porque era la primera vez que tenia que estar en reposo, que no podía trabajar. Mis amigas me cuidaron. Ahora que estoy jubilada, empiezan los aquejos de la edad, viste. Las articulaciones duelen, especialmente en los dedos de la costura. A veces me duele la espalda de tanto estar encorvada sobre la máquina. Pero sigo. Tomo mis remedios, hago ejercicio cuando puedo. No me quejo mucho porque he visto a gente con males peores. Mi salud ahora es lo que se espera a los sesenta y ocho anos. Tengo a mis hijos, mis nietos, mi taller de tejido, mis ravioles. Eso es lo importante.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE4]`: Ya te conté lo de la crisis del 2001-2002. Eso fue la época más dura de mi vida adulta. Pero también fue duro cuando mis hijos se fueron de casa. Pablo se fue primero a estudiar, después a trabajar en otra ciudad. Después Carina creció, se independizó. De repente, el departamento estaba vacío. Yo estaba acostumbrada a escuchar sus voces, sus pisadas, sus problemas. Sin ellos, la casa se hizo silencio. Pasé una depresión leve durante algunos anos. No es que estuviera mal, pero estaba sola. Marta me ayudó en eso, me llevaba al taller de tejido, me sacaba de la soledad. Con el tiempo aprendí que los hijos se van, que es natural, que es bueno que tengan sus vidas. Ahora los veo cuando pueden, me visitan. Y tengo a mis nietos. Eso llenó el vacío que dejaron. La vida te enseña, viste, que todo cambia, que tenes que aprender a estar sola pero acompañada en el corazón.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[CI11]`:
> Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.

**Narrador** `[CI11]`: No, creo que ya conté todo. Lo más duro fue quedar embarazada siendo chica, la muerte de mi mamá, la crisis económica, y después la soledad cuando mis hijos se fueron. Pero de todo eso salí adelante, viste. Eso es lo que soy, alguien que enfrenta las dificultades y sigue.

## Bloque 12 · La historia grande

**Biógrafo** `[M24.3 + EN12]`:
> Bien, Nelly. Lo sumo a lo que ya me contaste de eso.
>
> Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.

**Biógrafo** `[HG1]`:
> Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día.

**Narrador** `[HG1]`: Viví los Mundiales de fútbol, claro. En 1978, cuando Argentina ganó el Mundial, estábamos todos en la calle, celebrando. Yo estaba embarazada de Pablo, iba a dar a luz meses después. Recuerdo que salí a la calle a festejar, mi mamá me pidió cuidado pero estaba feliz también. La ciudad estaba llena de gente, banderas, música. Fue mágico, viste, la alegría de todo un país. Después en 1986 ganamos de nuevo, y recuerdo que estaba con mis dos hijos pequeños, todos celebrando. Esos momentos de alegría nacional eran bonitos porque olvidábas los problemas personales, estabas en comunidad. También viví la dictadura, aunque yo era chica. Recuerdo miedo, gente desaparecida, gente que no volvía. Mi papá tenía miedo de hablar alto, de decir lo que pensaba. Era una época oscura. Después vivimos la crisis del 2001 que ya te conté, cuando el país colapsó. Eso fue lo que más me afectó directamente en la vida. Los Mundiales eran alegría, la dictadura era miedo, pero la crisis fue hambre.

**Biógrafo** `[M3.3 + HG4]`:
> Anotado. Sigo con otra.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado.

**Narrador** `[HG4]`: Recuerdo el dia que empezó el lockdown. Estábamos en marzo de 2020. La ciudad se cerró, no podía salir. Yo estaba en mi departamento, sola, asustada. Tenía sesenta y dos anos, y la gente decía que los mayores eran los que más peligro corrían. No podía ir al taller de tejido, no podía ver a mis nietos. Llamé a Pablo, a Carina, para asegurarme de que estaban bien. Todos estaban asustados. Pasé esos primeros dias sin dormir bien, escuchando las noticias, viendo a gente que moría. Mi mayor miedo era morir sola sin ver a mis hijos. Después me acostumbré. Pasé los meses haciendo lo que siempre hacía, cosiendo, tejiendo, esperando que esto pasara. Lo que más me dolió fue no poder abrazar a mis nietos durante meses. Cuando finalmente pude abrazarlos de nuevo, lloré como una chica. Ese dia que volvieron a la casa fue el dia que sentí que todo volvía a la normalidad.

**Biógrafo** `[M3.4 + DE1]`:
> Gracias por contármelo. Seguimos.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Narrador** `[DE1]`: Ay, eso. Ser madre soltera era lo peor cuando tuve a Pablo. La gente te miraba mal, te juzgaba, susurraban cuando pasabas. Mi papá no quería salir a la calle, le daba vergüenza. Ahora veo a chicas jóvenes con hijos sin marido y nadie dice nada. Es normal. Cuando yo estaba embarazada, sentí que era una criminal, que había hecho algo terrible. La Iglesia te condenaba, la sociedad te rechazaba. Recuerdo que mis amigas de la escuela me evitaban. Eso fue duro, viste. Si yo fuera joven ahora, habría sido todo diferente. Otro día que recuerdo, quería ir a bailar sola a un club, sin compañia de un hombre. Mi papá se ofendió, me preguntó qué iba a pensar la gente. Para él, una mujer sola en un baile era algo peligroso, inadecuado. Ahora las mujeres van solas a donde quieren y nadie dice nada. La vida cambió, viste, para mejor.

**Biógrafo** `[M3.5 + FI7]`:
> Guardado, Nelly. Te mando la próxima.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Narrador** `[FI7]`: Para mí la política fue miedo. Viví la dictadura de chica, en los 70 y 80. Recuerdo policía, represión, gente que desaparecía. Mi papá tenia miedo de hablar, de decir lo que pensaba. Algunos vecinos se iban y no volvían. Era una época oscura, viste, de silencio impuesto. Después vino la democracia, y recuerdo que mi papá pudo hablar libremente de nuevo. Eso fue un alivio. La política no es mucho mi cosa, pero entiendo que es importante. Lo que pasó en la dictadura no se puede olvidar. Viví después la crisis del 2001, que fue política también, decisiones equivocadas de los gobiernos. Ahora veo la política en la televisión, candidatos promete

ndo cosas que no cumplen. No creo mucho en los políticos, viste. Creo que hay que cuidarse a uno mismo, a la familia, a los amigos. Eso es lo importante.

**Biógrafo** `[M26 + CI12]`:
> Gracias, Nelly.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.

**Narrador** `[CI12]`: No, creo que conté lo importante. La dictadura, los Mundiales, la crisis, la pandemia. Eso fue mi vida mientras pasaban las cosas grandes.

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M24.4 + EN13]`:
> Gracias por eso. Cada detalle que agregás suma.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó.

**Narrador** `[GI1]`: Hay un día que me gustaría revivir mil veces. Fue cuando Pablo terminó la escuela secundaria. Estábamos en la ceremonia, él estaba en el escenario junto con sus compañeros. Yo estaba sentada en las gradas con mis amigas, Carina al lado mío, pequeña aún. El director llamó a Pablo para entregarle su diploma. Cuando subió, me miró a mí directamente. En ese momento, viste, sentí que todo lo que había sufrido, todo el trabajo de noche, toda la lucha para criarlo solo, todo valía la pena. Cuando bajó, vino a mi lado y me abrazó llorando. Me dijo que me quería, que gracias a mí había llegado hasta ahí. Eso fue un clic total, un momento en que entendí el propósito de toda mi vida. Si pudiera revivir un día, sería ese. La sensación de que tu hijo reconoce todo lo que hiciste, de que salió bien gracias a ti. Eso, eso fue gloria, viste.

**Biógrafo** `[M3.7 + GI2]`:
> Listo, quedó guardado. Sigo.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó.

**Narrador** `[GI2]`: Ese día fue cuando me entero que estaba embarazada de Pablo. Arranqué como cualquier otro día, iba a la escuela, tenia clases de comercial. En el recreo, me empecé a sentir rara, asustada. Llamé a Héctor para que me alcanzara a una farmacia, ahí compré una prueba. Me encerré en un baño con miedo. Cuando vi el positivo, mi corazón se paró. En ese momento supe que todo iba a cambiar. Llamé a Héctor, le conté. Él quedó en silencio. Después le dije que tenia que ir a mi casa a avisar a mis papás. Fue una caminata larga, pienso que fueron kilómetros de nada. Entré a mi casa, mi papá estaba viendo televisión, mi mamá cosiendo. Les dije, llorando. Mi papá se puso furioso, mi mamá lloró. Esa noche fue la peor de mi vida. Pero también fue la que empezó todo. Porque ese día, cuando acepté que iba a tener a Pablo, se me endureció algo adentro. Supe que tenia que ser fuerte. Ese día fue el fin de mi juventud y el comienzo de mi vida real.

**Biógrafo** `[M3.8 + HJ1]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Narrador** `[HJ1]`: Si, la pareja. Cuando era joven soñaba con casarme, con tener una familia normal como la de todos. Pero después de lo de Héctor, algo se cerró en mí. Pasaron los años y vi que eso no iba a pasar. Hubo hombres que se acercaron, pero yo no sabía cómo dejarlos entrar. Recuerdo un día, tendría treinta y cinco años, estaba cosiendo de noche como siempre. Vino una amiga, me preguntó si no me gustaría tener pareja. Yo me quedé mirando mi máquina de coser, mis manos trabajando, y entendí que eso era mi vida, que la aceptaba así. Pero también lloré un poco, viste, porque una parte de mí seguía queriendo ser esposa, ser amada de esa forma. Ese día acepté que algunos sueños no se cumplen. Ahora, vieja, pienso que no necesité hombre para ser feliz. Mis hijos, mis nietos, mis amigas, mi costura, eso fue suficiente. Pero si soy honesta, a veces pienso qué hubiera sido si alguien se hubiese quedado.

**Biógrafo** `[M3.1 + GI9]`:
> Gracias, Nelly. Ya lo guardé.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquita frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor.

**Narrador** `[GI9]`: Si, cuando llegué a Cordoba por primera vez. Yo venía de Villa María, un pueblo tranquilo donde todos se conocen. De repente estoy en una ciudad grande, ancha, ruidosa. Bajé del colectivo con mi maleta y Pablo de la mano. Miré a mi alrededor, edificios altos, gente apurada, autos, todo mucho. Sentí que era nada, viste, pequeñita y asustada. Un día después de haber llegado, salí a caminar de noche. El cielo estaba estrellado, y desde la ciudad veia las luces de todos lados, el cielo arriba inmensa. Estaba yo sola en una esquina, con Pablo durmiendo en mi cama en el departamento, y sentí que el universo era enorme y yo era un punto. Pero en ese momento, en lugar de sentirme mal, sentí que era fuerte. Porque aunque fuera pequenita, yo estaba ahí, sola, enfrentando todo. Eso cambió algo en mí, viste, me hizo sentir que podía con todo.

**Biógrafo** `[M3.2 + FI1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos misma? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Narrador** `[FI1]`: La soledad me hizo bien, viste. Después de que mis hijos se fueron, al principio me dolió. Pero después descubrí que los momentos a solas conmigo misma eran paz. Me siento en mi rincón de costura, cierro la puerta, prendo una vela a veces, pongo música de folclore bajita. Ahí, con la máquina de coser, me pierdo en el trabajo. Mi mente se vacía de preocupaciones. Es meditación, aunque yo no lo llamaba así. Un día lluvia, el departamento estaba oscuro, estaba yo cosiendo un vestido que me habían encargado. Eran las seis de la tarde, nadie iba a venir a molestarme. Tenía las manos en el trabajo, el ruido de la máquina, el olor a tela. De repente me doy cuenta de que soy feliz, solita, con mis manos haciendo algo. Eso fue revelación, viste, entender que no necesitaba a nadie más que a mi misma para estar bien.

**Biógrafo** `[M3.3 + FI2]`:
> Anotado. Sigo con otra.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Narrador** `[FI2]`: Un día, estaba con Martín, mi nieto mayor, en un parque. Él tendría diez anos. Estaba paseando, conversando con una amiga, y de repente Martín me dijo de usted. Yo me paré en seco. Mi nieto me trataba de usted, como si fuera una señora, una abuela lejana. En ese momento, viste, vi mis manos, viejas, con arrugas, los dedos torcidos de tanto coser. Me miré en un espejo que había por ahí, y me asusté. Era una vieja, viste, una abuela auténtica. El tiempo pasó sin que me diera cuenta. Ayer estaba teniendo a Pablo, y ahora tenía un nieto de diez anos que me hablaba de usted. Eso me golpeó, el tiempo pasando, invisible, silencioso. Después entendí que estaba bien, que es natural envejecer. Pero ese día, fue un clic, de darse cuenta de que la vida se te está yendo, que no te queda infinito.

**Biógrafo** `[M3.4 + FI3]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Narrador** `[FI3]`: Heredé el trabajo de mi papá y mi mamá. Mi papá era ferroviario, trabajo de pies en la tierra, responsabilidad. Mi mamá era costurera, dedicación, paciencia, hacer las cosas bien. Eso lo tengo yo. Cuando tengo que hacer algo, lo hago bien, sin atajo. Un día me dí cuenta cuando estaba en la cooperativa, haciendo mi trabajo con precisión, sin quejarme. Un compañero me preguntó por qué trabajaba tan duro si nadie me lo exigía. Yo le dije que era así noma, que para mí, si hago algo, lo hago bien. En ese momento vi a mi papá en mí, su sentido de responsabilidad. También heredé el amor callado de mi mamá. No soy de besos y abrazos exagerados, pero amo profundamente. Con mis hijos, con mis amigas, con mis nietos. Lo demuestro con acciones, con comida, con presencia. Eso es de mi mamá. También heredé sus manos, mis manos que tejen, cosen, crean cosas. Eso viene de ella, ese oficio de transformar tela en arte.

**Biógrafo** `[M3.5 + FI4]`:
> Guardado, Nelly. Te mando la próxima.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Narrador** `[FI4]`: Cuando era joven, me importaba demasiado. Estaba aterrada de lo que pensaran de mí. Cuando quedé embarazada, las miradas me mataban. Sentía que todos me condenaban. Pasaba para vergüenza de mi papá, de mi mamá, de la gente de Villa María. Pero con el tiempo, cuando me mudé a Cordoba y tuve que valerme a mí misma, entendí que no podía vivir para la opinión de otros. Tenía hijos que alimentar, un trabajo que hacer. Un día en el taller de tejido, estábamos haciendo un proyecto y una mujer joven me preguntó sobre mi vida. Yo le conté sin filtros, sin miedo a ser juzgada. Ella me dijo que me admiraba, que era inspiradora. Eso fue un cambio para mí. Entendí que juzgan igual si te esfuerzas que si no, así que mejor haz lo que crees que es correcto y no pienses en lo demás. Ahora, vieja, me importa un carajo lo que piensen. Voy a mi taller de tejido en una pollera vieja, me pongo lo que me da la gana, y vivo. Eso, eso es libertad.

**Biógrafo** `[M3.6 + FI6]`:
> Lo tengo. Vamos con otra.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Narrador** `[FI6]`: No sé cómo será en cien años. Probablemente todo será distinto, máquinas, tecnología, cosas que ni me imagino. Pero espero que siga habiendo amor, que los abuelos sigan contando historias a los nietos, que la comida casera no desaparezca. Me asusta que todo se vuelva virtual, que pierdan la conexión real, el contacto. Lo que me gustaría que no se pierda es el valor del trabajo hecho con las manos, el amor en la comida, el abrazo verdadero de una persona. También me gustaría que las madres solas no sean juzgadas, que cualquier forma de familia sea respetada. Que las mujeres tengan oportunidades, que puedan trabajar, que no se mueran de hambre criando solas. Que los abuelos sigan siendo valorizados, que no sean descartados. Yo espero que mis nietos, cuando sean abuelos, recuerden mis ravioles, mis historias, mis manos cosiendo. Que eso no desaparezca por más que todo cambie.

**Biógrafo** `[M26 + CI13]`:
> Gracias, Nelly.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquila.

**Narrador** `[CI13]`: No, creo que está todo. Lo importante está ahí, desde que nací hasta ahora, mis momentos de alegría y dolor. Creo que está completo.

## Bloque 14 · Hoy

**Biógrafo** `[M24.1 + EN14]`:
> Gracias, Nelly. Eso también va al libro.
>
> Dejamos el pasado un rato y venimos a hoy: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Narrador** `[HO1]`: Un día normal. Me despierto alrededor de las seis, sin alarma. Tomo un té con tostadas. Si es martes o jueves, me preparo para ir al taller de tejido a las cuatro de la tarde. Eso significa que tengo la manana libre. A veces coso, a veces hago cosas en la casa, a veces salgo a pasear. Si es una tarde que cuido a Valeria, voy a la escuela a buscarla a las tres. Hacemos algo en casa, alfajores, o simplemente charlamos. Después la traigo de vuelta. A veces como con Valeria, a veces voy a visitar a Pablo. Los domingos mato gallinas y hago ravioles, es mi tradición. Pongo música, trabajo en los ravioles, es lento pero es relajante. A veces vienen mis hijos a comer conmigo. Por la noche veo televisión, a veces veo noticias, a veces veo novelas. Me acuesto alrededor de las nueve. No tengo una vida emocionante, pero es tranquila, viste. Tengo mis ritmos, mis amigos, mis nietos. Eso es suficiente para mí.

**Biógrafo** `[M3.8 + HO2]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado.

**Narrador** `[HO2]`: Me hace gracia cuando Valeria se prueba mis lentes. Ella toma mis lentes de lectura, se los pone aunque no le hacen falta, y camina como si fuera vieja como yo. Habla en falsete, me imita. Yo me muero de risa. También en el taller de tejido, hay una chica joven que siempre se confunde con los puntos. Un día, después de hacer el mismo punto mal tres veces, dijo en voz alta que los puntos estaban en conspiración contra ella. Todas nos reímos. Es humor simple, pero es honesto. La última vez que me reí de verdad fue hace poco, Martín vino con una novia. Cuando se fue, todos empezamos a especular de si era seria o no. Rubén, mi otro nieto, hizo una imitación de cómo se miraban, y era tan ridículo que lloré de risa. Eso, eso es lo que me hace vivir, los momentos simples con mis nietos.

**Biógrafo** `[M3.1 + HO5]`:
> Gracias, Nelly. Ya lo guardé.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Narrador** `[HO5]`: Lo que más me gusta es tener tiempo. Después de trabajar todos esos anos, ahora tengo tiempo para estar en paz. Esta semana, el martes fui al taller, estaba lloviendo afuera. Adentro del salón, todas nosotras tejiendo, con música de fondo, conversando. Una chica joven me preguntó cómo aprendí a tejer. Yo le conté, le mostré algunos puntos. Ella me dijo que era experta. Ese momento, simple, me llenó. Que una persona joven me admirara, que estuviera enseñando, que todavía tenía algo para dar. Eso es lo que me gusta de ahora, que mi vida no es competencia, no es lucha. Es apenas estar aquí, hacer lo que amo, estar con gente que quiero. Eso es el regalo de vieja.

**Biógrafo** `[M3.2 + CO1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Narrador** `[CO1]`: Los ravioles, sin dudas. Me los enseñó mi mamá. Cada domingo hago ravioles, es tradición en mi casa ahora. Todos mis hijos, mis nietos, vienen a comerlos. Saben que el domingo hay ravioles en lo de la abuela. La receta es simple: masa de harina y huevo, relleno de carne y espinaca, salsa de tomate casera. Pero lo que hace la diferencia es el amor que pongo. Un día hice ravioles para mis compañeras del taller. Estaban todas esperando que llegara con la bandeja. Cuando probaron, una mujer grande se puso a llorar. Me dijo que le recordaban los ravioles de su mamá, que hace anos no comía algo así. En ese momento entendí que la comida es memoria, es amor transmitido. Mis ravioles no son solo comida, son mi historia, la historia de mi mamá, la continuidad de mi familia.

**Biógrafo** `[M3.3 + HO9]`:
> Anotado. Sigo con otra.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Narrador** `[HO9]`: Vivo en el mismo departamento en Cordoba donde me mudé con Pablo hace anos. No es un palacio, viste, son dos piezas, una cocina, un banio. Las paredes tienen humedad porque es un edificio viejo. Pero es mío, lo arreglé con el tiempo. Tiene las ventanas que dan a la calle, puedo ver la gente pasar. El barrio es tranquilo, no es lujoso, pero es seguro. Hay almacenes, una panadería, gente que se conoce. El taller de tejido queda cerca de mi casa, a una cuadra de distancia. Eso es lo mejor. Un dia que estaba lloviendo fuerte, miré por la ventana. La lluvia golpeaba el vidrio, hacía un ruido bonito. Yo estaba sentada en mi silla de costura, con una taza de té al lado. La luz gris de la lluvia, el ruido de las gotas. Fue un momento de paz total, viste. Este departamento fue mi refugio durante anos, fue donde criamos a mis hijos, donde hice mi vida. No es grande, pero es calidez.

**Biógrafo** `[M26 + CI14]`:
> Gracias, Nelly.
>
> Con esto cerramos lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquila.

**Narrador** `[CI14]`: Hay un ritual mio cada mañana. Me despierto, tomo el té, después salgo a la pequeña galería que tengo. Saludo al día, viste. Miro el cielo, los árboles, a veces hay pájaros. Es un momento mío, tranquilo, antes de que el día empiece. Eso es lo que me gusta ahora, esos momentos simples que antes no tenia tiempo de tener.

## Bloque 15 · Legado y cierre

**Biógrafo** `[M24.2 + EN15]`:
> Anotado, gracias. Quedó guardado junto con el resto.
>
> Ya estamos en la última parte, Nelly: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Narrador** `[LE1]`: Lo que más orgullo me da es haber sacado adelante a mis hijos sola. Que sean personas buenas, responsables, que hayan hecho sus propias familias. Eso, viste, es todo para mí. Otro orgullo es mis manos. Mis manos que cosieron miles de prendas, que hicieron ravioles, que tejieron. Mis manos que levantaron a mis hijos. Cuando miro estas manos viejas, arruagadas, llenas de callos, veo todo lo que hice. Veo mi historia. El dia que me dí cuenta fue hace poco, Carina me dijo que ella quería coser como yo. Ella enseñaría a sus hija a coser. Eso significaba que mi oficio no muere conmigo, que continua. Que mi mamá me lo enseñó, yo lo enseñé a Carina, y Carina lo enseñará a su hija. Eso es legado, viste. Eso es inmortalidad.

**Biógrafo** `[M3.5 + LE2]`:
> Guardado, Nelly. Te mando la próxima.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos misma descifraste viviendo.

**Narrador** `[LE2]`: Mis hijos, mis nietos, mis amigos, escúchenme. La vida no va a ser como soñaron. Habrá dolor, habrá decepción, habrá momentos en que creerán que no van a poder. Pero aprendan que el dolor enseña. Que la soledad no es lo peor que puede pasarles. Que las manos que trabajan honestamente son manos que pueden estar orgullosas. Que el amor que demos sin esperar recompensa vuelve de formas inesperadas. Que no importa lo que piensen los demás, importa quién sos vos. Y que los momentos simples, las tardes de lluvia, los ravioles caseros, las manos de una abuela, eso es lo que llena el corazón. No busquen felicidad en lo grande. La felicidad está en estar vivos, en estar con gente que queremos, en hacer cosas que nos apasionan. Eso, eso es todo.

**Biógrafo** `[M3.6 + FU1]`:
> Lo tengo. Vamos con otra.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Narrador** `[FU1]`: Me gustaría viajar con mis nietos a la playa de nuevo. Una vez más. Sé que el cuerpo ya no me dará igual, pero quiero estar ahí, mirando el mar con ellos, sentando que la vida sigue. También me gustaría enseñarle a Valeria a hacer ravioles paso a paso, que ella aprenda no solo la receta, sino toda la historia que hay detrás. Y me gustaría seguir tejiendo, haciendo cosas bonitas que otras personas usen y disfruten. Eso me mantiene viva, viste. Que me pidan un tejido, que alguien lo quiera, que se lo regale a alguien que ama. Eso es seguir siendo útil. Estoy en la galería, el sol dándome en la cara, y mis nietos alrededor. Carina trae los ravioles que hicimos juntas, Pablo brinda, los nietos ríen. Eso es lo que quiero, estar ahí, siendo parte de sus vidas, dejando mi marca en ellos.

**Biógrafo** `[M3.7 + LE7]`:
> Listo, quedó guardado. Sigo.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Narrador** `[LE7]`: Las manos de Nelly. Ese sería el título. Porque mi vida está en mis manos, viste. Las manos que cosieron, que tejieron, que criaron hijos, que hicieron ravioles, que acariciaron a mis mamá cuando se murió. Todo lo que soy está en mis manos. La historia de mi vida está en los callos, en las arrugas, en cada marca que tienen. Si alguien leyera un libro sobre mí, sería un libro sobre las manos que trabajan, que aman, que construyen.

**Biógrafo** `[M3.8 + M15]`:
> Escuchado. Vamos por la siguiente.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> Mamá, ¿cómo hacías para trabajar todo el día y encima coser de noche, y nunca te vimos cansada? Carina

**Narrador** `[FAM1]`: Ay Carina, mi hija. Te voy a contar la verdad. Sí estaba cansada. Estaba agotada, viste, destrozada. Mis manos dolían, mis ojos dolían, la espalda no aguantaba más. Pero ustedes dos eran lo que me mantenía en pie. Cada vez que quería rendirme, pensaba en tus ojos, en los ojos de Pablo, y seguía. La costura no era solo dinero, era también terapia. Cuando cosía de noche, me olvidaba del dolor del cuerpo, del dolor del alma. Las manos ocupadas, la mente en otro lugar. Y algo más, Carina, ustedes dos me daban fuerzas que no sabía que tenia. Es como si el cuerpo se olvidara de estar cansado cuando ama. Nunca los vi cansada porque no quería que ustedes cargaran ese peso también. Yo tomaba el cansancio y lo transformaba en trabajo, en costura, en amor. Eso es lo que hacía.

**Biógrafo** `[M3.1 + FO1]`:
> Gracias, Nelly. Ya lo guardé.
>
> Otra cosa, Nelly. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés a mano, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Y si no encontrás ninguna, no pasa nada: el libro va igual.

**Narrador** `[FO1]`: No tengo mucho, viste. Soy vieja, no tengo celular. Tengo unas fotos en un cajón de la casa, bastante viejas. Una con Pablo de chiquito, yo lo tengo en brazos en el departamento. Otra de los tres juntos cuando fuimos a la playa. Una de Carina en su primer día como maestra. Pero no sé si pueda mandartelas ahora, están en papel viejo. No pasa nada, que el libro vaya sin fotos. Lo importante es lo que conté, viste, eso es lo que queda.

**Biógrafo** `[M26 + LE9]`:
> Gracias, Nelly.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Narrador** `[LE9]`: No, creo que está todo. Conté mi vida desde el principio hasta ahora. Lo bueno, lo malo, lo medio. Conté de mis papás, de mis hijos, de mis amigas. Conté del trabajo, del amor que no fue, de la soledad que se convirtió en paz. Conté de las manos que trabajan, de las comidas que aman, de los momentos simples. Si alguien lee esto, que sepa que no fui una mujer de película. Fui una mujer normal, que hizo lo que tenía que hacer, que amó profundamente, que trabajó sin parar. Eso es mi vida, y estoy en paz con eso.

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Narrador** `[LE8]`: A mis hijos Pablo y Carina: gracias por permitirme ser su mamá. Sé que no fue fácil, que hubo momentos en que sufrieron por mis decisiones, mis limitaciones. Pero los amo más de lo que pueden imaginar. Quiero que sepan que todo lo que hice fue para ustedes. A mis nietos: disfruten de la vida, hagan cosas que los hagan felices, no sigan el camino que otros dicen que tienen que seguir. A mis amigas: muchas gracias por estar en mis momentos duros, por brindarme compañía en la soledad. Ustedes son mi familia elegida. A todos los que lean esto: amen profundamente, trabajen con honor, cuiden a sus manos porque eso es lo que queda de nosotros. Y un día, cuando no esté, acuérdense de mí cuando coman algo hecho en casa, cuando sientan el sol en la cara, cuando vean a alguien trabajar sin quejarse. Ahí estaré yo.

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Nelly. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre, y es bien tuyo. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Fue un gusto enorme escucharte.
