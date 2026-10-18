// La cuenta que dispara la devolución de §8 (textos aprobados por Naza el 18/10).
//
// Los términos prometen devolver todo «sin que tengas que pedirlo» cuando la
// entrevista termina con menos de diez preguntas principales contestadas. La
// devolución es a mano, así que esta cuenta es lo único que la dispara.

import { describe, expect, it } from 'vitest';
import { preguntasContestadas, RESPUESTAS_PARA_UN_LIBRO } from '../../src/v3/enviar.js';

const con = (...claves: string[]) => ({ respuestas: claves.map((c) => [c, 'algo que contó'] as [string, string]) });

describe('las preguntas que cuentan para §8', () => {
  it('el umbral es el que dicen los términos', () => {
    expect(RESPUESTAS_PARA_UN_LIBRO).toBe(10);
  });

  it('cuenta una por pregunta', () => {
    expect(preguntasContestadas(con('OR1', 'M1', 'M3'))).toBe(3);
  });

  it('una repregunta no suma: es la misma pregunta', () => {
    expect(preguntasContestadas(con('OR1', 'RP~OR1'))).toBe(1);
  });

  it('una segunda oportunidad tampoco suma', () => {
    expect(preguntasContestadas(con('M3', 'M3~2'))).toBe(1);
  });

  it('diez preguntas con sus repreguntas siguen siendo diez', () => {
    const claves = Array.from({ length: 10 }, (_, i) => `M${i + 1}`);
    expect(preguntasContestadas(con(...claves, ...claves.map((c) => `RP~${c}`)))).toBe(10);
  });

  it('una entrevista vacía no cuenta nada', () => {
    expect(preguntasContestadas({ respuestas: [] })).toBe(0);
  });

  // Las inferidas las dedujo el motor de otra respuesta: no las contó ella, así
  // que no son material para el libro ni cuentan para la devolución.
  it('las inferidas no cuentan', () => {
    const e = { respuestas: [['OR1', 'contó esto'], ['M1', '[inferida] de OR1']] as [string, string][] };
    expect(preguntasContestadas(e)).toBeLessThanOrEqual(2);
  });

  it('nueve respuestas dan devolución y diez no', () => {
    const nueve = Array.from({ length: 9 }, (_, i) => `M${i + 1}`);
    const diez = [...nueve, 'M10'];
    expect(preguntasContestadas(con(...nueve))).toBeLessThan(RESPUESTAS_PARA_UN_LIBRO);
    expect(preguntasContestadas(con(...diez))).toBeGreaterThanOrEqual(RESPUESTAS_PARA_UN_LIBRO);
  });
});
