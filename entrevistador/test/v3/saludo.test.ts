import { describe, it, expect } from 'vitest';
import { esSaludo } from '../../src/v3/saludo.js';

describe('esSaludo (Naza, 09/10)', () => {
  it('un saludo solo, en cualquiera de los tres idiomas', () => {
    for (const t of ['Hola', 'hola!!', 'Holaa', 'Buenas', 'Buen día', 'Buenas tardes, ¿qué tal?', 'Hola Vitácora', 'Hola a todos', '👋 Hola']) expect(esSaludo(t, 'es-AR'), t).toBe(true);
    for (const t of ['Bon dia', 'Bona tarda!', 'Hola, què tal?', 'Ei']) expect(esSaludo(t, 'ca'), t).toBe(true);
    for (const t of ['Buenos días', 'Hola, ¿qué hay?']) expect(esSaludo(t, 'es-ES'), t).toBe(true);
  });
  it('si dice algo más, es una respuesta', () => {
    for (const t of ['Hola, nací en Rosario', 'No', 'Paso', 'Mi papá era carpintero', 'Hola mamá', 'Buenas noches pasábamos en el campo', '']) expect(esSaludo(t, 'es-AR'), t).toBe(false);
    expect(esSaludo('Bon dia, vaig néixer a Berga', 'ca')).toBe(false);
    // Un número es un dato (revisión 09/10).
    for (const t of ['Buenas, 1948', 'Hola 3', 'Hola, 8 hermanos']) expect(esSaludo(t, 'es-AR'), t).toBe(false);
  });
});
