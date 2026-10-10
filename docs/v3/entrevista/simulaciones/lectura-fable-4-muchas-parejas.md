# Lectura de Fable: simulación 4 (Chela, 71, muchas parejas, inventada)

**Qué es:** Fable (como agente, voz de biógrafo) leyó la charla entera de [`4-muchas-parejas.md`](4-muchas-parejas.md) el 30/09/2026 y marcó lo que falla para una vida con tres matrimonios (Raúl, Eduardo, Alberto, que murió en 2019), varias parejas cortas y un novio hoy (Hugo, sin convivir). No tocó ningún archivo. Lo que ya se encontró en la simulación 1 (S1–S6, [`hallazgos.md`](hallazgos.md)) acá solo se cuenta, no se vuelve a explicar. **Nada de esto está decidido: decide Naza.**

---

## 1. Fallas nuevas

### N1. El bloque del amor tiene lugar para dos historias, y Chela tiene cuatro (grave)

AM0 le promete: *"Después vamos de a una, empezando por la primera que fue en serio."* Chela hace el repaso entero: Raúl (primer marido, dos hijos), Eduardo (segundo, casi diez años, un hijo), Alberto (tercero, catorce años, murió en 2019), Hugo (el novio de hoy), y un par de cortas. Y el bloque le pregunta por **Raúl** (AM1, AM3, AM4, AM8, AM9), por el tiempo sola (AM19), por **Hugo** (AM16, AM13) y por un amor corto (AM14). **Eduardo y Alberto no reciben ninguna pregunta.** La promesa "vamos de a una" se rompe a la segunda.

| Marido | Años | Preguntas del bloque 6 que le tocaron | Por dónde entró al libro |
|---|---|---|---|
| Raúl | ~8, dos hijos | AM1, AM3, AM4, AM8, AM9 | Por donde corresponde. |
| Eduardo | ~10, un hijo | ninguna | Ella lo mete de contrabando al final de AM19 y en HI2b, TR11, LE7, FAM1. |
| Alberto | 14, murió en 2019 | ninguna | Ella lo trae sola en el cierre CI6 ("Quiero contar algo de Alberto, mi tercer marido"), y después en PE1, PE4, LU4, GI9, HG4, TR9. |
| Hugo | hoy, sin convivir | AM16, AM13 | Por donde corresponde. |

Lo que hace grave esto no es la cuenta: es que la vida de Chela **es** eso. Su título de libro es "Tres Veces Mujer" (LE7); la pregunta de su hija (FAM1) es *"¿de cuál de tus tres casamientos tenés el mejor recuerdo?"* y contesta Alberto, "lo mejor que viví en un matrimonio". El libro va a tener el casamiento en el juzgado con Raúl con vestido y todo, y de los catorce años con Alberto solo lo que ella logró meter en un cierre y en el bloque de las pérdidas. La única pregunta de la entrevista que le preguntó por los tres casamientos la escribió la familia.

Cómo lo vive Chela: en AM16 ya le contesta *"Ay sí. Ahora estoy con Hugo"* porque la pregunta dice "hoy", pero en AM19 había empezado a contar a Eduardo por su cuenta (*"Me propuso vivir juntos, y después un tiempo me pidió que nos casemos"*) y nadie le siguió el hilo. Después del bloque, cada vez que aparece una rendija (CI6, PE1, PE4, LU4) mete a Alberto. Es una narradora corriendo detrás de una entrevista que no la deja terminar.

**Cuántas veces:** 2 maridos sin pregunta; Alberto traído por ella en 7 respuestas fuera del bloque; Eduardo en 5.

**Arreglo concreto (una pregunta nueva, sin código nuevo):**
- **Pregunta nueva, entre AM16 y AM13**, condición `si:AM16` (solo llega si hubo otro amor después de la primera historia):
  > Y entre esa primera historia y la de ahora, ¿hubo otras que fueron en serio? Un casamiento, alguien con quien viviste años. Este es su lugar, aunque me las hayas nombrado en el repaso: contame de cada una lo que quieras que quede, cómo se cruzaron y cómo terminó. Si no hubo nadie en el medio, decime no nomás.
  
  Con un "no" corto o "paso" no cambia nada más. Para una vida con dos historias (la primera y la de hoy) es un "no" y sigue; para Chela son Eduardo y Alberto en una sola respuesta larga, que es mejor que nada y bastante mejor que el cierre.
- **AM0, quitarle la promesa que no cumple.** *"Después vamos de a una, empezando por la primera que fue en serio."* → *"Después te pregunto más de la primera que fue en serio, y de las que vinieron después también va a haber lugar."*
- Si algún día se hace el plan B (Haiku lee AM0), la pregunta que conviene sumar es *"¿cuántas historias fueron en serio?"*: con más de dos, la pregunta nueva de arriba llega siempre, sin depender de AM16.

### N2. "Se conocieron", "esa persona", "esa historia": ¿de quién habla? (media)

Después de un repaso con cuatro nombres, el bloque nunca vuelve a decir de quién está preguntando.

| ID | Mensaje exacto | Qué le pasó a Chela |
|---|---|---|
| **AM1** | "Contame el día que se conocieron. ¿Dónde fue, quién los presentó o cómo se cruzaron?…" | Contesta: *"¿Cuál de todos? Porque tengo un par. Pero bueno, te voy a contar de Raúl, el primero de verdad."* Adivinó bien porque AM0 lo había dicho un mensaje antes, pero entre medio vino "Anotado. Sigo con otra." y la pregunta no re-ancla. |
| AM3, AM8 | "¿cómo decidieron armar la vida juntos…" / "un solo momento con esa persona" | Sigue con Raúl, sin que nadie se lo confirme. |
| **AM16** | "Si después de esa historia hubo otro amor, contame del que compartís hoy, o del último…" | Llega después de AM19, donde ya había pasado a Eduardo. "Esa historia" ahora puede ser Raúl o Eduardo. Se salvó porque dice "hoy". |

**Cuántas veces:** 1 confusión dicha en voz alta (AM1), 4 preguntas que dependen de un "esa" que quedó lejos.

**Arreglo (textos):**
- **AM1:** "Vamos a la primera que fue en serio, la que me nombraste primero. Contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron. ¿Y qué fue lo primero que te llamó la atención de esa persona?" (Sigue sirviendo si hubo una sola.)
- **AM16:** "Y la persona con la que compartís la vida hoy, o la última que hubo: contame el día que se conocieron y un momento de los dos que te haya quedado. Si después de aquella primera historia no hubo nadie más, decime no nomás." Saca el "esa historia" del arranque y deja la salida al final, como las demás.
- El acuse después de AM0 es una rotación cualquiera (le tocó M3.3, "Anotado. Sigo con otra."). Si AM1 arranca con "Vamos a la primera…", con eso alcanza: no hace falta acuse especial.

### N3. Se adelanta y la entrevista la hace contar lo mismo tres veces seguidas (media)

Chela es de las que contestan la pregunta y las dos siguientes. En AM1 ya contó el casamiento (*"Fue en 1977… nos casamos en el juzgado con dos testigos, nada de boda"*). AM3 se lo pidió de nuevo (*"Nos fuimos al juzgado con dos amigos… un día gris"*). AM4 se lo pidió por tercera vez (*"El día que nos casamos en el juzgado fue en 1977, un día… nublado"*). Tres preguntas seguidas, la misma escena, y ninguna con la puerta de salida que sí tienen TR8 y PA1.

Esa puerta **funcionó las dos veces** en esta charla: TR8 (*"Si ya me lo contaste, con decírmelo alcanza"*) → *"Ya te conté bastante de la boutique, así que creo que está."*; PA1 (*"Si sentís que ya me lo contaste, decímelo"*) → contó otra cosa. Es la prueba de que la salida escrita en la pregunta alcanza, sin modelo.

Lo mismo pasó con AM19 → AM16: en AM19 contó a Eduardo entero (conocerse, convivir, casarse) y AM16 ya no tenía dónde preguntar por él (ver N1). Y con HI0 → HI2b: en HI0 dio los tres hijos con año de nacimiento y HI2b le preguntó *"¿Tuviste más hijos?"* (ya anotado como plan B; acá solo cuento).

**Cuántas veces:** el juzgado 3 veces en 4 preguntas; Eduardo contado donde no había pregunta; HI2b después de la lista completa.

**Arreglo (textos, compatible con lo propuesto en S1 para AM3/AM4):**
- **AM3**, al final: "…Contame ese momento: dónde estaban, qué se dijeron. **Si ya me lo contaste recién, con decírmelo alcanza.**"
- **AM4**, al final: "…lo que más te quedó. **Si ese día ya me lo contaste, decímelo y seguimos.**"
- Regla de código en una línea: en AM3 y AM4 (y en HI2b, si se toca), un "ya te lo conté" corto cuenta como "no" corto para el acuse (va M25, no "Guardado, te mando la próxima").

### N4. La foto prometida queda en el aire (leve)

FO1: Chela contesta *"Te voy a mandar una por WhatsApp después, cuando la encuentre… Te las mando, no te preocupes."* El biógrafo: *"Gracias, Chela. Ya lo guardé."* y LE9. El mensaje final (FIN) tampoco dice nada de fotos. Ella prometió mandar una y nadie le dijo si puede, ni cómo, ni hasta cuándo. El flujo sí lo permite (el álbum se completa hasta que se escribe el libro), pero la narradora no lo sabe.

**Arreglo (texto):** una frase en FIN, después de "Antes de escribirlo vas a poder repasar lo que contaste": "**Y si te quedó alguna foto por mandar, mandámela por acá cuando la encuentres: entra igual.**"

### N5. Dos salidas iguales seguidas (leve)

AM19 termina *"Si no hubo un tiempo así, decime no nomás."* y AM16, la siguiente, *"Si no lo hubo, decime no nomás."* Dos preguntas seguidas con la misma coletilla, después de AM9 con sus tres avisos (S6). Con el texto nuevo de AM16 (N2) queda una sola forma.

---

## 2. Lo que se repite de S1–S6

| Hallazgo | Otra vez, dónde | Veces |
|---|---|---|
| **S1** (bloque del amor no armado para esa vida) | Solo AM14: *"no fue el de toda la vida"* para alguien que tuvo tres; contestó Martín sin problema. El texto propuesto en S1 para AM14 ("aunque haya durado poco o no haya llegado a nada") le sirve igual a Chela. | 1 |
| **S2** ("no"/"paso" con explicación) | JU8 *"Paso, porque ya te conté que me fui de Mendoza…"* (35 palabras) → M3.8 "Escuchado" (sin consecuencia: JU10/JU11 son extra); CI10 *"Paso, creo que está todo…"* (22) → M24.1 **"Eso también va al libro"**; CI11 *"Creo que está, la verdad…"* (no arranca con palabra de "no") → M24.2 "Anotado, gracias"; CI13 *"No, creo que está todo…"* (19) → M24.3 "Lo sumo a lo que ya me contaste"; CI14 *"No, creo que ya dije todo…"* (15 justas, el tope es "menos de 15") → M24.4 **"Cada detalle que agregás suma"**. Sí entendió CI7 (12) y CI12 (10). Con la regla de S1 ("paso" = primera palabra; "no" en cierres hasta 40) se entienden 4 de las 5; CI11 ("Creo que está") queda para la simulación 6. | 5 de 7 |
| **S3** (abren tema sonando sordas) | CA6 *"¿Tuviste hermanos?"* (nombrados en OR1, CA1, CI1, CI2); JU8 (ella: *"ya te conté"*); HI0 *"¿Tuviste hijos?"* (Julián, Paula y Federico en AM0, AM8, AM9, AM19, HS…); HI8 (los nietos ya en HI0 y CS1). Más HI2b (plan B). | 4 (+1) |
| **S4** (acuses M3 fríos tras algo pesado) | M3.3 "Anotado. Sigo con otra." después de AM0 (el repaso termina con la muerte de Alberto); M3.5 "Guardado, Chela. Te mando la próxima." después de PG1 (la muerte del papá: *"mirá cómo estoy, Chela, ya no soy el viñatero"*), el mismo caso exacto de Nelly; M3.4 después de HG4 (Alberto muerto en pandemia sin velorio). | 3 |
| **S5** (la misma historia varias veces) | La separación de Raúl: AM9, AM19, GI2, DE1, HS1, AY1 (6). La muerte de Alberto: AM0, CI6, PE1, PE4, HG4 (5; pero ver N1: acá la repetición es la única forma que tuvo de contarlo). La muerte de la mamá: JU17, CI5, PG1, PE1 (4). El día que abrió la boutique: TR5 y GI1, casi calcadas (2). El nacimiento de Julián: AM8 y HI2 (2). Bloque 13: GI1 = TR5, GI2 = AM9. La salida "si ya me la contaste" en GI1/GI2 (aprobada) baja dos. | 5 historias |
| **S6** (detalles) | M1 más la salida interna en AM0, HI0, HI8; en AM9 tres avisos. Bloque 11: AV11 + tres M1 seguidos. M15 *"Esta pregunta te la hace tu familia."* y la firma *"Paula"* pegada al final de la pregunta. CI1 *"de antes, la de antes"*. CI8 *"este tema"*. | todas |

Lo que **anduvo bien** y vale anotar: los acuses sobrios M4 cayeron todos donde correspondía (CA17, AD15, JU17, TR11, AM9, PE1, PE5, PE4); AM19 y AM13 fueron las preguntas correctas para esta vida; TR8 y PA1 con su puerta de salida se leyeron como charla; TR9 (*"¿Ya dejaste eso…? Si seguís, con decírmelo alcanza"*) también.

---

## 3. Errores del modelo que hizo de Chela (para la simulación, no son fallas de la entrevista)

- **Fechas cruzadas:** en HG1 *"El Mundial del 78, cuando éramos muy chicos todavía en Mendoza"*; en 1978 tenía 23, vivía en Buenos Aires y parió a Julián el 15 de junio, en pleno Mundial. Alberto muere "en el 2019" (AM0, CI6, PE1) pero en HG4 *"estaba en el hospital"* el primer día de la cuarentena y *"murió durante la pandemia"*. El tango empieza "a los cuarenta y tantos, después que cerré la boutique" (PA1), pero la boutique abrió a los 35 y duró quince años.
- **Nombres reciclados:** don Julio es el almacenero de Mendoza (CA6) y el dueño de la tienda de Buenos Aires (TR1). La nieta se llama Paula como su hija (HO2) y después dice *"mis hijas, Paula"* (CO1). *"Mis hermanas del grupo de teatro"* (AD5), con tres hermanos varones.
- **Se le escapa el idioma:** "After, los meses" (HG4), "something simple" (HO1), "respirer", "cuité" (HO5), "checando" (CA3), "voltié", "refrescos", "aquí" tres veces. Palabras inventadas: "actriza" (×2), "sospechchar", "finiquitué", "guaré", "una boluda" por "una boludez", "Pasé hambre de historias" (CI13).
- **Largo parejo otra vez:** casi todo entre 150 y 220 palabras; las únicas cortas son TR8 y los cierres. Mejor que Nelly (hay "no" de una línea), pero una charlatana de verdad manda tres audios en AM0 y uno de diez segundos en FI6.
- El "mezcla épocas" de la ficha no se vio: contesta ordenada, casi prolija. Hubiera servido más una Chela que en AM1 arranca por Alberto y vuelve a Raúl.

---

## 4. Veredicto

**Para Chela, la entrevista funciona en catorce bloques y falla en el que es su vida.** El bloque del amor promete "de a una" y cubre la primera y la de hoy: dos matrimonios de diez y catorce años entran al libro solo por los cierres y por el bloque de las pérdidas, y la única pregunta que le preguntó por los tres casamientos la mandó su hija.

Se arregla con una pregunta nueva después de AM16 ("¿hubo otras en serio en el medio?", con `si:AM16`), AM1 y AM16 que digan de quién hablan, y la puerta "si ya me lo contaste" en AM3/AM4, que en TR8 y PA1 demostró que anda sola, sin modelo. El resto es S2 (5 de 7 "no"/"paso" no entendidos, sin consecuencia en el flujo esta vez) y los mismos S3–S6 de siempre.
