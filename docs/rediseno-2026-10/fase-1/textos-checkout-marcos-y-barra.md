# Textos: libro completo primero, marcos para regalar y barra del teléfono (14/10)

| Dónde | es | ar | ca | Estado |
|---|---|---|---|---|
| /comprar, opción del libro completo | «Impreso + digital + su foto enmarcada» / «El libro impreso y en PDF, y un marco con su foto. Acercas el móvil al marco y se abre su libro, con su voz.» | «…Acercás el celular…» | «Imprès + digital + la seva foto emmarcada» / … | es y ar APROBADOS por Naza el 14/10; ca pendiente nativa |
| /comprar/viaje, opción del libro completo | «Impreso + digital + vuestra foto enmarcada» / «…con vuestra foto del viaje. Acercáis el móvil…» | «…tu foto enmarcada» / «…Acercás el celular…» | «…la vostra foto emmarcada» | es y ar APROBADOS por Naza el 14/10; ca pendiente nativa |
| Contador de marcos, título | Marco con foto y chip NFC | igual | Marc amb foto i xip NFC | es y ar APROBADOS el 14/10; ca pendiente nativa |
| Contador de marcos, detalle (/comprar) | Para regalar a tus familiares. Al acercar el móvil se abre su libro, con su voz. | …Al acercar el celular… | Per regalar als teus familiars. Quan hi acostes el mòbil s'obre el seu llibre, amb la seva veu. | es y ar APROBADOS el 14/10; ca pendiente nativa |
| Contador de marcos, detalle (/comprar/viaje) | Para regalar a vuestra familia. Al acercar el móvil se abre el libro del viaje, con vuestra voz. | Para regalar a tu familia. Al acercar el celular se abre el libro del viaje, con tu voz. | Per regalar a la vostra família. Quan hi acosteu el mòbil s'obre el llibre del viatge, amb la vostra veu. | PENDIENTE OK de Naza (adaptado a la voz de viaje) |
| Precio del contador con la opción 2 | «+20 € el primero, +15 € los demás» | igual | «+20 € el primer, +15 € els altres» | PENDIENTE OK (la forma la propuso el encargo); las cifras salen del catálogo |
| Precio del contador con la opción 3 | «+15 € cada uno» | igual | (el de siempre) | Texto existente (`cadaUno`) |
| Barra del teléfono | «Total» + «Continuar» / «Pagar {total}» / en regalar «Continuar» y «Pagar y descargar la tarjeta» | igual | igual | Textos existentes |

«Para regalar» pasó a la opción del libro completo (Naza 14/10). La de impreso + digital
queda sin pastilla.

Sin precio de marco adicional (`PRECIO_MARCO_ADICIONAL_*`) el servidor no cobra
ni manda un segundo marco (`armarCompra`). Por eso, en ese caso, el contador de la
opción 2 llega hasta 1 («+20 €») y la opción 3 no tiene contador. No es «el resto a
precio de marco», como sugería el encargo: eso pediría cambiar la cuenta del cobro.
