import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { avisarSocios, olvidarAvisos, registroEnTabla, usarRegistroDeAvisos, type FilaAviso } from '../../src/v3/avisos.js';

// 02/11: cada aviso a los socios queda también en `avisos`, para verlo en
// /admin/notificaciones. Uno por aviso que de verdad sale (el repetido del día no),
// con si el mail salió o no: el panel tiene que mostrar justo los que no llegaron.

const AHORA = new Date('2026-11-02T13:00:00Z');
let filas: FilaAviso[];

beforeEach(() => {
  olvidarAvisos();
  filas = [];
  usarRegistroDeAvisos(async (f) => { filas.push(f); });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  usarRegistroDeAvisos(null);
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('los avisos quedan en el panel', () => {
  it('el que salió por mail, con salio_mail true', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    await avisarSocios('x', 'Falta la plantilla', 'detalle', { ahora: AHORA, fetch });
    expect(filas).toEqual([{ clave: 'x', asunto: 'Falta la plantilla', detalle: 'detalle', salio_mail: true }]);
  });

  it('el que Resend rechazó, con salio_mail false', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('no', { status: 500 }));
    await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch });
    expect(filas.map((f) => f.salio_mail)).toEqual([false]);
  });

  it('sin a quién mandarlo, con salio_mail null', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('MAIL_SOCIOS', '');
    await avisarSocios('x', 'a', 'b', { ahora: AHORA });
    expect(filas.map((f) => f.salio_mail)).toEqual([null]);
  });

  it('el repetido del mismo día no suma otra fila', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch });
    await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch });
    expect(filas).toHaveLength(1);
  });
});

describe('registroEnTabla', () => {
  it('inserta en `avisos` con servicio entrevistador', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ insert }));
    await registroEnTabla({ from } as never)({ clave: 'k', asunto: 'a', detalle: 'd', salio_mail: true });
    expect(from).toHaveBeenCalledWith('avisos');
    expect(insert).toHaveBeenCalledWith({ servicio: 'entrevistador', clave: 'k', asunto: 'a', detalle: 'd', salio_mail: true });
  });

  it('si la tabla no está (migración sin aplicar) no tira', async () => {
    const from = () => ({ insert: async () => ({ error: { message: 'relation "avisos" does not exist' } }) });
    await expect(registroEnTabla({ from } as never)({ clave: 'k', asunto: 'a', detalle: 'd', salio_mail: null })).resolves.toBeUndefined();
    const roto = () => { throw new Error('sin red'); };
    await expect(registroEnTabla({ from: roto } as never)({ clave: 'k', asunto: 'a', detalle: 'd', salio_mail: null })).resolves.toBeUndefined();
  });
});
