// Copia el núcleo de la Viaje V2 de la fábrica al entrevistador (docs/viajes-v2/plan-conexion-bot.md, 10/10).
// Byte a byte, como el núcleo V3: nunca se edita la copia a mano. Borra lo que sobra en la copia.
//
//   npm run viaje-v2-copiar-nucleo

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FABRICA = fileURLToPath(new URL('../../fabrica/src/viaje-v2/', import.meta.url));
const NUCLEO = fileURLToPath(new URL('../src/viaje-v2/nucleo/', import.meta.url));

if (!existsSync(FABRICA)) {
  console.error(`No encuentro ${FABRICA}: este script se corre desde el monorepo.`);
  process.exit(1);
}
mkdirSync(NUCLEO, { recursive: true });
const originales = readdirSync(FABRICA);
for (const sobra of readdirSync(NUCLEO)) {
  if (!originales.includes(sobra)) rmSync(`${NUCLEO}${sobra}`);
}
for (const archivo of originales) copyFileSync(`${FABRICA}${archivo}`, `${NUCLEO}${archivo}`);
console.log(`Núcleo Viaje V2 copiado: ${originales.length} archivos.`);
