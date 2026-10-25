# Repaso de la web pública · 25 de octubre de 2026

Para Naza. Lo escribió Fable mirando la rama `main` de hoy (commit `d21c3097`).

## Cómo lo miré

- Levanté la web en una compu de prueba y saqué capturas de cada página en celular (390 × 844) y en computadora (1366 × 800), bajando de a poco para que se disparen las animaciones.
- Páginas vistas: la portada (`/`, `/ar`, `/ca`), `/kids`, `/viaje`, `/historia` (en España y Argentina), `/ejemplo`, `/regalar`, `/cuaderno`, `/eventos`, `/comprar` y `/opiniones`.
- Leí también los textos y el código de cada página para saber qué sección tiene cada una.
- Las capturas están en `/tmp/claude-0/fable-capturas/`. Las ocho que mejor muestran los problemas están en `/tmp/claude-0/fable-capturas/elegidas/`, con nombres que dicen qué muestran.

Dos aclaraciones antes de empezar:

1. **Los precios de las capturas son de prueba.** La compu de prueba no tiene los precios reales, así que cargué números inventados (49 €, 89 €, 109 €, 59 €, 39 €, etc.). Lo que importa no es el número sino cómo se muestra.
2. **`/opiniones` da «página no encontrada» a propósito.** La página existe, pero está programada para no aparecer hasta que haya al menos tres opiniones reales con permiso por escrito. Hoy hay cero. El pie tampoco la enlaza mientras tanto. No es un error.

---

## A. Estética: qué se ve mal o flojo

Cada punto dice la página, el lugar, qué pasa y qué haría. Van de lo más grave a lo más fino.

### A1. Historia · el botón de comprar no se ve (grave)

- **Dónde:** `/historia`, bloque «Un solo pago», en celular y en compu. Capturas `01` y `02`.
- **Qué pasa:** el botón «Empezar el libro» es del color del papel, y ese bloque está sobre papel. Se ve solo el texto, suelto, sin forma de botón. Es el botón más importante de la página y parece un título chico. En Viaje y en Kids el mismo bloque está sobre fondo oscuro o tiene su propio color, por eso ahí sí se ve.
- **Propuesta:** en los bloques de papel usar el botón de tinta (el negro que ya existe en la portada, en «Escribir por WhatsApp»). Mejor todavía: que el botón lleno sepa solo si está sobre papel o sobre tinta y cambie de color, así no vuelve a pasar en ninguna página nueva.

### A2. Viaje · el libro 3D abierto queda corrido y cortado (grave) — **ya arreglado** (PR #165, publicado el 25/10 a las 11:12 UTC; esta revisión se hizo sobre la versión de antes)

- **Dónde:** `/viaje`, el libro del inicio, después de que gira y se abre. En celular y en compu. Capturas `03` y `04`; compará con la `05`, que es el de Familiar bien centrado.
- **Qué pasa:** cuando el libro de Sara y Dani se abre, el pliego queda pegado al borde izquierdo y se pierde media página («Día 1 · Alfama» aparece cortado). En compu queda todo el lado derecho vacío. En Familiar el mismo libro queda centrado.
- **Por qué:** en la portada el libro va dentro de una «caja» que lo centra y le fija el tamaño (`prt-libro`). En Viaje falta esa caja: el libro usa el tamaño genérico y nadie lo centra.
- **Propuesta:** envolver el libro de Viaje con la misma caja que usa la portada. Es un cambio chico.

### A3. Kids (España) · una pregunta está en argentino

- **Dónde:** `/kids`, preguntas frecuentes, cuarta pregunta. Captura `07`.
- **Qué pasa:** dice «¿Le escribís a cualquier hora?» en la versión de España, con voseo. La respuesta, en cambio, dice «Tú eliges…». Chirría justo en el bloque que está hecho para dar confianza.
- **Propuesta:** cambiar a «¿Le escribes a cualquier hora?» en `_textos/kids.ts` (bloque `es`, línea 160). Conviene también pasar un buscador de «ís/és/ás» por los textos de España de todos los productos.

### A4. Familiar · el botón verde de WhatsApp tapa cosas en el celular

- **Dónde:** `/`, en celular, varias veces. Captura `06`.
- **Qué pasa:** el botón flotante de WhatsApp tapa el texto de las ventajas («Sus mejores fras…»), después tapa la foto de la guitarra en la carta, y más abajo convive con la barra de compra fija. En el celular hay tres cosas pegadas a la pantalla a la vez (barra de compra, WhatsApp y el contenido que pasa por abajo). Es mucho.
- **Propuesta:** en celular, esconder el botón flotante mientras está visible la barra de compra, y mostrarlo solo cuando la barra se esconde (en el precio, el cierre y el pie). O achicarlo (44 px) y correrlo arriba de la barra con más margen. Ya hay WhatsApp en «¿Te queda alguna duda?» y en el pie: no se pierde nada.

### A5. Familiar · la hoja de papel tapa el final del inicio demasiado rápido (celular)

- **Dónde:** `/`, al terminar el inicio, en celular.
- **Qué pasa:** las cuatro ventajas con tilde y la frase «¿Quieres contar tu propia vida? También puedes hacer tu libro» se ven apenas unos centímetros de scroll y enseguida sube la hoja de papel y las tapa (también tapa el botón «Iniciar Vitácora» a la mitad, que queda cortado un instante). Medí: se ven en una franja de unos 300 px de scroll. Mucha gente no las va a leer.
- **Propuesta:** que el inicio se «fije» un poco más tarde (dejar que las ventajas lleguen al medio de la pantalla antes de que suba el papel), o mover «¿Quieres contar tu propia vida?» al bloque del precio, donde hay tiempo de leerla.

### A6. Historia · es la única página sin una sola foto

- **Dónde:** `/historia`, toda la página. Captura `08`.
- **Qué pasa:** inicio, lista de temas, cómo funciona, precio, preguntas y cierre: todo texto. Al lado de Familiar (libro 3D, teléfono, vidriera, guitarra, marco, abuelo), Kids (video y cinco fotos) y Viaje (libro 3D y tres fotos), Historia parece un borrador. El código lo dice: «No hay fotos ni video de este producto: los bloques son de texto».
- **Propuesta:** como mínimo, una foto de época en «No hace falta una vida entera» (alguien joven en su primer negocio, una valija en un andén) y el libro 3D en el inicio con una tapa de Historia (ver la parte B). Con dos imágenes la página cambia de categoría.

### A7. Precio distinto según por dónde entrás

- **Dónde:** `/` dice un solo precio (el libro impreso con el PDF: 89 € con mis números de prueba). `/ejemplo` pone en el botón el precio del PDF solo (49 €). `/comprar` abre con el pack completo preseleccionado (109 €). `/regalar` muestra el PDF (49 €).
- **Qué pasa:** alguien que leyó «89 €» en la portada toca «Iniciar Vitácora» y aterriza en 109 €. Otro que entra por `/ejemplo` ve 49 € y después 109 €. Cada entrada ancla un número distinto. Insisto en que los números son de prueba, pero la lógica (base / base+impreso / pack) es la real.
- **Propuesta:** decidir cuál es el precio «ancla» (yo diría el que anuncia la portada) y que `/ejemplo`, `/regalar` y la opción preseleccionada de `/comprar` repitan ese mismo. Si el pack es lo que más conviene vender, que la portada lo anuncie como tal («el regalo completo»), no como otro número.

### A8. El botón de la cabecera dice otra cosa que la página

- **Dónde:** cabecera de `/kids`, `/viaje` y `/historia`, en compu.
- **Qué pasa:** arriba a la derecha el botón dice «Iniciar Vitácora» en las cuatro páginas. Pero los botones grandes de cada página dicen «Empezar su libro», «Empezar el libro del viaje», «Empezar el libro». Son dos nombres para la misma acción en la misma pantalla.
- **Propuesta:** que la cabecera use el texto del producto que está activo (Kids, Viaje, Historia ya tienen su texto aprobado).

### A9. `/ejemplo` no se llega desde la portada

- **Dónde:** `/` y `/ejemplo`.
- **Qué pasa:** la portada no tiene ningún enlace a `/ejemplo`. El único «camino» es el QR dibujado en la contratapa del libro 3D, que nadie escanea desde una pantalla. Solo las landings de anuncios enlazan «Ver el libro de ejemplo». Es la página que mejor responde «¿y cómo queda?» y está escondida.
- **Propuesta:** un enlace «Hojear un libro de ejemplo →» debajo del libro 3D del inicio y otro en el bloque «El libro». Chico y rinde.

### A10. Familiar · «Qué es» deja media pantalla vacía (compu)

- **Dónde:** `/`, bloque «Un regalo para quien cuenta y otro para toda la familia», en compu.
- **Qué pasa:** el título y la bajada ocupan la columna izquierda y a la derecha no hay nada; el teléfono con la página de su historia aparece recién más abajo, con «Tú lo vas siguiendo de cerca». Entre medio hay una hoja casi vacía.
- **Propuesta:** subir el teléfono a la altura del título (dos columnas desde arriba) o reducir el aire entre los dos bloques.

### A11. El pie en celular es una columna larguísima

- **Dónde:** el pie de todas las páginas, en celular.
- **Qué pasa:** Términos, Privacidad, Desistimiento, Reclamaciones, Contacto, mail, WhatsApp, horario, Entrar, Eventos, ¿Estás en Argentina?… una debajo de otra, en mayúsculas espaciadas. Son casi dos pantallas de pie.
- **Propuesta:** dos columnas en celular (legales a la izquierda, contacto a la derecha) y los enlaces menores en una sola línea separados por puntos.

### A12. Viaje · demasiado aire negro entre bloques (celular)

- **Dónde:** `/viaje`, entre la foto del hotel y «Cómo funciona», y entre el precio y las preguntas.
- **Qué pasa:** en celular hay casi una pantalla entera vacía entre la foto y el bloque siguiente. El título «Las fotos quedan. Lo que viviste, también.» es enorme y la foto en arco queda chica y pegada a la derecha, con mucho vacío alrededor.
- **Propuesta:** bajar el espaciado vertical de esos bloques en celular (hoy es el de compu) y darle a la foto el ancho completo.

### A13. Kids · un quiebre feo en el titular (celular)

- **Dónde:** `/kids`, «Los dibujos se pierden. Lo que pensaba, también.», en celular.
- **Qué pasa:** la segunda línea queda «Lo que / pensaba, también.», con «Lo que» solo arriba. También pasa en el inicio: «Un día no vas / a recordar».
- **Propuesta:** ajustar el ancho máximo del titular en celular o poner un espacio que no se parte entre «Lo que» y «pensaba».

### A14. Coherencia general (lo que está bien)

Para que no parezca que todo está mal: la dirección «la web es un libro» (tinta y papel, letra grande, bordes de hoja rasgada, los números en cursiva, el logo que se dibuja) se mantiene bien en Familiar, Viaje, Historia, Eventos, Cuaderno y la compra. Kids se sale a propósito (todo claro, con terracota) y se nota que es otro producto sin dejar de ser la misma marca. La cabecera con las cuatro solapas es la misma en todas. La versión catalana se ve igual de bien que la de España.

---

## B. Lo que tiene Familiar y les falta a las otras

Fila por fila, las secciones de la portada de Familiar. ✓ la tiene · ~ la tiene a medias · ✗ no la tiene.

| Sección de Familiar | Kids | Viaje | Historia |
|---|:---:|:---:|:---:|
| Inicio con el logo que se dibuja, lema grande y bajada | ✓ | ✓ | ✓ |
| Libro 3D que gira y se abre | ~ (video del libro, no 3D) | ✓ (pero corrido, ver A2) | ✗ |
| Dos botones: comprar + «Cómo funciona ↓» | ✓ | ✓ | ✓ |
| Cuatro ventajas con tilde («Solo manda audios», «Sin apps»…) | ✗ | ✗ | ✗ |
| «¿Y si quiero hacer mi propio libro?» | ✗ | ✗ | ~ (lo dice en el paso 1) |
| Qué es + la pantalla de la página de su historia (teléfono) | ~ («Tú lo ves todo», con foto, sin pantalla) | ✗ | ✗ |
| Cómo funciona, pasos numerados | ✓ (3 pasos) | ✓ (4) | ✓ (4) |
| Dibujos a lápiz en cada paso | ✗ | ✗ | ✗ |
| Carta de los fundadores sobre la vidriera | ✗ | ✗ | ✗ |
| Audio de muestra que suena (voz real) | ~ (un chat con un audio dibujado, no suena) | ✗ | ✗ |
| Contratapa con QR «Escucha su voz» | ✗ | ~ (lo nombra en el paso 4) | ~ (lo nombra en «Esa historia, hecha libro») |
| Fotos o video del producto | ✓ (5 fotos + video) | ✓ (3 fotos + 3D) | ✗ |
| Tres beneficios (Léelo · Escúchalo · Para siempre) | ✗ | ✗ | ✗ |
| Lista «qué incluye» | ~ (una frase) | ~ (un párrafo) | ~ (un párrafo) |
| Precio único con «pago único, sin suscripciones» | ✓ | ✓ | ✓ |
| Marco con su voz (demo) | ✗ (a propósito) | ✗ | ✗ |
| Sección de regalo + enlace a /regalar | ✗ | ~ (solo una pregunta frecuente) | ~ (en pasos y preguntas) |
| Preguntas frecuentes | ✓ (6) | ✓ (6) | ✓ (7) |
| Garantía / devolución | ✗ | ✓ («¿Y si el viaje se cancela?») | ✗ |
| «¿Te queda alguna duda?» con botón de WhatsApp | ✗ | ✗ | ✗ |
| Botón flotante de WhatsApp | ✗ | ✗ | ✗ |
| Barra de compra fija en celular | ✗ | ✗ | ✗ |
| Enlace a /ejemplo para hojear | ✗ (ni Familiar lo tiene, ver A9) | ✗ | ✗ |
| Cierre con lema grande + botón | ✓ | ✓ | ✓ |
| Enlace cruzado a Familiar | ✓ | ✓ | ✓ |
| Opiniones de clientes | ✗ (nadie: no hay reales todavía) | ✗ | ✗ |

### Qué agregaría en cada una, y por qué

**Kids**

1. **Un audio que suene.** El chat de ejemplo tiene un audio dibujado que no hace nada. Si tocás y no pasa nada, decepciona. Con 15 segundos de un chico contando una travesura (con permiso, o grabado por un sobrino) el producto se entiende en un instante. Esfuerzo chico si hay audio.
2. **Garantía.** El código dice que Kids no tiene texto de garantía aprobado. Es un producto para padres que dudan; «si no contesta ninguna pregunta, te devolvemos todo» cierra ventas. Hace falta el texto, no código.
3. **Barra de compra fija y WhatsApp en celular,** como en Familiar: la página es larga (10.000 px en celular) y el botón de comprar queda arriba y abajo nada más.
4. **«¿Te queda alguna duda?»** antes del cierre. Kids genera preguntas de padres («¿y la privacidad?», «¿quién habla con mi hijo?»); hoy no hay a quién preguntarle.
5. **Las ventajas con tilde** en el inicio, adaptadas: «Sin apps», «Vos leés todo», «Un sobre cerrado para cuando crezca».

**Viaje**

1. **Arreglar el libro 3D** (A2). Es su mejor pieza y hoy está rota.
2. **Un pliego para hojear** o el enlace a un `/ejemplo` de viaje: el libro de Sara y Dani ya tiene tapa, un «Día 1 · Alfama» y una foto. Con cuatro páginas más tendríamos un ejemplo hojeable de viaje.
3. **Sección de regalo propia.** La pregunta frecuente «¿Se lo puedo regalar?» muestra que el regalo existe (luna de miel, viaje de egresados, jubilación), pero no hay un bloque que lo diga con una foto. Viaje es probablemente el producto más regalable.
4. **Audio de muestra:** un audio de 20 segundos grabado desde un hotel. Es lo que diferencia esto de un álbum de fotos.
5. **Las ventajas con tilde:** «Una pregunta por día», «Decís “paso” y seguimos», «El álbum con tus fotos», «Tu voz en un QR».
6. **Barra fija en celular + WhatsApp.**

**Historia**

1. **Libro 3D** con una tapa de Historia (por ejemplo «El negocio · Carmen Toroide») y un pliego. Hoy el inicio es logo + texto + botones, y el 3D es la pieza que define la casa.
2. **Al menos dos fotos** (A6).
3. **Un ejemplo leíble:** un párrafo de un capítulo de una historia inventada, como la cita de «El campo» en Familiar. Historia vende profundidad («contado al máximo detalle»): hay que mostrar un trozo de ese detalle.
4. **Garantía.** Es un producto nuevo; no dice nada de devolución. Reusar la de Familiar («si contesta menos de diez preguntas, te devolvemos todo»).
5. **Ventajas con tilde**, lista «qué incluye» con guiones (como Familiar) en vez de un párrafo, y **«¿Te queda alguna duda?»**.
6. **Barra fija en celular + WhatsApp.**

**Para las tres**

Las tres carecen de lo mismo: barra de compra fija en celular, WhatsApp flotante, bloque «¿Te queda alguna duda?», ventajas con tilde y audio real. Todas esas piezas ya existen en el código de la portada; es más cuestión de decidir que de construir.

---

## C. Propuestas propias

1. **«Probá una pregunta»: que te llegue una de verdad por WhatsApp.** Un campo con tu número en la portada (y en Kids, Viaje, Historia): escribís tu WhatsApp y en un minuto te llega una pregunta real del biógrafo. Es la demo definitiva: el visitante vive el producto antes de pagar y nosotros nos quedamos con su número para seguir la conversación. Ninguna página lo explica mejor que recibirlo. Esfuerzo grande (hay que conectar con el motor), pero es lo que más puede mover ventas.

2. **Un audio real de 20 segundos en cada producto.** Lo que más emociona de la portada es «El campo» con la voz de verdad. Kids, Viaje e Historia venden lo mismo (la voz guardada) y no se escucha nada. Un audio por producto, con permiso, y el mismo reproductor de onda. Esfuerzo chico si existen los audios.

3. **«¿Cuál es para vos?»: un selector de los cuatro productos.** Hoy la única pista de que hay cuatro productos son las solapas de la cabecera. Un bloque corto antes del cierre de cada página: «Una vida entera → Familiar · Una sola historia → Historia · Un viaje → Viaje · Un chico de once → Kids», con una línea y un enlace cada uno. Ayuda a quien llegó al producto equivocado y vende los otros tres. Esfuerzo chico.

4. **Un ejemplo hojeable por producto.** `/ejemplo` ya resuelve «¿cómo queda?» para Familiar con el libro de Osvaldo. Hacer lo mismo con el libro de Sara y Dani (Viaje), el de Nico (Kids) y uno de Historia, usando la misma pieza que pasa páginas. Y enlazarlos desde cada inicio. Esfuerzo medio (hay que escribir cuatro o cinco páginas inventadas por producto).

5. **Libros de verdad.** La portada aclara en el código que las fotos son personas generadas. En un producto que vende memoria familiar, una foto de un libro real sobre una mesa real vale más que cualquier render. Pedirle a los primeros clientes una foto del libro en su casa (y una frase) y armar «Libros que ya existen». Eso además destraba `/opiniones`, que hoy está vacía. Esfuerzo chico en código, medio en conseguir el material.

---

## D. Prioridad

De lo más importante a lo menos. Esfuerzo: chico (horas), medio (días), grande (semanas).

| # | Qué | Página | Esfuerzo |
|---|---|---|---|
| 1 | Botón de comprar invisible sobre papel (A1) | Historia | chico |
| 2 | ~~Libro 3D corrido y cortado (A2)~~ ya arreglado en el PR #165 | Viaje | — |
| 3 | Pregunta en voseo en la versión de España (A3) | Kids | chico |
| 4 | Enlace a `/ejemplo` desde la portada (A9) | Familiar | chico |
| 5 | Un precio ancla coherente entre portada, ejemplo, regalo y compra (A7) | todas | medio |
| 6 | Fotos y libro 3D en Historia (A6, B) | Historia | medio |
| 7 | Audio real de muestra en Kids, Viaje e Historia (C2, B) | las tres | chico si hay audios |
| 8 | WhatsApp flotante que no tape contenido en celular (A4) | Familiar y las que lo sumen | chico |
| 9 | Barra de compra fija + WhatsApp + «¿Te queda alguna duda?» en Kids, Viaje e Historia (B) | las tres | chico |
| 10 | Garantía en Kids e Historia (B) | Kids, Historia | chico (falta el texto) |
| 11 | Selector «¿Cuál es para vos?» (C3) | todas | chico |
| 12 | Botón de la cabecera con el texto del producto (A8) | Kids, Viaje, Historia | chico |
| 13 | Ventajas con tilde y «qué incluye» con guiones en las tres (B) | las tres | chico |
| 14 | El papel tapa demasiado rápido las ventajas del inicio en celular (A5) | Familiar | medio |
| 15 | Sección de regalo en Viaje (B) | Viaje | chico |
| 16 | «Probá una pregunta» por WhatsApp (C1) | todas | grande |
| 17 | Ejemplo hojeable por producto (C4) | Viaje, Kids, Historia | medio |
| 18 | Libros reales y primeras opiniones (C5) | todas | medio |
| 19 | Hueco vacío en «Qué es» en compu (A10) | Familiar | chico |
| 20 | Aire de más entre bloques en celular (A12) | Viaje | chico |
| 21 | Pie en dos columnas en celular (A11) | todas | chico |
| 22 | Quiebres de titular en celular (A13) | Kids | chico |

Los cuatro primeros son errores visibles y se arreglan en una tarde. Del 5 al 10 es lo que haría que Kids, Viaje e Historia vendan como vende Familiar. Del 11 en adelante es pulido y crecimiento.

---

## Capturas elegidas

En `docs/revision-web-2026-10-25/`:

1. `01-historia-boton-comprar-invisible-sobre-papel-celular.png`
2. `02-historia-boton-comprar-invisible-sobre-papel-compu.png`
3. `03-viaje-libro-3d-abierto-corrido-y-cortado-compu.png`
4. `04-viaje-libro-3d-abierto-corrido-y-cortado-celular.png`
5. `05-familiar-libro-3d-bien-centrado-para-comparar-compu.png`
6. `06-familiar-whatsapp-flotante-tapa-las-ventajas-celular.png`
7. `07-kids-espana-pregunta-en-voseo-le-escribis-compu.png`
8. `08-historia-pagina-solo-texto-sin-fotos-compu.png`

Nota: en todas las capturas hay un círculo negro con una «N» abajo a la izquierda. Es el indicador de la compu de prueba, no está en la web real.
