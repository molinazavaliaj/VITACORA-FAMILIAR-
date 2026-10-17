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

// Kids V2 (docs/kids/v2/plan-conexion-bot.md, T4): un chico nunca entra a la V3, ni con el interruptor prendido.
describe('entraALaV3', () => {
  it('un chico de Kids (modo kids) no entra, ni con V3_PARA_NUEVOS=1 ni con regalo', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '1');
    const { entraALaV3 } = await import('../src/config.js');
    expect(entraALaV3({ modo: 'kids' })).toBe(false);
    expect(entraALaV3({ modo: 'kids', regalo: true })).toBe(false);
    expect(entraALaV3({})).toBe(true);
    vi.unstubAllEnvs();
  });
});
