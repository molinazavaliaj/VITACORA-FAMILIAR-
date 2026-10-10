// Copia el núcleo V3 de la fábrica al entrevistador (spec 2026-10-07).
// Byte a byte: nunca se edita la copia a mano. Borra lo que sobra en la copia.
//
//   npm run v3-copiar-nucleo

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FABRICA = fileURLToPath(new URL('../../fabrica/src/v3/', import.meta.url));
const NUCLEO = fileURLToPath(new URL('../src/v3/nucleo/', import.meta.url));

if (!existsSync(`${FABRICA}entrevista`)) {
  console.error(`No encuentro ${FABRICA}entrevista: este script se corre desde el monorepo.`);
  process.exit(1);
}
mkdirSync(`${NUCLEO}entrevista`, { recursive: true });
const originales = readdirSync(`${FABRICA}entrevista`);
for (const sobra of readdirSync(`${NUCLEO}entrevista`)) {
  if (!originales.includes(sobra)) rmSync(`${NUCLEO}entrevista/${sobra}`);
}
for (const archivo of originales) copyFileSync(`${FABRICA}entrevista/${archivo}`, `${NUCLEO}entrevista/${archivo}`);
copyFileSync(`${FABRICA}ficha.ts`, `${NUCLEO}ficha.ts`);
console.log(`Núcleo V3 copiado: ${originales.length} archivos + ficha.ts.`);
