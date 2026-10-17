// Copia el motor de Kids V2 de la fábrica al entrevistador (docs/kids/v2/plan-conexion-bot.md, T2).
// Byte a byte, como el núcleo de la V3 y el de la Viaje V2: nunca se edita la copia a mano. Es recursivo
// (kids-v2 tiene la subcarpeta `motor/`) y borra lo que sobra en la copia.
//
// Se copia todo, también lo de la simulación (corrida, lectura, conductas, controles, simulacion): solo importan
// archivos de la misma carpeta, compilan en el entrevistador y la simulación de punta a punta (T5) los puede usar.
//
//   npm run kids-v2-copiar-nucleo

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FABRICA = fileURLToPath(new URL('../../fabrica/src/kids-v2/', import.meta.url));
const NUCLEO = fileURLToPath(new URL('../src/kids-v2/nucleo/', import.meta.url));

/** Los archivos de una carpeta, con su ruta relativa ('motor/flujo.ts'), en orden. */
function archivosDe(dir: string, prefijo = ''): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).sort().flatMap((n) => (statSync(join(dir, n)).isDirectory() ? archivosDe(join(dir, n), `${prefijo}${n}/`) : [`${prefijo}${n}`]));
}

if (!existsSync(FABRICA)) {
  console.error(`No encuentro ${FABRICA}: este script se corre desde el monorepo.`);
  process.exit(1);
}
const originales = archivosDe(FABRICA);
for (const sobra of archivosDe(NUCLEO)) {
  if (!originales.includes(sobra)) rmSync(join(NUCLEO, sobra));
}
for (const archivo of originales) {
  mkdirSync(join(NUCLEO, archivo, '..'), { recursive: true });
  copyFileSync(join(FABRICA, archivo), join(NUCLEO, archivo));
}
// Carpetas que quedaron vacías (si en la fábrica se borró una subcarpeta).
for (const n of readdirSync(NUCLEO)) {
  const d = join(NUCLEO, n);
  if (statSync(d).isDirectory() && archivosDe(d).length === 0) rmSync(d, { recursive: true });
}
console.log(`Núcleo Kids V2 copiado: ${originales.length} archivos.`);
