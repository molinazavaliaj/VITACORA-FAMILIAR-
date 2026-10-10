// Controles de registro, plan, "todo entra", arreglo y repaso: lo mismo que controles.mjs.
import assert from 'node:assert/strict';
import { describe, expect, it, test } from 'vitest';
import { leerJSON } from '../../src/escritor/carpeta.js';
import * as E from '../../src/escritor/controles/estructura.js';
import { respuestas } from '../../src/escritor/lectura.js';
import { armarCambios, destinosAfuera, piezaDeR, planConR } from '../../src/escritor/texto.js';
import * as M from '../../scripts/escritor-v55/controles.mjs';
import { aDisco, carpetaNelida } from './ayuda.js';

describe('controles de estructura: lo mismo que controles.mjs sobre Nélida', () => {
  const c = carpetaNelida();
  const reg = leerJSON(c, 'salidas/registro.json');
  const plan = planConR(leerJSON(c, 'salidas/plan.json'), reg);
  const rs = respuestas(c);
  const ps = ['primera_pagina.md', 'capitulo_01.md', 'capitulo_02.md', 'antes_de_cerrar.md', 'carta.md'].map((f) => ({ pieza: f.replace('.md', '').replace(/^capitulo_0?/, 'cap_'), texto: c.leer(`salidas/${f}`) }));

  it('plan: C12, C13, C20, C33 sin problemas y con un plan roto, iguales', () => {
    expect(E.c12(plan, rs, reg)).toEqual(M.c12(plan, rs, reg));
    expect(E.c13(plan, reg)).toEqual(M.c13(plan, reg));
    expect(E.c20(plan, reg)).toEqual(M.c20(plan, reg));
    expect(E.c33(plan, reg)).toEqual(M.c33(plan, reg));
    const roto = structuredClone(plan);
    roto.capitulos[1].apertura.tipo = 'escena';
    roto.titulo_libro = { texto: 'Una etapa linda', id: '' };
    roto.capitulos[0].golpe = { episodio: 'E03', preparacion: ['E06'], frase_id: 'R06' };
    expect(E.c12(roto, rs, reg)).toEqual(M.c12(roto, rs, reg));
    expect(E.c13(roto, reg)).toEqual(M.c13(roto, reg));
    expect(E.c33(roto, reg)).toEqual(M.c33(roto, reg));
    expect(E.c13(roto, reg).length).toBeGreaterThan(0);
  });

  it('todo entra: C18, C19, C20Texto, C23, C33Texto, iguales', () => {
    const sinR06 = ps.map((p) => (p.pieza === 'cap_2' ? { ...p, texto: p.texto.replace('[[R06]]', '') } : p));
    expect(E.c18(sinR06, rs, reg, plan)).toEqual(M.c18(sinR06, rs, reg, plan));
    expect(E.c19(sinR06, reg)).toEqual(M.c19(sinR06, reg));
    expect(E.c20Texto(sinR06, reg, plan)).toEqual(M.c20Texto(sinR06, reg, plan));
    expect(E.c23(sinR06, reg)).toEqual(M.c23(sinR06, reg));
    expect(E.c33Texto(sinR06, plan, reg)).toEqual(M.c33Texto(sinR06, plan, reg));
  });

  it('cotejo y repaso: cotejoValido, C24, C26, iguales', () => {
    const cotejo = { faltan: [{ id: 'R03', frase: 'Tito ladraba por el camión' }, { id: 'R99', frase: 'no existe' }, { id: 'R01', frase: 'frase inventada' }] };
    expect(E.cotejoValido(cotejo, rs)).toEqual(M.cotejoValido(cotejo, rs));
    expect(E.c24(ps, cotejo, plan, reg, ps, rs)).toEqual(M.c24(ps, cotejo, plan, reg, ps, rs));
    const repaso = { problemas: [{ pieza: 'cap_1', tipo: 'pasado', frase: 'Raúl tiene la mercería', ids: ['R02'] }, { pieza: 'cap_1', tipo: 'contradice_decision', frase: 'x' }, { pieza: 'cap_2', tipo: 'nombre', frase: 'y' }] };
    const anteriores = { cap_1: [{ n: 1, tipo: 'presente', frase: 'Raúl tenía la mercería', correccion: '', resultado: 'cambiado', despues: 'Raúl tiene la mercería' }] };
    expect(E.c26(repaso, anteriores)).toEqual(M.c26(repaso, anteriores));
  });

  it('decisionesAnteriores lee lo mismo que el original', () => {
    const d = carpetaNelida();
    d.escribir('arreglos/problemas-cap_1.json', JSON.stringify([{ n: 1, origen: 'verificador', tipo: 'presente', frase: 'Raúl tiene la mercería', correccion: 'tenía' }, { n: 2, origen: 'código C31', tipo: 'puntos', frase: 'x' }]));
    d.escribir('arreglos/respuesta-cap_1.txt', 'texto\n---\n{"cambios": [{"problema": 1, "resultado": "cambiado", "despues": "Raúl tenía la mercería"}]}');
    expect(E.decisionesAnteriores(d)).toEqual(M.decisionesAnteriores(aDisco(d)));
  });
});
// C9 y C14 no están exportados en controles.mjs: los compara test/escritor/controles-correr.test.ts.

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
const plan = () => ({
  titulo_libro: { texto: 'la cuenta, Raúl', id: 'R02' },
  primera_pagina: { que_dice_de_si_ids: [] },
  capitulos: [
    { n: 1, titulo: { texto: 'no daba la cuenta', id: 'R02' }, etapa: 'La mercería', hilo_ids: ['R02'], hecho_fuerte: 'E02',
      apertura: { tipo: 'escena', episodio: 'E02' }, cierre: { tipo: 'gesto', episodio: 'E02' },
      piezas: [{ episodio: 'E01', forma: 'resumen' }, { episodio: 'E02', forma: 'escena' }], presenta: ['P01'] },
    { n: 2, titulo: { texto: '', id: '' }, etapa: 'Hoy', hilo_ids: ['R08'], hecho_fuerte: 'E03', es_ultimo: true, hilo_de_hoy_ids: ['R08'],
      columna: { texto: 'cómo la tarde se volvió mía', ids: ['R08'] }, imagen_final: { episodio: 'E03', frase_id: 'R08', que: 'el bastidor en la falda' },
      apertura: { tipo: 'dia_comun', episodio: 'E03' }, cierre: { tipo: 'objeto', episodio: 'E03' },
      piezas: [{ episodio: 'E03', forma: 'escena' }, { episodio: 'E06', forma: 'media_linea' }], presenta: [] },
  ],
  antes_de_cerrar: { ids: ['R09'] },
  sus_frases: [],
  carta: { titulo: 'Para los míos', para: 'mis hijos', para_personas: ['P02', 'P03'], ids: ['R10'] },
  faltantes: [{ que: 'la entrevista no trae un mensaje para Marcela', donde: 'carta' }],
});

test('un plan bien armado pasa C13, C12 y C20/C19 del plan', () => {
  assert.deepEqual(E.c13(plan(), reg()), []);
  assert.deepEqual(E.c12(plan(), [{ id: 'R02', texto: 'y no daba la cuenta, Raúl' }], reg()), []);
  assert.deepEqual(E.c20(plan(), reg()), []);
});

test('C13: el balance va a Antes de cerrar, no a un capítulo ni afuera', () => {
  const p = plan(); p.antes_de_cerrar.ids = [];
  assert.ok(E.c13(p, reg()).some((x) => x.includes('E04 es balance')));
  const q = plan(); q.capitulos[1].piezas.push({ episodio: 'E04', forma: 'remate' });
  assert.ok(E.c13(q, reg()).some((x) => x.includes('E04 es balance y está en cap_2')));
});

test('C13: una R compartida entre un episodio y un balance puede ir a Antes de cerrar (piloto 01/10, R66)', () => {
  const r = reg(); r.episodios[3].ids = ['R09', 'R01'];
  const p = plan(); p.antes_de_cerrar.ids = ['R09', 'R01'];
  assert.deepEqual(E.c13(p, r), []);
  const q = plan(); q.antes_de_cerrar.ids = ['R09', 'R01'];
  assert.ok(E.c13(q, reg()).some((x) => x.includes('E01 no es balance')));
});

test('C13: el último capítulo tiene columna e imagen final de hoy, y cierra ahí', () => {
  const p = plan(); p.capitulos[1].columna = { texto: '' };
  assert.ok(E.c13(p, reg()).some((x) => x.includes('no tiene columna')));
  const q = plan(); q.capitulos[1].cierre.episodio = 'E06';
  assert.ok(E.c13(q, reg()).some((x) => x.includes('no cierra en su imagen_final')));
  const r = plan(); r.capitulos[1].imagen_final.episodio = 'E01'; r.capitulos[1].cierre.episodio = 'E01'; r.capitulos[1].piezas.push({ episodio: 'E01', forma: 'resumen' }); r.capitulos[0].piezas = r.capitulos[0].piezas.filter((x) => x.episodio !== 'E01');
  assert.ok(E.c13(r, reg()).some((x) => x.includes('no es de hoy')));
});

test('C13: la carta no se llama "Antes de cerrar"', () => {
  const p = plan(); p.carta.titulo = 'Antes de cerrar';
  assert.ok(E.c13(p, reg()).some((x) => x.includes('no puede llamarse')));
});

test('C19 (plan): a quien está dedicado sin mensaje, va a faltantes', () => {
  const p = plan(); p.faltantes = [];
  const err = E.c20(p, reg());
  assert.ok(err.some((x) => x.includes('dedicado a Marcela')));
  assert.ok(!err.some((x) => x.includes('dedicado a Gustavo')), 'Gustavo tiene mensaje (E05)');
});

test('C20 (texto): el último párrafo es la imagen final y no se apilan reflexiones', () => {
  const ok = [{ pieza: 'cap_2', texto: '# Hoy\n\nA la tarde saco el bastidor. [[R08]]\n\nEl mate, amargo. [[R11]]\n\nY el bastidor queda en la falda. [[R08]]' }];
  assert.deepEqual(E.c20Texto(ok, reg(), plan()), []);
  const mal = [{ pieza: 'cap_2', texto: '# Hoy\n\nA la tarde saco el bastidor. [[R08]]\n\nEl mate, amargo. [[R11]]' }];
  assert.ok(E.c20Texto(mal, reg(), plan()).some((x) => x.que.includes('imagen final')));
});

test('C23: el balance entra entero en Antes de cerrar', () => {
  assert.equal(E.c23([{ pieza: 'antes_de_cerrar', texto: 'Lo más difícil fue quedarme sola. [[R09]]' }], reg()).length, 0);
  assert.equal(E.c23([{ pieza: 'cap_2', texto: 'Lo más difícil fue quedarme sola. [[R09]]' }], reg())[0].pieza, 'antes_de_cerrar');
});

test('C24: lo que el cotejo encontró afuera tiene que estar en su pieza', () => {
  const cotejo = { faltan: [{ id: 'R08', frase: 'el bastidor es mi única compañía verdadera', por_que: 'cómo se ve' }] };
  const crudas = [{ pieza: 'cap_2', texto: 'A la tarde saco el bastidor. [[R08]]' }];
  const sin = crudas.map((p) => ({ ...p, texto: p.texto.replace(/\[\[.*?\]\]/g, '') }));
  assert.equal(E.c24(sin, cotejo, plan(), reg(), crudas)[0].tipo, 'falta_frase');
  const con = [{ pieza: 'cap_2', texto: 'El bastidor es mi única compañía verdadera.' }];
  assert.deepEqual(E.c24(con, cotejo, plan(), reg(), crudas), []);
});

test('piezaDeR: la marca manda; si no, el plan (carta, Antes de cerrar, capítulo)', () => {
  assert.equal(piezaDeR(plan(), reg(), 'R10'), 'carta');
  assert.equal(piezaDeR(plan(), reg(), 'R09'), 'antes_de_cerrar');
  assert.equal(piezaDeR(plan(), reg(), 'R03'), 'cap_1');
  assert.equal(piezaDeR(plan(), reg(), 'R03', [{ pieza: 'cap_2', texto: 'algo [[R03]]' }]), 'cap_2');
});

test('planConR pasa a R los E de antes_de_cerrar', () => {
  const p = plan(); p.antes_de_cerrar.ids = ['E04'];
  assert.deepEqual(planConR(p, reg()).antes_de_cerrar.ids, ['R09']);
});

test('C26: el verificador que da vuelta una decisión anterior no va al arreglo', () => {
  const anteriores = { cap_1: [{ n: 1, tipo: 'presente', frase: 'Chiche fuma como un escuerzo', despues: 'Chiche fumaba como un escuerzo' }] };
  const repaso = { problemas: [
    { pieza: 'cap_1', tipo: 'pasado', frase: 'Chiche fumaba como un escuerzo' },
    { pieza: 'cap_1', tipo: 'fecha', frase: 'En 1971 abrimos' },
    { pieza: 'cap_1', tipo: 'contradice_decision', frase: 'Chiche fumaba', ids: ['R18'] },
  ] };
  const r = E.c26(repaso, anteriores);
  assert.equal(r.oscila.length, 1);
  assert.equal(r.nuevos.length, 1);
  assert.equal(r.contradice.length, 1);
});

// ---- regresiones de la revisión (01/10) ----

test('revisión 1: el último capítulo sigue pidiendo hilo_de_hoy_ids', () => {
  const p = plan(); p.capitulos[1].hilo_de_hoy_ids = [];
  assert.ok(E.c13(p, reg()).some((x) => x.includes('hilo de hoy')));
});

test('revisión 5: en antes_de_cerrar va solo el balance', () => {
  const p = plan(); p.antes_de_cerrar.ids.push('R11');
  assert.ok(E.c13(p, reg()).some((x) => x.includes('E06 no es balance')));
});

test('revisión 3: el cotejo descarta ids que no existen y frases que no son textuales', () => {
  const rs = [{ id: 'R08', texto: 'a la tarde el bastidor es mi única compañía verdadera' }];
  const { validas, descartadas } = E.cotejoValido({ faltan: [
    { id: 'R08', frase: 'el bastidor es mi única compañía verdadera' },
    { id: 'R99', frase: 'algo' },
    { id: 'R08', frase: 'la soledad me enseñó a bordar' },
  ] }, rs);
  assert.equal(validas.length, 1);
  assert.deepEqual(descartadas.map((d) => d.id), ['R99', 'R08']);
});

test('revisión 4: un nombre que el arreglo no cambió no "oscila": sigue siendo problema', () => {
  const anteriores = { cap_1: [{ tipo: 'nombre', frase: 'Lo llamaban el Tano en el barrio', resultado: 'sin respuesta', despues: '' }] };
  const r = E.c26({ problemas: [{ pieza: 'cap_1', tipo: 'nombre', frase: 'Lo llamaban el Tano en el barrio' }] }, anteriores);
  assert.equal(r.nuevos.length, 1);
  assert.equal(r.oscila.length, 0);
});

test('revisión 9: el título de la carta pasa C12 salvo "Para los míos"', () => {
  const p = plan(); p.carta.titulo = 'Lo que guardé en el cajón'; p.carta.titulo_id = '';
  assert.ok(E.c12(p, [{ id: 'R02', texto: 'y no daba la cuenta, Raúl' }], reg()).some((x) => x.startsWith('C12 carta')));
});

// ---------- receta v3.1 (prueba 3) ----------
test('C13 v3.1: escena solo si el registro dice es_escena', () => {
  const p = plan(); p.capitulos[1].piezas.push({ episodio: 'E04', forma: 'escena' });
  assert.ok(E.c13(p, reg()).some((x) => x.includes('E04 va como escena y el registro dice que no tiene escena')));
});

test('C20 v3.1: en el último capítulo las medias líneas de reflexión o gusto también cuentan', () => {
  const r = reg();
  r.episodios.push({ id: 'E07', que: 'la radio', tipo: 'gusto', es_escena: false, estado: 'sigue_hoy', momento_clave: '', ids: ['R12'], a_quien: 'nadie', detalles: [] },
    { id: 'E08', que: 'el tiempo pasa', tipo: 'reflexion', es_escena: false, estado: 'sigue_hoy', momento_clave: '', ids: ['R13'], a_quien: 'nadie', detalles: [] });
  const p = plan(); p.capitulos[1].piezas.push({ episodio: 'E07', forma: 'media_linea' }, { episodio: 'E08', forma: 'media_linea' });
  assert.ok(E.c20(p, r).some((x) => x.includes('junta 3 reflexiones o gustos')));
});

test('armarCambios: reemplaza solo el tramo, deja el resto igual y marca lo que no encuentra', () => {
  const t = 'La mercería abría a las ocho. [[R01]]\n\nRaúl tiene la caja. [[R02]]';
  const { texto, cambios } = armarCambios(t, [
    { problema: [1, 2], resultado: 'cambiado', antes: 'Raúl tiene la caja.', despues: 'Raúl tenía la caja.' },
    { problema: 3, resultado: 'cambiado', antes: 'esto no está', despues: 'x' },
    { problema: 4, resultado: 'disputa', antes: '', despues: '', disputa_id: 'R02', disputa_frase: 'tiene' },
  ]);
  assert.equal(texto, 'La mercería abría a las ocho. [[R01]]\n\nRaúl tenía la caja. [[R02]]');
  assert.deepEqual(cambios.map((c) => [c.problema, c.resultado]), [[1, 'cambiado'], [2, 'cambiado'], [3, 'no_aplicado'], [4, 'disputa']]);
});

test('C13 v3.2: lo de hoy no va a un capítulo del pasado sin por_que_aca', () => {
  const r = reg(); r.episodios.push({ id: 'E09', que: 'mis nietos hoy', tipo: 'dato', es_escena: false, estado: 'sigue_hoy', momento_clave: '', ids: ['R14'], a_quien: 'nadie', detalles: [] });
  const p = plan(); p.capitulos[0].piezas.push({ episodio: 'E09', forma: 'media_linea' });
  assert.ok(E.c13(p, r).some((x) => x.includes('E09') && x.includes('es de hoy')));
  p.capitulos[0].piezas[2].por_que_aca = 'los nietos juegan con la calculadora de Raúl';
  assert.ok(!E.c13(p, r).some((x) => x.includes('es de hoy')));
  const q = plan(); q.capitulos[1].piezas.push({ episodio: 'E09', forma: 'media_linea' }); // el último capítulo sí
  assert.ok(!E.c13(q, r).some((x) => x.includes('es de hoy')));
});

test('armarCambios: borrar un párrafo no deja hueco', () => {
  const { texto } = armarCambios('Uno. [[R01]]\n\nDos. [[R02]]\n\nTres. [[R03]]', [{ problema: 1, resultado: 'cambiado', antes: 'Dos. [[R02]]', despues: '' }]);
  assert.equal(texto, 'Uno. [[R01]]\n\nTres. [[R03]]');
});

test('C13 v4: sin hecho_fuerte no hay error; un momento clave con peso "linea" sí', () => {
  const p = plan(); for (const c of p.capitulos) delete c.hecho_fuerte;
  assert.ok(!E.c13(p, reg()).some((x) => x.includes('hecho_fuerte')));
  p.capitulos[0].piezas[1].peso = 'linea'; // E02 es momento clave
  assert.ok(E.c13(p, reg()).some((x) => x.includes('E02') && x.includes('momento clave')));
});

test('C12 v4: el título puede salir de cualquier id del capítulo', () => {
  const p = plan(); delete p.capitulos[0].hecho_fuerte; p.capitulos[0].titulo = { texto: 'el viaje a Córdoba', id: 'R01' };
  assert.ok(!E.c12(p, [{ id: 'R01', texto: 'el viaje a Córdoba en tren' }, { id: 'R02', texto: 'y no daba la cuenta, Raúl' }], reg()).some((x) => x.includes('hecho más fuerte')));
});

test('C18 v4: marcas por tramo; solo la última línea de la pieza tiene que tener marca', () => {
  const rs = [{ id: 'R01', texto: 'uno' }, { id: 'R02', texto: 'dos' }];
  const r = reg(); const p = plan();
  const bien = [{ pieza: 'cap_1', texto: 'Párrafo uno.\n\nPárrafo dos. [[R01,R02]]' }];
  assert.deepEqual(E.c18(bien, rs, r, p).filter((x) => x.tipo === 'sin_marca'), []);
  const mal = [{ pieza: 'cap_1', texto: 'Párrafo uno. [[R01,R02]]\n\nY termina sin marca.' }];
  assert.equal(E.c18(mal, rs, r, p).filter((x) => x.tipo === 'sin_marca').length, 1);
});

test('C13/C19 v4: hilo de hoy con episodios; "mamá" encuentra a "su mamá" (madre)', () => {
  const r = reg(); r.personas.push({ id: 'P04', nombre: 'su mamá', apodos: [], relacion: 'madre', estado: 'sigue_hoy', hechos: [], rasgos_hoy: [] });
  r.episodios[4].a_quien_nombres = ['Gustavo', 'mamá'];
  const p = plan(); p.capitulos[1].hilo_de_hoy_ids = ['E03']; p.carta.para_personas = ['P03', 'P04']; p.faltantes = [];
  assert.ok(!E.c13(p, r).some((x) => x.includes('hilo de hoy')));
  assert.ok(!E.c20(p, r).some((x) => x.includes('su mamá')));
});

test('C13 v4: sin escenas de hoy en el registro, el hilo del último puede ser la escena más reciente', () => {
  const r = reg(); r.episodios[2].estado = 'termino'; r.hoy = [{ que: 'borda', ids: ['R99'] }]; // ya no hay escena sigue_hoy
  const p = plan(); p.capitulos[1].hilo_de_hoy_ids = ['E02'];
  assert.ok(!E.c13(p, r).some((x) => x.includes('hilo de hoy')));
  p.capitulos[1].hilo_de_hoy_ids = ['E04']; // balance, no es escena
  assert.ok(E.c13(p, r).some((x) => x.includes('hilo de hoy')));
});

// ---- v52.test.mjs ----
const reg52 = () => ({ episodios: [
  { id: 'E01', ids: ['R01'] }, { id: 'E02', ids: ['R02', 'R03'] }, { id: 'E03', ids: ['R04'] }, { id: 'E04', ids: ['R05'] }, { id: 'E05', ids: ['R06'] },
] });
const plan52 = (golpe2) => ({ capitulos: [
  { n: 1, piezas: [{ episodio: 'E01', peso: 'normal' }, { episodio: 'E02', peso: 'clave' }], golpe: { episodio: '', preparacion: [], frase_id: '' } },
  { n: 2, piezas: [{ episodio: 'E03', peso: 'normal' }, { episodio: 'E04', peso: 'clave' }], golpe: golpe2 },
  { n: 3, piezas: [{ episodio: 'E05', peso: 'normal' }] },
] });

test('C33 (v5.2): el golpe, su preparación y su frase en el mismo capítulo (plan)', () => {
  assert.deepEqual(E.c33(plan52({ episodio: 'E04', preparacion: ['E03', 'E01'], frase_id: 'R05' }), reg52()), []);
  // preparación en un capítulo POSTERIOR: error
  assert.equal(E.c33(plan52({ episodio: 'E04', preparacion: ['E05'], frase_id: 'R05' }), reg52()).length, 1);
  // preparación de esta etapa DESPUÉS del golpe: error
  const p = plan52({ episodio: 'E04', preparacion: ['E03'], frase_id: 'R05' });
  p.capitulos[1].piezas.reverse();
  assert.equal(E.c33(p, reg52()).length, 1);
  // frase de otro capítulo: error
  assert.equal(E.c33(plan52({ episodio: 'E04', preparacion: [], frase_id: 'R02' }), reg52()).length, 1);
  // golpe que no es pieza clave del capítulo: error
  assert.equal(E.c33(plan52({ episodio: 'E03', preparacion: [], frase_id: 'R04' }), reg52()).length, 1);
  // sin golpe: nada que mirar
  assert.deepEqual(E.c33(plan52({ episodio: '', preparacion: [], frase_id: '' }), reg52()), []);
});

test('C33 (v5.2): en el texto, el capítulo del golpe marca su frase y su preparación', () => {
  const p = plan52({ episodio: 'E04', preparacion: ['E03', 'E01'], frase_id: 'R05' });
  assert.deepEqual(E.c33Texto([{ pieza: 'cap_2', texto: 'Antes, la calculadora. [[R04]]\n\nDespués, el robo. [[R05,R01]]' }], p, reg52()), []);
  const xs = E.c33Texto([{ pieza: 'cap_2', texto: 'El robo. [[R05]]' }], p, reg52());
  // falta la preparación: E03 (R04, de esta etapa) y E01 (R01, de otra etapa: va como recuerdo, pero va)
  assert.equal(xs.length, 2);
  assert.match(xs[0].que, /R04/);
  assert.match(xs[1].que, /R01/);
  // sin la frase del golpe: falta
  assert.match(E.c33Texto([{ pieza: 'cap_2', texto: 'El robo. [[R04,R01]]' }], p, reg52())[0].que, /R05/);
  // capítulo que no se escribió (prueba corta): no se mira
  assert.deepEqual(E.c33Texto([], p, reg52()), []);
});

test('v5.2: "no_entra" en afuera no va al arreglo ni a otro capítulo, y C18 no lo pide', () => {
  assert.deepEqual(destinosAfuera([{ id: 'R43', a_donde: 'no_entra' }, { id: 'R40', a_donde: 'linea' }], 2), { pendientes: {}, alArreglo: ['R40'], noEntra: ['R43'] });
  const rs = [{ id: 'R01', texto: 'abrí la mercería' }, { id: 'R43', texto: 'de la salud, paso' }];
  const ps = [{ pieza: 'cap_1', texto: 'Abrí la mercería. [[R01]]' }];
  const pl = { capitulos: [{ n: 1, piezas: [] }], sus_frases: [] };
  assert.equal(E.c18(ps, rs, { episodios: [] }, pl).length, 1);
  assert.deepEqual(E.c18(ps, rs, { episodios: [] }, pl, new Set(['R43'])), []);
});

describe('C12 sin los títulos de capítulo del plan (07/10)', () => {
  it('un título de capítulo armado ya no es problema (no se imprime); el del libro sí', () => {
    const c = carpetaNelida();
    const plan = JSON.parse(c.leer('salidas/plan.json'));
    const reg = JSON.parse(c.leer('salidas/registro.json'));
    const rs = respuestas(c);
    plan.capitulos[0].titulo = { texto: 'Una etapa linda', id: '' };
    expect(E.c12(plan, rs, reg).filter((x: string) => x.startsWith('C12 cap_'))).toEqual([]);
    plan.titulo_libro = { texto: 'Una etapa linda', id: '' };
    expect(E.c12(plan, rs, reg).some((x: string) => x.startsWith('C12 libro'))).toBe(true);
  });
});

