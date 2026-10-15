// El aviso a los socios sale aunque falte otra variable obligatoria (12/10): es justo el
// aviso que dice que falta algo (variables.ts). Antes leía la clave de Resend con
// cargarConfig, que tira si falta ANTHROPIC_API_KEY u OPENAI_API_KEY.
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../src/config.js', () => ({ cargarConfig: () => { throw new Error('Faltan variables de entorno'); } }));

import { avisarSocios, hayAQuienAvisar } from '../src/escritor/produccion/avisos.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('avisarSocios sin la config completa', () => {
  it('con RESEND_API_KEY y MAIL_SOCIOS manda igual', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(hayAQuienAvisar()).toBe(true);
    expect(await avisarSocios('a', 'b', { fetch })).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('sin RESEND_API_KEY no intenta', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetch = vi.fn(async () => new Response('{}'));
    expect(hayAQuienAvisar()).toBe(false);
    await avisarSocios('a', 'b', { fetch });
    expect(fetch).not.toHaveBeenCalled();
  });
});
