// Tests de la v5.3 del escritor (docs/v5/escritor-v53/receta.md). Datos inventados: Nélida, la mercera de la guía.
// Correr: node --test fabrica/scripts/escritor-v53/
import test from 'node:test';
import assert from 'node:assert/strict';
import { barandaEstilo, aplicarEstilo } from './estilo.mjs';
import { repite } from './controles.mjs';

const pieza = 'Cuando por fin conseguimos el local no había nada, y lo primero que puse fue el mostrador, porque siempre donde llego a un lugar lo primero que hago es el mostrador. [[R05]]\n\nRaúl abrió en el 78 con la plata del Renault. [[R22]]';

test('Paso 7 (v5.3): la baranda deja pasar un cambio de forma', () => {
  const c = { antes: 'porque siempre donde llego a un lugar lo primero que hago es el mostrador. [[R05]]', despues: 'porque cada vez que llego a un lugar nuevo lo primero que armo es el mostrador. [[R05]]', por_que: 'sintaxis' };
  assert.equal(barandaEstilo(c, pieza), '');
});

test('Paso 7 (v5.3): la baranda frena lo que toca hechos o marcas', () => {
  const b = (antes, despues) => barandaEstilo({ antes, despues, por_que: 'sintaxis' }, pieza);
  assert.match(b('Raúl abrió en el 78 con la plata del Renault. [[R22]]', 'Raúl abrió en el 79 con la plata del Renault. [[R22]]'), /números/);
  assert.match(b('Raúl abrió en el 78 con la plata del Renault. [[R22]]', 'Abrimos en el 78 con la plata del auto. [[R22]]'), /nombres/);
  assert.match(b('Raúl abrió en el 78 con la plata del Renault. [[R22]]', 'Raúl abrió en el 78 con la plata del Renault.'), /marcas/);
  assert.match(b('no está en la pieza', 'algo'), /no está tal cual/);
  assert.match(b('Raúl abrió en el 78 con la plata del Renault. [[R22]]', 'Raúl, 78, Renault. [[R22]]'), /largo/);
});

test('Paso 7 (v5.3): un nombre del registro que abre la oración tampoco se pierde', () => {
  assert.equal(barandaEstilo({ antes: 'Raúl abrió en el 78 con la plata del Renault. [[R22]]', despues: 'Abrí en el 78 con la plata del Renault, sola. [[R22]]' }, pieza), '');
  assert.match(barandaEstilo({ antes: 'Raúl abrió en el 78 con la plata del Renault. [[R22]]', despues: 'Abrí en el 78 con la plata del Renault, sola. [[R22]]' }, pieza, ['Raúl']), /Raul|raul/);
});

test('Paso 7 (v5.3): aplicarEstilo aplica lo que pasa y devuelve lo frenado', () => {
  const { texto, aplicados, frenados } = aplicarEstilo(pieza, [
    { antes: 'siempre donde llego a un lugar', despues: 'cada vez que llego a un lugar', por_que: 'sintaxis' },
    { antes: 'en el 78', despues: 'en el 80', por_que: 'palabra' },
  ]);
  assert.equal(aplicados.length, 1);
  assert.equal(frenados.length, 1);
  assert.ok(texto.includes('cada vez que llego a un lugar'));
  assert.ok(texto.includes('en el 78'));
});

test('C7 (v5.3): repite marca lo que una pieza comparte con las demás', () => {
  const ps = [
    { pieza: 'cap_1', texto: 'Mis hermanos son más grandes: Gustavo me lleva quince años y siempre me cuidaba. [[R01]]' },
    { pieza: 'primera_pagina', texto: 'Soy la de la mercería. Gustavo me lleva quince años y siempre me cuidaba. [[R01]]' },
  ];
  const xs = repite(ps, 'primera_pagina');
  assert.equal(xs.length, 1);
  assert.equal(xs[0].pieza, 'primera_pagina');
  assert.deepEqual(repite(ps.slice(0, 1).concat({ pieza: 'primera_pagina', texto: 'Soy la de la mercería de Echesortu. [[R02]]' }), 'primera_pagina'), []);
});

test('Paso 7 (v5.3.1): la baranda lee números en letras ("fútbol once" → "fútbol 11", "piso tres" → "tercer piso")', () => {
  const t = 'Volví al fútbol once en un club de acá. [[R07]] Vivo en un piso tres. [[R08]]';
  assert.equal(barandaEstilo({ antes: 'Volví al fútbol once en un club de acá. [[R07]]', despues: 'Volví a jugar al fútbol 11 en un club de acá. [[R07]]' }, t), '');
  assert.equal(barandaEstilo({ antes: 'Vivo en un piso tres. [[R08]]', despues: 'Vivo en un tercer piso. [[R08]]' }, t), '');
  assert.match(barandaEstilo({ antes: 'Vivo en un piso tres. [[R08]]', despues: 'Vivo en un cuarto piso. [[R08]]' }, t), /números/);
});
