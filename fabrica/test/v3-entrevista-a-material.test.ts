// El material del escritor desde una entrevista V3 (scripts/v3-entrevista-a-material.ts).
// Desde el 01/10 (plan del cazador, B3): lo que contesta en la segunda
// oportunidad (X~2) y en la repregunta (RP~X) va pegado a la respuesta X, con
// el mismo id y sin el texto de la repregunta. Datos inventados.

import { describe, expect, it } from 'vitest';
import { aMaterial } from '../scripts/v3-entrevista-a-material.js';
import { respuestaDeBoton } from '../src/v3/entrevista/respuesta.js';

const ficha = { nombre: 'Elvira', genero: 'mujer' as const };

describe('material: segunda oportunidad y repreguntas pegadas a su respuesta', () => {
  const filas = aMaterial({
    ficha,
    respuestas: [
      ['CA2', 'Mi mamá cosía para afuera y cantaba tangos.'],
      ['CA16', 'No me acuerdo.'],
      ['CA16~2', 'Los carnavales del club y el corso de los sábados.'],
      ['CA17', 'Paso.'],
      ['RP~CA2', 'Una tarde de lluvia cantó un tango entero mientras me cosía el guardapolvo.'],
      ['RP~CA17', respuestaDeBoton('Ya lo conté todo')],
    ],
  });

  it('no hay filas aparte para X~2 ni RP~X: los ids siguen corridos', () => {
    expect(filas.map((f) => [f.id, f.preguntaId])).toEqual([['R01', 'CA2'], ['R02', 'CA16'], ['R03', 'CA17']]);
  });

  it('la repregunta suma su texto a la respuesta de origen (sin el texto de la repregunta)', () => {
    expect(filas[0].texto).toBe('Mi mamá cosía para afuera y cantaba tangos.\n\nUna tarde de lluvia cantó un tango entero mientras me cosía el guardapolvo.');
    expect(filas[0].pregunta).not.toMatch(/Me quedé pensando/);
    expect(filas[0].palabras).toBe(21);
  });

  it('la segunda oportunidad que cuenta algo hace que la respuesta cuente (ya no es paso)', () => {
    expect(filas[1]).toMatchObject({ texto: 'No me acuerdo.\n\nLos carnavales del club y el corso de los sábados.', paso: false });
  });

  it('lo que no cuenta nada ([Ya lo conté todo], un olvido) no se suma', () => {
    expect(filas[2]).toMatchObject({ texto: 'Paso.', paso: true });
  });
});
