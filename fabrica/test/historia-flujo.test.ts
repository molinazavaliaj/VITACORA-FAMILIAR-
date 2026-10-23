// Task 1.3 del plan de «Vitácora de una historia»: el flujo sin lo propio de
// V3. El orden es el de docs/historia/banco.md, "Reglas del flujo" 3:
// COMO → HC1 (o HC1-A) → HC2 → HC3 → HC4 → las del tema → FOTO-H → HC5 → HC6
// → HC7 → HC8 → HC9 → PR-H1…PR-H3 → HC10 → FIN-H.

import { describe, expect, it } from 'vitest';
import { bancoHistoria } from '../src/historia/entrevista/banco';
import {
  alTocarBoton,
  botonFoto,
  claveRepregunta,
  FIN,
  FOTO,
  llevaM1,
  mensajesDespues,
  preguntaDeClave,
  respondioNo,
  siguientePregunta,
  type EstadoEntrevista,
  type Repregunta,
} from '../src/historia/entrevista/flujo';
import { recorrerEntrevista, simularRecorrido } from '../src/historia/entrevista/seleccion';
import { renderizar } from '../src/historia/entrevista/texto';
import { interpretar, respuestaDeBoton } from '../src/historia/entrevista/respuesta';
import { acuseDeTurno, armarTurno, preguntaSegunAcuse, vueltasEnCero } from '../src/historia/entrevista/mensajes';
import { mensajesDe } from '../src/historia/entrevista/banco';
import type { FamiliaAcuse } from '../src/historia/entrevista/flujo';
import { TEMAS_HISTORIA } from '../src/historia/entrevista/temas';

const CONTO = 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.';

describe('flujo de historia', () => {
  it('recorre la común y las del tema, sin preguntas de V3', () => {
    const banco = bancoHistoria('mudanza');
    const ids = simularRecorrido({ banco, ficha: { nombre: 'Ana', genero: 'mujer', tema: 'mudanza' }, contesta: 'todo' });
    // Desvío del plan: banco.md (regla 3) pone FOTO-H entre la última del tema y HC5.
    const preguntas = banco.preguntas.map((p) => p.id);
    expect(ids).toEqual([...preguntas.slice(0, 9), FOTO, ...preguntas.slice(9)]);
    expect(ids).toEqual(['HC1', 'HC2', 'HC3', 'HC4', 'HM1', 'HM2', 'HM3', 'HM4', 'HM5', 'FOTO-H', 'HC5', 'HC6', 'HC7', 'HC8', 'HC9', 'HC10']);
  });
  it('«paso» en todas también termina', () => {
    const banco = bancoHistoria('otra');
    const ids = simularRecorrido({ banco, ficha: { nombre: 'Ana', genero: 'varon', tema: 'otra' }, contesta: 'paso' });
    expect(ids.at(-1)).toBe(banco.preguntas.at(-1)!.id);
    expect(ids).toHaveLength(banco.preguntas.length + 1);
  });
  it('cada tema: la foto va después de la última del tema y antes de HC5 (o de su variante)', () => {
    for (const tema of TEMAS_HISTORIA) {
      const ids = simularRecorrido({ ficha: { nombre: 'Ana', genero: 'mujer', tema }, contesta: 'todo' });
      const i = ids.indexOf(FOTO);
      expect(ids[i - 1], tema).toMatch(/^H[MNEQPTO]\d$/);
      expect(ids[i + 1], tema).toMatch(/^HC5/);
      expect(ids.filter((id) => id === FOTO), tema).toHaveLength(1);
    }
  });
  it('conocimos manda HC5-Q, HC8-Q y HC9-Q en lugar de las comunes', () => {
    const ids = simularRecorrido({ ficha: { nombre: 'Ana', genero: 'mujer', tema: 'conocimos' }, contesta: 'todo' });
    expect(ids.slice(-7)).toEqual(['FOTO-H', 'HC5-Q', 'HC6', 'HC7', 'HC8-Q', 'HC9-Q', 'HC10']);
  });
  it('con tema abierto arranca por HC1-A, en vez de HC1', () => {
    const ids = simularRecorrido({ ficha: { nombre: 'Ana', genero: 'mujer', tema: 'otra', temaLibre: 'Los veranos en la chacra' }, contesta: 'todo', temaAbierto: true });
    expect(ids[0]).toBe('HC1-A');
    expect(ids).not.toContain('HC1');
  });
  it('después de HC10 va FIN-H y se termina', () => {
    const pasos = recorrerEntrevista({ ficha: { nombre: 'Ana', genero: 'mujer', tema: 'negocio' }, contesta: 'todo' });
    expect(pasos.at(-1)).toMatchObject({ tipo: 'fin', clave: FIN });
    expect(pasos.at(-2)).toMatchObject({ tipo: 'pregunta', clave: 'HC10' });
  });
  it('FIN-H sin la frase de la foto si tocó [No tengo fotos]', () => {
    const conFoto = recorrerEntrevista({ ficha: { nombre: 'Ana', genero: 'mujer', tema: 'negocio' }, contesta: 'todo' }).at(-1)!;
    const sinFoto = recorrerEntrevista({
      ficha: { nombre: 'Ana', genero: 'mujer', tema: 'negocio' },
      contesta: (clave) => (clave === FOTO ? respuestaDeBoton('No tengo fotos') : undefined),
    }).at(-1)!;
    expect(conFoto.texto).toContain('Si te quedó alguna foto');
    expect(sinFoto.texto).not.toContain('Si te quedó alguna foto');
    expect(sinFoto.texto).toContain('Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Fue un gusto');
  });
  it('M1 va en las 3 primeras preguntas y en ninguna más', () => {
    const pasos = recorrerEntrevista({ ficha: { nombre: 'Ana', genero: 'mujer', tema: 'trabajo' }, contesta: 'todo' });
    expect(pasos.filter((p) => p.conM1).map((p) => p.clave)).toEqual(['HC1', 'HC2', 'HC3']);
    const abierto = recorrerEntrevista({ ficha: { nombre: 'Ana', genero: 'mujer', tema: 'trabajo' }, contesta: 'todo', temaAbierto: true });
    expect(abierto.filter((p) => p.conM1).map((p) => p.clave)).toEqual(['HC1-A', 'HC2', 'HC3']);
    const banco = bancoHistoria('trabajo').preguntas;
    expect(llevaM1(banco[3], new Map([['HC1', 'paso'], ['HC2', 'paso'], ['HC3', 'paso']]), banco)).toBe(false);
  });
  it('la foto espera foto o audio y lleva el botón [No tengo fotos] con M31 debajo', () => {
    const banco = bancoHistoria('negocio');
    const respuestas = new Map(banco.preguntas.slice(0, 8).map((p) => [p.id, CONTO]));
    const s = siguientePregunta({ respuestas, tema: 'negocio' });
    expect(s).toEqual({ tipo: 'foto', clave: FOTO, esperaFoto: true, botones: [{ texto: 'No tengo fotos', vale: 'no' }], ayudaBotones: true });
    expect(alTocarBoton(preguntaDeClave(FOTO)!, 'No tengo fotos')).toEqual({ vale: 'no', respuesta: respuestaDeBoton('No tengo fotos') });
    expect(respondioNo(new Map([[FOTO, respuestaDeBoton('No tengo fotos')]]), FOTO)).toBe(true);
  });
  it('si la foto no llega en 24 horas (el entrevistador la anota en enviados), sigue HC5', () => {
    const banco = bancoHistoria('negocio');
    const respuestas = new Map(banco.preguntas.slice(0, 8).map((p) => [p.id, CONTO]));
    const s = siguientePregunta({ respuestas, enviados: new Set([FOTO]), tema: 'negocio' });
    expect(s).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'HC5' } });
  });
  it('el botón de la foto sale del md de cada idioma (Naza, 23/10) y lleva M31 debajo', () => {
    expect(botonFoto('es-AR')).toEqual({ texto: 'No tengo fotos', vale: 'no' });
    expect(botonFoto('es-ES')).toEqual({ texto: 'No tengo fotos', vale: 'no' });
    expect(botonFoto('ca')).toEqual({ texto: 'No tinc fotos', vale: 'no' });
    const banco = bancoHistoria('negocio', 'ca');
    const respuestas = new Map(banco.preguntas.slice(0, 8).map((p) => [p.id, CONTO]));
    expect(siguientePregunta({ respuestas, tema: 'negocio', idioma: 'ca' })).toEqual({
      tipo: 'foto',
      clave: FOTO,
      esperaFoto: true,
      botones: [{ texto: 'No tinc fotos', vale: 'no' }],
      ayudaBotones: true,
    });
    expect(respondioNo(new Map([[FOTO, respuestaDeBoton('No tinc fotos')]]), FOTO, 'ca')).toBe(true);
  });
  it('FIN-H en catalán sin la frase de la foto si tocó [No tinc fotos]', () => {
    const ficha = { nombre: 'Anna', genero: 'mujer' as const, tema: 'negocio' as const, idioma: 'ca' as const };
    const sinFoto = recorrerEntrevista({ ficha, contesta: (clave) => (clave === FOTO ? respuestaDeBoton('No tinc fotos') : undefined) }).at(-1)!;
    const conFoto = recorrerEntrevista({ ficha, contesta: 'todo' }).at(-1)!;
    expect(conFoto.texto).toContain("Si t'ha quedat alguna foto");
    expect(sinFoto.texto).not.toContain("Si t'ha quedat alguna foto");
  });
});

describe('después del cierre (HC10) no sale nada más que FIN-H', () => {
  const banco = bancoHistoria('mudanza');
  const todo = () => new Map<string, string>([...banco.preguntas.map((q) => [q.id, CONTO] as const), [FOTO, CONTO]]);
  const tarde: Repregunta = { clave: claveRepregunta('HC9'), origen: 'HC9', bloque: 6, cita: 'x', pregunta: '¿x?', tema: 'x' };

  it('una repregunta que quedó en la cola después de HC10 no sale: va FIN-H', () => {
    expect(siguientePregunta({ respuestas: todo(), tema: 'mudanza', repreguntas: [tarde] })).toEqual({ tipo: 'fin', clave: FIN });
    expect(siguientePregunta({ respuestas: todo(), enviados: new Set([FIN]), tema: 'mudanza', repreguntas: [tarde] })).toEqual({ tipo: 'terminada' });
  });
  it('una propia que no salió antes de HC10 ya no sale', () => {
    expect(siguientePregunta({ respuestas: todo(), tema: 'mudanza', propias: ['¿Y la casa?'] })).toEqual({ tipo: 'fin', clave: FIN });
  });
});

describe('preguntas de quien regala (PR-H)', () => {
  const ficha = { nombre: 'Ana', genero: 'mujer' as const, tema: 'mudanza' as const, quienRegala: 'Pablo' };

  it('con 2 propias, salen en el antepenúltimo y el anteúltimo lugar, tal cual, sin revisión', () => {
    const propias = ['¿Cómo era la casa de la abuela en Vigo?', 'qué te dijo papá en el puerto??'];
    const pasos = recorrerEntrevista({ ficha, contesta: 'todo', propias });
    const esperan = pasos.filter((p) => p.tipo !== 'fin');
    expect(esperan.map((p) => p.clave).slice(-3)).toEqual(['PR-H1', 'PR-H2', 'HC10']);
    expect(esperan.at(-3)!.texto).toBe('Esta te la manda Pablo, Ana. La dejó escrita para vos y te la paso tal cual.\n\n«¿Cómo era la casa de la abuela en Vigo?»\n\nContale a Pablo, aunque el audio me llegue a mí.');
    expect(esperan.at(-2)!.texto).toContain('«qué te dijo papá en el puerto??»');
  });
  it('con 3 propias van PR-H1, PR-H2 y PR-H3 después de HC9', () => {
    const ids = simularRecorrido({ ficha, contesta: 'todo', propias: ['a', 'b', 'c'] });
    expect(ids.slice(-5)).toEqual(['HC9', 'PR-H1', 'PR-H2', 'PR-H3', 'HC10']);
  });
  it('sin propias no va ninguna', () => {
    expect(simularRecorrido({ ficha, contesta: 'todo' }).some((id) => id.startsWith('PR-H'))).toBe(false);
  });
  it('más de 3 propias es un error (la compra deja hasta 3)', () => {
    expect(() => simularRecorrido({ ficha, contesta: 'todo', propias: ['a', 'b', 'c', 'd'] })).toThrow('hasta 3');
  });
});

describe('acuses de historia (banco.md, regla 8)', () => {
  const p = (id: string) => preguntaDeClave(id)!;

  it('después de HC10 no va acuse: FIN-H directo', () => {
    expect(mensajesDespues(p('HC10'), CONTO)).toEqual([]);
    expect(mensajesDespues(p('HC10'), 'paso')).toEqual([]);
  });
  it('M3 en una común, M4 en una sensible, M21 / M27 con paso', () => {
    expect(mensajesDespues(p('HC2'), CONTO)).toEqual(['M3']);
    expect(mensajesDespues(p('HC5'), CONTO)).toEqual(['M4']);
    expect(mensajesDespues(p('HC8-T'), CONTO)).toEqual(['M4']);
    expect(mensajesDespues(p('HC2'), 'paso')).toEqual(['M21']);
    expect(mensajesDespues(p('HE2'), 'paso')).toEqual(['M27']);
  });
  it('la foto y las propias llevan los acuses comunes', () => {
    expect(mensajesDespues(p(FOTO), respuestaDeBoton('No tengo fotos'))).toEqual(['M25']);
    expect(mensajesDespues(p(FOTO), CONTO)).toEqual(['M3']);
    expect(mensajesDespues(p('PR-H1'), CONTO)).toEqual(['M3']);
  });
  it('al tercer olvido seguido, M29 una sola vez', () => {
    const anteriores = new Map([['HC1', 'No me acuerdo.'], ['HC2', 'No me acuerdo.']]);
    expect(mensajesDespues(p('HC3'), 'No me acuerdo.', anteriores)).toEqual(['M29']);
    const despues = new Map([...anteriores, ['HC3', 'No me acuerdo.']]);
    expect(mensajesDespues(p('HC4'), 'No me acuerdo.', despues)).toEqual(['M28']);
  });
});

describe('repreguntas del cazador en el flujo', () => {
  const r: Repregunta = { clave: claveRepregunta('HC2'), origen: 'HC2', bloque: 1, cita: 'una ocurrencia', pregunta: '¿Qué pasó ese día?', tema: 'la ocurrencia' };

  it('sale después de 3 respuestas del banco y nunca dos seguidas', () => {
    const e = (ids: string[]): EstadoEntrevista => ({ respuestas: new Map(ids.map((id) => [id, CONTO])), tema: 'mudanza', repreguntas: [r] });
    expect(siguientePregunta(e(['HC1', 'HC2', 'HC3', 'HC4'])).tipo).toBe('pregunta');
    expect(siguientePregunta(e(['HC1', 'HC2', 'HC3', 'HC4', 'HM1'])).tipo).toBe('repregunta');
  });
  it('antes de HC10 salen todas las que queden', () => {
    const banco = bancoHistoria('mudanza');
    const respuestas = new Map([...banco.preguntas.slice(0, -1).map((q) => [q.id, CONTO] as const), [FOTO, CONTO] as const]);
    const tarde: Repregunta = { ...r, clave: claveRepregunta('HC9'), origen: 'HC9', bloque: 6 };
    expect(siguientePregunta({ respuestas, tema: 'mudanza', repreguntas: [tarde] })).toMatchObject({ tipo: 'repregunta', repregunta: { origen: 'HC9' } });
  });
});

describe('texto de historia', () => {
  it('{{historia}}: lo que escribió, o la etiqueta del tema en minúscula inicial', () => {
    expect(renderizar('sobre {{historia}}', { nombre: 'Ana', genero: 'mujer', tema: 'padres' })).toBe('sobre el primer hijo');
    expect(renderizar('sobre {{historia}}', { nombre: 'Ana', genero: 'mujer', tema: 'otra', temaLibre: '  los veranos en la chacra ' })).toBe('sobre los veranos en la chacra');
    expect(renderizar('sobre {{historia}}', { nombre: 'Ana', genero: 'mujer', tema: 'mudanza', idioma: 'ca' })).toBe('sobre anar a viure lluny');
  });
  it('género: {{o/a}} y la palabra entera del catalán', () => {
    expect(renderizar('sol{{o/a}}', { nombre: 'Ana', genero: 'mujer', tema: 'otra' })).toBe('sola');
    expect(renderizar('{{sol/sola}}', { nombre: 'Juan', genero: 'varon', tema: 'otra', idioma: 'ca' })).toBe('sol');
  });
  it('la primera pregunta real, renderizada', () => {
    const [primera] = recorrerEntrevista({ ficha: { nombre: 'Marta', genero: 'mujer', tema: 'mudanza' }, contesta: 'todo' });
    expect(primera.texto).toMatch(/^Empecemos por el antes, Marta\. Este libro es sobre irse a vivir lejos, pero/);
  });
});

describe('cómo se arma el turno (mensajes.ts)', () => {
  const p = (id: string) => preguntaDeClave(id)!;

  it('M3 pasa a M26 delante del cierre o de una sensible, no delante de una común', () => {
    expect(acuseDeTurno('M3', 0, '…', p('HC10'))).toBe('M26');
    expect(acuseDeTurno('M3', 0, '…', p('HC5'))).toBe('M26');
    expect(acuseDeTurno('M3', 0, '…', p('HC2'))).toBe('M3.1');
    expect(acuseDeTurno('M3', 1, '…', p(FOTO))).toBe('M3.2');
    expect(acuseDeTurno('M32', 0, '…', p('HC10'))).toBe('M26');
    expect(acuseDeTurno('M28.4', 1, '…', p('HC3'))).toBe('M28.5');
  });
  it('las vueltas no traen M24 (no se usa en historia)', () => {
    expect(Object.keys(vueltasEnCero())).not.toContain('M24');
  });
  it('M4 va solo; los demás, pegados arriba de lo que sigue, con M1 y M31 debajo', () => {
    expect(armarTurno({ acuse: 'Gracias.', familia: 'M4', pregunta: 'P' })).toEqual(['Gracias.', 'P']);
    expect(armarTurno({ acuse: 'Bien, seguimos.', familia: 'M25', pregunta: 'P', m1: '_M1_', ayuda: '_M31_' })).toEqual(['Bien, seguimos.\nP\n_M1_\n_M31_']);
  });
  it('FOTO-H va sin el nombre si el acuse pegado ya lo dice', () => {
    const foto = preguntaDeClave(FOTO)!.texto!;
    expect(preguntaSegunAcuse(FOTO, foto, 'Gracias, {{nombre}}. Ya lo guardé.')).toMatch(/^Otra cosa\. ¿Tenés fotos/);
    expect(preguntaSegunAcuse(FOTO, foto, 'Te escuché. Vamos con la que sigue.')).toMatch(/^Otra cosa, \{\{nombre\}\}\./);
    expect(preguntaSegunAcuse('HC5', '{{nombre}}, x', 'Gracias, {{nombre}}.')).toBe('{{nombre}}, x');
  });
  it('todos los acuses que puede elegir el flujo existen en banco.md, en los tres idiomas', () => {
    const familias: FamiliaAcuse[] = ['M3', 'M4', 'M21', 'M25', 'M26', 'M27', 'M28', 'M28.4', 'M29', 'M32'];
    for (const idioma of ['es-AR', 'es-ES', 'ca'] as const) {
      const ids = new Set(mensajesDe(idioma).map((m) => m.id));
      for (const f of familias) for (let n = 0; n < 8; n++) for (const sig of [p('HC2'), p('HC5'), p('HC10')]) {
        expect(ids.has(acuseDeTurno(f, n, 'Seguimos', sig)), `${idioma} ${f} ${n}`).toBe(true);
      }
      for (const id of ['M1', 'M31', 'M22', 'M23', 'M8', 'M9', 'COMO', 'FOTO-H', 'FIN-H', 'PR-H1', 'PR-H2', 'PR-H3']) expect(ids.has(id), `${idioma} ${id}`).toBe(true);
    }
  });
});

describe('el detector en historia (respuesta.ts)', () => {
  const p = (id: string) => preguntaDeClave(id)!;
  it('el "no" corto: hasta 15 palabras en una común y hasta 40 en el cierre y las sensibles', () => {
    const largo = 'No, ' + Array.from({ length: 20 }, () => 'nada').join(' ');
    expect(interpretar(p('HC2'), largo)).toBe('conto');
    expect(interpretar(p('HC5'), largo)).toBe('no');
    expect(interpretar(p('HC10'), largo)).toBe('no');
  });
  it('"Ya está, eso es todo." en el cierre es un "no"; en una común no es fórmula de cierre', () => {
    expect(interpretar(p('HC10'), 'Ya está, eso es todo.')).toBe('no');
    expect(interpretar(p('HC10'), 'Nada más, que me acordé de algo: mi tío tenía un taller')).toBe('conto');
  });
  it('paso, olvido y botones en los tres idiomas', () => {
    expect(interpretar(p('HC3'), 'Paso.')).toBe('paso');
    expect(interpretar(p('HC3'), 'Passo.', 'ca')).toBe('paso');
    expect(interpretar(p('HC3'), 'No me acuerdo.', 'es-ES')).toBe('olvido');
    expect(interpretar(p(claveRepregunta('HC3')), respuestaDeBoton('Ya lo conté todo'))).toBe('no');
  });
});
