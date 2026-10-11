import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ avisarSocios: vi.fn(async (..._a: unknown[]) => true) }));
vi.mock('../../src/v3/avisos.js', () => ({ avisarSocios: mocks.avisarSocios }));
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/v3/estado.js';
import { cazarEnSegundoPlano, esperarCazas, lanzarCazador } from '../../src/v3/cazador.js';
import { estadoInicial, type EstadoV3 } from '../../src/v3/tipos.js';
import type { ClienteModelo } from '../../src/v3/nucleo/entrevista/cazador.js';

const conBloque1 = (): EstadoV3 => ({
  ...estadoInicial(),
  respuestas: [['OR1', 'Nací en un pueblo chico y mi mamá cosía para afuera toda la tarde.'], ['CI1', '⟦botón:No, está todo⟧']],
});

async function preparar(cliente: ClienteModelo | null) {
  const base = crearBaseFalsa();
  await crearFila(base.cliente, {
    narrador_id: 'n1', idioma: 'es-AR', ficha: { nombre: 'Prueba', genero: 'mujer' }, estado: conBloque1(),
    ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null,
  });
  return { base, ...depsDePrueba(base, { cazador: cliente }) };
}

const clienteQueContesta = (): ClienteModelo => ({
  messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: '{"elegidas": [], "escenas_contadas": []}' }], usage: { input_tokens: 1000, output_tokens: 200 } })) },
});

beforeEach(() => {
  mocks.avisarSocios.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('el cazador en segundo plano', () => {
  it('apagado (sin cliente) no hace nada', async () => {
    const { deps, base } = await preparar(null);
    expect(await cazarEnSegundoPlano(deps, 'n1', 1)).toBeNull();
    expect(base.tablas.consumo_ia ?? []).toHaveLength(0);
  });

  it('llama con Opus 5.5, anota el costo en consumo_ia y suma el registro a la fila', async () => {
    const cliente = clienteQueContesta();
    const { deps, base } = await preparar(cliente);
    const r = await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(r?.llamo).toBe(true);
    expect((cliente.messages.create as any).mock.calls[0][0].model).toBe('claude-opus-5-5');
    expect(base.tablas.consumo_ia).toHaveLength(1);
    expect(base.tablas.consumo_ia[0]).toMatchObject({ servicio: 'entrevistador', paso: 'cazador_v3', modelo: 'claude-opus-5-5', narrador_id: 'n1', input_tokens: 1000, output_tokens: 200 });
    const fila = await leerFila(base.cliente, 'n1');
    expect(fila?.estado.cazador?.registro.map((x) => x.bloque)).toEqual([1]);
    expect(fila?.estado.cazador?.gastoUsd).toBeCloseTo(1000 * 4e-6 + 200 * 20e-6); // PRECIO_CAZADOR del núcleo
  });

  it('el mismo bloque no se caza dos veces', async () => {
    const cliente = clienteQueContesta();
    const { deps } = await preparar(cliente);
    await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(await cazarEnSegundoPlano(deps, 'n1', 1)).toBeNull();
    expect(cliente.messages.create).toHaveBeenCalledTimes(1);
  });

  it('si el modelo falla, no tira: el bloque queda sin repreguntas y la entrevista sigue', async () => {
    const cliente: ClienteModelo = { messages: { create: vi.fn(async () => { throw new Error('529 sobrecargado'); }) } };
    const { deps, base } = await preparar(cliente);
    const r = await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(r).toMatchObject({ llamo: true, motivo: 'error' });
    expect((await leerFila(base.cliente, 'n1'))?.estado.repreguntas ?? []).toEqual([]);
  });

  it('lo que pidió que no vaya al libro (estado.reservadas) no le llega al cazador', async () => {
    const cliente = clienteQueContesta();
    const { deps, base } = await preparar(cliente);
    base.tablas.entrevistas_v3[0].estado.reservadas = ['OR1'];
    await cazarEnSegundoPlano(deps, 'n1', 1);
    const pedidos = (cliente.messages.create as any).mock.calls.map((c: any[]) => JSON.stringify(c[0]));
    expect(pedidos.some((p: string) => p.includes('mi mamá cosía'))).toBe(false);
  });

  it('el mismo pedido sin reserva sí lleva la respuesta (control del test de arriba)', async () => {
    const cliente = clienteQueContesta();
    const { deps } = await preparar(cliente);
    await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(JSON.stringify((cliente.messages.create as any).mock.calls[0][0])).toContain('mi mamá cosía');
  });

  it('lanzarCazador no espera; esperarCazas sí', async () => {
    const cliente = clienteQueContesta();
    const { deps, base } = await preparar(cliente);
    lanzarCazador(deps, 'n1', 1);
    await esperarCazas();
    expect((await leerFila(base.cliente, 'n1'))?.estado.cazador?.registro).toHaveLength(1);
  });

  it('si el modelo falla, avisa a los socios (uno por narrador y día) con narrador, bloque y error, sin la entrevista', async () => {
    const cliente: ClienteModelo = { messages: { create: vi.fn(async () => { throw new Error('529 sobrecargado'); }) } };
    const { deps } = await preparar(cliente);
    await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(mocks.avisarSocios).toHaveBeenCalledTimes(1);
    const [clave, asunto, detalle] = mocks.avisarSocios.mock.calls[0] as string[];
    expect(clave).toBe('cazador-error:n1');
    expect(asunto).toContain('cazador');
    expect(detalle).toContain('n1');
    expect(detalle).toContain('bloque 1');
    expect(detalle).toContain('529 sobrecargado');
    expect(detalle).not.toContain('mi mamá cosía');
  });

  it('si Anthropic rechaza la clave (401), el aviso es el de la clave del entrevistador (uno por día en total)', async () => {
    const err = Object.assign(new Error('401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}'), { status: 401 });
    const cliente: ClienteModelo = { messages: { create: vi.fn(async () => { throw err; }) } };
    const { deps } = await preparar(cliente);
    await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(mocks.avisarSocios).toHaveBeenCalledTimes(1);
    const [clave, asunto, detalle] = mocks.avisarSocios.mock.calls[0] as string[];
    expect(clave).toBe('anthropic-401-entrevistador');
    expect(asunto).toBe('La clave de Anthropic del entrevistador no anda');
    expect(detalle).toContain('n1');
    expect(detalle).toContain('bloque 1');
    expect(detalle).not.toContain('mi mamá cosía');
  });

  it('si caza bien, no avisa', async () => {
    const { deps } = await preparar(clienteQueContesta());
    await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
  });
});
