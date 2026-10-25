// Copia el núcleo de «Vitácora de una historia» de la fábrica al entrevistador
// (fabrica/src/historia/entrevista/* y ficha.ts → src/historia/nucleo/), como
// scripts/v3-copiar-nucleo.ts. Byte a byte: nunca se edita la copia a mano.
// Borra lo que sobra en la copia.
//
//   npm run historia-copiar-nucleo

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FABRICA = fileURLToPath(new URL('../../fabrica/src/historia/', import.meta.url));
const NUCLEO = fileURLToPath(new URL('../src/historia/nucleo/', import.meta.url));

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
console.log(`Núcleo de historia copiado: ${originales.length} archivos + ficha.ts.`);
