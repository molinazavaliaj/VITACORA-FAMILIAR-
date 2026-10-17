import { escaparHtml } from './comun.js';
import type { FotosCapitulo, FotoLibro, Foco } from './fotos.js';
import { atributoFoco } from './fotos.js';
import { FRASES_POR_CAPITULO, type FraseCandidata, type FrasesJson } from './frases.js';
import { qrDataUri } from './qr.js';
import { urlFraseDeVoz } from './token-voz.js';

// ---------------------------------------------------------------------------
// La identidad visual aprobada (docs/arte-libro/*.dc.html, 9 mockups A5 a
// 559×794px @ 96dpi — casualmente el tamaño EXACTO de una A5 a esa
// resolución, así que casi todo acá se puede pensar en píxeles y mapea 1:1 a
// milímetros). Este archivo traduce esos mockups a la plantilla real que
// consume el libro completo (tapa con la foto, capítulos, sus frases,
// colofón, contratapa) para Playwright → PDF A5.
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

/** El título de la página de frases, en castellano o en catalán (escritor v5.4: "Les seves frases"). */
const TITULOS_SUS_FRASES = new Set(['sus frases', 'les seves frases']);
const esSusFrases = (titulo: string | null): boolean => TITULOS_SUS_FRASES.has((titulo ?? '').trim().toLowerCase());

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
  const seccionFrases = secciones.find((s) => esSusFrases(s.titulo));
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
  return `<svg class="grano" style="position:absolute;inset:0;opacity:0.5;pointer-events:none;" width="559" height="794" xmlns="http://www.w3.org/2000/svg">
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
  return `<svg class="espejo" style="position:absolute;${pos}pointer-events:none;" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  const lado = left !== undefined ? 'orn-izq' : 'orn-der';
  return `<svg class="${lado}" style="position:absolute;top:${top}px;${pos}pointer-events:none;" width="11" height="11" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 0 V11 M0 5.5 H11" stroke="#c9a795" stroke-width="1"></path></svg>`;
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

  /* Tapa (Naza, 13/10): la foto arriba a sangre, abajo un bloque de papel con
     «EL LIBRO DE SU VIDA», el nombre grande y al pie «para siempre» y la marca.
     Un lomo de tinta a la izquierda. Sin subtítulo ni frase. */
  .tapa-lomo { position: absolute; top: 0; bottom: 0; left: 0; width: 14px; background: var(--tinta); }
  .tapa-foto { position: absolute; top: 0; left: 14px; right: 0; height: 63%; overflow: hidden; background: var(--tinta); }
  .tapa-foto img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .tapa-foto .tapa-toroide { position: absolute; left: 50%; top: 50%; width: 170px; transform: translate(-50%, -50%); color: var(--papel); opacity: 0.55; }
  .tapa-pie { position: absolute; left: 14px; right: 0; bottom: 0; top: 63%; padding: 30px 40px 30px 40px; display: flex; flex-direction: column; }
  .tapa-eyebrow { font-family: Archivo, Arial, sans-serif; font-size: 9.5px; letter-spacing: 0.3em; color: var(--gris3); }
  .portada-nombre-narrador {
    margin-top: 14px; font-family: 'Playfair Display', Georgia, serif; font-weight: 400; font-size: 48px;
    line-height: 1.08; letter-spacing: -0.005em; overflow-wrap: normal; text-wrap: balance; max-width: 66%;
  }
  .tapa-base { margin-top: auto; display: flex; align-items: center; justify-content: space-between; }
  .tapa-siempre { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 500; font-size: 15px; }
  .tapa-marca { display: flex; align-items: center; gap: 8px; font-family: Archivo, Arial, sans-serif; font-size: 9px; letter-spacing: 0.22em; color: var(--gris3); }
  .tapa-marca svg { width: 32px; height: auto; color: var(--gris3); }

  /* Páginas de foto (apertura y cierre de capítulo). Sin filtro de grises:
     existe la edición a color. */
  .lienzo.foto { background: var(--papel); }
  .foto-cabecera { position: absolute; top: 40px; left: 44px; right: 44px; display: flex; justify-content: space-between; font-family: Archivo, Arial, sans-serif; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gris1); }
  .foto-marco { position: absolute; top: 76px; left: 44px; right: 44px; bottom: 110px; display: flex; align-items: center; justify-content: center; }
  .foto-img { max-width: 100%; max-height: 100%; object-fit: contain; }
  /* La principal del capítulo se recorta al marco entero; object-position
     (inline, desde fotos.foco) decide qué punto queda a la vista. Las de
     cierre siguen enteras: son varias y ahí importa ver todo. La clase se
     escribe solo cuando la foto trae un foco usable (ver "atributoFoco" en
     fotos.ts): sin dato —migración 20260918 sin aplicar, fila vieja— la foto
     va entera, con el marcado de siempre. */
  .foto-img.recorte { width: 100%; height: 100%; max-width: none; max-height: none; object-fit: cover; }
  /* Principal con posicion = 'abajo': va en la portadilla del capítulo, en la
     franja libre debajo del nombre (el numeral termina ~270px; el cuerpo
     ~450px con título de una línea, ~485px con tres; el pie está a 44px del
     borde). Recortada igual que arriba. */
  .apertura .apertura-foto-bloque { position: absolute; top: 500px; left: 44px; right: 44px; bottom: 68px; display: flex; flex-direction: column; gap: 10px; }
  .apertura .apertura-foto { flex: 1 1 auto; min-height: 0; overflow: hidden; }
  .apertura .apertura-foto-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  /* El epígrafe va debajo de la foto dentro del mismo bloque: si ocupa dos o
     tres líneas, la foto se achica; nunca se pisan. */
  .apertura .apertura-foto-epigrafe { flex: none; font-family: 'Source Serif 4', Georgia, serif; font-style: italic; font-size: 12px; line-height: 1.4; color: var(--gris1); text-align: center; }
  .foto-epigrafe { position: absolute; left: 44px; right: 44px; bottom: 56px; font-family: 'Source Serif 4', Georgia, serif; font-style: italic; font-size: 13px; line-height: 1.4; color: var(--gris1); text-align: center; }

  /* Apertura de capítulo (calcada de AperturaCapitulo.dc.html, con un
     ajuste pedido por Naza el 2026-09-03: el mockup sangraba el numeral
     fuera de la página y quedaba ilegible — acá entra ENTERO, igual de
     protagonista). */
  .apertura .numeral {
    position: absolute; top: 72px; right: 30px;
    font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 250px; line-height: 0.8; color: var(--tinta);
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

  /* Su voz: la sección impresa de las frases elegidas, con el QR de cada una
     (spec 2026-09-20). Mismos tokens que el resto de la identidad: la frase en
     Playfair itálica —como la cita de la contratapa—, los rótulos en Archivo
     versalita y el vino del acento. El QR es una imagen: se genera en la fábrica
     y viaja adentro del HTML. Va como bloque de la columna de texto (lo pagina
     el paginador embebido, con el cromo del libro); los rótulos que chocan con
     las reglas de h2/h3 llevan el prefijo .columna-texto/.fuente-texto, que les
     gana: sin eso, el título saldría del tamaño de un subtítulo. */
  .columna-texto .su-voz-titulo, .fuente-texto .su-voz-titulo {
    /* Mismos valores que .titulo-simple (la página simple del libro), que acá
       necesita el prefijo para ganarle a la regla de h2 de la columna. */
    font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 400;
    font-size: 30px; line-height: 1.1; letter-spacing: normal; text-transform: none; margin: 0 0 10px;
  }
  .columna-texto .su-voz-bajada, .fuente-texto .su-voz-bajada { font-size: 13px; line-height: 1.6; color: var(--gris3); margin: 0 0 26px; }
  .columna-texto .su-voz-capitulo, .fuente-texto .su-voz-capitulo { margin: 26px 0 12px; }
  .su-voz-frase { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin: 0 0 18px; page-break-inside: avoid; }
  .su-voz-frase-texto { flex: 1 1 auto; font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 18px; line-height: 1.35; color: var(--tinta); }
  .su-voz-qr { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .su-voz-qr-img { width: 96px; height: 96px; display: block; }
  .su-voz-qr-rotulo { font-family: Archivo, Arial, sans-serif; font-size: 8px; font-weight: 600; letter-spacing: 0.22em; color: var(--acento); text-transform: uppercase; }
  /* El código de la contratapa: el que abre la página entera. Va más grande que
     los de las frases (es el que se escanea desde el libro cerrado) y con el link
     escrito al lado, para quien lo lea sin el teléfono a mano. */
  .su-voz-contratapa { display: flex; align-items: center; gap: 20px; margin-top: 30px; padding-top: 24px; border-top: 1px solid var(--linea); page-break-inside: avoid; }
  .su-voz-contratapa-qr-img { width: 132px; height: 132px; display: block; }
  .su-voz-contratapa-texto { flex: 1 1 auto; }
  .su-voz-contratapa-titulo { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 22px; line-height: 1.2; margin: 0 0 8px; }
  .columna-texto .su-voz-contratapa-bajada, .fuente-texto .su-voz-contratapa-bajada { font-size: 12.5px; line-height: 1.6; color: var(--gris3); margin: 0 0 10px; }
  .su-voz-contratapa-url { font-family: Archivo, Arial, sans-serif; font-size: 8px; letter-spacing: 0.04em; color: var(--gris1); word-break: break-all; }

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

/** Lo fijo de la tapa, por idioma del libro (Naza, 13/10). */
const TEXTOS_TAPA: Record<'es' | 'ca', { eyebrow: string; siempre: string }> = {
  es: { eyebrow: 'EL LIBRO DE SU VIDA', siempre: 'para siempre' },
  ca: { eyebrow: 'EL LLIBRE DE LA SEVA VIDA', siempre: 'per sempre' },
};

/**
 * El tamaño del nombre en la tapa (13/10): 48px, salvo que su palabra más larga no
 * entre en el ancho del bloque (465px). Una palabra nunca se corta: el nombre
 * en mayúsculas («IMMACULADA») salía partido. Ancho aproximado de la Playfair:
 * 0,74em una mayúscula, 0,52em el resto. Misma cuenta en web/src/lib/tapa.ts.
 */
export function tamanoNombreTapa(texto: string): number {
  const ancho = (palabra: string) => [...palabra].reduce((acc, c) => acc + (c !== c.toLowerCase() ? 0.74 : 0.52), 0);
  const mayor = Math.max(0, ...texto.split(/\s+/).map(ancho));
  return mayor > 0 ? Math.min(48, Math.floor((465 * 0.97) / mayor)) : 48;
}

/** Los anillos del toroide (marca/toroide-negro.svg, como web/src/app/marca.tsx). */
function svgToroide(clase: string): string {
  const anillos: [number, number, number][] = [
    [86.14, 13.86, 17.63], [73.23, 26.77, 34.07], [60.65, 39.35, 50.08], [48.29, 51.71, 65.82],
    [36.08, 63.92, 81.36], [23.99, 76.01, 96.74], [12.0, 88.0, 112.0],
  ];
  const elipses = anillos
    .map(([cx, rx, ry]) => `<ellipse cx="${cx}" cy="145" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="${200 - cx}" cy="145" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="2"/>`)
    .join('');
  return `<svg class="${clase}" viewBox="-78 31 356 228" xmlns="http://www.w3.org/2000/svg">${elipses}</svg>`;
}

function construirPortada(opts: {
  nombreNarrador: string;
  tapa: { titulo: string | null; subtitulo: string | null };
  fotoUrl?: string | null;
  fotoFoco?: Foco;
  idioma: 'es' | 'ca';
}): string {
  const { nombreNarrador, tapa, fotoUrl, fotoFoco, idioma } = opts;
  const textos = TEXTOS_TAPA[idioma];
  // El título que eligió la dueña manda; sin título, el nombre. El subtítulo ya
  // no va en la tapa (Naza, 13/10): la tapa es foto, «el libro de su vida» y el nombre.
  const nombre = tapa.titulo ?? nombreNarrador;
  const foto = fotoUrl
    ? `<img src="${escaparHtml(fotoUrl)}"${atributoFoco(fotoFoco)} alt="" />`
    : svgToroide('tapa-toroide');
  return `<div class="lienzo quiebre">
    <div class="tapa-lomo"></div>
    <div class="tapa-foto">${foto}</div>
    <div class="tapa-pie">
      <div class="tapa-eyebrow">${textos.eyebrow}</div>
      <div class="portada-nombre-narrador"${tamanoNombreTapa(nombre) < 48 ? ` style="font-size: ${tamanoNombreTapa(nombre)}px"` : ''}>${escaparHtml(nombre)}</div>
      <div class="tapa-base">
        <span class="tapa-siempre">${textos.siempre}</span>
        <span class="tapa-marca">${svgToroide('tapa-marca-toroide')}V·F</span>
      </div>
    </div>
  </div>`;
}

/** Una página de foto entera (apertura o cierre de capítulo), con cabecera
 *  de capítulo/narrador y epígrafe opcional. Sin filtro de grises: existe la
 *  edición a color.
 *
 *  `recortar` es "esta es la principal: se recorta al marco" (las de cierre van
 *  enteras). El recorte además necesita el foco: sin foco usable —fila vieja o
 *  migración 20260918 sin aplicar— la foto va entera, con el marcado de siempre,
 *  porque `atributoFoco` devuelve '' y no hay punto alrededor del cual recortar. */
function construirPaginaFoto(opts: { foto: FotoLibro; nombreCapitulo: string; nombreNarrador: string; recortar?: boolean }): string {
  const { foto, nombreCapitulo, nombreNarrador, recortar = false } = opts;
  const atributo = atributoFoco(foto.foco);
  const img = recortar && atributo
    ? `<img class="foto-img recorte" src="${escaparHtml(foto.dataUri)}"${atributo} alt="" />`
    : `<img class="foto-img" src="${escaparHtml(foto.dataUri)}" alt="" />`;
  return `<div class="lienzo foto quiebre">
    <div class="foto-cabecera"><span>${escaparHtml(nombreCapitulo)}</span><span>${escaparHtml(nombreNarrador)}</span></div>
    <div class="foto-marco">${img}</div>
    ${foto.epigrafe ? `<div class="foto-epigrafe">${escaparHtml(foto.epigrafe)}</div>` : ''}
  </div>`;
}

function construirAperturaCapitulo(opts: { numero: number; nombreCapitulo: string; nombreNarrador: string; mono: string; fotoAbajo?: FotoLibro }): string {
  const { numero, nombreCapitulo, nombreNarrador, mono, fotoAbajo } = opts;
  const numeroTexto = String(numero).padStart(2, '0');
  // posicion = 'abajo': la principal entra en esta misma página, debajo del
  // nombre del capítulo, recortada con su foco (CONTRATO, migración 20260918).
  const fotoHtml = fotoAbajo
    ? `\n    <div class="apertura-foto-bloque"><div class="apertura-foto"><img class="apertura-foto-img" src="${escaparHtml(fotoAbajo.dataUri)}"${atributoFoco(fotoAbajo.foco)} alt="" /></div>${
        fotoAbajo.epigrafe ? `<div class="apertura-foto-epigrafe">${escaparHtml(fotoAbajo.epigrafe)}</div>` : ''
      }</div>`
    : '';
  // El bloque de la foto se cuelga con su propio salto de línea adentro de la
  // interpolación: sin `posicion` no hay bloque y la portadilla tiene que salir
  // carácter por carácter igual que antes de la migración 20260918 (una línea
  // en blanco de más no rompe nada, pero deja de ser "el mismo HTML").
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
    </div>${fotoHtml}
    <div class="pie-pagina"><span></span><span class="folio"></span></div>
  </div>`;
}

function construirCapitulo(opts: {
  numero: number;
  seccion: SeccionLibro;
  nombreNarrador: string;
  mono: string;
  fotos: FotosCapitulo | undefined;
}): string {
  const { numero, seccion, nombreNarrador, mono, fotos } = opts;
  const nombreCapitulo = seccion.titulo ?? '';
  const rail = `CAP. ${String(numero).padStart(2, '0')} · ${nombreCapitulo}`;
  // La foto de apertura entra entre la página de apertura del capítulo y el
  // texto corrido (posicion 'arriba', la de siempre) o dentro de la propia
  // página de apertura, debajo del título ('abajo'); las de cierre, después
  // del texto. El paginador embebido inserta las páginas de texto que arma
  // con `insertBefore(lienzo, fuente)` — nunca toca los `.lienzo` estáticos
  // de alrededor — así que el orden apertura → foto → texto → fotos de
  // cierre queda tal cual en el PDF.
  const abajo = fotos?.posicionApertura === 'abajo';
  const fotoAbajo = abajo ? (fotos?.apertura ?? undefined) : undefined;
  const paginaApertura = fotos?.apertura && !abajo
    ? construirPaginaFoto({ foto: fotos.apertura, nombreCapitulo, nombreNarrador, recortar: true })
    : '';
  const paginasCierre = (fotos?.cierre ?? [])
    .map((foto) => construirPaginaFoto({ foto, nombreCapitulo, nombreNarrador }))
    .join('\n');
  return `${construirAperturaCapitulo({ numero, nombreCapitulo, nombreNarrador, mono, fotoAbajo })}
  ${paginaApertura}
  <section class="fuente-texto antes" data-etiqueta="${escaparHtml(nombreCapitulo)}" data-rail="${escaparHtml(rail)}">
    ${seccion.html}
  </section>
  ${paginasCierre}`;
}

function construirPaginaSimple(seccion: SeccionLibro): string {
  const titulo = seccion.titulo ?? '';
  return `<section class="fuente-texto antes" data-etiqueta="${escaparHtml(titulo)}" data-rail="${escaparHtml(titulo)}" data-primera="portadilla">
    ${titulo ? `<h1 class="titulo-simple">${escaparHtml(titulo)}</h1><div class="titulo-simple-regla"></div>` : ''}
    ${seccion.html}
  </section>`;
}

/**
 * La lengua del libro para sus textos fijos (13/10): el castellano de acá va de
 * vos, el de España de tú, y el libro en catalán va entero en catalán.
 */
export type LenguaLibro = 'es-AR' | 'es-ES' | 'ca';

/** Los textos fijos del cuerpo del libro (Sus frases, Su voz, colofón), por lengua. Aprobados por Naza el 13/10. */
const TEXTOS_LIBRO: Record<LenguaLibro, {
  susFrasesEyebrow: string; susFrasesHero: string;
  suVoz: string; suVozBajada: string; escuchala: string; altFrase: string; altLibro: string;
  libroEntero: string; libroEnteroBajada: string;
  colofon1: string; colofon2: string; cierre: string;
  /** El título de las páginas de notas del libro impreso (modo imprenta). PENDIENTE DE APROBACIÓN de Naza. */
  notas: string;
}> = {
  'es-AR': {
    susFrasesEyebrow: 'TAL CUAL LAS DICE · PARA QUE NO SE PIERDAN',
    susFrasesHero: 'Si se lleva una sola de todo el libro, es esta',
    suVoz: 'Su voz',
    suVozBajada: 'Acá están sus frases, tal como las dijo. Apuntá el teléfono al código de una y la escuchás.',
    escuchala: 'Escuchala',
    altFrase: 'Código para escuchar esta frase',
    altLibro: 'Código para abrir el libro y sus frases',
    libroEntero: 'El libro entero, en su voz',
    libroEnteroBajada: 'Este código abre la página con el libro online y todas sus frases, para escucharlas y compartirlas.',
    colofon1: 'Este libro fue contado por',
    colofon2: 'con su propia voz, y guardado para siempre por',
    cierre: '«Acá adentro están todos vivos.»',
    notas: 'Notas',
  },
  'es-ES': {
    susFrasesEyebrow: 'TAL CUAL LAS DICE · PARA QUE NO SE PIERDAN',
    susFrasesHero: 'Si se lleva una sola de todo el libro, es esta',
    suVoz: 'Su voz',
    suVozBajada: 'Aquí están sus frases, tal como las dijo. Apunta el teléfono al código de una y la escuchas.',
    escuchala: 'Escúchala',
    altFrase: 'Código para escuchar esta frase',
    altLibro: 'Código para abrir el libro y sus frases',
    libroEntero: 'El libro entero, en su voz',
    libroEnteroBajada: 'Este código abre la página con el libro online y todas sus frases, para escucharlas y compartirlas.',
    colofon1: 'Este libro fue contado por',
    colofon2: 'con su propia voz, y guardado para siempre por',
    cierre: '«Aquí dentro están todos vivos.»',
    notas: 'Notas',
  },
  ca: {
    susFrasesEyebrow: 'TAL COM LES DIU · PERQUÈ NO ES PERDIN',
    susFrasesHero: 'Si només se n’endú una de tot el llibre, és aquesta',
    suVoz: 'La seva veu',
    suVozBajada: 'Aquí hi ha les seves frases, tal com les va dir. Apunta el telèfon al codi d’una i l’escoltaràs.',
    escuchala: 'Escolta-la',
    altFrase: 'Codi per escoltar aquesta frase',
    altLibro: 'Codi per obrir el llibre i les seves frases',
    libroEntero: 'El llibre sencer, amb la seva veu',
    libroEnteroBajada: 'Aquest codi obre la pàgina amb el llibre en línia i totes les seves frases, per escoltar-les i compartir-les.',
    colofon1: 'Aquest llibre el va explicar',
    colofon2: 'amb la seva pròpia veu, i el va guardar per sempre',
    cierre: '«Aquí dins hi són tots vius.»',
    notas: 'Notes',
  },
};

function construirSusFrases(opts: { seccion: SeccionLibro; nombreNarrador: string; fraseHeroe: string | null; lengua: LenguaLibro }): string {
  const { seccion, nombreNarrador, fraseHeroe } = opts;
  const t = TEXTOS_LIBRO[opts.lengua];
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
       <div class="sus-frases-hero-tag">${t.susFrasesHero}</div>`
    : '';
  const titulo = seccion.titulo ?? 'Sus frases';
  // La página de arte lleva SOLO el título y la frase héroe (entra siempre);
  // el listado completo fluye después por el paginador, para que ninguna
  // frase se pierda por un overflow:hidden — antes se cortaban en silencio.
  return `<div class="lienzo sus-frases-pagina quiebre">
    ${svgCirculoCortado({ top: -30, left: 300, size: 240, color: '#f2eee5' })}
    <div class="sus-frases-eyebrow">${t.susFrasesEyebrow}</div>
    <div class="sf-titulo" style="position:absolute; top:48px; left:44px; right:100px;">
      <div class="sus-frases-titulo">${escaparHtml(titulo)}</div>
    </div>
    <div class="sf-hero" style="position:absolute; top:230px; left:44px; right:44px;">
      ${heroHtml}
    </div>
    <div class="sus-frases-narrador">${escaparHtml(nombreNarrador)}</div>
  </div>
  <section class="fuente-texto antes" data-etiqueta="${escaparHtml(titulo)}" data-rail="${escaparHtml(titulo)}">
    ${resto}
  </section>`;
}

// --- «Su voz»: la sección impresa (frase + QR) -------------------------------

/**
 * Una frase se puede escuchar cuando el worker de la PC de audio ya la cortó y
 * dejó su mp3. Es el mismo criterio que usa la web (`tieneAudio` de
 * `web/src/lib/frases.ts`): si acá dijera otra cosa, el libro mostraría un código
 * para una frase que la página no sabe reproducir, o escondería una que sí suena.
 */
function tieneAudio(frase: FraseCandidata): boolean {
  return frase.estado === 'cortada' && typeof frase.audio_path === 'string' && frase.audio_path.length > 0;
}

/** El QR como `<img>` inline: es un PNG chico en data URI, así que el HTML del
 *  libro se basta solo (nada de carpetas de archivos ni de red: el PDF se arma en
 *  Railway, sin navegador a mano). El `alt` lo lee quien no puede ver el código. */
function imagenQr(dataUri: string, clase: string, lado: number, alt: string): string {
  return `<img class="${clase}" src="${dataUri}" width="${lado}" height="${lado}" alt="${escaparHtml(alt)}" />`;
}

/**
 * La sección impresa de «Su voz» (Task 4 del plan 2026-09-20-su-voz-fabrica): las
 * frases elegidas de cada capítulo con un QR al lado, y al final el código que
 * abre la página entera. Existe por una razón sola: que la familia pueda volver a
 * escucharlo tal como lo dijo, con el libro en la mano y sin pedirle nada a nadie.
 *
 * Va como una `<section class="fuente-texto">` y no como un lienzo fijo: la
 * paginación la hace el paginador embebido, que reparte los bloques en páginas A5
 * con el cromo del libro (cabecera corrida, riel, folio) y manda entera a la
 * página siguiente la frase que no entra. Un lienzo de 210mm con veinticuatro
 * frases adentro recortaría en silencio lo que no entra — que es, justamente, el
 * bug que el paginador vino a arreglar en la página «Sus frases».
 *
 * Tres reglas del diseño, y ninguna se negocia:
 *  1. una frase sin audio (o con el corte fallido) se imprime igual, pero SIN QR:
 *     nunca un código que no suena;
 *  2. hasta `FRASES_POR_CAPITULO` por capítulo — es un tope, no un mínimo — en el
 *     orden del archivo, que es el orden en que se imprimen;
 *  3. sin ninguna frase que suene no hay nada para escanear: no se imprime ni la
 *     sección ni el código de la contratapa. Un libro sin frases sale igual.
 *
 * El link de cada QR lo arma quien conoce al narrador y el secreto
 * (`urlVozDeNarrador` de `token-voz.ts`): acá adentro no se firma nada.
 */
export async function seccionFrasesHtml(args: { frases: FrasesJson; urlCliente: string; lengua?: LenguaLibro }): Promise<string> {
  const t = TEXTOS_LIBRO[args.lengua ?? 'es-AR'];
  const capitulos = args.frases.capitulos
    .map((capitulo) => ({
      capitulo,
      frases: capitulo.candidatas.filter((frase) => frase.elegida).slice(0, FRASES_POR_CAPITULO),
    }))
    .filter((x) => x.frases.length > 0);
  if (!capitulos.some((x) => x.frases.some(tieneAudio))) return '';

  const bloques: string[] = [
    `<h2 class="su-voz-titulo">${t.suVoz}</h2>`,
    // La misma regla de acento de la página simple: el rótulo del paginador lo
    // reconoce como encabezado y lo baja de página junto con el título.
    '<div class="titulo-simple-regla"></div>',
    `<div class="su-voz-bajada">${t.suVozBajada}</div>`,
  ];

  for (const { capitulo, frases } of capitulos) {
    const numero = String(capitulo.numero).padStart(2, '0');
    bloques.push(`<h3 class="su-voz-capitulo">Cap. ${numero} · ${escaparHtml(capitulo.capitulo)}</h3>`);
    for (const frase of frases) {
      // El QR va al lado de la frase, y solo si la frase suena.
      const qr = tieneAudio(frase)
        ? `<div class="su-voz-qr">${imagenQr(await qrDataUri(urlFraseDeVoz(args.urlCliente, frase.id)), 'su-voz-qr-img', 96, t.altFrase)}<div class="su-voz-qr-rotulo">${t.escuchala}</div></div>`
        : '';
      bloques.push(`<div class="su-voz-frase"><div class="su-voz-frase-texto">«${escaparHtml(frase.texto)}»</div>${qr}</div>`);
    }
  }

  // El código de la contratapa: abre la página ENTERA, desde el principio — el que
  // tiene el libro en la mano ya lo pagó. Es más grande que los de las frases (se
  // escanea desde el libro cerrado) y lleva el link escrito al lado, para quien lo
  // mire sin el teléfono a mano.
  bloques.push(`<div class="su-voz-contratapa">
    <div>${imagenQr(await qrDataUri(args.urlCliente), 'su-voz-contratapa-qr-img', 132, t.altLibro)}</div>
    <div class="su-voz-contratapa-texto">
      <div class="su-voz-contratapa-titulo">${t.libroEntero}</div>
      <div class="su-voz-contratapa-bajada">${t.libroEnteroBajada}</div>
      <div class="su-voz-contratapa-url">${escaparHtml(args.urlCliente)}</div>
    </div>
  </div>`);

  return `<section class="fuente-texto antes" data-etiqueta="${t.suVoz}" data-rail="${t.suVoz}">
  ${bloques.join('\n  ')}
</section>`;
}

function construirColofon(opts: { nombreNarrador: string; mono: string; lengua: LenguaLibro }): string {
  const { nombreNarrador, mono } = opts;
  const t = TEXTOS_LIBRO[opts.lengua];
  const anio = new Date().getFullYear();
  return `<div class="lienzo colofon quiebre antes">
    ${svgGrano(11)}
    ${svgCruz(46, 32)}
    ${svgCruz(46, undefined, 32)}
    ${svgCruz(748, 32)}
    ${svgCruz(748, undefined, 32)}
    <div class="colofon-centro">
      ${svgMedallion({ size: 150, texto: mono, colorAro: '#1c1917', colorTexto: '#1c1917', puntosCardinales: true, colorPuntos: 'var(--acento)' })}
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        <div class="colofon-linea1">${t.colofon1}</div>
        <div class="colofon-nombre">${escaparHtml(nombreNarrador)}</div>
        <div class="colofon-linea2">${t.colofon2}</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:11px;">
        <div class="colofon-marca">VITÁCORA FAMILIAR</div>
        <div class="puntito"><span class="r"></span><span class="p"></span><span class="r"></span></div>
        <div class="colofon-anio">${anioRomano(anio)}</div>
      </div>
    </div>
    <div class="colofon-cierre">${t.cierre}</div>
  </div>`;
}

/** Lo fijo de la contratapa, por idioma del libro (Naza, 13/10: el libro en catalán, entero en catalán). */
const TEXTOS_CONTRATAPA: Record<'es' | 'ca', { coleccion: string; desc: string; historia: string; desde: string }> = {
  es: {
    coleccion: 'VITÁCORA FAMILIAR · UNA COLECCIÓN DE VIDAS CONTADAS',
    desc: 'Su historia, contada con su propia voz. Un libro que se lee con los ojos y se escucha con su voz.',
    historia: 'LA HISTORIA DE UNA VIDA',
    desde: 'DESDE',
  },
  ca: {
    coleccion: 'VITÁCORA FAMILIAR · UNA COL·LECCIÓ DE VIDES EXPLICADES',
    desc: 'La seva història, explicada amb la seva pròpia veu. Un llibre que es llegeix amb els ulls i s’escolta amb la seva veu.',
    historia: 'LA HISTÒRIA D’UNA VIDA',
    desde: 'DES DE',
  },
};

function construirContratapa(opts: { fraseHeroe: string | null; nombreNarrador: string; anioNacimiento?: number | null; mono: string; idioma: 'es' | 'ca' }): string {
  const { fraseHeroe, nombreNarrador, anioNacimiento, mono, idioma } = opts;
  const t = TEXTOS_CONTRATAPA[idioma];
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
      <div class="vertical">${t.coleccion}</div>
      <div class="chip">${anioNacimiento ? escaparHtml(String(anioNacimiento)) : ''}</div>
    </div>
    ${svgCirculoCortado({ bottom: -130, right: -130, size: 300 })}
    ${heroHtml}
    <div class="contratapa-pie">
      <div class="desc">${t.desc}</div>
      <div class="tag">${t.historia}${anioNacimiento ? ` · ${t.desde} ${escaparHtml(String(anioNacimiento))}` : ''}</div>
    </div>
  </div>`;
}

// --- Modo imprenta (Bookmundo tapa dura) -------------------------------------

/**
 * El libro que va a una imprenta de verdad (Bookmundo tapa dura; docs/bookmundo/receta-imprenta.md).
 * Es el mismo diseño A5 escalado entero al formato pedido (168×240 tiene la proporción del A5: ×1,135),
 * con lo que un libro encuadernado necesita y la pantalla no:
 *  - sin tapa ni contratapa (la cubierta va aparte, bookmundo/cubierta.ts), con portadilla y su blanca;
 *  - cada capítulo en página derecha (impar), con blancas antes si hace falta;
 *  - márgenes en espejo: el lomo queda a la izquierda en las impares y a la derecha en las pares;
 *  - fondo blanco (se pide papel crema) y sin el grano de papel de la pantalla;
 *  - fuentes TrueType estáticas incrustadas: las variables de Google, Chromium las imprime como Type 3;
 *  - páginas de notas hasta el mínimo de la encuadernación, y el colofón en la última.
 * El libro de pantalla (el que descarga la familia) no cambia: todo esto vive detrás de `imprenta`.
 */
export type OpcionesImprenta = {
  anchoMm: number;
  altoMm: number;
  /** Mínimo de páginas de la encuadernación (Bookmundo tapa dura, papel crema: 88). */
  paginasMinimas: number;
  /** Los @font-face con las fuentes estáticas incrustadas (bookmundo/fuentes.ts). */
  fuentesCss: string;
};

/** El ancho del A5 del diseño: todo lo demás se escala desde acá. */
const ANCHO_A5_MM = 148;
/** Margen del lado del lomo y del corte exterior, en px del lienzo A5 (19 y 17 mm; impresos ×1,135). */
const MARGEN_LOMO_PX = 72;
const MARGEN_FUERA_PX = 64;
/** Las cruces del lado del lomo y del lado del corte, en px del lienzo A5 (impresas a 16 y 12,6 mm). */
const ADORNO_LOMO_PX = 54;
const ADORNO_FUERA_PX = 42;
/** Alto de cada renglón de las páginas de notas, en mm del lienzo. */
const RENGLON_MM = 9;

export function escalaImprenta(o: Pick<OpcionesImprenta, 'anchoMm'>): number {
  return o.anchoMm / ANCHO_A5_MM;
}

function estilosImprenta(o: OpcionesImprenta): string {
  const escala = escalaImprenta(o);
  const L = MARGEN_LOMO_PX, F = MARGEN_FUERA_PX, AL = ADORNO_LOMO_PX, AF = ADORNO_FUERA_PX;
  return `
  :root { --papel: #ffffff; }
  @page { size: ${o.anchoMm}mm ${o.altoMm}mm; margin: 0; }
  body { zoom: ${escala}; }
  .lienzo { height: ${o.altoMm / escala}mm; }
  .grano { display: none; }
  /* Texto en espejo: en la impar el lomo es el borde izquierdo. */
  .lienzo.impar .columna-texto, .lienzo.impar .cabecera-pagina, .lienzo.impar .pie-pagina, .lienzo.impar .renglones { left: ${L}px; right: ${F}px; }
  .lienzo.par .columna-texto, .lienzo.par .cabecera-pagina, .lienzo.par .pie-pagina, .lienzo.par .renglones { left: ${F}px; right: ${L}px; }
  /* El riel va siempre del lado del corte, y su línea cortada como borde (no como degradé). */
  .riel .riel-linea { background: none; border-left: 1px dashed var(--linea); width: 0; }
  .lienzo.impar .riel { left: auto; right: 38px; }
  .lienzo.par .riel { left: 38px; right: auto; }
  /* Cruces: lejos del lomo y a más de 10 mm del corte. */
  .lienzo.impar .orn-izq { left: ${AL}px !important; }
  .lienzo.impar .orn-der { right: ${AF}px !important; }
  .lienzo.par .orn-izq { left: ${AF}px !important; }
  .lienzo.par .orn-der { right: ${AL}px !important; }
  /* Apertura (siempre impar): el numeral y los textos lejos de los bordes. */
  .apertura .numeral { right: 40px; }
  .apertura.impar .marca-narrador, .apertura.impar .cuerpo-apertura, .apertura.impar .apertura-foto-bloque { left: ${L}px; }
  /* Páginas de foto. */
  .lienzo.foto.impar .foto-cabecera, .lienzo.foto.impar .foto-marco, .lienzo.foto.impar .foto-epigrafe { left: ${L}px; }
  .lienzo.foto.par .foto-cabecera, .lienzo.foto.par .foto-marco, .lienzo.foto.par .foto-epigrafe { right: ${L}px; }
  /* Sus frases. */
  .sus-frases-pagina.impar .sf-titulo, .sus-frases-pagina.impar .sf-hero, .sus-frases-pagina.impar .sus-frases-narrador { left: ${L}px !important; }
  .sus-frases-pagina.par .sus-frases-eyebrow, .sus-frases-pagina.par .sf-hero { right: ${L}px !important; }
  /* Portadilla y notas. */
  .portadilla-imp .eyebrow { position: absolute; top: 74mm; left: 0; right: 0; text-align: center; font-family: Archivo, Arial, sans-serif; font-size: 9.5px; letter-spacing: 0.3em; color: var(--gris3); }
  .portadilla-imp .nombre { position: absolute; top: 84mm; left: ${L}px; right: ${L}px; text-align: center; font-family: 'Playfair Display', Georgia, serif; font-size: 40px; line-height: 1.1; color: var(--tinta); text-wrap: balance; }
  .portadilla-imp .regla { position: absolute; top: 112mm; left: 50%; width: 44px; margin-left: -22px; height: 1px; background: var(--acento); }
  .notas-titulo .t { position: absolute; top: 70mm; left: 0; right: 0; text-align: center; font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 30px; color: var(--tinta); }
  .notas-titulo .r { position: absolute; top: 86mm; left: 50%; width: 44px; margin-left: -22px; height: 1px; background: var(--acento); }
  .notas .renglones { position: absolute; top: 30mm; }
  .notas .renglones div { height: ${RENGLON_MM}mm; border-bottom: 0.6px solid #d9d3c7; }
  `;
}

/** La portadilla (pág. 1) y su blanca: lo que dice la tapa, sin la foto. */
function construirPortadilla(opts: { nombre: string; idioma: 'es' | 'ca' }): string {
  return `<div class="lienzo quiebre portadilla-imp">
    <div class="eyebrow">${TEXTOS_TAPA[opts.idioma].eyebrow}</div>
    <div class="nombre">${escaparHtml(opts.nombre)}</div>
    <div class="regla"></div>
  </div>
  <div class="lienzo quiebre blanca"></div>`;
}

/** Cuántos renglones entran en una página de notas: desde 30 mm arriba hasta 26 mm del pie. */
function renglonesNotas(o: OpcionesImprenta): number {
  return Math.floor((o.altoMm / escalaImprenta(o) - 30 - 26) / RENGLON_MM);
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
    '<svg class="espejo" style="position:absolute;top:-120px;right:-120px;pointer-events:none;" width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="140" cy="140" r="138" stroke="#eee9df" stroke-width="1.2"></circle>' +
    '<circle cx="140" cy="140" r="112" stroke="#f2eee5" stroke-width="0.8"></circle></svg>' +
    '<svg class="orn-izq" style="position:absolute;top:46px;left:32px;pointer-events:none;" width="11" height="11" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 0 V11 M0 5.5 H11" stroke="#c9a795" stroke-width="1"></path></svg>' +
    '<svg class="orn-der" style="position:absolute;bottom:46px;right:32px;pointer-events:none;" width="11" height="11" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 0 V11 M0 5.5 H11" stroke="#c9a795" stroke-width="1"></path></svg>';

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

  // Modo imprenta (ver estilosImprenta): reordena las páginas ya armadas como un libro
  // encuadernado —capítulos en impar, notas hasta el mínimo, colofón en la última— y marca
  // cada página impar/par para los márgenes en espejo.
  function nuevaPagina(clase, html) {
    var d = document.createElement('div');
    d.className = 'lienzo quiebre ' + clase;
    if (html) d.innerHTML = html;
    return d;
  }
  function armarImprenta() {
    var b = document.body;
    var minimo = Number(b.getAttribute('data-paginas-min')) || 0;
    var renglones = Number(b.getAttribute('data-renglones')) || 0;
    var todos = Array.prototype.slice.call(document.querySelectorAll('.lienzo'));
    var colofon = null;
    var final = [];
    function aImpar() { while ((final.length + 1) % 2 === 0) final.push(nuevaPagina('blanca')); }
    for (var i = 0; i < todos.length; i++) {
      var el = todos[i];
      el.parentNode.removeChild(el);
      if (el.classList.contains('colofon')) { colofon = el; continue; }
      if (el.classList.contains('apertura')) aImpar();
      final.push(el);
    }
    aImpar();
    var titulo = nuevaPagina('notas-titulo', '<div class="t"></div><div class="r"></div>');
    titulo.querySelector('.t').textContent = b.getAttribute('data-notas') || '';
    final.push(titulo);
    var conColofon = final.length + (colofon ? 1 : 0);
    var total = Math.max(minimo, conColofon + (conColofon % 2));
    var renglon = '';
    for (var r = 0; r < renglones; r++) renglon += '<div></div>';
    while (final.length < total - (colofon ? 1 : 0)) {
      final.push(nuevaPagina('notas', '<div class="renglones">' + renglon + '</div><div class="pie-pagina"><span class="adorno"><span class="p"></span><span class="r"></span></span><span class="folio"></span></div>'));
    }
    if (colofon) final.push(colofon);
    var script = document.querySelector('script');
    for (var k = 0; k < final.length; k++) {
      var pag = final[k];
      var par = (k + 1) % 2 === 0;
      pag.classList.add(par ? 'par' : 'impar');
      // En la par el lomo es el borde derecho: los adornos que sangran se reflejan.
      if (par) {
        var esp = pag.querySelectorAll('.espejo');
        for (var e = 0; e < esp.length; e++) {
          var st = esp[e].style, izq = st.left, der = st.right;
          st.left = der; st.right = izq;
        }
      }
      b.insertBefore(pag, script);
    }
  }

  function paginar() {
    try {
      var narrador = document.body.getAttribute('data-narrador') || '';
      var fuentes = document.querySelectorAll('section.fuente-texto');
      for (var i = 0; i < fuentes.length; i++) paginarFuente(fuentes[i], narrador);
      if (document.body.getAttribute('data-imprenta') === '1') armarImprenta();
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

export async function construirHtmlLibro(datos: {
  titulo: string;
  /** Manda sobre el que se saca del título — default: `extraerNombreNarrador(titulo)`. */
  nombreNarrador?: string;
  /** Lo que eligió la dueña para la tapa. Sin título, el nombre del narrador.
   *  El subtítulo ya no sale en la tapa (Naza, 13/10). */
  tapa?: { titulo: string | null; subtitulo: string | null };
  anioNacimiento?: number | null;
  fotoUrl?: string | null;
  /** Foco de la foto de tapa (fotos.foco de la elegida en el wizard). Sin él, el centro. */
  fotoFoco?: Foco;
  indice: string[];
  libroMarkdown: string;
  /** Fotos por capítulo (Task 3, `fotos.ts`) — clave es el título del
   *  capítulo tal cual aparece en `indice`. Sin esto, ningún capítulo lleva
   *  páginas de foto. */
  fotosPorCapitulo?: Map<string, FotosCapitulo>;
  /** Color de acento de la colección (franja de lomo, cruces, cita, folio).
   *  Opcional — sin él, el vino de la identidad aprobada. */
  acento?: string;
  /** «Su voz» impresa (Task 4): las frases elegidas de cada capítulo con su QR.
   *  Sin esto —o sin ninguna frase con audio, o sin `urlCliente`— el libro sale
   *  sin la sección: nunca una página vacía ni un código que no lleva a nada. */
  frases?: FrasesJson;
  /** El link público de su voz (`{urlBase}/voz/{token}`, `urlVozDeNarrador` de
   *  `token-voz.ts`): el destino del QR de cada frase y del código de la
   *  contratapa. Lo arma quien conoce al narrador, porque acá no se firma nada. */
  urlCliente?: string;
  /** El idioma del libro (escritor v5.4: catalán). Va en `<html lang>`. Sin esto, castellano. */
  idioma?: 'es' | 'ca';
  /** El trato del castellano (13/10): `tu` para España. Sin esto, vos. En catalán no cuenta. */
  trato?: 'vos' | 'tu';
  /** El libro para la imprenta (Bookmundo tapa dura), ver `OpcionesImprenta`. Sin esto, el de pantalla. */
  imprenta?: OpcionesImprenta;
}): Promise<string> {
  const { titulo, tapa = { titulo: null, subtitulo: null }, anioNacimiento, fotoUrl, fotoFoco, indice, libroMarkdown, fotosPorCapitulo, acento = '#6e2618' } = datos;

  const nombreNarrador = datos.nombreNarrador ?? extraerNombreNarrador(titulo);
  const mono = iniciales(nombreNarrador);
  const lengua: LenguaLibro = datos.idioma === 'ca' ? 'ca' : datos.trato === 'tu' ? 'es-ES' : 'es-AR';
  const secciones = parsearSeccionesLibro(libroMarkdown);
  const fraseHeroe = extraerFraseHeroe(secciones);

  const indiceSet = new Set(indice);
  let numeroCapitulo = 0;

  const contenidoHtml = secciones
    .map((seccion) => {
      const tituloTrim = (seccion.titulo ?? '').trim();
      if (esSusFrases(tituloTrim)) {
        return construirSusFrases({ seccion, nombreNarrador, fraseHeroe, lengua });
      }
      if (seccion.titulo !== null && indiceSet.has(seccion.titulo)) {
        numeroCapitulo += 1;
        const fotos = fotosPorCapitulo?.get(seccion.titulo);
        return construirCapitulo({ numero: numeroCapitulo, seccion, nombreNarrador, mono, fotos });
      }
      return construirPaginaSimple(seccion);
    })
    .join('\n');

  // La foto va en la tapa (Naza, 13/10): el frontispicio ya no se arma, para no repetirla.
  const imprenta = datos.imprenta;
  const portadaHtml = imprenta
    ? construirPortadilla({ nombre: tapa.titulo ?? nombreNarrador, idioma: datos.idioma ?? 'es' })
    : construirPortada({ nombreNarrador, tapa, fotoUrl, fotoFoco, idioma: datos.idioma ?? 'es' });
  // «Su voz» va después de todo el cuerpo y antes de las páginas de cierre
  // (colofón y contratapa), como pidió el plan: es una sección del libro, no una
  // página suelta pegada al final.
  const seccionVozHtml =
    datos.frases && datos.urlCliente
      ? await seccionFrasesHtml({ frases: datos.frases, urlCliente: datos.urlCliente, lengua })
      : '';
  const colofonHtml = construirColofon({ nombreNarrador, mono, lengua });
  // En imprenta la contratapa es la de la cubierta (bookmundo/cubierta.ts), no una página del libro.
  const contratapaHtml = imprenta ? '' : construirContratapa({ fraseHeroe, nombreNarrador, anioNacimiento, mono, idioma: datos.idioma ?? 'es' });
  const fuentesHtml = imprenta
    ? `<style>${imprenta.fuentesCss}</style>`
    : '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,500;1,900&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Archivo:wght@400;500;600;700&display=swap">';
  const atributosImprenta = imprenta
    ? ` data-imprenta="1" data-paginas-min="${imprenta.paginasMinimas}" data-renglones="${renglonesNotas(imprenta)}" data-notas="${escaparHtml(TEXTOS_LIBRO[lengua].notas)}"`
    : '';

  return `<!DOCTYPE html>
<html lang="${datos.idioma ?? 'es'}">
<head>
<meta charset="utf-8" />
<title>${escaparHtml(titulo)}</title>
${fuentesHtml}
<style>${construirEstilos(acento)}${imprenta ? estilosImprenta(imprenta) : ''}</style>
</head>
<body data-narrador="${escaparHtml(nombreNarrador)}"${atributosImprenta}>
${portadaHtml}
${contenidoHtml}
${seccionVozHtml}
${colofonHtml}
${contratapaHtml}
${construirScriptPaginador()}
</body>
</html>`;
}
