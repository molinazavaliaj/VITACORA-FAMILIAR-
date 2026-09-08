/**
 * Prueba dirigida del CEREBRO, sin WhatsApp, sin base y sin scheduler.
 *
 * Por qué existe: la fábrica ya está validada (el libro de Osvaldo salió bien),
 * pero las funciones que conversan con el narrador nunca corrieron de verdad.
 * Este script les da de comer el set dorado — 30 respuestas reales de Don Osvaldo —
 * y muestra lo que produce, para poder LEERLO y juzgar si suena a persona.
 *
 * Uso:  npx tsx scripts/prueba-cerebro.ts  [> informe.md]
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..');

// ── 1. Cargar .env a mano (config.ts lee process.env al importarse) ────────
for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
}
// El cerebro solo necesita la key de Anthropic; el resto lo exige config.ts.
for (const v of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY',
                 'WA_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_VERIFY_TOKEN']) {
  process.env[v] ??= 'no-usado-en-esta-prueba';
}

// Import dinámico: recién ahora, con el entorno ya armado.
const { generarReconocimiento, evaluarRespuesta, generarPreguntaReemplazo } =
  await import('../src/ia/cerebro.js');

// ── 2. Material real: el set dorado ────────────────────────────────────────
const narradorJson = JSON.parse(readFileSync(resolve(RAIZ, 'fabrica/set-dorado/narrador.json'), 'utf8'));
const { como_le_dicen: NOMBRE, contexto } = narradorJson.narrador;
const ARBOL: Record<string, string> = contexto.arbol;
const ANIO: number = contexto.anioNacimiento;

const respuestas: Record<number, string> = Object.fromEntries(
  (JSON.parse(readFileSync(resolve(RAIZ, 'fabrica/set-dorado/respuestas.json'), 'utf8')) as
    { orden: number; texto: string }[]).map((r) => [r.orden, r.texto]),
);

// Las 26 preguntas fijas, leídas del contrato compartido (seed.sql).
const seed = readFileSync(resolve(RAIZ, 'supabase/seed.sql'), 'utf8');
const preguntas: Record<number, { texto: string; capitulo: string }> = {};
for (const m of seed.matchAll(/\(null,\s*(\d+),\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)'/g)) {
  preguntas[Number(m[1])] = { texto: m[2].replace(/''/g, "'"), capitulo: m[3].replace(/''/g, "'") };
}
const CAPITULOS = [...new Set(Object.values(preguntas).map((p) => p.capitulo))];

/** Igual que armarHistoria(), pero desde el set dorado en vez de la base. */
const historiaHasta = (orden: number) =>
  Object.keys(respuestas).map(Number).filter((o) => o <= orden).sort((a, b) => a - b)
    .map((o) => `Pregunta ${o}:\n${respuestas[o]}`).join('\n\n');

// ── 3. Impresión ───────────────────────────────────────────────────────────
const SOLO = (process.argv[2] ?? 'ABCD').toUpperCase(); // ej: npx tsx scripts/prueba-cerebro.ts C
const corre = (letra: string) => SOLO.includes(letra);
const out = (s = '') => console.log(s);
const seccion = (t: string) => { out(); out(`\n## ${t}\n`); };
const palabras = (s: string) => s.trim().split(/\s+/).length;

let gastoAprox = 0;
const contar = (entrada: string, salida: string) => {
  // Estimación grosera: ~1.4 tokens por palabra. Opus: USD 15/M in, 75/M out.
  gastoAprox += (palabras(entrada) * 1.4 / 1e6) * 15 + (palabras(salida) * 1.4 / 1e6) * 75;
};

out(`# Prueba dirigida del cerebro — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
out();
out(`Narrador: **${NOMBRE}** (set dorado, ${Object.keys(respuestas).length} respuestas reales).`);
out(`Modelo: \`claude-opus-5\`. Nada de esto toca la base ni WhatsApp.`);

// ── PRUEBA A: reconocimientos ──────────────────────────────────────────────
seccion('A. Reconocimientos — ¿engancha un detalle concreto o dice generalidades?');
out('Es la primera frase que lee el narrador cada mañana. Si suena a plantilla, abandona.');
out();
for (const [ayer, hoy] of (corre('A') ? [[1, 2], [12, 13], [21, 22], [25, 26]] : []) as readonly (readonly [number, number])[]) {
  const historia = historiaHasta(ayer - 1);
  const entrada = respuestas[ayer] + preguntas[hoy].texto + historia;
  const texto = await generarReconocimiento(
    NOMBRE, respuestas[ayer], preguntas[hoy].texto, historia, ARBOL, ANIO,
  );
  contar(entrada, texto);
  out(`### Día ${hoy} — pasa de «${preguntas[ayer].capitulo}» a «${preguntas[hoy].capitulo}»`);
  out(`> **Ayer contó:** …${respuestas[ayer].slice(-220).trim()}`);
  out(`> **Pregunta de hoy:** ${preguntas[hoy].texto}`);
  out();
  out(`**Apertura generada (${palabras(texto)} palabras):**`);
  out();
  out(`> ${texto.replace(/\n/g, '\n> ')}`);
  out();
}

// ── PRUEBA B: evaluación y repregunta ──────────────────────────────────────
seccion('B. Evaluación — ¿distingue una respuesta rica de una pobre?');

const casos: { titulo: string; orden: number; texto: string; seg: number; espero: string }[] = [
  {
    titulo: 'B1. Respuesta rica (la real de Osvaldo)',
    orden: 1, texto: respuestas[1], seg: 185,
    espero: 'suficiente: true (no debería repreguntar nada)',
  },
  {
    titulo: 'B2. Respuesta pobre y corta',
    orden: 1,
    texto: 'Y… una casa normal, común. Nada del otro mundo. Éramos pobres pero se vivía bien. Qué sé yo, hace mucho de eso.',
    seg: 14,
    espero: 'suficiente: false + una repregunta cálida que invite a un detalle concreto',
  },
  {
    titulo: 'B3. Respuesta rica PERO deja afuera la parte más valiosa',
    orden: 15,
    // La real, cortada justo antes del consejo al nieto (que es el corazón de la pregunta).
    texto: respuestas[15].split('Y si un nieto me pregunta')[0].trim(),
    seg: 150,
    espero: 'suficiente: false + repregunta que apunte al consejo al nieto, NO a un tema nuevo',
  },
];

for (const c of corre('B') ? casos : []) {
  const veredicto = await evaluarRespuesta(preguntas[c.orden].texto, c.texto, c.seg);
  contar(preguntas[c.orden].texto + c.texto, JSON.stringify(veredicto));
  out(`### ${c.titulo}`);
  out(`- Pregunta ${c.orden}: ${preguntas[c.orden].texto}`);
  out(`- Respuesta (${c.seg}s, ${palabras(c.texto)} palabras): …${c.texto.slice(-200).trim()}`);
  out(`- **Esperado:** ${c.espero}`);
  out(`- **Veredicto del cerebro:** \`${JSON.stringify(veredicto)}\``);
  if (veredicto.repregunta) { out(); out(`> ${veredicto.repregunta}`); }
  out();
}

// ── PRUEBA C: las 4 adaptativas ────────────────────────────────────────────
seccion('C. Las 4 preguntas adaptativas (órdenes 27-30) — nunca se generaron con IA');
out('Se le da la vida entera de Osvaldo (respuestas 1 a 26) y tiene que encontrar los huecos.');
out('Abajo, para comparar, los temas que Naza eligió a mano cuando armó el set dorado.');
out();

// Mismo prompt que src/ia/adaptativas.ts, pero con la historia del set dorado.
const Anthropic = (await import('@anthropic-ai/sdk')).default;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const historiaCompleta = historiaHasta(26);
// El prompt y el parser REALES del módulo: probamos lo que corre en producción.
const { PROMPT_ADAPTATIVAS, parsearCuatro, MAX_TOKENS } = await import('../src/ia/adaptativas.js');
const promptAdaptativas = PROMPT_ADAPTATIVAS(NOMBRE, historiaCompleta, CAPITULOS);

if (corre('C')) {
  const r = await anthropic.messages.create({
    model: 'claude-opus-5', max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: promptAdaptativas }],
  });
  const b0 = r.content.find((b) => b.type === 'text');
  const crudo = b0 && b0.type === 'text' ? b0.text.trim() : '';
  contar(promptAdaptativas, crudo);
  out(`Se cortó por falta de tokens: **${r.stop_reason === 'max_tokens' ? 'SÍ ⚠️' : 'no'}**`);
  out();
  try {
    const cuatro = parsearCuatro(crudo);
    out(`Devolvió **${cuatro.length}** preguntas válidas:`);
    out();
    cuatro.forEach((p, i) => {
      out(`**${27 + i}. [${p.capitulo}]** (${palabras(p.texto)} palabras) ${p.texto}`);
      out();
    });
    out(`De referencia: las preguntas del guion fijo tienen entre ${Math.min(...Object.values(preguntas).map((q) => palabras(q.texto)))} y ${Math.max(...Object.values(preguntas).map((q) => palabras(q.texto)))} palabras.`);
    out();
  } catch (e) {
    out(`⚠️ No pasó el parser: ${e}`);
    out('```'); out(crudo); out('```');
  }
}
out('**Las que eligió Naza a mano en el set dorado** (deducidas de las respuestas 27-30):');
out('27. una observación sobre él que lo hace teorizar · 28. la música en su casa · 29. un martes cualquiera en el taller · 30. el día que cerró el taller');
out();

// ── PRUEBA D: pregunta de reemplazo ────────────────────────────────────────
seccion('D. Pregunta de reemplazo — un capítulo que no aplica a esta vida');
out('Simulamos un narrador que no tuvo hijos: al llegar al día 19 hay que reemplazar la pregunta.');
out('Le damos solo lo que contó hasta el día 12 (antes de hablar de los hijos).');
out();
if (corre('D')) {
  const reemplazo = await generarPreguntaReemplazo(NOMBRE, historiaHasta(12), CAPITULOS, 'Los hijos');
  contar(historiaHasta(12), JSON.stringify(reemplazo));
  out(`**[${reemplazo.capitulo}]** ${reemplazo.texto}`);
  out();
  out('Chequeo: ¿no menciona hijos ni deja ver que está reemplazando algo?');
}

// ── Cierre ─────────────────────────────────────────────────────────────────
seccion('Costo');
out(`Estimado: **USD ${gastoAprox.toFixed(2)}** (aproximado, contando palabras).`);
