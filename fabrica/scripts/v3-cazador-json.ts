// Genera fabrica/src/v3/entrevista/cazador-prompt.json desde
// docs/v3/entrevista/cazador/prompt-v3-1.md (sección "## Prompt"):
//
//   npx tsx scripts/v3-cazador-json.ts
//
// Correrlo cada vez que cambia el prompt (el test v3-cazador avisa si quedó viejo).
// El md es la fuente: ahí se lee y se aprueba; el código no lee archivos.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extraerPrompt } from '../src/v3/entrevista/cazador.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FUENTE = 'docs/v3/entrevista/cazador/prompt-v3-1.md';
const SALIDA = path.join(FABRICA, 'src', 'v3', 'entrevista', 'cazador-prompt.json');

const prompt = extraerPrompt(readFileSync(path.join(FABRICA, '..', FUENTE), 'utf8'));
writeFileSync(SALIDA, JSON.stringify({ fuente: FUENTE, prompt }, null, 2) + '\n', 'utf8');
console.log(`cazador-prompt.json: ${prompt.length} caracteres desde ${FUENTE}`);
