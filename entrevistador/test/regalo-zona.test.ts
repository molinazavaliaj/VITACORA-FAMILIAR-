import { describe, it, expect } from 'vitest';
import { zonaPorTelefono } from '../src/flujo/regalo-zona.js';

describe('zonaPorTelefono', () => {
  it('+54 es Buenos Aires (con y sin el 9)', () => {
    expect(zonaPorTelefono('+5491155551234')).toBe('America/Argentina/Buenos_Aires');
    expect(zonaPorTelefono('+541155551234')).toBe('America/Argentina/Buenos_Aires');
  });
  it('+34 es Madrid', () => {
    expect(zonaPorTelefono('+34612345678')).toBe('Europe/Madrid');
  });
  it('sin el + también se reconoce', () => {
    expect(zonaPorTelefono('34612345678')).toBe('Europe/Madrid');
  });
  it('cualquier otro prefijo: null (no se toca la zona)', () => {
    expect(zonaPorTelefono('+59899123456')).toBeNull();
    expect(zonaPorTelefono('+15551234567')).toBeNull();
    expect(zonaPorTelefono('')).toBeNull();
  });
});
