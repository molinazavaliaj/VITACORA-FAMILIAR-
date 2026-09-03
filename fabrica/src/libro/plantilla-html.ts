import { escaparHtml } from './comun.js';

// ---------------------------------------------------------------------------
// La identidad visual aprobada (docs/arte-libro/*.dc.html, 9 mockups A5 a
// 559×794px @ 96dpi — casualmente el tamaño EXACTO de una A5 a esa
// resolución, así que casi todo acá se puede pensar en píxeles y mapea 1:1 a
// milímetros). Este archivo traduce esos mockups a la plantilla real que
// consume el libro completo (portada, frontispicio, capítulos, sus frases,
// saludos, colofón, contratapa) para Playwright → PDF A5.
//
// La fábrica renderiza UN solo HTML que fluye y se pagina sola (no hay forma
// de dirigirnos a una página física puntual desde acá) — así que los
// ornamentos "por página" del mockup (cruces de registro, círculo cortado,
// cabecera corrida) se aplican una vez por BLOQUE DE CAPÍTULO, no una vez por
// página física. Es la traducción pragmática que pide la spec.
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
 * A5 a 96dpi es EXACTAMENTE 559×794px (148×210mm) — por eso las páginas de
 * "arte" (portada, frontispicio, apertura de capítulo, sus frases, colofón,
 * contratapa) se construyen como lienzos fijos de 559×794px con margen de
 * página CERO, calcados casi literal de los mockups. Las páginas de TEXTO
 * corrido (que pueden partirse en varias páginas físicas) usan una página
 * con nombre (`texto`, CSS Named Pages — soportado por Chromium al imprimir)
 * con el margen real de PaginaTexto.dc.html convertido de px a mm
 * (72/64/92/70px → 19.05/16.93/24.34/18.52mm).
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
  @page texto { size: A5; margin: 24.34mm 16.93mm 18.52mm 19.05mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif;
    color: var(--tinta);
    background: var(--papel);
  }

  .lienzo {
    width: 559px;
    height: 794px;
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

  /* Apertura de capítulo */
  .apertura .numeral {
    position: absolute; top: 46px; right: -74px;
    font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 300px; line-height: 0.8; color: var(--tinta);
  }
  .apertura .cuerpo-apertura { position: absolute; top: 380px; left: 44px; right: 100px; display: flex; flex-direction: column; gap: 16px; }
  .apertura .cap-nombre { font-family: Archivo, Arial, sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.4em; text-transform: uppercase; }
  .apertura .regla-acento { width: 44px; height: 1px; background: var(--acento); }
  .apertura .medallion-wrap { margin-top: 6px; }

  /* Cabecera corrida sobre el cuerpo de texto (una vez por bloque de capítulo) */
  .cuerpo-texto { page: texto; position: relative; }
  .cabecera-corrida {
    display: flex; align-items: baseline; justify-content: space-between;
    border-bottom: 1px solid var(--linea); padding-bottom: 10px; margin-bottom: 32px;
  }
  .cabecera-corrida .narrador { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 13px; color: var(--gris1); }
  .cabecera-corrida .cap { font-family: Archivo, Arial, sans-serif; font-weight: 600; font-size: 10px; letter-spacing: 0.32em; color: var(--acento); text-transform: uppercase; }

  .cuerpo-texto p, .pagina-simple p { font-size: 15px; line-height: 1.78; color: var(--gris5); margin: 0 0 15px; text-align: justify; }
  .cuerpo-texto p + p, .pagina-simple p + p { text-indent: 22px; }
  .cuerpo-texto h2, .pagina-simple h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 20px; margin: 30px 0 14px; }
  .cuerpo-texto h3, .pagina-simple h3 { font-family: Archivo, Arial, sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--acento); margin: 28px 0 12px; }
  .cuerpo-texto blockquote, .pagina-simple blockquote {
    font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 21px; line-height: 1.5;
    margin: 22px 0; padding: 2px 0 2px 20px; border-left: 2px solid var(--acento); color: var(--tinta);
  }
  .cuerpo-texto ul, .pagina-simple ul { margin: 0 0 16px; padding-left: 20px; }
  .cuerpo-texto li, .pagina-simple li { font-size: 15px; line-height: 1.7; color: var(--gris5); margin-bottom: 10px; text-align: justify; }

  .separador-escena { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 6px 0 22px; }
  .separador-escena .linea-sep { width: 44px; height: 1px; background: var(--linea); }

  /* Páginas simples (apertura del libro / cierre): mismo cuerpo de texto,
     encabezado más liviano, sin numeral gigante. */
  .pagina-simple { page: texto; }
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
  .sus-frases-lista { display: flex; flex-direction: column; gap: 4px; margin-top: 26px; padding-top: 22px; border-top: 1px solid var(--linea); }
  .sus-frases-lista blockquote { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 17px; line-height: 1.4; margin: 10px 0; padding: 0; border: none; color: var(--tinta); }
  .sus-frases-lista p { font-size: 14px; line-height: 1.6; color: var(--gris3); }
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

function construirAperturaCapitulo(opts: { numero: number; nombreCapitulo: string; mono: string }): string {
  const { numero, nombreCapitulo, mono } = opts;
  const numeroTexto = String(numero).padStart(2, '0');
  return `<div class="lienzo apertura quiebre">
    ${svgCruz(46, 32)}
    ${svgCruz(46, undefined, 32)}
    ${svgCirculoCortado({ top: -120, right: -120, size: 280, segundoAnillo: true })}
    <div class="numeral">${numeroTexto}</div>
    <div class="cuerpo-apertura">
      <div class="cap-nombre">${escaparHtml(nombreCapitulo)}</div>
      <div class="regla-acento"></div>
      <div class="medallion-wrap">${svgMedallion({ size: 40, texto: mono, colorAro: '#1c1917', colorTexto: '#1c1917' })}</div>
    </div>
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
  return `${construirAperturaCapitulo({ numero, nombreCapitulo, mono })}
  <section class="pagina-simple antes">
    <div class="cuerpo-texto">
      <div class="cabecera-corrida">
        <div class="narrador">${escaparHtml(nombreNarrador)}</div>
        <div class="cap">CAP. ${String(numero).padStart(2, '0')}</div>
      </div>
      ${seccion.html}
    </div>
  </section>`;
}

function construirPaginaSimple(seccion: SeccionLibro): string {
  return `<section class="pagina-simple antes">
    <div class="cuerpo-texto">
      ${seccion.titulo ? `<h1 class="titulo-simple">${escaparHtml(seccion.titulo)}</h1><div class="titulo-simple-regla"></div>` : ''}
      ${seccion.html}
    </div>
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
  return `<div class="lienzo quiebre">
    ${svgCirculoCortado({ top: -30, left: 300, size: 240, color: '#f2eee5' })}
    <div class="sus-frases-eyebrow">TAL CUAL LAS DICE · PARA QUE NO SE PIERDAN</div>
    <div style="position:absolute; top:48px; left:44px; right:100px;">
      <div class="sus-frases-titulo">${escaparHtml(seccion.titulo ?? 'Sus frases')}</div>
    </div>
    <div style="position:absolute; top:230px; left:44px; right:44px; bottom:80px; overflow:hidden;">
      ${heroHtml}
      <div class="sus-frases-lista">${resto}</div>
    </div>
    <div class="sus-frases-narrador">${escaparHtml(nombreNarrador)}</div>
  </div>`;
}

function construirSaludos(saludos: { nombre: string; vinculo: string }[]): string {
  if (saludos.length === 0) return '';
  const items = saludos
    .map((s) => `<li>${escaparHtml(s.nombre)} <span class="vinculo">(${escaparHtml(s.vinculo)})</span></li>`)
    .join('\n');
  return `<section class="saludos antes">
    <div class="cuerpo-texto">
      <h1 class="saludos-titulo">Los saludos de la familia</h1>
      <div class="titulo-simple-regla"></div>
      <ul class="saludos-lista">${items}</ul>
    </div>
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
<body>
${portadaHtml}
${frontispicioHtml}
${contenidoHtml}
${saludosHtml}
${colofonHtml}
${contratapaHtml}
</body>
</html>`;
}
