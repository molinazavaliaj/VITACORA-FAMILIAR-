// Arma el PDF de un libro de prueba V3 con la plantilla aprobada (docs/arte-libro).
// Uso: npx tsx scripts/v3-pdf.ts <libro.md> <salida.pdf> <nombre> <año de nacimiento> "<título de tapa>" [foto.jpg]
// El markdown: "# Título" por pieza; la introducción, la carta final y "Sus frases" quedan fuera del índice.
// "Sus frases" va como lista SIN comillas propias (la plantilla ya las pone).
import { readFileSync, writeFileSync } from 'node:fs';
import { construirHtmlLibro } from '../src/libro/plantilla-html.js';
import { htmlAPdf } from '../src/libro/pdf.js';

const [entrada, salida, nombre, anio, tituloTapa, foto] = process.argv.slice(2);
if (!entrada || !salida || !nombre || !anio || !tituloTapa) {
  console.error('Uso: npx tsx scripts/v3-pdf.ts <libro.md> <salida.pdf> <nombre> <año> "<título>" [foto.jpg]');
  process.exit(1);
}
const md = readFileSync(entrada, 'utf8').replace(/^- «(.*?)» — /gm, '- $1 — ');
const fuera = new Set(['Introducción', 'Prólogo', 'Antes de cerrar el libro', 'Carta final', 'Sus frases']);
const indice = [...md.matchAll(/^# (.+)$/gm)].map((m) => m[1].trim()).filter((t) => !fuera.has(t));
const fotoUrl = foto ? `data:image/jpeg;base64,${readFileSync(foto).toString('base64')}` : undefined;
const html = await construirHtmlLibro({
  titulo: nombre,
  nombreNarrador: nombre,
  tapa: { titulo: tituloTapa, subtitulo: `La vida de ${nombre}` },
  anioNacimiento: Number(anio),
  fotoUrl,
  indice,
  libroMarkdown: md,
});
writeFileSync(salida, await htmlAPdf(html));
console.log('PDF listo:', salida, `(${indice.length} capítulos en el índice)`);
