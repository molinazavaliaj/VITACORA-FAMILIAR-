// Genera los json del banco de Kids V2 desde sus md:
//
//   npx tsx scripts/kids-v2-json.ts
//
// banco.json sale de docs/kids/v2/banco.md y mensajes.md (la estructura y los textos es-AR);
// banco-es-ES.json, de docs/kids/v2/idiomas/banco-es-ES.md (solo los textos, por ID).
// Correrlo cada vez que cambia uno de los md (los tests kids-v2-banco y kids-v2-idiomas avisan si quedó viejo).

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearBancoKids } from '../src/kids-v2/banco-md.js';
import { parsearTextosIdiomaKidsMd } from '../src/kids-v2/banco-idioma-md.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(FABRICA, '..', 'docs', 'kids', 'v2');
const SRC = path.join(FABRICA, 'src', 'kids-v2');
const escribir = (archivo: string, datos: unknown) => writeFileSync(archivo, JSON.stringify(datos, null, 2) + '\n', 'utf8');

const banco = parsearBancoKids(readFileSync(path.join(DOCS, 'banco.md'), 'utf8'), readFileSync(path.join(DOCS, 'mensajes.md'), 'utf8'));
escribir(path.join(SRC, 'banco.json'), banco);
console.log(`banco.json: ${banco.preguntas.length} preguntas, ${banco.extras.length} extras, ${banco.mensajes.length} mensajes`);

for (const idioma of ['es-ES']) {
  const textos = parsearTextosIdiomaKidsMd(readFileSync(path.join(DOCS, 'idiomas', `banco-${idioma}.md`), 'utf8'));
  escribir(path.join(SRC, `banco-${idioma}.json`), textos);
  console.log(`banco-${idioma}.json: ${Object.keys(textos).length} textos`);
}
