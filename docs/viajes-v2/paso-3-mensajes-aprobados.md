# Viaje V2 · Paso 3 aprobado: los mensajes fijos (30/09/2026)

Aprobados por Naza (rondas en `paso-3-mensajes-ronda-*.md`). Redactó Fable.

## Arranque
| ID | Cuándo | Texto |
|---|---|---|
| BIEN-1 | Primer mensaje (plantilla de Meta), si lo compró para sí | Hola, {{nombre}}. Soy quien va a escribir el libro de tu viaje. Funciona así: yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver tenés {{formato}} con tu viaje contado con tu voz, tus fotos y un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes. |
| BIEN-1R | Primer mensaje (plantilla de Meta), si es un regalo | Hola, {{nombre}}. Te escribo porque {{quien_regala}} te hizo un regalo: {{formato}} con tu viaje, contado por vos. Funciona así: yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver lo tenés escrito con tu voz, con tus fotos y con un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes. |
| BIEN-2 | Apenas dice SÍ, justo antes de AS1 | Vamos. Antes de salir te mando unas pocas preguntas, de a una; cuando las contestás, silencio hasta el día que te vas. En el viaje, dos por día: una cortita al mediodía, que es una foto o diez segundos de audio, y una a la noche para que me cuentes el día. Si un día no tenés ganas, "paso" y seguimos. La hora la tomo del país adonde vas; si cambiás de país y te llega a deshora, la corregís desde tu panel. Ahí va la primera. |

`{{formato}}` = "un libro impreso" o "un libro en PDF", según la compra.

## Acuses (rotan; van como primera línea del mensaje que sigue, o solos si no sigue nada)
| Grupo | Cuándo | Textos |
|---|---|---|
| ACN | Después de contestar la noche | Gracias, {{nombre}}. A dormir, que mañana sigue. · Quedó guardado. Buenas noches. · Lo escuché. Hasta mañana, {{nombre}}. · Gracias por contármelo. Que descanses. |
| ACM | Después del mediodía o de una foto suelta | Ya está, gracias. · Gracias, quedó. · Lo tengo. Hasta la noche. · Llegó, {{nombre}}. Hasta la noche. |
| ACA | Después de las de antes de salir (empalma con la siguiente) | Gracias, {{nombre}}. Ahora otra cosa. · Lo escuché. Sigo con esto. · Quedó guardado. Te pregunto una más. · Gracias. Y ahora... |

## Casos
| ID | Cuándo | Texto |
|---|---|---|
| PAS-V | Dice "paso" en el viaje | Dale, esta la salteamos. Mañana hay otra. |
| PAS-A | Dice "paso" antes de salir (la siguiente sale enseguida) | Perfecto, {{nombre}}, sin problema. Seguimos con la próxima. |
| TXT | Escribe en vez de mandar audio (una o dos veces por viaje, no siempre) | Lo leí, gracias. Si podés, contámelo también en audio: tu voz es lo que va al libro. Y si te queda más cómodo escribir, escribí nomás. |
| COR | Audio cortado o que no se entiende (el ruido de la calle no cuenta) | Se me cortó el audio o no llegó bien, {{nombre}}. ¿Me lo mandás de nuevo cuando puedas? Sin apuro. |
| REC1 | Antes de salir: una pregunta sin contestar 3 días (una sola vez; no va si faltan menos de 2 días para salir) | Hola, {{nombre}}. Te quedó una pregunta esperando, sin apuro. Cuando tengas un rato, contestámela en audio, o "paso" y seguimos con la que viene. |

## ATR · la noche anterior quedó sin contestar (pegado arriba de la pregunta de la noche)
Una noche (rotan):
- Ayer no me contaste, y no pasa nada. Si querés, metelo hoy junto con lo de hoy, con esas fotos también.
- Anoche quedó sin contar, y está bien. Hoy contame los dos días si tenés ganas, y mandá las fotos que hayan quedado.
- No te preocupes por lo de ayer. Si algo de ese día merece quedar, sumalo hoy, con foto si la hay.

Dos noches o más: Hace unos días que no me contás, y no pasa nada. Si querés, hoy contame lo que quieras de esos días, lo que te quedó, y mandá las fotos que tengas. Si no, con lo de hoy está bien.

(Reemplaza al "¿anda todo bien?" de los 3 días, que queda descartado.)

## Preguntas propias (reemplazan una noche común)
| ID | Cuándo | Texto |
|---|---|---|
| PR-R | Si es regalo | Hoy la pregunta no es mía, es de {{quien_regala}}: «{{pregunta}}». Contale a esa persona, aunque me lo mandes a mí. Si hay foto, va. |
| PR-P | Si las dejó el viajero | Hoy va una que te dejaste vos, {{nombre}}, antes de salir: «{{pregunta}}». A ver qué le decís ahora. Si tenés una foto, mandala. |

La pregunta va tal cual la escribieron, entre «», sin corregir.

## Despedida
| ID | Cuándo | Texto |
|---|---|---|
| DES | Cuando se cierra el álbum | Ya está, {{nombre}}: el viaje quedó contado, con tu voz. Ahora me toca a mí armar el libro con lo que me diste; lo vas a poder leer en tu panel antes de que se cierre, y ahí cambiás lo que haga falta. Fue lindo acompañarte. Gracias por dejarme entrar en tu viaje. |
| DES+ | Si mandó más fotos de las que entran: se agrega antes de "Fue lindo acompañarte" | Del álbum me quedé con las primeras {{fotos_album}} que mandaste, que son las que entran. |

Con cero fotos: la despedida va sin DES+ y se avisa a Naza.

## Decisiones de esta parte
- Las de antes de salir que faltaron van **todas**, en orden, **una por noche** en los primeros días del viaje, con su variante "ya de viaje", en lugar de la noche común (regla de Naza: nunca se saltean).
- Venta: el impreso se muestra como el producto y el PDF como la forma de empezar (para la web, más adelante).
