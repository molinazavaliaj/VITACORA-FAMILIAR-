// Genera fabrica/src/v3/entrevista/banco.json desde docs/v3/entrevista/banco.md,
// banco-ca.json desde docs/v3/entrevista/banco-ca.md (los textos en
// catalán; Naza, 04/10) y banco-es-ES.json desde banco-es-ES.md (castellano
// de España, de tú; Naza, 05/10):
//
//   npx tsx scripts/v3-entrevista-json.ts
//
// Correrlo cada vez que cambia un md (los tests v3-entrevista-banco,
// v3-catala-banco y v3-banco-es-ES avisan si quedó viejo). Si banco-es-ES.md
// todavía no existe, banco-es-ES.json queda como está (sin textos: una
// entrevista en es-ES no arranca).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearEntrevistaMd } from '../src/v3/entrevista/banco-md.js';
import { parsearTextosIdiomaMd } from '../src/v3/entrevista/banco-idioma-md.js';
import { IDIOMAS } from '../src/v3/entrevista/idioma.js';

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

for (const idioma of IDIOMAS) {
  if (idioma === 'es-AR') continue; // banco.md, arriba
  const md = path.join(DOCS, `banco-${idioma}.md`);
  const json = `banco-${idioma}.json`;
  if (!existsSync(md)) {
    console.log(`${json}: falta docs/v3/entrevista/banco-${idioma}.md; queda como está (sin textos, la entrevista en ${idioma} no arranca).`);
    continue;
  }
  const t = parsearTextosIdiomaMd(readFileSync(md, 'utf8'));
  writeFileSync(path.join(FABRICA, 'src', 'v3', 'entrevista', json), JSON.stringify(t, null, 2) + '\n', 'utf8');
  console.log(`${json}: ${Object.keys(t.preguntas).length} preguntas, ${Object.keys(t.mensajes).length} mensajes, ${Object.values(t.botones).flat().length} botones`);
}
