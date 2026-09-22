# Mi Primer Capítulo — spec (22/09/2026, Naza)

**Línea: Vitácora Kids.** Producto aparte de la Vitácora Familiar. Vive en su propia rama
(`vitacora-kids`), su propia carpeta (`docs/kids/`), su propio modo (`kids`) y su propia
ruta (`/kids/mi-primer-capitulo`). No comparte nombres, rutas ni guion con la Vitácora del
abuelo: comparte la máquina de abajo y nada más.

**Qué es.** La hermana de la Vitácora que le vende al mismo cliente. Un chico de 11 recibe
durante tres semanas **20 preguntas grandes** por WhatsApp — una por día, se contestan con
un audio — y, pegada a cada una, una **"mostrame"**: una foto de algo suyo con una línea
de explicación. Al final hay un libro con sus palabras, sus fotos y sus audios reales.

La promesa al que paga es una sola frase: *"Vos no te acordás cómo pensabas a los 11.
Él tampoco se va a acordar — salvo que lo guardemos ahora."*

**Por qué vale la pena.** (1) El dolor es verificable en el comprador mismo: al padre de 43
le preguntás qué quería ser a los 11 y no se acuerda — no hay que convencerlo de nada.
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

## De dónde salen las preguntas

No se inventaron: se **tradujeron las 26 del seed** (`supabase/seed.sql`). De las 26, 24
tienen versión para un chico de 11. Mueren dos: "hasta dónde llegó con los estudios" y
"el noviazgo y la boda".

Y el hallazgo: **las que no aplican no mueren, se dan vuelta.** "¿Cómo fue usted como
padre?" en un chico de 11 es *"¿cómo vas a ser vos cuando seas padre?"* — y esa, leída a
los 40 con un hijo al lado, es la página más fuerte del libro.

## Las 20 grandes

Cinco capítulos de cuatro. Una por día: unos 20 días. La foto entra natural en las
primeras diez y se vuelve forzada de la 13 en adelante — pedirle una foto del día más
difícil es horrible. Queda mejor así: **el libro empieza mirando cosas y termina
pensando**, que es exactamente cómo se abre un chico de 11 en tres semanas.

| # | Sale de | Texto (aprobado por Naza, 22/09) |
|---|---|---|
| **DE CHIQUITO** |||
| 1 | nueva | Arrancamos por lo más viejo que tengas guardado. ¿Cuál es el primer recuerdo de tu vida? Puede ser cortito, o medio borroso. Contámelo como te venga. |
| 2 | 3 | ¿A qué jugabas cuando eras más chiquito, y con quién? Contame una travesura de esas que ahora te dan risa. Si todavía tenés algo de esa época, sacale una foto. |
| 3 | 1 | Mandame una foto del lugar de tu casa donde más estás. Tu pieza, el sillón, el patio, donde sea. Y contame qué hay ahí que sea tuyo. |
| 4 | 7 | ¿Qué se cocina en tu casa que te vuelve loco? Sacale una foto la próxima vez. Y contame cómo son los domingos ahí — o la Navidad, si esa es la buena. |
| **MI GENTE** |||
| 5 | 2 | Hoy la más importante. Contame cómo son tu mamá y tu papá. Cada uno por separado: cómo es, qué hace, qué le gusta, qué te hace reír de él. Tomate todo el tiempo en esta. |
| 6 | 6 | ¿Tenés hermanos? Contame cómo es cada uno y con quién te llevás mejor. Si sos hijo único, contame cómo es eso. |
| 7 | 5 | Contame de tus abuelos. ¿Cómo son, qué hacen con vos? ¿Y qué historias te cuentan de cuando **ellos** eran chicos? |
| 8 | 9 | Tus amigos. ¿Quién es tu mejor amigo, cómo se conocieron, qué hacen juntos? Si tenés una foto de la banda, mandala. |
| **MI MUNDO AHORA** |||
| 9 | 4 | ¿Cómo es tu escuela? Contame de algún maestro o algún compañero que no te vas a olvidar nunca — para bien o para mal. |
| 10 | 8 | ¿Qué música escuchás? ¿Qué mirás? Mandame una captura de lo último que estuviste viendo. Y contame cómo es un sábado tuyo, de principio a fin. |
| 11 | 16 | ¿Qué es lo que mejor te sale? Eso que hacés y decís "en esto soy bueno". Contame la última vez que te salió perfecto. |
| 12 | 11 | Hablemos de plata. ¿Te dan? ¿Ganaste alguna vez por algo que hiciste? ¿Y en qué se te va? |
| **LO QUE ME PASÓ** |||
| 13 | 12 | Ahora quiero **esa** historia. La que contás siempre, la que ya todos escucharon y igual se ríen. Todos tenemos una. ¿Cuál es la tuya? |
| 14 | 15 | ¿Alguna vez te peleaste en serio con un amigo? Contame qué pasó y cómo se arreglaron. O si no se arreglaron. |
| 15 | 22 | Hoy una seria. A todos nos toca algún día feo. ¿Cuál fue el tuyo? Contá lo que quieras contar, y lo que no quieras no lo cuentes. |
| 16 | 23 | Cuando algo te sale mal o estás triste, ¿a quién buscás? ¿Y qué te dice esa persona que te hace bien? |
| **PARA CUANDO SEAS GRANDE** — *sobre cerrado* |||
| 17 | 13 | Che, ¿ya te pasó de que te guste alguien? No hace falta que digas quién — contame cómo es que te das cuenta. |
| 18 | 19+20+21 | Imaginate que tenés un hijo. ¿Qué vas a hacer igual que tus viejos, y qué vas a hacer distinto? |
| 19 | 25 | Esta es para vos, dentro de 30 años. Vas a tener 40 y esto lo vas a leer. ¿Qué le querés decir a ese tipo? Tomate todo el tiempo del mundo. |
| 20 | 26+24 | La última. Imaginate que alguien no te conoce nada y tenés dos minutos para que sepa quién sos. Contame. |

**Por qué la 17 está redactada así.** El padre ve todo en el panel (ver *El canal*), y un
chico de 11 que sabe que su mamá lee no contesta "¿te gusta alguien?". No se le pide una
confesión: se le pide **cómo se da cuenta**. Contesta igual y no lo expone.

**La 15 necesita `contexto.evitar`,** que ya existe. Un chico de 11 puede tener una
separación, una mudanza, un abuelo que se murió o un problema en la escuela. Es la pregunta
que más valor tiene y la que más fácil te explota: el padre carga en la compra qué no se
toca, igual que se hizo con Ciro el 18/09.

## Las 15 "mostrame" — el objeto es el disparador

Un chico no contesta "¿cómo eras?", pero le ponés el juguete roto en la mano y habla veinte
minutos. Y son las páginas que a los 40 lo parten al medio: no la frase, la foto del muñeco.

**No se mezclan con las grandes.** Las grandes se contestan con un audio y hacen pensar;
estas se contestan en treinta segundos con una foto y una línea. En el mismo saco, cansan.

**Cómo llegan (decidido 22/09):** pegada a la grande del día, **como premio**. El chico
contesta la grande y el bot le manda enseguida la cortita — *"buenísimo. Ahora una fácil:
mostrame tu juguete favorito"*. Premia haber contestado, no alarga el calendario y mantiene
los 20 días. Los 5 días sin cortita son los del final, que son los serios.

| # | Texto |
|---|---|
| M1 | Mostrame tu juguete favorito. El que elegirías si tuvieras que quedarte con uno solo. ¿Por qué ese? |
| M2 | Ahora el más nuevo. El último que te regalaron o que te compraste. ¿Quién te lo dio? |
| M3 | ¿Tenés algo roto que igual no tirás? Mostrámelo. ¿Cómo se rompió? |
| M4 | Si tenés mascota, mostrámela. ¿Cómo se llama, quién le puso el nombre, de dónde salió? |
| M5 | Tu comida favorita. Sacale una foto la próxima vez que te la hagan. ¿Quién la hace mejor? |
| M6 | ¿Cuál es la peli que más veces viste? Mandame una foto de la pantalla. |
| M7 | ¿A qué youtuber o streamer mirás? Mandame una captura. ¿Qué tiene que te gusta? |
| M8 | Cuando no tenés nada que hacer, ¿qué hacés? Sacale una foto a eso. |
| M9 | ¿Qué materia te gusta más y cuál odiás? Mandame una foto de la carpeta de las dos. |
| M10 | ¿Hacés algún deporte? Mostrame con qué lo jugás — la pelota, la raqueta, las zapatillas. |
| M11 | ¿De qué cuadro sos? Mostrame la camiseta. ¿Quién te hizo hincha? |
| M12 | Tu jugador favorito. ¿Quién es, y por qué ese? |
| M13 | Las zapatillas o la ropa que te ponés siempre, la que tu vieja te quiere tirar. Mostrámelas. |
| M14 | Abrí tu mochila y sacale una foto a lo que hay adentro. Contame qué es cada cosa rara. |
| M15 | Algo que guardás hace años y nadie entiende por qué. Mostrámelo. |

*Suplentes, por si se cambia alguna:* tu lugar favorito fuera de casa · el mejor regalo que
te hicieron en la vida.

**Cabe en el sistema, pero justo.** El tope son 40 preguntas contando las 4 adaptativas
(`web/src/lib/guion.ts:6`): 20 + 15 + 4 = **39**. Para sumar más "mostrame" hay que mover el
tope o sacar las adaptativas en este modo.

## El canal — una sola decisión del padre

En la compra el padre elige una de dos, y **la elección es la autorización**: no hay
formulario de consentimiento aparte, ni firma, ni paso legal extra.

- **"Que le pregunten a mi hijo."** Pone el WhatsApp del chico. Al lado de la casilla, una
  línea: *"Sos vos quien autoriza que le escribamos a él."*
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

El sobre sella **el papel, no el panel**: el padre ve todas las respuestas mientras se
graban (decidido 22/09).

## Lo que se entrega

- **El libro** (PDF): sus palabras, primera persona, con sus fotos. Mismo motor.
- **"Mis cosas a los 11"**: la sección que la Vitácora del abuelo no tiene — el álbum de
  las 15 "mostrame", cada foto con lo que él dijo abajo. Es lo que el padre va a mostrar en
  la mesa, y lo más barato de producir de todo el producto.
- **Las cintas**: sus audios reales, limpios y ordenados por capítulo. **Sin clonar nada.**
  Se vende así: *"no imitamos su voz, te la guardamos"*. Sirve el masterizado, las pausas y
  la restauración que ya hace el worker de la PC de música.
- **El sobre cerrado.**
- **El impreso**, que en este producto no es un extra: **es el regalo**. Un PDF de tu hijo
  de 11 no se regala en un cumpleaños.

**Decidido explícitamente que NO va:** voz clonada del chico. Es la voz de un menor y el
producto no la necesita para ser el mejor regalo de la casa.

## La compra y el precio

`/kids/mi-primer-capitulo`. Mismos pasos que hoy, más el campo de canal.

**Precio: el mismo de la casa — 49 € / ARS 85.750.** No se baja por ser más corto: lo que
se paga no es la cantidad de preguntas, y un precio menor le dice al comprador que vale
menos que la del abuelo. Va por variable propia (`PRECIO_KIDS_EUR` /
`PRECIO_KIDS_ARS`), con la regla de las hermanas: sin precio configurado, el producto
no existe para el cliente (`web/src/lib/precios.ts:69`). El impreso arriba, según el
catálogo de 3t.27 (`specs/2026-09-22-catalogo-base-y-upsells-design.md`).

## Qué hay que construir

1. `contexto.modo = 'kids'` en el entrevistador, copiando la forma de
   `entrevistador/src/flujo/viaje.ts:31`, con las tres reglas de tono.
2. El guion del modo: las **20 grandes** (`tipo 'fija'`) y las **15 "mostrame"**, que
   necesitan un tipo propio — se mandan al recibir la respuesta de la grande, no a horario,
   y en el libro van al álbum, no a un capítulo.
3. El campo `canal` en el wizard de compra + `PRECIO_KIDS_EUR` / `_ARS`.
4. En la fábrica: el sobre cerrado (PDF aparte + páginas al final del impreso) y la sección
   **"Mis cosas a los 11"** (galería con epígrafe).
5. Plantilla de bienvenida nueva en Meta (cuerpo en `entrevistador/PLANTILLAS.md`).

**Las tres reglas de tono del modo** (lo único que cambia en el cerebro):

1. Tuteo, frases cortas, una instrucción por mensaje.
2. Una respuesta de seis palabras **es una respuesta válida**. Con un adulto el motor la
   trata como incompleta y repregunta; con un chico eso lo espanta.
3. La repregunta es **una sola** y siempre concreta: nunca "¿y cómo te hacía sentir?",
   siempre "¿y qué pasó después?". Lo abstracto le cierra la puerta.

**Lo que NO se toca:** transcripción, repregunta, fotos, panel, ritmo, pagos, mails de hitos.

## Cómo se valida (antes de escribir código)

1. **La prueba de cinco minutos.** Mandarle a tres padres que no conozcan a Naza la frase
   *"¿te acordás qué querías ser a los 11?"*. Si tres de tres se quedan pensando, hay
   producto.
2. **Piloto manual**, igual que Ciro y Joaquín: Naza le manda las 20 grandes y las 15
   "mostrame" a mano por WhatsApp al hijo de su novia, y anota todo en
   `docs/piloto-bitacora-errores.md`. En una semana contesta las tres cosas que ningún
   diseño puede contestar: **cuánto escribe de verdad un nene de 11**, **si las fotos
   llegan** y **si la cortita después de la grande lo engancha o lo satura**.

Sin esas dos, no se construye el modo.

## Lo que puede salir mal

- **Fotos con otros chicos adentro.** Van a llegar compañeros de escuela, y en un libro
  impreso eso es consentimiento de otros padres. Regla: en el cuerpo del libro, caras de
  terceros solo si el padre las aprueba una por una en el panel.
- **Que conteste corto y el libro salga flaco.** Es el riesgo real; el piloto lo mide antes
  de que cueste plata. Las "mostrame" son la red: aunque las grandes salgan flacas, el álbum
  sostiene el libro solo.
- **Que la novedad se le pase a los 6 días.** Por eso 20 grandes y no 30, y por eso la
  cortita como premio.
- **WhatsApp.** Si el canal es el teléfono del chico, formalmente el titular debería tener
  13+. Lo cubre que el padre elija y autorice, pero la landing no debe empujar el teléfono
  del nene: las dos opciones se muestran parejas.

## Lo que queda anotado para después (no es de este spec)

El nombre dice, solo, que va a haber un segundo. Un chico que termina su libro a los 11 y
hace el siguiente a los 13 es el cliente que más veces compra en toda la empresa. No se
diseña ahora, pero **la tapa y el diseño del libro tienen que bancar una colección** — si
la tapa dice "Capítulo Uno: 11 años", el segundo no obliga a rehacer nada.
