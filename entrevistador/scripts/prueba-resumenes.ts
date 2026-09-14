/**
 * "Un resumen por capítulo": ¿sirve como memoria del biógrafo, y cuánto cuesta?
 *
 * Idea de Naza (2026-09-14): en vez de que la pregunta 25 lea las 24 respuestas
 * anteriores, que lea los RESUMENES de los capítulos ya cerrados + las últimas
 * respuestas. Memoria destilada en vez de memoria cruda.
 *
 * Este script lo mide con la vida real del set dorado:
 *   1. genera el resumen de cada uno de los 8 capítulos,
 *   2. cuenta los tokens y el costo real,
 *   3. personaliza preguntas tardías (23, 25, 26) usando esos resúmenes, para
 *      comparar a ojo contra la corrida de --comparar (que iba sin resúmenes).
 *
 * Uso: npx tsx scripts/prueba-resumenes.ts
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..');

for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const MODELO = process.env.MODELO_PERSONALIZAR ?? 'claude-haiku-4-5';

const { narrador } = JSON.parse(readFileSync(resolve(RAIZ, 'fabrica/set-dorado/narrador.json'), 'utf8')) as {
  narrador: { como_le_dicen: string; contexto: Record<string, any> };
};
const contexto = narrador.contexto;
const respuestas: Record<number, string> = Object.fromEntries(
  (JSON.parse(readFileSync(resolve(RAIZ, 'fabrica/set-dorado/respuestas.json'), 'utf8')) as
    { orden: number; texto: string }[]).map((r) => [r.orden, r.texto]),
);

// orden → { texto, capitulo } del contrato compartido (seed.sql)
const guion: Record<number, { texto: string; capitulo: string }> = {};
for (const m of readFileSync(resolve(RAIZ, 'supabase/seed.sql'), 'utf8')
  .matchAll(/\(null,\s*(\d+),\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)'/g)) {
  guion[Number(m[1])] = { texto: m[2].replace(/''/g, "'"), capitulo: m[3].replace(/''/g, "'") };
}

const CAPITULOS = [...new Set(Object.values(guion).map((p) => p.capitulo))];
const ordenesDeCapitulo = (capitulo: string) =>
  Object.entries(guion).filter(([, p]) => p.capitulo === capitulo).map(([o]) => Number(o)).sort((a, b) => a - b);

const Anthropic = (await import('@anthropic-ai/sdk')).default;
const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const out = (s = '') => { console.log(s); };

const uso = { resumen: { in: 0, out: 0 }, pregunta: { in: 0, out: 0 } };
const costo = (t: { in: number; out: number }) => `USD ${((t.in / 1e6) * 1 + (t.out / 1e6) * 5).toFixed(4)}`;

async function llamar(prompt: string, balde: keyof typeof uso): Promise<string> {
  const r = await cliente.messages.create({ model: MODELO, max_tokens: 900, messages: [{ role: 'user', content: prompt }] });
  const b = r.content.find((x) => x.type === 'text');
  uso[balde].in += r.usage.input_tokens;
  uso[balde].out += r.usage.output_tokens;
  return b && b.type === 'text' ? b.text.trim() : '';
}

// ── 1. Un resumen por capítulo ─────────────────────────────────────────────
const resumenes: Record<string, string> = {};

for (const capitulo of CAPITULOS) {
  const material = ordenesDeCapitulo(capitulo)
    .filter((o) => respuestas[o])
    .map((o) => `Pregunta ${o}: ${guion[o].texto}\nRespuesta: ${respuestas[o]}`)
    .join('\n\n');

  resumenes[capitulo] = await llamar(`Esto es lo que ${narrador.como_le_dicen} contó en el capítulo «${capitulo}» de su libro, en entrevistas grabadas.

${material}

Escribí el resumen de este capítulo para que su biógrafo lo recuerde. Tiene que servir para dos cosas: (1) no volver a preguntar lo que ya contó, y (2) saber qué quedó pendiente de este capítulo.

Guardá: los hechos importantes, los nombres propios TAL COMO APARECEN, las fechas, los lugares, y las frases textuales que valen la pena recuperar. Anotá al final, en una línea, lo que quedó sin contar de este capítulo.

Máximo 250 palabras. Sin adornos. No inventes nada.`, 'resumen');

  out(`\n### ${capitulo}\n${resumenes[capitulo]}`);
}

// ── 2. Personalizar preguntas tardías CON los resúmenes ────────────────────
const ETIQUETA_ARBOL: Record<string, string> = {
  padres: 'Sus padres', hermanos: 'Sus hermanos',
  conyuge: 'Su esposa / el amor de su vida', hijos: 'Sus hijos',
};
const ficha = `El narrador es ${narrador.como_le_dicen}. ` + [
  Object.entries(contexto.arbol ?? {}).map(([r, g]) => `${ETIQUETA_ARBOL[r] ?? r}: ${g}`).join('. '),
  contexto.lugarNacimiento ? `Nació en ${contexto.lugarNacimiento}.` : '',
  contexto.oficio ? `Su oficio: ${contexto.oficio}.` : '',
  contexto.anioNacimiento ? `Año de nacimiento: ${contexto.anioNacimiento}.` : '',
].filter(Boolean).join(' ');

function contextoConResumenes(orden: number): string {
  const capitulo = guion[orden]?.capitulo ?? '';
  const anteriores = CAPITULOS.filter((c) => c !== capitulo && ordenesDeCapitulo(c).some((o) => o < orden));
  const memoria = anteriores.map((c) => `CAPÍTULO «${c}» (ya contado):\n${resumenes[c]}`).join('\n\n');
  const ultimas = Array.from({ length: 6 }, (_, i) => orden - 1 - i)
    .filter((o) => o >= 1 && respuestas[o]).reverse()
    .map((o) => `Lo que contó el día ${o}:\n${respuestas[o]}`).join('\n\n');
  return `${ficha}\n\nLO QUE YA CONTÓ (memoria del biógrafo):\n${memoria || '(todavía no cerró ningún capítulo)'}\n\nLO QUE VIENE CONTANDO ESTOS DÍAS:\n${ultimas}`;
}

out('\n\n══════════ PREGUNTAS CON MEMORIA POR CAPÍTULO ══════════');
for (const orden of [23, 25, 26]) {
  const nueva = await llamar(`Sos el biógrafo de esta persona: le escribís todos los días por WhatsApp y querés que sienta que lo venís escuchando.

${contextoConResumenes(orden)}

LA PREGUNTA QUE LE TOCA HOY (en el guion dice así):
"${guion[orden].texto}"

Reescribila para que se note que lo escuchaste. Reglas:
- Usá detalles concretos que ya contó, con sus palabras y sus nombres.
- RESPETÁ EL PARENTESCO de cada persona. Nunca le pongas a alguien un rol que no tiene.
- CONSERVÁ TODAS LAS PREGUNTAS del original: si tiene dos o tres, la versión nueva tiene las mismas.
- No le preguntes nada que ya haya contado: si el capítulo lo cerró, llevá la pregunta a lo que quedó pendiente.
- El año de nacimiento ancla la época, no es un lugar.
- Tratalo de usted, cálido, rioplatense. Máximo 50 palabras.
- NUNCA inventes nada. Si no hay nada para enganchar, devolvé el original tal cual.
- Respondé SOLO con la pregunta.`, 'pregunta');

  out(`\n### ${orden}\nORIGINAL:  ${guion[orden].texto}\nCON MEMORIA: ${nueva}`);
}

out('\n─────────────────────────────────────────');
out(`Modelo: ${MODELO}`);
out(`8 resúmenes de capítulo: ${uso.resumen.in} tokens in · ${uso.resumen.out} out → ${costo(uso.resumen)}`);
out(`3 preguntas con memoria: ${uso.pregunta.in} tokens in · ${uso.pregunta.out} out → ${costo(uso.pregunta)}`);
out(`Extrapolado a 26 preguntas con memoria (~costo por pregunta): ${costo({ in: uso.pregunta.in / 3 * 26, out: uso.pregunta.out / 3 * 26 })}`);
