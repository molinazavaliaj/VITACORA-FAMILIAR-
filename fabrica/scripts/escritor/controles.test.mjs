// Tests de los controles de la receta v3 (docs/v3/escritor/receta.md). Datos inventados: Nélida, la mercera de la guía.
// Correr: node --test fabrica/scripts/escritor/
import test from 'node:test';
import assert from 'node:assert/strict';
import { c12, c13, c20, c20Texto, c23, c24, c26, referencias } from './controles.mjs';
import { piezaDeR, planConR } from './lib.mjs';

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
  assert.deepEqual(c13(plan(), reg()), []);
  assert.deepEqual(c12(plan(), [{ id: 'R02', texto: 'y no daba la cuenta, Raúl' }], reg()), []);
  assert.deepEqual(c20(plan(), reg()), []);
});

test('C13: el balance va a Antes de cerrar, no a un capítulo ni afuera', () => {
  const p = plan(); p.antes_de_cerrar.ids = [];
  assert.ok(c13(p, reg()).some((x) => x.includes('E04 es balance')));
  const q = plan(); q.capitulos[1].piezas.push({ episodio: 'E04', forma: 'remate' });
  assert.ok(c13(q, reg()).some((x) => x.includes('E04 es balance y está en cap_2')));
});

test('C13: una R compartida entre un episodio y un balance puede ir a Antes de cerrar (piloto 01/10, R66)', () => {
  const r = reg(); r.episodios[3].ids = ['R09', 'R01'];
  const p = plan(); p.antes_de_cerrar.ids = ['R09', 'R01'];
  assert.deepEqual(c13(p, r), []);
  const q = plan(); q.antes_de_cerrar.ids = ['R09', 'R01'];
  assert.ok(c13(q, reg()).some((x) => x.includes('E01 no es balance')));
});

test('C13: cada capítulo tiene hecho_fuerte en escena, y si hay momento clave es ese', () => {
  const p = plan(); delete p.capitulos[0].hecho_fuerte;
  assert.ok(c13(p, reg()).some((x) => x.includes('cap_1: sin hecho_fuerte')));
  const q = plan(); q.capitulos[0].hecho_fuerte = 'E01';
  const err = c13(q, reg());
  assert.ok(err.some((x) => x.includes('no está en sus piezas como escena')));
  assert.ok(err.some((x) => x.includes('momentos clave (E02)')));
});

test('C12: el título que sale de una frase sale del hecho más fuerte', () => {
  const p = plan(); p.capitulos[0].titulo = { texto: 'el tren', id: 'R01' };
  assert.ok(c12(p, [{ id: 'R01', texto: 'el tren a Córdoba' }, { id: 'R02', texto: 'no daba' }], reg()).some((x) => x.includes('no del hecho más fuerte')));
});

test('C13: el último capítulo tiene columna e imagen final de hoy, y cierra ahí', () => {
  const p = plan(); p.capitulos[1].columna = { texto: '' };
  assert.ok(c13(p, reg()).some((x) => x.includes('no tiene columna')));
  const q = plan(); q.capitulos[1].cierre.episodio = 'E06';
  assert.ok(c13(q, reg()).some((x) => x.includes('no cierra en su imagen_final')));
  const r = plan(); r.capitulos[1].imagen_final.episodio = 'E01'; r.capitulos[1].cierre.episodio = 'E01'; r.capitulos[1].piezas.push({ episodio: 'E01', forma: 'resumen' }); r.capitulos[0].piezas = r.capitulos[0].piezas.filter((x) => x.episodio !== 'E01');
  assert.ok(c13(r, reg()).some((x) => x.includes('no es de hoy')));
});

test('C13: la carta no se llama "Antes de cerrar"', () => {
  const p = plan(); p.carta.titulo = 'Antes de cerrar';
  assert.ok(c13(p, reg()).some((x) => x.includes('no puede llamarse')));
});

test('C19 (plan): a quien está dedicado sin mensaje, va a faltantes', () => {
  const p = plan(); p.faltantes = [];
  const err = c20(p, reg());
  assert.ok(err.some((x) => x.includes('dedicado a Marcela')));
  assert.ok(!err.some((x) => x.includes('dedicado a Gustavo')), 'Gustavo tiene mensaje (E05)');
});

test('C20 (texto): el último párrafo es la imagen final y no se apilan reflexiones', () => {
  const ok = [{ pieza: 'cap_2', texto: '# Hoy\n\nA la tarde saco el bastidor. [[R08]]\n\nEl mate, amargo. [[R11]]\n\nY el bastidor queda en la falda. [[R08]]' }];
  assert.deepEqual(c20Texto(ok, reg(), plan()), []);
  const mal = [{ pieza: 'cap_2', texto: '# Hoy\n\nA la tarde saco el bastidor. [[R08]]\n\nEl mate, amargo. [[R11]]' }];
  assert.ok(c20Texto(mal, reg(), plan()).some((x) => x.que.includes('imagen final')));
});

test('C23: el balance entra entero en Antes de cerrar', () => {
  assert.equal(c23([{ pieza: 'antes_de_cerrar', texto: 'Lo más difícil fue quedarme sola. [[R09]]' }], reg()).length, 0);
  assert.equal(c23([{ pieza: 'cap_2', texto: 'Lo más difícil fue quedarme sola. [[R09]]' }], reg())[0].pieza, 'antes_de_cerrar');
});

test('C24: lo que el cotejo encontró afuera tiene que estar en su pieza', () => {
  const cotejo = { faltan: [{ id: 'R08', frase: 'el bastidor es mi única compañía verdadera', por_que: 'cómo se ve' }] };
  const crudas = [{ pieza: 'cap_2', texto: 'A la tarde saco el bastidor. [[R08]]' }];
  const sin = crudas.map((p) => ({ ...p, texto: p.texto.replace(/\[\[.*?\]\]/g, '') }));
  assert.equal(c24(sin, cotejo, plan(), reg(), crudas)[0].tipo, 'falta_frase');
  const con = [{ pieza: 'cap_2', texto: 'El bastidor es mi única compañía verdadera.' }];
  assert.deepEqual(c24(con, cotejo, plan(), reg(), crudas), []);
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

test('C25: lista las oraciones con referencias ("ese día", "ahí")', () => {
  const r = referencias([{ pieza: 'cap_1', texto: 'Ese día no abrí. Raúl sumaba.\n\nAhí me quedé.' }]);
  assert.deepEqual(r.map((x) => x.oracion), ['Ese día no abrí.', 'Ahí me quedé.']);
});

test('C26: el verificador que da vuelta una decisión anterior no va al arreglo', () => {
  const anteriores = { cap_1: [{ n: 1, tipo: 'presente', frase: 'Chiche fuma como un escuerzo', despues: 'Chiche fumaba como un escuerzo' }] };
  const repaso = { problemas: [
    { pieza: 'cap_1', tipo: 'pasado', frase: 'Chiche fumaba como un escuerzo' },
    { pieza: 'cap_1', tipo: 'fecha', frase: 'En 1971 abrimos' },
    { pieza: 'cap_1', tipo: 'contradice_decision', frase: 'Chiche fumaba', ids: ['R18'] },
  ] };
  const r = c26(repaso, anteriores);
  assert.equal(r.oscila.length, 1);
  assert.equal(r.nuevos.length, 1);
  assert.equal(r.contradice.length, 1);
});

test('la receta: cada paso tiene su prompt y el repaso del verificador es el segundo bloque del Paso 4', async () => {
  const { promptsDe, esquemaDe } = await import('./lib.mjs');
  for (const h of ['### Paso 1', '### Paso 2 ·', '### Paso 3a', '### Paso 3b', '### Paso 3c', '### Paso 3d', '### Paso 5 ·', '### Paso 5b']) assert.ok(promptsDe(h)[0]?.startsWith('Sos '), h);
  const [verif, repaso] = promptsDe('### Paso 4');
  assert.ok(verif.startsWith('Sos el verificador'));
  assert.match(repaso, /decisiones_anteriores/);
  assert.match(promptsDe('### Paso 6')[1], /^El escritor dice/);
  assert.match(esquemaDe('### Paso 5b'), /"faltan"/);
});

// ---- regresiones de la revisión (01/10) ----
import { cotejoValido } from './controles.mjs';

test('revisión 1: el último capítulo sigue pidiendo hilo_de_hoy_ids', () => {
  const p = plan(); p.capitulos[1].hilo_de_hoy_ids = [];
  assert.ok(c13(p, reg()).some((x) => x.includes('hilo de hoy')));
});

test('revisión 5: en antes_de_cerrar va solo el balance', () => {
  const p = plan(); p.antes_de_cerrar.ids.push('R11');
  assert.ok(c13(p, reg()).some((x) => x.includes('E06 no es balance')));
});

test('revisión 3: el cotejo descarta ids que no existen y frases que no son textuales', () => {
  const rs = [{ id: 'R08', texto: 'a la tarde el bastidor es mi única compañía verdadera' }];
  const { validas, descartadas } = cotejoValido({ faltan: [
    { id: 'R08', frase: 'el bastidor es mi única compañía verdadera' },
    { id: 'R99', frase: 'algo' },
    { id: 'R08', frase: 'la soledad me enseñó a bordar' },
  ] }, rs);
  assert.equal(validas.length, 1);
  assert.deepEqual(descartadas.map((d) => d.id), ['R99', 'R08']);
});

test('revisión 4: un nombre que el arreglo no cambió no "oscila": sigue siendo problema', () => {
  const anteriores = { cap_1: [{ tipo: 'nombre', frase: 'Lo llamaban el Tano en el barrio', resultado: 'sin respuesta', despues: '' }] };
  const r = c26({ problemas: [{ pieza: 'cap_1', tipo: 'nombre', frase: 'Lo llamaban el Tano en el barrio' }] }, anteriores);
  assert.equal(r.nuevos.length, 1);
  assert.equal(r.oscila.length, 0);
});

test('revisión 9: el título de la carta pasa C12 salvo "Para los míos"', () => {
  const p = plan(); p.carta.titulo = 'Lo que guardé en el cajón'; p.carta.titulo_id = '';
  assert.ok(c12(p, [{ id: 'R02', texto: 'y no daba la cuenta, Raúl' }], reg()).some((x) => x.startsWith('C12 carta')));
});

test('revisión 13: el título puede salir de una variante del hecho fuerte', () => {
  const r = reg(); r.episodios[1].variantes = [{ que_agrega: 'la luz', ids: ['R04'] }];
  const p = plan(); p.capitulos[0].titulo = { texto: 'la luz de la cocina', id: 'R04' };
  assert.deepEqual(c12(p, [{ id: 'R02', texto: 'y no daba la cuenta, Raúl' }, { id: 'R04', texto: 'la luz de la cocina' }], r), []);
});
