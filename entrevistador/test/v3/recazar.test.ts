import { describe, it, expect } from 'vitest';
import { aplicarRecaza, bloquesConError, sinErrores } from '../../src/v3/recazar.js';
import type { EstadoV3 } from '../../src/v3/tipos.js';
import type { ResultadoCaza } from '../../src/v3/nucleo/entrevista/cazador.js';

// Volver a cazar los bloques que fallaron (11/10: la key de Anthropic del
// entrevistador estaba revocada y el cazador falló en todos los bloques).

const ERROR = { llamo: true, motivo: 'error', costoUsd: 0, descartadas: [], repreguntas: [], error: '401 invalid x-api-key' };

function estado(extra: Partial<EstadoV3> = {}): EstadoV3 {
  return {
    respuestas: [['OR1', 'a'], ['OR2', 'b']],
    repreguntas: [],
    cazador: {
      gastoUsd: 0,
      escenasContadas: [],
      registro: [{ bloque: 1, ...ERROR }, { bloque: 2, llamo: true, costoUsd: 0.1, descartadas: [], repreguntas: [] }, { bloque: 3, ...ERROR }],
    },
    ...extra,
  } as unknown as EstadoV3;
}

const resultado = (bloque: number, claves: string[], costo = 0.12): ResultadoCaza => ({
  bloque, llamo: true, repreguntas: claves.map((c) => ({ clave: c, origen: 'OR1', bloque, cita: 'cita', pregunta: `¿${c}?`, tema: '' })),
  descartadas: [], escenasContadas: [`escena-${bloque}`], costoUsd: costo, gastoUsd: costo, tokens: { entrada: 100, salida: 20 },
} as unknown as ResultadoCaza);

describe('volver a cazar los bloques con error', () => {
  it('encuentra los bloques que fallaron y no los que salieron bien', () => {
    expect(bloquesConError(estado())).toEqual([1, 3]);
    expect(bloquesConError({ respuestas: [] } as unknown as EstadoV3)).toEqual([]);
  });

  it('saca solo las marcas de error, sin tocar lo demás ni el original', () => {
    const e = estado();
    const limpio = sinErrores(e, [1, 3]);
    expect(limpio.cazador!.registro.map((r) => r.bloque)).toEqual([2]);
    expect(e.cazador!.registro).toHaveLength(3);
  });

  it('aplica lo cazado: repreguntas a la cola, gasto, escenas y registro nuevo, sin repetir claves', () => {
    const e = estado({ repreguntas: [{ clave: 'RP~YA', origen: 'OR1', bloque: 2, cita: '', pregunta: '', tema: '' }] as never });
    const final = aplicarRecaza(e, [resultado(1, ['RP~A', 'RP~YA']), resultado(3, ['RP~B'])]);
    expect(final.repreguntas!.map((r) => r.clave)).toEqual(['RP~YA', 'RP~A', 'RP~B']);
    expect(final.cazador!.registro.map((r) => [r.bloque, r.motivo ?? 'ok'])).toEqual([[2, 'ok'], [1, 'ok'], [3, 'ok']]);
    expect(final.cazador!.gastoUsd).toBeCloseTo(0.24);
    expect(final.cazador!.escenasContadas).toEqual(['escena-1', 'escena-3']);
  });

  it('si mientras tanto el bloque ya se cazó bien (el bot lo hizo), no lo pisa', () => {
    const e = estado();
    e.cazador!.registro[0] = { bloque: 1, llamo: true, costoUsd: 0.2, descartadas: [], repreguntas: ['RP~BOT'] } as never;
    const final = aplicarRecaza(e, [resultado(1, ['RP~A'])]);
    expect(final.cazador!.registro.filter((r) => r.bloque === 1)).toHaveLength(1);
    expect(final.repreguntas!.map((r) => r.clave)).not.toContain('RP~A');
  });

  it('un resultado que volvió a fallar no se aplica', () => {
    expect(() => aplicarRecaza(estado(), [{ ...resultado(1, []), error: '401' } as ResultadoCaza])).toThrow(/falló/);
  });
});
