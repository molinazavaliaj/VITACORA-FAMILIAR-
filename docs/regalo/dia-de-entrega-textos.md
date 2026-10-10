# Regalo el día elegido: textos (spec 2026-10-10-regalo-dia-de-entrega-design.md)

## Tanda 1, quien compra de vos (aprobada por Naza el 10/10, tal cual)

| # | Dónde aparece | Texto |
|---|---|---|
| 1 | Pregunta, aparece si puso fecha | ¿Querés que se lo mandemos ese día? |
| 2 | Opciones | No, se la doy yo · Por WhatsApp · Por mail |
| 3 | Pregunta de la hora | ¿A qué hora? |
| 4 | Debajo de la hora | Es la hora de Argentina. / Es la hora de España. (según el idioma del regalo) |
| 5 | Campo del celular | Su celular · pista: con código de país, por ejemplo +54 9 11 1234 5678 |
| 6 | Campo del correo | Su correo |
| 7 | Errores | Falta la hora. · Ese celular parece mal escrito. Revisalo. · Ese correo parece mal escrito. Revisalo. · Esa hora ya pasó. Elegí otra. |
| 8 | Último paso | Le llega a {contacto} el {dd/mm} a las {h}. |
| 9 | Mail del día, si salió | Asunto: Hoy le llegó tu regalo a {como} · Cuerpo: Se lo mandamos a {contacto}. Cuando empiece su entrevista lo vas a ver en tu tablero. |
| 10 | Mail del día, si falló | Asunto: No pudimos mandarle el regalo a {como} · Cuerpo: Probamos mandárselo a {contacto} y no llegó. Dale la tarjeta vos, impresa o por WhatsApp. · Botón: Ver la tarjeta |

## Tanda 2, quien compra de tú (aprobada por Naza el 10/10, tal cual)

| # | Dónde aparece | Texto |
|---|---|---|
| 1 | Pregunta | ¿Quieres que se lo enviemos ese día? |
| 2 | Opciones | No, se la doy yo · Por WhatsApp · Por correo |
| 3 | Pregunta de la hora | ¿A qué hora? |
| 4 | Debajo de la hora | Es la hora de España. / Es la hora de Argentina. (según el idioma del regalo) |
| 5 | Campo del móvil | Su móvil · pista: con prefijo de país, por ejemplo +34 612 34 56 78 |
| 6 | Campo del correo | Su correo |
| 7 | Errores | Falta la hora. · Ese móvil parece mal escrito. Revísalo. · Ese correo parece mal escrito. Revísalo. · Esa hora ya ha pasado. Elige otra. |
| 8 | Último paso | Le llega a {contacto} el {dd/mm} a las {h}. |
| 9 | Mail del día, si salió | Asunto: Hoy le ha llegado tu regalo a {como} · Cuerpo: Se lo hemos enviado a {contacto}. Cuando empiece su entrevista lo verás en tu tablero. |
| 10 | Mail del día, si falló | Asunto: No hemos podido enviarle el regalo a {como} · Cuerpo: Intentamos enviárselo a {contacto} y no llegó. Dale tú la tarjeta, impresa o por WhatsApp. · Botón: Ver la tarjeta |

## Tanda 3, quien recibe, en el idioma del regalo (aprobada por Naza el 10/10, tal cual)

El mail reusa lo ya aprobado de la tarjeta: `titulo(narrador, quien)` y las tres líneas de `explica`.
Orden del mail: título, 2, mensaje de quien regala, 3 (si hay audio), `explica`, botón 4, 5 y el código.

| # | Qué es | es-AR | es-ES | ca |
|---|---|---|---|---|
| 1 | Asunto | {quien} te hizo un regalo | {quien} te ha hecho un regalo | {quien} t'ha fet un regal |
| 2 | Antes del mensaje | Te dejó este mensaje. | Te ha dejado este mensaje. | T'ha deixat aquest missatge. |
| 3 | Si hay audio | También te grabó un audio. Lo escuchás cuando abrís tu regalo. | También te ha grabado un audio. Lo escucharás cuando abras tu regalo. | També t'ha gravat un àudio. L'escoltaràs quan obris el teu regal. |
| 4 | Botón | Abrir mi regalo | Abrir mi regalo | Obrir el meu regal |
| 5 | Debajo del botón | Si el botón no te anda, mandá un WhatsApp al {numero} con este código. | Si el botón no te funciona, manda un WhatsApp al {numero} con este código. | Si el botó no et funciona, envia un WhatsApp al {numero} amb aquest codi. |
| 6 | Plantilla WhatsApp (cuerpo; {{1}} narrador, {{2}} quien regala) | Hola, {{1}}. {{2}} te hizo un regalo. Es un libro sobre tu vida, que vas a contar vos con audios. Tocá el botón para verlo. Cuando quieras empezar, contestá este mensaje. | Hola, {{1}}. {{2}} te ha hecho un regalo. Es un libro sobre tu vida, que contarás tú con audios. Toca el botón para verlo. Cuando quieras empezar, contesta a este mensaje. | Hola, {{1}}. {{2}} t'ha fet un regal. És un llibre sobre la teva vida, que explicaràs tu amb àudios. Toca el botó per veure'l. Quan vulguis començar, respon aquest missatge. |
| 7 | Botón de la plantilla (URL `…/regalo/{{1}}`, {{1}} = código) | Ver mi regalo | Ver mi regalo | Veure el meu regal |

Decisión de Naza (10/10): el mail a quien recibe en catalán va sin la frase del pie («Para las vidas que merecen su propio libro.»). En es-AR y es-ES va con ella.
