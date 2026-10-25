// Task 1.1 del plan de «Vitácora de una historia»: los temas, el parser de 8
// columnas con IDs con guion y el banco de cada tema. Usa el banco de prueba
// (test/fixtures/historia/banco.md) y, aparte, el banco real.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsearEntrevistaMd } from '../src/historia/entrevista/banco-md';
import { parsearTemasMd } from '../src/historia/entrevista/temas-md';
import { bancoDeTema, esTema, TEMAS_HISTORIA } from '../src/historia/entrevista/temas';

const banco = parsearEntrevistaMd(readFileSync('test/fixtures/historia/banco.md', 'utf8'));

describe('temas de historia', () => {
  it('las claves son las de docs/historia/temas.md', () => {
    expect(TEMAS_HISTORIA).toEqual(['mudanza', 'negocio', 'enfermedad', 'conocimos', 'padres', 'trabajo', 'otra']);
    expect(esTema('mudanza')).toBe(true);
    expect(esTema('viaje')).toBe(false);
    expect(esTema('comun')).toBe(false);
    expect(Object.keys(parsearTemasMd(readFileSync('../docs/historia/temas.md', 'utf8')))).toEqual([...TEMAS_HISTORIA]);
  });
  it('cada pregunta trae su tema', () => {
    expect(banco.preguntas.every((p) => p.tema === 'comun' || esTema(p.tema))).toBe(true);
  });
  it('bancoDeTema deja la parte común y las del tema, en el orden del md', () => {
    const b = bancoDeTema(banco, 'mudanza');
    expect(b.preguntas.map((p) => p.tema)).toEqual(['comun', 'comun', 'mudanza', 'mudanza', 'mudanza', 'comun']);
    expect(b.preguntas.map((p) => p.id)).toEqual(['HC1', 'HC2', 'HM1', 'HM2', 'HC5-M', 'HC10']);
    expect(b.mensajes).toBe(banco.mensajes);
  });
  it('una variante ocupa el lugar de la común que reemplaza', () => {
    const b = bancoDeTema(banco, 'mudanza');
    const v = banco.preguntas.find((p) => p.reemplaza && p.tema === 'mudanza')!;
    expect(b.preguntas.map((p) => p.id)).not.toContain(v.reemplaza);
    expect(b.preguntas.map((p) => p.id)).toContain(v.id);
    expect(bancoDeTema(banco, 'otra').preguntas.map((p) => p.id)).toContain(v.reemplaza);
  });
  it('la variante toma el bloque de la común que reemplaza', () => {
    const porId = new Map(banco.preguntas.map((p) => [p.id, p]));
    expect(porId.get('HC5-M')!.bloque).toBe(porId.get('HC5')!.bloque);
    expect(porId.get('HC1-A')!.bloque).toBe(1);
  });
  it('otra deja la común y una sola propia del tema (HO1)', () => {
    expect(bancoDeTema(banco, 'otra').preguntas.filter((p) => p.tema !== 'comun')).toHaveLength(1);
  });
  it('la variante común (HC1-A) va con tema abierto o con otra (Naza, 23/10)', () => {
    expect(bancoDeTema(banco, 'mudanza').preguntas.map((p) => p.id)[0]).toBe('HC1');
    expect(bancoDeTema(banco, 'otra').preguntas.map((p) => p.id)).toEqual(['HC1-A', 'HC2', 'HO1', 'HC5', 'HC10']);
    expect(bancoDeTema(banco, 'otra', { temaAbierto: true }).preguntas.map((p) => p.id)).toEqual(['HC1-A', 'HC2', 'HO1', 'HC5', 'HC10']);
    expect(bancoDeTema(banco, 'mudanza', { temaAbierto: true }).preguntas.map((p) => p.id)).toEqual(['HC1-A', 'HC2', 'HM1', 'HM2', 'HC5-M', 'HC10']);
  });
  it('no lee nada después de "## Reglas del flujo"', () => {
    expect(banco.preguntas.map((p) => p.id)).not.toContain('HX9');
  });
});

describe('parser de historia', () => {
  const fila = (id: string, cols = '|  | núcleo | historia |  | comun |  |') => `## Bloque 1 · X\n\n| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |\n|---|---|---|---|---|---|---|---|\n| ${id} | texto ${cols}\n`;

  it('acepta IDs con guion en preguntas y mensajes', () => {
    const b = parsearEntrevistaMd(`## Mensajes fijos\n\n| ID | Cuándo | Texto |\n|---|---|---|\n| PR-H1 | x | y |\n| BIEN-HR-A | x | y |\n| TEMA-ABIERTO | x | y |\n\n${fila('HC8')}| HC8-Q | t |  | núcleo | historia | sí | conocimos | HC8 |\n`);
    expect(b.mensajes.map((m) => m.id)).toEqual(['PR-H1', 'BIEN-HR-A', 'TEMA-ABIERTO']);
    expect(b.preguntas.map((p) => p.id)).toEqual(['HC8', 'HC8-Q']);
    expect(b.preguntas[1]).toMatchObject({ tema: 'conocimos', reemplaza: 'HC8', sensible: true });
  });
  it('una fila con 6 columnas (formato V3) es un error', () => {
    expect(() => parsearEntrevistaMd(fila('HC1', '|  | núcleo | historia |  |'))).toThrow('la fila tiene 6 columnas y van 8');
  });
  it('un tema desconocido es un error', () => {
    expect(() => parsearEntrevistaMd(fila('HC1', '|  | núcleo | historia |  | viaje |  |'))).toThrow('historia: tema desconocido «viaje» en HC1');
  });
  it('un ID mal escrito es un error, no se saltea', () => {
    expect(() => parsearEntrevistaMd(fila('hc1'))).toThrow('ID mal escrito');
  });
  it('un Reemplaza que no apunta a una común existente es un error', () => {
    expect(() => parsearEntrevistaMd(fila('HC8-Q', '|  | núcleo | historia |  | conocimos | HC8 |'))).toThrow('no es una común');
    const deTema = `${fila('HM1', '|  | núcleo | historia |  | mudanza |  |')}| HM1-Q | t |  | núcleo | historia |  | conocimos | HM1 |\n`;
    expect(() => parsearEntrevistaMd(deTema)).toThrow('no es una común');
  });
  it('dos variantes que caen sobre la misma común son un error', () => {
    const dos = `${fila('HC8')}| HC8-Q | t |  | núcleo | historia |  | conocimos | HC8 |\n| HC8-X | t |  | núcleo | historia |  | conocimos | HC8 |\n`;
    expect(() => parsearEntrevistaMd(dos)).toThrow('reemplazan los dos a HC8');
    const conAbierto = `${fila('HC8')}| HC8-Q | t |  | núcleo | historia |  | conocimos | HC8 |\n| HC8-A | t |  | núcleo | historia |  | comun | HC8 |\n`;
    expect(() => parsearEntrevistaMd(conAbierto)).toThrow('reemplazan los dos a HC8');
    const deDosTemas = `${fila('HC8')}| HC8-Q | t |  | núcleo | historia |  | conocimos | HC8 |\n| HC8-P | t |  | núcleo | historia |  | padres | HC8 |\n`;
    expect(parsearEntrevistaMd(deDosTemas).preguntas).toHaveLength(3);
  });
  it('un Sensible que no es "sí" ni vacío es un error (antes valía false sin avisar)', () => {
    expect(() => parsearEntrevistaMd(fila('HC1', '|  | núcleo | historia | si | comun |  |'))).toThrow('Sensible desconocido "si"');
  });
  it('un mensaje con un "|" suelto (más columnas que el encabezado) es un error, no se corta', () => {
    expect(() => parsearEntrevistaMd('## Mensajes fijos\n\n| ID | Cuándo | Texto |\n|---|---|---|\n| M1 | x | uno | dos |\n')).toThrow('M1: la fila tiene 4 columnas y el encabezado 3');
  });
  it('un ID repetido es un error', () => {
    expect(() => parsearEntrevistaMd(`${fila('HC1')}| HC1 | t |  | núcleo | historia |  | comun |  |\n`)).toThrow('HC1: está dos veces');
  });
  it('historia no tiene ronda extra ni clases de V3', () => {
    expect(() => parsearEntrevistaMd(fila('HC1', '|  | extra | historia |  | comun |  |'))).toThrow('Parte desconocida');
    expect(() => parsearEntrevistaMd(fila('HC1', '|  | núcleo | foto |  | comun |  |'))).toThrow('Clase desconocida');
  });
});

describe('el banco real (docs/historia/banco.md)', () => {
  const real = parsearEntrevistaMd(readFileSync('../docs/historia/banco.md', 'utf8'));
  const ids = (tema: Parameters<typeof bancoDeTema>[1], temaAbierto = false) => bancoDeTema(real, tema, { temaAbierto }).preguntas.map((p) => p.id);
  const COMUN_ANTES = ['HC1', 'HC2', 'HC3', 'HC4'];

  it('tiene 50 preguntas y 46 mensajes', () => {
    expect(real.preguntas).toHaveLength(50);
    expect(real.mensajes).toHaveLength(46);
  });
  it('lee las variantes con guion, con su tema y lo que reemplazan', () => {
    const v = real.preguntas.filter((p) => p.reemplaza).map((p) => `${p.id}:${p.tema}:${p.reemplaza}`);
    expect(v).toEqual(['HC5-Q:conocimos:HC5', 'HC8-Q:conocimos:HC8', 'HC9-Q:conocimos:HC9', 'HC8-P:padres:HC8', 'HC9-P:padres:HC9', 'HC8-T:trabajo:HC8', 'HC9-T:trabajo:HC9', 'HC1-A:comun:HC1']);
  });
  it('mudanza: la común con sus 5 preguntas en el medio', () => {
    expect(ids('mudanza')).toEqual([...COMUN_ANTES, 'HM1', 'HM2', 'HM3', 'HM4', 'HM5', 'HC5', 'HC6', 'HC7', 'HC8', 'HC9', 'HC10']);
  });
  it('conocimos: HC5-Q, HC8-Q y HC9-Q en lugar de HC5, HC8 y HC9', () => {
    expect(ids('conocimos')).toEqual([...COMUN_ANTES, 'HQ1', 'HQ2', 'HQ3', 'HQ4', 'HQ5', 'HC5-Q', 'HC6', 'HC7', 'HC8-Q', 'HC9-Q', 'HC10']);
  });
  it('padres y trabajo: sus variantes de HC8 y HC9', () => {
    expect(ids('padres')).toEqual([...COMUN_ANTES, 'HP1', 'HP2', 'HP3', 'HP4', 'HC5', 'HC6', 'HC7', 'HC8-P', 'HC9-P', 'HC10']);
    expect(ids('trabajo')).toEqual([...COMUN_ANTES, 'HT1', 'HT2', 'HT3', 'HT4', 'HT5', 'HC5', 'HC6', 'HC7', 'HC8-T', 'HC9-T', 'HC10']);
  });
  it('negocio y enfermedad van sin variantes; otra, con HC1-A', () => {
    expect(ids('negocio')).toEqual([...COMUN_ANTES, 'HN1', 'HN2', 'HN3', 'HN4', 'HC5', 'HC6', 'HC7', 'HC8', 'HC9', 'HC10']);
    expect(ids('enfermedad')).toEqual([...COMUN_ANTES, 'HE1', 'HE2', 'HE3', 'HE4', 'HC5', 'HC6', 'HC7', 'HC8', 'HC9', 'HC10']);
    expect(ids('otra')).toEqual(['HC1-A', ...COMUN_ANTES.slice(1), 'HO1', 'HO2', 'HO3', 'HO4', 'HO5', 'HC5', 'HC6', 'HC7', 'HC8', 'HC9', 'HC10']);
  });
  it('con tema abierto, HC1-A en lugar de HC1, en cualquier tema', () => {
    for (const tema of TEMAS_HISTORIA) {
      const conAbierto = ids(tema, true);
      expect(conAbierto[0]).toBe('HC1-A');
      expect(conAbierto).not.toContain('HC1');
      expect(conAbierto.slice(1)).toEqual(ids(tema).slice(1));
    }
  });
  it('cada tema tiene de 4 a 5 preguntas propias y como mucho unas 15 en total', () => {
    for (const tema of TEMAS_HISTORIA) {
      const b = bancoDeTema(real, tema).preguntas;
      const propias = b.filter((p) => p.tema === tema && !p.reemplaza).length;
      expect(propias, tema).toBeGreaterThanOrEqual(4);
      expect(propias, tema).toBeLessThanOrEqual(5);
      expect(b.length, tema).toBeLessThanOrEqual(15);
    }
  });
  it('las sensibles son las de la regla 8', () => {
    expect(real.preguntas.filter((p) => p.sensible).map((p) => p.id)).toEqual(['HE1', 'HE2', 'HE3', 'HC5', 'HC6', 'HC5-Q', 'HC8-Q', 'HC8-T']);
  });
  it('la única de clase cierre es HC10, la última', () => {
    expect(real.preguntas.filter((p) => p.clase === 'cierre').map((p) => p.id)).toEqual(['HC10']);
    for (const tema of TEMAS_HISTORIA) expect(ids(tema).at(-1)).toBe('HC10');
  });
});
