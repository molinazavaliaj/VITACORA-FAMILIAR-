// Rehace a mano el libro online (paquete/libro.html y libro.pdf) de un libro ya escrito, con la plantilla de hoy
// y sin llamar a ningún modelo. La fábrica ya lo hace sola al arrancar si cambió algo (libro-online.ts); esto es
// para mirarlo antes, o para una tapa retocada a mano.
//
//   npx tsx --env-file=.env scripts/rehacer-libro-online.ts <narradorId>            → deja libro.html y libro.pdf en salidas/libro-online/<id>/ para mirarlos
//   npx tsx --env-file=.env scripts/rehacer-libro-online.ts <narradorId> --subir    → además los reemplaza en Storage
//   … --foto-tapa <archivo.jpg>   → la tapa con esa foto y no con la elegida en el panel (no cambia su edición; ojo:
//                                   al arrancar, la fábrica la vuelve a la elegida. Para que quede, cargarla como tapa).
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { htmlOnlineDe, subirLibroOnline } from '../src/escritor/produccion/libro-online.js';
import { htmlAPdf } from '../src/libro/pdf.js';

const args = process.argv.slice(2);
const narradorId = args[0];
if (!narradorId) throw new Error('Falta el id del narrador.');
const subir = args.includes('--subir');
const fotoTapa = args.includes('--foto-tapa') ? args[args.indexOf('--foto-tapa') + 1] : undefined;
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const libro = await htmlOnlineDe(db, narradorId, fotoTapa ? { fotoTapa: `data:image/jpeg;base64,${readFileSync(fotoTapa).toString('base64')}` } : {});
if (!libro) throw new Error('Ese narrador no tiene libro.md del escritor: no hay libro que rehacer.');
const pdf = await htmlAPdf(libro.html);

const carpeta = join('salidas', 'libro-online', narradorId);
mkdirSync(carpeta, { recursive: true });
writeFileSync(join(carpeta, 'libro.html'), libro.html);
writeFileSync(join(carpeta, 'libro.pdf'), pdf);
console.log(`${libro.nombre}: libro.html y libro.pdf en ${carpeta}`);

if (subir) {
  await subirLibroOnline(db, narradorId, libro.html, pdf);
  console.log('Reemplazados en Storage: el QR ya abre el libro nuevo.');
}
