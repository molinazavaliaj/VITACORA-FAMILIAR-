# Gift card en España y catalán — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la gift card funcione con el abuelo en castellano de Argentina, castellano de España o catalán, y que quien compra lea en el castellano de su país. Además, que los tres idiomas arranquen con la bienvenida del banco V3 más un pedido de SÍ.

**Architecture:**
- En la web, los textos del regalo se separan en dos grupos: los del abuelo, por idioma (`es-AR | es-ES | ca`), y los de quien compra, por trato (`vos | tu`).
- La compra guarda `contexto.idioma`, y la tarjeta, la página y la imagen lo leen.
- En el bot, un módulo nuevo de arranque de regalo arma la bienvenida (`BIEN` del banco + pedido de SÍ), y el consentimiento de los regalos usa textos por idioma.
- Los regalos entran siempre a la V3 al decir SÍ, con la primera pregunta enseguida.

**Tech Stack:** Next.js 16 + Vitest (web), Fastify + Vitest (entrevistador), Supabase.

**Spec:** [`docs/superpowers/specs/2026-10-09-regalo-idiomas-design.md`](../specs/2026-10-09-regalo-idiomas-design.md). Antecedente: [`2026-10-07-gift-card-design.md`](../specs/2026-10-07-gift-card-design.md) y [`docs/regalo/handoff-2026-10-08.md`](../../regalo/handoff-2026-10-08.md).

## Global Constraints

- **Worktree `../VITACORA FAMILIAR-regalo-idiomas`, rama `regalo-idiomas`** (sale de `regalo` 3adf03d). Nunca checkout en la carpeta principal.
- **Idiomas**: `type Idioma = 'es-AR' | 'es-ES' | 'ca'`, igual que `entrevistador/src/v3/nucleo/entrevista/idioma.ts`.
  - `contexto.idioma` se escribe solo para `'es-ES'` y `'ca'`. Para es-AR no se escribe (CONTRATO, «`contexto.idioma`»).
  - `contexto.trato = 'vos'` solo para es-AR.
- **Quien compra**: trato `'vos'` si la región de quien compra es AR, `'tu'` si es ES. **El abuelo**: el idioma elegido en la compra.
- **Los textos es-AR/vos que ya aprobó Naza no cambian ni una letra.** Los nuevos (es-ES, ca, tú) entran como PROPUESTA hasta que Naza los apruebe (Task 0). Viven en un solo archivo por servicio: `web/src/lib/regalo-textos.ts` y `entrevistador/src/flujo/regalo-textos.ts`.
- Reglas de texto de Naza: frases simples, sin dos puntos, sin «usted», sin prometer lo que no pasa, sin cantidad de preguntas ni tiempo.
- **Los regalos van siempre por la V3**, aunque `V3_PARA_NUEVOS` esté apagado. La bienvenida es el mensaje `BIEN` del banco (`mensajePorId('BIEN', idioma)`) renderizado con `renderizar`.
- Lo que no es regalo no cambia de comportamiento.
- Before writing any page, route or `ImageResponse`, read the guide in `web/node_modules/next/dist/docs/`.
- Fallas viejas permitidas en la web: `test/admin-pantallas.test.tsx` «Plata». `tsc` de la web y `npm test` del entrevistador tienen que quedar limpios.
- Commits chicos con `git add` de rutas explícitas, terminados en `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Antes de mostrarle a Naza algo visual (tarjeta, página), sacar una captura y mirarla.

---

### Task 0: Textos para Naza

No es código. Los textos se le pasan a Naza en el chat, de a 10, con contexto y una versión recomendada. Mientras tanto, el código usa las propuestas.

1. **Arranque del bot en 3 idiomas** (12 textos): pedido de SÍ, confirmación, «no te entendí» y «todavía no». Los redacta un agente en modelo Fable con voz de biógrafo, siguiendo las reglas de Naza.
   - El pedido de SÍ va debajo del `BIEN` y pide permiso para guardar sus audios y usar recortes en el libro, con la misma verdad que la bienvenida vieja.
   - La confirmación dice que la primera pregunta llega enseguida.
2. **Avisos del bot** en tú y en catalán: «no encuentro ese código» y «ya se usó» (4 textos).
3. **Lo que lee el abuelo** en tú y en catalán (unos 18 textos): tarjeta (slogan, «Esto es un regalo», las 3 líneas, apunta, respaldo), página (título, «ya empezó», empezar, escuchar audio de) y mensaje de WhatsApp.
4. **Lo que lee quien compra, en tú** (unos 45): todo el bloque del formulario, mails y próximo paso, pasado de vos a tú.
5. **La pregunta nueva del idioma**, de vos y de tú, con sus 3 opciones.

- [ ] Step 1: Tanda 1 (arranque es-AR + es-ES + ca, avisos). Anotar lo aprobado en el ledger.
- [ ] Step 2: Tanda 2 (abuelo en tú y ca).
- [ ] Step 3: Tanda 3 y siguientes (comprador en tú, pregunta del idioma).
- [ ] Step 4: Pasar lo aprobado a los dos archivos de textos, cambiar PROPUESTA por «Aprobados por Naza el <fecha>» y ajustar los tests que los citan. Commit `regalo-idiomas: textos aprobados por Naza`.

---

### Task 1: Textos de la web por idioma y por trato

**Files:**
- Modify: `web/src/lib/regalo-textos.ts`
- Modify: todos los usos de `TEXTOS_REGALO` (lista abajo)
- Test: `web/test/regalo-textos.test.ts` (nuevo) + los tests existentes que importan `TEXTOS_REGALO`

**Interfaces:**
- Produces:
  - `type IdiomaRegalo = 'es-AR' | 'es-ES' | 'ca'`
  - `type TratoComprador = 'vos' | 'tu'`
  - `textosAbuelo(idioma: IdiomaRegalo)` con las claves de la tarjeta, la página y WhatsApp: `tapaSlogan, esUnRegalo, explica, apunta, respaldo, titulo, empezar, mensajeWhatsApp, yaEmpezo, escucharAudioDe`.
  - `textosComprador(trato: TratoComprador)` con las claves del formulario, los mails y el panel: todas las claves de hoy que no son del abuelo (`mailAsunto`, `mailCuerpo`, `mailBoton`, `estadoPanel`, `estadoCorto`, `proximoPaso`, `botonImprimir`, `botonImagen`, el bloque del formulario de `aQuien` a `botonPagar`, y de `tituloPagina` a `terminos`), más `idioma` y `idiomas` (la pregunta nueva y sus opciones).
  - `tratoDeRegion(region: 'AR' | 'ES'): TratoComprador` y `idiomaPorDefecto(region): IdiomaRegalo` (`'AR'` → `'es-AR'`, `'ES'` → `'es-ES'`).
  - **Compatibilidad:** `TEXTOS_REGALO` sigue exportado como `{ ...textosAbuelo('es-AR'), ...textosComprador('vos') }`, para que nada se rompa mientras se migran los usos. Al final de la Task 3 no lo usa nadie y se borra.

- [ ] **Step 1: Test.** `textosAbuelo('es-AR')` y `textosComprador('vos')` devuelven exactamente los strings aprobados de hoy (comparar contra copias literales en el test). Las mismas claves existen para `es-ES`, `ca` y `tu`, sin strings vacíos. Ningún texto de `ca`/`es-ES`/`tu` contiene «vos», «querés», «contás», «mandá», «apuntá» ni «decís». El texto `ca` de `mensajeWhatsApp('VF-7K3M2Q')` termina en el código.
- [ ] **Step 2:** Correr y verlo fallar.
- [ ] **Step 3: Implementar.** Mover los strings de hoy a `ABUELO['es-AR']` y `COMPRADOR.vos` sin tocarlos, y sumar las PROPUESTAS:
  - `ABUELO['es-ES']`: «Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp.» / «Tú le contestas con audios, cuando puedas.» / «Con lo que le cuentes se escribe el libro de tu vida.»; «Apunta la cámara del móvil aquí para empezar.»; «Si la cámara no te funciona, manda un WhatsApp al {n} con este código.»; «{narrador}, {quien} te ha hecho un regalo.»; «Empezar»; «Hola, quiero empezar mi libro. {código}»; «Este regalo ya está en marcha. Para seguir, escríbele al biógrafo por WhatsApp.»; «Escuchar el audio de {quien}»; slogan y «Esto es un regalo.» iguales.
  - `ABUELO.ca`: «A cada família hi ha un llibre per escriure.»; «Això és un regal.»; «Un biògraf et farà preguntes sobre la teva vida per WhatsApp.» / «Tu li respons amb àudios, quan puguis.» / «Amb el que li expliquis s'escriu el llibre de la teva vida.»; «Apunta la càmera del mòbil aquí per començar.»; «Si la càmera no et funciona, envia un WhatsApp al {n} amb aquest codi.»; «{narrador}, {quien} t'ha fet un regal.»; «Començar»; «Hola, vull començar el meu llibre. {codi}»; «Aquest regal ja està en marxa. Per continuar, escriu-li al biògraf per WhatsApp.»; «Escoltar l'àudio de {quien}».
  - `COMPRADOR.tu`: cada texto de `vos` conjugado en tú (regalás → regalas, decís → dices, querés → quieres, grabale → grábale, apuntá/descargá → descarga, Elegí → Elige, Probá → Prueba, Revisalo → Revísalo, podés → puedes, Imprimila → Imprímela, mandala → mándala, aceptás → aceptas, etc.). El sentido es el mismo.
  - Pregunta del idioma: vos «¿En qué idioma le hablamos?», tú «¿En qué idioma le hablamos?», con opciones «Castellano de Argentina», «Castellano de España» y «Català».
  - Todos estos van bajo `// PROPUESTA (regalo-idiomas, Task 0)`.
- [ ] **Step 4:** Correr el test nuevo y la suite web. Verde, con la falla vieja permitida.
- [ ] **Step 5: Commit** `regalo-idiomas (web): textos del abuelo por idioma y de quien compra por trato`.

---

### Task 2: La compra guarda el idioma

**Files:**
- Modify: `web/src/lib/regalo.ts` / `web/src/lib/regalo-reglas.ts` (validación), `web/src/app/api/compra/route.ts`, `web/src/app/regalar/page.tsx`, `web/src/app/regalar/formulario.tsx`, `web/src/app/regalar/enviar.ts`
- Modify: `web/src/lib/regalo-datos.ts` (`RegaloPublico` suma `idioma`)
- Test: `web/test/regalo.test.ts`, `web/test/compra-regalo.test.ts`, `web/test/regalar.test.tsx`, `web/test/regalar-enviar.test.ts`, `web/test/regalo-datos.test.ts`

**Interfaces:**
- Consumes: `IdiomaRegalo`, `idiomaPorDefecto`, `tratoDeRegion`, `textosComprador` (Task 1).
- Produces:
  - `DatosRegalo` suma `idioma: IdiomaRegalo`. `validarRegalo` acepta `idioma` opcional: si falta vale `'es-AR'`, y cualquier otro valor da 400 «El idioma no es válido.».
  - `/api/compra`:
    - con `idioma 'es-AR'` escribe `contexto.trato = 'vos'` y no escribe `contexto.idioma`;
    - con `'es-ES'` o `'ca'` escribe `contexto.idioma` y no escribe `trato`;
    - `regalo: true` y `genero` igual que hoy;
    - el regalo retomado (reintento) también actualiza el idioma.
  - `RegaloPublico.idioma: IdiomaRegalo`, leído de `narradores.contexto->idioma` (ausente = `'es-AR'`, y cualquier valor desconocido también).
  - `/regalar`:
    - `page.tsx` pasa `region`, `trato = tratoDeRegion(region)` e `idiomaInicial = idiomaPorDefecto(region)`;
    - el formulario usa `textosComprador(trato)` en todos sus textos;
    - el paso 1 suma la pregunta del idioma (radios), marcada con `idiomaInicial`;
    - `enviarRegalo` manda `regalo.idioma`.

- [ ] **Step 1: Tests.**
  - `validarRegalo` con idioma ausente da `'es-AR'`; `'ca'` y `'es-ES'` pasan; `'en'` da error.
  - compra `'ca'` → contexto con `idioma: 'ca'`, sin `trato`, `regalo: true`, `genero`.
  - compra `'es-AR'` → `trato: 'vos'` y sin `idioma`.
  - un reintento con otro idioma actualiza el contexto.
  - `leerRegalo` da `idioma: 'ca'` cuando el narrador tiene `contexto.idioma = 'ca'`, y `'es-AR'` sin idioma.
  - render de `/regalar` con región ES: el texto en tú de la pregunta 11 y el radio «Castellano de España» marcado. Con región AR: vos y «Castellano de Argentina» marcado.
  - `enviarRegalo` manda `idioma` en el body.
- [ ] **Step 2:** Verlos fallar.
- [ ] **Step 3:** Implementar como describe Interfaces. En `leerRegalo`, el select embebido suma `contexto` de narradores.
- [ ] **Step 4:** Suite web y `tsc`.
- [ ] **Step 5: Commit** `regalo-idiomas (web): la compra elige y guarda el idioma de la entrevista`.

---

### Task 3: Tarjeta, página, imagen, mails y panel en su idioma

**Files:**
- Modify: `web/src/app/regalo/[codigo]/page.tsx`, `audio.tsx`, `tarjeta/page.tsx`, `tarjeta/imprimir.tsx`, `imagen/route.tsx`, `web/src/lib/regalo.ts` (`linkWhatsApp(numero, codigo, idioma)`), `web/src/lib/mail.ts` (`enviarMailRegalo` recibe `trato`), `web/src/lib/confirmar-pago.ts` (pasa el trato según `familias.region`, que ya lee), `web/src/app/tablero/proximo-paso.ts` (próximo paso por trato; la región sale de la familia de la historia; si no está a mano, se agrega al dato que ya trae `historiasDelUsuario`), `ui.tsx`, `riel.tsx` (estado y estado corto no cambian entre vos y tú: se dejan con `textosComprador('vos')`)
- Delete: el export de compatibilidad `TEXTOS_REGALO` (Task 1), cuando no quede ningún uso
- Test: los tests existentes de tarjeta, página, imagen, mail, confirmar-pago y tablero, más casos nuevos

**Interfaces:**
- Consumes: `RegaloPublico.idioma` (Task 2), `textosAbuelo`, `textosComprador`, `tratoDeRegion`.
- Produces:
  - `linkWhatsApp(numero: string, codigo: string, idioma: IdiomaRegalo): string`;
  - `enviarMailRegalo({ para, comoLeDicen, codigo, trato })`.
- Botones de la tarjeta en pantalla (`botonImprimir`, `botonImagen`): los lee quien compra, así que van con el trato de quien compra. La página de la tarjeta no sabe quién la mira, así que usa el trato que corresponde al idioma del regalo: `ca`/`es-ES` → tú, `es-AR` → vos.
- Las frases impresas de la tarjeta y de la imagen van en el idioma del abuelo.

- [ ] **Step 1: Tests.**
  - Tarjeta con `idioma: 'ca'`: contiene «A cada família hi ha un llibre per escriure.», «Tu li respons amb àudios, quan puguis.» y «Apunta la càmera del mòbil aquí per començar.», y **no** contiene «Vos».
  - Lo mismo con `'es-ES'`.
  - `'es-AR'` sigue idéntica a hoy.
  - Página con `'ca'`: título catalán, y el href de wa.me con `encodeURIComponent('Hola, vull començar el meu llibre. VF-…')`.
  - Mail con `trato: 'tu'`: «Ya puedes descargar la tarjeta…».
  - `confirmarPago` con familia ES pasa `trato: 'tu'`.
  - Próximo paso para una familia ES: «Descarga la tarjeta del regalo».
- [ ] **Step 2:** Verlos fallar.
- [ ] **Step 3:** Implementar. Borrar `TEXTOS_REGALO` cuando `grep -rn "TEXTOS_REGALO\b" web/src` dé vacío.
- [ ] **Step 4:** Suite web y `tsc`.
- [ ] **Step 5: Mirarlo.**
  - Renderizar la tarjeta en `ca` y en `es-ES` con datos inventados, igual que en la gift card: PDF con Playwright de `fabrica/node_modules` y captura de las dos hojas.
  - Mirar las capturas: que nada se corte y que el texto entre en la cara.
  - Hacer lo mismo con la imagen de WhatsApp.
- [ ] **Step 6: Commit** `regalo-idiomas (web): tarjeta, página, imagen, mails y panel en su idioma`.

---

### Task 4: El arranque del bot en tres idiomas

**Files:**
- Create: `entrevistador/src/flujo/regalo-arranque.ts`
- Modify: `entrevistador/src/flujo/regalo-textos.ts`, `entrevistador/src/flujo/regalo.ts` (`mandarBienvenidaDeRegalo`), `entrevistador/src/flujo/procesar.ts` (`leerSiNo`, `manejarConsentimiento`), `entrevistador/src/flujo/preguntar.ts` (la condición de alta V3)
- Test: `entrevistador/test/regalo-arranque.test.ts` (nuevo), `entrevistador/test/regalo.test.ts`, `entrevistador/test/procesar.test.ts`, el test de `preguntar` si existe

**Interfaces:**
- Consumes: `mensajePorId` (`v3/nucleo/entrevista/banco.ts:126`), `renderizar` (`v3/nucleo/entrevista/texto.ts:46`), `idiomaDe` (`idioma.ts`), `altaNuevo` (`v3/pasar.ts`).
- Produces:
  - En `regalo-textos.ts`: `ARRANQUE: Record<Idioma, { pedidoSi: string; aceptacion: string; noEntendi: string; noQuiere: string }>` (PROPUESTAS de Task 0) y `AVISOS: Record<Idioma, { noExiste: string; usadoPorOtro: string }>`. El es-AR de `AVISOS` es el texto aprobado de hoy, sin cambios.
  - `bienvenidaDeRegalo(idioma: Idioma, ficha: { nombre: string; genero: Genero; quienRegala?: string }): string` en `regalo-arranque.ts`: devuelve `renderizar(mensajePorId('BIEN', idioma).texto, {...ficha, idioma})`, una línea en blanco y `ARRANQUE[idioma].pedidoSi`. Si el banco no tiene `BIEN` en ese idioma, tira error. Nunca manda otro idioma.
  - `idiomaDeRegalo(contexto): Idioma`: `idiomaDe(contexto)`, y si tira, `'es-AR'` con `console.error`.
  - `idiomaPorTelefono(tel: string): Idioma`: `+34` → `'es-ES'`, cualquier otro → `'es-AR'`. Es para «no encuentro ese código», cuando todavía no se sabe qué regalo es.
  - `leerSiNo(texto)` suma, en «sí»: `d acord`, `som hi`, `endavant`, `vinga`, `va`, `comencem`, `venga`. En «no»: `ara no`, `dema`, `despres`, `mes tard`, `avui no`. Los apóstrofos y guiones ya se convierten en espacios.

- [ ] **Step 1: Tests de `regalo-arranque`.**
  - `bienvenidaDeRegalo('ca', {nombre:'Joan', genero:'varon'})` empieza con «Hola, Joan, com estàs?» y termina con `ARRANQUE.ca.pedidoSi`.
  - Lo mismo en `'es-ES'` («Hola, Ana, ¿cómo estás?»).
  - En `'es-AR'` contiene «Una persona que te quiere mucho te regaló».
  - `idiomaPorTelefono('+34600…')` da `'es-ES'` y `('+54911…')` da `'es-AR'`.
  - `leerSiNo` da `'si'` para «D'acord», «Som-hi!», «Endavant», «Vale», «Venga», y `'no'` para «Ara no» y «Demà».
- [ ] **Step 2: Tests de canje y consentimiento.**
  - `mandarBienvenidaDeRegalo` con contexto `{idioma:'ca', genero:'mujer'}` manda `bienvenidaDeRegalo('ca', …)`.
  - Sin idioma, manda la de es-AR, ya no la vieja `bienvenida()`.
  - `noExiste` a un `+34` en es-ES, a un `+54` en es-AR.
  - `usadoPorOtro` en el idioma del regalo.
  - **Consentimiento de un regalo `ca`:**
    - «Endavant» lo pasa a `acepto` con `consentimiento_voz_at`;
    - manda `ARRANQUE.ca.aceptacion`;
    - llama `mandarHito('acepto')`;
    - llama `enviarPregunta({…, estado:'acepto'}, 1, {plantilla:false})` aunque el ritmo no sea `seguido`.
  - «Què?» manda `ARRANQUE.ca.noEntendi` una sola vez. «Ara no» manda `ARRANQUE.ca.noQuiere`.
  - **Un narrador que no es regalo:** igual que hoy (los tests existentes no cambian).
  - **`enviarPregunta` con `contexto.regalo === true` y `orden 1` en `acepto`** va a `altaNuevo` aunque `V3_PARA_NUEVOS` no esté. Si `altaNuevo` da `'frenada'`, no manda la pregunta vieja.
- [ ] **Step 3:** Verlos fallar.
- [ ] **Step 4: Implementar.**
  - En `manejarConsentimiento`, cuando es regalo, se usan `ARRANQUE[idiomaDeRegalo(contexto)]` en lugar de `noQuiereTodavia`, `noEntendi` y `bienvenidaAceptacion`, y la pregunta 1 sale siempre con el SÍ.
  - En `preguntar.ts`, la condición del alta V3 pasa a `(v3ParaNuevos() || n.contexto?.regalo === true)`.
  - Comentarios que expliquen por qué: la bienvenida del banco describe la V3, y solo la V3 habla ca/es-ES.
- [ ] **Step 5:** `npm test` en entrevistador, todo verde.
- [ ] **Step 6: Commit** `regalo-idiomas (bot): arranque del regalo en tres idiomas y siempre por la V3`.

---

### Task 5: El recordatorio en tú

**Files:**
- Modify: `entrevistador/src/flujo/regalo-textos.ts` (recordatorio de vos y de tú), `entrevistador/src/flujo/regalo.ts` (`recordarRegalos` lee `familias.region` y elige el trato), `entrevistador/src/mail/hitos.ts` si hace falta pasar el trato
- Test: `entrevistador/test/regalo.test.ts`

- [ ] **Step 1: Test.** Con familia ES, el asunto y el cuerpo salen en tú. La PROPUESTA es «Pasaron unos días desde la fecha que pusiste y la tarjeta sigue sin usar. Si ya se la diste, quizá necesita una mano para escanearla. La tarjeta está en tu tablero.»; la referencia literal es el texto de Task 0. Con familia AR o sin región, el texto de hoy.
- [ ] **Step 2:** Verlo fallar, implementar y ver la suite verde.
- [ ] **Step 3: Commit** `regalo-idiomas (bot): recordatorio de tú para quien compra en España`.

---

### Task 6: Contrato, pase y verificación

- [ ] **Step 1: CONTRATO.md**, sección «Gift card». Agregar:
  - la web escribe `contexto.idioma` para regalos es-ES/ca, y `trato` solo es-AR;
  - los regalos entran a la V3 al SÍ aunque `V3_PARA_NUEVOS` esté apagado;
  - la bienvenida de regalo es `BIEN` + pedido de SÍ en el idioma del regalo.
- [ ] **Step 2: `docs/regalo/handoff-2026-10-08.md`.** Sección nueva «España y catalán (09/10)» con lo hecho y lo pendiente.
- [ ] **Step 3: Suites.** Web (`npm test`, `tsc`, `npm run build`) y entrevistador (`npm test`). Pegar la salida en el resumen.
- [ ] **Step 4: Revisión final de la rama** (superpowers:requesting-code-review), y una sola ola de arreglos.
- [ ] **Step 5: Subir la rama `regalo-idiomas`** cuando Naza diga, y abrir el PR contra `regalo` (o contra `main` si el PR #2 ya entró).
