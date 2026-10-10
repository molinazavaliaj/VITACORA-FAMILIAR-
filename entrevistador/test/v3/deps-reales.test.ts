import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'token');
vi.stubEnv('WA_PHONE_NUMBER_ID', '999');
vi.stubEnv('WA_VERIFY_TOKEN', 'v');
vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('test sin red'); }));

const h = vi.hoisted(() => ({
  transcribir: vi.fn(async () => ({ texto: 'hola', duracionSegundos: 3 })),
  enviarTexto: vi.fn(async () => 'wamid.t'),
  enviarBotones: vi.fn(async () => 'wamid.b'),
  enviarPlantilla: vi.fn(async () => 'wamid.p'),
}));

vi.mock('../../src/db/cliente.js', async () => {
  const { crearBaseFalsa } = await import('./base-falsa.js');
  return { db: crearBaseFalsa().cliente };
});
vi.mock('../../src/ia/transcribir.js', () => ({ transcribir: h.transcribir }));
vi.mock('../../src/whatsapp/enviar.js', () => ({ enviarTexto: h.enviarTexto, enviarBotones: h.enviarBotones, enviarPlantilla: h.enviarPlantilla }));

const { depsReales, TIMEOUT_ENVIO_V3_MS } = await import('../../src/v3/deps-reales.js');
const { promptDeTranscripcion } = await import('../../src/v3/nucleo/entrevista/transcribir.js');

describe('las dependencias de verdad de la V3', () => {
  it('un narrador en catalán se transcribe con "ca" y el vocabulario catalán', async () => {
    await depsReales().transcribir(Buffer.from('a'), { nombre: 'Prueba', idioma: 'ca', narradorId: 'n1' });
    expect(h.transcribir).toHaveBeenLastCalledWith(Buffer.from('a'), promptDeTranscripcion('Prueba', 'ca'), 'n1', 'ca');
    await depsReales().transcribir(Buffer.from('a'), { nombre: 'Prueba', idioma: 'es-ES', narradorId: 'n1' });
    expect(h.transcribir).toHaveBeenLastCalledWith(Buffer.from('a'), promptDeTranscripcion('Prueba', 'es-ES'), 'n1', 'es');
  });

  it('los envíos de WhatsApp de la V3 llevan timeout (no pueden pasarse de la toma de 2 minutos)', async () => {
    expect(TIMEOUT_ENVIO_V3_MS).toBeLessThanOrEqual(30_000);
    const wa = depsReales().wa;
    await wa.texto('+549', 'hola');
    await wa.botones('+549', '¿Sí?', ['Sí']);
    await wa.plantilla('+549', 'pregunta_diaria_ca', 'ca', ['x']);
    expect(h.enviarTexto).toHaveBeenCalledWith('+549', 'hola', { timeoutMs: TIMEOUT_ENVIO_V3_MS });
    expect(h.enviarBotones).toHaveBeenCalledWith('+549', '¿Sí?', ['Sí'], { timeoutMs: TIMEOUT_ENVIO_V3_MS });
    expect(h.enviarPlantilla).toHaveBeenCalledWith('+549', 'pregunta_diaria_ca', ['x'], 'ca', { timeoutMs: TIMEOUT_ENVIO_V3_MS });
  });

  it('el hito nunca tira (aunque no encuentre al narrador)', async () => {
    await expect(depsReales().hito('no-existe', 'primera')).resolves.toBeUndefined();
  });
});
