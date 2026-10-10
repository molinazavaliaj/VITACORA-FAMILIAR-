import { APIConnectionError, APIConnectionTimeoutError } from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import { aRespuesta, esReintentable, ModeloAnthropic, type MensajeApi } from '../../src/escritor/modelo/anthropic.js';
import { claveBase, LoteFalso, ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { armarParams, puntosDeCache } from '../../src/escritor/modelo/pedido.js';
import { ErrorDelModelo, type PedidoModelo } from '../../src/escritor/modelo/tipos.js';

const pedido = (clave = 'C/3b-capitulo-01'): PedidoModelo => ({ clave, modelo: 'claude-opus-5-5', bloques: ['<ficha>\nf\n</ficha>', '<voz>\nv\n</voz>', 'Escribí.'], cacheEn: [1], maxTokens: 64000, esfuerzo: 'xhigh' });

describe('pedido', () => {
  it('cada documento es un bloque de texto; la caché va donde se marca; pensamiento adaptativo y esfuerzo', () => {
    expect(armarParams(pedido())).toEqual({
      model: 'claude-opus-5-5',
      max_tokens: 64000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'xhigh' },
      messages: [{ role: 'user', content: [
        { type: 'text', text: '<ficha>\nf\n</ficha>\n\n' },
        { type: 'text', text: '<voz>\nv\n</voz>\n\n', cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'Escribí.' },
      ] }],
    });
  });

  it('la caché se marca en lo que se repite entre llamadas', () => {
    const puro = ['<ficha>\nf\n</ficha>', '<voz>\nv\n</voz>', '<respuestas>\nr\n</respuestas>'];
    expect(puntosDeCache('3b-capitulo-01', puro)).toEqual([1]);
    expect(puntosDeCache('7-estilo-cap_1-2', [...puro.slice(0, 2), '<pieza>\np\n</pieza>'])).toEqual([1]);
    expect(puntosDeCache('6-arreglo-cap_1', puro)).toEqual([1]);
    expect(puntosDeCache('2h-armador-01', ['<respuestas>\nr\n</respuestas>'])).toEqual([]);
    expect(puntosDeCache('1-registro', ['l', 'g', 'f', 'r'])).toEqual([3]);
    expect(puntosDeCache('2-plan', ['l', 'g', 'f', 'r', 'reg'])).toEqual([4]);
    expect(puntosDeCache('4-hechos', ['l', 'g', 'f', 'r', 'reg', 'lib', 'pres', 'pas'])).toEqual([4, 7]);
    expect(puntosDeCache('4-hechos-repaso', ['l', 'g', 'f', 'r', 'reg', 'lib', 'pres', 'pas', 'dec'])).toEqual([4]);
    expect(puntosDeCache('disputa-cap_1-1', ['l', 'g', 'f', 'r', 'reg', 'lib', 'pres', 'pas'])).toEqual([4, 7]);
    expect(puntosDeCache('3t-titulo-01', ['<capitulo>\nc\n</capitulo>'])).toEqual([]);
  });
});

describe('ModeloAnthropic', () => {
  const mensaje = (m: Partial<MensajeApi>): MensajeApi => ({ content: [{ type: 'thinking' }, { type: 'text', text: 'el capítulo' }], usage: { input_tokens: 10, output_tokens: 5 }, stop_reason: 'end_turn', ...m });

  it('manda los params armados por streaming y devuelve el texto (sin el pensamiento) y el uso', async () => {
    let enviado: Record<string, unknown> | null = null;
    const m = new ModeloAnthropic({ messages: { stream: (p) => { enviado = p; return { finalMessage: async () => mensaje({}) }; } } });
    const r = await m.llamar(pedido());
    expect(enviado).toEqual(armarParams(pedido()));
    expect(r).toEqual({ texto: 'el capítulo', uso: { input_tokens: 10, output_tokens: 5 }, motivoFin: 'end_turn' });
  });

  it('un rechazo no se reintenta; un corte por max_tokens sí', () => {
    expect(() => aRespuesta(mensaje({ stop_reason: 'refusal' }))).toThrow(ErrorDelModelo);
    try { aRespuesta(mensaje({ stop_reason: 'refusal' })); } catch (e) { expect((e as ErrorDelModelo).reintentable).toBe(false); }
    try { aRespuesta(mensaje({ stop_reason: 'max_tokens' })); } catch (e) { expect((e as ErrorDelModelo).reintentable).toBe(true); }
  });

  it('un rechazo o un corte llevan el uso que la API cobró, y el corte se marca como corte', () => {
    const fallo = (stop_reason: string): ErrorDelModelo => { try { aRespuesta(mensaje({ stop_reason })); } catch (e) { return e as ErrorDelModelo; } throw new Error('no tiró'); };
    expect(fallo('refusal')).toMatchObject({ uso: { input_tokens: 10, output_tokens: 5 }, porMaxTokens: false });
    expect(fallo('max_tokens')).toMatchObject({ uso: { input_tokens: 10, output_tokens: 5 }, porMaxTokens: true });
  });

  it('red, 429, 529 y 5xx se reintentan; 400 no', async () => {
    expect(esReintentable(Object.assign(new Error('x'), { status: 529 }))).toBe(true);
    expect(esReintentable(Object.assign(new Error('x'), { status: 429 }))).toBe(true);
    expect(esReintentable(Object.assign(new Error('x'), { status: 500 }))).toBe(true);
    expect(esReintentable(Object.assign(new Error('x'), { name: 'APIConnectionError' }))).toBe(true);
    expect(esReintentable(Object.assign(new Error('x'), { status: 400 }))).toBe(false);
    const m = new ModeloAnthropic({ messages: { stream: () => ({ finalMessage: async () => { throw Object.assign(new Error('overloaded'), { status: 529 }); } }) } });
    await expect(m.llamar(pedido())).rejects.toMatchObject({ reintentable: true });
  });

  it('los errores de red del SDK de verdad se reintentan (su name es "Error", no el de la clase)', () => {
    expect(esReintentable(new APIConnectionError({ message: 'sin red' }))).toBe(true);
    expect(esReintentable(new APIConnectionTimeoutError({ message: 'tardó' }))).toBe(true);
  });
});

describe('modelo falso', () => {
  it('busca por clave sin etapa, después por clave base, después por prefijo; anota cada pedido', async () => {
    expect(claveBase('B/1-registro#2')).toBe('1-registro');
    const f = new ModeloFalso({ '1-registro': 'malo', '1-registro#2': 'bueno' }, [['7-estilo-', '{"cambios": []}']]);
    expect((await f.llamar(pedido('A/1-registro'))).texto).toBe('malo');
    expect((await f.llamar(pedido('A/1-registro#2'))).texto).toBe('bueno');
    expect((await f.llamar(pedido('A/1-registro#3'))).texto).toBe('malo');
    expect((await f.llamar(pedido('C/7-estilo-cap_1-2'))).texto).toBe('{"cambios": []}');
    await expect(f.llamar(pedido('C/nada'))).rejects.toThrow(/no tiene respuesta para C\/nada/);
    expect(f.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/1-registro#2', 'A/1-registro#3', 'C/7-estilo-cap_1-2', 'C/nada']);
  });

  it('el lote falso responde con su modelo y hace fallar lo que se le pide', async () => {
    const lote = new LoteFalso(new ModeloFalso({ '7-estilo-cap_1': 'a', '7-estilo-cap_2': 'b' }), new Set(['7-estilo-cap_2']));
    const r = await lote.enviar('C-estilo-1', [pedido('C/7-estilo-cap_1'), pedido('C/7-estilo-cap_2')]);
    expect(r).toEqual([
      { clave: 'C/7-estilo-cap_1', ok: true, respuesta: { texto: 'a', uso: { input_tokens: 1000, output_tokens: 100 }, motivoFin: 'end_turn' } },
      { clave: 'C/7-estilo-cap_2', ok: false, error: 'errored' },
    ]);
    expect(lote.grupos).toEqual(['C-estilo-1']);
  });
});

describe('pedido: configuración económica', () => {
  it('Haiku 4.5: pensamiento con presupuesto fijo (budget_tokens) y sin output_config (no acepta effort)', () => {
    const p: PedidoModelo = { clave: 'C/7-estilo-cap_1', modelo: 'claude-haiku-4-5', bloques: ['<pieza>\np\n</pieza>', 'Corregí.'], cacheEn: [], maxTokens: 64000, pensamiento: 8000 };
    expect(armarParams(p)).toEqual({
      model: 'claude-haiku-4-5', max_tokens: 64000, thinking: { type: 'enabled', budget_tokens: 8000 },
      messages: [{ role: 'user', content: [{ type: 'text', text: '<pieza>\np\n</pieza>\n\n' }, { type: 'text', text: 'Corregí.' }] }],
    });
  });

  it('sin esfuerzo ni presupuesto no va thinking', () => {
    const p: PedidoModelo = { clave: 'x', modelo: 'claude-haiku-4-5', bloques: ['hola'], cacheEn: [], maxTokens: 1000 };
    expect(armarParams(p)).not.toHaveProperty('thinking');
    expect(armarParams(p)).not.toHaveProperty('output_config');
  });

  it('caché de 1 hora: las marcas llevan ttl "1h"', () => {
    const p: PedidoModelo = { ...pedido('C/4-hechos'), cacheUnaHora: true };
    const content = (armarParams(p).messages as { content: { cache_control?: unknown }[] }[])[0].content;
    expect(content[1].cache_control).toEqual({ type: 'ephemeral', ttl: '1h' });
    expect(content[0].cache_control).toBeUndefined();
  });
});
