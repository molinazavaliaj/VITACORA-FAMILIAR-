# Ronda 2, simulación 5: el que dice paso a su manera (Manuel, 70, inventado)

**Qué es:** la entrevista de un narrador **inventado** (Manuel), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Plan: [`PLAN.md`](PLAN.md).

**Cuenta:** 88 preguntas del banco contestadas + 1 de la familia · **131 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

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

**Narrador** `[OR1]`: Mirá, nací en el 56 en una aldea gallega, un pueblito chiquito donde los padres vivían de la tierra, ganado, lo que podían sacar del campo. Mi viejo, trabajador desde antes de que saliera el sol, y mi vieja, pues, haciendo casa. Cuando llegué yo, tercero de tres pero el primer varón después de mi hermano José, recuerdo que me contaba mi vieja que fue un buen momento, en la paz de la casa que tenían. No fue fácil nunca, pero en esa época todavía estaban juntos los dos, todavía había esperanza de que las cosas fueran mejor. Eso es lo que ella me decía. De chiquito no sabés nada, la vida que viniste a encontrar es la que toca vivir.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Manuel. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR2]`: Sí, claro. Mi abuela, la madre de mi viejo, contaba que los antepasados habían llegado a esa aldea cuando no había casi nada, que mi bisabuelo fue quien levantar la casa de piedra donde crecimos nosotros. Eso era como la gloria, ¿viste?, la casa de piedra que había construído con sus propias manos, generación tras generación. Y mi viejo aprendió eso: a trabajar la tierra, a respetarla, a tener la casa en pie. Cuando yo era chiquito, la sobremesa era siempre eso, la historia de cómo se hace una vida de nada, de cómo se construye algo que dure. Era el orgullo, pero también la carga: vos tenías que ser digno de eso que dejaron antes.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR5]`: Eso, claro que lo contaban. Mi vieja decía que se conocieron en la misa del domingo, cuando toda la gente iba al pueblo. Mi viejo andaba en el trabajo de la tierra pero iba los domingos a la iglesia, pues es lo que se hacía. Mi vieja venía con su familia de otra aldea cercana. Él la vio un día, así nada más, y quedó como enganchado. Después pidió a alguien que los presentara, sin mucho bla bla, de la forma de acá, de antes, viste. Se hablaban después de la misa, en la plaza. Fue lento, pero claro que al final se casaron. Eso era la vida de antes, tranquila, sin apuros.

**Biógrafo** `[M26 + CI1 + M31]`:
> Gracias, Manuel.
>
> Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora. Y si algo se te viene más tarde, a cualquier hora, mandámelo cuando quieras: va al libro igual.
>
> _Podés tocar el botón de abajo, o contestarme en audio como siempre._
>
> [botones: (No, está todo)]

**Narrador** `[CI1]`: No, creo que está todo. Las historias que tengo claras de eso son esas. Después empezó mi vida, la mía de verdad, con mis hermanos, la casa. Lo demás es lo que alcanzaban a contarme de vez en cuando, pero lo que te dije es lo que quedó.

## Bloque 2 · La casa y la familia de la infancia

**Biógrafo** `[M24.1 + EN2]`:
> Gracias, Manuel. Eso también va al libro.
>
> Ahora vamos a tu infancia: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Narrador** `[CA1]`: Mi primer recuerdo es la cocina. Estaba mi vieja haciendo el fuego, prendiendo la lumbre, y yo de chiquito, tres, cuatro años, mirando cómo salía el humo por arriba. La cocina era el corazón de todo: ahí comíamos, ahí se calentaba la casa, ahí estaba mi vieja siempre. Recuerdo el olor a fuego de leña, al pan que cocía, y mis hermanos corriendo por ahí. Eso es lo primero que veo cuando cierro los ojos: esa cocina, las manos de mi vieja en la lumbre.

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chico. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Narrador** `[CA2]`: Mi vieja era trabajadora, siempre haciendo algo. No era de las que abrazaban mucho, así, en forma grande, pero se veía que te quería. Recuerdo que una vez me fui al monte con mi hermano José, éramos chiquitos, y nos perdimos un poco. Cuando llegamos a casa, tarde, oscuro, mi vieja me agarro de los hombros, fuerte, me miró a los ojos, y sin decir mucho me dijo: "No vuelvas a irte sin avisar." Y me dio un mate. Eso era lo que tenía para dar: la presencia, la autoridad, el cuidado. No eran besos de película, pero sabías que te amaba porque te cuidaba.

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chico? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Narrador** `[CA3]`: Mi viejo era del campo, de la tierra. Trabajaba desde antes de que saliera el sol, con los animales, arando, sembrando, lo que había que hacer para sacar la comida de la casa. Cuando era chiquito, yo lo acompañaba, miraba nada más. Recuerdo la madrugada, el frío, y él ya ahí con el arado, sudando. Me daba un poco de miedo, la verdad, porque trabajaba sin parar, sin hablar mucho. Una vez me dejó que agarre los animales, y me mostró cómo se hacía, así, con paciencia. Pero no era de estar al lado tuyo el tiempo completo, no. El trabajo era lo primero.

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

**Narrador** `[CA6]`: Sí, tenía un hermano mayor, José. Era más grande que yo, me llevaba algunos años. De chico hacíamos cosas juntos, íbamos al monte, nos metíamos en donde no debíamos, como los chicos. José era más serio que yo, más parecido al viejo, siempre con la cabeza en la tierra, en lo de la familia. Cuando éramos chicos no había mala onda, no. Lo que vino después ya es otra cosa.

**Biógrafo** `[M3.7 + CA16]`:
> Quedó guardado, Manuel. Sigo con la que viene.
>
> Contame un día de chico que esperabas con muchas ganas: qué era, quién estaba, qué pasó. Y si no te vuelve un día en particular, contame qué cosas esperabas con ganas en esa época, que con eso me arreglo.

**Narrador** `[CA16]`: La Navidad, eso siempre. Los días que venía alguien de la familia de fuera, así visitaba. Y el día de la feria del pueblo, cuando se juntaban todos y había movimiento, gente comprando, vendiendo. Eran las únicas veces que pasaba algo diferente. Ahora los chicos ven películas, van a cualquier lado. Nosotros esperábamos esos días con ganas porque era lo que había, y punto. Era poco, pero era.

**Biógrafo** `[M26 + CA17]`:
> Gracias, Manuel.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[CA17]`: La pobreza, principalmente. Cuando sos chiquito no entendés bien, pero la ves en la cara de tu viejo, en lo que da para comer y lo que no. Había hambre, no de mala manera, pero había días en que la comida era poca. Mi viejo trabajaba y trabajaba y con eso apenas llegaba. Eso te marca, ¿viste? Te enseña que las cosas no caen del cielo, que hay que trabajar. Pero también te mete cierto miedo dentro: miedo a no tener suficiente, a que la familia no salga adelante.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Manuel. Queda guardado con cuidado.

**Biógrafo** `[CI2]`:
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

**Narrador** `[ES1]`: Mi vieja me llevó, claro. Recuerdo que le dije que no quería irme, que me quedara, pero ella no. Dijo "Es la escuela, tenés que ir." Simple, así. El maestro era un señor grande, serio, que pegaba con la regla si te portabas mal. Así era entonces, no como ahora. Aprendí a leer y a escribir ahí, también a no hablar mucho y a obedecer. Algunos compañeros eran de la aldea también, así que al menos no estaba todo solo, pero miedo había, de ese primer día no se olvida.

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Narrador** `[ES2]`: Una maestra, Doña María, en un momento la recuerdo bien. Era la que nos enseñaba a leer de verdad, con paciencia. Una vez me paré para leer en voz alta y me traspié con una palabra, y en lugar de burlarse, ella dijo "Otra vez, con calma." Y lo hice bien. Después me dijo que leía bien, que siguiera así. Era poco, pero para un chico como yo, que venía de una casa donde nadie leía mucho, eso significaba algo. Me pasó lo que les pasa a todos: buscabas esa aprobación.

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chico, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Narrador** `[ES5]`: Tenía un amigo, Luisito, que vivía cerca. Hacíamos todo juntos: íbamos al río a ver las piedras, agarrábamos ranas, nos bañábamos cuando hacía calor. Una vez nos pasó que nos fuimos demasiado lejos, en el río, y casi nos ahogamos jugando. Él me agarró el brazo y entre los dos salimos. Después nos reímos, nerviosamente, porque sabíamos que si nuestros viejos se enteraban nos pegaban. Eso fue años, hasta que me fui. Luisito se quedó en Galicia, no sé qué fue de él después.

**Biógrafo** `[M3.3 + ES6]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chico, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Narrador** `[ES6]`: Hubo una vez que con Luisito agarramos un puerquito del vecino, uno que estaba en la chiquera, y lo soltamos por toda la aldea. El animal corría de acá para allá, los grandes gritaban. Fue un caos. Al final nos agarraron, claro, y nos pegaron bien, los dos con nuestros viejos en la plaza. Me acuerdo que mi viejo estaba furioso, me daba de palos, y yo lloraría pero estaba tratando de no llorar. Hoy en día le da risa, pero en ese momento no fue gracia, fue un escarmiento. Eso te enseñaba a portarte bien.

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Narrador** `[ES7]`: De chico, la verdad, no tenía muchas opciones en la cabeza. Veía a mi viejo en la tierra y pensaba que eso era lo que me tocaba, que iba a ser lo mío también. Pero mi viela, en algún momento, me decía que si estudiaba, si aprendía, tal vez podía hacer otra cosa. Recuerdo que me pasó por la cabeza el negocio, algún día tener algo mío, una tienda, algo así. Pero eran sueños de chico, sin cuerpo. Lo que pasó fue la vida, no lo que uno planea.

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chico? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Narrador** `[ES9]`: Claro que estaba. Ibamos a misa los domingos, era lo que se hacía. Mi Primera Comunión fue un día especial, eso sí. Fue en la iglesia del pueblo, con mi traje que me habían hecho nuevo, blanco. Mi vieja estaba contenta, mi viejo menos expansivo pero también. La fiesta fue en casa, con lo que se pudo hacer en esa época, nada de gran cosa. Recuerdo el olor a incienso en la iglesia, las manos juntas, rezando. Después vinieron cambios, la verdad, en mi cabeza sobre todo eso, pero de chico era lo normal, parte de la vida.

**Biógrafo** `[M26 + CI3]`:
> Gracias, Manuel.
>
> Con esto cerramos tus años de escuela. Antes de seguir, ¿te quedó alguna historia de esa época dando vueltas, algo que no entró en ninguna pregunta? Contámela ahora, con calma, que la quiero escuchar.
>
> [botones: (No, está todo)]

**Narrador** `[CI3]`: No, no. Creo que dijimos lo principal de eso. La escuela, los maestros, los amigos, lo que pasó. Las cosas importantes están. Lo demás son pequeñeces que con los años se pierden.

## Bloque 4 · Adolescencia

**Biógrafo** `[M25.2 + EN4]`:
> Bien, seguimos.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chico y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Narrador** `[AD2]`: A esa edad empecé a trabajar en serio con mi viejo, en la tierra. Salía con él, por madrugada, a hacer las tareas. Iba a la escuela a veces todavía, pero la cabeza estaba en el trabajo. Tenía que ayudar, no había opción. Mi hermano José ya había dejado la escuela años atrás. Recuerdo estar cansado siempre, los brazos adoloridos. Pero también una libertad, ¿viste? Empezaba a ser hombre, o eso creía. A los chicos en el pueblo me veían diferente, con responsabilidad. Era difícil y fácil al mismo tiempo.

**Biógrafo** `[M3.7 + AD3]`:
> Quedó guardado, Manuel. Sigo con la que viene.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Narrador** `[AD3]`: Sí, había chicos del pueblo con los que andaba. Luisito seguía ahí, claro. Nos juntábamos a veces después del trabajo, cuando la luz empezaba a bajar. Íbamos al pueblo, a la plaza, mirábamos a las chicas, hablábamos de cualquier cosa. Una vez fuimos a una romería que había en el pueblo de al lado, una fiesta, había música, alcohol, gente que bailaba. Yo era chiquito todavía, pero veía a los grandes divertirse, y eso me hacía desear irme de ahí, saber qué había afuera. Eso fue cuando empecé a pensar que Galicia no era todo, que existía algo más en el mundo.

**Biógrafo** `[M3.8 + AD5]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche. Y si la primera no te vuelve, contame cómo eran esas salidas en general.

**Narrador** `[AD5]`: Fue en un baile que hacían en el pueblo cercano, para las fiestas del pueblo. Me puse la ropa que tenía, limpie mis botas lo que pude. Fui con Luisito y otros chicos. Nos sentíamos grandes, la verdad. Había chicas, música en vivo, gente bailando. Yo me quedaba en la sombra, mirando, porque no sabía muy bien cómo moverme. Una chica me sacó a bailar, no me acuerdo ni cómo pasó, y casi me desmayo de los nervios. Era todo nuevo. Al final, fue una buena noche. Salí pensando que quería más de eso, que el trabajo y la casa no eran todo.

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Narrador** `[AD6]`: Sí, hubo una. Era una chica de un pueblo cercano, se llamaba Antonia. Nos conocimos en una misa, de casualidad, y después en algún que otro baile. Ella tenía una sonrisa que me hizo perder la cabeza. Recuerdo un día en el pueblo, caminamos juntos, hablamos de tonterías, y en un momento ella me agarró la mano. Yo estaba temblando de los nervios, la verdad. Fue lindo mientras duró, pero las distancias, las familias, todo se hizo complicado. Duró poco, pero quedó grabado. Después me enteré que se había casado con otro, con alguien del pueblo de ella.

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chico? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Narrador** `[AD12]`: Fue cuando mi viejo enfermó, un poco. No fue cosa grave, pero me pidió que manejara el trabajo de la tierra un tiempo, que yo me hiciera cargo. Yo tendría unos dieciséis años. De repente, toda la responsabilidad en mis hombros: qué sembrar, cuándo, cómo. No tenía quien me aconsejara, tenía que pensarlo yo. Mi viejo me veía desde la casa, pero yo era quien llevaba la cosa. Eso fue lo que me hizo entender que ya no era el chico que jugaba al río, que ya la vida te pedía otra cosa, que tenías que saber qué hacer. De ahí en adelante fui diferente.

**Biógrafo** `[M26 + AD15]`:
> Gracias, Manuel.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[AD15]`: Lo difícil de esa época era saber que no tenía futuro ahí. Podía seguir trabajando la tierra toda la vida, como mi viejo, como todos. Pero sentía que eso no era suficiente para mí. Veía que algunos chicos se iban, se iban a trabajar a la ciudad, y eso me hacía pensar. También empecé a darme cuenta de que entre mi hermano y yo había diferencias, que tal vez no nos llevábamos tan bien como de chicos. Eso pesaba, ¿viste? Sentir que estabas solo con tu futuro, sin saber qué hacer con tu vida.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquilo, que hay tiempo.
>
> [botones: (No, está todo)]

**Narrador** `[CI4]`: [toca: No, está todo]

## Bloque 5 · Juventud

**Biógrafo** `[M25.3 + EN5]`:
> Bien, entonces.
>
> Pasamos a tu juventud, Manuel: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Narrador** `[JU1]`: Sí. En el 75 me fui a Argentina. Tenía diecinueve años. Un tío mío se había ido años antes, estaba en Buenos Aires, y me dijo que fuera, que ahí había trabajo, futuro. Bajé del barco en Buenos Aires con una valija, sin mucho, y un papel con la dirección de mi tío. Mi vieja me acompañó al puerto, al barco. Recuerdo que le dije que iba a estar poco, que volvería. Ella no habló mucho. Me dijo que cuidara, que trabajara. Nos abrazamos, así nada más. Nunca volví a verla. Fue lo más duro que tuve que hacer en toda mi vida, déjala en ese puerto. Pero en ese momento creía que era mejor irme, que tenía que probar suerte.

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Narrador** `[JU2]`: En Argentina me puse a trabajar en un bar con mi tío, primero como mozo, haciendo lo que me pedían. No había tiempo para estudiar, tenía que aprender de la vida, de cómo se movía la gente acá. Trabajaba en la barra, atendía clientes, limpiaba. Eran días largos, cansadores, pero me gustaba. Vi gente de todo tipo, historias, negocios que se hablaban en la barra. De ahí aprendí más que en ningún libro. Después ascendí a encargado del bar, y eso fue cuando empecé a ganar un poco más y a pensar en algo propio.

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Narrador** `[JU4]`: Cuando compré el almacén en el 90, recién ahí empecé de verdad. Los primeros días fue un caos. Tenía que atender, controlar stock, arreglar cosas que se rompían. Abrí a las seis y media de la mañana, cerraba a las nueve de la noche. Aprendí viendo, haciendo, cometiendo errores. La gente del barrio me enseñó mucho: qué cosas vender, cómo tratar al cliente, cómo no dejarme estafar. Un día llegó un vendedor que me quería vender cosas vencidas, casi me la juego, pero un cliente me alertó. Desde ahí fui más cuidadoso. El almacén te enseña paciencia, observación, trato con la gente. Eso es lo que duró todos estos años.

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Narrador** `[JU5]`: No, servicio militar no hice. Llegué a Argentina sin papeles de argentino, así que eso no me tocó. Pero en el bar, de joven, sí había disciplina dura. Mi tío era el jefe, y no se bromeaba. Si llegabas un minuto tarde, se enojaba. Si rompías algo, lo pagabas. Era de la vieja escuela, como mi viejo también. Eso te enseña a respetarte a vos mismo, a no andar bolaceando. La vida después fue más suave, el almacén era mío, tenía menos presión. Pero esos años en el bar me marcaron de esa forma: puntualidad, responsabilidad, trabajo.

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Quedó guardado, Manuel. Sigo con la que viene.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Capaz ya me contaste algo de esa mudanza; ahora contame la llegada: el primer día, dónde dormiste esa noche, quién te esperaba y qué fue lo que más te costó.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, me mudé) (No, nunca me mudé)]

**Narrador** `[JU8]`: [toca: Sí, me mudé]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[JU8]`: Bajé del barco en Buenos Aires con mi valija, como te dije. El puerto era grande, gente por todos lados, idioma que casi entendía pero diferente. Mi tío estaba ahí esperándome, con su cara de "bienvenido". Dormí en su casa, en un cuarto que me había preparado con otro parenacido. Esa noche no dormí mucho, estaba nervioso, escuchaba los ruidos del barrio, las minas en la calle. Buenos Aires para un chico de Galicia es otro mundo. Lo que más me costó fue la soledad, extrañar. La gente aquí es diferente, rápida, vos tenés que ir al ritmo. Pero en eso aprendí rápido. En dos semanas ya trabajaba con mi tío en el bar.

**Biógrafo** `[M3.8 + JU12]`:
> Te escuché bien. Vamos por la siguiente.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue? Si la noche justa no te vuelve, contame cómo eran los primeros tiempos ahí. Y si nunca te fuiste de la casa de tus viejos, contame el día en que esa casa pasó a ser tuya, o el rincón que siempre fue tuyo.

**Narrador** `[JU12]`: Después de algunos años en lo de mi tío, me alquilé una pieza en una pensión en La Boca, acá en Buenos Aires. Era chiquita, fría en invierno, pero era mía. Un colchón, una mesa, una silla. Desde la ventana veía la calle de enfrente, gente pasando, el movimiento del barrio. La primera noche ahí me sentí mayor, responsable. Pagaba el alquiler con lo que ganaba en el bar, y lo demás era para ahorrar. Fue lindo, esa sensación de independencia. Después me mudé a otros lugares, pero ese fue el primero en que dije "esto es mío, me lo gané".

**Biógrafo** `[M3.1 + JU15]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Narrador** `[JU15]`: Los amigos de esos años eran del bar, principalmente. Chicos que trabajaban conmigo, gente que iba a tomar. Había un paraguayo, Julio, que trabajaba de cocinero, y nos juntábamos a veces después del trabajo. Íbamos a una confitería cercana, tomábamos algo, hablábamos de las cosas. Julio me enseñó a entender mejor el lunfardo porteño, las costumbres acá. Hacíamos bromas, nos metíamos con nuestros jefes. Una noche fuimos a un baile con otros chicos, y nos metimos en un quilombo, una pelea, pero salimos de ahí riendo. Esos eran años simples, sin complicaciones. Los de la pensión también, claro, pero el trabajo era lo que te unía.

**Biógrafo** `[M26 + JU17]`:
> Gracias, Manuel.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> [botones: (Paso esta)]

**Narrador** `[JU17]`: En el 79, mi madre se murió. Yo estaba acá en Buenos Aires, trabajando. Me llegó la noticia por carta, tarde, porque correo tardaba. Cuando la recibí, ya hacía días que ella se había ido. No pude ni estar con ella, ni despedirme, ni nada. Eso me marcó de una forma que no te puedo explicar bien. Culpa, rabia, arrepentimiento todo junto. Yo le dije que volvía pronto, que le mandaba plata, pero no volví a tiempo. Eso es lo más duro que pasé, porque perdés a una persona y no terminás como tenía que terminar. La culpa te queda dentro.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI5]`:
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.
>
> [botones: (No, está todo)]

**Narrador** `[CI5]`: No, está. Lo más importante quedó. La salida de Galicia, los primeros años acá, mi vieja. Lo demás son detalles que con los años se olvidan un poco.

## Bloque 6 · Amor y pareja

**Biógrafo** `[M25.1 + AM0 + M1]`:
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

**Narrador** `[AM0]`: Sí, hubo. Cuando llegué a Buenos Aires, tuve algunos noviazgos, pero nada en serio. Chicas que conocía en los bailes, en la confitería. Eran cosas pasajeras. La que llegó a ser en serio fue Rosa. La conocí en el 81, en una fiesta de amigos, también hija de gallegos como yo. Nos enamoramos, así, simple. Nos casamos en el 82. Con Rosa empezó mi vida de verdad, ¿viste? Antes eran juegos de chico. Con ella todo cambió, tuve responsabilidades, metas. Fuimos felices, y seguimos, aunque como en todos lados hubo momentos difíciles.

**Biógrafo** `[M3.3 + AM1]`:
> Lo anoté, gracias. Sigo con otra.
>
> Vamos a la primera que fue en serio. Contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron, y qué fue lo primero que te llamó la atención de esa persona. Si ya me lo contaste cuando hablamos de tu adolescencia, decímelo y vamos a lo que sigue.

**Narrador** `[AM1]`: Fue en una fiesta, en la casa de un amigo de trabajo. Yo no la conocía, pero estaba ella con amigas. Recuerdo que entré a tomar algo, y la vi sentada en la sala, hablando con sus amigas. Me pareció linda, pero no era solo eso. Había algo en su forma de estar, de reírse. Después un amigo me la presentó, así, de casualidad, "Rosa, este es Manuel, trabaja conmigo en el bar." Nos hablamos un poco esa noche, nada de grande, pero quedó como enganchado en mi cabeza. Después me enteré que ella también era hija de gallegos, de padres españoles, así que ya teníamos algo en común. Volvimos a cruzarnos en otro baile, y de ahí empezó todo.

**Biógrafo** `[M3.4 + AM3]`:
> Gracias por contármelo. Seguimos.
>
> Y después, ¿llegaron a armar la vida juntos: casarse, irse a vivir, lo que haya sido? Si llegaron, contame ese momento: quién lo dijo primero, o si se fue dando solo, dónde estaban, qué se dijeron. Si ya me lo contaste recién, con decírmelo alcanza.
>
> [botones: (Sí) (No llegamos a eso)]

**Narrador** `[AM3]`: Sí, llegamos. Nos casamos en el 82, una boda chica, con familia y amigos. Yo tenía la pensión, ella vivía con sus papás todavía. Después nos alquilamos un departamento juntos, empezamos de a poco. No fue romántico de película, fue la vida nomás. Los dos trabajábamos, juntábamos plata, pensábamos en el futuro. Fue bien. Con Rosa pasamos lo que pasa con todas las parejas: días buenos y días difíciles, discusiones, reconciliaciones. Pero el amor estaba, y eso fue lo importante. Seguimos juntos hasta hoy, así que algo hicimos bien, ¿no?

**Biógrafo** `[M3.5 + AM4]`:
> Guardado, Manuel. Te mando la próxima.
>
> Hay días que quedan grabados para siempre: el del casamiento, o el primero viviendo juntos. Contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó. Si ya me lo contaste recién, con decírmelo alcanza.

**Narrador** `[AM4]`: El casamiento fue en una iglesia acá en Buenos Aires, una capilla chica. Rosa estaba hermosa, un vestido blanco que se había encargado con cuidado. Yo estaba nervioso, la verdad, metido en un traje que casi no usaba. Mis amigos del bar estaban ahí, la familia de Rosa, algunos amigos de ella. No fue nada lujoso, pero fue nuestro. Después la fiesta fue en lo de unos amigos que prestaban la casa. Hubo comida, música, bailamos. Recuerdo un momento en que Rosa y yo estábamos solos en la cocina, un ratito, y ella me dijo "Ahora sí, Manuel, somos uno." Eso se quedó conmigo. Esa noche fuimos al departamento pequeño que habíamos alquilado, y bueno, todo fue como tenía que ser.

**Biógrafo** `[M3.6 + AM13]`:
> Lo tengo, gracias. Vamos con otra.
>
> Contame una pelea que tuvieron, de esas que después dan risa: por qué fue, quién aflojó primero y cómo hicieron las paces. Si no hubo ninguna que hoy dé risa, con decírmelo alcanza.

**Narrador** `[AM13]`: Hubo una vez que Rosa invitó a unos amigos a cenar sin avisarme. Yo había tenido un día durísimo en el bar, estaba cansado, molesto, y ella "mañana vienen unos amigos." Yo dije que no, que estaba cansado, que cómo no me avisaba antes. Ella se enojó, me dijo que era un egoísta. Nos peleamos, no hablamos un día entero. Después ella preparó de todas formas la comida, cosa que no le dije nada. La noche vino, comimos, fue lindo. Después ella me dijo en la cama "No fue tan malo, ¿eh?" y los dos nos reímos. Eso quedó como una broma entre nosotros.

**Biógrafo** `[M3.7 + AM8]`:
> Quedó guardado, Manuel. Sigo con la que viene.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Narrador** `[AM8]`: Hay un momento que siempre vuelvo en la cabeza. Fue años después del casamiento, una tarde de domingo, estábamos los dos en el departamento, sentados en la ventana. Llovía afuera, y Rosa estaba tomando mate conmigo, en silencio. Ella apoyó su cabeza en mi hombro, y sin decir nada, sabía que estaba bien. No hablábamos, solo estábamos ahí. Después ella me dijo "Gracias por traerme a tu vida, Manuel." Fue poco, pero fue todo. Esos momentos tranquilos, sin ruido, son los que quedan. No los grandes eventos, sino los pequeños, cuando sabés que estás con la persona indicada.

**Biógrafo** `[M26 + AM9 + M1]`:
> Gracias, Manuel.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, hubo un final) (Seguimos juntos) (Paso esta)]

**Narrador** `[AM9]`: [toca: Seguimos juntos]

**Biógrafo** `[M25.2 + AM14]`:
> Bien, seguimos.
>
> ¿Hubo algún amor que te marcó, aunque haya durado poco o no haya llegado a nada? Si lo hubo, contame cómo se cruzaron y el momento que más te acordás de esa persona. Y si no hubo, con un no alcanza.

**Narrador** `[AM14]`: No, en serio. Rosa fue la indicada, y no hubo nadie después que me marcara de esa forma. Antes de ella hubo cosas, claro, pero cuando la conocí sentí que era lo que buscaba.

**Biógrafo** `[M26 + CI6]`:
> Gracias, Manuel.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI6]`: No, está. Lo importante de mi vida amorosa quedó. Rosa es la historia, lo demás son detalles que con el tiempo se olvidan.

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M25.3 + EN7]`:
> Bien, entonces.
>
> Ahora vamos al trabajo y a tu oficio, Manuel: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Narrador** `[TR1]`: En Galicia trabajaba con mi viejo sin cobrar, era lo que toca cuando sos chiquito. Pero la primera vez que realmente me gané algo fue acá en Buenos Aires, en el bar con mi tío. Los primeros meses no me pagaba mucho, nada más lo necesario para comer, porque vivía con él. Pero después empecé a ganar un poco más, propinas, algunas monedas que clientes me dejaban. Eso era mío, y lo juntaba. Recuerdo que la primera plata importante que tuve, la usé para comprarme ropa nueva, un pantalón que quería. Fue poco, pero fue la sensación de que me lo había ganado yo, de ser independiente un poco.

**Biógrafo** `[M3.2 + TR6]`:
> Te escuché. Vamos con la que sigue.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Narrador** `[TR6]`: Trabajé en la tierra en Galicia hasta los diecinueve años, después me vine para acá. En el bar con mi tío, eso fue desde el 75 hasta los años 80, casi diez años, aprendiendo. Después fui encargado del bar un tiempo, gané más responsabilidad. En el 90 compré el almacén en Villa Crespo, y eso fue mi vida hasta el 2020, treinta años, Manuel. Treinta años, todos los días abriendo a las seis y media, cerrando a las nueve. El almacén me quedó grabado, la verdad. Era lo mío, lo que construí. Conocía a cada persona del barrio, sus historias. Vendía en épocas buenas y malas, la crisis 2001 casi me quiebra, pero salí. Cuando cerré en el 2020, fue como cerrar un capítulo. Ahora estoy jubilado, pero esos treinta años fueron mi vida de verdad.

**Biógrafo** `[M3.3 + TR2]`:
> Lo anoté, gracias. Sigo con otra.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Narrador** `[TR2]`: Un día normal arrancaba temprano, a las cinco de la mañana, para preparar todo. Llegaba al almacén, prendía las luces, limpiaba un poco. A las seis y media abría la puerta. Llegaban los primeros clientes, la gente para ir al trabajo, necesitaba un café, cigarrillos, un pancho. Yo estaba todo el día ahí, atendiendo, controlando stock, acomodando cosas. Comía rápido algo mientras abría. Alrededor de las dos, menos movimiento, podía responder o hacer cuentas. Después venía la tarde, otro movimiento. Cerraba a las nueve, limpiaba, contaba la caja, y me iba cansado a casa. Fue treinta años así, cada día parecido. Pero había días especiales, cuando pasaba algo en el barrio, o cuando volvían clientes que hacía tiempo no veía. Eso era lo bueno, las caras, las historias, ser parte de la vida del barrio.

**Biógrafo** `[M3.4 + TR3]`:
> Gracias por contármelo. Seguimos.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Narrador** `[TR3]`: Mi tío. Él me trajo acá de Galicia, me dio trabajo en el bar. Sin él, yo no hubiera llegado a nada, probablemente seguía en la tierra toda la vida. Mi tío era duro, no era de los que te dan todo fácil, pero te enseñaba. Recuerdo una vez que rompí un vaso en el bar, valioso, y me dijo que tenía que pagarlo. Yo pensé que lo haría así de mala onda, pero después me explicó que todo tiene costo, que si querés tener algo propio tenés que aprender a cuidar lo de otros primero. Eso quedó. Sin mi tío, sin su empuje, sin su manera de enseñarme duramente, no sería quien soy. Murió hace años, pero le debo mucho.

**Biógrafo** `[M3.5 + TR5]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Cuál fue el día de trabajo del que estás más orgulloso? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo. Y si no te viene un día puntual, contame de qué parte de tu trabajo estás más orgulloso.

**Narrador** `[TR5]`: En el 2001, durante la crisis, muchos almacenes cerraban. La gente no podía comprar, se sacaban los ahorros de los bancos. Fue terrible. Yo pensé que cerraba también, pero decidí seguir. Bajé los precios, empecé a fiar a gente que sabía que después pagaría. Fue arriesgado, pero funcionó. Los clientes vinieron, se sintieron apoyados, y cuando la cosa mejoró, poco a poco volvieron a comprar de verdad. El almacén sobrevivió. Eso me orgullece, porque no fue solo negocio, fue tener la cabeza en el lugar donde estaba, en las personas que dependían de mí. Eso es de lo que estoy más orgulloso.

**Biógrafo** `[M26 + TR11]`:
> Gracias, Manuel.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.
>
> [botones: (Paso esta)]

**Narrador** `[TR11]`: La crisis 2001 fue difícil. El almacén seguía en pie, pero las ventas cayeron a la mitad. Pasabas días sin que entrara casi nadie. Yo tenía que pagar al proveedor, el alquiler, las cosas de casa. Rosa trabajaba también, ella me ayudaba. Fue un momento de incertidumbre, de no saber si iba a salir. Recuerdo un día específico, llegó una factura que no podía pagar, y me senté en el banco del almacén a pensar. Tenía miedo. Pero la gente seguía viniendo poco a poco, y algo adentro me decía que tenía que seguir. Así fue, poco a poco salimos de eso. Fue duro, pero te hace más fuerte.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[TR8]`:
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Narrador** `[TR8]`: El almacén fue lo mío. Trabajé años en el bar, ahorré cada peso que pude, Rosa también ahorró. En el 89, 90, vimos que había una oportunidad en Villa Crespo, un local que se alquilaba. Juntamos todo lo que teníamos, pidieron un crédito, y largamos. Los primeros años fueron ajustados, pero fuimos ganando confianza. El almacén fue mi vida, como te dije. Lo hice con mis propias manos casi, lo arreglaba yo mismo cuando algo se rompía. Fue más que un negocio, fue una pasión.

**Biógrafo** `[M3.7 + CS1]`:
> Quedó guardado, Manuel. Sigo con la que viene.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Narrador** `[CS1]`: Siempre arreglé cosas en la casa. Si algo se rompía, yo lo componía. Mi hijo Pablo decía que yo era capaz de arreglar cualquier cosa con lo que encontraba. Una vez se rompió el televisor, y el técnico cobraba una fortuna. Yo lo agarré, le saqué la tapa, vi qué estaba mal, cambié una cosa, y funcionó. Eso fue un logro para mí, porque de chico en Galicia aprendiste a arreglarte solo. También Rosa decía que mis empanadas eran buenas, cuando yo decidía cocinar. No es nada grande, pero la casa andaba porque yo estaba dispuesto a hacer las cosas necesarias.

**Biógrafo** `[M3.8 + CP1]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chico o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Narrador** `[CP1]`: Sí, claro, trabajé en el campo en Galicia toda mi infancia y adolescencia. Un día era así: salías con tu viejo a las cuatro de la mañana, llevabas herramientas, hacías lo que había que hacer según la estación. Araba, sembraba, cuidabas los animales. Volvías al mediodía, comías algo rápido, y después a veces más trabajo, a veces era simplemente estar ahí atendiendo las cosas. Una vez vino una helada terrible en invierno, a los dieciséis años, y los animales casi se mueren. Mi viejo y yo estuvimos toda la noche adentro de la chiquera, haciéndoles fuego, dándoles agua tibia. Fue durísimo, frío, miedo a perder todo. Pero los animales sobrevivieron. Eso fue lo que aprendiste en el campo: que la naturaleza no perdona, pero si ponés trabajo y cabeza, salís adelante.

**Biógrafo** `[M3.1 + TR9]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Narrador** `[TR9]`: Sí, lo cerré en el 2020. Fue una decisión, la jubilación llegó, tenía suficiente, y era hora de descansar. El último día del almacén lo supo gente del barrio, algunos vinieron a despedirse. Recuerdo que limpié todo extra bien ese día, como si estuviera cerrando para siempre y quisiera que quedara perfecto. Apagué las luces por última vez, conté la caja una última vez, cerré la puerta. El día siguiente fue extraño. Me desperté a las cinco de la mañana sin necesidad, por costumbre. Rosa me dijo "Ya no tenés que ir." Fue raro no ir. La rutina de treinta años se termina, y quedás sin saber qué hacer con tu tiempo. Pero fue la decisión correcta, necesitaba descansar.

**Biógrafo** `[M26 + CI7]`:
> Gracias, Manuel.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI7]`: No, quedó todo lo importante. El almacén, el bar, el campo, la gente. Las historias están.

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M25.1 + EN8]`:
> Bien, seguimos.
>
> Volvemos a la familia, Manuel, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Y si te tocó cuidarlos, contame cómo era un día de esos: qué hacías por ellos, qué te decían. Si no los tuviste cerca, contame cómo fue eso.

**Narrador** `[PG1]`: Mi vieja murió cuando yo todavía era joven, te lo conté. Mi viejo sobrevivió, envejeció solo en la casa. Volví a Galicia dos veces en mi vida. Una de esas veces lo vi ya mayor, más flaco, más lento. Estaba sentado en la puerta de la casa de siempre, mirando la aldea. Casi no hablaba. Me dijo una sola cosa: "Hiciste bien en irte." Eso quedó. Un gesto simple, la mano sobre mi hombro, es todo lo que me quedó. Para cuidarlo era difícil porque yo estaba acá y él allá. Le mandaba plata, escribía cartas. Después simplemente envejeció y se fue, sin que yo pudiera hacer mucho más que aceptar que la distancia había entre nosotros.

**Biógrafo** `[M26 + HI0 + M1]`:
> Gracias, Manuel.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Presentámelos de a uno, incluso si alguno ya apareció en lo que me venís contando: cómo se llama cada uno y cuándo llegó. Y si no tuviste, seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, tuve) (No tuve hijos)]

**Narrador** `[HI0]`: [toca: Sí, tuve]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[HI0]`: Tengo dos hijos, Pablo y Lucía. Pablo nació en el 84, poco después que Rosa y yo nos casamos. Fue varón, y eso me puso nervioso al principio, porque no sabía qué hacer. Pero después aprendés. Lucía llegó en el 87, tres años después. Ella fue la hija que tanto esperaba Rosa. Con los dos crecí de verdad, me hicieron padre, me enseñaron lo que era la responsabilidad de verdad. Los dos me dieron alegrías y también algunas dificultades, como pasa en todas las familias.

**Biógrafo** `[M3.3 + HI2]`:
> Lo anoté, gracias. Sigo con otra.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Narrador** `[HI2]`: Pablo nació en el hospital en Buenos Aires. Rosa estaba en la sala de parto, yo afuera caminando, nervioso de acá para allá. En esa época los padres no entraban como ahora. Un enfermero me dijo "Felicidades, es un varón." Entré, vi a Rosa cansada pero sonriendo, y después vi a Pablo. Era chiquito, rojo, dormido. El enfermero me lo dio en brazos, y no sé qué pasó en mí, pero sentí algo que nunca había sentido. Fue responsabilidad, miedo, amor, todo junto. Tenía en mis brazos a un ser que dependía de mí. Recuerdo que lloré de los nervios. Fue el momento más importante de mi vida tal vez, eso de ser papá por primera vez.

**Biógrafo** `[M3.4 + HI3]`:
> Gracias por contármelo. Seguimos.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Narrador** `[HI3]`: Pablo era tranquilo, pensador. De chico le gustaba armar cosas, desarmaba juguetes para ver cómo funcionaban. Era como yo en ese sentido. Lucía era distinta, más vivaz, habladora, siempre en movimiento. Los dos iban a la escuela, venían con historias. Recuerdo una vez que Pablo vino de la escuela muy serio, me dijo que había sacado un nueve en matemática, y estaba tan orgulloso. Otro día, Lucía me dibujó un cuadro de la familia, todos sonriendo, y me lo regaló. Esas cosas simples te quedan. Lo que me hace sonreír es cuando los dos se juntaban para jugar, había discusiones, peleas normales de hermanos, pero después se reían juntos. Eso era lo que quería, que se cuidaran mutuamente.

**Biógrafo** `[M3.5 + HS1]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Cómo fue criar a tus hijos? Quién estaba cerca, cómo se repartían las cosas, o si te tocó llevarla solo. Contame un día de esa época que te acuerdes bien.

**Narrador** `[HS1]`: Rosa y yo nos repartimos. Ella tenía su trabajo, yo el bar primero, después el almacén. Algunos días ella se quedaba más en casa con los chicos, otros días era yo quien llegaba tarde. Los dos éramos padres, aunque de distinta forma. Rosa era la que los cuidaba de las enfermeras, la que les ayudaba con la tarea. Yo era más de llevar, traer, arreglar lo que se rompía. Un día que me acuerdo: era una mañana, yo había cerrado el almacén para ir a buscar a Pablo a la escuela. Era raro para mí, porque generalmente Rosa se ocupaba. Lo fui a buscar, después fuimos a tomar algo, hablamos de su día. Fue simple, pero fue de esos días que te marca, porque ves que estás ahí, que importás.

**Biógrafo** `[M3.6 + HI6]`:
> Lo tengo, gracias. Vamos con otra.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Narrador** `[HI6]`: Pablo terminó el colegio y decidió estudiar informática. En esa época no era tan común que chicos del barrio hicieran eso. Lo vi trabajando, estudiando, con dificultades pero siguiendo. Cuando recibió, estaba ahí en la universidad viendo cómo le daban el diploma. Eso me hinchó el pecho, porque él salió del barrio, estudió, se hizo profesional. Con Lucía fue diferente, ella siempre fue buena en la escuela, pero lo que más me orgulleció fue su carácter. Vi cómo se defendía, cómo no dejaba que la pisotearan. Una vez vino a casa preocupada por una amiga que pasaba dificultades, y ella misma se ofreció para ayudarla. Eso es ser una buena persona. Esos son los momentos que te dan sentido a todo lo que trabajaste.

**Biógrafo** `[M3.7 + HI8 + M1]`:
> Quedó guardado, Manuel. Sigo con la que viene.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Puede que ya los hayas mencionado; contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Sí, llegaron) (No hay nietos)]

**Narrador** `[HI8]`: [toca: Sí, llegaron]

**Biógrafo** `[M30]`:
> Contame, te escucho.

**Narrador** `[HI8]`: Sí, tengo un nieto, Tomás. Nació en el 2020, así que todavía es chiquito. El día que lo conocí, fue en el hospital, después de que Pablo y su pareja tuvieron al niño. Yo estaba nervioso, porque abuelo es algo nuevo. Me pusieron al niño en los brazos, dormidito, y fue la segunda vez que sentí eso que sentí cuando Pablo nació. Miraba a Tomás y veía a Pablo de chico, veía la continuidad de la vida. Rosa estaba al lado mío, llorando de felicidad. Fue un círculo completarse, ¿viste? De abuelo, de haber vivido lo suficiente para ver a la siguiente generación empezar.

**Biógrafo** `[M3.8 + HI9]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Hay algo que hacés con tus nietos que es de ustedes, que no lo hacen con nadie más? Un juego, por ejemplo. Contame qué es y una vez que tengas bien grabada.

**Narrador** `[HI9]`: Todavía Tomás es muy chiquito, pero ya hacemos cosas juntos. Me gusta llevarlo al parque, y le enseño a buscar piedras. Cualquier piedra, la levantamos, la miramos, hablamos de ella, y la dejamos de nuevo. Es simple, pero para él es un mundo. Una vez le mostré cómo las piedras tienen historias, cómo vinieron de lejos. Él me miraba con los ojos grandes, así, entendiendo. Después volvimos a casa, y la madre le preguntó qué hizo, y él dijo "abuelo y piedras." Eso quedó entre nosotros, algo pequeño que es nuestro.

**Biógrafo** `[M26 + CI8]`:
> Gracias, Manuel.
>
> Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.
>
> [botones: (No, está todo)]

**Narrador** `[CI8]`: No, la familia quedó contada. Los viejos, los hijos, el nieto. Las historias están.

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M25.2 + EN9]`:
> Bien, seguimos.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Narrador** `[LU4]`: Fue volver a Galicia. No fue un viaje en el sentido de diversión, fue más importante que eso. Volví dos veces en mi vida. La primera fue años después de emigrar, necesitaba ver a mi viejo, la casa de nuevo. Lo que más me quedó fue la tarde en que llegué, con mi valija, pisé de nuevo la aldea. Todo era igual y diferente al mismo tiempo. Los árboles los mismos, pero yo había cambiado. Caminé hasta la casa, mi viejo me esperaba en la puerta. No hablamos mucho, simplemente nos miramos. Después fuimos a la casa, me mostró las cosas que había hecho, la tierra que seguía trabajando. Fue raro estar de vuelta siendo grande, cuando te fuiste de chico. Eso me quedó grabado, esa sensación de tiempo que pasó.

**Biógrafo** `[M3.2 + PA1]`:
> Te escuché. Vamos con la que sigue.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Narrador** `[PA1]`: El fútbol, siempre el fútbol. En Buenos Aires, eso es importante, viste. De joven iba a la cancha con amigos, veíamos jugar a los equipos. Seguía al equipo, iba cuando podía. Un día que me acuerdo en particular fue a ver un partido importante, con mi hijo Pablo, cuando era chiquito. Él estaba asustado por el ruido, la gente, pero después se enganchó. Pasamos toda la tarde ahí, viendo, gritando, comiendo algo. No ganamos el partido, pero fue un día perfecto. Eso era mi fuga, viste, cuando el almacén pesaba, iba a la cancha y me olvidaba de todo.

**Biógrafo** `[M26 + CI9]`:
> Gracias, Manuel.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquilo.
>
> [botones: (No, está todo)]

**Narrador** `[CI9]`: [toca: No, está todo]

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M25.3 + EN10]`:
> Bien, entonces.
>
> Hablemos de los amigos, Manuel, y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Narrador** `[AS1]`: Julio, el cocinero del bar. Lo conocí cuando empecé a trabajar ahí, y rápido nos hicimos amigos. Él era paraguayo, llegó a Buenos Aires como yo, buscando vida. Pasábamos mucho tiempo juntos, después del trabajo, nos contábamos las cosas. Una vez él pasaba una crisis financiera, y sin que me lo pidiera, le presté una suma importante. Él me dijo que cómo confiaba así, y yo simplemente le dije que los que emigramos somos hermanos en algún sentido. Años después, cuando tuve el almacén, él venía, me ayudaba, se llevaba lo que necesitaba. Eso es amistad de verdad, cuando no hay cálculo, es solo estar uno para el otro.

**Biógrafo** `[M3.4 + AY1]`:
> Gracias por contármelo. Seguimos.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Narrador** `[AY1]`: Rosa. Durante la crisis del 2001, cuando el almacén casi cierra, fue ella quien me sostuvo. Le dije que probablemente cerraba, que habíamos fracasado. Ella me miró fijo, y me dijo "No vas a cerrar. Vamos a hacer lo que sea, pero no cerramos." Ella trabajaba, yo trabajaba, los dos pusimos ganas en eso. Ella hasta se ofreció para ayudar en el almacén, vendía ella cuando yo tenía que arreglar algo. Sin Rosa, habría cerrado. Después, cuando las cosas mejoraron, pude devolverle todo el apoyo que ella dio. Eso es pareja, ¿viste? El apoyo mutuo cuando todo se derrumba.

**Biógrafo** `[M3.5 + AS9]`:
> Guardado, Manuel. Te mando la próxima.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Narrador** `[AS9]`: Rosa, obviamente. Ella es mi vida. Pablo y Lucía, mis hijos. Julio estaría ahí, el amigo del bar. Y ahora Tomás, el nieto, aunque sea chiquito. Quizás algunos clientes del almacén que se volvieron amigos, gente del barrio. Sería una cena tranquila, sin mucho ruido, comida casera. Rosa cocinando, yo atendiendo, los chicos ayudando. Hablando de cosas simples, riendo. No necesita ser nada grande, solo estar juntos los que te importan. Eso es la riqueza de verdad, tener gente que cuando vos estás en la mesa, en el almacén, en la vida, se sientan seguros contigo.

**Biógrafo** `[M26 + CI10]`:
> Gracias, Manuel.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquilo.
>
> [botones: (No, está todo)]

**Narrador** `[CI10]`: No, la gente importante quedó. Los que de verdad importan están ahí. Lo demás son encuentros que pasan, que no quedan.

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

**Narrador** `[PE1]`: Mi vieja, ya lo conté. Murió sin que yo pudiera estar. Eso es algo que se lleva. Mi viejo envejeció, se fue después, solo. Eso duele. De mi hermano no quiero hablar. Esos dolores quedan, se vuelven parte de vos. Lo que hago es intentar no dejarlos crecer más, vivir con lo que tengo adelante, con Rosa, con los chicos. La vida sigue, y si mirás todo el tiempo para atrás, no avanZás.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Manuel. Queda guardado con cuidado.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Paso esta)]

**Narrador** `[PE5]`: Nada grave. Tengo la edad que tengo, dolores de la edad, la presión alta, cosas así. Pero gracias a Dios, fuerte todavía. Rosa me cuida, voy al médico cuando toca. Trabajé treinta años en el almacén de pie, con el cansancio que eso trae. Ahora estoy jubilado, descanso más. No hay nada de eso que me haya frenado en serio.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Y si ya me la contaste, con decírmelo alcanza.
>
> _Si no va con vos, decí paso y vamos a otra._
>
> [botones: (Paso esta)]

**Narrador** `[PE4]`: Ya conté lo principal. La crisis 2001, cuando todo se derrumbaba. La muerte de mi vieja, que fue lo más duro. La vida de grande tiene sus épocas difíciles, pero eso es la vida, ¿no?

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI11]`:
> Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.
>
> [botones: (No, está todo)]

**Narrador** `[CI11]`: [toca: No, está todo]

## Bloque 12 · La historia grande

**Biógrafo** `[M25.2 + EN12]`:
> Bien, seguimos.
>
> Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.

**Biógrafo** `[HG1]`:
> Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día.

**Narrador** `[HG1]`: El Mundial 78, cuando Argentina campeón. Eso fue en la plaza, gente loca de felicidad. Yo estaba en Buenos Aires, trabajando en el bar en ese tiempo. Toda la ciudad fue a la calle. Nosotros cerramos temprano, fuimos a la plaza con Rosa. Fue increíble, la energía, la gente cantando, abrazándose. Fue el momento en que sentí que Argentina era mi país también, que ya no era solo un extranjero. Ese día quedó grabado. También pasaron cosas no tan buenas en esa época, la dictadura, gente que desaparecía. Eso era oscuro, asustador. Vos como trabajador intentabas no meterte, guardarte, vivir tu vida.

**Biógrafo** `[M3.7 + HG4]`:
> Quedó guardado, Manuel. Sigo con la que viene.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado. Y si ninguno se te separa de los demás, contame cómo eran tus días entonces.

**Narrador** `[HG4]`: Un día de la pandemia, en el 2020. Yo estaba cerrando el almacén por la edad, pero la pandemia aceleró las cosas. Ese día, me desperté a las cinco como siempre, y Rosa me dijo "Hoy nos quedamos acá." Fue raro. Miraba por la ventana, las calles vacías, miedo en el aire. Encendimos la radio, gente muriendo, gente encerrada. Yo que había trabajado treinta años de pie, todos los días abriendo temprano, de repente se termina todo. No fue triste solo, fue extraño, como si el mundo se parara. Rosa y yo nos cuidábamos, Tomás acababa de nacer. Eso fue lo importante, que Tomás llegara en eso, nuevo en un mundo difícil.

**Biógrafo** `[M3.8 + DE1]`:
> Te escuché bien. Vamos por la siguiente.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Narrador** `[DE1]`: Antes si querías bailar con una mujer que no era tu novia, era escándalo. Los chicos de la iglesia te miraban raro si ibas a un baile que no fuera de fiesta importante. Una vez, antes de casarme, quise ir a un baile que estaba medio fuera de lo formal, y mi viejo casi me pega. Hoy los chicos hacen eso todos los días sin problema. Fumar, tomar, todo era más vigilado, más juzgado. Ahora es distinto. No sé si mejor o peor, pero distinto. A veces pienso que algunos límites que había antes no eran malos, te enseñaban a respetarte.

**Biógrafo** `[M3.1 + FI7]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Narrador** `[FI7]`: De eso mejor no hablemos. La política es complicada, tiene opiniones fuertes, y no me interesa meterme ahí. Viví en épocas oscuras acá, la dictadura, los desaparecidos. Eso me enseñó a no hablar mucho de eso. Hice mi vida, trabajé, cuidé a mi familia. Eso es lo que importa.

**Biógrafo** `[M26 + CI12]`:
> Gracias, Manuel.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.
>
> [botones: (No, está todo)]

**Narrador** `[CI12]`: No, está. Lo importante quedó, el país, los momentos, la pandemia. Listo.

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M25.3 + EN13]`:
> Bien, entonces.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó. Si es uno que ya me contaste, decímelo y, si querés, agregale lo que te faltó.

**Narrador** `[GI1]`: El día que compré el almacén. Rosa y yo con los papeles en la mano, mirando el local vacío en Villa Crespo. Era una tarde, yo estaba nervioso, asustado, emocionado. Rosa me agarró del brazo y me dijo "Lo hicimos." Fue el momento en que me di cuenta que todo lo que había trabajado, todo lo que había sacrificado, llegaba a algo concreto. De chico en Galicia, soñaba con tener algo propio, y ese día lo tenía. Viviría ese día de nuevo, esa sensación de puertas nuevas que se abren, de futuro que empieza. Después la vida fue complicada a veces, pero ese día fue puro.

**Biógrafo** `[M3.3 + GI2]`:
> Lo anoté, gracias. Sigo con otra.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó. Si ya me lo contaste, con decírmelo alcanza. Y si el día justo no te vuelve, contame lo que te acuerdes de esa época.

**Narrador** `[GI2]`: El día que bajé del barco en Buenos Aires. Fue en el 75, tenía diecinueve años. La mañana fue normal, estaba en el barco aún, mirando el agua, sin saber qué esperar. Cuando bajé, el puerto era caótico, gente, gritos, el olor a sal y a ciudad. Un marinero me dijo "Bienvenido a Argentina." Fue el momento en que pensé "De acá no vuelvo." No fue racional la decisión, fue una certeza. Le dije adiós a mi vieja esa mañana en Galicia, y cuando bajé de ese barco en Buenos Aires, comprendí que esa era mi vida nueva. Ese día terminó con mi tío recogiéndome, llevándome a un mundo que no conocía. De ahí en adelante, nada fue igual.

**Biógrafo** `[M3.4 + HJ1]`:
> Gracias por contármelo. Seguimos.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Narrador** `[HJ1]`: Volver a Galicia a quedarme. De chico imaginaba que iba a irme un tiempo, trabajaba, ganaba plata, volvía. Pero no pasó así. Las responsabilidades, Rosa, los chicos, el almacén, todo te mantiene en un lugar. Cuando por fin volví, mi viejo ya era un viejo, casi no hablaba. Se fueron los años en el medio, la vida pasó. Eso no se recupera. Me doy cuenta ahora, de grande, que hay cosas que si no las hacés cuando toca, se pierden. Con mi viejo, quería hablar más, saber más de él, pero ya era tarde. Eso quedó pendiente.

**Biógrafo** `[M3.5 + GI9]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquito frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor. Y si no te vuelve un momento puntual, contame frente a qué cosas te pasa eso.

**Narrador** `[GI9]`: En el barco, viniendo a Argentina. Una noche, me asomé a la baranda, y miraba el océano, oscuro, sin fin. Yo tenía diecinueve años, con una valija, sin saber qué iba a pasar. El mar era infinito, yo era nada en el medio. Sentí miedo y curiosidad al mismo tiempo. Daba vueltas en mi cabeza que podía desaparecer en ese océano, que nadie sabría. Pero también pensaba que estaba solo, que era mi decisión, mi coraje. Eso me hizo sentir chiquito pero también enorme en algún sentido. A veces, cuando veo el cielo de noche acá en Buenos Aires, vuelvo a sentir eso: que los problemas nuestros son pequeños, que hay algo más grande.

**Biógrafo** `[M3.6 + FI1]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos mismo? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Narrador** `[FI1]`: La soledad... No sé. Después de treinta años con el almacén, abierto cada día, ahora la soledad es diferente. A veces Rosa está ocupada, yo estoy solo en la casa, y está bien. Me siento en la ventana, miro para afuera, pienso. Pero la soledad de chico cuando llegué a Buenos Aires fue otra cosa, fue difícil, buscaba gente, buscaba no estar solo. Ahora de viejo es diferente, es paz. Tengo mis momentos que me acuerdo de cosas, de gente que no está. Pero son momentos, después vuelve Rosa, viene Tomás, la vida sigue.

**Biógrafo** `[M3.7 + FI2]`:
> Quedó guardado, Manuel. Sigo con la que viene.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Narrador** `[FI2]`: Un día llegó un cliente al almacén, un chico joven, y me pidió algo. Después me dijo "Don Manuel, ¿cómo está?" Me dio un susto, porque en mi cabeza yo seguía siendo joven. Ese "don" me pegó. Pensé que eran mis años diciendo hola. Otro momento fue cuando vi a Pablo con Tomás, y vi que Pablo era padre, y yo abuelo, en un segundo. La vida pasa mientras vos estás ocupado con el trabajo, con las cosas. No te das cuenta hasta que un momento te miran diferente, te tratan como a un señor. Eso es cuando te dás cuenta de que ya no sos el que corrías por la aldea.

**Biógrafo** `[M3.8 + FI3]`:
> Te escuché bien. Vamos por la siguiente.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Narrador** `[FI3]`: El trabajo, la paciencia. Mi viejo nunca se quejaba, simplemente hacía. Yo heredé eso. Una vez Rosa me dijo que parecía mi viejo, trabajando sin parar, sin quejarme. Eso me sorprendió, porque en ese momento no lo pensaba, pero es verdad. Él me enseñó que los hombres no hablan mucho, hacen. También heredé la reserva, la forma de no meter la nariz en los asuntos de otros. Y la dureza, un poco. Mi viejo era duro de verdad, y eso me hizo aprender rápido. Eso pasó a mis hijos, supongo. Es lo que uno trae en los genes, en la forma de estar en el mundo.

**Biógrafo** `[M3.1 + FI4]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Narrador** `[FI4]`: Sí, me importa. Más de chico, cuando querías caer bien, cuando querías que la gente te respetara. De grande me importa menos, pero sigue ahí. Una vez, un cliente del almacén se quejó de que yo era muy serio, que no sonreía. Eso me molestó más de lo que debería. Después traté de sonreír más, saludar con más calidez. Pero es difícil cambiar cómo sos. Me importa lo que piensan de mí porque trabajo honrado, porque doy lo que prometo. Eso importa. Lo que no importa es si caigo bien o no. Eso es vanidad, y la vanidad es peligrosa.

**Biógrafo** `[M3.2 + FI6]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Narrador** `[FI6]`: No sé. Probablemente todo será distinto, máquinas, cosas que no entiendo. Espero que la gente tenga trabajo, que pueda vivir con dignidad, que la familia siga siendo lo importante. Lo que me gustaría que no se pierda es la gente que trabaja con las manos, que construye cosas, que hace la vida posible. Espero que Tomás vea un mundo mejor que el que yo vi, con menos dolor, con más oportunidades. Pero eso depende de lo que ustedes, los jóvenes, hagan ahora.

**Biógrafo** `[M26 + CI13]`:
> Gracias, Manuel.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquilo.
>
> [botones: (No, está todo)]

**Narrador** `[CI13]`: [toca: No, está todo]

## Bloque 14 · Hoy

**Biógrafo** `[M25.1 + EN14]`:
> Bien, seguimos.
>
> Dejamos el pasado un rato y venimos a hoy, Manuel: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Narrador** `[HO1]`: Me despierto a las seis, aunque no necesito, el cuerpo tiene su ritmo. Tomo mate con Rosa en la cocina, leemos el diario. Después, depende. A veces salgo a caminar al barrio, visito algunos lugares donde conocía gente del almacén, saludamos. A veces me quedo en casa, arreglo cosas que necesitan arreglo, veo a Tomás si viene. Como al mediodía con Rosa, siesta una hora o media. Por la tarde miro televisión, pero no demasiado. A veces voy al café con algún amigo que queda del bar, tomamos algo, hablamos. A la noche, Rosa prepara la comida, comemos juntos, conversamos del día. Después miramos una película, o simplemente estamos en la sala, en silencio. Me acuesto a las nueve. Es una vida tranquila, sin apuros.

**Biógrafo** `[M3.4 + HO2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado. Y si la última no te vuelve, contame con qué te reís seguido.

**Narrador** `[HO2]`: Rosa. Rosa me hace reír. A veces dice cosas sin pensar, cosas de chiste, y me río. Tomás también, cuando trata de imitar a los adultos, es gracioso. Último que me reí de verdad fue la semana pasada cuando Pablo llegó con Tomás, y el chiquito quiso ayudarte a "reparar" un caño que teníamos gota. Le di un martillito de juguete, y lo que hizo fue tan inocente y tan bobo que no pude evitar reírme fuerte. Rosa se reía también. Esos momentos son los que ponen color en los días.

**Biógrafo** `[M3.5 + HO5]`:
> Guardado, Manuel. Te mando la próxima.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Narrador** `[HO5]`: La tranquilidad. No hay apuro, no hay nadie gritando por un cliente enojado, no hay estrés. Rosa y yo en la casa, la gente que quiero cerca. Esta semana, una tarde, Lucía vino de visita con su marido. Estábamos los cinco en la mesa, comiendo, hablando, riendo. En ese momento pensé "Esto es lo que trabajé treinta años para tener." Ese momento, ver a tus hijos adultos, felices, y a tu pareja al lado, eso es lo más importante. No es enorme en el sentido de la gloria, es pequeñito, pero es todo.

**Biógrafo** `[M3.6 + CO1]`:
> Lo tengo, gracias. Vamos con otra.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Narrador** `[CO1]`: Las empanadas. Rosa me enseñó la receta cuando nos casamos, pero yo le metí la mano y ahora me salen a mi forma. Hago la masa, el relleno de carne con cebolla, especias. Cuando decido hacer empanadas, la gente lo sabe, se acercan oliendo. Una vez, Julio vino de visita, no le avisé que iba a cocinar, y cuando llegó, tenía empanadas listas. Se emocionó. Dijo que después de años, comía algo que le traía recuerdos de casa. Eso fue lindo, ver que algo tan simple, hecho con ganas, hace feliz a la gente. Ahora cuando viene Pablo con Tomás, le hago empanadas, y el chiquito come como un obispo.

**Biógrafo** `[M3.7 + HO9]`:
> Quedó guardado, Manuel. Sigo con la que viene.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Narrador** `[HO9]`: Vivo en Villa Crespo, cerca del almacén. Fue natural quedarse por acá después de tanta vida en el barrio. La casa es chica, nada grande, cuartos suficientes, un patio atrás. Rosa arregló la casa como le gusta, cortinas, plantas. El barrio es igual al de hace treinta años, pero con caras nuevas. Aún hay gente que me conoce, que saluda. Una tarde de estas, estaba podando una planta del patio, y pasaba un chico que solía comprar en el almacén cuando era pequeño. Ahora es grande, con hijos. Se paró a hablar conmigo, me preguntó cómo estaba. Eso quedó. El barrio te da eso, la sensación de pertenecer, de que importás.

**Biógrafo** `[M26 + CI14]`:
> Gracias, Manuel.
>
> Con esto cerramos lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquilo.
>
> [botones: (No, está todo)]

**Narrador** `[CI14]`: No, está todo. Mi vida ahora es esto, lo que pasamos. Es simple, es buena.

## Bloque 15 · Legado y cierre

**Biógrafo** `[M25.2 + EN15]`:
> Bien, seguimos.
>
> Ya estamos en la última parte, Manuel: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Narrador** `[LE1]`: Llegar a Argentina con nada y construir algo. Fue difícil, nadie me regaló nada. Trabajé, ahorré, y compré un almacén. Eso que de chico en Galicia parecía imposible, lo hice. Pero más que eso, me da orgullo que mis hijos sean buenas personas. Pablo es profesional, trabajador. Lucía es buena gente, se preocupa por los demás. Eso no lo "hicieron" ellos solos, pero eso que Rosa y yo les dimos de confianza, de ejemplo, quedó. Y que Rosa siga conmigo después de todos estos años, que nos sigamos eligiendo. Eso es el verdadero orgullo, la vida que construimos juntos.

**Biógrafo** `[M3.1 + LE2]`:
> Gracias, Manuel. Ya lo guardé.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos mismo descifraste viviendo.

**Narrador** `[LE2]`: Que no sean duras las cosas si no te importan las personas. Yo trabajé treinta años, pero lo que me quedó fue la gente que conocí, las historias, no la plata. Que trabajen, que estudien, que se esfuercen, pero que no se olviden de las personas que aman. Que la vida pasa rápido. Yo volví la cabeza un momento, y ya estoy viejo. Que no dejen pasar los momentos con la gente que importa. Que sean honestos, que trabajen duramente pero que no sacrifiquen su alma. Y que si les da miedo algo, que lo hagan igual. Yo tenía miedo de venir a Argentina, pero lo hice, y mi vida cambió.

**Biógrafo** `[M3.2 + FU1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Narrador** `[FU1]`: Ver crecer a Tomás. Estoy con Rosa en la cocina, y veo a Tomás de diez años, once, doce, viéndome a mí, viéndolo todo. Que sepa quién fui, que sepa que su abuelo trabajó, que construyó cosas. Quiero estar en eso, en esos momentos de su infancia. Quiero una tarde más con el viejo en Galicia, aunque sea fantasía. Eso no puedo hacerlo. Pero con Tomás, con mis hijos, eso sí, eso está pasando.

**Biógrafo** `[M3.3 + LE7]`:
> Lo anoté, gracias. Sigo con otra.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Narrador** `[LE7]`: "El que se fue y llegó." O simplemente "De aquí para allá, de allá para acá." Porque mi vida fue eso, el viaje. Salí de un lugar, llegué a otro, conocí gente, construí algo. El movimiento, la búsqueda. No es una historia de héroe, es la de alguien que caminó, que trabajó, que quiso algo mejor y lo hizo. Es eso, la travesía.

**Biógrafo** `[M3.4 + M15]`:
> Gracias por contármelo. Seguimos.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> Papá, ¿qué llevabas en la valija cuando bajaste del barco? Lucía

**Narrador** `[FAM1]`: Lucía, mi hija. Una valija chiquita, de cartn duro. Adentro llevaba dos pantalones, tres camisas, un suéter que me tejió tu abuela, un par de zapatos. Y un papel doblado con la dirección de mi tío. Eso era todo. No llevaba fotos, no llevaba mucho. Pero llevaba la esperanza de tu madre en esos pantalones gastados, en el suéter que me tejió con miedo de que me fuera. Llevaba el trabajo de mi viejo, la dureza. Cuando bajo del barco, la valija era lo único que tenía. Hoy en día mirando para atrás, lo importante no era lo que había adentro, era lo que dejé atrás. Tu abuela, mi tierra, mi infancia. Pero esa valija vacía se llenó de vida. Se llenó de vos, de tu hermano, de tu madre, de todo lo que construimos juntos.

**Biógrafo** `[M3.5 + FO1]`:
> Guardado, Manuel. Te mando la próxima.
>
> Otra cosa, Manuel. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Tomate el tiempo que necesites para buscarla: la pregunta que sigue te la mando cuando me llegue la foto o me digas algo. Y si no la encontrás, no pasa nada: el libro va igual, y la podés mandar más adelante.
>
> [botones: (No tengo foto)]

**Narrador** `[FO1]`: [toca: No tengo foto]

**Biógrafo** `[M25.3 + LE9]`:
> Bien, entonces.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Narrador** `[LE9]`: No. Creo que quedó todo dicho. Lo que tenía para decir, lo dije. La vida de un hombre, las cosas que importan. Eso quedó ahí.

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Narrador** `[LE8]`: Rosa, mi vida. Te amé cuando te conocí, y te sigo amando ahora. Gracias por bancarme, por estar en los momentos difíciles, por hacerme feliz. Sos la mejor decisión que tomé. Espero que lo supieras siempre. Pablo, mi hijo. Estoy orgulloso de vos. Sos un hombre bueno, trabajador. Cuidá a Tomás como yo traté de cuidarte a vos. Lucía, mi hija. Tu corazón es lo más bonito que vi en mi vida. No pierdas eso, la bondad que tenes. Y Tomás, mi nieto, aunque sos chiquito, algún día leerás esto. Quiero que sepas que tu abuelo trabajó, que amó, que intentó dejar un lugar mejor para vos. La vida es corta, disfrutala, aprende, y cuidá a los tuyos. Eso es lo que importa.

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Manuel. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Y si te quedó alguna foto por mandar, mandámela por acá cuando la encuentres: entra igual. Fue un gusto enorme escucharte.
