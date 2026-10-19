# Vitácora Kids · «Mi Primer Capítulo» · El proceso de punta a punta (vigente, 05/10/2026)

Cómo funciona la entrevista del chico, de la compra al libro. Los textos exactos están en:
- [`banco.md`](banco.md): las 47 preguntas (K1…K47), otras puertas, fotos, extras, entradas y cierres, y los mensajes del banco (B-…).
- [`mensajes.md`](mensajes.md): todos los demás mensajes fijos (bienvenidas, acuses, recordatorios, final, compra, guía del panel).

Acá solo se citan por ID. Lo que el diseño no define o se contradice está al final, en **Huecos que encontré**.

**(05/10)** Actualizado con la revisión de Fable leída como el chico (`paso-4-revision-fable.md`, aprobada por Naza salvo la 18) y las decisiones de los huecos (`paso-4-huecos-decisiones.md`). Cada cambio lleva "(05/10)".

Reglas de fondo: **banco fijo** (ningún modelo escribe ni decide durante la entrevista; solo se transcriben los audios) · **nunca se traba** (cada botón lleva a lo siguiente) · **no prometemos tiempo** · **al chico nunca se lo reta** · **el padre ve todo** en el panel, también la cápsula · nada de lo que el bot le dice al chico dice que le gusta, le alegra o guarda algo "con cariño" · **nada de noche** (05/10): no se manda nada entre las 22 y las 9, hora del país del número.

## 1. La compra (web, tres pantallas)

| Pantalla | Qué se guarda | Para qué |
|---|---|---|
| **1. Vos** (COMPRA-1) | Nombre del padre | {{1}} en todo lo que le llega al padre (solo el primer nombre, 05/10) |
| | WhatsApp del padre | Recordatorios, avisos; en canal B, también las preguntas |
| | Correo | Entrar al panel |
| **2. Quién cuenta** (COMPRA-2) | Nombre del chico | Tapa; {{2}} en lo que le llega al padre |
| | Cómo le dicen | {{1}} en BIEN-CHICO, PREG-NUEVA-CHICO, FINAL-CHICO |
| | Chico o chica | `{{o/a}}` en las preguntas |
| | Edad | Tapa ("Capítulo Uno: 11 años") |
| | Quién se lo regala (+ plural si empieza con "Tus") | {{2}} en BIEN-CHICO / BIEN-CHICO-PL y FINAL-CHICO / FINAL-CHICO-PL. Se guarda en minúscula ("tu mamá", 05/10) |
| | Canal: A (su WhatsApp, + su número) o B ("lo hago yo") | A dónde van las preguntas. Elegir A es la autorización del adulto a cargo. |
| | Hora (por defecto 18:00) | A qué hora sale la pregunta del día |
| **3. Temas y pago** (COMPRA-3) | Temas que no se tocan | Sacan preguntas (tabla en `mensajes.md` §8) |
| | Fotos con otros chicos (apagada) | Si no se marca, esas fotos quedan fuera del libro. Naza mira el álbum antes de imprimir (05/10) |
| | Pago | — |

Después de pagar: correo para entrar al panel (COMPRA-3-DESPUES; igual que el resto de la casa, 05/10) y arranca el canal elegido.

## 2. El arranque

**Canal A · WhatsApp del chico**
1. **BIEN-CHICO** (o **BIEN-CHICO-PL**) al chico. Plantilla.
2. **AVISO-PADRE** al padre, con el link del panel. Plantilla.
3. El chico toca [Dale, vamos] → **ENTRADA-1** → **K1**. Desde acá, la ventana de 24 h está abierta.
4. Si no toca nunca el botón: a los 4 días, RECORD-A-4 al padre (ver §8).

**Canal B · "Lo hago yo"**
1. **BIEN-PADRE** al padre. Plantilla. (No va AVISO-PADRE.)
2. Con el chico al lado, el padre toca [Estamos listos] → **ENTRADA-1** → **K1**.
3. Desde ahí, todo llega al número del padre; el chico lee, graba y toca los botones.
4. **(05/10)** Cada pregunta llega al tocar [Estamos listos] (aviso + botón, PREG-NUEVA-PADRE).

## 3. Un día típico

| Paso | Qué pasa | Mensaje |
|---|---|---|
| 1 | A la hora elegida sale la pregunta que toca. Si cambia de capítulo, antes va la entrada. Si es K39, antes va el aviso de la seria (05/10: ya no antes de K31). | K…, ENTRADA-N, B-AVISO-SERIA |
| 1b | Si pasaron más de 24 h desde su último mensaje, en lugar de la pregunta sale la plantilla, y la pregunta cuando toca el botón. Sale **una sola vez** por pregunta (05/10). | PREG-NUEVA-CHICO (A) · PREG-NUEVA-PADRE (B) |
| 1c | **No se acumulan (05/10):** si no contestó, espera esa misma pregunta; no sale otra encima. Quedan los recordatorios al padre (§8). | — |
| 2 | Contesta con un audio (o escrito). | — |
| 3 | Si contestó muy corto (lo mide el código), sale **una sola vez** la otra puerta de esa pregunta. Una OP usada no vuelve como extra. | OP de K… (banco.md) |
| 4 | Acuse, rotando. | ACUSE-1…7 (reglas de rotación en `mensajes.md` §3) |
| 5 | Si la pregunta tiene foto pegada, sale la foto. | Foto de K… (banco.md) |
| 5a | Manda la foto → acuse de foto. | ACUSE-FOTO-1…3 |
| 5b | Toca [No tengo] → le ofrece contarlo en audio, una sola vez; si no manda nada, sigue. | B-FOTO-NOTENGO (en K29, B-FOTO-PLATA) |
| 5c | Foto con botón propio ([No hago], [De ninguno], [No miro]) → sigue. | B-NO-PASA-NADA |
| 5d | Foto de la comida (K24): [Hoy no la como] → la foto ya le pide contar la última vez que la comió (05/10). | — |
| 6 | Ofrece seguir. **Después de cada principal, siempre (05/10)**, salvo la última del capítulo (ver §4) y K47. | B-SEGUIR |
| 6a | [Dale, otra] → sale la siguiente en el momento y vuelve al paso 2. | — |
| 6b | [Mañana sigo] → hasta mañana. | B-MAÑANA |
| ~~6c~~ | ~~Llegó a 3 principales en la sentada → corta.~~ Sin tope (Naza, 05/10). | — |

- **Orden después de una respuesta (05/10):** OP (si fue muy corta) → acuse → foto pegada → seguir.
- **Mínimo una principal por día**, a la hora elegida. Si tiene ganas sigue en el momento, **sin tope** (05/10).
- **Botones de "no" dentro de la pregunta** (K12, K13, K16, K18, K20, K25, K38): cada rama está en banco.md; los de "no aplica" llevan a B-NO-PASA-NADA y sigue.
- **Pasar (05/10):** todas las principales llevan [Paso] → B-PASO y sigue. K10, K11 y K39 tienen [Esta la paso] y K41 [Esta no, gracias], con la misma respuesta.
- **Temas sacados en la compra:** esas preguntas y sus extras no salen; se pasa a la siguiente. Si tenían foto pegada, la foto queda y pasa a la siguiente principal del capítulo que no tenga foto (05/10).
- **Algo preocupante (05/10):** si salta la lista de palabras, ese día solo un acuse sobrio (los del día feo), sin foto ni seguir, y marca a Naza (§11).
- **Nombres:** se piden dentro de la pregunta; los corrige el padre en el panel.

## 4. Capítulos

| Momento | Qué pasa | Mensaje |
|---|---|---|
| Al empezar | Entrada del capítulo, pegada a su primera pregunta. | ENTRADA-1…5 |
| Después de la última principal (caps. 1 a 4) | **No sale "seguir" (05/10).** Se ofrece **una** extra de ese capítulo. En el cap. 4, si ya salió K39, solo las dos extras livianas. | B-UNA-MAS → [Dale, otra] una extra · [No, cerramos] |
| Al cerrar | "¿Quedó algo…?" con botones (05/10). | CIERRE-1…4 → [No, eso fue todo] sigue sin acuse · [Sí, hay algo] espera y acusa normal |
| Después del cierre | Recién ahí "seguir"; [Dale, otra] trae la entrada del capítulo siguiente y su primera pregunta (05/10). | B-SEGUIR |
| Después de K47 | Directo al cierre final, sin B-UNA-MAS ni B-SEGUIR (05/10). | CIERRE-FINAL (§9) |

Orden: dentro de cada capítulo, las ★ primero (salvo K14 antes de K15 y el cap. 5 en orden del borrador). Cápsula: "pueden ir seguidas".

## 5. La seria (capítulo 4)

1. **Solo antes de K39** (05/10; ~~antes de K31~~ ya no, era la anécdota graciosa), pegado a la pregunta (no al día): **B-AVISO-SERIA** → [Voy ahora] sale la pregunta · [Mañana mejor] **B-MAÑANA** ("Ya está por hoy, mañana hay más.", 05/10) y queda para mañana.
2. **K39, el día feo:** sin otra puerta. Acuse propio (**B-DIAFEO-ACUSE**), que espera un silencio largo porque puede mandar varios audios. Los acuses nunca dicen "mañana seguimos".
3. **Después de K39 (05/10):**
   - **Si contó:** **B-TRANQUILA** → [Dale, una tranquila] sale **K40** · [Mañana sigo] **B-MAÑANA** (K40 sale al día siguiente).
   - **Si la pasó:** B-PASO y **K40 directo**, sin oferta.
4. "Una más antes de cerrar" del cap. 4, si ya salió K39: solo las dos extras livianas ("tan raro que nadie te creyó" y "el día más largo").

## 6. Temas que saca el padre

Se marcan en la compra (COMPRA-3-TEMAS) y no se cambian después (ver Huecos). Tabla de qué saca cada uno en `mensajes.md` §8. K39 y K41 no se sacan: tienen botón para pasar. La separación no es tema.

**(05/10)** Si la pregunta sacada tenía foto pegada (mascota en K10, deporte en K11, la cosa más vieja en K13), la foto queda y pasa a la siguiente principal del capítulo que no tenga foto. Abuelo que murió saca K13 pero no K14, a propósito. La extra "te cubrió para que no te retaran" ya no es sacable.

## 7. Preguntas propias del padre

| Qué | Cómo |
|---|---|
| Dónde las escribe | En el panel (PANEL-GUIA, PANEL-CASILLA). Hasta 3, con sus palabras. |
| Hasta cuándo | Hasta que empieza el capítulo 4. Después no se agregan ni se cambian. |
| Cuándo le llegan al chico | Entre el capítulo 4 y la cápsula. |
| Con línea | **PADRE-PREG-LINEA** (o **-PL**) pegada antes de cada una. |
| Sin línea | Si el padre marcó "sin decir que es mía": la pregunta llega sola, en el mismo lugar. |
| Botones | [Esta la paso] → B-PASO. Sin otra puerta. |
| Acuse | Como las demás (ACUSE-1…7). |
| ~~Tope~~ | Sin tope (05/10). |

## 8. Recordatorios (silencio)

| Cuándo | Canal A | Canal B |
|---|---|---|
| 4 días sin respuesta | **RECORD-A-4** al padre | **RECORD-B** al padre, con [Estamos listos] |
| 8 días sin respuesta | **RECORD-A-8** al padre | **RECORD-B-8** al padre, con [Estamos listos] (05/10) |
| Después | No se le escribe más al padre. Marca para Naza en el panel; lo mira una persona. | Igual |

Al chico nunca se le manda un recordatorio ni se lo reta. El aviso PREG-NUEVA-CHICO sale una sola vez por pregunta (05/10), no es un recordatorio.

## 9. La cápsula (capítulo 5)

- **ENTRADA-5** → K41 a K47 (pueden ir seguidas). K41 tiene [Esta no, gracias] → B-PASO.
- Acuses sin el 3 ni el 6 (van al sobre, no al libro): ver `mensajes.md` §3.
- Las respuestas van en un sobre pegado al impreso y en un PDF aparte, no en el cuerpo del libro. El padre las ve en el panel.
- Después de K47, directo a **CIERRE-FINAL** (banco.md, texto nuevo del 05/10), sin B-UNA-MAS ni B-SEGUIR. Lleva los botones [No, eso fue todo] [Sí, hay algo] (05/10).

## 10. El final

| Paso | Qué pasa | Mensaje |
|---|---|---|
| 1 | Después de CIERRE-FINAL ([No, eso fue todo], o lo que cuente con [Sí, hay algo] y su acuse; si no contesta, sale igual): oferta de extras. Si pasaron más de 24 h, primero PREG-NUEVA (05/10). | EXTRAS-OFERTA |
| 2a | [No, ya está] → mensaje final. | FINAL-CHICO / FINAL-CHICO-PL (05/10) |
| 2b | [Dale, otra] → "va la primera" y una extra. | EXTRAS-SI |
| 3 | Después de cada extra: acuse y "¿otra o lo dejamos acá?". | ACUSE-…, EXTRAS-OTRA |
| 3a | [Dale, otra] → la siguiente extra. Sin tope (05/10). | — |
| 3b | [Lo dejamos acá] → mensaje final. | FINAL-CHICO |
| 3c | **(05/10)** Si no contesta la oferta de extras, a los 2 días cierra solo. | FINAL-CHICO + TERMINO-PADRE |
| 4 | Si se terminan las extras: "Esa era la última…", pegado al final. | EXTRAS-FIN + FINAL-CHICO |
| 5 | Al padre: terminó de contar. Canal A, a la vez. **Canal B, al día siguiente, a la hora de envío** (05/10). | TERMINO-PADRE |
| 6 | Revisión del escritor (lee todo, marca si hay algo preocupante, ver §11) y armado del libro. Naza mira el álbum antes de imprimir (fotos con otros chicos, 05/10). | — |
| 7 | Aviso de libro listo al padre: igual que el resto de la casa (05/10). | LIBRO-LISTO |

Extras: las que quedaron de todos los capítulos (las OP ya usadas no vuelven; "cómo se arreglaron" solo si la pelea de K36 se contó; las de mamá/papá no, si se sacó el tema; las de hermanos, solo si tiene).

## 11. Algo preocupante

- **Decisión de Naza (05/10):** sin modelo que lea cada respuesta. Lo marca **el escritor en la revisión del final del libro**: si encuentra algo preocupante, avisa a Naza **antes de armar el libro**.
- Sigue valiendo el banco: si salta la marca, solo el acuse ese día, aviso a Naza, nada automático a los padres.
- **(05/10, Naza) Lista de palabras en el código** (sin modelo): si salta, ese día solo un acuse sobrio (los del día feo), sin foto ni "seguir", y marca a Naza. Al final el escritor marca igual.
- Abierto: línea con teléfono de ayuda (102 AR, ANAR 116 111 ES); protocolo de Naza; **abogado antes de vender** (LOPIVI en España, Ley 26.061 en Argentina).

## 12. Qué ve el padre en el panel

| Qué | Detalle |
|---|---|
| Todo lo que cuenta | Audios, fotos y respuestas, también las del sobre cerrado (AVISO-PADRE, BIEN-PADRE). |
| Nombres | Los corrige ahí (banco.md · Reglas del flujo). |
| Sus preguntas | Hasta 3, con la casilla "sin decir que es mía", hasta que empieza el cap. 4 (§7). |
| Entrada | Con el correo de la compra (COMPRA-1-CORREO); link en AVISO-PADRE (canal A). |

En el panel de Naza: la marca de 8 días de silencio y la de algo preocupante. Naza mira el álbum antes de imprimir (05/10).

---

## Huecos que encontré

Ordenados de más a menos grave. Cada uno con dónde está y la cita.

### A. Contradicciones

1. **"Pasar" una pregunta: los textos prometen un botón que el banco no tiene.** Solo 4 preguntas tienen botón para pasar (banco.md: "[Esta la paso] (K10, K11, K39) y [Esta no, gracias] (K41)"). Pero:
   - COMPRA-3-DEBAJO (`paso-3-ronda6-compra.md`): "Todo lo demás tiene botón para pasar. Si una pregunta no le gusta, la salta y seguimos."
   - BIEN-CHICO: "Si una pregunta no te gusta o no se te ocurre nada, la pasás y seguimos."
   - BIEN-PADRE: "Los botones también los toca {{2}}, para pasar una pregunta…"
   - `paso-3-ronda5-preguntas-del-padre.md`: "Acuse y [Esta la paso] como las demás" (las demás no lo tienen).
   - `paso-1-metodo.md`: "'Paso' siempre vale".
   
   Falta decidir: ¿todas las principales llevan [Esta la paso]?, ¿o vale escribir/decir "paso" y el código lo reconoce? Hoy, en 43 de 47 el chico no tiene cómo pasar.

   **Resuelto (05/10): botón [Paso] en todas las principales → "Dale, esa la salteamos." (K10, K11, K39 y K41 siguen con el suyo).**

2. **Algo preocupante: la regla del banco no puede cumplirse.** banco.md (Reglas del flujo): "si salta la marca, solo el acuse; nada más ese día (ni foto, ni seguir), y aviso a Naza". `paso-3-algo-preocupante.md` decide que se detecta recién en la revisión del final y dice "Sigue valiendo lo aprobado en el banco". Sin lista de palabras ni modelo, **nada hace saltar la marca durante la conversación**: después de "me pegan" sale igual el acuse "Eso va al libro, con tus palabras", la foto pegada y B-SEGUIR (el caso que Fable llamó "lo peor que puede pasar", `paso-2-cap1-fable-ronda1.md`). Además, avisar recién al final puede ser semanas después.

   **Resuelto (05/10): lista de palabras en el código (sin modelo). Si salta, ese día solo un acuse sobrio (los del día feo), sin foto ni "seguir", y marca a Naza. Al final el escritor marca igual.**

3. **Tope "por sentada" o "por día".** banco.md: "Tope: 3 principales por sentada". `paso-3-ronda5-preguntas-del-padre.md`: "Cuentan para el tope de 3 por día". Tampoco está definido qué es una "sentada" (¿se reinicia a la hora siguiente?, ¿al otro día?), ni si cuentan para el tope las extras de "una más antes de cerrar", las preguntas pasadas o las de la cápsula ("pueden ir seguidas").

   **Resuelto (05/10): sin tope. Se ofrece seguir después de cada principal, siempre. "Ya está por hoy, mañana hay más." queda solo como respuesta a [Mañana sigo] (y a [Mañana mejor]).**

4. **Recordatorio "mismo texto" vs. "ocho días".** `paso-3-ronda3-recordatorio.md` (Cuántas veces): "otro a los 8, mismo texto". `plantillas-meta-kids.md` crea `kids_recordatorio_padre_8` con "Pasaron ocho días" (aprobada después, vale esa). Pero para canal B no hay versión de 8 días: RECORD-B a los 8 días diría "Pasaron cuatro días". Y el título de la plantilla 5 dice "a los 4 y a los 8 días" aunque existe la 5b.

   **Resuelto (05/10): vale la 5b. Agregada RECORD-B-8 (plantilla 6b, "Pasaron ocho días…") y corregido el título de la 5.**

5. **RECORD-B habla de "la pregunta pendiente" y pide tocar el botón "para seguir".** En canal B, ¿la pregunta del día llega directa a la hora o recién al tocar el botón? Si ya llegó, ¿el botón la reenvía? Si nunca tocaron [Estamos listos] de BIEN-PADRE, no hay "pregunta pendiente".

   **Resuelto (05/10): en canal B cada pregunta llega al tocar [Estamos listos] (aviso + botón); el botón de RECORD-B manda la pregunta pendiente.**

6. **Acuse que miente.** ACUSE-3 ("Eso va al libro…") y ACUSE-6 ("…a salvo para el libro") pueden salir después de un "no" al CIERRE-N ("¿Quedó algo…?" → "No"), y después de algo preocupante. La regla de la cápsula los saca en el cap. 5, pero no se dice si cuenta el CIERRE-FINAL, ni las extras del cap. 5 cuando salen en el final (¿van al sobre?).

   **Resuelto en parte (05/10): los cierres llevan [No, eso fue todo] → sigue sin acuse; los acuses que dicen "va al libro" no salen después de un "no" en "¿quedó algo?"; con algo preocupante van los acuses del día feo. Sigue abierto si las extras del cap. 5 que salen al final van al sobre.**

7. **AVISO-PADRE dice "solo te escribimos si pasan cuatro días"**, pero el padre también recibe RECORD-A-8, TERMINO-PADRE y LIBRO-LISTO. ("Mientras tanto" lo salva a medias; si el chico termina, después vienen dos más.)

   **Sigue abierto.**

8. **`pendientes.md` quedó viejo:** las filas 3, 4 y 5 ya se hicieron en el paso 3 y siguen como pendientes ("Paso 3").

   **Resuelto (05/10): filas 3, 4 y 5 hechas en el paso 3 (falta tacharlas en `pendientes.md`).**

### B. Textos que faltan

9. **FINAL-CHICO-PL.** `paso-3-ronda4-final.md`: "con 'tus papás' va una segunda versión en plural". Nunca se escribió ("te lo va a dar {{2}}, que fue quien te hizo" no concuerda en plural).

   **Resuelto (05/10): plural mecánico ("te lo van a dar", "fueron quienes te hicieron"), en `mensajes.md` §7.**

10. **RECORD-B de los 8 días** (ver 4).

   **Resuelto (05/10): RECORD-B-8, plantilla 6b.**

11. **LIBRO-LISTO.** TERMINO-PADRE ("te avisamos cuando esté listo") y COMPRA-1-WA ("cuando el libro esté listo") lo prometen. No hay texto ni plantilla.

   **Resuelto (05/10): igual que el resto de la casa.**

12. **Correo de acceso al panel.** COMPRA-3-DESPUES: "Después de pagar te llega un correo para entrar a tu panel." Sin texto.

   **Resuelto (05/10): igual que el resto de la casa.**

13. **Respuesta a [Mañana mejor]** del aviso de las serias (banco.md solo tiene los botones). ¿Va B-MAÑANA?

   **Resuelto (05/10): "Ya está por hoy, mañana hay más." (B-MAÑANA).**

14. **Plantilla para lo que puede caer fuera de las 24 h al final.** `plantillas-meta-kids.md`: "oferta de extras, mensaje final al chico" van "dentro de la ventana". Pero EXTRAS-OFERTA "si no contesta el cierre, sale igual", y "al otro día" después del tope: si pasaron más de 24 h no se puede mandar, y no hay plantilla. Lo mismo FINAL-CHICO si el chico deja colgada la oferta.

   **Resuelto (05/10): si pasaron más de 24 h, primero PREG-NUEVA-CHICO / PREG-NUEVA-PADRE, y al tocar el botón sale lo que correspondía (pregunta, extras, final). El "al otro día después del tope" ya no existe (sin tope).**

### C. Reglas que el diseño no define

15. **Cuándo se termina si el chico deja de contestar al final.** Si no toca nada en EXTRAS-OFERTA o EXTRAS-OTRA, nunca sale FINAL-CHICO, ni TERMINO-PADRE, ni arranca el armado. Falta un plazo. Lo mismo si se calla para siempre en el medio: después de la marca a Naza (8 días), ¿se arma el libro con lo que hay?

   **Resuelto en parte (05/10): si no contesta la oferta de extras, a los 2 días cierra solo (mensaje final + aviso al padre). Sigue abierto qué pasa si se calla para siempre en el medio.**

16. **Qué pasa con la pregunta sin contestar.** Si a la hora del día siguiente la del día anterior sigue sin respuesta, ¿sale una nueva, se repite la misma o no sale nada? ¿PREG-NUEVA-CHICO sale **todos los días** de silencio (una plantilla por día a un chico de 11, y cada una se paga)? ¿Los recordatorios cuentan desde la última respuesta (Fable, `paso-2-cap1-fable-ronda4.md`: "cuenta desde la última respuesta") y se reinician si vuelve a contestar? ¿Siguen corriendo en la etapa de extras?

   **Resuelto (05/10): no se acumulan; si no contestó, espera esa misma; el aviso de pregunta esperándote sale una sola vez; quedan los recordatorios al padre.**

17. **Canal B, día a día.** BIEN-PADRE dice "Cuando llegue una, buscá un rato tranquilo…" (la pregunta llega sola) y PREG-NUEVA-PADRE dice "tocá el botón y llega". No está escrito si, dentro de las 24 h, la pregunta del día llega directa a la hora elegida.

   **Resuelto (05/10): cada pregunta llega al tocar [Estamos listos] (aviso + botón).**

18. **Orden después de la respuesta.** Banco: la foto "sale después de la respuesta". No está definido el orden exacto: ¿respuesta corta → OP sin acuse, o acuse → OP? ¿Acuse → foto → B-SEGUIR? ¿Cuánto se espera la foto (o el audio después de [No tengo]) antes de seguir? "Si no manda nada, no pasa nada y sigue": ¿después de cuánto?

   **Resuelto en parte (05/10): OP (si fue muy corta) → acuse → foto pegada → seguir. Siguen abiertos los tiempos de espera.**

19. **Varios audios seguidos.** Solo K39 dice que el acuse "espera un silencio largo". En las demás, ¿un acuse por audio o uno al final? ¿Cuánto silencio?

   **Sigue abierto.**

20. **"Muy corto" no tiene número** (segundos de audio, palabras de texto). Lo decide el código, pero nadie lo fijó.

   **Sigue abierto.**

21. **Cierres de capítulo sin botón.** CIERRE-1…4 no tienen botones: si no contesta, ¿cuándo pasa al capítulo siguiente? (El final sí lo resuelve: "sale igual".)

   **Resuelto (05/10): llevan [No, eso fue todo] → sigue sin acuse · [Sí, hay algo] → espera y acusa normal.**

22. **[Mañana mejor] y el mínimo de una por día.** El aviso es "pegado a la pregunta, no al día": si K31/K39 es la primera del día y elige [Mañana mejor], ese día no hubo ninguna principal. ¿Vale? ¿Y al otro día vuelve a salir el aviso?

   **Sigue abierto (ahora solo para K39).**

23. **Orden entrada / aviso en K31.** K31 es la primera del cap. 4: ¿ENTRADA-4 → B-AVISO-SERIA → K31, o al revés?

   **Resuelto (05/10): ya no hay aviso antes de K31.**

24. **Preguntas del padre: lugar exacto.** "Entre el cap. 4 y la cápsula": ¿antes o después de B-UNA-MAS y CIERRE-4? ¿Van al cuerpo del libro y en qué capítulo? ¿Quién es {{1}} en PADRE-PREG-LINEA (sale de "Quién se lo regala"?), y {{nombre}} en PANEL-GUIA, ¿es "cómo le dicen" o el nombre? Nada le avisa al padre que tiene preguntas para escribir ni que se le vence el plazo (ni BIEN-PADRE, ni AVISO-PADRE, ni la compra las mencionan).

   **Sigue abierto.**

25. **[Lo dejamos acá] y [No, ya está].** `paso-3-ronda4-final.md` no dice explícitamente a dónde llevan; se asume FINAL-CHICO. ¿Puede volver otro día a pedir más extras?

   **Sigue abierto (se asume FINAL-CHICO).**

26. **Extras del final: cuáles y en qué orden.** ¿Por capítulo, en orden? ¿Entran las del cap. 5 (que serían del sobre)? Banco: "Después de K39… solo con extras livianas", pero ninguna extra del cap. 4 está marcada como liviana.

   **Resuelto en parte (05/10): las extras livianas son dos, "tan raro que nadie te creyó" y "el día más largo", marcadas en el banco. Siguen abiertos el orden y las del cap. 5.**

27. **Tema sacado y su foto pegada.** Sacar mamá (K10), papá (K11) o abuelo que murió (K13) saca la principal; no se dice qué pasa con su foto pegada (mascota, deporte, la cosa más vieja de la casa): ¿se pierde o se pega a otra?

   **Resuelto (05/10): la pregunta del tema no sale; la foto queda y pasa a la siguiente principal del capítulo que no tenga foto.**

28. **Extra "sacable" sin tema.** banco.md, extras cap. 2: "Contame una vez que un hermano o hermana te cubrió… *(sacable; solo si tiene hermanos)*". Ningún tema de COMPRA-3-TEMAS la saca.

   **Resuelto (05/10): pierde la marca sacable.**

29. **Abuelo que murió saca K13, pero no K14** ("cómo era la vida cuando tus abuelos eran chicos") ni la extra/OP de abuelos ("algo que un abuelo o abuela te enseñó"). Confirmar que es a propósito.

   **Resuelto (05/10): a propósito, K14 es la vida de los abuelos de chicos.**

30. **Fotos con otros chicos: quién las detecta.** Por defecto "quedan fuera del libro", pero sin modelo nadie sabe qué foto tiene otros chicos. ¿Lo mira el escritor, Naza, el padre en el panel?

   **Resuelto (05/10): Naza mira el álbum antes de imprimir.**

31. **Variables con mayúscula y nombre completo.** COMPRA-2-REGALA guarda "Tu mamá", "Tus papás" (con mayúscula) y en BIEN-CHICO y FINAL-CHICO van en el medio de la oración ("porque Tu mamá te hizo"). "Tu nombre" y "Su nombre" piden "Nombre y apellido": en las plantillas al padre saldría "Hola Laura Gómez." y "Ya le escribimos a Juan Pérez." Falta decir qué parte se usa.

   **Resuelto (05/10): saludo al padre con el primer nombre solo; "Tu mamá" se guarda en minúscula. Sigue abierto qué parte del nombre del chico va en las plantillas al padre.**

32. **Canal B, mensajes al padre que lee el chico.** En "lo hago yo" el chico está al lado del celular del padre: TERMINO-PADRE ("no le digas nada hasta el libro") llega al mismo número, pegado a FINAL-CHICO. ¿Va igual?

   **Resuelto (05/10): en canal B, TERMINO-PADRE sale al día siguiente, a la hora de envío. Mismo texto.**

33. **Zona horaria y franja de noche.** La hora la elige el padre, pero no se guarda zona (se habla de AR y ES), y no hay regla de "nunca de noche" (en Viaje: nunca entre 23:00 y 8:00). ¿Qué pasa si sigue con [Dale, otra] a las 23:30?

   **Resuelto en parte (05/10): nada de noche, no se manda entre las 22 y las 9, hora del país del número.**

34. **Qué no se guarda en la compra.** No hay formato (impreso / PDF), dirección de envío del impreso ni precio, aunque el libro "con sobre pegado al impreso" lo supone. ¿El padre puede cambiar después la hora, los temas o el canal desde el panel?

   **Resuelto en parte (05/10): formato, envío e impresión igual que el resto de la casa. Sigue abierto si el padre puede cambiar hora, temas o canal desde el panel.**

35. **El padre y el libro antes de imprimir.** En Viaje la persona revisa el libro en el panel antes de cerrarlo; en Kids no está dicho si el padre lo ve o aprueba antes.

   **Sigue abierto (Naza mira el álbum antes de imprimir).**

36. **Mensajes del chico después del final** ("Nos vemos pronto"): si escribe otra vez, ¿qué contesta el bot?

   **Sigue abierto.**

37. **El arranque.** ¿BIEN-CHICO sale apenas paga o a la hora elegida? ¿AVISO-PADRE sale junto? ¿Qué pasa si el número del chico no tiene WhatsApp o la plantilla falla?

   **Sigue abierto.**

38. **(05/10, nuevo) [Hoy no la como] en la foto de K24.** El texto de la foto ya le pide contar la última vez que la comió; no está escrito si el botón tiene respuesta propia o solo espera el audio. Hoy, en banco.md, espera el audio.

### D. `plantillas-meta-kids.md` contra los textos aprobados

Los cuerpos de las plantillas 1, 2, 3, 4, 5, 6 y 9 coinciden letra por letra con lo aprobado (con la columna "Después" de `paso-3-sin-dos-puntos.md` aplicada). Diferencias y notas:
- **5b** (`kids_recordatorio_padre_8`, "Pasaron ocho días") contradice "mismo texto" de `paso-3-ronda3-recordatorio.md`; vale la plantilla (aprobada después).
- **Título de la 5** decía "a los 4 y a los 8 días", pero para los 8 está la 5b. Resuelto (05/10).
- ~~**Falta** la de 8 días para canal B (ver 4).~~ Resuelto (05/10): 6b `kids_recordatorio_lo_hago_yo_8`.
- **(05/10)** Cuerpos nuevos en la 6 ("Es solo un recordatorio, sin apuro.") y en la 7 ("hay una pregunta esperándote"), por la revisión de Fable. Título de la 5 corregido.
- **7 y 8** (`kids_pregunta_nueva`, `kids_pregunta_nueva_padre`) solo existen en `plantillas-meta-kids.md`; no hay archivo de ronda que registre su aprobación.
- **No hay plantilla** para LIBRO-LISTO, ni para EXTRAS-OFERTA / FINAL-CHICO fuera de la ventana (ver 14). Resuelto (05/10): LIBRO-LISTO igual que el resto de la casa; fuera de la ventana va antes PREG-NUEVA.
- `paso-3-sin-dos-puntos.md` llama "aviso al padre" al texto 3 de las bienvenidas (AVISO-PADRE), mientras `paso-3-ronda4-final.md` llama "Aviso al padre" al de terminó (TERMINO-PADRE). Es el mismo nombre para dos mensajes; acá quedaron separados.
