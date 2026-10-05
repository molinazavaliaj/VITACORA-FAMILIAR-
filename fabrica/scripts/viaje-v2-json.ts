// Genera los json del banco de viaje desde sus md:
//
//   npx tsx scripts/viaje-v2-json.ts            # banco.json, banco-ca.json, banco-es-ES.json
//   npx tsx scripts/viaje-v2-json.ts --fijar    # además, test/viaje-v2-idiomas-fijados.json
//
// banco.json sale de docs/viajes-v2/banco.md (la estructura y los textos
// es-AR); banco-<idioma>.json, de docs/viajes-v2/idiomas/banco-<idioma>.md
// (solo los textos). Correrlo cada vez que cambia un md (los tests
// viaje-v2-banco y viaje-v2-idiomas avisan si quedó viejo).
//
// --fijar: copia los textos de ca y es-ES tal como están hoy para el test
// "fijado letra por letra" (test/viaje-v2-idiomas.test.ts). Solo cuando Naza
// cierra los textos.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearBancoViajeMd } from '../src/viaje-v2/banco-md.js';
import { parsearTextosIdiomaMd, type TextosIdioma } from '../src/viaje-v2/banco-idioma-md.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(FABRICA, '..', 'docs', 'viajes-v2');
const SRC = path.join(FABRICA, 'src', 'viaje-v2');
const escribir = (archivo: string, datos: unknown) => writeFileSync(archivo, JSON.stringify(datos, null, 2) + '\n', 'utf8');

const filas = parsearBancoViajeMd(readFileSync(path.join(DOCS, 'banco.md'), 'utf8'));
escribir(path.join(SRC, 'banco.json'), filas);
const conVariante = filas.filter((f) => f.yaDeViaje !== null).length;
console.log(`banco.json: ${filas.length} filas (${conVariante} con variante "ya de viaje")`);

const idiomas: Record<string, TextosIdioma> = {};
for (const idioma of ['ca', 'es-ES']) {
  const t = parsearTextosIdiomaMd(readFileSync(path.join(DOCS, 'idiomas', `banco-${idioma}.md`), 'utf8'));
  idiomas[idioma] = t;
  escribir(path.join(SRC, `banco-${idioma}.json`), t);
  const faltan = filas.filter((f) => !(f.id in t.textos)).map((f) => f.id);
  console.log(`banco-${idioma}.json: ${Object.keys(t.textos).length} textos, ${Object.keys(t.yaDeViaje).length} "ya de viaje"${faltan.length ? ` · FALTAN: ${faltan.join(', ')}` : ''}`);
}

if (process.argv.includes('--fijar')) {
  const destino = path.join(FABRICA, 'test', 'viaje-v2-idiomas-fijados.json');
  escribir(destino, idiomas);
  console.log(`Fijados: ${path.relative(process.cwd(), destino)} (activar FIJADOS_ACTIVOS en test/viaje-v2-idiomas.test.ts)`);
}
