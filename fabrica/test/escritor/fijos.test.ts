// El material inventado de Nélida tiene que pasar los controles originales del registro (C14)
// y del plan (C12, C13, C19, C20, C33): es la base de los tests del orquestador.
import { describe, expect, it } from 'vitest';
import { aDisco, carpetaNelida, correrMjs } from './ayuda.js';

describe('material de Nélida', () => {
  const dir = aDisco(carpetaNelida());
  it('el registro pasa C14 con controles.mjs', () => {
    const r = correrMjs('controles.mjs', [dir, 'registro']);
    expect(r.salida).toBe('registro: ok\n');
    expect(r.codigo).toBe(0);
  });
  it('el plan pasa sus controles con controles.mjs', () => {
    const r = correrMjs('controles.mjs', [dir, 'plan']);
    expect(r.salida).toBe('plan: ok\n');
    expect(r.codigo).toBe(0);
  });
});
