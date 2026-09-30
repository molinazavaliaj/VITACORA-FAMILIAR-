# Lectura de Fable: simulación 1 (Nelly, 68, madre soltera, inventada)

**Qué es:** Fable (como agente, voz de biógrafo) leyó la charla entera de [`1-madre-soltera.md`](1-madre-soltera.md) el 30/09/2026 y marcó las fallas de la entrevista. No tocó ningún archivo. **Nada de esto está decidido:** decide Naza. Índice de hallazgos: [`hallazgos.md`](hallazgos.md).

---

### 1. El bloque del amor no está armado para una vida así (grave)

La historia de amor de Nelly es un noviazgo de adolescente que terminó cuando él se fue. Después: nadie. El bloque 6 asume que "la primera que fue en serio" llegó a algo (casarse, convivir) y le manda tres preguntas sobre cosas que nunca le pasaron, más un acuse que la deja mal parada.

| ID | Mensaje exacto | Qué le pasó a Nelly |
|---|---|---|
| **AM3** | "Y después, ¿cómo decidieron armar la vida juntos: casarse, irse a vivir, lo que haya sido? ¿Quién lo dijo primero, o se fue dando solo? Contame ese momento: dónde estaban, qué se dijeron." | En AM0 ya dijo "no tuve pareja de verdad". Contesta: "Ay, eso no pasó, viste. Nosotros nunca vivimos juntos, nunca nos casamos." |
| **AM4** | "Hay días que quedan grabados para siempre. ¿Hubo uno en que se casaron, o en que empezaron a vivir juntos? …" | Llega **justo después** de decir que nunca se casó. Contesta "Paso, eso no me pasó. Nunca me casé ni conviví con nadie." |
| **M3.6** (tras AM4) | "Lo tengo. Vamos con otra." | "Lo tengo" de un "no me pasó". |
| **M4.4** (tras AM9) | "Gracias por animarte a contarlo. Cuando quieras, seguimos." | Ella dijo "Paso, mejor no. Ya lo conté". Le agradece por animarse a contar lo que acaba de decir que no quiere contar. **El peor acuse de toda la entrevista.** |
| **AM13** | "Contame una pelea que tuvieron, de esas que después dan risa. Por qué fue, quién aflojó primero y cómo hicieron las paces." | Llegó porque en AM16 dijo "No, no hubo otro amor de verdad…" largo (punto 2). No hay "ellos". Nelly improvisó una pelea con el hijo. |
| **AM14** | "¿Tuviste algún amor que te marcó y **no fue el de toda la vida**? …" | Para alguien que no tuvo "el de toda la vida", la frase raspa. Contestó bien (Carlos), pero la pregunta la nombra por lo que le falta. |

**Cuántas veces:** 4 preguntas que no encajan + 2 acuses. Es el bloque entero.

**Ya anotado:** AM9 está en el plan B. Pero el plan B pregunta "¿sigue con esa pareja hoy?"; acá el agujero es otro: **¿llegaron a armar la vida juntos?** AM3 y AM4 dependen de `si:AM0`, así que ni un "no" perfecto en AM3 salva a AM4.

**Arreglo concreto (regla + textos, sin modelo):**
- **AM3 pasa a abrir tema** (lleva M1) y cierra con la salida: "…Contame ese momento: dónde estaban, qué se dijeron. **Y si no llegaron a eso, decime no nomás y seguimos.**"
- **AM4 pasa a depender de AM3** (`si:AM3`), no de AM0. Un "no" corto o "paso" en AM3 saltea AM4.
- Si se activa el plan B, que Haiku conteste tres cosas de AM0: ¿hubo alguien? · ¿siguen juntos? · **¿llegaron a convivir o casarse?**
- **AM14, texto nuevo:** "¿Hubo otro amor que te marcó, aunque haya durado poco o no haya llegado a nada? Si te pasó, contame cómo se cruzaron y el momento que más te acordás de esa persona."
- **AM1** repite AD6 (ya contó cómo conoció a Héctor en la adolescencia). Agregarle la salida que ya tienen TR8 y PA1: "…¿Y qué fue lo primero que te llamó la atención de esa persona? **Si ya me lo contaste cuando hablamos de tu adolescencia, decímelo y vamos a lo que sigue.**"

---

### 2. Ni un solo "no" ni un solo "paso" fue entendido (grave)

Nelly dijo "paso" 3 veces y "no" 7 veces. **El código no reconoció ninguno de los 10.** Siempre por lo mismo: la gente no dice "paso" y se calla; dice "paso" y explica por qué. Y a un cierre no contesta "no": contesta "No, creo que está todo" y resume.

| ID | Lo que dijo Nelly (arranque) | Palabras | Qué hizo el código |
|---|---|---|---|
| AM4 | "Paso, eso no me pasó. Nunca me casé…" | 40 | M3.6 "Lo tengo." |
| AM9 | "Paso, mejor no. Ya lo conté, viste, se fue y no volvió. Eso fue suficiente." | 15 | M4.4 "Gracias por animarte a contarlo" y la trató como "sí tuvo final" |
| CP1 | "Paso, no trabajé en el campo. Villa María…" | 60 | M3.3 "Anotado." |
| AM16 | "No, no hubo otro amor de verdad. Ya te dije…" | 120 | Trató como "sí hubo otro amor" → mandó AM13 (la pelea) |
| CI6 | "No, creo que está todo. La verdad es que mi historia de amor es corta…" | 50 | M24.2 "Anotado, gracias. Quedó guardado junto con el resto." |
| CI11 | "No, creo que ya conté todo. Lo más duro fue…" | 45 | M24.3 "Lo sumo a lo que ya me contaste" |
| CI12 | "No, creo que conté lo importante. La dictadura, los Mundiales, la crisis, la pandemia." | 20 | M24.4 **"Gracias por eso. Cada detalle que agregás suma."** (no agregó nada) |
| CI13 | "No, creo que está todo. Lo importante está ahí…" | 25 | M24.1 **"Gracias, Nelly. Eso también va al libro."** (¿qué va al libro? "no") |
| LE9 | "No, creo que está todo…" | 100 | Sin consecuencia (tras LE9 no hay acuse) |
| JU5 | "No, yo no tuve experiencia militar, soy mujer…" | 150 | Sin consecuencia (la pregunta tiene la rama de la disciplina) |

**Cuántas veces:** 10 de 10. Con consecuencia en el flujo: 2 (AM9; AM16 → AM13). Con acuse que suena mal: 6.

**Arreglo (dos reglas de código):**
1. **"Paso":** si la **primera palabra** es "paso", es paso, sin importar el largo. Única excepción: segunda palabra "a", "por" o "de" ("paso a contarte", "paso por alto"). Nadie que quiere saltear una pregunta se queda en 8 palabras por audio.
2. **"No" en los cierres:** en un cierre (CI1–CI14, LE9), un "no" que arranca la respuesta cuenta como "no" hasta **40 palabras**, no 15. Para las que abren tema conviene dejar las 15: ahí un "no" largo suele traer una historia (JU5).

Con esas dos reglas se hubieran entendido 9 de 10 (AM16 sigue larga; para esa queda el plan B).

---

### 3. Las preguntas que abren tema suenan a que el biógrafo no escuchó (media)

Están escritas como si fuera la primera vez que se nombra el tema, y Nelly ya nombró a su hermano, su hijo, su mudanza y su nieta veinte veces.

| ID | Mensaje exacto | Qué le pasó a Nelly |
|---|---|---|
| **HI0** | "Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Si sí, contame quiénes son, así los voy conociendo…" | Es la pregunta 55. Pablo apareció en 30 respuestas. Contesta "Pablo nació en 1981, **como ya sabe**". |
| **CA6** | "¿Tuviste hermanos? Si tuviste, ¿con cuál eras más cercana de chica?…" | Rubén ya estaba en OR1 y CA1. |
| **JU8** | "¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Si te pasó, contame cómo lo decidiste…" | 6 preguntas después de JU1, donde contó la mudanza entera. "Si, ya te conté que me mude a Cordoba." |
| **HI8** | "Ahora, los nietos. ¿Llegaron nietos a tu vida?…" | Ya había contado que cuida a Valeria dos tardes por semana (CS1). |

**Cuántas veces:** 4 de las 6 que abren tema. JU1/JU8 y HI2b ya están anotados como "no se tocan, plan B". Esto no es el plan B: es que **la pregunta admita que ya lo nombró**, así no suena sorda aunque el código no entienda.

**Textos nuevos (mantienen el "sí/no" para la regla):**
- **HI0:** "Ahora vamos a los hijos. Si tuviste, o criaste a alguno como si lo fuera, presentámelos de a uno aunque ya me hayas hablado de alguno: cómo se llaman, cuándo llegaron. Así los voy conociendo. Y si no, decímelo nomás y seguimos por otro lado."
- **CA6:** "Tus hermanos, si tuviste: ¿con cuál eras más cercana de chica? Contame alguna aventura que hayan hecho juntos; seguro tienen varias. Y si fuiste hija única, decímelo nomás."
- **JU8:** "Si en algún momento te fuiste a vivir a otra ciudad o a otro país, aunque ya me lo hayas nombrado, contame cómo lo decidiste: qué te empujó y a quién se lo dijiste primero. Si siempre viviste en el mismo lugar, decime no nomás."
- **HI8:** "Ahora, los nietos. Si llegaron, aunque ya me hayas nombrado a alguno, contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, me lo decís y pasamos a otra cosa."

---

### 4. Agradecimientos que suenan mal (media)

Aparte de los del punto 2, hay acuses **livianos después de algo pesado**. El código no puede saberlo; el problema es que la rotación M3 tiene frases de empleado que no aguantan una respuesta triste.

| Después de | Acuse exacto | Qué acababa de contar Nelly |
|---|---|---|
| AD12 | M3.3 "Anotado. Sigo con otra." | "Estaba embarazada… me quería morir." |
| PG1 | M3.5 "Guardado, Nelly. Te mando la próxima." | La muerte de su mamá, "lo más duro de mi vida". Y la próxima es "¿Tuviste hijos?" |
| AM16 | M3.1 "Gracias, Nelly. Ya lo guardé." | "…duele a veces pensar que envejecí sola." Y abajo: "Contame una pelea que tuvieron, de esas que después dan risa." |

**Cuántas veces:** 3 claras. **Arreglo (textos):** que ninguna M3 suene a trámite, porque cualquier pregunta puede recibir una muerte. Cambiar las cuatro más frías:
- M3.3 "Anotado. Sigo con otra." → "Gracias, lo anoté. Sigo con otra."
- M3.6 "Lo tengo. Vamos con otra." → "Lo tengo, gracias. Vamos con otra."
- M3.7 "Listo, quedó guardado. Sigo." → "Quedó guardado, gracias. Sigo."
- M3.8 "Escuchado. Vamos por la siguiente." → "Te escuché bien. Vamos por la siguiente."

Regla chica: **PG1** ("tus viejos de grande") casi siempre termina en una muerte. Que su acuse sea M26 ("Gracias, {{nombre}}."), como antes de un cierre, porque HI0 ya arranca con "Ahora vamos a los hijos".

---

### 5. Lo que cansa: la misma historia cinco veces (media-leve)

La estructura tiene varias puertas al mismo cuarto y ninguna dice "si ya entraste, no hace falta".

| Historia | Dónde la contó | Veces |
|---|---|---|
| La crisis de 2001 | JU17, TR11, PE4 ("Ya te conté lo de la crisis"), HG1, FI7 | 5 |
| La mudanza a Córdoba | JU1, JU8, JU12, LU4 ("ya te lo conté"), GI9 | 5 |
| El embarazo | AD12, AD15, CI4, AM3, GI2, DE1, FI4 | 7 (GI2 es AD12 calcada) |
| Conocer a Héctor | AD3, AD5, AD6, AM1 | 4 |
| Los ravioles | CS1, HI9, AS9, CO1, HO1, LE1 | 6 |

Naza ya decidió que los cuatro "momento difícil" quedan y GI1/GI2 separadas; no lo discuto. Propongo **una salida en las que llegan al final**:
- **PE4:** "…Si querés, contame qué pasó y cómo lo viviste. **Si la que se te viene ya me la contaste, con decírmelo alcanza, o contame otra.**"
- **GI1 y GI2:** al final "**Si el que se te viene ya me lo contaste, buscá otro: seguro hay más de uno.**"
- **CI2** hizo que Nelly se fuera a la escuela (bloque siguiente) y ES1/ES2 se lo volvieron a preguntar. Texto: "…¿Hubo alguna historia **de tu casa o de tu familia de entonces** que se te vino a la cabeza mientras contabas y no tuvo dónde entrar?…"

Bloque 13 (lo que Naza pidió mirar): no la cansó, pero 4 de 9 fueron recontar (GI1 = HI6, GI2 = AD12, HJ1 = AM16, FI4 = AD15). Con la frase en GI1/GI2 baja a 2.

---

### 6. Tono y detalles (leve)

| Dónde | Mensaje exacto | Qué pasa | Arreglo |
|---|---|---|---|
| AM0, AM9, HI0, HI8 + M1 | "…Si no hubo, decímelo nomás, que también vale." + "_Si no va con vos, decí paso y vamos a otra._" | La pregunta ya trae su salida y M1 la repite. En AM9 son **tres** avisos. | Regla: si la pregunta ya tiene la salida escrita, no lleva M1. O sacar la frase interna. (Naza decidió M1 en las que abren tema: es elegir una.) |
| Bloque 11 | AV11 "…con un *paso* alcanza y seguimos. Vos manejás." + M1 bajo PE1, PE5 y PE4 | Cuatro veces "decí paso" en cuatro mensajes seguidos. | Decisión de Naza; solo lo marco. |
| M15 + FAM1 | "Escuchado. Vamos por la siguiente. / Esta pregunta te la hace tu familia." y aparte "Mamá, ¿cómo hacías…? Carina" | La firma queda pegada sin separación, como parte de la pregunta. "Tu familia" cuando es una persona. | Un solo mensaje: "Esta pregunta te la manda Carina:" y abajo la pregunta. Sin nombre, "tu familia". |
| CI1 | "Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos." | "de antes, la de antes" trastabilla. | "Con esto cerramos lo de tu familia de antes de que llegaras vos." |
| CI8 | "Con esto cerramos este tema." | Único cierre que no nombra el tema. | "Con esto cerramos la familia de grande." (vale con o sin hijos) |

---

### Aparte: errores del modelo que hizo de Nelly (para la simulación)

- Edad del embarazo: 16 en la fiesta, "casi dos años" de novios, "diecinueve recién cumplidos"; en HG1 embarazada en el Mundial 78 (tendría 20) y en HI0 Pablo nace en 1981.
- Pablo tiene 9 al mudarse a Córdoba, pero Carina nace en Córdoba cuando Pablo tiene 6.
- "Soy vieja, no tengo celular" (contesta por WhatsApp).
- "Los domingos mato gallinas y hago ravioles."
- "Rubén, mi otro nieto" (Rubén es el hermano muerto; el nieto es Tomás). "Marisa" es amiga adolescente y nuera. "Manejé hasta el hospital" sin auto en toda la vida.
- Trata de usted una vez ("como ya sabe"). Pierde las tildes de CI4 a AM0 y las recupera.
- Todas las respuestas miden lo mismo (150–200 palabras), incluso los "no". Hacen falta respuestas de una línea y otras de tres audios.
- En CI2 se va al tema del bloque siguiente; en 2001 tenía 43, no es "juventud".
- Un salto de línea partió FI7 ("promete / ndo"): es del volcado.
- "Nunca los vi cansada" en FAM1 (invirtió la pregunta).

---

### Veredicto

**No, todavía no para esta vida.** El bloque del amor le pregunta a una madre soltera cómo decidió casarse y le agradece "por animarse" cuando pide no seguir; y de sus 10 "no"/"paso" el código no entendió ninguno, porque los dijo como los dice cualquiera: con una explicación atrás.

Se arregla con poco: dos reglas de código (paso = primera palabra, sin tope; "no" en cierres hasta 40 palabras) y que AM4 dependa de un AM3 que admita "no". Con eso, más los cuatro openers reescritos para que no suenen sordos, la entrevista se lee como una charla también para alguien que crió sola. El resto (repeticiones, acuses fríos) es pulido, no bloqueo.
