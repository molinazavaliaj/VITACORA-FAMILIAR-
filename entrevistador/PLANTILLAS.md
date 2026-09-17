# Plantillas de WhatsApp (se crean en WhatsApp Manager → Plantillas de mensajes, idioma "Español" `es`)

Meta obliga a usar plantillas aprobadas para **iniciar** una conversación (fuera de la
ventana de 24 hs desde el último mensaje del narrador). Las respuestas dentro de esa
ventana —repreguntas, confirmaciones, despedida— van como texto libre y no
necesitan plantilla.

La aprobación tarda de horas a días: **cargarlas cuanto antes**.

> **Estado en Meta (16-17/09, cuenta de Joaquín, app 1061858183385953).** Las 4 están
> enviadas. Categorías que quedaron: `recordatorio` **Utilidad**; `bienvenida`,
> `pregunta_diaria` y `pregunta_diaria_vos` **Marketing** (el clasificador no aceptó
> Utilidad ni con dos reescrituras; apelación enviada). Para el código la categoría es
> transparente; solo cambia el precio (~USD 0,06 por mensaje de marketing).
>
> Reglas del formulario que ya nos frenaron: las variables son posicionales (`{{1}}`,
> no `{{nombre}}`), y **no pueden ir al principio ni al final** del cuerpo (por eso
> `recordatorio` arranca con "Hola {{1}},").

## bienvenida — variables: {{1}} cómo le dicen, {{2}} quién lo regala

Hola {{1}} 👋 Soy su biógrafo. {{2}} le hizo un regalo muy especial: vamos a escribir
juntos el libro de su vida. Cada mañana le voy a mandar una pregunta, y usted me responde
con un audio, como le cuenta las cosas a un amigo. Al final, su historia quedará en un
libro para su familia. Si su familia lo pide, el audiolibro puede llevar su propia voz,
recreada a partir de estos audios; al responder SÍ también nos da permiso para eso.
¿Empezamos? Responda SÍ y arrancamos mañana.

> **Cambió el 2026-09-17 (3t.15, permiso de voz).** La frase "Si su familia lo pide…"
> es nueva: la voz es dato biométrico y la política de privacidad promete pedir
> permiso. **La que está en revisión en Meta es la versión anterior, sin esa frase.**
> Cuando la aprueben, hay que editarla en WhatsApp Manager con este cuerpo (vuelve a
> revisión) y, recién cuando la nueva esté aprobada, poner `WA_BIENVENIDA_PIDE_VOZ=1`
> en Railway: desde ahí el SÍ del narrador anota `consentimiento_voz_at` solo. Mientras
> tanto, el permiso de los pilotos se carga a mano después de pedírselo por teléfono:
> `npm run manual -- ficha <narrador> --voz-si`.

## pregunta_diaria — variables: {{1}} la pregunta de hoy

> Cambió el 2026-09-14: antes tenía DOS variables ({{1}} el reconocimiento de
> ayer generado por el modelo, {{2}} la pregunta). El saludo se sacó por decisión
> de producto: costaba ~USD 3,36 por narrador —el 70% de la entrevista— porque
> cada día le pegaba TODA la historia al prompt. **Si ya la cargaste en Meta con
> dos variables, avisá antes de subir este cambio**: hay que re-aprobarla.

La pregunta de hoy: {{1}}

Cuando quiera, me responde con un audio. Sin apuro. 🎙️

> **El trato (2026-09-15).** Este cuerpo está en USTED y es el que aprueba Meta.
> Cuando el mensaje sale por plantilla (fuera de la ventana de 24 h), el narrador
> lee "Cuando quiera, me responde" aunque su trato sea `vos` — el texto libre del
> modo rápido y de la puerta manual sí respeta el trato. El gemelo sería una
> plantilla nueva `pregunta_diaria_vos` con el cuerpo:
>
> La pregunta de hoy: {{1}}
>
> Cuando quieras, me respondés con un audio. Sin apuro. 🎙️
>
> Cargada en Meta el 16/09 como `pregunta_diaria_vos` (Marketing). Hasta que el
> código la use, la plantilla en usted es la que sale para todos.

## recordatorio — variables: {{1}} cómo le dicen

Hola {{1}}, la pregunta de hoy de su entrevista con Vitácora Familiar sigue esperando su
respuesta. Cuando tenga un ratito, me la manda por audio. Sin apuro.

> Es el cuerpo que aceptó Meta como Utilidad (16/09). El anterior ("{{1}}, cuando tenga
> un ratito…") arrancaba con la variable y el formulario lo rechazaba.

---

**Nota:** el mensaje de texto libre (dentro de la ventana de 24 hs) dice
exactamente lo mismo que la plantilla — es el que usa el "modo rápido" de los
pilotos y la puerta manual.
