// Genera fabrica/src/v3/entrevista/banco.json desde docs/v3/entrevista/banco.md,
// y banco-ca.json desde docs/v3/entrevista/banco-ca.md (los textos en
// catalán; Naza, 04/10):
//
//   npx tsx scripts/v3-entrevista-json.ts
//
// Correrlo cada vez que cambia un md (los tests v3-entrevista-banco y
// v3-catala-banco avisan si quedó viejo).

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearEntrevistaMd } from '../src/v3/entrevista/banco-md.js';
import { parsearTextosIdiomaMd } from '../src/v3/entrevista/banco-idioma-md.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(FABRICA, '..', 'docs', 'v3', 'entrevista');
const MD = path.join(DOCS, 'banco.md');
const SALIDA = path.join(FABRICA, 'src', 'v3', 'entrevista', 'banco.json');

const banco = parsearEntrevistaMd(readFileSync(MD, 'utf8'));
writeFileSync(SALIDA, JSON.stringify(banco, null, 2) + '\n', 'utf8');
const cuenta = (f: (p: (typeof banco.preguntas)[number]) => boolean) => banco.preguntas.filter(f).length;
console.log(
  `banco.json: ${banco.preguntas.length} filas (${cuenta((p) => p.parte === 'nucleo')} núcleo, ${cuenta((p) => p.parte === 'extra')} extra; ` +
    `${cuenta((p) => p.clase === 'historia' || p.clase === 'foto')} de historia con la foto) y ${banco.mensajes.length} mensajes`,
);

const ca = parsearTextosIdiomaMd(readFileSync(path.join(DOCS, 'banco-ca.md'), 'utf8'));
writeFileSync(path.join(FABRICA, 'src', 'v3', 'entrevista', 'banco-ca.json'), JSON.stringify(ca, null, 2) + '\n', 'utf8');
console.log(`banco-ca.json: ${Object.keys(ca.preguntas).length} preguntas, ${Object.keys(ca.mensajes).length} mensajes, ${Object.values(ca.botones).flat().length} botones`);
