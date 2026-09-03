import { escaparHtml } from './comun.js';

// ---------------------------------------------------------------------------
// La identidad visual aprobada (docs/arte-libro/*.dc.html, 9 mockups A5 a
// 559×794px @ 96dpi — casualmente el tamaño EXACTO de una A5 a esa
// resolución, así que casi todo acá se puede pensar en píxeles y mapea 1:1 a
// milímetros). Este archivo traduce esos mockups a la plantilla real que
// consume el libro completo (portada, frontispicio, capítulos, sus frases,
// saludos, colofón, contratapa) para Playwright → PDF A5.
//
// La fábrica renderiza UN solo HTML, pero la paginación del texto corrido la
// hacemos NOSOTROS con un script embebido que corre en el navegador antes de
// imprimir (ver construirScriptPaginador): reparte los bloques de cada
// sección en lienzos A5 de margen CERO. ¿Por qué? Chromium recorta TODO al
// área de contenido cuando @page tiene márgenes — el fondo crema no llega
// nunca al borde de la hoja (queda un parche amarillo flotando en blanco, se
// verificó empíricamente: ni background en html ni un position:fixed
// desbordado pintan el margen). Paginar a mano además habilita los
// ornamentos POR PÁGINA física del mockup (cabecera corrida, riel lateral,
// cruces, círculo) y los folios (números de página), que Chromium no puede
// poner solo (ignora los margin-boxes de @page).
// ---------------------------------------------------------------------------

/**
 * Da formato inline a un fragmento de texto: escapa HTML y convierte
 * `**negrita**` a `<strong>`. El escape va primero — los asteriscos no se
 * tocan al escapar, así que el orden no cambia el resultado, pero deja en
 * claro que nunca metemos markup del texto del narrador sin pasar por
 * `escaparHtml`.
 */
function formatearInline(texto: string): string {
  return escaparHtml(texto).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

type SeccionLibro = {
  /** El texto EXACTO del `# Encabezado` tal cual vino del markdown. Nunca se
   *  transforma (mayúsculas, recortes) en JS — el look "todo en caps" del
   *  identidad se logra con CSS `text-transform`, así el texto de la fuente
   *  queda intacto en el HTML para quien busque el título literal. */
  titulo: string | null;
  /** Los bloques ya convertidos (`<p>`, `<blockquote>`, `<h2>`/`<h3>`, `<ul>`,
   *  separador de escena), unidos, SIN el `<h1>` del título (eso lo arma el
   *  layout según el tipo de página). */
  html: string;
};

/**
 * Convierte el libro entero en Markdown (que devuelve la pasada de editor —
 * un único documento con `# Encabezado` marcando cada página: "A mis
 * lectores", cada capítulo, "Sus frases", el cierre) a una lista de
 * secciones ya renderizadas a HTML. Dentro de un capítulo también
 * reconocemos: `##`/`###` como subtítulos, `**negrita**` inline, líneas `- `
 * como ítems de lista, y una línea de solo guiones (`---`) como separador de
 * escena (el ornamento círculo-con-punto de PaginaTexto.dc.html, no un
 * `<hr>` crudo). No es un parser de Markdown general, el prompt solo pide
 * estas formas. Ojo: una lista se detecta solo por `- ` al arranque de la
 * línea (después de trim); no partimos una línea por " - " en el medio,
 * porque el modelo a veces usa raya (—) para asides y eso NO es un ítem de
 * lista.
 */
function parsearSeccionesLibro(markdown: string): SeccionLibro[] {
  const lineas = markdown.split(/\r?\n/);
  const secciones: SeccionLibro[] = [];

  let tituloActual: string | null = null;
  let bloquesSeccion: string[] = [];
  let parrafoActual: string[] = [];
  let itemsLista: string[] = [];
  let tipoActual: 'p' | 'blockquote' | 'lista' | null = null;
  let huboContenido = false;

  function cerrarParrafo() {
    if (tipoActual === 'lista') {
      if (itemsLista.length > 0) {
        const items = itemsLista.map((item) => `<li>${formatearInline(item)}</li>`).join('');
        bloquesSeccion.push(`<ul>${items}</ul>`);
      }
      itemsLista = [];
      tipoActual = null;
      return;
    }
    if (parrafoActual.length === 0) return;
    const contenido = parrafoActual.join(' ').trim();
    if (contenido) {
      const etiqueta = tipoActual === 'blockquote' ? 'blockquote' : 'p';
      bloquesSeccion.push(`<${etiqueta}>${formatearInline(contenido)}</${etiqueta}>`);
    }
    parrafoActual = [];
    tipoActual = null;
  }

  function cerrarSeccion() {
    cerrarParrafo();
    if (tituloActual !== null || bloquesSeccion.length > 0) {
      secciones.push({ titulo: tituloActual, html: bloquesSeccion.join('\n') });
    }
    bloquesSeccion = [];
    tituloActual = null;
  }

  for (const lineaCruda of lineas) {
    const linea = lineaCruda.trim();

    if (linea.startsWith('# ')) {
      cerrarSeccion();
      tituloActual = linea.replace(/^#\s+/, '');
      huboContenido = true;
      continue;
    }

    if (linea === '') {
      cerrarParrafo();
      continue;
    }

    const matchSubtitulo = linea.match(/^(#{2,3})\s+(.*)$/);
    if (matchSubtitulo) {
      cerrarParrafo();
      const etiqueta = matchSubtitulo[1].length === 2 ? 'h2' : 'h3';
      bloquesSeccion.push(`<${etiqueta}>${formatearInline(matchSubtitulo[2])}</${etiqueta}>`);
      huboContenido = true;
      continue;
    }

    // Separador de escena: una línea de solo guiones (mínimo 3), el "---"
    // que el editor usa entre bloques de una misma página. En el identidad
    // no es un <hr>, es el ornamento círculo-con-punto entre líneas finas.
    if (/^-{3,}$/.test(linea)) {
      cerrarParrafo();
      bloquesSeccion.push(
        '<div class="separador-escena"><span class="linea-sep"></span><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="5.2" stroke="var(--acento)" stroke-width="0.9"/><circle cx="6" cy="6" r="1.1" fill="var(--acento)"/></svg><span class="linea-sep"></span></div>'
      );
      huboContenido = true;
      continue;
    }

    if (linea.startsWith('- ')) {
      if (tipoActual !== 'lista') cerrarParrafo();
      tipoActual = 'lista';
      itemsLista.push(linea.replace(/^-\s+/, ''));
      huboContenido = true;
      continue;
    }

    const esCita = linea.startsWith('>');
    const tipo: 'p' | 'blockquote' = esCita ? 'blockquote' : 'p';
    if (tipoActual !== null && tipoActual !== tipo) cerrarParrafo();
    tipoActual = tipo;
    parrafoActual.push(esCita ? linea.replace(/^>\s?/, '') : linea);
    huboContenido = true;
  }
  cerrarSeccion();

  return huboContenido ? secciones : [];
}

/** "Roberto — La historia de una vida" → "Roberto". Si no hay separador
 *  " — " (el que arma `generarEstructura`), se usa el título entero: mejor
 *  mostrar algo de más que romper el layout. */
function extraerNombreNarrador(titulo: string): string {
  const partes = titulo.split(' — ');
  return (partes.length > 1 ? partes[0] : titulo).trim();
}

/** "Osvaldo Benítez" → "O·B". Un solo nombre → su inicial sola. Sin nombre →
 *  vacío (el monograma simplemente no se dibuja). */
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return `${partes[0].charAt(0).toUpperCase()}·${partes[partes.length - 1].charAt(0).toUpperCase()}`;
}

/**
 * La frase héroe de la contratapa: la primera cita de la sección "Sus
 * frases", si existe. El prompt de la pasada de editor no fija el formato
 * de esa página, así que el modelo puede volcarla como citas (`> ...`) o
 * como lista (`- **frase** — atribución`) — se prueba primero `<blockquote>`
 * (el formato "limpio", cuyo texto se puede sacar del listado de abajo sin
 * dejar restos) y si no hay ninguna, el primer `<li>` (cortando en la raya
 * de atribución si la tiene, para no arrastrar el "— Fulano" al título
 * gigante de portada/contratapa). `seccion.html` ya viene escapado por
 * `parsearSeccionesLibro` — se reutiliza tal cual. Sin sección "Sus frases"
 * o sin ninguna cita adentro, `null`: la contratapa omite el bloque entero
 * (así lo pide la spec).
 */
function extraerFraseHeroe(secciones: SeccionLibro[]): string | null {
  const seccionFrases = secciones.find((s) => (s.titulo ?? '').trim().toLowerCase() === 'sus frases');
  if (!seccionFrases) return null;
  const matchCita = seccionFrases.html.match(/<blockquote>([\s\S]*?)<\/blockquote>/);
  if (matchCita) return matchCita[1];
  const matchItem = seccionFrases.html.match(/<li>([\s\S]*?)<\/li>/);
  if (matchItem) return matchItem[1].split(/\s—\s/)[0].trim();
  return null;
}

/** Año actual en números romanos (MMXXVI, etc.) para el colofón — es la
 *  fecha de fabricación del libro, no un dato del narrador. */
function anioRomano(anio: number): string {
  const valores: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let resto = anio;
  let resultado = '';
  for (const [valor, simbolo] of valores) {
    while (resto >= valor) {
      resultado += simbolo;
      resto -= valor;
    }
  }
  return resultado;
}

// --- Ornamentos SVG reutilizados en varias páginas --------------------------

function svgGrano(seed: number): string {
  const id = `grano${seed}`;
  return `<svg style="position:absolute;inset:0;opacity:0.5;pointer-events:none;" width="559" height="794" xmlns="http://www.w3.org/2000/svg">
    <filter id="${id}">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="${seed}"></feTurbulence>
      <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.38  0 0 0 0 0.33  0 0 0 0.06 0"></feColorMatrix>
    </filter>
    <rect width="559" height="794" filter="url(#${id})"></rect>
  </svg>`;
}

function svgCirculoCortado(opts: {
  top?: number; left?: number; right?: number; bottom?: number;
  size: number; color?: string; segundoAnillo?: boolean;
}): string {
  const { top, left, right, bottom, size, color = '#eee9df', segundoAnillo = false } = opts;
  const pos = [
    top !== undefined ? `top:${top}px;` : '',
    left !== undefined ? `left:${left}px;` : '',
    right !== undefined ? `right:${right}px;` : '',
    bottom !== undefined ? `bottom:${bottom}px;` : '',
  ].join('');
  const r = size / 2;
  const anillo2 = segundoAnillo
    ? `<circle cx="${r}" cy="${r}" r="${r - (r * 0.26)}" stroke="#f2eee5" stroke-width="0.8"></circle>`
    : '';
  return `<svg style="position:absolute;${pos}pointer-events:none;" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${r}" cy="${r}" r="${r - 2}" stroke="${color}" stroke-width="1.2"></circle>
    ${anillo2}
  </svg>`;
}

function svgMedallion(opts: {
  size: number;
  texto: string;
  colorAro: string;
  colorTexto: string;
  puntosCardinales?: boolean;
  colorPuntos?: string;
}): string {
  const { size, texto, colorAro, colorTexto, puntosCardinales = false, colorPuntos = '#6e2618' } = opts;
  const r = size / 2;
  const rAro = r - 1.2;
  const fs = size * 0.29;
  const puntos = puntosCardinales
    ? `<circle cx="${r}" cy="2.5" r="2" fill="${colorPuntos}"></circle>
       <circle cx="${r}" cy="${size - 2.5}" r="2" fill="${colorPuntos}"></circle>
       <circle cx="2.5" cy="${r}" r="2" fill="${colorPuntos}"></circle>
       <circle cx="${size - 2.5}" cy="${r}" r="2" fill="${colorPuntos}"></circle>`
    : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${r}" cy="${r}" r="${rAro}" stroke="${colorAro}" stroke-width="1"></circle>
    <text x="${r}" y="${r + fs * 0.32}" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-size="${fs}" font-style="italic" fill="${colorTexto}">${escaparHtml(texto)}</text>
    ${puntos}
  </svg>`;
}

function svgCruz(top: number, left?: number, right?: number): string {
  const pos = left !== undefined ? `left:${left}px;` : `right:${right}px;`;
  return `<svg style="position:absolute;top:${top}px;${pos}pointer-events:none;" width="11" height="11" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 0 V11 M0 5.5 H11" stroke="#c9a795" stroke-width="1"></path></svg>`;
}

// --- Hoja de estilos ---------------------------------------------------------

/**
 * A5 a 96dpi es EXACTAMENTE 559×794px (148×210mm) — TODAS las páginas
 * (las de arte Y las de texto que arma el paginador embebido) son lienzos
 * de 148mm×210mm con margen de página CERO, calcados casi literal de los
 * mockups. Los "márgenes" de las páginas de texto son la columna interior
 * (.columna-texto, el padding 92/64/70/72px de PaginaTexto.dc.html); el
 * papel crema llega así hasta el borde físico de la hoja en todo el libro.
 */
function construirEstilos(acento: string): string {
  return `
  :root {
    --papel: #faf7f1;
    --tinta: #1c1917;
    --acento: ${acento};
    --gris1: #a8a29e;
    --gris3: #57534e;
    --gris4: #44403c;
    --gris5: #292524;
    --linea: #e2ddd3;
    --linea2: #eee9df;
    --marfil2: #d6d1c7;
    --tostado: #c9a795;
  }
  @page { size: A5; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  html, body {
    background: var(--papel);
  }
  body {
    font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif;
    color: var(--tinta);
  }

  .lienzo {
    width: 148mm;
    height: 210mm;
    position: relative;
    overflow: hidden;
    background: var(--papel);
    color: var(--tinta);
  }
  .lienzo.oscuro { background: var(--tinta); color: var(--papel); }
  .quiebre { page-break-after: always; }
  .antes { page-break-before: always; }

  .franja {
    position: absolute; top: 0; right: 0; bottom: 0; width: 52px;
    background: var(--acento);
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    padding: 26px 0;
  }
  .franja.izquierda { right: auto; left: 0; }
  .franja .vertical {
    writing-mode: vertical-rl; font-family: Archivo, Arial, sans-serif; font-size: 10px;
    letter-spacing: 0.32em; color: var(--papel);
  }
  .franja.izquierda .vertical { transform: rotate(180deg); }
  .franja .chip { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 17px; color: var(--papel); }

  /* Portada */
  .portada-marca { position: absolute; top: 40px; left: 44px; display: flex; flex-direction: column; gap: 3px; }
  .portada-marca .nombre { font-family: Archivo, Arial, sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.34em; }
  .portada-marca .tagline { font-family: Archivo, Arial, sans-serif; font-size: 10px; letter-spacing: 0.22em; color: var(--gris1); }
  .portada-nombre-narrador {
    position: absolute; top: 178px; left: 44px; right: 72px;
    font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 60px;
    line-height: 1.05; letter-spacing: -0.01em; overflow-wrap: break-word;
  }
  .portada-pie { position: absolute; left: 44px; bottom: 52px; display: flex; flex-direction: column; gap: 6px; max-width: 420px; }
  .portada-pie .regla { width: 200px; height: 1px; background: var(--tinta); margin-bottom: 12px; }
  .portada-pie .cita { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 15px; color: var(--gris4); }
  .portada-pie .tag { font-family: Archivo, Arial, sans-serif; font-size: 10px; letter-spacing: 0.24em; color: var(--gris1); }

  /* Frontispicio */
  .frontispicio-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.05) brightness(0.96); }
  .frontispicio-velo { position: absolute; inset: 0; background: linear-gradient(to top, rgba(20,17,15,0.86) 0%, rgba(20,17,15,0) 46%); }
  .frontispicio-eyebrow { position: absolute; top: 24px; right: 24px; font-family: Archivo, Arial, sans-serif; font-size: 9px; letter-spacing: 0.3em; color: rgba(250,247,241,0.5); text-align: right; }
  .frontispicio-pie { position: absolute; left: 44px; bottom: 52px; display: flex; flex-direction: column; gap: 10px; }
  .frontispicio-pie .regla { width: 36px; height: 1px; background: var(--papel); opacity: 0.6; }
  .frontispicio-pie .nombre { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 40px; line-height: 1.05; }
  .frontispicio-pie .tag { font-family: Archivo, Arial, sans-serif; font-size: 10px; letter-spacing: 0.3em; color: rgba(250,247,241,0.7); }

  /* Apertura de capítulo (calcada de AperturaCapitulo.dc.html) */
  .apertura .numeral {
    position: absolute; top: 46px; right: -74px;
    font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 330px; line-height: 0.8; color: var(--tinta);
  }
  .apertura .marca-narrador { position: absolute; top: 40px; left: 44px; font-family: Archivo, Arial, sans-serif; font-size: 10px; letter-spacing: 0.3em; color: var(--gris1); text-transform: uppercase; }
  .apertura .marca-cap { position: absolute; top: 40px; right: 44px; font-family: Archivo, Arial, sans-serif; font-size: 10px; letter-spacing: 0.3em; color: var(--acento); font-weight: 600; }
  .apertura .cuerpo-apertura { position: absolute; top: 356px; left: 44px; right: 100px; display: flex; flex-direction: column; gap: 16px; }
  .apertura .cap-nombre { font-family: Archivo, Arial, sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.4em; text-transform: uppercase; }
  .apertura .regla-acento { width: 44px; height: 1px; background: var(--acento); }
  .apertura .medallion-wrap { margin-top: 6px; }

  /* Páginas de texto: las arma el paginador embebido moviendo los bloques de
     cada <section class="fuente-texto"> a lienzos con este cromo por página
     (PaginaTexto.dc.html: cabecera corrida, riel lateral, cruces, círculo,
     pie con ornamento y folio). La fuente queda visible tal cual si el
     script no corre (fallback legible, sin cromo). */
  .cabecera-pagina {
    position: absolute; top: 42px; left: 72px; right: 64px;
    display: flex; align-items: baseline; justify-content: space-between;
    border-bottom: 1px solid var(--linea); padding-bottom: 10px;
  }
  .cabecera-pagina .etiqueta { font-family: Archivo, Arial, sans-serif; font-weight: 600; font-size: 10px; letter-spacing: 0.32em; color: var(--acento); text-transform: uppercase; }
  .cabecera-pagina .narrador { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 13px; color: var(--gris1); }
  .riel { position: absolute; left: 30px; top: 130px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .riel .riel-texto { writing-mode: vertical-rl; transform: rotate(180deg); font-family: Archivo, Arial, sans-serif; font-size: 9px; letter-spacing: 0.3em; color: var(--marfil2); text-transform: uppercase; }
  .riel .riel-linea { width: 1px; height: 64px; background: linear-gradient(to bottom, var(--linea) 0%, var(--linea) 45%, transparent 45%, transparent 55%, var(--linea) 55%, var(--linea) 100%); }
  .riel .riel-punto { width: 5px; height: 5px; border: 1px solid var(--acento); border-radius: 50%; }
  .pie-pagina { position: absolute; bottom: 44px; left: 72px; right: 64px; display: flex; justify-content: space-between; align-items: center; }
  .pie-pagina .adorno { display: flex; align-items: center; gap: 8px; }
  .pie-pagina .adorno .p { width: 4px; height: 4px; border: 1px solid var(--acento); border-radius: 50%; }
  .pie-pagina .adorno .r { width: 28px; height: 1px; background: var(--linea); }
  .folio { font-family: Archivo, Arial, sans-serif; font-size: 11px; letter-spacing: 0.2em; color: var(--acento); }
  .columna-texto { position: absolute; top: 92px; left: 72px; right: 64px; bottom: 70px; overflow: hidden; }

  .columna-texto p, .fuente-texto p { font-size: 15px; line-height: 1.78; color: var(--gris5); margin: 0 0 15px; text-align: justify; }
  .columna-texto p + p, .fuente-texto p + p { text-indent: 22px; }
  /* Un párrafo partido por el corte de página: la primera mitad justifica
     también su última línea (como una línea del medio en un libro real) y la
     continuación arranca sin sangría. */
  .columna-texto p.sigue { text-align-last: justify; }
  .columna-texto p.continuacion { text-indent: 0; }
  .columna-texto h2, .fuente-texto h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 20px; margin: 30px 0 14px; }
  .columna-texto h3, .fuente-texto h3 { font-family: Archivo, Arial, sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--acento); margin: 28px 0 12px; }
  .columna-texto blockquote, .fuente-texto blockquote {
    font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 21px; line-height: 1.5;
    margin: 22px 0; padding: 2px 0 2px 20px; border-left: 2px solid var(--acento); color: var(--tinta);
  }
  .columna-texto ul, .fuente-texto ul { margin: 0 0 16px; padding-left: 20px; }
  .columna-texto li, .fuente-texto li { font-size: 15px; line-height: 1.7; color: var(--gris5); margin-bottom: 10px; text-align: justify; }

  .separador-escena { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 6px 0 22px; }
  .separador-escena .linea-sep { width: 44px; height: 1px; background: var(--linea); }

  .titulo-simple {
    font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 400; font-size: 30px;
    margin: 0 0 10px;
  }
  .titulo-simple-regla { width: 44px; height: 1px; background: var(--acento); margin: 0 0 28px; }

  /* Sus frases */
  .sus-frases-titulo {
    font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-style: italic; font-size: 52px;
    line-height: 1; text-transform: uppercase; letter-spacing: -0.01em;
  }
  .sus-frases-eyebrow {
    position: absolute; top: 56px; right: 44px; writing-mode: vertical-rl;
    font-family: Archivo, Arial, sans-serif; font-size: 10px; letter-spacing: 0.3em; color: var(--gris1);
  }
  .sus-frases-hero { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 500; font-size: 40px; line-height: 1.2; margin: 0 0 12px; }
  .sus-frases-hero-tag { font-family: Archivo, Arial, sans-serif; font-size: 10px; letter-spacing: 0.2em; color: var(--acento); font-weight: 600; text-transform: uppercase; }
  .sus-frases-narrador { position: absolute; left: 44px; bottom: 46px; font-family: Archivo, Arial, sans-serif; font-size: 10px; letter-spacing: 0.26em; color: var(--gris1); text-transform: uppercase; }

  /* Saludos */
  .saludos-titulo { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 34px; margin: 0 0 6px; }
  .saludos-lista { list-style: none; padding: 0; margin: 34px 0 0; display: flex; flex-direction: column; gap: 16px; }
  .saludos-lista li { font-size: 16px; font-family: 'Source Serif 4', Georgia, serif; }
  .saludos-lista .vinculo { color: var(--gris1); font-style: italic; font-size: 13px; margin-left: 8px; }

  /* Colofón */
  .colofon-centro { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; text-align: center; padding: 0 60px; }
  .colofon-linea1 { font-size: 14.5px; line-height: 1.75; color: var(--gris3); }
  .colofon-nombre { font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 25px; letter-spacing: 0.02em; text-transform: uppercase; }
  .colofon-linea2 { font-size: 14.5px; line-height: 1.75; color: var(--gris3); max-width: 320px; }
  .colofon-marca { font-family: Archivo, Arial, sans-serif; font-size: 15px; letter-spacing: 0.38em; font-weight: 700; }
  .colofon-anio { font-family: Archivo, Arial, sans-serif; font-size: 10px; letter-spacing: 0.26em; color: var(--gris1); }
  .colofon-cierre { position: absolute; bottom: 44px; left: 0; right: 0; text-align: center; font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 13px; color: var(--gris1); }
  .puntito { display: flex; align-items: center; gap: 9px; }
  .puntito .r { width: 30px; height: 1px; background: var(--linea); }
  .puntito .p { width: 4px; height: 4px; border: 1px solid var(--acento); border-radius: 50%; }

  /* Contratapa */
  .contratapa-hero { position: absolute; left: 116px; right: 56px; top: 200px; display: flex; flex-direction: column; gap: 20px; }
  .contratapa-comilla { font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 60px; line-height: 1; color: var(--acento); }
  .contratapa-cita { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 500; font-size: 30px; line-height: 1.3; margin-top: -30px; }
  .contratapa-firma { display: flex; align-items: center; gap: 12px; }
  .contratapa-firma .regla { width: 32px; height: 1px; background: var(--tinta); }
  .contratapa-firma .nombre { font-family: Archivo, Arial, sans-serif; font-size: 10px; letter-spacing: 0.28em; color: var(--gris3); text-transform: uppercase; }
  .contratapa-pie { position: absolute; left: 116px; bottom: 52px; right: 56px; display: flex; flex-direction: column; gap: 8px; }
  .contratapa-pie .desc { font-size: 13.5px; line-height: 1.7; color: var(--gris3); max-width: 330px; }
  .contratapa-pie .tag { font-family: Archivo, Arial, sans-serif; font-size: 9px; letter-spacing: 0.26em; color: var(--gris1); }
  `;
}

// --- Bloques de página -------------------------------------------------------

function construirPortada(opts: { titulo: string; nombreNarrador: string; anioNacimiento?: number | null; mono: string; fraseHeroe: string | null }): string {
  const { nombreNarrador, anioNacimiento, mono, fraseHeroe } = opts;
  const anioTexto = anioNacimiento ? String(anioNacimiento) : '';
  const citaHtml = fraseHeroe ? `<div class="cita">«${fraseHeroe}»</div>` : '';
  return `<div class="lienzo quiebre">
    ${svgGrano(7)}
    ${svgCirculoCortado({ top: -150, left: -150, size: 340 })}
    <div class="portada-marca">
      <div class="nombre">VITÁCORA FAMILIAR</div>
      <div class="tagline">UNA VIDA · CONTADA CON SU VOZ</div>
    </div>
    <div class="portada-nombre-narrador">${escaparHtml(nombreNarrador)}</div>
    <div class="portada-pie">
      <div class="regla"></div>
      ${citaHtml}
      <div class="tag">LA HISTORIA DE UNA VIDA${anioTexto ? ` · DESDE ${escaparHtml(anioTexto)}` : ''}</div>
    </div>
    <div class="franja">
      <div class="chip">${anioTexto ? escaparHtml(anioTexto) : ''}</div>
      <div class="vertical">LA HISTORIA DE UNA VIDA —</div>
      ${svgMedallion({ size: 34, texto: mono, colorAro: '#faf7f1', colorTexto: '#faf7f1' })}
    </div>
  </div>`;
}

function construirFrontispicio(opts: { fotoUrl: string; nombreNarrador: string; anioNacimiento?: number | null }): string {
  const { fotoUrl, nombreNarrador, anioNacimiento } = opts;
  return `<div class="lienzo oscuro quiebre">
    <img class="frontispicio-img" src="${escaparHtml(fotoUrl)}" alt="" />
    <div class="frontispicio-velo"></div>
    <div class="frontispicio-eyebrow">RETRATO DEL NARRADOR</div>
    <div class="frontispicio-pie">
      <div class="regla"></div>
      <div class="nombre">${escaparHtml(nombreNarrador)}</div>
      ${anioNacimiento ? `<div class="tag">${escaparHtml(String(anioNacimiento))} —</div>` : ''}
    </div>
  </div>`;
}

function construirAperturaCapitulo(opts: { numero: number; nombreCapitulo: string; nombreNarrador: string; mono: string }): string {
  const { numero, nombreCapitulo, nombreNarrador, mono } = opts;
  const numeroTexto = String(numero).padStart(2, '0');
  return `<div class="lienzo apertura quiebre">
    ${svgCruz(46, 32)}
    ${svgCruz(46, undefined, 32)}
    ${svgCirculoCortado({ top: -120, right: -120, size: 280, segundoAnillo: true })}
    <div class="marca-narrador">${escaparHtml(nombreNarrador)}</div>
    <div class="marca-cap">CAP.</div>
    <div class="numeral">${numeroTexto}</div>
    <div class="cuerpo-apertura">
      <div class="cap-nombre">${escaparHtml(nombreCapitulo)}</div>
      <div class="regla-acento"></div>
      <div class="medallion-wrap">${svgMedallion({ size: 40, texto: mono, colorAro: '#1c1917', colorTexto: '#1c1917' })}</div>
    </div>
    <div class="pie-pagina"><span></span><span class="folio"></span></div>
  </div>`;
}

function construirCapitulo(opts: {
  numero: number;
  seccion: SeccionLibro;
  nombreNarrador: string;
  mono: string;
}): string {
  const { numero, seccion, nombreNarrador, mono } = opts;
  const nombreCapitulo = seccion.titulo ?? '';
  const rail = `CAP. ${String(numero).padStart(2, '0')} · ${nombreCapitulo}`;
  return `${construirAperturaCapitulo({ numero, nombreCapitulo, nombreNarrador, mono })}
  <section class="fuente-texto antes" data-etiqueta="${escaparHtml(nombreCapitulo)}" data-rail="${escaparHtml(rail)}">
    ${seccion.html}
  </section>`;
}

function construirPaginaSimple(seccion: SeccionLibro): string {
  const titulo = seccion.titulo ?? '';
  return `<section class="fuente-texto antes" data-etiqueta="${escaparHtml(titulo)}" data-rail="${escaparHtml(titulo)}" data-primera="portadilla">
    ${titulo ? `<h1 class="titulo-simple">${escaparHtml(titulo)}</h1><div class="titulo-simple-regla"></div>` : ''}
    ${seccion.html}
  </section>`;
}

function construirSusFrases(opts: { seccion: SeccionLibro; nombreNarrador: string; fraseHeroe: string | null }): string {
  const { seccion, nombreNarrador, fraseHeroe } = opts;
  // El resto de la sección, sin repetir la primera cita que ya se usó como
  // héroe — solo cuando viene de un `<blockquote>` (match exacto y seguro).
  // Cuando `fraseHeroe` sale del formato lista (fallback del primer `<li>`,
  // recortado en la raya de atribución), NO se toca la lista: rehacer ese
  // recorte acá para sacar el `<li>` completo arriesgaría romper el
  // contrato "una lista de N ítems se renderiza como N <li>" — se prefiere
  // una pequeña repetición visual (la frase aparece en el héroe Y en la
  // lista) antes que tocar cuántos ítems tiene la lista.
  const resto = fraseHeroe
    ? seccion.html.replace(`<blockquote>${fraseHeroe}</blockquote>`, '')
    : seccion.html;
  const heroHtml = fraseHeroe
    ? `<div class="sus-frases-hero">«${fraseHeroe}»</div>
       <div class="sus-frases-hero-tag">Si se lleva una sola de todo el libro, es esta</div>`
    : '';
  const titulo = seccion.titulo ?? 'Sus frases';
  // La página de arte lleva SOLO el título y la frase héroe (entra siempre);
  // el listado completo fluye después por el paginador, para que ninguna
  // frase se pierda por un overflow:hidden — antes se cortaban en silencio.
  return `<div class="lienzo quiebre">
    ${svgCirculoCortado({ top: -30, left: 300, size: 240, color: '#f2eee5' })}
    <div class="sus-frases-eyebrow">TAL CUAL LAS DICE · PARA QUE NO SE PIERDAN</div>
    <div style="position:absolute; top:48px; left:44px; right:100px;">
      <div class="sus-frases-titulo">${escaparHtml(titulo)}</div>
    </div>
    <div style="position:absolute; top:230px; left:44px; right:44px;">
      ${heroHtml}
    </div>
    <div class="sus-frases-narrador">${escaparHtml(nombreNarrador)}</div>
  </div>
  <section class="fuente-texto antes" data-etiqueta="${escaparHtml(titulo)}" data-rail="${escaparHtml(titulo)}">
    ${resto}
  </section>`;
}

function construirSaludos(saludos: { nombre: string; vinculo: string }[]): string {
  if (saludos.length === 0) return '';
  const items = saludos
    .map((s) => `<li>${escaparHtml(s.nombre)} <span class="vinculo">(${escaparHtml(s.vinculo)})</span></li>`)
    .join('\n');
  return `<section class="fuente-texto antes saludos" data-etiqueta="Los saludos" data-rail="Los saludos de la familia" data-primera="portadilla">
    <h1 class="saludos-titulo">Los saludos de la familia</h1>
    <div class="titulo-simple-regla"></div>
    <ul class="saludos-lista">${items}</ul>
  </section>`;
}

function construirColofon(opts: { nombreNarrador: string; mono: string }): string {
  const { nombreNarrador, mono } = opts;
  const anio = new Date().getFullYear();
  return `<div class="lienzo quiebre antes">
    ${svgGrano(11)}
    ${svgCruz(46, 32)}
    ${svgCruz(46, undefined, 32)}
    ${svgCruz(748, 32)}
    ${svgCruz(748, undefined, 32)}
    <div class="colofon-centro">
      ${svgMedallion({ size: 150, texto: mono, colorAro: '#1c1917', colorTexto: '#1c1917', puntosCardinales: true, colorPuntos: 'var(--acento)' })}
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        <div class="colofon-linea1">Este libro fue contado por</div>
        <div class="colofon-nombre">${escaparHtml(nombreNarrador)}</div>
        <div class="colofon-linea2">con su propia voz, y guardado para siempre por</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:11px;">
        <div class="colofon-marca">VITÁCORA FAMILIAR</div>
        <div class="puntito"><span class="r"></span><span class="p"></span><span class="r"></span></div>
        <div class="colofon-anio">${anioRomano(anio)}</div>
      </div>
    </div>
    <div class="colofon-cierre">«Acá adentro están todos vivos.»</div>
  </div>`;
}

function construirContratapa(opts: { fraseHeroe: string | null; nombreNarrador: string; anioNacimiento?: number | null; mono: string }): string {
  const { fraseHeroe, nombreNarrador, anioNacimiento, mono } = opts;
  const heroHtml = fraseHeroe
    ? `<div class="contratapa-hero">
        <div class="contratapa-comilla">&ldquo;</div>
        <div class="contratapa-cita">${fraseHeroe}</div>
        <div class="contratapa-firma"><span class="regla"></span><span class="nombre">${escaparHtml(nombreNarrador)}</span></div>
      </div>`
    : '';
  return `<div class="lienzo antes">
    ${svgGrano(4)}
    <div class="franja izquierda">
      ${svgMedallion({ size: 34, texto: 'V·F', colorAro: '#faf7f1', colorTexto: '#faf7f1' })}
      <div class="vertical">VITÁCORA FAMILIAR · UNA COLECCIÓN DE VIDAS CONTADAS</div>
      <div class="chip">${anioNacimiento ? escaparHtml(String(anioNacimiento)) : ''}</div>
    </div>
    ${svgCirculoCortado({ bottom: -130, right: -130, size: 300 })}
    ${heroHtml}
    <div class="contratapa-pie">
      <div class="desc">Su historia, contada con su propia voz. Un libro que se lee con los ojos y se escucha con su voz.</div>
      <div class="tag">LA HISTORIA DE UNA VIDA${anioNacimiento ? ` · DESDE ${escaparHtml(String(anioNacimiento))}` : ''}</div>
    </div>
  </div>`;
}

// --- Paginador embebido ------------------------------------------------------

/**
 * El script que corre DENTRO del navegador (Playwright) antes de imprimir:
 * reparte los bloques de cada `<section class="fuente-texto">` en lienzos A5
 * completos con el cromo de PaginaTexto.dc.html (cabecera corrida, riel,
 * cruces, círculo, pie con folio), partiendo párrafos largos por palabras y
 * listas por ítems. Al terminar numera los folios y marca
 * `window.__libroPaginado = true` — quien imprime debe esperar esa marca.
 * Si algo falla, la marca se pone igual (el fallback es la fuente sin cromo,
 * nunca un PDF colgado ni contenido perdido).
 */
function construirScriptPaginador(): string {
  return `<script>
(function () {
  var HOLGURA = 1; // px de tolerancia al medir desbordes

  function desborda(col) {
    return col.scrollHeight > col.clientHeight + HOLGURA;
  }

  function esEncabezado(el) {
    return /^H[1-3]$/.test(el.tagName)
      || el.classList.contains('titulo-simple-regla')
      || el.classList.contains('separador-escena');
  }

  // Cromo fijo de cada página de texto (círculo cortado + cruces de registro).
  var ORNAMENTOS =
    '<svg style="position:absolute;top:-120px;right:-120px;pointer-events:none;" width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="140" cy="140" r="138" stroke="#eee9df" stroke-width="1.2"></circle>' +
    '<circle cx="140" cy="140" r="112" stroke="#f2eee5" stroke-width="0.8"></circle></svg>' +
    '<svg style="position:absolute;top:46px;left:32px;pointer-events:none;" width="11" height="11" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 0 V11 M0 5.5 H11" stroke="#c9a795" stroke-width="1"></path></svg>' +
    '<svg style="position:absolute;bottom:46px;right:32px;pointer-events:none;" width="11" height="11" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 0 V11 M0 5.5 H11" stroke="#c9a795" stroke-width="1"></path></svg>';

  function crearPagina(fuente, meta, esPrimera) {
    var lienzo = document.createElement('div');
    lienzo.className = 'lienzo pagina-texto quiebre';
    var html = ORNAMENTOS;
    var sinCabecera = esPrimera && meta.portadilla;
    if (!sinCabecera) {
      html += '<div class="cabecera-pagina"><span class="etiqueta"></span><span class="narrador"></span></div>';
    }
    html += '<div class="riel"><span class="riel-texto"></span><span class="riel-linea"></span><span class="riel-punto"></span></div>';
    html += '<div class="pie-pagina"><span class="adorno"><span class="p"></span><span class="r"></span></span><span class="folio"></span></div>';
    html += '<div class="columna-texto"></div>';
    lienzo.innerHTML = html;
    // Los textos van por textContent (nunca innerHTML) — vienen del narrador.
    var etiqueta = lienzo.querySelector('.cabecera-pagina .etiqueta');
    if (etiqueta) etiqueta.textContent = meta.etiqueta;
    var narrador = lienzo.querySelector('.cabecera-pagina .narrador');
    if (narrador) narrador.textContent = meta.narrador;
    lienzo.querySelector('.riel-texto').textContent = meta.rail;
    fuente.parentNode.insertBefore(lienzo, fuente);
    return lienzo.querySelector('.columna-texto');
  }

  // Aplana un párrafo a tokens palabra/espacio recordando si van en <strong>
  // (la única marca inline que emite la plantilla).
  function tokenizar(p) {
    var toks = [];
    function volcar(texto, strong) {
      var partes = texto.split(/(\\s+)/);
      for (var i = 0; i < partes.length; i++) {
        if (partes[i]) toks.push({ tx: partes[i], strong: strong });
      }
    }
    for (var n = p.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === Node.TEXT_NODE) volcar(n.textContent, false);
      else volcar(n.textContent, n.tagName === 'STRONG');
    }
    return toks;
  }

  function armarDesdeTokens(toks, desde, hasta, clase) {
    var p = document.createElement('p');
    if (clase) p.className = clase;
    var strongActual = null;
    for (var i = desde; i < hasta; i++) {
      var t = toks[i];
      if (t.strong) {
        if (!strongActual) {
          strongActual = document.createElement('strong');
          p.appendChild(strongActual);
        }
        strongActual.appendChild(document.createTextNode(t.tx));
      } else {
        strongActual = null;
        p.appendChild(document.createTextNode(t.tx));
      }
    }
    return p;
  }

  // Parte un párrafo desbordado: deja en la columna la porción más grande
  // que entra (con la última línea justificada) y devuelve el resto como
  // párrafo de continuación. Devuelve null si no vale la pena partir (que
  // el párrafo entero pase a la página siguiente).
  var MIN_TOKENS = 12; // ~6 palabras: no dejar una línea viuda suelta
  function partirParrafo(p, col) {
    var toks = tokenizar(p);
    col.removeChild(p);
    if (toks.length < MIN_TOKENS * 2) return { resto: p, partido: false };
    var lo = 1, hi = toks.length - 1, mejor = 0;
    var prueba = null;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (prueba) col.removeChild(prueba);
      prueba = armarDesdeTokens(toks, 0, mid, 'sigue');
      col.appendChild(prueba);
      if (!desborda(col)) { mejor = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    if (prueba) col.removeChild(prueba);
    if (mejor < MIN_TOKENS || toks.length - mejor < MIN_TOKENS) {
      return { resto: p, partido: false };
    }
    col.appendChild(armarDesdeTokens(toks, 0, mejor, 'sigue'));
    return { resto: armarDesdeTokens(toks, mejor, toks.length, 'continuacion'), partido: true };
  }

  // Parte una lista desbordada moviendo ítems del final a una lista resto.
  function partirLista(ul, col) {
    var resto = ul.cloneNode(false);
    while (ul.children.length > 1 && desborda(col)) {
      resto.insertBefore(ul.lastElementChild, resto.firstChild);
    }
    if (desborda(col)) {
      while (resto.firstChild) ul.appendChild(resto.firstChild);
      col.removeChild(ul);
      return { resto: ul, partido: false };
    }
    return { resto: resto.children.length ? resto : null, partido: true };
  }

  function paginarFuente(fuente, narrador) {
    var meta = {
      etiqueta: fuente.getAttribute('data-etiqueta') || '',
      rail: fuente.getAttribute('data-rail') || '',
      narrador: narrador,
      portadilla: fuente.getAttribute('data-primera') === 'portadilla',
    };
    var cola = [];
    while (fuente.firstElementChild) {
      cola.push(fuente.firstElementChild);
      fuente.removeChild(fuente.firstElementChild);
    }
    if (cola.length === 0) { fuente.remove(); return; }

    var col = crearPagina(fuente, meta, true);
    while (cola.length) {
      var bloque = cola.shift();
      col.appendChild(bloque);
      if (!desborda(col)) continue;

      var resto = null;
      if (bloque.tagName === 'P') {
        resto = partirParrafo(bloque, col).resto;
      } else if (bloque.tagName === 'UL') {
        resto = partirLista(bloque, col).resto;
      } else {
        col.removeChild(bloque);
        resto = bloque;
      }

      // Caso extremo: un bloque solo más alto que la página entera — se
      // coloca igual (se recorta) antes que ciclar para siempre.
      if (col.children.length === 0 && resto) {
        col.appendChild(resto);
        resto = null;
      }

      // No dejar un título/separador huérfano al pie de la página: viaja
      // junto con el bloque que lo sigue.
      var arrastre = [];
      while (col.children.length > 1 && col.lastElementChild && esEncabezado(col.lastElementChild)) {
        arrastre.unshift(col.lastElementChild);
        col.removeChild(col.lastElementChild);
      }
      if (resto) arrastre.push(resto);
      for (var i = arrastre.length - 1; i >= 0; i--) cola.unshift(arrastre[i]);

      if (cola.length) col = crearPagina(fuente, meta, false);
    }
    fuente.remove();
  }

  function numerarFolios() {
    var lienzos = document.querySelectorAll('.lienzo');
    for (var i = 0; i < lienzos.length; i++) {
      var folio = lienzos[i].querySelector('.folio');
      if (folio) folio.textContent = String(i + 1);
    }
  }

  function paginar() {
    try {
      var narrador = document.body.getAttribute('data-narrador') || '';
      var fuentes = document.querySelectorAll('section.fuente-texto');
      for (var i = 0; i < fuentes.length; i++) paginarFuente(fuentes[i], narrador);
      numerarFolios();
    } catch (err) {
      console.error('paginador del libro falló, queda el flujo sin cromo:', err);
    } finally {
      window.__libroPaginado = true;
    }
  }

  function arrancar() {
    // Las fuentes cambian la métrica del texto: medir recién cuando cargaron.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(paginar, paginar);
    } else {
      paginar();
    }
  }

  if (document.readyState === 'complete') arrancar();
  else window.addEventListener('load', arrancar);
})();
</` + `script>`;
}

// --- Ensamblado final ---------------------------------------------------------

export function construirHtmlLibro(datos: {
  titulo: string;
  anioNacimiento?: number | null;
  fotoUrl?: string | null;
  indice: string[];
  libroMarkdown: string;
  saludos: { nombre: string; vinculo: string }[];
  /** Color de acento de la colección (franja de lomo, cruces, cita, folio).
   *  Opcional — sin él, el vino de la identidad aprobada. */
  acento?: string;
}): string {
  const { titulo, anioNacimiento, fotoUrl, indice, libroMarkdown, saludos, acento = '#6e2618' } = datos;

  const nombreNarrador = extraerNombreNarrador(titulo);
  const mono = iniciales(nombreNarrador);
  const secciones = parsearSeccionesLibro(libroMarkdown);
  const fraseHeroe = extraerFraseHeroe(secciones);

  const indiceSet = new Set(indice);
  let numeroCapitulo = 0;

  const contenidoHtml = secciones
    .map((seccion) => {
      const tituloTrim = (seccion.titulo ?? '').trim();
      if (tituloTrim.toLowerCase() === 'sus frases') {
        return construirSusFrases({ seccion, nombreNarrador, fraseHeroe });
      }
      if (seccion.titulo !== null && indiceSet.has(seccion.titulo)) {
        numeroCapitulo += 1;
        return construirCapitulo({ numero: numeroCapitulo, seccion, nombreNarrador, mono });
      }
      return construirPaginaSimple(seccion);
    })
    .join('\n');

  const portadaHtml = construirPortada({ titulo, nombreNarrador, anioNacimiento, mono, fraseHeroe });
  const frontispicioHtml = fotoUrl
    ? construirFrontispicio({ fotoUrl, nombreNarrador, anioNacimiento })
    : '';
  const saludosHtml = construirSaludos(saludos);
  const colofonHtml = construirColofon({ nombreNarrador, mono });
  const contratapaHtml = construirContratapa({ fraseHeroe, nombreNarrador, anioNacimiento, mono });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escaparHtml(titulo)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,500;1,900&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Archivo:wght@400;500;600;700&display=swap">
<style>${construirEstilos(acento)}</style>
</head>
<body data-narrador="${escaparHtml(nombreNarrador)}">
${portadaHtml}
${frontispicioHtml}
${contenidoHtml}
${saludosHtml}
${colofonHtml}
${contratapaHtml}
${construirScriptPaginador()}
</body>
</html>`;
}
