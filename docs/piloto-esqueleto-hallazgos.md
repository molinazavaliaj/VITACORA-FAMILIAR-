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

## Correcciones de Naza para el libro — APLICADAS el 25/09 en las transcripciones (los audios no se tocaron)
- Tricky (no Triki), Homero y Corcho, Amelia Meri del Vecchio, "venirnos a menos" (es un decir: bajar de nivel), Dardo Rocha, "viví solo", Saint John's, Avià, Ima (no Sima), Fran (no Starán), Berga (no "verga"), "la etapa de Berga" (no "la tapa de Ñaquiver"), "dejé la facultad", la EcoSport es la camioneta que perdió, club amateur de la cuarta catalana, Khea, Seven Kayne, Don Roque. Babyface = Baby = Iñaki. El Fran del Mundial es otro Fran (de Barcelona).

### Lo que dijo en el chat
- Orden 32: la camioneta que perdió antes de venir a España **es la EcoSport** (no son dos autos distintos). Autos: el 207 a los 17, un Focus, la EcoSport.
- La "tapa de Ñaquiver" (orden 27) era "la etapa de Berga"; "Starán" era Fran; el perro era Homero, con H.
| E20 | La despedida pegó el campo "cómo le dicen" entero ("Naza (así quiere que le digan; su nombre artístico es Tricky…)…"). Causa: la corrección a mano del controlador puso la aclaración dentro del valor. Arreglado en la ficha (valor "Naza", la aclaración en `por`); pendiente: que la despedida/presentación use solo el nombre aunque el valor traiga aclaraciones. | Arreglado a mano / pendiente en código. |

## Cambios al guion aprobados por Naza (25/09, para después del piloto)
- **G1. Negocios, épocas flacas y un riesgo que salió mal, desde el adulto joven** (no solo desde los 36): "una persona de 27 ya intentó de todo". Hoy vive en `el-trabajo-y-la-plata` (adultez media).
- **G2 (propuesto, falta el sí de Naza): pérdidas para cualquier edad** cuando la ficha tenga a alguien que murió (hoy solo 56+).
- **G3. Sin opciones de ejemplo en las preguntas** (hecho: `12a04dc`).
- **G4. No decir "ayer" si no se sabe cuándo fue la última respuesta** (E18).

## Decisiones de Naza (25/09)
- **D1. Lo que la familia corrige o excluye en el dashboard tiene que llegar al libro.** Hoy la fábrica ignora `edicion.correcciones` y `edicion.excluidas` (decisión del 13/09). Tarea prioritaria después del libro de Naza: la fábrica los aplica; formato de `correcciones` a acordar con Joaquín.
- **D2. Despedida nueva (versión A)**, más cercana.

## El libro de prueba (25/09, `fabrica/prueba-libro-naza-reusa/`, USD 2,84)
8 capítulos por etapa + apertura, cierre y «Sus frases». 0 % copiado, 8 oraciones sin respaldo, sin avisos del control.
| # | Qué pasó | Estado |
|---|---|---|
| L1 | "A los diecisiete tuve mi primer auto, un Focus": era el 207. Causa: la corrección a mano de la EcoSport dejó la frase ambigua. | Transcripción arreglada; en el libro de prueba hay que corregirlo a mano o re-armar. |
| L2 | "Una familia atípica, con la que hemos tenido momentos buenos": dijo "momentos buenos, momentos buenos" (seguramente "buenos y malos"). | A confirmar con Naza. |
| L3 | El lector final falló ("no devolvió una lista"): el libro queda "espera revisión". | Pendiente (fábrica). |
| L4 | Contenido sensible que entra tal cual (porro/marihuana, club cannábico, cárcel de su padre y de Juan Manuel, "negocios que estaban un poco mal", "invitábamos minas"). El libro es para la familia: ¿se reserva algo? | Decisión de Naza. |
| L5 | Frases de relleno del escritor: "Y después de todo eso viene la etapa que me vine a vivir a España…" al cierre del cap. 6. | Menor. |
