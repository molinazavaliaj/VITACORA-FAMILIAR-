# Plan: la entrevista V3 por WhatsApp de verdad

**Qué es:** cómo conectar el flujo nuevo (`fabrica/src/v3/entrevista/`) al entrevistador de WhatsApp para que Naza y Joaquín lo prueben como narradores. Propuesta del 30/09/2026; **no se construyó nada**. El código del entrevistador es de Joaquín: lo hace él (o un agente con su OK).

## Cómo está hoy el entrevistador (`entrevistador/`, leído sin tocar)

| Tema | Hoy | Lo que pide V3 |
|---|---|---|
| WhatsApp | Meta Cloud API, número propio (+54 9 11 2866-8813), webhook en `src/whatsapp/webhook.ts`, plantillas aprobadas | Igual: no cambia |
| Qué pregunta sigue | Banco viejo en la tabla `preguntas`, por número de orden (`dia_actual`); Haiku personaliza, Opus reemplaza y genera adaptativas | `siguientePregunta` del banco nuevo (IDs como CA6, AM9), sin ningún modelo |
| Después de cada respuesta | Opus evalúa y puede repreguntar (`procesar.ts:308`) | Nada de modelos: `mensajesDespues` elige el acuse |
| Varios audios | Con ritmo `seguido`, la pregunta siguiente sale **apenas llega el primer audio**; el segundo cae en la pregunta nueva | Los audios se **suman** a la pregunta abierta; la siguiente sale **cuando pasan unos minutos sin audios** |
| Cómo se arma el mensaje | `mensajeDePregunta` | `armarTurno`: acuse pegado arriba (el sobrio solo), frase de entrada, M1 en cursiva donde corresponde |
| Estado por narrador | `narradores.dia_actual` y `contexto` | Mapa de respuestas por ID, lo enviado y los contadores de rotación de acuses |
| Transcripción | OpenAI `gpt-transcribe`, USD 0,0045/min | Igual |
| Código compartido | El entrevistador **no importa** nada de `fabrica` (paquetes y Dockerfile separados) | Hay que llevarle el código de `fabrica/src/v3/entrevista/` |

## Qué habría que hacer (Joaquín)

1. **Modo V3 por narrador**, sin romper el flujo viejo: `narradores.contexto.version = 'v3'`. Los narradores viejos siguen igual; solo los de prueba van por V3.
2. **Traer el código de la entrevista nueva** al entrevistador: copiar `fabrica/src/v3/entrevista/` (`banco.json`, `banco.ts`, `flujo.ts`, `mensajes.ts`, `texto.ts`, y los tipos de `ficha.ts` que usan) a `entrevistador/src/v3/`, con un test que falle si la copia queda distinta del original. Es lo más simple con dos Dockerfiles separados. La alternativa, un paquete compartido o cambiar el contexto del Docker, es más prolija pero más trabajo.
3. **Estado V3 en `contexto.v3`** (jsonb, sin migración): `respuestas` (ID → transcripción, sumando los audios de esa pregunta), `enviados` (aviso y final), `abierta` (ID de la pregunta que espera respuesta), `ultimoAudioAt`, y los contadores de rotación `M3`, `M4`, `M24`, `M25`.
4. **Al llegar un audio** de un narrador V3: transcribir, sumarlo a la pregunta abierta y guardar `ultimoAudioAt`. **No** mandar nada todavía, ni evaluar con Opus.
5. **Silencio → siguiente:** un chequeo **cada minuto** busca narradores V3 con pregunta abierta y `ultimoAudioAt` de hace más de **N minutos** (propuesta: 3; configurable). Para esos: `mensajesDespues` (qué acuse) → `siguientePregunta` → `acuseAntesDe`/`acuseNeutro`/`entradaSegunAcuse` → `renderizar` → `armarTurno` → mandar los mensajes en orden. El guion de referencia es `fabrica/scripts/v3-entrevista-lectura.ts`, que hace exactamente eso. Tiene que ser por base y no un `setTimeout` en memoria, para que un reinicio de Railway no pierda turnos.
6. **Texto en vez de audio:** M22 (no avanza). **Audio cortado o vacío:** M23. **"Paso"** lo detecta el código solo, sobre la transcripción.
7. **Aviso (AV11) y final (FIN):** se mandan sin esperar respuesta; después del final, estado `completado`.
8. **Arranque:** al activar un narrador V3 se manda BIEN y enseguida la primera pregunta (OR1 con M1). Dentro de las 24 hs de ventana va como texto libre; fuera de la ventana, con la plantilla que ya existe.
9. **Datos para los textos:** `nombre` y `genero` del narrador (para "chico/chica" y "padre/madre").
10. **Fuera de esta prueba:** los recordatorios M8/M9, la foto (FO1 acepta imagen, que el webhook ya entiende), las preguntas de la familia y el dashboard. Para probar, FO1 se contesta con una foto o un audio.

## Puntos técnicos a resolver (revisión del 30/09 contra el código)
1. **Dónde se bifurca:** en `procesar.ts`, `case 'activo'` (~:141-146). Audio, texto e imagen de un narrador V3 se desvían **antes** de `manejarTexto`, que hoy llama a un modelo (`detectarIntencion`).
2. **Foto:** hoy toda imagen va a `recibirFotoFamiliar` (flujo viejo, `procesar.ts:126-135`). Para V3, o se ramifica ahí o FO1 se contesta en audio en esta prueba.
3. **Género:** el entrevistador no lo tiene. Cargarlo en `contexto.v3.ficha` (`nombre` = `como_le_dicen`, `genero`: `varon` / `mujer`). Para la prueba, a mano para Naza y Joaquín.
4. **Concurrencia:** tomar el turno de forma atómica (por ejemplo, un campo `enviando` o un `UPDATE … WHERE abierta = X`) para que el chequeo de cada minuto no mande dos veces. Un audio que llega mientras se manda el turno cuenta para la pregunta nueva. Escribir `contexto.v3` por clave (`jsonb_set`) o serializado, porque hoy `contexto` se reescribe entero en varios lugares.
5. **Silencio y transcripción:** medir los N minutos desde que se **guarda la transcripción** del último audio, no desde que llegó. Ignorar reintentos de Meta (mismo `wa_message_id`) para no sumar un audio dos veces.
6. **Estados:** activar V3 al pasar a `activo` (hoy `acepto` espera la primera pregunta, `procesar.ts:148`); después de FIN, `completado`. Si el narrador escribe estando `pausado`, retoma la pregunta abierta.
7. **Plantilla fuera de 24 hs:** mete todo el turno en una variable y Meta no acepta bien los saltos de línea ni la cursiva ahí. Para la prueba, arrancar siempre dentro de la ventana (el narrador escribe primero) y probar la plantilla aparte.
8. **Test de la copia:** comparar solo los archivos copiados enteros (`banco.json`, `flujo.ts`, `mensajes.ts`, `texto.ts`); los tipos de `ficha.ts`, si se copian parciales, quedan afuera.

## Cómo lo probamos

- **Narradores de prueba:** Naza y Joaquín, cada uno con su número, en modo V3, con un nombre y un género de ficha. Contestan como quieran: esto no se usa para ningún libro.
- **Para no tardar días:** N = 3 minutos de silencio. Se puede hacer de corrido en una o dos sentadas, o cortar y seguir otro día: la entrevista retoma donde quedó.
- **Qué mirar:** que los audios se sumen bien a la pregunta, que el silencio dispare el turno a tiempo, que los mensajes lleguen como en la lectura corrida (acuse arriba, M1 en cursiva, entrada separada), que el "no" y el "paso" hagan lo que tienen que hacer, y cómo se siente contestar 88 preguntas (89 antes de las simulaciones: salió HI2b). Y desde las simulaciones, que los botones lleguen y se entiendan. Anotar todo en `docs/v3/entrevista/prueba-whatsapp.md` (nuevo).
- Conviene correr antes, o en paralelo, la simulación con narradores inventados (`simulaciones/PLAN.md`): encuentra fallas de lógica sin gastar transcripción.

## Costo

| Qué | Por entrevista completa | Nota |
|---|---|---|
| Transcripción (OpenAI `gpt-transcribe`, USD 0,0045/min) | **~USD 0,80 a 1,20** | 89 respuestas × 2 a 3 min. Una entrevista a medias cuesta proporcionalmente menos. |
| Claude (Opus/Haiku) | **USD 0** | V3 no usa modelos durante la entrevista, siempre que el desvío sea antes de `manejarTexto` (punto 1). Según GASTOS.md, el flujo viejo gasta ~USD 0,60 por entrevista en eso. |
| WhatsApp (Meta) | ~0 en la prueba | Mientras se conteste dentro de las 24 hs, todo va como texto libre. Las plantillas (fuera de la ventana) tienen un costo chico de Meta que no verifiqué. |
| **Prueba de Naza + Joaquín (2 entrevistas)** | **~USD 2 a 2,50** | Se descuenta del saldo de OpenAI que ya está cargado. |

## Qué no hacer
- No tocar el flujo viejo ni los narradores que no están en modo V3.
- No cambiar textos: salen del banco (`banco.json`). Si algo suena mal, se anota y decide Naza.
- No correr narraciones ni nada de la PC de música.
