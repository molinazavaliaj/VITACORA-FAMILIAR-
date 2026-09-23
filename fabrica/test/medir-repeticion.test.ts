import { describe, it, expect } from 'vitest';
import { medirRepeticion } from '../src/libro/medir-repeticion.js';

// La prueba de repetición (hallazgo 41, medido el 23/09): cada oración del libro se rastrea
// hasta la frase del audio de la que salió. Si la MISMA frase del audio aparece en dos
// capítulos, es una copia del escritor — el narrador la dijo una vez.

const FUENTES = [
  { id: 'dia_27_2', texto: 'Mi papá se fue a vivir a Chile y fueron seis meses donde había que administrar las cosas de la familia. No fue una buena época, pero me pude hacer grande, me hice hombre, y eso es lo más importante.' },
  { id: 'dia_05', texto: 'Mi abuela Babu se llama Dora y es la única abuela que tengo viva, una genia total que cocina riquísimo.' },
];

describe('medirRepeticion', () => {
  it('una frase del audio impresa en dos capítulos cuenta como copia, con sus palabras', () => {
    const r = medirRepeticion([
      { nombre: 'La juventud', texto: 'No fue una buena época, pero me pude hacer grande, me hice hombre, y eso es lo más importante.' },
      { nombre: 'Las pruebas', texto: 'Mi abuela Babu se llama Dora, la única abuela viva que tengo, una genia que cocina riquísimo.\n\nNo fue una buena época, pero me pude hacer grande, me hice hombre, y eso es lo más importante.' },
    ], FUENTES);
    expect(r.frasesEnVariosCapitulos).toHaveLength(1);
    expect(r.frasesEnVariosCapitulos[0].capitulos).toEqual(['La juventud', 'Las pruebas']);
    expect(r.palabrasDuplicadas).toBe(19);
    expect(r.porcentaje).toBeCloseTo((100 * 19) / r.palabras, 5);
  });

  it('cada frase en un solo capítulo: cero', () => {
    const r = medirRepeticion([
      { nombre: 'La juventud', texto: 'Mi papá se fue a vivir a Chile y fueron seis meses donde había que administrar las cosas de la familia.' },
      { nombre: 'Las raíces', texto: 'Mi abuela Babu se llama Dora y es la única abuela que tengo viva.' },
    ], FUENTES);
    expect(r.palabrasDuplicadas).toBe(0);
    expect(r.frasesEnVariosCapitulos).toEqual([]);
  });

  it('las citas destacadas (> ...) cuentan como texto del libro', () => {
    const r = medirRepeticion([
      { nombre: 'A', texto: '> No fue una buena época, pero me pude hacer grande, me hice hombre.' },
      { nombre: 'B', texto: 'No fue una buena época, pero me pude hacer grande, me hice hombre.' },
    ], FUENTES);
    expect(r.frasesEnVariosCapitulos).toHaveLength(1);
  });

  it('una oración sin respaldo en ninguna fuente se cuenta aparte, no como copia', () => {
    const r = medirRepeticion([{ nombre: 'A', texto: 'Esta oración no la dijo nunca nadie en ninguna entrevista grabada.' }], FUENTES);
    expect(r.sinRespaldo).toBe(1);
    expect(r.palabrasDuplicadas).toBe(0);
  });
});
