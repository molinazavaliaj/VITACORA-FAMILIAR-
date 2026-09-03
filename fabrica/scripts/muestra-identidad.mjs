// Muestra real de la identidad editorial nueva, armada con el texto real de
// Osvaldo (extraído de un PDF viejo a C:\Users\Naza\AppData\Local\Temp\libro-osvaldo.txt,
// sin marcado — hay que reconstruir un Markdown mínimo antes de pasarlo por
// construirHtmlLibro). Node plano, corre después de `npm run build`:
//
//   npm run build && node scripts/muestra-identidad.mjs
//
// Escribe fabrica/muestra-identidad.html siempre, y fabrica/muestra-identidad.pdf
// si hay un chromium de Playwright instalado localmente (si no, avisa cómo
// instalarlo y sigue sin romper).

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_FABRICA = path.resolve(__dirname, '..');
const RUTA_TXT = 'C:\\Users\\Naza\\AppData\\Local\\Temp\\libro-osvaldo.txt';

const CAPITULOS = [
  'La infancia',
  'Las raíces',
  'La juventud',
  'El amor',
  'El oficio',
  'Los hijos',
  'Las pruebas',
  'La sabiduría',
];
const SECCIONES_TITULO = ['A mis lectores', ...CAPITULOS, 'Sus frases', 'Palabras finales'];

function esTituloSeccion(linea) {
  return SECCIONES_TITULO.includes(linea.trim());
}

/**
 * Junta líneas envueltas por la extracción del PDF en párrafos, pero respeta
 * como bloques propios (sin fusionar con el texto de al lado) las líneas que
 * ya son "---" (separador de escena) o "### subtítulo" — en la fuente
 * aparecen pegadas al párrafo anterior sin línea en blanco, así que hay que
 * cortarlas a mano.
 */
function reconstruirBloques(lineasSeccion) {
  const bloques = [];
  let buffer = [];
  function flush() {
    if (buffer.length === 0) return;
    const texto = buffer.join(' ').replace(/\s+/g, ' ').trim();
    if (texto) bloques.push(texto);
    buffer = [];
  }
  for (const lineaCruda of lineasSeccion) {
    const linea = lineaCruda.trim();
    if (linea === '') {
      flush();
      continue;
    }
    if (linea === '---' || linea.startsWith('### ')) {
      flush();
      bloques.push(linea);
      continue;
    }
    buffer.push(linea);
  }
  flush();
  return bloques;
}

/**
 * La extracción del PDF perdió los saltos de línea entre ítems de "Sus
 * frases" (el editor los escribió como "- **frase** — atribución" uno por
 * línea, pero al re-fluir el PDF quedaron todos en un mismo párrafo largo,
 * unidos por " - **"). Se reconstruyen partiendo por ese patrón — es
 * específico de esta muestra, no algo que la plantilla real necesite (la
 * pasada de editor de generar-paquete.ts entrega Markdown de verdad, con
 * saltos de línea intactos).
 */
function partirListaFrases(bloque) {
  if (!bloque.startsWith('- ')) return [bloque];
  return bloque
    .split(/\s-\s(?=\*\*)/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith('- ') ? item : `- ${item}`));
}

async function reconstruirMarkdown() {
  const raw = await readFile(RUTA_TXT, 'utf-8');
  const lineas = raw.split(/\r?\n/);

  const inicio = lineas.findIndex((l) => l.trim() === 'A mis lectores');
  if (inicio === -1) {
    throw new Error('No se encontró la línea "A mis lectores" en el texto fuente — ¿cambió el archivo?');
  }

  const secciones = [];
  let actual = null;
  for (let i = inicio; i < lineas.length; i++) {
    const trim = lineas[i].trim();
    if (trim === 'LOS SALUDOS DE LA FAMILIA') break; // fin del cuerpo del libro en este extracto
    if (esTituloSeccion(trim)) {
      actual = { titulo: trim, lineas: [] };
      secciones.push(actual);
      continue;
    }
    if (actual) actual.lineas.push(lineas[i]);
  }

  const partes = [];
  for (const seccion of secciones) {
    partes.push(`# ${seccion.titulo}`);
    const esSusFrases = seccion.titulo === 'Sus frases';
    for (const bloque of reconstruirBloques(seccion.lineas)) {
      if (bloque === '---' || bloque.startsWith('### ')) {
        partes.push(bloque);
        continue;
      }
      if (esSusFrases && bloque.startsWith('- ')) {
        for (const item of partirListaFrases(bloque)) partes.push(item);
        continue;
      }
      partes.push(bloque);
    }
  }

  return partes.join('\n\n');
}

async function main() {
  const rutaModulo = path.join(RUTA_FABRICA, 'dist', 'libro', 'plantilla-html.js');
  const { construirHtmlLibro } = await import(pathToFileURL(rutaModulo).href);

  const libroMarkdown = await reconstruirMarkdown();

  const html = construirHtmlLibro({
    titulo: 'Osvaldo Benítez — La historia de una vida',
    anioNacimiento: 1952,
    fotoUrl: null, // no hay foto real disponible para esta muestra — ejercita el camino sin frontispicio
    indice: CAPITULOS,
    libroMarkdown,
    saludos: [
      { nombre: 'Claudia', vinculo: 'hija' },
      { nombre: 'Marta', vinculo: 'hermana' },
      { nombre: 'Tomás', vinculo: 'nieto' },
    ],
  });

  const rutaHtml = path.join(RUTA_FABRICA, 'muestra-identidad.html');
  await writeFile(rutaHtml, html, 'utf-8');
  console.log(`HTML escrito: ${rutaHtml}`);

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch (err) {
    console.warn('No se pudo cargar playwright, se omite el PDF:', err.message);
    return;
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.warn('No hay chromium instalado localmente, se omite el PDF.');
    console.warn('Para instalarlo: npx playwright install chromium');
    console.warn(String(err?.message ?? err));
    return;
  }

  try {
    const page = await browser.newPage();
    await page.goto(`file:///${rutaHtml.replace(/\\/g, '/')}`);
    // Da tiempo a que las fuentes de Google Fonts (Playfair Display, Source
    // Serif 4, Archivo) terminen de cargar antes de imprimir — con
    // setContent + page.pdf() directo a veces el PDF sale con la fuente de
    // sistema si la red es lenta.
    await page.waitForLoadState('networkidle');
    const pdf = await page.pdf({ format: 'A5', printBackground: true });
    const rutaPdf = path.join(RUTA_FABRICA, 'muestra-identidad.pdf');
    await writeFile(rutaPdf, pdf);
    console.log(`PDF escrito: ${rutaPdf}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('muestra-identidad.mjs falló:', err);
  process.exitCode = 1;
});
