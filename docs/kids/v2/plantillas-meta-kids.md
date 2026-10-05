# Kids · Plantillas de Meta para cargar (05/10/2026)

Para cargar en WhatsApp Manager junto con las plantillas nuevas de hoy. Todos los cuerpos son los **aprobados por Naza** (ya sin dos puntos), salvo los dos marcados **⏳ pendiente de OK**.

Reglas de Meta que ya nos frenaron: variables posicionales `{{1}}`, nunca al principio ni al final del cuerpo (todas arrancan con "Hola" o texto). Botones = respuesta rápida. Idioma: el mismo que las plantillas que ya están (español). Categoría: pedir **Utilidad**; si la rechaza, Marketing (como `bienvenida`).

**Ojo:** cargar las plantillas no hace andar Kids. El modo `kids` del entrevistador (guion, botones, otras puertas, fotos pegadas, acuses, cápsula) **no está programado** en ninguna rama: es el paso 4. La corrida automática del piloto puede salir recién cuando esté ese código; cargar hoy sirve para que Meta las tenga aprobadas para entonces.

Lo que va dentro de la ventana de 24 h (acuses, preguntas, oferta de extras, mensaje final al chico) no necesita plantilla.

---

## 1. `kids_bienvenida` — {{1}} cómo le dicen · {{2}} quién se lo regala (singular)
Botón: **Dale, vamos**

Hola {{1}}. Te escribo porque {{2}} te hizo un regalo con mucho cariño. Vas a armar el libro de tu vida, y lo mejor es que no hace falta escribir nada, lo vas contando con audios. Yo soy quien te va a ir haciendo las preguntas por acá.

Es fácil. Te mando una pregunta y vos me contestás como si se lo contaras a un amigo. No hay que contestar bien ni mal, contás como te salga.

A veces te voy a pedir una foto de algo tuyo, y a veces vas a ver botones para elegir. Si una pregunta no te gusta o no se te ocurre nada, la pasás y seguimos.

Cuando terminemos, todo lo que contaste se vuelve un libro de verdad, con tus palabras y tus fotos. Y la última parte va en un sobre cerrado, para que lo abras cuando seas grande.

¿Vamos con la primera?

## 2. `kids_bienvenida_plural` — igual, para "tus papás", "tus abuelos"…
Botón: **Dale, vamos**. Único cambio: "porque {{2}} te **hicieron** un regalo con mucho cariño".

## 3. `kids_bienvenida_padre` (eligió "lo hago yo") — {{1}} padre · {{2}} chico
Botón: **Estamos listos**

Hola {{1}}. Qué lindo regalo le estás haciendo a {{2}}, su propio libro, con vos al lado mientras lo cuenta. Las preguntas van a llegar a este número. Te cuento cómo es para que salga todo bien.

Cuando llegue una, buscá un rato tranquilo y sentate con {{2}} al lado. Leésela, o pasale el celular para que la lea.

La respuesta es un audio, y lo graba {{2}} con sus palabras. No contestes vos ni le corrijas nada. Si se va por las ramas o dice algo que no es como vos lo recordás, eso también va al libro, y es lo que lo hace suyo.

Los botones también los toca {{2}}, para pasar una pregunta, decir que no tiene algo o pedir otra. Son parte de lo que cuenta.

Y una sola cosa te pedimos. Leé todo, pero no le digas nada hasta el libro. Ni qué te pareció ni qué te hubiera gustado que dijera. Todo queda guardado en tu panel, también lo del sobre cerrado.

Cuando estén juntos, tocá el botón y llega la primera.

## 4. `kids_aviso_padre` (las preguntas van al WhatsApp del chico) — {{1}} padre · {{2}} chico · {{3}} link del panel

Hola {{1}}. Ya le escribimos a {{2}}. Le contamos de parte de quién es el regalo, y cuando toque "Dale, vamos" le llega la primera pregunta. De ahí en adelante va a su ritmo, por lo menos una por día, y más si tiene ganas.

Todo lo que cuente lo podés ver en tu panel, en {{3}} (audios, fotos y respuestas, también las del sobre cerrado).

Mientras tanto, solo te escribimos si pasan cuatro días sin que conteste, para que le des un empujoncito en casa. A {{2}} no le decimos nada por tardar. No hay retos ni apuros de nuestro lado.

Y una sola cosa te pedimos. Leé todo, pero no le digas nada hasta el libro.

## 5. `kids_recordatorio_padre` (canal del chico; a los 4 y a los 8 días) — {{1}} padre · {{2}} chico

Hola {{1}}. Pasaron cuatro días sin respuesta de {{2}}, así que te avisamos como habíamos quedado. Si podés, dale un empujoncito en casa, sin apuro. Nosotros no le decimos nada por tardar.

> A los 8 días sale el mismo; "cuatro días" queda corto. ⏳ Si Naza prefiere, una segunda plantilla con "ocho días".

## 6. `kids_recordatorio_lo_hago_yo` — {{1}} padre · {{2}} chico
Botón: **Estamos listos**

Hola {{1}}. Pasaron cuatro días sin que respondan la pregunta pendiente, no hay problema. Esto es solamente un recordatorio para que puedan retomar el libro cuanto antes. Cuando tengan un momento, sentate con {{2}} al lado y tocá el botón para seguir.

## 7. `kids_pregunta_nueva` (al chico, cuando pasaron más de 24 h) — {{1}} cómo le dicen ⏳
Botón: **Dale, mandámela**

Hola {{1}}, tengo una pregunta nueva para vos. Tocá el botón y te la mando.

## 8. `kids_pregunta_nueva_padre` ("lo hago yo") — {{1}} padre · {{2}} chico ⏳
Botón: **Estamos listos**

Hola {{1}}, hay una pregunta nueva para {{2}}. Cuando estén juntos y con un rato tranquilo, tocá el botón y llega.

## 9. `kids_termino_padre` (el chico terminó de contar) — {{1}} padre · {{2}} chico

Hola {{1}}. {{2}} terminó de contar. Ya están todas sus respuestas en tu panel, también las del sobre cerrado. Ahora empieza el armado del libro, y te avisamos cuando esté listo. Y lo mismo que al principio, no le digas nada hasta el libro.
