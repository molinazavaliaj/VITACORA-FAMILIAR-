/**
 * La prueba única del biógrafo v2 (pedido de Naza, 23/09: "ordenemos todo y después probamos
 * todos los arreglos de una"). No escribe nada en la base: lee y deja un informe para leer.
 *
 * Por cada narrador:
 *   1. Arma el perfil SIN la ficha de la familia, respuesta por respuesta (¿se da cuenta de
 *      con quién habla?).
 *   2. Reparte las preguntas variables por tramos de su vida.
 *   3. Escribe las preguntas v2 que le tocarían: las variables y cuatro del núcleo que son
 *      donde más se erró (el amor, los juegos, un día de hoy, el mensaje).
 *   4. Marca lo que se puede marcar solo: trato roto, palabras de supuestos (hijos, nietos,
 *      pareja con género) que el perfil no respalda. Lo demás se lee.
 *
 * El libro (reparto del material) ya se probó y midió aparte: fabrica/scripts/prueba-reparto.ts.
 *
 * Uso:  npx tsx scripts/prueba-integral.ts [--solo ciro] [--salida <carpeta>]
 * Costo estimado (Opus): ~USD 0,05 por respuesta para el perfil + ~USD 0,03 por pregunta.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { actualizarPerfil, perfilVacio, type Perfil } from '../src/ia/perfil.js';
import { planificar } from '../src/ia/plan-preguntas.js';
import { NUCLEO, escribirPregunta, perfilEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
}
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const USD = (u: Anthropic.Usage) => (u.input_tokens * 5 + u.output_tokens * 25) / 1_000_000; // Opus 5, src/costos.ts

const args = process.argv.slice(2);
const valor = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const salida = resolve(valor('--salida') ?? 'prueba-integral');
// El audio de Ciro que quedó en la orden 27 de Joaquín (bitácora 43): no es de él.
const EXCLUIDAS = new Set(['b3bd57db-a5f9-47e2-b638-8615bcb23566']);
const NARRADORES = (valor('--solo') ? [valor('--solo')!] : ['ciro', 'joaquin', 'don osvaldo']);
const NUCLEO_A_PROBAR = ['juegos', 'amor', 'un-dia-de-hoy', 'mensaje'];

/** Palabras que suponen una vida: si aparecen en la pregunta y el perfil no las respalda, se marcan. */
const SUPUESTOS: [RegExp, RegExp][] = [
  [/\b(hijos?|hijas?)\b/i, /\b(hijos?|hijas?)\b/i],
  [/\bniet[oa]s?\b/i, /\bniet[oa]s?\b/i],
  [/\b(esposa|esposo|marido|mujer de tu vida|novia|novio|la conociste|lo conociste|la viste|lo viste)\b/i, /\b(esposa|esposo|marido|novia|novio|pareja)\b/i],
  [/\b(boda|casamiento|te casaste|se casó)\b/i, /\b(boda|casamiento|cas[oó]|casad[oa])\b/i],
];

mkdirSync(salida, { recursive: true });
const { data: narradores } = await db.from('narradores').select('id, como_le_dicen, contexto');
let gasto = 0;
const resumen: string[] = ['# Prueba integral del biógrafo v2', ''];

for (const quien of NARRADORES) {
  const n = (narradores ?? []).find((x) => (x.como_le_dicen ?? '').toLowerCase() === quien);
  if (!n) { resumen.push(`- ⚠ no encontré a ${quien}`); continue; }
  const contexto = (n.contexto ?? {}) as Record<string, any>;
  const { data: preguntas } = await db.from('preguntas').select('orden, texto').or(`narrador_id.eq.${n.id},narrador_id.is.null`);
  const guion = new Map((preguntas ?? []).map((p) => [p.orden, p.texto as string]));
  const { data: respuestas } = await db.from('respuestas')
    .select('id, pregunta_orden, transcripcion, texto_directo, es_repregunta, recibido_at')
    .eq('narrador_id', n.id).order('recibido_at');
  const pares = (respuestas ?? [])
    .filter((r) => !EXCLUIDAS.has(r.id) && (r.transcripcion || r.texto_directo))
    .map((r) => ({
      pregunta: (r.es_repregunta ? contexto.repreguntasEnviadas?.[r.pregunta_orden] : contexto.preguntasEnviadas?.[r.pregunta_orden])
        ?? guion.get(r.pregunta_orden) ?? `Pregunta ${r.pregunta_orden}`,
      respuesta: (r.transcripcion || r.texto_directo) as string,
    }));

  // 1. El perfil, sin ficha.
  let perfil: Perfil = perfilVacio();
  for (const [i, par] of pares.entries()) {
    const r = await actualizarPerfil(cliente, perfil, null, par.pregunta, par.respuesta);
    perfil = r.perfil;
    gasto += USD(r.usage);
    console.log(`${n.como_le_dicen}: perfil ${i + 1}/${pares.length}${r.ok ? '' : ' ⚠ salida ilegible'} · USD ${gasto.toFixed(2)}`);
  }

  // 2. El reparto de variables.
  const plan = planificar(perfil, NUCLEO, 11);

  // 3. Las preguntas v2.
  const objetivos: Objetivo[] = [
    ...NUCLEO.filter((x) => NUCLEO_A_PROBAR.includes(x.id)).map((x) => ({ tipo: 'nucleo' as const, ...x })),
    ...(plan.ok ? plan.variables.map((v) => ({ tipo: 'variable' as const, ...v })) : []),
  ];
  const conversacion = pares.slice(-6);
  const yaHechas: string[] = pares.map((p) => p.pregunta);
  const escritas: { objetivo: string; texto: string; ok: boolean; marcas: string[] }[] = [];
  for (const o of objetivos) {
    const r = await escribirPregunta(cliente, perfil, o, conversacion, yaHechas);
    for (const u of r.usos) gasto += USD(u);
    const perfilTexto = JSON.stringify(perfil);
    const marcas = SUPUESTOS.filter(([enPregunta, enPerfil]) => enPregunta.test(r.texto) && !enPerfil.test(perfilTexto)).map(([re]) => `supone: ${re.source}`);
    if (!r.ok) marcas.push(`control: ${r.motivo}`);
    escritas.push({ objetivo: o.tipo === 'nucleo' ? o.id : `${o.tramo} (${o.desde}-${o.hasta})`, texto: r.texto, ok: r.ok, marcas });
    yaHechas.push(r.texto);
    console.log(`${n.como_le_dicen}: pregunta ${escritas.length}/${objetivos.length} · USD ${gasto.toFixed(2)}`);
  }

  const informe = [
    `# ${n.como_le_dicen} — ${pares.length} respuestas, sin ficha`, '',
    '## Quién es, según el biógrafo', '', perfilEnTexto(perfil), '',
    '## Reparto de variables', '',
    plan.ok ? Object.entries(plan.variables.reduce<Record<string, number>>((c, v) => ({ ...c, [v.tramo]: (c[v.tramo] ?? 0) + 1 }), {})).map(([t, k]) => `- ${t}: ${k}`).join('\n') : `No planificó: falta ${plan.falta}`, '',
    '## Las preguntas que le haría', '',
    ...escritas.map((e) => `**${e.objetivo}**${e.marcas.length ? ` ⚠ ${e.marcas.join(' · ')}` : ''}\n> ${e.texto}\n`),
  ].join('\n');
  writeFileSync(join(salida, `${quien.replace(/\s+/g, '-')}.md`), informe);
  writeFileSync(join(salida, `${quien.replace(/\s+/g, '-')}-perfil.json`), JSON.stringify(perfil, null, 2));
  const marcadas = escritas.filter((e) => e.marcas.length).length;
  resumen.push(`- **${n.como_le_dicen}**: ${pares.length} respuestas · ${escritas.length} preguntas · ${marcadas} con marca · ${plan.ok ? 'planificó' : `no planificó (${plan.falta})`}`);
}

resumen.push('', `**Gasto:** USD ${gasto.toFixed(2)}`);
writeFileSync(join(salida, 'resumen.md'), resumen.join('\n'));
console.log(`\n${resumen.join('\n')}\n\nTodo en ${salida}`);
