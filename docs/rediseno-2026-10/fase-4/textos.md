# Fase 4 — textos para aprobar (/viaje y landings de anuncio)

**Aprobado por Naza el 14/10:** los cuatro titulares de landing, opción A; tanda 1 (sin «Cada ciudad, un capítulo», también fuera de la landing de viaje, donde el primer punto pasó a «Os pregunta por el día»); tanda 2 (11–20); tanda 3 (20–31); tanda 4 (32–41); tanda 5 (42–53 y títulos). **Todos los textos de la fase 4 en es y ar aprobados.**

Para Naza, de a 10. Cada texto lleva **una versión recomendada**; solo los titulares de las
landings traen tres opciones (son de marca: los eliges tú). Sin dos puntos en nada nuevo. El
catalán va en el código marcado `ca: PENDIENTE REVISIÓN NATIVA` y no se lista acá fila por fila:
lo revisa una persona nativa.

Lo que **no** está acá porque ya está aprobado y se reusa tal cual (de `_textos/portada.ts`,
`aprobados.md`, `TEXTOS-Y-REGLAS.md` §5 o `lib/regalo-textos.ts`): los tres pasos «Lo anotas /
Solo manda audios / El biógrafo escribe», las preguntas frecuentes de la portada (incluida la de
la garantía, que solo vive en la mini FAQ), «Desde {precio} · pago único», el lema «En cada
familia hay un libro sin escribir.», el del viaje «En cada viaje hay un libro sin escribir.», la
cita del limonero y su texto, el marco con su voz, «Eliges el día en que empieza y te damos una
tarjeta para entregárselo.», los textos de la tarjeta del regalo («Esto es un regalo.», «Osvaldo,
Laura te ha hecho un regalo.», las tres líneas), «Historia inventada», «Hojea un libro de ejemplo
antes de comprar», «Pago único, sin suscripciones», «Si el viaje se cancela, te devolvemos el
dinero.» y, en Argentina, «¿Me trata de vos? Sí. Es tu biógrafo…» (11/10, #2).

Archivos: `web/src/app/_textos/viaje.ts`, `landing-regalo.ts`, `landing-preguntas.ts`,
`landing-voz.ts`, `landing-viaje.ts`, `landings.ts`.

## Decisiones que tomé (para que las sepas, no hace falta aprobarlas una por una)

- **Rutas**: `/regalo-para-tu-padre`, `/lo-que-nunca-le-preguntaste`, `/su-voz` y
  `/el-libro-del-viaje`, con `/ca/...` igual (como `/ca/comprar`). En Argentina la de regalo es
  **`/ar/regalo-para-tu-papa`** (la URL se ve en el anuncio; «padre» suena raro allá). El hreflang
  las enlaza igual. Si alguien de fuera de Europa entra a la de España, el CDN lo manda a la de
  Argentina (`next.config.ts`).
- **/viaje describe el Viaje V1** (lo que reciben hoy los clientes): ciudades, etapas, la foto del
  día, el libro en la web. Nada del V2.
- **Sin «cada noche»** en /viaje ni en la landing de Viaje, en ninguna versión (también sale de la
  de Argentina, igual que en la compra de Viaje): está pendiente tu decisión B24. Si dices que
  sí, vuelve en un cambio de una línea por texto.
- **España, en /viaje no se promete trato**: el bot de Viaje V1 escribe en rioplatense («contame»,
  «mandame») también a quien está en España. «¿Me trata de vos?» queda solo en Argentina. Ver
  PENDIENTES V4.
- **Landings de Viaje: una sola, no tres.** Las maquetas «Luna de miel» y «Volver» se apoyan en
  cosas que hoy no son ciertas o no están decididas (contarlo los dos cada uno con su móvil,
  «elegís el día de salida y ese día os llega el primer mensaje», «unos 9 días»). Hice la de «lo
  que no sale en las fotos», que se puede decir con el V1.
- **/su-voz sin audio**: no hay un audio de muestra con permiso (P1). La onda va quieta, sin
  botón de play, y debajo dice que es una frase de ejemplo.
- **Preguntas de /lo-que-nunca-le-preguntaste**: las de la maqueta eran inventadas. Ahora son
  cuatro del banco real de la entrevista V3 (abajo, tanda 4), ninguna de amor.

---

## Tanda 1 — /viaje (1 de 2)

| # | Dónde | España (vosotros a los que viajan, tú a quien paga) | Argentina (vos) | De dónde sale |
|---|---|---|---|---|
| 1 | Bajada de arriba | Un biógrafo que viaja con vosotros por WhatsApp. Os pregunta por el día, guarda vuestras fotos con su historia y, al volver, vuestro viaje es un libro. Cada ciudad, un capítulo. | Un biógrafo que viaja con vos por WhatsApp. Te pregunta por el día, guarda tus fotos con su historia, y al volver, tu viaje es un libro. Cada ciudad, un capítulo. | /viaje de hoy, sin «cada noche» (B24) y sin los dos puntos |
| 2 | Botón de compra (arriba, precio y cierre) | Empezar el libro del viaje | Empezar mi Vitácora de viaje (el de hoy) | España: maqueta LandingViaje* |
| 3 | Paso 1 | **Os pregunta por el día** · Cuando el día ha terminado, vuestro biógrafo os escribe por WhatsApp. Lo mejor del día, alguien que conocisteis, lo que salió distinto del plan. Le respondéis con un audio, como a un amigo. | **Te pregunta por el día** · Cuando el día terminó, tu biógrafo te escribe por WhatsApp. Lo mejor del día, alguien que conociste, lo que salió distinto del plan. Le respondés con un audio, como a un amigo. | /viaje de hoy; el título era «Cada noche te pregunta» |
| 4 | Paso 2 | **Le mandáis la foto del día** · Una foto y qué estaba pasando cuando la hicisteis. Queda guardada en su etapa, con vuestra historia al lado. Podéis mandar más cuando queráis. | (igual que hoy) **Le mandás la foto del día** · Una foto y qué estaba pasando cuando la sacaste… | /viaje de hoy |
| 5 | Paso 3 | **Al volver, vuestro viaje es un libro** · Cada ciudad, un capítulo. Se lee y se escucha en la web, y tenéis un enlace para compartirlo con vuestra gente. | (igual que hoy) **Al volver, tu viaje es un libro** · …y tenés un link para compartirlo con tu gente. | /viaje de hoy |
| 6 | La frase grande | Las fotos quedan. Lo que vivisteis, también. | Las fotos quedan. Lo que viviste, también. | el cierre de /viaje de hoy |
| 7 | Título del precio | Un precio por viaje, no por día. | Un precio por viaje, no por día. | /viaje de hoy decía «no por noche»: lo cambié por B24 |
| 8 | Texto del precio | Lo pagas una vez, antes de salir. Incluye el viaje entero, vuestras fotos, el libro para leer y escuchar en la web y el enlace para compartirlo. El impreso y el marco se suman si queréis. | Lo pagás una vez, antes de salir. Incluye el viaje entero, tus fotos, el libro para leer y escuchar en la web, y el link para compartirlo. El impreso y el marco se suman si querés. | /viaje de hoy; «todas las noches» → «el viaje entero»; «el impreso se suma después» → «el impreso y el marco se suman» (la compra de Viaje ya los ofrece al comprar) |
| 9 | Pregunta | **¿Y si todavía no tenemos todas las fechas?** · Ponéis lo que sabéis. Las etapas sin fecha se completan después desde tu panel, y si aparece una ciudad nueva, se añade ahí. | **¿Y si todavía no tengo todas las fechas?** · Cargás lo que sabés… la agregás ahí. | /viaje de hoy, sin «las noches que faltan se acomodan solas» |
| 10 | Pregunta | **¿Cuántas fotos podemos mandar?** · Las que queráis, por WhatsApp, cuando queráis. Para el libro impreso, al volver os pedimos las mejores en su tamaño original. | (igual que hoy) | /viaje de hoy |

## Tanda 2 — /viaje (2 de 2) y lo común de las landings

| # | Dónde | España | Argentina | De dónde sale |
|---|---|---|---|---|
| 11 | Pregunta | **¿Cuándo llega el libro?** · Cuando volvéis, vuestro biógrafo os hace una última pregunta, por si faltó algo, y con eso escribe el libro. Lo leéis en la web a los pocos días. | **¿Cuándo llega el libro?** · Cuando volvés, tu biógrafo te hace una última pregunta, por si faltó algo, y con eso escribe el libro. Lo leés en la web a los pocos días. | /viaje de hoy, sin las rayas («—¿faltó algo?—») |
| 12 | Pregunta, solo catalán | «En quina llengua us escriu? En castellà. El biògraf de viatge encara no escriu en català.» | — | nuevo: el bot de Viaje no habla catalán |
| 13 | Enlace del cierre | ¿Buscas el libro de una vida? Vitácora Familiar → | ¿Buscás el libro de una vida? Vitácora Familiar → (el de hoy) | /viaje de hoy |
| 14 | Título de la pestaña y descripción de /viaje | Vitácora de Viaje — En cada viaje hay un libro sin escribir · Un biógrafo os acompaña por WhatsApp durante el viaje, guarda vuestras fotos con su historia y, al volver, vuestro viaje es un libro. | …Tu biógrafo te acompaña por WhatsApp durante el viaje, guarda tus fotos con su historia y, al volver, tu viaje es un libro. | nuevo (la de hoy decía «cada noche») |
| 15 | Sin precio de Viaje cargado | Próximamente | Próximamente | /viaje de hoy |
| 16 | Botón chico de la cabecera de las landings | Comprar | Comprar | maqueta |
| 17 | Título de la sección del libro 3D | Así queda su libro. | Así queda su libro. | maqueta |
| 18 | Pie de la foto del hotel (texto alternativo) | Una mujer graba un audio sentada en la cama de un hotel, con la maleta abierta y los tejados de Lisboa por la ventana | …con la valija abierta y los techos de Lisboa… | nuevo (solo lectores de pantalla) |
| 19 | Texto alternativo del libro del viaje | El libro de un viaje a Lisboa y Oporto sobre una mesa, junto a una vela | igual | nuevo (solo lectores de pantalla) |

## Tanda 3 — Landing «Un regalo para tu padre» (`/regalo-para-tu-padre`, `/ar/regalo-para-tu-papa`)

**Titular (elige uno):**

| | España | Argentina | De dónde sale |
|---|---|---|---|
| **A (recomendado)** | El regalo que no va a acabar en un cajón. | El regalo que no va a terminar en un cajón. | maqueta LandingRegalo |
| B | Este año, regálale algo que no se compra hecho. | Este año, regalale algo que no se compra hecho. | adaptado de la portada («algo que no se puede comprar hecho») |
| C | Regálale la historia de su vida. | Regalale la historia de su vida. | nuevo |

| # | Dónde | España | Argentina | De dónde sale |
|---|---|---|---|---|
| 20 | Etiqueta de arriba | Un regalo para tu padre | Un regalo para tu papá | maqueta |
| 21 | Bajada | Le preguntamos por su vida por WhatsApp, él contesta con audios y tú recibes el libro de su vida, con su voz dentro. | …y vos recibís el libro de su vida, con su voz adentro. | maqueta |
| 22 | Botón | Regalarle su libro | Regalarle su libro | maqueta |
| 23 | Título de los pasos | Tú eliges el día. Él cuenta su vida. | Vos elegís el día. Él cuenta su vida. | maqueta |
| 24 | Paso 1 (título; el texto es el aprobado) | Eliges el día | Elegís el día | maqueta |
| 25 | Título de la tarjeta | Una tarjeta para dárselo en mano. | Una tarjeta para dársela en mano. | maqueta |
| 26 | Texto de la tarjeta | Al comprar te llega una tarjeta lista para imprimir o mandar por WhatsApp. Así tiene algo que abrir ese mismo día. | igual | maqueta, sin «aunque el libro llegue después» |
| 27 | Pie de la tarjeta de muestra | Así es la tarjeta. Los nombres son de ejemplo. | igual | nuevo (avisa que Osvaldo y Laura son de ejemplo) |
| 28 | Título de las preguntas | Lo que suele preguntar quien regala. | igual | maqueta |
| 29 | Cierre | Este año, regálale su historia. | Este año, regalale su historia. | maqueta |

## Tanda 4 — Landing «Lo que nunca le preguntaste» (`/lo-que-nunca-le-preguntaste`)

**Titular (elige uno):**

| | España | Argentina | De dónde sale |
|---|---|---|---|
| **A (recomendado)** | ¿Qué sabes de tu padre antes de que fuera tu padre? | ¿Qué sabés de tu papá antes de que fuera tu papá? | maqueta LandingPreguntas |
| B | Lo que nunca le preguntaste, por fin en un libro. | igual | portada («Para tu padre») |
| C | Hay preguntas que un día ya no se pueden hacer. | igual | portada (cierre) |

| # | Dónde | España | Argentina | De dónde sale |
|---|---|---|---|---|
| 30 | Etiqueta | Lo que nunca le preguntaste | igual | maqueta |
| 31 | Bajada | Dónde jugaba de pequeño, su primer trabajo, cómo era su pueblo. Nosotros le preguntamos, él lo cuenta con audios y tú lo lees en su libro. | Dónde jugaba de chico, su primer trabajo, cómo era su barrio. Nosotros le preguntamos, él lo cuenta con audios y vos lo leés en su libro. | maqueta («de niño» → «de pequeño»; en AR «barrio») |
| 32 | Botón | Empezar su libro | igual | maqueta |
| 33 | Título de las preguntas | Preguntas que nunca le hiciste. | igual | maqueta |
| 34 | Las cuatro preguntas | ver abajo | ver abajo | **banco real de la entrevista V3** |
| 35 | Debajo de las preguntas | Son preguntas de la entrevista de verdad. Le llegan por WhatsApp, de una en una, y él contesta con audios cuando quiere. | …de a una… | maqueta + «de verdad» (nuevo) |
| 36 | Título de cómo funciona | Él habla. Nosotros escribimos. | igual | maqueta |
| 37 | Título de las preguntas frecuentes | Antes de regalarlo. | igual | maqueta |
| 38 | Cierre | Pregúntale ahora. Léelo siempre. | Preguntale ahora. Leelo siempre. | maqueta |

**Las preguntas (34)**, cada una con el capítulo encima. Salen del banco vigente (solo lectura),
se muestra el comienzo y los dos puntos pasan a punto, como en las que aprobaste para la portada
el 11/10. Ninguna de amor.

| ID | Capítulo | España (`docs/v3/entrevista/banco-es-ES.md`) | Argentina (`docs/v3/entrevista/banco.md`) |
|---|---|---|---|
| OR2 | Las raíces | En todas las familias hay una historia de los de antes que se contaba en las sobremesas. Un viaje, una llegada, alguna hazaña. ¿Cuál sabes de tu familia? | …¿Cuál sabés de tu familia? (es el texto aprobado el 11/10 para la portada) |
| CA1 | La infancia | Cuéntame el primer recuerdo que tengas de la casa donde creciste. Un día, qué estabas haciendo, quién andaba por ahí. | Contame el primer recuerdo… (aprobado el 11/10) |
| ES7 | La infancia | ¿Qué querías ser de mayor? ¿De dónde te vino esa idea? | ¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea? |
| TR1 | El oficio | ¿Te acuerdas de la primera vez que ganaste algo de dinero, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? | ¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías? |

El catalán sale de `docs/v3/entrevista/banco-ca.md` (mismos IDs). Un test
(`web/test/landings.test.tsx`) comprueba que cada pregunta sigue estando en su fila del banco.

## Tanda 5 — Landing «Su voz» (`/su-voz`)

**Titular (elige uno):**

| | España | Argentina | De dónde sale |
|---|---|---|---|
| **A (recomendado)** | Su historia, contada con su voz. | igual | maqueta LandingVoz |
| B | Que su voz se quede en casa. | igual | maqueta (cierre) |
| C | No es un libro mudo. | igual | maqueta |

| # | Dónde | España | Argentina | De dónde sale |
|---|---|---|---|---|
| 39 | Etiqueta | Su voz, guardada | igual | maqueta |
| 40 | Bajada | Su libro lleva sus mejores frases con su voz real. Para ti, para tus hijos y para cuando quieras volver a oírle. | …Para vos, para tus hijos y para cuando quieras volver a escucharlo. | maqueta, sin «Cada libro lleva un código» (el PDF no lleva código; el impreso sí) |
| 41 | Botón | Guardar su voz | igual | maqueta |
| 42 | Título de la voz | No es un libro mudo. | igual | maqueta |
| 43 | Debajo de la onda quieta | Una frase de ejemplo, de una historia inventada. En su libro, suena su voz. | igual | nuevo (no hay audio de muestra, P1) |
| 44 | Título de los pasos | Tres pasos y su voz queda guardada. | igual | maqueta |
| 45 | Título de las preguntas | Sobre su voz. | igual | maqueta |
| 46 | Cierre | Que su voz se quede en casa. | igual | maqueta |

## Tanda 6 — Landing de Viaje (`/el-libro-del-viaje`)

**Titular (elige uno):**

| | España | Argentina | De dónde sale |
|---|---|---|---|
| **A (recomendado)** | Las fotos se quedan. Lo que pasó, se olvida. | Las fotos quedan. Lo que pasó, se olvida. | maqueta LandingViajeOlvida |
| B | Volved con algo más que fotos. | Volvé con algo más que fotos. | maqueta LandingViajeVolver |
| C | Que este viaje no se olvide. | igual | maqueta LandingViajeOlvida (cierre) |

| # | Dónde | España | Argentina | De dónde sale |
|---|---|---|---|---|
| 47 | Bajada | El sitio donde cenasteis, lo que os hizo reír, lo que dijo el camarero. Lo contáis con un audio al final del día y queda en vuestro libro. | El lugar donde cenaste, lo que te hizo reír, lo que dijo el mozo. Lo contás con un audio al final del día y queda en tu libro. | maqueta; «esa misma noche» → «al final del día» (B24) |
| 48 | Título de lo que queda | Más que un álbum. | igual | maqueta |
| 49 | Lo que queda (tres líneas) | Cada ciudad, un capítulo · Vuestras fotos, junto a su historia · Se lee y se escucha en la web | …Tus fotos… | maqueta + /viaje de hoy; sin «vuestras voces» (hoy cuenta uno solo) ni «una escapada o un mes» |
| 50 | Título de los pasos | Un audio y una foto. El resto, nosotros. | igual | maqueta |
| 51 | Pasos | **Os llega un mensaje** · Por WhatsApp, mientras estáis de viaje. **Contestáis con un audio** · Cuando os venga bien, sin escribir nada. **Al volver, el libro** · Con vuestras palabras, vuestras fotos y vuestra voz. | **Te llega un mensaje** · …mientras estás de viaje. **Contestás con un audio** · Cuando te venga bien… **Al volver, el libro** · Con tus palabras, tus fotos y tu voz. | maqueta («cuando estáis de viaje» → «mientras») |
| 52 | Título de las preguntas | Antes de comprarlo. | igual | maqueta (las preguntas son las de /viaje) |
| 53 | Cierre | Que este viaje no se olvide. | igual | maqueta |

Títulos de pestaña de las landings (nuevos, mismo molde): «Un regalo para tu padre · Vitácora
Familiar» (AR «…tu papá…»), «Lo que nunca le preguntaste · Vitácora Familiar», «Su voz, guardada ·
Vitácora Familiar», «El libro del viaje · Vitácora de Viaje»; la descripción es la bajada de cada
una.
