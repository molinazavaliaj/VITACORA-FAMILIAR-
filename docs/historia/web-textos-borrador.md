# Vitácora de una historia · Textos de la web (borrador para aprobar)

Redactó Fable el 23/10/2026. Para que Naza los apruebe de a 10, en el orden en que conviene: primero lo que bloquea la compra (la solapa y el paso «Tema»), después la página `/historia`.

Estado: tanda 1 revisada por Naza el 23/10 (H1, H2 y H4 a H10 aprobados tal cual; H3 reescrito por Naza y aprobado). Regla nueva de Naza, 23/10: **la web no dice cuántas preguntas son**, ni «unas quince» ni ninguna otra cantidad; se quitó de todos los textos. Tanda 1b (preguntas desde el panel) agregada el 23/10, para aprobar.

Qué dicen y qué no (del spec y del banco): preguntas de a una, por WhatsApp, contestadas en audio, sin decir cuántas; en cualquiera se puede decir «paso»; a mitad de la entrevista se piden de tres a diez fotos de esa época; antes de escribir el libro, quien contó la historia repasa lo que dijo; el libro va con sus palabras, sus fotos y un código QR para escuchar los audios; impreso en tapa dura o en PDF, como en Familiar. No dicen cantidad de páginas, plazos, tiempos ni precio (el precio lo pone el código con las variables de Familiar).

Reglas que siguen: sin dos puntos, sin rayas, sin oraciones que empiecen con «Y» después de un punto. es-AR de vos, es-ES de tú (sin argentinismos), catalán de tu. Donde la misma etiqueta la lee quien compra para sí y quien regala, va sin «tu» ni «su» (como los temas). Los nombres y los ejemplos son inventados. El catalán queda pendiente del corrector de Softcatalà y de la revisión a ciegas, como el banco.

Dónde van en el código, para Joaquín: la solapa en `web/src/app/_publico/cabecera.tsx`; el paso Tema en el checkout de Familiar (`web/src/app/_textos/checkout.ts` o un `checkout-historia.ts`); la página en un `web/src/app/_textos/historia.ts` con los bloques de `kids.ts` (meta, hero, cómo funciona, para quién, el libro, precio, FAQ, cierre, próximamente).

---

## Tanda 1 · Lo que bloquea la compra (solapa y paso «Tema»)

### H1 · La solapa de la cabecera · APROBADO (Naza, 23/10)

Junto a «Familiar · Kids · De viaje». Se prueba en 360 px en los tres idiomas antes de cerrar (spec §6).

- es-AR: **Historia**
- es-ES: **Historia**
- ca: **Història**

Alternativa, si la palabra sola queda ambigua al lado de «Familiar»: «Una historia» / «Una historia» / «Una història». Es más larga y seguramente no entra en 360 px con cuatro solapas.

### H2 · El título del paso «Tema» · APROBADO (Naza, 23/10)

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

### H3 · La línea de ayuda del paso · APROBADO (Naza, 23/10; el es-AR lo escribió Naza)

Debajo del título, antes de la lista de temas.

- es-AR: Elegí una de la lista o escribí otra. Es una historia que ya pasó, contada al máximo detalle.
- es-ES: Elige una de la lista o escribe otra. Es una historia que ya pasó, contada con todo detalle.
- ca: Tria'n una de la llista o escriu-ne una altra. És una història que ja ha passat, explicada amb tot detall.

### H4 · El campo de «Otra historia» · APROBADO (Naza, 23/10)

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

### H5 · La casilla de regalo «que la elija quien la cuenta» · APROBADO (Naza, 23/10)

Solo cuando es un regalo. La casilla y, debajo, su ayuda en gris.

Casilla:

- es-AR: **Que la elija quien la cuenta**
- es-ES: **Que la elija quien la cuenta**
- ca: **Que la triï qui l'explica**

Ayuda:

- es-AR: Le preguntamos qué historia quiere contar antes de empezar. Si duda, le mostramos esta misma lista.
- es-ES: Le preguntamos qué historia quiere contar antes de empezar. Si duda, le enseñamos esta misma lista.
- ca: Li preguntem quina història vol explicar abans de començar. Si dubta, li ensenyem aquesta mateixa llista.

### H6 · Las preguntas propias (título y ayuda) · APROBADO (Naza, 23/10)

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

### H7 · El ejemplo dentro del campo de una pregunta propia · APROBADO (Naza, 23/10)

Sirve para cualquier tema. En Viaje el ejemplo habla de la comida; acá no puede nombrar un tema.

- es-AR: Por ejemplo, ¿qué es lo que nunca me contaste de esa época?
- es-ES: Por ejemplo, ¿qué es lo que nunca me has contado de esa época?
- ca: Per exemple, què és el que mai m'has explicat d'aquella època?

Los botones «+ Otra pregunta» y «Sacar pregunta» / «Quitar pregunta» / «Treure la pregunta» se toman tal cual de la compra de Viaje.

### H8 · Error cuando no se eligió tema · APROBADO (Naza, 23/10)

Si sigue sin marcar nada en la lista (y, si es regalo, tampoco la casilla de H5).

- es-AR: Elegí de qué historia es el libro.
- es-ES: Elige de qué historia es el libro.
- ca: Tria de quina història és el llibre.

### H9 · Error cuando eligió «Otra historia» y no escribió cuál · APROBADO (Naza, 23/10)

- es-AR: Contanos cuál es la historia. Con una línea alcanza.
- es-ES: Cuéntanos cuál es la historia. Con una línea basta.
- ca: Explica'ns quina és la història. Amb una línia n'hi ha prou.

### H10 · Error cuando una pregunta propia pasa de 300 caracteres · APROBADO (Naza, 23/10)

Es el de la compra de Viaje, tal cual. Se lista para que se vea que está cubierto.

- es-AR: Una de las preguntas es muy larga. Acortala un poco.
- es-ES: Una de las preguntas es muy larga. Acórtala un poco.
- ca: Una de les preguntes és massa llarga. Escurça-la una mica.

---

## Tanda 1b · Preguntas desde el panel (pedido de Naza, 23/10)

Naza quiere que en Historia cualquiera pueda sumar preguntas desde la página de su historia (el panel), también quien se compró el libro para sí. Son distintas de las de la compra (H6, PR-H1 a PR-H3, solo de quien regala): estas se escriben después, desde el panel, y el bot no sabe quién las escribió, así que no nombra a nadie. En V3 las presenta M15 («Esta pregunta te la hace tu familia.»), que acá mentiría cuando la escribió la persona misma.

Dónde van en la entrevista: cerca del final, después de PR-H1 a PR-H3 (si las hay) y antes de HC10, con la notación de banco.md. Si llegan cuando ya pasó HC10, no se hacen (estado «tarde» del panel).

### H39 · El mensaje del bot que presenta la primera pregunta sumada desde el panel (PF-H1) · APROBADO (Naza, 23/10, con la versión de Claude)

**Aprobado** (va en docs/historia/banco.md e idiomas/ como PF-H1):

- es-AR: Una pregunta más, {{nombre}}, que quedó anotada para vos. Te la paso tal cual.<br><br>«{{pregunta}}»<br><br>Contámela en audio, como las demás.
- es-ES: Una pregunta más, {{nombre}}, que ha quedado apuntada para ti. Te la paso tal cual.<br><br>«{{pregunta}}»<br><br>Cuéntamela en un audio, como las demás.
- ca: Una pregunta més, {{nombre}}, que ha quedat apuntada per a tu. Te la passo tal qual.<br><br>«{{pregunta}}»<br><br>Explica-m'ho amb un àudio, com les altres.

Lo que sigue es la propuesta de Fable, que no se usa (quien recibe un regalo no entra a la web: «la página de tu historia» no le dice nada).


No nombra a nadie. Dice de dónde viene (la página de su historia), la pasa tal cual entre comillas y cierra con una línea corta, como PR-H1, pero sin «Contale a…» porque no hay a quién.

| ID | Cuándo | es-AR |
|---|---|---|
| PF-H1 | 1.ª pregunta sumada desde el panel (después de PR-H3 si la hay, antes de HC10) | Esta te llega desde la página de tu historia, {{nombre}}. Quedó escrita ahí para que te la haga, y te la paso tal cual.<br><br>«{{pregunta}}»<br><br>Contámela en audio, como las demás. |

- es-ES: Esta te llega desde la página de tu historia, {{nombre}}. Quedó escrita allí para que te la haga, y te la paso tal cual.<br><br>«{{pregunta}}»<br><br>Cuéntamela en un audio, como las demás.
- ca: Aquesta t'arriba des de la pàgina de la teva història, {{nombre}}. Va quedar escrita allà perquè te la faci, i te la passo tal qual.<br><br>«{{pregunta}}»<br><br>Explica-m'ho amb un àudio, com les altres.

Alternativa sin la línea final (como M15, más seca): «Esta te llega desde la página de tu historia, {{nombre}}, y te la paso tal cual.<br><br>«{{pregunta}}»» / es-ES igual / ca «Aquesta t'arriba des de la pàgina de la teva història, {{nombre}}, i te la passo tal qual.<br><br>«{{pregunta}}»». La línea final la recomiendo porque la pregunta ajena puede venir escrita de cualquier manera y conviene recordar que se contesta como siempre.

### H40 · El mensaje del bot para las siguientes preguntas sumadas desde el panel (PF-H2) · APROBADO (Naza, 23/10, con la versión de Claude)

**Aprobado** (PF-H2):

- es-AR: Otra que quedó anotada para vos.<br><br>«{{pregunta}}»<br><br>Como siempre, en audio.
- es-ES: Otra que ha quedado apuntada para ti.<br><br>«{{pregunta}}»<br><br>Como siempre, en un audio.
- ca: Una altra que ha quedat apuntada per a tu.<br><br>«{{pregunta}}»<br><br>Com sempre, amb un àudio.

Propuesta de Fable, que no se usa:


Si hay más de una, repetir PF-H1 cansa. A partir de la segunda va esta, siempre la misma.

| ID | Cuándo | es-AR |
|---|---|---|
| PF-H2 | 2.ª y siguientes sumadas desde el panel | Otra que quedó escrita en la página de tu historia.<br><br>«{{pregunta}}»<br><br>Como siempre, en audio. |

- es-ES: Otra que quedó escrita en la página de tu historia.<br><br>«{{pregunta}}»<br><br>Como siempre, en un audio.
- ca: Una altra que va quedar escrita a la pàgina de la teva història.<br><br>«{{pregunta}}»<br><br>Com sempre, amb un àudio.

No llevan M1 (no son de las tres primeras) y el acuse después es el común (M3), salvo que lo que cuente sea difícil, que ahí decide el código como con cualquier otra.

### H41 · Los textos del panel que sirven tal cual · APROBADO (Naza, 23/10)

Miré `web/src/lib/preguntas-familia-textos.ts` y `SumarPreguntaV3` en `web/src/app/tablero/[narradorId]/preguntas/acciones.tsx`. Sirven sin cambios para historia:

- El botón «+ Sumar una pregunta».
- La etiqueta del campo «Tu pregunta».
- La ayuda «Te la hacemos / Se la hacemos antes de terminar la entrevista, con tus palabras.» y la confirmación «Guardada. Te la hacemos / Se la hacemos antes de terminar la entrevista.» Son verdad: en historia van antes de HC10.
- Los cinco estados de cada pregunta («Ya la contestaste…», «Ya te la hicimos…», «Te la hicimos y la dejaste pasar.», «Todavía no te la hicimos. Te llega antes de terminar la entrevista.», «Llegó tarde y ya no te la hacemos.»), en las dos voces y en catalán. Ninguno habla de la foto ni de «su vida».

Falta en el código: `SumarPreguntaV3` solo tiene vos y tú (no catalán) y el ejemplo del campo está escrito adentro del componente. Para historia hay que sacarlo a un archivo de textos, con catalán.

### H42 · El título y la bajada del bloque en el panel, para historia · APROBADO (Naza, 23/10)

Los de V3 («Las preguntas de la familia» / «Las que sumó la familia, con las mismas palabras.») mienten cuando la persona se compró el libro para sí y se anota algo que quiere contar. Versión neutra:

Título:

- es-AR: Preguntas sumadas desde acá
- es-ES: Preguntas añadidas desde aquí
- ca: Preguntes afegides des d'aquí

Bajada:

- es-AR: Las que se sumaron desde esta página, con las mismas palabras. Le llegan cerca del final de la entrevista.
- es-ES: Las que se han añadido desde esta página, con las mismas palabras. Le llegan cerca del final de la entrevista.
- ca: Les que s'han afegit des d'aquesta pàgina, amb les mateixes paraules. Li arriben cap al final de l'entrevista.

Cuando la historia es de quien mira (`propia`), la bajada cambia «Le llegan» por «Te llegan» / «Te llegan» / «T'arriben», como hacen los estados.

Alternativa de título: «Más preguntas» / «Más preguntas» / «Més preguntes».

### H43 · El ejemplo dentro del campo, para historia · APROBADO (Naza, 23/10)

El de V3 («¿cómo fue el viaje a Mendoza con los chicos?») es de una vida entera. Para historia tiene que servir con cualquier tema y también si lo escribe la persona para sí.

- es-AR: Por ejemplo, ¿qué pasó después con la gente de esa época? ¿Seguís viendo a alguien?
- es-ES: Por ejemplo, ¿qué pasó después con la gente de esa época? ¿Sigues viendo a alguien?
- ca: Per exemple, què va passar després amb la gent d'aquella època? Encara veus algú?

Alternativa: «Por ejemplo, ¿qué es lo que nunca contaste de esa época?» / «Por ejemplo, ¿qué es lo que nunca has contado de esa época?» / «Per exemple, què és el que mai has explicat d'aquella època?» (es la pareja de H7, que dice «nunca me contaste»).

### H44 · El aviso cuando ya es tarde · APROBADO (Naza, 23/10, corregido)

**Aprobado**, con «ya está en la última pregunta» en lugar de «ya terminó» (las preguntas dejan de entrar cuando sale HC10, no al terminar):

- es-AR: La entrevista ya está en la última pregunta, así que no entran preguntas nuevas. Lo que contó es lo que va al libro. (propia: Lo que contaste…)
- es-ES: La entrevista ya está en la última pregunta, así que no entran preguntas nuevas. Lo que ha contado es lo que va al libro. (propia: Lo que has contado…)
- ca: L'entrevista ja és a l'última pregunta, així que no hi entren preguntes noves. El que ha explicat és el que va al llibre. (propia: El que has explicat…)

Propuesta original de Fable:


Hoy el panel no tiene un aviso de bloque, solo el estado «Llegó tarde y ya no se la hacemos» en cada pregunta. Para historia, cuando la entrevista ya llegó al final, en lugar del botón «+ Sumar una pregunta» va este aviso.

- es-AR: La entrevista ya terminó, así que no entran preguntas nuevas. Lo que contó es lo que va al libro.
- es-ES: La entrevista ya ha terminado, así que no entran preguntas nuevas. Lo que ha contado es lo que va al libro.
- ca: L'entrevista ja s'ha acabat, així que no hi entren preguntes noves. El que ha explicat és el que va al llibre.

Cuando la historia es de quien mira (`propia`): «Lo que contaste es lo que va al libro.» / «Lo que has contado es lo que va al libro.» / «El que has explicat és el que va al llibre.»

Duda: después de FIN-H la persona repasa lo que contó antes de que se escriba el libro (spec §4.3). Si en ese repaso puede agregar cosas, la segunda frase conviene que lo diga («Lo que quiera agregar, lo suma en el repaso.»). No lo sé por falta de datos del panel de historia.

---

## Tanda 2 · La página `/historia`, arriba (pestaña, hero y cómo funciona)

### H11 · El título de la pestaña (`<title>`) · APROBADO (Naza, 23/10)

Sigue el patrón de Kids («Vitácora Kids · Mi Primer Capítulo»).

- es-AR: Vitácora de una historia · Un solo capítulo, a fondo
- es-ES: Vitácora de una historia · Un solo capítulo, a fondo
- ca: Vitácora d'una història · Un sol capítol, a fons

### H12 · La descripción para buscadores · APROBADO (Naza, 23/10)

- es-AR: Un libro sobre una sola historia. Irse a vivir lejos, el negocio propio, salir de una enfermedad. Preguntas por WhatsApp, de a una, contestadas en audio, y con eso se escribe el libro.
- es-ES: Un libro sobre una sola historia. Irse a vivir fuera, el negocio propio, salir de una enfermedad. Preguntas por WhatsApp, de una en una, contestadas en audio, y con eso se escribe el libro.
- ca: Un llibre sobre una sola història. Anar a viure lluny, el negoci propi, sortir d'una malaltia. Preguntes per WhatsApp, d'una en una, respostes amb àudios, i amb això s'escriu el llibre.

### H13 · El título del hero · APROBADO (Naza, 23/10)

En dos líneas, como en Kids; la segunda va en la cursiva. Sale de HO5 del banco («la historia que contás siempre, la que sale en las mesas»).

- es-AR: Hay historias que se cuentan siempre / y nadie escribió nunca.
- es-ES: Hay historias que se cuentan siempre / y nadie ha escrito nunca.
- ca: Hi ha històries que s'expliquen sempre / i ningú no ha escrit mai.

Alternativa: «Toda vida tiene una historia / que merece un libro entero.» / «Toda vida tiene una historia / que merece un libro entero.» / «Tota vida té una història / que mereix un llibre sencer.»

### H14 · La bajada del hero · APROBADO (Naza, 23/10)

- es-AR: Un libro sobre un solo capítulo de la vida, contado al máximo detalle. Irse a vivir lejos, el negocio propio, la enfermedad que quedó atrás. Las preguntas llegan por WhatsApp, de a una, se contestan en audio, y con eso se escribe el libro.
- es-ES: Un libro sobre un solo capítulo de la vida, contado con todo detalle. Irse a vivir fuera, el negocio propio, la enfermedad que quedó atrás. Las preguntas llegan por WhatsApp, de una en una, se contestan en audio, y con eso se escribe el libro.
- ca: Un llibre sobre un sol capítol de la vida, explicat amb tot detall. Anar a viure lluny, el negoci propi, la malaltia que va quedar enrere. Les preguntes arriben per WhatsApp, d'una en una, es contesten amb àudios, i amb això s'escriu el llibre.

### H15 · El botón del hero · APROBADO (Naza, 23/10)

Lleva a `/comprar/historia`. El segundo botón, «Cómo funciona», se toma de la portada (`TEXTOS_PORTADA.inicio.comoFunciona`), como en Kids.

- es-AR: **Empezar el libro**
- es-ES: **Empezar el libro**
- ca: **Començar el llibre**

Alternativa: «Elegir la historia» / «Elegir la historia» / «Triar la història». Dice lo primero que va a pasar, pero suena menos a comprar.

### H16 · «Cómo funciona», el título · APROBADO (Naza, 23/10)

- es-AR: Una historia, una pregunta por vez, un libro.
- es-ES: Una historia, una pregunta cada vez, un libro.
- ca: Una història, una pregunta cada vegada, un llibre.

### H17 · Paso 1 de «Cómo funciona» · APROBADO (Naza, 23/10)

Los pasos le hablan a quien compra. Quien contesta puede ser la misma persona o quien recibe el regalo, por eso los pasos 2 a 4 no dicen «te» ni «le».

Título:

- es-AR: Elegís la historia
- es-ES: Eliges la historia
- ca: Tries la història

Texto:

- es-AR: Una de la lista o la que quieras. Puede ser tu libro o un regalo, y si es regalo podés dejar que la elija quien la cuenta.
- es-ES: Una de la lista o la que quieras. Puede ser tu libro o un regalo, y si es regalo puedes dejar que la elija quien la cuenta.
- ca: Una de la llista o la que vulguis. Pot ser el teu llibre o un regal, i si és un regal pots deixar que la triï qui l'explica.

### H18 · Paso 2 de «Cómo funciona» · APROBADO (Naza, 23/10)

Título:

- es-AR: Las preguntas llegan por WhatsApp
- es-ES: Las preguntas llegan por WhatsApp
- ca: Les preguntes arriben per WhatsApp

Texto:

- es-AR: De a una, todas sobre esa historia. Cómo era la vida antes, cómo empezó, lo más difícil, cómo terminó. Si alguna no va, se dice paso y seguimos con otra.
- es-ES: De una en una, todas sobre esa historia. Cómo era la vida antes, cómo empezó, lo más difícil, cómo terminó. Si alguna no va, se dice paso y seguimos con otra.
- ca: D'una en una, totes sobre aquesta història. Com era la vida abans, com va començar, el més difícil, com va acabar. Si alguna no va, es diu «passo» i en fem una altra.

### H19 · Paso 3 de «Cómo funciona» · APROBADO (Naza, 23/10)

Título:

- es-AR: Cada una se contesta con un audio
- es-ES: Cada una se contesta con un audio
- ca: Cada una es contesta amb un àudio

Texto:

- es-AR: Cuando hay un rato, como si se lo contara a alguien en persona. A mitad de camino pedimos algunas fotos de esa época.
- es-ES: Cuando hay un rato, como si se lo contara a alguien en persona. A mitad de camino pedimos algunas fotos de esa época.
- ca: Quan hi ha una estona, com si ho expliqués a algú en persona. A mig camí demanem algunes fotos d'aquella època.

### H20 · Paso 4 de «Cómo funciona» · APROBADO (Naza, 23/10)

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

### H21 · «Para quién es», el título · APROBADO (Naza, 23/10)

- es-AR: No hace falta una vida entera. Alcanza con una historia.
- es-ES: No hace falta una vida entera. Basta con una historia.
- ca: No cal una vida sencera. N'hi ha prou amb una història.

### H22 · «Para quién es», el texto · APROBADO (Naza, 23/10)

- es-AR: Vitácora Familiar cuenta una vida de punta a punta. Este libro se queda en un solo capítulo que ya pasó y lo cuenta a fondo, con los detalles que en una vida entera no entran. Es para uno mismo o para regalar.
- es-ES: Vitácora Familiar cuenta una vida de principio a fin. Este libro se queda en un solo capítulo que ya pasó y lo cuenta a fondo, con los detalles que en una vida entera no caben. Es para uno mismo o para regalar.
- ca: Vitácora Familiar explica una vida de cap a cap. Aquest llibre es queda en un sol capítol que ja ha passat i l'explica a fons, amb els detalls que en una vida sencera no hi caben. És per a un mateix o per regalar.

### H23 · Los ejemplos de historias · APROBADO (Naza, 23/10)

Una línea de entrada y la lista. Las seis son las etiquetas aprobadas de temas.md, tal cual; la última línea es «Otra historia» con su ayuda aprobada. No hay más ejemplos inventados para no sumar temas que la lista no tiene.

Entrada:

- es-AR: Algunas de las historias que se pueden contar.
- es-ES: Algunas de las historias que se pueden contar.
- ca: Algunes de les històries que es poden explicar.

Lista es-AR: Irse a vivir lejos · El negocio propio · Salir de una enfermedad · Cómo se conocieron · El primer hijo · El trabajo de su vida. Última línea: O cualquier otra. Un viaje, el club, una amistad de toda la vida.

Lista es-ES: Irse a vivir fuera · El negocio propio · Salir de una enfermedad · Cómo se conocieron · El primer hijo · El trabajo de su vida. Última línea: O cualquier otra. Un viaje, el pueblo, una amistad de toda la vida.

Lista ca: Anar a viure lluny · El negoci propi · Sortir d'una malaltia · Com es van conèixer · El primer fill · La feina de la seva vida. Última línea: O qualsevol altra. Un viatge, el poble, una amistat de tota la vida.

### H24 · «Qué recibe», el título · APROBADO (Naza, 23/10)

- es-AR: Esa historia, hecha libro.
- es-ES: Esa historia, hecha libro.
- ca: Aquesta història, feta llibre.

### H25 · «Qué recibe», el texto · APROBADO (Naza, 23/10)

- es-AR: Un relato con las palabras de quien la cuenta, no una transcripción. Lo que contó va como lo contó, sin inventar nada. Con las fotos de esa época y un código QR para escuchar los audios. Impreso en tapa dura o en PDF, lo elegís al comprar.
- es-ES: Un relato con las palabras de quien la cuenta, no una transcripción. Lo que contó va como lo contó, sin inventar nada. Con las fotos de esa época y un código QR para escuchar los audios. Impreso en tapa dura o en PDF, lo eliges al comprar.
- ca: Un relat amb les paraules de qui l'explica, no una transcripció. El que va explicar hi va tal com ho va explicar, sense inventar res. Amb les fotos d'aquella època i un codi QR per escoltar els àudios. Imprès en tapa dura o en PDF, ho tries en comprar.

### H26 · El bloque del precio · APROBADO (Naza, 23/10)

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

### H27 · «Preguntas frecuentes», el título · APROBADO (Naza, 23/10)

- es-AR: Lo que nos suelen preguntar.
- es-ES: Lo que suelen preguntarnos.
- ca: El que ens solen preguntar.

### H28 · Pregunta frecuente 1 · La historia no está en la lista · APROBADO (Naza, 23/10)

Pregunta:

- es-AR: ¿Y si la historia no está en la lista?
- es-ES: ¿Y si la historia no está en la lista?
- ca: I si la història no és a la llista?

Respuesta:

- es-AR: Elegís «Otra historia» y la escribís en una línea. Las preguntas de esa parte son generales y sirven para cualquier capítulo. El resto de la entrevista es igual.
- es-ES: Eliges «Otra historia» y la escribes en una línea. Las preguntas de esa parte son generales y sirven para cualquier capítulo. El resto de la entrevista es igual.
- ca: Tries «Una altra història» i l'escrius en una línia. Les preguntes d'aquesta part són generals i serveixen per a qualsevol capítol. La resta de l'entrevista és igual.

### H29 · Pregunta frecuente 2 · Que la elija quien la cuenta · APROBADO (Naza, 23/10)

Pregunta:

- es-AR: ¿Puede elegir la historia quien la va a contar?
- es-ES: ¿Puede elegir la historia quien la va a contar?
- ca: Pot triar la història qui l'explicarà?

Respuesta:

- es-AR: Sí. Si es un regalo, marcás «que la elija quien la cuenta». Antes de empezar le preguntamos de qué historia quiere hacer su libro y, si duda, le mostramos la lista.
- es-ES: Sí. Si es un regalo, marcas «que la elija quien la cuenta». Antes de empezar le preguntamos de qué historia quiere hacer su libro y, si duda, le enseñamos la lista.
- ca: Sí. Si és un regal, marques «que la triï qui l'explica». Abans de començar li preguntem de quina història vol fer el seu llibre i, si dubta, li ensenyem la llista.

### H30 · Pregunta frecuente 3 · Qué se pregunta · APROBADO (Naza, 23/10)

Antes preguntaba «¿Cuántas preguntas son?». Naza no quiere cantidades en la web (23/10), así que la pregunta cambió a qué se pregunta.

Pregunta:

- es-AR: ¿Qué se pregunta?
- es-ES: ¿Qué se pregunta?
- ca: Què es pregunta?

Respuesta:

- es-AR: Van del antes al después de esa historia. Cómo era la vida antes, cómo empezó, lo más difícil, cuándo empezó a cambiar y qué dejó. Llegan por WhatsApp, de a una, y cada una se contesta con un audio, cuando hay un rato.
- es-ES: Van del antes al después de esa historia. Cómo era la vida antes, cómo empezó, lo más difícil, cuándo empezó a cambiar y qué dejó. Llegan por WhatsApp, de una en una, y cada una se contesta con un audio, cuando hay un rato.
- ca: Van de l'abans al després d'aquesta història. Com era la vida abans, com va començar, el més difícil, quan va començar a canviar i què en va quedar. Arriben per WhatsApp, d'una en una, i cada una es contesta amb un àudio, quan hi ha una estona.

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
