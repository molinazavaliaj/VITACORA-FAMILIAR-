# Simulación 3: el solterón (Aníbal, 77, inventado)

**Qué es:** la entrevista de un narrador **inventado** (Aníbal), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Plan: [`PLAN.md`](PLAN.md).

**Cuenta:** 90 preguntas del banco contestadas + 1 de la familia · **129 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

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

**Narrador** `[OR1]`: Nací en Arroyito, en Rosario, ahí en el barrio. Mi papá era tornero, trabajaba en un taller. Mi mamá ama de casa, qué sé yo, la vida de entonces, así eran las cosas. Me contaban que me esperaban, nada especial.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gracias, Aníbal. Ya lo guardé.
>
> En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR2]`: No, la verdad que no. Mi papá no hablaba mucho de eso. Eran de por acá, de Rosario, de siempre. Nada especial, qué sé yo.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo se conocieron tu mamá y tu papá? Seguro en casa lo contaron más de una vez: un baile, una casualidad, alguien que los presentó. Contame ese día como te lo contaron.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[OR5]`: No me acuerdo bien, la verdad. Se conocieron en el barrio, así nomás, qué sé yo. Eran otros tiempos.

**Biógrafo** `[M26 + CI1]`:
> Gracias, Aníbal.
>
> Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora.

**Narrador** `[CI1]`: No, nada. Paso.

## Bloque 2 · La casa y la familia de la infancia

**Biógrafo** `[M25.1 + EN2]`:
> Bien, seguimos.
>
> Ahora vamos a tu infancia, Aníbal: la casa donde creciste y los de tu casa de entonces.

**Biógrafo** `[CA1]`:
> Contame el primer recuerdo que tengas de la casa donde creciste: un día, qué estabas haciendo, quién andaba por ahí.

**Narrador** `[CA1]`: Estaba jugando en el patio con Olga, mi hermana, jugábamos a la pelota. La casa tenía patio atrás. Mi mamá en la cocina metida en el quehacer. Mi papá no estaba, estaba en el trabajo. Nada especial, así era.

**Biógrafo** `[M3.4 + CA2]`:
> Gracias por contármelo. Seguimos.
>
> Viajemos un rato a cuando eras chico. ¿Cómo era tu mamá con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.

**Narrador** `[CA2]`: Era buena mi mamá, me cuidaba bien. Me acuerdo que me hacía bizcochos de vainilla en la cocina, unos que estaban muy buenos. Me dejaba probar la cuchara mientras revolvía. Cosas simples así, pero uno se acuerda.

**Biógrafo** `[M3.5 + CA3]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿Y tu papá? ¿A qué se dedicaba cuando eras chico? Contame alguna vez que lo acompañaste o lo viste trabajando.

**Narrador** `[CA3]`: Era tornero, trabajaba en un taller metalúrgico acá en Rosario. Una vez me llevó y me mostró cómo funcionaba el torno, las máquinas. Me acuerdo del ruido, del olor a metal, las virutas que saltaban. Eso me gustó, después yo también terminé siendo tornero.

**Biógrafo** `[M3.6 + CA6 + M1]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste hermanos? Si tuviste, ¿con cuál eras más cercano de chico? Contame alguna aventura que hayan hecho juntos; seguro tienen varias.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[CA6]`: Sí, una hermana, Olga, era mayor que yo. Jugábamos en el barrio, corríamos por todos lados. Una vez nos metimos a explorar las calles de Arroyito y nos perdimos un poco, nos llevó un rato encontrar el camino de vuelta. La vieja nos mató a pedos cuando llegamos. Olga se casó y se fue a Santa Fe después, por eso la veo poco ahora.

**Biógrafo** `[M3.7 + CA16]`:
> Listo, quedó guardado. Sigo.
>
> Contame un día de chico que esperabas con muchas ganas: qué era, quién estaba, qué pasó.

**Narrador** `[CA16]`: Me acuerdo que esperaba los sábados para ir al club, al Club Social Arroyito. Quería jugar al básquet con los pibes, eso era lo que me ansiaba. Lo esperaba todo el día, estaba ahí jugando, corriendo, sudando. Eso era lo mío de chico.

**Biógrafo** `[M3.8 + CA17]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Hubo algún momento difícil de tu infancia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[CA17]`: No, la verdad que no. Fue una infancia tranquila, qué sé yo. Los normales de cualquier chico, pero nada que me haya marcado grave. Tuve la suerte de tener padres que me cuidaran.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Aníbal. Queda guardado con cuidado.

**Biógrafo** `[CI2]`:
> Ya casi terminamos con tu infancia, y me quedo pensando si te dejé algo afuera. ¿Hubo alguna historia que se te vino a la cabeza mientras contabas y no tuvo dónde entrar? Contámela ahora, tranquilo, que hay tiempo.

**Narrador** `[CI2]`: No, nada. Paso.

## Bloque 3 · La escuela y los juegos

**Biógrafo** `[M25.3 + EN3]`:
> Bien, entonces.
>
> Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad.

**Biógrafo** `[ES1]`:
> ¿Cómo fue tu primer día de escuela? ¿Quién te llevó hasta la puerta, y qué sentiste cuando se fue? Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria.

**Narrador** `[ES1]`: Me llevó mi mamá de la mano hasta la puerta. Era chico, qué sé yo, metí miedo al principio. La escuela quedaba a pocas cuadras de casa, acá en Arroyito. Después estuvo bien, me acostumbré al toque.

**Biógrafo** `[M3.1 + ES2]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.

**Narrador** `[ES2]`: Sí, había un maestro, Don Pérez, que sabía explicar bien. A mí me costaban las matemáticas, pero él enseñaba de otra forma. Una vez me quedé después de clase y me ayudó con unos problemas, me acuerdo. Buen tipo, eso se quedó en mí.

**Biógrafo** `[M3.2 + ES5]`:
> Te escuché. Vamos con la que sigue.
>
> De chico, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? ¿Qué hacían cuando andaban juntos? Contame una tarde con esa persona que todavía te hace sonreír.

**Narrador** `[ES5]`: Sí, tenía un amigo, Roberto, vivía acá cerca en Arroyito. Jugábamos en la calle, a la pelota, al fútbol, corríamos por todas partes. Me acuerdo que una vez fuimos a robar frutas a una quinta que no era de nadie, caímos en un pozo de barro, los dos mojados hasta los tobillos. Nos reíamos como locos cuando volvimos a casa. Eso se me quedó.

**Biógrafo** `[M3.3 + ES6]`:
> Anotado. Sigo con otra.
>
> ¿Cuál fue la travesura más grande que hiciste de chico, en la escuela o en el barrio? Esa que todavía te da risa, o un poco de vergüenza. Contame cómo fue y si te agarraron. Y si se te vienen más, contalas también.

**Narrador** `[ES6]`: Ay, una vez robamos chocolates de la despensa de la escuela, yo con un par de amigos. Nos agarraron los directores, casi nos echan. Mi papá fue a hablar con ellos y se arregló, pero me acuerdo la vergüenza que pasé en casa, la vieja me pegó un reto que no me olvido. De chico sos pelotudo, qué sé yo.

**Biógrafo** `[M3.4 + ES7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea: alguien que veías, algo que pasó? Si te acordás del momento en que lo decidiste, o de quién te lo metió en la cabeza, contámelo.

**Narrador** `[ES7]`: Tornero, como mi papá. Lo veía en el taller, las máquinas, el trabajo bien hecho. Me gustaba cómo él hacía las cosas, con precisión, con cuidado. Decidí ser como él, aprender el oficio. Fue lo natural, supongo. El viejo nunca me dijo nada, pero veía que hacía un buen trabajo y quería eso para mí.

**Biógrafo** `[M3.5 + ES9]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿La religión estaba presente en tu casa cuando eras chico? Si fue así, ¿hubo una ceremonia o una fiesta que te tocó de cerca? Contame ese día: dónde fue, con quién estabas.

**Narrador** `[ES9]`: Sí, íbamos a misa los domingos. Mi mamá era más religiosa que mi papá. Me acuerdo de la Primera Comunión, todo de blanco, fue en la iglesia de Arroyito. No fue gran cosa, después un almuerzo en casa con la familia. Era lo que se hacía, nomás.

**Biógrafo** `[M26 + CI3]`:
> Gracias, Aníbal.
>
> Con esto cerramos tus años de escuela. Antes de seguir, ¿te quedó alguna historia de esa época dando vueltas, algo que no entró en ninguna pregunta? Contámela ahora, con calma, que la quiero escuchar.

**Narrador** `[CI3]`: No, creo que está. Paso.

## Bloque 4 · Adolescencia

**Biógrafo** `[M25.3 + EN4]`:
> Bien, entonces.
>
> Ahora vamos a tu adolescencia: esos años en que uno deja de ser chico y todavía no es grande.

**Biógrafo** `[AD2]`:
> Después de la primaria, ¿dónde pasabas los días a los trece, catorce años? ¿Cómo llegaste ahí? Contame una vez de esos años que te quedó grabada.

**Narrador** `[AD2]`: Entré en una escuela técnica, aprendía tornería, metalurgia. Era lo que yo quería, qué sé yo. Todo el día en el taller aprendiendo el oficio. Los compañeros eran buenos, jugábamos al fútbol en el recreo. Me acuerdo que estaba bien, era uno de mis mejores años, la verdad.

**Biógrafo** `[M3.7 + AD3]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tenías una barra de amigos a los quince, dieciséis? ¿Cómo eran, qué hacían cuando se juntaban? Contame una noche o una salida con ellos que todavía te acordás. Es una edad que queda marcada: si se te vienen más historias, contalas todas.

**Narrador** `[AD3]`: Sí, teníamos una barra con los de la escuela técnica y los del club. Jugábamos al fútbol, al básquet, nos juntábamos a tomar birra en algún lado. Una vez fuimos a un baile en el club, éramos todos unos boludos, nos peleamos con unos pibes de otro barrio, nada grave pero quedó. Eran buenos tiempos, la verdad.

**Biógrafo** `[M3.8 + AD5]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche.

**Narrador** `[AD5]`: Fue a un baile en el club, con los amigos de la escuela. Me puse mi mejor camisa, me peiné para arriba. Estaba nervioso, no sabía mucho de qué hablar con las chicas. Nos emborrachamos un poco, bailamos. Una chica me invitó a bailar, fue raro pero lindo. Me acuerdo que me gustó, la pasé bien esa noche.

**Biógrafo** `[M3.1 + AD6]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo era esa persona, y un momento de los dos que todavía llevás guardado.

**Narrador** `[AD6]`: Había una chica en la escuela técnica, Marina. Estaba enamorado, qué sé yo, me costaba hablarle, estaba nervioso cuando la veía. Un día me animé y la invité a tomar algo después de clase, aceptó. Estuvimos un tiempo viéndonos, paseos, cosas simples. Después ella se fue de viaje a Buenos Aires y no volvió. Fue mi primera real, supongo. Me dolió un poco, la verdad.

**Biógrafo** `[M3.2 + AD12]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cuándo sentiste por primera vez que ya no eras chico? Algo que tuviste que decidir o hacer por tu cuenta, una responsabilidad nueva. Contame ese momento.

**Narrador** `[AD12]`: Fue cuando entré a la colimba en el 69, en Paraná. Me fui de casa, estaba lejos de mi familia, tenía que valerme solo por primera vez de verdad. Ahí te das cuenta que creés, que tenés que tomar decisiones sin que nadie te cuide. Fue duro los primeros meses, pero después te acostumbrás. Eso me marcó.

**Biógrafo** `[M3.3 + AD15]`:
> Anotado. Sigo con otra.
>
> ¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[AD15]`: No, la adolescencia fue bien, qué sé yo. Tuve mis cosas, pero nada grave que me marque realmente. La vida tiene sus alegrías y sus cosas, pero la adolescencia pasó tranquila.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[CI4]`:
> Con esto cerramos tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquilo, que hay tiempo.

**Narrador** `[CI4]`: No, creo que está todo. Paso.

## Bloque 5 · Juventud

**Biógrafo** `[M25.3 + EN5]`:
> Bien, entonces.
>
> Pasamos a tu juventud, Aníbal: cuando empezaste a armar tu propia vida.

**Biógrafo** `[JU1]`:
> ¿Te acordás del día que te fuiste de la casa de tus viejos? A dónde te fuiste, con quién, cómo fue esa despedida. Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande.

**Narrador** `[JU1]`: No, la verdad que no. Nunca me fui. Después de la colimba volví a casa de mis viejos, y cuando se fueron muriendo, me quedé viviendo acá, en la misma casa de siempre. Acá nací, acá crecí, acá me quedé. Siempre fue mi casa.

**Biógrafo** `[M3.4 + JU2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué hiciste después del colegio? Si seguiste estudiando, contame qué y cómo eran esos años; si la vida te llevó para otro lado, contame en qué andabas. Y un día de esa época que te haya quedado.

**Narrador** `[JU2]`: Después de la colimba en el 69 empecé a trabajar como tornero. Entré en un taller acá en Rosario, metalúrgico. Ahí me quedé 40 años, en el mismo lugar. Los primeros tiempos fueron duros, aprendía todavía, ganaba poco. Pero uno va creciendo, ganando experiencia. El oficio siempre me gustó, la precisión, el trabajo bien hecho.

**Biógrafo** `[M3.5 + JU4]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿Cómo aprendiste a hacer eso que es tuyo, lo que más te ocupa o más te gusta, sea tu trabajo o algo que hacés por gusto? Contame cómo fue arrancar: un día de cuando recién empezabas.

**Narrador** `[JU4]`: En la escuela técnica nos enseñaban lo básico, pero la verdadera escuela fue el taller. Había un maestro viejo ahí, Don Carlos, que sabía mucho. Me enseñó todo lo fino del oficio, la precisión, cómo leer los planos, cómo hacer un trabajo limpio. Pasé años aprendiendo, mirando, cometiendo errores. Un día me di cuenta que sabía, que el oficio estaba adentro. Fue lindo aprender así.

**Biógrafo** `[M3.6 + JU5]`:
> Lo tengo. Vamos con otra.
>
> ¿Tuviste alguna experiencia con lo militar: la colimba, la mili, un colegio militar? ¿O alguna época de disciplina dura, en tu casa, en un colegio, en un trabajo? Contame cómo era y alguna vez que todavía te acordás.

**Narrador** `[JU5]`: Sí, hice la colimba en el 69, en Paraná. Fue duro los primeros meses, la disciplina, madrugar, las órdenes. Pero después uno se acostumbra. Me acuerdo de los ejercicios, las marchas, la instrucción. Conocí gente de todos lados. No fue lo peor, la verdad, servir a la patria como decían. Algunos compañeros no aguantaban, se querían ir. A mí no me fue mal.

**Biógrafo** `[M3.7 + JU8 + M1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Si te pasó, contame cómo lo decidiste: qué te empujó y a quién se lo dijiste primero.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[JU8]`: No, nunca. Siempre estuve acá, en Arroyito. Mi hermana se fue a Santa Fe cuando se casó, pero yo me quedé. Esto es mío, qué sé yo, nunca me tentó irme. La vida acá en el barrio me alcanzaba.

**Biógrafo** `[M3.8 + JU12]`:
> Escuchado. Vamos por la siguiente.
>
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue?

**Narrador** `[JU12]`: No, la verdad que no. Siempre fue la misma casa de mis viejos. Después ellos se fueron muriendo, y la casa siguió siendo la mía. No necesitaba irme, tenía todo acá, mis cosas, mis recuerdos. Eso fue lo mío de siempre. La misma casa, el mismo barrio.

**Biógrafo** `[M3.1 + JU15]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Y los amigos de esos años, de cuando empezabas a hacer tu vida? Cómo eran, dónde se juntaban, qué hacían. Contame una vez con ellos que te quedó. Y si se te vienen más, contalas también.

**Narrador** `[JU15]`: Tenía amigos del trabajo, del club. Nos juntábamos a jugar al fútbol, al truco, a tomar birra los viernes. El club fue el lugar donde pasábamos el fin de semana. Me acuerdo que una vez fuimos a pescar a la laguna con unos compañeros del taller, nos mojamos todos, pero la pasamos bien. Éramos jóvenes, qué sé yo, disfrutábamos la vida.

**Biógrafo** `[M3.2 + JU17]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.

**Narrador** `[JU17]`: Sí, una novia que tuve cuando tenía veinticinco años, Norma. Estuvimos juntos casi dos años, yo creía que sería para más, que se casaba. Pero no se dio, qué sé yo, las cosas no salieron, uno no entiende bien por qué. Fue duro cuando terminamos, la verdad. Después uno sigue, pero eso duele siempre un poco.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[CI5]`:
> Y así llegamos al final de tu juventud, los años en que empezaste a hacer tu vida. Antes de seguir, ¿te quedó algo de esa época sin contar? Un lugar, una persona, una tarde que se te aparece de vez en cuando. Contámelo ahora, con calma.

**Narrador** `[CI5]`: No, creo que está. Paso.

## Bloque 6 · Amor y pareja

**Biógrafo** `[M25.2 + AM0 + M1]`:
> Bien, seguimos.
>
> Ahora vamos al amor. Haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después vamos de a una, empezando por la primera que fue en serio. Si no hubo, decímelo nomás, que también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM0]`: Una sola de verdad, Norma. Cuando tenía veinticinco años, duramos casi dos años. Pero no se dio, como te dije. Después nada más serio. Salí con algunas chicas acá y allá, pero nada que durara. La vida siguió de otra forma, qué sé yo.

**Biógrafo** `[M3.3 + AM1]`:
> Anotado. Sigo con otra.
>
> Contame el día que se conocieron. ¿Dónde fue, quién los presentó o cómo se cruzaron? ¿Y qué fue lo primero que te llamó la atención de esa persona?

**Narrador** `[AM1]`: Nos conocimos en una fiesta en el club, en el 74 más o menos. Una amiga me la presentó, era prima de ella. Norma estaba linda, tenía un carácter alegre, sin vueltas. Me gustó lo franca que era, decía lo que pensaba. Nos pusimos a hablar esa noche y de ahí empezamos a vernos los sábados.

**Biógrafo** `[M3.4 + AM3]`:
> Gracias por contármelo. Seguimos.
>
> Y después, ¿cómo decidieron armar la vida juntos: casarse, irse a vivir, lo que haya sido? ¿Quién lo dijo primero, o se fue dando solo? Contame ese momento: dónde estaban, qué se dijeron.

**Narrador** `[AM3]`: No, la verdad que no llegamos a eso. Estábamos bien al principio, nos llevábamos bien, pero después de un tiempo vimos que no era lo mismo, qué sé yo. Había cosas que no cerraban, diferencias. Un día hablamos y decidimos que era mejor dejarlo. No fue fácil, pero fue lo que pasó.

**Biógrafo** `[M3.5 + AM4]`:
> Guardado, Aníbal. Te mando la próxima.
>
> Hay días que quedan grabados para siempre. ¿Hubo uno en que se casaron, o en que empezaron a vivir juntos? Si lo hubo, contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó.

**Narrador** `[AM4]`: No, eso nunca pasó. Como te dije, no llegamos a eso con Norma. Las cosas se cortaron antes. Nunca me casé ni conviví con nadie. La vida fue de otra forma, qué sé yo.

**Biógrafo** `[M3.6 + AM8]`:
> Lo tengo. Vamos con otra.
>
> Imaginate que podés guardar un solo momento con esa persona, ¿cuál sería? Contámelo entero: el lugar, el día, qué hacían. Si se te vienen otros, contalos también.

**Narrador** `[AM8]`: Un domingo que fuimos a pasear al parque, sin pensar en nada. Caminamos, nos sentamos a la orilla del Paraná, vimos el río. Hablamos de cosas simples, del barrio, de nuestras vidas. Ella me apoyó la cabeza en el hombro. Fue un momento simple, pero lindo, tranquilo. Eso me gustaría guardar para siempre.

**Biógrafo** `[M3.7 + AM9 + M1]`:
> Listo, quedó guardado. Sigo.
>
> Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[AM9]`: Fue una tarde, le dije que no funcionaba, que era mejor dejarlo. Ella lloraba, yo también sentía algo, pero uno sabe cuando algo no va. Nos despedimos en la casa, sin decir mucho más. Nunca más la volví a ver. Pasó lo que pasó, qué sé yo, la vida.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[AM19]`:
> Y después de esa historia, ¿hubo un tiempo en que seguiste por tu cuenta? Contame cómo era un día tuyo entonces: qué hacías, quién andaba cerca. Si no hubo un tiempo así, decime no nomás.

**Narrador** `[AM19]`: Sí, después fue la vida de siempre, qué sé yo. Trabajo, casa, club, eso era mi día a día. Me levantaba a las 6 y media, iba al taller a las 7, trabajaba hasta las 5 de la tarde. Volvía a casa, comía, descansaba un poco. Los sábados iba al club, jugaba al truco con los amigos, tomaba una birra. Eso era mi rutina, pero era mi vida. Así pasaron los años.

**Biógrafo** `[M3.8 + AM16]`:
> Escuchado. Vamos por la siguiente.
>
> Si después de esa historia hubo otro amor, contame del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado. Si no lo hubo, decime no nomás.

**Narrador** `[AM16]`: No, no. Después de Norma no hubo nada serio. Salí con algunas chicas acá y allá, pero nada que durara. La verdad que no se me dio, qué sé yo. Uno sigue viviendo igual.

**Biógrafo** `[M3.1 + AM13]`:
> Gracias, Aníbal. Ya lo guardé.
>
> Contame una pelea que tuvieron, de esas que después dan risa. Por qué fue, quién aflojó primero y cómo hicieron las paces.

**Narrador** `[AM13]`: Una vez nos peleamos porque ella quería que vaya a ver a su familia más seguido, y yo decía que tenía que trabajar, que estaba cansado. Nos gritamos un poco, ella se fue a la pieza enojada, yo me quedé en la sala. Después ella vino con una sonrisa, me pidió perdón, y bueno, nos reímos. Esas cosas de parejas, qué sé yo, ahora me dan risa acordarme.

**Biógrafo** `[M3.2 + AM14]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Tuviste algún amor que te marcó y no fue el de toda la vida? Uno que dejó huella, aunque haya durado poco. Si te pasó, contame cómo se cruzaron y el momento que más te acordás de esa persona.

**Narrador** `[AM14]`: No, Norma fue la que más me marcó. Marina de chico fue la primera, pero Norma fue distinto, de verdad. Las otras después no dejaron huella. Norma fue lo mío de verdad en la vida, qué sé yo.

**Biógrafo** `[M26 + CI6]`:
> Gracias, Aníbal.
>
> Con esto cerramos el amor. ¿Quedó alguien o algo de este tema que no tuvo su pregunta? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI6]`: No, está todo. Paso.

## Bloque 7 · Trabajo y oficio

**Biógrafo** `[M25.3 + EN7]`:
> Bien, entonces.
>
> Ahora vamos al trabajo y a tu oficio, Aníbal: lo que hiciste con tus días.

**Biógrafo** `[TR1]`:
> ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? Contame ese primer día, y en qué se fue esa primera plata, si la hubo.

**Narrador** `[TR1]`: De chico hacía mandados para los vecinos, ganaba poco, monedas. La primera plata de verdad fue cuando entré en el taller como aprendiz, a los 16 años, en la escuela técnica. Los primeros meses casi no ganaba nada, solo comida en el taller. Pero después me daban para el cine, para una birra con los amigos. Era poco, pero era mío y me sentía grande.

**Biógrafo** `[M3.4 + TR6]`:
> Gracias por contármelo. Seguimos.
>
> Hagamos el repaso de a qué le diste tus años, en orden y más o menos en qué años. Cuál de todo eso te quedó más grabado, y si fue una sola cosa toda la vida, cómo fue quedarte ahí.

**Narrador** `[TR6]`: Los 40 años en el taller como tornero, eso fue lo mío. Desde después de la colimba, en 1969, hasta que me jubilé. Fue una sola cosa toda la vida, qué sé yo, el mismo trabajo, el mismo lugar. Después le dediqué mucho tiempo al club también, fui tesorero 20 años. El trabajo y el club fueron mi vida, la verdad. Me quedé toda la vida haciendo lo mismo, pero fue mi vida.

**Biógrafo** `[M3.5 + TR2]`:
> Guardado, Aníbal. Te mando la próxima.
>
> Pensá en eso a lo que le diste más años. ¿Cómo era un día común? Desde que arrancabas hasta que terminaba, qué hacías, con quién. Y contame uno de esos días que todavía tengas fresco.

**Narrador** `[TR2]`: Me levantaba a las 6 y media, desayunaba rápido con mi mamá, mate y pan. Salía a las 6 y 45 hacia el taller. Llegaba a las 7, checkaba mi máquina, preparaba las herramientas. Trabajaba de a ratos, a veces una pieza simple, a veces algo más complejo. A las 12 parábamos para comer algo rápido, una milanesa. A las 5 terminaba, me sacaba la ropa de trabajo, me iba a casa. Los 40 años igual, esa era la rutina, todos los días. A veces me dolía el cuerpo, pero ibas igual.

**Biógrafo** `[M3.6 + TR3]`:
> Lo tengo. Vamos con otra.
>
> ¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame cómo era esa persona, y una vez con ella que tengas bien clara.

**Narrador** `[TR3]`: Sí, Don Carlos, el maestro del taller. Ese viejo me enseñó todo lo que sé del oficio. Me enseñó paciencia, precisión, respeto por el trabajo. Una vez le arruiné una pieza cara, pensé que me iba a matar de la bronca, pero no, se sentó conmigo y me explicó qué había hecho mal, tranquilo, sin humillar. Eso quedó en mí, la forma que tenía de enseñar. Lo respetaba mucho.

**Biógrafo** `[M3.7 + TR5]`:
> Listo, quedó guardado. Sigo.
>
> ¿Cuál fue el día de trabajo del que estás más orgulloso? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo.

**Narrador** `[TR5]`: Había una máquina que no funcionaba bien, la traían de otros talleres y nadie podía arreglarla. Me pidieron que la vea. Pasé días analizándola, entendiendo qué estaba mal. Al final la arreglé, quedó funcionando perfectamente. El dueño vino, me felicitó, me pagó bien. Eso fue lindo, saber que con tu trabajo solucionaste algo que otros no podían. Ese día estuve orgulloso de verdad.

**Biógrafo** `[M3.8 + TR11]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Te quedaste alguna vez sin trabajo sin haberlo elegido, o te tocó una época de plata muy ajustada? Si te pasó, contame un día de ese tiempo que tengas bien presente, y cómo lo fuiste llevando.

**Narrador** `[TR11]`: No, el trabajo se mantuvo. Pero hubo épocas ajustadas, la crisis del 89, del 2001. En el 2001 me acuerdo que ganaba poco, las cosas costaban un ojo de la cara, había que ahorrar en todo. Comía menos en el almuerzo para ahorrar, tomaba mate todos los días sin nada. Pero uno seguía, qué sé yo, había que vivir.

**Biógrafo** `[M4.1]`:
> Gracias por contarme esto, Aníbal. Queda guardado con cuidado.

**Biógrafo** `[TR8]`:
> Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. Si ya me lo contaste, con decírmelo alcanza. Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.

**Narrador** `[TR8]`: No, nunca tuve nada propio. Siempre trabajé para otros, en el taller. No me tentó hacer un negocio propio, qué sé yo. El taller me daba lo que necesitaba, tranquilo.

**Biógrafo** `[M3.1 + CS1]`:
> Gracias, Aníbal. Ya lo guardé.
>
> Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te lució, que la gente lo notó.

**Narrador** `[CS1]`: El club, eso fue lo mío sin cobrar nada. Fui tesorero 20 años, llevaba las cuentas, organizaba las cosas, hacía que todo anduviera bien. La gente lo notaba, me decían que les parecía bien cómo lo hacía. Me sentía útil en el club, era como mi segunda casa. Eso fue importante para mí, la verdad.

**Biógrafo** `[M3.2 + CP1]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Viviste o trabajaste en el campo alguna vez, aunque fuera de chico o por una temporada? Si fue así, contame un día entero ahí, y una vez que el clima mandó: una seca, una helada, una tormenta.

**Narrador** `[CP1]`: No, nunca. Siempre fui de ciudad, de barrio, Arroyito. El campo no era para mí, qué sé yo. La ciudad era lo mío.

**Biógrafo** `[M3.3 + TR9]`:
> Anotado. Sigo con otra.
>
> ¿Ya dejaste eso a lo que te dedicaste? Si seguís, con decírmelo alcanza. Si ya lo dejaste, contame el último día: cómo fue, si lo sabías de antes, qué hiciste al salir. Y el día siguiente, el primero sin ir.

**Narrador** `[TR9]`: Sí, me jubilé. El último día fue raro, qué sé yo, 40 años en el mismo lugar, en las mismas máquinas. Los compañeros me hicieron una pequeña fiesta, un pastel de chocolate. Salí por la puerta y no sabía bien qué hacer. Al día siguiente me desperté sin saber a dónde ir, sin la rutina. Fue extraño los primeros meses, pero después descubrí que tenía más tiempo para el club, para descansar.

**Biógrafo** `[M26 + CI7]`:
> Gracias, Aníbal.
>
> Con esto cerramos el trabajo. ¿Quedó algo que no tuvo su pregunta? Un lugar, una herramienta, un olor, una persona, una changa de la que nadie sabe. Es el momento de contarlo, sin apuro.

**Narrador** `[CI7]`: No, está todo. Paso.

## Bloque 8 · Hijos y nietos

**Biógrafo** `[M25.1 + EN8]`:
> Bien, seguimos.
>
> Volvemos a la familia, Aníbal, pero en tu vida adulta.

**Biógrafo** `[PG1]`:
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Si no los tuviste cerca, contame cómo fue eso.

**Narrador** `[PG1]`: Mi papá murió en 1980 de un infarto. Lo notaba que cada vez trabajaba menos, que lo veía cansado en la casa. Una tarde llegué y mi mamá me dijo que había tenido el pecho apretado. Se murió al mes. Con mi mamá fue distinto, viví con ella hasta el final. De a poco la iba notando más frágil, le costaba levantarse, caminar. Un día no pudo levantarse de la cama, ese fue el inicio del final. Murió en 1998. Yo tenía 49 años. Ella fue lo más importante en mi vida.

**Biógrafo** `[M3.5 + HI0 + M1]`:
> Guardado, Aníbal. Te mando la próxima.
>
> Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Si sí, contame quiénes son, así los voy conociendo. Y si no, decímelo nomás y seguimos por otro lado.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI0]`: No, nunca tuve hijos. No se me dio, qué sé yo. Tengo sobrinos de mi hermana Olga, dos muchachos, Martín y otro. Los veo de vez en cuando, me llaman. Pero no son lo mío como sería un hijo propio. La vida fue así.

**Biógrafo** `[M3.6 + HI2]`:
> Lo tengo. Vamos con otra.
>
> ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez.

**Narrador** `[HI2]`: No, no hay ese día. Como te dije, nunca tuve hijos. No pasó en mi vida.

**Biógrafo** `[M3.7 + HI2b]`:
> Listo, quedó guardado. Sigo.
>
> ¿Tuviste más hijos, o hay alguien más que sentís que criaste o cuidaste como propio? Si fue así, contame cómo fue la llegada de cada uno, con el tiempo que necesites. Cada llegada tiene su historia.

**Narrador** `[HI2b]`: No, no hay historias de esas en mi vida.

**Biógrafo** `[M3.8 + HI3]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Cómo era cada uno de chico? El carácter, las mañas, lo que lo hacía distinto de los demás. Y contame una escena de esa época que todavía te haga sonreír.

**Narrador** `[HI3]`: No tengo hijos. Paso.

**Biógrafo** `[M3.1 + HS1]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Cómo viviste la crianza de tus hijos? ¿La llevaste solo, o tuviste alguna ayuda cerca? Contame un día de esa época que te acuerdes bien.

**Narrador** `[HS1]`: No tengo hijos. Paso.

**Biógrafo** `[M3.2 + HI6]`:
> Te escuché. Vamos con la que sigue.
>
> Contame una vez que se te hinchó el pecho por uno de tus hijos. No hace falta que sea algo que salió en el diario: qué hizo, dónde estabas, qué le dijiste. Y si se te vienen de varios, contalas todas, que hay lugar para cada uno.

**Narrador** `[HI6]`: No tengo hijos. Paso.

**Biógrafo** `[M3.3 + HI8 + M1]`:
> Anotado. Sigo con otra.
>
> Ahora, los nietos. ¿Llegaron nietos a tu vida? Contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, me lo decís y pasamos a otra cosa.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[HI8]`: No, no tengo nietos. No tengo hijos, así que no hay nietos tampoco.

**Biógrafo** `[M26 + CI8]`:
> Gracias, Aníbal.
>
> Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.

**Narrador** `[CI8]`: No, está todo. Paso.

## Bloque 9 · Lugares y pasiones

**Biógrafo** `[M25.2 + EN9]`:
> Bien, seguimos.
>
> Te llevo a los lugares que fueron tuyos y a las cosas que te apasionaron.

**Biógrafo** `[LU4]`:
> Ya de grande, ¿cuál fue el viaje más importante de tu vida, o uno que recuerdes con mucha fuerza? Contame si fuiste con alguien, y un día de ese viaje que te haya quedado como una foto.

**Narrador** `[LU4]`: No, la verdad que no viajé mucho. Una vez fui a Córdoba con unos amigos del club, una semana. Vimos la Catedral, paseamos por la ciudad. Fue lindo, pero siempre me extrañaba volver a Arroyito. Los viajes grandes no eran para mí, qué sé yo. Siempre estuve acá.

**Biógrafo** `[M3.5 + PA1]`:
> Guardado, Aníbal. Te mando la próxima.
>
> Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. Si sentís que ya me lo contaste, decímelo.

**Narrador** `[PA1]`: El club, sin duda. Desde chico fue el lugar que amé, y de grande más. Jugué al básquet cuando era joven, después al truco de adulto. Fui tesorero 20 años. Un día entero ahí: llegaba a la mañana, me tomaba un café con los amigos, jugábamos al truco toda la tarde, por la noche iba a casa. El club fue mi vida, qué sé yo, mi pasión.

**Biógrafo** `[M26 + CI9]`:
> Gracias, Aníbal.
>
> Con esto cerramos lugares y pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquilo.

**Narrador** `[CI9]`: No, está. Paso.

## Bloque 10 · Amistades y ayudas

**Biógrafo** `[M25.3 + EN10]`:
> Bien, entonces.
>
> Hablemos de los amigos, Aníbal, y de la gente que te dio una mano en la vida.

**Biógrafo** `[AS1]`:
> Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame cómo se conocieron, y una vez que muestre bien cómo es esa amistad.

**Narrador** `[AS1]`: Sí, tenía amigos del club de los que pasaba los días con ellos. Uno especial fue Roberto, que también jugaba al truco. Lo conocí a través del club hace muchos años. Nos reíamos, nos ayudábamos con lo que podíamos. Una vez él pasaba por una época difícil, económicamente, y yo lo ayudé como pude. Eso es lo que es ser amigo, qué sé yo.

**Biógrafo** `[M3.7 + AY1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Alguna vez necesitaste ayuda de verdad y alguien te la dio, sea quien sea? Contame qué hizo esa persona ese día, y si después se lo pudiste devolver.

**Narrador** `[AY1]`: Sí, tuve un infarto en 2015, un susto grande. Me internaron de urgencia. Los amigos del club vinieron a verme al hospital, me llevaban comida, alguien me ayudó con los gastos que no alcanzaba. Me acuerdo de Roberto especialmente, estaba ahí todos los días. Después, cuando él pasó algo, yo le devolvía lo que podía. Eso es la vida, qué sé yo, la amistad es eso.

**Biógrafo** `[M3.8 + AS9]`:
> Escuchado. Vamos por la siguiente.
>
> Imaginate que armás una cena y podés invitar a tu gente más cercana. ¿Quiénes se sientan en esa mesa? Contame quién va, y por qué cada uno se ganó su lugar.

**Narrador** `[AS9]`: Mis amigos del club, Roberto y algunos otros de confianza. Mi hermana Olga, con su familia, aunque no nos vemos tan seguido. Sería acá en la casa, una comida simple, nada complicado. Les haría un asado, qué sé yo. Esos son los míos, la gente que me importa.

**Biógrafo** `[M26 + CI10]`:
> Gracias, Aníbal.
>
> Con esto cerramos amistades y ayudas. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquilo.

**Narrador** `[CI10]`: No, está. Paso.

## Bloque 11 · Pérdidas y momentos difíciles

**Biógrafo** `[M25.1 + AV11]`:
> Bien, seguimos.
>
> Ahora vienen unas preguntas sobre momentos difíciles. Si alguna no tiene que ver con tu vida o no querés entrar, con un *paso* alcanza y seguimos. Vos manejás.

**Biógrafo** `[PE1 + M1]`:
> ¿Perdiste a alguien importante en tu vida? Si querés, contame quiénes fueron, qué eran para vos y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE1]`: Sí, perdí a mi papá en 1980, de un infarto. Fue duro, pero después a mi mamá en 1998 fue lo más duro que pasé, qué sé yo. Vivimos juntos toda la vida, ella fue lo más importante. Su muerte me dejó solo. Un momento lindo con ella fue un domingo, estábamos viendo televisión, ella dormida en mi hombro. Eso me gustaría recordar siempre, esa paz que había.

**Biógrafo** `[M4.2]`:
> Te escuché. Gracias por confiármelo.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vez tu salud te frenó en serio, ¿querés contármelo? Cómo fueron esos días, quién estuvo cerca, y cómo lo fuiste llevando. Y si es algo que todavía llevás, también vale.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE5]`: Sí, el infarto en 2015. Un día estaba trabajando, sentí un dolor en el pecho fuerte, me asusté. Me llevaron al hospital de urgencia. Fueron días difíciles, la verdad, pensé que se acababa. Los amigos estaban ahí conmigo. Después de eso quedé con cuidados, medicinas todos los días, no pude volver al trabajo como antes. Ahora tengo que cuidarme, pero sigo viviendo, qué sé yo. Eso me cambió.

**Biógrafo** `[M4.3]`:
> Lo guardo tal como lo contaste. Gracias.

**Biógrafo** `[PE4 + M1]`:
> ¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste.
>
> _Si no va con vos, decí paso y vamos a otra._

**Narrador** `[PE4]`: No, las más duras fueron esas dos, la muerte de mi mamá y el infarto. Todo lo demás fue llevable, qué sé yo. Las crisis económicas pasaban, pero salíamos. Eso fue lo más difícil que pasé.

**Biógrafo** `[M4.4]`:
> Gracias por animarte a contarlo. Cuando quieras, seguimos.

**Biógrafo** `[CI11]`:
> Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.

**Narrador** `[CI11]`: No, está. Paso.

## Bloque 12 · La historia grande

**Biógrafo** `[M25.2 + EN12]`:
> Bien, seguimos.
>
> Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.

**Biógrafo** `[HG1]`:
> Cuando pasó algo grande, en el país o en el mundo, un Mundial, una guerra, ¿cómo lo pasaste vos? Contame lo que recuerdes: dónde estabas, si lo viviste de cerca o te lo contaron, y qué pasó ese día.

**Narrador** `[HG1]`: El Mundial 78 me acuerdo que estaba en el taller, todos escuchábamos la radio, Argentina campeón, fue lindo eso. Después la guerra de Malvinas en el 82, eso fue malo, murieron muchachos jóvenes. Veíamos volver heridos. La crisis del 2001 fue dura, ganábamos poco, era oscuro. Cada cosa te marca de otra forma, qué sé yo.

**Biógrafo** `[M3.2 + HG4]`:
> Te escuché. Vamos con la que sigue.
>
> Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado.

**Narrador** `[HG4]`: Un día me acuerdo, era cuarentena, estaba en casa solo. No podía ir al club, eso fue lo peor para mí. Me levantaba, tomaba mate, miraba por la ventana a los pocos que pasaban. Tenía miedo de contagiarme, a mi edad. Los amigos del club me llamaban por teléfono. Fue un día gris, oscuro, depresivo. Extrañaba el club, la vida normal, los amigos.

**Biógrafo** `[M3.3 + DE1]`:
> Anotado. Sigo con otra.
>
> Cuando eras joven había cosas que no se podían hacer, o estaban mal vistas, y hoy nadie se sorprende. ¿Te pasó con alguna? Contame ese día: qué querías hacer y qué te dijeron.

**Narrador** `[DE1]`: Con Norma, mis papás no querían que durmiéramos juntos antes de casarnos. Eso era pecado, qué sé yo, la religión era dura en esos tiempos. Hoy los chicos duermen con sus novias sin problema. En esos tiempos era escándalo. Ahora la vida es distinta, la gente es más libre. Uno ve que no pasa nada.

**Biógrafo** `[M3.4 + FI7]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué es la política para vos? ¿Hubo algún momento de tu vida en que te tocó de cerca? Contame cuál fue y qué pensás hoy.

**Narrador** `[FI7]`: La política me pasó de largo, qué sé yo. Trabajé durante la dictadura, durante la democracia, durante las crisis. Todo eso cambiaba las cosas en el taller, los sueldos bajaban, había inseguridad. Nunca me metí en eso, no era para mí. Votaba, pero la política me parecía complicada. Lo que me importaba era trabajar, el club, estar bien con los amigos.

**Biógrafo** `[M26 + CI12]`:
> Gracias, Aníbal.
>
> Hasta acá lo del país y el mundo. Si hay algo que te marcó y no salió, mandámelo ahora, aunque sea corto, con dónde estabas cuando pasó.

**Narrador** `[CI12]`: No, está. Paso.

## Bloque 13 · Puntos altos, bajos y giros

**Biógrafo** `[M25.3 + EN13]`:
> Bien, entonces.
>
> Llegamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y algunas preguntas para pensar un rato.

**Biógrafo** `[GI1]`:
> ¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó.

**Narrador** `[GI1]`: Un domingo con mi mamá, estábamos en la cocina preparando la comida. Ella reía con algo que yo había dicho, y de repente sentí que eso era la vida, eso era lo importante. Un momento simple, pero fue claro. Si pudiera volver a eso, lo haría. Ahora que ella no está, me doy cuenta que eso era todo lo que importaba.

**Biógrafo** `[M3.6 + GI2]`:
> Lo tengo. Vamos con otra.
>
> Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó.

**Narrador** `[GI2]`: El día del infarto. Me levantaba normal, desayuné mate y pan con mi mamá, salí para el trabajo como todos los días. Llegué al taller, me puse a trabajar. A eso de las 10 de la mañana sentí un dolor en el pecho, creí que era cansancio. Pero el dolor no paraba, cada vez peor. Ahí sentí que algo no estaba bien, que la vida no era más la misma. Me llevaron al hospital, y desde ese día cambió todo, los cuidados, las medicinas, la vida.

**Biógrafo** `[M3.7 + HJ1]`:
> Listo, quedó guardado. Sigo.
>
> ¿Te quedó algo que querías hacer con tu vida y al final no se dio? Contame el momento en que te diste cuenta de que ya no iba a pasar: dónde estabas y qué pasó ese día.

**Narrador** `[HJ1]`: Casarme, tener una familia. Con Norma creí que era eso, pero no se dio. Después de ella pasaron los años y uno se da cuenta que ya no va a pasar. Un día me desperté, tenía cuarenta y tantos, solo en la casa con mi mamá, sin hijos, sin esposa. Ese día sentí que ya no iba a pasar, que la vida tuvo otro plan para mí. Así fue.

**Biógrafo** `[M3.8 + GI9]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Hubo algún momento en tu vida en que te sentiste chiquito frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor.

**Narrador** `[GI9]`: Cuando murió mi papá. Estaba ahí, muerto, y me sentí muy chiquito, muy solo. La muerte es algo enorme que no se entiende. Uno es nada frente a eso. No sé si es un cielo o qué, pero sentí que era chiquito, que no controlaba nada. Después pasó con mi mamá, igual.

**Biógrafo** `[M3.1 + FI1]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Qué lugar tiene la soledad en tu vida? ¿Te hace bien tener momentos con vos mismo? Contame alguno que te acuerdes: dónde estabas y qué hacías.

**Narrador** `[FI1]`: La soledad es mi compañía de todos estos años, desde que se fue mi mamá. Al principio fue dura, qué sé yo, pero uno se acostumbra. Me paso las mañanas en la casa, desayuno solo, pienso en las cosas. Me gusta ese tiempo de paz. Por la tarde voy al club y me olvido un poco. Pero la soledad es parte de mi vida ahora, aprendí a vivir con eso.

**Biógrafo** `[M3.2 + FI2]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Hubo un momento en que te diste cuenta, de golpe, de que el tiempo había pasado? Algo chiquito, alguien que te trató de usted, por ejemplo. Contame dónde estabas y qué pasó.

**Narrador** `[FI2]`: Una vez mi sobrino Martín vino a visitarme con su hijito chiquito. Me dije "mirá vos, mis sobrinos crecieron, tienen sus propios hijos". Eso te pega, de golpe ves que pasó la vida. O viendo a los amigos del club envejeciendo, algunos ya casi no pueden jugar. Te das cuenta que el tiempo es tramposo, pasa sin que lo veas.

**Biógrafo** `[M3.3 + FI3]`:
> Anotado. Sigo con otra.
>
> ¿Qué cosa sentís que heredaste de tu familia en tu forma de ser? Un carácter, una manera de hacer las cosas. Contame una vez que te diste cuenta de que eso venía de ellos.

**Narrador** `[FI3]`: El trabajo, eso lo heredé de mi papá. La forma de hacer las cosas bien, con precisión, sin prisa. Mi papá era así en el taller, y yo también. De mi mamá heredé la responsabilidad, el cuidado. Ella cuidaba todo, la casa, la familia. Yo soy igual, me importa que las cosas estén bien hechas, que nada se pierda.

**Biógrafo** `[M3.4 + FI4]`:
> Gracias por contármelo. Seguimos.
>
> ¿Te importa lo que los demás piensan de vos? ¿Te importó siempre igual? Contame una vez en que eso se notó.

**Narrador** `[FI4]`: No mucho, la verdad. Yo hago mi vida, trabajo, voy al club. Si alguien piensa algo de mí, es su problema. Lo que sí me importa es ser honesto en lo que hago, no traicionar gente. En el club, cuando era tesorero, algunos decían cosas, pero yo sabía que hacía bien el trabajo. Eso me importaba, ser honesto.

**Biógrafo** `[M3.5 + FI6]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿Cómo te imaginás el mundo dentro de cien años? Contame cómo lo ves, y qué te gustaría que no se pierda.

**Narrador** `[FI6]`: No sé, qué sé yo. Probablemente todo sea diferente, máquinas, tecnología que ahora no existe. Lo que me gustaría que no se pierda es la amistad, el valor de estar con la gente de verdad. Eso es lo que hace importante la vida, no la tecnología. Que la gente se siga juntando como nosotros en el club.

**Biógrafo** `[M26 + CI13]`:
> Gracias, Aníbal.
>
> Con esto cerramos esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquilo.

**Narrador** `[CI13]`: No, creo que está. Paso.

## Bloque 14 · Hoy

**Biógrafo** `[M25.1 + EN14]`:
> Bien, seguimos.
>
> Dejamos el pasado un rato y venimos a hoy, Aníbal: cómo son tus días y qué te gusta ahora.

**Biógrafo** `[HO1]`:
> Contame un día cualquiera de los de ahora, desde que abrís los ojos hasta que apagás la luz. Qué hacés, a qué hora, con quién. Si querés, el de ayer mismo.

**Narrador** `[HO1]`: Me levanto a las 7, desayuno mate con pan. Limpio un poco la casa, esas cosas del día a día. A las 9 salgo para el club, que está cerca. Ahí juego al truco con los amigos, charlamos, reímos. A veces salgo a caminar por el barrio. A las 12 vuelvo a casa, como algo, descanso un poco. Por la tarde a veces voy de vuelta al club. A las 9 de la noche ceno algo simple y a las 10 me acuesto. Eso es todos los días prácticamente.

**Biógrafo** `[M3.7 + HO2]`:
> Listo, quedó guardado. Sigo.
>
> ¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado.

**Narrador** `[HO2]`: En el club, jugando al truco. Una vez Roberto hizo un chiste sobre otro compañero y todos nos reímos como locos. Los chistes de viejos, los malos entendidos cuando alguien se equivoca en el juego. Con los amigos se ríe uno, de pendejadas. Me gusta eso, olvidarme de las cosas y reír nomás.

**Biógrafo** `[M3.8 + HO5]`:
> Escuchado. Vamos por la siguiente.
>
> ¿Qué es lo que más te gusta de la vida que tenés ahora? Puede ser algo enorme o algo chiquito de todos los días. Contame un momento de esta semana en que lo sentiste.

**Narrador** `[HO5]`: El club, sin dudas. Poder estar con los amigos, jugar, reír, olvidar un poco las cosas. Esta semana, un día jugaba al truco con los muchachos, el sol entraba por las ventanas, hacía un día lindo. Estábamos todos ahí, sin preocupaciones, solo el juego y la charla. Eso me gusta, eso es lo que me gusta de la vida que tengo ahora.

**Biógrafo** `[M3.1 + CO1]`:
> Gracias, Aníbal. Ya lo guardé.
>
> ¿Tenés un plato que sea tuyo, el que te piden o el que te sale siempre igual? Contame quién te lo enseñó y una vez que lo cocinaste para alguien.

**Narrador** `[CO1]`: Una buena milanesa, que me enseñó mi mamá. La carne pasada por huevo y pan rallado, bien dorada. Me sale bien. Una vez le hice a unos amigos cuando vinieron a casa, les gustó. Pero honestamente, ahora como simple, arroz, fideos, cosas rápidas. Cocinar es un trabajo cuando vivís solo, qué sé yo.

**Biógrafo** `[M3.2 + HO9]`:
> Te escuché. Vamos con la que sigue.
>
> ¿Cómo es el lugar donde vivís hoy, la casa, el barrio? Contame cómo llegaste ahí y un momento de estos días que lo pinte.

**Narrador** `[HO9]`: Es la casa de mis papás, donde nací. Está vieja, qué sé yo, pero es mía. Las paredes tienen historia, los muebles son viejos. Hay un patio atrás donde de chico jugaba con Olga. El barrio, Arroyito, es mi barrio. Conozco a todos, es tranquilo. Hace poco me senté en el patio a la tarde, viendo cómo el sol bajaba entre los árboles. La vida ahí es así, tranquila.

**Biógrafo** `[M26 + CI14]`:
> Gracias, Aníbal.
>
> Con esto cerramos lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquilo.

**Narrador** `[CI14]`: No, está. Paso.

## Bloque 15 · Legado y cierre

**Biógrafo** `[M25.2 + EN15]`:
> Bien, seguimos.
>
> Ya estamos en la última parte, Aníbal: lo que te dejó todo esto y lo que querés dejarle a tu familia.

**Biógrafo** `[LE1]`:
> Mirando toda tu vida hasta hoy, ¿qué es lo que más orgullo te da? Puede ser algo grande o algo que nadie más notó. Contame qué fue y el momento en que te diste cuenta.

**Narrador** `[LE1]`: Haber trabajado 40 años en el mismo lugar, hacer mi trabajo bien. Eso me da orgullo. También haber sido tesorero del club, llevar las cuentas honestamente, que la gente confiara en mí. Pero lo más importante es haber cuidado a mi mamá hasta el final, estar ahí para ella. Eso me da más orgullo que cualquier otra cosa, la verdad.

**Biógrafo** `[M3.4 + LE2]`:
> Gracias por contármelo. Seguimos.
>
> ¿Qué aprendiste de la vida que te gustaría que tu familia sepa? Decímelo como un consejo, algo que vos mismo descifraste viviendo.

**Narrador** `[LE2]`: Que la vida no es complicada si uno no la complica. Trabaja, sé honesto, cuida a los tuyos. La amistad es lo más importante, qué sé yo, no el dinero. Que disfruten los momentos simples, un café con amigos, una charla, una tarde tranquila. Y que si algo no se da en la vida, hay que aceptarlo y seguir, no lamentarse. Eso aprendí.

**Biógrafo** `[M3.5 + FU1]`:
> Guardado, Aníbal. Te mando la próxima.
>
> ¿Queda algo que todavía querés hacer? Contámelo como si ya estuviera pasando: dónde estás, con quién, qué ves.

**Narrador** `[FU1]`: Nada de cosas grandes, qué sé yo. Me gustaría pasar más tiempo con los amigos del club, jugar al truco, reír, pasar tardes tranquilas. Tal vez algún viaje corto a Buenos Aires con algunos muchachos. Pero la verdad, a esta edad, con lo que me pasó, la vida es estar tranquilo, con los amigos. Eso es lo que me queda por disfrutar.

**Biógrafo** `[M3.6 + LE7]`:
> Lo tengo. Vamos con otra.
>
> Si tu vida fuera un libro, ¿qué título le pondrías? Decímelo y contame por qué ese.

**Narrador** `[LE7]`: "El tornero de Arroyito", qué sé yo. Porque eso fui, un tornero que trabajó 40 años en el taller, que vivió toda la vida en el mismo barrio. Arroyito fue mi mundo, el club fue mi vida. Simple, como soy yo.

**Biógrafo** `[M3.7 + M15]`:
> Listo, quedó guardado. Sigo.
>
> Esta pregunta te la hace tu familia.

**Biógrafo** `[FAM1]`:
> Tío, ¿es verdad que una vez salvaste al club de la quiebra con una rifa? Martín

**Narrador** `[FAM1]`: Sí, boludo, eso es verdad. Fue hace unos años, el club estaba al borde de cerrar. Las deudas eran muchas, no teníamos plata. Yo y otros muchachos organizamos una rifa, vendimos muchísimos números. Con eso salimos de la crisis. Fue trabajo, pero el club era lo mío, qué sé yo. Me alegra que te acuerdes de eso, Martín.

**Biógrafo** `[M3.8 + FO1]`:
> Escuchado. Vamos por la siguiente.
>
> Otra cosa, Aníbal. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés a mano, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Y si no encontrás ninguna, no pasa nada: el libro va igual.

**Narrador** `[FO1]`: Tengo una foto vieja de la época cuando estaba con Norma. Es del club, en un asado. Estamos los dos, ella sonriendo, yo al lado. La tengo guardada en un sobre acá en la casa. Voy a buscarla, la saco una foto con el celular y te la mando. Eso me gustaría que quedara, ese recuerdo de cuando éramos felices.

**Biógrafo** `[M26 + LE9]`:
> Gracias, Aníbal.
>
> Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté y querés que esté en el libro? Una persona, un lugar, una historia que te quedó dando vueltas.

**Narrador** `[LE9]`: No, creo que está todo. La vida fue así, simple, qué sé yo. Arroyito, el trabajo, el club, los amigos. Eso fue lo mío.

**Biógrafo** `[LE8]`:
> Ahora sí, hablale a tu familia, a los que van a leer este libro. Lo que les dirías y lo que les deseás si los tuvieras sentados enfrente, sin apuro, de a uno. Nadie te corre.

**Narrador** `[LE8]`: A mi hermana Olga, que siempre estuvo lejos en Santa Fe, te quiero mucho aunque nos veamos poco. A mis sobrinos Martín y sus hermanos, vivan bien, disfruten la vida, no compliquen todo como hacemos los viejos. Trabajen, sean honesto, cuiden a sus amigos. La vida es eso, qué sé yo, los amigos, la familia, el trabajo hecho con cuidado. Espero que este libro sea para que se acuerden de este tío tornero que vivió en Arroyito toda la vida, en el barrio, en el club. Espero que se acuerden cuando ya no esté.

**Biógrafo** `[FIN]`:
> Hasta acá llegamos, Aníbal. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre, y es bien tuyo. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Fue un gusto enorme escucharte.
