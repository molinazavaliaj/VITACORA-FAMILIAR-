# Lectura de Fable: simulación 6 (Elsa, 80, la que no se acuerda, inventada)

**Qué es:** Fable (como agente, voz de biógrafo) leyó entera la charla de [`6-no-se-acuerda.md`](6-no-se-acuerda.md) el 30/09/2026, como la viviría Elsa y como un biógrafo con oficio, y marcó lo que falla. No tocó ningún otro archivo. Lo que ya estaba en [`hallazgos.md`](hallazgos.md) (S1 a S6) no se vuelve a explicar: solo se dice "otra vez", con los IDs y cuántas veces. Las fallas nuevas van numeradas 6.1, 6.2… para que Naza les ponga S# si las acepta. **Nada de esto está decidido: decide Naza.**

**Lo que se quería probar:** si un "no me acuerdo" en una pregunta que abre tema se toma como "no me pasó" y se saltea el tema entero, y cómo se siente la entrevista para alguien a quien le cuesta recordar. Lo primero **no llegó a probarse** (punto 6.2): el modelo contestó las seis que abren tema con contenido. Lo segundo sí, y es lo más importante de esta lectura (punto 6.1).

**Los números de Elsa:** 91 preguntas contestadas. En **30** dice que no se acuerda, no sabe o "ni idea"; en unas **22** de esas no queda nada usable para el libro. El bloque 3 (escuela) tiene **5 de 6 preguntas en blanco** más el cierre vacío: un capítulo sin nada adentro. Once veces nombra su memoria como algo que le falla ("la cabeza no me ayuda", "la memoria me traiciona, querido", "perdoname, mi amor, la cabeza no me ayuda"). **El biógrafo no le contesta eso ni una vez.**

---

### 6.1 Treinta olvidos, y el biógrafo los "guarda" como si fueran historias (grave)

Es la falla de esta vida. El código no distingue "no me acuerdo" de una respuesta con contenido: mientras no sea un "no" corto, lo trata como que contó algo y le pega un acuse de la rotación M3 (o uno sobrio M4 en las sensibles). Elsa dice "no me acuerdo" y le llega "Ya lo guardé", "Gracias por contármelo", "Queda guardado con cuidado". Leído de corrido, parece que nadie escucha. Y en ningún momento le dice lo que cualquier biógrafo diría a la tercera vez: **no pasa nada, con lo que sí tenés alcanza.**

Los acuses que peor suenan (mensaje exacto del biógrafo, después de un olvido sin nada adentro):

| Después de | Elsa dijo (arranque) | Acuse exacto | Por qué raspa |
|---|---|---|---|
| **ES6** | "Ay, no me acuerdo de ninguna travesura grande…" | "Gracias por contármelo. Seguimos." | No contó nada. |
| **HG4** | "No me acuerdo bien… Pero un día en especial, no me acuerdo." | "Gracias por contármelo. Seguimos." | Ídem. |
| **CA17** (sensible) | "No sé, la verdad… No me acuerdo de algo traumático." | "Gracias por contarme esto, Elsa. Queda guardado con cuidado." | Cuidado de un vacío. |
| **AD15** (sensible) | "No, no me acuerdo de nada muy duro…" | "Te escuché. Gracias por confiármelo." | No confió nada. |
| **JU17** (sensible) | "No me acuerdo de nada muy duro… La verdad es que no recuerdo." | "Lo guardo tal como lo contaste. Gracias." | "Tal como lo contaste" de un "no recuerdo". |
| **ES1, AD5, AY1, GI9, HO2** | "Ay, no me acuerdo…" / "No me acuerdo de…" | "Gracias, Elsa. Ya lo guardé." | Cinco veces "guardé" un blanco. |
| **ES7, DE1** | "Ay, no me acuerdo muy bien…" / "No me acuerdo de algo específico…" | "Guardado, Elsa. Te mando la próxima." | Ídem. |
| **HI9** | "No me acuerdo bien… La memoria me falla, querido." | "Gracias, Elsa." (M26) | Le dice que la memoria le falla y le contestan "gracias". |
| **FAM1** | "Perdoname, mi amor, la cabeza no me ayuda." (a su hija) | "Gracias, Elsa. Ya lo guardé." | Se disculpa con la hija y el biógrafo pasa a la foto. |

**Cuántas veces:** 30 respuestas con olvido; 22 en blanco. Acuses de "guardé/contaste" sobre un blanco: 19 (M3) + 3 sobrios (M4). Las otras 8 son olvidos parciales donde algo contó (OR1, AD6, AM1, AM3…): ahí el acuse común vale.

**Lo que se pierde:** no se pierde flujo (ninguna de estas preguntas abre tema), se pierde la relación. Una persona de 80 con la memoria floja necesita dos cosas del entrevistador: que le diga que está bien no acordarse, y que le achique la pregunta cuando el día exacto no vuelve. La entrevista no hace ninguna de las dos. Fijate que **ES1 ya trae la segunda** ("Si ese día no lo tenés, contame lo primero que te acuerdes de la primaria"): es el molde.

**Arreglo concreto (una regla de código + tres textos):**

1. **Regla "olvido" (una línea):** una respuesta de menos de 40 palabras que, sin muletillas, arranca con "no me acuerdo", "no recuerdo", "no sé", "ni idea" o "no tengo idea" (o que las trae en las primeras 8 palabras, o "se me borró" / "la memoria" / "la cabeza") es un **olvido**: no es "no me pasó", no es "contó algo". Después de un olvido va **M27** en lugar de M3, y en las sensibles **M27** en lugar de M4 (como hoy va M25 con el "no" corto).

2. **M27, acuses después de un olvido (rotan, primera línea del mensaje que sigue):**
   - M27.1 "No pasa nada, {{nombre}}. Lo que no vuelve, no vuelve. Vamos con otra."
   - M27.2 "Está bien, hay cosas que se van. Seguimos."
   - M27.3 "Tranquil{{o/a}}, que con lo que sí te acordás alcanza. Vamos a la siguiente."

3. **M28, una sola vez en toda la entrevista, después del tercer olvido seguido** (a Elsa le hubiera llegado en ES5, en el bloque 3), pegado arriba de la pregunta que sigue:
   > Una cosa antes de seguir, {{nombre}}: no te hagas problema por lo que no vuelve. Para el libro alcanza con lo que sí tenés. Y si de alguna te acordás a medias, contame ese pedacito nomás: un olor, una cara, cómo era en general. Eso también es tu historia.

4. **Texto de salida en las preguntas que piden "un día concreto"** (CA16, AD5, JU12, TR5, HG4, GI2, GI9, HO2), al final, copiando el molde de ES1: "…Y si el día justo no te vuelve, contame cómo era en general, que con eso me arreglo." Ocho preguntas, una frase.

Para pensar (no lo propongo todavía): quien regala podría marcar en la ficha "le cuesta recordar". Con eso, M28 iría desde el primer olvido y no desde el tercero. Va contra "la ficha no decide qué preguntas llegan", pero acá no decide preguntas: decide un tono.

---

### 6.2 El salto de tema por un "no me acuerdo" no se probó, y el riesgo sigue por regla (media)

La tabla que pediste: cada olvido en una pregunta que abre tema o en un cierre, qué entendió el código y qué se perdió.

| ID | Lo que dijo Elsa (arranque) | Palabras | Qué entendió el código | Qué se perdió |
|---|---|---|---|---|
| **CA6** (abre) | "¿Hermanos? Creo que éramos muchos, no me acuerdo bien cuántos. Sí, tenía hermanos…" | 55 | Sí tuvo → siguió normal. | Nada del flujo. Del libro: nombra 3 de 5 hermanos, sin aventura. |
| **JU8** (abre) | "Bueno, me fui de Villaguay a Paraná, eso ya lo conté. No me acuerdo bien cómo lo decidí…" | 45 | Sí se mudó → siguió normal. | Nada del flujo (JU10/JU11 son extra). |
| **AM0** (abre) | "Me enamoré de Ernesto, mi marido…" | 45 | Sí. Bien. | Nada. |
| **AM9** (abre) | "Ernesto murió en el 2015…" | 60 | Contó el final. Bien. | Nada. |
| **AM16** (abre, "decime no nomás") | "No, no hubo otro amor. Solo Ernesto. Después de que él se fue, no fue lo mismo…" | 40 | **Sí hubo otro amor** → mandó AM13 (la pelea). | S2 otra vez; Elsa se la tomó como de Ernesto y zafó. |
| **HI0** (abre) | "Sí, tengo dos hijas…" | 25 | Sí. Bien. | Nada. |
| **HI8** (abre) | "Sí, tengo nietos. Cuatro nietos, creo. Pero no me acuerdo bien cuándo nació el primero… No sé los nombres bien…" | 45 | Sí hay nietos → HI9. Bien. | Del libro: nietos sin nombre ni fecha (ver 6.4). |
| **CI1** (cierre) | "No, no me viene nada a la mente. Eso quedó muy atrás… Creo que después me voy a acordar de algo en la madrugada, **pero** ahora no. Mejor seguimos." | 36 | Contó algo → M24.1 "Gracias, Elsa. Eso también va al libro." | Un "no" que "va al libro". |
| **CI2** (cierre) | "No, no se me viene nada ahora. Capaz que después me llega algo a la mente, **pero** en este momento no." | 20 | Contó algo → M24.2 "Anotado, gracias. Quedó guardado junto con el resto." | Ídem. |
| **CI13** (cierre) | "No, creo que ya está todo contado. Mi vida está ahí, en lo que conté." | **15** | Contó algo (la regla es "menos de 15") → M24.4 "Gracias por eso. Cada detalle que agregás suma." | Ídem; por una palabra. |
| CI3, CI4, CI5, CI6, CI7, CI8, CI10, CI11, CI12, CI14 | "No, nada me viene a la mente ahora. Mejor seguimos." y parecidas | 7 a 12 | "No" corto → M25 "Bien, seguimos." / "Bien, entonces." | Nada. **Bien entendidos, 10 de 13.** |
| CI9 | "No, nada más se me viene a la mente. La casa es lo que más amo, Paraná…" | 22 | Contó algo → M24.3 | Nada: sí agregó algo. |
| LE9 | "No, creo que ya está todo. Toda mi vida está ahí. Gracias por escucharme, por hacerme recordar…" | 25 | Sin consecuencia (después de LE9 no hay acuse). | Ver 6.6. |

**Lo que dice esta tabla:** en las seis que abren tema, **ninguna respuesta arrancó con "no me acuerdo"**: el modelo siempre contestó "sí" primero. Por eso no hubo salto. Pero el riesgo existe por regla, y con una Elsa real es lo más probable del mundo: "No me acuerdo bien cuándo nació el primero" son **8 palabras que empiezan con "no"** → "no" corto → no hay nietos → chau HI9, y en el libro Elsa no tiene nietos. Lo mismo con "No sé, no me acuerdo" en AM0 (chau el amor entero) o en HI0 (chau las hijas, y le llega HI10 "¿algún chico fue importante en tu vida?").

**Arreglo (una línea, complementa los botones de Naza):** en las 6 que abren tema (y en AM16, AM19), un "no" corto que traiga "acuerdo", "recuerdo", "sé", "idea", "memoria" o "cabeza" **no es "no me pasó"**: es "no está claro". Ahí van los botones de WhatsApp que propuso Naza ("¿Tuviste nietos? Sí / No"). Si no hay botones, se trata como "sí" (mejor una pregunta de más que un capítulo de menos).

---

### 6.3 Avisa que se va a acordar después, y nadie le dice que puede mandarlo (media)

| ID | Lo que dijo Elsa | Qué contestó el biógrafo |
|---|---|---|
| **CI1** | "Creo que después me voy a acordar de algo en la madrugada, pero ahora no." | "Gracias, Elsa. Eso también va al libro." |
| **CI2** | "Capaz que después me llega algo a la mente, pero en este momento no." | "Anotado, gracias. Quedó guardado junto con el resto." |

Dos veces avisa lo que le pasa a cualquiera con la memoria floja: los recuerdos llegan tarde, a la madrugada, y no cuando el biógrafo pregunta. La entrevista no tiene esa puerta escrita en ningún lado: ni la bienvenida ni los cierres dicen "si te acordás después, mandámelo". El final (FIN) dice que va a poder repasar en el dashboard, pero eso es otra cosa: Elsa no va a entrar a un dashboard a agregar; le va a salir un audio a las tres de la mañana.

**Arreglo (texto, sin código):** una frase en el **primer cierre (CI1)**, que es donde se estrena la idea: "…Si hay una dando vueltas, contámela ahora. **Y si algo se te viene más tarde, a cualquier hora, mandámelo nomás: yo lo pongo donde va.**" El código ya suma cualquier audio a la pregunta abierta; el escritor lo ubica después. No hace falta programar nada, hace falta decirlo.

---

### 6.4 Los nombres que la narradora no tiene, y la hija que sí los tiene (media-leve, dashboard)

| ID | Lo que dijo Elsa |
|---|---|
| **CA6** | "Creo que uno se llamaba Ramón, y había una Chiquita, y un Hugo." (la ficha dice cinco hermanos) |
| **HI8** | "No sé los nombres bien, la memoria no me ayuda. **Claudia puede decirte**, ella los cuida más que yo." |

Elsa hace lo que hace la gente grande: delega en la hija. Hoy el dashboard muestra nombres pendientes de mamá, papá, pareja e hijos; **los nietos y el bisnieto no están en la lista**, y quien revisa es "la persona". Con Elsa, la que va a poder completar es Claudia. No es una falla de WhatsApp; es del después.

**Arreglo:** nombres pendientes incluye nietos, bisnietos y hermanos; y que quien regaló pueda completar nombres y fechas en el dashboard (solo eso: nombres y fechas, no el relato).

---

### 6.5 El amor de una viuda: "esa historia" y la doble pregunta por "otro amor" (leve)

| ID | Mensaje exacto | Qué le pasó a Elsa |
|---|---|---|
| **AM19** | "Y después de **esa historia**, ¿hubo un tiempo en que seguiste por tu cuenta?…" | Llega justo después de contar la muerte de Ernesto. 47 años de casados como "esa historia". Contestó bien. |
| **AM16** | "Si después de **esa historia** hubo otro amor, contame del que compartís hoy, o del último…" | Segunda vez "esa historia" para una muerte. "No, no hubo otro amor. Solo Ernesto." |
| **AM14** | "¿Tuviste algún amor que te marcó y no fue el de toda la vida?…" | Dos preguntas después de decir que no hubo otro, se lo vuelven a preguntar. "No, no hubo otro. Solo Ernesto para mí." |

No es S1 (Elsa convivió y se casó; el bloque le encajó bien: AM4 y AM8 son de lo mejor de la charla). Es una insistencia chica: a una viuda que dijo "solo Ernesto" se le pregunta dos veces por otro amor. La simulación 2 (viuda) es la que decide esto; acá solo lo marco.

**Arreglo mínimo (texto):** AM14 con salida: "…Si te pasó, contame cómo se cruzaron y el momento que más te acordás de esa persona. **Y si ya me dijiste que no hubo otro, con un no alcanza.**" Para "esa historia" ×2 después de una muerte: AM19 "Y después, ¿hubo un tiempo en que seguiste por tu cuenta?…" (sin "de esa historia": ya se sabe de qué hablamos).

---

### 6.6 Le agradece al biógrafo y el biógrafo no contesta (leve)

| ID | Elsa dijo | Lo que siguió |
|---|---|---|
| **LE9** | "…Gracias por escucharme, por hacerme recordar. Fue lindo hablar de todo esto." | LE8, sin acuse: "Ahora sí, hablale a tu familia…" |

Está decidido que después de LE9 no va acuse (ronda 4), y para un "no" pelado está perfecto. Pero si la persona agradece, "Ahora sí" pasa por arriba. No propongo volver al acuse: FIN ya le devuelve el gracias ("Fue un gusto enorme escucharte"). Solo lo dejo anotado por si se repite en otras vidas.

**Aparte, para el escritor, no para la entrevista:** el bloque 3 (escuela) queda sin material: ES1, ES2, ES5, ES6, ES7 en blanco, ES9 "éramos católicos, creo", CI3 "nada". El libro va a tener un capítulo vacío o hecho de "no me acuerdo". El escritor tiene que saber juntarlo con la infancia o saltearlo, no inventarlo.

---

### Lo que se repite de S1–S6

| Hallazgo | ¿Otra vez? | Dónde, cuántas veces |
|---|---|---|
| **S1** amor para quien no convivió | **No aplica**: Elsa se casó y convivió. Solo AM14 "no fue el de toda la vida" (ya anotado en S1). | — |
| **S2** "no"/"paso" con explicación no se entienden | **Otra vez, 4**: CI1, CI2, CI13 (acuses M24 "Eso también va al libro" / "Quedó guardado junto con el resto" / "Cada detalle que agregás suma" sobre un "no"), AM16 → AM13. **Agregado nuevo:** en CI1 y CI2 lo que rompe no es el largo sino el **"pero"** ("pero ahora no"): la regla de 40 palabras propuesta en S2 no los salva. Propuesta: en los cierres, ignorar "pero/aunque". Y CI13 tiene 15 palabras justas: "menos de 15" pierde por una. Aparte: **10 de 13 cierres sí se entendieron**, porque Elsa contesta corto. La regla funciona cuando la gente es de pocas palabras. | 4 |
| **S3** las que abren tema suenan sordas | **Otra vez, 4**: JU8 ("eso ya lo conté", 6 preguntas después de JU1), CA6 (los hermanos ya estaban en CA1), HI0 (Mónica nacida en AM8), HI8 (los nietos en AM16, CS1, AS9). | 4 |
| **S4** acuses M3 fríos tras algo pesado | **Otra vez, 5**: AM4 la boda → "Lo tengo. Vamos con otra."; AM8 el nacimiento de Mónica ("tanta felicidad, tanta pureza") → "Listo, quedó guardado. Sigo."; HI2 "el momento más hermoso de mi vida" → "Listo, quedó guardado. Sigo."; PG1 "Mis papás envejecieron allá, lejos de mí" → "Guardado, Elsa. Te mando la próxima."; PE4 "Eso ya lo conté" → "Gracias por animarte a contarlo." La rotación le puso M3.7 a las dos respuestas más emocionadas de la vida de Elsa. | 5 |
| **S5** la misma historia varias veces | **Otra vez**: irse a Paraná (AD12, JU1, JU8, TR1, GI2: 5), la muerte de Ernesto (AM9, PE1, PE4, FI2: 4), la costura que le enseñó la mamá (CA2, JU4, TR3, FI3: 4), Claudia que la visita (AM19, HO1, HO5, FI1: 4), el nacimiento de Mónica (AM8, HI2, GI2: 3), la boda (AM4, GI1: 2). Dos "eso ya lo conté" explícitos (JU8, PE4). | 6 historias |
| **S6** detalles de M1, M15, CI1, CI8 | **Otra vez, 4**: AM9 con tres avisos de "paso"; M15 + FAM1 con la firma "Mónica" pegada; CI1 "de antes, la de antes"; CI8 "este tema". | 4 |

---

### Errores del modelo que hizo de Elsa (para la simulación, no son fallas de la entrevista)

- **No probó lo que tenía que probar:** contestó las seis que abren tema con "sí" y contenido; ni una vez un "No me acuerdo" corto donde importaba. Una Elsa real lo dice.
- Ignoró la salida que ES1 ya trae ("si ese día no lo tenés, contame lo primero que te acuerdes de la primaria"): una persona la agarra.
- Todas las respuestas del mismo largo (40 a 80 palabras); nunca un audio de cuatro palabras ni uno de tres minutos. Los olvidos son formulaicos: "Ni idea, querido" tres veces igual, "la cabeza no me ayuda" cuatro.
- Castellano de otro lado: "guapo" (AM4), "retales" (TR2), "echo de menos" (AM9), "Déjame buscar" (FO1), "sin ti", "Eres" (LE8). Elsa es de Villaguay.
- Gramática de modelo, no de una señora de 80: "Habrá ido a algún baile" (AD5), "Debió haber ido / tenido" (ES1, ES2), "tendremos tenido" (AM13), "no tuvo pasiones" en tercera persona (PA1), "pero te querías" (CA3), "se me borrró", "crezcán".
- Chiquito: "mis bisnietos" en FI6 (tiene uno). Los años cierran (casados en el 68, viuda en 2015: 47; Mónica 69, Claudia 72; a Paraná a los 20).
- La foto de FO1 ("Me la mando, dale") no llegó: es el arnés, no el modelo.

---

### Veredicto

**Para Elsa la entrevista no se rompe, pero no la acompaña.** No se salteó ningún tema (porque el modelo nunca dijo "no me acuerdo" donde importaba: el riesgo sigue por regla), 10 de 13 cierres se entendieron y lo mejor de su vida salió (la boda, Mónica en brazos, Ernesto). Pero treinta veces dijo "no me acuerdo" y treinta veces le contestaron "ya lo guardé" o "gracias por confiármelo"; once veces se disculpó por su memoria y nadie le dijo "no pasa nada".

Se arregla barato: una clase "olvido" en el código con tres acuses cálidos (M27), un mensaje de una vez que le saque el peso (M28), la frase de ES1 copiada en las ocho preguntas que piden "un día concreto", y que un "no me acuerdo" en las que abren tema no valga como "no me pasó" (ahí van los botones de Naza). Con eso, la que no se acuerda deja de sentir que falla en un examen y vuelve a estar en una charla.
