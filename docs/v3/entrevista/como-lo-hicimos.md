# Cómo sacamos a flote el banco de preguntas (29-30/09/2026)

El método que usamos con Naza para rehacer la entrevista de Vitácora Familiar V3. Está escrito para repetirlo en otros productos (Vitácora Kids, Vitácora Viajes) desde un chat nuevo. El detalle de cada decisión está en [`../metodo-entrevista.md`](../metodo-entrevista.md); el resultado, en [`banco.md`](banco.md) y [`flujo-hoy.md`](flujo-hoy.md).

## La idea de fondo
Un libro de vida "se lee como un formulario" cuando las preguntas piden describir o una costumbre ("describime la casa", "un domingo que recuerdes"): la respuesta es costumbre y el escritor no puede volverla escena sin inventar. Las preguntas de **hecho único** ("el día que…", "la primera vez", "la vez que más…") traen escenas. Esto salió de pilotos reales, no de teoría: antes de tocar un banco, mirar qué respuestas dieron escenas y cuáles no.

## Los pasos, en orden

| # | Paso | Quién |
|---|---|---|
| 1 | **El método en una página**: qué tiene que lograr cada pregunta, reglas de voz y de estructura, qué va a la ficha y qué a la entrevista. Naza decide lo abierto con opciones. | Claude propone, Naza decide |
| 2 | **Bloque por bloque, pregunta por pregunta.** Para cada pregunta: qué busca, qué tipo es (hecho único / costumbre / dato), qué riesgo tiene, y qué se hace (queda / se reescribe / se junta / sale). | Claude arma la tabla |
| 3 | **Los textos los redacta Fable** (un agente con `model: fable`, rol "biógrafo argentino sentado a la mesa", con los textos ya aprobados como referencia de voz), dos versiones por pregunta y cuál elegiría. **Claude controla las reglas** antes de mostrarlo. **Naza aprueba cada texto**, y corrige con sus palabras; la corrección vuelve a Fable. | Fable redacta, Claude controla, Naza aprueba |
| 4 | **"¿Qué le falta a esta etapa?"** en cada bloque: Fable propone hasta 4-5 preguntas nuevas y Naza elige. Naza encuentra huecos seguido (el momento duro de cada etapa, el adulto cómplice, aprender a manejar, los recreos): preguntárselo siempre. | Fable + Naza |
| 5 | **Mensajes fijos y el proceso de punta a punta** (bienvenida, agradecimientos, cierres, recordatorios, dashboard), con la misma voz y la misma aprobación. | Fable + Naza |
| 6 | **Recuento al final, no antes.** Mientras se repasa el banco no se habla de tamaños ni recortes ("estamos seleccionando el alma"). Al final: cuántas le llegan a cada tipo de persona, un núcleo, y la opinión de Fable como asesor de producto. | Claude + Fable, decide Naza |
| 7 | **Compilado limpio** (la última versión aprobada de cada pregunta) y **registro de lo descartado** con motivo y dónde queda cubierto. Nada se borra. | Agente |
| 8 | **Fable revisa el banco entero** buscando repeticiones y muletillas. Lo que contradice una decisión de Naza se muestra aparte y se recomienda respetar lo suyo. | Fable |
| 9 | **Construir en archivos y carpetas NUEVAS** (no se pisa ni se reescribe nada existente), con tests. Un segundo agente revisa y reproduce bugs; lo confirmado se arregla con test. Push a la rama del producto. | Agente de código + revisor |
| 10 | **La entrevista leída de corrido**, como la vive la persona (una vida inventada, en orden, con todos los mensajes), publicada para leer en el celular. Fable la lee "como la persona" y marca lo que pesa. Naza decide. | Agente + Fable + Naza |

## Reglas de voz que salieron (valen como punto de partida)
- Habla como una persona real, cálida, simple; nada de palabras de formulario ("describí", "elegí", "presentame") ni frases de manual o de IA ("no hay respuestas equivocadas").
- Puede abrir liviano ("¿cómo era…?"), pero termina pidiendo una vez concreta.
- Sin listas largas de opciones: como mucho un ejemplo corto.
- Nunca dos cosas opuestas en la misma pregunta.
- Nunca dar por muerta, perdida ni terminada a una persona o cosa ("qué fue de", "se llamaba"). El pasado se ata a la época.
- No mezclar tiempos ("es o era"): si es de hoy, presente; si es del pasado, pasado.
- No dar nada por hecho (hermanos, pareja, hijos, casa propia); los ejemplos tampoco.
- No pedir nombres ni listas en las preguntas de historia (salen solos; se confirman después).
- No pedir "con quién estabas" por reflejo.
- Ejemplos siempre inventados; nunca la vida de un narrador real.

## Reglas de estructura que salieron
- **Ninguna pregunta depende de la ficha.** Todas le llegan a todos y "no me pasó" vale. Las que siguen un tema se saltean si la que lo abre fue un "no" corto (código, sin modelo). La ficha queda para el escritor; si contradice una respuesta, va como duda al dashboard.
- **"Paso" siempre vale**; en una pregunta que abre tema, se saltean las que dependen y el cierre del bloque llega igual.
- **Cierres de bloque** ("¿quedó algo que no tuvo su pregunta?") y **frases de entrada** al empezar cada bloque.
- **Sin pausa, sin preguntas de datos, sin tamaños** mientras se diseña.
- Durante la entrevista no decide ningún modelo (solo transcribe). Si hiciera falta, un modelo chico con candado que solo responda sí / no / no está claro (plan B).

## Cómo trabajar con Naza
- Tablas cortas, simple, y terminar cada turno con "lo que tenés que hacer vos".
- Mostrar bloque por bloque; no avanzar sin su OK a los textos.
- Si una propuesta va contra algo que él ya decidió, mostrarla aparte y recomendar respetar lo suyo.
- Nada pago sin avisarle el costo; lo dispara él.
- Un chat por producto, en su propio worktree; nunca checkout en la carpeta principal.
