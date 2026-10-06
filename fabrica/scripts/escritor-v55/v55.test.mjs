// Tests de la v5.5 del escritor (docs/v5/escritor-v55/receta.md). Datos inventados: Nélida, la mercera de la guía.
// Correr: node --test fabrica/scripts/escritor-v55/
import test from 'node:test';
import assert from 'node:assert/strict';
import { tituloValido } from './lib.mjs';
import { c17 } from './controles.mjs';
import { barandaEstilo } from './estilo.mjs';

const cap = 'En el 78 abrimos la mercería en la calle Mendoza, y su persiana de madera se trababa siempre en el mismo lugar. Raúl me dijo que sumara yo.';

test('Paso 3t (v5.5): el título usa palabras del capítulo', () => {
  assert.equal(tituloValido('La persiana de madera', cap), true);
  assert.equal(tituloValido('La mercería de la calle Mendoza', cap), true);
  assert.equal(tituloValido('Años de lucha', cap), false);
  assert.equal(tituloValido('', cap), false);
  assert.equal(tituloValido('Una persiana que no se abría nunca más en la vida de nadie', cap), false); // más de 7 palabras
});

test('C17 (v5.5): solo marca una presentación completa, no cada "mi hermano X"', () => {
  const ps = [
    { pieza: 'cap_1', texto: 'Mi hermano Gustavo, el mayor, me cuidaba siempre.' },
    { pieza: 'cap_2', texto: 'Ahí viví con mi hermano Gustavo las mejores tardes de mi vida.' },
    { pieza: 'cap_3', texto: 'Mi hermano Gustavo, el mayor de los tres, tiene hoy sesenta años.' },
  ];
  const xs = c17(ps);
  assert.equal(xs.length, 1);
  assert.equal(xs[0].pieza, 'cap_3');
});

test('Paso 7 (v5.5): la baranda deja variar una fórmula repetida si el número ya está en la pieza', () => {
  const t = 'Cuando yo tenía 14 o 15 años me echaron del colegio. [[R10]] Cuando yo tenía 14 o 15 años empecé a trabajar. [[R11]]';
  assert.equal(barandaEstilo({ antes: 'Cuando yo tenía 14 o 15 años empecé a trabajar. [[R11]]', despues: 'A esa edad empecé a trabajar. [[R11]]', por_que: 'repeticion' }, t), '');
  // si el número no está en otro lugar, se sigue frenando
  const u = 'Cuando yo tenía 14 o 15 años empecé a trabajar. [[R11]]';
  assert.match(barandaEstilo({ antes: 'Cuando yo tenía 14 o 15 años empecé a trabajar. [[R11]]', despues: 'A esa edad empecé a trabajar. [[R11]]', por_que: 'repeticion' }, u), /números/);
  // y fuera de "repeticion", también
  assert.match(barandaEstilo({ antes: 'Cuando yo tenía 14 o 15 años empecé a trabajar. [[R11]]', despues: 'A esa edad empecé a trabajar. [[R11]]', por_que: 'sintaxis' }, t), /números/);
});
