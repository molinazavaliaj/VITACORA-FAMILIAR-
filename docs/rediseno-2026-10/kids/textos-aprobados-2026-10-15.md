# Vitácora Kids: textos aprobados por Naza (15/10)

Lo que pasa después de pagar Kids. Solo es-AR, de vos (Kids no se vende en
España, punto 10). `{apodo}` es cómo le dicen al chico (`narradores.como_le_dicen`).
Canal A = su WhatsApp; canal B = «Lo hago yo» (`kids_v2.canal`).

Van literales en el código; los tests los comparan letra por letra.

| # | Dónde | Texto aprobado | En el código |
|---|-------|----------------|--------------|
| 1 | Asunto del mail de acceso | «Listo, ya está en marcha el libro de {apodo}» | `web/src/lib/mail-textos.ts` → `TEXTOS_MAIL_KIDS.asunto` |
| 2 | Vista previa del mail y primera línea del cuerpo, canal A | «Le vamos a escribir a {apodo} a la hora que elegiste. A vos te avisamos por WhatsApp.» | `TEXTOS_MAIL_KIDS.primeraLinea.A` |
| 3 | Vista previa del mail y primera línea del cuerpo, canal B | «El primer mensaje te llega a tu WhatsApp. La primera pregunta sale cuando estén juntos.» | `TEXTOS_MAIL_KIDS.primeraLinea.B` |
| 4 | Cuerpo del mail, fila «Mientras cuenta» (en lugar de «…escuchar su voz desde tu panel») | «En tu panel vas a ver todo lo que cuenta. Ahí también podés escribir hasta tres preguntas tuyas para el libro.» | `TEXTOS_MAIL_KIDS.enTuPanel` |
| 5 | Página «Pedido confirmado», canal A | «A la hora que elegiste le llega a {apodo} un mensaje nuestro por WhatsApp. Avisale que le va a escribir «Vitácora».» | `web/src/app/_textos/pedido-confirmado.ts` → `CONFIRMADO_KIDS.canalA` |
| 6 | Página «Pedido confirmado», canal B | «Te llega un mensaje nuestro a tu WhatsApp. La primera pregunta sale cuando toquen el botón, juntos.» | `CONFIRMADO_KIDS.canalB` |
| 7 | Error de la compra: canal A con el WhatsApp del chico igual al del padre | «El WhatsApp de quien lo cuenta tiene que ser distinto del tuyo. Si las preguntas te llegan a vos, elegí «Lo hago yo».» | `web/src/app/_textos/checkout-kids.ts` → `KIDS_MISMO_NUMERO` |
| 8 | Bot: lo contesta una vez si el padre le escribe al número en canal A | «Este número es para las preguntas de {apodo}. Lo que cuenta lo ves en tu panel.» | No está en la web: va en el motor de Kids (`fabrica/src/kids-v2`). |
| 9 | Precio de Kids e impreso | SIN respuesta todavía. Sigue el PDF al precio de `PRECIO_KIDS_*`. | Sin cambios. |
| 10 | España | Kids no se vende en España hasta tener el banco en tú. | Sin cambios (`KIDS_REGIONES`). |

## Cómo quedó armado

- **Mail** (`web/src/lib/mail.ts`, `armarMailAcceso` con `kids: { canal }`): el
  título, el botón, el código, «Al terminar», las dudas y el pie son los del
  mail de siempre en vos. Se sacó «Arranca cuando quiera.»: en el canal A le
  escribimos a la hora elegida y en el B la primera pregunta sale cuando estén
  juntos, así que sobraba y mentía. `confirmar-pago.ts` lee el canal de
  `kids_v2` cuando el pedido es `extras.tipo = "kids"`; si no lo puede leer,
  lo loguea y manda el del canal A.
- **Página** (`/comprar/gracias`): si el narrador tiene fila en `kids_v2`, la
  lista es: la fila del canal (5 o 6), «Mientras cuenta» y «Al terminar» de la
  biografía en vos. El canal A va bajo «Antes» y no «Hoy», porque la hora
  elegida puede ser mañana; el B, bajo «Hoy».

## Para mirar (no se reescribió nada)

- El punto 4 dice que en el panel se pueden escribir hasta tres preguntas,
  pero en la web todavía no hay dónde: `preguntasPadre` nace vacía y ninguna
  pantalla del panel la llena. Hasta que exista, ese texto promete algo que no pasa.
- En el mail y en la página quedan, de la biografía, «Cuando termina de contar,
  el biógrafo escribe su libro.» y «Para ir escuchando lo que cuenta…». No
  mienten para Kids (responde con audios), pero «el biógrafo» no se usa en las
  páginas de Kids.
