// fabrica/test/escritor/lote.test.ts
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { LoteAnthropic, type ClienteLotes, type ResultadoApi } from '../../src/escritor/modelo/lote-anthropic.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { armarParams, hashDePedido } from '../../src/escritor/modelo/pedido.js';
import type { PedidoModelo } from '../../src/escritor/modelo/tipos.js';

const pedido = (clave: string): PedidoModelo => ({ clave, modelo: 'claude-opus-5-5', bloques: ['<ficha>\nf\n</ficha>', 'Corregí.'], cacheEn: [], maxTokens: 64000, esfuerzo: 'xhigh' });
const ok = (custom_id: string, text: string): ResultadoApi => ({ custom_id, result: { type: 'succeeded', message: { content: [{ type: 'text', text }], usage: { input_tokens: 10, output_tokens: 2 }, stop_reason: 'end_turn' } } });

function clienteFalso(estados: string[], resultados: ResultadoApi[]) {
  const vistos = { creados: [] as { custom_id: string; params: Record<string, unknown> }[][], consultas: 0 };
  const cliente: ClienteLotes = {
    messages: {
      batches: {
        create: async (b) => { vistos.creados.push(b.requests); return { id: 'msgbatch_1' }; },
        retrieve: async () => ({ processing_status: estados[Math.min(vistos.consultas++, estados.length - 1)] }),
        results: async () => (async function* () { for (const r of resultados) yield r; })(),
      },
    },
  };
  return { cliente, vistos };
}

describe('LoteAnthropic', () => {
  it('manda un pedido por clave, espera a que termine y ubica cada resultado por custom_id', async () => {
    const almacen = new AlmacenMemoria();
    const esperas: number[] = [];
    const { cliente, vistos } = clienteFalso(['in_progress', 'ended'], [
      { custom_id: 'p1', result: { type: 'errored', error: { error: { message: 'overloaded' } } } },
      ok('p0', '{"cambios": []}'),
    ]);
    const lote = new LoteAnthropic(cliente, almacen, { esperar: async (ms) => { esperas.push(ms); }, cadaMs: 7 });
    const r = await lote.enviar('C-estilo-1', [pedido('C/7-estilo-cap_1'), pedido('C/7-estilo-cap_2')]);
    expect(vistos.creados[0]).toEqual([{ custom_id: 'p0', params: armarParams(pedido('C/7-estilo-cap_1')) }, { custom_id: 'p1', params: armarParams(pedido('C/7-estilo-cap_2')) }]);
    expect(esperas).toEqual([7]);
    expect(r).toEqual([
      { clave: 'C/7-estilo-cap_1', ok: true, respuesta: { texto: '{"cambios": []}', uso: { input_tokens: 10, output_tokens: 2 }, motivoFin: 'end_turn' } },
      { clave: 'C/7-estilo-cap_2', ok: false, error: 'overloaded' },
    ]);
    expect(JSON.parse((await almacen.leer('lotes/C-estilo-1.json')) as string)).toEqual({ id: 'msgbatch_1', claves: ['C/7-estilo-cap_1', 'C/7-estilo-cap_2'], hashes: [pedido('C/7-estilo-cap_1'), pedido('C/7-estilo-cap_2')].map(hashDePedido) });
  });

  it('si se cortó con el lote ya mandado, no lo manda de nuevo: retoma el mismo', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir('lotes/C-titulos.json', JSON.stringify({ id: 'msgbatch_viejo', claves: ['C/3t-titulo-01'], hashes: [hashDePedido(pedido('C/3t-titulo-01'))] }));
    const { cliente, vistos } = clienteFalso(['ended'], [ok('p0', '{"titulo": "x"}')]);
    const r = await new LoteAnthropic(cliente, almacen).enviar('C-titulos', [pedido('C/3t-titulo-01')]);
    expect(vistos.creados).toHaveLength(0);
    expect(r[0]).toMatchObject({ clave: 'C/3t-titulo-01', ok: true });
  });

  it('mismas claves con otro contenido: no reusa el lote viejo, manda uno nuevo y usa sus respuestas', async () => {
    const almacen = new AlmacenMemoria();
    const viejo = clienteFalso(['ended'], [ok('p0', '{"titulo": "viejo"}')]);
    await new LoteAnthropic(viejo.cliente, almacen).enviar('C-titulos', [pedido('C/3t-titulo-01')]);
    const cambiado: PedidoModelo = { ...pedido('C/3t-titulo-01'), bloques: ['<ficha>\nf corregida\n</ficha>', 'Corregí.'] };
    const nuevo = clienteFalso(['ended'], [ok('p0', '{"titulo": "nuevo"}')]);
    nuevo.cliente.messages.batches.create = async (b) => { nuevo.vistos.creados.push(b.requests); return { id: 'msgbatch_2' }; };
    const pedidosRetrieve: string[] = [];
    const retrieve = nuevo.cliente.messages.batches.retrieve;
    nuevo.cliente.messages.batches.retrieve = async (id) => { pedidosRetrieve.push(id); return retrieve(id); };
    const [r] = await new LoteAnthropic(nuevo.cliente, almacen).enviar('C-titulos', [cambiado]);
    expect(nuevo.vistos.creados).toEqual([[{ custom_id: 'p0', params: armarParams(cambiado) }]]);
    expect(pedidosRetrieve).toEqual(['msgbatch_2']);
    expect(r).toMatchObject({ clave: 'C/3t-titulo-01', ok: true, respuesta: { texto: '{"titulo": "nuevo"}' } });
    expect(JSON.parse((await almacen.leer('lotes/C-titulos.json')) as string)).toMatchObject({ id: 'msgbatch_2', claves: ['C/3t-titulo-01'], hashes: [hashDePedido(cambiado)] });
  });

  it('un resultado que falta o un rechazo cuentan como error (van sin lote)', async () => {
    const { cliente } = clienteFalso(['ended'], [{ custom_id: 'p0', result: { type: 'succeeded', message: { content: [], usage: {}, stop_reason: 'refusal' } } }]);
    const r = await new LoteAnthropic(cliente, new AlmacenMemoria()).enviar('G', [pedido('a'), pedido('b')]);
    // El rechazo vino con uso (la API lo cobra): el ejecutor lo suma al gasto.
    expect(r).toEqual([{ clave: 'a', ok: false, error: 'el modelo rechazó el pedido (refusal)', uso: {} }, { clave: 'b', ok: false, error: 'sin resultado en el lote' }]);
  });

  it('un corte por max_tokens en el lote vuelve marcado como corte (el ejecutor lo cuenta)', async () => {
    const { cliente } = clienteFalso(['ended'], [{ custom_id: 'p0', result: { type: 'succeeded', message: { content: [], usage: { output_tokens: 9 }, stop_reason: 'max_tokens' } } }]);
    const [r] = await new LoteAnthropic(cliente, new AlmacenMemoria()).enviar('G', [pedido('a')]);
    expect(r).toEqual({ clave: 'a', ok: false, error: 'la respuesta se cortó por max_tokens', uso: { output_tokens: 9 }, porMaxTokens: true });
  });
});

describe('LoteAnthropic: retomar con parte ya anotada (revisión del worker, 08/10)', () => {
  it('si lo pedido es parte del lote guardado (mismas claves y hashes), espera ese lote y no paga otro', async () => {
    const almacen = new AlmacenMemoria();
    const { cliente, vistos } = clienteFalso(['ended'], [ok('p0', 'uno'), ok('p1', 'dos'), ok('p2', 'tres')]);
    const lote = new LoteAnthropic(cliente, almacen, { esperar: async () => {} });
    const todos = [pedido('C/7-estilo-a'), pedido('C/7-estilo-b'), pedido('C/7-estilo-c')];
    await lote.enviar('C-estilo-1', todos);
    const r = await lote.enviar('C-estilo-1', [todos[2], todos[0]]);
    expect(vistos.creados).toHaveLength(1);
    expect(r.map((x) => [x.clave, x.ok && x.respuesta.texto])).toEqual([['C/7-estilo-c', 'tres'], ['C/7-estilo-a', 'uno']]);
    const otro = { ...todos[1], bloques: [todos[1].bloques[0], 'Otra cosa.'] };
    await lote.enviar('C-estilo-1', [otro]);
    expect(vistos.creados).toHaveLength(2);
  });
});

describe('LoteAnthropic: cuando falla el lote entero (revisión final, punto 5)', () => {
  const errorApi = (status: number): Error => Object.assign(new Error(`${status} overloaded`), { status });

  it('un error pasajero al consultar el lote se reintenta con espera creciente', async () => {
    const { cliente } = clienteFalso(['ended'], [ok('p0', '{"x": 1}')]);
    let fallas = 2;
    const retrieve = cliente.messages.batches.retrieve;
    cliente.messages.batches.retrieve = async (id) => { if (fallas-- > 0) throw errorApi(529); return retrieve(id); };
    const esperas: number[] = [];
    const [r] = await new LoteAnthropic(cliente, new AlmacenMemoria(), { esperar: async (ms) => { esperas.push(ms); }, esperasErrorMs: [5, 50, 500] }).enviar('G', [pedido('a')]);
    expect(r).toMatchObject({ clave: 'a', ok: true });
    expect(esperas).toEqual([5, 50]);
  });

  it('si el error de la consulta sigue después de los reintentos (o no es pasajero), tira', async () => {
    const { cliente } = clienteFalso(['ended'], []);
    let consultas = 0;
    cliente.messages.batches.retrieve = async () => { consultas++; throw errorApi(529); };
    await expect(new LoteAnthropic(cliente, new AlmacenMemoria(), { esperar: async () => {}, esperasErrorMs: [1, 1] }).enviar('G', [pedido('a')])).rejects.toThrow('529');
    expect(consultas).toBe(3);
    const otro = clienteFalso(['ended'], []);
    let consultas400 = 0;
    otro.cliente.messages.batches.retrieve = async () => { consultas400++; throw errorApi(400); };
    await expect(new LoteAnthropic(otro.cliente, new AlmacenMemoria(), { esperar: async () => {}, esperasErrorMs: [1, 1] }).enviar('G', [pedido('a')])).rejects.toThrow('400');
    expect(consultas400).toBe(1);
  });

  it('si no se puede crear el lote, todo vuelve con error (el ejecutor lo hace sin lote) y no queda lote guardado', async () => {
    const almacen = new AlmacenMemoria();
    const { cliente } = clienteFalso(['ended'], []);
    cliente.messages.batches.create = async () => { throw errorApi(500); };
    const r = await new LoteAnthropic(cliente, almacen).enviar('G', [pedido('a'), pedido('b')]);
    expect(r).toEqual([{ clave: 'a', ok: false, error: 'no se pudo crear el lote: 500 overloaded' }, { clave: 'b', ok: false, error: 'no se pudo crear el lote: 500 overloaded' }]);
    expect(await almacen.leer('lotes/G.json')).toBeNull();
  });

  it('con el ejecutor: si el lote no se crea, la fase sale igual con llamadas directas', async () => {
    const almacen = new AlmacenMemoria();
    const { cliente } = clienteFalso(['ended'], []);
    cliente.messages.batches.create = async () => { throw errorApi(500); };
    const modelo = new ModeloFalso({ '7-estilo-cap_1': '{"cambios": []}', '7-estilo-cap_2': '{"cambios": []}' });
    const e = new Ejecutor({ modelo, lote: new LoteAnthropic(cliente, almacen), almacen });
    const llamada = (nombre: string) => ({ nombre, docs: ['<ficha>\nf\n</ficha>'], instr: 'x' });
    const r = await e.varios(['cap_1', 'cap_2'].map((p) => ({ clave: `C/7-estilo-${p}`, llamada: llamada(`7-estilo-${p}`), json: true })), { lote: true, grupo: 'C-estilo-1' });
    expect([...r.textos.keys()].sort()).toEqual(['C/7-estilo-cap_1', 'C/7-estilo-cap_2']);
    expect(modelo.llamadas.map((p) => p.clave).sort()).toEqual(['C/7-estilo-cap_1', 'C/7-estilo-cap_2']);
    expect(e.filas.every((f) => !f.lote)).toBe(true);
  });
});
