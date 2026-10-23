// Genera los json del banco de «Vitácora de una historia» desde sus md (copia
// de scripts/v3-entrevista-json.ts con las rutas de historia):
//   - src/historia/entrevista/banco.json desde docs/historia/banco.md (es-AR);
//   - banco-ca.json y banco-es-ES.json desde docs/historia/idiomas/banco-<idioma>.md
//     (solo los textos, por ID);
//   - temas.json desde docs/historia/temas.md (la etiqueta y la ayuda de cada tema).
//
//   npx tsx scripts/historia-json.ts
//
// Correrlo cada vez que cambia un md (test/historia-banco.test.ts avisa si
// quedó viejo). Si falta el md de un idioma, el script frena: nunca se genera
// un json de otro idioma con el castellano rioplatense adentro.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearEntrevistaMd } from '../src/historia/entrevista/banco-md.js';
import { parsearTextosIdiomaMd } from '../src/historia/entrevista/banco-idioma-md.js';
import { IDIOMAS } from '../src/historia/entrevista/idioma.js';
import { parsearTemasMd } from '../src/historia/entrevista/temas-md.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(FABRICA, '..', 'docs', 'historia');
const SALIDA = path.join(FABRICA, 'src', 'historia', 'entrevista');

const escribir = (archivo: string, datos: unknown) => writeFileSync(path.join(SALIDA, archivo), JSON.stringify(datos, null, 2) + '\n', 'utf8');

const banco = parsearEntrevistaMd(readFileSync(path.join(DOCS, 'banco.md'), 'utf8'));
escribir('banco.json', banco);
const variantes = banco.preguntas.filter((p) => p.reemplaza).length;
console.log(`banco.json: ${banco.preguntas.length} preguntas (${variantes} variantes) y ${banco.mensajes.length} mensajes`);

for (const idioma of IDIOMAS) {
  if (idioma === 'es-AR') continue; // banco.md, arriba
  const t = parsearTextosIdiomaMd(readFileSync(path.join(DOCS, 'idiomas', `banco-${idioma}.md`), 'utf8'));
  escribir(`banco-${idioma}.json`, t);
  console.log(`banco-${idioma}.json: ${Object.keys(t.preguntas).length} preguntas y ${Object.keys(t.mensajes).length} mensajes`);
}

const temas = parsearTemasMd(readFileSync(path.join(DOCS, 'temas.md'), 'utf8'));
escribir('temas.json', temas);
console.log(`temas.json: ${Object.keys(temas).length} temas`);
