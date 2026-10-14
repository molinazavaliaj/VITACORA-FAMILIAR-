# Textos: compras y ejemplo en la dirección «la web es un libro» (14/10)

Re-vestido sin textos nuevos escritos a mano. Lo único que una persona ve
o escucha por primera vez en un lugar nuevo (pendiente del OK de Naza):

| Dónde aparece | Texto es | Texto ar | De dónde salió |
|---|---|---|---|
| /regalar, nombre de los pasos para lectores de pantalla (`aria-label` del `<nav>`) | `CHECKOUT.es.pasosEtiqueta` | `CHECKOUT.ar.pasosEtiqueta` | El mismo de /comprar (antes /regalar no tenía nombre en esa lista) |
| /ejemplo, tapa y contratapa (libro 3D) | «El libro de su vida», «Osvaldo / Toroide», «para siempre», «O · T», lomo «Osvaldo Toroide · El libro de su vida», texto de contratapa, «Escucha su voz», «vitacorafamiliar.com» | igual | `TEXTOS_PORTADA[idioma].direccion.libro` (los del prototipo de la portada, ya en la rama) |
| /ejemplo, nombre accesible de la tapa y de la contratapa | `libro.altPortada`, `libro.altContraportada` | igual | Los alt que ya tenían las fotos de la tapa y la contratapa |

Nota: el QR de la contratapa es de verdad y lleva a /ejemplo (lo arma Libro3D).
El comentario de `_textos/ejemplo.ts` decía que se había sacado «el código QR
dibujado que invitaba a escanear algo que no suena»: con este cambio vuelve un
QR (real, a /ejemplo), porque el encargo pidió la contratapa con «Escucha su voz».
Naza decide si queda.
