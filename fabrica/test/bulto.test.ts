import { describe, it, expect, beforeEach } from 'vitest';
import { calcularBulto, MEDIDAS_POR_DEFECTO } from '../src/envio/bulto.js';

// Cuánto pesa y cuánto mide lo que viaja (3t.26 fase 2). Lo pide cualquier
// agregador de correos para cotizar y para emitir la etiqueta, y con el envío
// incluido en el precio, equivocarse acá se come margen de verdad.
//
// Las medidas son de config, no de base (spec 21/09): se corrigen con una variable
// cuando la imprenta diga las de verdad, sin tocar código ni migrar nada.

beforeEach(() => {
  for (const clave of ['PESO_LIBRO_G', 'PESO_MARCO_G', 'PESO_CAJA_G', 'MEDIDAS_LIBRO_CM', 'MEDIDAS_MARCO_CM']) {
    delete process.env[clave];
  }
});

describe('calcularBulto', () => {
  it('un libro solo: su peso más la caja', () => {
    const bulto = calcularBulto({ copias: 1, marcos: 0 });
    expect(bulto.pesoG).toBe(MEDIDAS_POR_DEFECTO.libroG + MEDIDAS_POR_DEFECTO.cajaG);
  });

  it('dos copias pesan dos libros, no uno', () => {
    const una = calcularBulto({ copias: 1, marcos: 0 });
    const dos = calcularBulto({ copias: 2, marcos: 0 });
    expect(dos.pesoG - una.pesoG).toBe(MEDIDAS_POR_DEFECTO.libroG);
  });

  it('los marcos suman su peso: viajan en la misma caja que el libro', () => {
    const sin = calcularBulto({ copias: 1, marcos: 0 });
    const con = calcularBulto({ copias: 1, marcos: 2 });
    expect(con.pesoG - sin.pesoG).toBe(MEDIDAS_POR_DEFECTO.marcoG * 2);
  });

  it('la caja se cuenta una sola vez, no una por producto', () => {
    const bulto = calcularBulto({ copias: 3, marcos: 3 });
    const contenido = MEDIDAS_POR_DEFECTO.libroG * 3 + MEDIDAS_POR_DEFECTO.marcoG * 3;
    expect(bulto.pesoG).toBe(contenido + MEDIDAS_POR_DEFECTO.cajaG);
  });

  it('las dimensiones salen en el formato que pide el agregador: largo x ancho x alto en cm', () => {
    const bulto = calcularBulto({ copias: 1, marcos: 0 });
    expect(bulto.dimensiones).toMatch(/^\d+x\d+x\d+$/);
  });

  it('apilar libros sube el alto, no el largo ni el ancho', () => {
    const uno = calcularBulto({ copias: 1, marcos: 0 }).dimensiones.split('x').map(Number);
    const tres = calcularBulto({ copias: 3, marcos: 0 }).dimensiones.split('x').map(Number);
    expect(tres[0]).toBe(uno[0]);
    expect(tres[1]).toBe(uno[1]);
    expect(tres[2]).toBeGreaterThan(uno[2]);
  });

  it('un pedido sin nada físico no arma bulto: no hay nada que mandar', () => {
    expect(calcularBulto({ copias: 0, marcos: 0 })).toBeNull();
  });

  it('las medidas se corrigen por variable de entorno, sin tocar código', () => {
    process.env.PESO_LIBRO_G = '850';
    process.env.PESO_CAJA_G = '100';
    expect(calcularBulto({ copias: 1, marcos: 0 })!.pesoG).toBe(950);
  });

  it('una variable ilegible no rompe el envío: vale el valor de la casa y avisa', () => {
    process.env.PESO_LIBRO_G = 'seiscientos';
    expect(calcularBulto({ copias: 1, marcos: 0 })!.pesoG).toBe(
      MEDIDAS_POR_DEFECTO.libroG + MEDIDAS_POR_DEFECTO.cajaG
    );
  });

  it('los valores de la casa están declarados como estimados hasta que la imprenta los confirme', () => {
    // Si alguien los cambia, que sea a propósito: este test los fija.
    expect(MEDIDAS_POR_DEFECTO.libroG).toBe(600);
    expect(MEDIDAS_POR_DEFECTO.marcoG).toBe(400);
    expect(MEDIDAS_POR_DEFECTO.cajaG).toBe(150);
    expect(MEDIDAS_POR_DEFECTO.estimado).toBe(true);
  });
});
