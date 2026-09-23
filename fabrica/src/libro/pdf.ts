// HTML → PDF con el navegador. Vive aparte para que lo puedan usar los dos
// caminos que imprimen —el paquete que se entrega (`generar-paquete.ts`) y el
// libro que va a la imprenta (`imprenta.ts`)— y para que los tests puedan
// reemplazarlo: levantar un Chromium de verdad por cada caso son minutos.

import { chromium } from 'playwright';

/** A5 es el formato del libro impreso; `printBackground` mantiene las franjas y la tapa. */
export async function htmlAPdf(html: string): Promise<Buffer> {
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
    return await page.pdf({ format: 'A5', printBackground: true });
  } finally {
    await browser.close();
  }
}
