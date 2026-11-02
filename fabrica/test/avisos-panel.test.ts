// 02/11: cada aviso a los socios queda también en `avisos`, para verlo en
// /admin/notificaciones, con si el mail salió o no (el panel tiene que mostrar justo
// los que no llegaron).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/config.js', () => ({ cargarConfig: () => ({ resendApiKey: process.env.RESEND_API_KEY || null }) }));

import { avisarSocios, registroEnTabla, usarRegistroDeAvisos, type FilaAviso } from '../src/escritor/produccion/avisos.js';

let filas: FilaAviso[];

beforeEach(() => {
  filas = [];
  usarRegistroDeAvisos(async (f) => { filas.push(f); });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  usarRegistroDeAvisos(null);
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('los avisos de la fábrica quedan en el panel', () => {
  it('el que salió, con salio_mail true', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await avisarSocios('Etapa A sin pasar', 'detalle', { fetch })).toBe(true);
    expect(filas).toEqual([{ asunto: 'Etapa A sin pasar', detalle: 'detalle', salio_mail: true }]);
  });

  it('el que Resend rechazó, con salio_mail false', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('no', { status: 500 }));
    expect(await avisarSocios('a', 'b', { fetch })).toBe(false);
    expect(filas.map((f) => f.salio_mail)).toEqual([false]);
  });

  it('sin a quién mandarlo, con salio_mail null', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('MAIL_SOCIOS', '');
    await avisarSocios('a', 'b');
    expect(filas.map((f) => f.salio_mail)).toEqual([null]);
  });

  it('un registro que tira no rompe el aviso', async () => {
    usarRegistroDeAvisos(async () => { throw new Error('sin red'); });
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('MAIL_SOCIOS', '');
    await expect(avisarSocios('a', 'b')).resolves.toBe(true);
  });
});

describe('registroEnTabla', () => {
  it('inserta en `avisos` con servicio fabrica', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ insert }));
    await registroEnTabla({ from } as never)({ asunto: 'a', detalle: 'd', salio_mail: true });
    expect(from).toHaveBeenCalledWith('avisos');
    expect(insert).toHaveBeenCalledWith({ servicio: 'fabrica', asunto: 'a', detalle: 'd', salio_mail: true });
  });

  it('si la tabla no está (migración sin aplicar) no tira', async () => {
    const from = () => ({ insert: async () => ({ error: { message: 'relation "avisos" does not exist' } }) });
    await expect(registroEnTabla({ from } as never)({ asunto: 'a', detalle: 'd', salio_mail: null })).resolves.toBeUndefined();
  });
});
