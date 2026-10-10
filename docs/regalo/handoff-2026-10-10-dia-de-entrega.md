# Regalo el día elegido — pase del 10/10

Rama `regalo-dia-de-entrega`. Sale de `origin/main` (9195e46) y tiene mergeado el PR #5 (`regalo-antes-de-vender`).
- Spec: `docs/superpowers/specs/2026-10-10-regalo-dia-de-entrega-design.md`.
- Plan: `docs/superpowers/plans/2026-10-10-regalo-dia-de-entrega.md`.
- Textos aprobados (tres tandas): `docs/regalo/dia-de-entrega-textos.md`.

## Qué hace

1. **Al comprar.** En /regalar, con fecha puesta, quien compra elige entre «No, se la doy yo», «Por WhatsApp» o «Por mail».
   - Con WhatsApp o mail elige la hora, en punto, de 8 a 22, en la hora del país de quien recibe. Ese país sale del idioma del regalo.
   - También deja el celular o el correo de quien recibe.
   - Antes de pagar ve «Le llega a … el … a las …».
2. **El día elegido.** El entrevistador lo manda en su tick de 15 minutos, así que sale a la hora en punto.
   - Por mail va el mensaje, el link a `/regalo/<código>`, el número del bot y el código.
   - Por WhatsApp va la plantilla `regalo_entrega_*`, con un botón al link.
   - A quien compró le llega «Hoy le llegó tu regalo a …».
   - Si falla (mail rechazado, plantilla rechazada o no aprobada, Meta que avisa que no lo entregó, o el bot que vuelve otro día), le llega «No pudimos mandarle el regalo…» con el botón a la tarjeta.
3. **Al contestar.** Si llegó por WhatsApp, el narrador contesta cualquier cosa (texto, audio o el botón) y canjea sin escribir el código.

Lo que **no** hace: cambiar la fecha, la hora o el contacto después de pagar. Un error se corrige a mano en `regalos`.

## Estado verificado

- Web: 825 tests en verde, `tsc` limpio (después de `npx next typegen`). /regalar se probó en el navegador con WhatsApp prendido y la consola quedó sin errores.
- Entrevistador: 857 tests en verde, `tsc` limpio. Un test V3 viejo («una entrevista entera en es-AR») a veces da timeout cuando corre toda la suite. Solo pasa.
- Revisión con un segundo agente: hecha, y lo confirmado está arreglado (ver «Revisión» abajo).

## Qué falta, por persona

**Joaquín**
1. ~~OK al CONTRATO y a la migración~~ HECHO 10/10. Migración `20261010000000_regalos_entrega.sql`. Son 6 columnas en `regalos` y el valor `regalo_entrega` en el check de `envios.tipo`.
2. Las 3 plantillas en Meta (`regalo_entrega_vos` es, `regalo_entrega_es_es` es_ES, `regalo_entrega_ca` ca). Los textos están en la tanda 3, filas 6 y 7. Aprobadas, se suman a `WA_PLANTILLAS_V3_LISTAS` (`es-AR:regalo_entrega,es-ES:regalo_entrega,ca:regalo_entrega`) en Railway, y `REGALO_ENTREGA_WHATSAPP=1` en Vercel.
3. `WHATSAPP_NUMERO_PUBLICO` también en Railway (solo dígitos, sin imprimirlo). Sin él, el mail a quien recibe sale sin el código.

**Naza**
1. ~~Aplicar la migración~~ HECHO 10/10 (las 6 columnas verificadas).
2. Prueba real por mail: comprar un regalo con su correo como «quien recibe», para una hora cercana.

## Qué NO hacer

- No prender `REGALO_ENTREGA_WHATSAPP` antes de que Meta apruebe las tres plantillas. Si la del idioma no está, el regalo cae en «dásela vos».
- No poner `entrega_enviada_at` en null para «reintentar»: el envío fallido no se reintenta solo, y quien compró ya recibió el «dásela vos».
- No borrar `entrega_contacto` de un regalo enviado por WhatsApp sin canjear: el canje sin código lo busca por ese número.

## Revisión (segundo agente, 10/10)

No encontró bugs graves. Confirmó estas cosas:
- las horas y los cambios de horario;
- la traba contra dos ticks;
- que todo anda sin la migración;
- que nadie ajeno puede canjear sin código;
- el escapado del mail;
- que los textos coinciden letra por letra con los aprobados.

Arreglado con test:
1. **Un envío cortado a la mitad se perdía sin avisar** (por ejemplo, un deploy entre la marca y el envío). Ahora mientras se manda queda `entrega_fallo = 'enviando'`. Si a los 30 minutos sigue así, pasa a `interrumpido` y le llega el «dásela vos» a quien compró. Mientras está en `enviando` tampoco se puede canjear sin código.
2. **Las compras sin pagar con entrega se releían en cada tick para siempre.** Ahora el tick mira solo las fechas desde anteayer.
3. **Un móvil escrito con el país y sin el +** («34612345678») quedaba mal. Ahora se le pone el +.
4. **Los errores del servidor** salían de vos y con otras palabras. Ahora usan los textos aprobados, de vos o de tú según quien compra.

Anotado, sin arreglar:
- Si la plantilla sale y Meta avisa después que no la entregó, quien compró recibe primero «Hoy le llegó» y después «No pudimos mandarle el regalo». Es raro y el segundo mail es el que vale.
- Si el número de quien recibe ya es narrador de Vitácora, el canje sin código no corre (el bot lo atiende como narrador). Es el mismo caso de «dos libros para una persona», que ya estaba pendiente.
- Si alguien elige «Por mail» **antes** de que se aplique la migración, la compra da error 500. Por eso la migración va antes de linkear /regalar.
- La cuenta de la hora está copiada en la web y en el bot. Hoy las dos son iguales. Cada copia lo avisa en un comentario.
