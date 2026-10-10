# El regalo llega solo el día elegido — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** quien compra una gift card elige un día, una hora y un canal (mail o WhatsApp) para que ese día le llegue el regalo a quien lo recibe. A quien compra le llega el aviso «Hoy le llegó» o el «dásela vos».

**Architecture:**
- La web (`/regalar` y `/api/compra`) valida y guarda cuatro columnas nuevas en `regalos`.
- El entrevistador (Railway) suma una fase a su tick de 15 minutos. Esa fase toma los regalos vencidos con compare-and-swap, manda el mail (Resend) o la plantilla de WhatsApp, y avisa a quien compró.
- El canje acepta, además del código, un número al que ya se le mandó la plantilla.

**Tech Stack:** Next.js + vitest (web), Node/TS + vitest con `crearBaseFalsa` (entrevistador), Supabase, Resend, WhatsApp Cloud API.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-10-regalo-dia-de-entrega-design.md`. Contrato: `supabase/CONTRATO.md` («El regalo llega solo el día elegido»). Migración: `supabase/migrations/20261010000000_regalos_entrega.sql` (la aplica Naza; el código tiene que andar sin ella).
- Textos: **solo** los aprobados en `docs/regalo/dia-de-entrega-textos.md`, carácter por carácter. Ningún texto nuevo de persona sin aprobación de Naza.
- Horas: de 8 a 22, en punto. Se escriben «a las 10», sin «:00».
- Zonas: es-AR → `America/Argentina/Buenos_Aires`; es-ES y ca → `Europe/Madrid`.
- Canales: `mail` | `whatsapp`. `whatsapp` en la web solo con `REGALO_ENTREGA_WHATSAPP=1`; en el bot solo si `WA_PLANTILLAS_V3_LISTAS` incluye `<idioma>:regalo_entrega`.
- Nombres de plantilla en Meta: `regalo_entrega_vos` (es), `regalo_entrega_es_es` (es_ES), `regalo_entrega_ca` (ca). Cuerpo `{{1}}` = como_le_dicen, `{{2}}` = quien_regala; botón URL con sufijo `{{1}}` = código.
- No imprimir correos ni teléfonos enteros en logs: enmascarar (`ab***@gmail.com`, `+54***1234`).
- Commits en castellano, con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Tests web: `cd web && npx vitest run`; tipos `npx tsc --noEmit`. Entrevistador: `cd entrevistador && npx vitest run` y `npx tsc --noEmit -p .`.

---

### Task 1: Web — reglas puras de la entrega

**Files:**
- Modify: `web/src/lib/regalo-reglas.ts` (sin imports de Node; lo usa el navegador)
- Modify: `web/src/lib/regalo.ts` (`validarRegalo` y `DatosRegalo`)
- Test: `web/test/regalo.test.ts`

**Interfaces:**
- Produces:
  - `HORAS_ENTREGA: readonly number[]` (8..22)
  - `type CanalEntrega = "mail" | "whatsapp"`
  - `zonaDeIdioma(idioma: IdiomaRegalo): "America/Argentina/Buenos_Aires" | "Europe/Madrid"`
  - `instanteDeEntrega(fecha: string, hora: number, zona: string): Date` (la hora local de esa zona en UTC, con cambio de horario)
  - `type EntregaRegalo = { canal: CanalEntrega; contacto: string; hora: number; zona: string }`
  - `DatosRegalo.entrega: EntregaRegalo | null`
  - `validarRegalo(crudo, hoy, o?: { whatsapp?: boolean })`. Con `entrega` en el cuerpo, valida:
    - `canal` válido;
    - fecha presente;
    - hora entera en `HORAS_ENTREGA`;
    - mail con forma de mail (lo pasa a minúsculas);
    - celular normalizado con `normalizarTelefono(contacto, idioma === "es-AR" ? "AR" : "ES")` y que cumpla `^\+\d{8,15}$`;
    - `instanteDeEntrega(...) > hoy`;
    - `whatsapp` solo si `o.whatsapp`.

  Mensajes del servidor: `"Falta la hora."`, `"Ese celular parece mal escrito."`, `"Ese correo parece mal escrito."`, `"Esa hora ya pasó."`, `"Falta la fecha."`, `"Ese canal no está disponible."`. Son de vos, como los demás mensajes de `validarRegalo`; los que ve la persona salen del formulario, de `regalo-textos`.

- [ ] Tests (fallan primero):
  - `instanteDeEntrega("2026-12-24", 10, "America/Argentina/Buenos_Aires")` → `2026-12-24T13:00:00Z`;
  - Madrid en invierno `"2026-12-24", 10` → `09:00Z`; en verano `"2026-07-01", 10` → `08:00Z`;
  - el día del cambio `"2026-03-29", 10` → `08:00Z`;
  - `zonaDeIdioma` en los tres idiomas;
  - `validarRegalo` sin `entrega` → `entrega: null`, como hoy;
  - con mail → contacto en minúsculas y la zona según el idioma;
  - con celular AR sin el 9 → `+549…`;
  - hora 7 o 23 o `"10"` → error;
  - canal sin fecha → error;
  - fecha de hoy con una hora que ya pasó → «Esa hora ya pasó.»;
  - `whatsapp` sin `o.whatsapp` → error; con `o.whatsapp` → ok.
- [ ] Implementar. Para `instanteDeEntrega`: `Intl.DateTimeFormat` con `timeZone`; se toma el UTC ingenuo, se calcula el offset de esa zona en ese instante y se corrige una vez más por si cruza un cambio de horario.
- [ ] `npx vitest run test/regalo.test.ts` en verde y commit.

### Task 2: Web — textos e interruptor

**Files:**
- Modify: `web/src/lib/regalo-textos.ts` (tipo `TextosComprador` + `COMPRADOR.vos` / `.tu`)
- Create: `web/src/lib/regalo-entrega.ts` → `entregaWhatsAppPrendida(env = process.env): boolean` (`=== "1"`)
- Test: `web/test/regalo-textos.test.ts`

**Interfaces:**
- Produces, en `TextosComprador`:
  - `mandarloEseDia`, `canales: { nadie; whatsapp; mail }`, `aQueHora`
  - `horaDe: (pais: "AR" | "ES") => string` → «Es la hora de Argentina.» / «Es la hora de España.»
  - `suCelular`, `suCelularPista`, `suCorreo`
  - `faltaHora`, `celularMal`, `correoDeElMal`, `horaPasada`
  - `leLlega: (contacto: string, fecha: string /* dd/mm */, hora: number) => string`
- [ ] Tests: los textos de las tandas 1 y 2 tal cual. Ninguno de los nuevos tiene `:`; `leLlega("abuelo@x.com","24/12",10)` = «Le llega a abuelo@x.com el 24/12 a las 10.».
- [ ] Implementar y commit.

### Task 3: Web — `/api/compra` guarda la entrega

**Files:**
- Modify: `web/src/app/api/compra/route.ts`
- Test: `web/test/compra-regalo.test.ts`

**Interfaces:**
- Consumes: `validarRegalo(..., { whatsapp: entregaWhatsAppPrendida() })`, `DatosRegalo.entrega`.
- El cuerpo trae `regalo.entrega?: { canal, contacto, hora }`. La zona no viene del cuerpo: sale del idioma.
- Las columnas de la fila (insert y retomar): `entrega_canal`, `entrega_contacto`, `entrega_hora`, `entrega_zona` con los valores de `entrega`, o los cuatro en `null` si no hay entrega (al retomar, eso borra una elección vieja).
- [ ] Tests:
  - compra con entrega por mail → el insert de `regalos` lleva las cuatro columnas;
  - sin entrega → las cuatro en null;
  - retomar con entrega → el update las lleva;
  - `whatsapp` con el interruptor apagado → 400 y no se inserta nada;
  - prendido → ok.
- [ ] Implementar y commit.

### Task 4: Web — formulario y confirmación

**Files:**
- Modify: `web/src/app/regalar/formulario.tsx`, `web/src/app/regalar/enviar.ts`, `web/src/app/regalar/page.tsx`
- Test: `web/test/regalar.test.tsx`, `web/test/regalar-enviar.test.ts`

**Interfaces:**
- `PedidoRegalo` suma `entrega: { canal: CanalEntrega; contacto: string; hora: number } | null`.
- `cuerpoCompra` manda `regalo.entrega` solo si no es null y hay fecha.
- `FormularioRegalo` recibe la prop `entregaWhatsApp: boolean`, que `page.tsx` saca de `entregaWhatsAppPrendida()`.
- Paso 2: con fecha aparecen la pregunta y las opciones (sin WhatsApp si la prop es false).
  - Con canal: un `<select>` de hora (8..22) y debajo `horaDe(idioma === "es-AR" ? "AR" : "ES")`.
  - Con WhatsApp, el campo `suCelular`; con mail, `suCorreo`.
  - Validación al seguir: `faltaHora`, `celularMal` (menos de 8 dígitos), `correoDeElMal` (misma regex de mail) y `horaPasada` (`instanteDeEntrega <= ahora`).
  - Si se borra la fecha, la elección vuelve a «No, se la doy yo».
- Paso 4: si hay entrega, una línea con `leLlega(contacto, dd/mm, hora)` arriba del precio.
- [ ] Tests:
  - `cuerpoCompra` con y sin entrega;
  - render: sin fecha no aparece la pregunta; con fecha sí;
  - WhatsApp no aparece con la prop en false;
  - mail sin correo → error `correoDeElMal`;
  - paso 4 muestra «Le llega a … el … a las …».
- [ ] Implementar, `npx vitest run` + `npx tsc --noEmit` y commit.

### Task 5: Entrevistador — textos, hora y plantilla

**Files:**
- Modify: `entrevistador/src/flujo/regalo-textos.ts`
- Create: `entrevistador/src/flujo/regalo-hora.ts` (copia de `instanteDeEntrega`; comentario «copia de web/src/lib/regalo-reglas.ts»)
- Modify: `entrevistador/src/config.ts` (`PLANTILLA_REGALO_ENTREGA`)
- Modify: `entrevistador/src/whatsapp/enviar.ts` (`enviarPlantilla` con botón URL opcional)
- Test: `entrevistador/test/regalo-entrega.test.ts` (nuevo)

**Interfaces:**
- `ENTREGA_COMPRADOR: Record<TratoComprador, { llegoAsunto(como); llegoCuerpo(contacto); falloAsunto(como); falloCuerpo(contacto) }>`, con las tandas 1 y 2, filas 9 y 10.
- `ENTREGA_ABUELO: Record<Idioma, { asunto(quien); antesDelMensaje; siHayAudio; boton; debajoDelBoton(numero) }>`, con la tanda 3, filas 1 a 5.
- `PLANTILLA_REGALO_ENTREGA: Record<Idioma, { nombre; idiomaMeta }>`, con los nombres de Global Constraints.
- `enviarPlantilla(tel, nombre, variables, idioma, o?: OpcionesEnvio & { botonUrl?: string })`. Con `botonUrl` suma `{ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: botonUrl }] }`.
- `instanteDeEntrega(fecha, hora, zona): Date` (los mismos casos de Task 1).
- [ ] Tests: los textos tal cual; `instanteDeEntrega` con los mismos cuatro casos; el payload de `enviarPlantilla` con botón (mock de `fetch`).
- [ ] Implementar y commit.

### Task 6: Entrevistador — la fase de entregas

**Files:**
- Create: `entrevistador/src/flujo/regalo-entrega.ts`
- Modify: `entrevistador/src/mail/hitos.ts` (exportar `mandarMail(para, asunto, htmlCuerpo): Promise<boolean>`, que nunca tira, y `envoltorio`)
- Modify: `entrevistador/src/flujo/scheduler.ts` (después de `recordarRegalos`, try aparte)
- Test: `entrevistador/test/regalo-entrega.test.ts`

**Interfaces:**
```ts
export type DepsEntrega = {
  db: SupabaseClient;
  mandarMail: (para: string, asunto: string, html: string) => Promise<boolean>;
  mandarMailFamilia: MandarMailFamilia;            // de regalo.ts
  enviarPlantilla: (tel: string, nombre: string, vars: string[], idiomaMeta: string, o: { botonUrl: string }) => Promise<string>;
  urlBase: string;                                   // URL_BASE
  numeroPublico: string | null;                      // WHATSAPP_NUMERO_PUBLICO, solo dígitos
  plantillaLista: (idioma: Idioma) => boolean;       // WA_PLANTILLAS_V3_LISTAS incluye `${idioma}:regalo_entrega`
};
export async function entregarRegalos(deps: DepsEntrega, ahora: Date): Promise<number>;
export async function fallarEntregaRegalo(deps: Pick<DepsEntrega,'db'|'mandarMailFamilia'>, narradorId: string, motivo: string): Promise<void>;
```
- Consulta: `regalos` con `entrega_canal` no null, `entrega_enviada_at` null y `usado_at` null; `lte('fecha_entrega', hoyUTC+1)` como corte grueso. Por fila:
  1. `instanteDeEntrega > ahora` → sigue.
  2. Lee el narrador (`familia_id, como_le_dicen, estado, contexto`); si no está en `regalo_pendiente`, sigue.
  3. Toma con `update({ entrega_enviada_at: ahora }).eq(id).is('entrega_enviada_at', null)`; sin fila, sigue.
  4. Si el día local de `ahora` en la zona es posterior a `fecha_entrega` → `fallar('dia_vencido')`.
  5. Mail: arma el HTML con `textosAbuelo` aprobados de la web, copiados en `ENTREGA_ABUELO` (título y `explica` de la tarjeta, ya aprobados; ver Task 5). Va a `entrega_contacto` con link `${urlBase}/regalo/${codigo}`. El código y la línea del número van solo si hay `numeroPublico`; la línea del audio, solo si hay `audio_path`.
  6. WhatsApp: si `!plantillaLista(idioma)` → `fallar('sin_plantilla')`. Si no, `enviarPlantilla(contacto, nombre, [como_le_dicen, quien_regala], idiomaMeta, { botonUrl: codigo })` e insert en `envios` (`tipo: 'regalo_entrega'`, `wa_message_id`).
  7. Si sale, `mandarMailFamilia(familia_id, llegoAsunto(como), llegoCuerpo(contacto), narrador_id)` con el trato de `familias.region`. Si falla un envío → `fallar(motivo)`.
- `fallarEntregaRegalo`: anota `entrega_fallo` (solo si estaba null, para no avisar dos veces) y, si anotó, manda `falloAsunto/falloCuerpo`.
- Si falta una columna (la migración no aplicada, error `42703`) o la tabla (`esTablaAusente`) → devuelve 0 sin tirar.
- [ ] Tests con `crearBaseFalsa`:
  - antes de hora no sale;
  - a la hora sale el mail con el link, el código, el «Hoy le llegó» de vos, y queda `entrega_enviada_at`;
  - un segundo tick no lo repite;
  - ya canjeado no sale;
  - narrador en `pendiente_pago` no sale;
  - mail que falla → `entrega_fallo` y el «dásela vos»;
  - WhatsApp sin plantilla → fallo;
  - WhatsApp ok → plantilla con las variables y el botón, `envios` con `regalo_entrega`;
  - día vencido → fallo sin envío;
  - comprador de España → textos de tú;
  - regalo en catalán → asunto catalán;
  - sin `numeroPublico` → mail sin código;
  - la columna ausente → 0.
- [ ] Implementar, enchufar en `scheduler.ts` (`entregarRegalos(depsReales, ahora)` en su propio try) y commit.

### Task 7: Entrevistador — canje sin código y fallo de Meta

**Files:**
- Modify: `entrevistador/src/flujo/regalo.ts` (`canjearRegalo`)
- Modify: `entrevistador/src/flujo/procesar.ts:126-131`
- Modify: `entrevistador/src/whatsapp/entregas.ts` (`anotarEntrega`)
- Test: `entrevistador/test/regalo.test.ts`, `entrevistador/test/entregas.test.ts` (si existe; si no, en `regalo-entrega.test.ts`)

**Interfaces:**
- `canjearRegalo(deps, m)`: si `extraerCodigo` da null, busca `regalos` con `entrega_canal = 'whatsapp'`, `entrega_contacto` en `variantesDeTelefono(m.telefono)`, `entrega_enviada_at` no null, `entrega_fallo` null y `usado_at` null. Si encuentra, sigue con ese `codigo` por el camino normal. Si no, `'sin_codigo'` como hoy. Un error de columna ausente → `'sin_codigo'`.
- `procesar.ts`: para un número desconocido llama a `canjearRegalo` con cualquier tipo de mensaje (`texto: m.texto ?? ''`).
- `anotarEntrega`: si `fila.tipo === 'regalo_entrega'` y llega `fallido` (sin entrega previa) → `fallarEntregaRegalo(..., 'meta:<codigo>')`, además del aviso de siempre.
- [ ] Tests:
  - un número al que se le mandó la plantilla escribe «hola» → canjeado y bienvenida;
  - el mismo «hola» desde otro número → `sin_codigo`;
  - con `entrega_fallo` → `sin_codigo`;
  - con la variante sin el 9 → canjea;
  - un audio de ese número (procesar) → canjea;
  - fallo de Meta en un `regalo_entrega` → «dásela vos» una vez.
- [ ] Implementar, correr todo el entrevistador y commit.

### Task 8: Revisión, documentos y cierre

- [ ] Segundo agente (code-reviewer) sobre todo el diff de la rama contra `origin/main`: bugs reales con archivo:línea. Lo confirmado se arregla con test.
- [ ] Correr las dos suites completas y `tsc`; anotar los números reales.
- [ ] `docs/regalo/handoff-2026-10-10-dia-de-entrega.md`: qué está, qué falta (migración, OK de Joaquín, plantillas, `WHATSAPP_NUMERO_PUBLICO` en Railway, prueba real por mail) y qué NO hacer.
- [ ] Push de la rama y PR contra `main` (o contra `regalo-antes-de-vender` si el PR #5 todavía no entró).
