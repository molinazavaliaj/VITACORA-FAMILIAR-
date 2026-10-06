// Los prompts del escritor se leen de los md y no se reescriben: el JSON compilado tiene que
// estar al día con los md, y lo que devuelve tiene que ser lo mismo que leía lib.mjs.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CLAVES_FABRICA, CLAVES_RECETA, compilarPrompts } from '../../src/escritor/prompts/compilar.js';
import { esquemaDe, guiaDe, promptFabrica, promptsDe, SECCIONES } from '../../src/escritor/prompts/index.js';
// @ts-expect-error lib.mjs no tiene tipos
import * as L from '../../scripts/escritor-v55/lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const md = (r: string) => readFileSync(path.join(RAIZ, r), 'utf8');
const JSON_COMMITEADO = JSON.parse(md('fabrica/src/escritor/prompts/prompts-v55.json'));

describe('prompts compilados', () => {
  it('el prompts-v55.json commiteado está al día con los md (si falla: npx tsx scripts/escritor-prompts-json.ts)', () => {
    const fresco = compilarPrompts({ receta: md('docs/v5/escritor-v55/receta.md'), guia: md('docs/v5/escritor/guia.md'), fabrica: md('docs/v5/escritor-v55/fabrica.md') });
    expect(JSON_COMMITEADO).toEqual(fresco);
  });

  it('cada prompt de la receta es el mismo que leía lib.mjs', () => {
    for (const k of CLAVES_RECETA) {
      expect(promptsDe(k), k).toEqual(L.promptsDe(k));
      expect(esquemaDe(k), k).toBe(L.esquemaDe(k));
    }
  });

  it('la guía por paso es la misma que armaba lib.mjs', () => {
    for (const paso of [...Object.keys(SECCIONES), 'otro']) expect(guiaDe(paso), paso).toBe(L.guiaDe(paso));
  });

  it('los prompts de la fábrica están y llenan sus huecos', () => {
    for (const k of CLAVES_FABRICA) expect(promptsDe(k).length, k).toBeGreaterThan(0);
    const d = promptFabrica('### Disputa', { FRASE: 'Raúl tenía la mercería', ID: 'R02', CITA: 'abrimos la mercería con Raúl' });
    expect(d).toContain('Frase del libro: "Raúl tenía la mercería". Respuesta R02, frase que cita: "abrimos la mercería con Raúl".');
    expect(d).not.toContain('{{');
    expect(esquemaDe('### Corrección del registro')).toContain('"borrar"');
  });
});
