# Cambios en los legales del 19/10 (rama `rediseno-web-legal-1910`)

Tandas 4 (garantía) y 5 (reclamaciones) de `textos-legales-nuevos.md`. Cada cambio con su antes → después. Los textos
están en `web/src/app/_textos/legal.ts` (garantía: constante `GARANTIA`; reclamaciones: `reclamaciones` de cada idioma) y
el pie en `web/src/app/_textos/publico.ts`.

## 1. La garantía (tanda 4, textos 22–31)

Va igual en dos lugares: términos §7 y al final de la página de desistimiento (es, ca) y de arrepentimiento (ar). Es la
misma sección (`seccionGarantia`), así que no pueden decir cosas distintas. En términos lleva el «7.» delante.

**Antes** (es; ar y ca iguales en su idioma). Título «7. La garantía de cada libro» y debajo:

> Además de lo anterior, cada libro tiene su garantía.
> - **Familiar (el libro de otra persona)**: Si no quiere hacerlo, te devolvemos el dinero.
> - **De viaje**: Si el viaje se cancela, te devolvemos el dinero.
> - **Para ti (tu propio libro)**: Si cambias de idea antes de contestar la primera pregunta, te devolvemos el dinero.
>
> Las tres dicen en corto lo mismo. Mientras dura la entrevista —o el viaje— y hasta que el libro está listo en tu cuenta,
> si lo pides te devolvemos todo lo que pagaste, aunque ya haya empezado a contestar.
>
> El detalle está en la sección «Si te arrepientes» de los términos.

**Después** (es):

> **7. La garantía de cada libro**
>
> *Lo que te da la ley*
> Tienes 14 días naturales desde la compra para desistir, sin dar explicaciones y sin coste. Te devolvemos el dinero por el mismo medio de pago.
> Lo pides desde [este formulario](/legal/arrepentimiento#formulario).
> Este derecho no lo podemos quitar ni limitar.
>
> *Lo que añadimos nosotros*
> - **Familiar.** Si la persona a la que se lo regalas no acepta la entrevista, te devolvemos todo lo que pagaste. Si acepta y contesta menos de diez preguntas, también te devolvemos todo, aunque ya haya empezado.
> - **De viaje.** Si el viaje no se hace, por el motivo que sea, y nos avisas antes de que la persona que viaja acepte la entrevista, te devolvemos todo. Si ya aceptó, vale la regla de las diez preguntas.
> - **Para ti.** Si el libro es el tuyo, te devolvemos todo hasta que mandes tu primera respuesta. Después vale la regla de las diez preguntas.
>
> *Cuándo cerramos el libro*
> Cuando contesta diez preguntas o más, cerramos su libro con lo que contó. Si todavía estás dentro de los 14 días y desistes, te devolvemos el importe menos la parte del trabajo ya hecho.
> Si dos reglas de este documento dicen cosas distintas, vale la que más te favorezca.

**Después (ar)**, de vos. Lo que cambia respecto de es:
- 24 → «Tenés 10 días corridos desde que recibís el libro (desde la compra, si es solo digital) para arrepentirte, sin dar explicaciones y sin costo. Te devolvemos el dinero por el mismo medio de pago.»
- 25 → «Lo pedís desde el [botón de arrepentimiento](/ar/legal/arrepentimiento).»
- 27–29 → «regalás», «avisás», y la etiqueta **Para vos.**
- 30 → «… Si todavía estás dentro de los 10 días y te arrepentís, te devolvemos el importe menos la parte del trabajo ya hecho.»

**Después (ca)**, traducción marcada `// ca: PENDIENTE REVISIÓN NATIVA`. Subtítulos «El que et dona la llei», «El que hi
afegim nosaltres», «Quan tanquem el llibre». Etiquetas **Familiar.**, **De viatge.**, **Per a tu.**

### Lo que agregué yo y no estaba literal en la tanda (para que Naza lo mire)
- **Etiquetas de cada línea** («**Familiar.**», «**De viaje.**», «**Para ti.**» / «**Para vos.**»). La tanda dice «Familiar / Viaje / Para mí» como nombre interno. Usé los nombres que ya tienen en los términos §2, con punto y no con dos puntos.
- **ar, texto 24**: la tanda dice «10 días», sin decir desde cuándo. Puse «desde que recibís el libro (desde la compra, si es solo digital)», que es lo que ya dicen §6 y el botón (revisión A2 del 17/10). Con «desde la compra» el texto habría contradicho a §6 y habría dado menos plazo del que da la ley.
- **ar, texto 25**: «Lo pedís desde el botón de arrepentimiento.» en lugar de «desde este formulario», como pedía el encargo.
- **ca**: toda la traducción.

### Lo que salió
- **«8. Si no hay libro»** (es, ar y ca) queda absorbida por la garantía nueva (no acepta, o menos de diez preguntas = te devolvemos todo). La quité. Las secciones 9 a 15 de los términos pasan a ser 8 a 14 (solo cambia el número del título; los anclajes `#historia`, `#uso`… siguen iguales).
  - Antes decía, entre otras cosas, «**En el libro de viaje**: si el viajero no acepta participar o no contesta ninguna pregunta» y «te devolvemos el importe completo sin que tengas que pedirlo, en un plazo máximo de 14 días y sin descuento». La parte de viaje contradecía la regla nueva (que, con el viajero ya aceptado, devuelve todo si contesta menos de diez).
- Las referencias a esa sección:
  - términos §4: «(ver la sección 8)» → «(ver la sección 7)» (es, ar; ca «(vegeu la secció 7)»).
  - desistimiento, «Plazos», punto «Aunque no lo pidas»: «(ver la sección 8 de los términos)» → «(ver la sección 7 de los términos)» (es, ar, ca).
- «sin devolución»: no quedaba ninguno en el texto visible (solo en un comentario del código, que ya no está). «art. 108.3»: no aparecía en ningún lado; no hubo nada que corregir.

### «En corto» (ajuste mínimo)
- Términos, línea 2 (es): «… Si no acepta, o si te arrepientes mientras dura la entrevista, te devolvemos todo.» → «… Si no acepta, o si contesta menos de diez preguntas, te devolvemos todo.» (ar «te arrepentís» → igual; ca «si te'n desdius mentre dura l'entrevista» → «si contesta menys de deu preguntes»).
- Desistimiento, línea 3 (es): «Mientras dura la entrevista, te devolvemos todo. Con el libro ya escrito, 14 días naturales…» → «Si el narrador contesta menos de diez preguntas, te devolvemos todo. Por ley, 14 días naturales…» (ar y ca lo mismo).

### Lo que quedaba contradiciendo la regla nueva
Los puntos 1 a 3 se arreglaron después (ver «Alineado a la regla de las diez preguntas», al final). Quedan:
- **Desistimiento, «Plazos», «Aunque no lo pidas»**: promete devolver «sin que lo pidas» si el narrador no acepta o la entrevista «termina sin material para un libro». No contradice la regla (es lo mismo y además automático), así que quedó igual. §7 no dice que sea automático.
- **PARA EL ABOGADO. Términos §6, «Por último, lo que no se devuelve»** (L1-04): dice que el PDF ya entregado no se devuelve (art. 103 m). El texto 30 dice que dentro de los 14 días se devuelve «menos la parte del trabajo ya hecho». Quedó como estaba, hasta que el abogado diga cuál vale.
- **Checkout y FAQ de la portada**: siguen con las frases cortas viejas («Si no quiere hacerlo, te devolvemos el dinero.», «Si el viaje se cancela…», «Si cambias de idea antes de contestar la primera pregunta…»). No las toqué (el checkout está frenado hasta #56). Antes un test exigía que fueran idénticas a la garantía de los legales; ese test se fue con la garantía vieja.

## 2. Reclamaciones y atención (tanda 5, textos 32–39)

Página nueva `/legal/reclamaciones`, `/ar/legal/reclamaciones` y `/ca/legal/reclamaciones`, con el mismo diseño que los
otros legales y una cuarta solapa arriba. No tiene «En corto», índice ni el cierre de «¿Dudas…? Escribe a hola@» (la
página ya es eso).

| Texto | es | ar | ca (PENDIENTE REVISIÓN NATIVA) |
|---|---|---|---|
| 32 título | Reclamaciones y atención | igual | Reclamacions i atenció |
| 33 (bajada) | Si algo no salió bien, escríbenos. Te contesta una persona del equipo de Vitácora. | … escribinos. … | Si alguna cosa no ha sortit bé, escriu-nos. Et respon una persona de l'equip de Vitácora. |
| 34 | Por WhatsApp al {número} o por correo a soporte@vitacorafamiliar.com, de lunes a viernes de 10 a 18, hora de España. | igual | Per WhatsApp al {número} o per correu a soporte@…, de dilluns a divendres de 10 a 18, hora d'Espanya. |
| 35 | Te respondemos en un plazo máximo de 30 días. | igual | Et responem en un termini màxim de 30 dies. |
| 36 | (ver abajo) | — (es de España) | (ver abajo) |
| 37 | No estamos adheridos a la Junta Arbitral de Consumo. Si tu reclamación no se resuelve, te diremos qué organismo puede revisarla. | — (es de España) | No estem adherits a la Junta Arbitral de Consum. Si la teva reclamació no es resol, et direm quin organisme la pot revisar. |
| 38 | — | Cuando nos escribas por un reclamo, en menos de 24 horas te mandamos un número para seguirlo. | — |

- **Texto 34 sin WhatsApp**: el número sale de `NEXT_PUBLIC_WHATSAPP_DUDAS` (el mismo del botón de dudas), con enlace a wa.me. Si la variable no está, la línea queda «Por correo a soporte@vitacorafamiliar.com, de lunes a viernes de 10 a 18, hora de España.» (ca «Per correu a …»).
- **Texto 36**: `web/public/legal/hoja-reclamaciones.pdf` no existe, así que hoy se ve el reemplazo:
  - es: «Pídenos la hoja oficial de reclamaciones por correo y te la mandamos.»
  - ca: «Demana'ns el full oficial de reclamació per correu i te l'enviem.»
  - Cuando se suba el PDF, sale solo el texto aprobado con su enlace: es «Si prefieres una hoja oficial de reclamaciones, descárgala aquí, rellénala y mándanosla por correo.»; ca «Si prefereixes un full oficial de reclamació, descarrega'l aquí, omple'l i envia'ns-el per correu.» Apuntado en `PENDIENTES.md`.

### Pie de toda la web
- Columna de legales: Términos · Privacidad · Desistimiento → Términos · Privacidad · Desistimiento · **Reclamaciones** (ca «Reclamacions»; ar después de «Botón de arrepentimiento»).
- Columna de contacto, debajo del correo (y del WhatsApp si está): **«Atención de lunes a viernes, de 10 a 18.»** (ar igual; ca «Atenció de dilluns a divendres, de 10 a 18.»).

### Lo que agregué yo y no estaba literal en la tanda (para que Naza lo mire)
- La palabra «Reclamaciones» / «Reclamacions» del enlace del pie (el título entero no entra en esa columna).
- El reemplazo del texto 36 en ca, y la línea 34 sin WhatsApp.
- Toda la traducción catalana.

### Para revisar (no son errores del código)
- En `/ar` el pie dice «de 10 a 18» sin «hora de España», como pidió el encargo. Un cliente argentino lo va a leer en su hora. La página de reclamaciones sí dice «hora de España».
- En `/ar` NO salen el texto 36 (hoja oficial) ni el 37 (Junta Arbitral de Consumo): son de España (coordinador, 19/10). `/ar` tiene 32, 33, 34, 35 y 38.

## 3. Alineado a la regla de las diez preguntas (Naza 19/10)

Naza eligió la regla de las diez preguntas (tanda 4) en lugar de la del 17/10 («mientras dura la entrevista, te devolvemos
todo»). Cambié lo mínimo para que los tres textos remitan a la garantía de la sección 7. En el código cada uno lleva la
marca «alineado a la regla de las diez preguntas (Naza 19/10)».

1. **Términos §6, segundo párrafo (L1-01)**
   - es, antes: «**Primero, lo que te damos nosotros: mientras dura la entrevista, te devolvemos todo.** Desde que pagas y hasta que el libro está listo en tu cuenta para que lo revises —mientras el narrador contesta, o mientras dura el viaje—, si lo pides te devolvemos todo lo que pagaste, aunque ya haya empezado a contestar y sin descontar nada. Es más de lo que pide la ley.»
   - es, después: «**Primero, lo que te damos nosotros.** Además de lo que te da la ley, cada libro tiene su garantía, que explicamos en la [sección 7](/legal/terminos#garantia). Es más de lo que pide la ley.»
   - ar: igual que es. ca: «**Primer, el que et donem nosaltres.** A més del que et dona la llei, cada llibre té la seva garantia, que expliquem a la secció 7. És més del que demana la llei.»
2. **Términos §6, línea de España (L1-03)**
   - es/ar, antes: «… sin esperar esos 14 días; aun así, mientras dura, te devolvemos todo. …»
   - es/ar, después: «… sin esperar esos 14 días; aun así, vale la garantía de la sección 7. …»
   - ca: «… tot i això, mentre dura, t'ho retornem tot.» → «… tot i això, val la garantia de la secció 7.»
3. **Desistimiento / arrepentimiento, «Plazos», primer punto (L1-10)**
   - es/ar, antes: «**Mientras dura la entrevista** (o el viaje), hasta que el libro está listo en tu cuenta: te devolvemos todo, siempre, aunque ya haya empezado a contestar.»
   - es/ar, después: «**La garantía de cada libro.** Si el narrador no acepta, o si contesta menos de diez preguntas, te devolvemos todo. El detalle está al final de esta página.»
   - ca: «**La garantia de cada llibre.** Si el narrador no accepta, o si contesta menys de deu preguntes, t'ho retornem tot. El detall és al final d'aquesta pàgina.»

Revisado sin cambios:
- **«Aunque no lo pidas»**: no contradice la regla, así que quedó igual.
- **«En corto»**: ya estaba ajustado en el punto 1 (términos línea 2, desistimiento línea 3). La línea «Con el libro ya escrito vale el plazo de la ley…» de términos no contradice la regla y quedó igual.
- **§6, «Después, lo que te da la ley, cuando el libro ya está escrito.»**: no contradice, pero da a entender que la ley solo corre con el libro escrito. Que lo mire el abogado.
- **§6 «lo que no se devuelve» (art. 103 m) contra el texto 30**: queda como está, anotado arriba para el abogado.

Test nuevo: en términos y desistimiento, en los tres idiomas, ya no puede aparecer «mientras dura la entrevista, te devolvemos todo».
