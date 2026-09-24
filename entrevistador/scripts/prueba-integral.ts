/**
 * La prueba única del biógrafo v2 (pedido de Naza, 23/09: "ordenemos todo y después probamos
 * todos los arreglos de una"; reducida el 24/09 a lo que todavía no se puede medir sin pagar —
 * las preguntas del día las mide Naza en vivo con el piloto manual). No escribe nada en la base:
 * lee y deja un informe para leer.
 *
 * Se queda solo con Ciro (Joaquín y Ciro, de 28 años, son el material real; Ciro alcanza para
 * esta prueba). Arma su perfil SIN la ficha de la familia, respuesta por respuesta (¿se da cuenta
 * de con quién habla?) — igual que hoy, porque `evaluarV2` lo necesita — y después compara, en
 * tres casos, la evaluación de hoy (`PROMPT_EVALUAR`, el prompt de producción) contra la v2
 * (`evaluarV2`), con el objetivo 'padres' del núcleo:
 *
 *   C1: le pidió lo que ya había contado (sus abuelos, cuando su abuela le cocinaba).
 *   C4: dijo "vamos por otro lado" y la repregunta fue derecho a ese tema.
 *   RESERVA (inventado, no pasó — texto que aprueba Naza): pide que algo no vaya al libro en
 *     medio de una respuesta que sigue contando algo bueno; mide si la v2 lo detecta sola, sin
 *     que nadie se lo marque.
 *
 * Uso:  npx tsx scripts/prueba-integral.ts [--salida <carpeta>] [--reusar-perfil]
 * Costo (Opus 5; medido en consumo_ia el 23/09: una llamada sale USD 0,027 con ~3.700 tokens de
 * entrada y ~325 de salida, pensamiento incluido): ~USD 0,03 por respuesta para el perfil (18
 * respuestas de Ciro) más ~0,03 por evaluación (6: los 3 casos, hoy y v2) → ~USD 0,7 en total.
 *
 * Si se corta a mitad de camino (la API, el crédito), el perfil no se pierde: queda en
 * <carpeta>/ciro-perfiles.json apenas termina de armarse, y con --reusar-perfil la próxima
 * corrida lo lee de ahí y no lo vuelve a pagar.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { actualizarPerfil, perfilVacio, type Perfil } from '../src/ia/perfil.js';
import { perfilEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { GUION } from '../src/ia/guion-v2.js';
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
const reusarPerfil = args.includes('--reusar-perfil');

// El objetivo 'padres-como-eran' (¿cómo era su padre?): los tres casos usan el mismo, real o
// inventado — C1 y C4 porque así se los volvió a evaluar el 23/09, y RESERVA porque la pregunta
// que se le inventa es esa. Sin `!`: si el guion cambiara de ids, avisa con un mensaje claro en
// vez de tirar la excepción críptica de un non-null que apunta a `undefined`.
const PADRES = GUION.find((x) => x.id === 'padres-como-eran');
if (!PADRES) throw new Error('el guion (GUION en guion-v2.ts) ya no tiene la fila "padres-como-eran": actualizá esta prueba');
const OBJETIVO_PADRES: Objetivo = {
  tipo: 'nucleo', id: PADRES.id, tramo: PADRES.tramo, bloque: PADRES.etapa, tema: PADRES.tema,
  pormenores: PADRES.pormenores, pideEscena: PADRES.pideEscena, fila: PADRES.id,
};

mkdirSync(salida, { recursive: true });
const { data: narradores } = await db.from('narradores').select('id, como_le_dicen, contexto');
let gasto = 0;
let fallo = false;
const resumen: string[] = ['# Prueba integral del biógrafo v2', ''];

const quien = 'ciro';
const n = (narradores ?? []).find((x) => (x.como_le_dicen ?? '').toLowerCase() === quien);
if (!n) {
  console.error(`no encontré a ${quien}`);
  process.exit(1);
}

const contexto = (n.contexto ?? {}) as Record<string, any>;
const { data: preguntas } = await db.from('preguntas').select('narrador_id, orden, texto').or(`narrador_id.eq.${n.id},narrador_id.is.null`);
// Las propias del narrador pisan a las de la plantilla (mismo orden): primero las globales.
const guion = new Map([...(preguntas ?? [])].sort((a, b) => Number(Boolean(a.narrador_id)) - Number(Boolean(b.narrador_id))).map((p) => [p.orden, p.texto as string]));
const evitar: string[] = typeof contexto.evitar === 'string' && contexto.evitar.trim() ? [contexto.evitar.trim()] : [];
const { data: respuestas } = await db.from('respuestas')
  .select('id, pregunta_orden, transcripcion, texto_directo, es_repregunta, recibido_at')
  .eq('narrador_id', n.id).order('recibido_at');
const pares = (respuestas ?? [])
  .filter((r) => r.transcripcion || r.texto_directo)
  .map((r) => ({
    pregunta: (r.es_repregunta ? contexto.repreguntasEnviadas?.[r.pregunta_orden] : contexto.preguntasEnviadas?.[r.pregunta_orden])
      ?? guion.get(r.pregunta_orden) ?? `Pregunta ${r.pregunta_orden}`,
    respuesta: (r.transcripcion || r.texto_directo) as string,
  }));

const archivo = quien;
const rutaPerfiles = join(salida, `${archivo}-perfiles.json`);
let perfil: Perfil = perfilVacio();
const perfilAntes: Perfil[] = [];
const casos: string[] = [];
let casosEvaluados = 0;

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
      const r = await actualizarPerfil(cliente, perfil, par.pregunta, par.respuesta, []);
      perfil = r.perfil;
      gasto += USD(r.usage);
      console.log(`${n.como_le_dicen}: perfil ${i + 1}/${pares.length}${r.ok ? '' : ' ⚠ salida ilegible'} · USD ${gasto.toFixed(2)}`);
    }
    writeFileSync(rutaPerfiles, JSON.stringify({ antes: perfilAntes, final: perfil }, null, 1));
  }

  // 2. Los tres casos: dos reales (dónde ya se erró el 23/09) y uno inventado (RESERVA, texto que
  // aprueba Naza). Cada uno lleva el perfil de ESE momento y las últimas respuestas como
  // conversación — para RESERVA, las últimas de toda la entrevista, como si fuera un día más.
  type Caso = { id: string; titulo: string; pregunta: string; respuesta: string; perfilAntes: Perfil; conversacion: { pregunta: string; respuesta: string }[] };
  const CASOS: Caso[] = [];
  const c1 = pares.findIndex((p) => p.respuesta.startsWith('Sinceramente, en esta pregunta no te puedo ayudar'));
  if (c1 >= 0) {
    CASOS.push({ id: 'C1', titulo: '¿repregunta lo que ya contó?', pregunta: pares[c1].pregunta, respuesta: pares[c1].respuesta, perfilAntes: perfilAntes[c1], conversacion: pares.slice(Math.max(0, c1 - 6), c1) });
  } else {
    resumen.push('- ⚠ no encontré el caso C1 en las respuestas de Ciro (¿cambió el texto de control en producción?)');
  }
  const c4 = pares.findIndex((p) => /vamos por otro lado/i.test(p.respuesta));
  if (c4 >= 0) {
    CASOS.push({ id: 'C4', titulo: '¿insiste donde pidió cambiar de tema?', pregunta: pares[c4].pregunta, respuesta: pares[c4].respuesta, perfilAntes: perfilAntes[c4], conversacion: pares.slice(Math.max(0, c4 - 6), c4) });
  } else {
    resumen.push('- ⚠ no encontré el caso C4 en las respuestas de Ciro');
  }
  CASOS.push({
    id: 'RESERVA',
    titulo: '¿guarda lo que pidió que quede entre nosotros? (inventado, no pasó)',
    pregunta: '¿Cómo era su padre?',
    respuesta: 'Mi viejo tomaba. Esto que te cuento de la plata que se llevó prefiero que no vaya al libro, que quede entre nosotros. Pero era un tipo que cuando estaba bien te hacía reír.',
    perfilAntes: perfil,
    conversacion: pares.slice(-6),
  });

  const { PROMPT_EVALUAR, estiloCerebro } = await import('../src/ia/cerebro.js');
  for (const caso of CASOS) {
    const hoy = await cliente.messages.create({
      model: 'claude-opus-5', max_tokens: 500, system: estiloCerebro('vos'),
      messages: [{ role: 'user', content: PROMPT_EVALUAR(caso.pregunta, caso.respuesta, 40, '', 'vos') }],
    });
    gasto += USD(hoy.usage);
    const bloqueHoy = hoy.content.find((b) => b.type === 'text');
    // Sin `evitar`: el caso mide si la v2 lo detecta sola, como el día que pasó (o como pasaría
    // con RESERVA). No hay un objetivo real para C1/C4 (es una re-evaluación histórica): se usa
    // 'padres', el mismo de RESERVA — el control de lugar/supuestos igual corre, como correría
    // con el objetivo real del día.
    const v2 = await evaluarV2(cliente, caso.perfilAntes, OBJETIVO_PADRES, caso.pregunta, caso.respuesta, 40, caso.conversacion, []);
    for (const u of v2.usos) gasto += USD(u);
    const e = v2.evaluacion;
    casos.push(
      `## ${caso.id}: ${caso.titulo}`, '',
      `Pregunta: «${caso.pregunta}»`, '', `Respuesta: «${caso.respuesta.slice(0, 220)}…»`, '',
      `**Evaluación de hoy:** ${bloqueHoy && bloqueHoy.type === 'text' ? bloqueHoy.text.trim() : '(vacío)'}`, '',
      `**Evaluación v2:** suficiente=${e.suficiente}` +
        `${e.repregunta !== undefined ? ` · repregunta="${e.repregunta}"` : ''}` +
        `${e.dejarTema !== undefined ? ` · dejarTema="${e.dejarTema}"` : ''}` +
        `${e.reservado !== undefined ? ` · reservado=${e.reservado}` : ''}` +
        `${e.reservadoTramo !== undefined ? ` · reservadoTramo="${e.reservadoTramo}"` : ''}` +
        `${v2.marca ? ` ⚠ marca: ${v2.marca.control} — ${v2.marca.motivo}` : ''}`,
      '',
    );
    casosEvaluados++;
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
].join('\n');
writeFileSync(join(salida, `${archivo}.md`), informe);
writeFileSync(join(salida, `${archivo}-perfil.json`), JSON.stringify(perfil, null, 2));
resumen.push(`- **${n.como_le_dicen}**: ${pares.length} respuestas · ${casosEvaluados} casos evaluados`);

resumen.push('', `**Gasto:** USD ${gasto.toFixed(2)}`);
writeFileSync(join(salida, 'resumen.md'), resumen.join('\n'));
console.log(`\n${resumen.join('\n')}\n\nTodo en ${salida}`);
process.exit(fallo ? 1 : 0);
