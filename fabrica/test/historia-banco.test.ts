// Task 1.2 del plan de «Vitácora de una historia»: el banco cargado por idioma
// y los json al día con los md (docs/historia/banco.md, idiomas/, temas.md).

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import bancoJson from '../src/historia/entrevista/banco.json';
import bancoCaJson from '../src/historia/entrevista/banco-ca.json';
import bancoEsEsJson from '../src/historia/entrevista/banco-es-ES.json';
import temasJson from '../src/historia/entrevista/temas.json';
import { armarConTextos, bancoHistoria, comprobarTextos, mensajePorId, mensajesDe, nombreDelTema, preguntaPorId } from '../src/historia/entrevista/banco';
import { parsearEntrevistaMd } from '../src/historia/entrevista/banco-md';
import { parsearTextosIdiomaMd, type TextosIdioma } from '../src/historia/entrevista/banco-idioma-md';
import { parsearTemasMd } from '../src/historia/entrevista/temas-md';
import { TEMAS_HISTORIA } from '../src/historia/entrevista/temas';
import type { Idioma } from '../src/historia/entrevista/idioma';

const leer = (ruta: string) => readFileSync(ruta, 'utf8');

describe('banco de historia', () => {
  it('cada tema arranca por la parte común', () => {
    const b = bancoHistoria('mudanza');
    expect(b.preguntas[0].tema).toBe('comun');
  });
  it('los tres idiomas tienen las mismas preguntas', () => {
    const ids = (i?: Idioma) => bancoHistoria('mudanza', i).preguntas.map((p) => p.id);
    expect(ids('ca')).toEqual(ids());
    expect(ids('es-ES')).toEqual(ids());
  });
  it('con tema abierto va HC1-A en los tres idiomas', () => {
    for (const idioma of ['es-AR', 'ca', 'es-ES'] as const) {
      expect(bancoHistoria('negocio', idioma, { temaAbierto: true }).preguntas[0].id).toBe('HC1-A');
    }
  });
  it('en otro idioma cambian los textos y no la estructura', () => {
    const ar = bancoHistoria('conocimos');
    const ca = bancoHistoria('conocimos', 'ca');
    expect(ca.preguntas.map(({ texto: _t, ...resto }) => resto)).toEqual(ar.preguntas.map(({ texto: _t, ...resto }) => resto));
    expect(ca.preguntas[0].texto).toMatch(/^Comencem/);
    expect(bancoHistoria('conocimos', 'es-ES').preguntas[0].texto).toMatch(/tú ya tenías/);
    expect(mensajePorId('COMO', 'ca')!.texto).toMatch(/^Funciona així/);
    expect(mensajesDe('es-ES').map((m) => m.id)).toEqual(mensajesDe().map((m) => m.id));
  });
  it('preguntaPorId encuentra también las variantes con guion', () => {
    expect(preguntaPorId('HC8-Q')).toMatchObject({ tema: 'conocimos', reemplaza: 'HC8', bloque: 6, sensible: true });
    expect(preguntaPorId('HC1-A', 'ca')!.texto).toMatch(/^Comencem/);
  });
  it('con un texto que falta en otro idioma, error (nunca se manda castellano en catalán)', () => {
    const t = parsearTextosIdiomaMd(leer('../docs/historia/idiomas/banco-ca.md'));
    const sinHc8q: TextosIdioma = { ...t, preguntas: Object.fromEntries(Object.entries(t.preguntas).filter(([id]) => id !== 'HC8-Q')) };
    expect(() => armarConTextos('ca', sinHc8q)).toThrow('ca: falta el texto de HC8-Q');
    const sinFoto: TextosIdioma = { ...t, mensajes: Object.fromEntries(Object.entries(t.mensajes).filter(([id]) => id !== 'FOTO-H')) };
    expect(() => armarConTextos('ca', sinFoto)).toThrow('ca: falta el texto de FOTO-H');
    expect(() => comprobarTextos('es-ES', { ...t, repregunta: { mensaje: '', boton: '' } })).toThrow('es-ES: faltan los textos');
  });
});

describe('el banco real en los tres idiomas', () => {
  const real = parsearEntrevistaMd(leer('../docs/historia/banco.md'));
  const ids = [...real.preguntas.map((p) => p.id), ...real.mensajes.map((m) => m.id)];

  it('son 94 IDs: 50 preguntas y 44 mensajes', () => {
    expect(real.preguntas).toHaveLength(50);
    expect(real.mensajes).toHaveLength(44);
    expect(new Set(ids).size).toBe(94);
  });
  for (const idioma of ['es-ES', 'ca'] as const) {
    it(`los 94 tienen texto en banco-${idioma}.md, y no sobra ninguno`, () => {
      const t = parsearTextosIdiomaMd(leer(`../docs/historia/idiomas/banco-${idioma}.md`));
      const conTexto = { ...t.preguntas, ...t.mensajes };
      expect(ids.filter((id) => !conTexto[id]?.trim())).toEqual([]);
      expect(Object.keys(t.preguntas).sort()).toEqual(real.preguntas.map((p) => p.id).sort());
      expect(Object.keys(t.mensajes).sort()).toEqual(real.mensajes.map((m) => m.id).sort());
      expect(t.repregunta.mensaje).toContain('{cita}');
    });
  }
});

describe('nombreDelTema ({{historia}})', () => {
  it('la etiqueta de temas.md en minúscula inicial', () => {
    expect(nombreDelTema('mudanza', 'es-AR')).toBe('irse a vivir lejos');
    expect(nombreDelTema('padres', 'es-AR')).toBe('el primer hijo');
    expect(nombreDelTema('mudanza', 'es-ES')).toBe('irse a vivir fuera');
    expect(nombreDelTema('negocio', 'ca')).toBe('el negoci propi');
  });
  it('todos los temas tienen etiqueta en los tres idiomas', () => {
    for (const tema of TEMAS_HISTORIA) for (const idioma of ['es-AR', 'es-ES', 'ca'] as const) expect(nombreDelTema(tema, idioma)).not.toBe('');
  });
});

describe('los json están al día con los md (si falla: cd fabrica && npx tsx scripts/historia-json.ts)', () => {
  it('banco.json = docs/historia/banco.md', () => {
    expect(bancoJson).toEqual(parsearEntrevistaMd(leer('../docs/historia/banco.md')));
  });
  it('banco-ca.json = docs/historia/idiomas/banco-ca.md', () => {
    expect(bancoCaJson).toEqual(parsearTextosIdiomaMd(leer('../docs/historia/idiomas/banco-ca.md')));
  });
  it('banco-es-ES.json = docs/historia/idiomas/banco-es-ES.md', () => {
    expect(bancoEsEsJson).toEqual(parsearTextosIdiomaMd(leer('../docs/historia/idiomas/banco-es-ES.md')));
  });
  it('temas.json = docs/historia/temas.md', () => {
    expect(temasJson).toEqual(parsearTemasMd(leer('../docs/historia/temas.md')));
  });
});
