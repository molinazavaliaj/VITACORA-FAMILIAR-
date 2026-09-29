// Genera fabrica/src/v3/entrevista/banco.json desde docs/v3/entrevista/banco.md:
//
//   npx tsx scripts/v3-entrevista-json.ts
//
// Correrlo cada vez que cambia el md (el test v3-entrevista-banco avisa si quedó viejo).

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearEntrevistaMd } from '../src/v3/entrevista/banco-md.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MD = path.join(FABRICA, '..', 'docs', 'v3', 'entrevista', 'banco.md');
const SALIDA = path.join(FABRICA, 'src', 'v3', 'entrevista', 'banco.json');

const banco = parsearEntrevistaMd(readFileSync(MD, 'utf8'));
writeFileSync(SALIDA, JSON.stringify(banco, null, 2) + '\n', 'utf8');
const cuenta = (f: (p: (typeof banco.preguntas)[number]) => boolean) => banco.preguntas.filter(f).length;
console.log(
  `banco.json: ${banco.preguntas.length} filas (${cuenta((p) => p.parte === 'nucleo')} núcleo, ${cuenta((p) => p.parte === 'extra')} extra; ` +
    `${cuenta((p) => p.clase === 'historia' || p.clase === 'foto')} de historia con la foto) y ${banco.mensajes.length} mensajes`,
);
