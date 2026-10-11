// La alarma de la clave de Anthropic en la fábrica (11/10): la key del entrevistador estuvo
// revocada semanas sin que nadie se enterara. Un 401 de Anthropic en la fábrica (llamada
// directa, stream o Batch) avisa a los socios una vez por día (clave anthropic-401-fabrica)
// sin cambiar lo que hace cada llamada. Y el worker prueba la clave al arrancar.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ avisarSocios: vi.fn(async (..._a: unknown[]) => true) }));
vi.mock('../src/escritor/produccion/avisos.js', () => ({ avisarSocios: mocks.avisarSocios }));

import {
  ASUNTO_CLAVE_MALA, CLAVE_AVISO_401, avisarSiClaveMala, chequearClaveAlArrancar, esClaveMala, olvidarAlarmas, vigilarClave,
} from '../src/alarma-anthropic.js';

const AHORA = new Date('2026-10-11T12:00:00Z');

function error401(): Error & { status: number } {
  return Object.assign(
    new Error('401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_x"}'),
    { status: 401 },
  );
}

beforeEach(() => {
  olvidarAlarmas();
  mocks.avisarSocios.mockReset();
  mocks.avisarSocios.mockResolvedValue(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('esClaveMala', () => {
  it('reconoce el 401 por status, por el texto del SDK o por el error de un resultado de Batch', () => {
    expect(esClaveMala(error401())).toBe(true);
    expect(esClaveMala(Object.assign(new Error('x'), { status: 401 }))).toBe(true);
    expect(esClaveMala('no se pudo crear el lote: 401 {"type":"error"}')).toBe(false); // el 401 tiene que encabezar…
    expect(esClaveMala('no se pudo crear el lote: 401 {"type":"error","error":{"type":"authentication_error"}}')).toBe(true); // …o decir authentication_error
    expect(esClaveMala({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } })).toBe(true);
  });

  it('no confunde otros errores', () => {
    expect(esClaveMala(new Error('529 overloaded'))).toBe(false);
    expect(esClaveMala(Object.assign(new Error('rate'), { status: 429 }))).toBe(false);
    expect(esClaveMala(undefined)).toBe(false);
  });
});

describe('avisarSiClaveMala', () => {
  it('avisa con asunto claro y el servicio, una sola vez por día', async () => {
    expect(await avisarSiClaveMala(error401(), 'el escritor', { ahora: AHORA })).toBe(true);
    expect(await avisarSiClaveMala(error401(), 'el paquete', { ahora: AHORA })).toBe(false);
    expect(mocks.avisarSocios).toHaveBeenCalledTimes(1);
    const [asunto, detalle] = mocks.avisarSocios.mock.calls[0] as string[];
    expect(CLAVE_AVISO_401).toBe('anthropic-401-fabrica');
    expect(asunto).toBe(ASUNTO_CLAVE_MALA);
    expect(asunto).toBe('La clave de Anthropic de la fábrica no anda');
    expect(detalle).toContain('el escritor');
    expect(detalle).toContain('ANTHROPIC_API_KEY');
    expect(detalle).toContain('invalid x-api-key');
    // Al otro día vuelve a avisar.
    expect(await avisarSiClaveMala(error401(), 'el escritor', { ahora: new Date('2026-10-12T12:00:00Z') })).toBe(true);
  });

  it('otro error no avisa', async () => {
    expect(await avisarSiClaveMala(new Error('529 overloaded'), 'el escritor')).toBe(false);
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
  });

  it('si el mail no salió, no lo da por avisado (lo reintenta la próxima)', async () => {
    mocks.avisarSocios.mockResolvedValueOnce(false);
    expect(await avisarSiClaveMala(error401(), 'el escritor', { ahora: AHORA })).toBe(false);
    expect(await avisarSiClaveMala(error401(), 'el escritor', { ahora: AHORA })).toBe(true);
  });

  it('nunca tira', async () => {
    mocks.avisarSocios.mockRejectedValueOnce(new Error('se cayó todo'));
    await expect(avisarSiClaveMala(error401(), 'el escritor')).resolves.toBe(false);
  });
});

describe('vigilarClave', () => {
  it('messages.create: el 401 sube igual y además avisa', async () => {
    const err = error401();
    const cliente = vigilarClave({ messages: { create: vi.fn(async (..._a: unknown[]) => { throw err; }) } }, 'el escritor');
    await expect(cliente.messages.create({})).rejects.toBe(err);
    await vi.waitFor(() => expect(mocks.avisarSocios).toHaveBeenCalledTimes(1));
    expect(mocks.avisarSocios.mock.calls[0][1]).toContain('el escritor');
  });

  it('messages.create: lo bueno pasa tal cual, sin aviso', async () => {
    const r = { content: [] };
    const create = vi.fn(async (..._a: unknown[]) => r);
    const cliente = vigilarClave({ messages: { create } }, 'el escritor');
    expect(await cliente.messages.create({ model: 'm' })).toBe(r);
    expect(create).toHaveBeenCalledWith({ model: 'm' });
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
  });

  it('messages.stream: devuelve el mismo stream y un error 401 del stream avisa', async () => {
    const stream = new EventEmitter() as EventEmitter & { finalMessage?: () => Promise<unknown> };
    const cliente = vigilarClave({ messages: { stream: vi.fn((..._a: unknown[]) => stream) } }, 'el paquete');
    expect(cliente.messages.stream({})).toBe(stream);
    stream.emit('error', error401());
    await vi.waitFor(() => expect(mocks.avisarSocios).toHaveBeenCalledTimes(1));
  });

  it('batches.create: el 401 sube igual (el lote lo atrapa y sigue sin lote) y avisa', async () => {
    const err = error401();
    const cliente = vigilarClave({ messages: { batches: { create: vi.fn(async (..._a: unknown[]) => { throw err; }), retrieve: vi.fn(), results: vi.fn() } } }, 'el escritor (lote)');
    await expect(cliente.messages.batches.create({ requests: [] })).rejects.toBe(err);
    await vi.waitFor(() => expect(mocks.avisarSocios).toHaveBeenCalledTimes(1));
  });

  it('batches.results: un resultado con authentication_error avisa y los resultados pasan todos', async () => {
    const filas = [
      { custom_id: 'p0', result: { type: 'succeeded', message: { content: [] } } },
      { custom_id: 'p1', result: { type: 'errored', error: { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } } } },
    ];
    async function* gen() { yield* filas; }
    const cliente = vigilarClave({ messages: { batches: { create: vi.fn(), retrieve: vi.fn(), results: vi.fn(async (..._a: unknown[]) => gen()) } } }, 'el escritor (lote)');
    const vistos: unknown[] = [];
    for await (const r of await cliente.messages.batches.results('b1')) vistos.push(r);
    expect(vistos).toEqual(filas);
    await vi.waitFor(() => expect(mocks.avisarSocios).toHaveBeenCalledTimes(1));
  });

  it('batches.results: errores comunes no avisan', async () => {
    async function* gen() { yield { custom_id: 'p0', result: { type: 'errored', error: { type: 'error', error: { type: 'overloaded_error', message: 'x' } } } }; }
    const cliente = vigilarClave({ messages: { batches: { create: vi.fn(), retrieve: vi.fn(), results: vi.fn(async (..._a: unknown[]) => gen()) } } }, 'el escritor (lote)');
    for await (const _ of await cliente.messages.batches.results('b1')) { /* nada */ }
    await new Promise((r) => setTimeout(r, 0));
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
  });
});

describe('chequearClaveAlArrancar', () => {
  it('models.list con límite 1 (gratis), sin reintentos y con timeout corto', async () => {
    const list = vi.fn(async (..._a: unknown[]) => ({ data: [] }));
    expect(await chequearClaveAlArrancar({ cliente: { models: { list } } })).toBe('ok');
    const [params, opciones] = list.mock.calls[0] as [Record<string, unknown>, Record<string, unknown>];
    expect(params).toEqual({ limit: 1 });
    expect(opciones).toMatchObject({ maxRetries: 0 });
    expect(Number(opciones.timeout)).toBeLessThanOrEqual(15_000);
  });

  it('un 401 avisa y no tira', async () => {
    const list = vi.fn(async (..._a: unknown[]) => { throw error401(); });
    expect(await chequearClaveAlArrancar({ cliente: { models: { list } } })).toBe('clave-mala');
    expect(mocks.avisarSocios).toHaveBeenCalledTimes(1);
    expect(mocks.avisarSocios.mock.calls[0][1]).toContain('arranque');
  });

  it('otro error o sin clave: solo se anota', async () => {
    expect(await chequearClaveAlArrancar({ cliente: { models: { list: vi.fn(async (..._a: unknown[]) => { throw new Error('fetch failed'); }) } } })).toBe('no-se-pudo');
    expect(await chequearClaveAlArrancar({ crearCliente: () => { throw new Error('Falta ANTHROPIC_API_KEY'); } })).toBe('no-se-pudo');
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
  });
});

describe('enganche', () => {
  const RAIZ = join(__dirname, '..', 'src');
  const archivos = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : p.endsWith('.ts') ? [p] : [];
  });

  it('todo `new Anthropic(` de src pasa por vigilarClave', () => {
    const sinAlarma: string[] = [];
    for (const f of archivos(RAIZ)) {
      if (f.endsWith('alarma-anthropic.ts')) continue;
      for (const linea of readFileSync(f, 'utf8').split('\n')) {
        if (linea.trimStart().startsWith('//') || linea.trimStart().startsWith('*')) continue;
        if (linea.includes('new Anthropic(') && !linea.includes('vigilarClave(')) sinAlarma.push(`${f}: ${linea.trim()}`);
      }
    }
    expect(sinAlarma).toEqual([]);
  });

  it('el worker prueba la clave al arrancar sin esperarla', () => {
    expect(readFileSync(join(RAIZ, 'worker.ts'), 'utf8')).toMatch(/void chequearClaveAlArrancar\(\)/);
  });
});
