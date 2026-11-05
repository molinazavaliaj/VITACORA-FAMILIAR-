# Portada nueva: menos explicación, más producto

Fecha: 05/11/2026. Maqueta: https://claude.ai/artifact/US6tM3NkcVT67N7A54y5wM

## Objetivo

Que quien entra entienda el producto y vea opciones y precios en la segunda pantalla. Se reemplaza el recorrido actual, largo y explicativo, por uno de tienda.

Metas medibles, con el mismo método del 05/11 (1440 px, página entera):

| Medida | Hoy | Meta |
|---|---|---|
| Superficie con imagen o video | 14 % | al menos 35 % |
| Primer precio | a 9.669 px | antes de 1.800 px |
| Palabras | 1.365 | alrededor de 600 |
| Largo | 15.759 px | hasta 9.000 px |

## Qué se toma de Mila y qué no

Mila está hecha en Framer y no tiene un repositorio público. Se toma el esquema: inicio corto, opciones con precio enseguida, explicación visual en cuatro pasos, poco texto y mucho movimiento.

No se copian sus textos, sus imágenes ni su animación. El movimiento de los audios que se vuelven libro se diseña de cero.

## Orden de la página

1. **Inicio, una pantalla.** Fondo Acuarela, cabecera, «En cada familia hay un libro sin escribir», libro 3D y un botón «¿Para quién es?». El libro gira, se abre y vuelve a cerrarse, y queda cerrado. Se quitan la bajada, las ventajas, el enlace al ejemplo y «tu propia vida». Se quita el aire de 40svh.
2. **Tienda.** Título «Vitácora convierte una vida en un libro para siempre», bajada, fila de atajos y seis cajitas.
3. **Audios que se vuelven capítulos.** Movimiento propio, solo con CSS.
4. **Así se hace su libro.** Cuatro fotos: se lo regalas, responde por WhatsApp, añades tus preguntas, llega a casa.
5. **Se lee y se escucha.** Foto o video con el QR, y la onda de voz quieta, sin reproducir, como decidió Naza el 25/10.
6. **Lo que dicen las familias.** Solo con videos reales y permiso firmado. Mientras no los haya, la sección no se muestra. Las fotos generadas no se presentan como clientes.
7. **Privacidad.** Un bloque corto. Sin «Unión Europea» ni «no los vendemos».
8. **Preguntas.** Se queda el acordeón actual, porque la garantía vive ahí (D1).
9. **Cierre y pie.** La frase «Un día vas a querer preguntarle algo» y un botón.

Salen de la portada: «Qué es», «Tú lo vas siguiendo» y el teléfono, los pasos largos de «Cómo funciona», la carta, «Cada vida merece», Marcos, Regalo y «Nuestras ediciones». La ruta `/telefono-historia` sigue existiendo, pero la portada deja de usarla; `seo.ts` y sus tests se actualizan si la nombran.

## Las seis cajitas

Tres por fila en compu, dos en celular, con el ancho máximo de la maqueta (760 px). Cada una tiene foto con el mismo recorte, título, una línea, un «Ideal si…» de color propio, precios y enlace.

| Cajita | Precios | Enlace |
|---|---|---|
| Para un familiar (marca «El regalo») | impreso y digital, solo digital | Ver Vitácora Familiar → `/comprar?regalo=1` |
| Para ti | impreso y digital, solo digital | Ver Vitácora para ti → `/comprar` |
| Para un niño (Próximamente) | sin precio | Ver Mi Primer Capítulo → `/kids` |
| Para un viaje | impreso y digital, solo digital | Ver Vitácora de Viaje → `/viaje` |
| Para un evento | Consultar | Ver Vitácora Eventos → `/eventos` |
| Con una editora | Consultar hasta tener precio | Ver Vitácora Biógrafo: abre el bloque de Florencia |

- Los precios salen de `catalogo()` por región, nunca escritos a mano. Viaje impreso es `viaje + impreso`. Si la región no tiene un producto, esa fila no se muestra.
- «Para un familiar» lleva a `/comprar?regalo=1`, con el regalo ya elegido. No lleva a `/regalar`, que solo vende el PDF y se dejó de enlazar el 26/10 porque confundía.
- «Vitácora de una historia» queda fuera hasta que se venda.
- Marcos y copias quedan como extras de la compra.
- Vitácora Biógrafo no vende en esta etapa: el bloque lleva a escribir por WhatsApp. No se publica hasta tener el permiso de Florencia, su foto real y su texto; hasta entonces la cajita no se muestra.

## Paleta

Acuarela: blanco cálido de base, manchas lavadas de rosa bordó y aqua en inicio y cierre, bordó `#7a1f2e` en botones y títulos, y seis tintes claros para los «Ideal si…».

Los tokens nuevos viven en una capa propia de la portada. No se cambian los valores de `_direccion/tokens.css`, compartidos con el checkout y el panel. Al entrar al checkout hay que mirar el salto de color; si molesta, se ajusta en un cambio aparte.

## Textos

- Todos van a Naza en tandas de 10, con una versión recomendada.
- La frase con «biografía» y «memorias» se reubica en la sección 4 para no perder lo hecho por SEO el 04/11.
- Reglas vigentes: sin dos puntos, ninguna oración empieza con «Y», sin «padre» ni «desde» seguido de número. Trato por idioma: tú, vos, catalán.
- Hay un solo componente para `/`, `/ar` y `/ca`, así que el catalán sale en el mismo cambio, con el corrector de Softcatalà y la revisión de Imma pendiente.
- `_textos/portada.ts` también lo usan las landings y `/ejemplo`: esos textos no se borran.

## Dependencia con el panel

La opción A la implementa el Claude de Joaquín en otro PR. El bloque de privacidad dice que lo contado queda privado hasta el libro solo cuando ese PR esté en producción. Si la portada sale antes, usa únicamente la frase del borrado de los audios y ninguna promesa sobre quién escucha.

## Pruebas y comprobación

- Actualizar `test/portada-trato.test.tsx` y `test/seo.test.tsx` a la nueva estructura. Los datos estructurados de `seo.ts` dejan de anunciar el marco, porque la portada ya no lo muestra; el libro impreso sigue igual.
- Tests nuevos: las seis cajitas y sus enlaces; precios del catálogo en es y ar; sin Biógrafo cuando falte su configuración; sin sección de familias cuando no haya videos.
- En el navegador, a 1440 y 390 px: el libro termina cerrado, la hoja blanca sube al empezar a bajar, sin movimiento horizontal, con «menos movimiento» todo se ve quieto y completo.
- Volver a medir las cuatro metas y comparar carga contra la portada actual.

## Fuera de este cambio

- Videos reales y la tanda final de fotos: entran después, reemplazando imágenes, sin tocar la estructura.
- Pedidos y envíos en el admin, y la opción A del panel: trabajos aparte.
- Colores de checkout y panel. Páginas de Viaje, Kids y landings.
- Comparar paletas con ventas, cuando haya visitas suficientes.
