import { describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { qrDataUri } from '../src/libro/qr.js';

// Un link como los que van impresos: la URL de una frase de «Su voz» (token
// firmado + ancla). Es el caso largo, y el largo es el que decide el tamaño de
// los módulos en el papel.
const URL_FRASE =
  'https://www.vitacorafamiliar.com/voz/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYXJyYWRvcklkIjoiMzY5MWJhZjQtZWU3OC00YzZiLTkyMzgtNGNiZWQxODcyYmU3IiwidGlwbyI6InZveiJ9.k4Vv0R2mS1oQ8pJ7nL3xY6wA9cB5dE1fG2hI3jK4lM5#f-c03-01';

function pixeles(dataUri: string) {
  return PNG.sync.read(Buffer.from(dataUri.split(',')[1], 'base64'));
}

/** true si el píxel es (casi) blanco. */
function esBlanco(png: PNG, x: number, y: number): boolean {
  const i = (png.width * y + x) << 2;
  return png.data[i] > 200 && png.data[i + 1] > 200 && png.data[i + 2] > 200;
}

describe('qrDataUri', () => {
  it('devuelve un PNG en data URI: sin red, el HTML del libro se basta solo', async () => {
    const uri = await qrDataUri(URL_FRASE);
    expect(uri.startsWith('data:image/png;base64,')).toBe(true);
    expect(uri.length).toBeGreaterThan(500);
  });

  it('adentro del código está la URL exacta: se lee con un lector de verdad', async () => {
    const png = pixeles(await qrDataUri(URL_FRASE));
    const leido = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(leido?.data).toBe(URL_FRASE);
  });

  it('deja la quiet zone blanca alrededor: sin ese aire el celular no engancha', async () => {
    const png = pixeles(await qrDataUri(URL_FRASE));
    const primeraFila = Array.from({ length: png.width }, (_, x) => esBlanco(png, x, 0));
    const primeraColumna = Array.from({ length: png.height }, (_, y) => esBlanco(png, 0, y));
    expect(primeraFila.every(Boolean)).toBe(true);
    expect(primeraColumna.every(Boolean)).toBe(true);
    // Y adentro hay código: si la imagen fuera toda blanca, lo de arriba no probaría nada.
    const medio = png.height >> 1;
    const oscuros = Array.from({ length: png.width }, (_, x) => esBlanco(png, x, medio)).filter((b) => !b);
    expect(oscuros.length).toBeGreaterThan(0);
  });

  it('el PNG sale grande: el PDF lo imprime nítido', async () => {
    const png = pixeles(await qrDataUri(URL_FRASE));
    // Se imprime a 96px (132 el de la contratapa): el doble o más de origen.
    expect(png.width).toBeGreaterThanOrEqual(400);
    expect(png.height).toBe(png.width);
  });

  it('dos links distintos dan dos códigos distintos (el de cada frase es el suyo)', async () => {
    const uno = await qrDataUri(URL_FRASE);
    const otro = await qrDataUri(`${URL_FRASE.slice(0, -1)}2`);
    expect(otro).not.toBe(uno);
  });
});
