// Tests de los controles de la receta v3 (docs/v3/escritor/receta.md). Datos inventados: Nélida, la mercera de la guía.
// Correr: node --test fabrica/scripts/escritor/
import test from 'node:test';
import assert from 'node:assert/strict';
import { c1, c7, c10, c12, c13, c18, c28, c29, c20, c20Texto, c23, c24, c26, referencias, pasados } from './controles.mjs';
import { piezaDeR, planConR, armarCambios, sinMarcas } from './lib.mjs';

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

// ---------- receta v3.1 (prueba 3) ----------
test('C13 v3.1: escena solo si el registro dice es_escena', () => {
  const p = plan(); p.capitulos[1].piezas.push({ episodio: 'E04', forma: 'escena' });
  assert.ok(c13(p, reg()).some((x) => x.includes('E04 va como escena y el registro dice que no tiene escena')));
});

test('C20 v3.1: en el último capítulo las medias líneas de reflexión o gusto también cuentan', () => {
  const r = reg();
  r.episodios.push({ id: 'E07', que: 'la radio', tipo: 'gusto', es_escena: false, estado: 'sigue_hoy', momento_clave: '', ids: ['R12'], a_quien: 'nadie', detalles: [] },
    { id: 'E08', que: 'el tiempo pasa', tipo: 'reflexion', es_escena: false, estado: 'sigue_hoy', momento_clave: '', ids: ['R13'], a_quien: 'nadie', detalles: [] });
  const p = plan(); p.capitulos[1].piezas.push({ episodio: 'E07', forma: 'media_linea' }, { episodio: 'E08', forma: 'media_linea' });
  assert.ok(c20(p, r).some((x) => x.includes('junta 3 reflexiones o gustos')));
});

test('C10 v3.1: "vos ya lo sabés" no es tuteo; "tú lo sabes" sí', () => {
  assert.deepEqual(c10({ texto: 'Marcela, vos ya lo sabés.' }, [], 'vos'), []);
  assert.ok(c10({ texto: 'Marcela, tú ya lo sabes.' }, [], 'vos').some((x) => x.que.includes('tuteo')));
});

test('C27: pasados que nombran a alguien que sigue hoy (por nombre o por relación)', () => {
  const r = reg(); r.personas.push({ id: 'P04', nombre: 'Elsa', apodos: [], relacion: 'madre', estado: 'sigue_hoy', hechos: [], rasgos_hoy: [] });
  const ps = [{ pieza: 'cap_2', texto: 'Mi mamá era la que cocinaba. Marcela bordaba conmigo.\n\nRaúl era serio. Hoy Gustavo viene los domingos.' }];
  const xs = pasados(ps, r);
  assert.deepEqual(xs.map((x) => x.personas.join()), ['Elsa', 'Marcela']); // Raúl terminó: no va; la del presente no va
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

test('sinMarcas borra también [[FICHA]] y las mixtas, y deja los corchetes que no son marcas', () => {
  assert.equal(sinMarcas('Vivo en Tandil. [[FICHA]]\n\nAbrí la mercería. [[R02, FICHA]] [nota]'), 'Vivo en Tandil.\n\nAbrí la mercería. [nota]');
});

// ---------- receta v3.2 (prueba 3.1) ----------
test('C13 v3.2: lo de hoy no va a un capítulo del pasado sin por_que_aca', () => {
  const r = reg(); r.episodios.push({ id: 'E09', que: 'mis nietos hoy', tipo: 'dato', es_escena: false, estado: 'sigue_hoy', momento_clave: '', ids: ['R14'], a_quien: 'nadie', detalles: [] });
  const p = plan(); p.capitulos[0].piezas.push({ episodio: 'E09', forma: 'media_linea' });
  assert.ok(c13(p, r).some((x) => x.includes('E09') && x.includes('es de hoy')));
  p.capitulos[0].piezas[2].por_que_aca = 'los nietos juegan con la calculadora de Raúl';
  assert.ok(!c13(p, r).some((x) => x.includes('es de hoy')));
  const q = plan(); q.capitulos[1].piezas.push({ episodio: 'E09', forma: 'media_linea' }); // el último capítulo sí
  assert.ok(!c13(q, r).some((x) => x.includes('es de hoy')));
});

test('armarCambios: borrar un párrafo no deja hueco', () => {
  const { texto } = armarCambios('Uno. [[R01]]\n\nDos. [[R02]]\n\nTres. [[R03]]', [{ problema: 1, resultado: 'cambiado', antes: 'Dos. [[R02]]', despues: '' }]);
  assert.equal(texto, 'Uno. [[R01]]\n\nTres. [[R03]]');
});

// ---------- v4 (02/10): capítulos por etapa, sin hecho fuerte ----------
test('C13 v4: sin hecho_fuerte no hay error; un momento clave con peso "linea" sí', () => {
  const p = plan(); for (const c of p.capitulos) delete c.hecho_fuerte;
  assert.ok(!c13(p, reg()).some((x) => x.includes('hecho_fuerte')));
  p.capitulos[0].piezas[1].peso = 'linea'; // E02 es momento clave
  assert.ok(c13(p, reg()).some((x) => x.includes('E02') && x.includes('momento clave')));
});

test('C12 v4: el título puede salir de cualquier id del capítulo', () => {
  const p = plan(); delete p.capitulos[0].hecho_fuerte; p.capitulos[0].titulo = { texto: 'el viaje a Córdoba', id: 'R01' };
  assert.ok(!c12(p, [{ id: 'R01', texto: 'el viaje a Córdoba en tren' }, { id: 'R02', texto: 'y no daba la cuenta, Raúl' }], reg()).some((x) => x.includes('hecho más fuerte')));
});

test('C1 v4: hasta tres recursos por pieza no son problema; el cuarto sí', () => {
  const dos = 'Raúl contaba la plata de la caja todas las noches con la calculadora.\n\nNo daba.\n\nLa Negra venía a la siesta y se quedaba hasta el cierre.\n\nY no volvió.';
  assert.deepEqual(c1({ pieza: 'cap_1', texto: dos }, []).filter((x) => /recursos/.test(x.que)), []);
  assert.deepEqual(c1({ pieza: 'cap_1', texto: `${dos}\n\nNunca más.` }, []).filter((x) => /recursos/.test(x.que)), []);
  assert.equal(c1({ pieza: 'cap_1', texto: `${dos}\n\nNunca más.\n\nY se fue.` }, []).filter((x) => /recursos/.test(x.que)).length, 1);
});

test('C28 v4: una línea de hoy al final de su párrafo pasa; en el medio o dos en el párrafo, no', () => {
  assert.deepEqual(c28({ pieza: 'cap_2', texto: 'Le pedí plata a Ivo para el disco. Hasta hoy le sigo debiendo.' }), []);
  assert.equal(c28({ pieza: 'cap_2', texto: 'Hoy Marcela tiene la llave. Raúl abrió en el 74.' }).length, 1);
  assert.equal(c28({ pieza: 'cap_2', texto: 'Raúl abrió en el 74. Hoy Marcela tiene la llave. Hoy la Negra ya no viene.' }).length, 2);
});

test('C29: el mismo nombre del registro tres veces en tres oraciones seguidas', () => {
  const t = 'Con Raúl fuimos a Córdoba. Raúl manejaba. Después Raúl se durmió.\n\nMarcela vino. Gustavo también.';
  assert.equal(c29({ pieza: 'cap_1', texto: t }, reg()).length, 1);
  assert.deepEqual(c29({ pieza: 'cap_1', texto: 'Raúl abrió. Marcela vino. Gustavo cerró.' }, reg()), []);
});

test('C18 v4: marcas por tramo; solo la última línea de la pieza tiene que tener marca', () => {
  const rs = [{ id: 'R01', texto: 'uno' }, { id: 'R02', texto: 'dos' }];
  const r = reg(); const p = plan();
  const bien = [{ pieza: 'cap_1', texto: 'Párrafo uno.\n\nPárrafo dos. [[R01,R02]]' }];
  assert.deepEqual(c18(bien, rs, r, p).filter((x) => x.tipo === 'sin_marca'), []);
  const mal = [{ pieza: 'cap_1', texto: 'Párrafo uno. [[R01,R02]]\n\nY termina sin marca.' }];
  assert.equal(c18(mal, rs, r, p).filter((x) => x.tipo === 'sin_marca').length, 1);
});

test('C7 v4: el estribillo de quien narra puede volver en otra pieza', () => {
  const ps = [{ pieza: 'cap_1', texto: 'En esa casa no se tiraba ni un botón, decía mi madre.' }, { pieza: 'cap_4', texto: 'Y en la mercería, igual: en esa casa no se tiraba ni un botón.' }];
  assert.ok(c7(ps).length > 0);
  assert.deepEqual(c7(ps, ['en esa casa no se tiraba ni un botón']), []);
});

test('C13/C19 v4: hilo de hoy con episodios; "mamá" encuentra a "su mamá" (madre)', () => {
  const r = reg(); r.personas.push({ id: 'P04', nombre: 'su mamá', apodos: [], relacion: 'madre', estado: 'sigue_hoy', hechos: [], rasgos_hoy: [] });
  r.episodios[4].a_quien_nombres = ['Gustavo', 'mamá'];
  const p = plan(); p.capitulos[1].hilo_de_hoy_ids = ['E03']; p.carta.para_personas = ['P03', 'P04']; p.faltantes = [];
  assert.ok(!c13(p, r).some((x) => x.includes('hilo de hoy')));
  assert.ok(!c20(p, r).some((x) => x.includes('su mamá')));
});

test('C13 v4: sin escenas de hoy en el registro, el hilo del último puede ser la escena más reciente', () => {
  const r = reg(); r.episodios[2].estado = 'termino'; r.hoy = [{ que: 'borda', ids: ['R99'] }]; // ya no hay escena sigue_hoy
  const p = plan(); p.capitulos[1].hilo_de_hoy_ids = ['E02'];
  assert.ok(!c13(p, r).some((x) => x.includes('hilo de hoy')));
  p.capitulos[1].hilo_de_hoy_ids = ['E04']; // balance, no es escena
  assert.ok(c13(p, r).some((x) => x.includes('hilo de hoy')));
});

test('v5: separarAfuera y destinosAfuera (lo de afuera va a un capítulo posterior o al arreglo)', async () => {
  const { separarAfuera, destinosAfuera } = await import('./lib.mjs');
  const { texto, afuera } = separarAfuera('Sumé. No daba. [[R19]]\n---\n{"afuera": [{"id": "R31", "a_donde": "cap_4", "por_que": "no empuja"}, {"id": "R40", "a_donde": "linea"}]}');
  assert.equal(texto, 'Sumé. No daba. [[R19]]');
  assert.deepEqual(destinosAfuera(afuera, 2), { pendientes: { cap_4: ['R31'] }, alArreglo: ['R40'] });
  assert.deepEqual(destinosAfuera([{ id: 'R50', a_donde: 'cap_1' }], 2), { pendientes: {}, alArreglo: ['R50'] }); // un capítulo ya escrito: al arreglo
  assert.deepEqual(separarAfuera('Sin JSON. [[R01]]').afuera, []);
});
