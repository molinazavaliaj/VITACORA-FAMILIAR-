// Genera fabrica/src/v3/entrevista/cazador-prompt.json desde
// docs/v3/entrevista/cazador/prompt-v3-1.md (sección "## Prompt"), y
// cazador-prompt-ca.json desde prompt-v3-1-ca.md (la entrevista en catalán;
// Naza, 04/10) y cazador-prompt-es-ES.json desde prompt-v3-1-es-ES.md
// (castellano de España, de tú; Naza, 05/10):
//
//   npx tsx scripts/v3-cazador-json.ts
//
// Correrlo cada vez que cambia un prompt (los tests v3-cazador, v3-catala-cazador y v3-es-ES avisan si quedó viejo).
// El md es la fuente: ahí se lee y se aprueba; el código no lee archivos.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extraerPrompt } from '../src/v3/entrevista/cazador.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const [fuente, salida] of [
  ['docs/v3/entrevista/cazador/prompt-v3-1.md', 'cazador-prompt.json'],
  ['docs/v3/entrevista/cazador/prompt-v3-1-ca.md', 'cazador-prompt-ca.json'],
  ['docs/v3/entrevista/cazador/prompt-v3-1-es-ES.md', 'cazador-prompt-es-ES.json'],
]) {
  const prompt = extraerPrompt(readFileSync(path.join(FABRICA, '..', fuente), 'utf8'));
  writeFileSync(path.join(FABRICA, 'src', 'v3', 'entrevista', salida), JSON.stringify({ fuente, prompt }, null, 2) + '\n', 'utf8');
  console.log(`${salida}: ${prompt.length} caracteres desde ${fuente}`);
}
