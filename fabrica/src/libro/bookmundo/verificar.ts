// La verificación del libro para Bookmundo, antes de que una persona lo suba.
//
// Bookmundo no revisa nada: «enviaremos los archivos a la imprenta de forma totalmente automática» y no se
// puede cancelar un pedido (especificaciones §7). Lo que sale mal, sale impreso. Así que acá se mira el PDF
// ya hecho —no el HTML— como lo mira una imprenta: tamaño de cada página, fuentes incrustadas y que no sean
// Type 3, márgenes medidos por TINTA (la caja de una letra grande miente: el «01» del capítulo tiene la caja
// a 1,6 mm del borde y la tinta a 12), resolución de cada foto como queda impresa, y qué páginas llevan color.
//
// El PDF se lee con pdf.js dentro del mismo Chromium que la fábrica ya usa para imprimir: anda igual en
// Railway, sin Python ni librerías nativas.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import {
  FORMATO_TAPA_DURA, MARGENES_MINIMOS, MAXIMO_BYTES_INTERIOR, PAGINAS_MINIMAS_TAPA_DURA, PPP_CUBIERTA,
  PPP_FOTO_MINIMO, PPP_FOTO_RECOMENDADO, medidasCubierta, type Papel,
} from './formato.js';
import { pppDePng, type ResultadoCubierta } from './cubierta.js';

const MM_POR_PT = 25.4 / 72;
/** Resolución a la que se dibuja cada página para medir la tinta (0,5 mm por píxel). */
const PPP_MEDICION = 50;

/** Lo que pdf.js ve en cada página. */
export type PaginaMedida = {
  numero: number;
  anchoMm: number;
  altoMm: number;
  /** Distancia de la tinta oscura y de cualquier tinta a cada borde, en mm (null: página sin tinta). */
  tinta: Bordes | null;
  tintaClara: Bordes | null;
  /** Lo más cerca del lomo que llega un texto, en mm (null: sin texto). */
  textoAlLomo: number | null;
  /** Píxeles de color (no gris) a 50 ppp, y la parte de la página que ocupan. */
  pixelesColor: number;
  fraccionColor: number;
  fuentes: { nombre: string; tipo: string; incrustada: boolean; type3: boolean }[];
  /** Cada imagen con su resolución como queda impresa. */
  imagenes: { ppp: number; anchoMm: number; altoMm: number }[];
  anotaciones: number;
};

/** Distancias a los bordes, ya contadas del lado del lomo y del lado del corte exterior. */
export type Bordes = { lomo: number; fuera: number; arriba: number; abajo: number };

export type Informe = {
  ok: boolean;
  errores: string[];
  avisos: string[];
  /** El informe para leer (el mismo texto que se sube como informe.txt). */
  texto: string;
};

export type InformeInterior = Informe & { paginas: number; paginasColor: number[]; paginasMedidas: PaginaMedida[] };

/** El script que corre en el navegador: abre el PDF con pdf.js y mide cada página. */
const SCRIPT_MEDIR = `(async () => {
  const pdfjs = await import('/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const datos = new Uint8Array(await (await fetch('/libro.pdf')).arrayBuffer());
  const doc = await pdfjs.getDocument({ data: datos, fontExtraProperties: true, isEvalSupported: false }).promise;
  const OPS = pdfjs.OPS;
  const MMPT = 25.4 / 72, PPP = ${PPP_MEDICION};
  const mult = (m, n) => [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
  const paginas = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const [vx0, vy0, vx1, vy1] = page.view;
    const anchoPt = vx1 - vx0, altoPt = vy1 - vy0;
    const lomoIzq = n % 2 === 1;

    // Tinta: la página dibujada a 50 ppp, píxel por píxel.
    const vp = page.getViewport({ scale: PPP / 72 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
    const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const W = canvas.width, H = canvas.height;
    const caja = () => ({ x0: W, y0: H, x1: -1, y1: -1 });
    const oscura = caja(), clara = caja();
    let color = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4, r = px[o], g = px[o + 1], b = px[o + 2];
      const min = Math.min(r, g, b), max = Math.max(r, g, b);
      if (max - min > 15) color++;
      for (const [c, umbral] of [[oscura, 200], [clara, 245]]) {
        if (min < umbral) { if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y; }
      }
    }
    const mm = 25.4 / PPP;
    const bordes = (c) => {
      if (c.x1 < 0) return null;
      const izq = c.x0 * mm, der = (W - 1 - c.x1) * mm;
      return { lomo: lomoIzq ? izq : der, fuera: lomoIzq ? der : izq, arriba: c.y0 * mm, abajo: (H - 1 - c.y1) * mm };
    };

    // Texto: lo más cerca del lomo (en puntos PDF, origen abajo a la izquierda).
    const texto = await page.getTextContent();
    let textoAlLomo = null;
    for (const it of texto.items) {
      if (!it.str || !it.str.trim()) continue;
      const [a, b, , , e] = it.transform;
      const rotado = Math.abs(b) > Math.abs(a);
      const x0 = rotado ? e - (it.height || 0) : e;
      const x1 = rotado ? e + (it.height || 0) : e + (it.width || 0);
      const d = (lomoIzq ? (x0 - vx0) : (vx1 - x1)) * MMPT;
      if (textoAlLomo === null || d < textoAlLomo) textoAlLomo = d;
    }

    // Fuentes e imágenes, recorriendo los operadores con su matriz.
    const ops = await page.getOperatorList();
    const fuentes = new Map();
    const imagenes = [];
    let ctm = [1, 0, 0, 1, 0, 0];
    const pila = [];
    for (let i = 0; i < ops.fnArray.length; i++) {
      const f = ops.fnArray[i], args = ops.argsArray[i];
      if (f === OPS.save) pila.push(ctm);
      else if (f === OPS.restore) ctm = pila.pop() || [1, 0, 0, 1, 0, 0];
      else if (f === OPS.transform) ctm = mult(ctm, args);
      else if (f === OPS.paintFormXObjectBegin) { pila.push(ctm); if (Array.isArray(args[0]) || (args[0] && args[0].length === 6)) ctm = mult(ctm, Array.from(args[0])); }
      else if (f === OPS.paintFormXObjectEnd) ctm = pila.pop() || [1, 0, 0, 1, 0, 0];
      else if (f === OPS.setFont) fuentes.set(args[0], true);
      else if (f === OPS.paintImageXObject || f === OPS.paintInlineImageXObject) {
        let w = args[1], h = args[2];
        if (f === OPS.paintInlineImageXObject) { w = args[0].width; h = args[0].height; }
        const anchoPtImg = Math.hypot(ctm[0], ctm[1]), altoPtImg = Math.hypot(ctm[2], ctm[3]);
        if (anchoPtImg * MMPT < 3 || altoPtImg * MMPT < 3) continue;
        const ppp = Math.min(w / (anchoPtImg / 72), h / (altoPtImg / 72));
        imagenes.push({ ppp: Math.round(ppp), anchoMm: Math.round(anchoPtImg * MMPT), altoMm: Math.round(altoPtImg * MMPT) });
      }
    }
    const listaFuentes = [];
    for (const id of fuentes.keys()) {
      let fo = null;
      try { fo = page.commonObjs.has(id) ? page.commonObjs.get(id) : null; } catch (e) { fo = null; }
      if (!fo) { listaFuentes.push({ nombre: id, tipo: '?', incrustada: false, type3: false }); continue; }
      listaFuentes.push({ nombre: fo.name || id, tipo: fo.type || fo.subtype || '?', incrustada: !fo.missingFile, type3: !!fo.isType3Font });
    }
    const anotaciones = (await page.getAnnotations()).length;
    paginas.push({
      numero: n, anchoMm: anchoPt * MMPT, altoMm: altoPt * MMPT,
      tinta: bordes(oscura), tintaClara: bordes(clara), textoAlLomo,
      pixelesColor: color, fraccionColor: color / (W * H),
      fuentes: listaFuentes, imagenes, anotaciones,
    });
    page.cleanup();
  }
  return paginas;
})()`;

/** Abre el PDF con pdf.js en Chromium y devuelve lo medido en cada página. */
export async function medirPdf(pdf: Buffer): Promise<PaginaMedida[]> {
  const requerir = createRequire(import.meta.url);
  const archivos: Record<string, { cuerpo: Buffer; tipo: string }> = {
    '/pdf.min.mjs': { cuerpo: readFileSync(requerir.resolve('pdfjs-dist/build/pdf.min.mjs')), tipo: 'text/javascript' },
    '/pdf.worker.min.mjs': { cuerpo: readFileSync(requerir.resolve('pdfjs-dist/build/pdf.worker.min.mjs')), tipo: 'text/javascript' },
    '/libro.pdf': { cuerpo: pdf, tipo: 'application/pdf' },
    '/': { cuerpo: Buffer.from('<!doctype html><html><body></body></html>'), tipo: 'text/html' },
  };
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // Un origen inventado: el navegador carga pdf.js y el PDF desde acá, sin red.
    await page.route('http://verificador.vitacora/**', (route) => {
      const ruta = new URL(route.request().url()).pathname;
      const a = archivos[ruta];
      return a ? route.fulfill({ status: 200, contentType: a.tipo, body: a.cuerpo }) : route.fulfill({ status: 404, body: '' });
    });
    await page.goto('http://verificador.vitacora/');
    return (await page.evaluate(SCRIPT_MEDIR)) as PaginaMedida[];
  } finally {
    await browser.close();
  }
}

const unMm = (x: number) => x.toFixed(1).replace('.', ',');
const lista = (ns: number[]) => (ns.length > 12 ? `${ns.slice(0, 12).join(', ')}… (${ns.length})` : ns.join(', '));

/** Lo que tiene que cumplir el interior. Pura: recibe lo medido, para poder probarla sin navegador. */
export function evaluarInterior(
  medidas: PaginaMedida[],
  o: { bytes: number; papel?: Papel; formato?: { anchoMm: number; altoMm: number } },
): InformeInterior {
  const papel = o.papel ?? 'crema';
  const formato = o.formato ?? FORMATO_TAPA_DURA;
  const minimo = PAGINAS_MINIMAS_TAPA_DURA[papel];
  const errores: string[] = [];
  const avisos: string[] = [];
  const bien: string[] = [];
  const n = medidas.length;

  if (n < minimo) errores.push(`Tiene ${n} páginas y el mínimo de tapa dura en papel ${papel} es ${minimo}.`);
  else bien.push(`Páginas: ${n} (mínimo ${minimo}).`);
  if (n % 2 !== 0) errores.push(`Tiene ${n} páginas: tiene que ser un número par.`);

  const malTamano = medidas.filter((p) => Math.abs(p.anchoMm - formato.anchoMm) > 0.5 || Math.abs(p.altoMm - formato.altoMm) > 0.5);
  if (malTamano.length) errores.push(`Páginas que no miden ${formato.anchoMm}×${formato.altoMm} mm: ${lista(malTamano.map((p) => p.numero))} (la ${malTamano[0].numero} mide ${unMm(malTamano[0].anchoMm)}×${unMm(malTamano[0].altoMm)}).`);
  else bien.push(`Tamaño: ${formato.anchoMm}×${formato.altoMm} mm en todas las páginas.`);

  if (o.bytes > MAXIMO_BYTES_INTERIOR) errores.push(`El archivo pesa ${Math.round(o.bytes / 1048576)} MB (máximo 500).`);
  else bien.push(`Peso: ${(o.bytes / 1048576).toFixed(1)} MB.`);

  const fuentes = new Map<string, { tipo: string; incrustada: boolean; type3: boolean; paginas: number[] }>();
  for (const p of medidas) for (const f of p.fuentes) {
    const x = fuentes.get(f.nombre) ?? { ...f, paginas: [] };
    x.paginas.push(p.numero);
    fuentes.set(f.nombre, x);
  }
  const type3 = [...fuentes].filter(([, f]) => f.type3);
  const sinIncrustar = [...fuentes].filter(([, f]) => !f.incrustada && !f.type3);
  if (type3.length) errores.push(`Fuentes Type 3 (la imprenta no las trata como letra): ${type3.map(([k, f]) => `${k} (págs. ${lista(f.paginas)})`).join('; ')}.`);
  if (sinIncrustar.length) errores.push(`Fuentes sin incrustar: ${sinIncrustar.map(([k]) => k).join(', ')}.`);
  if (!type3.length && !sinIncrustar.length) bien.push(`Fuentes: ${fuentes.size}, todas incrustadas y ninguna Type 3.`);

  const M = MARGENES_MINIMOS;
  const chequeo = (nombre: string, malas: { n: number; d: number }[], min: number) => {
    if (!malas.length) return;
    const peor = malas.reduce((a, b) => (b.d < a.d ? b : a));
    errores.push(`${nombre} a menos de ${min} mm en págs. ${lista(malas.map((x) => x.n))} (la peor, pág. ${peor.n}: ${unMm(peor.d)} mm).`);
  };
  const tinta = medidas.filter((p) => p.tinta);
  chequeo('Texto del lado del lomo', medidas.filter((p) => p.textoAlLomo !== null && p.textoAlLomo < M.textoLomo).map((p) => ({ n: p.numero, d: p.textoAlLomo! })), M.textoLomo);
  chequeo('Tinta del lado del lomo', tinta.filter((p) => p.tinta!.lomo < M.tintaLomo).map((p) => ({ n: p.numero, d: p.tinta!.lomo })), M.tintaLomo);
  chequeo('Adornos del lado del lomo', medidas.filter((p) => p.tintaClara && p.tintaClara.lomo < M.adornoLomo).map((p) => ({ n: p.numero, d: p.tintaClara!.lomo })), M.adornoLomo);
  for (const [lado, nombre] of [['fuera', 'del corte exterior'], ['arriba', 'del corte de arriba'], ['abajo', 'del corte de abajo']] as const) {
    chequeo(`Tinta ${nombre}`, tinta.filter((p) => p.tinta![lado] < M.tintaCorte).map((p) => ({ n: p.numero, d: p.tinta![lado] })), M.tintaCorte);
  }
  if (!errores.some((e) => e.includes(' a menos de '))) {
    const minDe = (f: (p: PaginaMedida) => number | null) => Math.min(...medidas.map(f).filter((x): x is number => x !== null));
    bien.push(`Márgenes medidos por tinta: texto a ${unMm(minDe((p) => p.textoAlLomo))} mm del lomo; tinta a ${unMm(minDe((p) => p.tinta?.lomo ?? null))} del lomo y a ${unMm(Math.min(minDe((p) => p.tinta?.fuera ?? null), minDe((p) => p.tinta?.arriba ?? null), minDe((p) => p.tinta?.abajo ?? null)))} del corte.`);
  }

  const imagenes = medidas.flatMap((p) => p.imagenes.map((i) => ({ ...i, n: p.numero })));
  if (imagenes.length) {
    const peor = imagenes.reduce((a, b) => (b.ppp < a.ppp ? b : a));
    const bajas = imagenes.filter((i) => i.ppp < PPP_FOTO_MINIMO);
    const justas = imagenes.filter((i) => i.ppp >= PPP_FOTO_MINIMO && i.ppp < PPP_FOTO_RECOMENDADO);
    if (bajas.length) errores.push(`Fotos con menos de ${PPP_FOTO_MINIMO} ppp impresas: págs. ${lista([...new Set(bajas.map((i) => i.n))])} (la peor: ${peor.ppp} ppp en la pág. ${peor.n}). Saldrían borrosas: hace falta una foto más grande o imprimirla más chica.`);
    else if (justas.length) avisos.push(`Fotos entre ${PPP_FOTO_MINIMO} y ${PPP_FOTO_RECOMENDADO} ppp: págs. ${lista([...new Set(justas.map((i) => i.n))])} (la peor: ${peor.ppp} ppp en la pág. ${peor.n}). Se imprimen, pero Bookmundo recomienda ${PPP_FOTO_RECOMENDADO}.`);
    else bien.push(`Fotos: ${imagenes.length}, la de menor resolución a ${peor.ppp} ppp.`);
  } else bien.push('Sin fotos en el interior.');

  const anot = medidas.filter((p) => p.anotaciones > 0);
  if (anot.length) avisos.push(`Páginas con enlaces o anotaciones (en papel no hacen nada): ${lista(anot.map((p) => p.numero))}.`);

  const paginasColor = medidas.filter((p) => p.pixelesColor > 3).map((p) => p.numero);
  const conFoto = medidas.filter((p) => p.fraccionColor > 0.02).map((p) => p.numero);
  // Bookmundo no deja elegir páginas: se elige «color» o «blanco y negro» para todo el interior, y con color
  // cuenta solo las páginas que tienen algo de color y cobra esas (≈ €0,02 cada una).
  if (paginasColor.length === 0) bien.push('Páginas en color: ninguna. En Bookmundo elegir BLANCO Y NEGRO.');
  else {
    bien.push(`Páginas en color: ${paginasColor.length} de ${n} (págs. ${lista(paginasColor)}). En Bookmundo elegir COLOR: cuentan solas esas páginas y cobran ≈ €0,02 cada una. Con blanco y negro, las fotos salen en grises.`);
    const sinFoto = paginasColor.filter((p) => !conFoto.includes(p));
    if (sinFoto.length) avisos.push(`Páginas con color que no son fotos: ${lista(sinFoto)}. Algo del diseño quedó en color: Bookmundo las cobra igual.`);
  }

  const ok = errores.length === 0;
  const texto = [
    `VERIFICACIÓN BOOKMUNDO — TAPA DURA — interior ${formato.anchoMm}×${formato.altoMm} mm, papel ${papel}`,
    '',
    ...errores.map((e) => `✗ ${e}`),
    ...avisos.map((a) => `! ${a}`),
    ...bien.map((b) => `✓ ${b}`),
    '',
    ok ? 'RESULTADO: listo para subir.' : 'RESULTADO: HAY ERRORES — no subir todavía.',
  ].join('\n');
  return { ok, errores, avisos, texto, paginas: n, paginasColor, paginasMedidas: medidas };
}

export async function verificarInterior(pdf: Buffer, o: { papel?: Papel; formato?: { anchoMm: number; altoMm: number } } = {}): Promise<InformeInterior> {
  return evaluarInterior(await medirPdf(pdf), { ...o, bytes: pdf.length });
}

/** La cubierta: medida exacta a 300 ppp, el QR que lleva a su voz y la resolución de la foto de tapa. */
export function verificarCubierta(c: Pick<ResultadoCubierta, 'png' | 'anchoPx' | 'altoPx' | 'qrLeido' | 'pppFoto' | 'medidas'>, o: { urlQr: string; paginas: number }): Informe {
  const errores: string[] = [];
  const avisos: string[] = [];
  const bien: string[] = [];
  const m = medidasCubierta(o.paginas);
  if (Math.abs(c.medidas.lomoMm - m.lomoMm) > 0.05) errores.push(`El lomo de la cubierta (${unMm(c.medidas.lomoMm)} mm) no es el de ${o.paginas} páginas (${unMm(m.lomoMm)} mm).`);
  const esperadoAncho = Math.round((m.anchoTotalMm / 25.4) * PPP_CUBIERTA);
  const esperadoAlto = Math.round((m.altoTotalMm / 25.4) * PPP_CUBIERTA);
  if (Math.abs(c.anchoPx - esperadoAncho) > 2 || Math.abs(c.altoPx - esperadoAlto) > 2) {
    errores.push(`La imagen mide ${c.anchoPx}×${c.altoPx} px y para ${unMm(m.anchoTotalMm)}×${unMm(m.altoTotalMm)} mm a ${PPP_CUBIERTA} ppp tendría que medir ${esperadoAncho}×${esperadoAlto}.`);
  } else bien.push(`Medida: ${unMm(m.anchoTotalMm)} × ${unMm(m.altoTotalMm)} mm (${c.anchoPx}×${c.altoPx} px), lomo ${unMm(m.lomoMm)} mm.`);
  const ppp = pppDePng(c.png);
  if (ppp !== PPP_CUBIERTA) errores.push(`El PNG dice ${ppp ?? 'sin'} ppp (tiene que decir ${PPP_CUBIERTA}).`);
  else bien.push(`Resolución: ${PPP_CUBIERTA} ppp.`);
  if (c.qrLeido === null) errores.push('El QR de la contratapa no se pudo leer en la imagen.');
  else if (c.qrLeido !== o.urlQr) errores.push(`El QR lleva a otro lado: leído «${c.qrLeido}», esperado «${o.urlQr}».`);
  else bien.push('QR: se lee y lleva a su voz.');
  if (c.pppFoto === null) avisos.push('La tapa va sin foto.');
  else if (c.pppFoto < PPP_FOTO_MINIMO) errores.push(`La foto de tapa queda a ${c.pppFoto} ppp impresa (mínimo ${PPP_FOTO_MINIMO}): saldría borrosa. Hace falta una foto más grande; la cara nunca se rehace con IA.`);
  else if (c.pppFoto < PPP_FOTO_RECOMENDADO) avisos.push(`La foto de tapa queda a ${c.pppFoto} ppp impresa (Bookmundo pide ${PPP_FOTO_RECOMENDADO} para la cubierta).`);
  else bien.push(`Foto de tapa: ${c.pppFoto} ppp impresa.`);
  const ok = errores.length === 0;
  const texto = [
    `VERIFICACIÓN BOOKMUNDO — CUBIERTA (plantilla FullEmpty), ${o.paginas} páginas`,
    '',
    ...errores.map((e) => `✗ ${e}`),
    ...avisos.map((a) => `! ${a}`),
    ...bien.map((b) => `✓ ${b}`),
    '',
    'Al subir: comparar con la medida de la vista previa de Bookmundo (con 88 págs, 401,6 × 280). Si no coincide, no subir.',
    ok ? 'RESULTADO: lista para subir.' : 'RESULTADO: HAY ERRORES — no subir todavía.',
  ].join('\n');
  return { ok, errores, avisos, texto };
}
