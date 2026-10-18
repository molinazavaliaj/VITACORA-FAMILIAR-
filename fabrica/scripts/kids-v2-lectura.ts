// Genera docs/kids/v2/lectura-corrida.md: la entrevista completa de UNA chica
// INVENTADA (Tini, regalo de sus abuelos, canal A), mensaje por mensaje, con
// día, hora local y quién habla. Para leer en el celular.
//
//   npx tsx scripts/kids-v2-lectura.ts [<salida.md>]

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lecturaCorrida } from '../src/kids-v2/lectura.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = process.argv[2] ?? path.join(FABRICA, '..', 'docs', 'kids', 'v2', 'lectura-corrida.md');

const md = lecturaCorrida();
writeFileSync(SALIDA, md, 'utf8');
const globos = md.split('\n').filter((l) => /^\*\*\d\d:\d\d · /.test(l)).length;
console.log(`${path.relative(process.cwd(), SALIDA)}: ${globos} globos`);
