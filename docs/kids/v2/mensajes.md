# Vitácora Kids · «Mi Primer Capítulo» · Mensajes fijos

**Fuente de verdad de los mensajes fijos de Kids (05/10/2026). Las preguntas están en `banco.md`.**

Compilado de lo que Naza aprobó el 05/10 en el paso 3 (`paso-3-ronda1-bienvenidas.md` a `paso-3-ronda6-compra.md`, `paso-3-sin-dos-puntos.md`, `plantillas-meta-kids.md`). Cada texto está en su versión final, ya sin dos puntos. Acá no se redactó nada nuevo: lo que falta está marcado **FALTA** y explicado en `flujo-vigente.md` → "Huecos que encontré".

Cómo va el proceso entero, en orden: [`flujo-vigente.md`](flujo-vigente.md).

## Notación

| Marca | Qué es |
|---|---|
| Canal A | Las preguntas van al WhatsApp del chico. |
| Canal B | "Lo hago yo": las preguntas van al WhatsApp del padre, con el chico al lado. |
| **Plantilla** `nombre` | Plantilla de Meta (sale aunque hayan pasado más de 24 h). Variables posicionales `{{1}}`, `{{2}}`… Botones de respuesta rápida. |
| **24 h** | Va dentro de la ventana de 24 h desde el último mensaje del chico (o del padre en canal B): texto libre, sin plantilla. |
| `[Botón]` → | Qué pasa si lo tocan. |
| Padre | Quien compró (puede ser abuela, tío…). Se le dice "padre" por comodidad. |

Variables que se usan (todas salen de la compra, ver COMPRA-2):

| Variable | Dato de la compra |
|---|---|
| cómo le dicen | "Cómo le dicen" (pantalla 2) |
| quién se lo regala | "Quién se lo regala" (pantalla 2). Si empieza con "Tus", va la versión plural. |
| nombre del padre | "Tu nombre" (pantalla 1) |
| nombre del chico | "Su nombre" (pantalla 2) |
| link del panel | Lo genera el sistema |

---

## 1. Mensajes que ya están en `banco.md`

**No se copian acá:** ver `banco.md`, sección "Mensajes ya aprobados" (y las entradas y cierres en cada capítulo). Para citarlos en el flujo se les da un nombre corto:

| ID | Qué es | Dónde está |
|---|---|---|
| B-SEGUIR | "Seguir ahora o mañana", con [Dale, otra] [Mañana sigo] | banco.md · Mensajes ya aprobados · Seguir ahora o mañana |
| B-MAÑANA | Respuesta a [Mañana sigo] | ídem |
| B-TOPE | Tope de 3 principales por sentada | ídem |
| B-AVISO-SERIA | Aviso antes de K31 y de K39, con [Voy ahora] [Mañana mejor] | banco.md · Aviso antes de las serias |
| B-UNA-MAS | "Antes de cerrar esta parte…", con [Dale, otra] [No, cerramos] | banco.md · Una más antes de cerrar cada capítulo |
| B-FOTO-NOTENGO | Respuesta a [No tengo] en una foto | banco.md · Fotos |
| B-FOTO-PLATA | Respuesta a [No tengo] en la foto de K29 | banco.md · Fotos |
| B-PASO | Respuesta a [Esta la paso] / [Esta no, gracias] | banco.md · Pasar una pregunta |
| B-NO-PASA-NADA | Respuesta a [No se me ocurre], [No tengo] (K16), [No hay nadie así], [No me pasó], [No hago], [De ninguno], [No miro] | banco.md · Pasar una pregunta |
| B-DIAFEO-ACUSE | Los dos acuses que rotan en K39 | banco.md · El día feo |
| B-TRANQUILA | Ofrecimiento de K40 después de K39, con [Dale, una tranquila] [Mañana sigo] | banco.md · El día feo |
| ENTRADA-1…5 | Entrada de cada capítulo | banco.md · cada capítulo |
| CIERRE-1…4 | Cierre de cada capítulo ("¿quedó algo…?") | banco.md · cada capítulo |
| CIERRE-FINAL | Cierre de K47 ("Eso fue todo…") | banco.md · Capítulo 5 |

---

## 2. El arranque

### BIEN-CHICO · bienvenida al chico
- **A quién:** al chico. Canal A.
- **Cuándo:** el día que arranca, después de la compra.
- **Plantilla** `kids_bienvenida` · {{1}} cómo le dicen · {{2}} quién se lo regala (singular).
- **Botón:** [Dale, vamos] → ENTRADA-1 y K1.

> Hola {{1}}. Te escribo porque {{2}} te hizo un regalo con mucho cariño. Vas a armar el libro de tu vida, y lo mejor es que no hace falta escribir nada, lo vas contando con audios. Yo soy quien te va a ir haciendo las preguntas por acá.
>
> Es fácil. Te mando una pregunta y vos me contestás como si se lo contaras a un amigo. No hay que contestar bien ni mal, contás como te salga.
>
> A veces te voy a pedir una foto de algo tuyo, y a veces vas a ver botones para elegir. Si una pregunta no te gusta o no se te ocurre nada, la pasás y seguimos.
>
> Cuando terminemos, todo lo que contaste se vuelve un libro de verdad, con tus palabras y tus fotos. Y la última parte va en un sobre cerrado, para que lo abras cuando seas grande.
>
> ¿Vamos con la primera?
>
> [Dale, vamos]

### BIEN-CHICO-PL · bienvenida al chico, plural
- **Igual que BIEN-CHICO**, para cuando quien regala es plural ("tus papás", "tus abuelos", o "Otra persona" que empieza con "tus").
- **Plantilla** `kids_bienvenida_plural` · mismas variables · mismo botón.
- **Único cambio:** "porque {{2}} te **hicieron** un regalo con mucho cariño".

> Hola {{1}}. Te escribo porque {{2}} te hicieron un regalo con mucho cariño. Vas a armar el libro de tu vida, y lo mejor es que no hace falta escribir nada, lo vas contando con audios. Yo soy quien te va a ir haciendo las preguntas por acá.
>
> (el resto, igual que BIEN-CHICO)

### BIEN-PADRE · bienvenida al padre que eligió "lo hago yo"
- **A quién:** al padre. Canal B.
- **Cuándo:** el día que arranca, después de la compra.
- **Plantilla** `kids_bienvenida_padre` · {{1}} nombre del padre · {{2}} nombre del chico.
- **Botón:** [Estamos listos] → ENTRADA-1 y K1 (la primera sale cuando lo tocan, para que llegue con el chico al lado).

> Hola {{1}}. Qué lindo regalo le estás haciendo a {{2}}, su propio libro, con vos al lado mientras lo cuenta. Las preguntas van a llegar a este número. Te cuento cómo es para que salga todo bien.
>
> Cuando llegue una, buscá un rato tranquilo y sentate con {{2}} al lado. Leésela, o pasale el celular para que la lea.
>
> La respuesta es un audio, y lo graba {{2}} con sus palabras. No contestes vos ni le corrijas nada. Si se va por las ramas o dice algo que no es como vos lo recordás, eso también va al libro, y es lo que lo hace suyo.
>
> Los botones también los toca {{2}}, para pasar una pregunta, decir que no tiene algo o pedir otra. Son parte de lo que cuenta.
>
> Y una sola cosa te pedimos. Leé todo, pero no le digas nada hasta el libro. Ni qué te pareció ni qué te hubiera gustado que dijera. Todo queda guardado en tu panel, también lo del sobre cerrado.
>
> Cuando estén juntos, tocá el botón y llega la primera.
>
> [Estamos listos]

### AVISO-PADRE · al padre cuando el canal es el WhatsApp del chico
- **A quién:** al padre. Canal A (en canal B no va: lo cubre BIEN-PADRE).
- **Cuándo:** el día que arranca, cuando ya salió BIEN-CHICO.
- **Plantilla** `kids_aviso_padre` · {{1}} nombre del padre · {{2}} nombre del chico · {{3}} link del panel (va en el medio porque una variable no puede cerrar el cuerpo).
- **Botones:** no lleva.
- Lleva la línea obligatoria al padre ("leé todo, pero no le digas nada hasta el libro", aprobada el 30/09).

> Hola {{1}}. Ya le escribimos a {{2}}. Le contamos de parte de quién es el regalo, y cuando toque "Dale, vamos" le llega la primera pregunta. De ahí en adelante va a su ritmo, por lo menos una por día, y más si tiene ganas.
>
> Todo lo que cuente lo podés ver en tu panel, en {{3}} (audios, fotos y respuestas, también las del sobre cerrado).
>
> Mientras tanto, solo te escribimos si pasan cuatro días sin que conteste, para que le des un empujoncito en casa. A {{2}} no le decimos nada por tardar. No hay retos ni apuros de nuestro lado.
>
> Y una sola cosa te pedimos. Leé todo, pero no le digas nada hasta el libro.

---

## 3. Acuses

**A quién:** al chico (canal A) o al número del padre (canal B, lo lee el chico). **Cuándo:** después de cada respuesta. **24 h**. Sin botones.

Regla que vale para todo lo que el bot le dice al chico (Naza, 05/10): **no dice que le gusta, le alegra ni le encanta nada, y no guarda nada "con cariño".**

### Después de una respuesta (ACUSE-1…7)

| ID | Texto |
|---|---|
| ACUSE-1 | Lo escuché entero, de principio a fin. |
| ACUSE-2 | Ya quedó guardado con todo lo demás, gracias por mandarlo. |
| ACUSE-3 | Eso va al libro, con tus palabras. |
| ACUSE-4 | Acá estoy escuchándote, ya lo tengo. |
| ACUSE-5 | Ya quedó guardado. Seguí contándome así, como te salga. |
| ACUSE-6 | Te escuché, y ya está a salvo para el libro. |
| ACUSE-7 | Dale, lo tengo, gracias por mandarlo. |

### Después de una foto (ACUSE-FOTO-1…3)

| ID | Texto |
|---|---|
| ACUSE-FOTO-1 | Llegó la foto, ya está guardada. |
| ACUSE-FOTO-2 | Esa foto la guardo para el libro. |
| ACUSE-FOTO-3 | Ya la tengo, gracias por mandarla. |

### Reglas de rotación

| Caso | Qué acuses rotan |
|---|---|
| Normal (audio) | 1 a 7, en orden. Nunca el mismo dos veces seguidas. |
| Escribe en vez de mandar audio | Solo los que no dicen "escuché": **2, 3, 5 y 7**. |
| Cápsula (capítulo 5), audio | Sin el 3 ni el 6 (esas respuestas van al sobre, no al libro): **1, 2, 4, 5 y 7**. |
| Cápsula y escrito | **2, 5 y 7**. |
| Foto | FOTO-1 a FOTO-3, en orden. |
| K39 (el día feo) | No van estos: van los suyos (B-DIAFEO-ACUSE). |
| Después de "paso" o de un botón de "no" | No van estos: van B-PASO o B-NO-PASA-NADA. |
| Después de cada extra del final | El acuse va antes de EXTRAS-OTRA. |
| Algo preocupante | Si salta la marca, solo el acuse ese día (banco.md · Reglas del flujo). Ver Huecos: hoy nada hace saltar la marca en el momento. |

"Gracias por contarme eso" queda solo para el día feo, para que conserve su peso (Fable, 05/10).

---

## 4. Pregunta nueva fuera de las 24 h

### PREG-NUEVA-CHICO
- **A quién:** al chico. Canal A.
- **Cuándo:** cuando le toca una pregunta y pasaron más de 24 h desde su último mensaje (no se le puede mandar texto libre).
- **Plantilla** `kids_pregunta_nueva` · {{1}} cómo le dicen.
- **Botón:** [Dale, mandámela] → sale la pregunta que toca (con su ENTRADA o B-AVISO-SERIA si corresponde).

> Hola {{1}}, tengo una pregunta nueva para vos. Tocá el botón y te la mando.
>
> [Dale, mandámela]

### PREG-NUEVA-PADRE
- **A quién:** al padre. Canal B.
- **Cuándo:** lo mismo, en "lo hago yo".
- **Plantilla** `kids_pregunta_nueva_padre` · {{1}} nombre del padre · {{2}} nombre del chico.
- **Botón:** [Estamos listos] → sale la pregunta que toca.

> Hola {{1}}, hay una pregunta nueva para {{2}}. Cuando estén juntos y con un rato tranquilo, tocá el botón y llega.
>
> [Estamos listos]

Estas dos solo figuran en `plantillas-meta-kids.md` ("aprobadas por Naza el 05/10 a la noche"); no tienen archivo de ronda.

---

## 5. Recordatorios de silencio (al padre; al chico nunca)

**Cuántas veces:** uno a los 4 días de silencio y otro a los 8. Después no se le escribe más al padre: queda una marca para Naza en el panel y lo mira una persona.

### RECORD-A-4
- **A quién:** al padre. Canal A. **Cuándo:** a los 4 días sin respuesta del chico.
- **Plantilla** `kids_recordatorio_padre` · {{1}} nombre del padre · {{2}} nombre del chico. Sin botones.

> Hola {{1}}. Pasaron cuatro días sin respuesta de {{2}}, así que te avisamos como habíamos quedado. Si podés, dale un empujoncito en casa, sin apuro. Nosotros no le decimos nada por tardar.

### RECORD-A-8
- **A quién:** al padre. Canal A. **Cuándo:** a los 8 días sin respuesta.
- **Plantilla** `kids_recordatorio_padre_8` · mismas variables. Sin botones.
- Igual que RECORD-A-4 con "Pasaron ocho días" (aprobada por Naza, 05/10, en `plantillas-meta-kids.md`).

> Hola {{1}}. Pasaron ocho días sin respuesta de {{2}}, así que te avisamos como habíamos quedado. Si podés, dale un empujoncito en casa, sin apuro. Nosotros no le decimos nada por tardar.

### RECORD-B
- **A quién:** al padre. Canal B. **Cuándo:** a los 4 días sin respuesta (y a los 8: ver abajo).
- **Plantilla** `kids_recordatorio_lo_hago_yo` · {{1}} nombre del padre · {{2}} nombre del chico.
- **Botón:** [Estamos listos] → "para seguir" (ver Huecos: qué sale exactamente).

> Hola {{1}}. Pasaron cuatro días sin que respondan la pregunta pendiente, no hay problema. Esto es solamente un recordatorio para que puedan retomar el libro cuanto antes. Cuando tengan un momento, sentate con {{2}} al lado y tocá el botón para seguir.
>
> [Estamos listos]

**FALTA** la versión de los 8 días para canal B (dice "cuatro días"; no hay `_8` como en A).

---

## 6. Preguntas propias del padre

Hasta 3, las escribe el padre con sus palabras en el panel, hasta que empieza el capítulo 4. Le llegan al chico entre el capítulo 4 y la cápsula. Acuse y [Esta la paso] como las demás (→ B-PASO); sin otra puerta; cuentan para el tope.

### PADRE-PREG-LINEA · la línea antes de cada pregunta del padre
- **A quién:** al chico. **Cuándo:** pegada antes de cada pregunta del padre, salvo que el padre haya marcado la casilla "sin decir que es mía" (ahí la pregunta llega sola, en el mismo lugar). **24 h** (fuera de la ventana entra por PREG-NUEVA).
- {{1}} = quién la manda ("tu papá").

> Esta pregunta te la manda {{1}}, con sus palabras.

### PADRE-PREG-LINEA-PL
- Si son dos (plural), cambia el verbo: "te la mandan" (indicado así en `paso-3-ronda5-preguntas-del-padre.md`).

> Esta pregunta te la mandan {{1}}, con sus palabras.

### PANEL-GUIA · guía del panel (web, al padre)

| ID | Elemento | Texto |
|---|---|---|
| PANEL-GUIA-TITULO | Título | Tus preguntas para el libro |
| PANEL-GUIA-1 | Párrafo | Podés agregar hasta tres preguntas tuyas. Le llegan a {{nombre}} cerca del final, entre la cuarta parte y el sobre cerrado. Antes de cada una le decimos que viene de vos, salvo que prefieras que le llegue como una pregunta más. |
| PANEL-GUIA-2 | Párrafo | Que cada pregunta pida una sola cosa. Si querés saber dos cosas, escribí dos preguntas. |
| PANEL-GUIA-3 | Párrafo | Funciona mejor pedirle una vez concreta que una opinión. "Contame la vez que…" saca mucho más que "¿Qué sentís?" o "¿Qué pensás de…?". |
| PANEL-GUIA-4 | Párrafo | Como todas las demás, {{nombre}} la puede pasar si no quiere contestarla. |
| PANEL-GUIA-EJ | Ejemplos | Contame el día que aprendiste a andar en bici sin rueditas. · Contame el día que se te cayó el primer diente, que fue comiendo un choclo. · Contame la primera noche que dormiste en lo de un amigo y nos llamaste a las dos de la mañana. |
| PANEL-GUIA-5 | Párrafo final | Las podés escribir o cambiar hasta que empiece la cuarta parte. Después ya no se agregan. |
| PANEL-CASILLA | Casilla al lado de cada pregunta | Que le llegue como una pregunta más, sin decir que es mía |

(PANEL-GUIA-1 ya tiene el cambio por la casilla, que pisa la versión anterior.)

---

## 7. El final

Va después de CIERRE-FINAL (K47, banco.md), que no se toca.

### EXTRAS-OFERTA
- **A quién:** al chico. **Cuándo:** después de CIERRE-FINAL; si no contesta el cierre, sale igual. También al retomar al otro día si cortó por el tope y quedan extras. **24 h** (no hay plantilla, ver Huecos).
- **Botones:** [Dale, otra] → EXTRAS-SI y la primera extra · [No, ya está] → FINAL-CHICO.

> Me quedaron algunas preguntas más de todo lo que fuimos hablando. Si tenés ganas las hacemos, y si no, ya está, el libro se arma igual con todo lo que contaste.
>
> [Dale, otra] [No, ya está]

### EXTRAS-SI
- **Cuándo:** si toca [Dale, otra] en EXTRAS-OFERTA, antes de la primera extra. **24 h**.

> Dale, va la primera.

### EXTRAS-OTRA
- **Cuándo:** después de cada extra; el acuse va antes. El tope de 3 por sentada sigue igual. **24 h**.
- **Botones:** [Dale, otra] → la siguiente extra · [Lo dejamos acá] → FINAL-CHICO (ver Huecos).

> ¿Querés otra o lo dejamos acá?
>
> [Dale, otra] [Lo dejamos acá]

### EXTRAS-FIN
- **Cuándo:** si se terminan las extras; va pegado antes de FINAL-CHICO. **24 h**.

> Esa era la última que me quedaba.

### FINAL-CHICO · mensaje final al chico
- **A quién:** al chico (canal A) o al número del padre (canal B). **24 h** (no hay plantilla).
- {{1}} cómo le dicen · {{2}} quién se lo regala (singular).

> Bueno {{1}}, hasta acá llegamos. Ya tengo todo lo que contaste con tus audios y tus fotos, y ahora con eso se arma el libro, con tus palabras. Cuando esté listo te lo va a dar {{2}}, que fue quien te hizo este regalo. La última parte, la del sobre cerrado, va aparte, pegada al libro, para que la abras cuando seas grande. Gracias por contarme todo esto. Nos vemos pronto.

### FINAL-CHICO-PL
- Para "tus papás", "tus abuelos"… `paso-3-ronda4-final.md` dice que "va una segunda versión en plural". **FALTA el texto** (no está escrito en ningún archivo).

### TERMINO-PADRE · aviso al padre de que terminó
- **A quién:** al padre (canal A y B). **Cuándo:** cuando el chico terminó de contar (sale FINAL-CHICO).
- **Plantilla** `kids_termino_padre` · {{1}} nombre del padre · {{2}} nombre del chico. Sin botones.

> Hola {{1}}. {{2}} terminó de contar. Ya están todas sus respuestas en tu panel, también las del sobre cerrado. Ahora empieza el armado del libro, y te avisamos cuando esté listo. Y lo mismo que al principio, no le digas nada hasta el libro.

### LIBRO-LISTO
- El aviso al padre de que el libro está listo lo prometen TERMINO-PADRE y COMPRA-1. **FALTA el texto y la plantilla.**

---

## 8. La compra (web)

Tres pantallas, como la compra de Viaje. Arriba, los pasos: **1. Vos · 2. Quién cuenta · 3. Temas y pago**.

### COMPRA-1 · Vos

| ID | Elemento | Texto |
|---|---|---|
| COMPRA-1-TITULO | Título | El libro de su vida, contado con audios. |
| COMPRA-1-BAJADA | Bajada | Le hacemos preguntas por WhatsApp, responde con audios y con fotos, y todo eso se vuelve un libro de verdad. Acá van tus datos. |
| COMPRA-1-NOMBRE | Tu nombre | placeholder "Nombre y apellido" |
| COMPRA-1-WA | Tu WhatsApp | placeholder "11 5555 1234" · ayuda "Acá te avisamos si hace falta y cuando el libro esté listo." |
| COMPRA-1-CORREO | Tu correo | placeholder "vos@ejemplo.com" · ayuda "Con este entrás a tu panel, donde ves todo lo que cuenta." |

### COMPRA-2 · Quién cuenta

| ID | Elemento | Texto |
|---|---|---|
| COMPRA-2-TITULO | Título | Quién lo cuenta. |
| COMPRA-2-BAJADA | Bajada | Lo que necesitamos para que las preguntas le hablen bien y la tapa sea suya. |
| COMPRA-2-NOMBRE | Su nombre | placeholder "Nombre y apellido" · ayuda "Así va en la tapa." |
| COMPRA-2-APODO | Cómo le dicen | placeholder "Como le dicen en casa" · ayuda "Así lo saludamos en los mensajes." |
| COMPRA-2-GENERO | Chico o chica | Chico · Chica · ayuda "Solo para que las preguntas le hablen bien." |
| COMPRA-2-EDAD | Edad | placeholder "11" · ayuda "Va en la tapa, al lado del nombre." |
| COMPRA-2-REGALA | Quién se lo regala | Tu mamá · Tu papá · Tus papás · Tu abuela · Tu abuelo · Tus abuelos · Otra persona (libre, placeholder "Tu tía, tus padrinos, tu madrina") · ayuda "Así lo nombra el primer mensaje. Escribilo como se lo dirías a quien lo recibe." |
| COMPRA-2-CANAL-A | Por dónde llegan las preguntas · **A su WhatsApp** | "Le escribimos directo y responde cuando tiene ganas. Vos ves todo lo que cuenta desde tu panel." · campo "Su WhatsApp" · "Al elegir esto, sos vos, como adulto a cargo, quien autoriza que le escribamos a ese número." |
| COMPRA-2-CANAL-B | **Lo hago yo** | "Las preguntas llegan a tu WhatsApp. Te sentás al lado, se las leés y responde con sus palabras." |
| COMPRA-2-HORA | A qué hora le escribimos | 18:00 por defecto · ayuda "Mejor a la vuelta de la escuela, o cuando puedan sentarse juntos." |

Elegir el canal A **es** la autorización: no hay casilla aparte.

### COMPRA-3 · Temas y pago

| ID | Elemento | Texto |
|---|---|---|
| COMPRA-3-TITULO | Título | Temas y pago. |
| COMPRA-3-BAJADA | Bajada | Hay cosas que solo vos sabés si conviene tocar. Lo que marques acá no se pregunta, y el libro se arma igual con el resto. |
| COMPRA-3-TEMAS | No preguntar sobre | Su mamá · Su papá · Un abuelo o abuela que murió · Su familia ensamblada (la pareja de mamá o papá, sus hijos) · Una mudanza o un cambio grande · Un mal momento en la escuela |
| COMPRA-3-DEBAJO | Debajo de los temas | Todo lo demás tiene botón para pasar. Si una pregunta no le gusta, la salta y seguimos. |
| COMPRA-3-FOTOS | Casilla (apagada) | Pueden ir fotos con otros chicos · ayuda "Si no la marcás, las fotos donde aparecen otros chicos quedan fuera del libro." |
| COMPRA-3-BOTON | Botón | Pagar {precio} |
| COMPRA-3-DESPUES | Qué pasa después | Después de pagar te llega un correo para entrar a tu panel. Si elegiste su WhatsApp, le escribimos para presentarnos y a vos te avisamos. Si lo hacés vos, el primer mensaje llega a tu WhatsApp y la primera pregunta sale cuando estén juntos. |

Qué saca cada tema (decidido 05/10):

| Tema marcado | Qué no sale |
|---|---|
| Su mamá | K10 y sus extras |
| Su papá | K11 y sus extras |
| Un abuelo o abuela que murió | K13 (aunque es ★) |
| Su familia ensamblada | K18 |
| Una mudanza o un cambio grande | K38 |
| Un mal momento en la escuela | Esa extra del cap. 3 |

La separación de los padres no es tema (ninguna pregunta la toca). K39 y K41 no se sacan: tienen botón para pasar.

---

## 9. Lo que falta (resumen; detalle en `flujo-vigente.md` → Huecos)

| Falta | Por qué |
|---|---|
| FINAL-CHICO-PL | Anunciada en ronda 4, nunca escrita. |
| RECORD-B a los 8 días | El texto dice "cuatro días"; en canal A se hizo `_8`, en B no. |
| LIBRO-LISTO | Prometido al padre, sin texto ni plantilla. |
| Correo de acceso al panel | Lo promete COMPRA-3-DESPUES. |
| Respuesta a [Mañana mejor] (B-AVISO-SERIA) | El banco no la tiene. |
| Plantilla para EXTRAS-OFERTA / FINAL-CHICO fuera de las 24 h | Pueden caer fuera de la ventana. |
