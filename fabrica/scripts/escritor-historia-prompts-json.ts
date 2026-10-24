// Genera fabrica/src/escritor-historia/prompts/prompts-historia.json desde docs/historia/escritor/receta.md:
//
//   npx tsx scripts/escritor-historia-prompts-json.ts
//
// Correrlo cada vez que cambia la receta (test/escritor-historia/prompts.test.ts avisa si quedó viejo).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilarPromptsHistoria } from '../src/escritor-historia/prompts/compilar.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SALIDA = path.join(RAIZ, 'fabrica', 'src', 'escritor-historia', 'prompts', 'prompts-historia.json');

const p = compilarPromptsHistoria(readFileSync(path.join(RAIZ, 'docs', 'historia', 'escritor', 'receta.md'), 'utf8'));
writeFileSync(SALIDA, JSON.stringify(p, null, 2) + '\n', 'utf8');
console.log(`prompts-historia.json: ${Object.keys(p.prompts).length} pasos`);
