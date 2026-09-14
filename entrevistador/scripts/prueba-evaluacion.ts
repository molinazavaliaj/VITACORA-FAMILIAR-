/**
 * ¿Alcanza Haiku para evaluar las respuestas, o hay que pagar Opus?
 *
 * Corre el prompt REAL de producción (`PROMPT_EVALUAR`) con los dos modelos
 * sobre los 3 casos del set dorado y muestra los veredictos lado a lado, para
 * poder LEERLOS y decidir. No toca la base ni WhatsApp.
 *
 * Uso:  npx tsx scripts/prueba-evaluacion.ts
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
// El cerebro exige el entorno completo al importarse; acá sólo se usa la key.
// OJO: en el .env las variables de WhatsApp están VACÍAS (Meta sin habilitar),
// así que va `||=` y no `??=` (`??=` no rellena un string vacío).
for (const v of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY',
                 'WA_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_VERIFY_TOKEN']) {
  process.env[v] ||= 'no-usado-en-esta-prueba';
}
if (!process.env.ANTHROPIC_API_KEY) throw new Error('Falta ANTHROPIC_API_KEY en entrevistador/.env');

const respuestas: Record<number, string> = Object.fromEntries(
  (JSON.parse(readFileSync(resolve(RAIZ, 'fabrica/set-dorado/respuestas.json'), 'utf8')) as
    { orden: number; texto: string }[]).map((r) => [r.orden, r.texto]),
);
const seed = readFileSync(resolve(RAIZ, 'supabase/seed.sql'), 'utf8');
const preguntas: Record<number, string> = {};
for (const m of seed.matchAll(/\(null,\s*(\d+),\s*'((?:[^']|'')*)'/g)) {
  preguntas[Number(m[1])] = m[2].replace(/''/g, "'");
}

const { PROMPT_EVALUAR, ESTILO_CEREBRO } = await import('../src/ia/cerebro.js');
const Anthropic = (await import('@anthropic-ai/sdk')).default;
const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

/**
 * Los mismos 3 casos que la prueba del cerebro, más dos nuevos que prueban la
 * regla nueva: la duración NO decide.
 */
const CASOS = [
  {
    titulo: '1. Rica y larga (la real de Osvaldo, 185 s)',
    orden: 1, texto: respuestas[1], seg: 185,
    espero: 'suficiente (no repreguntar)',
  },
  {
    titulo: '2. Pobre y corta (14 s, sin una sola escena)',
    orden: 1,
    texto: 'Y… una casa normal, común. Nada del otro mundo. Éramos pobres pero se vivía bien. Qué sé yo, hace mucho de eso.',
    seg: 14,
    espero: 'NO suficiente + repregunta propia',
  },
  {
    titulo: '3. Rica pero deja afuera lo más valioso (150 s)',
    orden: 15, texto: respuestas[15].split('Y si un nieto me pregunta')[0].trim(), seg: 150,
    espero: 'NO suficiente + repregunta al consejo del nieto',
  },
  {
    titulo: '4. CORTA pero de oro (9 s) — la regla nueva',
    orden: 22,
    texto: 'Y sí… el Rubén se me fue en el noventa y cuatro. Me acuerdo que fui a abrir el taller al otro día, a las siete de la mañana. No sé por qué, no podía quedarme en casa.',
    seg: 9,
    espero: 'juzga por sustancia: hay una escena fuerte, no debe rechazarla por durar 9 s',
  },
  {
    titulo: '5. Larga pero vacía (240 s, puro relleno)',
    orden: 3,
    texto: 'Y bueno, era lindo, era una época linda. Jugábamos, nos divertíamos, éramos chicos, qué sé yo, como todos los chicos de esa época, en el barrio, con los amigos del barrio, jugando, divirtiéndonos, era otra cosa, era distinto, lindo, sano, como era antes.',
    seg: 240,
    espero: 'NO suficiente (el largo no salva a la nada)',
  },
];

const MODELOS = process.argv[2]
  ? [{ nombre: process.argv[2], id: process.argv[2], in: process.argv[2].includes('haiku') ? 1 : 5, out: process.argv[2].includes('haiku') ? 5 : 25 }]
  : [
    { nombre: 'Opus 5 (hoy)', id: 'claude-opus-5', in: 5, out: 25 },
    { nombre: 'Haiku 4.5', id: 'claude-haiku-4-5', in: 1, out: 5 },
  ];

const uso: Record<string, { in: number; out: number }> = {};
const out = (s = '') => console.log(s);

out(`# ¿Opus o Haiku para evaluar cada respuesta? — ${new Date().toISOString().slice(0, 10)}`);
out();
out('Mismo prompt (el de producción), mismos 5 casos, dos modelos.');

for (const modelo of MODELOS) {
  out();
  out(`\n## ${modelo.nombre}  ·  \`${modelo.id}\``);
  uso[modelo.id] = { in: 0, out: 0 };

  for (const c of CASOS) {
    const prompt = PROMPT_EVALUAR(preguntas[c.orden], c.texto, c.seg);
    const r = await cliente.messages.create({
      model: modelo.id, max_tokens: 500, system: ESTILO_CEREBRO,
      messages: [{ role: 'user', content: prompt }],
    });
    uso[modelo.id].in += r.usage.input_tokens;
    uso[modelo.id].out += r.usage.output_tokens;
    const b = r.content.find((x) => x.type === 'text');
    const crudo = b && b.type === 'text' ? b.text.trim() : '';
    let veredicto: { suficiente?: boolean; repregunta?: string } = {};
    let comoFallo = '';
    try {
      veredicto = JSON.parse(crudo);
    } catch {
      veredicto = {};
      comoFallo = [
        `stop_reason=${r.stop_reason} · ${crudo.length} caracteres`,
        `arranca: ${crudo.slice(0, 120)}`,
        `termina: ${crudo.slice(-120)}`,
      ].join('\n  > ');
    }

    out();
    out(`### ${c.titulo}`);
    out(`- Espero: ${c.espero}`);
    out(`- Dijo: **suficiente: ${veredicto.suficiente}**`);
    if (veredicto.repregunta) out(`- Repregunta: > ${veredicto.repregunta}`);
    if (comoFallo) out(`- ⚠️ No parseó → ${comoFallo}`);
  }
}

out();
out('\n─────────────────────────────────────────');
for (const modelo of MODELOS) {
  const t = uso[modelo.id];
  const c = (t.in / 1e6) * modelo.in + (t.out / 1e6) * modelo.out;
  out(`${modelo.nombre}: ${t.in} in · ${t.out} out → USD ${c.toFixed(4)} por estos 5 casos`);
  out(`   a 30 respuestas: **USD ${(c / CASOS.length * 30).toFixed(3)} por narrador**`);
}
