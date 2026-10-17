// La cubierta de tapa dura para Bookmundo (plantilla «FullEmpty»: la imagen ocupa toda la cubierta).
//
// Es el diseño del libro de la web (vf_book_atlas: tapa de papel con la foto arriba, lomo negro, contratapa
// con el QR de su voz), el mismo que se hizo a mano el 17/10 para Imma (Desktop\IMMA BOOKMUNDO\herramienta\
// cubierta-bookmundo.js). Sale un PNG a 300 ppp con la medida de la vista previa real de Bookmundo
// (formato.ts → medidasCubierta), y el QR se verifica leyéndolo del PNG ya hecho: si no lleva a su voz,
// la cubierta no sirve.
//
// La foto de tapa va TAL CUAL la subió la familia (recortada para llenar el lugar). Regla de Naza: la cara
// del narrador nunca sale de una IA. Si la foto es chica, la verificación lo avisa y se resuelve a mano.
import { chromium } from 'playwright';
import QRCode from 'qrcode';
import jsQRModulo from 'jsqr';
import { PNG } from 'pngjs';
import { escaparHtml } from '../comun.js';
import type { LenguaLibro } from '../plantilla-html.js';
import { fuentesImprentaCss } from './fuentes.js';
import { LOMO_MINIMO_TEXTO_MM, PPP_CUBIERTA, medidasCubierta, type MedidasCubierta } from './formato.js';

/**
 * Los textos de la cubierta. Los de Imma (17/10) salieron de la web (portada.ts → direccion.libro y
 * publico.ts → lema). Acá van sin género («tal como las vivió») y en las tres lenguas del libro.
 * PENDIENTES DE APROBACIÓN de Naza (los catalanes, además, de revisión nativa).
 */
export const TEXTOS_CUBIERTA: Record<LenguaLibro, {
  etiqueta: string; siempre: string; contra: (nombre: string) => string; escucha: string; lema: string;
}> = {
  'es-AR': {
    etiqueta: 'El libro de su vida',
    siempre: 'para siempre',
    contra: (n) => `Estas páginas guardan la vida de ${n}, contada con sus propias palabras: sus mejores historias, tal como las vivió. En este QR, sus mejores frases.`,
    escucha: 'Escuchá su voz',
    lema: 'Para las vidas que merecen su propio libro',
  },
  'es-ES': {
    etiqueta: 'El libro de su vida',
    siempre: 'para siempre',
    contra: (n) => `Estas páginas guardan la vida de ${n}, contada con sus propias palabras: sus mejores historias, tal como las vivió. En este QR, sus mejores frases.`,
    escucha: 'Escucha su voz',
    lema: 'Para las vidas que merecen su propio libro',
  },
  ca: {
    etiqueta: 'El llibre de la seva vida',
    siempre: 'per sempre',
    contra: (n) => `Aquestes pàgines guarden la vida ${deCatalan(n)}, explicada amb les seves pròpies paraules: les seves millors històries, tal com les va viure. En aquest QR, les seves millors frases.`,
    escucha: 'Escolta la seva veu',
    lema: 'Per a les vides que mereixen el seu propi llibre',
  },
};

/** «de» en catalán se apostrofa ante vocal o hache: «d’Imma», «de Joan». */
export function deCatalan(nombre: string): string {
  return /^[aeiouàáèéíïòóúüh]/i.test(nombre.trim()) ? `d’${nombre}` : `de ${nombre}`;
}

/** «Imma Colell» → «I · C» (como el monograma del libro, con aire). */
function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '';
  if (p.length === 1) return p[0].charAt(0).toUpperCase();
  return `${p[0].charAt(0).toUpperCase()} · ${p[p.length - 1].charAt(0).toUpperCase()}`;
}

/**
 * El cuerpo del nombre en la tapa, en % del ancho de la tapa: 11,4 (el de Imma), salvo que su palabra más
 * larga no entre en el ancho útil (84 %). Una palabra nunca se corta. Ancho aproximado de la Source Serif:
 * 0,72 em una mayúscula, 0,5 em el resto.
 */
export function cuerpoNombreCubierta(nombre: string): number {
  const ancho = (palabra: string) => [...palabra].reduce((a, c) => a + (c !== c.toLowerCase() ? 0.72 : 0.5), 0);
  const mayor = Math.max(0, ...nombre.split(/\s+/).map(ancho));
  return mayor > 0 ? Math.min(11.4, Math.floor(((84 * 0.95) / mayor) * 10) / 10) : 11.4;
}

/** Como en la tapa de Imma: el primer nombre en un renglón y el resto debajo («IMMA<br>COLELL»). */
export function nombreEnRenglones(nombre: string): string {
  const [primero, ...resto] = nombre.trim().split(/\s+/);
  return resto.length ? `${escaparHtml(primero)}<br>${escaparHtml(resto.join(' '))}` : escaparHtml(primero ?? '');
}

export type DatosCubierta = {
  /** El nombre como va en la tapa (el título que eligió la dueña, o el nombre del narrador). */
  nombreTapa: string;
  /** El nombre para el texto de la contratapa y las iniciales. */
  nombreNarrador: string;
  lengua: LenguaLibro;
  /** La foto de tapa como data URI (la original de la familia), o null. */
  foto: string | null;
  /** object-position de la foto, p. ej. «50% 30%» (fotos.foco). */
  fotoPosicion?: string;
  /** Adónde lleva el QR: la página de su voz (token-voz.ts → urlVozDeNarrador). */
  urlQr: string;
  /** Páginas del interior ya armado: definen el lomo. */
  paginas: number;
};

function toroide(clase: string): string {
  const anillos: [number, number, number][] = [[86.14, 13.86, 17.63], [73.23, 26.77, 34.07], [60.65, 39.35, 50.08], [48.29, 51.71, 65.82], [36.08, 63.92, 81.36], [23.99, 76.01, 96.74], [12.0, 88.0, 112.0]];
  const el = anillos.map(([cx, rx, ry]) => `<ellipse cx="${cx}" cy="145" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="${200 - cx}" cy="145" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="2"/>`).join('');
  return `<svg class="${clase}" viewBox="-78 31 356 228" xmlns="http://www.w3.org/2000/svg">${el}</svg>`;
}

/** El QR como un solo path vectorial (nítido a cualquier resolución), con su margen blanco. */
function qrSvg(url: string): string {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const n = modules.size;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" style="width:100%;height:100%;display:block" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#161513"/></svg>`;
}

export function htmlCubierta(d: DatosCubierta, m: MedidasCubierta = medidasCubierta(d.paginas)): string {
  const t = TEXTOS_CUBIERTA[d.lengua];
  const s = m.solapaMm;
  const A = m.anchoTapaMm;
  const H = m.altoTapaMm;
  // De izquierda a derecha: solapa, contratapa, lomo, frente, solapa. El lomo negro va 1 mm más ancho de
  // cada lado: si Bookmundo corre la imagen, el borde del lomo no queda blanco.
  const xLomo = s + A;
  const xFrente = s + A + m.lomoMm;
  const conTextoLomo = m.lomoMm >= LOMO_MINIMO_TEXTO_MM;
  const textoLomo = `${d.nombreTapa} · ${t.etiqueta}`;
  const cuerpoLomo = Math.min(m.lomoMm * 0.28, 5.5, 150 / Math.max(1, textoLomo.length * 0.68));
  const foto = d.foto
    ? `<img src="${escaparHtml(d.foto)}" alt="" style="object-position:${escaparHtml(d.fotoPosicion ?? '50% 50%')}">`
    : `<div class="foto-vacia">${toroide('foto-toroide')}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${fuentesImprentaCss()}
  @page { size: ${m.anchoTotalMm}mm ${m.altoTotalMm}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  html, body { padding: 0; background: #f3f2ee; }
  .area { position: relative; width: ${m.anchoTotalMm}mm; height: ${m.altoTotalMm}mm; background: #f3f2ee; overflow: hidden; }
  .cara { position: absolute; top: ${s}mm; height: ${H}mm; width: ${A}mm; container-type: size; color: #1b1a17; }
  .foto { position: relative; overflow: hidden; background: #d9d6cf; height: calc(${H * 0.65}mm + ${s}mm); margin-top: -${s}mm; width: calc(100% + ${s}mm); }
  .foto img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .foto-vacia { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #1b1a17; color: #f3f2ee; }
  .foto-toroide { width: 34%; opacity: 0.55; }
  .pie { position: absolute; left: 0; right: 0; top: 65%; bottom: 0; display: flex; flex-direction: column; padding: 6cqw 7cqw 6cqw 9cqw; }
  .etiqueta { font-family: Archivo, sans-serif; font-size: 2.5cqw; font-weight: 500; letter-spacing: 0.32em; text-transform: uppercase; color: #77736a; }
  .nombre { margin-top: 3.5cqw; font-family: 'Source Serif 4', Georgia, serif; font-size: ${cuerpoNombreCubierta(d.nombreTapa)}cqw; line-height: 1.02; letter-spacing: -0.01em; text-wrap: balance; }
  .base { margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between; }
  .siempre { font-family: 'Source Serif 4', Georgia, serif; font-style: italic; font-size: 4.3cqw; }
  .marca { display: flex; align-items: center; gap: 1.8cqw; font-family: Archivo, sans-serif; font-size: 2.6cqw; letter-spacing: 0.2em; color: #77736a; }
  .marca-toroide { width: 8cqw; height: auto; color: #5a5750; }
  .contra { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 10cqw 11cqw 6cqw; }
  .contra-toroide { width: 30cqw; height: auto; }
  .iniciales { margin-top: 4cqw; font-family: 'Source Serif 4', Georgia, serif; font-size: 7cqw; letter-spacing: 0.08em; }
  .contra-texto { margin-top: 15cqw; font-family: 'Source Serif 4', Georgia, serif; font-size: 3.4cqw; line-height: 1.45; color: #26231e; }
  .qr { display: block; margin-top: 9cqw; width: 18cqw; aspect-ratio: 1; border: 0.45cqw solid #161513; padding: 0.4cqw; background: #fff; }
  .escucha { margin-top: 3cqw; font-family: Archivo, sans-serif; font-size: 2.4cqw; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; color: #8a7246; }
  .cierre { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 0.4em; }
  .lema { font-family: 'Source Serif 4', Georgia, serif; font-style: italic; font-size: 3.6cqw; }
  .web { font-family: Archivo, sans-serif; font-size: 2.3cqw; letter-spacing: 0.26em; text-transform: uppercase; color: #77736a; }
  .lomo { position: absolute; top: 0; height: ${m.altoTotalMm}mm; left: ${xLomo - 1}mm; width: ${m.lomoMm + 2}mm; background: linear-gradient(90deg, #0b0b0b, #1e1e1d 45%, #0f0f0e); color: #f1efe9; }
  /* Texto y logo a 14 mm del corte: si Bookmundo recorta el alto, no se cortan. */
  .lomo-in { position: absolute; left: 0; right: 0; top: ${s}mm; height: ${H}mm; display: flex; flex-direction: column; align-items: center; justify-content: ${conTextoLomo ? 'space-between' : 'flex-end'}; padding: 14mm 0; }
  .lomo-texto { writing-mode: vertical-rl; font-family: Archivo, sans-serif; font-size: ${cuerpoLomo}mm; letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
  .lomo-toroide { width: ${m.lomoMm * 0.64}mm; height: auto; }
</style></head><body><div class="area">
  <div class="cara" style="left:${s}mm">
    <div class="contra">
      ${toroide('contra-toroide')}
      <span class="iniciales">${escaparHtml(iniciales(d.nombreNarrador))}</span>
      <p class="contra-texto">${escaparHtml(t.contra(d.nombreNarrador))}</p>
      <span class="qr">${qrSvg(d.urlQr)}</span>
      <span class="escucha">${t.escucha}</span>
      <span class="cierre"><span class="lema">${t.lema}</span><span class="web">vitacorafamiliar.com</span></span>
    </div>
  </div>
  <div class="cara" style="left:${xFrente}mm">
    <div class="foto">${foto}</div>
    <div class="pie">
      <span class="etiqueta">${t.etiqueta}</span>
      <span class="nombre">${nombreEnRenglones(d.nombreTapa)}</span>
      <div class="base">
        <span class="siempre">${t.siempre}</span>
        <span class="marca">${toroide('marca-toroide')}V · F</span>
      </div>
    </div>
  </div>
  <div class="lomo"><div class="lomo-in">${conTextoLomo ? `<span class="lomo-texto">${escaparHtml(textoLomo)}</span>` : ''}${toroide('lomo-toroide')}</div></div>
</div></body></html>`;
}

export type ResultadoCubierta = {
  png: Buffer;
  /** La misma cubierta con las líneas de corte, lomo y zona segura de 8 mm, a resolución de pantalla: NO subir. */
  guias: Buffer;
  medidas: MedidasCubierta;
  /** Píxeles del PNG. */
  anchoPx: number;
  altoPx: number;
  /** Lo que leyó el lector de QR en el PNG (null si no leyó nada). */
  qrLeido: string | null;
  /** Resolución efectiva de la foto de tapa como queda impresa (null sin foto). */
  pppFoto: number | null;
};

const PX_CSS_POR_MM = 96 / 25.4;
// jsqr es CommonJS con `exports.default`: según quién lo cargue (tsc o tsx), la función está en un lado o en el otro.
type LectorQr = (datos: Uint8ClampedArray, ancho: number, alto: number) => { data: string } | null;
const jsQR: LectorQr = ((jsQRModulo as unknown as { default?: LectorQr }).default ?? jsQRModulo) as unknown as LectorQr;

export async function generarCubierta(d: DatosCubierta): Promise<ResultadoCubierta> {
  const m = medidasCubierta(d.paginas);
  const ancho = m.anchoTotalMm * PX_CSS_POR_MM;
  const alto = m.altoTotalMm * PX_CSS_POR_MM;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: PPP_CUBIERTA / 96, viewport: { width: Math.ceil(ancho), height: Math.ceil(alto) } });
    await page.setContent(htmlCubierta(d, m), { waitUntil: 'load', timeout: 120_000 });
    await page.evaluate(() => document.fonts.ready);
    // Los scripts del navegador van como texto: tsx (los scripts locales) les mete un `__name` que allá no existe.
    type Caja = { x: number; y: number; w: number; h: number } | null;
    const caja = (await page.evaluate(`(() => {
      const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
      const img = document.querySelector('.foto img');
      return { qr: r('.qr'), foto: r('.foto'), natural: img ? { w: img.naturalWidth, h: img.naturalHeight } : null };
    })()`)) as { qr: Caja; foto: Caja; natural: { w: number; h: number } | null };
    // Chromium recorta la captura a px CSS enteros: se captura de más y se corta a la medida exacta a 300 ppp.
    const crudo = await page.screenshot({ clip: { x: 0, y: 0, width: Math.ceil(ancho), height: Math.ceil(alto) }, timeout: 120_000 });
    const png = conPpp(recortar(crudo, Math.round((m.anchoTotalMm / 25.4) * PPP_CUBIERTA), Math.round((m.altoTotalMm / 25.4) * PPP_CUBIERTA)), PPP_CUBIERTA);

    // Las guías, a 1 px por px CSS (para mirar, no para imprimir).
    const s = m.solapaMm, A = m.anchoTapaMm, l = m.lomoMm, H = m.altoTapaMm;
    const r = (x: number, y: number, w: number, h: number, c: string, punteado: boolean) =>
      `<div style="position:absolute;left:${x}mm;top:${y}mm;width:${w}mm;height:${h}mm;border:0.4mm ${punteado ? 'dashed' : 'solid'} ${c}"></div>`;
    const lineas = r(s, s, 2 * A + l, H, 'red', false) + r(s + A, s, l, H, 'red', false) + r(s + 8, s + 8, A - 16, H - 16, '#09f', true) + r(s + A + l + 8, s + 8, A - 16, H - 16, '#09f', true);
    await page.evaluate(`(() => {
      const g = document.createElement('div');
      g.style.cssText = 'position:absolute;left:0;top:0;width:${ancho}px;height:${alto}px;z-index:99;pointer-events:none';
      g.innerHTML = ${JSON.stringify(lineas)};
      document.querySelector('.area').appendChild(g);
    })()`);
    const guias = await page.screenshot({ clip: { x: 0, y: 0, width: ancho, height: alto }, scale: 'css' });

    const leido = PNG.sync.read(png);
    const escala = leido.width / ancho;
    const qrLeido = caja.qr ? leerQr(leido, caja.qr, escala) : null;
    let pppFoto: number | null = null;
    if (d.foto && caja.foto && caja.natural && caja.natural.w > 0) {
      // object-fit: cover → la foto se agranda hasta cubrir el lugar: manda el lado que más se estira.
      const wIn = caja.foto.w / 96, hIn = caja.foto.h / 96;
      pppFoto = Math.round(1 / Math.max(wIn / caja.natural.w, hIn / caja.natural.h));
    }
    return { png, guias, medidas: m, anchoPx: leido.width, altoPx: leido.height, qrLeido, pppFoto };
  } finally {
    await browser.close();
  }
}

/** El PNG cortado a ancho×alto px desde arriba a la izquierda. */
function recortar(png: Buffer, ancho: number, alto: number): Buffer {
  const origen = PNG.sync.read(png);
  if (origen.width === ancho && origen.height === alto) return png;
  const w = Math.min(ancho, origen.width), h = Math.min(alto, origen.height);
  const destino = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) origen.data.copy(destino.data, y * w * 4, y * origen.width * 4, y * origen.width * 4 + w * 4);
  return PNG.sync.write(destino);
}

/** Lee el QR de una zona del PNG (con un margen alrededor), como lo leería un teléfono. */
function leerQr(png: PNG, caja: { x: number; y: number; w: number; h: number }, escala: number): string | null {
  const margen = caja.w * 0.15;
  const x0 = Math.max(0, Math.floor((caja.x - margen) * escala));
  const y0 = Math.max(0, Math.floor((caja.y - margen) * escala));
  const x1 = Math.min(png.width, Math.ceil((caja.x + caja.w + margen) * escala));
  const y1 = Math.min(png.height, Math.ceil((caja.y + caja.h + margen) * escala));
  const w = x1 - x0, h = y1 - y0;
  const datos = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const desde = ((y0 + y) * png.width + x0) * 4;
    datos.set(png.data.subarray(desde, desde + w * 4), y * w * 4);
  }
  return jsQR(datos, w, h)?.data ?? null;
}

// --- La resolución escrita en el PNG -----------------------------------------------------------------------
// Las capturas de Chromium no dicen a cuántos ppp están (un programa las toma a 72): se agrega el bloque
// pHYs del PNG con 300 ppp, para que la imagen «mida» lo que tiene que medir.

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Devuelve el PNG con su resolución en ppp (reemplaza el pHYs si ya tenía). */
export function conPpp(png: Buffer, ppp: number): Buffer {
  const firma = png.subarray(0, 8);
  const bloques: Buffer[] = [];
  let i = 8;
  while (i < png.length) {
    const largo = png.readUInt32BE(i);
    const tipo = png.toString('latin1', i + 4, i + 8);
    const total = 12 + largo;
    if (tipo !== 'pHYs') bloques.push(png.subarray(i, i + total));
    if (tipo === 'IHDR') {
      const datos = Buffer.alloc(9);
      const porMetro = Math.round(ppp / 0.0254);
      datos.writeUInt32BE(porMetro, 0);
      datos.writeUInt32BE(porMetro, 4);
      datos.writeUInt8(1, 8);
      const tipoYDatos = Buffer.concat([Buffer.from('pHYs', 'latin1'), datos]);
      const bloque = Buffer.alloc(12 + 9);
      bloque.writeUInt32BE(9, 0);
      tipoYDatos.copy(bloque, 4);
      bloque.writeUInt32BE(crc32(tipoYDatos), 4 + tipoYDatos.length);
      bloques.push(bloque);
    }
    i += total;
  }
  return Buffer.concat([firma, ...bloques]);
}

/** Los ppp que dice el bloque pHYs del PNG (null si no lo tiene). */
export function pppDePng(png: Buffer): number | null {
  let i = 8;
  while (i < png.length) {
    const largo = png.readUInt32BE(i);
    const tipo = png.toString('latin1', i + 4, i + 8);
    if (tipo === 'pHYs') {
      if (png.readUInt8(i + 16) !== 1) return null;
      return Math.round(png.readUInt32BE(i + 8) * 0.0254);
    }
    if (tipo === 'IDAT') return null;
    i += 12 + largo;
  }
  return null;
}
