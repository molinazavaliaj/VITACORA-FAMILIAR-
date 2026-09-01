import { describe, it, expect, beforeEach } from 'vitest';
import { obtenerPrecio } from '@/lib/precios';

beforeEach(() => {
  delete process.env.PRECIO_EUR;
  delete process.env.PRECIO_ARS;
});

describe('obtenerPrecio', () => {
  it('región ES lee PRECIO_EUR del entorno y devuelve moneda EUR', () => {
    process.env.PRECIO_EUR = '39';
    expect(obtenerPrecio('ES')).toEqual({ monto: 39, moneda: 'EUR' });
  });

  it('región ES sin PRECIO_EUR en el entorno usa 49 como default', () => {
    expect(obtenerPrecio('ES')).toEqual({ monto: 49, moneda: 'EUR' });
  });

  it('región AR lee PRECIO_ARS del entorno y devuelve moneda ARS', () => {
    process.env.PRECIO_ARS = '59999';
    expect(obtenerPrecio('AR')).toEqual({ monto: 59999, moneda: 'ARS' });
  });

  it('región AR sin PRECIO_ARS en el entorno usa 49999 como default', () => {
    expect(obtenerPrecio('AR')).toEqual({ monto: 49999, moneda: 'ARS' });
  });
});
