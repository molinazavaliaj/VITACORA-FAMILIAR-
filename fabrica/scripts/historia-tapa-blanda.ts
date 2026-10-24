// La tapa blanda de un libro de «Vitácora de una historia» que salió con menos de 88 páginas (plan 2026-10-21,
// Task 5.4; spec §5). La fábrica avisa a los socios y no deja la tapa dura para subir; si el cliente acepta tapa
// blanda, esto la arma: interior 170×240 sin hojas de Notas, cubierta con 3 mm de sangrado y su informe, en
// `{narradorId}/bookmundo-tapa-blanda/` del bucket `audios`. No sube nada a Bookmundo (no tienen API).
//
//   npx tsx scripts/historia-tapa-blanda.ts <narradorId>
//
// Corre desde `fabrica/`. Lee `fabrica/.env` si está (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { obtenerClienteDb } from '../src/db.js';
import { armarLibroBookmundo } from '../src/libro/bookmundo/armar.js';
import { CARPETA_BOOKMUNDO_HISTORIA, datosBookmundoHistoria, subirBookmundo } from '../src/escritor-historia/produccion/imprenta.js';

const USO = 'Uso: npx tsx scripts/historia-tapa-blanda.ts <narradorId>';

async function main(): Promise<void> {
  const [id] = process.argv.slice(2);
  if (!id) {
    console.error(USO);
    process.exit(1);
  }
  const rutaEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  if (existsSync(rutaEnv)) process.loadEnvFile(rutaEnv);
  const db = obtenerClienteDb();
  const d = await datosBookmundoHistoria(db, id);
  if (!d) {
    console.error(`${id} no tiene libro de historia escrito (falta ${id}/escritor-historia/libro.md).`);
    process.exit(1);
  }
  const r = await armarLibroBookmundo(d.libro, d.cubierta, { formato: 'tapa-blanda', sinNotas: true });
  const carpeta = CARPETA_BOOKMUNDO_HISTORIA(id, 'tapa-blanda');
  await subirBookmundo(db, carpeta, r, 'tapa-blanda');
  console.log(r.informe);
  console.log(`\n${r.informeInterior.paginas} páginas · ${r.ok ? 'listo para subir' : 'CON ERRORES: no subir'} · en ${carpeta}/`);
  if (!r.ok) process.exit(2);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
