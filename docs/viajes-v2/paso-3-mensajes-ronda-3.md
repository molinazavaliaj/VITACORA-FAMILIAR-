# Viaje V2 · Paso 3: mensajes fijos, ronda 3 (30/09/2026)

## Decisiones de Naza (sobre la ronda 2)
- **Aprobado como eligió Fable:** BIEN-1R A, los ACM nuevos, REC1 A, PR regalo B, PR propia B, DES B (con final nuevo).
- **Bienvenida:** tiene que quedar claro si recibe **libro impreso o PDF**. Vitácora de Viaje también se puede comprar sin el libro físico.
- **Días sin contestar:** en vez de "¿anda todo bien?" a los 3 días, al día siguiente la pregunta llega igual, con una línea que lo invita a contar lo que no contó y a mandar esas fotos, sin culpa.
- Pendiente de respuesta: en qué momento del viaje van las preguntas de antes de salir que no contestó (Claude propone que ocupen el mediodía de los primeros días, una por día).

## Lo que trajo Fable

### Bienvenida con {{formato}} ("un libro impreso" o "un libro en PDF")
- **BIEN-1 A (Fable elige):** Hola, {{nombre}}. Soy quien va a escribir el libro de tu viaje. Funciona así: yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver tenés {{formato}} con tu viaje contado con tu voz, tus fotos y un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes.
- BIEN-1 B: Hola, {{nombre}}. Soy quien va a escribir el libro de tu viaje. Yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver tenés tu viaje hecho libro, impreso o en PDF según lo que elegiste, con tu voz, tus fotos y un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes.
- **BIEN-1R A (Fable elige):** Hola, {{nombre}}. Te escribo porque {{quien_regala}} te hizo un regalo: {{formato}} con tu viaje, contado por vos. Funciona así: yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver lo tenés escrito con tu voz, con tus fotos y con un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes.
- BIEN-1R B: Hola, {{nombre}}. Te escribo porque {{quien_regala}} te hizo un regalo: el libro de tu viaje, contado por vos, impreso o en PDF según lo que eligió. Yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver lo tenés escrito con tu voz, con tus fotos y con un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes.

### ATR · la noche anterior quedó sin contestar (va pegada arriba de la pregunta de la noche)
Rotan (1 noche):
- Ayer no me contaste, y no pasa nada. Si querés, metelo hoy junto con lo de hoy, con esas fotos también.
- Anoche quedó sin contar; da igual. Hoy contame los dos días si tenés ganas, y mandá las fotos que hayan quedado.
- No te preocupes por lo de ayer. Si algo de ese día merece quedar, sumalo hoy, con foto si la hay.

Una sola, para 2 o más noches seguidas:
- Hace unos días que no me contás, y no pasa nada. Si querés, hoy contame lo que quieras de esos días, lo que te quedó, y mandá las fotos que tengas. Si no, con lo de hoy está bien.

Fable: **ATR reemplaza a REC2** ("¿anda todo bien?"). Si Naza quiere conservar esa pregunta, que vaya adentro de la de varios días, no como mensaje aparte.

### DES · final nuevo
Ya está, {{nombre}}: el viaje quedó contado, con tu voz. Ahora me toca a mí armar el libro con lo que me diste; lo vas a poder leer en tu panel antes de que se cierre, y ahí cambiás lo que haga falta. Fable lo cierra así: Fue lindo acompañarte. Gracias por dejarme entrar en tu viaje.
("Antes de imprimirlo" pasa a "antes de que se cierre": mentía si compró PDF.)

## Control (Claude)
- "Anoche quedó sin contar; da igual." "Da igual" puede sonar a que no importa. Las otras dos no tienen ese riesgo.
- Hay que confirmar con Naza que Viaje se vende en PDF y el impreso es un agregado (así estaba en la compra de main).
