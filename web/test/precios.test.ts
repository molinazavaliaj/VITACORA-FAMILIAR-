import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { obtenerPrecio } from '@/lib/precios';
import { calcularCompra, catalogo } from '@/lib/productos';

const ENV_ORIGINAL = { ...process.env };

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

// Producción, 2026-09-21: bajando /comprar, el payload del servidor traía
// {"moneda":"EUR","pdf":{...,"precio":"$NaN"},"extras":[]} en las DOS regiones.
// `Number('"49"')` y `Number('49,00')` dan NaN y el PDF, que es obligatorio,
// tumbaba el checkout entero. Un typo en Vercel no puede romper la tienda.
describe('un precio mal escrito en el entorno no rompe la tienda ($NaN)', () => {
  // Valores reales de un texto pegado en Vercel con comillas, con coma decimal,
  // con símbolo, vacío de sentido, cero, negativo o infinito.
  const BASURA = ['"49"', '49,00', '49 €', 'gratis', '0', '-5', 'Infinity'];

  beforeEach(() => {
    for (const clave of ['PRECIO_EUR', 'PRECIO_ARS', 'PRECIO_AUDIOLIBRO_EUR', 'PRECIO_IMPRESO_COLOR_EUR', 'PRECIO_MARCO_EUR']) {
      delete process.env[clave];
    }
  });

  afterEach(() => {
    process.env = { ...ENV_ORIGINAL };
  });

  it.each(BASURA)('PRECIO_EUR=%s vale el default de la casa, nunca NaN', (crudo) => {
    process.env.PRECIO_EUR = crudo;
    expect(obtenerPrecio('ES')).toEqual({ monto: 49, moneda: 'EUR' });
  });

  it.each(BASURA)('PRECIO_ARS=%s vale el default de la casa, nunca NaN', (crudo) => {
    process.env.PRECIO_ARS = crudo;
    expect(obtenerPrecio('AR')).toEqual({ monto: 49999, moneda: 'ARS' });
  });

  it('los precios válidos se siguen leyendo tal cual (no se tapa un precio bien puesto)', () => {
    process.env.PRECIO_EUR = '39';
    expect(obtenerPrecio('ES')).toEqual({ monto: 39, moneda: 'EUR' });
    process.env.PRECIO_EUR = '19.99';
    expect(obtenerPrecio('ES')).toEqual({ monto: 19.99, moneda: 'EUR' });
    process.env.PRECIO_ARS = '85750';
    expect(obtenerPrecio('AR')).toEqual({ monto: 85750, moneda: 'ARS' });
  });

  it.each(BASURA)('el catálogo sigue ofreciendo el PDF con precio finito (%s)', (crudo) => {
    process.env.PRECIO_EUR = crudo;
    process.env.PRECIO_ARS = crudo;
    const es = catalogo('ES');
    const ar = catalogo('AR');
    expect(Number.isFinite(es.pdf.precio)).toBe(true);
    expect(es.pdf.precio).toBe(49);
    expect(Number.isFinite(ar.pdf.precio)).toBe(true);
    expect(ar.pdf.precio).toBe(49999);
  });

  it.each(BASURA)('el total del carrito nunca es NaN (%s)', (crudo) => {
    process.env.PRECIO_EUR = crudo;
    process.env.PRECIO_AUDIOLIBRO_EUR = '35';
    process.env.PRECIO_IMPRESO_COLOR_EUR = '46';
    process.env.PRECIO_MARCO_EUR = '20';
    const compra = calcularCompra('ES', { pdf: true, audiolibro: 'clonada', impreso: 'color', marcos: 2 });
    expect(Number.isFinite(compra.total)).toBe(true);
    expect(compra.total).toBe(49 + 35 + 46 + 2 * 20);
  });

  it('un precio mal cargado deja rastro en los logs: no pasa en silencio', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.PRECIO_EUR = '"49"';
    obtenerPrecio('ES');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('PRECIO_EUR');
    warn.mockRestore();
  });
});

