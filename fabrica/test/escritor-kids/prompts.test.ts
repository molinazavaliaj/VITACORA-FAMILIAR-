import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { rolDe } from '../../src/escritor/modelo/configuracion.js';
import { CLAVES_KIDS, compilarPromptsKids } from '../../src/escritor-kids/prompts/compilar.js';
import { instruccionesKids, lineaFijaKids } from '../../src/escritor-kids/prompts/index.js';
import { idiomaDelLibro, NOMBRES } from '../../src/escritor-kids/llamadas.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const md = (r: string) => readFileSync(path.join(RAIZ, r), 'utf8');

describe('prompts de Kids', () => {
  it('el prompts-kids.json commiteado está al día con la receta (si falla: npx tsx scripts/escritor-kids-prompts-json.ts)', () => {
    const fresco = compilarPromptsKids(md('docs/kids/v2/escritor/receta.md'));
    expect(JSON.parse(md('fabrica/src/escritor-kids/prompts/prompts-kids.json'))).toEqual(fresco);
  });

  it('cada paso tiene su prompt y su esquema, y la línea fija sale de la receta', () => {
    const p = compilarPromptsKids(md('docs/kids/v2/escritor/receta.md'));
    for (const k of CLAVES_KIDS) {
      expect(p.prompts[k].length, k).toBeGreaterThan(500);
      expect(p.esquemas[k], k).toContain('Esquema de salida:');
    }
    expect(lineaFijaKids()).toBe('Los ejemplos de estas instrucciones son de un chico inventado (Tomi). El chico de este libro es otro, y sus datos están en la ficha.');
  });

  it('llena los huecos y tira si falta uno', () => {
    const t = instruccionesKids('### Kids · Parte', { NOMBRE: 'Benja', EDAD: '11', GENERO: 'm', IDIOMA: 'castellano rioplatense', PARTE: '2', TITULO_PARTE: 'Mi gente', NOMBRES: 'No hay.' });
    expect(t).toContain('Estás armando la parte 2, «Mi gente», del libro de Benja, que tiene 11 años (género m).');
    expect(t).not.toContain('{{');
    expect(t).toContain('Nombres que corrigió la familia. No hay.');
    expect(t).toContain('"required": ["piezas", "afuera"]');
    expect(() => instruccionesKids('### Kids · Parte', { NOMBRE: 'Benja' })).toThrow(/EDAD/);
  });

  it('cada paso recibe el idioma del chico ({{IDIOMA}}) y escribe en ese idioma; sin idioma, tira', () => {
    const huecos = { NOMBRE: 'Jana', EDAD: '11', GENERO: 'f', PARTE: '2', TITULO_PARTE: 'La meva gent', NOMBRES: 'No hay.' };
    for (const k of CLAVES_KIDS) {
      expect(compilarPromptsKids(md('docs/kids/v2/escritor/receta.md')).prompts[k], k).toContain('{{IDIOMA}}');
      expect(() => instruccionesKids(k, huecos), k).toThrow(/IDIOMA/);
      const t = instruccionesKids(k, { ...huecos, IDIOMA: 'catalán' });
      expect(t, k).toMatch(/en catalán/);
      expect(t, k).not.toContain('{{');
    }
    expect(instruccionesKids('### Kids · Parte', { ...huecos, IDIOMA: 'catalán' })).toContain('El libro va en catalán, que es el idioma en que le preguntamos y en que contestó.');
    expect(idiomaDelLibro({ idioma: 'ca' })).toBe('catalán');
    expect(idiomaDelLibro({ idioma: 'es-ES' })).toBe('castellano de España');
    expect(idiomaDelLibro({ idioma: 'es-AR' })).toBe('castellano rioplatense');
    expect(idiomaDelLibro({ idioma: '' })).toBe('castellano rioplatense');
  });

  it('todos los pasos caen en Opus 5.5 con pensamiento medio (rolDe por defecto, sin tocar la configuración de Familiar)', () => {
    for (const n of [NOMBRES.leer, NOMBRES.parte(1), NOMBRES.sobre, NOMBRES.album, NOMBRES.veedor(4), NOMBRES.arreglo(3)]) {
      expect(rolDe(n), n).toEqual({ modelo: 'claude-opus-5-5', maxTokens: 64000, esfuerzo: 'medium' });
    }
  });
});
