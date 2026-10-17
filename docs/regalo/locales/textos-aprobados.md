# Regalo en locales: textos aprobados

> Naza aprobó las 3 tandas el 17/10/2026 en vos y pidió pasarlas a tú y catalán.
> Las versiones en tú y en catalán las tradujo Claude. El catalán conviene que lo
> lea un nativo (Imma u otra persona de Berga) antes de imprimir el primer lote.
> Las líneas marcadas como «ya aprobado» vienen de la gift card (spec 2026-10-07 §3)
> y no cambian.

## Tanda 1: lo impreso

| # | Dónde | es-AR (vos) | es-ES (tú) | ca |
|---|---|---|---|---|
| 1 | Tapa de la carta (ya aprobado) | En cada familia hay un libro sin escribir | En cada familia hay un libro sin escribir | A cada família hi ha un llibre per escriure |
| 2 | Adentro, título (ya aprobado; **reemplazado el 17/10**, ver «Adentro de la carta-libro») | Esto es un regalo. | Esto es un regalo. | Això és un regal. |
| 3 | Adentro, texto para el narrador (ya aprobado; **reemplazado el 17/10**, ver «Adentro de la carta-libro») | Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp. Vos le contestás con audios, cuando puedas. Con lo que le cuentes se escribe el libro de tu vida. | Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp. Tú le contestas con audios, cuando puedas. Con lo que le cuentes se escribe el libro de tu vida. | Un biògraf et farà preguntes sobre la teva vida per WhatsApp. Tu li respons amb àudios, quan puguis. Amb el que li expliquis s'escriu el llibre de la teva vida. |
| 4 | Adentro, para escribir a mano | Para ___ / De ___ | Para ___ / De ___ | Per a ___ / De ___ |
| 5 | Contratapa, debajo del QR (QR también en la contratapa, 17/10: se paga sin romper el sello; adentro ya no va ninguna línea de activación) | Para regalarla, escaneá este código y pagala en vitacorafamiliar.com. Recién ahí queda activada. | Para regalarla, escanea este código y págala en vitacorafamiliar.com. Solo entonces queda activada. | Per regalar-la, escaneja aquest codi i paga-la a vitacorafamiliar.com. Només llavors queda activada. |
| 6 | Sticker que cierra el sobre | El libro de tu vida · Para ___ | El libro de tu vida · Para ___ | El llibre de la teva vida · Per a ___ |
| 7 | Cartel, título (cambiado 17/10) | Regalale el libro de su vida | Regálale el libro de su vida | Regala-li el llibre de la seva vida |
| 8 | Cartel, bajada | Cuenta su vida por WhatsApp. Nosotros escribimos su libro. | Cuenta su vida por WhatsApp. Nosotros escribimos su libro. | Explica la seva vida per WhatsApp. Nosaltres n'escrivim el llibre. |
| 9 | Cartel, cómo funciona | Llevate un sobre gratis. Se activa cuando lo regalás en la web. | Llévate un sobre gratis. Se activa cuando lo regalas en la web. | Emporta't un sobre gratis. S'activa quan el regales al web. |
| 10 | Frente de la caja | Gift card · Llevátela | Gift card · Llévatela | Gift card · Emporta-te-la |

El cartel y la caja (7 a 10) no los arma el código: se imprimen aparte para el stand.

Cambio del 17/10 (carta-libro): ya no hay sobre. La carta se dobla como un librito negro y la cierra un sello redondo de 25 mm sin texto (solo el toroide), así que la fila 6 ya no se imprime. La tapa lleva el título «El libro de tu vida» (ca «El llibre de la teva vida») y la frase de la fila 1 pasó a la contratapa, junto con la fila 5.

## Adentro de la carta-libro, aprobado 17/10

Reemplaza las filas 2 y 3 de la tanda 1. Las dos líneas del QR («Apuntá la cámara…»
y «Si la cámara no te anda…») son las que ya estaban aprobadas para la tarjeta
(`textosAbuelo` en `web/src/lib/regalo-textos.ts`, 07/10 y 09/10) y salen de ahí;
en es-ES dice «manda», no «envía». `{numero}` es `WHATSAPP_NUMERO_PUBLICO`, legible.

| Dónde | es-AR (vos) | es-ES (tú) | ca |
|---|---|---|---|
| Título | Te regalaron una Vitácora. | Te han regalado una Vitácora. | T'han regalat una Vitácora. |
| Texto | Nuestro biógrafo te va a hacer preguntas sobre tu vida por WhatsApp. Vos le vas contestando con audios en tus momentos libres. Con lo que nos cuentes, vamos a escribir el libro de tu vida. | Nuestro biógrafo te va a hacer preguntas sobre tu vida por WhatsApp. Tú le vas contestando con audios en tus momentos libres. Con lo que nos cuentes, vamos a escribir el libro de tu vida. | El nostre biògraf et farà preguntes sobre la teva vida per WhatsApp. Tu li vas responent amb àudios en els teus moments lliures. Amb el que ens expliquis, escriurem el llibre de la teva vida. |
| Arriba del QR | Apuntá la cámara del celular acá para empezar. | Apunta la cámara del móvil aquí para empezar. | Apunta la càmera del mòbil aquí per començar. |
| Abajo del QR (después, el código) | Si la cámara no te anda, mandá un WhatsApp al {numero} con este código. | Si la cámara no te funciona, manda un WhatsApp al {numero} con este código. | Si la càmera no et funciona, envia un WhatsApp al {numero} amb aquest codi. |
| Página izquierda | Para ___ / cuatro renglones / De ___ | Para ___ / cuatro renglones / De ___ | Per a ___ / cuatre renglons / De ___ |

## Tanda 2: página «no activada» y formulario

| # | Dónde | es-AR (vos) | es-ES (tú) | ca |
|---|---|---|---|---|
| 1 | Página no activada, título | Esta carta es un regalo que todavía no se activó | Esta carta es un regalo que todavía no se ha activado | Aquesta carta és un regal que encara no s'ha activat |
| 2 | Página no activada, texto | Con esta carta, alguien que querés cuenta su vida por WhatsApp. Nosotros escribimos su libro. Se activa cuando la regalás desde acá. | Con esta carta, alguien a quien quieres cuenta su vida por WhatsApp. Nosotros escribimos su libro. Se activa cuando la regalas desde aquí. | Amb aquesta carta, algú que estimes explica la seva vida per WhatsApp. Nosaltres n'escrivim el llibre. S'activa quan la regales des d'aquí. |
| 3 | Botón | Regalarla | Regalarla | Regalar-la |
| 4 | Link chico | ¿La querés para vos? | ¿La quieres para ti? | La vols per a tu? |
| 5 | Nota al pie | Si te la dieron como regalo, avisale a quien te la dio. | Si te la han dado como regalo, avísale a quien te la dio. | Si te l'han donat com a regal, avisa qui te la va donar. |
| 6 | Formulario, aviso | Estás regalando la carta {código}. Cuando pagues, esa misma carta queda activada. | Estás regalando la carta {código}. Cuando pagues, esa misma carta queda activada. | (el formulario solo tiene vos y tú) |
| 7 | Carta ya pagada | Esta carta ya fue regalada. Podés regalar igual un libro nuevo desde acá. | Esta carta ya se ha regalado. Puedes regalar igualmente un libro nuevo desde aquí. | — |
| 8 | Código que no existe | No encontramos esa carta. Revisá el código o regalá un libro nuevo desde acá. | No encontramos esa carta. Revisa el código o regala un libro nuevo desde aquí. | — |
| 9 | Elección del libro | Qué libro le regalás · El libro digital · Se lee en la web, con sus fotos y su voz. | Qué libro le regalas · El libro digital · Se lee en la web, con sus fotos y su voz. | — |
| 10 | Opción impreso | El libro impreso · Tapa dura, a color, con un código que hace sonar su voz. Incluye el digital. | El libro impreso · Tapa dura, a color, con un código que hace sonar su voz. Incluye el digital. | — |

## Tanda 3: tarjeta negra, mail y link del local

| # | Dónde | es-AR (vos) | es-ES (tú) | ca |
|---|---|---|---|---|
| 1 | Opción tarjeta | Sumar la tarjeta negra por correo | Añadir la tarjeta negra por correo | — |
| 2 | Detalle tarjeta | Te la mandamos a tu casa en un sobre negro, para dársela en mano. | Te la enviamos a casa en un sobre negro, para dársela en mano. | — |
| 3 | Título dirección | Dónde te la mandamos | Dónde te la enviamos | — |
| 4 | Línea del ticket | Tarjeta negra por correo | Tarjeta negra por correo | — |
| 5 | Ya no disponible | La tarjeta por correo no está disponible ahora. | La tarjeta por correo no está disponible ahora. | — |
| 6 | Mail, si eligió impreso | Elegiste el libro impreso. Cuando quieras, cargá la dirección de envío desde tu panel, en Encargar libro. | Has elegido el libro impreso. Cuando quieras, carga la dirección de envío desde tu panel, en Encargar libro. | — |
| 7 | Link del local, título | Vitácora Familiar en {local} | Vitácora Familiar en {local} | Vitácora Familiar a {local} |
| 8 | Libritos (17/10, antes «sobres») | Te dejamos {n} libritos. / Te dejamos 1 librito. | Os hemos dejado {n} libritos. / Os hemos dejado 1 librito. | Us hem deixat {n} llibrets. / Us hem deixat 1 llibret. |
| 9 | Sin ventas | Todavía no se pagó ninguna carta de tu caja. | Todavía no se ha pagado ninguna carta de vuestra caja. | Encara no s'ha pagat cap carta de la vostra caixa. |
| 10 | Tabla y pago | Mes · Cartas pagadas · Te toca. Lo de cada mes te lo pagamos a principios del mes siguiente. | Mes · Cartas pagadas · Os toca. Lo de cada mes os lo pagamos a principios del mes siguiente. | Mes · Cartes pagades · Us toca. El de cada mes us el paguem a principis del mes següent. |

Fuera de las tandas, sin cambiar: el error interno «La tarjeta por correo solo se puede sumar al regalar una carta.» (no se ve desde la web).

## Cartel del stand, versión final (aprobada 17/10)

Reemplaza a las filas 8 y 9 de la tanda 1. Va en el atril, detrás de la caja con los libritos.

| Línea | es-AR (vos) | es-ES (tú) | ca |
|---|---|---|---|
| Título | Regalale el libro de su vida | Regálale el libro de su vida | Regala-li el llibre de la seva vida |
| Bajada | Un regalo para tu papá, tu mamá o tus abuelos. | Un regalo para tu padre, tu madre o tus abuelos. | Un regal per al teu pare, la teva mare o els teus avis. |
| 1 | Llevate un librito gratis. | Llévate un librito gratis. | Emporta't un llibret gratis. |
| 2 | Pagalo en vitacorafamiliar.com y queda listo para regalar. | Págalo en vitacorafamiliar.com y queda listo para regalar. | Paga'l a vitacorafamiliar.com i queda a punt per regalar. |
| 3 | Un biógrafo le hace preguntas por WhatsApp y contesta con audios. | Un biógrafo le hace preguntas por WhatsApp y contesta con audios. | Un biògraf li fa preguntes per WhatsApp i respon amb àudios. |
| 4 | Con lo que cuenta, escribimos el libro de su vida. | Con lo que cuenta, escribimos el libro de su vida. | Amb el que explica, escrivim el llibre de la seva vida. |

El cartel todavía no tiene archivo para imprimir (el código solo arma los libritos).

**Sello de precio en el cartel (17/10).** Círculo negro al lado del título: «Desde 49 €» (es-ES), «Des de 49 €» (ca), «Desde $85.750» (es-AR, monto a confirmar con el valor real de PRECIO_ARS). Si cambia el precio, se reimprime el cartel.
