// La alarma de la clave de Anthropic (11/10): la key del entrevistador estuvo revocada
// desde ~23/09 y nadie se enteró. Cualquier 401 de Anthropic avisa a los socios (una vez
// por día, clave anthropic-401-entrevistador) sin cambiar lo que hace cada llamada.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ avisarSocios: vi.fn(async (..._a: unknown[]) => true) }));
vi.mock('../src/v3/avisos.js', () => ({ avisarSocios: mocks.avisarSocios }));

import {
  ASUNTO_CLAVE_MALA, CLAVE_AVISO_401, avisarSiClaveMala, chequearClaveAlArrancar, esClaveMala, vigilarClave,
} from '../src/ia/alarma.js';

/** Como el APIError del SDK: status 401 y el mensaje con el cuerpo. */
function error401(): Error & { status: number } {
  return Object.assign(
    new Error('401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_x"}'),
    { status: 401 },
  );
}

beforeEach(() => {
  mocks.avisarSocios.mockReset();
  mocks.avisarSocios.mockResolvedValue(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('esClaveMala', () => {
  it('reconoce el 401 del SDK, por status o por el texto', () => {
    expect(esClaveMala(error401())).toBe(true);
    expect(esClaveMala(Object.assign(new Error('x'), { status: 401 }))).toBe(true);
    expect(esClaveMala('401 {"type":"error","error":{"type":"authentication_error"}}')).toBe(true);
    expect(esClaveMala(new Error('invalid x-api-key'))).toBe(true);
  });

  it('no confunde otros errores', () => {
    expect(esClaveMala(new Error('529 sobrecargado'))).toBe(false);
    expect(esClaveMala(Object.assign(new Error('rate'), { status: 429 }))).toBe(false);
    expect(esClaveMala(new Error('el narrador nació en 1940 en la calle 401'))).toBe(false);
    expect(esClaveMala(null)).toBe(false);
    expect(esClaveMala(undefined)).toBe(false);
  });
});

describe('avisarSiClaveMala', () => {
  it('con un 401 avisa con la clave del entrevistador, el servicio y el mensaje', async () => {
    expect(await avisarSiClaveMala(error401(), 'cerebro')).toBe(true);
    expect(mocks.avisarSocios).toHaveBeenCalledTimes(1);
    const [clave, asunto, detalle] = mocks.avisarSocios.mock.calls[0] as string[];
    expect(clave).toBe(CLAVE_AVISO_401);
    expect(clave).toBe('anthropic-401-entrevistador');
    expect(asunto).toBe(ASUNTO_CLAVE_MALA);
    expect(asunto).toBe('La clave de Anthropic del entrevistador no anda');
    expect(detalle).toContain('cerebro');
    expect(detalle).toContain('invalid x-api-key');
    expect(detalle).toContain('ANTHROPIC_API_KEY');
  });

  it('suma el contexto que le pasen (narrador, bloque)', async () => {
    await avisarSiClaveMala(error401(), 'cazador', 'narrador n1, bloque 3');
    expect(mocks.avisarSocios.mock.calls[0][2]).toContain('narrador n1, bloque 3');
  });

  it('otro error no avisa', async () => {
    expect(await avisarSiClaveMala(new Error('529 sobrecargado'), 'cerebro')).toBe(false);
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
  });

  it('nunca tira, aunque el aviso falle', async () => {
    mocks.avisarSocios.mockRejectedValueOnce(new Error('se cayó todo'));
    await expect(avisarSiClaveMala(error401(), 'cerebro')).resolves.toBe(false);
  });
});

describe('vigilarClave (el cliente de Anthropic con alarma)', () => {
  it('un 401 sigue subiendo igual que antes, y además avisa', async () => {
    const err = error401();
    const create = vi.fn(async (..._a: unknown[]) => { throw err; });
    const cliente = vigilarClave({ messages: { create } }, 'adaptativas');
    await expect(cliente.messages.create({ model: 'm' })).rejects.toBe(err);
    await vi.waitFor(() => expect(mocks.avisarSocios).toHaveBeenCalledTimes(1));
    expect(mocks.avisarSocios.mock.calls[0][0]).toBe('anthropic-401-entrevistador');
    expect(mocks.avisarSocios.mock.calls[0][2]).toContain('adaptativas');
  });

  it('la respuesta buena pasa tal cual y no avisa', async () => {
    const respuesta = { content: [], usage: { input_tokens: 1, output_tokens: 1 } };
    const create = vi.fn(async (..._a: unknown[]) => respuesta);
    const cliente = vigilarClave({ messages: { create } }, 'trato');
    expect(await cliente.messages.create({ model: 'm' })).toBe(respuesta);
    expect(create).toHaveBeenCalledWith({ model: 'm' });
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
  });

  it('otro error sube igual y no avisa', async () => {
    const err = new Error('529 sobrecargado');
    const cliente = vigilarClave({ messages: { create: vi.fn(async (..._a: unknown[]) => { throw err; }) } }, 'trato');
    await expect(cliente.messages.create({})).rejects.toBe(err);
    await new Promise((r) => setTimeout(r, 0));
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
  });
});

describe('chequearClaveAlArrancar', () => {
  it('pide la lista de modelos (gratis) con límite 1, sin reintentos y con timeout corto', async () => {
    const list = vi.fn(async (..._a: unknown[]) => ({ data: [] }));
    expect(await chequearClaveAlArrancar({ cliente: { models: { list } } })).toBe('ok');
    const [params, opciones] = list.mock.calls[0] as [Record<string, unknown>, Record<string, unknown>];
    expect(params).toEqual({ limit: 1 });
    expect(opciones).toMatchObject({ maxRetries: 0 });
    expect(Number(opciones.timeout)).toBeLessThanOrEqual(15_000);
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
  });

  it('con un 401 avisa a los socios y no tira', async () => {
    const list = vi.fn(async () => { throw error401(); });
    expect(await chequearClaveAlArrancar({ cliente: { models: { list } } })).toBe('clave-mala');
    expect(mocks.avisarSocios).toHaveBeenCalledTimes(1);
    expect(mocks.avisarSocios.mock.calls[0][0]).toBe('anthropic-401-entrevistador');
    expect(mocks.avisarSocios.mock.calls[0][2]).toContain('arranque');
  });

  it('otro error (red, 5xx) solo se anota: no avisa ni tira', async () => {
    const list = vi.fn(async () => { throw new Error('fetch failed'); });
    expect(await chequearClaveAlArrancar({ cliente: { models: { list } } })).toBe('no-se-pudo');
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
  });

  it('si no hay clave configurada, no tira', async () => {
    expect(await chequearClaveAlArrancar({ crearCliente: () => { throw new Error('Falta ANTHROPIC_API_KEY'); } })).toBe('no-se-pudo');
  });
});
