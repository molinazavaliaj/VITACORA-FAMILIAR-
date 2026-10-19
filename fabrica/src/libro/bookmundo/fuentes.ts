// Las fuentes del libro impreso, incrustadas como TrueType estáticas.
//
// El libro de pantalla carga las fuentes de Google, que son VARIABLES: Chromium, al imprimir una fuente
// variable, la mete en el PDF como Type 3 (cada letra un dibujo), y una imprenta no la trata como fuente.
// Estas son las mismas familias instanciadas a cada peso con fontTools desde google/fonts (licencia OFL,
// ver fuentes-imprenta/LEEME.md). Viajan con la fábrica: en Railway no hay red para bajarlas.
import { readFileSync } from 'node:fs';

/** [familia, estilo, peso, archivo]: los pesos que usa la plantilla (y la cubierta). */
export const FUENTES_IMPRENTA: [string, 'normal' | 'italic', number, string][] = [
  ['Playfair Display', 'normal', 400, 'PlayfairDisplay-normal-400.ttf'],
  ['Playfair Display', 'normal', 700, 'PlayfairDisplay-normal-700.ttf'],
  ['Playfair Display', 'normal', 900, 'PlayfairDisplay-normal-900.ttf'],
  ['Playfair Display', 'italic', 400, 'PlayfairDisplay-italic-400.ttf'],
  ['Playfair Display', 'italic', 500, 'PlayfairDisplay-italic-500.ttf'],
  ['Playfair Display', 'italic', 900, 'PlayfairDisplay-italic-900.ttf'],
  ['Source Serif 4', 'normal', 400, 'SourceSerif4-normal-400.ttf'],
  ['Source Serif 4', 'normal', 600, 'SourceSerif4-normal-600.ttf'],
  ['Source Serif 4', 'italic', 400, 'SourceSerif4-italic-400.ttf'],
  ['Archivo', 'normal', 400, 'Archivo-normal-400.ttf'],
  ['Archivo', 'normal', 500, 'Archivo-normal-500.ttf'],
  ['Archivo', 'normal', 600, 'Archivo-normal-600.ttf'],
  ['Archivo', 'normal', 700, 'Archivo-normal-700.ttf'],
];

/** La carpeta `fabrica/fuentes-imprenta/` (desde src/libro/bookmundo y desde dist/libro/bookmundo es la misma). */
const CARPETA = new URL('../../../fuentes-imprenta/', import.meta.url);

let cache: string | null = null;

/** Los @font-face con las TTF en data URI. Se arma una vez: son ~2,4 MB y no cambian. */
export function fuentesImprentaCss(): string {
  if (cache) return cache;
  cache = FUENTES_IMPRENTA.map(([familia, estilo, peso, archivo]) => {
    const b64 = readFileSync(new URL(archivo, CARPETA)).toString('base64');
    return `@font-face { font-family: '${familia}'; font-style: ${estilo}; font-weight: ${peso}; src: url(data:font/ttf;base64,${b64}) format('truetype'); }`;
  }).join('\n');
  return cache;
}
