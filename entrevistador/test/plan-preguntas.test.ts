import { describe, it, expect } from 'vitest';
import { edadDe, rangoDeEtapa, RANGO_TRAMO } from '../src/ia/plan-preguntas.js';
import { perfilVacio } from '../src/ia/perfil.js';

describe('edadDe', () => {
  it('la edad dicha, el medio de un rango, o la que sale del año de nacimiento', () => {
    const p = perfilVacio();
    expect(edadDe(p, 2026)).toBeNull();
    p.persona.edad = { valor: 'entre 65 y 75', fuente: 'deducido' };
    expect(edadDe(p, 2026)).toBe(70);
    p.persona.edad = null; p.persona.anioNacimiento = { valor: '1950', fuente: 'ficha' };
    expect(edadDe(p, 2026)).toBe(76);
  });
});
describe('rangoDeEtapa', () => {
  it('"7 a 17", "desde los 12", "hasta los 10"', () => {
    expect(rangoDeEtapa('7 a 17', 70)).toEqual([7, 17]);
    expect(rangoDeEtapa('desde los 12', 70)).toEqual([12, 70]);
    expect(rangoDeEtapa('hasta los 10', 70)).toEqual([0, 10]);
    expect(rangoDeEtapa('de chica', 70)).toBeNull();
  });
  it('los tramos cubren de 0 a 200 sin huecos', () => {
    expect(RANGO_TRAMO.infancia[0]).toBe(0);
    expect(RANGO_TRAMO['segunda mitad'][1]).toBe(200);
  });
});
