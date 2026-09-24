/**
 * Ajuste C (24/09): la comparación a ciegas, ¿Sonnet escribe las preguntas tan bien como Opus?
 * Todo lo que decide está en `src/manual/comparar-modelos.ts` (con tests); acá solo se carga el
 * entorno y se conectan la base (SOLO LECTURA: nada se escribe, ni `consumo_ia`) y el cliente.
 *
 * Uso (desde entrevistador/):
 *   npm run comparar-modelos -- armar [--momentos 10] [--narrador <id>]   gratis
 *   npm run comparar-modelos -- correr                                    dice el costo, no llama
 *   npm run comparar-modelos -- correr --si [--semilla N]                 PAGO (~USD 1)
 *   npm run comparar-modelos -- revelar                                   gratis
 *
 * La salida queda en `entrevistador/comparacion-modelos/` (ignorada por git: lleva transcripciones
 * de una persona real).
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { main, leerPiloto, fichaDelPiloto } from '../src/manual/comparar-modelos.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
try {
  for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  // Sin .env propio se usan las variables que ya estén en el entorno.
}

const falta = (v: string) => { throw new Error(`Falta ${v} en entrevistador/.env.`); };

const codigo = await main(process.argv.slice(2), {
  carpeta: resolve(AQUI, '..', 'comparacion-modelos'),
  log: (t = '') => console.log(t),
  leerBase: (id) => leerPiloto(createClient(process.env.SUPABASE_URL ?? falta('SUPABASE_URL'), process.env.SUPABASE_SERVICE_ROLE_KEY ?? falta('SUPABASE_SERVICE_ROLE_KEY')), id),
  ficha: () => fichaDelPiloto(resolve(AQUI, '..', 'test', 'fixtures', 'perfil-naza-piloto.json')),
  crearCliente: () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? falta('ANTHROPIC_API_KEY') }),
});
process.exit(codigo);
