import type Anthropic from '@anthropic-ai/sdk';
import type { Objetivo } from './pregunta-v2.js';
import { objetivoEnLinea } from './evaluar-v2.js';
import { MODELO_EVALUACION, textoDelModelo, SIN_PENSAR } from './modelos-v2.js';

// Ajuste D (24/09, pedido de Naza): el piloto "de cero, reusando respuestas viejas". Naza vuelve a
// hacer el piloto como narrador nuevo, pero cada pregunta que escribe el biógrafo se busca entre sus
// respuestas del piloto anterior: si una ya la contesta, se carga sola. Esto es SOLO la búsqueda:
// una llamada a Sonnet (el modelo de la evaluación, sin pensar), que elige una respuesta vieja o
// ninguna. Ante la duda, ninguna: preguntarle a Naza en vivo no pierde nada; meter una respuesta
// que no va ensucia la ficha y el libro. Lo de la base y el encadenado vive en `scripts/manual-v2.ts`.

/** Una respuesta vieja tal como la ve el modelo: su id corto (R1, R2…), la pregunta que la originó y lo que contestó. */
export type Candidata = { corto: string; pregunta: string; respuesta: string };
export type Cubre = 'entero' | 'parcial' | 'no';

export const MAX_PREGUNTA_VIEJA = 200;
export const MAX_RESPUESTA_VIEJA = 600;

const cortar = (t: string, max: number) => {
  const limpio = t.trim().replace(/\s+/g, ' ');
  return limpio.length > max ? `${limpio.slice(0, max)}…` : limpio;
};

const candidatasEnTexto = (cs: Candidata[]) =>
  cs.map((c) => `[${c.corto}] P: ${cortar(c.pregunta, MAX_PREGUNTA_VIEJA) || '(sin la pregunta)'}\nR: ${cortar(c.respuesta, MAX_RESPUESTA_VIEJA)}`).join('\n\n');

export const PROMPT_REUSAR = (fila: string, pregunta: string, viejas: string) => `
Sos el biógrafo que entrevista a una persona por WhatsApp para el libro de su vida. Esta persona ya
contestó muchas preguntas en una entrevista anterior. Antes de mandarle la pregunta nueva, fijate si
alguna de esas respuestas viejas ya cuenta lo que la pregunta busca: si es así, se usa esa y no se
le pregunta de nuevo.

EL TEMA (lo que el guion quiere que salga):
${fila}

LA PREGUNTA NUEVA:
${pregunta}

LAS RESPUESTAS VIEJAS (cada una con su id, la pregunta que la originó y el comienzo de lo que contestó):
${viejas}

Tu trabajo: elegir UNA respuesta vieja que conteste este tema, o ninguna.
- "entero": cuenta el tema con detalles concretos (una escena, un nombre, un hecho).
- "parcial": cuenta el corazón del tema, aunque le falten pormenores.
- "no": ninguna lo cuenta. Nombrar el tema de pasada no alcanza; hablar de la misma época pero de
  otra cosa, tampoco.
- Una respuesta que solo dice que hoy no puede, o que no quiere contestar, no cuenta nada.
- Ante la duda, ninguna: es mejor preguntarle de nuevo que meter una respuesta que no va.

Respondé SOLO con JSON: {"respuesta": "R3", "cubre": "entero"} o {"respuesta": null, "cubre": "no"}.`;

/** El prompt en el orden de lectura (`render-textos-v2.ts` y los tests lo miran). */
export function armarPromptReusar(objetivo: Objetivo, pregunta: string, candidatas: Candidata[]): string {
  return PROMPT_REUSAR(objetivoEnLinea(objetivo), pregunta, candidatasEnTexto(candidatas));
}

const NINGUNA = { corto: null, cubre: 'no' as Cubre };

/**
 * Tolerante como la evaluación, pero al revés en la duda: si no se entiende, si el id no está entre
 * los válidos (no existe o ya se usó) o si "cubre" no es entero/parcial, NINGUNA.
 */
export function parsearReusar(salida: string, validos: string[]): { corto: string | null; cubre: Cubre } {
  let c: Record<string, unknown>;
  try {
    const limpio = salida.trim();
    const x = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1));
    if (typeof x !== 'object' || x === null) return NINGUNA;
    c = x as Record<string, unknown>;
  } catch {
    return NINGUNA;
  }
  const cubre = c.cubre;
  const corto = typeof c.respuesta === 'string' ? c.respuesta.trim() : null;
  if ((cubre !== 'entero' && cubre !== 'parcial') || !corto || !validos.includes(corto)) return NINGUNA;
  return { corto, cubre };
}

/**
 * Una llamada. Nunca tira: si la salida se corta, viene rota o la llamada se cae, es "ninguna" y la
 * pregunta va a Naza en vivo (acá no se pierde nada). `motivo` dice por qué no hubo, para imprimirlo.
 * Los usos vuelven igual (una salida cortada se cobró).
 */
export async function buscarReusable(
  cliente: Anthropic,
  objetivo: Objetivo,
  pregunta: string,
  candidatas: Candidata[],
): Promise<{ corto: string | null; cubre: Cubre; usos: Anthropic.Usage[]; motivo?: string }> {
  if (!candidatas.length) return { ...NINGUNA, usos: [], motivo: 'no quedan respuestas viejas sin usar' };
  let r: Anthropic.Message;
  try {
    // Sin caché: la lista cambia en cada búsqueda (salen las usadas).
    r = await cliente.messages.create({
      model: MODELO_EVALUACION, max_tokens: 1000, thinking: SIN_PENSAR,
      messages: [{ role: 'user', content: armarPromptReusar(objetivo, pregunta, candidatas) }],
    });
  } catch (err) {
    return { ...NINGUNA, usos: [], motivo: `no pude buscar (${err instanceof Error ? err.message : String(err)})` };
  }
  try {
    const texto = textoDelModelo(r, 'la búsqueda de respuesta vieja');
    return { ...parsearReusar(texto, candidatas.map((c) => c.corto)), usos: [r.usage] };
  } catch (err) {
    return { ...NINGUNA, usos: [r.usage], motivo: err instanceof Error ? err.message : String(err) };
  }
}
