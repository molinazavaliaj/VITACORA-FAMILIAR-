# Vitácora Kids · «Mi Primer Capítulo» · El proceso de punta a punta (vigente, 05/10/2026)

Cómo funciona la entrevista del chico, de la compra al libro. Los textos exactos están en:
- [`banco.md`](banco.md): las 47 preguntas (K1…K47), otras puertas, fotos, extras, entradas y cierres, y los mensajes del banco (B-…).
- [`mensajes.md`](mensajes.md): todos los demás mensajes fijos (bienvenidas, acuses, recordatorios, final, compra, guía del panel).

Acá solo se citan por ID. Lo que el diseño no define o se contradice está al final, en **Huecos que encontré**.

Reglas de fondo: **banco fijo** (ningún modelo escribe ni decide durante la entrevista; solo se transcriben los audios) · **nunca se traba** (cada botón lleva a lo siguiente) · **no prometemos tiempo** · **al chico nunca se lo reta** · **el padre ve todo** en el panel, también la cápsula · nada de lo que el bot le dice al chico dice que le gusta, le alegra o guarda algo "con cariño".

## 1. La compra (web, tres pantallas)

| Pantalla | Qué se guarda | Para qué |
|---|---|---|
| **1. Vos** (COMPRA-1) | Nombre del padre | {{1}} en todo lo que le llega al padre |
| | WhatsApp del padre | Recordatorios, avisos; en canal B, también las preguntas |
| | Correo | Entrar al panel |
| **2. Quién cuenta** (COMPRA-2) | Nombre del chico | Tapa; {{2}} en lo que le llega al padre |
| | Cómo le dicen | {{1}} en BIEN-CHICO, PREG-NUEVA-CHICO, FINAL-CHICO |
| | Chico o chica | `{{o/a}}` en las preguntas |
| | Edad | Tapa ("Capítulo Uno: 11 años") |
| | Quién se lo regala (+ plural si empieza con "Tus") | {{2}} en BIEN-CHICO / BIEN-CHICO-PL y FINAL-CHICO |
| | Canal: A (su WhatsApp, + su número) o B ("lo hago yo") | A dónde van las preguntas. Elegir A es la autorización del adulto a cargo. |
| | Hora (por defecto 18:00) | A qué hora sale la pregunta del día |
| **3. Temas y pago** (COMPRA-3) | Temas que no se tocan | Sacan preguntas (tabla en `mensajes.md` §8) |
| | Fotos con otros chicos (apagada) | Si no se marca, esas fotos quedan fuera del libro |
| | Pago | — |

Después de pagar: correo para entrar al panel (COMPRA-3-DESPUES; texto: FALTA) y arranca el canal elegido.

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

## 3. Un día típico

| Paso | Qué pasa | Mensaje |
|---|---|---|
| 1 | A la hora elegida sale la pregunta que toca. Si cambia de capítulo, antes va la entrada. Si es K31 o K39, antes va el aviso de las serias. | K…, ENTRADA-N, B-AVISO-SERIA |
| 1b | Si pasaron más de 24 h desde su último mensaje, en lugar de la pregunta sale la plantilla, y la pregunta cuando toca el botón. | PREG-NUEVA-CHICO (A) · PREG-NUEVA-PADRE (B) |
| 2 | Contesta con un audio (o escrito). | — |
| 3 | Si contestó muy corto (lo mide el código), sale **una sola vez** la otra puerta de esa pregunta. Una OP usada no vuelve como extra. | OP de K… (banco.md) |
| 4 | Acuse, rotando. | ACUSE-1…7 (reglas de rotación en `mensajes.md` §3) |
| 5 | Si la pregunta tiene foto pegada, sale la foto. | Foto de K… (banco.md) |
| 5a | Manda la foto → acuse de foto. | ACUSE-FOTO-1…3 |
| 5b | Toca [No tengo] → le ofrece contarlo en audio, una sola vez; si no manda nada, sigue. | B-FOTO-NOTENGO (en K29, B-FOTO-PLATA) |
| 5c | Foto con botón propio ([No hago], [De ninguno], [No miro]) → sigue. | B-NO-PASA-NADA |
| 6 | Cierra lo del día con el ofrecimiento de seguir. | B-SEGUIR |
| 6a | [Dale, otra] → sale la siguiente en el momento (con entrada si cambia de capítulo) y vuelve al paso 2. | — |
| 6b | [Mañana sigo] → hasta mañana. | B-MAÑANA |
| 6c | Llegó a 3 principales en la sentada → corta. | B-TOPE |

- **Mínimo una principal por día**, a la hora elegida. Si tiene ganas sigue en el momento, con tope de 3.
- **Botones de "no" dentro de la pregunta** (K12, K13, K16, K18, K20, K25, K38): cada rama está en banco.md; los de "no aplica" llevan a B-NO-PASA-NADA y sigue.
- **Pasar:** [Esta la paso] (K10, K11, K39) y [Esta no, gracias] (K41) → B-PASO y sigue.
- **Temas sacados en la compra:** esas preguntas y sus extras no salen; se pasa a la siguiente.
- **Nombres:** se piden dentro de la pregunta; los corrige el padre en el panel.

## 4. Capítulos

| Momento | Qué pasa | Mensaje |
|---|---|---|
| Al empezar | Entrada del capítulo, pegada a su primera pregunta. | ENTRADA-1…5 |
| Antes de cerrar | Se ofrece **una** extra de ese capítulo. Después de K39, solo extras livianas. | B-UNA-MAS → [Dale, otra] una extra · [No, cerramos] |
| Al cerrar | "¿Quedó algo…?" | CIERRE-1…4 (cap. 5: CIERRE-FINAL, ver §9) |

Orden: dentro de cada capítulo, las ★ primero (salvo K14 antes de K15 y el cap. 5 en orden del borrador). Cápsula: "pueden ir seguidas".

## 5. Las serias (capítulo 4)

1. **Antes de K31 y de K39**, pegado a la pregunta (no al día): **B-AVISO-SERIA** → [Voy ahora] sale la pregunta · [Mañana mejor] queda para mañana (texto de respuesta: FALTA).
2. **K39, el día feo:** sin otra puerta. Acuse propio (**B-DIAFEO-ACUSE**), que espera un silencio largo porque puede mandar varios audios. Los acuses nunca dicen "mañana seguimos".
3. **Después de K39** (haya contado o pasado): **B-TRANQUILA** → [Dale, una tranquila] sale **K40** · [Mañana sigo] **B-MAÑANA** (K40 sale al día siguiente).
4. "Una más antes de cerrar" del cap. 4: solo con extras livianas.

## 6. Temas que saca el padre

Se marcan en la compra (COMPRA-3-TEMAS) y no se cambian después (ver Huecos). Tabla de qué saca cada uno en `mensajes.md` §8. K39 y K41 no se sacan: tienen botón para pasar. La separación no es tema.

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
| Tope | Cuentan para el tope de 3. |

## 8. Recordatorios (silencio)

| Cuándo | Canal A | Canal B |
|---|---|---|
| 4 días sin respuesta | **RECORD-A-4** al padre | **RECORD-B** al padre, con [Estamos listos] |
| 8 días sin respuesta | **RECORD-A-8** al padre | RECORD-B (texto de 8 días: FALTA) |
| Después | No se le escribe más al padre. Marca para Naza en el panel; lo mira una persona. | Igual |

Al chico nunca se le manda un recordatorio ni se lo reta.

## 9. La cápsula (capítulo 5)

- **ENTRADA-5** → K41 a K47 (pueden ir seguidas). K41 tiene [Esta no, gracias] → B-PASO.
- Acuses sin el 3 ni el 6 (van al sobre, no al libro): ver `mensajes.md` §3.
- Las respuestas van en un sobre pegado al impreso y en un PDF aparte, no en el cuerpo del libro. El padre las ve en el panel.
- Cierra con **CIERRE-FINAL** (K47, banco.md).

## 10. El final

| Paso | Qué pasa | Mensaje |
|---|---|---|
| 1 | Después de CIERRE-FINAL (conteste o no): oferta de extras. | EXTRAS-OFERTA |
| 2a | [No, ya está] → mensaje final. | FINAL-CHICO / FINAL-CHICO-PL (FALTA) |
| 2b | [Dale, otra] → "va la primera" y una extra. | EXTRAS-SI |
| 3 | Después de cada extra: acuse y "¿otra o lo dejamos acá?". | ACUSE-…, EXTRAS-OTRA |
| 3a | [Dale, otra] → la siguiente extra. Si llega al tope de 3, B-TOPE; al otro día, si quedan extras, sale otra vez EXTRAS-OFERTA. | B-TOPE |
| 3b | [Lo dejamos acá] → mensaje final. | FINAL-CHICO |
| 4 | Si se terminan las extras: "Esa era la última…", pegado al final. | EXTRAS-FIN + FINAL-CHICO |
| 5 | Al padre, a la vez: terminó de contar. | TERMINO-PADRE |
| 6 | Revisión del escritor (lee todo, marca si hay algo preocupante, ver §11) y armado del libro. | — |
| 7 | Aviso de libro listo al padre. | LIBRO-LISTO (FALTA) |

Extras: las que quedaron de todos los capítulos (las OP ya usadas no vuelven; "cómo se arreglaron" solo si la pelea de K36 se contó; las de mamá/papá no, si se sacó el tema; las de hermanos, solo si tiene).

## 11. Algo preocupante

- **Decisión de Naza (05/10):** sin modelo que lea cada respuesta. Lo marca **el escritor en la revisión del final del libro**: si encuentra algo preocupante, avisa a Naza **antes de armar el libro**.
- Sigue valiendo el banco: si salta la marca, solo el acuse ese día, aviso a Naza, nada automático a los padres.
- Abierto: lista de palabras en el código para frenar en el momento; línea con teléfono de ayuda (102 AR, ANAR 116 111 ES); protocolo de Naza; **abogado antes de vender** (LOPIVI en España, Ley 26.061 en Argentina).

## 12. Qué ve el padre en el panel

| Qué | Detalle |
|---|---|
| Todo lo que cuenta | Audios, fotos y respuestas, también las del sobre cerrado (AVISO-PADRE, BIEN-PADRE). |
| Nombres | Los corrige ahí (banco.md · Reglas del flujo). |
| Sus preguntas | Hasta 3, con la casilla "sin decir que es mía", hasta que empieza el cap. 4 (§7). |
| Entrada | Con el correo de la compra (COMPRA-1-CORREO); link en AVISO-PADRE (canal A). |

En el panel de Naza: la marca de 8 días de silencio y la de algo preocupante.

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

2. **Algo preocupante: la regla del banco no puede cumplirse.** banco.md (Reglas del flujo): "si salta la marca, solo el acuse; nada más ese día (ni foto, ni seguir), y aviso a Naza". `paso-3-algo-preocupante.md` decide que se detecta recién en la revisión del final y dice "Sigue valiendo lo aprobado en el banco". Sin lista de palabras ni modelo, **nada hace saltar la marca durante la conversación**: después de "me pegan" sale igual el acuse "Eso va al libro, con tus palabras", la foto pegada y B-SEGUIR (el caso que Fable llamó "lo peor que puede pasar", `paso-2-cap1-fable-ronda1.md`). Además, avisar recién al final puede ser semanas después.

3. **Tope "por sentada" o "por día".** banco.md: "Tope: 3 principales por sentada". `paso-3-ronda5-preguntas-del-padre.md`: "Cuentan para el tope de 3 por día". Tampoco está definido qué es una "sentada" (¿se reinicia a la hora siguiente?, ¿al otro día?), ni si cuentan para el tope las extras de "una más antes de cerrar", las preguntas pasadas o las de la cápsula ("pueden ir seguidas").

4. **Recordatorio "mismo texto" vs. "ocho días".** `paso-3-ronda3-recordatorio.md` (Cuántas veces): "otro a los 8, mismo texto". `plantillas-meta-kids.md` crea `kids_recordatorio_padre_8` con "Pasaron ocho días" (aprobada después, vale esa). Pero para canal B no hay versión de 8 días: RECORD-B a los 8 días diría "Pasaron cuatro días". Y el título de la plantilla 5 dice "a los 4 y a los 8 días" aunque existe la 5b.

5. **RECORD-B habla de "la pregunta pendiente" y pide tocar el botón "para seguir".** En canal B, ¿la pregunta del día llega directa a la hora o recién al tocar el botón? Si ya llegó, ¿el botón la reenvía? Si nunca tocaron [Estamos listos] de BIEN-PADRE, no hay "pregunta pendiente".

6. **Acuse que miente.** ACUSE-3 ("Eso va al libro…") y ACUSE-6 ("…a salvo para el libro") pueden salir después de un "no" al CIERRE-N ("¿Quedó algo…?" → "No"), y después de algo preocupante. La regla de la cápsula los saca en el cap. 5, pero no se dice si cuenta el CIERRE-FINAL, ni las extras del cap. 5 cuando salen en el final (¿van al sobre?).

7. **AVISO-PADRE dice "solo te escribimos si pasan cuatro días"**, pero el padre también recibe RECORD-A-8, TERMINO-PADRE y LIBRO-LISTO. ("Mientras tanto" lo salva a medias; si el chico termina, después vienen dos más.)

8. **`pendientes.md` quedó viejo:** las filas 3, 4 y 5 ya se hicieron en el paso 3 y siguen como pendientes ("Paso 3").

### B. Textos que faltan

9. **FINAL-CHICO-PL.** `paso-3-ronda4-final.md`: "con 'tus papás' va una segunda versión en plural". Nunca se escribió ("te lo va a dar {{2}}, que fue quien te hizo" no concuerda en plural).
10. **RECORD-B de los 8 días** (ver 4).
11. **LIBRO-LISTO.** TERMINO-PADRE ("te avisamos cuando esté listo") y COMPRA-1-WA ("cuando el libro esté listo") lo prometen. No hay texto ni plantilla.
12. **Correo de acceso al panel.** COMPRA-3-DESPUES: "Después de pagar te llega un correo para entrar a tu panel." Sin texto.
13. **Respuesta a [Mañana mejor]** del aviso de las serias (banco.md solo tiene los botones). ¿Va B-MAÑANA?
14. **Plantilla para lo que puede caer fuera de las 24 h al final.** `plantillas-meta-kids.md`: "oferta de extras, mensaje final al chico" van "dentro de la ventana". Pero EXTRAS-OFERTA "si no contesta el cierre, sale igual", y "al otro día" después del tope: si pasaron más de 24 h no se puede mandar, y no hay plantilla. Lo mismo FINAL-CHICO si el chico deja colgada la oferta.

### C. Reglas que el diseño no define

15. **Cuándo se termina si el chico deja de contestar al final.** Si no toca nada en EXTRAS-OFERTA o EXTRAS-OTRA, nunca sale FINAL-CHICO, ni TERMINO-PADRE, ni arranca el armado. Falta un plazo. Lo mismo si se calla para siempre en el medio: después de la marca a Naza (8 días), ¿se arma el libro con lo que hay?
16. **Qué pasa con la pregunta sin contestar.** Si a la hora del día siguiente la del día anterior sigue sin respuesta, ¿sale una nueva, se repite la misma o no sale nada? ¿PREG-NUEVA-CHICO sale **todos los días** de silencio (una plantilla por día a un chico de 11, y cada una se paga)? ¿Los recordatorios cuentan desde la última respuesta (Fable, `paso-2-cap1-fable-ronda4.md`: "cuenta desde la última respuesta") y se reinician si vuelve a contestar? ¿Siguen corriendo en la etapa de extras?
17. **Canal B, día a día.** BIEN-PADRE dice "Cuando llegue una, buscá un rato tranquilo…" (la pregunta llega sola) y PREG-NUEVA-PADRE dice "tocá el botón y llega". No está escrito si, dentro de las 24 h, la pregunta del día llega directa a la hora elegida.
18. **Orden después de la respuesta.** Banco: la foto "sale después de la respuesta". No está definido el orden exacto: ¿respuesta corta → OP sin acuse, o acuse → OP? ¿Acuse → foto → B-SEGUIR? ¿Cuánto se espera la foto (o el audio después de [No tengo]) antes de seguir? "Si no manda nada, no pasa nada y sigue": ¿después de cuánto?
19. **Varios audios seguidos.** Solo K39 dice que el acuse "espera un silencio largo". En las demás, ¿un acuse por audio o uno al final? ¿Cuánto silencio?
20. **"Muy corto" no tiene número** (segundos de audio, palabras de texto). Lo decide el código, pero nadie lo fijó.
21. **Cierres de capítulo sin botón.** CIERRE-1…4 no tienen botones: si no contesta, ¿cuándo pasa al capítulo siguiente? (El final sí lo resuelve: "sale igual".)
22. **[Mañana mejor] y el mínimo de una por día.** El aviso es "pegado a la pregunta, no al día": si K31/K39 es la primera del día y elige [Mañana mejor], ese día no hubo ninguna principal. ¿Vale? ¿Y al otro día vuelve a salir el aviso?
23. **Orden entrada / aviso en K31.** K31 es la primera del cap. 4: ¿ENTRADA-4 → B-AVISO-SERIA → K31, o al revés?
24. **Preguntas del padre: lugar exacto.** "Entre el cap. 4 y la cápsula": ¿antes o después de B-UNA-MAS y CIERRE-4? ¿Van al cuerpo del libro y en qué capítulo? ¿Quién es {{1}} en PADRE-PREG-LINEA (sale de "Quién se lo regala"?), y {{nombre}} en PANEL-GUIA, ¿es "cómo le dicen" o el nombre? Nada le avisa al padre que tiene preguntas para escribir ni que se le vence el plazo (ni BIEN-PADRE, ni AVISO-PADRE, ni la compra las mencionan).
25. **[Lo dejamos acá] y [No, ya está].** `paso-3-ronda4-final.md` no dice explícitamente a dónde llevan; se asume FINAL-CHICO. ¿Puede volver otro día a pedir más extras?
26. **Extras del final: cuáles y en qué orden.** ¿Por capítulo, en orden? ¿Entran las del cap. 5 (que serían del sobre)? Banco: "Después de K39… solo con extras livianas", pero ninguna extra del cap. 4 está marcada como liviana.
27. **Tema sacado y su foto pegada.** Sacar mamá (K10), papá (K11) o abuelo que murió (K13) saca la principal; no se dice qué pasa con su foto pegada (mascota, deporte, la cosa más vieja de la casa): ¿se pierde o se pega a otra?
28. **Extra "sacable" sin tema.** banco.md, extras cap. 2: "Contame una vez que un hermano o hermana te cubrió… *(sacable; solo si tiene hermanos)*". Ningún tema de COMPRA-3-TEMAS la saca.
29. **Abuelo que murió saca K13, pero no K14** ("cómo era la vida cuando tus abuelos eran chicos") ni la extra/OP de abuelos ("algo que un abuelo o abuela te enseñó"). Confirmar que es a propósito.
30. **Fotos con otros chicos: quién las detecta.** Por defecto "quedan fuera del libro", pero sin modelo nadie sabe qué foto tiene otros chicos. ¿Lo mira el escritor, Naza, el padre en el panel?
31. **Variables con mayúscula y nombre completo.** COMPRA-2-REGALA guarda "Tu mamá", "Tus papás" (con mayúscula) y en BIEN-CHICO y FINAL-CHICO van en el medio de la oración ("porque Tu mamá te hizo"). "Tu nombre" y "Su nombre" piden "Nombre y apellido": en las plantillas al padre saldría "Hola Laura Gómez." y "Ya le escribimos a Juan Pérez." Falta decir qué parte se usa.
32. **Canal B, mensajes al padre que lee el chico.** En "lo hago yo" el chico está al lado del celular del padre: TERMINO-PADRE ("no le digas nada hasta el libro") llega al mismo número, pegado a FINAL-CHICO. ¿Va igual?
33. **Zona horaria y franja de noche.** La hora la elige el padre, pero no se guarda zona (se habla de AR y ES), y no hay regla de "nunca de noche" (en Viaje: nunca entre 23:00 y 8:00). ¿Qué pasa si sigue con [Dale, otra] a las 23:30?
34. **Qué no se guarda en la compra.** No hay formato (impreso / PDF), dirección de envío del impreso ni precio, aunque el libro "con sobre pegado al impreso" lo supone. ¿El padre puede cambiar después la hora, los temas o el canal desde el panel?
35. **El padre y el libro antes de imprimir.** En Viaje la persona revisa el libro en el panel antes de cerrarlo; en Kids no está dicho si el padre lo ve o aprueba antes.
36. **Mensajes del chico después del final** ("Nos vemos pronto"): si escribe otra vez, ¿qué contesta el bot?
37. **El arranque.** ¿BIEN-CHICO sale apenas paga o a la hora elegida? ¿AVISO-PADRE sale junto? ¿Qué pasa si el número del chico no tiene WhatsApp o la plantilla falla?

### D. `plantillas-meta-kids.md` contra los textos aprobados

Los cuerpos de las plantillas 1, 2, 3, 4, 5, 6 y 9 coinciden letra por letra con lo aprobado (con la columna "Después" de `paso-3-sin-dos-puntos.md` aplicada). Diferencias y notas:
- **5b** (`kids_recordatorio_padre_8`, "Pasaron ocho días") contradice "mismo texto" de `paso-3-ronda3-recordatorio.md`; vale la plantilla (aprobada después).
- **Título de la 5** dice "a los 4 y a los 8 días", pero para los 8 está la 5b.
- **Falta** la de 8 días para canal B (ver 4).
- **7 y 8** (`kids_pregunta_nueva`, `kids_pregunta_nueva_padre`) solo existen en `plantillas-meta-kids.md`; no hay archivo de ronda que registre su aprobación.
- **No hay plantilla** para LIBRO-LISTO, ni para EXTRAS-OFERTA / FINAL-CHICO fuera de la ventana (ver 14).
- `paso-3-sin-dos-puntos.md` llama "aviso al padre" al texto 3 de las bienvenidas (AVISO-PADRE), mientras `paso-3-ronda4-final.md` llama "Aviso al padre" al de terminó (TERMINO-PADRE). Es el mismo nombre para dos mensajes; acá quedaron separados.
