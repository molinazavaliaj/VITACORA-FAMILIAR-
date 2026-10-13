# Textos a aprobar — mails de la web (fase 1, tarea `mails`)

Mails: el de **acceso tras el pago** (`enviarMailAcceso`) y el de la **tarjeta del regalo**
(`enviarMailRegalo`), con el diseño de la maqueta `Email`. Los textos viven en
`web/src/lib/mail-textos.ts` (es / ca / ar). Hoy se manda `es` a las familias de España y `ar` al
resto, como antes; el catalán queda listo pero no sale hasta saber el idioma de quien compra
(`PENDIENTES.md`, «Apuntado en fase 1»).

Capturas: `capturas/mail-<acceso|regalo>-<es|ar|ca>-<600|390>.png`. HTML y texto plano de cada uno:
`mails/`.

## Lo que se usa tal cual (ya aprobado)

| Dónde | Texto | De dónde |
|---|---|---|
| Acceso, asunto | Listo. Hoy le escribimos a tu {como}. | mail aprobado 06/10 |
| Acceso, título | Gracias por confiar. Ya está en marcha. | ídem |
| Acceso, párrafo | En un rato le llega un mensaje nuestro por WhatsApp a tu {como}, contándole de qué se trata. Arranca cuando quiera. | ídem |
| Acceso, línea de tiempo | Cuando empiece a contar su historia te avisamos por aquí / acá, y vas a poder escuchar su voz desde tu panel. | ídem |
| Acceso, encima del botón | Para ir escuchando lo que cuenta, entra / entrá a la página con este mismo correo: | ídem |
| Acceso, botón · nota | Entrar a mi tablero · Te pedimos un código de 6 números que llega a este correo. Sin contraseñas. | ídem |
| Regalo, asunto y título · cuerpo · botón | `mailAsunto` · `mailCuerpo` · `mailBoton` de `regalo-textos.ts` | aprobados 07/10 (vos) y 09/10 (tú) |
| Regalo, línea de tiempo | Desde la primera respuesta, en tu panel aparecen sus audios, uno por uno, con su voz y sus modos de decir. | `aprobados.md` #18 |
| Los dos, línea de tiempo | Cuando termina de contar, el biógrafo escribe su libro. | `aprobados.md` #19 (sin la «Y» del principio) |
| Los dos, pie | Vitácora Familiar · En cada familia hay un libro sin escribir. | lema + maqueta |

## Nuevos (castellano)

| Dónde | es (tú) | ar (vos) | De dónde salió |
|---|---|---|---|
| Etiqueta arriba del título (los dos) | PEDIDO CONFIRMADO | PEDIDO CONFIRMADO | maqueta `Email`, sin el «Nº 1048» de ejemplo |
| Vista previa del acceso (lo que se ve en la bandeja junto al asunto) | En un rato le llega un mensaje nuestro por WhatsApp a tu {como}. | igual | adaptado del párrafo aprobado |
| Vista previa del regalo | Ya puedes descargar la tarjeta. | Ya podés descargar la tarjeta. | adaptado del cuerpo aprobado |
| Título de la línea de tiempo | QUÉ PASA AHORA | QUÉ PASA AHORA | maqueta `Email` |
| Fila 1 (etiqueta) | Mientras cuenta | Mientras cuenta | nuevo |
| Fila 2 (etiqueta) | Al terminar | Al terminar | maqueta `Email` |
| Link del regalo, abajo | Entrar a mi tablero → | igual | el botón aprobado del acceso (el regalo no lo tenía) |
| Dudas (los dos) | ¿Dudas? Contesta a este email. | ¿Dudas? Contestá este mail. | maqueta `Emails` (pie) |
| Pie, segunda línea | Recibes este email porque has hecho un pedido. | Recibís este mail porque hiciste un pedido. | maqueta `Email`, sin «Recibo con IVA incluido en tu panel» (no lo comprobé) |

## Catalán (todo nuevo; `// ca: PENDIENTE REVISIÓN NATIVA`)

Sin «el teu / la teva» delante de cómo le dicen: en catalán depende del género y el mail no lo sabe.

| Dónde | ca |
|---|---|
| Acceso, asunto | Llest. Avui li escrivim a {como}. |
| Acceso, vista previa | D'aquí a una estona li arriba un missatge nostre per WhatsApp a {como}. |
| Acceso, título | Gràcies per confiar en nosaltres. Ja està en marxa. |
| Acceso, párrafo | D'aquí a una estona li arriba un missatge nostre per WhatsApp a {como}, explicant-li de què es tracta. Que comenci quan vulgui. |
| Acceso, línea de tiempo | Quan comenci a explicar la seva història t'avisarem per aquí, i podràs escoltar la seva veu des del teu tauler. |
| Acceso, encima del botón | Per anar escoltant el que explica, entra a la pàgina amb aquest mateix correu: |
| Botón · nota | Entrar al meu tauler · Et demanem un codi de 6 números que arriba a aquest correu. Sense contrasenyes. |
| Regalo, asunto y título | El teu regal per a {como} ja està llest |
| Regalo, vista previa | Ja pots descarregar la targeta. |
| Regalo, cuerpo | Ja pots descarregar la targeta. Imprimeix-la o envia-la per WhatsApp. Quan {como} l'escanegi, començarà la seva entrevista i ho veuràs al teu tauler. |
| Regalo, botón | Veure la targeta |
| Regalo, línea de tiempo | Des de la primera resposta, al teu tauler apareixen els seus àudios, un per un, amb la seva veu i la seva manera de dir les coses. |
| Etiqueta · línea de tiempo | COMANDA CONFIRMADA · QUÈ PASSA ARA · Mentre explica · En acabar |
| Al terminar | Quan acaba d'explicar, el biògraf escriu el seu llibre. |
| Dudas | Dubtes? Respon aquest correu. |
| Pie | Vitácora Familiar · A cada família hi ha un llibre per escriure. (lema ya aprobado en la tarjeta) · Reps aquest correu perquè has fet una comanda. |

## Lo de la maqueta que NO va (y por qué)

- «Nº 1048», «Laura», «24 de diciembre», portada de Osvaldo y el ticket con 49 € / +50 € / 99 €: datos
  de ejemplo. El mail no recibe nº de pedido, nombre de quien compra, fecha ni importes; mostrarlos
  exige cambiar `confirmar-pago.ts` (lo apunté en PENDIENTES).
- «Tras 3 respuestas · Te llega el anticipo…» (D4, anticipo fuera) y «El impreso llega unos 9 días
  después» (D4, sin cifra).
- «Si él no quiere hacerlo, te devolvemos el dinero» (D1: la garantía no va en mails).
- «Falta su número de WhatsApp… Añadirlo →»: en el regalo el narrador escribe con su código; no hay
  número que pedir.
- «El libro de Osvaldo empieza el 24 de diciembre»: en el regalo empieza cuando escanea la tarjeta o
  el día de la entrega programada; el mail no lo sabe y no lo promete.
