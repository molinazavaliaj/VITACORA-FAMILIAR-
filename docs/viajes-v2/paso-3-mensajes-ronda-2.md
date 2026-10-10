# Viaje V2 · Paso 3: mensajes fijos, ronda 2 (30/09/2026)

## Aprobado de la ronda 1 (Naza: "como recomiende Fable")
BIEN en dos mensajes (BIEN-1 + BIEN-2) · acuses ACN, ACM y ACA · PAS A durante el viaje y B antes de salir · TXT A · COR A. Textos en `paso-3-mensajes-ronda-1.md`.

## Tanda 2 (Fable)

### BIEN-1R · bienvenida cuando es un regalo (plantilla de Meta)
- **A (Fable elige):** Hola, {{nombre}}. Te escribo porque {{quien_regala}} te hizo un regalo: el libro de tu viaje, contado por vos. Funciona así: yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver tenés tu viaje escrito con tu voz, con tus fotos y con un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes.
- **B:** Hola, {{nombre}}. Soy quien va a escribir el libro de tu viaje; es un regalo de {{quien_regala}}. Yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver tenés tu viaje contado con tu voz, con tus fotos y con un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes.

### ACM · Fable coincide con el control y cambia los dos cortantes
Quedan: "Ya está, gracias." · "Gracias, quedó." · "Lo tengo. Hasta la noche." · "Llegó, {{nombre}}. Hasta la noche." (Si molestan dos "Hasta la noche", el cuarto puede ser "Qué lindo. Quedó guardado.")

### REC1 · antes de salir, una pregunta colgada
A los 3 días sin respuesta, una sola vez. Si faltan menos de 2 días para salir, no se manda (la cadena sigue ya de viaje).
- **A (Fable elige):** Hola, {{nombre}}. Te quedó una pregunta esperando, sin apuro. Cuando tengas un rato, contestámela en audio, o "paso" y seguimos con la que viene.
- **B:** {{nombre}}, la pregunta de la otra vez sigue ahí. Si querés contestarla, un audio cuando puedas; si no, "paso" y te mando la siguiente.

### REC2 · en el viaje, 3 noches sin contestar
Las noches perdidas se pierden: no se acumulan ni se repreguntan. REC2 va como primera línea de la pregunta de esa noche, **una sola vez por viaje**.
- **A (Fable elige):** {{nombre}}, hace unos días que no te escucho. ¿Anda todo bien por ahí? Retomamos cuando quieras, con lo de hoy nomás; lo de los otros días no hace falta.
- **B:** Hace unas noches que no me contás. Espero que sea porque estás pasándola bien. Cuando quieras, seguimos desde hoy, sin ponerte al día con nada.

### PR · las preguntas propias (reemplazan una noche común; terminan con la foto, no con el día)
- Regalo A: Esta te la manda {{quien_regala}}: «{{pregunta}}». Contámelo en audio cuando puedas, y si tenés una foto que vaya con eso, mandala.
- **Regalo B (Fable elige):** Hoy la pregunta no es mía, es de {{quien_regala}}: «{{pregunta}}». Contale a esa persona, aunque me lo mandes a mí. Si hay foto, va.
- Propia A: Esta es tuya, la dejaste anotada antes de salir: «{{pregunta}}». Contestátela ahora, desde acá, en audio. Si hay foto que vaya con eso, mandala.
- **Propia B (Fable elige):** Hoy va una que te dejaste vos, {{nombre}}, antes de salir: «{{pregunta}}». A ver qué le decís ahora. Si tenés una foto, mandala.
- La pregunta va tal cual, entre «», sin corregir. Esa noche el acuse es el ACN de siempre.

### DES · la despedida
- **A:** Hasta acá llegamos, {{nombre}}. Gracias por contarme tu viaje: con todo eso, tus fotos y tus audios se arma el libro. Cuando esté, lo vas a ver en tu panel antes de que se imprima, para que revises lo que quieras. Buen regreso.
- **B (Fable elige):** Ya está, {{nombre}}: el viaje quedó contado, con tu voz. Ahora me toca a mí armar el libro con lo que me diste; lo vas a poder leer en tu panel antes de imprimirlo, y ahí cambiás lo que haga falta. Fue lindo acompañarte. Que la vuelta a casa sea buena.
- Línea extra si mandó de más (antes de "Fue lindo acompañarte"): Del álbum me quedé con las primeras {{fotos_album}} que mandaste, que son las que entran.
- Con cero fotos: la despedida va igual, sin la línea del álbum, y Naza resuelve por fuera.

## Control (Claude)
| Qué | Nota |
|---|---|
| DES A y B | La despedida llega **después** de "llegar a casa" y del álbum: ya volvió. "Buen regreso" y "Que la vuelta a casa sea buena" mienten. Hay que cambiar ese final. |
| El resto | Ok. |
