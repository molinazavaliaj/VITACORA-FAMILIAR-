import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { avisarSocios, olvidarAvisos } from '../../src/v3/avisos.js';

const AHORA = new Date('2026-10-08T13:00:00Z');

beforeEach(() => {
  olvidarAvisos();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('avisar a los socios', () => {
  it('manda un mail a MAIL_SOCIOS por Resend', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com, dos@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await avisarSocios('plantilla-ca-pregunta', 'Falta la plantilla', 'detalle', { ahora: AHORA, fetch })).toBe(true);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(JSON.parse(String(init.body))).toMatchObject({ to: ['uno@ejemplo.com', 'dos@ejemplo.com'], subject: '[Vitácora V3] Falta la plantilla', text: 'detalle' });
  });

  it('una sola vez por clave y por día', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch });
    expect(await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch })).toBe(false);
    expect(await avisarSocios('x', 'a', 'b', { ahora: new Date('2026-10-09T13:00:00Z'), fetch })).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('claves distintas el mismo día avisan las dos', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    await avisarSocios('a', 'a', 'b', { ahora: AHORA, fetch });
    expect(await avisarSocios('b', 'a', 'b', { ahora: AHORA, fetch })).toBe(true);
  });

  it('sin clave o sin destinatarios queda en la consola y no tira', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const fetch = vi.fn();
    expect(await avisarSocios('y', 'a', 'b', { ahora: AHORA, fetch })).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('con clave pero sin destinatarios tampoco manda', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', ' , ');
    const fetch = vi.fn();
    expect(await avisarSocios('w', 'a', 'b', { ahora: AHORA, fetch })).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('si Resend falla, no tira', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => { throw new Error('sin red'); });
    await expect(avisarSocios('z', 'a', 'b', { ahora: AHORA, fetch })).resolves.toBe(true);
  });

  it('si Resend rechaza con un 5xx, no tira y deja el error en la consola', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 500 }));
    await expect(avisarSocios('v', 'a', 'b', { ahora: AHORA, fetch })).resolves.toBe(true);
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});
