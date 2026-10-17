// web/src/lib/lote-imprimible.ts
// La hoja que se imprime para los locales (regalo en locales, 17/10): la «carta-libro»,
// una cartulina que se dobla como un librito (afuera negro, adentro blanco), y una
// hoja de sellos redondos que lo cierran en el borde abierto (no hay sobre). Solo imports relativos: la corre `scripts/lote-local.mts` con
// tsx, que no resuelve el alias `@/`.
//
// Producción: las impresoras láser de copistería no imprimen hasta el borde del A4.
// Por eso cada carta abierta mide 200 × 140 mm (doblada, 100 × 140), van dos por A4
// apiladas y pegadas (se separan con un solo corte), con marcas de corte en el margen
// y 2 mm de negro de más afuera del corte, para que la guillotina no deje borde blanco.

import type { IdiomaRegalo } from "./regalo-textos";

/**
 * Textos aprobados por Naza el 17/10/2026, ver docs/regalo/locales/textos-aprobados.md.
 * El catalán lo tradujo Claude y debe revisarlo un nativo antes de la primera
 * impresión. Sin precio, sin dos puntos. `titulo` es el título de la tapa de la
 * carta-libro (17/10); `tapa` es la frase que ahora va en la contratapa.
 */
export const TEXTOS_CARTA: Record<IdiomaRegalo, {
  titulo: string;
  tapa: string;
  esUnRegalo: string;
  adentro: string;
  contratapa: string;
  para: string;
  de: string;
  lang: string;
}> = {
  "es-AR": {
    titulo: "El libro de tu vida",
    tapa: "En cada familia hay un libro sin escribir",
    esUnRegalo: "Esto es un regalo.",
    adentro: "Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp. Vos le contestás con audios, cuando puedas. Con lo que le cuentes se escribe el libro de tu vida.",
    contratapa: "Para regalarla, escaneá el código y pagala en vitacorafamiliar.com. Recién ahí queda activada.",
    para: "Para",
    de: "De",
    lang: "es",
  },
  "es-ES": {
    titulo: "El libro de tu vida",
    tapa: "En cada familia hay un libro sin escribir",
    esUnRegalo: "Esto es un regalo.",
    adentro: "Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp. Tú le contestas con audios, cuando puedas. Con lo que le cuentes se escribe el libro de tu vida.",
    contratapa: "Para regalarla, escanea el código y págala en vitacorafamiliar.com. Solo entonces queda activada.",
    para: "Para",
    de: "De",
    lang: "es",
  },
  ca: {
    titulo: "El llibre de la teva vida",
    tapa: "A cada família hi ha un llibre per escriure",
    esUnRegalo: "Això és un regal.",
    adentro: "Un biògraf et farà preguntes sobre la teva vida per WhatsApp. Tu li respons amb àudios, quan puguis. Amb el que li expliquis s'escriu el llibre de la teva vida.",
    contratapa: "Per regalar-la, escaneja el codi i paga-la a vitacorafamiliar.com. Només llavors queda activada.",
    para: "Per a",
    de: "De",
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

function toroideSvg(clase: string, trazo = 1.35): string {
  const elipses = ANILLOS.map(([cx, rx, ry]) =>
    [cx, 200 - cx].map((x) => `<ellipse cx="${x}" cy="145" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="${trazo}"/>`).join(""),
  ).join("");
  return `<svg class="${clase}" viewBox="-78 31 356 228" role="img" aria-label="Vitácora Familiar">${elipses}</svg>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Geometría en mm. A4 vertical: dos cartas de 200 × 140 apiladas y centradas.
const ANCHO_CARTA = 200;
const ALTO_CARTA = 140;
const X_CARTA = (210 - ANCHO_CARTA) / 2; // 5
const Y_CARTA = (297 - 2 * ALTO_CARTA) / 2; // 8,5
const SANGRADO = 2; // negro de más afuera del corte, solo en la cara de afuera
const LARGO_MARCA = 5;
const LOMO = 8; // ancho del lomo dibujado en la tapa, desde el doblez
const BISAGRA = 3.5; // la canaleta de la bisagra, justo después del lomo
const TAPA_DESDE = LOMO + BISAGRA; // el contenido de la tapa empieza después de la canaleta
const CONTRA_DOBLEZ = 6; // margen de la contratapa del lado del doblez
const TRAZO_TAPA = 3.4; // en unidades del viewBox (356 de ancho): a 34 mm da ~0,32 mm, imprimible en láser
const SELLO_LIBRE = 15; // franja libre en el borde abierto: ahí va medio sello de 25 mm
const SELLO = 25; // diámetro del sello
const SELLOS_COLUMNAS = 6;
const SELLOS_FILAS = 9;

const NEGRO = "#14140F";
const BLANCO = "#F4F2EC";

/** «El libro de tu vida» → «El libro» / «de tu vida»: se corta antes del primer « de ». */
function partirTitulo(titulo: string): [string, string] {
  const i = titulo.indexOf(" de ");
  return i < 0 ? [titulo, ""] : [titulo.slice(0, i), titulo.slice(i + 1)];
}

function raya(x: number, y: number, ancho: number, alto: number, clase: string): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  return `<i class="${clase}" style="left:${r(x)}mm;top:${r(y)}mm;width:${r(ancho)}mm;height:${r(alto)}mm"></i>`;
}

/**
 * Marcas de corte (en el margen, sin tocar la carta ni el sangrado) y marcas de
 * doblez arriba y abajo del centro. Las dos caras usan la misma geometría: la carta
 * está centrada en el A4, así que al dar vuelta por el borde largo cae en el mismo lugar.
 */
function marcas(n: number, conSangrado: boolean): string {
  const hueco = conSangrado ? SANGRADO + 1 : 1.5;
  const grosor = 0.2;
  const arriba = Y_CARTA;
  const abajo = Y_CARTA + n * ALTO_CARTA;
  const out: string[] = [];
  // Cortes verticales (los dos costados): marcas arriba y abajo.
  for (const x of [X_CARTA, X_CARTA + ANCHO_CARTA]) {
    out.push(raya(x - grosor / 2, arriba - hueco - LARGO_MARCA, grosor, LARGO_MARCA, "corte"));
    out.push(raya(x - grosor / 2, abajo + hueco, grosor, LARGO_MARCA, "corte"));
  }
  // Cortes horizontales (arriba, entre cartas, abajo): marcas a los costados.
  for (let k = 0; k <= n; k++) {
    const y = arriba + k * ALTO_CARTA;
    const largo = X_CARTA - hueco;
    out.push(raya(0, y - grosor / 2, largo, grosor, "corte"));
    out.push(raya(210 - largo, y - grosor / 2, largo, grosor, "corte"));
  }
  // Doblez: en el centro, arriba y abajo.
  const xc = 105 - grosor / 2;
  out.push(raya(xc, arriba - hueco - LARGO_MARCA, grosor, LARGO_MARCA, "pliegue"));
  out.push(raya(xc, abajo + hueco, grosor, LARGO_MARCA, "pliegue"));
  return out.join("");
}

const CSS = `
@page { size: A4; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
html, body { background: #fff; color: ${NEGRO}; -webkit-print-color-adjust: exact; print-color-adjust: exact }
body { font-family: "Source Serif 4", Georgia, serif; font-weight: 400 }
.hoja { width: 210mm; height: 297mm; page-break-after: always; break-after: page; position: relative; overflow: hidden; background: #fff }
.hoja:last-child { page-break-after: auto; break-after: auto }

/* Marcas de corte y de doblez, en el margen */
.corte, .pliegue { position: absolute; display: block; background: ${NEGRO} }
.pliegue { background: ${NEGRO}80 }

/* La carta abierta: 200 × 140, dos páginas de 100 × 140 */
.sangrado { position: absolute; background: ${NEGRO} }
.carta { position: absolute; left: ${X_CARTA}mm; width: ${ANCHO_CARTA}mm; height: ${ALTO_CARTA}mm; display: grid; grid-template-columns: 1fr 1fr }
.pagina { position: relative; height: ${ALTO_CARTA}mm }

/* Afuera: negro mate. La tapa centra todo entre la bisagra y el canto. El sello (12,5 mm del canto, a media altura)
   no toca el título: «de la teva vida», la línea más larga, queda a ~16,7 mm del canto. */
.afuera .pagina { color: ${BLANCO} }
.tapa > * { position: absolute; left: ${TAPA_DESDE}mm; right: 0; text-align: center }
/* Trampantojo de tapa dura: el lomo redondeado con luz junto al doblez y la canaleta de la bisagra. */
.tapa > .lomo, .tapa > .bisagra { right: auto; top: -${SANGRADO}mm; bottom: -${SANGRADO}mm }
.tapa > .lomo { left: 0; width: ${LOMO}mm; background: linear-gradient(to right, #22221d 0, #3d3d36 0.9mm, #32322c 2.2mm, #22221d 4.5mm, #181813 6.6mm, #0f0f0d ${LOMO}mm) }
.tapa > .bisagra { left: ${LOMO - 0.5}mm; width: ${BISAGRA + 0.5}mm; background: linear-gradient(to right, rgba(7, 7, 6, 0) 0, #0b0b0a 0.9mm, #070706 1.4mm, #070706 2mm, #4a4943 2.25mm, #4a4943 2.6mm, #2a2a24 3.1mm, rgba(20, 20, 15, 0) ${BISAGRA + 0.5}mm) }
.sello-tapa { top: 15mm; display: flex; justify-content: center; color: ${BLANCO} }
.sello-tapa svg { width: 34mm; height: auto; display: block }
.titulo { top: 50%; transform: translateY(-38%); font-family: "Playfair Display", Georgia, serif; font-style: italic; font-weight: 400; font-size: 25pt; line-height: 1.12; color: ${BLANCO}; white-space: nowrap }
.titulo span { display: block }
.marca-tapa { bottom: 15mm; font-family: Archivo, sans-serif; font-weight: 500; font-size: 6.8pt; letter-spacing: 0.32em; padding-left: 0.32em; text-transform: uppercase; color: ${BLANCO} }
.contratapa > * { position: absolute; left: ${SELLO_LIBRE}mm; right: ${CONTRA_DOBLEZ}mm; margin: 0 auto; max-width: 64mm; text-align: center; color: ${BLANCO} }
.frase { top: 22mm; font-family: "Playfair Display", Georgia, serif; font-style: italic; font-weight: 400; font-size: 13pt; line-height: 1.4; text-wrap: balance }
.activar { bottom: 15mm; font-family: Archivo, sans-serif; font-weight: 400; font-size: 8pt; line-height: 1.5; text-wrap: balance }

/* Adentro: papel blanco, todo en negro pleno */
.escribir { display: flex; flex-direction: column; justify-content: center; gap: 22mm; padding: 0 14mm }
.linea { display: flex; align-items: baseline; gap: 3mm; font-family: "Playfair Display", Georgia, serif; font-weight: 400; font-size: 14pt }
.linea span { flex: 1; border-bottom: 0.3mm solid ${NEGRO}; transform: translateY(-1mm) }
.regalo-pag { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 13mm }
.regalo { font-family: "Playfair Display", Georgia, serif; font-style: italic; font-weight: 400; font-size: 16pt; line-height: 1.2 }
.texto { margin-top: 5mm; max-width: 70mm; font-size: 10.5pt; line-height: 1.5; color: ${NEGRO}; text-wrap: balance }
.qr { width: 30mm; height: 30mm; margin-top: 6mm; display: block }
.codigo { margin-top: 2mm; font-family: Archivo, sans-serif; font-weight: 500; font-size: 12pt; letter-spacing: 0.22em; padding-left: 0.22em }

/* Sellos: círculos de 25 mm con el toroide, sin texto. La línea gris es el corte. */
.sellos { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(${SELLOS_COLUMNAS}, ${SELLO}mm); grid-auto-rows: ${SELLO}mm; gap: 6mm 7mm; justify-content: center; align-content: center }
.sticker { width: ${SELLO}mm; height: ${SELLO}mm; border-radius: 50%; border: 0.2mm solid ${NEGRO}59; display: flex; align-items: center; justify-content: center; color: ${NEGRO}; background: #fff }
.sticker svg { width: 16mm; height: auto; display: block }
`;

/**
 * HTML completo para imprimir un lote. Por cada dos cartas, una hoja A4 con las
 * caras de afuera y otra con las de adentro (imprimir a doble faz, dando vuelta
 * por el borde largo, al 100 % y con gráficos de fondo). Al final, una hoja de
 * sellos redondos sin código, que cierran el librito en el borde abierto.
 *
 * Al dar vuelta por el borde largo, la mitad derecha de afuera (la tapa) queda
 * detrás de la mitad izquierda de adentro (Para/De): doblada, es la tapa del librito.
 */
export function armarHojaLote(cartas: { codigo: string; qr: string }[], idioma: IdiomaRegalo): string {
  const t = TEXTOS_CARTA[idioma];
  const [titulo1, titulo2] = partirTitulo(t.titulo);
  const top = (i: number) => `top:${Y_CARTA + i * ALTO_CARTA}mm`;

  // Afuera: contratapa a la izquierda, tapa a la derecha (el lomo junto al doblez).
  const exterior = (n: number) => {
    const sangrado = `<div class="sangrado" style="left:${X_CARTA - SANGRADO}mm;top:${Y_CARTA - SANGRADO}mm;width:${ANCHO_CARTA + 2 * SANGRADO}mm;height:${n * ALTO_CARTA + 2 * SANGRADO}mm"></div>`;
    const carta = (i: number) =>
      `<div class="carta" style="${top(i)}">` +
      `<div class="pagina contratapa"><p class="frase">${esc(t.tapa)}</p><p class="activar">${esc(t.contratapa)}</p></div>` +
      `<div class="pagina tapa"><i class="lomo"></i><i class="bisagra"></i><div class="sello-tapa">${toroideSvg("toroide-tapa", TRAZO_TAPA)}</div>` +
      `<h1 class="titulo"><span>${esc(titulo1)}</span>${titulo2 ? `<span>${esc(titulo2)}</span>` : ""}</h1>` +
      `<p class="marca-tapa">Vitácora Familiar</p></div>` +
      `</div>`;
    return sangrado + Array.from({ length: n }, (_, i) => carta(i)).join("") + marcas(n, true);
  };
  // Adentro: Para/De a la izquierda; qué es, QR y código a la derecha.
  const interior = (c: { codigo: string; qr: string }, i: number) =>
    `<div class="carta" style="${top(i)}">` +
    `<div class="pagina escribir"><p class="linea">${esc(t.para)}<span></span></p><p class="linea">${esc(t.de)}<span></span></p></div>` +
    `<div class="pagina regalo-pag"><p class="regalo">${esc(t.esUnRegalo)}</p><p class="texto">${esc(t.adentro)}</p>` +
    `<img class="qr" src="${esc(c.qr)}" alt="QR"><p class="codigo">${esc(c.codigo)}</p></div>` +
    `</div>`;

  const hojas: string[] = [];
  for (let i = 0; i < cartas.length; i += 2) {
    const par = cartas.slice(i, i + 2);
    hojas.push(`<section class="hoja afuera">${exterior(par.length)}</section>`);
    hojas.push(`<section class="hoja adentro">${par.map(interior).join("")}${marcas(par.length, false)}</section>`);
  }

  const sello = `<div class="sticker">${toroideSvg("toroide", 2.4)}</div>`;
  hojas.push(`<section class="hoja"><div class="sellos">${sello.repeat(SELLOS_COLUMNAS * SELLOS_FILAS)}</div></section>`);

  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<title>Lote de cartas</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Source+Serif+4:opsz,wght@8..60,400&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${hojas.join("\n")}
</body>
</html>
`;
}

