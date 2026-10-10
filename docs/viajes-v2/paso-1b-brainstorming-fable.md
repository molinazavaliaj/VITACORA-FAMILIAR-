# Viaje V2 · Paso 1b: brainstorming de Fable (30/09/2026)

Pedido de Naza: que Fable piense cómo orquestar la entrevista del viajero **desde la idea**, sin condicionarlo con lo que hoy hace Vitácora de Viaje. Contexto que se le dio: el producto en una línea, las reglas de voz de V3, banco fijo sin modelo en vivo (decisión de Naza), y dos ideas de Naza para evaluar libremente: preguntas de antes de salir y de la vuelta, y dos preguntas por día (mediodía y cena).

Decisiones de Naza al pedirlo: **banco fijo** (sin modelo que piense durante la entrevista) · **sí** a antes de salir y a la vuelta · todo en rama nueva.

Lo que sigue es la respuesta de Fable, tal cual. Todavía no está aprobada.

---

## A. Orquestación: tres modelos

| Modelo | Cómo funciona | Libro que produce | Riesgo |
|---|---|---|---|
| **1. Por momentos** | El código sabe el calendario (etapas cargadas al comprar). Dispara preguntas atadas a hitos: antes de salir, día de llegada a {{etapa}}, día del medio, último día en {{etapa}}, última noche, vuelta. Entre hitos, nada o una pregunta "comodín". | Libro con capítulos por ciudad/etapa, cada uno abre con una llegada y cierra con una despedida. Muy legible. | Depende de que el itinerario cargado sea cierto; si cambian planes, las preguntas caen en el día equivocado ("¿cómo fue llegar a Roma?" y todavía están en Florencia). |
| **2. Por ritmo fijo con banco rotativo** | Una pregunta por día, siempre a la misma hora, sacada de familias que rotan (una persona, un lugar, un cuerpo, una noche, un error...). No mira etapas, solo el día N. | Diario: una escena por día, en orden. Honesto, íntimo, parejo. | En viajes largos suena a lista; y sin hitos el libro no tiene curva, no hay "llegada" ni "irse". |
| **3. Híbrido: espina de hitos + relleno rotativo** | Los hitos del modelo 1 tienen prioridad y ocupan su día. Los días sin hito reciben una pregunta de una familia rotativa, y el código prefiere la familia que hace más días no salió. Los hitos usan {{etapa}}; el relleno no depende del itinerario, así que si cambian planes, el relleno sigue sano. | Capítulos por etapa con curva (llegar / vivir / irse), y adentro escenas sueltas que no son itinerario. | Más reglas que mantener; hay que testear que dos hitos no se pisen (último día de una etapa = llegada a la otra). |

**Elegiría el 3.** Un viaje ya tiene estructura dramática (irse, llegar, volver); ignorarla (modelo 2) desperdicia lo mejor, pero atarse solo a ella (modelo 1) rompe con el primer cambio de plan. El híbrido degrada bien: si el itinerario falla, queda un diario decente.

## B. Ritmo

| Opción | A favor | En contra |
|---|---|---|
| Una por día (tarde-noche) | Sostenible, la persona ya vivió el día | Si no contesta una noche, se pierde el día entero |
| Dos por día (mediodía + cena) | Más material, el mediodía agarra la mañana fresca | Cansa; en un viaje de 30 días son 60 preguntas: se vuelve tarea, y la persona empieza a contestar corto o a saltear |
| Una por día + "ventana" | Una pregunta ~19 h local; si no contestó, a la mañana siguiente NO se manda la nueva: se manda un recordatorio corto de la de ayer, y la nueva recién a la noche | Menos volumen total |

**Recomendación:** una por día, a la tardecita (hora local de {{etapa}}), con ventana: la pregunta queda abierta hasta la siguiente. Nunca dos preguntas abiertas a la vez. Excepción: los días de hito (llegada, última noche) pueden tener una segunda pregunta corta al mediodía si Naza quiere probarlo, pero como opción medible, no default. En viajes de más de 3 semanas, un "día libre" cada 6 (sin pregunta, con un mensaje de una línea: "hoy no te pregunto nada, disfrutá"): el silencio se agradece y vuelve a dar ganas.

Cansancio: las preguntas de la noche piden una escena, nunca un balance. Un audio de 40 segundos alcanza. Si la persona lleva 3 días sin contestar, se frena y se manda un solo mensaje humano preguntando si sigue todo bien; se reanuda cuando contesta cualquier cosa.

## C. Antes de salir y la vuelta

**Antes (4 preguntas, días -7, -5, -3, -1):**
- -7: el momento en que decidiste este viaje (dónde estabas, con quién, qué pasó).
- -5: qué te tiene inquieto o con miedo de este viaje.
- -3: una cosa que estás preparando o resolviendo ahora mismo (la valija, un permiso, alguien que queda).
- -1 (noche anterior): qué estás haciendo esta noche y qué te pasa por el cuerpo.

**Vuelta (4 preguntas, días +1, +3, +7, +14):**
- +1: el momento de entrar a tu casa (el olor, lo primero que hiciste).
- +3: qué extrañás ya, algo concreto, chico.
- +7: contar el viaje a alguien: qué le contaste primero, sin querer.
- +14: qué cambió (o no) en un día común desde que volviste.

La de +14 es el epílogo; las demás dan el capítulo "Volver". Antes de salir vale doble: es lo único que una persona nunca escribe y es lo que da sentido al viaje en el libro.

## D. Momentos del viaje

| Momento | Dispara | Qué busca |
|---|---|---|
| Salida | día 0 | La escena de irse: la puerta, el aeropuerto, la terminal, quién quedó |
| Llegada a {{etapa}} | primer día de cada etapa | Lo primero que vio/olió/escuchó al bajar; no el lugar, la sensación |
| Primera noche en {{etapa}} | mismo día, o al siguiente si es muy tarde | Dónde durmió, cómo fue esa cama |
| Día del medio | mitad de etapa larga (≥4 días) | Una persona que conoció o un rato sin plan |
| Última noche en {{etapa}} | víspera de irse | Qué se lleva, qué deja sin hacer |
| Trayecto | día entre dos etapas | El viaje adentro del viaje: el tren, la ruta, la espera |
| Mitad del viaje total | día N/2 (solo viajes ≥10 días) | Cómo está el ánimo, qué cambió respecto de la salida |
| Última noche del viaje | día final -1 | La escena de esa noche, sin balance |
| Vuelta | ver C | — |

Familias rotativas para días sin hito: **una persona**, **una comida**, **un error o susto**, **un rato solo**, **el cuerpo** (cansancio, calor, dolor), **una risa**, **algo que no salió como en el plan**, **mostrame** (foto + audio: "mandame una foto de algo de hoy y contame qué pasaba justo ahí").

## E. Que no se repita en viajes largos

- Cada pregunta del banco tiene **familia** y **variante**; el código no repite variante nunca y no repite familia antes de que pasen todas las demás.
- Los hitos de etapa tienen **3 o 4 redacciones** por hito (llegada A/B/C); en la etapa 4 la llegada suena distinta que en la 1.
- Banco dimensionado: para 60 días se necesitan ~30 preguntas de relleno + ~12 hitos × 3 variantes. Con menos, mejor recortar viajes largos a una pregunta cada dos días que repetir.
- **{{etapa}} y {{día}}** dan variedad gratis; también una marca **{{ayer_tema}}** que retoma la familia del día anterior está prohibida: mejor que cada día sea independiente, así no hace falta que un modelo lea la respuesta.
- Una regla de tono: las preguntas de relleno alternan **afuera / adentro** (algo que vio / algo que sintió) para que no suenen a la misma pregunta con otro sustantivo.

## F. El libro

Prólogo "Antes de salir" (4 escenas), un capítulo por etapa (abre con la llegada, cierra con la última noche, adentro las escenas de los días), interludios cortos con los trayectos, capítulo "Volver", epílogo de dos semanas después. Las fotos van pegadas a la escena que las trajo, no en una galería.

## G. Ideas sueltas

1. Si el viaje es en pareja o con amigos, el que regala puede mandar una "pregunta de regalo" (una sola, redactada por él) que llega en la mitad del viaje con su nombre.
2. Un "capítulo del que se quedó": el que regala contesta 3 preguntas desde casa mientras el otro viaja; va al final como voz aparte.
3. Portada con el mapa de las etapas cargadas, sin necesidad de IA.
4. "Mostrame" con foto al día del hito de llegada: la foto más el audio de ese momento son las mejores páginas del libro.
5. Al comprar, además de etapas, una sola pregunta: "¿este viaje es de descanso, de aventura o de despedida/reencuentro?"; con eso el código puede elegir un sub-banco de tono sin que ningún modelo decida nada.

---

## Control de reglas (Claude)

| Qué | Choca con | Recomendación |
|---|---|---|
| G5: sub-banco según el tipo de viaje | "Ninguna pregunta depende de la ficha" (V3) | No: que la ficha no elija preguntas. |
| +14 "qué cambió (o no)" | "Nunca dos cosas opuestas en la misma pregunta" | Se corrige al redactar. |
| Antes de salir desde el día -7 | Alguien que compra 2 días antes | Si no hay tiempo, se mandan solo las que entren (la -1 siempre). |
| La vuelta hasta el día +14 | — | Pregunta de producto: el libro se escribe recién dos semanas después de volver. |
