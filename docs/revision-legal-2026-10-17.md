# Revisión legal de los textos de Vitácora Familiar

Revisión técnica-prelegal (no sustituye el dictamen de un abogado con matrícula) · 17/10/2026
Sobre: `legales-vitacora-para-abogado` (ES / AR / CA) + `compra-que-ve-y-acepta-el-cliente`

---

## Veredicto

Los textos están mejor escritos que el 95 % de los que se ven en comercio electrónico: no hay
letra chica, no hay renovación automática, no hay patrones oscuros, la promesa de devolución es más
generosa que la ley, y la jurisdicción está puesta donde corresponde (domicilio del consumidor).
Eso no es poca cosa: la mayoría de las reclamaciones en consumo se ganan o se pierden por la
claridad, y acá la claridad juega a favor.

El problema no es el tono. Es que hay **siete puntos donde el texto dice algo que la ley no permite
decir, o calla algo que la ley obliga a decir**, y cuatro de ellos están en el corazón del negocio:
el consentimiento de la narradora, el desistimiento, y quién responde por los datos.

---

## A. Lo que te puede morder de verdad (ordenado por riesgo)

### A1 · El bot no dice que es un bot — y desde el 2 de agosto de 2026 es obligatorio (UE)

El Reglamento Europeo de IA (art. 50.1) obliga a que toda persona sepa que está hablando con un
sistema de IA. Se aplica desde el **2 de agosto de 2026**: ya está en vigor, no es un "va a venir".
Las infracciones de transparencia son de las más caras del reglamento (hasta 15 M € o 3 % de la
facturación).

Hoy el mensaje dice *«yo soy quien te va a entrevistar»*. Eso no dice que sea un sistema automático;
de hecho sugiere lo contrario. Una señora de 84 años que recibe eso cree que le escribe una persona,
y va a contarle cosas que a una máquina quizá no le contaría. Ahí hay dos problemas juntos: uno de
transparencia y uno de consentimiento informado.

**Arreglo (una frase, sin romper el tono):**

> «Hola, [nombre], ¿cómo estás? Te escribe el asistente automático de Vitácora Familiar (una persona
> lee y arma tu libro después, pero quien te va a hacer las preguntas soy yo, un programa). Una
> persona que te quiere mucho te regaló un libro con la historia de tu vida…»

Y en la política de privacidad, §13, agregar: «El entrevistador es un sistema automático y se
presenta como tal en el primer mensaje».

> Nota: si el titular en España sigue sin alta de autónoma, la obligación formal recae hoy sobre
> quien opera; pero el mensaje lo recibe gente en España y la AESIA mira el hecho, no el alta.

### A2 · El plazo de arrepentimiento en Argentina está mal contado (y una cláusula que resta un derecho es nula)

Los términos dicen **«10 días corridos desde la compra»**. La ley no dice eso. El art. 34 de la
24.240 dice: diez días corridos contados **desde que se entregue el bien o se celebre el contrato,
lo último que ocurra**; y el art. 1110 del CCyC agrega la conclusión del servicio. Como el libro
impreso se entrega **meses después** de la compra, el plazo corre desde la entrega, no desde el pago.

Consecuencia práctica: si un cliente pide el arrepentimiento en el día 40 (porque acaba de recibir
el libro), tu texto le dice que no, y el art. 37 de la 24.240 dice que esa cláusula **se tiene por
no escrita**. En una audiencia de Defensa del Consumidor eso se pierde, y además se lee como
"quisieron limitar un derecho irrenunciable".

**Arreglo:** «10 días corridos desde que recibís el libro, o desde la compra si el libro es solo
digital, lo que ocurra último». Y en el botón, la misma frase.

### A3 · El desistimiento del PDF no se pierde con lo que hoy dice el texto

El art. 103.m exige tres cosas para que se pierda el derecho sobre contenido digital: (1)
consentimiento previo y expreso, (2) que el consumidor **sepa y acepte que pierde el derecho**, y
(3) que el empresario **se lo confirme**. El texto actual solo cubre el punto (1) — "al pagar nos
pides que la entrevista empiece" — y ese consentimiento, además, no está probado en ninguna parte:
no hay casilla, se acepta pagando.

Tal como está, un cliente puede pedir la devolución del PDF y ganarla. No porque el texto sea
mentiroso, sino porque **no está acreditado el acto** que la ley pide.

**Arreglo (esto resuelve también tu pregunta 1 del checkout):** dos casillas en el paso 3, arriba
del botón de pago.

```
☐ He leído y acepto los términos del servicio y la política de privacidad.
☐ Quiero que la entrevista empiece ya (sin esperar los 14 días) y sé que, por eso,
  pierdo el derecho de desistimiento sobre lo que ya está hecho y sobre el libro digital
  cuando esté disponible en mi cuenta.
```

Con eso dejas de depender de "aceptar pagando". Y guardá por pedido: versión de los términos,
fecha, hora, IP, y las dos casillas con su valor. Eso es la prueba.

### A4 · Falta la confirmación del contrato en soporte duradero (España)

El art. 98 de la LGDCU obliga a confirmar el contrato por escrito (correo) **inmediatamente** y,
entre otras cosas, a acompañar **el formulario de desistimiento del Anexo B** y la información del
art. 97. Hoy el único correo que sale es "entrá a tu cuenta con este código". Eso no es una
confirmación contractual.

**Arreglo:** un correo transaccional inmediato, "Tu compra en Vitácora Familiar", con: qué compró,
precio total con IVA, fecha, número de pedido, enlace a los términos con su versión y fecha, la
política de privacidad, el plazo y la forma de desistir, y el **formulario del Anexo B en texto
plano** (que además tiene que estar disponible *antes* de pagar, art. 97.1.g).

Hoy la página `/arrepentimiento` tiene un botón de mailto — funciona, pero **no es el formulario
oficial**. Poné el modelo del Anexo B como bloque de texto copiable; es media hora de trabajo.

### A5 · El consentimiento de la narradora no informa lo que la ley obliga a informar

Es el punto 3 de tus preguntas y el más flojo de todo el paquete. No por la forma (un "SÍ" por
WhatsApp puede ser consentimiento válido, y el botón lo hace mejor que un texto libre), sino por el
**contenido**.

El problema de fondo: **la narradora nunca entra a la web**. Por lo tanto la política de privacidad
no la informa de nada. La información de los arts. 13 y 14 del RGPD (y del art. 6 de la 25.326 en
Argentina) tiene que estar **en el mensaje donde se recoge el consentimiento**. Y hoy ese mensaje no
dice:

- quién es el responsable del tratamiento (nombre y CUIT/NIF);
- que sus audios se transcriben con OpenAI y su texto se redacta con Anthropic, **en Estados Unidos**;
- cuánto tiempo se guardan;
- que puede retirar el permiso cuando quiera;
- **que el libro se vende** (el mensaje dice "te regalaron un libro", nunca dice que es un producto
  que alguien pagó; para el derecho a la propia voz eso importa).

Además "usarlos así" es una fórmula vacía: el consentimiento tiene que ser específico sobre fines.

**Arreglo — texto para el último párrafo del mensaje (reemplaza el actual):**

> «Antes de empezar, una cosa importante, y sin apuro.
> Tus respuestas son audios. Con esos audios hacemos el libro: los pasamos a texto con un programa
> de inteligencia artificial, escribimos los capítulos con tus propias palabras, y recortamos tus
> mejores frases para que se puedan escuchar en el libro tal como las dijiste —nunca una voz
> imitada—. El libro lo compró quien te anotó: se lo regala a tu familia, no se publica en ningún
> lado.
> Para eso, tus audios y su texto viajan a dos empresas que nos ayudan (una en Estados Unidos
> convierte el audio en texto, otra redacta), que no los usan para entrenar nada ni para otra cosa.
> Los audios se guardan mientras exista el libro, y los borramos cuando vos o tu familia lo pidan.
> Esto lo hace Vitácora Familiar (Joaquín Molina, CUIT […]), que es quien responde por tus datos.
> Podés ver el detalle completo en vitacorafamiliar.com/privacidad, o pedírmelo por acá y te lo
> mando.
> Podés parar cuando quieras, saltear preguntas, y pedir que borremos todo lo que grabaste.
> ¿Me das permiso? Respondé SÍ y arrancamos. Si preferís no hacerlo, respondé NO: no pasa nada, y a
> quien te anotó se le devuelve el dinero. **SÍ**»

Y guardá el consentimiento como prueba: plantilla exacta enviada, versión, fecha y hora, el botón
tocado, y el `message_id` de Meta. Eso es lo que se exhibe si alguien discute el permiso cinco años
después.

> Dos detalles más, del mismo tema:
> · La plantilla pide permiso para *usar* los audios, pero no para *publicar la muestra pública*
>   (portada, títulos, primer párrafo y un minuto de audio en una URL abierta). Son dos cosas
>   distintas: hoy la muestra la autoriza el comprador, y quien aparece ahí es la narradora. O se
>   pide en ese mismo mensaje, o la muestra sale sin audio.
> · La voz entra en el ámbito de la LO 1/1982 (art. 7.6) y del derecho a la propia imagen/voz en
>   Argentina. El consentimiento es **revocable**, y tu diseño ya lo respeta (si se borran los
>   audios, los códigos dejan de sonar). Decilo explícito: «podés retirar este permiso cuando
>   quieras; los libros impresos ya entregados no se pueden retirar, pero lo digital deja de sonar».

### A6 · No hay plazo de entrega (y el impreso llega meses después)

En España, si no se pacta plazo, el art. 66 bis pone 30 días para los bienes; pasado ese plazo el
consumidor puede exigir la entrega o resolver el contrato. Tu contrato, en cambio, no tiene ningún
plazo: la entrevista "dura lo que el narrador tarde" y el impreso "te confirmamos el plazo" después.
Un cliente impaciente tiene hoy una acción clara y el texto no lo protege.

**Arreglo:** dos plazos explícitos, antes de pagar:
- «La entrevista no tiene plazo fijo: la pone el narrador».
- «El libro impreso se entrega en un máximo de **X semanas** desde que aprobás el libro. Si nos
  pasamos, te devolvemos el importe del impreso sin que tengas que pedirlo.»

Ese segundo párrafo es barato y compra muchísimo: convierte la queja en una regla.

---

### A7 · Los plazos de devolución: cuánto tiempo hay, de verdad

Esta es la pregunta que más se hace y la que peor está resuelta en los textos actuales, que prometen
**14 días** en los dos países. En España está bien; en Argentina es demasiado.

**España — 14 días naturales.** Art. 107.1 del TRLGDCU: el reembolso se hace «sin demoras indebidas
y, en cualquier caso, antes de que hayan transcurrido 14 días naturales» desde que te comunica el
desistimiento (no desde la compra). Tres detalles que se olvidan:

- Se devuelve **todo**, incluidos los gastos de entrega.
- **Mismo medio de pago**, y no se puede cobrar ningún gasto por el reembolso.
- El **coste de devolver el producto** lo paga el consumidor solo si se lo informaste antes de
  comprar; si no lo dijiste, lo pagas tú. (Hoy el texto no dice quién paga la devolución.)
- En ventas de bienes, puedes retener el reembolso hasta recibir el bien o la prueba del envío
  (art. 107.2). En un libro personalizado eso casi nunca sirve: la devolución no tiene sentido.
- Si nunca informaste del derecho de desistimiento, el plazo del consumidor pasa de 14 días a
  **12 meses** (art. 105).

**Argentina — 24 horas, no 14 días.** Y acá hay un dato que cambia el documento: **la Resolución
424/2020 ya no existe.** La derogó la **Disposición 954/2025** (Subsecretaría de Defensa del
Consumidor, Boletín Oficial del 4 de septiembre de 2025), vigente desde su publicación, que además
derogó la Res. 316/2018. Los términos siguen citando la norma muerta en §6 y en la página de
arrepentimiento. Lo que manda hoy:

- **Art. 5:** dentro de las **24 horas** de recibida la solicitud, y por el mismo medio, hay que
  informar el **código de identificación** de la petición y arbitrar los medios para efectivizarla.
  La ley no pone un número de días para el reintegro: pone «arbitrar los medios necesarios», y eso se
  lee como inmediato. El estándar que se maneja en el sector es **5 días hábiles**; prometer 14 días
  es ponerse por escrito en el peor lugar.
- **Art. 1:** el botón de arrepentimiento tiene que estar «a simple vista, en lugar destacado y en el
  primer acceso» — ya no se exige que sea solo en la home, así que la redacción de la página de
  inicio debería decir «Botón de Arrepentimiento», con ese nombre.
- **Art. 3.a:** las exenciones remiten al **art. 1116 del CCyC**, «excepto pacto en contrario». Ahí
  están los bienes confeccionados según especificaciones del consumidor y los contenidos digitales
  ya utilizados. **Es el anclaje legal que hoy les falta** para sostener en Argentina que el impreso
  a medida no se devuelve: hoy lo sostienen solo con la promesa comercial.
- **Art. 6:** hay que publicar teléfono o canal alternativo de atención y horario, con un mínimo de
  8 horas por día de lunes a viernes si la atención es solo electrónica. Hoy los textos solo dan dos
  correos.

**Lo que hay que prometer, entonces:**

| | Plazo legal máximo | Qué prometer |
|---|---|---|
| España | 14 días naturales desde el aviso | 14 días, y pagar en 3-5 días hábiles |
| Argentina | 24 h para el código + «arbitrar los medios» | 24 h para el código, reintegro en 5 días hábiles |

Y una regla operativa que vale más que el texto: **el reloj legal corre desde que inicias el
reembolso, no desde que la tarjeta lo muestra.** Mercado Pago puede tardar semanas en reflejarlo;
guardá el comprobante de la devolución iniciada y mandáselo al cliente. Si una autoridad mira el
caso, lo que cuenta es esa fecha.

## B. Contradicciones dentro de tus propios textos

Estas no son opinables: son inconsistencias que un juez resuelve **contra quien redactó**
(art. 80.1 LGDCU / art. 37 LDC), porque la duda se interpreta a favor del consumidor.

1. **§7 contra §8.** §7 dice "si ya ha empezado a contestar, el libro se cierra con lo que haya,
   **sin devolución**". §8 dice "si responde menos de diez preguntas… **te devolvemos el importe
   completo**". Si contesta tres preguntas y se cansa, los dos aplican y dicen lo contrario. Gana
   §8 (devolución), pero el texto queda como si hubiera una trampa. **Unificá:** "menos de diez
   respuestas = devolución total, siempre" y §7 queda solo para el caso de ≥10 respuestas.

2. **"De viaje" no existe.** §7 menciona tres garantías — *Familiar*, *De viaje*, *Para ti* — y §2
   solo vende PDF, impreso y marcos. "De viaje" y "para ti" no están definidos en ninguna parte del
   documento. Eso es una **oferta de productos que no existen** en el mismo papel que los términos.
   O se explican (qué es el libro "de viaje", qué se compra), o se borran.

3. **"Nunca se la mostramos a nadie fuera de tu familia" (§9) contra el QR de contratapa (§2 y
   privacidad §8).** Ustedes mismos dicen que quien tenga el libro puede abrir el libro entero y
   reenviar el enlace. Las dos frases no pueden convivir. Reescribí: «Nunca publicamos su historia
   ni se la mostramos a nadie fuera de tu familia, salvo quien tenga el libro en la mano: el código
   de la contratapa abre el libro completo, y ese enlace se puede reenviar».

4. **Privacidad §7: "mientras el libro esté en tu cuenta"** — sin plazo. El RGPD pide un plazo
   concreto (art. 5.1.e), no "hasta que lo pidas". Poné números: audios originales X meses después
   de la entrega (o hasta que se pidan), libro mientras la cuenta esté activa, y revisión a los N
   años.

5. **Los términos de Argentina incluyen párrafos de España sin condicionar** («Al pagar nos pedís…»,
   «te devolvemos menos la parte proporcional»). Un comprador argentino lee condiciones españolas en
   su propio contrato. Condicioná esos tramos a la región.

6. **La proporción del art. 108.3 no tiene fórmula.** "El precio menos la parte proporcional a las
   preguntas ya hechas" — sin decir cuánto vale una pregunta. Eso es una cláusula opaca. Traducilo:
   «descontamos el precio dividido por 30, multiplicado por las preguntas ya respondidas».

7. **Umbral de "diez preguntas" ambiguo.** ¿Cuenta la repregunta ("y agregó")? Definí: "diez
   preguntas principales distintas, sin contar las repreguntas".

---

## C. Lo que falta en el papel

| Falta | Norma | Nota |
|---|---|---|
| Nombre, NIF/CUIT y **domicilio** de los dos titulares | LSSI art. 10 · LDC art. 4 · Disp. 954/2025 | Ya lo saben, pero es lo primero que mira cualquier inspección |
| Que se emite **factura** y cómo se recibe | LSSI art. 10 · normativa fiscal | Hoy ningún documento lo dice |
| **Precio con IVA desglosado** (ES) | art. 60 y 97 LGDCU | "Precio final" está bien, pero conviene "IVA incluido" |
| **Formulario de desistimiento del Anexo B** | art. 97.1.g y 98 | Hoy solo hay un mailto |
| **Plazo de entrega** | art. 97.1.d y 66 bis | Ver A6 |
| **Qué pasa si la narradora muere o pierde capacidad** | — (hueco) | Ver D3 |
| **Qué pasa si la narradora pide borrar todo con el libro ya impreso** | — (hueco) | El comprador pierde el producto; decilo antes de cobrar |
| **Cierre de la entrevista por silencio** ("si no responde en 30 días, cerramos el libro con lo que hay") | — (hueco) | Sin esto el contrato no termina nunca |
| **Qué pasa si WhatsApp deja de funcionar** (bloqueo de Meta) | — (hueco) | Pausa de plazos, sin cobrar el tiempo muerto |
| **Datos post mortem** (herederos) | LOPDGDD art. 3 · LO 1/1982 arts. 4-6 | Ver D3 |
| **Registro de la base de datos ante la AAIP** (AR) | ley 25.326 art. 21 | Verificar si aplica al caso; es la obligación que más se olvida |
| **Resend en Brasil**: no tiene decisión de adecuación UE | RGPD arts. 44-46 | Necesita cláusulas contractuales tipo; hoy la política solo habla del marco UE-EE. UU. |
| **Argentina → EE. UU.**: la adecuación UE-AR solo cubre UE→AR | ley 25.326 art. 12 | El texto de §6 confunde la dirección del flujo |
| **Corresponsabilidad** entre Immaculada y Joaquín (misma base, misma infra) | RGPD art. 26 | Ver D2 |

---

## D. Las preguntas que ustedes hicieron, contestadas

### D1 · ¿"Aceptar los términos pagando" alcanza?

En Argentina y en España **la ley no exige una casilla**: exige que los términos estén disponibles
antes de contratar, en lenguaje claro, y que el consumidor pueda aceptarlos. Un texto visible encima
del botón, con enlace, es formalmente suficiente. **Pero la carga de la prueba es de ustedes**, y hoy
no tienen nada que pruebe que esa persona vio y aceptó esos términos en esa versión.

Y hay un segundo problema, más serio: **el consentimiento para las cosas que no son contrato
(RGPD) no se puede deducir de pagar**. Por eso la casilla doble de A3 no es un capricho: es el único
modo barato de tener prueba.

Recomendación: dos casillas (A3) + registro por pedido (versión, fecha, IP, valores). Y la política
de privacidad enlazada en esa misma pantalla, no solo en el pie.

### D2 · Cargar datos de un tercero que todavía no sabe nada

Sí, se puede, pero **no está bien contado** y hay un hueco operativo.

- Base jurídica: la del comprador es el contrato; la de la narradora **no puede ser "consentimiento
  que pediremos después"**. La base honesta para el primer contacto es el interés legítimo
  (contactar a la persona a la que alguien le regala algo) o las actuaciones previas al contrato.
  Eso hay que escribirlo en el registro de tratamientos, no en la web.
- La información del art. 14 se cumple en el primer mensaje (bien), pero ese mensaje no la contiene
  (ver A5).
- **Al comprador hay que decirle algo al cargar los datos**, y hoy no se le dice nada: que declara
  tener relación con esa persona, que puede avisarle, y que si ella dice no, se borra lo cargado y
  se devuelve el dinero. Una línea debajo del campo de WhatsApp.
- **El hueco:** las fotos y la ficha se suben *antes* del permiso. Si la narradora dice NO, ¿qué se
  borra y cuándo? Hoy ni los términos ni la política lo dicen. Escribilo: «si no acepta, borramos su
  nombre, su número, su ficha y sus fotos en un plazo de 15 días, y solo conservamos lo necesario
  para la factura y la devolución».
- Y una recomendación de producto, no de derecho: **no aceptes fotos antes del permiso**. O las
  guardás en cuarentena hasta el SÍ. Es más limpio y además te ahorra el caso feo.

### D3 · Lo que nadie preguntó y es el hueco más grande de este producto

Están vendiendo un servicio de un mes con personas de 80 años. **Van a tener narradoras que mueren
o que pierden capacidad en medio de la entrevista**, y el contrato no dice nada. Ni qué pasa con el
libro (¿se cierra con lo que hay? ¿se devuelve?), ni quién puede entrar a la cuenta, ni quién puede
pedir que se borre la voz después de muerta.

- España: los herederos (o la persona designada) pueden ejercer los derechos sobre los datos del
  fallecido (LOPDGDD art. 3) y sobre su voz e imagen (LO 1/1982 arts. 4-6). O sea: **la familia
  puede pedir que se deje de reproducir la voz aunque el libro esté impreso**.
- Argentina: no hay régimen post mortem específico; los herederos actúan por la vía civil.

Recomendación: una cláusula corta que diga (a) si la narradora muere, el libro se cierra con lo que
haya y se entrega, sin devolución, salvo que la familia pida lo contrario; (b) quién puede pedir el
borrado después (el comprador o los herederos); (c) si la capacidad está en duda, el permiso lo da
quien la represente y el comprador lo declara. Y en el mensaje de consentimiento, preguntarle si
quiere que su voz siga sonando después, que es una decisión suya y no de la familia.

### D4 · "Su voz" y la IA: ¿está bien expresado?

Casi. Dos correcciones:

1. **"Sin ninguna voz sintética" es una promesa técnica que pueden romper sin querer.** El pipeline
   restaura el audio y empareja el nivel. Si el modelo de restauración es generativo (aunque no
   imite otra voz), alguien puede sostener que la voz del libro no es "tal cual la dijo". Cambialo
   por lo que de verdad hacen: «recortes de sus audios originales, con el sonido limpio y parejo;
   **no se clona ni se imita su voz**».
2. **La IA se declara bien en los términos y en la privacidad, pero no donde la lee quien lee el
   libro.** Pongan una línea en el colofón del impreso y en el pie del PDF: «Este libro se escribió
   con las palabras de [nombre], a partir de sus entrevistas, con ayuda de inteligencia artificial y
   la revisión de su familia». Cuesta cero y es lo que evita la conversación incómoda ("¿esto lo
   escribió una máquina?").

Sobre "¿hace falta decir más?" sobre el uso de los datos: **sí, dos cosas**: el plazo (hoy es
indefinido) y el hecho de que el narrador puede retirar el permiso y eso apaga su voz de un libro ya
entregado. Las dos están insinuadas, ninguna está dicha.

### D5 · Devolución y desistimiento: ¿cómo se redacta para que la promesa y el derecho no se
contradigan?

La regla que ordena todo: **prometé más que la ley, nunca menos, y que la promesa sea la misma en
los tres lugares** (términos, página de arrepentimiento, texto del checkout). Hoy la promesa
comercial es más generosa que la ley, lo cual está bien; el problema es que en §7 se contradice con
§8, y que en AR el plazo legal está mal contado.

Estructura que recomiendo, en tres capas explícitas:

1. **Lo que la ley te da** (14 días ES desde la compra o la entrega según el caso; 10 días AR desde
   lo que ocurra último).
2. **Lo que Vitácora agrega** (devolución total si la narradora no acepta o responde menos de diez
   preguntas; reposición si llega dañado; devolución del impreso si nos pasamos del plazo).
3. **Lo que no se puede devolver** (el PDF ya entregado con consentimiento expreso; el impreso y los
   marcos hechos a medida).

Las tres, en ese orden, en todas las superficies. Así la promesa comercial nunca parece una
excepción escondida.

---

## E. El checkout (segundo documento)

Lo que hoy ve el cliente debajo del botón es una línea:

> «Pago único y seguro con Mercado Pago. Al pagar aceptás los términos. Si no quiere hacerlo, te
> devolvemos el dinero.»

Es elegante y es insuficiente. Faltan cinco cosas, todas obligatorias antes de pagar:

1. **Quién vende**: nombre, CUIT/NIF y domicilio. (LSSI 10, LDC 4, Disp. 954/2025). Hoy en la pantalla
   de pago no aparece el titular en ningún lado.
2. **La política de privacidad enlazada** en esa pantalla, no solo en el pie.
3. **El desistimiento**: plazo, cómo se ejerce, y el formulario. (art. 97.1.g)
4. **El plazo de entrega** (A6).
5. **La casilla** (A3) y, si se quiere ser prolijo, una casilla de declaración sobre la narradora.

Y un detalle de fondo del recorrido: **el pago ocurre fuera del sitio**. Eso significa que la
aceptación tiene que quedar cerrada *antes* del salto a la pasarela — porque cuando el cliente
vuelve, ya pagó. Con las casillas en el paso 3 eso queda resuelto.

Otra cosa del paso 2: pedir el WhatsApp, el horario, el año de nacimiento, el estado civil, los
hijos y las fotos **es bastante dato** para una persona que todavía no sabe nada. No es ilegal, pero
es la pantalla donde más conviene explicar para qué es cada campo y ofrecer "no sé / prefiero no
decirlo".

---

## F. Los cambios, en orden de esfuerzo y de efecto

**Hoy mismo (texto, sin tocar código)**

1. Plazo AR: "desde la compra" → "desde lo que ocurra último".
2. Unificar §7 y §8 (garantías contra el umbral de diez respuestas).
3. Borrar o definir "De viaje" y "Para ti".
4. "Sin voz sintética" → "no se clona ni se imita su voz".
5. Reescribir "nunca se la mostramos a nadie" con la excepción del libro en la mano.
6. Bajar el tope de responsabilidad a la fórmula legal ("respondemos conforme a la ley; no limitamos
   dolo ni daños personales").

**Esta semana (producto)**

7. Mensaje de consentimiento nuevo (A5) + guardar la prueba.
8. Frase de "soy un asistente automático" (A1).
9. Dos casillas en el paso 3 + registro por pedido (A3).
10. Correo de confirmación de contrato con Anexo B (A4).
11. Plazo de entrega y de cierre por silencio (A6).
12. Cláusulas de muerte/incapacidad y de borrado con libro impreso (D3).

**Antes de abrir España**

13. Alta de autónoma y NIF, o no se vende (no se puede facturar ni cumplir LSSI art. 10).
14. Acuerdo escrito de corresponsabilidad entre los dos titulares (RGPD art. 26) y su esencia
    resumida en la política.
15. Contratos de encargado del tratamiento firmados (Supabase, Vercel, Railway, OpenAI, Anthropic,
    Resend) y SCC para Resend/Brasil y para el flujo AR→EE. UU.
16. Verificar que Supabase esté de verdad en región UE y que no haya analítica silenciosa (Vercel
    Analytics, Google Fonts, vídeos incrustados): si la hay, la frase "no usamos cookies de
    analítica" es falsa.

---

## G. Lo que yo no puedo cerrar

Esto es una revisión técnica de los textos: señala riesgos y da el texto exacto para taparlos, pero
**no es un dictamen**. Para dormir tranquilos hacen falta tres cosas que solo un abogado con
matrícula puede firmar:

- el **contrato con la narradora** (hoy es solo un consentimiento por WhatsApp; conviene una cesión
  de uso de voz, imagen y testimonio, revocable pero con efectos ordenados);
- el **contrato entre los dos titulares** (quién responde ante quién si algo sale mal con un cliente
  español comprado desde Argentina);
- la **revisión de la política de privacidad contra el registro de tratamientos real**, que es lo
  primero que pide la AEPD cuando llega una queja.

Y una advertencia de mercado, no de derecho: el 90 % de las reclamaciones en este tipo de producto
no vienen por las cláusulas, vienen por **el plazo**. El texto, hoy, es bueno; el negocio, hoy, no
tiene fecha de entrega. Eso es lo que hay que arreglar primero.
