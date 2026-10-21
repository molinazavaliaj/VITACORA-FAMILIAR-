# Kids · «Mi Primer Capítulo» · textos en castellano de España (de tú)

**Qué es:** todos los textos de Kids que tienen ID en [`banco.md`](../banco.md) y [`mensajes.md`](../mensajes.md), en castellano de España tratando de tú, para chicos y chicas de 11 años de España y sus padres (al padre también de tú; a varios, vosotros). **Solo textos por ID**: el orden, las ramas, qué vale cada botón, qué foto va pegada a qué pregunta, qué es sensible o sacable y todas las reglas del flujo salen siempre de `banco.md` y `mensajes.md`, que no se tocan. El rioplatense **no cambió**: si algo no sonaba en España, se adaptó solo acá.

**Cómo se hizo:** adaptó Fable el 16/10/2026 siguiendo el método de la entrevista Familiar ([`docs/v3/entrevista/banco-es-ES.md`](../../../v3/entrevista/banco-es-ES.md)): adaptación, no reescritura. Mismo contenido, misma intención, mismo largo, una cosa por mensaje, frases cortas, sin dos puntos, sin «usted». El bot sigue sin decir que le gusta ni que le alegra nada ni guarda nada «con cariño» (el «con mucho cariño» de la bienvenida es del que regala, como en el original). Todo lo que cambia una referencia, una costumbre o el sentido está en la tabla de abajo; lo que no está ahí se adaptó palabra por palabra. La leyó a ciegas una madre de Zaragoza ([`lectura-espana-2026-10-16.md`](lectura-espana-2026-10-16.md)) y Naza aprobó los cambios el 16/10 (tanda 8, al final de este archivo).

**Lo que cambia en todo el archivo, sin anotarlo fila por fila:** la conjugación (contame → cuéntame, decime → dime, tenés → tienes, vos → tú, ustedes → vosotros, se juntaron → os juntasteis); el pasado reciente en pretérito perfecto, como se dice en España («te ha hecho un regalo», «han pasado cuatro días», «lo he escuchado», «¿te has perdido alguna vez?»); y el vocabulario obvio: acá → aquí, allá → allí, afuera → fuera, lugar → sitio, chic{{o/a}} (de edad) → pequeñ{{o/a}}, chiquito → pequeño, grande (de edad) → mayor, viejo (de tiempo) → antiguo, lindo → bonito, dale → vale, plata → dinero, celular → móvil, apuro → prisa, sacar una foto → hacer una foto, mostrame → enséñame, mandame → mándame, prendida → encendida, enojado → enfadado, retar → regañar, tocá → toca, listo → hecho / preparado, igual (de todos modos) → de todas formas, común → normal, rato largo → buen rato, se arma el libro → se hace el libro, se vuelve → se convierte en, animarse → atreverse, acordarse de → recordar, sacar (sin pedir) → coger, la salteamos → nos la saltamos, a la mañana → por la mañana.

**Marcas que se mantienen igual:** `{{o/a}}` (chico / chica, el código la llena), `{{1}}`, `{{2}}`, `{{3}}` (variables posicionales de las plantillas y mensajes fijos, con el mismo número y el mismo dato que en `mensajes.md`), `{{nombre}}` en los textos del panel. Las plantillas de Meta se cargan aparte, con el mismo nombre y el sufijo `_es_es` ([`plantillas-meta-kids-es-ES.md`](plantillas-meta-kids-es-ES.md)).

## Notación

Una línea por texto, `ID | texto`, como en Viaje (`docs/viajes-v2/idiomas/banco-es-ES.md`). Lo que está debajo de la línea `---` son notas y no se parsea. Los saltos de párrafo de los mensajes largos van escritos como `\n\n`. Los IDs son los que ya usa el motor (`fabrica/src/kids-v2/motor/mensajes.ts`) más una notación para lo que hoy no tiene ID propio, que propongo así:

| ID | Qué es |
|---|---|
| `K12` | La pregunta principal (texto de `banco.json` → `preguntas[].texto`). |
| `K12-OP` | Su otra puerta (`op.texto`). Es el ID que ya usa el motor. |
| `K10-FOTO` | La foto pegada (`foto.texto`). Es el ID que ya usa el motor. |
| `K29-FOTO-NOTENGO` | La respuesta propia al [No tengo] de esa foto (`foto.noTengo`; solo K29). |
| `K12-R1`, `K12-R2`, `K12-R2-2` | Texto de la rama 1, de la rama 2, y segundo paso de la rama 2 («Y después, siempre»). Son los IDs que ya usa el motor (`idRama`). |
| `K12-B1`, `K12-B2` | Los botones de las ramas, en el orden de `ramas[]`. Entran también los de las ramas que no preguntan (K16-B2, K18-B1, K38-B1, cuya respuesta es B-NO-PASA-NADA). |
| `K10-BPASO` | El botón de pasar cuando no es el genérico [Paso] (K10, K11, K39, K41). |
| `BOTON-PASO` | El botón genérico de pasar que llevan todas las principales, las otras puertas y los extras sin foto. |
| `K1-FOTO-B1`, `K11-FOTO-B2` | Los botones de la foto, en orden. |
| `X1-1` … `X5-3` | Los extras, en el orden de `banco.md` (IDs de `banco.json`). |
| `B-SEGUIR`, `ACUSE-3`, `BIEN-CHICO`… | Los mensajes fijos de `banco.md` y `mensajes.md`, mismo ID. |
| `B-SEGUIR-B1`, `CIERRE-1-B2` | Los botones de un mensaje fijo, en orden. |
| `CAP-1` … `CAP-5` | El título de cada capítulo (`capitulos[].titulo`). |

**Ojo para el código:** el motor hoy compara los botones por su texto literal (`'Dale, otra'`, `'No tengo'`, `'Dale, mandámela'`…, en `motor/botones.ts` y `motor/rafaga.ts`). Con este archivo, varios botones cambian de texto («Vale, otra», «Vale, mándamela», «Lo dejamos aquí», «No me ha pasado», «No veo a ninguno», «No, ya está todo»). Antes de conectar el idioma, el motor tiene que comparar por posición (B1, B2) o por el texto del idioma activo, no por el rioplatense. Lo mismo para `BOTONES_NO_ES_LO_MIO` y para `boton.startsWith('Tengo')` en K12 (ese sigue valiendo).

## Textos

CAP-1 | De pequeño
CAP-2 | Mi gente
CAP-3 | Mi mundo ahora
CAP-4 | Lo que me ha pasado
CAP-5 | Para cuando seas mayor (el sobre cerrado)
BOTON-PASO | Paso
ENTRADA-1 | Empezamos por cuando eras más pequeñ{{o/a}}. Tú cuenta como te salga.
K1 | ¿Cuál es el primer recuerdo de tu vida? Lo más antiguo que tengas, aunque sea borroso.
K1-OP | ¿Y algo que te han contado de cuando eras bebé, aunque tú no te acuerdes?
K1-FOTO | Enséñame tu juguete favorito. Si ya no tienes juguetes, la cosa tuya que más quieres. ¿Por qué esa?
K1-FOTO-B1 | No tengo
K2 | Ahora una trastada. Una que hiciste tú y que todavía te da risa cuando te acuerdas.
K2-OP | ¿Y una trastada que hizo otro y tú la viste? Cuéntame esa.
K2-FOTO | Hazle una foto a lo que hay dentro de tu mochila, tal como está. ¿Qué es lo más raro que hay?
K2-FOTO-B1 | No tengo
K3 | Cuéntame la mejor fiesta que recuerdes de cuando eras más pequeñ{{o/a}}. Un cumpleaños, o la que sea.
K3-OP | ¿Y un día normal que acabó siendo buenísimo sin que nadie lo planeara? Cuéntame ese.
K3-FOTO | Enséñame el regalo más raro que te han hecho. ¿Quién te lo dio?
K3-FOTO-B1 | No tengo
K4 | Piensa en el juego al que jugabas siempre. Cuéntame la última vez que jugaste a eso.
K4-OP | ¿Alguna vez te has aburrido tanto que te has inventado un juego? Cuéntame ese.
K4-FOTO | ¿Tienes algo roto que aun así no tiras? Mándame una foto y cuéntame cómo se rompió.
K4-FOTO-B1 | No tengo
K5 | ¿Cuál fue el peor golpe que te diste de pequeñ{{o/a}}? Cuéntame ese día.
K5-OP | ¿Te ha quedado alguna marca en el cuerpo de algo? Cuéntame de dónde salió.
K6 | ¿Te has perdido alguna vez, aunque sea un ratito? Cuéntame qué pasó.
K6-OP | ¿Y una vez que perdiste algo que querías mucho? Cuéntame.
K7 | ¿Cuál fue la primera cosa que te dejaron hacer sol{{o/a}}, ir a por el pan, por ejemplo? Cuéntame cómo fue.
K7-OP | ¿Y la primera vez que te quedaste sol{{o/a}} en casa, aunque fuera un rato? Cuéntame.
K8 | Piensa en el sitio de tu casa donde más estás. Cuéntame la última vez que te quedaste ahí un buen rato.
K8-OP | ¿Y fuera de tu casa, un sitio al que vas siempre? Cuéntame la última vez que fuiste.
K8-FOTO | Hazle una foto a ese sitio, tal como está ahora, sin recoger.
K8-FOTO-B1 | No tengo
K9 | ¿Qué te daba miedo de pequeñ{{o/a}}? Cuéntame una noche que no podías dormir por eso.
K9-OP | ¿Y una noche que te quedaste con la luz encendida o con alguien al lado para poder dormir? Cuéntame esa.
CIERRE-1 | Eso era lo de pequeñ{{o/a}}. ¿Ha quedado algo de esa época que no te he preguntado y quieres que esté en el libro?
CIERRE-1-B1 | No, ya está todo
CIERRE-1-B2 | Sí, hay algo
ENTRADA-2 | Ahora vamos con la gente de tu vida. Tu familia, tus amigos y los que quieres.
K10 | Tu madre. Cuéntame cómo es, y una vez que te cuidó cuando estabas enferm{{o/a}}.
K10-BPASO | Esta la paso
K10-OP | ¿Y algo que tu madre hace siempre y que nadie hace igual?
K10-FOTO | Si tienes mascota, hazle una foto y mándamela. ¿Cómo llegó a tu casa? Y dime cómo se llama.
K10-FOTO-B1 | No tengo
K11 | Ahora tu padre. Cuéntame cómo es, y la última vez que hicisteis algo los dos solos.
K11-BPASO | Esta la paso
K11-OP | ¿Y algo que tu padre dice siempre y que tú ya sabes de memoria?
K11-FOTO | ¿Haces algún deporte? Hazle una foto a la ropa o a lo que usas para jugar.
K11-FOTO-B1 | No hago ninguno
K11-FOTO-B2 | No tengo
K12 | Vamos con los hermanos.
K12-B1 | Tengo hermanos
K12-R1 | Cuéntame la última vez que te reíste mucho con un hermano o una hermana. Y dime cómo se llaman tus hermanos, aunque sea uno solo.
K12-B2 | No tengo hermanos
K12-R2 | ¿Te habría gustado tener un hermano o una hermana?
K12-R2-2 | ¿Y alguien que sea casi como un hermano o hermana para ti? Cuéntame una vez juntos, y dime cómo se llama.
K12-OP | ¿Y algo tuyo que un hermano o hermana te coge sin pedirlo? Cuéntame la última vez.
K12-FOTO | La ropa o las zapatillas que te pones siempre, las que en tu casa ya quieren tirar. Enséñamelas.
K12-FOTO-B1 | No tengo
K13 | Abuelos. ¿Ves a menudo a alguno?
K13-B1 | Sí
K13-R1 | Cuéntame la última vez que estuviste con alguno de tus abuelos o de tus abuelas, y dime cómo se llaman.
K13-B2 | No mucho
K13-R2 | Cuéntame una vez con alguien mayor que sea como un abuelo o una abuela para ti, y dime cómo se llama.
K13-OP | ¿Y algo que un abuelo o abuela te enseñó a hacer? Cuéntame ese día.
K13-FOTO | Busca la foto o la cosa más antigua que haya en tu casa y hazle una foto. ¿Qué sabes de eso?
K13-FOTO-B1 | No tengo
K14 | ¿Alguna vez te han contado cómo era la vida cuando tus abuelos eran pequeños? Cuéntame la historia que se te quedó.
K14-OP | ¿Y un sitio al que te llevaron y te dijeron "aquí venía yo cuando tenía tu edad"? Cuéntame ese día.
K14-FOTO | ¿Eres de algún equipo? Hazle una foto a algo que tengas de ese equipo y cuéntame cómo te hiciste de ese equipo.
K14-FOTO-B1 | De ninguno
K14-FOTO-B2 | No tengo
K15 | Cuéntame una tarde con un amigo o una amiga en la que no te querías ir a casa, y dime cómo se llama.
K15-OP | ¿Y cómo te hiciste amig{{o/a}} de la persona con la que mejor te llevas? Cuéntame ese día, y dime cómo se llama.
K15-FOTO | ¿Tienes un ídolo, o varios, del deporte o de lo que sea? Mándame una foto y cuéntame qué tienen.
K15-FOTO-B1 | No tengo
K16 | ¿Tienes primos o primas?
K16-B1 | Tengo primos
K16-R1 | Cuéntame la última vez que os juntasteis, y dime cómo se llaman. Si casi no los ves, también vale.
K16-B2 | No tengo
K16-OP | ¿Y qué hacéis cuando os juntáis? Cuéntame la última.
K17 | ¿Hay un tío o una tía con quien te llevas mejor, si es que tienes? Cuéntame algo que hace ese tío o esa tía que nadie más de la familia hace, y dime cómo se llama.
K17-OP | ¿Y qué te dice siempre cuando te ve? Cuéntame la última vez.
K18 | ¿Hay alguien que ahora es de tu familia pero antes no, como la pareja de tu madre o de tu padre, o alguien que ha venido a vivir con vosotros? Cuéntame el día que os conocisteis.
K18-B1 | No hay nadie así
K18-OP | ¿Y la primera comida con alguien que ahora vive contigo y antes no?
K19 | Piensa en un adulto que no es de tu familia ni del cole pero es importante para ti. Cuéntame una vez juntos, y dime cómo se llama.
K19-OP | ¿Y alguien que te cae bien y en tu casa casi no lo conocen? Háblame de esa persona.
K20 | ¿Alguna vez has necesitado algo y te lo ha dado alguien del barrio o algún vecino?
K20-B1 | Sí, una vez
K20-R1 | Cuéntame esa vez. Y si sabes cómo se llama esa persona, dímelo.
K20-B2 | No me ha pasado
K20-OP | ¿Y alguien del barrio que te saluda siempre? Cuéntame la última vez.
CIERRE-2 | Eso era tu familia y tus amigos. ¿Ha quedado alguien que quieres y no te he preguntado? Háblame de esa persona.
CIERRE-2-B1 | No, ya está todo
CIERRE-2-B2 | Sí, hay algo
ENTRADA-3 | Tercera parte. Tu vida hoy, tal como es este año. El cole, tus cosas, lo que te sale bien.
K21 | Cuéntame la última vez que algo te salió perfecto, de eso que sabes que haces bien.
K21-OP | ¿Y algo que hace poco te ha salido por primera vez? Cuéntame ese día.
K21-FOTO | ¿Ves a algún youtuber o streamer? Mándame un pantallazo y cuéntame qué tiene que te gusta.
K21-FOTO-B1 | No veo a ninguno
K21-FOTO-B2 | No tengo
K22 | Ahora una del futuro. ¿Qué quieres ser de mayor?
K22-OP | ¿Y a quién de los adultos que conoces te gustaría parecerte? Cuéntame por qué.
K22-FOTO | ¿Cuál es la peli o serie que más veces has visto? Ponla un segundo y hazle una foto a la pantalla.
K22-FOTO-B1 | No tengo
K23 | ¿Hay un profe o una profe que te caiga bien? Cuéntame una vez que hizo algo por ti, y dime cómo se llama.
K23-OP | ¿Y algo que un profe o una profe dice siempre y toda la clase ya se sabe?
K23-FOTO | Hazle una foto al cuaderno de la asignatura que más te gusta. ¿Qué tiene esa asignatura?
K23-FOTO-B1 | No tengo
K24 | ¿Qué ha sido lo mejor que te ha pasado esta semana? Cuéntame eso.
K24-OP | ¿Y algo de esta semana que no esperabas? Cuéntame qué pasó.
K24-FOTO | ¿Cuál es tu comida favorita? Si hoy la comes, hazle una foto. Y si no, cuéntame la última vez que la comiste.
K24-FOTO-B1 | Hoy no la como
K25 | ¿Ya tienes móvil?
K25-B1 | Sí
K25-R1 | Cuéntame el día que tuviste móvil por primera vez.
K25-B2 | Todavía no
K25-R2 | Cuéntame la última vez que lo pediste.
K25-OP | ¿Y lo que más haces en un móvil, tuyo o de otra persona? Cuéntame la última vez.
K26 | ¿Cuándo fue la última vez que te llamaron a cenar y no fuiste porque no podías soltar lo que estabas haciendo?
K26-OP | ¿Y a qué juegas cuando llegas a casa? Cuéntame la última vez.
K27 | ¿Qué música te gusta? ¿Cuál es tu canción favorita del momento?
K27-OP | ¿Y una canción que has escuchado tanto que ya te la sabes entera?
K28 | ¿En qué te da rabia perder de verdad? Cuéntame la última vez que perdiste en eso.
K28-OP | ¿Y una vez que ganaste y no te lo esperabas? Cuéntame ese día.
K29 | ¿Qué fue lo último que compraste con tu dinero? Cuéntame ese día.
K29-OP | ¿Y algo que te gustaría comprarte y todavía no puedes? Cuéntame.
K29-FOTO | Enséñame dónde guardas tu dinero, aunque sea un cajón. ¿Desde cuándo?
K29-FOTO-B1 | No tengo
K29-FOTO-NOTENGO | Vale, no pasa nada. Si alguna vez has ahorrado dinero para algo, cuéntamelo en un audio.
K30 | Dime algo que todavía no te dejan hacer sol{{o/a}} y tú ya te sientes preparad{{o/a}}.
K30-OP | ¿Y qué pasó la última vez que lo pediste?
CIERRE-3 | Eso era tu vida de ahora. ¿Ha quedado algo de tu día a día que no te he preguntado y va en el libro?
CIERRE-3-B1 | No, ya está todo
CIERRE-3-B2 | Sí, hay algo
ENTRADA-4 | Cuarta parte. Cosas que te han pasado. Aquí no hay fotos, solo tú contando. Y siempre puedes pasar.
K31 | Ahora quiero esa historia, la que ya has contado mil veces y todos se ríen igual. Todos tenemos una. ¿Cuál es la tuya?
K31-OP | ¿Y una historia tuya que cuentas distinta cada vez? Cuéntame la versión de hoy.
K32 | ¿Cuándo fue la última vez que te pusiste roj{{o/a}} delante de los demás? Cuéntame qué pasó.
K32-OP | ¿Y algo que te daba vergüenza el año pasado y ahora ya no?
K33 | Cuéntame una vez que hiciste algo bien y nadie se enteró. Solo tú lo sabes.
K33-OP | ¿Y algo que te costó mucho y al final salió? Cuéntame.
K34 | Cuéntame una vez que tuviste miedo y lo hiciste de todas formas.
K34-OP | ¿Y una vez que dijiste que no cuando todos decían que sí?
K35 | Piensa en alguien a quien ayudaste sin que te lo pidiera. Cuéntame qué pasó.
K35-OP | ¿Y una vez que alguien te ayudó sin que se lo pidieras?
K36 | ¿Alguna vez te has peleado en serio con un amigo o una amiga? Cuéntame el día que os peleasteis.
K36-OP | ¿Y una vez que te enfadaste con alguien y se te pasó rápido? Cuéntame.
K37 | ¿Te han echado la culpa alguna vez de algo que no hiciste? Cuéntame ese día.
K37-OP | ¿Y una vez que fuiste injust{{o/a}} con alguien? Cuéntame.
K38 | Cuéntame el día que algo cambió en tu vida, una mudanza por ejemplo.
K38-B1 | No se me ocurre
K38-OP | ¿Y algo que hacías todos los días y de repente dejaste de hacer? Cuéntame el último día.
K39 | A todos nos toca algún día malo. ¿Cuál fue el tuyo? Cuenta lo que quieras, y lo que no, no.
K39-BPASO | Esta la paso
K40 | Piensa en la última vez que estabas triste o enfadad{{o/a}} y alguien te hizo sentir mejor. Cuéntame, y dime quién.
K40-OP | ¿Y qué haces tú sol{{o/a}} cuando estás mal, para que se te pase? Cuéntame la última vez.
CIERRE-4 | Eso era lo que te ha pasado. ¿Ha quedado alguna historia tuya que no te he preguntado y quieres en el libro?
CIERRE-4-B1 | No, ya está todo
CIERRE-4-B2 | Sí, hay algo
ENTRADA-5 | Última parte, y es distinta. Estas últimas van en un sobre cerrado, pegado al libro, para que lo abras cuando seas mayor.
K41 | ¿Te ha gustado ya alguien? Sin decirme quién, cuéntame cómo te diste cuenta. Y si todavía no, cómo te lo imaginas.
K41-BPASO | Esta no, gracias
K41-OP | ¿Y qué es lo que te pone nervios{{o/a}} de otra persona, aunque no sepas por qué?
K42 | Si algún día tienes un hijo o una hija, ¿qué vas a hacer igual que te han criado a ti, y qué cambiarías?
K42-OP | ¿Y qué cosa de tu casa te gustaría que siga existiendo cuando seas mayor?
K43 | Hazle una pregunta a la persona que vas a ser cuando abras el sobre. La que quieras.
K43-OP | ¿Y qué le preguntarías que hoy no te atreves a preguntarle a nadie?
K44 | ¿Qué es lo que no quieres olvidar nunca de tu vida de ahora?
K44-OP | ¿Y un sitio de ahora que quieras recordar cuando lo leas?
K45 | Cierra los ojos un segundo. Un día cualquiera de tu vida de mayor. Cuéntamelo como te lo imaginas.
K45-OP | ¿Y qué es lo primero que haces por la mañana en esa vida?
K46 | Esta no es una pregunta, es un mensaje. El día que abras el sobre, ¿qué quieres que lea de ti de ahora? Tómate el tiempo que quieras.
K46-OP | ¿Y qué crees que va a pensar cuando lea esto?
K47 | La última. Imagínate que alguien no te conoce de nada y tienes dos minutos para que sepa quién eres. Cuéntame.
K47-OP | ¿Y qué diría de ti un amigo o una amiga si le preguntan cómo eres?
CIERRE-FINAL | Esas eran todas las preguntas. Has contado un montón, y con todo eso se hace tu libro. ¿Ha quedado algo que quieras decir, de lo que sea?
CIERRE-FINAL-B1 | No, ya está todo
CIERRE-FINAL-B2 | Sí, hay algo
X1-1 | ¿Y algo que te han contado de cuando eras bebé, aunque tú no te acuerdes?
X1-2 | ¿Y una trastada que hizo otro y tú la viste? Cuéntame esa.
X1-3 | ¿Y un día normal que acabó siendo buenísimo sin que nadie lo planeara? Cuéntame ese.
X1-4 | ¿Alguna vez te has aburrido tanto que te has inventado un juego? Cuéntame ese.
X1-5 | ¿Y fuera de tu casa, un sitio al que vas siempre? Cuéntame la última vez que fuiste.
X1-6 | ¿Y un sitio al que fuiste una sola vez y quieres volver? Cuéntame qué había allí.
X1-7 | Enséñame algo que guardas desde hace años aunque nadie entienda por qué. ¿De dónde salió?
X2-1 | Cuéntame la última vez que le pediste algo a tu madre y te costó pedírselo.
X2-2 | Cuéntame la última vez que tu madre te sorprendió con algo.
X2-3 | Cuéntame una vez que viste a tu madre enfadada de verdad.
X2-4 | ¿Cómo le llamas tú a tu madre? Cuéntame de dónde salió eso.
X2-5 | Cuéntame una vez que tu padre te enseñó algo que hoy haces sol{{o/a}}.
X2-6 | Cuéntame la última vez que hiciste reír a tu padre, en serio, a carcajadas.
X2-7 | Cuéntame una vez que viste a tu padre enfadado de verdad.
X2-8 | ¿Cómo le llamas tú a tu padre? Cuéntame de dónde salió eso.
X2-9 | Cuéntame una vez que un hermano o hermana te cubrió para que no te regañaran.
X2-10 | Cuéntame la última vez que tuviste que compartir algo con un hermano o hermana y no querías.
X2-11 | Cuéntame una vez que un amigo o una amiga te defendió delante de otros.
X3-1 | Cuéntame una vez con un compañero o compañera de este año que no vas a olvidar.
X3-2 | Cuéntame una vez que alguien en el cole te hizo pasar un mal momento. Cuenta lo que quieras, y lo que no, no.
X3-3 | Cuéntame el sábado pasado, desde que te levantaste hasta que te acostaste.
X3-4 | Cuéntame cómo fue ayer, desde que te levantaste.
X3-5 | Cuéntame la primera vez que ganaste dinero por algo que hiciste.
X3-6 | Cuéntame una vez que gastaste dinero en algo y después te arrepentiste.
X4-1 | Cuéntame una vez que te pasó algo tan raro que nadie te creyó.
X4-2 | Cuéntame el día más largo que has tenido, el que parecía que no se acababa nunca.
X4-3 | Cuéntame cómo hicisteis las paces después de esa pelea, si las hicisteis.
X4-4 | Cuéntame una vez que pediste perdón y te costó.
X4-5 | Cuéntame una frase que alguien te dijo una vez y que recuerdas cuando estás mal.
X5-1 | Cuéntame cómo te imaginas a la persona con la que vas a estar de mayor, si es que hay alguien.
X5-2 | ¿Qué nombre le pondrías a un hijo o una hija, hoy?
X5-3 | ¿Qué es lo que más te gusta de ti, hoy?
B-SEGUIR | Esa ya está. ¿Seguimos con otra ahora o la dejamos para mañana?
B-SEGUIR-B1 | Vale, otra
B-SEGUIR-B2 | Mañana sigo
B-MAÑANA | Ya está por hoy, mañana hay más.
B-AVISO-SERIA | Hay otra, pero es de las que se piensan con calma. ¿La hacemos ahora o mañana?
B-AVISO-SERIA-B1 | Ahora
B-AVISO-SERIA-B2 | Mañana mejor
B-UNA-MAS | Antes de cerrar esta parte, ¿quieres una más de estas?
B-UNA-MAS-B1 | Vale, otra
B-UNA-MAS-B2 | No, cerramos
B-FOTO-NOTENGO | Vale. Si hay algo así pero no lo tienes a mano, cuéntamelo en un audio y sirve igual.
B-FOTO-PLATA | Vale, no pasa nada. Si alguna vez has ahorrado dinero para algo, cuéntamelo en un audio.
B-PASO | Vale, esa nos la saltamos.
B-NO-PASA-NADA | Vale, no pasa nada.
B-DIAFEO-ACUSE-1 | Gracias por contarme eso. Lo guardamos con cuidado.
B-DIAFEO-ACUSE-2 | Gracias por confiarme eso. Ya está, ya lo has contado.
B-TRANQUILA | Si quieres, hay una más tranquila para no cerrar el día así. Tú eliges.
B-TRANQUILA-B1 | Vale, una tranquila
B-TRANQUILA-B2 | Mañana sigo
BIEN-CHICO | Hola {{1}}. Te escribo porque {{2}} te ha hecho un regalo con mucho cariño. Vas a hacer el libro de tu vida, y lo mejor es que no hace falta escribir nada, lo vas contando con audios. Yo soy quien te va a ir haciendo las preguntas por aquí.\n\nEs fácil. Te mando una pregunta y tú me contestas como si se lo contaras a un amigo. No hay que contestar bien ni mal, cuentas como te salga.\n\nA veces te voy a pedir una foto de algo tuyo, y a veces vas a ver botones para elegir. Si una pregunta no te gusta o no se te ocurre nada, la pasas y seguimos.\n\nCuando terminemos, todo lo que has contado se convierte en un libro de verdad, con tus palabras y tus fotos. Y la última parte va en un sobre cerrado, para que lo abras cuando seas mayor.\n\n¿Vamos con la primera?
BIEN-CHICO-B1 | Vale, vamos
BIEN-CHICO-PL | Hola {{1}}. Te escribo porque {{2}} te han hecho un regalo con mucho cariño. Vas a hacer el libro de tu vida, y lo mejor es que no hace falta escribir nada, lo vas contando con audios. Yo soy quien te va a ir haciendo las preguntas por aquí.\n\nEs fácil. Te mando una pregunta y tú me contestas como si se lo contaras a un amigo. No hay que contestar bien ni mal, cuentas como te salga.\n\nA veces te voy a pedir una foto de algo tuyo, y a veces vas a ver botones para elegir. Si una pregunta no te gusta o no se te ocurre nada, la pasas y seguimos.\n\nCuando terminemos, todo lo que has contado se convierte en un libro de verdad, con tus palabras y tus fotos. Y la última parte va en un sobre cerrado, para que lo abras cuando seas mayor.\n\n¿Vamos con la primera?
BIEN-CHICO-PL-B1 | Vale, vamos
BIEN-PADRE | Hola {{1}}. Qué bonito regalo le estás haciendo a {{2}}, su propio libro, contigo al lado mientras lo cuenta. Las preguntas van a llegar a este número. Te cuento cómo es para que salga todo bien.\n\nCuando llegue una, busca un rato tranquilo y siéntate con {{2}} al lado. Léesela, o pásale el móvil para que la lea.\n\nLa respuesta es un audio, y lo graba {{2}} con sus palabras. No contestes tú ni le corrijas nada. Si se va por las ramas o dice algo que no es como tú lo recuerdas, eso también va al libro, y es lo que lo hace suyo.\n\nLos botones también los toca {{2}}, para pasar una pregunta, decir que no tiene algo o pedir otra. Son parte de lo que cuenta.\n\nY una sola cosa te pedimos. Lee todo, pero no le digas nada hasta el libro. Ni qué te ha parecido ni qué te habría gustado que dijera. Todo queda guardado en la página de su historia, también lo del sobre cerrado.\n\nCuando estéis juntos, toca el botón y llega la primera.
BIEN-PADRE-B1 | Estamos listos
AVISO-PADRE | Hola {{1}}. Ya le hemos escrito a {{2}}. Le hemos contado de parte de quién es el regalo, y cuando toque "Vale, vamos" le llega la primera pregunta. A partir de ahí va a su ritmo.\n\nTodo lo que cuente lo puedes ver en la página de su historia, en {{3}} (audios, fotos y respuestas, también las del sobre cerrado).\n\nMientras tanto, solo te escribimos si pasan cuatro días sin que conteste, para que le des un empujoncito en casa. A {{2}} no le decimos nada por tardar. No hay regañinas ni prisas por nuestra parte.\n\nY una sola cosa te pedimos. Lee todo, pero no le digas nada hasta el libro.
ACUSE-1 | Lo he escuchado entero, de principio a fin.
ACUSE-2 | Ya ha quedado guardado con todo lo demás, gracias por mandarlo.
ACUSE-3 | Eso va al libro, con tus palabras.
ACUSE-4 | Ya lo he escuchado, lo tengo.
ACUSE-5 | Ya ha quedado guardado, tal como lo has contado.
ACUSE-6 | Te he escuchado, y ya está a salvo para el libro.
ACUSE-7 | Hecho, lo tengo.
ACUSE-FOTO-1 | Ha llegado la foto, ya está guardada.
ACUSE-FOTO-2 | Esa foto la guardo para el libro.
ACUSE-FOTO-3 | Ya la tengo, gracias por mandarla.
PREG-NUEVA-CHICO | Hola {{1}}, hay una pregunta esperándote. Toca el botón y te la mando.
PREG-NUEVA-CHICO-B1 | Vale, mándamela
PREG-NUEVA-PADRE | Hola {{1}}, hay una pregunta nueva para {{2}}. Cuando estéis juntos y con un rato tranquilo, toca el botón y llega.
PREG-NUEVA-PADRE-B1 | Estamos listos
RECORD-A-4 | Hola {{1}}. Han pasado cuatro días sin respuesta de {{2}}, así que te avisamos como habíamos quedado. Si puedes, dale un empujoncito en casa, sin prisa. Nosotros no le decimos nada por tardar.
RECORD-A-8 | Hola {{1}}. Han pasado ocho días sin respuesta de {{2}}, así que te avisamos como habíamos quedado. Si puedes, dale un empujoncito en casa, sin prisa. Nosotros no le decimos nada por tardar.
RECORD-B | Hola {{1}}. Han pasado cuatro días sin que respondáis la pregunta pendiente, no hay problema. Es solo un recordatorio, sin prisa. Cuando tengáis un momento, siéntate con {{2}} al lado y toca el botón para seguir.
RECORD-B-B1 | Estamos listos
RECORD-B-8 | Hola {{1}}. Han pasado ocho días sin que respondáis la pregunta pendiente, no hay problema. Es solo un recordatorio, sin prisa. Cuando tengáis un momento, siéntate con {{2}} al lado y toca el botón para seguir.
RECORD-B-8-B1 | Estamos listos
PADRE-PREG-LINEA | Esta pregunta te la manda {{1}}, con sus palabras.
PADRE-PREG-LINEA-PL | Esta pregunta te la mandan {{1}}, con sus palabras.
EXTRAS-OFERTA | Me han quedado algunas preguntas más de todo lo que hemos ido hablando. Si tienes ganas las hacemos, y si no, ya está, el libro se hace igual con todo lo que has contado.
EXTRAS-OFERTA-B1 | Vale, otra
EXTRAS-OFERTA-B2 | No, ya está
EXTRAS-SI | Vale, va la primera.
EXTRAS-OTRA | ¿Quieres otra o lo dejamos aquí?
EXTRAS-OTRA-B1 | Vale, otra
EXTRAS-OTRA-B2 | Lo dejamos aquí
EXTRAS-FIN | Esa era la última que me quedaba.
FINAL-CHICO | Bueno {{1}}, hasta aquí llegamos. Ya tengo todo lo que has contado con tus audios y tus fotos, y ahora con eso se hace el libro, con tus palabras. Cuando esté listo te lo va a dar {{2}}, que es quien te ha hecho este regalo. La última parte, la del sobre cerrado, va aparte, pegada al libro, para que la abras cuando seas mayor. Gracias por contarme todo esto. Nos vemos pronto.
FINAL-CHICO-PL | Bueno {{1}}, hasta aquí llegamos. Ya tengo todo lo que has contado con tus audios y tus fotos, y ahora con eso se hace el libro, con tus palabras. Cuando esté listo te lo van a dar {{2}}, que son quienes te han hecho este regalo. La última parte, la del sobre cerrado, va aparte, pegada al libro, para que la abras cuando seas mayor. Gracias por contarme todo esto. Nos vemos pronto.
TERMINO-PADRE | Hola {{1}}. {{2}} ha terminado de contar. Ya están todas sus respuestas en la página de su historia, también las del sobre cerrado. Ahora empezamos a preparar el libro, y te avisamos cuando esté listo. Y lo mismo que al principio, no le digas nada hasta el libro.
---

## Cambios que no son solo de vos a tú

Solo las filas donde cambió algo más que la conjugación y el vocabulario obvio de la cabecera (una referencia, una costumbre, un ejemplo, un giro reformulado). Lo que no está acá se adaptó palabra por palabra.

| ID | rioplatense | España | por qué |
|---|---|---|---|
| CAP-1, ENTRADA-1, K3, K5, K9, K14, CIERRE-1 | chiquito / chic{{o/a}} / eran chicos | pequeño / pequeñ{{o/a}} / eran pequeños | En España «chico» es un adolescente o un joven, no un niño pequeño; «de pequeño» es lo que se dice. |
| CAP-5, ENTRADA-5, K22, K42-OP, K45, X5-1, BIEN-CHICO, BIEN-CHICO-PL, FINAL-CHICO, FINAL-CHICO-PL | grande (de edad): «cuando seas grande», «de grande» | mayor: «cuando seas mayor», «de mayor» | «De grande» no se dice en España; es «de mayor». |
| K19, K22-OP | un grande que no es de tu familia / los grandes que conocés | un adulto / los adultos que conoces | «Un mayor» suelto en España se lee como una persona anciana; «adulto» es claro para un chico de 11. |
| K19, ENTRADA-3, X3-2, COMPRA-2-HORA, COMPRA-3-TEMAS | la escuela | el cole | A los 11 en España se va «al cole» (6.º de Primaria); «la escuela» suena a documento. |
| K23, K23-OP | un maestro o una maestra | un profe o una profe | Es como los chicos de 11 llaman a quien les da clase en España; «maestro» se entiende pero no lo dice ningún chico. |
| K23-FOTO | la carpeta de la materia | el cuaderno de la asignatura | En España «materia» escolar es «asignatura» y la carpeta de apuntes es un cuaderno o una libreta. |
| K14-FOTO | ¿Sos hincha de algún club? … algo de ese club … cómo te hiciste hincha | ¿Eres de algún equipo? … algo de ese equipo … cómo te hiciste de ese equipo | «Hincha» y «club» en ese sentido son de allá; «ser de un equipo» es lo que se dice (igual que PA3 en Familiar). El botón [De ninguno] sigue valiendo. |
| K21-FOTO, K21-FOTO-B1 | ¿Mirás a algún youtuber…? [No miro] | ¿Ves a algún youtuber…? [No veo a ninguno] | En España se «ve» un vídeo o un youtuber; «mirar» suena a mirar fijo. «No veo» solo se leería como «no veo bien», por eso «a ninguno» (16 letras). |
| K29, K29-FOTO, K29-FOTO-NOTENGO, B-FOTO-PLATA, X3-5, X3-6 | plata / juntaste plata | dinero / has ahorrado dinero | «Plata» no se usa; «juntar plata» es «ahorrar». |
| K25, K25-R1, K25-OP, BIEN-PADRE | celular | móvil | Es la palabra de España. |
| K39 | algún día feo | algún día malo | «Día feo» en España es el tiempo (lluvia); el día triste es un «día malo» o un «mal día». |
| K34 | lo hiciste igual | lo hiciste de todas formas | «Igual» en España quiere decir «quizá»; «de todas formas» es el sentido original (a pesar del miedo). |
| K40, K36-OP, X2-3, X2-7 | enojad{{o/a}} / te enojaste / enojada de verdad | enfadad{{o/a}} / te enfadaste / enfadada de verdad | «Enojarse» en España suena a literatura; se dice «enfadarse». |
| X2-9 | para que no te retaran | para que no te regañaran | «Retar» en España es desafiar; la bronca de los padres es «regañar». |
| X2-4, X2-8 | ¿Cómo le decís vos a tu mamá? | ¿Cómo le llamas tú a tu madre? | «Decirle» a alguien de una forma no se usa así en España; es «llamar». |
| X4-3 | cómo se arreglaron después de esa pelea, si se arreglaron | cómo hicisteis las paces después de esa pelea, si las hicisteis | «Arreglarse» entre amigos no se dice en España; «hacer las paces» es la expresión que usan los chicos. |
| K12-OP | te saca sin pedir | te coge sin pedirlo | «Sacar» en ese sentido no se usa; «coger» es natural en España (y no tiene el doble sentido de allá). |
| K30 | ya te sentís list{{o/a}} | ya te sientes preparad{{o/a}} | «Listo» en España es sobre todo «inteligente»; «preparado» es el sentido original. Misma marca {{o/a}}. |
| K19-OP, CIERRE-2 | Contame de esa persona. | Háblame de esa persona. | «Contar de» no se dice en España (lo señaló la lectora de Familiar). |
| CIERRE-1…4, CIERRE-FINAL (botón 1) | No, eso fue todo | No, ya está todo | Es el botón que Naza aprobó para los cierres de Familiar en España; «eso fue todo» suena a despedida de programa. Mismo valor, 16 letras. |
| K20-B2 | No me pasó | No me ha pasado | Pretérito perfecto, como se dice en España para algo hasta hoy. Mismo valor, 15 letras. |
| B-SEGUIR-B1, B-UNA-MAS-B1, EXTRAS-OFERTA-B1, EXTRAS-OTRA-B1, B-TRANQUILA-B1, BIEN-CHICO-B1, BIEN-CHICO-PL-B1, PREG-NUEVA-CHICO-B1 | Dale, otra / Dale, una tranquila / Dale, vamos / Dale, mandámela | Vale, otra / Vale, una tranquila / Vale, vamos / Vale, mándamela | «Dale» no se dice en España; «vale» es su equivalente exacto. AVISO-PADRE cita el botón «Vale, vamos». |
| EXTRAS-OTRA, EXTRAS-OTRA-B2 | ¿…lo dejamos acá? [Lo dejamos acá] | ¿…lo dejamos aquí? [Lo dejamos aquí] | «Acá» no se usa. |
| B-PASO | Dale, esa la salteamos. | Vale, esa nos la saltamos. | «Saltear» en España es cocinar; «saltarse» es el verbo. |
| B-FOTO-NOTENGO | Dale. Si igual hay algo así pero no lo tenés a mano, contámelo en un audio y vale igual. | Vale. Si de todas formas hay algo así pero no lo tienes a mano, cuéntamelo en un audio y sirve igual. | «Igual» → «de todas formas» (ver K34); «vale igual» → «sirve igual» para no repetir «vale» dos veces en dos frases. |
| ACUSE-7 | Listo, lo tengo. | Hecho, lo tengo. | «Listo» como «ya está» se entiende poco en España; «hecho» es lo que se dice. |
| AVISO-PADRE | No hay retos ni apuros de nuestro lado. | No hay regañinas ni prisas por nuestra parte. | «Retos» en España son desafíos; la bronca es «regañina». «De nuestro lado» → «por nuestra parte». |
| BIEN-PADRE | Qué lindo regalo … con vos al lado | Qué bonito regalo … contigo al lado | «Lindo» no se dice; «contigo» es la forma de «con vos». |
| BIEN-CHICO, BIEN-CHICO-PL, CIERRE-FINAL, EXTRAS-OFERTA, FINAL-CHICO, FINAL-CHICO-PL | armar el libro / se arma | hacer el libro / se hace | «Armar» en España es de armas o de muebles; el libro «se hace». |
| TERMINO-PADRE | Ahora empieza el armado del libro | Ahora empezamos a preparar el libro | «Armado» no existe en ese sentido. |
| K1, K13-FOTO | lo más viejo / la cosa más vieja | lo más antiguo / la cosa más antigua | «Viejo» para un recuerdo o un objeto suena despectivo en España; «antiguo» es lo natural. |
| K3-OP | un día común | un día normal | «Día común» no se dice; es «un día normal». |
| K47 | no te conoce nada | no te conoce de nada | Es el giro de España. |
| K16-R1, K16-OP, K18, K11, K36 | se juntaron / se juntan / con ustedes / hicieron / se pelearon | os juntasteis / os juntáis / con vosotros / hicisteis / os peleasteis | Vosotros cuando habla de varios con el chico incluido. En K18 se mantiene entera la frase «como la pareja de tu madre o de tu padre, o alguien» porque el código la recorta por tema (`compra.ts`, variante es-ES). |
| CAP-4, ENTRADA-4, CIERRE-4, K24, K14, K20, K37, K41 y otros | pasó / te contaron / te echaron la culpa / te pasó | ha pasado / te han contado / te han echado la culpa / te ha pasado | Pretérito perfecto para lo que llega hasta hoy, como se dice en España. Lo de un día concreto del pasado sigue en indefinido («¿Cuál fue el peor golpe…?»). |

## Textos de la web (compra y panel) con ID en `mensajes.md`

No entran en `banco.json` (el parser solo toma las tablas «ID | Texto»), por eso van acá abajo, en una tabla, para cuando se haga la compra y el panel en España. Mismas marcas (`{{nombre}}`, `{precio}`).

| ID | Elemento | España |
|---|---|---|
| COMPRA (pasos) | Arriba | 1. Tú · 2. Quién cuenta · 3. Temas y pago |
| COMPRA-1-TITULO | Título | El libro de su vida, contado con audios. |
| COMPRA-1-BAJADA | Bajada | Le hacemos preguntas por WhatsApp, responde con audios y con fotos, y todo eso se convierte en un libro de verdad. Aquí van tus datos. |
| COMPRA-1-NOMBRE | Tu nombre | placeholder "Nombre y apellidos" |
| COMPRA-1-WA | Tu WhatsApp | placeholder "600 123 456" · ayuda "Aquí te avisamos si hace falta y cuando el libro esté listo." |
| COMPRA-1-CORREO | Tu correo | placeholder "tu@ejemplo.com" · ayuda "Con este entras en la página de su historia, donde ves todo lo que cuenta." |
| COMPRA-2-TITULO | Título | Quién lo cuenta. |
| COMPRA-2-BAJADA | Bajada | Lo que necesitamos para que las preguntas le hablen bien y la portada sea suya. |
| COMPRA-2-NOMBRE | Su nombre | placeholder "Nombre y apellidos" · ayuda "Así va en la portada." |
| COMPRA-2-APODO | Cómo le llamáis | placeholder "Como le llamáis en casa" · ayuda "Así lo saludamos en los mensajes." |
| COMPRA-2-GENERO | Chico o chica | Chico · Chica · ayuda "Solo para que las preguntas le hablen bien." |
| COMPRA-2-EDAD | Edad | placeholder "11" · ayuda "Va en la portada, al lado del nombre." |
| COMPRA-2-REGALA | Quién se lo regala | Tu madre · Tu padre · Tus padres · Tu abuela · Tu abuelo · Tus abuelos · Otra persona (libre, placeholder "Tu tía, tus padrinos, tu madrina") · ayuda "Así lo nombra el primer mensaje. Escríbelo como se lo dirías a quien lo recibe." |
| COMPRA-2-CANAL-A | Por dónde llegan las preguntas · **A su WhatsApp** | "Le escribimos directamente y responde cuando le apetece. Tú ves todo lo que cuenta desde tu panel." · campo "Su WhatsApp" · "Al elegir esto, eres tú, como adulto responsable, quien autoriza que le escribamos a ese número." |
| COMPRA-2-CANAL-B | **Lo hago yo** | "Las preguntas llegan a tu WhatsApp. Te sientas a su lado, se las lees y responde con sus palabras." |
| COMPRA-2-HORA | A qué hora le escribimos | 18:00 por defecto · ayuda "Mejor a la vuelta del cole, o cuando podáis sentaros juntos." |
| COMPRA-3-TITULO | Título | Temas y pago. |
| COMPRA-3-BAJADA | Bajada | Hay cosas que solo tú sabes si conviene tocar. Lo que marques aquí no se pregunta, y el libro se hace igual con el resto. |
| COMPRA-3-TEMAS | No preguntar sobre | Su madre · Su padre · Un abuelo o abuela que murió · Su nueva familia (la pareja de su madre o de su padre, sus hijos) · Una mudanza o un cambio grande · Un mal momento en el cole |
| COMPRA-3-DEBAJO | Debajo de los temas | Todo lo demás tiene botón para pasar. Si una pregunta no le gusta, la salta y seguimos. |
| COMPRA-3-FOTOS | Casilla (apagada) | Pueden ir fotos con otros niños · ayuda "Si no la marcas, las fotos donde aparecen otros niños quedan fuera del libro." |
| COMPRA-3-BOTON | Botón | Pagar {precio} |
| COMPRA-3-DESPUES | Qué pasa después | Después de pagar te llega un correo para entrar en la página de su historia. Si has elegido su WhatsApp, le escribimos para presentarnos y a ti te avisamos. Si lo haces tú, el primer mensaje llega a tu WhatsApp y la primera pregunta sale cuando estéis juntos. |
| PANEL-GUIA-TITULO | Título | Tus preguntas para el libro |
| PANEL-GUIA-1 | Párrafo | Puedes añadir hasta tres preguntas tuyas. Le llegan a {{nombre}} cerca del final, entre la cuarta parte y el sobre cerrado. Antes de cada una le decimos que viene de ti, salvo que prefieras que le llegue como una pregunta más. |
| PANEL-GUIA-2 | Párrafo | Que cada pregunta pida una sola cosa. Si quieres saber dos cosas, escribe dos preguntas. |
| PANEL-GUIA-3 | Párrafo | Funciona mejor pedirle una vez concreta que una opinión. "Cuéntame la vez que…" saca mucho más que "¿Qué sientes?" o "¿Qué piensas de…?". |
| PANEL-GUIA-4 | Párrafo | Como todas las demás, {{nombre}} la puede pasar si no quiere contestarla. |
| PANEL-GUIA-EJ | Ejemplos | Cuéntame el día que aprendiste a montar en bici sin ruedines. · Cuéntame el día que se te cayó el primer diente, que fue comiendo una mazorca. · Cuéntame la primera noche que dormiste en casa de un amigo y nos llamaste a las dos de la mañana. |
| PANEL-GUIA-5 | Párrafo final | Las puedes escribir o cambiar hasta que empiece la cuarta parte. Después ya no se añaden. |
| PANEL-CASILLA | Casilla al lado de cada pregunta | Que le llegue como una pregunta más, sin decir que es mía |

Cambios de sentido en la web: «tapa» → «portada» (en España la tapa es la del libro de tapa dura, pero lo que lleva el nombre es «la portada»); «Tus papás» → «Tus padres» (a un chico en España nadie le dice «tus papás»; sigue empezando con «Tus», que es lo que mira el código para el plural); «familia ensamblada» → «su nueva familia (…)» («ensamblada» no se usa en España; lo técnico sería «reconstituida», que ningún padre dice); «otros chicos» → «otros niños»; «andar en bici sin rueditas» → «montar en bici sin ruedines»; «choclo» → «mazorca»; «en lo de un amigo» → «en casa de un amigo»; «Cómo le dicen» → «Cómo le llamáis»; el placeholder del WhatsApp pasa a un número de España («600 123 456»); «vos@ejemplo.com» → «tu@ejemplo.com».

## Dudas

1. **Botones por texto literal.** El motor compara `'Dale, otra'`, `'Dale, mandámela'`, `'Dale, vamos'`, `'Lo dejamos acá'`, `'No, eso fue todo'`, `'No miro'`, `'No me pasó'` como texto (`motor/botones.ts`, `motor/rafaga.ts`). Con este archivo cambian ocho botones; hay que comparar por posición o por el texto del idioma activo antes de prender España.
2. **«mamá» y «papá».** (Resuelta el 16/10: Naza eligió «madre / padre», ver abajo.) Los dejé igual: un chico de 11 en España dice «mi mamá / mi papá» en casa y «mi madre / mi padre» con amigos; Familiar los cambió a «madre / padre» porque el narrador es de 60+. Si Naza prefiere «madre / padre» para Kids, cambian K10, K11, K18, X2-1…X2-8, COMPRA-2-REGALA y COMPRA-3-TEMAS, y el recorte de K18 en `compra.ts` tiene que recortar la frase de España.
3. **«travesura».** (Resuelta el 16/10: «trastada».) Se entiende en España y lo dejé (K2, K2-OP); los chicos dicen más «trastada». Decisión de Naza.
4. **«profe» en K23.** Elegí «un profe o una profe» (es lo que dicen los chicos). Si suena demasiado coloquial, «un maestro o una maestra» se entiende en Primaria.
5. **«con mucho cariño» en BIEN-CHICO.** Es del que regala, no del bot; lo mantuve como en el original aprobado. Lo señalo por la regla «el bot no muestra afecto».
6. **«Nos vemos pronto» (FINAL-CHICO).** Está en el original; en España se lee como promesa de tiempo. Lo dejé igual porque no es un cambio de idioma.
7. **Plural «Tus padres».** `esPlural` mira `/^tus\s/`, así que funciona. En las plantillas `{{2}}` llega en minúscula («tus padres»).
8. **Lectura de alguien de España.** (Resuelta el 16/10: la leyó una madre de Zaragoza con un hijo de 11.)

## Aprobado por Naza el 16/10/2026 (tanda 8)

Leyó la lectura a ciegas de Marta (madre de Zaragoza, [`lectura-espana-2026-10-16.md`](lectura-espana-2026-10-16.md)) y aprobó esto, que ya está aplicado arriba (y en [`plantillas-meta-kids-es-ES.md`](plantillas-meta-kids-es-ES.md) donde toca):

1. **Los 35 cambios de vocabulario de Fable** (la tabla «Cambios que no son solo de vos a tú»): quedan como están.
2. **Las 20 propuestas «A · solo idioma» de la lectura, tal cual.** Las de este archivo: K22 «¿Qué quieres ser de mayor?», K8-FOTO «sin recoger», K12 «Vamos con los hermanos.», K11-FOTO-B1 [No hago ninguno], K41 «¿Te ha gustado ya alguien?», B-FOTO-NOTENGO sin «de todas formas», B-AVISO-SERIA «¿La hacemos ahora o mañana?» con [Ahora], K21-FOTO «pantallazo», K32 «delante de los demás», K28 «te da rabia perder», K42 «igual que te han criado a ti», X3-3 «hasta que te acostaste», K18 «alguien que ha venido a vivir con vosotros», K25-OP «tuyo o de otra persona», K20 «alguien del barrio o algún vecino», y en la tabla de la web COMPRA-2-CANAL-A «adulto responsable». Las que son solo de la web (KP-INICIO-VER, el asunto del mail `revisar`, KIDS_IMPRESO.impresoDetalle, KP-ESTADO-ANTES-A con el mail `primeraLinea.A` y `canalA`, y COMPRA-2-CANAL-A en `checkout-kids.ts`) se aplican en la rama de la web, no acá.
3. **«mamá / papá» → «madre / padre»** (era la duda 2). K10, K10-OP, K11, K11-OP, K18, X2-1…X2-8, y en la tabla de la web COMPRA-2-REGALA («Tu madre · Tu padre · Tus padres…») y COMPRA-3-TEMAS («Su madre · Su padre · … Su nueva familia (la pareja de su madre o de su padre, sus hijos)»). X2-4 y X2-8 quedan «¿Cómo le llamas tú a tu madre?» / «¿Cómo le llamas tú a tu padre?» (con «le», lo más cercano al «¿Cómo le decís vos a tu mamá?» original: pregunta por el nombre que le pone, no se contesta sola). El motor ya no mira el texto del idioma para saber qué extra es de qué tema (`temaDeExtra` decide por el texto de banco.md), y K18 en España se recorta con su propia frase («como la pareja de tu madre o de tu padre, o alguien»), solo borrando palabras.
4. **K26** «te llamaron a cenar» (en España «comer» es a mediodía, en el cole).
5. **K2 y K2-OP «trastada»** (era la duda 3). También X1-2, que es el mismo texto que K2-OP.
6. **K7** «ir a por el pan, por ejemplo».
7. **El botón citado al padre es el de España.** AVISO-PADRE (y su plantilla `kids_aviso_padre_es_es`) ya decía «Vale, vamos». KP-ESTADO-ESPERA-A del panel es de la web: va a la otra rama.

Lo de la lectura que no entró en esta tanda (decisión de Naza, sin tocar): PANEL-GUIA-EJ «mazorca» → «manzana», la hora por defecto de COMPRA-2-HORA y «familia reconstituida» en `checkout-kids.ts` (este archivo ya dice «Su nueva familia»).

## Aprobado por Naza el 16/10/2026 (tanda 10)

Al revisar el catalán salieron tres textos que estaban mal también acá y en rioplatense. Naza aprobó el cambio en los tres idiomas:

1. **K14-OP** «aquí venía yo cuando tenía tu edad» (antes «de pequeñ{{o/a}}»: la marca tomaba el género del chico, pero la frase la dice el adulto).
2. **K44-OP** «¿Y un sitio de ahora que quieras recordar cuando lo leas?» (antes «que quieres que vuelva», que se entendía mal).
3. **CAP-5** «Para cuando seas mayor (el sobre cerrado)» (antes «(la cápsula)»: todos los demás mensajes dicen «el sobre cerrado»).

K46 sigue igual.
