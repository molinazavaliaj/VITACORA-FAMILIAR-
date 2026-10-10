// Para los scripts: lee entrevistador/.env antes de importar nada que use la
// config (config.ts exige las variables al importarse). Nunca imprime valores.
// Las WA_* que falten se completan con un valor de relleno: estos scripts no
// mandan WhatsApp de verdad.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function cargarEntorno(): void {
  try {
    for (const linea of readFileSync(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8').split('\n')) {
      const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // Sin .env propio se usan las variables que ya estén en el entorno.
  }
  for (const v of ['WA_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_VERIFY_TOKEN']) if (!process.env[v]) process.env[v] = 'sin-whatsapp';
}
