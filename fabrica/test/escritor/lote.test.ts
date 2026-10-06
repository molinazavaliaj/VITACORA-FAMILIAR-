// fabrica/test/escritor/lote.test.ts
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { LoteAnthropic, type ClienteLotes, type ResultadoApi } from '../../src/escritor/modelo/lote-anthropic.js';
import { armarParams } from '../../src/escritor/modelo/pedido.js';
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
    expect(JSON.parse((await almacen.leer('lotes/C-estilo-1.json')) as string)).toEqual({ id: 'msgbatch_1', claves: ['C/7-estilo-cap_1', 'C/7-estilo-cap_2'] });
  });

  it('si se cortó con el lote ya mandado, no lo manda de nuevo: retoma el mismo', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir('lotes/C-titulos.json', JSON.stringify({ id: 'msgbatch_viejo', claves: ['C/3t-titulo-01'] }));
    const { cliente, vistos } = clienteFalso(['ended'], [ok('p0', '{"titulo": "x"}')]);
    const r = await new LoteAnthropic(cliente, almacen).enviar('C-titulos', [pedido('C/3t-titulo-01')]);
    expect(vistos.creados).toHaveLength(0);
    expect(r[0]).toMatchObject({ clave: 'C/3t-titulo-01', ok: true });
  });

  it('un resultado que falta o un rechazo cuentan como error (van sin lote)', async () => {
    const { cliente } = clienteFalso(['ended'], [{ custom_id: 'p0', result: { type: 'succeeded', message: { content: [], usage: {}, stop_reason: 'refusal' } } }]);
    const r = await new LoteAnthropic(cliente, new AlmacenMemoria()).enviar('G', [pedido('a'), pedido('b')]);
    expect(r).toEqual([{ clave: 'a', ok: false, error: 'el modelo rechazó el pedido (refusal)' }, { clave: 'b', ok: false, error: 'sin resultado en el lote' }]);
  });
});
