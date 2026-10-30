# Tarjeta impresa en sobre (30/10)

Rama `tarjeta-impresa` (worktree `VITACORA FAMILIAR-tarjeta-impresa`). Sin push ni PR.

## Qué hace

Desde el 26/10 el regalo se compra en `/comprar?regalo=1` (`/regalar` redirige ahí). Cuando la compra
es un regalo, en el último paso («Tus datos y el pago»), debajo de la dirección del libro (si la hay)
aparece una casilla nueva: «Quiero también la tarjeta impresa, en un sobre, por correo», con su
precio. Si la marca y la compra es solo digital, pide a nombre de quién va el sobre y la dirección,
con el país fijo en España. Si la compra lleva el libro impreso, el sobre va a la misma dirección del
libro y solo pide a nombre de quién va (arranca con quien recibe el libro). El resumen de la derecha,
la barra del teléfono y el botón de pagar muestran la línea de la tarjeta y el total real. Si el pago
falla y vuelve, la casilla y lo cargado vuelven con el resto de lo elegido.

Reglas:

- Apagada por defecto. Sin `PRECIO_TARJETA_EUR` en Vercel la casilla no aparece y no se cobra.
- Solo dentro de España. Una dirección de otro país da error.
- Hace falta tiempo para el correo. Si el regalo tiene fecha, tiene que ser dentro de 7 días o más
  (`DIAS_TARJETA_IMPRESA`). Si la fecha está más cerca, en vez de la casilla sale una línea que lo
  explica. Sin fecha, se puede. Si vuelve atrás y cambia la fecha o dice que no es regalo, la casilla
  se desmarca sola.
- La dirección va a `pedidos.extras.tarjeta` (sin migración). No es de la fábrica: no crea fila en
  `entregas` ni cambia lo que la fábrica lee.
- El cupón y el código de creador siguen descontando solo del libro, no de la tarjeta.

## Cómo prenderla

1. En Vercel (Production), cargar `PRECIO_TARJETA_EUR=4`.
2. Re-correr el deploy (GitHub → Actions → Deploy web → «Re-run all jobs»).
3. Confirmar que `MAIL_SOCIOS` está cargada en Vercel: de ahí sale el aviso.

No cargar `PRECIO_TARJETA_ARS`: desde Argentina no se manda.

## Qué hace Naza cuando llega el mail

Cuando entra el pago llega a los socios un mail «Tarjeta impresa para mandar · VF-XXXXXX» con el
código, quién regala y su correo, a nombre de quién va el sobre, la dirección, la fecha de entrega y
hasta cuándo mandarla (4 días antes de la fecha, o «apenas puedas» si no hay fecha).

1. Abrir el link del mail (`/regalo/VF-XXXXXX/tarjeta`) e imprimirla a doble cara (A6 doblada).
2. Doblarla y meterla en el sobre negro C6.
3. Escribir el nombre y la dirección del mail en el sobre.
4. Mandarla por Correos, carta ordinaria (3 a 5 días), antes de la fecha que dice el mail.

Si el mail no llegó (falla de Resend o `MAIL_SOCIOS` vacía), el log de Vercel dice «lleva la tarjeta
impresa y no pude avisarles a los socios». Los datos están en `pedidos.extras.tarjeta` de ese pedido.

## Textos para aprobar

Todos marcados con `// TEXTO PARA NAZA`. Los de tú y de vos son iguales salvo la pista.

1. Casilla: «Quiero también la tarjeta impresa, en un sobre, por correo»
2. Detalle: «Te la mandamos en un sobre negro, lista para regalar. Llega en 3 a 5 días.»
3. Campo: «A nombre de quién va el sobre»
4. Pista: «Tú o quien la recibe» (vos: «Vos o quien la recibe»)
5. Error: «Falta a nombre de quién va el sobre.»
6. Error: «Por ahora la tarjeta impresa solo se manda dentro de España.»
7. Aviso de fecha cerca: «Para recibirla impresa, la fecha tiene que ser dentro de 7 días o más.»
8. Error de un campo de la dirección: «Falta calle y número.», «Falta ciudad.», «Falta código postal.»
8b. Con el libro impreso, debajo de «a nombre de quién»: «Va a la misma dirección del libro.»
9. Nombre de la línea en el ticket y en la pasarela: «Tarjeta impresa en sobre»
10. Si se pide y no se vende (no debería verse): «La tarjeta impresa todavía no está disponible.»

En catalán (`web/src/app/_textos/regalar.ts`, sin pasar por Softcatalà todavía): «Vull també la
targeta impresa, en un sobre, per correu», «Te l'enviem en un sobre negre, a punt per regalar. Arriba
entre 3 i 5 dies.», «A nom de qui va el sobre», «Tu o qui la rep», «Falta a nom de qui va el sobre.»,
«De moment la targeta impresa només s'envia dins d'Espanya.», «Va a la mateixa adreça del llibre.», «Per rebre-la impresa, la data ha de ser
d'aquí a 7 dies o més.», las etiquetas de la dirección, el país «Espanya» y la línea «Targeta impresa
en sobre».
