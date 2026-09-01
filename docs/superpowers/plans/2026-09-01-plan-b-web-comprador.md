# Plan B: Web Comprador + Fábrica — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La web donde el hijo/a registra a su familiar, sigue el progreso, junta los saludos, previsualiza y paga — más la fábrica que genera el libro (PDF) y el audiolibro.

**Architecture:** Dos piezas, ambas del socio 2 (Naza): `web/` (Next.js App Router en Vercel: landing, registro, tablero, saludos, checkout) y `fabrica/` (worker Node en Railway que revisa la base cada minuto: narradores completados sin previsualización → genera la previsualización; pedidos pagados → genera el paquete completo). La fábrica es un servicio aparte porque generar un libro tarda minutos y usa ffmpeg — no cabe en serverless. Todo se comunica por Supabase (leer `supabase/CONTRATO.md` ANTES de empezar).

**Tech Stack:** Next.js 15 (App Router) + Tailwind, `@supabase/supabase-js` + `@supabase/ssr` (auth con magic link), Stripe Checkout, Mercado Pago Checkout Pro, vitest. Fábrica: Node/TS, `@anthropic-ai/sdk` (**`claude-fable-5`** para el libro — el mejor modelo, decisión de producto), Playwright (HTML→PDF), ffmpeg, OpenAI TTS (`gpt-4o-mini-tts`, voz `nova` — la MISMA voz del entrevistador, para las intros de capítulo).

## Global Constraints

- **Prerequisito:** Plan 0 ejecutado. La web escribe `familias`, `narradores` (crea/edita, y apaga `alerta_silencio`), `saludos` (crea), `pedidos`; la fábrica escribe `pedidos` (`estado`, paths) y Storage `{narrador_id}/paquete/*`. NADA más.
- Textos de la web: español neutro, tuteo cálido hacia el comprador ("registrá a tu papá" no — usar "registra a tu papá": neutro, funciona en ES y AR).
- Precios: leer de env vars `PRECIO_EUR` (default `49`) y `PRECIO_ARS` (default a definir con los pilotos) — jamás hardcodear.
- El navegador nunca recibe paths de Storage: solo URLs firmadas generadas server-side (60 min).
- Regla de estilo del libro (spec §6): primera persona, con las palabras del narrador, citas textuales destacadas, prohibido el perfume a IA genérica.
- Modelos exactos: `claude-fable-5` (libro y detección de entidades), sin sufijos de fecha.
- Env vars web: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MP_ACCESS_TOKEN`, `PRECIO_EUR`, `PRECIO_ARS`, `URL_BASE`. Fábrica: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`.

---

### Task 1: Scaffold de la web

**Files:**
- Create: `web/` (via create-next-app), `web/.env.example`, `web/src/lib/supabase/servidor.ts`, `web/src/lib/supabase/navegador.ts`
- Modify: `README.md` (raíz — sumar la fila de `fabrica/`)
- Test: `web/test/humo.test.ts`

**Interfaces:**
- Produces: app Next.js corriendo; `crearClienteServidor()` (service role, solo para route handlers/server components) y `crearClienteNavegador()` (anon key). Todas las tareas siguientes los importan de `@/lib/supabase/*`.

- [ ] **Step 1: Crear la app**

Run desde la raíz del repo:
```bash
npx create-next-app@latest web --typescript --tailwind --app --src-dir --no-eslint --use-npm
cd web && npm i @supabase/supabase-js @supabase/ssr stripe mercadopago && npm i -D vitest
```
Agregar script `"test": "vitest run"`.

- [ ] **Step 2: Clientes Supabase**

`web/src/lib/supabase/servidor.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

// Solo para código server-side (route handlers, server components, webhooks).
export function crearClienteServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan las variables de Supabase del servidor');
  return createClient(url, key);
}
```

`web/src/lib/supabase/navegador.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Test de humo + fila del README**

`web/test/humo.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
describe('scaffold', () => {
  it('el cliente servidor exige las env vars', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { crearClienteServidor } = await import('../src/lib/supabase/servidor');
    expect(() => crearClienteServidor()).toThrow(/Supabase/);
  });
});
```
En el `README.md` raíz, agregar a la tabla: `| fabrica/ | Socio 2 (Naza) | Worker Node: genera libro y audiolibro. Deploy: Railway. |`

- [ ] **Step 4: Verificar y commit**

Run: `npm test` (en `web/`) → PASS. `npm run dev` → home de Next responde.
```bash
git add web README.md
git commit -m "feat(web): scaffold next.js + clientes supabase"
```

---

### Task 2: Landing + auth con magic link

**Files:**
- Create: `web/src/app/page.tsx`, `web/src/app/entrar/page.tsx`, `web/src/app/api/auth/callback/route.ts`

**Interfaces:**
- Produces: landing pública con la promesa y CTA a `/entrar`; login por magic link de Supabase (email); tras el callback, redirección a `/registro` si la familia no existe o a `/tablero` si existe.

- [ ] **Step 1: Landing**

`page.tsx` server component. Contenido mínimo v1 (el copy fino se itera después, la estructura es esta):
- H1: **En 30 días, el libro de la vida de tu papá. Contado con su propia voz.**
- Sub: Cada mañana le hacemos una pregunta por WhatsApp. Él responde con un audio, como le cuenta las cosas a un amigo. Nosotros lo convertimos en un libro y un audiolibro que quedan para siempre.
- 3 pasos ilustrados (Lo registrás → Él cuenta su vida → Recibís su libro y su voz), sección "los saludos de la familia", precio y CTA **Regalale su bitácora** → `/entrar`.
- Footer: enlace a política de privacidad (placeholder de página legal se crea en Task 8).

- [ ] **Step 2: Magic link**

`/entrar/page.tsx`: form de email → `crearClienteNavegador().auth.signInWithOtp({ email, options: { emailRedirectTo: URL_BASE + '/api/auth/callback' } })` → mensaje "Revisa tu correo". `route.ts` del callback: `createServerClient` de `@supabase/ssr` con cookies (patrón estándar de la doc de Supabase SSR), `exchangeCodeForSession`, luego consultar `familias` por `auth_user_id` y redirigir a `/registro` o `/tablero`.

- [ ] **Step 3: Verificar y commit**

Manual: entrar con un email real, recibir el link, terminar en `/registro`.
```bash
git add web/src/app
git commit -m "feat(web): landing y login con magic link"
```

---

### Task 3: Registro del narrador

**Files:**
- Create: `web/src/app/registro/page.tsx`, `web/src/app/api/registro/route.ts`
- Test: `web/test/registro.test.ts`

**Interfaces:**
- Consumes: sesión de auth (Task 2).
- Produces: `POST /api/registro` con body `{ nombreComprador, region: 'ES'|'AR', narrador: { nombre, comoLeDicen, telefonoWhatsapp, horaPreferida, zonaHoraria, contexto: { lugarNacimiento?, anioNacimiento?, oficio?, datosExtra?, arbol?: { padres?, hermanos?, conyuge?, hijos? } } } }` — `anioNacimiento` va también a la portada del libro ("Roberto · 1952") y le permite al biógrafo anclar épocas ("allá por 1968") — `arbol` son campos de texto libre con los NOMBRES de las personas de su vida ("Los nombres nos ayudan a que el biógrafo escuche bien" — opcional pero recomendado en el form); el entrevistador los usa para personalizar y la fábrica los pre-carga en la corrección de nombres → crea `familias` (si no existe para ese `auth_user_id`) + `narradores` en estado `invitado` → el entrevistador lo descubre solo (su scheduler manda la bienvenida). Devuelve `{ narradorId }` y redirige a `/tablero`.

- [ ] **Step 1: Test del route handler (falla)**

`test/registro.test.ts`: mockear `crearClienteServidor`; verificar que (a) un registro válido inserta familia y narrador con `estado: 'invitado'` y teléfono normalizado a E.164 (`+34...`/`+54...` según región si vino sin prefijo), (b) un teléfono ya registrado devuelve 409 con mensaje claro.

- [ ] **Step 2: Correr y ver que falla** — FAIL.

- [ ] **Step 3: Implementar**

Form con: nombre del comprador, región (ES/AR — define zona horaria default `Europe/Madrid` / `America/Argentina/Buenos_Aires` y prefijo telefónico), datos del narrador (nombre, "¿cómo le decimos?", WhatsApp, hora preferida default 10:00, y los 3 campos de contexto opcionales + texto libre "algo que ayude al biógrafo"). El handler valida, normaliza el teléfono y escribe las dos tablas.

- [ ] **Step 4: Verificar y commit**

Run: `npm test` → PASS. Manual: registrar un narrador de prueba y verlo en la tabla `narradores`.
```bash
git add web/src/app/registro web/src/app/api/registro web/test/registro.test.ts
git commit -m "feat(web): registro del narrador - el regalo empieza aca"
```

---

### Task 4: Tablero de progreso

**Files:**
- Create: `web/src/app/tablero/page.tsx`, `web/src/app/api/audio/[respuestaId]/route.ts`
- Test: `web/test/tablero.test.ts`

**Interfaces:**
- Consumes: `respuestas`, `preguntas`, `narradores` (lectura), `envios` no (es del entrevistador y no lo miramos: el progreso sale de `respuestas` + `dia_actual`).
- Produces: tablero con: estado del narrador en lenguaje humano (`invitado` → "Le mandamos la invitación, falta que acepte"; `pausado` → "Pidió una pausa — un llamado tuyo ayuda"; etc.), barra de progreso X/30, lista de días respondidos con el texto de la pregunta y un reproductor de audio por respuesta, y el banner rojo si `alerta_silencio` ("Tu papá lleva 3 días sin responder — un llamadito tuyo ayuda más que cualquier recordatorio nuestro") con botón "Ya lo llamé" que la apaga (`PATCH` que setea `alerta_silencio = false`). Además, el **cierre anticipado** (spec §8): si el narrador tiene ≥10 respuestas y está `activo` o `pausado`, un enlace discreto "¿Necesitás cerrar la bitácora antes de tiempo?" abre una confirmación con tono cuidadoso (el caso puede ser un fallecimiento) y un `PATCH` pasa el estado a `cerrado_anticipado` — la fábrica genera el libro con los capítulos que existan. `GET /api/audio/[respuestaId]` devuelve redirect 302 a la URL firmada (60 min) del `audio_path` — verifica que la respuesta pertenezca a un narrador de la familia logueada.

- [ ] **Step 1: Test (falla)** — del route de audio: (a) una respuesta de otra familia devuelve 403; (b) una propia devuelve 302 con `Location` firmado (mockear storage).

- [ ] **Step 2: Correr y ver que falla** — FAIL.

- [ ] **Step 3: Implementar** — server component que junta narrador + preguntas + respuestas (agrupar por `pregunta_orden`, las `es_repregunta` van juntas bajo el mismo día), `<audio controls src={/api/audio/...}>`.

- [ ] **Step 4: Verificar y commit**

```bash
git add web/src/app/tablero web/src/app/api/audio web/test/tablero.test.ts
git commit -m "feat(web): tablero de progreso con audios escuchables"
```

---

### Task 5: Saludos de los seres queridos

**Files:**
- Create: `web/src/app/tablero/saludos/page.tsx`, `web/src/app/saludo/[token]/page.tsx`, `web/src/app/api/saludos/route.ts`
- Test: `web/test/saludos.test.ts`

**Interfaces:**
- Produces: el link compartible es `/saludo/{token}` donde `token = narrador_id` firmado — para v1: un JWT `HS256` con payload `{ narradorId }` firmado con `SUPABASE_SERVICE_ROLE_KEY` como secreto, sin expiración (helper `firmarTokenSaludo(narradorId)` / `verificarTokenSaludo(token)` en `web/src/lib/token-saludo.ts`). La página pública (sin login) muestra "Grabale un mensaje a {como_le_dicen}", graba con `MediaRecorder` (webm/opus) o permite subir un archivo, pide nombre y vínculo, y hace `POST /api/saludos` (multipart: token, nombre, vinculo, audio) → sube a `{narrador_id}/saludos/{uuid}.webm` + inserta en `saludos`. En `/tablero/saludos` (con login): el link para copiar/compartir por WhatsApp, la lista de saludos recibidos con reproductor, y borrar (borra fila + archivo).

- [ ] **Step 1: Test (falla)** — del token (firmar/verificar/rechazar token adulterado) y del POST (token inválido → 401; válido → inserta y sube).

- [ ] **Step 2: Correr y ver que falla** — FAIL.

- [ ] **Step 3: Implementar.** La grabación en el navegador: botón grande "Grabar 🎙️" → `navigator.mediaDevices.getUserMedia({ audio: true })` → `MediaRecorder` → preview con `<audio>` → "Enviar el saludo". Máximo 3 minutos (cortar el recorder con `setTimeout`).

- [ ] **Step 4: Verificar y commit**

Manual: grabar un saludo desde el teléfono con el link. 
```bash
git add web/src web/test/saludos.test.ts
git commit -m "feat(web): saludos de los seres queridos con link compartible"
```

---

### Task 6: Scaffold de la fábrica + generación de la estructura del libro

**Files:**
- Create: `fabrica/package.json`, `fabrica/tsconfig.json`, `fabrica/.env.example`, `fabrica/src/worker.ts`, `fabrica/src/db.ts`, `fabrica/src/libro/estructura.ts`
- Test: `fabrica/test/estructura.test.ts`

**Interfaces:**
- Produces: worker que corre `tick()` cada 60 s: (a) narradores `completado` o `cerrado_anticipado` sin `{narrador_id}/paquete/estructura.json` en Storage → `generarEstructura(narradorId)`; (b) pedidos `pagado` → Task 9. `generarEstructura` lee todas las transcripciones + preguntas y escribe `estructura.json`:

```typescript
type Estructura = {
  titulo: string;                 // "Roberto — La historia de una vida"
  capitulos: { nombre: string; ordenes: number[] }[]; // qué preguntas alimentan cada capítulo, en orden de libro
  entidades: { texto: string; tipo: 'persona' | 'lugar'; contexto: string }[]; // para la corrección de nombres
};
```

Los capítulos salen de `preguntas.capitulo` (agrupar los `orden` respondidos por capítulo, en el orden de la primera aparición); las entidades las detecta `claude-fable-5` leyendo todas las transcripciones (prompt: "Listá todas las personas y lugares mencionados, con una frase de contexto cada uno, JSON `[{texto, tipo, contexto}]` — es para que la familia corrija la escritura de los nombres que la transcripción pudo oír mal").

- [ ] **Step 1: Scaffold** — como Task 1 del plan A (npm init, tsc, vitest, scripts), más `npm i @anthropic-ai/sdk @supabase/supabase-js` y `playwright` (se usa en Task 8).

- [ ] **Step 2: Test de la agrupación de capítulos (falla)** — dado un set de preguntas con capítulos `['Infancia','Infancia','El amor']` y respuestas a los órdenes 1,2,3 → `capitulos` = `[{nombre:'Infancia', ordenes:[1,2]},{nombre:'El amor', ordenes:[3]}]`; los órdenes sin respuesta no aparecen (soporta cierre anticipado).

- [ ] **Step 3: Correr y ver que falla, implementar, ver que pasa.** La llamada a Claude para entidades usa `cliente.messages.stream(...)` + `finalMessage()` (respuesta larga). En `worker.ts`, el loop: `setInterval(tick, 60_000)` con lock simple (variable `corriendo` para no solapar ticks).

- [ ] **Step 4: Commit**

```bash
git add fabrica
git commit -m "feat(fabrica): worker + estructura del libro y entidades detectadas"
```

---

### Task 7: Corrección de nombres + previsualización

**Files:**
- Create: `web/src/app/tablero/nombres/page.tsx`, `web/src/app/api/nombres/route.ts`
- Create: `fabrica/src/libro/escribir-capitulo.ts`, `fabrica/src/libro/previsualizar.ts`
- Test: `fabrica/test/escribir-capitulo.test.ts`

**Interfaces:**
- Web produces: página que lee `estructura.json` (vía route con service role), muestra las entidades editables y guarda `{narrador_id}/paquete/nombres.json` (`[{original, corregido}]`). El tablero muestra el aviso "Revisá los nombres antes de que imprimamos" cuando existe estructura y no existe `nombres.json`.
- Fábrica produces: `escribirCapitulo(narrador, capitulo, materiales): Promise<string>` — el corazón del producto (prompt abajo) — y `generarPrevisualizacion(narradorId)`: cuando existen `estructura.json` Y `nombres.json` → escribe SOLO el capítulo 1, arma `preview.html` (portada con `foto_url`, índice completo, capítulo 1, páginas siguientes veladas con "…") → PDF con Playwright → `{narrador_id}/paquete/preview.pdf`; corta el primer audio a 60 s (ffmpeg `-t 60`) → `paquete/muestra_audiolibro.mp3`.

- [ ] **Step 1: Test del prompt de capítulo (falla)** — con SDK mockeado: verificar que el prompt incluye las transcripciones crudas, las correcciones de nombres y las reglas de estilo; que el resultado es el texto devuelto por el modelo.

- [ ] **Step 2: Correr y ver que falla** — FAIL.

- [ ] **Step 3: Implementar. El prompt del capítulo (usarlo textual):**

```typescript
const PROMPT_CAPITULO = (nombre: string, capitulo: string, materiales: string, historiaCompleta: string, nombresCorregidos: string) => `
Estás escribiendo el libro de la vida de ${nombre}, a partir de lo que él mismo contó
en entrevistas grabadas. Este es el capítulo «${capitulo}».

MATERIAL PRINCIPAL (las respuestas de las preguntas de este capítulo, textuales):
${materiales}

LA HISTORIA COMPLETA (todas las entrevistas — buscá acá cualquier cosa que pertenezca
a este capítulo aunque la haya contado otro día, emocionado, en medio de otro tema;
NO traigas lo que claramente pertenece a otro capítulo):
${historiaCompleta}

CORRECCIONES DE NOMBRES (la transcripción automática oyó mal; usar SIEMPRE la forma corregida):
${nombresCorregidos}

REGLAS — este libro es SU voz, no la tuya:
1. Primera persona. El narrador es él.
2. Usá SUS palabras, SUS giros, SUS muletillas queridas. Tu trabajo es ordenar y pulir
   apenas, no "redactar bonito". Si él dice «mi vieja», el libro dice «mi vieja».
3. Las frases más potentes van TEXTUALES, marcadas así: > para destacarlas como cita.
4. No inventes NADA. Ni un detalle, ni un adjetivo emocional que él no haya dado.
   Si el material es escaso, el capítulo es corto. Cortito y verdadero gana siempre.
5. Ordená cronológica o temáticamente dentro del capítulo, uniendo con transiciones
   mínimas y naturales.
6. Prohibido el perfume a IA: nada de «fue una época llena de desafíos», «sin duda»,
   «cabe destacar». Si una frase la podría haber escrito un robot, sacala.

Devolvé SOLO el texto del capítulo en Markdown (sin el título del capítulo).`;
```

La llamada: `cliente.messages.stream({ model: 'claude-fable-5', max_tokens: 20000, messages: [...] })` → `finalMessage()`. (Fable 5: no pasar parámetro `thinking`; viene activado solo.)

- [ ] **Step 4: Verificar y commit**

Run: `npm test` en `fabrica/` → PASS. Manual con el set dorado (Task 10): generar una previsualización real y leerla — ¿suena a él o a robot? Iterar el prompt acá si hace falta.
```bash
git add web/src fabrica/src fabrica/test
git commit -m "feat: correccion de nombres y previsualizacion - el momento de enamorar"
```

---

### Task 8: Checkout — Stripe + Mercado Pago

**Files:**
- Create: `web/src/app/comprar/page.tsx`, `web/src/lib/pagos.ts`, `web/src/app/api/checkout/route.ts`, `web/src/app/api/webhooks/stripe/route.ts`, `web/src/app/api/webhooks/mercadopago/route.ts`, `web/src/app/legal/privacidad/page.tsx`
- Test: `web/test/pagos.test.ts`

**Interfaces:**
- Produces: `web/src/lib/pagos.ts` exporta `crearCheckout(pedido: { id, region, email }): Promise<{ urlPago: string }>` — con `region 'ES'` crea una Stripe Checkout Session (`mode: 'payment'`, `line_items` con `PRECIO_EUR`, `metadata.pedido_id`, `success_url: /tablero/descarga`); con `'AR'` crea una preferencia de Mercado Pago (`unit_price: PRECIO_ARS`, `external_reference: pedido_id`, `back_urls`). `/comprar` muestra la previsualización (`preview.pdf` embebido + reproductor de la muestra) y el botón de pago → `POST /api/checkout` inserta el `pedido` (`pendiente`) y redirige a `urlPago`. Los webhooks verifican firma (Stripe: `constructEvent` con `STRIPE_WEBHOOK_SECRET`; MP: consultar el pago por id contra la API con `MP_ACCESS_TOKEN`) y marcan `pedidos.estado = 'pagado'`. La página de privacidad cubre lo mínimo RGPD (qué guardamos, para qué, derecho a borrado escribiendo al email de contacto).

- [ ] **Step 1: Test (falla)** — de `crearCheckout`: región ES llama a Stripe con el monto de `PRECIO_EUR` en centavos; región AR llama a MP con `PRECIO_ARS`; del webhook Stripe: evento `checkout.session.completed` con `metadata.pedido_id` marca el pedido pagado, firma inválida → 400.

- [ ] **Step 2: Correr y ver que falla** — FAIL.

- [ ] **Step 3: Implementar** con los SDKs oficiales (`stripe`, `mercadopago`). El pedido se crea con `monto` y `moneda` según región.

- [ ] **Step 4: Verificar y commit**

Manual: pago de prueba con tarjeta de test de Stripe (4242…) y flujo sandbox de MP.
```bash
git add web/src web/test/pagos.test.ts
git commit -m "feat(web): checkout stripe + mercado pago con webhooks verificados"
```

---

### Task 9: La fábrica completa — libro y audiolibro finales

**Files:**
- Create: `fabrica/src/libro/generar-paquete.ts`, `fabrica/src/libro/plantilla-html.ts`, `fabrica/src/audio/audiolibro.ts`
- Create: `web/src/app/tablero/descarga/page.tsx`
- Modify: `fabrica/src/worker.ts` (rama pedidos pagados)
- Test: `fabrica/test/audiolibro.test.ts`, `fabrica/test/plantilla.test.ts`

**Interfaces:**
- Produces: al detectar `pedidos.estado = 'pagado'` → `'generando'` → `generarPaquete(pedido)`:
  1. **Libro:** `escribirCapitulo` (Task 7) por cada capítulo de la estructura → pasada de editor: una llamada final a `claude-fable-5` con el libro entero ("Revisá coherencia entre capítulos, agregá referencias cruzadas naturales donde ayuden, y escribí la apertura «A mis lectores» y el cierre, ambos en su voz, a partir de toda la historia. Devolvé el libro completo en Markdown.") → `plantilla-html.ts` lo convierte a HTML de libro (A5, portada con foto, índice, página de saludos con nombres y vínculos, tipografía serif tipo Lora vía Google Fonts, CSS `@page` para imprenta) → Playwright `page.pdf({ format: 'A5', printBackground: true })` → subir `paquete/libro.pdf`.
  2. **Audiolibro:** por capítulo: intro TTS ("Capítulo N: {nombre}", misma voz `nova`) + los audios originales de sus órdenes en secuencia, normalizados (`ffmpeg loudnorm`) y concatenados → `paquete/audiolibro_cap_NN.mp3`; bonus final con los saludos ("Mensajes para usted") → `paquete/audiolibro_bonus_saludos.mp3`; concatenación completa → `paquete/audiolibro_completo.mp3`.
  3. `pedidos.update({ estado: 'entregado', libro_pdf_path, audiolibro_paths })`.
  4. Ante cualquier excepción: `estado = 'fallido'` + log con el error (el tick NO reintenta solo los fallidos; se reintenta a mano poniendo el estado de vuelta en `pagado`).
- `/tablero/descarga`: si el pedido está `generando` → "Estamos imprimiendo su historia… (esto tarda unos minutos, te avisamos por email)"; si `entregado` → links de descarga vía URLs firmadas + reproductor del audiolibro. Queda accesible para siempre.

- [ ] **Step 1: Tests (fallan)** — `audiolibro.test.ts`: el armado de la lista de concatenación respeta el orden (intro, dia_04.ogg, dia_04_2.ogg…) — testear la función pura `armarListaConcat(estructura, archivos)`. `plantilla.test.ts`: el HTML contiene portada, todos los capítulos del markdown y la página de saludos.

- [ ] **Step 2: Correr y ver que fallan** — FAIL.

- [ ] **Step 3: Implementar.** ffmpeg vía `child_process.execFile` con archivos temporales en `os.tmpdir()`; en Railway agregar `ffmpeg` a los paquetes de nixpacks (`nixpacks.toml` con `[phases.setup] nixPkgs = ['ffmpeg']`) y `npx playwright install chromium --with-deps` en el build.

- [ ] **Step 4: Verificar y commit**

Run: `npm test` en `fabrica/` → PASS. Manual: correr `generarPaquete` contra el set dorado y abrir el PDF: portada, índice, capítulos, citas destacadas, saludos. Escuchar el audiolibro completo.
```bash
git add fabrica web/src/app/tablero/descarga
git commit -m "feat(fabrica): libro y audiolibro finales - el paquete que se paga"
```

---

### Task 10: Set dorado + deploys

**Files:**
- Create: `fabrica/set-dorado/narrador.json`, `fabrica/set-dorado/respuestas.json`, `fabrica/src/cargar-set-dorado.ts`
- Create: `web/vercel.json` (si hace falta config), `fabrica/railway.json`, `fabrica/nixpacks.toml`

**Interfaces:**
- Produces: un narrador ficticio completo ("Osvaldo, 74, mecánico de Avellaneda") con 30 transcripciones realistas escritas a mano (200-400 palabras cada una, con muletillas, nombres propios y emoción genuina — escribirlas es parte de esta task, son la vara de calidad del libro) + script `npm run set-dorado` que lo carga en la base como narrador `completado` con respuestas sin audio (`texto_directo`). Permite iterar la fábrica sin esperar 30 días reales. Deploys: `web/` en Vercel (root dir `web/`), `fabrica/` en Railway (root dir `fabrica/`).

- [ ] **Step 1: Escribir las 30 respuestas de Osvaldo** — realistas, en voz rioplatense mayor, cubriendo los capítulos del seed. Este material es el banco de pruebas de la regla de estilo n.º 1.

- [ ] **Step 2: Script de carga** — inserta familia de prueba + narrador (`completado`) + 30 respuestas con `texto_directo` y `transcripcion`.

- [ ] **Step 3: Deploys** — Vercel: importar el repo, root directory `web/`, cargar env vars. Railway: servicio `fabrica`, root `fabrica/`, env vars, verificar en logs que el tick corre cada 60 s.

- [ ] **Step 4: Prueba de punta a punta con el set dorado y commit**

Cargar a Osvaldo → la fábrica genera estructura → corregir un nombre en la web → previsualización → pagar con tarjeta de test → paquete completo descargable. Leer el libro de Osvaldo entero: ¿lloramos o dijimos "está lindo"?

```bash
git add fabrica web
git commit -m "feat: set dorado de osvaldo + deploys de web y fabrica"
```

---

## Verificación final del plan

- [ ] `npm test` en verde en `web/` y `fabrica/`.
- [ ] Flujo completo del set dorado: carga → estructura → nombres → previsualización → pago de prueba → libro + audiolibro descargados.
- [ ] El PDF abre bien, la tipografía es de libro, las citas se destacan, los saludos tienen su página.
- [ ] Ninguna escritura fuera de lo permitido por `supabase/CONTRATO.md`.
