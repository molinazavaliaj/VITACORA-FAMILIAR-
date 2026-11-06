# Checkout, etapa 1 (antes de Black Friday, 27/11)

Decisiones aprobadas por Naza el 06/11 (las 13 de la investigación). Rama `checkout-acuarela`, sale de `portada-nueva` (PR #213) porque usa sus estilos. Se mergea después de ese PR.

## Qué entra

1. **Medir el embudo.** Contador propio por día, paso, región y celular o compu, sin cookies ni datos personales, así que no depende del aviso de cookies. Tabla `embudo_compra`, `POST /api/embudo` y una tabla en `/admin`. Pasos: entró, paso 2, paso 3, apretó Pagar, pagó. Sale del libro de una vida y queda listo para los otros.
2. **Primera pantalla del celular.** Cabecera de un renglón (logo y dudas; «Pago seguro» y «Entrar» solo en compu). El aviso de cookies deja de tapar la barra del botón: la barra sube lo que mida el aviso.
3. **Acuarela en todas las compras.** `.chk` y `.chk-cabecera` toman los valores de Acuarela: fondo blanco cálido, manchas, bordó. Sale la cabecera negra y el borde rasgado. El acento sigue al producto, como en las páginas (Viaje azul, Kids terracota, Historia verde). Como todo pinta con tokens, cambia también `/comprar/viaje`, `/kids`, `/historia`, `/regalar` y gracias. Hay que revisarlas una por una.
4. **Estante en el paso 1 del libro.** Los tres libros en `/rediseno/estante.jpg` y una nota de papel por opción colgada debajo, como la portada. Radios nativos, un solo grupo. Las copias y el marco extra quedan dentro de la opción elegida.
5. **Resumen como nota de papel**, con la tapa y el nombre. En celular, el total sigue en la barra fija.
6. **Precio claro.** Sigue marcada la opción impresa (ya es así desde el 25/10). El orden no cambia. En el impreso, la fila del marco dice lo que se cobra (la diferencia con el pack) y al marcarla elige el pack.
7. **Sin tachados.** Fuera el tachado del pack, «Ahorras» en el resumen y su equivalente en Argentina. `ahorroDelPack` sigue para decidir si hay pack. La promo global (`PROMO`) no se toca: está apagada y es otra cosa.
8. **Navidad con la verdad.** Al elegir fecha, nota «El 24 le das la tarjeta». Sin contador. La fecha tope de la tarjeta impresa no se publica hasta que Naza la defina.
9. **Botones.** «Iniciar Vitácora» y «Continuar» pasan a «Seguir». El último sigue «Pagar 99 €».
10. **Lo que tranquiliza, sin garantía.** Nota «Si no sabe usarlo» en el paso 2 y arriba del botón. La garantía sigue en letra chica hasta que opine el abogado; el cambio queda preparado detrás de `GARANTIA_A_LA_VISTA=1`, apagado.
11. **Métodos de pago.** El texto deja de decir «solo tarjeta». Stripe ya elige solo los métodos del panel (`checkout.sessions.create` sin lista fija). Bizum se prende en el panel cuando se confirme que es pago inmediato ([[stripe-pagos-diferidos]]).
12. **Cuotas en Argentina.** Línea de 3 cuotas con el contado al lado, detrás de `CUOTAS_AR`, apagada hasta tener el costo real de Mercado Pago.
13. **Texto que queda mintiendo.** El resumen dice «Escuchas sus audios mientras cuenta». Con la opción A eso deja de ser cierto. Se cambia por lo que sí ve.

## Qué no entra

Pagar primero en el regalo y Viaje (etapa 2, con el embudo ya midiendo). Dirección después de pagar (entra solo si llega el tiempo, y falta definir qué pasa si no contesta). Recordatorio y oferta después de pagar (abogado primero). Klarna. Formularios propios de Kids e Historia, salvo la pintura.

## Riesgos que hay que probar

- Contraste de los tokens nuevos en campos, errores y estados elegidos.
- `.chk-op*` y el `dir-tinta` de la ficha están pensados para fondo crema con tinta. Hay que reescribirlos, no solo cambiar variables.
- Volver de un pago fallido conserva lo elegido, también con el estante.
- `test/checkout-3-pasos.test.tsx` y `carrito-voz` afirman textos y tachados que cambian.
- Apple Pay y Google Pay solo se pueden ver en un teléfono real, con una compra de prueba de Naza.

## Cómo se comprueba

Tests de web y build. Recorrido en el navegador a 390 y 1440 px de las compras en los tres idiomas, hasta antes de pagar, sin crear compras reales. Medir el largo y la primera pantalla contra los números de la investigación (paso 1 de 2.087 px, botón tapado por el aviso).
