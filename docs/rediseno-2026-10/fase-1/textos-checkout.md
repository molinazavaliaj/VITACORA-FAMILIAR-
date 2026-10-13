# Textos nuevos del checkout (fase 1) — para aprobar

Tarea `checkout`: `/comprar`, `/comprar/viaje`, `/regalar` y «Pedido confirmado» (`/comprar/gracias`), en
las tres versiones. Fuente de verdad: `web/src/app/_textos/checkout.ts`, `checkout-viaje.ts`,
`pedido-confirmado.ts`, `regalar.ts`. Acá van solo los textos que **no** son copia literal de
`aprobados.md`, de `POR_TRATO` ni de TEXTOS-Y-REGLAS §5. El catalán (todo) está marcado
`// ca: PENDIENTE REVISIÓN NATIVA` en esos archivos y no se repite acá.

Leyenda del origen: **M** maqueta tal cual · **M~** maqueta adaptada · **A~** aprobado adaptado · **N** nuevo.

## Aprobado por Naza

- **14/10, tanda 2** (todos OK, sin dos puntos): impreso «…El envío está incluido. Te avisamos…»;
  «El marco va con el libro impreso. Elige el impreso para añadirlo.»; «Tu propio libro, sin
  sorpresa ni tarjeta…»; «Así te vamos a saludar.»; las cuatro horas de España; «Un poco más sobre
  su vida (opcional)»; «Pagas con tarjeta en la página segura de Stripe.»; «Falta un teléfono. El
  correo lo pide para entregar el libro.»; «Te mandamos la tarjeta por correo…»; «Dirección de envío
  guardada.» / «…Ponla desde tu panel». Mismo cambio de puntuación aplicado al catalán.

## /comprar

| Dónde | es (tú) | ar (vos) | Origen |
|---|---|---|---|
| Cabecera | Ya he comprado · Entrar | Ya compré · Entrar | es: el de /regalar de tú (aprobado 09/10) |
| Cabecera (solo con `NEXT_PUBLIC_WHATSAPP_DUDAS`) | ¿Dudas? Escríbenos | ¿Dudas? Escribinos | M |
| Pasos | Su libro · Para quién · Pago | igual | M (orden de D3) |
| Paso 1, impreso | El mismo libro, impreso y encuadernado, y también en PDF con su voz. Envío incluido: te avisamos cuando salga de imprenta y te mandamos el seguimiento. | igual | M~ (sin «9 días», D4) |
| Paso 1, marco | Añade un detalle · Su foto enmarcada, junto a su libro. · Un marco con la foto que elijas. Por dentro lleva un chip que no se ve: acercas el móvil al marco y se abre su libro, con su voz. | Sumá un detalle · … acercás el celular … | M~ (sin «negro de 13 × 18 cm»: no está en el código) |
| Paso 1, botón del marco | Añadir el marco · +{precio} / Añadido · +{precio} | Sumar el marco · +{precio} / Sumado · +{precio} | M |
| Paso 1, marco sin impreso | El marco va con el libro impreso: elige el impreso para añadirlo. | … elegí el impreso para sumarlo. | N (regla D4) |
| Paso 1, copias / marcos extra | Copias extra del libro impreso · Marcos adicionales · +{precio} cada uno | igual | A~ (nombres de `productos.ts`) |
| Paso 2, opciones | Mi padre · Mi madre · Mi abuelo · Mi abuela · Otra persona · Para mí | Mi papá · Mi mamá · … | M |
| Paso 2, «Otra persona» | ¿Cómo nos referimos a esa persona en los textos? · Él · Ella · Prefiero no decirlo | igual | M (+ «Prefiero no decirlo», que ya existía) |
| Paso 2, «Para mí» | Tu propio libro: sin sorpresa ni tarjeta. Las preguntas te llegan a ti. | … te llegan a vos. | M |
| Paso 2, ayuda del apodo | Así lo/la va a saludar el biógrafo por WhatsApp. Si tiene un apodo, ponlo. Nada de "papá" ni "abuela". | … ponelo … | A~ (aprobado #4, con «la» si es ella) |
| Paso 2, «Para mí» apodo | Así te vamos a saludar. | igual | N (antes decía «Así lo vamos a saludar») |
| Paso 2, no es regalo | En un rato le llega un mensaje nuestro por WhatsApp, contándole de qué se trata. | igual | A~ (G1, sin «Arranca cuando quiera») |
| Paso 2, regalo sí | Eliges el día en que empieza y te damos una tarjeta para entregárselo. | Elegís el día en que empieza y te damos una tarjeta para dársela. | M |
| Paso 2, tarjeta | Tarjeta de regalo para imprimir · Te la mandamos por correo nada más pagar. La imprimes o la mandas por WhatsApp, y se la das ese día. | … por mail apenas pagás. La imprimís o la mandás … | M~ (como dice el mail de la tarjeta) |
| Paso 2, fecha | Navidad · 24 dic · Otra fecha | igual | M |
| Paso 2, «Para mí» hora | A qué hora te escribimos · A esa hora te llega el primer mensaje. Después, la siguiente te llega cuando terminas de responder la anterior. | … terminás … | A~ (aprobado, en primera persona) |
| Paso 2, horas | Por la mañana (9:00) · A media mañana (11:00) · Por la tarde (16:00) · Al final del día (19:00) | las de `lib/horario.ts` | N (España) |
| Paso 2, desplegable | Un poco más sobre su vida (opcional) / Un poco más sobre ti (opcional) | … sobre vos … | N |
| Paso 3, regalo | Ahí te llega la tarjeta. Con ese mismo correo entras a tu panel. | … entrás … | A~ |
| Paso 3, dirección | Dirección de envío del libro impreso · El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento. · Quién lo recibe · Teléfono · (campos de `lib/entregas.ts`) | igual | M~ + D4 + panel |
| Paso 3, métodos | Pagas con tarjeta en la página segura de Stripe. | Pagás en la página segura de Mercado Pago. | N (ver PENDIENTES F1-C3) |
| Paso 3, letra pequeña | (el desistimiento de hoy) + «Si no quiere hacerlo, te devolvemos el dinero.» / «Para mí»: «Si cambias de idea antes de contestar la primera pregunta, te devolvemos el dinero.» | (lo de hoy) + igual / «Si cambiás…» | D1 |
| Paso 3, botón | Pagar {total} · Procesando… | igual | M + MOTION |
| Errores nuevos | Elige para quién es. · Elige si es un regalo. · Falta el nombre de quien recibe. · Falta un teléfono: el correo lo pide para entregar. | Elegí … | N (los dos últimos, de `/api/entrega`) |
| Pago fallido | Tu banco no ha aceptado el pago. No se te ha cobrado nada. · Probemos otra vez. Suele ser por un límite de la tarjeta o porque el banco pide confirmarlo en su app. Lo que elegiste sigue guardado. | Tu banco no aceptó el pago. No se te cobró nada. · (igual) | M (Casos 2) |
| Resumen | Resumen del pedido · Vitácora Familiar · El libro de {nombre} / Tu libro / Su libro · Para tu padre/madre/abuelo/abuela · Para alguien especial · Para ti | … papá/mamá … Para vos | M |
| Resumen, líneas | Entrevista + libro digital · Libro impreso, tapa dura · Su foto enmarcada · Copia extra del libro impreso · Marco adicional | igual | M |
| Resumen, pie | IVA incluido. Un solo pago, sin suscripciones. | Un solo pago, sin suscripciones. | M (AR sin IVA: POR COMPROBAR) |
| Resumen, incluye | La entrevista por WhatsApp, a su ritmo y con audios · El libro en PDF con «Su voz» · Escuchas sus audios mientras cuenta, desde tu panel | … Escuchás … | M + §5 (sin anticipo) |
| Resumen «Para mí» | … a tu ritmo … · «Tu voz» · Escuchas tus audios desde tu panel | … Escuchás … | N |

## /comprar/viaje

es en vosotros a los que viajan y tú a quien paga; ar de vos como hoy. Sin «cada noche» (B24).

| Dónde | es | ar | Origen |
|---|---|---|---|
| Pasos | Vuestro libro · El viaje · Pago | Tu libro · El viaje · Pago | M~ |
| Paso 1 | ¿Cómo queréis vuestro libro? · Todas las opciones incluyen el viaje entero y el libro en PDF con vuestra voz. · PDF para leer en cualquier pantalla, con vuestros audios a un toque. | ¿Cómo querés tu libro? · … tu voz … tus audios … | M~ (sin «sin límite de días») |
| Paso 1, marco | Vuestra foto del viaje, enmarcada. · Un marco con la foto que elijáis. Lleva un chip escondido: acercáis el móvil y se abre el libro del viaje, con vuestra voz. | Tu foto del viaje … elijas … acercás el celular … tu voz | M~ |
| Paso 2 | Lo que sepáis hoy. Las etapas que no tengan fecha se completan después desde tu panel, y si aparece una ciudad nueva, se añade ahí. · Ahí os escribe el biógrafo durante el viaje. · ¿Con quién viajáis? · ¿Qué queréis que os pregunte siempre? Elegid dos o tres. El resto lo va cambiando el biógrafo. · ¿A qué hora os escribe? · Salida · Vuelta | los de hoy, de vos | A~ (lo de hoy en vosotros) |
| Paso 2, para qué | Para nosotros, como recuerdo · Para compartir con nuestra gente · Para nuestro público (+ detalles en vosotros) | los de `lib/viaje.ts` | A~ |
| Paso 2, ángulos | La gente que conocemos · Lo que comemos · Lo que pensamos de nosotros | los de `lib/viaje.ts` | A~ |
| Paso 2, días | {n} días | igual | A~ (sin «una pregunta por noche», B24) |
| Paso 3 | Te mandamos todo a tu correo. Con ese mismo correo entras a tu panel. · Qué pasa después de pagar: te llega un correo para entrar a tu panel, y el biógrafo os escribe por WhatsApp para presentarse. Respondéis SÍ y empieza. | (el de hoy, de vos) | A~ |
| Garantía | Si el viaje se cancela, te devolvemos el dinero. | igual | D1 |
| Resumen | El libro del viaje · El biógrafo por WhatsApp durante todo el viaje · Vuestras fotos, con su historia, guardadas por día · Cada etapa, un capítulo del libro · Lo leéis y lo compartís desde la web | El libro de tu viaje · … Tus fotos … Lo leés … | A~ (sin «Una pregunta cada noche») |

## «Pedido confirmado» (/comprar/gracias)

| Dónde | es | ar | Origen |
|---|---|---|---|
| Arriba | Pedido confirmado · Ya está. El libro de {nombre} está en marcha. / Ya está. Tu libro está en marcha. | Listo. El libro de {nombre} está en marcha. | M~ (la maqueta pone una fecha de inicio que hoy no se sabe: PENDIENTES F1-C5) |
| Regalo | Te mandamos la tarjeta por correo. Si no la ves, mira en promociones o en spam. | … por mail … mirá … | N |
| Lista, no regalo | Hoy: (G1) · Antes: Avisa a {nombre} de que le va a escribir «Vitácora» por WhatsApp. · Mientras cuenta: (#18) · Al terminar: Cuando termina de contar, el biógrafo escribe su libro. (+ con impreso: Te avisamos cuando salga de imprenta y te mandamos el seguimiento.) | Avisale a {nombre} que … | M~ + aprobados + D4 |
| Lista, regalo | Hoy: Imprime la tarjeta o mándala por WhatsApp, y guárdala hasta el día del regalo. · Ese día: Cuando {nombre} la escanee, empieza su entrevista por WhatsApp. · (#18) · (al terminar) | Imprimí … mandala … guardala … | M~ + mail de la tarjeta |
| Lista, «Para mí» | Hoy: Guarda el contacto «Vitácora» en tu móvil: te escribimos desde ahí. · Mientras cuentas: Desde tu primera respuesta, en tu panel aparecen tus audios. · Al terminar: Cuando terminas de contar, el biógrafo escribe tu libro. | Guardá … celular … contás … terminás … | M~ |
| Viaje (es) | Vuestro biógrafo de viaje se presenta por WhatsApp. Para empezar ya, mandadle un «hola» a {número}: os contesta y os pide el SÍ. / … Cuando os escriba, responded SÍ y empieza. | (el de hoy) | A~ |
| Botones | Descargar la tarjeta de regalo · Ir a mi panel | igual | M |
| Dirección | Dirección de envío guardada. · Falta la dirección de envío del libro impreso. Ponerla desde tu panel | … Cargarla desde tu panel | N |

## /regalar

Los textos de es y ar son los aprobados de `lib/regalo-textos.ts` (sin cambios). Nuevo: la versión
catalana entera (`_textos/regalar.ts`, pendiente de revisión nativa) y el aviso del pago fallido
(el mismo de /comprar, sin «Lo que elegiste sigue guardado»).
