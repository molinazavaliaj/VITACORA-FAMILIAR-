// Tests de la v5.2 del escritor (docs/v5/escritor-v52/receta.md). Datos inventados: Nélida, la mercera de la guía.
// Correr: node --test fabrica/scripts/escritor-v52/
import test from 'node:test';
import assert from 'node:assert/strict';
import { c18, c31, c32, c33, c33Texto } from './controles.mjs';
import { destinosAfuera } from './lib.mjs';

test('C31 (v5.2): oraciones de más de 40 palabras', () => {
  const larga = 'Cuando Raúl se enfermó, entre la mercería a la mañana, los remedios, el Centenario, la Negra que me cubría a la siesta, los turnos, las cuentas y Marcela que venía cuando podía, mi día quedó partido en dos y así seguimos, sin parar, hasta agosto del 96, cuando se murió.';
  const xs = c31({ pieza: 'cap_1', texto: `${larga} [[R40]]` });
  assert.equal(xs.filter((x) => x.tipo === 'larga').length, 1);
  // 30 palabras: punto medio, no se marca
  assert.deepEqual(c31({ pieza: 'cap_1', texto: 'Yo estaba con él. Me pidió que no cerrara el negocio, el mismo por el que una noche, años antes, me había puesto la calculadora en la mesa de la cocina para que sumara yo.' }), []);
});

test('C32 (v5.2): los "no" de la entrevista que quedaron en el libro', () => {
  const t = 'De la salud, paso. Abrí la mercería en el 78. No tengo foto de esa vidriera. Ningún maestro me marcó en la escuela. Esa es mi vida y no hay mucho más que contar. Del colegio no me acuerdo casi nada.';
  const xs = c32({ pieza: 'cap_1', texto: t });
  assert.equal(xs.length, 5);
  assert.ok(xs.every((x) => x.control === 'C32' && x.tipo === 'no_entra'));
  // lo que cuenta, aunque tenga un "no", no se marca
  assert.deepEqual(c32({ pieza: 'cap_1', texto: 'No quise cerrar el negocio: se lo había prometido. Di un paso atrás y miré la vidriera. El paso a nivel quedaba en la esquina.' }), []);
  // las citas en bloque (Sus frases) no se miran acá
  assert.deepEqual(c32({ pieza: 'cap_1', texto: '> no me acuerdo' }), []);
});

const reg = () => ({ episodios: [
  { id: 'E01', ids: ['R01'] }, { id: 'E02', ids: ['R02', 'R03'] }, { id: 'E03', ids: ['R04'] }, { id: 'E04', ids: ['R05'] }, { id: 'E05', ids: ['R06'] },
] });
const plan = (golpe2) => ({ capitulos: [
  { n: 1, piezas: [{ episodio: 'E01', peso: 'normal' }, { episodio: 'E02', peso: 'clave' }], golpe: { episodio: '', preparacion: [], frase_id: '' } },
  { n: 2, piezas: [{ episodio: 'E03', peso: 'normal' }, { episodio: 'E04', peso: 'clave' }], golpe: golpe2 },
  { n: 3, piezas: [{ episodio: 'E05', peso: 'normal' }] },
] });

test('C33 (v5.2): el golpe, su preparación y su frase en el mismo capítulo (plan)', () => {
  assert.deepEqual(c33(plan({ episodio: 'E04', preparacion: ['E03', 'E01'], frase_id: 'R05' }), reg()), []);
  // preparación en un capítulo POSTERIOR: error
  assert.equal(c33(plan({ episodio: 'E04', preparacion: ['E05'], frase_id: 'R05' }), reg()).length, 1);
  // preparación de esta etapa DESPUÉS del golpe: error
  const p = plan({ episodio: 'E04', preparacion: ['E03'], frase_id: 'R05' });
  p.capitulos[1].piezas.reverse();
  assert.equal(c33(p, reg()).length, 1);
  // frase de otro capítulo: error
  assert.equal(c33(plan({ episodio: 'E04', preparacion: [], frase_id: 'R02' }), reg()).length, 1);
  // golpe que no es pieza clave del capítulo: error
  assert.equal(c33(plan({ episodio: 'E03', preparacion: [], frase_id: 'R04' }), reg()).length, 1);
  // sin golpe: nada que mirar
  assert.deepEqual(c33(plan({ episodio: '', preparacion: [], frase_id: '' }), reg()), []);
});

test('C33 (v5.2): en el texto, el capítulo del golpe marca su frase y su preparación', () => {
  const p = plan({ episodio: 'E04', preparacion: ['E03', 'E01'], frase_id: 'R05' });
  assert.deepEqual(c33Texto([{ pieza: 'cap_2', texto: 'Antes, la calculadora. [[R04]]\n\nDespués, el robo. [[R05,R01]]' }], p, reg()), []);
  const xs = c33Texto([{ pieza: 'cap_2', texto: 'El robo. [[R05]]' }], p, reg());
  // falta la preparación: E03 (R04, de esta etapa) y E01 (R01, de otra etapa: va como recuerdo, pero va)
  assert.equal(xs.length, 2);
  assert.match(xs[0].que, /R04/);
  assert.match(xs[1].que, /R01/);
  // sin la frase del golpe: falta
  assert.match(c33Texto([{ pieza: 'cap_2', texto: 'El robo. [[R04,R01]]' }], p, reg())[0].que, /R05/);
  // capítulo que no se escribió (prueba corta): no se mira
  assert.deepEqual(c33Texto([], p, reg()), []);
});

test('v5.2: "no_entra" en afuera no va al arreglo ni a otro capítulo, y C18 no lo pide', () => {
  assert.deepEqual(destinosAfuera([{ id: 'R43', a_donde: 'no_entra' }, { id: 'R40', a_donde: 'linea' }], 2), { pendientes: {}, alArreglo: ['R40'], noEntra: ['R43'] });
  const rs = [{ id: 'R01', texto: 'abrí la mercería' }, { id: 'R43', texto: 'de la salud, paso' }];
  const ps = [{ pieza: 'cap_1', texto: 'Abrí la mercería. [[R01]]' }];
  const pl = { capitulos: [{ n: 1, piezas: [] }], sus_frases: [] };
  assert.equal(c18(ps, rs, { episodios: [] }, pl).length, 1);
  assert.deepEqual(c18(ps, rs, { episodios: [] }, pl, new Set(['R43'])), []);
});
