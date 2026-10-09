// La Carpeta en memoria y las funciones puras de lib.mjs, portadas: dan lo mismo que el original.
import { describe, expect, it, test } from 'vitest';
import assert from 'node:assert/strict';
import { Carpeta, leerJSON } from '../../src/escritor/carpeta.js';
import * as T from '../../src/escritor/texto.js';
// @ts-expect-error lib.mjs es JavaScript sin tipos
import * as L from '../../scripts/escritor-v55/lib.mjs';

describe('Carpeta', () => {
  it('lee, escribe, lista solo lo directo y ordenado, y normaliza \r\n al leer', () => {
    const c = new Carpeta({ 'salidas/b.md': 'b\r\nx', 'salidas/a.md': 'a', 'salidas/sub/c.md': 'c' });
    expect(c.leer('salidas/b.md')).toBe('b\nx');
    expect(c.listar('salidas')).toEqual(['a.md', 'b.md']);
    expect(c.existe('salidas/sub/c.md')).toBe(true);
    expect(c.existeCarpeta('salidas/sub')).toBe(true);
    expect(c.existeCarpeta('arreglos')).toBe(false);
    expect(() => c.leer('nada.md')).toThrow(/no existe nada.md/);
    c.copiar('salidas/a.md', 'sin-revision/a.md');
    expect(c.clonar().aObjeto()['sin-revision/a.md']).toBe('a');
    c.borrar('salidas/a.md');
    expect(c.existe('salidas/a.md')).toBe(false);
  });

  it('leerJSON tolera BOM y ```json, como lib.mjs', () => {
    const c = new Carpeta({ 'x.json': '﻿```json\n{"a": 1}\n```' });
    expect(leerJSON(c, 'x.json')).toEqual({ a: 1 });
  });
});

describe('texto.ts da lo mismo que lib.mjs', () => {
  const frases = ['Col·legi de l’Avià', 'Sumá VOS… ¡ya!', 'Nélida, la mercera [[R01, R02]]', 'Texto [[FICHA]] y [[R7]] fin'];
  it('norm, palabras, sinMarcas, marcas', () => {
    for (const s of frases) {
      expect(T.norm(s)).toBe(L.norm(s));
      expect(T.palabras(s)).toEqual(L.palabras(s));
      expect(T.sinMarcas(s)).toBe(L.sinMarcas(s));
      expect(T.marcas(s)).toEqual(L.marcas(s));
    }
  });

  it('idioma, títulos fijos y título del Paso 3t', () => {
    for (const f of ['Idioma del libro: catalán', 'Idioma: ca', 'Nombre: Nélida']) expect(T.idiomaDeFicha(f)).toBe(L.idiomaDeFicha(f));
    expect(T.titulosFijos('ca')).toEqual(L.titulosFijos('ca'));
    expect(T.titulosFijos('es')).toEqual(L.titulosFijos('es'));
    const cap = 'En el 78 abrimos la mercería en la calle Mendoza, y su persiana de madera se trababa.';
    for (const t of ['La persiana de madera', 'Años de lucha', '', 'La mercería de la calle Mendoza']) expect(T.tituloValido(t, cap)).toBe(L.tituloValido(t, cap));
    const capPlan = { n: 2, etapa: 'Sola', anios: { desde: '2014', hasta: '', seguros: true } };
    expect(T.tituloImpreso(capPlan)).toBe(L.tituloImpreso(capPlan));
    expect(T.archivoDe('cap_3')).toBe(L.archivoDe('cap_3'));
    expect(T.archivoDe('carta')).toBe(L.archivoDe('carta'));
  });

  it('armarCambios, separarAfuera y destinosAfuera', () => {
    const texto = 'Raúl tenía la mercería. [[R02]]\n\nLa Negra venía a la tarde. [[R10]]';
    const cambios = [
      { problema: 1, resultado: 'cambiado', antes: 'Raúl tenía la mercería.', despues: 'Raúl y yo teníamos la mercería.' },
      { problema: [2, 3], resultado: 'cambiado', antes: 'no está', despues: 'x' },
      { problema: 4, resultado: 'disputa', antes: '', despues: '' },
    ];
    expect(T.armarCambios(texto, cambios)).toEqual(L.armarCambios(texto, cambios));
    const crudo = 'Capítulo. [[R01]]\n---\n{"afuera": [{"id": "R03", "a_donde": "cap_2"}, {"id": "R04", "a_donde": "no_entra"}, {"id": "R05", "a_donde": "linea"}]}';
    expect(T.separarAfuera(crudo)).toEqual(L.separarAfuera(crudo));
    const af = T.separarAfuera(crudo).afuera;
    expect(T.destinosAfuera(af, 1)).toEqual(L.destinosAfuera(af, 1));
  });

  it('planConR y piezaDeR', () => {
    const reg = { episodios: [{ id: 'E01', ids: ['R01'] }, { id: 'E02', ids: ['R02', 'R03'] }, { id: 'E09', ids: ['R09'] }] };
    const plan = { capitulos: [{ n: 1, piezas: [{ episodio: 'E01' }] }, { n: 2, piezas: [{ episodio: 'E02' }] }], carta: { ids: ['E09'] }, antes_de_cerrar: { ids: [] }, sus_frases: [{ id: 'E02', texto: 'x' }], primera_pagina: { que_dice_de_si_ids: ['R01'] } };
    expect(T.planConR(plan, reg)).toEqual(L.planConR(plan, reg));
    const ps = [{ pieza: 'cap_2', texto: 'algo [[R01]]' }];
    for (const r of ['R01', 'R02', 'R09', 'R77']) {
      expect(T.piezaDeR(T.planConR(plan, reg), reg, r)).toBe(L.piezaDeR(L.planConR(plan, reg), reg, r));
      expect(T.piezaDeR(T.planConR(plan, reg), reg, r, ps)).toBe(L.piezaDeR(L.planConR(plan, reg), reg, r, ps));
    }
  });
});

// Copiados de scripts/escritor-v55/v54.test.mjs y v55.test.mjs (sin cambiar datos ni aserciones).
const cap = 'En el 78 abrimos la mercería en la calle Mendoza, y su persiana de madera se trababa siempre en el mismo lugar. Raúl me dijo que sumara yo.';

test('v5.4: el idioma sale de la ficha; sin dato, castellano', () => {
  assert.equal(T.idiomaDeFicha('<ficha>\nNombre: Neus\nIdioma del libro: catalán\n</ficha>'), 'ca');
  assert.equal(T.idiomaDeFicha('<ficha>\nIdioma del libro: català\n</ficha>'), 'ca');
  assert.equal(T.idiomaDeFicha('<ficha>\nIdioma: Catalan\n</ficha>'), 'ca');
  assert.equal(T.idiomaDeFicha('<ficha>\nNombre: Nélida\n</ficha>'), 'es');
  assert.equal(T.idiomaDeFicha('<ficha>\nIdioma del libro: castellano\n</ficha>'), 'es');
});

test('v5.4: títulos fijos del libro según el idioma', () => {
  assert.deepEqual(T.titulosFijos('ca'), { antes: 'Abans de tancar', frases: 'Les seves frases', carta: 'Per als meus' });
  assert.deepEqual(T.titulosFijos('es'), { antes: 'Antes de cerrar', frases: 'Sus frases', carta: 'Para los míos' });
});

test('v5.4: la ela geminada no parte la palabra', () => {
  assert.deepEqual(T.palabras('Vaig anar al col·legi'), ['vaig', 'anar', 'al', 'collegi']);
});

test('Paso 3t (v5.5): el título usa palabras del capítulo', () => {
  assert.equal(T.tituloValido('La persiana de madera', cap), true);
  assert.equal(T.tituloValido('La mercería de la calle Mendoza', cap), true);
  assert.equal(T.tituloValido('Años de lucha', cap), false);
  assert.equal(T.tituloValido('', cap), false);
  assert.equal(T.tituloValido('Una persiana que no se abría nunca más en la vida de nadie', cap), false); // más de 7 palabras
});

describe('tituloValido (07/10)', () => {
  it('una palabra de 4 letras acepta otra conjugación del capítulo', () => {
    const cap = 'Cuando me veía caído, Iñaki se sacaba la comida de la boca para dármela.';
    expect(T.tituloValido('Se saca la comida de la boca', cap)).toBe(true);
    expect(T.tituloValido('Se pone la ropa de la boca', cap)).toBe(false);
  });
});

