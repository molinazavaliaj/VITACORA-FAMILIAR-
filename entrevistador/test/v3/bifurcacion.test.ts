import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MensajeEntrante } from '../../src/whatsapp/webhook.js';

vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'token');
vi.stubEnv('WA_PHONE_NUMBER_ID', '999');
vi.stubEnv('WA_VERIFY_TOKEN', 'v');

const h = vi.hoisted(() => ({ base: null as any, procesarEntranteV3: vi.fn(), enviarTexto: vi.fn(async () => 'wamid.t') }));

vi.mock('../../src/db/cliente.js', async () => {
  const { crearBaseFalsa } = await import('./base-falsa.js');
  h.base = crearBaseFalsa();
  return { db: h.base.cliente };
});
vi.mock('../../src/v3/entrante.js', () => ({ procesarEntranteV3: h.procesarEntranteV3 }));
vi.mock('../../src/v3/deps-reales.js', () => ({ depsReales: () => ({ falsas: true }) }));
// Sin red: si la bifurcación fallara, el flujo viejo bajaría el audio de Meta de verdad.
vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('test sin red'); }));
vi.mock('../../src/whatsapp/media.js', async (orig) => ({ ...(await orig<object>()), descargarAudio: vi.fn(async () => Buffer.from('audio')) }));
vi.mock('../../src/whatsapp/enviar.js', () => ({ enviarTexto: h.enviarTexto, enviarPlantilla: vi.fn(), enviarBotones: vi.fn(), enviarAudioPorLink: vi.fn(), enviarImagenPorLink: vi.fn() }));

const { procesarEntrante } = await import('../../src/flujo/procesar.js');

const NARRADOR = { id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00', zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { trato: 'vos' }, dia_actual: 3, ultima_respuesta_at: null, alerta_silencio: false };
const m = (tipo: MensajeEntrante['tipo']): MensajeEntrante => ({ telefono: '+5491100000000', tipo, waMessageId: 'wamid.1', ...(tipo === 'texto' ? { texto: 'hola' } : { mediaId: 'media' }) });

beforeEach(() => {
  h.base.tablas = { narradores: [], entrevistas_v3: [] };
  h.base.ausentes.clear();
  h.procesarEntranteV3.mockReset();
  h.enviarTexto.mockClear();
});

describe('la bifurcación V3 en procesar.ts', () => {
  it('un narrador activo con fila V3 va a la V3 (antes de las fotos, del texto y de la evaluación)', async () => {
    h.base.tablas.narradores = [{ ...NARRADOR, estado: 'activo' }];
    h.base.tablas.entrevistas_v3 = [{ narrador_id: 'n1', version: 0 }];
    await procesarEntrante(m('audio'));
    await procesarEntrante(m('imagen'));
    expect(h.procesarEntranteV3).toHaveBeenCalledTimes(2);
    expect(h.procesarEntranteV3.mock.calls[0][1]).toMatchObject({ id: 'n1' });
  });

  it('sin fila V3, el pausado sigue por el flujo viejo (reactivar)', async () => {
    h.base.tablas.narradores = [{ ...NARRADOR, estado: 'pausado' }];
    await procesarEntrante(m('texto'));
    expect(h.procesarEntranteV3).not.toHaveBeenCalled();
    expect(h.enviarTexto).toHaveBeenCalledTimes(1);
    expect(h.base.tablas.narradores[0].estado).toBe('activo');
  });

  it('sin la migración aplicada, igual: flujo viejo', async () => {
    h.base.ausentes.add('entrevistas_v3');
    h.base.tablas.narradores = [{ ...NARRADOR, estado: 'pausado' }];
    await procesarEntrante(m('texto'));
    expect(h.procesarEntranteV3).not.toHaveBeenCalled();
    expect(h.enviarTexto).toHaveBeenCalledTimes(1);
  });

  it('un invitado con fila V3 (no debería pasar) sigue por el consentimiento viejo', async () => {
    h.base.tablas.narradores = [{ ...NARRADOR, estado: 'invitado' }];
    h.base.tablas.entrevistas_v3 = [{ narrador_id: 'n1', version: 0 }];
    await procesarEntrante({ ...m('texto'), texto: 'nada que ver' });
    expect(h.procesarEntranteV3).not.toHaveBeenCalled();
  });
});
