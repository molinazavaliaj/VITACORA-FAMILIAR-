// Tests de la v5.4 del escritor: idioma del libro (catalán). Datos inventados (Nélida; en catalán, "la Neus").
// Correr: node --test fabrica/scripts/escritor-v54/
import test from 'node:test';
import assert from 'node:assert/strict';
import { idiomaDeFicha, titulosFijos, palabras } from './lib.mjs';
import { c31, c32 } from './controles.mjs';
import { barandaEstilo } from './estilo.mjs';

test('v5.4: el idioma sale de la ficha; sin dato, castellano', () => {
  assert.equal(idiomaDeFicha('<ficha>\nNombre: Neus\nIdioma del libro: catalán\n</ficha>'), 'ca');
  assert.equal(idiomaDeFicha('<ficha>\nIdioma del libro: català\n</ficha>'), 'ca');
  assert.equal(idiomaDeFicha('<ficha>\nIdioma: Catalan\n</ficha>'), 'ca');
  assert.equal(idiomaDeFicha('<ficha>\nNombre: Nélida\n</ficha>'), 'es');
  assert.equal(idiomaDeFicha('<ficha>\nIdioma del libro: castellano\n</ficha>'), 'es');
});

test('v5.4: títulos fijos del libro según el idioma', () => {
  assert.deepEqual(titulosFijos('ca'), { antes: 'Abans de tancar', frases: 'Les seves frases', carta: 'Per als meus' });
  assert.deepEqual(titulosFijos('es'), { antes: 'Antes de cerrar', frases: 'Sus frases', carta: 'Para los míos' });
});

test('v5.4: la ela geminada no parte la palabra', () => {
  assert.deepEqual(palabras('Vaig anar al col·legi'), ['vaig', 'anar', 'al', 'collegi']);
});

test('v5.4: C31 marca la oración que arranca con "I" (catalán)', () => {
  const xs = c31({ pieza: 'cap_1', texto: 'Vam obrir la merceria el 78 amb els diners del Renault. I la gent venia cada matí a comprar botons i fil.' });
  assert.equal(xs.filter((x) => x.que.includes('"Y"')).length, 1);
});

test('v5.4: C32 encuentra los "no" de la entrevista en catalán', () => {
  const t = "De la salut, passo. Vaig obrir la merceria el 78. No tinc cap foto d'aquell aparador. Cap mestre em va marcar a l'escola. Aquesta és la meva vida i no hi ha gaire més a explicar. De l'escola no me'n recordo gaire.";
  assert.equal(c32({ pieza: 'cap_1', texto: t }).length, 5);
  assert.deepEqual(c32({ pieza: 'cap_1', texto: "No vaig voler tancar la botiga: l'hi havia promès. Vaig fer un pas enrere i vaig mirar l'aparador." }), []);
});

test('v5.4: la baranda del corrector lee números en letras en catalán', () => {
  const t = 'Visc en un pis tres de Berga. [[R08]] Vaig tornar al futbol onze. [[R07]]';
  assert.equal(barandaEstilo({ antes: 'Visc en un pis tres de Berga. [[R08]]', despues: 'Visc en un tercer pis a Berga. [[R08]]' }, t), '');
  assert.equal(barandaEstilo({ antes: 'Vaig tornar al futbol onze. [[R07]]', despues: 'Vaig tornar a jugar a futbol 11. [[R07]]' }, t), '');
  assert.match(barandaEstilo({ antes: 'Visc en un pis tres de Berga. [[R08]]', despues: 'Visc en un quart pis a Berga. [[R08]]' }, t), /números/);
});
