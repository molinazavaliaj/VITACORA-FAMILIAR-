import { describe, it, expect } from 'vitest';
import { elegirNarrador } from '../src/flujo/elegir-narrador.js';

const n = (id: string, estado: string, created_at: string) => ({ id, estado, created_at });

describe('elegirNarrador: a quién va el mensaje de un número con varios narradores', () => {
  it('sin narradores, ninguno', () => {
    expect(elegirNarrador([])).toBeNull();
  });
  it('uno solo, ese, esté como esté', () => {
    expect(elegirNarrador([n('a', 'completado', '2026-09-01')])?.id).toBe('a');
    expect(elegirNarrador([n('a', 'pendiente_pago', '2026-09-01')])?.id).toBe('a');
  });
  it('el que está en curso gana al terminado, aunque el terminado sea más nuevo', () => {
    expect(elegirNarrador([n('viejo', 'activo', '2026-09-01'), n('nuevo', 'completado', '2026-11-01')])?.id).toBe('viejo');
  });
  it('invitado, activo y pausado cuentan como en curso', () => {
    for (const estado of ['invitado', 'acepto', 'activo', 'pausado']) {
      expect(elegirNarrador([n('fin', 'completado', '2026-09-01'), n('sigue', estado, '2026-08-01')])?.id).toBe('sigue');
    }
  });
  it('todos terminados: el más nuevo', () => {
    expect(elegirNarrador([n('a', 'completado', '2026-09-01'), n('b', 'cerrado_anticipado', '2026-10-01')])?.id).toBe('b');
  });
  it('una compra sin pagar no le gana al libro terminado (no tiene entrevista a la que contestar)', () => {
    expect(elegirNarrador([n('pago', 'pendiente_pago', '2026-11-01'), n('fin', 'completado', '2026-09-01')])?.id).toBe('fin');
  });
});
