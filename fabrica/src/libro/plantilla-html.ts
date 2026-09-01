import { escaparHtml } from './comun.js';

/**
 * Convierte el libro entero en Markdown (que devuelve la pasada de editor —
 * un único documento con `# Encabezado` marcando cada página: "A mis
 * lectores", cada capítulo, "Sus frases", el cierre) a HTML. Cada encabezado
 * arranca una `<section>` nueva con salto de página antes (CSS
 * `page-break-before`); párrafos y líneas "> cita" se procesan igual que en
 * la previsualización de un capítulo — no es un parser de Markdown general,
 * el prompt solo pide estas formas.
 */
function libroMarkdownAHtml(markdown: string): string {
  const lineas = markdown.split(/\r?\n/);
  const secciones: string[] = [];

  let tituloActual: string | null = null;
  let bloquesSeccion: string[] = [];
  let parrafoActual: string[] = [];
  let tipoActual: 'p' | 'blockquote' | null = null;

  function cerrarParrafo() {
    if (parrafoActual.length === 0) return;
    const contenido = parrafoActual.join(' ').trim();
    if (contenido) {
      const etiqueta = tipoActual === 'blockquote' ? 'blockquote' : 'p';
      bloquesSeccion.push(`<${etiqueta}>${escaparHtml(contenido)}</${etiqueta}>`);
    }
    parrafoActual = [];
    tipoActual = null;
  }

  function cerrarSeccion() {
    cerrarParrafo();
    if (tituloActual !== null) {
      secciones.push(
        `<section class="capitulo"><h1>${escaparHtml(tituloActual)}</h1>${bloquesSeccion.join('\n')}</section>`
      );
    } else if (bloquesSeccion.length > 0) {
      // Contenido antes del primer encabezado — no debería pasar (el prompt
      // pide arrancar con "# A mis lectores"), pero no lo perdemos.
      secciones.push(`<section class="capitulo">${bloquesSeccion.join('\n')}</section>`);
    }
    bloquesSeccion = [];
    tituloActual = null;
  }

  for (const lineaCruda of lineas) {
    const linea = lineaCruda.trim();

    if (linea.startsWith('# ')) {
      cerrarSeccion();
      tituloActual = linea.replace(/^#\s+/, '');
      continue;
    }

    if (linea === '') {
      cerrarParrafo();
      continue;
    }

    const esCita = linea.startsWith('>');
    const tipo: 'p' | 'blockquote' = esCita ? 'blockquote' : 'p';
    if (tipoActual !== null && tipoActual !== tipo) cerrarParrafo();
    tipoActual = tipo;
    parrafoActual.push(esCita ? linea.replace(/^>\s?/, '') : linea);
  }
  cerrarSeccion();

  return secciones.join('\n');
}

const ESTILOS = `
  @page { size: A5; margin: 20mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; line-height: 1.6; margin: 0; }
  .portada { text-align: center; padding-top: 30%; page-break-after: always; }
  .foto-portada { width: 140px; height: 140px; object-fit: cover; border-radius: 50%; margin: 0 auto 24px; display: block; }
  .portada h1 { font-size: 26px; font-weight: normal; margin: 0; }
  .portada .anio { margin-top: 8px; color: #666; }
  .indice { page-break-after: always; }
  .indice h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; }
  .indice ol { padding-left: 20px; }
  .indice li { margin-bottom: 8px; }
  .capitulo { page-break-before: always; }
  .capitulo h1 { font-size: 22px; font-weight: normal; text-align: center; margin-bottom: 32px; }
  .capitulo p { margin: 0 0 16px; text-align: justify; }
  .capitulo blockquote { margin: 24px 12px; padding-left: 16px; border-left: 3px solid #999; font-style: italic; }
  .saludos { page-break-before: always; }
  .saludos h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; }
  .saludos ul { list-style: none; padding: 0; }
  .saludos li { margin-bottom: 14px; font-size: 15px; }
  .saludos .vinculo { color: #777; font-style: italic; }
`;

export function construirHtmlLibro(datos: {
  titulo: string;
  anioNacimiento?: number | null;
  fotoUrl?: string | null;
  indice: string[];
  libroMarkdown: string;
  saludos: { nombre: string; vinculo: string }[];
}): string {
  const { titulo, anioNacimiento, fotoUrl, indice, libroMarkdown, saludos } = datos;

  const portadaImg = fotoUrl
    ? `<img src="${escaparHtml(fotoUrl)}" alt="" class="foto-portada" />`
    : '';
  const anioHtml = anioNacimiento ? `<p class="anio">${escaparHtml(String(anioNacimiento))}</p>` : '';
  const indiceHtml = indice.map((nombre) => `<li>${escaparHtml(nombre)}</li>`).join('\n');
  const cuerpoHtml = libroMarkdownAHtml(libroMarkdown);
  const saludosHtml = saludos
    .map(
      (s) =>
        `<li>${escaparHtml(s.nombre)} <span class="vinculo">(${escaparHtml(s.vinculo)})</span></li>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escaparHtml(titulo)}</title>
<style>${ESTILOS}</style>
</head>
<body>
  <section class="portada">
    ${portadaImg}
    <h1>${escaparHtml(titulo)}</h1>
    ${anioHtml}
  </section>
  <section class="indice">
    <h2>Índice</h2>
    <ol>${indiceHtml}</ol>
  </section>
  ${cuerpoHtml}
  <section class="saludos">
    <h2>Los saludos de la familia</h2>
    <ul>${saludosHtml}</ul>
  </section>
</body>
</html>`;
}
