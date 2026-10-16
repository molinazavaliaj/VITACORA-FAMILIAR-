// La plantilla de Kids (nueva, aparte de la de la casa): el libro y el sobre como HTML A5, para htmlAPdf.
//
// El libro: tapa con su nombre y «Capítulo Uno: {edad} años»; las cuatro partes con sus títulos del banco y sus
// piezas, cada una con su título chico; al final de la parte 4, las preguntas del padre con su línea; el álbum
// «Mis cosas a los {edad}», una foto por página con lo que dijo abajo; y «Su voz», con un QR al audio real al lado de
// cada respuesta elegida, como en la casa (qr.ts). El sobre: su tapa y cada pregunta con lo que contestó.
//
// Sin paginador propio: el papel llega al borde (@page sin margen) y cada bloque de texto repite su margen en cada
// hoja (box-decoration-break: clone). htmlAPdf espera `window.__libroPaginado`: se pone cuando cargan las letras.
//
// Los textos fijos de acá («Su voz», su bajada y «Escuchala») los aprobó Naza el 16/10 (tanda 5); los de España
// (tú), el 16/10 (tanda 8); los de catalán, el 16/10 (tanda 10), salvo los números de las partes (TEXTO PARA NAZA).
// Salen en el idioma del chico (LibroKids.idioma; sin idioma, es-AR). Un idioma sin textos tiraría (idioma-textos.ts),
// nunca un PDF en castellano.
import { escaparHtml } from '../../libro/comun.js';
import { qrDataUri } from '../../libro/qr.js';
import type { LibroKids, VozLibro } from './libro-md.js';
import type { FuenteFotos } from './fotos.js';
import { IDIOMA_POR_DEFECTO, type IdiomaKids } from '../../kids-v2/idioma.js';
import { deIdioma } from '../idioma-textos.js';

export const TEXTOS_KIDS = {
  suVoz: 'Su voz',
  suVozBajada: 'Estas respuestas están también en audio, tal como las dijo. Apuntá el teléfono al código y la escuchás.',
  escuchala: 'Escuchala',
  altQr: 'Código para escuchar esta respuesta',
  marca: 'VITÁCORA',
  parte: 'Parte',
  numeros: ['', 'Uno', 'Dos', 'Tres', 'Cuatro'],
};

export type TextosKids = typeof TEXTOS_KIDS;

// APROBADO por Naza 16/10 (tanda 8)
export const TEXTOS_KIDS_ES_ES: TextosKids = {
  suVoz: 'Su voz',
  suVozBajada: 'Estas respuestas están también en audio, tal como las dijo. Apunta el móvil al código y la escuchas.',
  escuchala: 'Escúchala',
  altQr: 'Código para escuchar esta respuesta',
  marca: 'VITÁCORA',
  parte: 'Parte',
  numeros: ['', 'Uno', 'Dos', 'Tres', 'Cuatro'],
};

// Aprobado por Naza el 16/10/2026 (tanda 10), de docs/rediseno-2026-10/kids/textos-ca-2026-10-16.md (columna Català).
export const TEXTOS_KIDS_CA: TextosKids = {
  suVoz: 'La seva veu',
  suVozBajada: "Aquestes respostes també són en àudio, tal com les va dir. Apunta el mòbil al codi i l'escoltes.",
  escuchala: 'Escolta-la',
  altQr: 'Codi per escoltar aquesta resposta',
  marca: 'VITÁCORA',
  // TEXTO PARA NAZA: la apertura de cada parte. En catalán «part» es femenino y «Part Un» no suena a libro: va el
  // ordinal entero («Primera part»), sin la palabra suelta. Alternativa sin ordinal: parte 'Part' y 'una', 'dues'…
  parte: '',
  numeros: ['', 'Primera part', 'Segona part', 'Tercera part', 'Quarta part'],
};

/** Los idiomas con sus textos aprobados. */
export const TEXTOS_KIDS_DE: Readonly<Partial<Record<IdiomaKids, TextosKids>>> = { 'es-AR': TEXTOS_KIDS, 'es-ES': TEXTOS_KIDS_ES_ES, ca: TEXTOS_KIDS_CA };

export const textosKids = (idioma: IdiomaKids = IDIOMA_POR_DEFECTO): TextosKids => deIdioma(TEXTOS_KIDS_DE, idioma, 'los textos fijos del PDF (Su voz, Parte, números)');

const LANG: Readonly<Record<IdiomaKids, string>> = { 'es-AR': 'es', 'es-ES': 'es', ca: 'ca' };

export type OpcionesHtml = {
  /** El link del audio de una respuesta (el QR). En producción lo arma quien conoce el narrador y el token. */
  urlDeAudio: (v: VozLibro) => string;
  fotos: FuenteFotos;
  /** Las letras de Google Fonts (sin red, los tests lo apagan y quedan las de reserva). */
  conFuentes?: boolean;
};

const e = escaparHtml;
const parrafos = (t: string): string => t.trim().split(/\n\s*\n|\n/).filter((x) => x.trim()).map((x) => `<p>${e(x.trim())}</p>`).join('');

const FUENTES = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,500&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Archivo:wght@400;600;700&display=swap">';

const ESTILOS = `
  :root { --papel: #faf7f1; --tinta: #1c1917; --acento: #3f6f8f; --gris1: #a8a29e; --gris3: #57534e; --gris5: #292524; --linea: #e2ddd3; }
  @page { size: A5; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--papel); color: var(--tinta); font-family: 'Source Serif 4', Georgia, serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .hoja { width: 148mm; height: 210mm; position: relative; overflow: hidden; break-after: page; page-break-after: always; }
  .flujo { padding: 22mm 18mm 20mm; -webkit-box-decoration-break: clone; box-decoration-break: clone; break-before: page; page-break-before: always; }
  .marca { font-family: Archivo, Arial, sans-serif; font-size: 9px; letter-spacing: 0.3em; color: var(--gris3); }
  .tapa { display: flex; flex-direction: column; justify-content: center; padding: 0 18mm; }
  .tapa .franja { position: absolute; top: 0; bottom: 0; left: 0; width: 14px; background: var(--acento); }
  .tapa h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 44px; line-height: 1.05; margin: 0 0 18px; }
  .tapa .sub { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 20px; color: var(--gris3); }
  .tapa .marca { position: absolute; bottom: 18mm; left: 18mm; }
  .apertura { display: flex; flex-direction: column; justify-content: center; padding: 0 18mm; }
  .apertura .num { font-family: Archivo, Arial, sans-serif; font-size: 11px; letter-spacing: 0.3em; color: var(--acento); font-weight: 600; text-transform: uppercase; }
  .apertura h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 36px; margin: 14px 0 0; }
  .apertura .regla { width: 44px; height: 1px; background: var(--acento); margin-top: 22px; }
  .pieza { margin: 0 0 26px; }
  .pieza h3 { font-family: Archivo, Arial, sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--acento); margin: 0 0 10px; break-after: avoid; }
  .pieza p, .sobre-pieza p { font-size: 15px; line-height: 1.7; color: var(--gris5); margin: 0 0 10px; }
  .corta { break-inside: avoid; }
  .padre { margin: 34px 0 26px; padding-top: 18px; border-top: 1px solid var(--linea); break-inside: avoid; }
  .padre .linea { font-style: italic; font-size: 13px; color: var(--gris3); margin: 0 0 6px; }
  .padre .pregunta { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 18px; line-height: 1.35; margin: 0 0 12px; }
  .foto { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 18mm; }
  .foto img { max-width: 100%; max-height: 140mm; object-fit: contain; display: block; }
  .foto .sin-imagen { width: 100%; height: 90mm; border: 1px dashed var(--linea); }
  .foto .epigrafe { margin-top: 14px; font-style: italic; font-size: 13.5px; line-height: 1.45; color: var(--gris3); text-align: center; max-width: 100mm; }
  .su-voz h2 { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 400; font-size: 30px; margin: 0 0 8px; }
  .su-voz .regla { width: 44px; height: 1px; background: var(--acento); margin: 0 0 18px; }
  .su-voz .bajada { font-size: 13px; line-height: 1.6; color: var(--gris3); margin: 0 0 24px; }
  .voz { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0 0 16px; break-inside: avoid; }
  .voz .texto .parte { font-family: Archivo, Arial, sans-serif; font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gris1); }
  .voz .texto .titulo { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 18px; line-height: 1.3; }
  .voz .qr { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .voz .qr img { width: 96px; height: 96px; display: block; }
  .voz .qr .rotulo { font-family: Archivo, Arial, sans-serif; font-size: 8px; font-weight: 600; letter-spacing: 0.22em; color: var(--acento); text-transform: uppercase; }
  .sobre-pieza { margin: 0 0 28px; }
  .sobre-pieza .pregunta { font-family: Archivo, Arial, sans-serif; font-size: 10.5px; letter-spacing: 0.08em; color: var(--gris3); margin: 0 0 8px; break-after: avoid; }
`;

const documento = (titulo: string, cuerpo: string, o: { conFuentes?: boolean }, idioma: IdiomaKids = IDIOMA_POR_DEFECTO): string => `<!doctype html>
<html lang="${LANG[idioma]}"><head><meta charset="utf-8"><title>${e(titulo)}</title>${o.conFuentes === false ? '' : FUENTES}<style>${ESTILOS}</style></head>
<body>${cuerpo}
<script>(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { window.__libroPaginado = true; });</script>
</body></html>`;

export async function htmlLibroKids(l: LibroKids, o: OpcionesHtml): Promise<string> {
  const T = textosKids(l.idioma);
  const b: string[] = [];
  b.push(`<section class="hoja tapa"><div class="franja"></div><h1>${e(l.nombre)}</h1><div class="sub">${e(l.subtitulo)}</div><div class="marca">${T.marca}</div></section>`);
  for (const p of l.partes) {
    if (!p.piezas.length) continue;
    b.push(`<section class="hoja apertura"><div class="num">${[T.parte, T.numeros[p.n] ?? String(p.n)].filter(Boolean).join(' ')}</div><h2>${e(p.titulo)}</h2><div class="regla"></div></section>`);
    const piezas = p.piezas.map((pz) => {
      if (pz.padre) return `<div class="padre">${pz.linea ? `<p class="linea">${e(pz.linea)}</p>` : ''}<p class="pregunta">${e(pz.pregunta ?? '')}</p>${parrafos(pz.texto)}</div>`;
      return `<div class="pieza${pz.texto.length < 700 ? ' corta' : ''}"><h3>${e(pz.titulo)}</h3>${parrafos(pz.texto)}</div>`;
    });
    b.push(`<section class="flujo">${piezas.join('')}</section>`);
  }
  if (l.album.fotos.length) {
    b.push(`<section class="hoja apertura"><h2>${e(l.album.titulo)}</h2><div class="regla"></div></section>`);
    for (const f of l.album.fotos) {
      const uri = await o.fotos.dataUri(f.foto);
      b.push(`<section class="hoja foto">${uri ? `<img src="${uri}" alt="">` : '<div class="sin-imagen"></div>'}${f.epigrafe ? `<div class="epigrafe">${e(f.epigrafe)}</div>` : ''}</section>`);
    }
  }
  if (l.suVoz.length) {
    const voces: string[] = [];
    for (const v of l.suVoz) {
      const qr = await qrDataUri(o.urlDeAudio(v));
      voces.push(`<div class="voz"><div class="texto"><div class="parte">${e(v.parte)}</div><div class="titulo">${e(v.titulo)}</div></div><div class="qr"><img src="${qr}" width="96" height="96" alt="${T.altQr}"><div class="rotulo">${T.escuchala}</div></div></div>`);
    }
    b.push(`<section class="flujo su-voz"><h2>${T.suVoz}</h2><div class="regla"></div><p class="bajada">${T.suVozBajada}</p>${voces.join('')}</section>`);
  }
  return documento(l.nombre, b.join('\n'), o, l.idioma);
}

/** El sobre cerrado: nunca lleva QR (nadie lo escucha antes de abrirlo). */
export function htmlSobreKids(l: LibroKids, o: { conFuentes?: boolean } = {}): string {
  const T = textosKids(l.idioma);
  const b = [
    `<section class="hoja tapa"><div class="franja"></div><h1>${e(l.sobre.titulo)}</h1><div class="sub">${e(l.sobre.nombre)}<br>${e(l.subtitulo)}</div><div class="marca">${T.marca}</div></section>`,
    `<section class="flujo">${l.sobre.piezas.map((p) => `<div class="sobre-pieza"><p class="pregunta">${e(p.pregunta)}</p>${parrafos(p.texto)}</div>`).join('')}</section>`,
  ];
  return documento(l.sobre.titulo, b.join('\n'), o, l.idioma);
}
