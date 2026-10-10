// Genera fabrica/src/v3/banco-v3.json desde docs/v3/banco-v3.md:
//
//   npx tsx scripts/v3-banco-json.ts
//
// Correrlo cada vez que cambia el md (el test v3-banco avisa si quedó viejo).

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearBancoMd } from '../src/v3/banco-md.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MD = path.join(FABRICA, '..', 'docs', 'v3', 'banco-v3.md');
const SALIDA = path.join(FABRICA, 'src', 'v3', 'banco-v3.json');

const banco = parsearBancoMd(readFileSync(MD, 'utf8'));
writeFileSync(SALIDA, JSON.stringify(banco, null, 2) + '\n', 'utf8');
console.log(`banco-v3.json: ${banco.length} filas (${banco.filter((p) => p.clase === 'historia').length} de historia)`);
