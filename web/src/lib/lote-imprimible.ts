// web/src/lib/lote-imprimible.ts
// La hoja que se imprime para los locales (regalo en locales, 17/10): cartas A5
// dobladas al medio (A6) y una hoja de stickers. Solo imports relativos: la corre
// `scripts/lote-local.mts` con tsx, que no resuelve el alias `@/`.

import type { IdiomaRegalo } from "./regalo-textos";

/**
 * Textos aprobados por Naza el 17/10/2026, ver docs/regalo/locales/textos-aprobados.md.
 * El catalán lo tradujo Claude y debe revisarlo un nativo antes de la primera
 * impresión. Sin precio, sin dos puntos.
 */
export const TEXTOS_CARTA: Record<IdiomaRegalo, {
  tapa: string;
  esUnRegalo: string;
  adentro: string;
  contratapa: string;
  para: string;
  de: string;
  stickerTitulo: string;
  stickerPara: string;
  lang: string;
}> = {
  "es-AR": {
    tapa: "En cada familia hay un libro sin escribir",
    esUnRegalo: "Esto es un regalo.",
    adentro: "Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp. Vos le contestás con audios, cuando puedas. Con lo que le cuentes se escribe el libro de tu vida.",
    contratapa: "Para regalarla, escaneá el código y pagala en vitacorafamiliar.com. Recién ahí queda activada.",
    para: "Para",
    de: "De",
    stickerTitulo: "El libro de tu vida",
    stickerPara: "Para",
    lang: "es",
  },
  "es-ES": {
    tapa: "En cada familia hay un libro sin escribir",
    esUnRegalo: "Esto es un regalo.",
    adentro: "Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp. Tú le contestas con audios, cuando puedas. Con lo que le cuentes se escribe el libro de tu vida.",
    contratapa: "Para regalarla, escanea el código y págala en vitacorafamiliar.com. Solo entonces queda activada.",
    para: "Para",
    de: "De",
    stickerTitulo: "El libro de tu vida",
    stickerPara: "Para",
    lang: "es",
  },
  ca: {
    tapa: "A cada família hi ha un llibre per escriure",
    esUnRegalo: "Això és un regal.",
    adentro: "Un biògraf et farà preguntes sobre la teva vida per WhatsApp. Tu li respons amb àudios, quan puguis. Amb el que li expliquis s'escriu el llibre de la teva vida.",
    contratapa: "Per regalar-la, escaneja el codi i paga-la a vitacorafamiliar.com. Només llavors queda activada.",
    para: "Per a",
    de: "De",
    stickerTitulo: "El llibre de la teva vida",
    stickerPara: "Per a",
    lang: "ca",
  },
};

// El toroide de la marca (src/app/marca.tsx), a mano porque acá no hay React.
const ANILLOS: ReadonlyArray<readonly [number, number, number]> = [
  [86.14, 13.86, 17.63],
  [73.23, 26.77, 34.07],
  [60.65, 39.35, 50.08],
  [48.29, 51.71, 65.82],
  [36.08, 63.92, 81.36],
  [23.99, 76.01, 96.74],
  [12.0, 88.0, 112.0],
];

function toroideSvg(clase: string): string {
  const elipses = ANILLOS.map(([cx, rx, ry]) =>
    [cx, 200 - cx].map((x) => `<ellipse cx="${x}" cy="145" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="1.35"/>`).join(""),
  ).join("");
  return `<svg class="${clase}" viewBox="-78 31 356 228" role="img" aria-label="Vitácora Familiar">${elipses}</svg>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const CSS = `
@page { size: A4; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
html, body { background: #fff; color: #14140F }
body { font-family: "Source Serif 4", Georgia, serif; font-weight: 300 }
.hoja { width: 210mm; height: 297mm; page-break-after: always; break-after: page; position: relative; overflow: hidden }
.a5 { width: 210mm; height: 148.5mm; display: grid; grid-template-columns: 1fr 1fr; position: relative }
.panel { position: relative; padding: 12mm 10mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center }
.panel + .panel { border-left: 0.2mm dashed #14140F55 }
.a5 + .a5 { border-top: 0.2mm dashed #14140F55 }
.toroide { width: 34mm; height: auto; color: #14140F }
.marca { margin-top: 5mm; font-family: Archivo, sans-serif; font-size: 7pt; letter-spacing: 0.3em; text-transform: uppercase }
.tapa { margin-top: 7mm; font-family: "Playfair Display", serif; font-weight: 500; font-size: 15pt; line-height: 1.2 }
.escribir { width: 100%; text-align: left; font-family: Archivo, sans-serif; font-size: 8pt; margin-bottom: 14mm }
.escribir span { display: block; border-bottom: 0.3mm solid #14140F; height: 9mm }
.escribir b { font-weight: 400; letter-spacing: 0.15em; text-transform: uppercase; font-size: 7pt }
.regalo { font-family: "Playfair Display", serif; font-weight: 500; font-size: 14pt }
.texto { margin-top: 3mm; font-size: 9pt; line-height: 1.35 }
.qr { width: 30mm; height: 30mm; margin-top: 4mm }
.codigo { margin-top: 2mm; font-family: Archivo, sans-serif; font-weight: 500; font-size: 17pt; letter-spacing: 0.12em }
.contratapa { font-family: Archivo, sans-serif; font-size: 7pt; line-height: 1.4; max-width: 60mm }
.stickers { display: grid; grid-template-columns: repeat(3, 40mm); grid-auto-rows: 40mm; gap: 12mm; justify-content: center; align-content: center; height: 100% }
.sticker { width: 40mm; height: 40mm; border-radius: 50%; border: 0.2mm solid #14140F33; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 4mm }
.sticker .toroide { width: 22mm }
.sticker p { margin-top: 2mm; font-family: Archivo, sans-serif; font-size: 5.5pt; letter-spacing: 0.08em; line-height: 1.25 }
.sticker .para { width: 100%; margin-top: 1.5mm; display: flex; align-items: flex-end; gap: 1mm; font-size: 5.5pt }
.sticker .para span { flex: 1; border-bottom: 0.25mm solid #14140F; height: 4mm }
`;

/**
 * HTML completo para imprimir un lote. Por cada dos cartas, una hoja A4 con las
 * caras de afuera y otra con las de adentro (imprimir a doble faz, dando vuelta
 * por el borde largo). Al final, una hoja de 12 stickers sin código.
 */
export function armarHojaLote(cartas: { codigo: string; qr: string }[], idioma: IdiomaRegalo): string {
  const t = TEXTOS_CARTA[idioma];

  // Afuera: contratapa (cómo se activa) a la izquierda, tapa a la derecha.
  const exterior = (n: number) => {
    const fila = `<div class="a5"><div class="panel"><p class="contratapa">${esc(t.contratapa)}</p></div><div class="panel">${toroideSvg("toroide")}<p class="marca">Vitácora Familiar</p><p class="tapa">${esc(t.tapa)}</p></div></div>`;
    return fila.repeat(n);
  };
  // Adentro: Para/De a la izquierda; qué es, QR y código a la derecha.
  const interior = (c: { codigo: string; qr: string }) =>
    `<div class="a5">` +
    `<div class="panel"><div class="escribir"><b>${esc(t.para)}</b><span></span></div><div class="escribir"><b>${esc(t.de)}</b><span></span></div></div>` +
    `<div class="panel"><p class="regalo">${esc(t.esUnRegalo)}</p><p class="texto">${esc(t.adentro)}</p>` +
    `<img class="qr" src="${esc(c.qr)}" alt="QR"><p class="codigo">${esc(c.codigo)}</p></div>` +
    `</div>`;

  const hojas: string[] = [];
  for (let i = 0; i < cartas.length; i += 2) {
    const par = cartas.slice(i, i + 2);
    hojas.push(`<section class="hoja">${exterior(par.length)}</section>`);
    hojas.push(`<section class="hoja">${par.map(interior).join("")}</section>`);
  }

  const sticker = `<div class="sticker">${toroideSvg("toroide")}<p>${esc(t.stickerTitulo)}</p><p class="para">${esc(t.stickerPara)}<span></span></p></div>`;
  hojas.push(`<section class="hoja"><div class="stickers">${sticker.repeat(12)}</div></section>`);

  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<title>Lote de cartas</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500&family=Archivo:wght@400;500&family=Source+Serif+4:wght@300;400&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${hojas.join("\n")}
</body>
</html>
`;
}
