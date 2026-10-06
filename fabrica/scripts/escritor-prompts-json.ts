// Genera fabrica/src/escritor/prompts/prompts-v55.json desde la receta v5.5, la guía y fabrica.md:
//
//   npx tsx scripts/escritor-prompts-json.ts
//
// Correrlo cada vez que cambia uno de los md (test/escritor/prompts.test.ts avisa si quedó viejo).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilarPrompts } from '../src/escritor/prompts/compilar.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const md = (r: string) => readFileSync(path.join(RAIZ, r), 'utf8');
const SALIDA = path.join(RAIZ, 'fabrica', 'src', 'escritor', 'prompts', 'prompts-v55.json');

const p = compilarPrompts({ receta: md('docs/v5/escritor-v55/receta.md'), guia: md('docs/v5/escritor/guia.md'), fabrica: md('docs/v5/escritor-v55/fabrica.md') });
writeFileSync(SALIDA, JSON.stringify(p, null, 2) + '\n', 'utf8');
const vacios = Object.entries(p.prompts).filter(([, b]) => !b.length).map(([k]) => k);
console.log(`prompts-v55.json: ${Object.keys(p.prompts).length} encabezados${vacios.length ? `; SIN bloques: ${vacios.join(', ')}` : ''}`);
