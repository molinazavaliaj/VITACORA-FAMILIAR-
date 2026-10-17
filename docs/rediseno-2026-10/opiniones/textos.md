# Textos de la página de opiniones, 17/10

Textos 1-10 APROBADOS por Naza el 17/10 (sin borde cortado, decisión suya). Maqueta elegida (17/10): `opiniones/maqueta-c-revista.html` (la primera, `maqueta.html`, y las opciones A y B quedan como historial). Los números rojos son los de esta tabla.
Código: `web/src/app/_textos/opiniones.ts` (y #9 en `_textos/publico.ts`).

Reglas: sin dos puntos, ninguna oración empieza con «Y» después de punto, sin «usted», no prometer
lo que no pasa, sin cantidad de preguntas ni tiempos. Las opiniones en sí no se traducen: salen
tal como las dio cada persona (`web/src/lib/opiniones.ts`, que arranca vacío).

La página no existe hasta que haya al menos tres opiniones reales con permiso por escrito. El
cierre (lema «Todas las vidas merecen su propio libro.» y el botón «Iniciar Vitácora») es el ya
aprobado de la portada (#30), no se vuelve a aprobar.

## Tanda 1 (toda la página)

| # | Dónde | es (España, tú) | ar (vos) | ca | Estado |
|---|---|---|---|---|---|
| 1 | Etiqueta chica arriba del título | Opiniones | igual | Opinions | APROBADO (Naza 17/10) |
| 2 | Título | Lo que dicen las familias. | igual | El que diuen les famílies. | APROBADO (Naza 17/10) |
| 3 | Bajada | Opiniones de quienes ya tienen su libro en casa. | igual | Opinions de qui ja té el seu llibre a casa. | APROBADO (Naza 17/10) |
| 4 | Debajo de cada opinión, de qué producto es (va con el mes y el año, que salen solos) | Libro familiar · Libro del viaje | igual | Llibre familiar · Llibre del viatge | APROBADO (Naza 17/10) |
| 5 | Encima del trozo del libro, cuando la persona dio permiso para mostrarlo | Una página de su libro | igual | Una pàgina del seu llibre | APROBADO (Naza 17/10) |
| 6 | Título chico al pie de las opiniones | Cómo las comprobamos | igual | Com les comprovem | APROBADO (Naza 17/10) |
| 7 | Texto al pie (en España es obligatorio decir si y cómo se comprueba que las opiniones son de clientes) | Solo publicamos opiniones de personas que hicieron su libro con Vitácora. Comprobamos cada una con su pedido y la publicamos con su permiso, sin cambiar sus palabras. (Cambiado por Naza 17/10, antes «que compraron un libro en Vitácora».) | igual | Només publiquem opinions de persones que han fet el seu llibre amb Vitácora. Comprovem cadascuna amb la seva comanda i la publiquem amb el seu permís, sense canviar les seves paraules. | APROBADO (Naza 17/10) |
| 8 | Botón al pie (solo cuando Google verifique la ficha; mientras, no se ve) | Ver todas las opiniones en Google | igual | Veure totes les opinions a Google | APROBADO (Naza 17/10) |
| 9 | Enlace discreto en el pie de toda la web, junto a «Entrar» (solo con tres opiniones o más) | Opiniones | igual | Opinions | APROBADO (Naza 17/10) |
| 10 | Título de la pestaña y descripción para Google | Opiniones · Lo que dicen las familias que ya tienen su libro de Vitácora. | igual | Opinions · El que diuen les famílies que ja tenen el seu llibre de Vitácora. | APROBADO (Naza 17/10) |

ar: en esta página no hay ningún verbo de tú o vos, por eso va igual que es.

ca: PENDIENTE DE REVISIÓN NATIVA (todo lo de la columna ca).

## Ojo con el #7 (que no quede mintiendo)

El #7 describe cómo trabajamos. Para que sea verdad, cada opinión que se cargue en
`web/src/lib/opiniones.ts` tiene que tener:
- el pedido con el que se comprobó que esa persona compró (campo `pedido`, no se muestra),
- dónde consta su permiso por escrito para publicarla (campo `permiso`, no se muestra),
- la frase tal como la dijo, sin corregirla.

Si alguna vez se publica una opinión que no cumple esto, hay que cambiar el #7.

## Cómo se ve cada opinión (no son textos fijos, salen del archivo de datos)

«La frase» en cursiva grande · **Nombre de pila**, relación · Ciudad · LIBRO FAMILIAR · mes y año.
La relación la escribe quien carga la opinión, en el idioma de la frase («hija de Carmen»,
«narradora», «néta de Montserrat», «viajero»).
