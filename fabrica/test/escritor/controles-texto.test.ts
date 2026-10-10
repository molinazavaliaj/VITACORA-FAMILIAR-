// Los controles de texto portados: los tests originales copiados, y la misma salida que controles.mjs
// sobre las piezas de Nélida con fallas sembradas.
import assert from 'node:assert/strict';
import { describe, expect, it, test } from 'vitest';
import * as T from '../../src/escritor/controles/texto.js';
import * as M from '../../scripts/escritor-v55/controles.mjs';

const rs = [
  { id: 'R01', pregunta: '¿Dónde naciste?', texto: 'Nací en Echesortu, en Rosario, en 1948. Mi papá era tornero.' },
  { id: 'R03', pregunta: '¿Hubo una noche difícil en el negocio?', texto: 'Una noche la cuenta no daba. Raúl me dijo sumá vos.' },
];
const conFallas = {
  pieza: 'cap_1',
  texto: [
    'Sin duda fue un antes y un después en el tapiz de mi vida… [[R01]]',
    'Y entonces vino Ramiro. Corto. Más corto. Cortísimo. [[R01]]',
    '«Una noche la cuenta no daba nunca jamás», me dijo. Caminando por la calle, fue vendida por Raúl en 1950. Tenés razón, tienes razón. [[R03]]',
    'Hoy con Raúl no hablo. Hoy tampoco. [[R03]]',
    'De la salud, paso. No me acuerdo de nada. ¿Hubo una noche difícil en el negocio? [[R03]]',
  ].join('\n\n'),
};
const regEq = { personas: [{ id: 'P01', nombre: 'Raúl', apodos: [], relacion: 'marido', estado: 'sigue_hoy' }] };

describe('controles de texto: lo mismo que controles.mjs', () => {
  it('cada control da lo mismo sobre una pieza con fallas', () => {
    const dos = [conFallas, { pieza: 'cap_2', texto: 'Y entonces vino Ramiro. Corto. Más corto.' }];
    const pp = [conFallas, { pieza: 'primera_pagina', texto: 'Sin duda fue un antes y un después en el tapiz.' }];
    expect(T.c1(conFallas, rs)).toEqual(M.c1(conFallas, rs));
    expect(T.c1(conFallas, rs).length).toBeGreaterThan(0);
    expect(T.c7(dos)).toEqual(M.c7(dos));
    expect(T.c10(conFallas, rs, 'vos')).toEqual(M.c10(conFallas, rs, 'vos'));
    expect(T.c28(conFallas)).toEqual(M.c28(conFallas));
    expect(T.c29(conFallas, regEq)).toEqual(M.c29(conFallas, regEq));
    expect(T.c31(conFallas)).toEqual(M.c31(conFallas));
    expect(T.c32(conFallas)).toEqual(M.c32(conFallas));
    expect(T.c32(conFallas).length).toBeGreaterThan(0);
    expect(T.c17([conFallas])).toEqual(M.c17([conFallas]));
    expect(T.presentes([conFallas])).toEqual(M.presentes([conFallas]));
    expect(T.pasados([conFallas], regEq)).toEqual(M.pasados([conFallas], regEq));
    expect(T.referencias([conFallas])).toEqual(M.referencias([conFallas]));
    expect(T.repite(pp, 'primera_pagina')).toEqual(M.repite(pp, 'primera_pagina'));
    expect(T.esSubsecuencia('la cuenta no daba', rs[1].texto)).toBe(M.esSubsecuencia('la cuenta no daba', rs[1].texto));
  });
  // C2, C3, C4, C5, C6, C8 y C15 no están exportados en controles.mjs: los compara
  // test/escritor/controles-correr.test.ts a través de `controles.mjs <carpeta> piezas`.
});

// ---- tests originales, copiados ----

const reg = () => ({
  personas: [
    { id: 'P01', nombre: 'Raúl', apodos: [], relacion: 'marido', estado: 'termino', hechos: [{ hecho: 'tenía la mercería', ids: ['R02'] }], rasgos_hoy: [] },
    { id: 'P02', nombre: 'Marcela', apodos: ['la nena'], relacion: 'hija', estado: 'sigue_hoy', hechos: [], rasgos_hoy: [] },
    { id: 'P03', nombre: 'Gustavo', apodos: [], relacion: 'hijo', estado: 'sigue_hoy', hechos: [], rasgos_hoy: [] },
  ],
  hoy: [{ que: 'borda a la tarde', ids: ['R08'] }],
  episodios: [
    { id: 'E01', que: 'el viaje a Córdoba', tipo: 'episodio', es_escena: true, estado: 'termino', momento_clave: '', ids: ['R01'], a_quien: 'nadie', detalles: ['el tren'] },
    { id: 'E02', que: 'la noche de la calculadora', tipo: 'episodio', es_escena: true, estado: 'termino', momento_clave: 'giro', ids: ['R02', 'R03'], a_quien: 'nadie', detalles: ['la calculadora'] },
    { id: 'E03', que: 'la tarde del bastidor', tipo: 'episodio', es_escena: true, estado: 'sigue_hoy', momento_clave: '', ids: ['R08'], a_quien: 'nadie', detalles: ['el bastidor'] },
    { id: 'E04', que: 'lo más difícil fue quedarme sola', tipo: 'balance', es_escena: false, estado: 'termino', momento_clave: '', ids: ['R09'], a_quien: 'nadie', detalles: [] },
    { id: 'E05', que: 'que no se peleen por la casa', tipo: 'mensaje', es_escena: false, estado: 'sigue_hoy', momento_clave: '', ids: ['R10'], a_quien: 'familia', a_quien_nombres: ['Gustavo'], detalles: [] },
    { id: 'E06', que: 'me gusta el mate amargo', tipo: 'gusto', es_escena: false, estado: 'sigue_hoy', momento_clave: '', ids: ['R11'], a_quien: 'nadie', detalles: [] },
  ],
});
test('C25: lista las oraciones con referencias ("ese día", "ahí")', () => {
  const r = T.referencias([{ pieza: 'cap_1', texto: 'Ese día no abrí. Raúl sumaba.\n\nAhí me quedé.' }]);
  assert.deepEqual(r.map((x) => x.oracion), ['Ese día no abrí.', 'Ahí me quedé.']);
});


test('C10 v3.1: "vos ya lo sabés" no es tuteo; "tú lo sabes" sí', () => {
  assert.deepEqual(T.c10({ texto: 'Marcela, vos ya lo sabés.' }, [], 'vos'), []);
  assert.ok(T.c10({ texto: 'Marcela, tú ya lo sabes.' }, [], 'vos').some((x) => x.que.includes('tuteo')));
});


test('C27: pasados que nombran a alguien que sigue hoy (por nombre o por relación)', () => {
  const r = reg(); r.personas.push({ id: 'P04', nombre: 'Elsa', apodos: [], relacion: 'madre', estado: 'sigue_hoy', hechos: [], rasgos_hoy: [] });
  const ps = [{ pieza: 'cap_2', texto: 'Mi mamá era la que cocinaba. Marcela bordaba conmigo.\n\nRaúl era serio. Hoy Gustavo viene los domingos.' }];
  const xs = T.pasados(ps, r);
  assert.deepEqual(xs.map((x) => x.personas.join()), ['Elsa', 'Marcela']); // Raúl terminó: no va; la del presente no va
});


test('C1 v4: hasta tres recursos por pieza no son problema; el cuarto sí', () => {
  const dos = 'Raúl contaba la plata de la caja todas las noches con la calculadora.\n\nNo daba.\n\nLa Negra venía a la siesta y se quedaba hasta el cierre.\n\nY no volvió.';
  assert.deepEqual(T.c1({ pieza: 'cap_1', texto: dos }, []).filter((x) => /recursos/.test(x.que)), []);
  assert.deepEqual(T.c1({ pieza: 'cap_1', texto: `${dos}\n\nNunca más.` }, []).filter((x) => /recursos/.test(x.que)), []);
  assert.equal(T.c1({ pieza: 'cap_1', texto: `${dos}\n\nNunca más.\n\nY se fue.` }, []).filter((x) => /recursos/.test(x.que)).length, 1);
});


test('C28 v4: una línea de hoy al final de su párrafo pasa; en el medio o dos en el párrafo, no', () => {
  assert.deepEqual(T.c28({ pieza: 'cap_2', texto: 'Le pedí plata a Ivo para el disco. Hasta hoy le sigo debiendo.' }), []);
  assert.equal(T.c28({ pieza: 'cap_2', texto: 'Hoy Marcela tiene la llave. Raúl abrió en el 74.' }).length, 1);
  assert.equal(T.c28({ pieza: 'cap_2', texto: 'Raúl abrió en el 74. Hoy Marcela tiene la llave. Hoy la Negra ya no viene.' }).length, 2);
});


test('C29: el mismo nombre del registro tres veces en tres oraciones seguidas', () => {
  const t = 'Con Raúl fuimos a Córdoba. Raúl manejaba. Después Raúl se durmió.\n\nMarcela vino. Gustavo también.';
  assert.equal(T.c29({ pieza: 'cap_1', texto: t }, reg()).length, 1);
  assert.deepEqual(T.c29({ pieza: 'cap_1', texto: 'Raúl abrió. Marcela vino. Gustavo cerró.' }, reg()), []);
});


test('C7 v4: el estribillo de quien narra puede volver en otra pieza', () => {
  const ps = [{ pieza: 'cap_1', texto: 'En esa casa no se tiraba ni un botón, decía mi madre.' }, { pieza: 'cap_4', texto: 'Y en la mercería, igual: en esa casa no se tiraba ni un botón.' }];
  assert.ok(T.c7(ps).length > 0);
  assert.deepEqual(T.c7(ps, ['en esa casa no se tiraba ni un botón']), []);
});


test('C31 (v5.1): arranques con "Y" y tiras de oraciones cortas', () => {
  const xs = T.c31({ pieza: 'cap_1', texto: 'Abrimos la mercería en el 78 con la plata del Renault. Y la gente venía. Sumé. No daba. Me fui. Después vino la Negra a la siesta, como siempre.\n\n—Y bueno, Nélida.' });
  assert.equal(xs.filter((x) => x.que.includes('"Y"')).length, 1);
  assert.equal(xs.filter((x) => x.que.includes('cortas')).length, 1);
  assert.deepEqual(T.c31({ pieza: 'cap_1', texto: 'Abrimos en el 78, y aunque los primeros años no daba, Raúl decía que había que esperar.' }), []);
});


test('C31 (v5.2): oraciones de más de 40 palabras', () => {
  const larga = 'Cuando Raúl se enfermó, entre la mercería a la mañana, los remedios, el Centenario, la Negra que me cubría a la siesta, los turnos, las cuentas y Marcela que venía cuando podía, mi día quedó partido en dos y así seguimos, sin parar, hasta agosto del 96, cuando se murió.';
  const xs = T.c31({ pieza: 'cap_1', texto: `${larga} [[R40]]` });
  assert.equal(xs.filter((x) => x.tipo === 'larga').length, 1);
  // 30 palabras: punto medio, no se marca
  assert.deepEqual(T.c31({ pieza: 'cap_1', texto: 'Yo estaba con él. Me pidió que no cerrara el negocio, el mismo por el que una noche, años antes, me había puesto la calculadora en la mesa de la cocina para que sumara yo.' }), []);
});


test('C32 (v5.2): los "no" de la entrevista que quedaron en el libro', () => {
  const t = 'De la salud, paso. Abrí la mercería en el 78. No tengo foto de esa vidriera. Ningún maestro me marcó en la escuela. Esa es mi vida y no hay mucho más que contar. Del colegio no me acuerdo casi nada.';
  const xs = T.c32({ pieza: 'cap_1', texto: t });
  assert.equal(xs.length, 5);
  assert.ok(xs.every((x) => x.control === 'C32' && x.tipo === 'no_entra'));
  // lo que cuenta, aunque tenga un "no", no se marca
  assert.deepEqual(T.c32({ pieza: 'cap_1', texto: 'No quise cerrar el negocio: se lo había prometido. Di un paso atrás y miré la vidriera. El paso a nivel quedaba en la esquina.' }), []);
  // las citas en bloque (Sus frases) no se miran acá
  assert.deepEqual(T.c32({ pieza: 'cap_1', texto: '> no me acuerdo' }), []);
});

test('C7 (v5.3): repite marca lo que una pieza comparte con las demás', () => {
  const ps = [
    { pieza: 'cap_1', texto: 'Mis hermanos son más grandes: Gustavo me lleva quince años y siempre me cuidaba. [[R01]]' },
    { pieza: 'primera_pagina', texto: 'Soy la de la mercería. Gustavo me lleva quince años y siempre me cuidaba. [[R01]]' },
  ];
  const xs = T.repite(ps, 'primera_pagina');
  assert.equal(xs.length, 1);
  assert.equal(xs[0].pieza, 'primera_pagina');
  assert.deepEqual(T.repite(ps.slice(0, 1).concat({ pieza: 'primera_pagina', texto: 'Soy la de la mercería de Echesortu. [[R02]]' }), 'primera_pagina'), []);
});


test('v5.4: C31 marca la oración que arranca con "I" (catalán)', () => {
  const xs = T.c31({ pieza: 'cap_1', texto: 'Vam obrir la merceria el 78 amb els diners del Renault. I la gent venia cada matí a comprar botons i fil.' });
  assert.equal(xs.filter((x) => x.que.includes('"Y"')).length, 1);
});


test('v5.4: C32 encuentra los "no" de la entrevista en catalán', () => {
  const t = "De la salut, passo. Vaig obrir la merceria el 78. No tinc cap foto d'aquell aparador. Cap mestre em va marcar a l'escola. Aquesta és la meva vida i no hi ha gaire més a explicar. De l'escola no me'n recordo gaire.";
  assert.equal(T.c32({ pieza: 'cap_1', texto: t }).length, 5);
  assert.deepEqual(T.c32({ pieza: 'cap_1', texto: "No vaig voler tancar la botiga: l'hi havia promès. Vaig fer un pas enrere i vaig mirar l'aparador." }), []);
});


test('C17 (v5.5): solo marca una presentación completa, no cada "mi hermano X"', () => {
  const ps = [
    { pieza: 'cap_1', texto: 'Mi hermano Gustavo, el mayor, me cuidaba siempre.' },
    { pieza: 'cap_2', texto: 'Ahí viví con mi hermano Gustavo las mejores tardes de mi vida.' },
    { pieza: 'cap_3', texto: 'Mi hermano Gustavo, el mayor de los tres, tiene hoy sesenta años.' },
  ];
  const xs = T.c17(ps);
  assert.equal(xs.length, 1);
  assert.equal(xs[0].pieza, 'cap_3');
});

