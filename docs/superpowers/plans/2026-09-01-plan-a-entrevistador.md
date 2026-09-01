# Plan A: Servicio Entrevistador — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El servicio que conversa por WhatsApp con el narrador: envía la pregunta diaria con reconocimiento de la respuesta anterior, recibe y transcribe los audios, repregunta cuando hace falta, genera las 5 preguntas adaptativas finales y entrega los saludos al cierre.

**Architecture:** Servicio Node/TypeScript (Fastify) en `entrevistador/` del monorepo. Un webhook recibe los mensajes de WhatsApp (Meta Cloud API); un cron cada 15 minutos decide a quién enviarle qué. Todo el estado vive en Supabase (ver `supabase/CONTRATO.md` — leerlo ANTES de empezar). No llama nunca a la web.

**Tech Stack:** Node 20+, TypeScript, Fastify, vitest, `@supabase/supabase-js`, `@anthropic-ai/sdk` (cerebro: `claude-opus-5`), OpenAI API (Whisper `whisper-1` para transcripción, `gpt-4o-mini-tts` para la voz del entrevistador), Meta WhatsApp Cloud API, node-cron. Deploy: Railway (root dir `entrevistador/`).

## Global Constraints

- **Prerequisito:** Plan 0 ejecutado (tablas y bucket existen). Leer `supabase/CONTRATO.md`: este servicio solo escribe `respuestas`, `envios`, `preguntas` (adaptativas), `saludos.entregado`, y de `narradores` únicamente `estado`, `dia_actual`, `ultima_respuesta_at`, `alerta_silencio`.
- El entrevistador trata al narrador de **usted**, cálido, jamás genérico. Todos los textos al narrador en español neutro (sin modismos regionales).
- Una sola repregunta por pregunta, jamás dos. Recordatorio: uno por día como máximo.
- Los mensajes que inician conversación (pregunta diaria, recordatorio, bienvenida) van como **plantilla aprobada de Meta**; las respuestas dentro de la ventana de 24 hs van como texto/audio libre.
- Variables de entorno (crear `.env` desde `.env.example`; nunca commitear `.env`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `WA_TOKEN`, `WA_PHONE_NUMBER_ID`, `WA_VERIFY_TOKEN`, `PUERTO`.
- Modelo del cerebro: `claude-opus-5` exacto, sin sufijos de fecha.

---

### Task 1: Scaffold del servicio

**Files:**
- Create: `entrevistador/package.json`, `entrevistador/tsconfig.json`, `entrevistador/.env.example`
- Create: `entrevistador/src/servidor.ts`, `entrevistador/src/config.ts`, `entrevistador/src/db/cliente.ts`
- Test: `entrevistador/test/config.test.ts`

**Interfaces:**
- Produces: `config` (objeto tipado con todas las env vars), `db` (cliente Supabase con service role), servidor Fastify con `GET /salud` → `{ok: true}`. Todas las tareas siguientes importan `config` desde `./config` y `db` desde `./db/cliente`.

- [ ] **Step 1: Inicializar el paquete**

Run desde `entrevistador/`:
```bash
npm init -y && npm i fastify @supabase/supabase-js @anthropic-ai/sdk node-cron && npm i -D typescript tsx vitest @types/node
npx tsc --init --target es2022 --module nodenext --moduleResolution nodenext --outDir dist --strict true
```
En `package.json` agregar `"type": "module"` y scripts: `"dev": "tsx watch src/servidor.ts"`, `"test": "vitest run"`, `"build": "tsc"`, `"start": "node dist/servidor.js"`.

- [ ] **Step 2: Test de config que falla**

`test/config.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('config', () => {
  it('lee las variables de entorno y explota si falta una', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
    vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
    vi.stubEnv('OPENAI_API_KEY', 'clave');
    vi.stubEnv('WA_TOKEN', 'clave');
    vi.stubEnv('WA_PHONE_NUMBER_ID', '123');
    vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');
    const { cargarConfig } = await import('../src/config.js');
    expect(cargarConfig().waPhoneNumberId).toBe('123');
    vi.stubEnv('WA_TOKEN', '');
    expect(() => cargarConfig()).toThrow(/WA_TOKEN/);
  });
});
```

- [ ] **Step 3: Correr y ver que falla**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/config.js'`.

- [ ] **Step 4: Implementar config, cliente db y servidor**

`src/config.ts`:
```typescript
function exigir(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

export function cargarConfig() {
  return {
    supabaseUrl: exigir('SUPABASE_URL'),
    supabaseServiceKey: exigir('SUPABASE_SERVICE_ROLE_KEY'),
    anthropicKey: exigir('ANTHROPIC_API_KEY'),
    openaiKey: exigir('OPENAI_API_KEY'),
    waToken: exigir('WA_TOKEN'),
    waPhoneNumberId: exigir('WA_PHONE_NUMBER_ID'),
    waVerifyToken: exigir('WA_VERIFY_TOKEN'),
    puerto: Number(process.env.PUERTO ?? 3001),
  };
}
export type Config = ReturnType<typeof cargarConfig>;
```

`src/db/cliente.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { cargarConfig } from '../config.js';

const config = cargarConfig();
export const db = createClient(config.supabaseUrl, config.supabaseServiceKey);
```

`src/servidor.ts`:
```typescript
import Fastify from 'fastify';
import { cargarConfig } from './config.js';

const config = cargarConfig();
export const app = Fastify({ logger: true });

app.get('/salud', async () => ({ ok: true }));

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: config.puerto, host: '0.0.0.0' });
}
```

`.env.example` con las 8 variables listadas en Global Constraints (valores de ejemplo vacíos).

- [ ] **Step 5: Verificar que pasa y commit**

Run: `npm test` → PASS.
```bash
git add entrevistador
git commit -m "feat(entrevistador): scaffold fastify + config + cliente supabase"
```

---

### Task 2: Cliente WhatsApp saliente

**Files:**
- Create: `entrevistador/src/whatsapp/enviar.ts`
- Test: `entrevistador/test/enviar.test.ts`

**Interfaces:**
- Produces: `enviarTexto(telefono, texto): Promise<string>` (devuelve wa_message_id), `enviarPlantilla(telefono, nombrePlantilla, variables: string[]): Promise<string>`, `enviarAudioPorLink(telefono, url): Promise<string>`. Consumidas por Tasks 6-11.

- [ ] **Step 1: Test con fetch mockeado**

`test/enviar.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('WA_TOKEN', 'token-prueba');
vi.stubEnv('WA_PHONE_NUMBER_ID', '999');
// (stub del resto de env vars como en config.test.ts)

describe('enviar', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ messages: [{ id: 'wamid.ABC' }] }), { status: 200 },
    )));
  });

  it('envía texto libre al endpoint de Meta y devuelve el id', async () => {
    const { enviarTexto } = await import('../src/whatsapp/enviar.js');
    const id = await enviarTexto('+5491155551234', 'Hola Don Roberto');
    expect(id).toBe('wamid.ABC');
    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toContain('/999/messages');
    const body = JSON.parse(init.body);
    expect(body.type).toBe('text');
    expect(body.to).toBe('+5491155551234');
  });

  it('envía plantilla con variables de cuerpo', async () => {
    const { enviarPlantilla } = await import('../src/whatsapp/enviar.js');
    await enviarPlantilla('+5491155551234', 'pregunta_diaria', ['Don Roberto', '¿Cómo era su casa?']);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.type).toBe('template');
    expect(body.template.name).toBe('pregunta_diaria');
    expect(body.template.components[0].parameters).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Correr y ver que falla** — `npm test` → FAIL (módulo no existe).

- [ ] **Step 3: Implementar**

`src/whatsapp/enviar.ts`:
```typescript
import { cargarConfig } from '../config.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

async function postMensaje(payload: Record<string, unknown>): Promise<string> {
  const config = cargarConfig();
  const res = await fetch(`${GRAPH}/${config.waPhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.waToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  });
  const json = await res.json() as { messages?: { id: string }[]; error?: { message: string } };
  if (!res.ok || !json.messages) throw new Error(`WhatsApp rechazó el envío: ${json.error?.message ?? res.status}`);
  return json.messages[0].id;
}

export function enviarTexto(telefono: string, texto: string) {
  return postMensaje({ to: telefono, type: 'text', text: { body: texto } });
}

export function enviarPlantilla(telefono: string, nombre: string, variables: string[]) {
  return postMensaje({
    to: telefono,
    type: 'template',
    template: {
      name: nombre,
      language: { code: 'es' },
      components: [{ type: 'body', parameters: variables.map((v) => ({ type: 'text', text: v })) }],
    },
  });
}

export function enviarAudioPorLink(telefono: string, url: string) {
  return postMensaje({ to: telefono, type: 'audio', audio: { link: url } });
}
```

- [ ] **Step 4: Verificar y commit**

Run: `npm test` → PASS.
```bash
git add entrevistador/src/whatsapp/enviar.ts entrevistador/test/enviar.test.ts
git commit -m "feat(entrevistador): cliente whatsapp saliente (texto, plantilla, audio)"
```

---

### Task 3: Webhook entrante

**Files:**
- Create: `entrevistador/src/whatsapp/webhook.ts`
- Modify: `entrevistador/src/servidor.ts` (registrar rutas)
- Test: `entrevistador/test/webhook.test.ts`

**Interfaces:**
- Produces: `GET /webhook` (verificación de Meta: responde `hub.challenge` si `hub.verify_token` coincide) y `parsearEntrante(body): MensajeEntrante | null` donde `MensajeEntrante = { telefono: string; tipo: 'audio' | 'texto'; texto?: string; mediaId?: string; waMessageId: string }`. `POST /webhook` responde 200 SIEMPRE (Meta reintenta si no) y despacha a `procesarEntrante` (Task 6) sin esperar.

- [ ] **Step 1: Test con payloads reales de Meta**

`test/webhook.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { parsearEntrante } from '../src/whatsapp/webhook.js';

const payloadAudio = {
  entry: [{ changes: [{ value: { messages: [{
    from: '5491155551234', id: 'wamid.X1', type: 'audio', audio: { id: 'media-77' },
  }] } }] }],
};
const payloadTexto = {
  entry: [{ changes: [{ value: { messages: [{
    from: '5491155551234', id: 'wamid.X2', type: 'text', text: { body: 'SÍ' },
  }] } }] }],
};
const payloadEstado = { entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.X3', status: 'delivered' }] } }] }] };

describe('parsearEntrante', () => {
  it('extrae un audio con su media id', () => {
    expect(parsearEntrante(payloadAudio)).toEqual({
      telefono: '+5491155551234', tipo: 'audio', mediaId: 'media-77', waMessageId: 'wamid.X1',
    });
  });
  it('extrae un texto', () => {
    expect(parsearEntrante(payloadTexto)).toMatchObject({ tipo: 'texto', texto: 'SÍ' });
  });
  it('ignora las notificaciones de estado (delivered/read)', () => {
    expect(parsearEntrante(payloadEstado)).toBeNull();
  });
});
```

- [ ] **Step 2: Correr y ver que falla** — `npm test` → FAIL.

- [ ] **Step 3: Implementar**

`src/whatsapp/webhook.ts`:
```typescript
import type { FastifyInstance } from 'fastify';
import { cargarConfig } from '../config.js';

export type MensajeEntrante = {
  telefono: string;
  tipo: 'audio' | 'texto';
  texto?: string;
  mediaId?: string;
  waMessageId: string;
};

export function parsearEntrante(body: any): MensajeEntrante | null {
  const mensaje = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!mensaje) return null;
  const base = { telefono: `+${mensaje.from}`, waMessageId: mensaje.id };
  if (mensaje.type === 'audio') return { ...base, tipo: 'audio', mediaId: mensaje.audio.id };
  if (mensaje.type === 'text') return { ...base, tipo: 'texto', texto: mensaje.text.body };
  return null; // imágenes, stickers, reacciones: se ignoran en v1
}

export function registrarWebhook(app: FastifyInstance, procesar: (m: MensajeEntrante) => Promise<void>) {
  const config = cargarConfig();

  app.get('/webhook', async (req, reply) => {
    const q = req.query as Record<string, string>;
    if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === config.waVerifyToken) {
      return reply.send(q['hub.challenge']);
    }
    return reply.code(403).send();
  });

  app.post('/webhook', async (req, reply) => {
    reply.send({ ok: true }); // 200 inmediato: Meta reintenta ante cualquier otra cosa
    const entrante = parsearEntrante(req.body);
    if (entrante) {
      procesar(entrante).catch((err) => app.log.error({ err, entrante }, 'fallo procesando entrante'));
    }
  });
}
```

En `src/servidor.ts`, después de crear `app`, registrar: `registrarWebhook(app, procesarEntrante)` importando `procesarEntrante` desde `./flujo/procesar.js` (se crea en Task 6; hasta entonces, usar un stub local `async () => {}` y dejar un `// TODO Task 6` NO — en su lugar crear ya el archivo `src/flujo/procesar.ts` con `export async function procesarEntrante(m: MensajeEntrante): Promise<void> {}` vacío que Task 6 completa).

- [ ] **Step 4: Verificar y commit**

Run: `npm test` → PASS.
```bash
git add entrevistador/src entrevistador/test/webhook.test.ts
git commit -m "feat(entrevistador): webhook de whatsapp con verificacion y parseo"
```

---

### Task 4: Descarga de audio y guardado en Storage

**Files:**
- Create: `entrevistador/src/whatsapp/media.ts`
- Create: `entrevistador/src/db/respuestas.ts`
- Test: `entrevistador/test/media.test.ts`

**Interfaces:**
- Consumes: `db` (Task 1), `MensajeEntrante` (Task 3).
- Produces: `descargarAudio(mediaId): Promise<Buffer>` y `guardarRespuestaAudio(narradorId, preguntaOrden, audio: Buffer, esRepregunta: boolean): Promise<{ id: string; audioPath: string }>` que sube a Storage como `{narrador_id}/dia_NN.ogg` (o `_2`, `_3` si ya existe) e inserta en `respuestas` (sin transcripción todavía).

- [ ] **Step 1: Test de la convención de paths (falla)**

`test/media.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { pathDeAudio } from '../src/whatsapp/media.js';

describe('pathDeAudio', () => {
  it('arma el path con orden a dos dígitos', () => {
    expect(pathDeAudio('abc-123', 4, [])).toBe('abc-123/dia_04.ogg');
  });
  it('agrega sufijo si ya hay audios ese día', () => {
    expect(pathDeAudio('abc-123', 4, ['abc-123/dia_04.ogg'])).toBe('abc-123/dia_04_2.ogg');
    expect(pathDeAudio('abc-123', 4, ['abc-123/dia_04.ogg', 'abc-123/dia_04_2.ogg'])).toBe('abc-123/dia_04_3.ogg');
  });
});
```

- [ ] **Step 2: Correr y ver que falla** — `npm test` → FAIL.

- [ ] **Step 3: Implementar**

`src/whatsapp/media.ts`:
```typescript
import { cargarConfig } from '../config.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

export function pathDeAudio(narradorId: string, orden: number, existentes: string[]): string {
  const dia = String(orden).padStart(2, '0');
  const base = `${narradorId}/dia_${dia}`;
  if (!existentes.includes(`${base}.ogg`)) return `${base}.ogg`;
  let n = 2;
  while (existentes.includes(`${base}_${n}.ogg`)) n++;
  return `${base}_${n}.ogg`;
}

export async function descargarAudio(mediaId: string): Promise<Buffer> {
  const config = cargarConfig();
  const auth = { headers: { Authorization: `Bearer ${config.waToken}` } };
  const meta = await fetch(`${GRAPH}/${mediaId}`, auth);
  if (!meta.ok) throw new Error(`No pude obtener la URL del media ${mediaId}: ${meta.status}`);
  const { url } = await meta.json() as { url: string };
  const archivo = await fetch(url, auth);
  if (!archivo.ok) throw new Error(`No pude descargar el media ${mediaId}: ${archivo.status}`);
  return Buffer.from(await archivo.arrayBuffer());
}
```

`src/db/respuestas.ts`:
```typescript
import { db } from './cliente.js';
import { pathDeAudio } from '../whatsapp/media.js';

export async function guardarRespuestaAudio(
  narradorId: string, preguntaOrden: number, audio: Buffer, esRepregunta: boolean,
): Promise<{ id: string; audioPath: string }> {
  const { data: archivos } = await db.storage.from('audios').list(narradorId);
  const existentes = (archivos ?? []).map((a) => `${narradorId}/${a.name}`);
  const audioPath = pathDeAudio(narradorId, preguntaOrden, existentes);

  const subida = await db.storage.from('audios').upload(audioPath, audio, { contentType: 'audio/ogg' });
  if (subida.error) throw new Error(`Storage rechazó ${audioPath}: ${subida.error.message}`);

  const { data, error } = await db.from('respuestas')
    .insert({ narrador_id: narradorId, pregunta_orden: preguntaOrden, audio_path: audioPath, es_repregunta: esRepregunta })
    .select('id').single();
  if (error) throw new Error(`No pude insertar la respuesta: ${error.message}`);
  return { id: data.id, audioPath };
}
```

- [ ] **Step 4: Verificar y commit**

Run: `npm test` → PASS.
```bash
git add entrevistador/src entrevistador/test/media.test.ts
git commit -m "feat(entrevistador): descarga de media de meta y guardado con convencion de paths"
```

---

### Task 5: Transcripción con Whisper

**Files:**
- Create: `entrevistador/src/ia/transcribir.ts`
- Test: `entrevistador/test/transcribir.test.ts`

**Interfaces:**
- Produces: `transcribir(audio: Buffer): Promise<{ texto: string; duracionSegundos: number }>` y `transcribirYActualizar(respuestaId, audio): Promise<{ texto: string; duracionSegundos: number }>` que además hace `update respuestas set transcripcion, duracion_segundos`.

- [ ] **Step 1: Test con fetch mockeado (falla)**

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('transcribir', () => {
  it('manda el audio a whisper y devuelve texto y duración', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ text: 'Yo nací en un pueblo chico.', duration: 52.3 }), { status: 200 },
    )));
    const { transcribir } = await import('../src/ia/transcribir.js');
    const resultado = await transcribir(Buffer.from('audio-falso'));
    expect(resultado.texto).toBe('Yo nací en un pueblo chico.');
    expect(resultado.duracionSegundos).toBe(52);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain('audio/transcriptions');
  });
});
```

- [ ] **Step 2: Correr y ver que falla** — FAIL.

- [ ] **Step 3: Implementar**

`src/ia/transcribir.ts`:
```typescript
import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';

export async function transcribir(audio: Buffer): Promise<{ texto: string; duracionSegundos: number }> {
  const config = cargarConfig();
  const form = new FormData();
  form.append('file', new Blob([audio], { type: 'audio/ogg' }), 'audio.ogg');
  form.append('model', 'whisper-1');
  form.append('language', 'es');
  form.append('response_format', 'verbose_json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.openaiKey}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Whisper falló: ${res.status} ${await res.text()}`);
  const json = await res.json() as { text: string; duration: number };
  return { texto: json.text, duracionSegundos: Math.round(json.duration) };
}

export async function transcribirYActualizar(respuestaId: string, audio: Buffer) {
  const resultado = await transcribir(audio);
  const { error } = await db.from('respuestas')
    .update({ transcripcion: resultado.texto, duracion_segundos: resultado.duracionSegundos })
    .eq('id', respuestaId);
  if (error) throw new Error(`No pude guardar la transcripción: ${error.message}`);
  return resultado;
}
```

- [ ] **Step 4: Verificar y commit**

```bash
git add entrevistador/src/ia entrevistador/test/transcribir.test.ts
git commit -m "feat(entrevistador): transcripcion whisper con duracion"
```

---

### Task 6: El cerebro — reconocimiento, evaluación de riqueza y detección de intención

**Files:**
- Create: `entrevistador/src/ia/cerebro.ts`
- Test: `entrevistador/test/cerebro.test.ts`

**Interfaces:**
- Produces (todas usan `claude-opus-5` vía `@anthropic-ai/sdk`):
  - `generarReconocimiento(comoLeDicen: string, transcripcionAyer: string, preguntaDeHoy: string, historiaHastaAhora: string, arbol: Record<string, string>, anioNacimiento?: number): Promise<string>` (`arbol` = `narrador.contexto.arbol ?? {}`, `anioNacimiento` = `narrador.contexto.anioNacimiento`) — 1-2 frases cálidas y específicas: reconoce lo de ayer Y, si el narrador ya adelantó el tema de la pregunta de hoy en cualquier respuesta anterior, lo referencia ("usted ya me adelantó algo de esto cuando contó...") para que la pregunta fija se sienta personal. `historiaHastaAhora` = todas las transcripciones previas concatenadas (entran cómodas en contexto).
  - `evaluarRespuesta(pregunta: string, transcripcion: string, duracionSegundos: number): Promise<{ suficiente: boolean; repregunta?: string }>` — `suficiente: false` solo si es corta (<40 s) O superficial; incluye la repregunta lista para enviar.
  - `detectarIntencion(texto: string): Promise<'quiere_parar' | 'normal'>` — para mensajes de texto del narrador.

- [ ] **Step 1: Tests con el SDK mockeado (fallan)**

`test/cerebro.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';

const crearMock = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: crearMock }; },
}));

describe('cerebro', () => {
  it('genera un reconocimiento de una sola frase', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Qué historia la del taller de su padre, Don Roberto.' }] });
    const { generarReconocimiento } = await import('../src/ia/cerebro.js');
    const frase = await generarReconocimiento('Don Roberto', 'Mi padre tenía un taller...');
    expect(frase).toContain('taller');
  });

  it('evalúa una respuesta corta como insuficiente y trae repregunta', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": false, "repregunta": "¿Y qué sentía usted en ese taller?"}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Linda.', 8);
    expect(r.suficiente).toBe(false);
    expect(r.repregunta).toBeTruthy();
  });

  it('una respuesta larga y rica pasa sin repregunta', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": true}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Era una casa de adobe con un patio enorme donde...', 95);
    expect(r.suficiente).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y ver que falla** — FAIL.

- [ ] **Step 3: Implementar con los prompts reales**

`src/ia/cerebro.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';

const MODELO = 'claude-opus-5';
const cliente = new Anthropic({ apiKey: cargarConfig().anthropicKey });

const ESTILO = `Sos el biógrafo de la familia: una persona cálida que está escribiendo el libro
de la vida de un señor o señora mayor a partir de sus relatos por WhatsApp.
Le hablás de usted, con respeto y afecto genuino, en español neutro (nada de modismos regionales).
Sos breve. Jamás sonás a robot ni a formulario.`;

function textoDe(respuesta: Anthropic.Message): string {
  const bloque = respuesta.content.find((b) => b.type === 'text');
  if (!bloque || bloque.type !== 'text') throw new Error('Claude no devolvió texto');
  return bloque.text.trim();
}

export async function generarReconocimiento(
  comoLeDicen: string, transcripcionAyer: string, preguntaDeHoy: string, historiaHastaAhora: string,
  arbol: Record<string, string> = {}, anioNacimiento?: number,
): Promise<string> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 400, system: ESTILO,
    messages: [{
      role: 'user',
      content: `Ayer ${comoLeDicen} contó esto en la entrevista:\n\n"${transcripcionAyer}"\n\nLa pregunta que le vas a hacer HOY es: "${preguntaDeHoy}"\n\nTodo lo que contó hasta ahora en las entrevistas anteriores:\n${historiaHastaAhora}\n\nLas personas de su vida según su familia (usá los nombres con naturalidad cuando vengan al caso, y SIEMPRE con esta escritura): ${JSON.stringify(arbol)}\nSi conocés su año de nacimiento (${anioNacimiento ?? 'desconocido'}), podés anclar la época cuando la pregunta mira a una edad concreta ("allá por 1968...").\n\nEscribí la apertura del mensaje de hoy (1 o 2 frases, máximo 50 palabras, sin saludo ni comillas):\n1. Un reconocimiento cálido y ESPECÍFICO de algo que contó ayer (un detalle concreto, no una generalidad).\n2. SOLO si en alguna respuesta anterior ya adelantó el tema de la pregunta de hoy: sumá una frase que lo referencie ("usted ya me adelantó algo de esto cuando me contó de...") para que hoy lo cuente con calma y desde el principio. Si no lo adelantó, no agregues nada.`,
    }],
  });
  return textoDe(respuesta);
}

export async function evaluarRespuesta(
  pregunta: string, transcripcion: string, duracionSegundos: number,
): Promise<{ suficiente: boolean; repregunta?: string }> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 300, system: ESTILO,
    messages: [{
      role: 'user',
      content: `Pregunta de hoy: "${pregunta}"\nRespuesta (duró ${duracionSegundos} segundos): "${transcripcion}"\n\n¿La respuesta tiene sustancia para un capítulo del libro (detalles, personas, emociones, escenas)? Si duró menos de 40 segundos o es superficial, NO es suficiente.\nRespondé SOLO con JSON: {"suficiente": true} o {"suficiente": false, "repregunta": "..."}.\nLa repregunta: una sola, cálida, que invite a profundizar en LO QUE YA DIJO (nunca cambiar de tema), tono de curiosidad genuina.`,
    }],
  });
  return JSON.parse(textoDe(respuesta));
}

export async function detectarIntencion(texto: string): Promise<'quiere_parar' | 'normal'> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 50,
    messages: [{
      role: 'user',
      content: `Un señor mayor que participa de entrevistas diarias por WhatsApp escribió: "${texto}".\n¿Está pidiendo PARAR o dejar las entrevistas (cansancio, molestia, "no quiero más", "basta")? Respondé SOLO "quiere_parar" o "normal". Ante la duda: "normal".`,
    }],
  });
  const veredicto = textoDe(respuesta);
  return veredicto === 'quiere_parar' ? 'quiere_parar' : 'normal';
}
```

- [ ] **Step 4: Verificar y commit**

```bash
git add entrevistador/src/ia/cerebro.ts entrevistador/test/cerebro.test.ts
git commit -m "feat(entrevistador): cerebro - reconocimiento, evaluacion de riqueza e intencion"
```

---

### Task 7: Flujo de entrada — consentimiento, respuestas, repregunta, pausa

**Files:**
- Modify: `entrevistador/src/flujo/procesar.ts` (el stub de Task 3)
- Test: `entrevistador/test/procesar.test.ts`

**Interfaces:**
- Consumes: todo lo anterior (`descargarAudio`, `guardarRespuestaAudio`, `transcribirYActualizar`, `evaluarRespuesta`, `detectarIntencion`, `enviarTexto`, `db`).
- Produces: `procesarEntrante(m: MensajeEntrante): Promise<void>` con esta lógica exacta:
  1. Buscar narrador por `telefono_whatsapp`. Si no existe → ignorar (log).
  2. `estado = 'invitado'` + texto que empiece con "si"/"sí" (case-insensitive) → `estado = 'acepto'` + texto de confirmación cálido. Cualquier otro texto en `invitado` → ignorar.
  3. `estado = 'pausado'` + cualquier mensaje → `estado = 'activo'` + texto de bienvenida de vuelta.
  4. `estado = 'activo'` + texto → `detectarIntencion`; si `quiere_parar` → `estado = 'pausado'` + `alerta_silencio = true` + despedida cálida temporal. Si `normal` y hay pregunta pendiente → guardar como respuesta de texto (`texto_directo` = texto, `transcripcion` = texto) y seguir el paso 6.
  5. `estado = 'activo'` + audio → `guardarRespuestaAudio` con `pregunta_orden = dia_actual`, `transcribirYActualizar`, actualizar `ultima_respuesta_at = now()` y `alerta_silencio = false`.
  6. Si es la PRIMERA respuesta a esa pregunta (no `es_repregunta`): `evaluarRespuesta`; si insuficiente y no se envió ya una repregunta para ese orden (mirar `envios`) → `enviarTexto` con la repregunta + registrar en `envios` tipo `repregunta`. Las respuestas que llegan después de una repregunta se guardan con `es_repregunta = true` y NO se vuelven a evaluar.
  7. Si `pregunta_orden = 30` (o la última adaptativa existente) → disparar el cierre (Task 10).
  8. Si `pregunta_orden = 25` → disparar la generación adaptativa (Task 9).

- [ ] **Step 1: Tests de los caminos principales (fallan)**

`test/procesar.test.ts` — mockear TODOS los módulos importados (`vi.mock` de `../src/db/cliente.js`, `../src/whatsapp/enviar.js`, `../src/ia/cerebro.js`, etc.) y probar al menos: (a) "SÍ" de un invitado lo pasa a `acepto` y envía confirmación; (b) un audio de un narrador activo se guarda con el `pregunta_orden` de `dia_actual` y se transcribe; (c) una respuesta evaluada insuficiente dispara exactamente una repregunta; (d) un texto "no quiero seguir con esto" pausa al narrador. Seguir el patrón de mocks de `cerebro.test.ts`.

- [ ] **Step 2: Correr y ver que fallan** — FAIL.

- [ ] **Step 3: Implementar `procesarEntrante` siguiendo la lógica numerada de Interfaces**

Estructura sugerida del archivo: una función `buscarNarrador(telefono)`, un `switch` sobre `narrador.estado`, y funciones privadas `manejarConsentimiento`, `manejarRespuestaAudio`, `manejarTexto`. Textos exactos:
- Confirmación de consentimiento: `¡Qué alegría, {como_le_dicen}! Mañana a la mañana le llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre usted y yo, a su ritmo. 📖`
- Despedida temporal (pausa): `Entiendo perfectamente, {como_le_dicen}. Hacemos una pausa, sin ningún problema. Cuando tenga ganas de seguir, me escribe cualquier cosa y retomamos donde dejamos. Su historia queda guardada. 🤝`
- Bienvenida de vuelta: `¡Qué bueno tenerlo de vuelta, {como_le_dicen}! Retomamos donde habíamos dejado. Mañana le llega la siguiente pregunta.`

- [ ] **Step 4: Verificar y commit**

Run: `npm test` → PASS.
```bash
git add entrevistador/src/flujo entrevistador/test/procesar.test.ts
git commit -m "feat(entrevistador): flujo de entrada completo con consentimiento y pausa"
```

---

### Task 8: Scheduler diario — pregunta, recordatorio, alerta de silencio

**Files:**
- Create: `entrevistador/src/flujo/scheduler.ts`
- Create: `entrevistador/src/ia/voz.ts`
- Modify: `entrevistador/src/servidor.ts` (arrancar el cron)
- Test: `entrevistador/test/scheduler.test.ts`

**Interfaces:**
- Consumes: `enviarPlantilla`, `enviarAudioPorLink`, `generarReconocimiento`, `db`.
- Produces:
  - `voz.ts`: `generarAudioVoz(texto: string): Promise<Buffer>` — OpenAI TTS (`gpt-4o-mini-tts`, voz `nova`, formato mp3, con instrucción de tono: "voz cálida, pausada, de entrevistador que aprecia a su entrevistado").
  - `scheduler.ts`: `tick(ahora: Date): Promise<void>` exportada (testeable) + `iniciarScheduler()` que la corre con node-cron cada 15 min (`*/15 * * * *`). Lógica de `tick`:
    1. **Bienvenida:** narradores `invitado` sin envío `bienvenida` → `enviarPlantilla('bienvenida', [como_le_dicen, nombre_familiar_que_regala])` + registrar envío. (La plantilla explica el regalo y pide responder SÍ.)
    2. **Pregunta diaria:** narradores `acepto` o `activo` cuya hora local (usar `Intl.DateTimeFormat` con `zona_horaria`) está dentro de los 15 min posteriores a `hora_preferida`, donde la pregunta anterior (`dia_actual`) ya tiene respuesta (o `dia_actual = 0`), y sin envío `pregunta` HOY para el orden siguiente → armar mensaje: reconocimiento (si hay respuesta anterior) + texto de la pregunta `dia_actual + 1` (fija global o adaptativa del narrador) → `enviarPlantilla('pregunta_diaria', [reconocimiento, textoPregunta])` + `generarAudioVoz` del mismo contenido, subirlo a Storage en `{narrador_id}/sistema/pregunta_NN.mp3`, `enviarAudioPorLink` con URL firmada de 1 hora → `dia_actual = dia_actual + 1`; si estaba `acepto` → `activo`. Registrar envío `pregunta` con el orden. Si el narrador NO respondió la pregunta vigente, la MISMA pregunta se reenvía al día siguiente a su hora (el filtro "sin envío HOY" lo permite; el filtro de respuesta usa el orden vigente, no avanza).
    3. **Recordatorio:** narradores `activo` con envío `pregunta` HOY hace más de 6 hs, sin respuesta a ese orden y sin `recordatorio` hoy → `enviarPlantilla('recordatorio', [como_le_dicen])` (texto: "Cuando tenga un ratito, la pregunta de hoy lo espera. Sin apuro. 🌿").
    4. **Alerta de silencio:** narradores `activo` con `ultima_respuesta_at` hace más de 3 días y `alerta_silencio = false` → `alerta_silencio = true` (la web se encarga de mostrárselo a la familia).

- [ ] **Step 1: Tests de `tick` con db y envíos mockeados (fallan)**

Probar al menos: (a) a un narrador activo con hora preferida coincidente y pregunta anterior respondida le llega la pregunta siguiente y `dia_actual` avanza; (b) si ya hay envío `pregunta` hoy, no se reenvía (idempotencia del cron); (c) si la pregunta vigente no está respondida, NO avanza de orden y reenvía la misma al día siguiente; (d) el silencio de 3 días prende `alerta_silencio`.

- [ ] **Step 2: Correr y ver que fallan** — FAIL.

- [ ] **Step 3: Implementar `voz.ts` y `scheduler.ts` según la lógica numerada**

`generarAudioVoz` llama a `https://api.openai.com/v1/audio/speech` con `{ model: 'gpt-4o-mini-tts', voice: 'nova', input: texto, instructions: 'Hablá en español neutro, cálido y pausado, como un entrevistador que aprecia profundamente a la persona mayor que entrevista.', response_format: 'mp3' }` y devuelve el Buffer. En `scheduler.ts`, la hora local se calcula con `new Intl.DateTimeFormat('es', { timeZone: zonaHoraria, hour: '2-digit', minute: '2-digit', hour12: false }).format(ahora)`.

- [ ] **Step 4: Verificar y commit**

Run: `npm test` → PASS.
```bash
git add entrevistador/src entrevistador/test/scheduler.test.ts
git commit -m "feat(entrevistador): scheduler diario con pregunta, recordatorio y alerta de silencio"
```

---

### Task 9: Fase adaptativa (días 26-30)

**Files:**
- Create: `entrevistador/src/ia/adaptativas.ts`
- Modify: `entrevistador/src/flujo/procesar.ts` (disparo al completar la 25)
- Test: `entrevistador/test/adaptativas.test.ts`

**Interfaces:**
- Consumes: `db`, cliente Anthropic.
- Produces: `generarPreguntasAdaptativas(narradorId): Promise<void>` — lee TODAS las transcripciones (orden 1-25, incluidas repreguntas) + `contexto` del narrador, y con `claude-opus-5` genera 5 preguntas que inserta en `preguntas` con `narrador_id`, `orden` 26-30, `tipo = 'adaptativa'` y el `capitulo` de la lista fija al que cada una aporta. Idempotente: si ya existen adaptativas para ese narrador, no hace nada.

- [ ] **Step 1: Test (falla)** — mockear db y SDK; verificar que (a) inserta exactamente 5 filas con orden 26-30, (b) segunda llamada no inserta nada.

- [ ] **Step 2: Correr y ver que falla** — FAIL.

- [ ] **Step 3: Implementar con este prompt**

```typescript
const PROMPT_ADAPTATIVAS = (nombre: string, historiaCompleta: string, capitulos: string[]) => `
Leíste la historia de vida completa que ${nombre} contó en 25 entrevistas:

${historiaCompleta}

Sos su biógrafo y te quedan exactamente 5 preguntas para completar el libro. Buscá:
- Personas que nombró varias veces pero nunca exploró (un hermano, un amigo, un maestro).
- Épocas o momentos con huecos evidentes.
- Temas emocionales que tocó de pasada y merecen profundidad.
- Algo que claramente disfrutó contar y da para más.

Generá las 5 preguntas en el orden en que se las harías. Cada una debe sonar a que LO ESCUCHASTE
(referí lo que él contó), tratarlo de usted, y ser una sola pregunta clara.
Capítulos disponibles del libro: ${capitulos.join(', ')}.

Respondé SOLO con JSON: [{"texto": "...", "capitulo": "..."}, ...] (exactamente 5).`;
```

La historia completa se arma concatenando `Pregunta N (capítulo): [texto pregunta]\nRespuesta: [transcripciones unidas]` por orden. La lista de capítulos sale de `select distinct capitulo from preguntas where narrador_id is null`.

- [ ] **Step 4: Verificar y commit**

```bash
git add entrevistador/src entrevistador/test/adaptativas.test.ts
git commit -m "feat(entrevistador): las 5 preguntas adaptativas finales"
```

---

### Task 10: El cierre — despedida y entrega de saludos

**Files:**
- Create: `entrevistador/src/flujo/cierre.ts`
- Modify: `entrevistador/src/flujo/procesar.ts` (disparo al responder la última)
- Test: `entrevistador/test/cierre.test.ts`

**Interfaces:**
- Consumes: `enviarTexto`, `enviarAudioPorLink`, `db`.
- Produces: `cerrarBitacora(narradorId): Promise<void>`:
  1. Envía la despedida: `{como_le_dicen}... llegamos al final del viaje. Treinta charlas, una vida entera. Fue un honor enorme escucharlo. Su historia ya está siendo convertida en su libro. Pero antes de despedirme, tengo una sorpresa: su familia también estuvo grabando... para usted. 💌`
  2. Por cada fila de `saludos` no entregada: `enviarTexto` con `De {nombre} ({vinculo}):` + `enviarAudioPorLink` (URL firmada 1 h del `audio_path`) + marcar `entregado = true`. Pausa de 2 segundos entre saludos para que lleguen en orden.
  3. Si no hay saludos, saltear el punto 1 desde "Pero antes" y enviar solo la despedida.
  4. `estado = 'completado'` + registrar envío `despedida` (y `saludo_final` por cada saludo).

- [ ] **Step 1: Test (falla)** — mockear todo; verificar que entrega los saludos en orden, los marca entregados y deja el estado en `completado`.

- [ ] **Step 2: Correr y ver que falla** — FAIL.

- [ ] **Step 3: Implementar según la lógica numerada.**

- [ ] **Step 4: Verificar y commit**

```bash
git add entrevistador/src entrevistador/test/cierre.test.ts
git commit -m "feat(entrevistador): cierre con despedida y entrega de saludos"
```

---

### Task 11: Plantillas de Meta y deploy en Railway

**Files:**
- Create: `entrevistador/PLANTILLAS.md`
- Create: `entrevistador/railway.json`

**Interfaces:**
- Produces: el servicio corriendo en Railway con el webhook público configurado en Meta.

- [ ] **Step 1: Documentar las plantillas a cargar en Meta Business Manager**

`PLANTILLAS.md` con las 3 plantillas (categoría UTILITY, idioma `es`) para crear en WhatsApp Manager → Message Templates:

```markdown
# Plantillas de WhatsApp (crear en Meta Business Manager, categoría Utility, idioma es)

## bienvenida — variables: {{1}} cómo le dicen, {{2}} quién lo regala
Hola {{1}} 👋 Soy su biógrafo. {{2}} le hizo un regalo muy especial: vamos a escribir
juntos el libro de su vida. Cada mañana le voy a mandar una pregunta, y usted me responde
con un audio, como le cuenta las cosas a un amigo. Al final, su historia quedará en un
libro para su familia, con su propia voz. ¿Empezamos? Responda SÍ y arrancamos mañana.

## pregunta_diaria — variables: {{1}} reconocimiento de ayer, {{2}} pregunta de hoy
{{1}}

La pregunta de hoy: {{2}}

Cuando quiera, me responde con un audio. Sin apuro. 🎙️

## recordatorio — variables: {{1}} cómo le dicen
{{1}}, cuando tenga un ratito, la pregunta de hoy lo espera. Sin ningún apuro. 🌿
```

Nota: el primer envío de `pregunta_diaria` (día 1, sin respuesta anterior) usa como `{{1}}` el texto fijo `Hoy empezamos este viaje.`.

- [ ] **Step 2: Config de Railway**

`railway.json`:
```json
{
  "build": { "builder": "NIXPACKS", "buildCommand": "npm run build" },
  "deploy": { "startCommand": "npm start", "healthcheckPath": "/salud" }
}
```

- [ ] **Step 3: Deploy y conexión del webhook**

Manual: crear proyecto en Railway apuntando al repo con root directory `entrevistador/`, cargar las variables de `.env.example` con valores reales. En Meta App Dashboard → WhatsApp → Configuration: Callback URL = `https://<dominio-railway>/webhook`, Verify Token = el de `WA_VERIFY_TOKEN`, suscribirse al campo `messages`.
Expected: `GET https://<dominio>/salud` → `{"ok":true}` y la verificación del webhook en Meta pasa en verde.

- [ ] **Step 4: Prueba de humo real y commit**

Con un narrador de prueba (tu propio número) cargado a mano en la base: recibir bienvenida, responder SÍ, recibir la pregunta 1 a la hora configurada, responder con un audio y verificar en la base la fila de `respuestas` con transcripción.

```bash
git add entrevistador/PLANTILLAS.md entrevistador/railway.json
git commit -m "feat(entrevistador): plantillas de meta y deploy en railway"
```

---

## Verificación final del plan

- [ ] `npm test` en verde con todos los tests de las tasks.
- [ ] Prueba de humo real (Task 11 Step 4) completada con un número propio.
- [ ] El flujo completo invitado → acepto → activo → (25 respuestas) → adaptativas → (30) → completado funciona con el arnés de pruebas.
- [ ] Ninguna escritura fuera de las tablas permitidas por `supabase/CONTRATO.md`.
