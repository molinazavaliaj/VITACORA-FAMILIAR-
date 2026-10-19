// HTML → PDF con el navegador. Vive aparte para que lo puedan usar los dos
// caminos que imprimen —el paquete que se entrega (`generar-paquete.ts`) y el
// libro que va a la imprenta (`imprenta.ts`)— y para que los tests puedan
// reemplazarlo: levantar un Chromium de verdad por cada caso son minutos.

import { chromium } from 'playwright';

/**
 * Chromium redondea la hoja: 168×240 mm le sale 475,92 × 679,92 pt (167,9 × 239,9 mm) y la imprenta pide
 * la medida exacta (476,22 × 680,31). Se corrige el MediaBox de cada página escribiendo los números con el
 * MISMO largo, así no se corre ningún byte y la tabla xref del PDF sigue valiendo. Si no se puede (otro largo,
 * diferencia de más de 1 pt), se deja como vino: el verificador tolera medio milímetro.
 */
export function medidaExacta(pdf: Buffer, tamano: { anchoMm: number; altoMm: number }): Buffer {
  const objetivo = [tamano.anchoMm, tamano.altoMm].map((mm) => (mm / 25.4) * 72);
  const texto = pdf.toString('latin1');
  const mismoLargo = (original: string, valor: number): string | null => {
    const enteros = String(Math.trunc(valor)).length;
    const decimales = original.length - enteros - 1;
    if (decimales < 1) return null;
    const nuevo = valor.toFixed(decimales);
    return nuevo.length === original.length ? nuevo : null;
  };
  let cambio = false;
  const corregido = texto.replace(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g, (todo, w: string, h: string) => {
    if (Math.abs(Number(w) - objetivo[0]) > 1 || Math.abs(Number(h) - objetivo[1]) > 1) return todo;
    const nw = mismoLargo(w, objetivo[0]);
    const nh = mismoLargo(h, objetivo[1]);
    if (!nw || !nh) return todo;
    cambio = true;
    return todo.replace(`${w} ${h}`, `${nw} ${nh}`);
  });
  return cambio ? Buffer.from(corregido, 'latin1') : pdf;
}

/**
 * A5 es el formato del libro de pantalla; `printBackground` mantiene las franjas y la tapa. Con `tamano`
 * (el libro para la imprenta, en mm) la hoja es esa y manda el @page de la plantilla.
 */
export async function htmlAPdf(html: string, tamano?: { anchoMm: number; altoMm: number }): Promise<Buffer> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // Con las fotos embebidas el HTML puede pesar decenas de MB (cota en
    // fotos.ts): cargarlo y paginarlo lleva más que los 30 s por defecto.
    await page.setContent(html, { timeout: 120_000 });
    // La plantilla pagina el texto con un script embebido (reparte los bloques
    // en lienzos A5 y numera folios); imprimir antes de esa marca sacaría el
    // PDF a medio armar.
    await page.waitForFunction('window.__libroPaginado === true', { timeout: 120_000 });
    if (tamano) {
      await page.evaluate(() => document.fonts.ready);
      const pdf = await page.pdf({ width: `${tamano.anchoMm}mm`, height: `${tamano.altoMm}mm`, printBackground: true, preferCSSPageSize: true });
      return medidaExacta(pdf, tamano);
    }
    return await page.pdf({ format: 'A5', printBackground: true });
  } finally {
    await browser.close();
  }
}
