# Textos de la web para la entrevista V3 — propuesta

**Qué es.** El inventario de todos los textos que ve un cliente (web, compra, legales, mails) que chocan con las decisiones de Naza del 05 y 06/10/2026, y una propuesta de reemplazo para cada uno. Solo texto visible; nada de código. El texto actual está copiado exacto para buscar y reemplazar.

**Fecha.** 06/10/2026. Rama `web-textos-v3`.

**Las siete reglas.**
1. La entrevista no promete cantidad de preguntas ni tiempo. Una pregunta por vez, por WhatsApp; responde con audios cuando quiere y a su ritmo; cuando termina de contar sale la siguiente, hasta completar la historia de su vida.
2. No hay audiolibro ni voz clonada. Lo que existe es «Su voz»: sus mejores frases, cada una con un QR que hace sonar el audio real, y una página web donde se escuchan.
3. El anticipo "a la tercera respuesta / desde el tercer día" sale, y no se reemplaza por otro plazo.
4. Al comprador se le habla de vos, siempre. Sin usted.
5. Quien recibe el regalo puede ser hombre o mujer. Nada de "él".
6. PDF e impreso: lo que diga el código. Verificado abajo.
7. Viaje y Kids no entran.

**Regla 6, verificada en el código** (`web/src/lib/productos.ts`, `precios.ts`, `comprar/formulario.tsx`): el producto base es **«El libro en PDF + Su voz» y va siempre en el carrito**, no se puede sacar (`CARRITO_VACIO` trae `base: "pdf"`; el checkout lo muestra como «incluido»). El libro impreso se **suma** (el primero paga un adicional, cada copia extra un precio fijo) y es **siempre a color** desde el 21/09. Los marcos se suman **solo si hay libro impreso** (viajan juntos; `validarCarrito` lo rechaza si no). El audiolibro no existe desde el 21/09. Entonces, todo texto que diga "PDF o impreso", "elegís uno de los dos", "al menos uno", "blanco y negro", o "los marcos se suman a cualquiera" está mintiendo.

**Cómo leer las tablas.** `#` numera por archivo. `archivo:línea` es la línea donde empieza el texto en la rama de hoy. En «texto actual» va lo que hay, exacto; cuando un texto ocupa más de una línea en el código lo pego unido con espacios, como lo ve la persona. Las partes variables (`{nombre}`, `${quien}`) quedan tal cual.

---

## web/src/app/layout.tsx

Sin cambios. La descripción y el Open Graph no prometen plazos ni cantidades, y «con sus mejores frases en su propia voz» es exactamente «Su voz».

---

## web/src/app/page.tsx (la landing)

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | page.tsx:76 | Lo anotas | Lo anotás | vos |
| 2 | page.tsx:78 | Nos dices su nombre, su WhatsApp y a qué hora prefiere conversar. Le llega un mensaje nuestro contándole que lo anotaste — y no empieza nada hasta que él diga que sí. Si no acepta, te devolvemos el dinero. | Nos decís su nombre, su WhatsApp y a qué hora prefiere que le escribamos. Le llega un mensaje nuestro contándole de qué se trata, y no empieza nada hasta que diga que sí. Si no acepta, te devolvemos el dinero. | vos; "lo anotaste" y "él" tienen género. Lo de la hora depende de la decisión 2 |
| 3 | page.tsx:81 | Él solo manda audios | Solo manda audios | género |
| 4 | page.tsx:83 | Cada mañana le llega una pregunta por WhatsApp. La contesta con un audio, como hace todos los días. Sin apps, sin nada que instalar ni aprender. | Le llega una pregunta por WhatsApp. La contesta con un audio cuando quiere, como hace todos los días, y cuando termina de contar le llega la siguiente. Sin apps, sin nada que instalar ni aprender. | "cada mañana" promete un ritmo |
| 5 | page.tsx:88 | Con sus respuestas, el biógrafo escribe el libro de su vida. Tú lo ves crecer desde el tercer día, mucho antes de que termine. | Con sus respuestas, el biógrafo escribe el libro de su vida. Vos lo ves crecer desde tu panel, mucho antes de que termine. | tercer día; vos |
| 6 | page.tsx:95 | Él solo habla por WhatsApp. Nadie escribe nada. | Solo habla por WhatsApp. Nadie escribe nada. | género |
| 7 | page.tsx:98 | Lo lees crecer mientras él responde. | Lo leés crecer mientras responde. | vos; género |
| 8 | page.tsx:110 | Le pedimos permiso antes de empezar y él decide. Puede parar cuando quiera y retomar cuando quiera. Y a muchos les cambia el ánimo cuando entienden que es para sus nietos, no para lucirse. | Le pedimos permiso antes de empezar, y la decisión es suya. Puede parar cuando quiera y retomar cuando quiera. Y a muchos les cambia el ánimo cuando entienden que es para sus nietos, no para lucirse. | género |
| 9 | page.tsx:120 | Son 30 preguntas, no 30 días de calendario: si un día no contesta, la pregunta espera. Y con diez respuestas ya se puede hacer un libro. | No hay calendario. Si un día no contesta, la pregunta espera, y cuando retoma la entrevista sigue donde quedó. Y aunque cuente poco, el libro se hace igual, más corto. | 30 preguntas / 30 días; el "diez" no coincide con el código (ver decisión 5) |
| 10 | page.tsx:125 | Se paga una sola vez, al comprar, y los precios están a la vista antes de pagar: elegís el libro en PDF, el impreso, o los dos. Si él no acepta participar, nos escribes y te devolvemos el dinero completo. | Se paga una sola vez, al comprar, y los precios están a la vista antes de pagar. El libro en PDF con «Su voz» va siempre, y el impreso y los marcos se suman si querés. Si no acepta participar, nos escribís y te devolvemos el dinero completo. | regla 6; vos; género |
| 11 | page.tsx:130 | Sí: es uno de los dos formatos, y se puede elegir al comprar o sumar después desde tu panel, con el libro ya terminado. | Sí. Se suma al comprar o después, desde tu panel, con el libro ya terminado. Tapa dura, a color, con un código en la contratapa que hace sonar su voz. | regla 6 ("uno de los dos formatos") |
| 12 | page.tsx:333 | Tienes el teléfono lleno de fotos suyas y ni una sola de sus historias. La cara la guarda el celular. La voz, lo que vivió y cómo lo cuenta, no la guarda nadie. | Tenés el teléfono lleno de fotos suyas y ni una sola de sus historias. La cara la guarda el celular. La voz, lo que vivió y cómo lo cuenta, no la guarda nadie. | vos |
| 13 | page.tsx:349 | Él no tiene que aprender nada. | No tiene nada que aprender. | género (título de sección) |
| 14 | page.tsx:380 | Una pregunta por la mañana, a la hora que él prefiera. Contesta hablando, apretando el micrófono como hace con sus hijos. Si un día no puede, la pregunta espera. | Una pregunta por vez, por WhatsApp. Contesta hablando, apretando el micrófono como hace con sus hijos, cuando quiere y a su ritmo. Si un día no puede, la pregunta espera. | "por la mañana"; género |
| 15 | page.tsx:384 | Las preguntas van de la infancia a la sabiduría, en ocho capítulos. Las primeras son fáciles; las últimas, las que nadie se anima a hacer en la mesa. | Las preguntas van de la infancia a hoy, hasta completar la historia de su vida. Las primeras son fáciles; las últimas, las que nadie se anima a hacer en la mesa. | "ocho capítulos" es una cantidad fija de la entrevista vieja (ver decisión 6) |
| 16 | page.tsx:407 | Desde el tercer día | Mientras cuenta | tercer día (folio de la sección) |
| 17 | page.tsx:408 | No te lo imaginas: lo vas leyendo. | No te lo imaginás. Lo vas leyendo. | vos; dos puntos |
| 18 | page.tsx:410 | A la tercera respuesta te llega un correo con un minuto de su voz y las primeras páginas ya escritas: la portada con su nombre, el índice de su libro y su primera página, con sus palabras y sus modos de decir. | Apenas empieza a contar, en tu panel aparecen sus primeros audios y las primeras páginas escritas. La portada con su nombre, el índice de su libro y su primera página, con sus palabras y sus modos de decir. | el anticipo a la tercera respuesta sale, sin otro plazo |
| 19 | page.tsx:415 | Y desde tu panel lo ves crecer día a día, mucho antes de que esté terminado. No hay que esperar un mes a ciegas. | Y desde tu panel lo ves crecer a medida que cuenta, mucho antes de que esté terminado. No hay que esperar a ciegas. | "día a día", "un mes". La negrita queda sobre la primera frase, igual que hoy |
| 20 | page.tsx:507 | De él vas a tener fotos. Con esto, lo que decía. | Fotos suyas vas a tener. Con esto, también lo que decía. | género (título de «Su voz») |
| 21 | page.tsx:607 | Es lo que sale hoy un libro de preguntas que él tendría que llenar a mano. Aquí lo cuenta hablando, y le queda su voz grabada. | Es lo que sale hoy un libro de preguntas para llenar a mano. Acá lo cuenta hablando, y le queda su voz grabada. | género; "aquí" no es de acá |
| 22 | page.tsx:627 | Siempre: las 30 preguntas del biógrafo, el anticipo a la tercera respuesta y el panel para verlo crecer | Siempre: la entrevista entera del biógrafo, hasta completar su historia, y el panel para verlo crecer | 30 preguntas; anticipo |
| 23 | page.tsx:637 | Si él no acepta participar, te devolvemos el dinero completo. Los marcos con su voz se suman a cualquiera. | Si no acepta participar, te devolvemos el dinero completo. Los marcos con su voz se suman al libro impreso. | género; los marcos solo van con impreso (código) |
| 24 | page.tsx:653 | Hay quien no lo hace por un padre ni por un abuelo, sino por sus propios hijos: quiere dejar contado de dónde viene, antes de que empiece otra etapa. Funciona igual — las preguntas te llegan a ti, y el libro es el de tu vida. | Hay quien no lo hace por un padre ni por un abuelo, sino por sus propios hijos. Quiere dejar contado de dónde viene, antes de que empiece otra etapa. Funciona igual, las preguntas te llegan a vos, y el libro es el de tu vida. | vos; dos puntos |

Se quedan como están, porque no chocan: el hero (línea 284), las garantías 2 y 3, la FAQ "¿Mi papá va a saber usarlo?" (105, "como hace todos los días" habla de costumbre, no de ritmo), "¿Quién escucha sus audios?" (115), los tres formatos (69–71), el párrafo de «Su voz» (509–513), diciembre (528–547) y lo que se hereda (560–567). La sección de viaje (424–460) tiene "contigo" y "cada noche", pero es viaje y no entra.

---

## web/src/app/maquetas.tsx (las piezas dibujadas de la landing)

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | maquetas.tsx:109 | Día {dia} · 9:30 | Hoy · 9:30 | "Día 1" / "Día 12" cuentan días de calendario (se ve en el hero y en la sección 02) |
| 2 | maquetas.tsx:135 | Qué lindo eso del patio con la parra. Mañana le pregunto por sus padres. | Qué lindo eso del patio con la parra. Cuando quiera, seguimos con sus padres. | "mañana" promete una por día; la nueva muestra el ritmo de V3 |
| 3 | maquetas.tsx:299 | 11 de 30 respuestas | 11 respuestas | 30 preguntas |
| 4 | maquetas.tsx:316 | Día {r.dia} · {r.capitulo} | {r.capitulo} | "Día 11", "Día 10", "Día 9". Como las tres filas dicen «La juventud», conviene variar el capítulo de cada fila en los datos de la maqueta (por ejemplo «La juventud», «El amor», «El oficio») para que no se vean tres filas iguales. Roberto es ficticio, así que no hay problema |
| 5 | maquetas.tsx:322 | El panel: 11 de 30 respuestas, 34 minutos de su voz. | El panel: 11 respuestas, 34 minutos de su voz. | 30 (texto para lectores de pantalla) |
| 6 | maquetas.tsx:338 | · día 3 | · hoy | tercer día (la maqueta del mail) |
| 7 | maquetas.tsx:342 | {NARRADOR} ya contó sus primeras tres historias | {NARRADOR} ya empezó a contar | tercera respuesta |
| 8 | maquetas.tsx:344 | Te dejamos la portada, el índice de su libro y la primera página escrita. Y un minuto de su voz, para que lo escuches contarlo. | Ya tiene portada, índice y la primera página escrita. Y su voz, para que lo escuches contarlo. | "un minuto" era el anticipo |
| 9 | maquetas.tsx:348 | Leer el anticipo → | Ver el libro → | anticipo |
| 10 | maquetas.tsx:350 | El mail del anticipo, a la tercera respuesta. | El mail que avisa que empezó a contar. | anticipo (lectores de pantalla) |

La barra de progreso al 37 % (306) acompaña al "11 de 30"; si queda "11 respuestas" sin total, la barra pierde sentido y conviene sacarla (es código, va para Joaquín). Toda la maqueta del mail (filas 6–10) depende de la decisión 4.

---

## web/src/app/cta-sticky.tsx

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | cta-sticky.tsx:64 | Pago único · PDF o impreso | Pago único · PDF con «Su voz» | regla 6: el PDF va siempre, el impreso se suma |

---

## web/src/app/comprar/formulario.tsx (la compra)

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | formulario.tsx:104 | Dinos tu nombre: es lo que él va a leer cuando le escribamos. | Decinos tu nombre. Es lo que va a leer cuando le escribamos. | vos; género; dos puntos |
| 2 | formulario.tsx:105 | Cuéntanos qué eres de él o de ella (hija, nieto...). | Contanos qué sos de esa persona (hija, nieto...). | vos |
| 3 | formulario.tsx:106 | Dinos tu nombre. | Decinos tu nombre. | vos |
| 4 | formulario.tsx:107 | ¿Cómo le dicen en casa? Es como lo vamos a saludar. | ¿Cómo le dicen en casa? Con ese nombre le vamos a escribir. | género |
| 5 | formulario.tsx:178 | No pudimos iniciar el pago. Intenta de nuevo. | No pudimos iniciar el pago. Intentá de nuevo. | vos |
| 6 | formulario.tsx:197 | Sácala o intenta de nuevo. | Sacala o intentá de nuevo. | vos |
| 7 | formulario.tsx:206 | No pudimos iniciar el pago. Revisa tu conexión e intenta de nuevo. | No pudimos iniciar el pago. Revisá tu conexión e intentá de nuevo. | vos |
| 8 | formulario.tsx:235 | Mi papá, mi abuela, mi tío. Yo lo anoto y él cuenta. | Mi papá, mi abuela, mi tío. Yo anoto y la historia la cuenta quien la vivió. | género |
| 9 | formulario.tsx:255 | Elige una de las dos. | Elegí una de las dos. | vos |
| 10 | formulario.tsx:267 | Cuéntanos quién eres. | Contanos quién sos. | vos |
| 11 | formulario.tsx:267 | Cuéntanos de él, o de ella. | Contanos quién va a contar su historia. | vos; sin género |
| 12 | formulario.tsx:270 | Lo justo para presentarnos bien. El resto lo cuenta él. | Lo justo para presentarnos bien. El resto lo va a contar en la entrevista. | género |
| 13 | formulario.tsx:287 | Qué eres de él / ella | Tu vínculo | vos; género (etiqueta; el ejemplo "hija, nieto, sobrina..." ya está en el campo) |
| 14 | formulario.tsx:311 | El número de él, no el tuyo: ahí le van a llegar las preguntas. | Su número, no el tuyo. Ahí le van a llegar las preguntas. | género; dos puntos |
| 15 | formulario.tsx:315 | A qué hora prefiere | A qué hora le escribimos | depende de la decisión 2 |
| 16 | formulario.tsx:319 | Una pregunta por día, siempre a esa hora. | A esa hora le llega el primer mensaje. Después, cada pregunta sale cuando termina de contar la anterior. | "una por día"; depende de la decisión 2 |
| 17 | formulario.tsx:341 | ¿Tienes hijos? | ¿Tenés hijos? | vos |
| 18 | formulario.tsx:390 | él acepte, cuando haya páginas para leer | acepte, cuando haya páginas para leer | género |
| 19 | formulario.tsx:390 | Con ese mismo correo entras a tu panel. | Con ese mismo correo entrás a tu panel. | vos |
| 20 | formulario.tsx:400 | Necesitamos un correo válido: ahí te avisamos de todo. | Necesitamos un correo válido. Ahí te avisamos de todo. | dos puntos |
| 21 | formulario.tsx:418 | El libro en PDF con «Su voz» va siempre: es donde ocurre la magia. El impreso y los marcos se suman si quieres. | El libro en PDF con «Su voz» va siempre. El impreso y los marcos se suman si querés. | vos; "donde ocurre la magia" suena a IA |
| 22 | formulario.tsx:428 | 30 preguntas por WhatsApp, un audio por día | La entrevista entera por WhatsApp, con audios, a su ritmo | 30 preguntas, por día |
| 23 | formulario.tsx:447 | Todo esto es opcional y se puede cambiar después desde tu panel. Si prefieres, baja y paga. | Todo esto es opcional y se puede cambiar después desde tu panel. Si preferís, bajá y pagá. | vos |
| 24 | formulario.tsx:451–464 | Ritmo (el bloque entero: «Una por día», «Dos por día», «Apenas responde», ver guion.ts) | Sacar el bloque. | elegir "una por día" contradice la regla 1 de frente (decisión 3) |
| 25 | formulario.tsx:463 | Además, al terminar cada respuesta el biógrafo le ofrece seguir con la siguiente. Tú también marcas tu ritmo. / Él también marca su ritmo. | Si el bloque de ritmo se queda: «Al terminar cada respuesta, el biógrafo sigue con la siguiente. Vos también marcás tu ritmo.» / «Al terminar cada respuesta, el biógrafo sigue con la siguiente. También marca su ritmo.» | vos; género |
| 26 | formulario.tsx:474 | ¿De qué quieres que le preguntemos más? | ¿De qué querés que le preguntemos más? | vos |
| 27 | formulario.tsx:476 | Elige los que quieras. Las 30 preguntas son las mismas para todos; esto le dice al biógrafo hacia dónde llevarlas cuando le escribe. | Elegí los que quieras. Esto le dice al biógrafo hacia dónde llevar la entrevista cuando le escribe. | vos; 30 preguntas |
| 28 | formulario.tsx:493 | Las fotos que quieras que estén en el libro: de la infancia, de la boda, de los hijos. Después, desde tu panel, las pones en su capítulo, en la tapa o en un marco. Cuantos más píxeles, mejor se imprimen. | Las fotos que quieras que estén en el libro, de la infancia, de la boda, de los hijos. Después, desde tu panel, las ponés en su capítulo, en la tapa o en un marco. Cuantos más píxeles, mejor se imprimen. | vos; dos puntos |
| 29 | formulario.tsx:520 | No empieza nada hasta que diga que sí. Si no acepta, nos escribes y te devolvemos el dinero. | No empieza nada hasta que diga que sí. Si no acepta, nos escribís y te devolvemos el dinero. | vos |
| 30 | formulario.tsx:537 | Al pagar aceptas los | Al pagar aceptás los | vos |
| 31 | formulario.tsx:540 | y nos pides que la entrevista empiece en cuanto el narrador acepte, sin esperar los 14 días de desistimiento: si te arrepientes con la entrevista en marcha, se descuenta la parte ya hecha. | y nos pedís que la entrevista empiece en cuanto el narrador acepte, sin esperar los 14 días de desistimiento. Si te arrepentís con la entrevista en marcha, se descuenta la parte ya hecha. | vos. Revisar con abogado: "la parte ya hecha" ya no tiene una cantidad fija contra la que medirse (ver términos, fila 19) |
| 32 | formulario.tsx:553 | ✓ 30 preguntas, una por día, por WhatsApp | ✓ La entrevista por WhatsApp, a su ritmo | 30 preguntas, por día |
| 33 | formulario.tsx:554 | ✓ Lo lees y lo escuchas en la web, cuando quieras | ✓ Lo leés y lo escuchás en la web, cuando quieras | vos |
| 34 | formulario.tsx:555 | ✓ Si él no acepta, te devolvemos el dinero | ✓ Si no acepta, te devolvemos el dinero | género |

Dos cosas de código, no de texto, que van con esto: en la línea 519 el respaldo `comoLeDicen || "él"` se vería si el apodo quedara vacío (no puede, el paso 2 lo exige), igual conviene pasarlo a `"esa persona"`; y en la línea 433 el carrito se llama con `trato="tu"`, que tiene que pasar a `"vos"` para que las piezas de productos-ui hablen de vos (ver abajo). Los textos "De usted / De vos" (363–364) son el trato que le da el biógrafo al narrador, no al comprador, y se quedan.

---

## web/src/app/comprar/productos-ui.tsx (el carrito)

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | productos-ui.tsx:27 | Añade / Ya tienes / Los marcos viajan con el libro: añade el libro impreso para agregar marcos. | Dejar de usar esta variante en el Familiar (pasar `trato` a `"vos"` en formulario.tsx:433). La variante de vos ya existe en la línea 28 y está bien: «Sumá», «Ya tenés», «Los marcos viajan con el libro: sumá el libro impreso para agregar marcos.» | vos. Si Naza quiere mantener el tú para España, el mecanismo ya está (decisión 1) |

El resto (títulos de los contadores, reglas de precio, ticket) no choca.

---

## web/src/app/comprar/page.tsx y comprar/gracias/page.tsx

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | gracias/page.tsx:38 | En un rato le llega un mensaje nuestro por WhatsApp, contándole que lo anotaste y pidiéndole permiso. No empieza nada hasta que diga que sí. | En un rato le llega un mensaje nuestro por WhatsApp, contándole de qué se trata y pidiéndole permiso. No empieza nada hasta que diga que sí. | "lo anotaste" tiene género |
| 2 | gracias/page.tsx:43 | Te mandamos un correo con todo esto y con cómo entrar a tu panel para seguir el libro día a día. Si no lo ves, mira en promociones o en spam. | Te mandamos un correo con todo esto y con cómo entrar a tu panel para seguir el libro a medida que cuenta. Si no lo ves, mirá en promociones o en spam. | "día a día"; vos |

comprar/page.tsx no cambia (la descripción "Un biógrafo entrevista por WhatsApp y escribe el libro de una vida. Pago único." está bien).

---

## web/src/app/libro/[token]/page.tsx (el link público del libro)

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | libro/[token]/page.tsx:48 | Un biógrafo lo entrevistó durante un mes por WhatsApp y escribió el libro de su vida, con sus mejores frases en su propia voz. Esta es una muestra. | Un biógrafo hizo la entrevista por WhatsApp y escribió el libro de su vida, con sus mejores frases en su propia voz. Esta es una muestra. | "un mes"; "lo entrevistó" tiene género |

El resto ya está de vos y describe bien el impreso (tapa dura, código en la contratapa).

---

## web/src/app/anticipo/[token]/page.tsx (la página a la que lleva el mail de "ya empezó a contar")

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | anticipo/[token]/page.tsx:218 | Él va a seguir contando, una pregunta por día. | Va a seguir contando, a su ritmo. | género; por día |
| 2 | anticipo/[token]/page.tsx:233 | Entras con tu correo y un código de 6 números. | Entrás con tu correo y un código de 6 números. | vos |
| 3 | anticipo/[token]/page.tsx:262 | Puede que esté incompleto. Prueba a abrirlo otra vez desde el correo que te enviamos. | Puede que esté incompleto. Probá abrirlo otra vez desde el correo que te mandamos. | vos |
| 4 | anticipo/[token]/page.tsx:277 | Las primeras páginas aparecen acá en cuanto estén listas. Vuelve a abrir este enlace en un rato. | Las primeras páginas aparecen acá en cuanto estén listas. Volvé a abrir este enlace en un rato. | vos |

"Un minuto de su primera respuesta, con su voz, tal como la grabó." (141) describe lo que la página muestra, no promete un momento; se queda si la página sigue existiendo (decisión 4).

---

## web/src/app/entrar/formulario.tsx (entrar con código)

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | entrar/formulario.tsx:37 | No pudimos enviar el código. Prueba de nuevo en un momento. | No pudimos enviar el código. Probá de nuevo en un momento. | vos |
| 2 | entrar/formulario.tsx:59 | El código no es correcto o ya venció. Revísalo o pide uno nuevo. | El código no es correcto o ya venció. Revisalo o pedí uno nuevo. | vos |
| 3 | entrar/formulario.tsx:76 | Entra | Entrá | vos |
| 4 | entrar/formulario.tsx:104 | Te enviamos un código a {email}. Escríbelo aquí: | Te mandamos un código a {email}. Escribilo acá: | vos |

---

## El panel (web/src/app/tablero/** y web/src/lib/*.ts)

El panel ya habla de vos casi siempre. Lo que choca:

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | tablero/[narradorId]/preguntas/acciones.tsx:480 | El biógrafo propone cinco, con lo que él contó hasta hoy. Vos elegís cuáles entran. | El biógrafo propone cinco, con lo que contó hasta hoy. Vos elegís cuáles entran. | género |
| 2 | tablero/[narradorId]/nombres/acciones.tsx:89 | Todavía no detectamos nombres para revisar. Puedes confirmar igual para seguir adelante — si más adelante aparece alguno, se puede corregir después. | Todavía no detectamos nombres para revisar. Podés confirmar igual para seguir adelante. Si más adelante aparece alguno, se corrige después. | vos |
| 3 | tablero/ui.tsx:90, tablero/riel.tsx:97, tablero/[narradorId]/page.tsx:322 | {respondidas} de {total} respuestas / {respondidas} de {total} | {respondidas} respuestas | el total es 30 (`TOTAL_PREGUNTAS_BASE`) y en V3 no hay total. Es código, va para Joaquín (decisión 8) |
| 4 | lib/guion.ts:33–35 | Una por día · A su hora, todos los días. Es el ritmo que más gente termina. / Dos por día · Una a la mañana y otra a la tarde. Para quien tiene ganas de contar. / Apenas responde · En cuanto termina una, le llega la siguiente. Puede terminar en pocos días. | Sacar el selector (se usa en la compra, paso 5, y en Ajustes del panel). | contradice la regla 1 (decisión 3) |
| 5 | lib/guion.ts:104 | La pregunta es muy larga (máximo 300 letras). Él la lee en el celular. | La pregunta es muy larga (máximo 300 letras). La lee en el celular. | género |
| 6 | lib/guion.ts:199 | Esa foto está en formato HEIC. Exporta la foto como JPG (en el iPhone: Ajustes → Cámara → Formatos → Más compatible) y vuelve a subirla. | Esa foto está en formato HEIC. Exportá la foto como JPG (en el iPhone: Ajustes → Cámara → Formatos → Más compatible) y volvé a subirla. | vos |
| 7 | lib/panel.ts:202 | No pudimos completar la acción. Intenta de nuevo. | No pudimos completar la acción. Intentá de nuevo. | vos |
| 8 | lib/registro.ts:204 | El WhatsApp no parece un número válido. Revísalo e intenta de nuevo. | El WhatsApp no parece un número válido. Revisalo e intentá de nuevo. | vos |

Lo que vi y dejé: en tablero/[narradorId]/leer/page.tsx y lib/productos.ts (`NOMBRE_VOZ`, líneas 50–54) quedan textos de "El audiolibro" y "con su voz / con un narrador / con sus audios", pero solo se muestran para pedidos anteriores al 21/09 que lo compraron; a un cliente nuevo no le aparecen. "lleva 3 días sin responder — un llamadito tuyo ayuda" (tablero/acciones.tsx:49) cuenta un hecho (el aviso salta a los tres días), no promete un ritmo. Lo de "Ya podés leer el capítulo 1" (tablero/page.tsx:88) depende del anticipo (decisión 4).

---

## web/src/lib/productos.ts

Sin cambios de texto. `NOMBRE_PDF`, `DETALLE_PDF`, `DETALLE_IMPRESO` y `DETALLE_MARCO` ya dicen lo correcto (PDF con «Su voz» siempre disponible; impreso tapa dura a color con código; marco con chip). Es la fuente que confirma la regla 6.

---

## web/src/app/legal/terminos/page.tsx

Cambio solo lo que choca. Los cambios de trato (tú → vos) los pongo porque la regla 4 es "en todo", pero no tocan ninguna obligación.

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | terminos/page.tsx:19 | Qué te damos, qué te cobramos, cuándo puedes arrepentirte y de quién es la historia. | Qué te damos, qué te cobramos, cuándo podés arrepentirte y de quién es la historia. | vos |
| 2 | terminos/page.tsx:30 | Vitácora Familiar lo prestan dos personas, una en cada país donde vendemos. Con quién contratas depende de la región que eliges al comprar (la misma que decide la moneda y el medio de pago): | Vitácora Familiar lo prestan dos personas, una en cada país donde vendemos. Con quién contratás depende del país desde el que comprás (el mismo que decide la moneda y el medio de pago): | vos. Además hoy la región no se elige, la decide el país del visitante (2.12). Revisar con abogado |
| 3 | terminos/page.tsx:37 y 40 | Si compras desde | Si comprás desde | vos (dos veces) |
| 4 | terminos/page.tsx:45 | Para cualquier cosa escribe a | Para cualquier cosa escribí a | vos |
| 5 | terminos/page.tsx:53 | Entrevistamos por WhatsApp a la persona que nos indicas (el «narrador»): una pregunta por día durante unos treinta días, que responde con un audio, sin instalar nada. Con sus respuestas escribimos el libro de su vida, en primera persona y con sus propias palabras. | Entrevistamos por WhatsApp a la persona que nos indicás (el «narrador»). Le hacemos una pregunta por vez, responde con audios cuando quiere y a su ritmo, y cuando termina de contar sigue la siguiente, hasta completar la historia de su vida. No hay que instalar nada. Con sus respuestas escribimos el libro de su vida, en primera persona y con sus propias palabras. | por día, treinta días; vos. Revisar con abogado (define el servicio) |
| 6 | terminos/page.tsx:58 | Lo que puedes comprar: | Lo que podés comprar: | vos |
| 7 | terminos/page.tsx:62 | El libro en PDF: se lee en la web, capítulo por capítulo, con las fotos que suba la familia. Incluye «Su voz»: sus mejores frases, recortadas de sus audios originales tal como las dijo, para escuchar en la web y con un código impreso. Está siempre disponible en tu cuenta. | El libro en PDF: es la base y va siempre en la compra. Se lee en la web, capítulo por capítulo, con las fotos que suba la familia. Incluye «Su voz»: sus mejores frases, recortadas de sus audios originales tal como las dijo, para escuchar en la web y con un código impreso. Está siempre disponible en tu cuenta. | regla 6 |
| 8 | terminos/page.tsx:68 | El libro impreso, en blanco y negro o a color: tapa dura, con un código en la contratapa que hace sonar su voz. | El libro impreso, a color: tapa dura, con un código en la contratapa que hace sonar su voz. | blanco y negro no se vende desde el 21/09 |
| 9 | terminos/page.tsx:78 | Hace falta comprar al menos uno de los dos primeros; los marcos se suman a cualquiera. Solo se ofrece lo que tiene precio publicado en tu región. | El libro en PDF va siempre. El impreso se suma, y los marcos solo con el libro impreso, porque viajan juntos. Solo se ofrece lo que tiene precio publicado en tu región. | regla 6 (marcos solo con impreso, según el código). Revisar con abogado |
| 10 | terminos/page.tsx:82 | Desde tu cuenta puedes invitar a familiares para que lean el libro y suban fotos, y compartir una muestra pública (portada, títulos de los capítulos, el primer párrafo y un minuto de audio). La muestra solo existe si tú compartes el enlace. | Desde tu cuenta podés invitar a familiares para que lean el libro y suban fotos, y compartir una muestra pública (portada, títulos de los capítulos, el primer párrafo y un minuto de audio). La muestra solo existe si vos compartís el enlace. | vos |
| 11 | terminos/page.tsx:90 | cuéntaselo a quien se lo regales. | contaselo a quien se lo regales. | vos |
| 12 | terminos/page.tsx:102 | El precio de cada producto aparece antes de pagar, en euros o en pesos según la región que elijas, y es el precio final que pagas. Después del pago te llega un correo para entrar a tu cuenta con un código (sin contraseña) y anotar a tu narrador: su nombre, su WhatsApp y unos pocos datos para que las preguntas le suenen a él. | El precio de cada producto aparece antes de pagar, en euros o en pesos según tu país, y es el precio final que pagás. Al narrador lo anotás antes de pagar, con su nombre, su WhatsApp y unos pocos datos para que las preguntas le suenen propias. Después del pago te llega un correo para entrar a tu cuenta con un código (sin contraseña). | vos; género; además hoy el narrador se anota ANTES de pagar, no después. Revisar con abogado |
| 13 | terminos/page.tsx:111 | Al anotar a alguien nos confirmas que puedes hacerlo y que le va a parecer bien. Antes de la primera pregunta le escribimos por WhatsApp contándole quién lo anotó y le pedimos permiso. | Al anotar a alguien nos confirmás que podés hacerlo y que le va a parecer bien. Antes de la primera pregunta le escribimos por WhatsApp contándole quién nos pidió el libro y le pedimos permiso. | vos; "lo anotó" tiene género |
| 14 | terminos/page.tsx:125 | El ritmo lo pone el narrador: la entrevista dura lo que él tarde en responder, y puedes seguirla desde tu cuenta mientras avanza. Cuando termina, producimos el libro y te avisamos por correo. Antes de darlo por cerrado lo revisas tú: puedes cambiar el título, el orden y los nombres de los capítulos, las fotos de la portada y la contratapa, dejar fuera alguna respuesta y pedir correcciones de lo que no suene a él. | El ritmo lo pone el narrador: la entrevista dura lo que tarde en responder, y podés seguirla desde tu cuenta mientras avanza. Cuando termina, producimos el libro y te avisamos por correo. Antes de darlo por cerrado lo revisás vos: podés cambiar el título, el orden y los nombres de los capítulos, las fotos de la portada y la contratapa, dejar fuera alguna respuesta y pedir correcciones de lo que no suene a su manera de hablar. | vos; género. Este párrafo ya es compatible con V3 |
| 15 | terminos/page.tsx:132 | los marcos se producen después de que apruebas el libro | los marcos se producen después de que aprobás el libro | vos |
| 16 | terminos/page.tsx:140 | Puedes arrepentirte de la compra sin dar explicaciones. Escríbenos a | Podés arrepentirte de la compra sin dar explicaciones. Escribinos a | vos |
| 17 | terminos/page.tsx:141 | o usa el | o usá el | vos |
| 18 | terminos/page.tsx:151 | Al pagar nos pides que la entrevista empiece en cuanto el narrador acepte, sin esperar esos 14 días; si te arrepientes con la entrevista ya en marcha, te devolvemos el precio menos la parte proporcional a las preguntas ya hechas (art. 108.3). | Al pagar nos pedís que la entrevista empiece en cuanto el narrador acepte, sin esperar esos 14 días; si te arrepentís con la entrevista ya en marcha, te devolvemos el precio menos la parte proporcional a lo ya hecho de la entrevista (art. 108.3). | vos. **Revisar con abogado**: sin una cantidad fija de preguntas, "proporcional" necesita otra base de cálculo (por ejemplo, el material ya producido) |
| 19 | terminos/page.tsx:161 | Puedes revocar la compra sin costo alguno y te devolvemos el total. | Podés revocar la compra sin costo alguno y te devolvemos el total. | vos |
| 20 | terminos/page.tsx:175 | Si el narrador no acepta participar, o responde menos de diez preguntas y por eso no hay material para un libro, te devolvemos el importe completo, sin plazo y sin descuento | (sin cambio de texto, pero ver decisión 5: el código dice 15, la FAQ decía 10, acá dice 10) | **Revisar con abogado** y con Naza: un solo número, o una regla sin número |
| 21 | terminos/page.tsx:201 | Anota solo a alguien a quien puedas anotar y que vaya a estar de acuerdo. | Anotá solo a alguien a quien puedas anotar y que vaya a estar de acuerdo. | vos |
| 22 | terminos/page.tsx:203 | Si crees que alguien entró sin permiso, avísanos. | Si creés que alguien entró sin permiso, avisanos. | vos |
| 23 | terminos/page.tsx:210 | Te prometemos que el libro se escribe con las palabras de tu narrador, que para él va a ser fácil —un audio de WhatsApp por día— y que si algo sale mal lo arreglamos o te devolvemos el dinero. | Te prometemos que el libro se escribe con las palabras de tu narrador, que para quien cuenta va a ser fácil —audios de WhatsApp, a su ritmo— y que si algo sale mal lo arreglamos o te devolvemos el dinero. | por día; género. Es una promesa: revisar con abogado |
| 24 | terminos/page.tsx:217 | Por eso el libro no se cierra hasta que lo revisas tú, y por eso te pedimos que lo leas antes de aprobarlo. | Por eso el libro no se cierra hasta que lo revisás vos, y por eso te pedimos que lo leas antes de aprobarlo. | vos |
| 25 | terminos/page.tsx:253 | Cualquier disputa se resuelve en los juzgados de tu domicilio. También puedes acudir a la oficina de consumo de tu comunidad autónoma o a una Junta Arbitral de Consumo; tienes hojas de reclamaciones a tu disposición pidiéndolas por correo. | Cualquier disputa se resuelve en los juzgados de tu domicilio. También podés acudir a la oficina de consumo de tu comunidad autónoma o a una Junta Arbitral de Consumo; tenés hojas de reclamaciones a tu disposición pidiéndolas por correo. | vos (ver decisión 1: este punto es para España) |
| 26 | terminos/page.tsx:258 | Puedes reclamar ante la autoridad de Defensa del Consumidor | Podés reclamar ante la autoridad de Defensa del Consumidor | vos |
| 27 | terminos/page.tsx:265 | En los dos casos conservas siempre los derechos que te da la ley del país donde vives. Antes de cualquier reclamo formal, escríbenos: lo normal es que lo resolvamos en un correo. | En los dos casos conservás siempre los derechos que te da la ley del país donde vivís. Antes de cualquier reclamo formal, escribinos: lo normal es que lo resolvamos en un correo. | vos |

Se queda bien como está el punto 10, "No podemos prometerte cuánto va a querer contar tu narrador ni cuántas preguntas va a responder. Si cuenta poco, el libro sale más corto." (221): es exactamente V3. También el 8 (la historia es de la familia, sin voz sintética), que es «Su voz» bien contado.

---

## web/src/app/legal/privacidad/page.tsx

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | privacidad/page.tsx:35 | El responsable del tratamiento es el titular del servicio en tu región, la que elegiste al comprar: | El responsable del tratamiento es el titular del servicio en tu país, el que corresponde al lugar desde el que compraste: | la región no se elige (2.12). Revisar con abogado |
| 2 | privacidad/page.tsx:49 | Para cualquier cosa sobre tus datos escribe a | Para cualquier cosa sobre tus datos escribí a | vos |
| 3 | privacidad/page.tsx:59 | Quien compra y tiene la cuenta (llamémosla «tú»). | Quien compra y tiene la cuenta (a quien le hablamos de «vos»). | vos; "llamémosla" da género a quien compra |
| 4 | privacidad/page.tsx:65 | Los invitados: familiares a los que invitas a leer el libro y subir fotos. | Los invitados: familiares a los que invitás a leer el libro y subir fotos. | vos |
| 5 | privacidad/page.tsx:76 | De ti: tu nombre, tu correo, la región que elegiste, y qué compraste, cuándo y por qué medio. Tu tarjeta no la vemos nunca: la cobra Stripe o Mercado Pago y a nosotros nos llega solo la confirmación. Cuando entras a tu cuenta guardamos los registros técnicos normales de cualquier web (dirección IP, navegador, hora). | De vos: tu nombre, tu correo, tu país, y qué compraste, cuándo y por qué medio. Tu tarjeta no la vemos nunca: la cobra Stripe o Mercado Pago y a nosotros nos llega solo la confirmación. Cuando entrás a tu cuenta guardamos los registros técnicos normales de cualquier web (dirección IP, navegador, hora). | vos; la región no se elige |
| 6 | privacidad/page.tsx:83 | y los datos que nos das para que las preguntas le suenen a él | y los datos que nos das para que las preguntas le suenen propias | género |
| 7 | privacidad/page.tsx:119 | Para avisarte por correo cómo va (cuando acepta, cuando responde la primera, a mitad de camino, si se queda en silencio, cuando el libro está listo). Es parte del servicio. | Para avisarte por correo cómo va (cuando acepta, cuando responde la primera, si se queda en silencio, cuando el libro está listo). Es parte del servicio. | "a mitad de camino" supone una cantidad fija (ver decisión 7) |
| 8 | privacidad/page.tsx:155 | Manda los correos: el código para entrar, los avisos, el anticipo. | Manda los correos: el código para entrar y los avisos de cómo va el libro. | anticipo |
| 9 | privacidad/page.tsx:156 | Solo si compras el libro impreso o los marcos | Solo si comprás el libro impreso o los marcos | vos |
| 10 | privacidad/page.tsx:167 | Si quieres ver los contratos con un proveedor concreto, pídelos por correo. | Si querés ver los contratos con un proveedor concreto, pedilos por correo. | vos |
| 11 | privacidad/page.tsx:180 | Los audios originales: además, se borran en cuanto tú o el narrador lo pidan, aunque el libro siga en tu cuenta. | Los audios originales: además, se borran en cuanto vos o el narrador lo pidan, aunque el libro siga en tu cuenta. | vos (la frase siguiente ya dice "si pedís": hoy mezcla) |
| 12 | privacidad/page.tsx:186 | Tu cuenta: hasta que pidas cerrarla. Si la cierras, borramos todo lo de arriba. | Tu cuenta: hasta que pidas cerrarla. Si la cerrás, borramos todo lo de arriba. | vos |
| 13 | privacidad/page.tsx:202 | Con nadie, salvo los proveedores de la sección 5 y la familia que tú elijas: los invitados ven el libro y las fotos, y quien abra un enlace de muestra que tú compartiste | Con nadie, salvo los proveedores de la sección 5 y la familia que vos elijas: los invitados ven el libro y las fotos, y quien abra un enlace de muestra que vos compartiste | vos |
| 14 | privacidad/page.tsx:215 | Tú, el narrador y cada invitado pueden pedir en cualquier momento | Vos, el narrador y cada invitado pueden pedir en cualquier momento | vos |
| 15 | privacidad/page.tsx:223 | (o, si eres el narrador, un mensaje por el mismo WhatsApp). Contestamos en un mes como máximo; casi siempre en días. Si crees que no te hicimos caso, puedes reclamar ante la | (o, si sos el narrador, un mensaje por el mismo WhatsApp). Contestamos en un mes como máximo; casi siempre en días. Si creés que no te hicimos caso, podés reclamar ante la | vos ("un mes" acá es el plazo legal de respuesta, no la entrevista: se queda) |
| 16 | privacidad/page.tsx:255 | la que recuerda si prefieres el panel en claro o en oscuro | la que recuerda si preferís el panel en claro o en oscuro | vos |
| 17 | privacidad/page.tsx:268 | tú apruebas el libro antes de que se cierre | vos aprobás el libro antes de que se cierre | vos |

El párrafo de «Su voz» (89–93) dice que no hay voz sintética y que si algún día la hubiera pedirían consentimiento. No choca con la regla 2 (lo dice en condicional), pero como el producto con voz clonada se descartó, es para que Naza decida si se saca la frase "Si algún día ofreciéramos…" (revisar con abogado: el consentimiento de voz se sigue pidiendo por WhatsApp).

---

## web/src/app/legal/arrepentimiento/page.tsx

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | arrepentimiento/page.tsx:34 | Aprieta el botón: se abre un correo a | Apretá el botón: se abre un correo a | vos |
| 2 | arrepentimiento/page.tsx:35 | Completa tu correo de compra y el nombre del narrador, y mándalo. No hace falta que expliques por qué. | Completá tu correo de compra y el nombre del narrador, y mandalo. No hace falta que expliques por qué. | vos |
| 3 | arrepentimiento/page.tsx:45 | Si el botón no te abre el correo, escribe tú a | Si el botón no te abre el correo, escribí vos a | vos |
| 4 | arrepentimiento/page.tsx:70 | si el narrador no acepta participar o responde menos de diez preguntas, te devolvemos todo, siempre. | (sin cambio: va atado a la fila 20 de términos y a la decisión 5) | revisar con abogado |

Lo de España (67), "se descuenta la parte ya hecha", no nombra cantidades y queda; va atado a la fila 18 de términos.

---

## web/src/lib/mail.ts (el mail de acceso y la invitación)

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | mail.ts:78 | En un rato le llega un mensaje nuestro por WhatsApp a tu ${quien}, contándole que lo anotaste y pidiéndole permiso. No empieza nada hasta que diga que sí. Si no acepta, escríbenos y te devolvemos el dinero. | En un rato le llega un mensaje nuestro por WhatsApp a tu ${quien}, contándole de qué se trata y pidiéndole permiso. No empieza nada hasta que diga que sí. Si no acepta, escribinos y te devolvemos el dinero. | género; vos. (La negrita de "No empieza nada hasta que diga que sí." se mantiene) |
| 2 | mail.ts:84 | Cuando conteste su tercera pregunta te avisamos por acá: vas a poder leer sus primeras páginas y escuchar su voz. | Cuando empiece a contar te avisamos por acá, y vas a poder escuchar su voz y leer sus primeras páginas desde tu panel. | tercera pregunta |
| 3 | mail.ts:88 | Para seguir el libro día a día, entra con este mismo correo: | Para seguir el libro a medida que cuenta, entrá con este mismo correo: | día a día; vos |
| 4 | mail.ts:124 | ${quien} te invitó a acompañarlo. Vas a poder escuchar lo que va contando, leer sus páginas a medida que se escriben, sumar preguntas que te gustaría que le hagan, y agregar fotos de cada época. | ${quien} te invitó a seguir el libro. Vas a poder escuchar lo que va contando, leer sus páginas a medida que se escriben, sumar preguntas que te gustaría que le hagan, y agregar fotos de cada época. | "acompañarlo" se lee con género |

El asunto "Listo. Hoy le escribimos a tu ${comoLeDicen}." se queda: "hoy" es el día del pago, no un ritmo.

---

## fabrica/src/mail/anticipo.ts (el mail que hoy sale a la tercera respuesta)

Si el mail se queda (decisión 4), estos son los cambios para que no prometa ni cuente:

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | anticipo.ts:43 | Tu ${quien} ya contó tres cosas. | Tu ${quien} ya empezó a contar. | tercera respuesta |
| 2 | anticipo.ts:74 | Él va a seguir contando. Tú decides si el libro se termina. | Va a seguir contando, a su ritmo. Vos lo vas leyendo desde tu panel. | género; vos; además "Tú decides si el libro se termina" es de cuando se pagaba después (antes del 11/09) |

El asunto "Tu ${comoLeDicen} ya empezó a contar" (17), "La primera pregunta fue esta:" (47), "Te dejamos un minuto de esa respuesta, con su voz, tal como la grabó." (55) y "Con lo que lleva contado ya empezamos su libro…" (65) no prometen un momento: describen lo que el mail trae. Se quedan.

---

## fabrica/src/mail/frases.ts (el recordatorio de las frases de «Su voz»)

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | frases.ts:39 | Las frases de tu ${comoLeDicen}: ¿quieres elegir tú las que se imprimen? | Las frases de tu ${comoLeDicen}: ¿querés elegir vos las que se imprimen? | vos |
| 2 | frases.ts:64 | Se manda a imprimir cuando confirmes esta selección. Échales un vistazo desde tu panel: cambia lo que quieras, y si están bien así, confírmalas tal cual. | Se manda a imprimir cuando confirmes esta selección. Miralas desde tu panel, cambiá lo que quieras, y si están bien así, confirmalas tal cual. | vos ("échales un vistazo" no es de acá). La negrita de la primera frase se mantiene |
| 3 | frases.ts:68 | Si quieres sacar alguna, poner otra en su lugar o cambiar el orden, puedes hacerlo desde tu panel. | Si querés sacar alguna, poner otra en su lugar o cambiar el orden, podés hacerlo desde tu panel. | vos |

"a los 15 días de la entrega" es una regla interna de cuándo sale el mail; el texto no la nombra. Bien.

---

## fabrica/src/mail/hitos.ts (terminó de contar, recordatorios de cierre, libro listo, envío)

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | hitos.ts:56 | Ahora te toca a ti: entra, revisa los nombres y lugares que anotamos, elige el orden de los capítulos y la foto de la tapa, y cierra el libro. | Ahora te toca a vos. Entrá, revisá los nombres y lugares que anotamos, elegí el orden de los capítulos y la foto de la tapa, y cerrá el libro. | vos; dos puntos |
| 2 | hitos.ts:73 | Si no tienes nada que cambiar, entra y ciérralo tal como te lo proponemos: queda perfecto igual. | Si no tenés nada que cambiar, entrá y cerralo tal como te lo proponemos. Queda perfecto igual. | vos |
| 3 | hitos.ts:81 | Si en dos semanas más no lo cierras, lo cerramos nosotros con nuestra propuesta y lo escribimos igual — está en los términos, para que ningún libro quede sin hacer. | Si en dos semanas más no lo cerrás, lo cerramos nosotros con nuestra propuesta y lo escribimos igual. Está en los términos, para que ningún libro quede sin hacer. | vos |
| 4 | hitos.ts:86 | Cerramos el libro de tu ${quien} por ti | Cerramos el libro de tu ${quien} por vos | vos |
| 5 | hitos.ts:99 | Queda ahí para siempre. Entra cuando quieras a leerlo, escucharlo o descargarlo. | Queda ahí para siempre. Entrá cuando quieras a leerlo, escucharlo o descargarlo. | vos |
| 6 | hitos.ts:107 | Son dos minutos: entra y déjanos la dirección de quien lo recibe. Hasta que no esté, no podemos empezar a imprimir. | Son dos minutos. Entrá y dejanos la dirección de quien lo recibe. Hasta que no esté, no podemos empezar a imprimir. | vos |
| 7 | hitos.ts:126 | Acerca el teléfono a los códigos del libro y vas a escuchar su voz contándolo. | Acercá el teléfono a los códigos del libro y vas a escuchar su voz contándolo. | vos |
| 8 | hitos.ts:127 | Si te emocionó, cuéntalo. A otra familia le puede pasar lo mismo. | Si te emocionó, contalo. A otra familia le puede pasar lo mismo. | vos |

"Pasaron treinta días desde que tu ${quien} terminó de contar" (88), "Hace tres días" (64), "Una semana" (70) y "dos semanas" (80) son los plazos reales para cerrar el libro después de la entrevista, no la entrevista. No chocan con la regla 1 y se quedan. El de "libro listo" (98) ya dice «sus mejores frases con su voz real», que es «Su voz».

---

## entrevistador/src/mail/hitos.ts (aceptó, primera respuesta, mitad, silencio)

| # | archivo:línea | texto actual (exacto) | propuesta | por qué |
|---|---|---|---|---|
| 1 | hitos.ts:41 | ${quien} aceptó. Mañana le llega la primera pregunta por WhatsApp. | ${quien} aceptó. Enseguida le llega la primera pregunta por WhatsApp. | "mañana" fija un momento. Confirmar con Joaquín cuándo sale la primera en V3 (decisión 2) |
| 2 | hitos.ts:41 | Mientras tanto, podés repasar el guion y sumar fotos de cada época: | Mientras tanto, podés sumar fotos de cada época: | en V3 no hay un guion fijo para repasar (ver decisión 7) |
| 3 | hitos.ts:50 | ${quien} va por la mitad | (sacar el hito, o redefinirlo) | "la mitad" supone una cantidad fija (decisión 7) |
| 4 | hitos.ts:51 | ${quien} ya contó la mitad de su historia. Es un buen momento para leer lo que hay y, si querés, pedirle que cuente más sobre algo. | Si el hito se queda con otro disparador: «${quien} ya lleva un buen tramo de su historia. Es un buen momento para leer lo que hay y, si querés, pedirle que cuente más sobre algo.» | idem |
| 5 | hitos.ts:56 | ${quien} lleva tres días sin contestar. No pasa nada grave: a veces es el teléfono, a veces las ganas. Un llamado tuyo suele destrabarlo. | ${quien} lleva tres días sin contestar. No pasa nada grave: a veces es el teléfono, a veces las ganas. Un llamado tuyo suele ayudar. | "destrabarlo" tiene género; "tres días" es cuándo salta el aviso, no un ritmo, y se queda |

El de "primera" (45–46) está bien: ya es de vos y no promete nada.

---

## Decisiones para Naza

1. **España, ¿también de vos?** La web es una sola para los dos países; la región solo cambia moneda y pasarela. La regla 4 dice "la web de Argentina va de vos en todo". **Recomiendo vos para todos**, incluidas las legales (que una ley española se cuente de vos no cambia ningún derecho). Si preferís tú para España, el carrito ya tiene el mecanismo (`trato` en productos-ui) pero el resto de la web no, y habría que duplicar todos los textos: mucho para muy poco.

2. **El campo "A qué hora prefiere" (compra, paso 2, y Ajustes del panel).** Con V3 ya no hay una pregunta diaria a esa hora. **Recomiendo dejarlo, con el texto nuevo de las filas 15–16 de formulario** (la hora del primer mensaje; después, a su ritmo), y que Joaquín confirme qué hace V3 con `hora_preferida`. Si no se usa para nada, se saca el campo y la mención de la hora en el paso 1 de la landing (fila 2).

3. **El selector de Ritmo ("Una por día / Dos por día / Apenas responde").** Está en la compra (paso 5) y en Ajustes del panel. Ofrecer "una por día" es prometer lo que la regla 1 prohíbe. **Recomiendo sacarlo** (código, Joaquín). Dejo texto de respaldo por si se queda (formulario, fila 25).

4. **El anticipo.** La promesa en la web sale (hecho, sin reemplazo). Pero el mail de la fábrica a la tercera respuesta, la página /anticipo y la maqueta del mail en la landing siguen existiendo. **Recomiendo**: que el mail siga saliendo (es un lindo momento) pero con el texto "ya empezó a contar", sin número, y sin anunciarlo en ningún lado; la maqueta de la landing queda con las filas 6–10 de maquetas. Si Joaquín decide apagar el mail, se saca la maqueta entera y "Ya podés leer el capítulo 1" del panel.

5. **El mínimo para que haya libro.** La FAQ decía "con diez respuestas ya se puede hacer un libro", los términos dicen "menos de diez preguntas = devolución", y el código del panel dice 15 (`PISO`). **Recomiendo que en la web no haya número** (la FAQ nueva ya no lo tiene) y que en los términos quede uno solo, decidido con el abogado, o una regla sin número ("si no hay material para un libro").

6. **"Ocho capítulos".** La landing lo dice (fila 15) y el índice dibujado muestra ocho. Si V3 arma los capítulos según lo que cuente cada uno, hay que confirmarlo; la propuesta ya no nombra la cantidad, pero el índice de la maqueta sigue mostrando ocho (es un dibujo, puede quedar como ejemplo).

7. **El hito "va por la mitad" y "repasar el guion".** El entrevistador manda un mail a la mitad del guion y otro que invita a repasar el guion. En V3 no hay mitad ni guion fijo. **Recomiendo sacar el hito "mitad"** (o que Joaquín le ponga otro disparador) y sacar "repasar el guion" del mail de aceptó.

8. **Los contadores "11 de 30 respuestas" del panel.** Son código (`TOTAL_PREGUNTAS_BASE = 30`), en tres pantallas más la barra de progreso. **Recomiendo mostrar "11 respuestas" y sacar la barra** hasta que V3 tenga otra forma de decir cuánto falta. Para Joaquín.

---

## Lo que encontré y no supe resolver solo

- **Los términos describen el flujo viejo.** Punto 3 dice que el narrador se anota después de pagar, con el código del correo; hoy se anota antes, en el checkout. Y "la región que eliges" ya no se elige: la decide el país del visitante. Propuse el texto (términos filas 2 y 12, privacidad 1 y 5) pero es para revisar con abogado.
- **Desistimiento en España (términos fila 18).** "Menos la parte proporcional a las preguntas ya hechas" necesitaba un total; sin él, el abogado tiene que decir sobre qué base se descuenta.
- **El párrafo hipotético de voz clonada en privacidad** (89–93). No miente, pero habla de un producto que se descartó. Para Naza y el abogado.
- **Pedidos anteriores al 21/09 con audiolibro.** Siguen mostrando "El audiolibro" en el panel (leer/page.tsx) y `NOMBRE_VOZ` en productos.ts. Solo los ven esas familias; los dejé.
- **La sección de viaje en la home** (page.tsx 424–460) tiene "contigo", "cada noche" y "Le respondes". Es viaje, no entra; lo anoto para el chat de viajes.
- **Admin** (web/src/app/admin, lib/admin) tiene "días", "anticipo", "él", pero lo ven Naza y Joaquín, no clientes. No lo toqué.
- **Las preguntas de ejemplo en las maquetas** ("Cuénteme de la casa donde pasó su infancia…", "Ahora cuénteme ESA historia…") tratan al narrador de usted. Es el trato del biógrafo al narrador (que la familia elige), no al comprador, así que no choca con la regla 4. Si las preguntas de V3 son otras, conviene reemplazarlas por dos reales del banco nuevo.
