// Rehace el libro online (paquete/libro.html y libro.pdf) de un libro ya escrito, con la plantilla de hoy y
// sin llamar a ningún modelo: el texto es el libro.md que dejó el escritor. Para los libros que salieron antes
// de un cambio de diseño (01/11: el QR del libro de Imma abría el libro con la tapa vieja del 14/10).
//
//   npx tsx --env-file=.env scripts/rehacer-libro-online.ts <narradorId>            → deja libro.html y libro.pdf en salidas/libro-online/<id>/ para mirarlos
//   npx tsx --env-file=.env scripts/rehacer-libro-online.ts <narradorId> --subir    → además los reemplaza en Storage
//   … --foto-tapa <archivo.jpg>   → la tapa con esa foto y no con la elegida en el panel (la de Imma se retocó a mano
//                                   para la imprenta el 17/10: el online tiene que mostrar la misma). No cambia su edición.
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { carpetaDeLaBase, PREFIJO_ESCRITOR } from '../src/escritor/produccion/libro-v3.js';
import { htmlLibroV3, type NarradorParaLibro } from '../src/escritor/produccion/html.js';
import { idioma, trato } from '../src/escritor/lectura.js';
import { htmlAPdf } from '../src/libro/pdf.js';

const args = process.argv.slice(2);
const narradorId = args[0];
if (!narradorId) throw new Error('Falta el id del narrador.');
const subir = args.includes('--subir');
const fotoTapa = args.includes('--foto-tapa') ? args[args.indexOf('--foto-tapa') + 1] : undefined;
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data: n, error } = await db.from('narradores').select('id, nombre, contexto, foto_url, edicion, libro_aprobado_at').eq('id', narradorId).maybeSingle();
if (error || !n) throw new Error(`No se pudo leer el narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
const { data: md, error: errorMd } = await db.storage.from('audios').download(`${PREFIJO_ESCRITOR(narradorId)}/libro.md`);
if (errorMd || !md) throw new Error(`${n.nombre} no tiene libro.md del escritor: no hay libro que rehacer.`);

// Idioma y trato salen de su material, como en escribirLibroV3 (solo se lee la base).
const { c } = await carpetaDeLaBase(db as never, narradorId);
// Con --foto-tapa: sin foto elegida, la plantilla usa foto_url; ahí va el archivo como data URI (solo en memoria).
const narrador = (fotoTapa
  ? { ...n, edicion: { ...(n.edicion as object | null), portadaFotoId: null }, foto_url: `data:image/jpeg;base64,${readFileSync(fotoTapa).toString('base64')}` }
  : n) as NarradorParaLibro;
const html = await htmlLibroV3(db as never, { narrador, libroMd: await md.text(), idioma: idioma(c), trato: trato(c) });
const pdf = await htmlAPdf(html);

const carpeta = join('salidas', 'libro-online', narradorId);
mkdirSync(carpeta, { recursive: true });
writeFileSync(join(carpeta, 'libro.html'), html);
writeFileSync(join(carpeta, 'libro.pdf'), pdf);
console.log(`${n.nombre}: libro.html y libro.pdf en ${carpeta}`);

if (subir) {
  for (const [nombre, cuerpo, tipo] of [['libro.html', html, 'text/html; charset=utf-8'], ['libro.pdf', pdf, 'application/pdf']] as const) {
    const { error: e } = await db.storage.from('audios').upload(`${narradorId}/paquete/${nombre}`, cuerpo, { contentType: tipo, upsert: true });
    if (e) throw new Error(`No se pudo subir ${nombre}: ${e.message}`);
  }
  console.log('Reemplazados en Storage: el QR ya abre el libro nuevo.');
}
