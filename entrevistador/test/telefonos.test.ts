import { describe, it, expect } from 'vitest';
import { variantesDeTelefono } from '../src/whatsapp/telefonos.js';

// Los números argentinos tienen dos formas: con el 9 de celular después del 54
// (+549 11…, que es como los guarda la web) y sin él (+54 11…, que es como a
// veces los manda Meta en el `from` del webhook). Un narrador no puede quedar
// afuera por eso: se buscan las dos.
describe('variantesDeTelefono', () => {
  it('un argentino con 9 también se busca sin 9, y viceversa', () => {
    expect(variantesDeTelefono('+5491178174942')).toEqual(['+5491178174942', '+541178174942']);
    expect(variantesDeTelefono('+541178174942')).toEqual(['+541178174942', '+5491178174942']);
  });
  it('un número que no es argentino se busca tal cual', () => {
    expect(variantesDeTelefono('+34636824626')).toEqual(['+34636824626']);
    expect(variantesDeTelefono('+15551829748')).toEqual(['+15551829748']);
  });
  it('sin el + adelante, se lo agrega', () => {
    expect(variantesDeTelefono('5491178174942')).toEqual(['+5491178174942', '+541178174942']);
  });
});
