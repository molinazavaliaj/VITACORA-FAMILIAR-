import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { armarHistoria } from '../db/historia.js';
import { capitulosDe, tieneAdaptativas, ultimoOrden } from '../db/guion.js';
import { textoEvitar } from './evitar.js';

const MODELO = 'claude-opus-5';
/** Cuántas escribe el biógrafo al final. Se insertan después de la última que exista (§11.2). */
export const CANTIDAD = 4;
/**
 * @deprecated Desde el 14/09 las adaptativas van en N+1..N+4 (N = la última del
 * guion propio), no fijas en 27-30. Quedan solo para `scripts/manual.ts` (Naza),
 * que sigue asumiendo el guion de 26. No usar en código nuevo.
 */
export const PRIMERA_ADAPTATIVA = 27;
export const ULTIMA_ADAPTATIVA = 30;
// Con 2000 el modelo se quedaba sin lugar y devolvía un JSON cortado por la mitad:
// JSON.parse explotaba y el narrador quedaba sin las preguntas 27-30 justo el día 26.
export const MAX_TOKENS = 4000;
const INTENTOS = 2;

export const PROMPT_ADAPTATIVAS = (nombre: string, historiaCompleta: string, capitulos: string[], cuantasContestadas = 26, evitar = '') => `
Leíste la historia de vida completa que ${nombre} contó en ${cuantasContestadas} entrevistas
(el guion capítulo por capítulo, y su vida entera resumida en cinco minutos):

${historiaCompleta}
${evitar}
Sos su biógrafo y te quedan exactamente 4 preguntas para completar el libro. Buscá:
- Personas que nombró varias veces pero nunca exploró (un hermano, un amigo, un maestro).
- Épocas o momentos con huecos evidentes.
- Temas emocionales que tocó de pasada y merecen profundidad.
- Algo que claramente disfrutó contar y da para más.

Generá las 4 preguntas en el orden en que se las harías. Cada una debe sonar a que LO ESCUCHASTE
(referí lo que él contó), tratarlo de usted, y ser una sola pregunta clara.

MUY IMPORTANTE — las va a leer en el celular una persona mayor:
- Máximo 45 palabras cada pregunta. Las del guion tienen ese largo; respetalo.
- Un solo detalle concreto para demostrar que lo escuchaste, no una lista de todo lo que contó.
- Una sola pregunta por cada una, no tres encadenadas.

Capítulos disponibles del libro: ${capitulos.join(', ')}.

Respondé SOLO con JSON: [{"texto": "...", "capitulo": "..."}, ...] (exactamente 4).`;

type PreguntaGenerada = { texto: string; capitulo: string };

/** Tolera que el modelo envuelva el JSON en ```json ... ``` y valida que vengan las 4. */
export function parsearCuatro(crudo: string): PreguntaGenerada[] {
  const limpio = crudo.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const lista = JSON.parse(limpio) as PreguntaGenerada[];
  if (!Array.isArray(lista) || lista.length < CANTIDAD) {
    throw new Error(`esperaba ${CANTIDAD} preguntas y vinieron ${Array.isArray(lista) ? lista.length : 0}`);
  }
  for (const p of lista.slice(0, CANTIDAD)) {
    if (!p?.texto?.trim() || !p?.capitulo?.trim()) throw new Error('una pregunta vino sin texto o sin capítulo');
  }
  return lista.slice(0, CANTIDAD);
}

/**
 * Genera las 4 preguntas finales personalizadas, a continuación de la última
 * que exista para este narrador (§11.2: la familia puede haber sacado o sumado
 * preguntas, así que no es "27-30", es "N+1..N+4"). Idempotente: si ya hay
 * adaptativas, no hace nada.
 */
export async function generarPreguntasAdaptativas(narradorId: string): Promise<void> {
  if (await tieneAdaptativas(narradorId)) return;

  const { data: narrador } = await db.from('narradores')
    .select('como_le_dicen, contexto').eq('id', narradorId).maybeSingle();
  const n = narrador as { como_le_dicen?: string; contexto?: Record<string, unknown> } | null;
  const comoLeDicen = n?.como_le_dicen ?? 'el narrador';

  const capitulos = await capitulosDe(narradorId);
  const desde = (await ultimoOrden(narradorId)) + 1;

  const historia = await armarHistoria(narradorId);
  const prompt = PROMPT_ADAPTATIVAS(comoLeDicen, historia, capitulos, desde - 1, textoEvitar(n?.contexto));

  // Estas 4 preguntas son el final del libro: si el modelo devuelve algo raro,
  // reintentamos antes de dejar al narrador sin preguntas después de 26 días.
  let preguntas: PreguntaGenerada[] | null = null;
  let ultimoError: unknown = null;
  for (let intento = 1; intento <= INTENTOS && !preguntas; intento++) {
    try {
      const respuesta = await cliente().messages.create({
        model: MODELO, max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      });
      const bloque = respuesta.content.find((b) => b.type === 'text');
      if (!bloque || bloque.type !== 'text') throw new Error('Claude no devolvió texto');
      preguntas = parsearCuatro(bloque.text.trim());
    } catch (err) {
      ultimoError = err;
      console.error(`Adaptativas del narrador ${narradorId}: falló el intento ${intento}/${INTENTOS}:`, err);
    }
  }
  if (!preguntas) throw new Error(`No pude generar las preguntas adaptativas: ${ultimoError}`);

  const filas = preguntas.map((p, i) => ({
    narrador_id: narradorId,
    orden: desde + i,
    texto: p.texto,
    capitulo: p.capitulo,
    tipo: 'adaptativa',
  }));
  const { error } = await db.from('preguntas').insert(filas);
  if (error) throw new Error(`No pude guardar las preguntas adaptativas: ${error.message}`);
}

let _cliente: Anthropic | null = null;
const cliente = () => (_cliente ??= new Anthropic({ apiKey: cargarConfig().anthropicKey }));
