import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BANCO } from '../src/kids-v2/banco.js';
import { armarGuion, fotoDelItem, PREGUNTA_DEL_TEMA, temaDeExtra, TEMAS, validarFicha, type Ficha, type ItemGuion } from '../src/kids-v2/compra.js';
import { extrasDisponibles, type HistorialExtras } from '../src/kids-v2/extras.js';
import { FICHA } from './kids-v2-ayuda.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MENSAJES_MD = readFileSync(path.join(RAIZ, 'docs', 'kids', 'v2', 'mensajes.md'), 'utf8');

const claves = (g: ItemGuion[]) => g.map((x) => x.clave);
const principal = (g: ItemGuion[], k: string) => g.find((x) => x.clave === k)!;
const NADA: HistorialExtras = { opsUsadas: [], extrasUsadas: [], hermanos: null, peleaK36: false };

describe('kids v2: la ficha de la compra', () => {
  it('normaliza: "Tu mamá" en minúscula, temas sin repetir, preguntas del padre sin vacías', () => {
    const f = validarFicha({ ...FICHA, quienRegala: 'Tus Abuelos', temasSacados: ['mama', 'mama'], preguntasPadre: [{ texto: '  Contame algo ', conLinea: true }, { texto: ' ', conLinea: false }] });
    expect(f.quienRegala).toBe('tus Abuelos');
    expect(f.temasSacados).toEqual(['mama']);
    expect(f.preguntasPadre).toEqual([{ texto: 'Contame algo', conLinea: true }]);
  });

  it('rechaza lo que no puede andar: hora de noche, zona inventada, más de 3 preguntas, campos vacíos', () => {
    expect(() => validarFicha({ ...FICHA, hora: '22:00' })).toThrow(/hora/);
    expect(() => validarFicha({ ...FICHA, hora: '08:59' })).toThrow(/hora/);
    expect(validarFicha({ ...FICHA, hora: '09:00' }).hora).toBe('09:00');
    expect(() => validarFicha({ ...FICHA, zona: 'Marte/Olympus' })).toThrow(/zona/);
    expect(() => validarFicha({ ...FICHA, preguntasPadre: Array(4).fill({ texto: 'x', conLinea: true }) })).toThrow(/3/);
    expect(() => validarFicha({ ...FICHA, apodo: ' ' })).toThrow(/apodo/);
    expect(() => validarFicha({ ...FICHA, temasSacados: ['separacion' as never] })).toThrow(/tema/);
  });

  it('los temas sacan lo que dice mensajes.md §8', () => {
    const tabla = MENSAJES_MD.slice(MENSAJES_MD.indexOf('| Tema marcado | Qué no sale |'));
    for (const [tema, k] of Object.entries(PREGUNTA_DEL_TEMA)) expect(tabla, tema).toMatch(new RegExp(`\\| [^|]+ \\| ${k}\\b`));
    expect(TEMAS).toHaveLength(6);
    expect(BANCO.extras.filter((x) => temaDeExtra(x) === 'mama').map((x) => x.id)).toEqual(['X2-1', 'X2-2', 'X2-3', 'X2-4']);
    expect(BANCO.extras.filter((x) => temaDeExtra(x) === 'papa').map((x) => x.id)).toEqual(['X2-5', 'X2-6', 'X2-7', 'X2-8']);
    expect(BANCO.extras.filter((x) => temaDeExtra(x) === 'escuela').map((x) => x.id)).toEqual(['X3-2']);
  });
});

describe('kids v2: el guion efectivo', () => {
  const g = armarGuion(validarFicha(FICHA));

  it('sin temas sacados: las 47 en orden, con "una más" y cierre en los caps. 1 a 4, y al final cierre, extras y final', () => {
    expect(g.filter((x) => x.tipo === 'principal')).toHaveLength(47);
    expect(claves(g).slice(8, 12)).toEqual(['K9', 'UNA-MAS-1', 'CIERRE-1', 'K10']);
    expect(claves(g).slice(-4)).toEqual(['K47', 'CIERRE-FINAL', 'EXTRAS', 'FINAL']);
    expect(g.filter((x) => x.tipo === 'principal' && x.primeraDelCap).map((x) => x.clave)).toEqual(['K1', 'K10', 'K21', 'K31', 'K41']);
    expect(g.filter((x) => x.tipo === 'principal' && x.ultimaDelCap).map((x) => x.clave)).toEqual(['K9', 'K20', 'K30', 'K40', 'K47']);
    expect(fotoDelItem(principal(g, 'K10'))?.de).toBe('K10');
    expect(fotoDelItem(principal(g, 'K5'))).toBeNull();
  });

  it('las preguntas del padre van después de CIERRE-4 y antes de K41', () => {
    const conPadre = armarGuion(validarFicha({ ...FICHA, preguntasPadre: [{ texto: 'A', conLinea: true }, { texto: 'B', conLinea: false }] }));
    const i = claves(conPadre).indexOf('CIERRE-4');
    expect(claves(conPadre).slice(i, i + 4)).toEqual(['CIERRE-4', 'PADRE-1', 'PADRE-2', 'K41']);
    expect(conPadre[i + 2]).toMatchObject({ tipo: 'padre', texto: 'B', conLinea: false });
  });

  it('un tema sacado no sale, y su foto pasa a la siguiente principal del capítulo sin foto', () => {
    const sinMama = armarGuion(validarFicha({ ...FICHA, temasSacados: ['mama'] }));
    expect(claves(sinMama)).not.toContain('K10');
    expect(principal(sinMama, 'K11').primeraDelCap).toBe(true);
    expect(fotoDelItem(principal(sinMama, 'K16'))?.de).toBe('K10');

    const todos = armarGuion(validarFicha({ ...FICHA, temasSacados: [...TEMAS] }));
    expect(claves(todos).filter((k) => /^K\d+$/.test(k))).toHaveLength(42);
    for (const k of ['K10', 'K11', 'K13', 'K18', 'K38']) expect(claves(todos), k).not.toContain(k);
    expect(claves(todos)).toContain('K14'); // abuelo que murió saca K13 pero no K14, a propósito
    expect(fotoDelItem(principal(todos, 'K16'))?.de).toBe('K10');
    expect(fotoDelItem(principal(todos, 'K17'))?.de).toBe('K11');
    expect(fotoDelItem(principal(todos, 'K19'))?.de).toBe('K13');
    expect(todos.filter((x) => fotoDelItem(x)).length).toBe(16); // ninguna foto se pierde
  });
});

describe('kids v2: extras disponibles', () => {
  const f = validarFicha(FICHA);

  it('una OP que ya salió no vuelve como extra; las de hermanos solo si tiene; la de la pelea solo si la contó', () => {
    expect(extrasDisponibles(f, NADA, { cap: 1 }).map((x) => x.id)).toEqual(['X1-1', 'X1-2', 'X1-3', 'X1-4', 'X1-5', 'X1-6', 'X1-7']);
    expect(extrasDisponibles(f, { ...NADA, opsUsadas: ['K1', 'K8'] }, { cap: 1 }).map((x) => x.id)).toEqual(['X1-2', 'X1-3', 'X1-4', 'X1-6', 'X1-7']);
    expect(extrasDisponibles(f, NADA, { cap: 2 }).map((x) => x.id)).not.toContain('X2-9');
    expect(extrasDisponibles(f, { ...NADA, hermanos: true }, { cap: 2 }).map((x) => x.id)).toContain('X2-9');
    expect(extrasDisponibles(f, NADA, { cap: 4 }).map((x) => x.id)).toEqual(['X4-1', 'X4-2', 'X4-4', 'X4-5']);
    expect(extrasDisponibles(f, { ...NADA, peleaK36: true }, { cap: 4 }).map((x) => x.id)).toContain('X4-3');
  });

  it('después de K39, solo las livianas; las usadas no vuelven; los temas sacados sacan sus extras', () => {
    expect(extrasDisponibles(f, { ...NADA, peleaK36: true }, { cap: 4, soloLivianas: true }).map((x) => x.id)).toEqual(['X4-1', 'X4-2']);
    expect(extrasDisponibles(f, { ...NADA, extrasUsadas: ['X4-1'] }, { cap: 4, soloLivianas: true }).map((x) => x.id)).toEqual(['X4-2']);
    const sin = validarFicha({ ...FICHA, temasSacados: ['mama', 'escuela'] });
    const ids = extrasDisponibles(sin, NADA).map((x) => x.id);
    for (const id of ['X2-1', 'X2-2', 'X2-3', 'X2-4', 'X3-2']) expect(ids, id).not.toContain(id);
    expect(ids).toContain('X2-5');
  });
});
