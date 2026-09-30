# Lectura de Fable: simulación 2 (Amalia, 74, viuda, inventada)

**Qué es:** Fable (como agente, voz de biógrafo) leyó entera la charla de [`2-viuda.md`](2-viuda.md) el 30/09/2026 y marcó lo que falla en la entrevista para una vida así: 50 años de casada, viuda hace dos, tres hijos, cinco nietos. Lo que ya se encontró en la simulación 1 ([`hallazgos.md`](hallazgos.md), S1 a S6) no se vuelve a explicar: solo se anota que se repite, con los IDs y cuántas veces. No se tocó ningún otro archivo. **Nada de esto está decidido: decide Naza.**

Amalia estaba pensada para probar tres cosas: las preguntas sensibles con acuses sobrios, "¿esa historia tuvo un final?" (AM9) con una viuda, y un "prefiero no hablar de eso" dicho sin la palabra "paso". Resumen: AM9 funcionó (contestó "sí, tuvo un final" y el flujo siguió por la rama correcta); los acuses sobrios funcionaron después de las preguntas sensibles; el "prefiero no" no se entendió, y no pasó nada malo solo porque lo dijo en una pregunta que ya era sensible.

---

## 1. Fallas nuevas (de la más grave a la más leve)

### N1. Las preguntas de después del final están escritas para una separación, no para una viuda (media)

Amalia contó la muerte de Horacio en AM9 y terminó con "Perdoná, me cuesta todavía". Lo que le llega después nombra esos 50 años y esa muerte como "esa historia", dos veces seguidas, y le pregunta en pasado por un tiempo que ella está viviendo ahora.

| ID | Mensaje exacto del biógrafo | Qué le pasó a Amalia |
|---|---|---|
| **AM19** | "Y después de esa historia, ¿hubo un tiempo en que seguiste por tu cuenta? Contame cómo era un día tuyo entonces: qué hacías, quién andaba cerca. Si no hubo un tiempo así, decime no nomás." | Ese tiempo es hoy. Contesta en presente ("Vivo sola… Los miércoles voy a un grupo de viudas… noches en que la casa está muy silenciosa"). Es la misma respuesta que da 40 preguntas después en **HO1** ("un día cualquiera de los de ahora"): café, limpiar, grupo de viudas, misa, el patio, pensar en Horacio. La pregunta se gastó en algo que el bloque 14 iba a pedir igual. |
| **AM16** | "Si después de esa historia hubo otro amor, contame del que compartís hoy, o del último… Si no lo hubo, decime no nomás." | Segunda vez "después de esa historia". Para quien se separó, "esa historia" es la pareja; para una viuda de hace dos años, "después de esa historia" se lee como "cuando eso terminó". La pregunta hace falta (hay viudas que vuelven a formar pareja), pero la entrada raspa. |

**Cuántas veces:** 2 preguntas, seguidas, justo después de la respuesta más dura del bloque.

**Arreglo (textos, sin código):**
- **AM19:** "Y después, cuando quedaste por tu cuenta, ¿cómo fueron esos primeros tiempos? Qué cambió en la casa y en los días, quién anduvo cerca. Si ese tiempo es el de ahora, contame igual cómo lo estás llevando. Y si no hubo un tiempo así, decime no nomás." (Pide los primeros tiempos, no "un día": así no repite HO1, y sirve para la separada y para la viuda.)
- **AM16:** "Y más adelante, ¿hubo otro amor? Si lo hubo, contame del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado. Si no lo hubo, decime no nomás."

### N2. "Prefiero no hablar de eso" sin la palabra "paso": el código no lo ve (media)

Era una de las tres cosas a probar. Pasó una sola vez, en **JU17** (momento duro de la juventud): "Sí, hay algo. Estaba embarazada… perdí el bebé. No... prefiero no hablar mucho de eso. Fue duro… de eso no quiero hablar ahora… Dejémoslo ahí."

| Qué hizo el código | Qué le pasó a Amalia |
|---|---|
| No es "no" corto (arranca con "Sí, hay algo") ni "paso". Como JU17 es sensible, mandó **M4.3** "Lo guardo tal como lo contaste. Gracias." | El acuse le quedó bien: es justo lo que pidió. Pero fue suerte: si dice lo mismo en **AM8**, **GI2** o cualquier pregunta común, le llega "Lo tengo. Vamos con otra." o "Anotado. Sigo con otra." Y nada queda marcado: el escritor va a encontrar un embarazo perdido contado a medias sin saber que ella pidió no ahondar. |

**Cuántas veces:** 1 (el modelo narrador cortó menos de lo que decía su ficha; ver la sección 3).

**Arreglo (regla de código, una línea, más un dato para el dashboard):** si la respuesta contiene un freno ("prefiero no", "no quiero hablar", "dejémoslo ahí", "mejor no", "no me hagas hablar de eso"), el acuse es M4.3 ("Lo guardo tal como lo contaste. Gracias.") sea o no sensible la pregunta, y la respuesta queda marcada como **"pidió no ahondar"** para el dashboard y el escritor. No se saltea nada (a diferencia del "paso": ella sí contó algo y eso vale), no se pregunta de nuevo. Se cruza con la idea de Naza de los botones: acá no hace falta botón, porque no hay que decidir un camino, solo cuidar lo que dijo.

### N3. "La pelea que da risa" (AM13) nunca le llega a una viuda por su marido; le llegó por error (media)

AM13 depende de `sino:AM9 o si:AM16`: solo va para quien **sigue en pareja** o tuvo **otro amor después**. Una viuda o una separada cuyo único amor fue el que terminó no la recibe nunca. A Amalia le llegó porque su "No, no hubo otro. Para mí, Horacio fue único…" (45 palabras) no se entendió (S2), y el código creyó que hubo otro amor.

| ID | Mensaje exacto | Qué le pasó a Amalia |
|---|---|---|
| **AM13** (tras AM16 "no") | "Gracias, Amalia. Ya lo guardé. / Contame una pelea que tuvieron, de esas que después dan risa. Por qué fue, quién aflojó primero y cómo hicieron las paces." | La tomó como Horacio (el "tuvieron" es ambiguo y la salvó) y contó la mejor escena liviana del bloque: los amigos sin avisar, las empanadas del congelador, "ves, con o sin aviso, salió bien". **Es la pregunta que más luz le pone a 50 años de matrimonio y el flujo, bien entendido, se la hubiera negado.** |

**Cuántas veces:** 1. Pero es estructural: en las 6 vidas del flujo, la que enviudó sin otro amor después no la recibe.

**Arreglo (regla + salida):** AM13 pasa a depender de la primera pareja, no del final: `si:AM3` (armaron la vida juntos), y va **después de AM8 y antes de AM9**, así la pelea se cuenta antes de la despedida y no después. Texto con salida: "Contame una pelea que tuvieron, de esas que después dan risa. Por qué fue, quién aflojó primero y cómo hicieron las paces. Si no tienen ninguna que hoy dé risa, decime no nomás." Para el amor de después (AM16 sí) no hace falta otra: AM16 ya pide un momento de los dos.

### N4. El bloque 11 le pregunta a una viuda si perdió a alguien, cuando ya lo contó seis veces (media)

Es el patrón de S3 (las que abren tema suenan sordas), pero con un ID que S3 no tenía y en la vida donde más duele.

| ID | Mensaje exacto | Qué le pasó a Amalia |
|---|---|---|
| **PE1** (pregunta 70) | "¿Perdiste a alguien importante en tu vida? Si querés, contame quiénes fueron, qué eran para vos y cómo lo fuiste llevando…" | La muerte de Horacio ya estaba en AM9, AM19, AM16, CS1, AS1 y AY1; la de su papá, en JU1 y PG1. Vuelve a contar las tres muertes en orden, como si fuera la primera vez. |
| **PE4** | "¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia?…" | "Creo que ya te las conté: la muerte de mi papá, el aborto, la enfermedad de Horacio." Y el acuse: **M4.4 "Gracias por animarte a contarlo."** por decir "ya te lo conté". |

De las tres preguntas del bloque 11, dos fueron recontar; lo único nuevo fue una frase sobre la mamá. Para una viuda, el bloque de las pérdidas llega **después** de que el amor (AM9) y los viejos (PG1) ya se llevaron las muertes grandes.

**Arreglo (textos):**
- **PE1:** "Sé que ya me hablaste de algunas pérdidas. Acá hay lugar para lo que no entró: si hubo alguien más que perdiste, y con cada uno, cómo fueron los días de después y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también."
- **PE4:** la salida "si la que se te viene ya me la contaste, con decírmelo alcanza" que ya se propuso en S5; con el "no" de hasta 40 palabras (S2) el "ya te las conté" pasa a acuse neutro y no a "gracias por animarte".

### N5. La foto (FO1) y el reloj: la próxima pregunta le llega mientras busca la foto en el cajón (media-leve)

| ID | Mensaje exacto | Qué le pasó a Amalia |
|---|---|---|
| **FO1** | "…¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés a mano, sacale una foto y mandámela, y después contame en un audio qué se ve…" | "Sí, tengo una. Voy a buscarlo… Voy a mandártela ahora." Y se levanta a buscarla. Con la regla de hoy (unos minutos de silencio y llega la siguiente), **LE9 le cae en el medio de la búsqueda**, y después LE8 y el final. La foto llega tarde o no llega, y ella siente que la apuraron en la única pregunta que pide levantarse del sillón. |

**Cuántas veces:** 1 (es la única pregunta que pide una foto). En la simulación no se ve porque no hay reloj; en la prueba real se va a ver.

**Arreglo (regla de código + una frase):** después de FO1 el silencio no manda la siguiente: se espera una foto o un audio, con un tope largo (horas, no minutos). Y la pregunta lo dice: "…Tomate el tiempo que necesites para buscarla: hasta que no me mandes la foto o me digas algo, no te mando nada más. Y si no la encontrás, no pasa nada: el libro va igual, y la podés mandar más adelante."

### N6. Arriba de una pregunta sensible, el acuse pegado es de trámite (leve-media)

S4 miró los acuses **después** de algo pesado. Esto es lo otro: el acuse común va pegado como primera línea de la pregunta sensible que sigue, y la pregunta dura arranca con "Sigo." o "Escuchado."

| Acuse + pregunta | Mensaje exacto |
|---|---|
| M3.7 + **AM9** | "Listo, quedó guardado. Sigo. / Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo?…" (y arriba, ella acababa de contar "nos salió bien, Amalia"… "Yo lloré") |
| M3.8 + **CA17** | "Escuchado. Vamos por la siguiente. / ¿Hubo algún momento difícil de tu infancia…?" |
| M3.3 + **AD15** | "Anotado. Sigo con otra. / ¿Hubo algún momento duro en tu adolescencia…?" |
| M3.2 + **JU17** | "Te escuché. Vamos con la que sigue. / ¿Hubo algún momento duro en tu juventud…?" |
| M3.8 + **TR11** | "Escuchado. Vamos por la siguiente. / ¿Te quedaste alguna vez sin trabajo…?" |

**Cuántas veces:** 5 (todas las sensibles fuera del bloque 11; las del 11 van después de un M4 solo y no tienen este problema).

**Arreglo (regla de código, una línea):** antes de una pregunta sensible, el acuse pegado es **M26** ("Gracias, {{nombre}}."), igual que antes de un cierre. `acuseAntesDe` ya hace eso para los cierres y LE9; se le agrega `sensible`.

---

## 2. Lo que se repite de la simulación 1

| # | Otra vez | IDs y cuántas veces en esta charla |
|---|---|---|
| **S1** | AM1 repite lo que ya contó; AM13 después de un "no" largo | **AM1** ("Fue en un baile en el club del barrio, como te conté": ya lo había dicho en AM0): 1. **AM13** tras el "no" de AM16: 1 (acá cayó bien por casualidad; ver N3). AM3, AM4 y AM14 encajaron: Amalia se casó y tuvo a Juan antes. |
| **S2** | "No" con explicación no se entiende; ningún "paso" | **20 respuestas que arrancan con no/nada, 2 entendidas** (CI11 y CI14, las únicas de menos de 15 palabras). No entendidas: CI1, CI2, CI3, CI4, CI5, CI6, CI7, CI8, CI10, CI12, CI13 (11 cierres), JU5, JU8, AM16, TR11, TR8, CP1, PE5. Con consecuencia en el flujo: 1 (AM16 → AM13). Acuses que chocan: **M24.4 "Gracias por eso. Cada detalle que agregás suma."** después de un "no" en CI4, CI8 y CI13 (3); **M4.1 "Gracias por contarme esto, Amalia. Queda guardado con cuidado."** después de "No, gracias a Dios siempre tuve trabajo" (TR11); M3.3 "Anotado." después de "No, nunca viví en el campo" (CP1). No dijo "paso" ni una vez (ver sección 3). Con la regla de S2 (cierres hasta 40 palabras) se entendían 10 de los 13 cierres. |
| **S3** | Las que abren tema suenan sordas | **HI0** ("¿Tuviste hijos?" en la pregunta 51; Marcelo, Silvia y Diego ya aparecían en JU15, JU17, AM8, AM9, AM19, TR6, CS1, PG1: 8 veces), **HI8** ("¿Llegaron nietos?" después de "Tengo cinco nietos en total" en HI0 y de AM19), **CA6** (Teresa nombrada en CA1). JU8 esta vez encajó (nunca se mudó). **AM9** es el caso inverso al del plan B: en AM0 ya dijo "hasta que murió hace dos años" y el biógrafo pregunta "si esa historia tuvo un final" (ya anotado como plan B). **HI2b** "¿Tuviste más hijos?" después de "tuve tres" (ya anotado: plan B, no se toca). Y **PE1**, que es N4. |
| **S4** | Acuses M3 livianos después de algo pesado | **PG1** (su papá salió a pescar y no volvió) → M3.5 "Guardado, Amalia. Te mando la próxima." y abajo "¿Tuviste hijos?" (el caso exacto de S4); **AM8** ("nos salió bien"… "Yo lloré") → M3.7 "Listo, quedó guardado. Sigo."; **AM19** (las noches con la casa en silencio) → M3.8 "Escuchado. Vamos por la siguiente."; **GI2** (el día del diagnóstico, "la primera vez que lo vi llorar") → M3.8 "Escuchado. Vamos por la siguiente."; **FI1** (la soledad como compañera) → M3.3 "Anotado. Sigo con otra."; **AS1** (Marta el día que murió Horacio) → M3.8. Total: 6. Los M4 después de las sensibles, en cambio, sonaron bien todos. |
| **S5** | La misma historia varias veces | **La enfermedad y la muerte de Horacio:** contada entera en AM9, AY1, PE1 y GI2 (4) y nombrada en AM19, AM16, CS1, AS1, PE4, PE5, HG4, HJ1, FI3, LE9 (14 en total). **La muerte del papá:** JU1, PG1, PE1, PE4, GI9 (5). **El pan:** CA1, HI9, CO1, FI1, AS9, FU1, FI6, LE7 (8). **Juan, el novio de los 16:** AD6, AM0, AM14 (3; AM14 es AD6 calcada para quien solo tuvo ese otro amor). **El casamiento:** JU1, AM3, AM4 (3). **El grupo de viudas:** AM19, PA1, HO1 (3). Bloque 13: 3 de 9 fueron recontar (GI1 = AM1, GI2 = AM9/AY1, FI4 = DE1); mejor que en la simulación 1. |
| **S6** | Detalles | **M1 doble:** AM0, AM9 (tres avisos), HI0, HI8 (4). **Bloque 11:** "paso" en AV11, PE1, PE5 y PE4, cuatro mensajes seguidos. **M15 + firma:** "Escuchado. Vamos por la siguiente. / Esta pregunta te la hace tu familia." y aparte "Abuela, ¿qué fue lo primero que te enamoró del abuelo Horacio? Sofi". **CI1** "de antes, la de antes". **CI8** "Con esto cerramos este tema." Los 5, otra vez. |

**Lo que funcionó y vale decir:** la rama de AM9 para una viuda (sí → AM19 → AM16) es la correcta; los 7 acuses sobrios (M4) después de las sensibles sonaron bien, en especial M4.3 después del embarazo perdido y M4.4 "Cuando quieras, seguimos" después de "Perdoná, me cuesta todavía"; los dos "no" cortos de verdad (CI11, CI14) recibieron "Bien, seguimos." como corresponde; LE9 → LE8 → FIN sin acuses en el medio cierra emocionando ("te extraño, pero tengo paz").

---

## 3. Errores del modelo que hizo de Amalia (no son fallas de la entrevista)

- **No probó lo que tenía que probar:** la ficha decía "se emociona, a veces corta"; cortó una sola vez (JU17) y nunca dijo "paso". Sus "no" cortos de verdad fueron 2 de 20. Todas las respuestas miden 150–200 palabras, también en los cierres.
- **La pandemia:** en HG4 dice que en 2020 "Horacio ya estaba enfermo" y tenía "miedo de que se enfermara de covid"; pero el cáncer se lo diagnosticaron hace tres años (2023) y duró un año. Y "estaba en casa, sola, porque Horacio ya estaba enfermo": sola con él en la casa.
- **El embarazo perdido:** "nuestro cuarto hijo, entre mis otros dos… después tuvimos a Diego" (tiene tres). Lo llama "el aborto" en PE4: una narradora real de 74 diría "perdí un embarazo"; es una palabra que el escritor no debería copiar.
- **Lucas, el nieto:** tiene 8 años en HI9 y empieza la secundaria en FI2. Hay dos Lucas (el nene del jardín y el nieto): es a propósito, pero el del jardín tiene 16 en LE1 y ella se jubiló "hace años".
- **La maestra:** en GI1 la llaman del jardín para trabajar "embarazada de Marcelo" (1975); en JU2 y TR6 estudió y empezó cuando los tres hijos ya eran grandes. En ES7 "cuando terminé la primaria empecé a ayudar en un jardín"; en TR1, a los 16–17.
- **El Mundial 78 "cuando Maradona jugaba"** (no jugó).
- **La casa:** "la casa que alquilé con Horacio… de dos ambientes" (JU12) y "vivo en la misma casa… de dos ambientes" (HO9): tres hijos criados 50 años en un alquiler de dos ambientes; y "aquí nacieron mis hijos" cuando en HI2 fue en el hospital.
- **El papá:** muere cuando ella tiene 30 y "mis hermanas pequeñas también" quedaron destrozadas (tenían 26 y 24). En AY1: "Mi papá ya había muerto, así que mi mamá no estaba para ayudar" (no se sigue).
- **Sueltos:** "la abuela de mi papá" en la mesa (AS9), "nos comeríamos la mano", "me peluquería", "me despierro", "me recorió", "quisé", "un día me dieron cuenta", "están buenos" (los hijos), "no todos tiene eso", "estaba lluvia afuera"; mezcla de tuteo ("si la sabes llevar", "debes vivirla como tú quieras") con voseo. "Ahora, viuda," como muletilla en unas 15 respuestas.
- **FAM1** ("¿qué fue lo primero que te enamoró del abuelo Horacio?") es AM1 calcada: la pregunta de la familia se armó sin mirar el banco. En la prueba real la escribe la familia, no el equipo.

---

## Veredicto

**Para esta vida, casi.** El flujo del amor, el bloque 11 y los acuses sobrios aguantaron a una viuda: no hubo una pregunta que la lastimara ni un acuse indigno como el de la simulación 1. Lo que falla es más fino: dos preguntas de después del final escritas para separadas (AM19, AM16), la pelea que da risa negada justo a quien más la merece (AM13), un "prefiero no hablar" que el código no ve y el escritor no va a saber, y el reloj que no espera la foto (FO1).

Se arregla con textos (AM19, AM16, PE1, FO1, AM13 con salida) y cuatro reglas de una línea (frenos → M4.3 y marca para el dashboard; M26 antes de una sensible; AM13 `si:AM3` antes de AM9; el reloj largo después de FO1). Lo demás es S2 a S6 otra vez, con la misma cura ya propuesta: la regla del "no" hasta 40 palabras en los cierres hubiera entendido 10 de los 13 que acá no entendió.
