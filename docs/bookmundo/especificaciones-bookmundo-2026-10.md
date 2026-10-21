# Bookmundo: especificaciones para imprimir (relevado 17/10/2026)

Relevamiento del centro de ayuda de Bookmundo en español y en inglés, de las calculadoras de precio y de cubierta, y de los Términos y Condiciones. Cada dato lleva la URL de donde salió.

**Cómo se hizo.** Las páginas se bajaron enteras con curl y se leyó el texto completo, no resúmenes. Las dos calculadoras (`/covercalc` y `/pricecalc`) son formularios. Se mandaron por POST con distintas combinaciones y se anotó lo que devolvían. Esos datos dicen **«calculadora, consulta 17/10»**. Las cuentas que hice yo a partir de esos números dicen **«cálculo propio»**. Lo que no encontré dice **NO ENCONTRADO**.

Abreviaturas de URL:
- `ES-man` = https://www.bookmundo.com/es/centro-de-ayuda/como-publicar-un-libro-en-bookmundo/publicacion-manuscrito/
- `EN-man` = https://www.bookmundo.com/help-centre/how-publish-bookmundo/publishing-step-3-uploading-manuscript/
- `ES-gen` = https://www.bookmundo.com/es/centro-de-ayuda/como-publicar-un-libro-en-bookmundo/publicacion-informacion-general/
- `EN-gen` = https://www.bookmundo.com/help-centre/how-publish-bookmundo/publishing-step-1-general-information/
- `ES-cub` = https://www.bookmundo.com/es/centro-de-ayuda/como-publicar-un-libro-en-bookmundo/publicacion-diseno-de-cubierta/
- `EN-cub` = https://www.bookmundo.com/help-centre/how-publish-bookmundo/publishing-step-5-cover-design/
- `ES-isbn` = https://www.bookmundo.com/es/centro-de-ayuda/como-publicar-un-libro-en-bookmundo/publicacion-isbn/
- `EN-isbn` = https://www.bookmundo.com/help-centre/how-publish-bookmundo/publishing-step-2-isbn/
- `ES-final` = https://www.bookmundo.com/es/centro-de-ayuda/como-publicar-un-libro-en-bookmundo/publicacion-final/
- `EN-final` = https://www.bookmundo.com/help-centre/how-publish-bookmundo/publishing-step-7-publication/
- `ES-precio` = https://www.bookmundo.com/es/centro-de-ayuda/como-publicar-un-libro-en-bookmundo/publicacion-precio/
- `ES-ped` = https://www.bookmundo.com/es/centro-de-ayuda/pedidos-y-envios/
- `EN-ord` = https://www.bookmundo.com/help-centre/orders-shipping/
- `ES-impr` = https://www.bookmundo.com/es/imprimir-un-libro/
- `EN-print` = https://www.bookmundo.com/print-books/
- `ES-func` = https://www.bookmundo.com/es/como-funciona-bookmundo/
- `ES-contacto` = https://www.bookmundo.com/es/sobre-nosotros/contacto-bookmundo/
- `EN-contact` = https://www.bookmundo.com/about-us/contact/
- `ES-TyC` = https://www.bookmundo.com/es/terminos-y-condiciones/
- `COVERCALC` = https://www.bookmundo.com/covercalc (redirige a https://publishes.bookmundo.com/site/covercalc)
- `PRICECALC` = https://www.bookmundo.com/pricecalc (redirige a https://publishes.bookmundo.com/site/quickprice)
- `EN-pub` = https://www.bookmundo.com/publish-your-own-book/bookmundo-for-publishers/
- `EN-guide` = https://www.bookmundo.com/help-centre/how-publish-bookmundo/bookmundo-content-guidelines/
- `ES-IA` = https://www.bookmundo.com/es/publica-tu-libro/ia-editorial/

Nota: la página índice `https://bookmundo.com/es/centro-de-ayuda/manuscrito` solo tiene dos enlaces, y los dos llevan a mibestseller.es. Ese es el sitio viejo de la misma empresa y redirige a `https://www.bookmundo.com/es/disenar-un-libro/consejos-para-crear-libro-word/`. La página índice `cubierta/` solo enlaza al diseñador y a la calculadora. El contenido de verdad está en los «Pasos 1 a 7» de «Publicar libro».

---

## 1. Formatos por encuadernación

### Lo que dice el centro de ayuda (sin separar por encuadernación)

Tamaños con plantilla de Word, según `ES-man`:
- A5: 148 × 210 mm
- Standard: 135 × 215 mm
- Standard 2: 155 × 235 mm
- Grande: 170 × 240 mm
- Grande 2: 193 × 260 mm
- A4: 210 × 297 mm
- Cuadrado pequeño: 155 × 155 mm
- Cuadrado grande: 200 × 200 mm
- Oblongo: 210 × 155 mm
- Ebook

`EN-man` trae la misma lista **más «Large Hardcover (210mm x 279mm)»**, que en la versión en español no está. Ahí también hay una errata: «Large 2: 7. (193mm x 260mm)».

`ES-gen` y `EN-gen` dicen «Ofrecemos ocho tamaños». Pero la lista de `ES-man` tiene 9 tamaños impresos y la de `EN-man` tiene 10. Se contradicen.

### Lo que muestran las calculadoras (calculadora, consulta 17/10)

**Tapa blanda.** El desplegable de `PRICECALC` y de `COVERCALC` ofrece:
- Pequeño 135×215
- Mediano 1 155×235
- Mediano 2 170×240
- Grande 1 193×260
- **A5 148×210**
- A4 210×297
- Cuadrado 155×155
- Cuadrado grande 200×200
- Horizontal 210×155
- Libro de bolsillo 110×180

El tamaño de bolsillo no figura en el centro de ayuda.

**Tapa dura.** Al elegir «Tapa dura», el desplegable de las dos calculadoras se reduce a cinco tamaños:
- Mediano 1: 155 × 235 mm
- Mediano 2: **168 × 240 mm** (en tapa blanda, «Mediano 2» es 170×240)
- Mediano 3: **177 × 254 mm** (no figura en ningún texto de ayuda)
- Grande 1: 193 × 260 mm
- Cuadrado grande: 200 × 200 mm

**El A5 en tapa dura NO aparece en el desplegable de ninguna de las dos calculadoras.** Si igual se manda el A5 (código interno 9) con tapa dura, pasa esto:
- `PRICECALC` devuelve un precio de €12,37 (88 pág., crema, B/N). Es un precio distinto al de cualquier tamaño listado: 155×235 da €12,43 y 168×240 da €12,43.
- `COVERCALC` devuelve una cubierta de 359,6 × 250,0 mm, que corresponde a 148×210 más el cartón.

O sea, el sistema tiene precio y medidas internas para A5 tapa dura pero no lo ofrece en el menú. **Hay que confirmar con Bookmundo (info@bookmundo.com) si el A5 tapa dura se puede pedir hoy desde la plataforma.** No encontré ningún texto que lo confirme o lo niegue.

**Encuadernación.** «All our books are perfect-bound» (encolados, sin costura) (`EN-print`). La tapa blanda lleva cubierta de 240 g. La tapa dura es «de cartón resistente» y «un poquito más cara» (`ES-impr`, `EN-print`).

**Acabado de cubierta.** Mate o Brillo (`PRICECALC`, `COVERCALC`). En la calculadora no cambia el precio: con 88 páginas, mate y brillo dieron lo mismo.

**Sobrecubierta (jacket).** NO ENCONTRADO. Ninguna página la menciona.

---

## 2. Páginas mínimas y máximas

### Lo que dice el texto (se contradicen ES y EN)

**Versión en español** (`ES-man`):

| | Crema | Blanco | Blanco semibrillante |
|---|---|---|---|
| Tapa dura | 87 | 88 | 84 |
| Tapa blanda | 44 | 44 | 42 |

**Versión en inglés** (`EN-man`):

| | Crema | Blanco | Blanco semibrillante |
|---|---|---|---|
| Tapa dura | 76 | 79 | 98 |
| Tapa blanda | 57 | 57 | 47 |

Máximo de páginas: NO ENCONTRADO en ningún texto de ayuda.

### Lo que hace la calculadora (`PRICECALC`, consulta 17/10, tamaño 155×235 tapa dura y A5 tapa blanda)

**Tapa dura, crema:**
- Rechaza 85: «Tu libro contiene menos de 87 hojas (tu libro tiene 85 hojas)…».
- Acepta 86.
- Máximo: rechaza 980 con «Tu libro contiene más que 974 hojas…».

**Tapa dura, blanco offset:**
- Rechaza 86 y acepta 87.
- Máximo: rechaza 1000 con «más que 986 hojas».

**Tapa dura, semibrillante:**
- Rechaza 82 con «menos de 84 hojas».
- Acepta 83.
- Máximo: rechaza 950 con «más que 939 hojas».

**Tapa blanda, A5, crema:**
- Rechaza 42 y acepta 43.
- Hasta 1000 da precio. Con 1200 y 2000 devuelve el mismo precio que con 1000 (€13,73), y no encontré el tope.

**Tapa blanda, A5, blanco:** acepta 43.

**Tapa blanda, A5, semibrillante:** acepta 43.

El mensaje habla de «hojas», pero los números coinciden con «páginas» (87, 84…). La calculadora acepta una página menos que el mínimo que anuncia: 86 con mínimo 87, 83 con mínimo 84. Para no arriesgar conviene usar como mínimo el número que dice el mensaje, y siempre un número par.

Los mínimos de la calculadora coinciden con la versión en **español** (87, 88, 84 en tapa dura), no con la inglesa.

**Mensaje de error textual** (`PRICECALC`): «Debido a esto, no podemos imprimir el libro acorde a sus especificaciones. Puede resolver esto cambiando el tipo de libro, el tipo de papel o la cantidad de páginas.»

---

## 3. Papel, gramaje y color

### Tipos de papel

- **Crema:** 80 g según `ES-impr` («Papel crema (80 gramos)») y **90 g** según `EN-print` («Cream paper (90 g)». **Se contradicen.**
- **Blanco offset:** 80 g (`ES-impr`, `EN-print`).
- **Blanco semibrillante:** 115 g, «adecuado para libros de fotos, libros de cocina» (`ES-impr`, `EN-print`).
- `EN-pub`: «3 industry-standard paper types», papel FSC.
- Recomendaciones (`ES-gen`): crema para libros generales. Si el libro tiene muchas fotos, «blanco brillante». En la calculadora ese papel se llama «semi brillante».

### Interior en blanco y negro o en color: cómo cobran el color

Cobran **solo las páginas que efectivamente llevan color**, no el libro entero:
- `ES-gen`: «Solo te cobraremos las páginas que imprimas de hecho, a color. Es decir, que si solo tiene una página a color, solo se te cobrará una página».
- `ES-gen`: «sólo cobramos el número real de páginas a todo color (colores de soporte también)».

Atención con eso último: un logo o un detalle de color en una página la convierte en página color. Lo mismo dice `EN-gen`.

La calculadora pide «Cantidad de páginas en color (como parte del número total de páginas)» (`PRICECALC`).

**Precios medidos** (calculadora, consulta 17/10, A5 tapa dura, crema, 88 pág.):

| Páginas color | Precio por ejemplar |
|---|---|
| 0 | €12,37 |
| 1 | €12,39 |
| 5 | €12,47 |
| 10 | €12,57 |
| 20 | €12,77 |
| 88 (todo color) | €14,14 |

Cálculo propio: cada página color suma unos €0,02.

Otras combinaciones medidas (A5 tapa dura, 88 pág., B/N salvo que se diga):
- Blanco: €12,34
- Blanco con 5 color: €12,44
- Semibrillante: €12,47
- Semibrillante con 5 color: €12,57

La calculadora deja combinar «Color» con papel crema y no da error.

**Cubierta:** «La cubierta del libro siempre viene a color» (`ES-gen`), aunque se puede pedir en B/N.

---

## 4. Reglas del PDF interior

| Tema | Lo que dicen | Fuente |
|---|---|---|
| Formatos aceptados | PDF o Word. Para ebook, solo Word (EN) o Word/EPUB | `ES-man`, `EN-man` |
| Tamaño exacto | «Es importante que el formato de tu PDF cumpla con el tamaño de libro que hayas elegido». Si no coincide, «ampliamos o reducimos tu documento» y avisan. «Esto, no obstante, podría influir en la legibilidad» | `ES-man` |
| Sangrado | Solo en la nota para InDesign: «sangrado de 3 mm (introducido en los cuatro campos, excepto el campo "interior")», es decir arriba, abajo y exterior. «Comprueba de nuevo si el sangrado está ajustado a 3 mm y que todas las marcas de corte están desactivadas» | `ES-man`, `EN-man` |
| PDF/X | «Utiliza Adobe PDF Predefinido PDF / X-3: 2002» (instrucción para InDesign) | `ES-man`, `EN-man` |
| Tolerancia de corte | «Puede darse una variación en el corte de 3 mm… No se tendrán en cuenta las reclamaciones que se encuentren dentro del margen de 3 mm» | `ES-TyC` art. 7.11 |
| Márgenes | Sin cifras. «La parte interna de una página [debe tener] más margen que la parte externa». Las plantillas de Word traen «el margen de impresión estándar por defecto» | `ES-man` |
| Márgenes mínimos en mm (lomo / exterior / zona segura) | **NO ENCONTRADO** en texto. Pueden estar dentro de las plantillas .docx, que no bajé (ver abajo) | — |
| Resolución de imágenes | **ES:** «el mínimo es de 150 ppp» (`ES-man`). **EN:** «at least 200 DPI… preferably 250 DPI or more» (`EN-man`). **Se contradicen** | `ES-man`, `EN-man` |
| Fuentes incrustadas | **NO ENCONTRADO**. Solo recomiendan Cambria, Times New Roman y Arial, en cuerpo 10 u 11 | `ES-man` |
| Perfil de color del interior (RGB/CMYK) | **NO ENCONTRADO** para el interior. Solo se dice que el PDF de vista previa de la *cubierta* «ya está convertido a CMYK» | `ES-cub` |
| Página 1 | «La primera página del archivo estará en la derecha en tu libro». Impares a la derecha, pares a la izquierda. El texto «siempre comienza en la página derecha (una página impar)» | `ES-man` |
| Numeración | Abajo, en los bordes exteriores. Impares alineadas a la derecha y pares a la izquierda. Las páginas de colofón (preliminares) sin número | `ES-man` |
| ¿Agregan páginas? | «Nosotros no añadimos ninguna página al bloque del libro; por lo tanto, éste será impreso tal y como lo hayas subido» | `ES-man` |
| Páginas en blanco | Sin regla técnica. Las Content Guidelines prohíben libros «consisting primarily of blank pages», salvo cuadernos | `EN-guide` |
| Preliminares sugeridos | Pág. 1 título; pág. 2 en blanco; pág. 3 título y autor; pág. 4 autor, ISBN, diseñador de cubierta, copyright y tirada | `ES-man` |
| ISBN en el interior | «El autor deberá indicar el ISBN en el manuscrito; nosotros colocamos el código de barras automáticamente en la contracubierta» | `ES-TyC` 8.7 |
| Tamaño máximo de archivo | 500 MB. Si es más grande, por WeTransfer «mencionando tu nombre de autor y el título» | `ES-man` |
| Tiempo de proceso | «entre 1 y 10 minutos» | `ES-man` |
| Copia fiel | «La plataforma siempre hará una copia exacta de tu PDF» | `ES-man` |
| Anotaciones, enlaces, formularios, capas, transparencias | **NO ENCONTRADO** | — |
| Máximo de páginas del PDF | Solo los topes de la calculadora (punto 2) | `PRICECALC` |
| Separación silábica (Word) | «Es importante desactivar la separación silábica automática en guiones», porque si no «la conversión de nuestro sistema no produzca el resultado deseado» | https://www.bookmundo.com/es/consejos-para-usar-word/ |

**Plantillas de Word** (enlaces sacados del HTML de `ES-man` y `EN-man`, sin descargar porque bajar archivos requiere tu permiso). La de A5 en español es `https://www.bookmundo.com/wp-content/uploads/2026/01/es-148x210-1.docx`. Hay una por tamaño (`es-135x215-1.docx`, `es-155x235-1.docx`, etc.). En inglés existe además `en-210x279-1.docx`. Si querés los márgenes exactos, el próximo paso es abrir la plantilla A5.

---

## 5. Word vs PDF y servicios de corrección o maquetación

- **Word:** lo convierten a PDF. Si el resultado no es igual al Word, recomiendan «convertirlo en un archivo PDF tú mismo». Al pegar texto en la plantilla, usar «texto sin formato» (`ES-man`). La guía de Word pide estilos (Título 1), saltos de página con Ctrl+Intro, numeración por secciones y desactivar los guiones automáticos (https://www.bookmundo.com/es/consejos-para-usar-word/).
- **PDF:** se imprime tal cual («copia exacta»).
- **Revisión ortográfica automática: NO existe.** No dicen que corrijan nada. «¿Necesito que editen mi libro? No, no necesariamente», y sugieren que lo lea un amigo o un familiar (`ES-man`). «Asegúrate de que tu manuscrito sea 100% válido antes de publicarlo. Elimina cualquier error ortográfico» (https://www.bookmundo.com/es/centro-de-ayuda/como-publicar-un-libro-en-bookmundo/).
- **Servicios pagos:**
  - «disponemos de servicios profesionales de pago para ayudarte con la edición, maquetación y promoción» (`ES-func`).
  - «te ponemos en contacto con servicios de edición profesional… para la corrección, maquetación o diseño» (`ES-man`).
  - Los T&C 8.6 enumeran «corrección, edición, coaching, maquetación de manuscritos, diseño de portadas y creación de epub». El precio se acuerda por correo y pueden cobrar el 100 % por adelantado (`ES-TyC`).
  - La versión en inglés agrega «anything from a thorough spell-check to detailed feedback», con contacto en support@bookmundo.co.uk (`EN-man`).
  - Tarifas: **NO ENCONTRADO**.

---

## 6. Cubierta

### Cómo se arma

Hay dos caminos (`ES-cub`):
1. El diseñador online: plantilla, imagen y combinación de colores.
2. Subir la cubierta entera.

**Formatos aceptados para subir:**
- `ES-cub`: «siempre y cuando sea un archivo jpg o png».
- `EN-cub`: acepta además PDF («Can I upload the entire cover as a PDF file? Yes»).
- `COVERCALC`: «Formato del fichero: PDF (X-3/2002), JPG or PNG».
- La página en español es la única que no menciona PDF.

**Plantilla para subir la cubierta entera:** hay que elegir la plantilla «FullEmpty». Con esa plantilla la imagen subida ocupa toda la cubierta (`ES-cub`).

**Escalado:** «Nosotros no aumentamos, disminuimos ni escalamos el tamaño de la imagen» (`ES-cub`).

**Resolución de la cubierta (se contradicen):**
- `ES-cub` y `EN-cub`: «al menos 200 dpi».
- `COVERCALC`: «Imágenes: min. 250 DPI», «Compresión de archivo: min. 250 DPI».

**Requisitos de subida** (`COVERCALC`): «Sin marcas de impresión, recorte o sangrado». Se refiere a las marcas de corte. El sangrado sí va dentro de la medida.

**Color:** el PDF de vista previa «ya está convertido a CMYK». Puede verse distinto al RGB de la pantalla (`ES-cub`). No dicen qué perfil CMYK usan: NO ENCONTRADO.

**Interior de la cubierta:** en blanco (`ES-cub`).

**Zona segura:** sin cifra en mm. En el diseñador, «Las líneas de puntos representan los márgenes de recorte: cualquier cosa fuera de ella se recortará» (https://www.bookmundo.com/es/centro-de-ayuda/como-publicar-un-libro-en-bookmundo/publicacion-diseno-de-cubierta/usar-disenador-portadas/). Cifra de zona segura: NO ENCONTRADO.

### Texto en el lomo

Con lomo de menos de **6 mm** no se imprime texto en el lomo (`ES-cub`, `EN-cub`).

### ISBN y código de barras

- Lo colocan ellos automáticamente, en posición fija: **abajo a la derecha de la contratapa**. Hay que dejar ese espacio libre (`ES-isbn`, `ES-cub`).
- **EN agrega** «Reserve space for the ISBN, the barcode **and our logo**, which will appear in the lower right corner of the back cover» (`EN-cub`). En español dicen que no hace falta poner el nombre de Bookmundo.
- Medidas del recuadro: NO ENCONTRADO.

**Precio del ISBN:**
- 12,75 € (`ES-isbn`) o £10,55 (`EN-isbn`).
- Se recibe al pagar.
- Uno distinto por formato.
- Hay que pedir uno nuevo si cambia el precio, la portada, el contenido o el título (`ES-isbn`). Los T&C agregan: si cambia el formato, el acabado, el aspecto o el tipo de papel (`ES-TyC` 8.7).
- Solo sirven los ISBN comprados en Bookmundo (`ES-isbn`). Para editoriales, en cambio, «Use your own ISBNs» (`EN-pub`).
- **Atención:** «si se pide un ISBN para un libro en el mismo pedido que el libro… el ISBN no se imprimirá en la cubierta» (`ES-TyC` 8.1).

### Medidas y lomo (calculadora, consulta 17/10)

La medida incluye el sangrado:
- **Tapa dura:** sangrado de 20,0 mm. «Una pequeña parte de la cubierta sobrepasa hasta el interior… Esta parte está incluida en el sangrado».
- **Tapa blanda:** sangrado de 3,0 mm.

**A5 tapa dura, papel crema:**

| Páginas | Cubierta total (ancho × alto) | Lomo |
|---|---|---|
| 40 | 357,2 × 250,0 | 7,2 |
| 80 | 359,2 × 250,0 | 9,2 |
| 86 / 87 | 359,5 × 250,0 | 9,5 |
| **88** | **359,6 × 250,0** | **9,6** |
| 96 | 359,9 × 250,0 | 9,9 |
| 100 | 360,1 × 250,0 | 10,1 |
| 120 | 361,1 × 250,0 | 11,1 |
| 200 | 365,0 × 250,0 | 15,0 |
| 300 | 369,8 × 250,0 | 19,8 |
| 400 | 374,7 × 250,0 | 24,7 |

Las medidas no cambian por imprimir el interior en color.

**A5 tapa dura, 88 páginas en otros papeles:**
- Blanco: lomo 9,5 (cubierta 359,5 × 250).
- Semibrillante: lomo 9,7 (cubierta 359,7 × 250).

**A5 tapa blanda, crema:**
- 88 pág.: cubierta 307,3 × 216,0, lomo 5,3. Con 5,3 mm no lleva texto en el lomo.
- 100 pág.: 307,9 × 216, lomo 5,9.
- 200 pág.: 312,5 × 216, lomo 10,5.

**Cálculo propio para tapa dura.** Cada tapa mide el formato más 7 mm de ancho y lo mismo de alto: en A5, 155 × 210. Se cumple con 155×235 (373,6 × 275) y con 200×200 (463,6 × 240).
- Ancho total = 2 × (ancho + 7) + lomo + 2 × 20.
- Alto total = alto + 2 × 20.
- Lomo con crema ≈ 5,5 + 0,0466 × páginas. Funciona bien hasta unas 120 páginas y después se desvía unas décimas, así que siempre conviene preguntarle a la calculadora.

Cómo calculan el lomo: la fórmula oficial no está publicada (NO ENCONTRADO). Solo existe la calculadora.

---

## 7. Vista previa, validaciones y prueba

- **Vista previa:** después de subir, «clicar en "comprueba la vista de impresión"». Hay que revisar el PDF de vista previa de impresión «a fondo» (`ES-man`). La cubierta «se imprimirá tal y como aparece en el PDF» (`ES-cub`).
- **Validaciones automáticas que se ven:**
  - escalado si el tamaño no coincide (con aviso) (`ES-man`);
  - mínimo y máximo de páginas según papel (mensajes de `PRICECALC`);
  - borrado de la cubierta si cambia el manuscrito: «puede que las dimensiones de la cubierta cambien y que esta se elimine» (`ES-man`).
  - Otras validaciones técnicas (fuentes, resolución, sangrado): NO ENCONTRADO.
- **Revisión humana del archivo antes de imprimir:** NO ENCONTRADO. Al contrario: «En el momento en el que hagas un pedido de tu libro, enviaremos los archivos a la imprenta. Esto se hace de forma totalmente automática. Siempre utilizamos los archivos que están subidos en el momento del pedido» (`ES-impr`). Además, «la producción de libros suele comenzar en menos de 1 hora» (`ES-TyC` 8.2).
- **Motivos de rechazo o retiro que sí existen** (de contenido, no técnicos):
  - Derechos de autor: los pedidos con material sin derechos «no serán entregados» y no se reembolsan (`ES-TyC` 5.6, 6.2).
  - **IA:** «Bookmundo no admite la publicación de libros generados total o sustancialmente por IA sin una aportación creativa, edición y reestructuración significativas por parte del autor» (`ES-TyC` art. 6B). Es **obligatorio declarar** el uso de IA en el texto, las ilustraciones, la portada y la sinopsis durante la publicación (`ES-IA`, FAQ 2). Se reservan rechazar o retirar libros que parezcan «resultado de IA sin editar» (`ES-IA`, FAQ 5).
  - **Fotos de personas:** hace falta permiso de las personas identificables que no son figuras públicas. Las fotos de niños necesitan permiso de los padres. «Family photos are a natural fit for a memoir. Owning the photo, though, doesn't mean the people in it have agreed…» (`EN-guide`).
  - Datos privados y difamación, contenido ilegal, spam y libros duplicados (`EN-guide`).
- **Ejemplar de prueba:** lo recomiendan antes de publicar (`ES-final`, `ES-TyC` 8.5). Los libros sin copia de prueba que después haya que retirar «no serán priorizados en la atención al cliente» (`ES-TyC` 8.5).
- **Cambios y cancelación:**
  - No se puede cambiar la cantidad ni los archivos una vez hecho el pedido.
  - La dirección se puede corregir en las 24 h siguientes.
  - «No es posible cancelar un pedido» (`ES-TyC` 8.2 y 8.3).
- **Defectos:** se reclaman por mail con fotos y número de pedido. Reimprimen sin costo con los mismos archivos y no hay reembolso (`ES-ped`, `ES-TyC` 5.11 y 7.9). El autor no puede devolver sus propios libros (https://www.bookmundo.com/es/centro-de-ayuda/devoluciones/).

---

## 8. Pedidos, plazos, envíos y cantidades

### Libro privado (imprimir sin publicar ni vender): SÍ se puede

- «Si solo quieres imprimir tu libro, sáltate los pasos de ISBN y Precio. En el último paso puedes pedir tu libro» (`ES-impr`).
- «Si solo quieres imprimir tu libro, no cliques en el botón de publicar» (`ES-contacto`).
- «Estas obras subidas no serán accesibles al público hasta que se publiquen, lo que permite a los Usuarios imprimir libros para su uso privado» (`ES-TyC` 4.2).
- Los libros «Privados» no se usan para promoción (`ES-TyC` 5.8).
- **Depósito legal en España:** quedan excluidas las obras de impresión bajo demanda «destinadas a la distribución en ámbito familiar» (https://www.bookmundo.com/es/centro-de-ayuda/deposito-legal/).

### Cantidades

Mínimo 1 ejemplar (`ES-func`).

Offset para tiradas grandes (se contradicen):
- «más de 300 (blanco y negro) o 400 (color)» (`ES-func`).
- «a partir de unos 400 ejemplares» (`ES-impr`).
- «more than 500 copies» (`EN-print`).
- «a partir de 500 copias» (`https://publishes.bookmundo.com/site/wiki/viewOne/blogid/68`, página de 2017).

### Descuentos por cantidad (calculadora, consulta 17/10)

| Ejemplares | Descuento | A5 tapa dura, crema, 88 pág. B/N | Con 5 páginas color |
|---|---|---|---|
| 1–2 | 0 % | €12,37 | €12,47 |
| 3–9 | 3 % | €11,94 | €12,04 |
| 10–49 | 8 % | €11,34 | €11,44 |
| 50–99 | 13 % | €10,78 | €10,89 |
| 100–249 | 16 % | €10,37 | €10,46 |
| 250 + | 19 % | €10,00 | €10,10 |

Los porcentajes de descuento cambian según el producto. Una tapa blanda 155×235 de 144 pág. da 0/5/15/24/31/36 %. Los precios «incluyen IVA» (`PRICECALC`), y la calculadora muestra IVA del 4 % para España.

Recordá que el A5 tapa dura no está en el menú (punto 1). La alternativa listada más parecida, 155×235 tapa dura, crema, 88 pág. B/N, sale €12,43.

### Plazos (se contradicen entre páginas)

| Fuente | Impresión | Envío / total |
|---|---|---|
| `ES-ped` | Tapa blanda 3 a 4 días; tapa dura «1 o 2 más». Más de 10 ejemplares en tapa blanda: hasta 7 días. Varios ejemplares en tapa dura, o envíos a Canarias, Ceuta o Melilla: «un par de semanas más» | Envío 1 a 2 días |
| `ES-impr` | Tapa blanda 2 a 4 días laborables; tapa dura 1 a 2 días más | Envío 1 a 2 días laborables |
| `ES-contacto` | Tapa blanda hasta 7 días hábiles según la cantidad | Envío 1 a 2 días laborables |
| `ES-func` | — | Total «de cuatro a seis días laborables» |
| `EN-ord` | — | Total «within 4-5 business days» |

Todos los plazos son «orientativos» (`ES-ped`, `ES-TyC` 7.5).

### Costos de envío (se contradicen)

- «aproximadamente 4 €» por un libro estándar (`ES-ped`).
- «unos 5 euros» (`ES-contacto`).
- «about £2,50» (`EN-ord`).
- En todos los casos «puede variar según el peso, volumen o país».
- El costo exacto se ve en la pantalla de pago (`ES-TyC` 7.2).

### Seguimiento

- **ES:** el código de seguimiento llega en el mail de envío, «exceptuando los envíos a Islas Canarias y envíos internacionales» (`ES-TyC` 7.7).
- **EN:** seguimiento solo si el paquete pesa más de 5 kg (`EN-ord`).
- Si el paquete no se retira en 15 días vuelve, y hay que pagar el envío de nuevo (`ES-ped`).
- Los pedidos devueltos se guardan 4 semanas y después se destruyen (`ES-TyC` 7.8).
- Ceuta y Melilla piden DNI (https://www.bookmundo.com/es/centro-de-ayuda/tu-cuenta/).

### Dónde imprimen

Alemania, Francia, Reino Unido, España y Portugal, Países Bajos y Bélgica. Imprimen «en el país de destino o, por defecto, en el más cercano» (https://www.bookmundo.com/es/vender-libro/donde-vender-tus-libros-canales-de-venta/). «By default, we'll print your books in the UK» (`EN-print`, para la cuenta en inglés).

### Argentina

- **Plazos, costos y aduana: NO ENCONTRADOS.** Solo hay frases generales: «Entregamos en todo el mundo» (`ES-impr`) y «Enviamos a casi todo el mundo» (`ES-func`).
- Única mención concreta: «También ofrecemos canales de venta en estos países en fase de prueba como México o Argentina. Si te interesa no dudes en contactarnos» (página de canales de venta, URL arriba).
- **Hay que preguntarle a Bookmundo.**

### Pago y facturas

- PayPal o tarjeta, siempre por adelantado (`ES-ped`, `ES-TyC` 7.4).
- Factura en PDF en «Mis pedidos» (`ES-ped`).
- Los clientes pueden comprar sin crear cuenta (`ES-TyC` 9.1).

---

## 9. API, integraciones, cuentas para editoriales y contactos

- **API pública, carga masiva o webhooks: NO ENCONTRADO.** No aparece en ninguna página. La búsqueda web solo encontró una herramienta de terceros (PublisherChamp) que importa CSV de *ventas* exportados de Bookmundo.
- **Cuenta para editoriales** (`EN-pub`):
  - Varios autores e imprints («multiple publishing imprints») en una cuenta.
  - ISBN propios: «You'll need to add your ISBN to your manuscripts, but we'll handle the cover for you».
  - Marca blanca («white-label»): las librerías muestran el nombre del sello.
  - Una tienda web por autor.
  - Pago mensual.
  - Sin mínimo de pedido.
  - El alta es la misma que la de cualquier usuario («Register your publishing house» lleva al registro normal).
  - En español, el enlace «Bookmundo para editoriales y empresas» del pie lleva a `/es/aviso-legal/`. No hay una página equivalente en español.
- **Integraciones de venta:** widgets para tu propia web, tienda web de autor gratis, botones para compartir en redes y WhatsApp (`ES-func`).

### Contactos encontrados (no hay ningún teléfono publicado)

| Contacto | Dónde aparece | Para qué |
|---|---|---|
| **info@bookmundo.com** | `ES-contacto`, `EN-contact`, `ES-ped`, `ES-cub`, `ES-impr`, `ES-TyC` art. 2 y 13.1, y casi todas las páginas | Contacto general. Diseño de cubierta pago. Seguimiento de paquetes. Daños. Presupuesto de offset. Baja de la cuenta. Preguntas sobre T&C |
| support@bookmundo.com | https://www.bookmundo.com/es/centro-de-ayuda/como-publicar-un-libro-en-bookmundo/ | Dudas sobre cómo publicar |
| info@bookmundo.es | página de canales de venta (ES) | Librerías físicas y canales internacionales |
| support@bookmundo.co.uk | `EN-man` | Servicios de revisión y maquetación (en inglés) |
| support@mybestseller.co.uk | `EN-man` («contact us»), `EN-print` | Archivos de más de 500 MB y presupuesto de offset (en inglés) |
| info@mybestseller.co.uk | https://www.bookmundo.com/help-centre/ | Contacto del centro de ayuda en inglés |
| support@bookmundo.de | https://www.bookmundo.com/de/uber-bookmundo/kontakt/ | Contacto en alemán |
| WeTransfer (enviar a Bookmundo) | `ES-man` | Archivos de más de 500 MB, con nombre de autor y título |
| Dirección postal | `ES-contacto`, `ES-TyC` | Mybestseller / Mijnbestseller Nederland B.V. (KvK 53426312), Delftsestraat 33, 3013 AE Rotterdam, Países Bajos. Es también la dirección de devoluciones |
| Formulario web | — | NO ENCONTRADO (solo correo electrónico) |
| Teléfono | — | NO ENCONTRADO |
| Tiempo de respuesta | `ES-TyC` 9.5 | «Por lo general… una respuesta en un plazo de 24 horas» |

---

## 10. Errores comunes que mencionan y cómo evitarlos

1. **Tamaño del archivo distinto al formato elegido.** Lo escalan y se puede perder legibilidad. Hay que exportar al tamaño exacto (`ES-man`).
2. **Cambiar el manuscrito después de hacer la cubierta.** El lomo cambia y la cubierta puede borrarse (`ES-man`).
3. **El Word no sale igual que en pantalla.** La solución es subir un PDF propio (`ES-man`).
4. **Separación silábica automática activada en Word.** Arruina la conversión y hay que desactivarla (página de consejos de Word).
5. **Pegar texto con formato en la plantilla.** Hay que usar «texto sin formato» o pasar antes por el bloc de notas (`ES-man`, `EN-man`).
6. **Usar Intro para saltar de página.** Hay que usar el salto de página (Ctrl+Intro) (página de consejos de Word).
7. **Imágenes de baja resolución.** El mínimo es 150 ppp (ES) o 200/250 DPI (EN). En la cubierta, 200 DPI (ayuda) o 250 DPI (calculadora) (`ES-man`, `EN-man`, `ES-cub`, `COVERCALC`).
8. **Texto en el lomo con lomo de menos de 6 mm.** No se imprime (`ES-cub`).
9. **Tapar la zona del código de barras.** Abajo a la derecha de la contratapa (`ES-isbn`), y en EN también el logo (`EN-cub`).
10. **Pedir el ISBN en el mismo pedido que el libro.** El ISBN no sale en la cubierta (`ES-TyC` 8.1).
11. **Esperar que los cambios entren en un pedido ya hecho.** Se imprime lo que estaba subido en el momento del pedido (`ES-TyC` 8.1, `ES-impr`).
12. **Colores de la cubierta.** El PDF ya está en CMYK y puede verse distinto que en la pantalla RGB (`ES-cub`).
13. **Perder datos con «Nuevo libro».** Para seguir con un libro hay que usar «Editar» (https://www.bookmundo.com/es/centro-de-ayuda/como-publicar-un-libro-en-bookmundo/).
14. **Dirección o teléfono mal cargados.** Bookmundo no se hace responsable, y si el paquete vuelve hay que pagar el reenvío (`ES-TyC` 7.6 y 7.8, página de tu cuenta).
15. **No pedir un ejemplar de prueba** (`ES-final`, `ES-TyC` 8.5).
16. **Libro generado por IA sin edición, o declaración de IA falsa.** Rechazo o retiro, y posible cierre de la cuenta (`ES-TyC` 6B, `ES-IA`).
17. **Fotos de personas sin su permiso** (`EN-guide`).

---

## Lista de lo NO ENCONTRADO

- Márgenes mínimos en mm, para el lomo y el exterior. Pueden estar en la plantilla `es-148x210-1.docx`, que no bajé.
- Si un PDF que no viene de InDesign debe traer sangrado. Solo está la nota de InDesign: 3 mm en tres lados.
- Fuentes incrustadas, perfil de color del interior, transparencias, anotaciones y enlaces, cantidad máxima de páginas de un PDF.
- Sobrecubierta.
- Fórmula oficial del lomo. Medida del recuadro del ISBN y de la zona segura de la cubierta.
- Revisión humana de archivos antes de imprimir, y la lista de validaciones técnicas automáticas.
- Plazos, costos y aduana de envío a Argentina.
- API, carga masiva o integración técnica de pedidos.
- Teléfono y formulario de contacto.
- Tarifas de los servicios pagos de corrección y maquetación.
- Confirmación escrita de que el A5 tapa dura está disponible: no figura en los menús.
