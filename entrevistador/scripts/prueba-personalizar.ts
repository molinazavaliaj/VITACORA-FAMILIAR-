/**
 * ¿Cuánta historia necesita leer el biógrafo para personalizar bien la pregunta?
 *
 * Compara, sobre la vida real del set dorado (Osvaldo, 30 respuestas), tres
 * formas de darle contexto al mismo modelo:
 *
 *   1. las 2 últimas respuestas       (lo barato y plano)
 *   2. las 6 últimas respuestas       (un poco más de memoria)
 *   3. la historia completa           (lo que hacía el saludo que se sacó)
 *
 * Uso:
 *   npx tsx scripts/prueba-personalizar.ts              → las 26 preguntas, modo 1
 *   npx tsx scripts/prueba-personalizar.ts --comparar   → los 3 modos, lado a lado
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..');

for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const MODELO = process.env.MODELO_PERSONALIZAR ?? 'claude-haiku-4-5';
const COMPARAR = process.argv.includes('--comparar');

// ── Material real ──────────────────────────────────────────────────────────
const { narrador } = JSON.parse(readFileSync(resolve(RAIZ, 'fabrica/set-dorado/narrador.json'), 'utf8')) as {
  narrador: { como_le_dicen: string; contexto: Record<string, any> };
};
const contexto = narrador.contexto;
const respuestas: Record<number, string> = Object.fromEntries(
  (JSON.parse(readFileSync(resolve(RAIZ, 'fabrica/set-dorado/respuestas.json'), 'utf8')) as
    { orden: number; texto: string }[]).map((r) => [r.orden, r.texto]),
);
const preguntas: Record<number, string> = {};
for (const m of readFileSync(resolve(RAIZ, 'supabase/seed.sql'), 'utf8').matchAll(/\(null,\s*(\d+),\s*'((?:[^']|'')*)'/g)) {
  preguntas[Number(m[1])] = m[2].replace(/''/g, "'");
}

/**
 * El árbol familiar CON sus etiquetas. Sin esto el prompt recibe una lista de
 * nombres sueltos ("Ramón y Haydée; Élida; los chicos") y el modelo confunde
 * parentescos: en la primera corrida preguntó "¿cómo conoció a Haydée?" como si
 * fuera el amor de su vida, cuando Haydée es su madre.
 */
const ETIQUETA_ARBOL: Record<string, string> = {
  padres: 'Sus padres',
  hermanos: 'Sus hermanos',
  conyuge: 'Su esposa / el amor de su vida',
  hijos: 'Sus hijos',
};

type Modo = { nombre: string; cuantas: number; completo: boolean };

const MODOS: Modo[] = [
  { nombre: '2 últimas respuestas', cuantas: 2, completo: false },
  { nombre: '6 últimas respuestas', cuantas: 6, completo: false },
  { nombre: 'historia completa', cuantas: 0, completo: true },
];

const RECORTE = 900;
/** Órdenes donde la memoria larga se nota: nombres que aparecen temprano y vuelven tarde. */
const ORDENES_COMPARAR = [1, 3, 8, 13, 19, 23, 25, 26];

function ficha(): string {
  const arbol = Object.entries(contexto.arbol ?? {})
    .map(([rol, gente]) => `${ETIQUETA_ARBOL[rol] ?? rol}: ${gente}`)
    .join('. ');
  return [
    `El narrador es ${narrador.como_le_dicen}. ${arbol}`,
    contexto.lugarNacimiento ? `Nació en ${contexto.lugarNacimiento}.` : '',
    contexto.oficio ? `Su oficio: ${contexto.oficio}.` : '',
    contexto.anioNacimiento ? `Año de nacimiento: ${contexto.anioNacimiento}.` : '',
  ].filter(Boolean).join(' ');
}

function contextoPara(orden: number, modo: Modo): string {
  const ordenes = modo.completo
    ? Object.keys(respuestas).map(Number).filter((o) => o < orden).sort((a, b) => a - b)
    : Array.from({ length: modo.cuantas }, (_, i) => orden - 1 - i).filter((o) => o >= 1 && respuestas[o]).reverse();

  const previas = ordenes
    .map((o) => `Lo que contó cuando le preguntamos «${preguntas[o]}»:\n${modo.completo ? respuestas[o] : respuestas[o].slice(0, RECORTE)}`)
    .join('\n\n');

  return `${ficha()}\n\nESTO ES LO QUE YA CONTÓ (lo único que sabés de él):\n${previas || '(todavía no contó nada)'}`;
}

const PROMPT = (original: string, contextoTexto: string) => `Sos el biógrafo de esta persona: le escribís todos los días por WhatsApp y querés que sienta que lo venís escuchando.

${contextoTexto}

LA PREGUNTA QUE LE TOCA HOY (está escrita así en el guion, es genérica):
"${original}"

Reescribila para que se note que lo escuchaste. Reglas:
- Si en lo que ya contó hay un detalle concreto que entra en esta pregunta (una persona, un lugar, una época, algo que dijo), nombralo con sus palabras: "¿Cómo era su casa de Pelliza?" en vez de "¿cómo era su casa?". Usá los nombres tal como aparecen arriba.
- RESPETÁ EL PARENTESCO de cada persona del listado: el amor de su vida / su esposa es quien figura ahí como tal, y sus padres son sus padres. Nunca le pongas a alguien un rol que no tiene.
- CONSERVÁ TODAS LAS PREGUNTAS del original: si tiene dos o tres, la versión nueva tiene que tener las mismas dos o tres. Podés cambiar el orden, no borrar ninguna.
- El AÑO DE NACIMIENTO (si figura arriba) es para anclar la época, no es un lugar: se dice "cuando usted tenía seis años" o "allá por 1945", NUNCA "su infancia en 1939".
- Si ya contó algo que responde a esta pregunta, no se la vuelvas a preguntar: llevá la pregunta al lado que todavía no contó.
- Tratalo de usted, cálido, en castellano rioplatense. Máximo 50 palabras.
- NUNCA inventes nada que él no haya contado. Si no hay nada concreto para enganchar, devolvé la pregunta original sin cambiarle nada.
- No saludes, no expliques nada, no agregues comillas.

Respondé SOLO con la pregunta.`;

// ── Corrida ────────────────────────────────────────────────────────────────
const Anthropic = (await import('@anthropic-ai/sdk')).default;
const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const uso: Record<string, { in: number; out: number; llamadas: number }> = {};
const out = (s = '') => { console.log(s); };

async function generar(orden: number, modo: Modo): Promise<string> {
  const r = await cliente.messages.create({
    model: MODELO, max_tokens: 400,
    messages: [{ role: 'user', content: PROMPT(preguntas[orden], contextoPara(orden, modo)) }],
  });
  const b = r.content.find((x) => x.type === 'text');
  uso[modo.nombre] ??= { in: 0, out: 0, llamadas: 0 };
  uso[modo.nombre].in += r.usage.input_tokens;
  uso[modo.nombre].out += r.usage.output_tokens;
  uso[modo.nombre].llamadas++;
  return b && b.type === 'text' ? b.text.trim().replace(/^["'«]|["'»]$/g, '') : '';
}

function costo(t: { in: number; out: number }, precioIn: number, precioOut: number): string {
  return `USD ${((t.in / 1e6) * precioIn + (t.out / 1e6) * precioOut).toFixed(4)}`;
}

if (COMPARAR) {
  for (const orden of ORDENES_COMPARAR) {
    out(`\n### Orden ${orden}`);
    out(`ORIGINAL DEL GUION: ${preguntas[orden]}`);
    for (const modo of MODOS) out(`— ${modo.nombre}: ${await generar(orden, modo)}`);
  }
} else {
  for (let orden = 1; orden <= 30; orden++) {
    if (!preguntas[orden]) continue;
    const original = preguntas[orden];
    const nueva = await generar(orden, MODOS[0]);
    out(`\n### ${orden}\nORIGINAL:      ${original}\nPERSONALIZADA: ${nueva}`);
  }
}

out('\n─────────────────────────────────────────');
out(`Modelo: ${MODELO}`);
for (const [nombre, t] of Object.entries(uso)) {
  out(`${nombre}: ${t.llamadas} llamadas · ${t.in} tokens in · ${t.out} out`);
  out(`   costo por ESTAS ${t.llamadas} preguntas: Haiku ${costo(t, 1, 5)} · a 30 preguntas: Haiku ${costo({ in: t.in / t.llamadas * 30, out: t.out / t.llamadas * 30 }, 1, 5)}`);
}
