// El control de código del ancla del cazador (prompt-v2.md, notas para el código).
import { describe, expect, it } from 'vitest';
import { controlarAncla } from '../scripts/v3-cazador-prueba.js';

const RESP = 'Los veranos ayudaba a mi tío a descargar el camión de la fruta, y eso me encantaba.';

describe('control del ancla', () => {
  it('pasa un pedazo textual de 6 a 14 palabras, sin mirar tildes ni mayúsculas', () => {
    expect(controlarAncla('los veranos ayudaba a mi tio a descargar el camion', RESP)).toEqual([]);
  });
  it('rechaza lo que no es textual', () => {
    expect(controlarAncla('los veranos ayudaba a mi abuelo con el camión', RESP)).toContain('no es textual');
  });
  it('rechaza menos de 6 palabras y palabras que apuntan afuera', () => {
    expect(controlarAncla('el camión de la fruta', RESP)).toContain('5 palabras');
    expect(controlarAncla('el camión de la fruta, y eso me encantaba', RESP).join()).toMatch(/apunta afuera: eso/);
  });
  it('no confunde un pedazo de palabra con la palabra entera', () => {
    expect(controlarAncla('veranos ayudaba a mi tío a descargar el cami', RESP)).toContain('no es textual');
  });
});
