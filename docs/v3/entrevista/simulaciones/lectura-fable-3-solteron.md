# Lectura de Fable: simulación 3 (Aníbal, 77, solterón, inventado)

**Qué es:** Fable (como agente, voz de biógrafo) leyó entera la charla de [`3-solteron.md`](3-solteron.md) el 30/09/2026, como la viviría Aníbal y como un biógrafo con oficio, y marcó lo **nuevo** respecto de la simulación 1. Lo que ya estaba en [`hallazgos.md`](hallazgos.md) (S1–S6) solo se cuenta. No tocó ningún otro archivo. **Nada de esto está decidido: decide Naza.**

Aníbal es la vida para la que se armó el "no": sin pareja que haya llegado a algo, sin hijos, sin nietos, sin mudanza, sin negocio, sin campo. De sus 105 respuestas, 24 a preguntas de historia arrancan con "no" o "nada", y 14 de 14 cierres los contestó "No, está. Paso.". Con eso se ve bien dónde el código lo entiende y dónde no.

---

## 1. Fallas nuevas (de la más grave a la más leve)

### N1. El bloque de los hijos le llega entero a un hombre sin hijos (grave)

Contestó HI0 "No, nunca tuve hijos. No se me dio, qué sé yo. Tengo sobrinos…" (45 palabras). El código lo tomó como "sí" y le mandó **las seis preguntas de hijos y la de nietos**, una atrás de otra. Aníbal contestó "No tengo hijos. Paso." tres veces seguidas, y ni así se cortó: HI8 no depende de nada.

| ID | Mensaje exacto del biógrafo | Qué contestó Aníbal |
|---|---|---|
| **HI2** | "Lo tengo. Vamos con otra. / ¿Y el día que llegó tu primer hijo? Contame ese día como si lo estuvieras viendo: dónde fue, quién estaba, y el momento en que lo tuviste en brazos por primera vez." | "No, no hay ese día. Como te dije, nunca tuve hijos. No pasó en mi vida." (16 palabras: una más del tope) |
| **HI2b** | "Listo, quedó guardado. Sigo. / ¿Tuviste **más** hijos, o hay alguien más que sentís que criaste o cuidaste como propio?…" | "No, no hay historias de esas en mi vida." |
| **HI3** | "Escuchado. Vamos por la siguiente. / ¿Cómo era **cada uno** de chico? El carácter, las mañas…" | "No tengo hijos. Paso." |
| **HS1** | "Gracias, Aníbal. Ya lo guardé. / ¿Cómo viviste la crianza de tus hijos? ¿La llevaste solo…?" | "No tengo hijos. Paso." |
| **HI6** | "Te escuché. Vamos con la que sigue. / Contame una vez que se te hinchó el pecho por uno de tus hijos…" | "No tengo hijos. Paso." |
| **HI8** | "Anotado. Sigo con otra. / Ahora, los nietos. ¿Llegaron nietos a tu vida?…" | "No, no tengo nietos. No tengo hijos, así que no hay nietos tampoco." |
| **CI8** | "Gracias, Aníbal. / Con esto cerramos este tema. ¿Quedó alguien o algo que no tuvo su pregunta? Un cumpleaños, una charla en la cocina…" | "No, está. Paso." |

**Qué le pasó a él:** el bloque 8 fueron 9 turnos; 7 los contestó "no". Lo único que tenía para contar ahí (la muerte del papá, los años con la mamá) lo dio en PG1, y de ahí en adelante fueron siete veces decir que no tiene lo que la pregunta da por hecho. "¿Tuviste **más** hijos?" después de "no hay ese día" y "¿cómo era **cada uno**?" después de "nunca tuve hijos" son las dos que más duelen: no es que el biógrafo se equivocó, es que no escucha. Y la única pregunta del tema que sí era para él, **HI10** ("¿Algún chico o joven fue importante en tu vida?", pensada justo para los sobrinos, y Martín es quien le regaló el libro), **nunca llegó**, porque va solo si HI0 fue "no".

**Cuántas veces:** 6 preguntas que no encajan + 6 acuses que agradecen un "no" (ver N2) + 1 que faltó. Es lo mismo que S1 en el amor, pero en los hijos es peor: en el amor él tenía a Norma para contestar; acá no tenía nada.

**Arreglo concreto (tres reglas de código, o los botones de Naza):**
1. **Un "no" en la primera del tema cierra el tema.** Si HI2 (la primera que depende de HI0) se contesta con un "no" corto o "paso", HI2b, HI3, HS1 y HI6 no van, y va HI10. Con lo que dijo Aníbal en HI2 (16 palabras) tampoco alcanza, así que va junto con la 2.
2. **En HI0 y HI8, un "no" cuenta hasta 40 palabras**, como propuse para los cierres (S2). Acá el "no" largo no trae una historia: trae una explicación ("no se me dio") y un consuelo ("tengo sobrinos"). Nadie dice "no" seco a "¿tuviste hijos?".
3. **HI8 pasa a depender de HI0** (`si:HI0`): sin hijos ni criados no hay nietos. Y **HI2b pasa a depender de HI2**, no de HI0: "¿tuviste más?" solo después de que hubo uno.

Los botones de WhatsApp que propuso Naza resuelven 1 y 2 de raíz en HI0 y HI8; la 3 hace falta igual.

---

### N2. El acuse agradece el "no" en las preguntas comunes (media)

En los cierres y en las sensibles ya está resuelto: un "no" corto o "paso" lleva el neutro M25 ("Bien, seguimos."). Pero en **cualquier otra pregunta** un "no" corto sigue llevando un M3 de la rotación, y M3 agradece un contenido que no hubo. El código sí entendió estos "no" (son cortos); lo que falla es el acuse.

| ID | Lo que dijo Aníbal | Acuse exacto que recibió |
|---|---|---|
| HI3 | "No tengo hijos. Paso." | "Gracias, Aníbal. Ya lo guardé." |
| HS1 | "No tengo hijos. Paso." | "Te escuché. Vamos con la que sigue." |
| HI6 | "No tengo hijos. Paso." | "Anotado. Sigo con otra." |
| HI2b | "No, no hay historias de esas en mi vida." | "Escuchado. Vamos por la siguiente." |
| HI8 | "No, no tengo nietos. No tengo hijos, así que no hay nietos tampoco." | "Gracias, Aníbal." (M26, porque sigue el cierre) |

**Qué le pasó a él:** "Gracias, Aníbal. Ya lo guardé." de "no tengo hijos". ¿Guardó qué? Es el mismo efecto que S2 ("Cada detalle que agregás suma" después de "no"), pero acá el código **sí** entendió el "no" y lo agradeció igual: no es un problema de reconocer, es de la regla del acuse. Además, "Paso" como **última** palabra no vale como paso (tiene que ser la primera), así que tampoco llegó el "Dale, la salteamos" (M21), que hubiera sonado bien.

**Cuántas veces:** 5 en esta charla (todas en el bloque 8). En una vida con muchos "no" pasaría en cualquier bloque.

**Arreglo (una línea de código):** en `mensajesDespues`, la regla que hoy vale para cierres y sensibles ("no" corto o "paso" → M25) vale para **todas** las preguntas: `if (esPaso(r) || esNoCorto(r)) return ['M25']` antes de elegir M3. Y en `esPaso`, contar también "paso" como **última** palabra de una respuesta de 8 o menos ("No tengo hijos. Paso." → M21 "Dale, la salteamos. Vamos con otra.").

---

### N3. "El primer lugar que fue tuyo" para alguien que nunca se fue de la casa (media)

| ID | Mensaje exacto | Qué contestó |
|---|---|---|
| **JU1** | "¿Te acordás del día que te fuiste de la casa de tus viejos?… Y si te quedaste ahí muchos años, contame cómo era esa casa con vos ya de grande." | "No, la verdad que no. Nunca me fui. Después de la colimba volví a casa de mis viejos, y cuando se fueron muriendo, me quedé viviendo acá, en la misma casa de siempre." |
| **JU12** | "Escuchado. Vamos por la siguiente. / Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue?" | "No, la verdad que no. Siempre fue la misma casa de mis viejos. Después ellos se fueron muriendo, y la casa siguió siendo la mía…" |

**Qué le pasó a él:** JU1 tiene su salida y la usó; contestó lo que había que contestar. Siete preguntas después, JU12 le pregunta lo mismo sin salida, y tuvo que volver a decir "nunca me fui". Para un hombre que vivió 77 años en la misma casa, "el primer lugar que fue tuyo" es la casa de sus viejos el día que se murió su mamá, y eso sí es una historia; la pregunta no la deja entrar.

**Cuántas veces:** 1 pregunta, pero es la segunda vez en el mismo bloque que le dicen "cuando te fuiste".

**Arreglo (texto nuevo, mantiene todo lo demás):**
> Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue? **Si nunca te fuiste de la casa de tus viejos, contame el día en que esa casa pasó a ser tuya, o el rincón de ahí que siempre fue tuyo.**

O regla de código: JU12 no va si JU1 fue "no" corto (con la salida de texto alcanza y es más cálida).

---

### N4. Cuidar a la madre hasta el final no tiene pregunta (media-leve)

Aníbal vivió con su mamá hasta los 49 y la cuidó hasta que murió. En LE1 dijo que es "lo que más orgullo me da, más que cualquier otra cosa". En toda la entrevista, lo único que lo roza es PG1 ("una vez que los notaste más viejos… Si no los tuviste cerca, contame cómo fue eso"), que él contestó con las dos muertes en 90 palabras, y recibió:

> "Guardado, Aníbal. Te mando la próxima. / Ahora vamos a los hijos. ¿Tuviste hijos…?"

CS1 nombra "cuidar a alguien" entre las cosas que uno hace bien y nadie paga, pero como ejemplo suelto entre cocinar y tener la casa andando; Aníbal se fue al club. Y AS9 (la cena) no le pidió a nadie que ya no está.

**Qué le pasó a él:** el capítulo central de su vida adulta (los años de a dos con la madre, la casa, la enfermedad, el después) quedó repartido en migas: PG1, PE1, GI1, FI1, LE1. El libro va a tener la muerte cinco veces y el cuidado ninguna.

**Cuántas veces:** es una ausencia, no una repetición. Aparece en cualquier vida donde alguien cuidó a un viejo (la mitad de los narradores de 60+).

**Arreglo (texto, PG1):**
> Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. **Y si te tocó cuidarlos, contame cómo era un día de esos: qué hacías por ellos, qué te decían.** Si no los tuviste cerca, contame cómo fue eso.

Y el acuse de PG1 como M26 ("Gracias, Aníbal."), que ya propuse en S4.

---

### N5. Tres acuses sobrios que agradecen "no me pasó nada" (leve; es S2, pero con otra cara)

CA17, AD15 y PE4 son sensibles: si contestó "no" corto va M25; si contó algo, M4. Aníbal contestó "No, la verdad que no. Fue una infancia tranquila…" (33 palabras), "No, la adolescencia fue bien…" (30) y "No, las más duras fueron esas dos…" (36), y recibió:

| ID | Acuse exacto |
|---|---|
| CA17 | "Gracias por contarme esto, Aníbal. Queda guardado con cuidado." |
| AD15 | "Te escuché. Gracias por confiármelo." |
| PE4 | "Gracias por animarte a contarlo. Cuando quieras, seguimos." |

"Queda guardado con cuidado" de "no, fue tranquila". Es S2 (el "no" largo no se entiende), pero lo anoto aparte porque acá la propuesta de S2 (40 palabras solo en cierres y LE9) **no lo cubre**: son sensibles. Propongo que las 40 palabras valgan también en las sensibles: ahí un "no" largo casi siempre es "no, por suerte no" con un consuelo atrás, no una historia.

---

## 2. Lo que se repite de S1–S6

| # | Otra vez, con qué |
|---|---|
| **S1 otra vez** | AM3 ("cómo decidieron armar la vida juntos") → "No, la verdad que no llegamos a eso"; AM4 ("¿hubo uno en que se casaron?") justo después de decirlo; AM16 "No, no. Después de Norma no hubo nada serio…" (33 palabras) → AM13 "la pelea que da risa"; AM14 "no fue el de toda la vida". **4 IDs, el bloque entero.** Agravante: AM13 lo llevó a inventar una pelea de convivientes ("ella se fue a la pieza enojada, yo me quedé en la sala") con una novia con la que nunca vivió. |
| **S2 otra vez** | De 24 "no" en preguntas de historia, el código entendió **5** (HI2b, HI3, HS1, HI6, HI8: los de 13 palabras o menos). Los 19 restantes tienen entre 16 y 60 palabras, siempre "no" + explicación + "qué sé yo". Con consecuencia en el flujo: HI0 (6 preguntas de más), AM16 (AM13), AM3 (AM4). Con acuse que suena mal: CA17, AD15, PE4 (N5). Los 14 cierres sí se entendieron, porque Haiku los dijo cortos; una persona real no (ver S2 en la simulación 1). |
| **S3 otra vez** | CA6 "¿Tuviste hermanos?" después de que Olga apareció en CA1. HI0 y JU8 acá no sonaron sordas: no había nombrado hijos ni mudanza. **1 ID.** |
| **S4 otra vez** | PG1 (la muerte de la mamá, "lo más importante en mi vida") → "Guardado, Aníbal. Te mando la próxima." y abajo "¿Tuviste hijos?". GI9 (la muerte del papá, "me sentí muy chiquito, muy solo") → "Gracias, Aníbal. Ya lo guardé.". HJ1 ("solo en la casa, sin hijos, sin esposa") → "Escuchado. Vamos por la siguiente.". FI1 ("la soledad es mi compañía… desde que se fue mi mamá") → "Te escuché. Vamos con la que sigue.". **4 veces.** En una vida así, cualquier pregunta del bloque 13 vuelve a la madre. |
| **S5 otra vez** | El club: CA16, JU15, CS1, PA1, AS1, HO2, HO5, FAM1 (**8**). La muerte de la mamá: PG1, PE1, GI1, GI9, LE1 (**5**). La rutina "6 y media, taller, club": AM19, TR2, HO1 (**3**, tres preguntas distintas que piden "un día común"). El infarto: AY1, PE5, GI2, FU1 (**4**). Norma: JU17, AM0, AM1, AM3, AM8, AM9, DE1, HJ1, FO1 (**9**, pero acá el bloque del amor la pidió a propósito). Bloque 13: GI2 = PE5 y GI9 = PG1. |
| **S6 otra vez** | M1 repetido bajo AM0, AM9, HI0 y HI8 (en AM9 tres avisos); bloque 11 con cuatro "decí paso" seguidos; M15 "tu familia" y la firma "Martín" pegada; CI1 "de antes, la de antes"; CI8 "este tema". **Los 5 detalles, iguales.** |

Lo que **funcionó** para esta vida, y vale decirlo: JU1 y TR8 con su salida escrita ("si te quedaste ahí muchos años…", "si ya me lo contaste…") lo dejaron contestar sin sentirse afuera; AM19 ("¿hubo un tiempo en que seguiste por tu cuenta?") le sacó la rutina de toda su vida; HJ1 ("lo que no se dio") y FI1 (la soledad) son las dos preguntas donde Aníbal más se contó, y llegaron. LE8 lo hizo hablarle a Olga y a los sobrinos sin que hiciera falta "tu familia" con hijos.

---

## 3. Errores del modelo que hizo de Aníbal (para la simulación, no son fallas de la entrevista)

- **"Qué sé yo" 47 veces en 105 respuestas.** Es la muletilla del personaje, pero un tic por respuesta cansa y aplana; se lee como un guion, no como un hombre.
- **Todas las respuestas miden lo mismo** (50–80 palabras), también los "no". Y los 14 cierres son idénticos: "No, está. Paso." Nadie dice "paso" después de "no"; una persona real contesta "No, creo que ya está todo" y sigue (como Nelly).
- **La cuenta del trabajo no cierra:** TR1 "entré al taller como aprendiz a los 16"; JU2 y TR6 "empecé después de la colimba, en 1969, 40 años" (jubilado en 2009); PE5 "el infarto en 2015… no pude volver al trabajo como antes"; GI2 el día del infarto "desayuné con mi mamá" (murió en 1998).
- **Roberto** es el amigo de la infancia (ES5) y también el amigo que "conociste de grande, a través del club" (AS1).
- **AM13:** inventó una pelea de casa compartida con Norma, con quien nunca vivió (inducido por la pregunta, pero contradice AM4).
- Anglicismos y tropiezos: "checkaba mi máquina", "eso era lo que me ansiaba", "metí miedo", "creés" por "crecés".
- FAM1: "Sí, boludo, eso es verdad" al sobrino que le regaló el libro; y "pelotudo" en ES6. Puede ser el personaje, pero no es un tornero de 77 hablándole a un biógrafo desconocido.

---

## 4. Veredicto

**No, todavía no para esta vida, y por lo mismo que para Nelly: el "no" con explicación.** A Aníbal le llegaron seis preguntas sobre hijos que no tiene, cuatro sobre una convivencia que no hubo, y el biógrafo le dijo "Gracias, ya lo guardé" a "no tengo hijos".

Se arregla con poco: un "no" en la primera del tema cierra el tema, HI8 depende de HI0 (o los botones de Naza en HI0 y HI8), y el "no" corto lleva acuse neutro en todas las preguntas, no solo en cierres y sensibles. Con eso el bloque 8 le queda en PG1, HI10 y el cierre, que es lo que su vida tiene.

Lo demás es oficio: una salida en JU12 para quien nunca se fue, y una frase en PG1 para quien cuidó a sus viejos, que es la historia más grande de Aníbal y la única que el libro no le pidió.
