// Genera fabrica/src/kids-v2/banco.json desde docs/kids/v2/banco.md y mensajes.md:
//
//   npx tsx scripts/kids-v2-json.ts
//
// Correrlo cada vez que cambia uno de los dos md (el test kids-v2-banco avisa si quedó viejo).

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearBancoKids } from '../src/kids-v2/banco-md.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(FABRICA, '..', 'docs', 'kids', 'v2');
const SALIDA = path.join(FABRICA, 'src', 'kids-v2', 'banco.json');

const banco = parsearBancoKids(readFileSync(path.join(DOCS, 'banco.md'), 'utf8'), readFileSync(path.join(DOCS, 'mensajes.md'), 'utf8'));
writeFileSync(SALIDA, JSON.stringify(banco, null, 2) + '\n', 'utf8');
console.log(`banco.json: ${banco.preguntas.length} preguntas, ${banco.extras.length} extras, ${banco.mensajes.length} mensajes`);
