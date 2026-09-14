/**
 * Prueba del efecto del CONTEXTO en la transcripción, por el código REAL.
 *
 * Uso:  npx tsx scripts/prueba-contexto.ts "<ruta del audio>"
 *
 * Transcribe el mismo audio dos veces —sin contexto y con el contexto que arma
 * `promptDeTranscripcion` (vocabulario rioplatense + los datos del narrador)— y
 * muestra la diferencia. No toca la base. Sirve para medir con cualquier audio.
 *
 * Evidencia que lo motivó: un narrador porteño diciendo "mi viejo llegando de
 * laburar a las 8 de la noche" se transcribía como "llegando de la URA".
 */
import { readFileSync } from 'node:fs';

const ruta = process.argv[2];
if (!ruta) throw new Error('Falta la ruta del audio: npx tsx scripts/prueba-contexto.ts "<audio.ogg>"');

for (const linea of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
for (const v of ['WA_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_VERIFY_TOKEN']) {
  if (!process.env[v]) process.env[v] = 'prueba'; // el .env las trae vacías
}

const { transcribir } = await import('../src/ia/transcribir.js');
const { promptDeTranscripcion } = await import('../src/manual/puro.js');

const audio = readFileSync(ruta);
// El contexto que arma sola la puerta manual con la fila real de Joaquín.
const contexto = promptDeTranscripcion({}, 'Joaquin');
console.log('CONTEXTO ENVIADO:', contexto, '\n');

for (const [titulo, prompt] of [['SIN contexto', undefined], ['CON contexto', contexto]]) {
  const { texto, duracionSegundos } = await transcribir(audio, prompt);
  const i = texto.indexOf('labur') >= 0 ? texto.indexOf('labur') : texto.indexOf('URA');
  console.log(`=== ${titulo} (${duracionSegundos}s) ===`);
  console.log('frase:', i >= 0 ? texto.slice(Math.max(0, i - 100), i + 40).replace(/\n/g, ' ') : '(no aparece)');
  console.log();
}
