// afuera.mjs, arreglos.mjs y estado.mjs, portados: mismos archivos y misma salida.
import assert from 'node:assert/strict';
import { describe, expect, it, test } from 'vitest';
import { Carpeta } from '../../src/escritor/carpeta.js';
import { controlarAfuera } from '../../src/escritor/controles/afuera.js';
import { aplicar, armar, juntar } from '../../src/escritor/controles/arreglos.js';
import { controlar } from '../../src/escritor/controles/correr.js';
import { estado } from '../../src/escritor/controles/estado.js';
import { aDisco, carpetaNelida, correrMjs, mismoArchivo } from './ayuda.js';

describe('afuera (C30)', () => {
  it('separa el JSON, manda a pendientes y avisa si dejó más de un tercio afuera', () => {
    const c = carpetaNelida();
    c.escribir('salidas/capitulo_01.md', `${c.leer('salidas/capitulo_01.md').trim()}\n---\n${JSON.stringify({ afuera: [{ id: 'R10', a_donde: 'cap_2', por_que: 'es de después' }, { id: 'R04', a_donde: 'linea' }, { id: 'R01', a_donde: 'no_entra' }] })}`);
    const dir = aDisco(c);
    const mjs = correrMjs('afuera.mjs', [dir, '1']);
    const ts = controlarAfuera(c, 1);
    expect(ts.codigo).toBe(mjs.codigo);
    expect(ts.codigo).toBe(3);
    expect(`${ts.resumen}\n`).toBe(mjs.salida);
    for (const r of ['salidas/capitulo_01.md', 'controles/afuera-cap_1.json', 'pendientes/cap_2.json']) mismoArchivo(c, dir, r);
  });
});

describe('arreglos: juntar (solo hechos), armar y aplicar', () => {
  function preparada(): Carpeta {
    const c = carpetaNelida();
    c.escribir('salidas/capitulo_02.md', c.leer('salidas/capitulo_02.md').replace(' [[R06]]', ''));
    controlar(c, 'piezas');
    c.escribir('salidas/hechos.json', JSON.stringify({ problemas: [{ pieza: 'cap_1', tipo: 'fecha', frase: 'Marcela nació en el 80', material: 'R04', ids: ['R04'], correccion: 'Marcela nació en el 80' }] }));
    c.escribir('salidas/veedor.json', JSON.stringify({ problemas: [{ pieza: 'carta', tipo: 'repetido', frase: 'La casa es de todos.', que: 'se repite' }] }));
    return c;
  }

  it('juntar con SOLO_HECHOS da los mismos problemas por pieza', () => {
    const c = preparada();
    const dir = aDisco(c);
    const mjs = correrMjs('arreglos.mjs', [dir, 'juntar'], { SOLO_HECHOS: '1' });
    expect(`${juntar(c, { soloHechos: true })}\n`).toBe(mjs.salida);
    for (const f of c.listar('arreglos')) mismoArchivo(c, dir, `arreglos/${f}`);
  });

  it('armar y aplicar dejan la misma respuesta y la misma pieza', () => {
    const c = preparada();
    juntar(c, { soloHechos: true });
    c.escribir('arreglos/cambios-cap_1.json', JSON.stringify({ cambios: [{ problema: 1, resultado: 'cambiado', antes: 'Marcela nació en el 80, y la nena', despues: 'Marcela nació en el 80. La nena' }, { problema: 2, resultado: 'cambiado', antes: 'no está tal cual', despues: 'x' }] }));
    const dir = aDisco(c);
    expect(`${armar(c, 'cap_1')}\n`).toBe(correrMjs('arreglos.mjs', [dir, 'armar', 'cap_1']).salida);
    mismoArchivo(c, dir, 'arreglos/respuesta-cap_1.txt');
    expect(`${aplicar(c, 'cap_1')}\n`).toBe(correrMjs('arreglos.mjs', [dir, 'aplicar', 'cap_1']).salida);
    mismoArchivo(c, dir, 'salidas/capitulo_01.md');
    expect(c.leer('salidas/capitulo_01.md')).toContain('Marcela nació en el 80. La nena');
  });
});

describe('estado', () => {
  it('da lo mismo que estado.mjs', () => {
    const c = carpetaNelida();
    c.escribir('arreglos/problemas-cap_1.json', '[{"n": 1}]');
    c.escribir('arreglos/problemas-sus_frases.json', '[{"n": 1}, {"n": 2}]');
    c.escribir('controles/c9-cap_1.json', JSON.stringify({ abiertos: [{ n: 1, estado: 'disputa', id: 'R03', cita: 'me dijo sumá vos', frase: 'Raúl dijo sumá vos' }, { n: 2, estado: 'sigue' }], identicos: 80 }));
    c.escribir('controles/repaso.json', JSON.stringify({ nuevos: [], oscila: [{ pieza: 'cap_1', n: 1, frase: 'f', ids: ['R02'], material: 'm' }], contradice: [] }));
    const dir = aDisco(c);
    for (const que of ['capitulos', 'arreglos', 'disputas', 'repaso'] as const) expect(estado(c, que), que).toEqual(JSON.parse(correrMjs('estado.mjs', [dir, que]).salida));
    expect(estado(c, 'capitulo-de', 'R06')).toEqual(JSON.parse(correrMjs('estado.mjs', [dir, 'capitulo-de', 'R06']).salida));
  });
});

// ---- test original de estado.test.mjs (el de `estado`) ----
function carpeta(): Carpeta {
  const c = new Carpeta();
  const w = (f: string, o: unknown) => c.escribir(f, typeof o === 'string' ? o : JSON.stringify(o));
  w('salidas/plan.json', { capitulos: [{ n: 1 }, { n: 2 }], antes_de_cerrar: { ids: ['R09'] }, faltantes: [{ que: 'la boda no tiene escena', donde: 'capítulo 2' }] });
  w('arreglos/problemas-cap_1.json', [{ n: 1, origen: 'verificador', tipo: 'presente', frase: 'Raúl tiene la mercería' }]);
  w('arreglos/problemas-sus_frases.json', [{ n: 1, origen: 'código C8', tipo: 'boton', frase: 'lo más difícil', que: 'palabras de la pregunta' }]);
  w('controles/c9-cap_1.json', { abiertos: [{ n: 1, estado: 'disputa', id: 'R02', cita: 'tiene la mercería', frase: 'Raúl tiene la mercería' }], identicos: 60 });
  w('controles/repaso.json', { nuevos: [], oscila: [{ pieza: 'cap_1', n: 1, tipo: 'presente', frase: 'Raúl tenía la mercería', ids: ['R02'], material: 'R02 tiene' }], contradice: [] });
  w('controles/piezas-1.json', [{ pieza: 'cap_1', control: 'C2', que: 'cortada', frase: 'y entonces…' }]);
  w('controles/piezas.json', [{ pieza: 'cap_1', control: 'C24', que: 'falta frase de R03: «la nena»', frase: '' }]);
  w('arreglos/disputa-cap_1-1.json', { respalda: false, por_que: 'R02 está en pasado' });
  return c;
}

test('estado: capítulos, piezas a arreglar (sin sus_frases) y disputas de C9 y C26', () => {
  const c = carpeta();
  assert.deepEqual(estado(c, 'capitulos'), { n: [1, 2], antes: true });
  assert.deepEqual(estado(c, 'arreglos'), { piezas: ['cap_1'], sus_frases: 1 });
  assert.deepEqual((estado(c, 'disputas') as { disputas: { clave: string; id: string }[] }).disputas.map((d) => [d.clave, d.id]), [['cap_1-1', 'R02']]);
  assert.deepEqual((estado(c, 'repaso') as { disputas: { clave: string; origen: string; id: string }[] }).disputas.map((d) => [d.clave, d.origen, d.id]), [['repaso-oscila-1', 'oscila', 'R02']]);
});
