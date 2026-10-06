import { describe, expect, it } from 'vitest';
import { usdDeLlamada } from '../../src/escritor/costos.js';

const M = 1_000_000;
describe('usdDeLlamada', () => {
  it('claude-opus-5-5: 4 entrada, 20 salida, 0,20 caché leída, 5 escritura 5 min, 8 escritura 1 h', () => {
    expect(usdDeLlamada('claude-opus-5-5', { input_tokens: M }, { lote: false })).toBe(4);
    expect(usdDeLlamada('claude-opus-5-5', { output_tokens: M }, { lote: false })).toBe(20);
    expect(usdDeLlamada('claude-opus-5-5', { cache_read_input_tokens: M }, { lote: false })).toBe(0.2);
    expect(usdDeLlamada('claude-opus-5-5', { cache_creation_input_tokens: M }, { lote: false })).toBe(5);
    expect(usdDeLlamada('claude-opus-5-5', { cache_creation_input_tokens: 2 * M, cache_creation: { ephemeral_5m_input_tokens: M, ephemeral_1h_input_tokens: M } }, { lote: false })).toBe(13);
  });
  it('claude-sonnet-5-5 (el barato): 2 y 10', () => {
    expect(usdDeLlamada('claude-sonnet-5-5', { input_tokens: M, output_tokens: M }, { lote: false })).toBe(12);
  });
  it('Batch cobra la mitad de todo', () => {
    expect(usdDeLlamada('claude-opus-5-5', { input_tokens: M, output_tokens: M, cache_read_input_tokens: M }, { lote: true })).toBe(12.1);
  });
  it('un modelo sin precio no vale 0: corta (el tope de gasto depende de esto)', () => {
    expect(() => usdDeLlamada('claude-desconocido', { input_tokens: 1 }, { lote: false })).toThrow(/no hay precio/);
  });
});
