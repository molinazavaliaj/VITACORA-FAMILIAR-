// fabrica/test/escritor/lectura.test.ts
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as Lc from '../../src/escritor/lectura.js';
import * as L from '../../scripts/escritor-v55/lib.mjs';
import { aDisco, carpetaNelida } from './ayuda.js';

describe('lectura.ts lee lo mismo que lib.mjs', () => {
  const c = carpetaNelida();
  c.escribir('entradas/confirmado.xml', '- La Negra se llamaba Ofelia.');
  c.escribir('pendientes/cap_2.json', '["R09"]');
  c.escribir('controles/afuera-cap_1.json', JSON.stringify({ noEntra: ['R07'] }));
  const dir = aDisco(c);

  it('respuestas, ficha (con confirmado), nombre e idioma', () => {
    expect(Lc.respuestas(c)).toEqual(L.respuestas(dir));
    expect(Lc.ficha(c)).toBe(L.ficha(dir));
    expect(Lc.nombreDePila(c)).toBe(L.nombreDePila(dir));
    expect(Lc.idioma(c)).toBe(L.idioma(dir));
  });

  it('piezas en el orden del libro, con su archivo', () => {
    const ts = Lc.piezas(c);
    const mjs = L.piezas(dir);
    expect(ts.map((p) => [p.pieza, p.texto])).toEqual(mjs.map((p: { pieza: string; texto: string }) => [p.pieza, p.texto]));
    expect(ts.map((p) => p.archivo)).toEqual(mjs.map((p: { archivo: string }) => path.relative(dir, p.archivo).replace(/\\/g, '/')));
  });

  it('idsDeCapitulo (con pendientes) y noEntran', () => {
    expect([...Lc.idsDeCapitulo(c, 2)].sort()).toEqual([...L.idsDeCapitulo(dir, 2)].sort());
    expect([...Lc.noEntran(c)]).toEqual([...L.noEntran(dir)]);
  });
});
