# Vitácora de Viaje V2 · Paso 1: qué es hoy y qué método le aplica (30/09/2026)

Rama `viajes-v2`, worktree `VITACORA VIAJES`, salida de `origin/main` (0f0a2b8). Método: `docs/v3/entrevista/como-lo-hicimos.md` de la rama `v3`.

## Qué es hoy (lo que está en main)

| | Hoy |
|---|---|
| **Quién la usa** | El viajero mismo: la compra para sí (no es un regalo), en vos. Nació el 18/09 para un viajero real (58 noches, en curso desde el 21/09). Precio: 45 € / $78.750. |
| **La compra** (`/comprar/viaje`) | Nombre, cómo le dicen, WhatsApp, mail · salida y vuelta · etapas (ciudades, fechas opcionales) · con quién viaja (solo/pareja/amigos/familia) · para qué es el libro (recuerdo/compartir/público) · chips de "qué querés que te pregunte" · hora de la noche (21:30) y zona horaria. No pregunta género. |
| **Las preguntas** | **No hay banco.** Hay 8 "ángulos" de una línea (lo mejor del día, una persona, una comida, lo que salió distinto del plan, un lugar inesperado, qué pensaste de vos mismo, la llegada a una etapa, la despedida de una etapa). Rotan: llegada el primer día de cada etapa, despedida el último, y los otros seis en el medio. **Cada noche un modelo (Opus) escribe la pregunta en el momento** con el itinerario, el ángulo y lo que contó los días anteriores. Siempre termina pidiendo la foto del día. |
| **El flujo** | Bienvenida (plantilla de Meta) → SÍ → "¡Buen viaje! Esta noche te llega la primera pregunta" → **una pregunta por noche** a su hora → audios + fotos por WhatsApp (la foto va al álbum de la etapa del día) → el día de la vuelta, la última → "¿faltó algo?" (hasta dos vueltas) → despedida. Además hereda del Familiar la **repregunta** (otro modelo que evalúa la respuesta y repregunta) y el recordatorio. |
| **El libro** | Hoy sale el libro común del Familiar, con capítulo = etapa. Pensado y sin hacer: mapa del viaje, "los números" al final, una foto por día, frases al margen. |

**Lo que ya se ve flojo**, con los ojos del método V3:
- Nadie aprobó ninguna pregunta: las escribe un modelo cada noche. Nada garantiza la voz ni que no repita.
- Con 6 ángulos en un viaje de 58 noches, cada uno vuelve ~9 veces.
- Frases que V3 prohibió: "sin respuestas incorrectas" (aceptación); "de vos mismo" da por hecho que es hombre.
- "Lo mejor del día" invita al **resumen del día** ("fuimos a X, después a Y"): en un viaje, ese es el "formulario".

## Las reglas de V3, frente a un viaje

| Regla de V3 | En Viaje | Por qué |
|---|---|---|
| Voz: cálida, simple, sin palabras de formulario ni de IA, un ejemplo como mucho, nunca dos cosas opuestas | **Igual** | Es la misma marca y la misma persona del otro lado. |
| Terminar pidiendo **una vez concreta** (hecho único) | **Igual, y más fácil** | Un viaje ya es hechos únicos. El riesgo cambia: no es la costumbre, es el **resumen del itinerario**. Cada pregunta tiene que elegir *un* momento de hoy. |
| No dar nada por hecho (pareja, compañía, género) | **Igual** | Hoy se rompe ("vos mismo"; y la compañía no debería decidir preguntas). |
| Paso siempre vale; "no" corto | **Igual** | Una noche cansada tiene que poder saltearse sin culpa. |
| Textos que redacta Fable y aprueba Naza, uno por uno | **Igual** | Es el centro del método. |
| Mensajes fijos (acuses que rotan, M4 sobrio, M21 paso, M22 texto, M23 audio cortado) | **Igual, con otra voz** | Más cortos: es de noche y después de un día entero. |
| Ninguna pregunta depende de la ficha | **Cambia** | El itinerario sí se usa, pero solo para **nombrar** ("hoy en Lisboa"), nunca para decidir qué pregunta llega. La compañía no decide nada. |
| El orden es el de los bloques de la vida (1 a 15) | **Cambia** | El orden lo pone el calendario. Los "bloques" pasan a ser **momentos del viaje**: antes de salir · llegar a una etapa · las noches del medio · irse de una etapa · la última noche · de vuelta en casa. |
| Cierre de cada bloque ("¿quedó algo?") + frase de entrada | **Cambia** | Cierre al irse de cada etapa (no cada noche). La frase de entrada va al llegar a una etapa nueva. |
| Una pregunta tras otra, apenas responde | **Cambia** | Una por noche, a su hora. |
| Durante la entrevista no decide ningún modelo | **Aplica, y es la gran decisión** (abajo) | Hoy lo rompe: un modelo escribe cada noche y otro repregunta. |
| M9: aviso a la familia si no contesta | **No aplica** | Lo compra él mismo. Si deja de contestar, recordatorio a él y listo. |
| Preguntas de la familia (M15), dashboard ficha contra respuesta (DD1/DD2), trato usted, etapas de la vida, pérdidas, el legado | **No aplica** | Otro producto. (Si en "¿qué le falta?" aparece "preguntas de los que quedaron en casa", se decide ahí.) |
| Recuento al final, no antes; compilado; descartadas; construir en archivos nuevos; lectura corrida | **Igual** | |

## Lo que hay que decidir

**1. ¿Quién escribe la pregunta de cada noche?**

| Opción | Cómo | Qué se gana / pierde |
|---|---|---|
| **A · Banco fijo (recomendado)** | Como V3: un banco de preguntas aprobadas una por una, con marcas (`{{etapa}}`, `{{nombre}}`). El código elige cuál va cada noche según el momento del viaje y sin repetir. Ningún modelo en vivo (y sin repregunta). | Control total de la voz, cero costo por noche, se prueba con tests. Se pierde "lo de ayer" en la pregunta. |
| B · Banco + modelo que solo agrega una frase | Banco fijo, y un modelo chico con candado agrega a lo sumo una línea sobre ayer. | Más "te vengo siguiendo", pero vuelve a haber texto no aprobado. |
| C · Como hoy | El modelo escribe todo, con los ángulos nuevos como guía. | Lo más vivo, lo menos controlado. Es lo que V3 dejó atrás. |

**2. ¿Sumamos una pregunta antes de salir y una o dos de vuelta en casa?** Recomiendo **sí**: "por qué este viaje" y "cómo volviste" son el principio y el final del libro, y hoy no existen. Se definen en el paso 2.

**3. El viajero que está de viaje ahora no se toca.** Todo esto vive en `viajes-v2`; main y su viaje siguen igual hasta que Naza decida el pase.
