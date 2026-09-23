/**
 * Prueba del perfil (biógrafo v2, 23/09): repite una entrevista real respuesta por respuesta,
 * SIN la ficha de la familia (o con --con-ficha), y deja cómo fue armando el biógrafo quién es
 * la persona y su línea de tiempo. No escribe nada en la base: lee y guarda en una carpeta.
 *
 * Uso:  npx tsx scripts/prueba-perfil.ts <como le dicen> [--con-ficha] [--excluir <id>,<id>] [--salida <carpeta>]
 *
 * Costo: una llamada a Opus por respuesta (~35 para un libro).
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { actualizarPerfil, perfilVacio, type Perfil } from '../src/ia/perfil.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
}
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const USD = (u: Anthropic.Usage) => (u.input_tokens * 5 + u.output_tokens * 25) / 1_000_000; // Opus 5, src/costos.ts

const args = process.argv.slice(2);
const quien = args[0];
const conFicha = args.includes('--con-ficha');
const valor = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const excluidas = new Set((valor('--excluir') ?? '').split(',').filter(Boolean));
if (!quien || quien.startsWith('--')) {
  console.error('Uso: npx tsx scripts/prueba-perfil.ts <como le dicen> [--con-ficha] [--excluir <id>,<id>] [--salida <carpeta>]');
  process.exit(2);
}
const salida = resolve(valor('--salida') ?? `prueba-perfil-${quien.toLowerCase()}`);

const { data: narradores } = await db.from('narradores').select('id, como_le_dicen, contexto');
const n = (narradores ?? []).find((x) => (x.como_le_dicen ?? '').toLowerCase() === quien.toLowerCase());
if (!n) throw new Error(`No encontré a ${quien}`);
const contexto = (n.contexto ?? {}) as Record<string, any>;
const { data: preguntas } = await db.from('preguntas').select('orden, texto').eq('narrador_id', n.id);
const { data: respuestas } = await db.from('respuestas')
  .select('id, pregunta_orden, transcripcion, texto_directo, es_repregunta, recibido_at')
  .eq('narrador_id', n.id).order('recibido_at');
const guion = new Map((preguntas ?? []).map((p) => [p.orden, p.texto as string]));

// Lo que de verdad se le mandó: la personalizada o la repregunta, y si no, el guion.
const preguntaDe = (r: { pregunta_orden: number; es_repregunta: boolean }) =>
  (r.es_repregunta ? contexto.repreguntasEnviadas?.[r.pregunta_orden] : contexto.preguntasEnviadas?.[r.pregunta_orden])
  ?? guion.get(r.pregunta_orden) ?? `Pregunta ${r.pregunta_orden}`;

const ficha = conFicha
  ? JSON.stringify({ anioNacimiento: contexto.anioNacimiento, trato: contexto.trato, arbol: contexto.arbol, datosExtra: contexto.datosExtra, vinculoComprador: contexto.vinculoComprador })
  : null;

mkdirSync(salida, { recursive: true });
let perfil: Perfil = perfilVacio();
let gasto = 0;
const aprendio: string[] = [];
const lista = (respuestas ?? []).filter((r) => !excluidas.has(r.id) && (r.transcripcion || r.texto_directo));
for (const [i, r] of lista.entries()) {
  const antes = JSON.stringify(perfil.persona);
  const { ok, perfil: nuevo, usage } = await actualizarPerfil(cliente, perfil, ficha, preguntaDe(r), (r.transcripcion || r.texto_directo)!);
  gasto += USD(usage);
  perfil = nuevo;
  const paso = String(i + 1).padStart(2, '0');
  writeFileSync(join(salida, `perfil_${paso}_orden${r.pregunta_orden}${r.es_repregunta ? 'r' : ''}.json`), JSON.stringify(perfil, null, 2));
  for (const [campo, dato] of Object.entries(perfil.persona)) {
    const previo = (JSON.parse(antes) as Record<string, unknown>)[campo];
    if (dato && JSON.stringify(dato) !== JSON.stringify(previo)) {
      aprendio.push(`respuesta ${paso} (orden ${r.pregunta_orden}): ${campo} = ${dato.valor} [${dato.fuente}${dato.por ? `: ${dato.por}` : ''}]`);
    }
  }
  console.log(`${paso}/${lista.length} orden ${r.pregunta_orden}${ok ? '' : ' ⚠ no se entendió la salida, quedó el perfil anterior'} · USD ${gasto.toFixed(2)}`);
}

const informe = [
  `# Prueba del perfil — ${n.como_le_dicen} (${conFicha ? 'CON' : 'SIN'} ficha de la familia)`, '',
  `${lista.length} respuestas · USD ${gasto.toFixed(2)}`, '',
  '## Cuándo aprendió cada dato de la persona', ...aprendio.map((a) => `- ${a}`), '',
  '## El perfil final', '```json', JSON.stringify(perfil, null, 2), '```',
].join('\n');
writeFileSync(join(salida, 'informe.md'), informe);
console.log(`\n${informe}\n\nTodo en ${salida}`);
