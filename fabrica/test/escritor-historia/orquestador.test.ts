// Task 5.2 del plan de «Vitácora de una historia»: el material y el orquestador del escritor, con un modelo falso
// (ninguna llamada real) y una historia inventada.
import { describe, expect, it } from 'vitest';
import { Carpeta } from '../../src/escritor/carpeta.js';
import { salida } from '../../src/escritor/lectura.js';
import { controlarHistoria } from '../../src/escritor-historia/controles.js';
import { llamadaCapitulo, llamadaEstilo, llamadaRegistro } from '../../src/escritor-historia/llamadas.js';
import { carpetaDeHistoria, materialDe } from '../../src/escritor-historia/material/carpeta.js';
import { entrevistaDeFilaHistoria, limpiarEntrevista } from '../../src/escritor-historia/material/de-base.js';
import { filasDeHistoria } from '../../src/escritor-historia/material/filas.js';
import { correrHistoria, etapaAHistoria } from '../../src/escritor-historia/orquestador.js';
import { armarHistoria, PLAN, REGISTRO, RUBEN, salidasRuben } from './ayuda.js';

const conRegistroYPlan = (c: Carpeta, reg: unknown = REGISTRO, plan: unknown = PLAN): Carpeta => {
  c.escribir(salida('registro.json'), JSON.stringify(reg));
  c.escribir(salida('plan.json'), JSON.stringify(plan));
  return c;
};

describe('material de historia', () => {
  it('trae el tema, la historia en sus palabras y quién regala, en material.json y en la ficha', () => {
    const c = carpetaDeHistoria(RUBEN);
    expect(materialDe(c)).toMatchObject({ nombre: 'Rubén', tema: 'mudanza', etiqueta: 'Irse a vivir lejos', temaLibre: 'cuando me fui a Valencia con la valija verde', quienRegala: 'Fede' });
    const ficha = c.leer('entradas/ficha.xml');
    expect(ficha).toContain('Tema: Irse a vivir lejos');
    expect(ficha).toContain('La historia, en sus palabras: cuando me fui a Valencia con la valija verde');
    expect(ficha).toContain('Quién regala: Fede');
    expect(ficha).toContain('Trato: vos');
  });

  it('sin temaLibre en la ficha, la historia en sus palabras es lo que contestó en TEMA-ABIERTO', () => {
    const m = materialDe(carpetaDeHistoria({ ...RUBEN, ficha: { ...RUBEN.ficha, tema: 'otra', temaLibre: undefined }, respuestas: [['TEMA', 'La vez que me fui a Valencia'], ...RUBEN.respuestas] }));
    expect(m).toMatchObject({ tema: 'otra', etiqueta: 'Otra historia', temaLibre: 'La vez que me fui a Valencia' });
    expect(m.filas[0]).toMatchObject({ id: 'R01', clave: 'TEMA', paso: false });
    expect(m.filas[0].origen).toContain('pregunta TEMA-ABIERTO');
  });

  it('el origen dice el tramo, quién dejó la pregunta y la foto; la repregunta va pegada; las «paso» quedan afuera', () => {
    const filas = filasDeHistoria(RUBEN);
    const por = Object.fromEntries(filas.map((f) => [f.clave, f]));
    expect(por.HC1.origen).toBe('pregunta HC1 (tramo: antes)');
    expect(por.HC3).toMatchObject({ id: 'R03', tramo: 'comienzo', pregunta: '¿Cómo empezó todo?' });
    expect(por.HM1.tramo).toBe('tema');
    expect(por.HC5.texto).toContain('Volví caminando');
    expect(filas.some((f) => f.clave === 'RP~HC5')).toBe(false);
    expect(por['PR-H1']).toMatchObject({ pregunta: '¿Por qué vendiste la guitarra y no me dijiste nada?', origen: 'pregunta PR-H1 (la dejó escrita Fede)' });
    expect(por.HC10.tramo).toBe('cierre');
    expect(por.HC2.paso).toBe(true);
    expect(por['FOTO-H'].paso).toBe(true);
    const xml = carpetaDeHistoria(RUBEN).leer('entradas/respuestas.xml');
    expect(xml).not.toContain('id="R02"');
    expect(xml).not.toContain('id="R11"');
    expect(xml).toContain('origen="pregunta PR-H1 (la dejó escrita Fede)"');
  });

  it('una foto con lo que contó entra, con el aviso de que la imagen no está', () => {
    const filas = filasDeHistoria({ ...RUBEN, respuestas: [['FOTO-H', '⟦foto⟧\n\nEs la valija en el puerto.']] });
    expect(filas[0]).toMatchObject({ paso: false, texto: 'Es la valija en el puerto.' });
    expect(filas[0].origen).toContain('la imagen no está en este material');
  });

  it('desde la base: suma lo abierto del borrador y saca lo reservado (con su repregunta) y lo sacado desde el panel', () => {
    const e = entrevistaDeFilaHistoria({
      narrador_id: 'n1', idioma: 'es-AR', ficha: RUBEN.ficha,
      estado: { respuestas: [['HC1', 'Uno.'], ['HC5', 'Lo difícil.'], ['RP~HC5', 'Más de lo difícil.'], ['HC7', 'Dos. Tres.']], esperando: 'HC8', borrador: 'Lo del después.', charla: [{ de: 'persona', pregunta: 'HC1', texto: 'Uno.' }] },
    });
    expect(e.respuestas.at(-1)).toEqual(['HC8', 'Lo del después.']);
    expect(e.charla).toEqual([]);
    const filas = [{ id: 'f7a', clave_historia: 'HC7', transcripcion: 'Dos.' }, { id: 'f7b', clave_historia: 'HC7', transcripcion: 'Tres.' }];
    const limpia = limpiarEntrevista(e, filas, new Set(['f7a']), new Set(['HC5']));
    expect(limpia.respuestas).toEqual([['HC1', 'Uno.'], ['HC7', 'Tres.'], ['HC8', 'Lo del después.']]);
  });
});

describe('controles de historia', () => {
  it('el registro y el plan de prueba pasan C14 y C12/C13/C19/C20/C33', () => {
    const c = conRegistroYPlan(carpetaDeHistoria(RUBEN));
    expect(controlarHistoria(c, 'registro').resumen).toBe('registro: ok');
    expect(controlarHistoria(c, 'plan').resumen).toBe('plan: ok');
  });

  it('C14: tramo y a_quien de historia, sin balance, y cada respuesta de quien regala en "propias"', () => {
    const reg = structuredClone(REGISTRO) as typeof REGISTRO & { episodios: Record<string, unknown>[] };
    reg.episodios[0].tramo = 'infancia';
    reg.episodios[1].tipo = 'balance';
    reg.propias = [];
    const r = controlarHistoria(conRegistroYPlan(carpetaDeHistoria(RUBEN), reg), 'registro').problemas;
    expect(r).toContain('C14 episodio E01: tramo tiene que ser antes, comienzo, tema, dificil, giro, despues, cierre');
    expect(r.some((x: string) => x.startsWith('C14 episodio E02: en este libro no hay "balance"'))).toBe(true);
    expect(r).toContain('C14 propias: R09 es una respuesta a una pregunta de quien regala y no está en "propias"');
    // a_quien "quien_era" no es un error, y dos frases de voz valen si no hay más.
    expect(r.some((x: string) => /a_quien|C14 voz/.test(x))).toBe(false);
  });

  it('C13 y C19: de 4 a 6 capítulos, un solo golpe, la carta es a quien era y lo de quien regala va a un capítulo', () => {
    const plan = structuredClone(PLAN) as typeof PLAN & { capitulos: Record<string, unknown>[] };
    plan.capitulos[1].golpe = { episodio: 'E04', preparacion: [], frase_id: 'R05' };
    plan.carta.ids = [];
    const r = controlarHistoria(conRegistroYPlan(carpetaDeHistoria(RUBEN), REGISTRO, { ...plan, capitulos: plan.capitulos.slice(0, 3).concat(plan.capitulos.slice(3)) }), 'plan').problemas;
    expect(r.some((x: string) => x.startsWith('C13: 2 capítulos tienen golpe'))).toBe(true);
    expect(r).toContain('C19: el episodio E08 le habla a quien era y no está entero en carta.ids');
    const corto = { ...PLAN, capitulos: PLAN.capitulos.slice(2) };
    expect(controlarHistoria(conRegistroYPlan(carpetaDeHistoria(RUBEN), REGISTRO, corto), 'plan').problemas.some((x: string) => x.startsWith('C13: el plan tiene 2 capítulos (van de 4 a 6'))).toBe(true);
  });
});

describe('llamadas de historia', () => {
  it('el capítulo lleva <hilo_libro>, el golpe solo donde va, la voz al final y los huecos llenos', () => {
    const c = conRegistroYPlan(carpetaDeHistoria(RUBEN));
    const l3 = llamadaCapitulo(c, 3), l1 = llamadaCapitulo(c, 1);
    const docs = l3.docs.map((d) => d.match(/^<(\w+)>/)?.[1]);
    expect(docs).toEqual(['ficha', 'respuestas', 'hilo_libro', 'golpe', 'para_preparar', 'resumen_hasta_aca', 'voz']);
    expect(l1.docs.some((d) => d.startsWith('<golpe>'))).toBe(false);
    expect(l3.instr).toContain('Rubén contó en una entrevista oral sobre cuando me fui a Valencia con la valija verde');
    expect(l3.instr).toContain('Este es el capítulo 3, la noche de la guitarra.');
    expect(l3.docs.join('\n')).toContain('origen="pregunta PR-H1 (la dejó escrita Fede)"');
    expect(l3.docs.join('\n')).toContain('El hilo del libro: Rubén se va de Bahía Blanca');
    expect(`${l3.docs.join('\n')}${l3.instr}`).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });

  it('los bloques de idioma: catalán al capítulo, España al corrector; en rioplatense ninguno', () => {
    const ca = conRegistroYPlan(carpetaDeHistoria({ ...RUBEN, idioma: 'ca' }));
    ca.escribir(salida('capitulo_01.md'), 'Text. [[R01]]');
    expect(llamadaCapitulo(ca, 1).instr).toContain('IDIOMA DEL LIBRO: CATALÁN. Todo el texto');
    const es = conRegistroYPlan(carpetaDeHistoria({ ...RUBEN, idioma: 'es-ES' }));
    es.escribir(salida('capitulo_01.md'), 'Texto. [[R01]]');
    expect(llamadaEstilo(es, 'cap_1', 1).instr).toContain('IDIOMA DEL LIBRO: CASTELLANO DE ESPAÑA. La pieza está');
    expect(llamadaCapitulo(es, 1).instr).toContain('IDIOMA DEL LIBRO: CASTELLANO DE ESPAÑA. Quien narra');
    expect(llamadaRegistro(conRegistroYPlan(carpetaDeHistoria(RUBEN))).instr).not.toContain('IDIOMA DEL LIBRO');
  });
});

describe('correrHistoria', () => {
  it('hace las llamadas en el orden de la receta, sin llamadas reales, y deja libro.md en el almacén', async () => {
    const { x, modelo, almacen } = armarHistoria();
    const r = await correrHistoria(x);
    expect(r).toMatchObject({ estado: 'listo', capitulos: 4 });
    const claves = modelo.llamadas.map((p) => p.clave);
    const escritura = [1, 2, 3, 4].flatMap((n) => [`C/2h-armador-0${n}`, `C/3b-capitulo-0${n}`, `C/3r-resumen-cap_${n}`]);
    expect(claves.slice(0, 3 + escritura.length + 2)).toEqual(['A/1-registro', 'A/2-plan', 'A/dudas', ...escritura, 'C/3c-carta', 'C/3e-sus-frases']);
    const resto = claves.slice(3 + escritura.length + 2);
    const piezas = ['cap_1', 'cap_2', 'cap_3', 'cap_4', 'carta'];
    for (const k of ['C/4-hechos', 'C/5c-veedor', ...piezas.flatMap((p) => [`C/7-estilo-${p}`, `C/7-estilo-${p}-2`]), 'C/3t-titulo-01', 'C/3t-titulo-04']) expect(resto, k).toContain(k);
    expect(claves.some((k) => /primera|antes-de-cerrar|lectura/.test(k))).toBe(false);
    // Lo que no es de Familiar llega a los prompts: la línea fija de historia y las instrucciones de la receta de historia.
    expect(modelo.llamadas[0].bloques.join('\n')).toContain('Este libro cuenta una sola historia');

    const libro = (await almacen.leer('libro.md')) as string;
    expect(libro.split('\n').filter((l) => l.startsWith('# '))).toEqual(['# La valija verde', '# I · El taller de mi viejo', '# II · La valija verde', '# III · La guitarra', '# IV · La playa de la Malvarrosa', '# A quien era antes', '# Sus frases']);
    expect(libro).toContain('lo que importa te entra en la mano');
    expect(libro).not.toContain('la valija pesaba poco');
    expect(libro).not.toContain('[[R');
    const informe = (await almacen.leer('informe.md')) as string;
    expect(informe).toContain('## Sus frases: 4 textuales');
    expect(informe).toContain('no pasa C6 (no es textual) · R08');
    for (const k of ['dudas-familia.json', 'carpeta-A.json', 'carpeta-B.json', 'carpeta-C.json', 'costos.json']) expect(await almacen.leer(k), k).not.toBeNull();
  });

  it('con menos de 4 frases que pasan C6, Sus frases no va; sin carta.ids no hay carta', async () => {
    const plan = { ...PLAN, carta: { ...PLAN.carta, ids: [] } };
    const reg = { ...REGISTRO, episodios: REGISTRO.episodios.map((e) => (e.id === 'E08' ? { ...e, tipo: 'reflexion', a_quien: 'nadie' } : e)) };
    plan.capitulos = PLAN.capitulos.map((k) => (k.n === 4 ? { ...k, piezas: [...k.piezas, { episodio: 'E08', forma: 'remate', peso: 'linea', por_que_aca: '' }] } : k));
    const { x, modelo, almacen } = armarHistoria({ salidas: { ...salidasRuben(), '1-registro': JSON.stringify(reg), '2-plan': JSON.stringify(plan), '3e-sus-frases': '{"frases": [{"id": "R05", "texto": "era una pieza, pero era nuestra"}]}' } });
    expect((await correrHistoria(x)).estado).toBe('listo');
    expect(modelo.llamadas.some((p) => p.clave === 'C/3c-carta')).toBe(false);
    const titulos = ((await almacen.leer('libro.md')) as string).split('\n').filter((l) => l.startsWith('# '));
    expect(titulos.some((t) => /A quien era antes|Sus frases/.test(t))).toBe(false);
    expect(await almacen.leer('informe.md')).toContain('la página no va');
  });

  it('un plan que no pasa sus controles se pide otra vez con el error, y a los dos reintentos la etapa falla', async () => {
    const malo = JSON.stringify({ ...PLAN, capitulos: PLAN.capitulos.slice(0, 2) });
    const { x, modelo } = armarHistoria({ salidas: { '2-plan': malo } });
    const r = await etapaAHistoria(x);
    expect(r).toEqual({ ok: false, motivo: 'el plan no pasa C12/C13/C19/C20/C33 después de 2 reintentos' });
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/2-plan', 'A/2-plan#2', 'A/2-plan#3']);
    expect(modelo.llamadas[2].bloques.join('\n')).toContain('C13: el plan tiene 2 capítulos');
  });
});
