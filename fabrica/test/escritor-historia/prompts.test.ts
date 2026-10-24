// Task 5.1 del plan de «Vitácora de una historia»: la receta del escritor compilada (docs/historia/escritor/receta.md).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CLAVES_HISTORIA, compilarPromptsHistoria } from '../../src/escritor-historia/prompts/compilar.js';
import { guiaHistoria, instruccionesHistoria, lineaFijaHistoria } from '../../src/escritor-historia/prompts/index.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const md = (r: string) => readFileSync(path.join(RAIZ, r), 'utf8');
const RECETA = 'docs/historia/escritor/receta.md';

describe('prompts de historia', () => {
  it('el prompts-historia.json commiteado está al día con la receta (si falla: npx tsx scripts/escritor-historia-prompts-json.ts)', () => {
    expect(JSON.parse(md('fabrica/src/escritor-historia/prompts/prompts-historia.json'))).toEqual(compilarPromptsHistoria(md(RECETA)));
  });

  it('están todos los pasos de la receta, versión historia-v1, y la línea fija sale de la receta', () => {
    const p = compilarPromptsHistoria(md(RECETA));
    expect(p.version).toBe('historia-v1');
    expect(Object.keys(p.prompts)).toEqual(CLAVES_HISTORIA);
    for (const k of CLAVES_HISTORIA) expect(p.prompts[k].every((b) => b.length > 300), k).toBe(true);
    expect(p.esquemas['### Historia · Leer todo']).toContain('Esquema de salida:');
    expect(p.esquemas['### Historia · Plan']).toContain('Esquema de salida:');
    expect(p.prompts['### Historia · Hechos']).toHaveLength(2);
    expect(lineaFijaHistoria()).toMatch(/^La guía es la del libro de una vida entera .*Este libro cuenta una sola historia/);
  });

  it('llena los huecos y tira si falta uno', () => {
    const t = instruccionesHistoria('### Historia · Capítulo', { NOMBRE: 'Rubén', N: '2', ETAPA: 'comienzo', TEMA: 'cuando se fue a vivir lejos' });
    expect(t).not.toMatch(/\{\{[A-Z_]+\}\}/);
    expect(t).toContain('Rubén');
    expect(() => instruccionesHistoria('### Historia · Capítulo', { NOMBRE: 'Rubén' })).toThrow(/N|ETAPA|TEMA/);
  });

  it('la guía de Familiar va recortada: el plan no lleva las secciones de la vida entera (1, 4, 10 y 13)', () => {
    const plan = guiaHistoria('plan');
    for (const s of ['1', '4', '10', '13']) expect(plan).not.toMatch(new RegExp(`\\n## ${s}\\.`));
    expect(plan).toMatch(/\n## 5\./);
  });
});
