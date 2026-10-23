# Vitácora de una historia · Textos de la web (borrador para aprobar)

Redactó Fable el 23/10/2026. Para que Naza los apruebe de a 10, en el orden en que conviene: primero lo que bloquea la compra (la solapa y el paso «Tema»), después la página `/historia`.

Qué dicen y qué no (del spec y del banco): unas quince preguntas, de a una, por WhatsApp, contestadas en audio; en cualquiera se puede decir «paso»; a mitad de la entrevista se piden de tres a diez fotos de esa época; antes de escribir el libro, quien contó la historia repasa lo que dijo; el libro va con sus palabras, sus fotos y un código QR para escuchar los audios; impreso en tapa dura o en PDF, como en Familiar. No dicen cantidad de páginas, plazos, tiempos ni precio (el precio lo pone el código con las variables de Familiar).

Reglas que siguen: sin dos puntos, sin rayas, sin oraciones que empiecen con «Y» después de un punto. es-AR de vos, es-ES de tú (sin argentinismos), catalán de tu. Donde la misma etiqueta la lee quien compra para sí y quien regala, va sin «tu» ni «su» (como los temas). Los nombres y los ejemplos son inventados. El catalán queda pendiente del corrector de Softcatalà y de la revisión a ciegas, como el banco.

Dónde van en el código, para Joaquín: la solapa en `web/src/app/_publico/cabecera.tsx`; el paso Tema en el checkout de Familiar (`web/src/app/_textos/checkout.ts` o un `checkout-historia.ts`); la página en un `web/src/app/_textos/historia.ts` con los bloques de `kids.ts` (meta, hero, cómo funciona, para quién, el libro, precio, FAQ, cierre, próximamente).

---

## Tanda 1 · Lo que bloquea la compra (solapa y paso «Tema»)

### H1 · La solapa de la cabecera

Junto a «Familiar · Kids · De viaje». Se prueba en 360 px en los tres idiomas antes de cerrar (spec §6).

- es-AR: **Historia**
- es-ES: **Historia**
- ca: **Història**

Alternativa, si la palabra sola queda ambigua al lado de «Familiar»: «Una historia» / «Una historia» / «Una història». Es más larga y seguramente no entra en 360 px con cuatro solapas.

### H2 · El título del paso «Tema»

Dos piezas. La etiqueta corta de la barra de pasos (hoy «Su libro · Para quién · Pago») y el título grande del paso, como «¿Cómo quieres su libro?». El título sirve igual para quien compra para sí y para quien regala.

Etiqueta en la barra de pasos:

- es-AR: **La historia**
- es-ES: **La historia**
- ca: **La història**

Título del paso:

- es-AR: **¿De qué historia es el libro?**
- es-ES: **¿De qué historia es el libro?**
- ca: **De quina història és el llibre?**

Alternativa para la barra: «Tema» / «Tema» / «Tema». Más corta, pero «tema» suena a formulario; «la historia» dice lo que es.

### H3 · La línea de ayuda del paso

Debajo del título, antes de la lista de temas.

- es-AR: Elegí una de la lista o escribí otra. Es un capítulo que ya pasó, contado a fondo, con unas quince preguntas.
- es-ES: Elige una de la lista o escribe otra. Es un capítulo que ya pasó, contado a fondo, con unas quince preguntas.
- ca: Tria'n una de la llista o escriu-ne una altra. És un capítol que ja ha passat, explicat a fons, amb unes quinze preguntes.

### H4 · El campo de «Otra historia»

La etiqueta del campo de una línea que aparece al elegir «Otra historia». El ejemplo de adentro del campo ya está aprobado (temas.md) y se repite acá solo para verlo junto.

Etiqueta:

- es-AR: **¿Cuál es la historia?**
- es-ES: **¿Cuál es la historia?**
- ca: **Quina és la història?**

Ejemplo dentro del campo (APROBADO, temas.md):

- es-AR: Por ejemplo, los veranos en la chacra de los abuelos
- es-ES: Por ejemplo, los veranos en el pueblo con los abuelos
- ca: Per exemple, els estius al poble amb els avis

Alternativa de etiqueta: «Contanos cuál, en una línea» / «Cuéntanos cuál, en una línea» / «Explica'ns quina, en una línia».

### H5 · La casilla de regalo «que la elija quien la cuenta»

Solo cuando es un regalo. La casilla y, debajo, su ayuda en gris.

Casilla:

- es-AR: **Que la elija quien la cuenta**
- es-ES: **Que la elija quien la cuenta**
- ca: **Que la triï qui l'explica**

Ayuda:

- es-AR: Le preguntamos qué historia quiere contar antes de empezar. Si duda, le mostramos esta misma lista.
- es-ES: Le preguntamos qué historia quiere contar antes de empezar. Si duda, le enseñamos esta misma lista.
- ca: Li preguntem quina història vol explicar abans de començar. Si dubta, li ensenyem aquesta mateixa llista.

### H6 · Las preguntas propias (título y ayuda)

Solo cuando es un regalo (spec §2). Hasta tres, que le llegan tal cual las escribió, cerca del final. El título sigue el de la compra de Viaje («Preguntas propias (opcional)») para que los dos checkouts hablen igual.

Título:

- es-AR: **Preguntas propias (opcional)**
- es-ES: **Preguntas propias (opcional)**
- ca: **Preguntes pròpies (opcional)**

Ayuda:

- es-AR: ¿Hay algo de esa historia que siempre quisiste saber? Dejale hasta tres preguntas. Le llegan cerca del final, tal cual las escribiste y de tu parte.
- es-ES: ¿Hay algo de esa historia que siempre has querido saber? Déjale hasta tres preguntas. Le llegan cerca del final, tal cual las escribes y de tu parte.
- ca: Hi ha alguna cosa d'aquesta història que sempre has volgut saber? Deixa-li fins a tres preguntes. Li arriben cap al final, tal com les escrius i de part teva.

Alternativa de título: «Tus preguntas (opcional)» / «Tus preguntas (opcional)» / «Les teves preguntes (opcional)».

### H7 · El ejemplo dentro del campo de una pregunta propia

Sirve para cualquier tema. En Viaje el ejemplo habla de la comida; acá no puede nombrar un tema.

- es-AR: Por ejemplo, ¿qué es lo que nunca me contaste de esa época?
- es-ES: Por ejemplo, ¿qué es lo que nunca me has contado de esa época?
- ca: Per exemple, què és el que mai m'has explicat d'aquella època?

Los botones «+ Otra pregunta» y «Sacar pregunta» / «Quitar pregunta» / «Treure la pregunta» se toman tal cual de la compra de Viaje.

### H8 · Error cuando no se eligió tema

Si sigue sin marcar nada en la lista (y, si es regalo, tampoco la casilla de H5).

- es-AR: Elegí de qué historia es el libro.
- es-ES: Elige de qué historia es el libro.
- ca: Tria de quina història és el llibre.

### H9 · Error cuando eligió «Otra historia» y no escribió cuál

- es-AR: Contanos cuál es la historia. Con una línea alcanza.
- es-ES: Cuéntanos cuál es la historia. Con una línea basta.
- ca: Explica'ns quina és la història. Amb una línia n'hi ha prou.

### H10 · Error cuando una pregunta propia pasa de 300 caracteres

Es el de la compra de Viaje, tal cual. Se lista para que se vea que está cubierto.

- es-AR: Una de las preguntas es muy larga. Acortala un poco.
- es-ES: Una de las preguntas es muy larga. Acórtala un poco.
- ca: Una de les preguntes és massa llarga. Escurça-la una mica.

---

## Tanda 2 · La página `/historia`, arriba (pestaña, hero y cómo funciona)

### H11 · El título de la pestaña (`<title>`)

Sigue el patrón de Kids («Vitácora Kids · Mi Primer Capítulo»).

- es-AR: Vitácora de una historia · Un solo capítulo, a fondo
- es-ES: Vitácora de una historia · Un solo capítulo, a fondo
- ca: Vitácora d'una història · Un sol capítol, a fons

### H12 · La descripción para buscadores

- es-AR: Un libro sobre una sola historia. Irse a vivir lejos, el negocio propio, salir de una enfermedad. Unas quince preguntas por WhatsApp, contestadas en audio, y con eso se escribe el libro.
- es-ES: Un libro sobre una sola historia. Irse a vivir fuera, el negocio propio, salir de una enfermedad. Unas quince preguntas por WhatsApp, contestadas en audio, y con eso se escribe el libro.
- ca: Un llibre sobre una sola història. Anar a viure lluny, el negoci propi, sortir d'una malaltia. Unes quinze preguntes per WhatsApp, respostes amb àudios, i amb això s'escriu el llibre.

### H13 · El título del hero

En dos líneas, como en Kids; la segunda va en la cursiva. Sale de HO5 del banco («la historia que contás siempre, la que sale en las mesas»).

- es-AR: Hay historias que se cuentan siempre / y nadie escribió nunca.
- es-ES: Hay historias que se cuentan siempre / y nadie ha escrito nunca.
- ca: Hi ha històries que s'expliquen sempre / i ningú no ha escrit mai.

Alternativa: «Toda vida tiene una historia / que merece un libro entero.» / «Toda vida tiene una historia / que merece un libro entero.» / «Tota vida té una història / que mereix un llibre sencer.»

### H14 · La bajada del hero

- es-AR: Un libro sobre un solo capítulo de la vida, contado a fondo. Irse a vivir lejos, el negocio propio, la enfermedad que quedó atrás. Unas quince preguntas por WhatsApp, en audio, y con eso se escribe el libro.
- es-ES: Un libro sobre un solo capítulo de la vida, contado a fondo. Irse a vivir fuera, el negocio propio, la enfermedad que quedó atrás. Unas quince preguntas por WhatsApp, en audio, y con eso se escribe el libro.
- ca: Un llibre sobre un sol capítol de la vida, explicat a fons. Anar a viure lluny, el negoci propi, la malaltia que va quedar enrere. Unes quinze preguntes per WhatsApp, amb àudios, i amb això s'escriu el llibre.

### H15 · El botón del hero

Lleva a `/comprar/historia`. El segundo botón, «Cómo funciona», se toma de la portada (`TEXTOS_PORTADA.inicio.comoFunciona`), como en Kids.

- es-AR: **Empezar el libro**
- es-ES: **Empezar el libro**
- ca: **Començar el llibre**

Alternativa: «Elegir la historia» / «Elegir la historia» / «Triar la història». Dice lo primero que va a pasar, pero suena menos a comprar.

### H16 · «Cómo funciona», el título

- es-AR: Una historia, unas quince preguntas, un libro.
- es-ES: Una historia, unas quince preguntas, un libro.
- ca: Una història, unes quinze preguntes, un llibre.

### H17 · Paso 1 de «Cómo funciona»

Los pasos le hablan a quien compra. Quien contesta puede ser la misma persona o quien recibe el regalo, por eso los pasos 2 a 4 no dicen «te» ni «le».

Título:

- es-AR: Elegís la historia
- es-ES: Eliges la historia
- ca: Tries la història

Texto:

- es-AR: Una de la lista o la que quieras. Puede ser tu libro o un regalo, y si es regalo podés dejar que la elija quien la cuenta.
- es-ES: Una de la lista o la que quieras. Puede ser tu libro o un regalo, y si es regalo puedes dejar que la elija quien la cuenta.
- ca: Una de la llista o la que vulguis. Pot ser el teu llibre o un regal, i si és un regal pots deixar que la triï qui l'explica.

### H18 · Paso 2 de «Cómo funciona»

Título:

- es-AR: Las preguntas llegan por WhatsApp
- es-ES: Las preguntas llegan por WhatsApp
- ca: Les preguntes arriben per WhatsApp

Texto:

- es-AR: Unas quince, de a una, sobre esa historia. Cómo era la vida antes, cómo empezó, lo más difícil, cómo terminó. Si alguna no va, se dice paso y seguimos con otra.
- es-ES: Unas quince, de una en una, sobre esa historia. Cómo era la vida antes, cómo empezó, lo más difícil, cómo terminó. Si alguna no va, se dice paso y seguimos con otra.
- ca: Unes quinze, d'una en una, sobre aquesta història. Com era la vida abans, com va començar, el més difícil, com va acabar. Si alguna no va, es diu «passo» i en fem una altra.

### H19 · Paso 3 de «Cómo funciona»

Título:

- es-AR: Cada una se contesta con un audio
- es-ES: Cada una se contesta con un audio
- ca: Cada una es contesta amb un àudio

Texto:

- es-AR: Cuando hay un rato, como si se lo contara a alguien en persona. A mitad de camino pedimos algunas fotos de esa época.
- es-ES: Cuando hay un rato, como si se lo contara a alguien en persona. A mitad de camino pedimos algunas fotos de esa época.
- ca: Quan hi ha una estona, com si ho expliqués a algú en persona. A mig camí demanem algunes fotos d'aquella època.

### H20 · Paso 4 de «Cómo funciona»

Título:

- es-AR: Se escribe el libro
- es-ES: Se escribe el libro
- ca: S'escriu el llibre

Texto:

- es-AR: Antes, quien contó la historia repasa lo que dijo, por si quiere cambiar o agregar algo. Después llega el libro, con sus palabras, sus fotos y un código para escuchar su voz.
- es-ES: Antes, quien contó la historia repasa lo que dijo, por si quiere cambiar o añadir algo. Después llega el libro, con sus palabras, sus fotos y un código para escuchar su voz.
- ca: Abans, qui ha explicat la història repassa el que ha dit, per si vol canviar o afegir alguna cosa. Després arriba el llibre, amb les seves paraules, les seves fotos i un codi per escoltar la seva veu.

---

## Tanda 3 · La página, el medio (para quién, el libro, el precio y las primeras preguntas frecuentes)

### H21 · «Para quién es», el título

- es-AR: No hace falta una vida entera. Alcanza con una historia.
- es-ES: No hace falta una vida entera. Basta con una historia.
- ca: No cal una vida sencera. N'hi ha prou amb una història.

### H22 · «Para quién es», el texto

- es-AR: Vitácora Familiar cuenta una vida de punta a punta. Este libro se queda en un solo capítulo que ya pasó y lo cuenta a fondo, con los detalles que en una vida entera no entran. Es para uno mismo o para regalar.
- es-ES: Vitácora Familiar cuenta una vida de principio a fin. Este libro se queda en un solo capítulo que ya pasó y lo cuenta a fondo, con los detalles que en una vida entera no caben. Es para uno mismo o para regalar.
- ca: Vitácora Familiar explica una vida de cap a cap. Aquest llibre es queda en un sol capítol que ja ha passat i l'explica a fons, amb els detalls que en una vida sencera no hi caben. És per a un mateix o per regalar.

### H23 · Los ejemplos de historias

Una línea de entrada y la lista. Las seis son las etiquetas aprobadas de temas.md, tal cual; la última línea es «Otra historia» con su ayuda aprobada. No hay más ejemplos inventados para no sumar temas que la lista no tiene.

Entrada:

- es-AR: Algunas de las historias que se pueden contar.
- es-ES: Algunas de las historias que se pueden contar.
- ca: Algunes de les històries que es poden explicar.

Lista es-AR: Irse a vivir lejos · El negocio propio · Salir de una enfermedad · Cómo se conocieron · El primer hijo · El trabajo de su vida. Última línea: O cualquier otra. Un viaje, el club, una amistad de toda la vida.

Lista es-ES: Irse a vivir fuera · El negocio propio · Salir de una enfermedad · Cómo se conocieron · El primer hijo · El trabajo de su vida. Última línea: O cualquier otra. Un viaje, el pueblo, una amistad de toda la vida.

Lista ca: Anar a viure lluny · El negoci propi · Sortir d'una malaltia · Com es van conèixer · El primer fill · La feina de la seva vida. Última línea: O qualsevol altra. Un viatge, el poble, una amistat de tota la vida.

### H24 · «Qué recibe», el título

- es-AR: Esa historia, hecha libro.
- es-ES: Esa historia, hecha libro.
- ca: Aquesta història, feta llibre.

### H25 · «Qué recibe», el texto

- es-AR: Un relato con las palabras de quien la cuenta, no una transcripción. Lo que contó va como lo contó, sin inventar nada. Con las fotos de esa época y un código QR para escuchar los audios. Impreso en tapa dura o en PDF, lo elegís al comprar.
- es-ES: Un relato con las palabras de quien la cuenta, no una transcripción. Lo que contó va como lo contó, sin inventar nada. Con las fotos de esa época y un código QR para escuchar los audios. Impreso en tapa dura o en PDF, lo eliges al comprar.
- ca: Un relat amb les paraules de qui l'explica, no una transcripció. El que va explicar hi va tal com ho va explicar, sense inventar res. Amb les fotos d'aquella època i un codi QR per escoltar els àudios. Imprès en tapa dura o en PDF, ho tries en comprar.

### H26 · El bloque del precio

Como en Kids (título, texto, nota). La cifra la pone el código con `PRECIO_EUR` / `PRECIO_ARS`.

Título:

- es-AR: Un solo pago.
- es-ES: Un solo pago.
- ca: Un sol pagament.

Texto:

- es-AR: Las preguntas, los audios, las fotos y el libro de esa historia.
- es-ES: Las preguntas, los audios, las fotos y el libro de esa historia.
- ca: Les preguntes, els àudios, les fotos i el llibre d'aquesta història.

Nota:

- es-AR: Sin suscripciones.
- es-ES: Sin suscripciones.
- ca: Sense subscripcions.

Alternativa de nota: «Sin suscripciones. El mismo precio que Vitácora Familiar.» / ca «Sense subscripcions. El mateix preu que Vitácora Familiar.» Es verdad por diseño (comparten variables), pero si un día cambia, queda mintiendo.

### H27 · «Preguntas frecuentes», el título

- es-AR: Lo que nos suelen preguntar.
- es-ES: Lo que suelen preguntarnos.
- ca: El que ens solen preguntar.

### H28 · Pregunta frecuente 1 · La historia no está en la lista

Pregunta:

- es-AR: ¿Y si la historia no está en la lista?
- es-ES: ¿Y si la historia no está en la lista?
- ca: I si la història no és a la llista?

Respuesta:

- es-AR: Elegís «Otra historia» y la escribís en una línea. Las preguntas de esa parte son generales y sirven para cualquier capítulo. El resto de la entrevista es igual.
- es-ES: Eliges «Otra historia» y la escribes en una línea. Las preguntas de esa parte son generales y sirven para cualquier capítulo. El resto de la entrevista es igual.
- ca: Tries «Una altra història» i l'escrius en una línia. Les preguntes d'aquesta part són generals i serveixen per a qualsevol capítol. La resta de l'entrevista és igual.

### H29 · Pregunta frecuente 2 · Que la elija quien la cuenta

Pregunta:

- es-AR: ¿Puede elegir la historia quien la va a contar?
- es-ES: ¿Puede elegir la historia quien la va a contar?
- ca: Pot triar la història qui l'explicarà?

Respuesta:

- es-AR: Sí. Si es un regalo, marcás «que la elija quien la cuenta». Antes de empezar le preguntamos de qué historia quiere hacer su libro y, si duda, le mostramos la lista.
- es-ES: Sí. Si es un regalo, marcas «que la elija quien la cuenta». Antes de empezar le preguntamos de qué historia quiere hacer su libro y, si duda, le enseñamos la lista.
- ca: Sí. Si és un regal, marques «que la triï qui l'explica». Abans de començar li preguntem de quina història vol fer el seu llibre i, si dubta, li ensenyem la llista.

### H30 · Pregunta frecuente 3 · Cuántas preguntas son

Pregunta:

- es-AR: ¿Cuántas preguntas son?
- es-ES: ¿Cuántas preguntas son?
- ca: Quantes preguntes són?

Respuesta:

- es-AR: Unas quince, de a una, por WhatsApp. Van del antes al después. Cómo era la vida antes, cómo empezó, lo más difícil, cuándo empezó a cambiar y qué dejó. Cada una se contesta con un audio, cuando hay un rato.
- es-ES: Unas quince, de una en una, por WhatsApp. Van del antes al después. Cómo era la vida antes, cómo empezó, lo más difícil, cuándo empezó a cambiar y qué dejó. Cada una se contesta con un audio, cuando hay un rato.
- ca: Unes quinze, d'una en una, per WhatsApp. Van de l'abans al després. Com era la vida abans, com va començar, el més difícil, quan va començar a canviar i què en va quedar. Cada una es contesta amb un àudio, quan hi ha una estona.

---

## Tanda 4 · La página, el final (las otras preguntas frecuentes, el cierre y «Próximamente»)

### H31 · Pregunta frecuente 4 · Lo que no quiere contar

Pregunta:

- es-AR: ¿Y si hay cosas que no quiere contar?
- es-ES: ¿Y si hay cosas que no quiere contar?
- ca: I si hi ha coses que no vol explicar?

Respuesta:

- es-AR: En cualquier pregunta se puede decir paso y seguimos con otra. Lo que no cuenta no se inventa, y lo que cuenta va al libro como lo dijo.
- es-ES: En cualquier pregunta se puede decir paso y seguimos con otra. Lo que no cuenta no se inventa, y lo que cuenta va al libro como lo dijo.
- ca: A qualsevol pregunta es pot dir «passo» i en fem una altra. El que no explica no s'inventa, i el que explica va al llibre tal com ho va dir.

### H32 · Pregunta frecuente 5 · Preguntas propias

Pregunta:

- es-AR: ¿Puedo agregar preguntas mías?
- es-ES: ¿Puedo añadir preguntas mías?
- ca: Puc afegir preguntes meves?

Respuesta:

- es-AR: Si es un regalo, hasta tres. Le llegan cerca del final, tal cual las escribiste y de tu parte.
- es-ES: Si es un regalo, hasta tres. Le llegan cerca del final, tal cual las escribes y de tu parte.
- ca: Si és un regal, fins a tres. Li arriben cap al final, tal com les escrius i de part teva.

### H33 · Pregunta frecuente 6 · Corregir antes del libro

Pregunta:

- es-AR: ¿Se puede corregir algo antes de que se escriba el libro?
- es-ES: ¿Se puede corregir algo antes de que se escriba el libro?
- ca: Es pot corregir alguna cosa abans que s'escrigui el llibre?

Respuesta:

- es-AR: Sí. Cuando termina la entrevista, antes de escribir el libro, quien la contó repasa lo que dijo y puede cambiar o agregar lo que quiera.
- es-ES: Sí. Cuando termina la entrevista, antes de escribir el libro, quien la contó repasa lo que dijo y puede cambiar o añadir lo que quiera.
- ca: Sí. Quan acaba l'entrevista, abans d'escriure el llibre, qui l'ha explicat repassa el que ha dit i pot canviar o afegir el que vulgui.

### H34 · Pregunta frecuente 7 · Las fotos

Pregunta:

- es-AR: ¿Hace falta mandar fotos?
- es-ES: ¿Hace falta mandar fotos?
- ca: Cal enviar fotos?

Respuesta:

- es-AR: No, el libro sale igual. A mitad de la entrevista pedimos entre tres y diez fotos de esa época, y si aparecen más tarde se pueden mandar después.
- es-ES: No, el libro sale igual. A mitad de la entrevista pedimos entre tres y diez fotos de esa época, y si aparecen más tarde se pueden mandar después.
- ca: No, el llibre surt igual. A mitja entrevista demanem entre tres i deu fotos d'aquella època, i si apareixen més tard es poden enviar després.

### H35 · El cierre

En dos líneas, como en Kids; la segunda en cursiva. Debajo va el botón de H15.

- es-AR: Una historia que ya pasó, / guardada para siempre.
- es-ES: Una historia que ya pasó, / guardada para siempre.
- ca: Una història que ja ha passat, / guardada per sempre.

Alternativa: «La historia que se cuenta siempre, / por fin escrita.» / «La historia que se cuenta siempre, / por fin escrita.» / «La història que s'explica sempre, / per fi escrita.»

### H36 · El enlace a Familiar, debajo del cierre

- es-AR: ¿Buscás el libro de una vida entera? Vitácora Familiar
- es-ES: ¿Buscas el libro de una vida entera? Vitácora Familiar
- ca: Busques el llibre d'una vida sencera? Vitácora Familiar

### H37 · «Próximamente», mientras `HISTORIA_VENTA` está apagada

Como en Kids (título, texto, botón y correo).

Título:

- es-AR: Próximamente
- es-ES: Próximamente
- ca: Aviat

Texto:

- es-AR: Todavía no se vende. Escribinos y te avisamos cuando abra.
- es-ES: Todavía no se vende. Escríbenos y te avisamos cuando abra.
- ca: Encara no es ven. Escriu-nos i t'avisem quan obri.

Botón:

- es-AR: Escribinos
- es-ES: Escríbenos
- ca: Escriu-nos

Correo (asunto y cuerpo):

- es-AR: Vitácora de una historia · Hola. Quiero que me avisen cuando abra Vitácora de una historia.
- es-ES: Vitácora de una historia · Hola. Quiero que me aviséis cuando abra Vitácora de una historia.
- ca: Vitácora d'una història · Hola. Vull que m'aviseu quan obri Vitácora d'una història.

### H38 · El nombre del producto en el resumen del pedido

En el ticket de la derecha del checkout, donde Familiar dice «Vitácora Familiar» (`RESUMEN.marca`).

- es-AR: Vitácora de una historia
- es-ES: Vitácora de una historia
- ca: Vitácora d'una història

---

## Lo que no pude decidir por falta de datos

1. **A quién le habla la página.** Kids le habla al padre («su libro»); Viaje, al viajero («tu libro»). Acá compra uno para sí o regala. Elegí hablarle a quien compra solo en el paso 1 de «Cómo funciona» y en las preguntas frecuentes, y dejar el resto sin «tu» ni «su» («quien la cuenta»). Si Naza prefiere la voz de Familiar («su historia», pensando en el regalo) o la de Viaje («tu historia»), se reescriben H14, H17 a H20 y H25.
2. **Dónde va el paso «Tema» en la compra.** La casilla «que la elija quien la cuenta» (H5) y las preguntas propias (H6) solo valen si ya se sabe que es un regalo, y eso se marca en «Para quién». Si el paso va antes de «Para quién», hay que mover esas dos piezas o cambiar el orden. No lo dice el spec.
3. **Las preguntas propias para uno mismo.** El spec las da solo al que regala. Si Naza quiere permitirlas también a quien compra para sí, H6 y H32 necesitan una versión más.
4. **El libro digital solo.** H25 dice «impreso en tapa dura o en PDF» porque la compra es la de Familiar, que ofrece las dos cosas. Si en Historia se vende solo el impreso, se saca «o en PDF».
5. **El marco.** Familiar ofrece el marco con chip; el spec dice «el marco a +20 €». No lo nombro en la página porque no hay bloque de marco en Kids ni foto para hacerlo. Si va, es un bloque más (H39) y hace falta foto.
6. **«Guardada para siempre» en H35.** Es la misma promesa que «para toda la vida» en Familiar. Si a Naza le suena a más de lo que podemos prometer, va la alternativa.
7. **La solapa en 360 px.** «Història» es una letra más larga que «Historia». Si no entra, el spec ya dice que «De viaje» pasa a «Viaje».
8. **El catalán.** Pendiente del corrector de Softcatalà y de la revisión a ciegas. Dudas puntuales: «passo» entre comillas latinas, como en el banco en catalán; «anar a viure lluny», tomado tal cual de temas.md.
9. **Las fotos de la página.** No hay fotos ni video de este producto. Los bloques de Kids que viven de una foto (los dibujos, la conversación de ejemplo, el libro abierto, el panel) no están acá. Si se consiguen fotos, hacen falta sus textos alternativos.
10. **El nombre en la pestaña (H11).** «Vitácora de una historia» no está escrito en ningún texto aprobado de la web todavía; en el spec aparece como nombre del producto y lo uso así. Si el nombre comercial fuera otro («Vitácora Historia»), cambian H11, H37 y H38.
