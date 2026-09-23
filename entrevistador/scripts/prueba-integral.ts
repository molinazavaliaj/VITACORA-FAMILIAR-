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
 * Uso:  npx tsx scripts/prueba-integral.ts [--solo ciro] [--salida <carpeta>] [--reusar-perfil]
 * Costo (Opus 5; medido en consumo_ia el 23/09: una evaluación sale USD 0,027 con ~3.700 tokens de
 * entrada y ~325 de salida, pensamiento incluido): ~USD 0,03 por respuesta para el perfil y ~0,03
 * por pregunta → ~USD 4 para los tres narradores.
 *
 * Si se corta a mitad de camino (la API, el crédito), lo ya hecho no se pierde: el perfil de cada
 * narrador queda en <carpeta>/<quien>-perfiles.json apenas termina el paso 1, y con --reusar-perfil
 * la próxima corrida lo lee de ahí y no lo vuelve a pagar. Un narrador que falla no frena a los
 * otros: se anota en el resumen y el script termina con código 1.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { actualizarPerfil, perfilVacio, type Perfil } from '../src/ia/perfil.js';
import { planificar } from '../src/ia/plan-preguntas.js';
import { NUCLEO, escribirPregunta, perfilEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { evaluarV2 } from '../src/ia/evaluar-v2.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
}
// El cerebro (que se importa para comparar la evaluación de hoy) exige las WA_* al cargarse, y en
// el .env local están vacías (Meta sin habilitar): `||=`, como scripts/prueba-cerebro.ts.
for (const v of ['OPENAI_API_KEY', 'WA_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_VERIFY_TOKEN']) process.env[v] ||= 'no-usado-en-esta-prueba';
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const USD = (u: Anthropic.Usage) => (u.input_tokens * 5 + u.output_tokens * 25) / 1_000_000; // Opus 5, src/costos.ts

const args = process.argv.slice(2);
const valor = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const salida = resolve(valor('--salida') ?? 'prueba-integral');
// El audio de Ciro que quedó en la orden 27 de Joaquín (bitácora 43): no es de él.
const EXCLUIDAS = new Set(['b3bd57db-a5f9-47e2-b638-8615bcb23566']);
const NARRADORES = (valor('--solo') ? [valor('--solo')!] : ['ciro', 'joaquin', 'don osvaldo']);
const reusarPerfil = args.includes('--reusar-perfil');
// El primer mensaje ('casa-infancia') se escribe con la ficha VACÍA y sin conversación: es el caso
// real (la edad y el vos/usted todavía no se saben), y es el mensaje que decide si contesta.
const NUCLEO_A_PROBAR = ['casa-infancia', 'juegos', 'amor', 'un-dia-de-hoy', 'mensaje'];

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
let fallo = false;
const resumen: string[] = ['# Prueba integral del biógrafo v2', ''];

for (const quien of NARRADORES) {
  const n = (narradores ?? []).find((x) => (x.como_le_dicen ?? '').toLowerCase() === quien);
  if (!n) { resumen.push(`- ⚠ no encontré a ${quien}`); continue; }
  const contexto = (n.contexto ?? {}) as Record<string, any>;
  const { data: preguntas } = await db.from('preguntas').select('narrador_id, orden, texto').or(`narrador_id.eq.${n.id},narrador_id.is.null`);
  // Las propias del narrador pisan a las de la plantilla (mismo orden): primero las globales.
  const guion = new Map([...(preguntas ?? [])].sort((a, b) => Number(Boolean(a.narrador_id)) - Number(Boolean(b.narrador_id))).map((p) => [p.orden, p.texto as string]));
  const evitar: string[] = typeof contexto.evitar === 'string' && contexto.evitar.trim() ? [contexto.evitar.trim()] : [];
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

  const archivo = quien.replace(/\s+/g, '-');
  const rutaPerfiles = join(salida, `${archivo}-perfiles.json`);
  let perfil: Perfil = perfilVacio();
  const perfilAntes: Perfil[] = [];
  const escritas: { objetivo: string; texto: string; ok: boolean; marcas: string[] }[] = [];
  const casos: string[] = [];
  let plan: ReturnType<typeof planificar> = { ok: false, falta: 'edad' };
  try {
  // 1. El perfil, sin ficha (o el de la corrida anterior, con --reusar-perfil).
  const guardados = reusarPerfil && existsSync(rutaPerfiles) ? JSON.parse(readFileSync(rutaPerfiles, 'utf8')) as { antes: Perfil[]; final: Perfil } : null;
  if (guardados && guardados.antes.length === pares.length) {
    perfilAntes.push(...guardados.antes);
    perfil = guardados.final;
    console.log(`${n.como_le_dicen}: perfil reusado de ${rutaPerfiles}`);
  } else {
    for (const [i, par] of pares.entries()) {
      perfilAntes.push(perfil);
      const r = await actualizarPerfil(cliente, perfil, null, par.pregunta, par.respuesta);
      perfil = r.perfil;
      gasto += USD(r.usage);
      console.log(`${n.como_le_dicen}: perfil ${i + 1}/${pares.length}${r.ok ? '' : ' ⚠ salida ilegible'} · USD ${gasto.toFixed(2)}`);
    }
    writeFileSync(rutaPerfiles, JSON.stringify({ antes: perfilAntes, final: perfil }, null, 1));
  }

  // 2. El reparto de variables.
  plan = planificar(perfil, NUCLEO, 11);

  // 3. Las preguntas v2.
  const objetivos: Objetivo[] = [
    ...NUCLEO.filter((x) => NUCLEO_A_PROBAR.includes(x.id)).map((x) => ({ tipo: 'nucleo' as const, ...x })),
    ...(plan.ok ? plan.variables.map((v) => ({ tipo: 'variable' as const, ...v })) : []),
  ];
  const conversacion = pares.slice(-6);
  const yaHechas: string[] = pares.map((p) => p.pregunta);
  for (const o of objetivos) {
    const esPrimerMensaje = o.tipo === 'nucleo' && o.id === 'casa-infancia';
    const r = esPrimerMensaje
      ? await escribirPregunta(cliente, perfilVacio(), o, [], [], [])
      : await escribirPregunta(cliente, perfil, o, conversacion, yaHechas, evitar);
    for (const u of r.usos) gasto += USD(u);
    const perfilTexto = JSON.stringify(perfil);
    const marcas = SUPUESTOS.filter(([enPregunta, enPerfil]) => enPregunta.test(r.texto) && !enPerfil.test(perfilTexto)).map(([re]) => `supone: ${re.source}`);
    if (!r.ok) marcas.push(`control: ${r.motivo}`);
    escritas.push({ objetivo: o.tipo === 'nucleo' ? `${o.id}${esPrimerMensaje ? ' (ficha vacía, primer mensaje)' : ''}` : `${o.tramo} (${o.desde}-${o.hasta})`, texto: r.texto, ok: r.ok, marcas });
    if (!esPrimerMensaje) yaHechas.push(r.texto);
    console.log(`${n.como_le_dicen}: pregunta ${escritas.length}/${objetivos.length} · USD ${gasto.toFixed(2)}`);
  }

  // Los casos reales donde la repregunta falló: se re-evalúa esa respuesta con la evaluación de
  // hoy (el prompt de producción, directo, para no escribir el consumo en la base) y con la v2
  // (el encargo compartido y el perfil de ESE momento), y se comparan.
  //   C1: le pidió lo que ya había contado (sus abuelos, cuando su abuela le cocinaba).
  //   C4: dijo "vamos por otro lado" y la repregunta fue derecho a ese tema.
  const CASOS = [
    { id: 'C1', titulo: '¿repregunta lo que ya contó?', es: (r: string) => r.startsWith('Sinceramente, en esta pregunta no te puedo ayudar') },
    { id: 'C4', titulo: '¿insiste donde pidió cambiar de tema?', es: (r: string) => /vamos por otro lado/i.test(r) },
  ];
  for (const caso of CASOS) {
    const i = pares.findIndex((p) => caso.es(p.respuesta));
    if (i < 0) continue;
    const { PROMPT_EVALUAR, estiloCerebro } = await import('../src/ia/cerebro.js');
    const hoy = await cliente.messages.create({
      model: 'claude-opus-5', max_tokens: 500, system: estiloCerebro('vos'),
      messages: [{ role: 'user', content: PROMPT_EVALUAR(pares[i].pregunta, pares[i].respuesta, 40, '', 'vos') }],
    });
    gasto += USD(hoy.usage);
    const bloqueHoy = hoy.content.find((b) => b.type === 'text');
    // Sin `evitar`: el caso mide si la v2 lo detecta sola, como el día que pasó.
    const v2 = await evaluarV2(cliente, perfilAntes[i], pares[i].pregunta, pares[i].respuesta, 40, pares.slice(Math.max(0, i - 6), i), []);
    for (const u of v2.usos) gasto += USD(u);
    casos.push(
      `## ${caso.id}: ${caso.titulo}`, '',
      `Pregunta: «${pares[i].pregunta}»`, '', `Respuesta: «${pares[i].respuesta.slice(0, 220)}…»`, '',
      `**Evaluación de hoy:** ${bloqueHoy && bloqueHoy.type === 'text' ? bloqueHoy.text.trim() : '(vacío)'}`, '',
      `**Evaluación v2:** ${JSON.stringify(v2.evaluacion)}${v2.controlOk ? '' : ` ⚠ control: ${v2.motivo}`}`, '',
    );
  }

  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.error(`${n.como_le_dicen}: ⚠ se cortó: ${motivo}`);
    resumen.push(`- ⚠ **${n.como_le_dicen}** se cortó (${motivo.slice(0, 120)}): quedó lo hecho hasta ahí; con --reusar-perfil no se paga de nuevo el perfil.`);
    fallo = true;
  }

  const informe = [
    `# ${n.como_le_dicen} — ${pares.length} respuestas, sin ficha${evitar.length ? ` · temas que pidió dejar: ${evitar.join('; ')}` : ''}`, '',
    ...casos,
    '## Quién es, según el biógrafo', '', perfilEnTexto(perfil), '',
    '## Reparto de variables', '',
    plan.ok ? Object.entries(plan.variables.reduce<Record<string, number>>((c, v) => ({ ...c, [v.tramo]: (c[v.tramo] ?? 0) + 1 }), {})).map(([t, k]) => `- ${t}: ${k}`).join('\n') : `No planificó: falta ${plan.falta}`, '',
    '## Las preguntas que le haría', '',
    ...escritas.map((e) => `**${e.objetivo}**${e.marcas.length ? ` ⚠ ${e.marcas.join(' · ')}` : ''}\n> ${e.texto}\n`),
  ].join('\n');
  writeFileSync(join(salida, `${archivo}.md`), informe);
  writeFileSync(join(salida, `${archivo}-perfil.json`), JSON.stringify(perfil, null, 2));
  const marcadas = escritas.filter((e) => e.marcas.length).length;
  resumen.push(`- **${n.como_le_dicen}**: ${pares.length} respuestas · ${escritas.length} preguntas · ${marcadas} con marca · ${plan.ok ? 'planificó' : `no planificó (${plan.falta})`}`);
}

resumen.push('', `**Gasto:** USD ${gasto.toFixed(2)}`);
writeFileSync(join(salida, 'resumen.md'), resumen.join('\n'));
console.log(`\n${resumen.join('\n')}\n\nTodo en ${salida}`);
process.exit(fallo ? 1 : 0);
