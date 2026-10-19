# Fase 3: textos nuevos para aprobar

**Aprobados por Naza el 14/10:** todos los de este archivo (es y ar).

Todo lo que no es copia literal de `aprobados.md`, de `POR_TRATO` o de la lista «se pueden usar tal
cual» (TEXTOS-Y-REGLAS §5). Una versión recomendada por texto. El catalán está en los diccionarios
marcado `// ca: PENDIENTE REVISIÓN NATIVA` y no se lista acá. Los textos para el socio (mails del
recorrido y WhatsApp) están aparte, en `../para-el-socio/` (todos propuesta).

Archivos: `web/src/lib/mail-textos.ts` (bloque `invitacion`) y `web/src/app/_textos/avisos.ts`.

## Mail de invitación

| Dónde | es (España, tú) | ar (Argentina, vos) | Origen |
|---|---|---|---|
| Etiqueta | INVITACIÓN | INVITACIÓN | nuevo |
| Asunto y título (seguir la historia) | {quien} te invita a la historia de {N} | igual | asunto de siempre (fijado por test); como título, nuevo |
| Primera línea | {N} está contando su vida con audios de WhatsApp. Cuando termine, un biógrafo escribirá su libro. | {N} está contando su vida con audios de WhatsApp. Cuando termine, un biógrafo va a escribir su libro. | **nuevo, sustituye** «Un biógrafo está escribiendo el libro de la vida de {N}» (06/10), que promete que se escribe mientras cuenta (DECISIONES D4) |
| Párrafo | {quien} te ha invitado a seguir su historia. Podrás escuchar lo que va contando, sumar preguntas que te gustaría que le hagan y añadir fotos de cada época. | (aprobado 06/10) {quien} te invitó a seguir su historia. Vas a poder escuchar… y agregar fotos de cada época. | es adaptado del aprobado |
| Título (dudas) | {N} ha terminado de contar su vida y estamos a punto de escribir su libro. | (aprobado 13/10) {N} terminó de contar su vida y estamos por escribir su libro. | es adaptado («estamos por» no se usa así en España) |
| Párrafo (dudas) | {quien} te ha invitado porque han quedado algunas dudas sobre lo que contó, como un nombre o un año. Si sabes la respuesta, puedes escribirla antes de que se escriba el libro. También podrás escuchar lo que contó. | (aprobado 13/10) | es adaptado |
| Antes del botón | Entra con este mismo correo: | Entrá con este mismo correo: | aprobado 06/10 (lleva dos puntos; fijado por test, no lo toqué) |
| Botón | Ver la historia de {N} · Ver las dudas | igual | aprobado |
| Bajo el botón | Te pedimos un código de 6 números que llega a este correo. Sin contraseñas. | igual | aprobado |
| Pie, por qué | Recibes este email porque te han invitado a una historia. | Recibís este mail porque te invitaron a una historia. | nuevo (el de acceso dice «porque has hecho un pedido») |

## 404 (`app/not-found.tsx`, `app/ca/not-found.tsx`, `app/ar/not-found.tsx`)

| Dónde | es | ar | Origen |
|---|---|---|---|
| Etiqueta | Error 404 | igual | maqueta `Casos` 5 |
| Título y frase | Esta página se ha perdido. Como algunos recuerdos, si nadie los apunta. | igual | TEXTOS-Y-REGLAS §5 (tal cual) |
| Botón | Volver al inicio | igual | maqueta `Casos` 5 |
| Enlace | Comprar el libro | igual | botón aprobado de la portada (la maqueta tenía «Ver un libro de ejemplo»; el encargo pedía comprar) |

La raíz va en castellano neutro (no hay tú ni vos): ver `PENDIENTES.md` F3-2.

## Enlace que ya no sirve (`/libro/…`, `/voz/…`, `/anticipo/…`)

| Dónde | es | ar | Origen |
|---|---|---|---|
| Etiqueta | Enlace caducado | igual | maqueta `Casos` 5 |
| Título | Este enlace ya no sirve. | igual | maqueta `Casos` 5 |
| Explicación | Puede que esté incompleto o mal copiado. Ábrelo otra vez desde el mensaje donde te llegó. Si sigue sin abrir, escríbenos y lo miramos. | Puede que esté incompleto o mal copiado. Abrilo otra vez desde el mensaje donde te llegó. Si sigue sin abrir, escribinos y lo miramos. | nuevo (la maqueta hablaba de enlaces de entrar de 15 minutos, que no existen: se entra con código) |
| Botón | Escríbenos | Escribinos | nuevo (abre el WhatsApp de dudas si está la variable; si no, un correo a hola@) |
| Enlace | Entrar con mi correo | igual | nuevo |

## Regalo que no se encuentra (`/regalo/…` y su tarjeta)

| Dónde | es | ar | Origen |
|---|---|---|---|
| Título | No encontramos este regalo. | igual | nuevo |
| Explicación | Puede que el código esté mal copiado o que el pago todavía no se haya completado. Si te lo han regalado, pide a quien te lo dio que lo revise. Si sigue sin abrir, escríbenos y lo miramos. | Puede que el código esté mal copiado o que el pago todavía no se haya completado. Si te lo regalaron, pedile a quien te lo dio que lo revise. Si sigue sin abrir, escribinos y lo miramos. | nuevo |
| Botón · enlace | Escríbenos · Volver al inicio | Escribinos · Volver al inicio | nuevo / maqueta |

## Pie de las hojas de aviso

«Para las vidas que merecen su propio libro» (lema de siempre, `_textos/publico.ts`).

## /entrar

| Dónde | Texto | Origen |
|---|---|---|
| Tras «Pedir otro código» | Te mandamos otro código a {correo}. | nuevo (igual en es y ar) |
| Botón nuevo | Usar otro correo | nuevo (antes «Pedir otro código» volvía al paso del correo) |
