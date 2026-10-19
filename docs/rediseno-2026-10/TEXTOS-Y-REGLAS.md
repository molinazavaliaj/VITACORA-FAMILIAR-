# Textos y reglas de copy

Fuentes, por orden de autoridad:

1. Decisiones de Naza en `docs/web-textos-v3/aprobados.md` (06/10) y en `web/src/app/page.tsx:76-108`
   (`POR_TRATO`, aprobados 13/10). **Mandan sobre las maquetas** cuando chocan.
2. La guía de las maquetas (`maquetas/fuente-dc/Guia.dc.html`, sección «Lo que no cambia») y las
   notas de `canvas.json`.
3. Los textos de cada maqueta.

Si algo de (2) o (3) contradice (1) y Naza no ha vuelto a decidir, se usa (1) y se apunta en
`PENDIENTES.md`.

## 1. Reglas fijas

| Regla | Detalle | Dónde vigilar |
|---|---|---|
| **Español de España, de tú** | «móvil» (no celular), «eliges», «padre» (no papá), «bonito» (no lindo), «vale», «ordenador». En **Viaje, vosotros** («os escribimos», «¿ya estáis en casa?»). | Todo lo nuevo |
| **Pero Argentina sigue** | Cada texto con vos/tú o palabras regionales lleva su versión AR («vos», «celular», «papá», «lindo») siguiendo `POR_TRATO` (`page.tsx:79-108`) y `tratoDeRegion`. Lo que no cambia entre países se escribe una vez. Ver `PENDIENTES.md` B1 por si Naza decide otra cosa. | Portada, checkout, panel, mails (`familias.region`) |
| **Nunca «una pregunta por día» ni «30 días»** | Tampoco «treinta días», «un mes de entrevista», «cada mañana», «30 preguntas», «día 12». Sí: «a su ritmo», «cuando termina de contar le llega la siguiente», «no hay calendario ni apuro». | `README.md:3`, `legal/terminos/page.tsx:53-54`, `admin/familias/page.tsx:73` (interno, puede quedar), `tablero/ui.tsx:54` (`TOTAL_PREGUNTAS_BASE`, solo guion clásico), `maquetas.tsx` («Día {dia}» → «Hoy») |
| **Sin amor** | Ni preguntas ni capítulos de amor en nada público. Capítulos de ejemplo válidos (de las maquetas): La infancia, Las raíces, La juventud, Salir al mundo, El oficio, Los hijos, Las pruebas, La sabiduría. | `maquetas.tsx:21,246,297` («El amor» → sustituir) |
| **La cita de «Su voz» no es de amor: es de la infancia** | (`canvas.json` nota `mejoras` 9). Ejemplo de la maqueta: la parra/el limonero del patio. Naza cambió «parra» por «limonero» el 06/10 porque no conocía «parra»; en España «parra» se entiende. Usar **limonero** en las dos regiones para no tener dos ejemplos. | Portada, SuVoz |
| **Contacto: «Vitácora», cuenta de empresa** | El WhatsApp al narrador llega de «Vitácora» (no «Vitácora Familiar», no un nombre de persona). En la web, «¿Dudas? Escríbenos, te contesta una persona» → WhatsApp de Vitácora (variable `NEXT_PUBLIC_WHATSAPP_DUDAS`, número por decidir, B11) o `hola@` (`legal/titulares.ts`, POR COMPROBAR el dominio). | Portada, checkout, panel |
| **Lemas** | Familiar: «En cada familia hay un libro sin escribir.» Viaje: «En cada viaje hay un libro sin escribir.» Pie: «Para las vidas que merecen su propio libro» (actual, `page.tsx:731`). | Hero, cierre, `layout.tsx` metadata |
| **Marca** | «Vitácora» es la marca paraguas; «Vitácora Familiar», «Vitácora de Viaje» (en las maquetas, «De viaje» en la solapa), «Vitácora Kids» (solo si se lanza). Cabecera: logo + VITÁCORA en Archivo con `letter-spacing .2em`. | Cabeceras |
| **El libro se escribe cuando termina de contar** | Escritor V5.5. No prometer «lo lees mientras se escribe», «capítulos escribiéndose», «lo ves crecer». Sí: «desde la primera respuesta, en tu panel aparecen sus audios»; «cuando termina de contar, el biógrafo escribe su libro». | `Main`/`Movil` paso 2 y «Qué recibes tú», `Resto` «Desde la tercera respuesta», `Panel` capítulos, `Checkout` resumen |
| **El anticipo** | Hoy existe `/anticipo/[token]` y el mail «anticipo» de la fábrica vieja; con la V3 Naza quitó la promesa de la web («No hace falta imaginarlo. Lo vas escuchando»). No escribir «el anticipo tras su tercera respuesta» hasta B4. | `Checkout` lado derecho, `Resto`, `Emails` 3, `Ejemplo` intro, `Panel` línea de tiempo («Anticipo») |
| **Devoluciones y garantías** | Regla de Naza 06/10: **nada de «te devolvemos el dinero» ni «si no acepta…» en textos comerciales**; el desistimiento solo en legales. Las maquetas lo ponen junto a cada botón (ver §3). Hasta que Naza decida (B5): **fuera**. | Hero, precio, checkout, panel «Tu pedido», landings, FAQ «¿Cuánto cuesta…?», «¿Y si empieza y no termina?» |
| **Sin explicar el ánimo del narrador** | Fuera «a muchos les cambia el ánimo cuando entienden que es para sus nietos» (aparece en la FAQ de `Resto`). | FAQ |
| **«Con diez respuestas ya sale un libro, más corto»** | Naza lo quitó de la FAQ el 06/10 (#9). En el código el cierre anticipado exige 10 (`[narradorId]/page.tsx:45`). No usarlo en marketing; en el panel sí puede decir «con lo que ya contó». | FAQ, `Casos` 3 |
| **Reseñas** | `TESTIMONIOS = []` (`page.tsx:168-171`): «la landing NO se publica con reseñas inventadas; se enciende con las cinco reales con permiso por escrito». Las de las maquetas (Laura, Marc, Cristina, padres, viajeros) llevan la etiqueta «RESEÑA DE EJEMPLO»: **no se publican ni con etiqueta**. La sección queda en el código, apagada. | `Main`, `Kids`, `Viaje`, `Emails` 7 |
| **IFEMA Intergift** | Cita «Quien regala hoy busca “regalos con identidad”…» sin fuente verificada: no publicar hasta tener el enlace (Naza). | `Resto` «En diciembre» |
| **Personas de las fotos** | Osvaldo, Nico, Sara, Dani son imágenes generadas. «Historia inventada» en `/ejemplo` se dice en la página. No presentarlas como familias reales ni junto a «Lo que dicen las familias». Decisión de uso: B10. | Portada, landings, `/ejemplo`, panel de demo |
| **Quiénes somos** | Huecos lilas (`Somos [nombres]…`, foto real, ciudad, contacto): solo con el texto de Naza y el socio y una foto real; hasta entonces la sección no se renderiza. | `Resto` |
| **Datos de ejemplo** | Nº de pedido, fechas (24 de diciembre), audios, QR, direcciones (Calle Mayor 12), teléfonos (+34 611 222 333): solo en la preview con datos de prueba; nunca fijos en el código. | Todo |
| **Nombres en los chats** | «Como le escribimos» = `como_le_dicen`, nombre de pila o apodo; nunca «papá», «abuela» (`lib/como-le-dicen.ts`, aprobado #4). El mensaje al narrador lleva el nombre de quien regala («Tu hija Laura te ha regalado…»). | Checkout, panel «Así le va a llegar» |
| **Femenino** | Al elegir madre/abuela o «ella» en «Otra persona», todo pasa a «ella/su»: web, checkout, panel, emails. Ningún texto fijo con «él». En código: `genero` ya existe en el checkout (`GENEROS`); el panel debe leer `contexto.genero`. | Panel, mails de la web |
| **«Para mí»** | Sin regalo ni tarjeta; primera persona: «¿Cómo te llamas?», «¿Cuándo empezamos?», «Tu WhatsApp», «Guarda el contacto “Vitácora” en tu móvil», «Tu libro completo, con tu voz». En el código: `vinculoComprador = "yo mismo"`, `esPropia()`, textos ya en primera persona en el panel (`tituloHistoria(n.nombre, propia)`). Garantía propia («si cambias de idea antes de contestar la primera pregunta»): propuesta, B5. | Checkout paso «Para quién», panel |
| **Trato al narrador** | `¿Cómo le hablamos?` De tú / De vos (/ catalán, ya existe como `idioma`). Por defecto según prefijo: +54/+598 → vos; +34 → tú (editable). | Checkout, `/regalar` |

## 2. Precios y plazos (se calculan, no se escriben)

| Lo que dice la maqueta | De dónde sale en el código | Cómo se escribe |
|---|---|---|
| Digital (entrevista + PDF con su voz): 49 € | `obtenerPrecio(region)` → `PRECIO_EUR`/`PRECIO_ARS` (casa: 49 € / 85 750 ARS) | `formatear(cat.base.precio)` con `Intl.NumberFormat("es-ES"/"es-AR", currency)` (`page.tsx:271`) |
| Impreso tapa dura + digital: 99 € (49 + 50) | `cat.impreso.precio` = `PRECIO_IMPRESO_EUR` (es el **adicional**) | Opción «Libro impreso + digital»: `formatear(cat.base.precio + cat.impreso.precio)`; en el resumen, dos líneas: base y «+ impreso». Sin `PRECIO_IMPRESO_*` la opción no existe. |
| Marco 13 × 18 cm con NFC: +20 € | `cat.marco.precio` = `PRECIO_MARCO_EUR`; `precioAdicional` para el segundo | «Añadir el marco · +{precio}». Regla de carrito: hoy solo con impreso (C3). |
| Copia extra | `PRECIO_COPIA_*` (`precioCopia`) | «Uno para cada hermano»: precio por decidir (B14) → si la variable no está, no se ofrece. |
| Viaje: «mismos precios» | `PRECIO_VIAJE_*` (producto aparte, `obtenerPrecioViaje`) | «Desde {precio} · el viaje entero». Sin variable, la sección va sin número (`page.tsx:284`). |
| Kids: mismos precios | No existe (`PRECIO_KIDS_*` no debe cargarse, `docs/ROADMAP.md` P5) | — |
| «Impreso unos 9 días después de cerrar el libro» | No está en el repo | POR COMPROBAR (B9). Mientras: «Te avisamos por email cuando salga de imprenta, con el seguimiento». |
| «Pago único, IVA incluido, sin suscripciones» | Cierto para ES (Stripe cobra el importe tal cual). En AR, «IVA incluido» → POR COMPROBAR con el socio (facturación AR). | «Pago único. Sin suscripciones.» en las dos; «IVA incluido» solo ES. |
| Promo | `PROMO_PORCENTAJE` → precio de lista tachado (`lib/promo.ts`, `Tachado`) | Se conserva donde esté el precio «desde». |
| Cupón VITACORA10 (−10 %, 7 días) | No existe | B12. No mostrar «¿Tienes un código?» hasta que exista de verdad. |

## 3. Garantías por línea (lo que dicen las maquetas) — SUSPENDIDAS hasta B5

- Familiar: «Si él/ella no quiere hacerlo, te devolvemos el dinero» (si ya ha empezado, se cierra
  con lo que haya, sin devolución).
- Kids: «Si al final no quiere hacerlo, te devolvemos el dinero».
- Viaje: «Si el viaje se cancela, te devolvemos el dinero».
- «Para mí»: «Si cambias de idea antes de contestar la primera pregunta, te devolvemos el dinero»
  (propuesta).
- La guía pide mostrarlas junto a cada botón de compra; la decisión de Naza del 06/10 las prohíbe en
  textos comerciales. Mientras no haya decisión nueva: no se muestran; el código deja un único
  componente `<Garantia linea="familiar" />` que devuelve `null` si `GARANTIA_VISIBLE` no está.
- Lo legal (14 días de desistimiento, «nos pides que la entrevista empiece… sin esperar los 14 días»,
  `comprar/formulario.tsx:520-523`) **se conserva** en el paso de pago y en `/legal/terminos`.
- Argentina: «Botón de arrepentimiento» (Res. 424/2020) se mantiene en el pie y en `/legal/arrepentimiento`.

## 4. Textos ya aprobados que hay que respetar al reescribir la portada

De `docs/web-textos-v3/aprobados.md` (versión AR; la ES está en `page.tsx:94-107`):

- Pasos: «Lo anotás / Lo anotas» · «Solo manda audios» · «El biógrafo escribe».
- «Le llega una pregunta por WhatsApp. La contesta con un audio cuando quiere, como hace todos los
  días, y cuando termina de contar le llega la siguiente. Sin apps, sin nada que instalar ni aprender.»
- «No hay calendario ni apuro. Si un día no contesta, la pregunta lo espera, y cuando retoma, la
  entrevista sigue donde quedó.»
- «Le pedimos permiso antes de empezar la entrevista. Puede parar cuando quiera y retomar cuando quiera.»
- «Solo su familia. Los audios son privados, se usan únicamente para su libro, y se pueden borrar
  todos cuando quiera.» (La versión de `Resto` añade «y el equipo que escribe su libro, con
  herramientas de transcripción y de escritura con IA»: es más honesta y encaja con lo que el bot
  dice al narrador en `Whatsapp` («¿Quién eres?»); proponerla a Naza, B15.)
- Precio: «Se paga una sola vez, al comprar, y los precios están a la vista antes de pagar. El libro
  en PDF con «Su voz» va siempre, y el impreso y los marcos se suman si quieres.»
- «Con esto vas a tener la historia de su vida completa.» (Su voz, texto de Naza.)
- Maquetas de la portada: «Hoy · 9:30», «11 respuestas» (sin barra ni total), «Qué bonito eso del
  patio con el limonero. Cuando quieras, seguimos con tus padres.»
- Mail de ejemplo: «{Nombre} ya empezó a contar · Sus primeros audios ya están en tu panel. Entra
  cuando quieras a escucharlo. · Escuchar →».
- Checkout: «¿Cómo le escribimos?» (nombre/apodo; error «Pon su nombre o su apodo»), «A qué hora le
  escribimos · A esa hora le llega el primer mensaje. Después, la siguiente le llega cuando termina
  de responder la anterior.», «Su número, no el tuyo. Ahí le van a llegar las preguntas.»

Los tests que fijan estos textos: `web/test/portada-trato.test.tsx`, `comprar.test.ts`,
`regalo-textos.test.ts`, `tu-espana-panel.test.tsx`, `link-regalar.test.tsx`. Al cambiar un texto
aprobado, se cambia el test en el mismo commit.

## 5. Textos de las maquetas que SÍ se pueden usar tal cual (no chocan con nada)

- Hero: «Tu padre lo cuenta con audios de WhatsApp. Nosotros lo convertimos en el libro de su vida.»
  (AR: «Tu papá…»). Botones «Comprar el libro» / «Ver cómo queda».
- «Si sabe mandar un audio, ya sabe hacerlo. Él solo tiene que hablar. Del resto nos ocupamos nosotros.»
- «Un regalo para él. Y otro para ti.» · «Lo que recibe él / Lo que recibes tú» (quitando «Lees cada
  capítulo mientras se escribe» → «Escuchas sus audios mientras cuenta, desde tu panel»).
- «La de tu padre, la de tu abuelo, la de tu hijo.» (sin Kids: «…la de tu abuela.»)
- FAQ «Mi padre no se aclara con el móvil» / «No le gusta hablar de sí mismo» / «¿Y si lo deja a medias?»
  (esta última sin la devolución ni las diez respuestas: «Si un día no contesta, la pregunta le espera.»).
- Checkout: «¿Cómo quieres su libro? Todas las opciones incluyen la entrevista completa y el libro en
  PDF con su voz.» · «Libro digital · PDF para leer en cualquier pantalla, con «Su voz»: sus audios a un
  toque.» · «Libro impreso en tapa dura + digital · El mismo libro, impreso y encuadernado, y también
  en PDF con su voz.» · «Añade un detalle · Su foto enmarcada, junto a su libro.» · «Pago seguro y
  cifrado» · «Tus datos y el pago» · «¿Para quién es el libro?» · «¿Es un regalo? Sí, es un regalo /
  No es regalo: que empiece ya» · «Eliges el día en que empieza y te damos una tarjeta para
  entregárselo.» · «Pedido confirmado · Ya está. El libro de {nombre} empieza {cuándo}.»
- Panel: «Hola, {nombre}. El libro de {narrador} va creciendo.» (vale: «creciendo» habla de los audios)
  · «Su pregunta pendiente … Le está esperando. No le mandamos otra hasta que conteste.» · «Sus fotos ·
  Falta su foto para la portada. … Puedes añadirla hasta que cerremos su libro.» · «Esta foto es
  pequeña: impresa en tapa dura saldría borrosa.» · «Lo último que contó» · «Invita a tus hermanos para
  que escuchen sus audios y propongan preguntas.» · «¿Dudas? Escríbenos, te contesta una persona.»
- Entrar: «Entra para ver cómo va su libro.» · «¿Te han regalado el libro y eres quien lo cuenta? No
  necesitas entrar aquí: todo lo haces desde WhatsApp…» · «Mira tu correo.» · «¿No llega? Mira en
  promociones o spam.»
- 404: «Esta página se ha perdido. Como algunos recuerdos, si nadie los apunta.»
- Pago fallido: «Tu banco no ha aceptado el pago. No se te ha cobrado nada. … Lo que elegiste sigue guardado.»
