// Genera los prompts del cazador de escenas de historia (copia de
// scripts/v3-cazador-json.ts): src/historia/entrevista/cazador-prompt.json,
// cazador-prompt-ca.json y cazador-prompt-es-ES.json, desde la sección
// "## Prompt" de docs/historia/cazador/prompt.md, prompt-ca.md y
// prompt-es-ES.md. Mientras historia no tenga su prompt aprobado, usa el de
// V3 (docs/v3/entrevista/cazador/prompt-v3-1*.md), como dice el plan
// (Task 1.4); cada json anota de qué md salió (`fuente`).
//
//   npx tsx scripts/historia-cazador-json.ts
//
// Correrlo cada vez que cambia un prompt (test/historia-cazador.test.ts avisa si quedó viejo).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extraerPrompt } from '../src/historia/entrevista/cazador-prompt-md.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.join(FABRICA, '..');

for (const [propio, deV3, salida] of [
  ['docs/historia/cazador/prompt.md', 'docs/v3/entrevista/cazador/prompt-v3-1.md', 'cazador-prompt.json'],
  ['docs/historia/cazador/prompt-ca.md', 'docs/v3/entrevista/cazador/prompt-v3-1-ca.md', 'cazador-prompt-ca.json'],
  ['docs/historia/cazador/prompt-es-ES.md', 'docs/v3/entrevista/cazador/prompt-v3-1-es-ES.md', 'cazador-prompt-es-ES.json'],
]) {
  const fuente = existsSync(path.join(RAIZ, propio)) ? propio : deV3;
  const prompt = extraerPrompt(readFileSync(path.join(RAIZ, fuente), 'utf8'));
  writeFileSync(path.join(FABRICA, 'src', 'historia', 'entrevista', salida), JSON.stringify({ fuente, prompt }, null, 2) + '\n', 'utf8');
  console.log(`${salida}: ${prompt.length} caracteres desde ${fuente}${fuente === deV3 ? ' (no hay prompt propio de historia: va el de V3)' : ''}`);
}
