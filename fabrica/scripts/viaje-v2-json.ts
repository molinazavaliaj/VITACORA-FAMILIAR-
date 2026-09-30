// Genera fabrica/src/viaje-v2/banco.json desde docs/viajes-v2/banco.md:
//
//   npx tsx scripts/viaje-v2-json.ts
//
// Correrlo cada vez que cambia el md (el test viaje-v2-banco avisa si quedó viejo).

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearBancoViajeMd } from '../src/viaje-v2/banco-md.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MD = path.join(FABRICA, '..', 'docs', 'viajes-v2', 'banco.md');
const SALIDA = path.join(FABRICA, 'src', 'viaje-v2', 'banco.json');

const filas = parsearBancoViajeMd(readFileSync(MD, 'utf8'));
writeFileSync(SALIDA, JSON.stringify(filas, null, 2) + '\n', 'utf8');
const conVariante = filas.filter((f) => f.yaDeViaje !== null).length;
console.log(`banco.json: ${filas.length} filas (${conVariante} con variante "ya de viaje")`);
