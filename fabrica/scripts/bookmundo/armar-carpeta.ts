// Arma el libro para Bookmundo desde una carpeta local, sin base: para probar y para rehacer uno a mano.
//
// Uso:  npx tsx scripts/bookmundo/armar-carpeta.ts <carpeta> [salida]
//
// La carpeta tiene:
//   libro.md     el libro del escritor (`{id}/escritor/libro.md`)
//   datos.json   { "nombre": "Imma Colell", "tituloTapa": "IMMA COLELL", "idioma": "ca" | "es", "trato": "vos" | "tu",
//                  "urlVoz": "https://…/voz/…", "portada": "portada.jpg", "portadaPosicion": "50% 40%",
//                  "fotos": { "I · La taula de casa": ["f4.jpg", "f2.jpg"] } }   ← fotos al final de ese capítulo
// Deja en [salida] (por defecto <carpeta>/bookmundo) el interior, la cubierta, las guías y el informe.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { libroParaPlantilla } from '../../src/escritor/salida/plantilla.js';
import { armarLibroBookmundo, ARCHIVOS_BOOKMUNDO } from '../../src/libro/bookmundo/armar.js';
import type { FotosCapitulo } from '../../src/libro/fotos.js';

const [carpeta, salidaArg] = process.argv.slice(2);
if (!carpeta) {
  console.error('Uso: npx tsx scripts/bookmundo/armar-carpeta.ts <carpeta> [salida]');
  process.exit(1);
}
const salida = salidaArg ?? join(carpeta, 'bookmundo');
const datos = JSON.parse(readFileSync(join(carpeta, 'datos.json'), 'utf8')) as {
  nombre: string; tituloTapa?: string; idioma?: 'es' | 'ca'; trato?: 'vos' | 'tu'; urlVoz: string;
  portada?: string; portadaPosicion?: string; fotos?: Record<string, string[]>;
};
const dataUri = (archivo: string) => {
  const ext = extname(archivo).slice(1).toLowerCase();
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${readFileSync(join(carpeta, archivo)).toString('base64')}`;
};
const p = libroParaPlantilla(readFileSync(join(carpeta, 'libro.md'), 'utf8'));
const fotosPorCapitulo = new Map<string, FotosCapitulo>(
  Object.entries(datos.fotos ?? {}).map(([cap, fotos]) => [cap, { apertura: null, cierre: fotos.map((f) => ({ dataUri: dataUri(f), epigrafe: null })) }]),
);
const lengua = datos.idioma === 'ca' ? 'ca' : datos.trato === 'tu' ? 'es-ES' : 'es-AR';

const r = await armarLibroBookmundo(
  {
    titulo: p.titulo,
    nombreNarrador: datos.nombre,
    tapa: { titulo: datos.tituloTapa ?? null, subtitulo: null },
    indice: p.indice,
    libroMarkdown: p.libroMarkdown,
    fotosPorCapitulo,
    idioma: datos.idioma ?? 'es',
    trato: datos.trato,
  },
  {
    nombreTapa: datos.tituloTapa ?? datos.nombre,
    nombreNarrador: datos.nombre,
    lengua,
    foto: datos.portada ? dataUri(datos.portada) : null,
    fotoPosicion: datos.portadaPosicion,
    urlQr: datos.urlVoz,
  },
);
mkdirSync(salida, { recursive: true });
writeFileSync(join(salida, r.archivoInterior), r.interior);
writeFileSync(join(salida, ARCHIVOS_BOOKMUNDO.cubierta), r.cubierta.png);
writeFileSync(join(salida, ARCHIVOS_BOOKMUNDO.guias), r.cubierta.guias);
writeFileSync(join(salida, ARCHIVOS_BOOKMUNDO.informe), r.informe);
console.log(r.informe);
console.log(`\nArchivos en ${salida}`);
process.exit(r.ok ? 0 : 2);
