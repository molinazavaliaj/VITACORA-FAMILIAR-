import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { avisarSocios, marcaEnStorage, olvidarAvisos, usarMarcaPersistente } from '../../src/v3/avisos.js';

// El aviso a los socios sale UNA vez por clave y por día aunque Railway se
// reinicie (11/10: llegaron 5 mails iguales de «Falta la plantilla m8_vos»
// porque el «ya avisé» vivía solo en memoria y hubo varios deploys).

const AHORA = new Date('2026-10-11T13:00:00Z');

beforeEach(() => {
  olvidarAvisos();
  usarMarcaPersistente(null);
  vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
  vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  usarMarcaPersistente(null);
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** Un Storage de mentira: guarda los paths subidos; el segundo upload del mismo path da 409. */
function storageFalso(o: { falla?: boolean } = {}) {
  const subidos = new Set<string>();
  const upload = vi.fn(async (path: string) => {
    if (o.falla) return { data: null, error: { message: 'Storage caído', statusCode: '500' } };
    if (subidos.has(path)) return { data: null, error: { message: 'The resource already exists', statusCode: '409' } };
    subidos.add(path);
    return { data: { path }, error: null };
  });
  const remove = vi.fn(async (paths: string[]) => {
    for (const p of paths) subidos.delete(p);
    return { data: null, error: null };
  });
  return { subidos, upload, remove, db: { storage: { from: () => ({ upload, remove }) } } };
}

describe('el aviso a los socios sobrevive a los reinicios', () => {
  it('con la marca en Storage, un reinicio (memoria vacía) no lo repite el mismo día', async () => {
    const s = storageFalso();
    usarMarcaPersistente(marcaEnStorage(s.db as never));
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await avisarSocios('plantilla-es-AR-recordatorio', 'Falta la plantilla', 'd', { ahora: AHORA, fetch })).toBe(true);
    olvidarAvisos(); // Railway se reinició
    expect(await avisarSocios('plantilla-es-AR-recordatorio', 'Falta la plantilla', 'd', { ahora: AHORA, fetch })).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('al día siguiente vuelve a avisar', async () => {
    usarMarcaPersistente(marcaEnStorage(storageFalso().db as never));
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch });
    olvidarAvisos();
    expect(await avisarSocios('x', 'a', 'b', { ahora: new Date('2026-10-12T13:00:00Z'), fetch })).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('la marca va en avisos/<día>/ con un nombre que no muestra la clave', async () => {
    const s = storageFalso();
    usarMarcaPersistente(marcaEnStorage(s.db as never));
    await avisarSocios('entrante-sin-v3:n1:wamid.1', 'a', 'b', { ahora: AHORA, fetch: vi.fn(async () => new Response('{}')) });
    const [path] = [...s.subidos];
    expect(path).toMatch(/^avisos\/2026-10-11\/[0-9a-f]{40}\.txt$/);
    expect(path).not.toContain('wamid');
  });

  it('si el Storage falla, avisa igual (mejor un aviso de más que ninguno)', async () => {
    usarMarcaPersistente(marcaEnStorage(storageFalso({ falla: true }).db as never));
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch })).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('si el Storage se cuelga, no traba: a los pocos segundos avisa igual', async () => {
    const colgado = { storage: { from: () => ({ upload: () => new Promise(() => {}) }) } };
    usarMarcaPersistente(marcaEnStorage(colgado as never, 20));
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch })).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('unaVez: la marca no depende del día (avisos/siempre/) y no se repite nunca', async () => {
    const s = storageFalso();
    usarMarcaPersistente(marcaEnStorage(s.db as never));
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await avisarSocios('viaje-sin-datos:n1', 'a', 'b', { ahora: AHORA, fetch, unaVez: true })).toBe(true);
    olvidarAvisos();
    expect(await avisarSocios('viaje-sin-datos:n1', 'a', 'b', { ahora: new Date('2026-12-01T00:00:00Z'), fetch, unaVez: true })).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect([...s.subidos][0]).toMatch(/^avisos\/siempre\//);
  });

  it('unaVez: si Resend falla o tira, se borra la marca y el próximo intento lo vuelve a mandar', async () => {
    const s = storageFalso();
    usarMarcaPersistente(marcaEnStorage(s.db as never));
    const rechaza = vi.fn(async () => new Response('{}', { status: 500 }));
    await avisarSocios('viaje-sin-datos:n1', 'a', 'b', { fetch: rechaza, unaVez: true });
    expect(s.subidos.size).toBe(0);
    const tira = vi.fn(async () => { throw new Error('red caída'); });
    await avisarSocios('viaje-sin-datos:n1', 'a', 'b', { fetch: tira as never, unaVez: true });
    expect(s.subidos.size).toBe(0);
    const anda = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await avisarSocios('viaje-sin-datos:n1', 'a', 'b', { fetch: anda, unaVez: true })).toBe(true);
    expect(anda).toHaveBeenCalledTimes(1);
    expect(s.subidos.size).toBe(1);
  });

  it('unaVez sin Resend configurado: no queda la marca en Storage (sale cuando se configure), pero no se repite en el mismo proceso', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const s = storageFalso();
    usarMarcaPersistente(marcaEnStorage(s.db as never));
    await avisarSocios('viaje-sin-datos:n1', 'a', 'b', { unaVez: true });
    expect(s.subidos.size).toBe(0);
    expect(await avisarSocios('viaje-sin-datos:n1', 'a', 'b', { unaVez: true })).toBe(false);
  });

  it('un aviso por día común no cambia: si Resend falla, la marca del día queda', async () => {
    const s = storageFalso();
    usarMarcaPersistente(marcaEnStorage(s.db as never));
    await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch: vi.fn(async () => new Response('{}', { status: 500 })) });
    expect(s.subidos.size).toBe(1);
  });

  it('sin marca persistente configurada (tests, scripts), se queda con la memoria como antes', async () => {
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch });
    expect(await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch })).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
