// Genera fabrica/src/escritor-kids/prompts/prompts-kids.json desde docs/kids/v2/escritor/receta.md:
//
//   npx tsx scripts/escritor-kids-prompts-json.ts
//
// Correrlo cada vez que cambia la receta (test/escritor-kids/prompts.test.ts avisa si quedó viejo).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilarPromptsKids } from '../src/escritor-kids/prompts/compilar.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SALIDA = path.join(RAIZ, 'fabrica', 'src', 'escritor-kids', 'prompts', 'prompts-kids.json');

const p = compilarPromptsKids(readFileSync(path.join(RAIZ, 'docs', 'kids', 'v2', 'escritor', 'receta.md'), 'utf8'));
writeFileSync(SALIDA, JSON.stringify(p, null, 2) + '\n', 'utf8');
console.log(`prompts-kids.json: ${Object.keys(p.prompts).length} pasos`);
