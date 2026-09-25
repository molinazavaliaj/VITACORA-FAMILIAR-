# Piloto del esqueleto v2 — hallazgos (Naza, narrador `naza-reusa`, 24-25/09)

Piloto de cero reusando respuestas del piloto viejo (`--reusar`). Numeración propia (E1…).

| # | Qué pasó | Estado |
|---|---|---|
| E1 | La presentación, sin saber el género, salió en femenino ("conocerla", "la llaman"). | Arreglado: control de género (`1f14d78`). |
| E2 | Le decía "Triki" y la ficha no tomó que se escribe Tricky; Naza quiere que le diga Naza. | Corregido a mano en la ficha. |
| E3 | Sonnet tachaba temas nombrados al pasar (a los quince ×2, estudios, oficio, hermano Ariel, primer amor). | Arreglado: primero frenos (`67efd2a`, `91c7660`), después "no se tacha ningún tema solo" (`15e983b`). |
| E4 | Sin "pensar", la ficha perdía datos clave (Juan Manuel preso) y correcciones; propuso "¿se ven en Barcelona?". | Arreglado: la ficha vuelve a pensar (`237d09e`) + ficha corregida a mano. |
| E5 | Mezcló hermanos: "la época que vivieron solos" con Juan Manuel (era con Ariel). Anotó como pendiente que el error era de Naza. | Pendiente de regla ("no atribuyas a una persona lo que se contó de otra"). |
| E6 | Inventó "años de jardinero" (comparación Opus/Sonnet; lo hizo Opus). | Pendiente de regla ("no agregues cuánto duró algo si la ficha no lo dice"). |
| E7 | La evaluación repreguntó "¿con cuál hermano tenés más onda?" cuando ya lo había dicho dos veces. | Pendiente. |
| E8 | La libre de infancia eligió al padre por tercera vez; "me quedaste debiendo" suena a reproche. | Pendiente (cómo se eligen las libres + tono). |
| E9 | "No tengo foto, se la pido a mi madre" se clasificó como "hoy no" (Haiku). | Pendiente. |
| E10 | "Primer amor" (juventud) lo llevó a Ima en España; después hizo repetir cómo la conoció. | Pendiente (respetar la época de la fila). |
| E11 | El buscador de reuso le pegó al Mundial una respuesta de fútbol de chico. | Arreglado a mano; pendiente: no reusar historia grande si la respuesta vieja no nombra el evento. |
| E12 | La transcripción escribe "verga" por Berga; "Starán" por Fran; "Romero" por Homero; "la tapa de Ñaquiver" por "la etapa de Berga" (y la ficha lo anotó como pendiente real). | Pendiente: sumar nombres propios (Berga, Avià, Homero, Tricky…) al prompt de transcripción. |
| E13 | "Perfil: sin cambios" en pantalla aunque la ficha sí cambió (etapas). | Pendiente (solo lo que se muestra). |
| E14 | Las preguntas ofrecen opciones de ejemplo ("tipo pesca o algo con las manos") y la evaluación trata los ejemplos como obligatorios (repreguntó por huerta, baile y pesca). | En arreglo: sin opciones de ejemplo; los pormenores no son lista para tachar. |
| E15 | `descartar` falla: falta la función `descartar_respuesta` en la base (migración no aplicada). | Pendiente: aplicar la migración (Naza, SQL Editor). |
| E16 | A veces no se anota el gasto en `consumo_ia` (tardó más de 1500 ms). El total local sí. | Pendiente, menor. |
| E17 | La repregunta de `pruebas` pidió "quién te bancó" y la fila siguiente (`fuerza`) pedía lo mismo: la repregunta no mira qué pide la fila que viene. | Pendiente. |
| E18 | El biógrafo dice "ayer se notó…" aunque la respuesta fue el mismo día. Naza: los usuarios pueden pedir más preguntas en el día; el biógrafo no puede suponer que pasó un día. Tiene que saber cuándo llegó la última respuesta (hoy / ayer / hace días) o hablar sin marcar el tiempo. | Pendiente (decisión de Naza, 25/09). |
| E19 | La fila `lo-que-falta` ("qué no te pregunté que tiene que estar") se usó para rematar lo que faltó de `alegrias` (el dicho): el biógrafo se desvió del tema de la fila. La evaluación de `alegrias` había dicho "alcanza" aunque faltaba el dicho. | Pendiente. |

## Correcciones de Naza para el libro (dichas en el chat, no en un audio)
- Orden 32: la camioneta que perdió antes de venir a España **es la EcoSport** (no son dos autos distintos). Autos: el 207 a los 17, un Focus, la EcoSport.
- La "tapa de Ñaquiver" (orden 27) era "la etapa de Berga"; "Starán" era Fran; el perro era Homero, con H.
