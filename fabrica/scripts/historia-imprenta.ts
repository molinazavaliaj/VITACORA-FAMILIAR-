// Rehace la imprenta de un libro de «Vitácora de una historia» ya escrito (la que corre sola después de entregar):
// tapa dura sin Notas en `{narradorId}/bookmundo/`, o, con menos de 88 páginas, el informe y el aviso a los socios.
// No le paga nada al modelo: el libro ya está en `{narradorId}/escritor-historia/libro.md`.
//
//   npx tsx scripts/historia-imprenta.ts <narradorId>
//
// Corre desde `fabrica/`. Lee `fabrica/.env` si está (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { obtenerClienteDb } from '../src/db.js';
import { imprentaHistoria } from '../src/escritor-historia/produccion/imprenta.js';

const [id] = process.argv.slice(2);
if (!id) {
  console.error('Uso: npx tsx scripts/historia-imprenta.ts <narradorId>');
  process.exit(1);
}
const rutaEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
if (existsSync(rutaEnv)) process.loadEnvFile(rutaEnv);
imprentaHistoria(obtenerClienteDb(), id)
  .then((r) => console.log(r === 'bookmundo' ? `Listo: ${id}/bookmundo/ (leer informe.txt antes de subir).` : 'Salió con menos de 88 páginas: ver el mail a los socios y scripts/historia-tapa-blanda.ts.'))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
