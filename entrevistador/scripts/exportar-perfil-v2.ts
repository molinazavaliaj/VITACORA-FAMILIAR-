/**
 * Exporta la ficha (contexto.v2.perfil) de un narrador v2 a un JSON, para usarla de fixture.
 * Uso (desde entrevistador/, con .env): npx tsx scripts/exportar-perfil-v2.ts <narrador_id> <salida.json>
 * No llama al modelo. No imprime nada de .env.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const [id, salida] = process.argv.slice(2);
if (!id || !salida) throw new Error('Uso: exportar-perfil-v2.ts <narrador_id> <salida.json>');
const url = process.env.SUPABASE_URL!, key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const r = await fetch(`${url}/rest/v1/narradores?id=eq.${id}&select=contexto`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
if (!r.ok) throw new Error(`Supabase respondió ${r.status} ${r.statusText}`);
const filas = (await r.json()) as { contexto?: { v2?: { perfil?: unknown } } }[];
if (!Array.isArray(filas)) throw new Error('La respuesta de Supabase no es un array de filas');
const perfil = filas[0]?.contexto?.v2?.perfil;
if (!perfil) throw new Error(`El narrador ${id} no tiene contexto.v2.perfil`);
writeFileSync(resolve(salida), JSON.stringify(perfil, null, 2));
console.log(`Ficha exportada a ${salida} (${JSON.stringify(perfil).length} caracteres).`);
