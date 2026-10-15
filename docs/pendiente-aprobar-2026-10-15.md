# Textos para aprobar, 15/10/2026

Todos son PROPUESTOS. Están en el código de dos PR, pero ninguno se mergea sin el OK de Naza.
Si cambiás una palabra, se cambia en el archivo que dice cada tabla y nada más.

## 1. Dudas del libro cuando el libro es de quien lo compró («Para mí»)

PR de `web/` y `fabrica/` (rama `dudas-para-mi`).

Hoy, si alguien compra el libro para sí, la pantalla de dudas le habla como si fuera de otra persona
(«Dudas sobre lo que contó Naza»). Con el cambio le habla a él. Un invitado a esa historia sigue leyendo
en tercera persona, porque no fue él quien contó. Son iguales de vos y de tú.

Archivo `web/src/lib/dudas-textos.ts`.

| Dónde | Hoy (de otra persona, aprobado 12/10) | Propuesto para «Para mí» |
|---|---|---|
| Título | Dudas sobre lo que contó Naza | Dudas sobre lo que contaste |
| Debajo del título | Al escuchar los audios quedaron algunas cosas sin resolver: un nombre que se oye de dos formas, una fecha que no cierra. Lo que sepas entra al libro. Lo que dejes vacío queda tal como lo contó. | Al escuchar tus audios quedaron algunas cosas sin resolver, como un nombre que se oye de dos formas o una fecha que no cierra. Lo que sepas entra al libro. Lo que dejes vacío queda tal como lo contaste. |
| Arriba de las citas | Lo que dijo | Lo que dijiste |
| Todavía no hay dudas | Todavía no hay dudas sobre lo que contó Naza. | Todavía no hay dudas sobre lo que contaste. |
| No quedó ninguna | No quedó ninguna duda. El biógrafo entendió todo lo que contó. | No quedó ninguna duda. El biógrafo entendió todo lo que contaste. |

Las preguntas de cada duda las escribe el modelo. Para «Para mí» hay un prompt nuevo, «Dudas para quien narra»,
en `docs/v5/escritor-v55/fabrica.md`. Es el mismo de «Dudas para la familia» con una regla más.

> Hablale directo, en segunda persona y con el trato de la ficha («dijiste», «contaste», «tu mamá»). Nunca lo
> nombres en tercera persona ni hables de «la familia».

Ejemplo de lo que cambia (inventado). Hoy sale «Nélida dijo "la Negra era mi amiga del barrio". ¿Cómo se
llamaba?». Con el prompt nuevo saldría algo como «Dijiste "la Negra era mi amiga del barrio". ¿Cómo se llamaba?».

## 2. La foto que no se pudo guardar

PR de `entrevistador/` (rama `bot-arreglos`).

Hoy, si una foto que manda el narrador no se puede bajar de WhatsApp o subir, se pierde y no le llega nada.
Con el cambio le llega este mensaje (y a los socios un aviso). Está calcado de M23, el del audio cortado.

Archivo `entrevistador/src/v3/textos-fijos.json`, clave `fotoFallo`.

| Idioma | Propuesto |
|---|---|
| Argentina (vos) | La foto no me llegó bien, {{nombre}}. ¿Me la mandás de nuevo cuando puedas? Sin apuro. |
| España (tú) | La foto no me ha llegado bien, {{nombre}}. ¿Me la mandas de nuevo cuando puedas? Sin prisa. |
| Catalán | La foto no m'ha arribat bé, {{nombre}}. Me la tornes a enviar quan puguis? Sense pressa. |

## 3. La pregunta repetida después de una plantilla

Mismo PR del entrevistador. No tiene textos nuevos: ahora el bot deja de mandar algo que ya mandó.
