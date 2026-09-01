# Plantillas de WhatsApp (crear en Meta Business Manager, categoría Utility, idioma es)

Meta obliga a usar plantillas aprobadas para **iniciar** una conversación (fuera de la
ventana de 24 hs desde el último mensaje del narrador). Las respuestas dentro de esa
ventana —repreguntas, confirmaciones, despedida, saludos— van como texto libre y no
necesitan plantilla.

La aprobación tarda de horas a días: **cargarlas cuanto antes**.
Crear en WhatsApp Manager → Message Templates.

## bienvenida — variables: {{1}} cómo le dicen, {{2}} quién lo regala

Hola {{1}} 👋 Soy su biógrafo. {{2}} le hizo un regalo muy especial: vamos a escribir
juntos el libro de su vida. Cada mañana le voy a mandar una pregunta, y usted me responde
con un audio, como le cuenta las cosas a un amigo. Al final, su historia quedará en un
libro para su familia, con su propia voz. ¿Empezamos? Responda SÍ y arrancamos mañana.

## pregunta_diaria — variables: {{1}} reconocimiento de ayer, {{2}} pregunta de hoy

{{1}}

La pregunta de hoy: {{2}}

Cuando quiera, me responde con un audio. Sin apuro. 🎙️

## recordatorio — variables: {{1}} cómo le dicen

{{1}}, cuando tenga un ratito, la pregunta de hoy lo espera. Sin ningún apuro. 🌿

---

**Nota:** el primer envío de `pregunta_diaria` (día 1, sin respuesta anterior) usa como
`{{1}}` el texto fijo `Hoy empezamos este viaje.`
