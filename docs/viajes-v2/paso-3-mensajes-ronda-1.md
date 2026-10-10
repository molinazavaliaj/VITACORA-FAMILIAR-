# Viaje V2 · Paso 3: mensajes fijos, ronda 1 (30/09/2026)

Banco cerrado (`paso-2-*-aprobada*.md`). Naza aprobó el final: AL2 A, VU0 A, y con cero fotos se le avisa a él.

## BIEN · Bienvenida
Fable propone **partirla en dos**: primero quién y qué, y se pide el SÍ; las reglas llegan después del SÍ.

- **A (un solo mensaje):** Hola, {{nombre}}. Soy quien va a escribir el libro de tu viaje. La idea es simple: yo te pregunto, vos me contás en audio, y cuando vuelvas tenés tu viaje contado con tu voz. Antes de salir te mando unas pocas preguntas, y después silencio hasta el día que te vas. En el viaje, dos por día: una cortita al mediodía, una foto o diez segundos de audio, y una a la noche para que me cuentes el día. Si un día no tenés ganas, escribí "paso" y seguimos. La hora la tomo del país adonde vas; si cambiás de país y te llega a deshora, la corregís desde tu panel. Contestame SÍ para arrancar: con eso guardo tus audios, que algunos van al libro en un código QR.
- **B (dos mensajes, Fable elige):**
  - **BIEN-1:** Hola, {{nombre}}. Soy quien va a escribir el libro de tu viaje. Funciona así: yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver tenés tu viaje contado con tu voz, con tus fotos y con un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes.
  - **BIEN-2 (llega con el SÍ, antes de AS1):** Vamos. Antes de salir te mando unas pocas preguntas, de a una; cuando las contestás, silencio hasta el día que te vas. En el viaje, dos por día: una cortita al mediodía, que es una foto o diez segundos de audio, y una a la noche para que me cuentes el día. Si un día no tenés ganas, "paso" y seguimos. La hora la tomo del país adonde vas; si cambiás de país y te llega a deshora, la corregís desde tu panel. Ahí va la primera.

## SI1 · apenas dice SÍ
Con la B, es BIEN-2. Con la A: "Buenísimo, {{nombre}}. Empecemos por el principio."

## Acuses (primera línea del mensaje que sigue, o solos)
| Grupo | Cuándo | Rotan |
|---|---|---|
| ACN | Después de contestar la noche | "Gracias, {{nombre}}. A dormir, que mañana sigue." · "Quedó guardado. Buenas noches." · "Lo escuché. Hasta mañana, {{nombre}}." · "Gracias por contármelo. Que descanses." |
| ACM | Después del mediodía o de una foto | "Ya está. Seguí." · "Gracias, quedó." · "Lo tengo. Hasta la noche." · "Llegó. Seguí con lo tuyo." |
| ACA | Después de las de antes de salir (empalma con la siguiente) | "Gracias, {{nombre}}. Ahora otra cosa." · "Lo escuché. Sigo con esto." · "Quedó guardado. Te pregunto una más." · "Gracias. Y ahora..." |

## PAS · si dice "paso"
- **A (Fable elige, para las del viaje):** Dale, esta la salteamos. Mañana hay otra.
- **B (para las de antes de salir, que van encadenadas):** Perfecto, {{nombre}}, sin problema. Seguimos con la próxima.

## TXT · si escribe en vez de mandar audio
- **A (Fable elige):** Lo leí, gracias. Si podés, contámelo también en audio: tu voz es lo que va al libro. Y si te queda más cómodo escribir, escribí nomás.
- **B:** Gracias, {{nombre}}, lo leí. Cuando tengas un rato, mandámelo en audio si querés: así queda tu voz en el libro. Si no, así está bien.
- Se manda una o dos veces por viaje, no cada vez: si escribe siempre, es su manera.

## COR · audio cortado
- **A (Fable elige, la misma que V3):** Se me cortó el audio o no llegó bien, {{nombre}}. ¿Me lo mandás de nuevo cuando puedas? Sin apuro.
- **B:** No me llegó bien el audio, {{nombre}}. Cuando puedas, mandámelo otra vez, sin apuro.
- El ruido de la calle no es "cortado": si se entiende, no va COR.

## Control (Claude)
| Qué | Nota |
|---|---|
| Regalo | La bienvenida no contempla que sea un regalo. Hace falta una variante de BIEN-1: "{{quien_regala}} te regaló…". |
| Meta | El primer mensaje (BIEN-1 o A) sale fuera de la ventana de 24 h: tiene que ser una **plantilla aprobada por Meta**. Un texto nuevo es una plantilla nueva (trámite de Joaquín). BIEN-2 va después del SÍ, dentro de la ventana: texto libre. |
| ACM | "Seguí" y "Seguí con lo tuyo" suenan un poco cortantes. |
