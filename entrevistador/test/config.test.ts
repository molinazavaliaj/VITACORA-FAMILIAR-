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
