/**
 * ¿El material de este libro es de esta persona? (biógrafo v2, 23/09)
 *
 * Se corre ANTES de escribir o cerrar un libro. No toca la base: lee las respuestas de
 * todos los narradores y dice qué audios hay que escuchar. Con `--bajar` los descarga a
 * una carpeta para escucharlos (no imprime links firmados: llevan un token).
 *
 * Uso:  npx tsx scripts/auditar-material.ts <como le dicen>          (ej. Joaquin)
 *       npx tsx scripts/auditar-material.ts --todos
 *       npx tsx scripts/auditar-material.ts Joaquin --bajar ../audios-a-escuchar
 *
 * Sale con código 1 si hay algo grave, para poder usarlo de freno.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { auditarMaterial, type Aviso, type FilaMaterial } from '../src/db/auditar-material.js';
import { slug } from '../src/manual/puro.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
}
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const args = process.argv.slice(2);
const iBajar = args.indexOf('--bajar');
const carpeta = iBajar >= 0 ? args[iBajar + 1] : null;
const pedido = args.find((a, i) => !a.startsWith('--') && (iBajar < 0 || i !== iBajar + 1));
const todos = args.includes('--todos');
const USO = 'Uso: npx tsx scripts/auditar-material.ts <como le dicen> | --todos  [--bajar <carpeta>]';
if ((!todos && !pedido) || (iBajar >= 0 && (!carpeta || carpeta.startsWith('--')))) {
  console.error(USO);
  process.exit(2);
}

const { data: narradores, error: e1 } = await db.from('narradores').select('id, como_le_dicen');
if (e1) {
  console.error('No se pudo leer la base:', e1.message);
  process.exit(2);
}

// PostgREST corta en 1000 filas sin avisar: un candado que deja de ver lo nuevo en
// silencio es peor que no tenerlo. Se lee de a páginas hasta que no venga más.
const PAGINA = 1000;
const filas: FilaMaterial[] = [];
for (let desde = 0; ; desde += PAGINA) {
  const { data, error } = await db
    .from('respuestas')
    .select('id, narrador_id, pregunta_orden, audio_path, transcripcion, es_repregunta, recibido_at')
    .order('id')
    .range(desde, desde + PAGINA - 1);
  if (error) {
    console.error('No se pudo leer la base:', error.message);
    process.exit(2);
  }
  filas.push(...((data ?? []) as FilaMaterial[]));
  if (!data || data.length < PAGINA) break;
}

const nombres = Object.fromEntries((narradores ?? []).map((n) => [n.id, n.como_le_dicen ?? n.id.slice(0, 8)]));
const conRespuestas = new Set(filas.map((f) => f.narrador_id));
const auditar = (narradores ?? []).filter((n) =>
  conRespuestas.has(n.id) && (todos || (n.como_le_dicen ?? '').toLowerCase() === pedido!.toLowerCase()));
if (auditar.length === 0) {
  console.error(`No encontré respuestas de "${pedido}". Narradores con respuestas: ${[...conRespuestas].map((id) => nombres[id]).join(', ')}`);
  process.exit(2);
}

const ICONO = { grave: '🔴', revisar: '🟠', info: '·' } as const;
let graves = 0;
const aEscuchar = new Set<string>();

for (const n of auditar) {
  const avisos: Aviso[] = auditarMaterial(n.id, filas, nombres);
  const cuenta = (nivel: Aviso['nivel']) => avisos.filter((a) => a.nivel === nivel).length;
  const total = filas.filter((f) => f.narrador_id === n.id).length;
  graves += cuenta('grave');

  console.log(`\n══ ${nombres[n.id]} — ${total} respuestas ══`);
  console.log(`   grave: ${cuenta('grave')} · revisar: ${cuenta('revisar')} · info: ${cuenta('info')}`);
  for (const a of avisos) {
    console.log(`\n ${ICONO[a.nivel]} orden ${a.orden} · ${a.tipo}\n   ${a.detalle}`);
    for (const audio of a.audios) console.log(`     ▸ ${audio}`);
    if (a.nivel !== 'info') for (const id of a.respuestas) console.log(`     respuesta ${id}  (npm run manual -- descartar ${slug(nombres[n.id])} ${id} --motivo "...")`);
    if (a.nivel !== 'info') a.audios.forEach((p) => aEscuchar.add(p));
  }
}

if (carpeta && aEscuchar.size) {
  mkdirSync(carpeta, { recursive: true });
  for (const path of aEscuchar) {
    const { data, error } = await db.storage.from('audios').download(path);
    if (error || !data) { console.error(`   no se pudo bajar ${path}: ${error?.message}`); continue; }
    // El nombre sale de la base: se limpia para que Windows lo acepte.
    const quien = (nombres[path.split('/')[0]] ?? path.split('/')[0]).replace(/[^\p{L}\p{N}_-]+/gu, '_');
    const destino = join(carpeta, `${quien}_${path.split('/').pop()}`);
    writeFileSync(destino, Buffer.from(await data.arrayBuffer()));
  }
  console.log(`\n${aEscuchar.size} audio(s) para escuchar en ${resolve(carpeta)}`);
}

process.exit(graves > 0 ? 1 : 0);
