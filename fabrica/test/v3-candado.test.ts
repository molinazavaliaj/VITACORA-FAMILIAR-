import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/config.js', () => ({ cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com' }) }));

import { avisarCandadoV3, exigirSinV3, narradoresConV3, NarradorV3Error } from '../src/v3/candado.js';

function dbFalsa(o: { filas?: { narrador_id: string }[]; error?: { code: string; message: string }; archivos?: Set<string> } = {}) {
  const archivos = o.archivos ?? new Set<string>();
  const subidos: string[] = [];
  const db = {
    from: () => {
      const filtros: [string, unknown][] = [];
      const resultado = () => (o.error ? { data: null, error: o.error } : { data: (o.filas ?? []).filter((f: any) => filtros.every(([c, v]) => f[c] === v)), error: null });
      const q: any = {
        select: () => q,
        eq: (c: string, v: unknown) => { filtros.push([c, v]); return q; },
        maybeSingle: async () => { const r = resultado(); return r.error ? r : { data: r.data![0] ?? null, error: null }; },
        then: (ok: any, ko: any) => Promise.resolve(resultado()).then(ok, ko),
      };
      return q;
    },
    storage: {
      from: () => ({
        download: async (ruta: string) => (archivos.has(ruta) ? { data: new Blob(['ya']), error: null } : { data: null, error: { message: 'Object not found' } }),
        upload: async (ruta: string) => { archivos.add(ruta); subidos.push(ruta); return { error: null }; },
      }),
    },
  };
  return { db: db as any, subidos };
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('el candado V3 de la fábrica', () => {
  it('narradoresConV3: los de la tabla; sin la migración, ninguno; con otro error, tira', async () => {
    expect(await narradoresConV3(dbFalsa({ filas: [{ narrador_id: 'n1' }] }).db)).toEqual(new Set(['n1']));
    expect(await narradoresConV3(dbFalsa({ error: { code: '42P01', message: 'relation "entrevistas_v3" does not exist' } }).db)).toEqual(new Set());
    await expect(narradoresConV3(dbFalsa({ error: { code: '500', message: 'caída' } }).db)).rejects.toThrow(/entrevistas_v3/);
  });

  it('exigirSinV3 se niega con un narrador V3 y deja pasar a los demás', async () => {
    const { db } = dbFalsa({ filas: [{ narrador_id: 'n1' }] });
    await expect(exigirSinV3(db, 'n1', 'generarPaquete')).rejects.toBeInstanceOf(NarradorV3Error);
    await expect(exigirSinV3(db, 'n2', 'generarPaquete')).resolves.toBeUndefined();
    await expect(exigirSinV3(dbFalsa({ error: { code: '42P01', message: 'does not exist' } }).db, 'n1', 'x')).resolves.toBeUndefined();
  });

  it('avisa a los socios una sola vez por narrador (candado en el paquete)', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    const falsa = dbFalsa();
    await avisarCandadoV3(falsa.db, 'n1', 'anticipo', { fetch });
    await avisarCandadoV3(falsa.db, 'n1', 'estructura', { fetch });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(falsa.subidos).toEqual(['n1/paquete/v3_candado_avisado.txt']);
  });

  it('si Resend rechaza, no deja el candado (reintenta el próximo tick) y no tira', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const falsa = dbFalsa();
    await avisarCandadoV3(falsa.db, 'n1', 'anticipo', { fetch: vi.fn(async () => new Response('no', { status: 500 })) });
    expect(falsa.subidos).toEqual([]);
  });
});
