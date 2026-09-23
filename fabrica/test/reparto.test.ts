import { describe, it, expect } from 'vitest';
import { partirEnOraciones, numerarRespuestas, parsearReparto, materialRepartido } from '../src/libro/reparto.js';

// El reparto (biógrafo v2, hallazgo 41 medido el 23/09): el libro de Joaquín tenía el 11,6 %
// de sus palabras copiado — frases dichas UNA vez impresas en 2 o 3 capítulos — porque cada
// capítulo se escribía solo, con la historia completa y la orden de "traer lo que le
// pertenezca". Ahora cada oración vive en UN capítulo: por defecto el de su pregunta, y el
// modelo solo decide qué tramos se mudan. Lo que no entiende, lo ignora: nada se pierde.

const CAPITULOS = [
  { nombre: 'La infancia', ordenes: [1, 2] },
  { nombre: 'El oficio', ordenes: [16] },
  { nombre: 'Las pruebas', ordenes: [22] },
];

const RESPUESTAS = numerarRespuestas([
  { orden: 1, pregunta: '¿Dónde nació?', texto: 'Nací en Rosario. Mi vieja cocinaba todo el día.' },
  { orden: 16, pregunta: '¿Su primer trabajo?', texto: 'Arranqué en el taller. Ahí me acordé del patio de la abuela. Jugábamos a la pelota con los primos. Después me echaron.' },
  { orden: 22, pregunta: '¿Una prueba?', texto: 'Whanau fue un fracaso. Aprendí a elegir socios.' },
]);

describe('partirEnOraciones', () => {
  it('parte por punto, signo de pregunta o exclamación, y no deja vacíos', () => {
    expect(partirEnOraciones('Nací en Rosario. ¿Sabés? ¡Qué época!  Fin')).toEqual(['Nací en Rosario.', '¿Sabés?', '¡Qué época!', 'Fin']);
  });

  it('no parte en los puntos suspensivos seguidos de minúscula (sigue la misma idea)', () => {
    expect(partirEnOraciones('Y bueno... así fue. Listo.')).toEqual(['Y bueno... así fue.', 'Listo.']);
  });
});

describe('numerarRespuestas', () => {
  it('numera R1..Rn y cada oración R{n}.{k}', () => {
    expect(RESPUESTAS[1].id).toBe('R2');
    expect(RESPUESTAS[1].oraciones).toHaveLength(4);
  });
});

describe('parsearReparto', () => {
  it('lee tramos y oraciones sueltas, con → o ->', () => {
    const { movidas, ignoradas } = parsearReparto('R2.2-R2.3 → 1\nR3.2 -> 3', RESPUESTAS, CAPITULOS);
    expect([...movidas]).toEqual([['R2.2', 1], ['R2.3', 1], ['R3.2', 3]]);
    expect(ignoradas).toEqual([]);
  });

  it('NADA es no mover nada', () => {
    expect(parsearReparto('NADA', RESPUESTAS, CAPITULOS).movidas.size).toBe(0);
  });

  it('ignora (y anota) lo que no entiende: capítulo inexistente, tramo entre respuestas, oración que no existe', () => {
    const { movidas, ignoradas } = parsearReparto(
      'R2.2 → 9\nR1.2-R2.1 → 2\nR2.7 → 1\nhola\nR2.4 → 3',
      RESPUESTAS, CAPITULOS,
    );
    expect([...movidas]).toEqual([['R2.4', 3]]);
    expect(ignoradas).toHaveLength(4);
  });

  it('una oración se muda una sola vez: gana la primera línea', () => {
    const { movidas } = parsearReparto('R2.2 → 1\nR2.2 → 3', RESPUESTAS, CAPITULOS);
    expect(movidas.get('R2.2')).toBe(1);
  });
});

describe('materialRepartido', () => {
  it('sin mudanzas, cada capítulo tiene exactamente sus respuestas', () => {
    const material = materialRepartido(RESPUESTAS, CAPITULOS, new Map()).porCapitulo;
    expect(material[0]).toBe('P: ¿Dónde nació?\nR: Nací en Rosario. Mi vieja cocinaba todo el día.');
    expect(material[1]).toContain('Arranqué en el taller.');
    expect(material[1]).toContain('Después me echaron.');
  });

  it('un tramo mudado sale de su capítulo y entra al otro, marcado: está en UN solo lugar', () => {
    const { movidas } = parsearReparto('R2.2-R2.3 → 1', RESPUESTAS, CAPITULOS);
    const material = materialRepartido(RESPUESTAS, CAPITULOS, movidas).porCapitulo;
    expect(material[0]).toContain('P: ¿Su primer trabajo? (lo contó respondiendo otra pregunta)\nR: Ahí me acordé del patio de la abuela. Jugábamos a la pelota con los primos.');
    expect(material[1]).not.toContain('patio');
    // El hueco queda marcado: juntar "Arranqué en el taller" con "Después me echaron" sin
    // marca sería fundir dos momentos en uno (la fusión del hallazgo 40).
    expect(material[1]).toContain('Arranqué en el taller. […] Después me echaron.');
  });

  it('cada oración de cada respuesta aparece en exactamente un capítulo', () => {
    const { movidas } = parsearReparto('R2.2-R2.3 → 1\nR3.2 → 1', RESPUESTAS, CAPITULOS);
    const todo = materialRepartido(RESPUESTAS, CAPITULOS, movidas).porCapitulo.join('\n');
    for (const r of RESPUESTAS) for (const o of r.oraciones) {
      expect(todo.split(o).length - 1, o).toBe(1);
    }
  });

  it('una respuesta de una orden que no está en ningún capítulo se devuelve aparte, no desaparece callada', () => {
    const sueltas = numerarRespuestas([{ orden: 99, pregunta: '¿Algo más?', texto: 'Gracias por todo.' }]);
    const { porCapitulo, sinCapitulo } = materialRepartido(sueltas, CAPITULOS, new Map());
    expect(porCapitulo.join('')).toBe('');
    expect(sinCapitulo.map((r) => r.orden)).toEqual([99]);
  });

  it('pero si el reparto la muda a un capítulo, entra ahí', () => {
    const sueltas = numerarRespuestas([{ orden: 99, pregunta: '¿Algo más?', texto: 'Gracias por todo.' }]);
    const { porCapitulo, sinCapitulo } = materialRepartido(sueltas, CAPITULOS, new Map([['R1.1', 3]]));
    expect(porCapitulo[2]).toContain('Gracias por todo.');
    expect(sinCapitulo).toEqual([]);
  });
});
