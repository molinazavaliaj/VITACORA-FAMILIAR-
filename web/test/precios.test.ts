// Fuente del precio por región. Producción, 2026-09-21: el carrito llegó a
// servir `"precio":"$NaN"` en las DOS regiones porque `obtenerPrecio` hacía
// `Number(PRECIO_EUR)` sin validar y el valor estaba mal pegado en Vercel
// (`Number('"49"')` y `Number('49,00')` dan NaN). El PDF es el producto
// obligatorio: un NaN ahí tumbaba el checkout entero.
//
// Estos tests son la red que hace imposible que vuelva a pasar en silencio:
// para CADA precio del entorno (PDF, viaje y los tres extras, en las dos
// regiones) un valor inválido no puede llegar al cliente como precio.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { obtenerPrecio, obtenerPrecioViaje } from '@/lib/precios';
import { calcularCompra, catalogo, CARRITO_VACIO } from '@/lib/productos';

const ENV_ORIGINAL = { ...process.env };

// El precio de la casa, COPADO DEL DOCUMENTO (decisión de los socios del
// 12/09: docs/GASTOS.md, la tabla de verdad, y docs/panel-usuario.md §15.1),
// no leído del código: es la fuente independiente contra la que se controla
// que el default del código no se quede corto.
const PRECIO_CASA = { ES: 49, AR: 85750 } as const;

/**
 * Lo que deja un valor mal cargado en Vercel: comillas al pegar el valor,
 * separador de miles con coma, coma decimal, símbolo, texto suelto, cero,
 * negativo e infinito. Ninguno de estos es un precio.
 */
const BASURA = ['"49"', '85,750', '49,00', '49 €', 'gratis', '0', '-5', 'Infinity'];

/** Las doce variables de precio que lee el código (catálogo base + upsells, 21/09; las de BN/COLOR y AUDIOLIBRO ya no se usan). */
const CLAVES = [
  'PRECIO_EUR',
  'PRECIO_ARS',
  'PRECIO_VIAJE_EUR',
  'PRECIO_VIAJE_ARS',
  'PRECIO_IMPRESO_EUR',
  'PRECIO_IMPRESO_ARS',
  'PRECIO_COPIA_EUR',
  'PRECIO_COPIA_ARS',
  'PRECIO_MARCO_EUR',
  'PRECIO_MARCO_ARS',
  'PRECIO_MARCO_ADICIONAL_EUR',
  'PRECIO_MARCO_ADICIONAL_ARS',
];

beforeEach(() => {
  for (const clave of CLAVES) delete process.env[clave];
});

afterEach(() => {
  process.env = { ...ENV_ORIGINAL };
});

describe('obtenerPrecio — el PDF, el único precio obligatorio', () => {
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

  it('región AR sin PRECIO_ARS en el entorno usa el precio de la casa', () => {
    expect(obtenerPrecio('AR')).toEqual({ monto: PRECIO_CASA.AR, moneda: 'ARS' });
  });
});

// El default de AR era ARS 49.999 cuando el precio de la casa es ARS 85.750:
// si PRECIO_ARS se rompía, la tienda vendía el PDF al 58 % sin avisar. Un
// subprecio silencioso es peor que un error visible.
describe('el default de cada región no puede quedar por debajo del precio de la casa', () => {
  it('el default de AR es el precio de la casa (ARS 85.750) y ya no 49.999', () => {
    const { monto } = obtenerPrecio('AR');
    expect(monto).toBe(PRECIO_CASA.AR);
    expect(monto).toBeGreaterThanOrEqual(85750);
    expect(monto).not.toBe(49999);
  });

  it('el default de ES es el precio de la casa (49 €)', () => {
    expect(obtenerPrecio('ES').monto).toBe(PRECIO_CASA.ES);
  });

  it('con la variable vacía también vale el precio de la casa', () => {
    process.env.PRECIO_ARS = '';
    process.env.PRECIO_EUR = '';
    expect(obtenerPrecio('AR').monto).toBe(PRECIO_CASA.AR);
    expect(obtenerPrecio('ES').monto).toBe(PRECIO_CASA.ES);
  });
});

describe('un precio del PDF mal cargado no rompe la tienda ($NaN)', () => {
  it.each(BASURA)('PRECIO_EUR=%s vale el precio de la casa, nunca NaN', (crudo) => {
    process.env.PRECIO_EUR = crudo;
    const { monto, moneda } = obtenerPrecio('ES');
    expect(moneda).toBe('EUR');
    expect(Number.isFinite(monto)).toBe(true);
    expect(monto).toBeGreaterThan(0);
    expect(monto).toBe(PRECIO_CASA.ES);
  });

  it.each(BASURA)('PRECIO_ARS=%s vale el precio de la casa, nunca NaN', (crudo) => {
    process.env.PRECIO_ARS = crudo;
    const { monto, moneda } = obtenerPrecio('AR');
    expect(moneda).toBe('ARS');
    expect(Number.isFinite(monto)).toBe(true);
    expect(monto).toBe(PRECIO_CASA.AR);
  });

  it.each(BASURA)('con %s el catálogo de las dos regiones sigue ofreciendo el PDF con precio finito', (crudo) => {
    process.env.PRECIO_EUR = crudo;
    process.env.PRECIO_ARS = crudo;
    const es = catalogo('ES');
    const ar = catalogo('AR');
    expect(es.base.precio).toBe(PRECIO_CASA.ES);
    expect(ar.base.precio).toBe(PRECIO_CASA.AR);
    // Lo que ve el cliente: ni "$NaN" ni "$Infinity" en el payload de /comprar.
    expect(JSON.stringify({ es: es.base, ar: ar.base })).not.toMatch(/NaN|null|Infinity/);
  });

  it.each(BASURA)('con %s el total del carrito nunca es NaN', (crudo) => {
    process.env.PRECIO_EUR = crudo;
    process.env.PRECIO_IMPRESO_EUR = '46';
    process.env.PRECIO_MARCO_EUR = '20';
    process.env.PRECIO_MARCO_ADICIONAL_EUR = '15';
    const compra = calcularCompra('ES', { ...CARRITO_VACIO, impresos: 1, marcos: 2 });
    expect(Number.isFinite(compra.total)).toBe(true);
    expect(compra.total).toBe(PRECIO_CASA.ES + 46 + 20 + 15);
  });

  it('un precio válido se sigue leyendo tal cual (no se tapa un precio bien puesto)', () => {
    process.env.PRECIO_EUR = '39';
    expect(obtenerPrecio('ES')).toEqual({ monto: 39, moneda: 'EUR' });
    process.env.PRECIO_EUR = '19.99';
    expect(obtenerPrecio('ES')).toEqual({ monto: 19.99, moneda: 'EUR' });
    process.env.PRECIO_ARS = '85750';
    expect(obtenerPrecio('AR')).toEqual({ monto: 85750, moneda: 'ARS' });
    process.env.PRECIO_ARS = '85750.5';
    expect(obtenerPrecio('AR')).toEqual({ monto: 85750.5, moneda: 'ARS' });
  });

  it('un precio mal cargado deja rastro en los logs: no pasa en silencio', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.PRECIO_EUR = '"49"';
    obtenerPrecio('ES');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('PRECIO_EUR');
    warn.mockRestore();
  });

  it('una variable sin cargar NO ensucia los logs: no es un error, es el default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    obtenerPrecio('ES');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('la Vitácora de viaje: sin precio válido no existe para el cliente', () => {
  it.each(BASURA)('PRECIO_VIAJE_EUR=%s no habilita el viaje', (crudo) => {
    process.env.PRECIO_VIAJE_EUR = crudo;
    expect(obtenerPrecioViaje('ES')).toBeNull();
  });

  it.each(BASURA)('PRECIO_VIAJE_ARS=%s no habilita el viaje', (crudo) => {
    process.env.PRECIO_VIAJE_ARS = crudo;
    expect(obtenerPrecioViaje('AR')).toBeNull();
  });

  it.each(BASURA)('con %s el viaje no entra en ninguna línea ni ensucia el total', (crudo) => {
    process.env.PRECIO_VIAJE_ARS = crudo;
    const compra = calcularCompra('AR', { ...CARRITO_VACIO, base: 'viaje' });
    expect(compra.lineas.map((l) => l.id)).toEqual([]);
    expect(compra.total).toBe(0);
  });

  it('un precio de viaje válido se sigue leyendo', () => {
    process.env.PRECIO_VIAJE_EUR = '45';
    process.env.PRECIO_VIAJE_ARS = '78750';
    expect(obtenerPrecioViaje('ES')).toBe(45);
    expect(obtenerPrecioViaje('AR')).toBe(78750);
  });

  it('sin la variable cargada el viaje no existe (y no ensucia los logs)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(obtenerPrecioViaje('ES')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

// Los extras tienen la misma regla que el viaje, pero viven en productos.ts
// (`precioDeEntorno`): un extra inválido no se ofrece. Ese barrido está en
// productos.test.ts; acá se fija que el catálogo no los mezcle con el PDF.
describe('el catálogo separa el PDF (siempre con precio) de los extras (solo con precio válido)', () => {
  it.each(BASURA)('con %s en los tres extras, el PDF se sigue vendiendo y los extras no aparecen', (crudo) => {
    process.env.PRECIO_ARS = crudo;
    process.env.PRECIO_IMPRESO_ARS = crudo;
    process.env.PRECIO_MARCO_ARS = crudo;
    const cat = catalogo('AR');
    expect(cat.base.precio).toBe(PRECIO_CASA.AR);
    expect(cat.impreso).toBeNull();
    expect(cat.marco).toBeNull();
    expect(calcularCompra('AR', { ...CARRITO_VACIO, impresos: 1, marcos: 3 }).total).toBe(PRECIO_CASA.AR);
  });

  it('con precios válidos en las doce variables cada uno llega a su producto (control)', () => {
    process.env.PRECIO_EUR = '49';
    process.env.PRECIO_ARS = '85750';
    process.env.PRECIO_VIAJE_EUR = '45';
    process.env.PRECIO_VIAJE_ARS = '78750';
    process.env.PRECIO_IMPRESO_EUR = '49';
    process.env.PRECIO_IMPRESO_ARS = '85750';
    process.env.PRECIO_COPIA_EUR = '40';
    process.env.PRECIO_COPIA_ARS = '70000';
    process.env.PRECIO_MARCO_EUR = '20';
    process.env.PRECIO_MARCO_ARS = '35000';
    process.env.PRECIO_MARCO_ADICIONAL_EUR = '15';
    process.env.PRECIO_MARCO_ADICIONAL_ARS = '26250';

    expect(obtenerPrecio('ES').monto).toBe(49);
    expect(obtenerPrecio('AR').monto).toBe(85750);
    expect(obtenerPrecioViaje('ES')).toBe(45);
    expect(obtenerPrecioViaje('AR')).toBe(78750);
    expect(catalogo('ES').impreso).toEqual({ precio: 49, precioCopia: 40 });
    expect(catalogo('ES').marco).toEqual({ precio: 20, precioAdicional: 15 });
    expect(catalogo('AR').impreso).toEqual({ precio: 85750, precioCopia: 70000 });
    expect(catalogo('AR').marco).toEqual({ precio: 35000, precioAdicional: 26250 });
  });
});

// La trampa conocida, escrita para que no vuelva a sorprender a nadie: el
// separador de miles con PUNTO da un número válido, así que NINGUNA validación
// puede cazarlo. `Number('85.750')` es 85,75 — alguien carga el precio y la
// tienda vende a la milésima parte, sin un solo error en los logs.
// El único remedio es la instrucción: en Vercel los precios van SIN separadores
// (85.750 se carga 85750).
describe('límite declarado: el separador de miles con punto no se puede validar', () => {
  it('PRECIO_ARS=85.750 pasa como precio válido y vale 85,75 (queda escrito, no se tapa)', () => {
    process.env.PRECIO_ARS = '85.750';
    expect(obtenerPrecio('AR')).toEqual({ monto: 85.75, moneda: 'ARS' });
  });

  it('el separador con COMA sí se caza: no es un número', () => {
    process.env.PRECIO_ARS = '85,750';
    expect(obtenerPrecio('AR').monto).toBe(PRECIO_CASA.AR);
  });
});
