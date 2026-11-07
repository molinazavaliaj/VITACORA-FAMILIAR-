// Las fotos del álbum pasan por Chromium antes de embeberse (02/11): las de celular pesan 3–7 MB cada una y con
// treinta el libro pasaba la cota de LIMITE_BYTES_TOTAL (fotos.ts) y las últimas quedaban afuera. Acá se achican a
// un lado máximo que sigue alcanzando para imprimir una página entera a 300 ppp, y se les saca una firma de cómo se
// ven (dHash de 8×8) para reconocer la misma foto subida dos veces en distinto tamaño.
import { chromium } from 'playwright';

export type FotoProcesada = { bytes: Buffer; mime: string; ancho: number; alto: number; firma: string };
export type ProcesarFotos = (fotos: { bytes: Buffer; mime: string }[]) => Promise<(FotoProcesada | null)[]>;

/** Lado mayor máximo: 2600 px cubren el ancho de una página de 21,6 cm a ~300 ppp. */
export const LADO_MAXIMO_PX = 2600;
/** Por debajo de este peso la foto se deja como está (solo se firma). */
export const ACHICAR_DESDE_BYTES = 1.5 * 1024 * 1024;

/**
 * Lo que corre adentro de Chromium, como texto: si fuera una función de TypeScript, tsx/esbuild le agrega
 * ayudantes (`__name`) que en la página no existen.
 */
const EN_EL_NAVEGADOR = `async ({ b64, mime, achicar, lado }) => {
  const blob = await (await fetch('data:' + mime + ';base64,' + b64)).blob();
  const bmp = await createImageBitmap(blob);
  // La firma: la foto en 16×16 grises, achicada con buen promedio (dibujarla directo toma unos pocos píxeles
  // sueltos y la misma foto en dos tamaños da firmas distintas). Dos hex por píxel.
  const mini = await createImageBitmap(blob, { resizeWidth: 16, resizeHeight: 16, resizeQuality: 'high' });
  const chico = new OffscreenCanvas(16, 16);
  const cx = chico.getContext('2d');
  cx.drawImage(mini, 0, 0);
  const d = cx.getImageData(0, 0, 16, 16).data;
  let firma = '';
  for (let i = 0; i < d.length; i += 4) firma += Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114).toString(16).padStart(2, '0');
  const escala = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  if (!achicar || escala === 1) return { firma, ancho: bmp.width, alto: bmp.height, b64: null };
  const ancho = Math.round(bmp.width * escala), alto = Math.round(bmp.height * escala);
  const lienzo = new OffscreenCanvas(ancho, alto);
  const lx = lienzo.getContext('2d');
  lx.imageSmoothingQuality = 'high';
  lx.drawImage(bmp, 0, 0, ancho, alto);
  const jpg = new Uint8Array(await (await lienzo.convertToBlob({ type: 'image/jpeg', quality: 0.9 })).arrayBuffer());
  let bin = '';
  for (let i = 0; i < jpg.length; i += 0x8000) bin += String.fromCharCode.apply(null, jpg.subarray(i, i + 0x8000));
  return { firma, ancho, alto, b64: btoa(bin) };
}`;

/** Una foto que Chromium no puede abrir vuelve `null` y sigue como vino. Si Chromium no arranca, todas siguen como vinieron. */
export const procesarFotosConChromium: ProcesarFotos = async (fotos) => {
  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.warn(`preparar-fotos: Chromium no arrancó (${(err as Error).message}); las fotos van como vinieron.`);
    return fotos.map(() => null);
  }
  try {
    const page = await browser.newPage();
    const salida: (FotoProcesada | null)[] = [];
    for (const f of fotos) {
      try {
        const args = { b64: f.bytes.toString('base64'), mime: f.mime, achicar: f.bytes.length > ACHICAR_DESDE_BYTES, lado: LADO_MAXIMO_PX };
        const r = (await page.evaluate(`(${EN_EL_NAVEGADOR})(${JSON.stringify(args)})`)) as { firma: string; ancho: number; alto: number; b64: string | null };
        salida.push(r.b64
          ? { bytes: Buffer.from(r.b64, 'base64'), mime: 'image/jpeg', ancho: r.ancho, alto: r.alto, firma: r.firma }
          : { bytes: f.bytes, mime: f.mime, ancho: r.ancho, alto: r.alto, firma: r.firma });
      } catch (err) {
        console.warn(`preparar-fotos: una foto no se pudo procesar (${(err as Error).message}); va como vino.`);
        salida.push(null);
      }
    }
    return salida;
  } finally {
    await browser.close();
  }
};
