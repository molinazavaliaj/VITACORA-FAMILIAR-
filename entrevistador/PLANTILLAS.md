# Plantillas de WhatsApp (crear en Meta Business Manager, categoría Utility, idioma es)

Meta obliga a usar plantillas aprobadas para **iniciar** una conversación (fuera de la
ventana de 24 hs desde el último mensaje del narrador). Las respuestas dentro de esa
ventana —repreguntas, confirmaciones, despedida— van como texto libre y no
necesitan plantilla.

La aprobación tarda de horas a días: **cargarlas cuanto antes**.
Crear en WhatsApp Manager → Message Templates.

## bienvenida — variables: {{1}} cómo le dicen, {{2}} quién lo regala

Hola {{1}} 👋 Soy su biógrafo. {{2}} le hizo un regalo muy especial: vamos a escribir
juntos el libro de su vida. Cada mañana le voy a mandar una pregunta, y usted me responde
con un audio, como le cuenta las cosas a un amigo. Al final, su historia quedará en un
libro para su familia, con su propia voz. ¿Empezamos? Responda SÍ y arrancamos mañana.

## pregunta_diaria — variables: {{1}} la pregunta de hoy

> Cambió el 2026-09-14: antes tenía DOS variables ({{1}} el reconocimiento de
> ayer generado por el modelo, {{2}} la pregunta). El saludo se sacó por decisión
> de producto: costaba ~USD 3,36 por narrador —el 70% de la entrevista— porque
> cada día le pegaba TODA la historia al prompt. **Si ya la cargaste en Meta con
> dos variables, avisá antes de subir este cambio**: hay que re-aprobarla.

La pregunta de hoy: {{1}}

Cuando quiera, me responde con un audio. Sin apuro. 🎙️

## recordatorio — variables: {{1}} cómo le dicen

{{1}}, cuando tenga un ratito, la pregunta de hoy lo espera. Sin ningún apuro. 🌿

---

**Nota:** el mensaje de texto libre (dentro de la ventana de 24 hs) dice
exactamente lo mismo que la plantilla — es el que usa el "modo rápido" de los
pilotos y la puerta manual.
