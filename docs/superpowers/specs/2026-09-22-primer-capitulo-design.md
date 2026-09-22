# El Primer Capítulo de mi vida — spec (22/09/2026, Naza)

**Qué es.** La hermana de la Vitácora que le vende al mismo cliente. Un chico de 11
recibe durante tres semanas **20 preguntas por WhatsApp**; cada una le pide una **foto
de algo suyo** y que cuente qué es. Al final hay un libro con sus palabras, sus fotos y
sus audios reales.

La promesa al que paga es una sola frase: *"Vos no te acordás cómo pensabas a los 11.
Él tampoco se va a acordar — salvo que lo guardemos ahora."*

**Por qué vale la pena.** (1) El dolor es verificable en el comprador mismo: al padre de
43 le preguntás qué quería ser a los 11 y no se acuerda — no hay que convencerlo de nada.
(2) El narrador quiere hacerlo, y la constancia del narrador es el pozo número uno de la
Vitácora original. (3) Tiene ocasión de regalo con fecha (cumpleaños, fin de primaria,
Navidad), cosa que la original no tiene. (4) El mismo mail compra dos productos: la del
abuelo y la del hijo.

**Validación al 22/09:** una sola muestra (el hijo de 11 de la novia de Naza, que quiere
empezar) y esa muestra lo conoce. Es una señal, no una validación. El piloto manual es lo
que decide.

## Lo que se reusa (casi todo)

Transcripción, repregunta, ritmo, recordatorio, panel (historias, fotos, compartir,
Encargar libro), pregunta de cierre, fábrica, pagos, mails de hitos. Lo distinto es **qué**
pregunta, **cómo lo pregunta** y **quién autoriza**. Es la misma forma que la Vitácora de
viaje (`docs/vitacora-de-viaje.md`): un `contexto.modo` nuevo, no un producto nuevo.

## El guion — 20 preguntas, la foto abre

Cinco capítulos de cuatro preguntas — **20 en total, una por día**, o sea unos 20 días.
La foto no decora: es la puerta. Un nene de 11 no sabe contestar "¿cómo sos?", pero te
habla veinte minutos de su juguete — y a los 40 lo que destruye no es la frase, es ver el
muñeco.

| Capítulo | De qué va | Dónde va |
|---|---|---|
| **Mis cosas** | El juguete, lo que más cuida, lo que rompió, lo que no presta | Libro |
| **Mis juegos** | A qué juega, con quién, en qué es bueno, la vez que ganó | Libro |
| **Mi mundo** | La pieza, la escuela, el recreo, el camino de todos los días | Libro |
| **Mi gente** | El mejor amigo, la familia, alguien que ya no está cerca, quién lo hace reír | Libro |
| **Para cuando seas grande** | Qué querés ser, qué te da miedo, qué no entendés de los grandes, qué le dirías a vos a los 40 | **Sobre cerrado** |

Los cuatro primeros capítulos son el libro que la familia lee ahora (16 preguntas). El
quinto es la cápsula: se graba igual, con las mismas cuatro preguntas del último tramo,
pero no se imprime en el cuerpo. Las preguntas más de adentro van justo al final, cuando
el chico ya agarró confianza con el bot — que es además cuando mejor contesta.

**Tono (borrador — los textos los aprueba Naza).** Tuteo argentino, frases cortas, una
sola instrucción por mensaje:

> *"Buenas, Fran. Sacale una foto al juguete que más cuidás — el que no dejás que agarre
> nadie. Y contame por qué ese."*

> *"Hoy una difícil: ¿qué cosa hacen los grandes que vos no entendés? Mandame un audio,
> así nomás."*

**Las tres reglas de tono del modo** (lo único que cambia en el cerebro):

1. Tuteo, frases cortas, una instrucción por mensaje.
2. Una respuesta de seis palabras **es una respuesta válida**. Con un adulto el motor la
   trata como incompleta y repregunta; con un chico eso lo espanta.
3. La repregunta es **una sola** y siempre concreta: nunca "¿y cómo te hacía sentir?",
   siempre "¿y qué pasó después?". Lo abstracto le cierra la puerta.

## El canal — una sola decisión del padre

En la compra el padre elige una de dos, y **la elección es la autorización**: no hay
formulario de consentimiento aparte, ni firma, ni paso legal extra.

- **"Que le pregunten a mi hijo."** Pone el WhatsApp del chico. Al lado de la casilla,
  una línea: *"Sos vos quien autoriza que le escribamos a él."*
- **"Prefiero hacerlo yo."** Las preguntas le llegan al padre y él se sienta con el chico.
  Acá no hay teléfono de un menor en el sistema: la mitad del problema legal no existe.

Consecuencias que salen solas, sin programar nada: el panel es del padre, así que ve todo;
y el **recordatorio de silencio le llega a él**, no al chico (a los 4 días). Un nene no se
banca que una app lo rete.

**Decidido explícitamente que NO va** (Naza, 22/09): la advertencia al chico de que sus
padres lo leen. Es un regalo que le hacen de frente, no un diario — no hay intimidad que
romper y la advertencia solo sembraría una duda que no existía.

## El libro y la parte cerrada

El libro se entrega **ahora**, para la familia, con los cuatro primeros capítulos. La
cápsula del tiempo es el quinto, **"Para cuando seas grande"**: las cuatro últimas
preguntas, que el chico le contesta a su yo de 40 y que no van en el cuerpo del libro.

El sellado es **físico o de archivo, nunca una promesa de servidor**:

- En el impreso: esas páginas van en un **sobre pegado a la contratapa**.
- En digital: un **segundo PDF aparte**, con su propio nombre.

Nadie tiene que mantener nada prendido durante 20 años para que la promesa se cumpla. Esa
es la razón de diseño, no un detalle de producción.

## Lo que se entrega

- **El libro** (PDF): sus palabras, primera persona, con sus fotos. Mismo motor.
- **Las cintas**: sus audios reales, limpios y ordenados por capítulo. **Sin clonar nada.**
  Se vende así: *"no imitamos su voz, te la guardamos"*. Sirve el masterizado, las pausas y
  la restauración que ya hace el worker de la PC de música.
- **El sobre cerrado.**
- **El impreso**, que en este producto no es un extra: **es el regalo**. Un PDF de tu hijo
  de 11 no se regala en un cumpleaños.

**Decidido explícitamente que NO va:** voz clonada del chico. Es la voz de un menor y el
producto no la necesita para ser el mejor regalo de la casa.

## La compra y el precio

`/comprar/primer-capitulo`. Mismos pasos que hoy, más el campo de canal.

**Precio: el mismo de la casa — 49 € / ARS 85.750.** No se baja por ser más corto: lo que
se paga no es la cantidad de preguntas, y un precio menor le dice al comprador que vale
menos que la del abuelo. Va por variable propia (`PRECIO_PRIMERCAP_EUR` /
`PRECIO_PRIMERCAP_ARS`), con la regla de las hermanas: sin precio configurado, el producto
no existe para el cliente (`web/src/lib/precios.ts:69`). El impreso arriba, según el
catálogo de 3t.27 (`specs/2026-09-22-catalogo-base-y-upsells-design.md`).

## Qué hay que construir

1. `contexto.modo = 'primer_capitulo'` en el entrevistador, copiando la forma de
   `entrevistador/src/flujo/viaje.ts:31`, con las tres reglas de tono.
2. Las 20 preguntas como plantilla de guion, con **foto obligatoria** en cada una.
   (Piso de 15 preguntas para que haya libro: `web/src/lib/guion.ts:5` — 20 entra cómodo,
   no hay que tocar el piso.)
3. El campo `canal` en el wizard de compra + `PRECIO_PRIMERCAP_EUR` / `_ARS`.
4. El sobre cerrado en la fábrica: un PDF aparte y las páginas al final del impreso.
5. Plantilla de bienvenida nueva en Meta (cuerpo en `entrevistador/PLANTILLAS.md`).

**Lo que NO se toca:** transcripción, repregunta, fotos, panel, ritmo, pagos, fábrica,
mails de hitos.

## Cómo se valida (antes de escribir código)

1. **La prueba de cinco minutos.** Mandarle a tres padres que no conozcan a Naza la frase
   *"¿te acordás qué querías ser a los 11?"*. Si tres de tres se quedan pensando, hay
   producto.
2. **Piloto manual**, igual que Ciro y Joaquín: Naza le manda las 20 preguntas a mano por
   WhatsApp al hijo de su novia y anota todo en `docs/piloto-bitacora-errores.md`. En una
   semana contesta las dos cosas que ningún diseño puede contestar: **cuánto escribe de
   verdad un nene de 11** y **si las fotos llegan**.

Sin esas dos, no se construye el modo.

## Lo que puede salir mal

- **Fotos con otros chicos adentro.** Van a llegar compañeros de escuela, y en un libro
  impreso eso es consentimiento de otros padres. Regla: en el cuerpo del libro, caras de
  terceros solo si el padre las aprueba una por una en el panel.
- **Que conteste corto y el libro salga flaco.** Es el riesgo real; el piloto lo mide antes
  de que cueste plata.
- **Que la novedad se le pase a los 6 días.** Por eso 20 preguntas y no 30.
- **WhatsApp.** Si el canal es el teléfono del chico, formalmente el titular debería tener
  13+. Lo cubre que el padre elija y autorice, pero la landing no debe empujar el teléfono
  del nene: las dos opciones se muestran parejas.

## Lo que queda anotado para después (no es de este spec)

El nombre dice, solo, que va a haber un segundo. Un chico que termina su libro a los 11 y
hace el siguiente a los 13 es el cliente que más veces compra en toda la empresa. No se
diseña ahora, pero **la tapa y el diseño del libro tienen que bancar una colección** — si
la tapa dice "Capítulo Uno: 11 años", el segundo no obliga a rehacer nada.
