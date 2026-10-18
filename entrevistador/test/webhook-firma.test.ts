import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createHmac } from 'node:crypto';
import Fastify from 'fastify';
import { firmaValida } from '../src/whatsapp/firma.js';
import { registrarWebhook, type MensajeEntrante } from '../src/whatsapp/webhook.js';

// La firma de Meta (18/10): hasta hoy el webhook procesaba cualquier body y
// cualquiera que supiera la URL podía hablar en nombre de un narrador.

const SECRETO = 'secreto-de-prueba';
const firmar = (cuerpo: string, secreto = SECRETO) => `sha256=${createHmac('sha256', secreto).update(cuerpo).digest('hex')}`;

const cuerpo = JSON.stringify({
  entry: [{ changes: [{ value: { messages: [{ from: '5491155551234', id: 'wamid.F1', type: 'text', text: { body: 'Hola' } }] } }] }],
});

beforeAll(() => {
  for (const n of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'WA_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_VERIFY_TOKEN']) {
    process.env[n] ??= 'x';
  }
});

function servidor(secreto?: string) {
  const app = Fastify();
  const procesar = vi.fn(async (_m: MensajeEntrante) => {});
  registrarWebhook(app, procesar, { secreto });
  return { app, procesar };
}

const mandar = (app: ReturnType<typeof Fastify>, cabeceras: Record<string, string> = {}, body = cuerpo) =>
  app.inject({ method: 'POST', url: '/webhook', payload: body, headers: { 'content-type': 'application/json', ...cabeceras } });

describe('firmaValida', () => {
  it('acepta la firma hecha con el mismo secreto', () => {
    expect(firmaValida(cuerpo, firmar(cuerpo), SECRETO)).toBe(true);
  });
  it('rechaza otro secreto, otro body, sin prefijo, vacía o ausente', () => {
    expect(firmaValida(cuerpo, firmar(cuerpo, 'otro'), SECRETO)).toBe(false);
    expect(firmaValida(cuerpo + ' ', firmar(cuerpo), SECRETO)).toBe(false);
    expect(firmaValida(cuerpo, firmar(cuerpo).slice('sha256='.length), SECRETO)).toBe(false);
    expect(firmaValida(cuerpo, 'sha256=', SECRETO)).toBe(false);
    expect(firmaValida(cuerpo, 'sha256=zz', SECRETO)).toBe(false);
    expect(firmaValida(cuerpo, undefined, SECRETO)).toBe(false);
  });
});

describe('POST /webhook con WA_APP_SECRET', () => {
  it('el mensaje firmado por Meta entra', async () => {
    const { app, procesar } = servidor(SECRETO);
    const r = await mandar(app, { 'x-hub-signature-256': firmar(cuerpo) });
    expect(r.statusCode).toBe(200);
    expect(procesar).toHaveBeenCalledWith(expect.objectContaining({ telefono: '+5491155551234', texto: 'Hola' }));
  });

  it('con firma mala se contesta 200 pero no se procesa', async () => {
    const { app, procesar } = servidor(SECRETO);
    const r = await mandar(app, { 'x-hub-signature-256': firmar(cuerpo, 'adivinado') });
    expect(r.statusCode).toBe(200);
    expect(procesar).not.toHaveBeenCalled();
  });

  it('sin firma tampoco se procesa', async () => {
    const { app, procesar } = servidor(SECRETO);
    const r = await mandar(app);
    expect(r.statusCode).toBe(200);
    expect(procesar).not.toHaveBeenCalled();
  });

  it('la firma se mira sobre los bytes crudos: el mismo JSON con otros espacios no pasa', async () => {
    const { app, procesar } = servidor(SECRETO);
    const otro = JSON.stringify(JSON.parse(cuerpo), null, 2);
    await mandar(app, { 'x-hub-signature-256': firmar(cuerpo) }, otro);
    expect(procesar).not.toHaveBeenCalled();
  });
});

describe('POST /webhook sin WA_APP_SECRET', () => {
  it('sigue entrando como antes, para no cortar las entrevistas hasta cargarlo', async () => {
    const { app, procesar } = servidor(undefined);
    await mandar(app);
    expect(procesar).toHaveBeenCalledTimes(1);
  });
});

describe('el JSON del resto de las rutas', () => {
  it('un body JSON inválido da 400 (como el parser de Fastify)', async () => {
    const { app } = servidor(SECRETO);
    const r = await mandar(app, {}, '{no es json');
    expect(r.statusCode).toBe(400);
  });
});
