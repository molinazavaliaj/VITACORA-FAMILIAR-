// La línea que la página y el CLI muestran en la terminal después de cada caza (02/10: Joaquín
// probó con --cazador y no le llegaban repreguntas; la línea decía "(error)" sin decir por qué).
import { describe, expect, it } from 'vitest';
import { lineaCaza } from '../scripts/v3-entrevista-turno.js';
import type { ResultadoCaza } from '../src/v3/entrevista/cazador.js';

const base: ResultadoCaza = { bloque: 2, llamo: true, repreguntas: [], descartadas: [], escenasContadas: [], costoUsd: 0, gastoUsd: 0 };

describe('la línea del cazador en la terminal', () => {
  it('si la llamada falló, dice por qué (con la key tapada)', () => {
    const l = lineaCaza({ ...base, motivo: 'error', error: '401 invalid x-api-key sk-ant-abcdef123456' });
    expect(l).toContain('401 invalid x-api-key');
    expect(l).not.toContain('sk-ant-abcdef123456');
  });
  it('dice por qué descartó cada elegida', () => {
    const l = lineaCaza({ ...base, descartadas: [{ id: 'CA2', cita: 'c', pregunta: 'p', fallas: ['la cita no es textual'] }] });
    expect(l).toContain("descartada CA2: la cita no es textual");
  });
  it('sin problemas queda como antes', () => {
    expect(lineaCaza({ ...base, costoUsd: 0.08, gastoUsd: 0.2 })).toBe('cazador, bloque 2: 0 repregunta(s) · USD 0.08 · acumulado USD 0.20');
  });
});
