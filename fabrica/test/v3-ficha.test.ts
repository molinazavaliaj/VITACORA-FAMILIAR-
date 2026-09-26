import { describe, it, expect } from 'vitest';
import { estado, lista, edadActual, anioMigracion, edadMigracion, type FichaV3 } from '../src/v3/ficha.js';

const base: FichaV3 = { nombre: 'Ana', anioNacimiento: 1950, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'Argentina' };

describe('ficha v3', () => {
  it('estado: lleno / no-tiene / no-sabe (vacío cuenta como no-sabe)', () => {
    expect(estado(['Pablo'])).toBe('lleno');
    expect(estado('no-tiene')).toBe('no-tiene');
    expect(estado('no-sabe')).toBe('no-sabe');
    expect(estado(undefined)).toBe('no-sabe');
    expect(estado([])).toBe('no-sabe');
    expect(estado(false)).toBe('no-tiene');
    expect(estado(true)).toBe('lleno');
  });

  it('lista devuelve [] si no está lleno', () => {
    expect(lista(['a', 'b'])).toEqual(['a', 'b']);
    expect(lista('no-tiene')).toEqual([]);
    expect(lista(undefined)).toEqual([]);
  });

  it('edad actual con año de referencia', () => {
    expect(edadActual(base, 2026)).toBe(76);
  });

  it('año y edad de migración: del año, o de la edad', () => {
    expect(anioMigracion({ ...base, migracion: { de: 'Galicia', a: 'Buenos Aires', anio: 1974 } })).toBe(1974);
    expect(anioMigracion({ ...base, migracion: { de: 'Rosario', a: 'Madrid', edad: 44 } })).toBe(1994);
    expect(edadMigracion({ ...base, migracion: { de: 'Galicia', a: 'Buenos Aires', anio: 1974 } })).toBe(24);
    expect(anioMigracion({ ...base, migracion: { de: 'x', a: 'y' } })).toBeNull();
    expect(anioMigracion({ ...base, migracion: 'no-tiene' })).toBeNull();
  });
});
