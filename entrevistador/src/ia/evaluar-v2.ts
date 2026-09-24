import type Anthropic from '@anthropic-ai/sdk';
import type { Perfil } from './perfil.js';
import { encargoDelBiografo } from './encargo-entrevista.js';
import type { Objetivo } from './pregunta-v2.js';
import { MODELO_EVALUACION, MODELO_PEDIDOS } from './modelos-v2.js';

// La evaluación del esqueleto v2 (24/09). Decide si con la respuesta hay con qué escribir la página
// del día y, si no, QUÉ FALTÓ de la fila (sus pormenores): la repregunta la escribe Opus después
// (`escribirPregunta` con un objetivo `repregunta`), junta y en una sola pregunta. Ya no "ahonda en
// el pormenor" (N37). Sonnet: es un juicio con la ficha, no un texto para la persona.
//
// Para las respuestas a repreguntas y a objetos no se evalúa si alcanza (no se vuelve a repreguntar):
// `evaluarPedidos` (Haiku, prompt corto) solo busca reserva, tema a dejar, "hoy no" y "no quiero seguir" (N29).

export type EvaluacionV2 = {
  suficiente: boolean;
  /** Los pormenores de la fila que quedaron afuera, en pocas palabras (hasta 4). */
  falto: string[];
  reservado?: boolean;
  reservadoTramo?: string;
  dejarTema?: string;
  hoyNo?: boolean;
  quiereParar?: boolean;
};
export type Pedidos = Pick<EvaluacionV2, 'reservado' | 'reservadoTramo' | 'dejarTema' | 'hoyNo' | 'quiereParar'>;

const PEDIDOS = `- Si pidió cambiar de tema ("vamos por otro lado", "prefiero no hablar de eso"): "dejarTema" con el
  tema en pocas palabras. Esquivar no es pedir.
- Si dice que HOY no puede ("hoy no", "mañana te contesto", "estoy cansado hoy"): "hoyNo": true.
- Si dice que no quiere seguir con la entrevista ("no quiero seguir", "dejemos esto", "no me
  manden más"): "quiereParar": true. No lo convenzas.
- Si pidió que algo no vaya al libro ("esto no lo pongas", "que quede para mí"): "reservado": true,
  y si es una parte, "reservadoTramo" con ese tramo COPIADO TEXTUAL. Ante la duda, reservá.`;

const objetivoEnLinea = (o: Objetivo): string =>
  o.tipo === 'nucleo' ? `${o.tema}${o.pormenores.length ? `\nPormenores de la fila: ${o.pormenores.join('; ')}.` : ''}`
    : o.tipo === 'variable' ? `Algo que nombró y no contó: ${o.anclas.join('; ')}.`
      : o.tipo === 'objeto' ? 'Un objeto de esa época, con foto.'
        : `Repregunta: ${o.falto.join('; ')}.`;

export const PROMPT_EVALUAR_V2 = (encargo: string, fila: string, pregunta: string, respuesta: string, segundos: number, conversacion: string) => `
${encargo}

LO ÚLTIMO QUE HABLARON (cada respuesta con la pregunta que la originó):
${conversacion || '(es la primera respuesta)'}

EL TEMA DE HOY (lo que el guion quería que saliera):
${fila}

LA PREGUNTA DE HOY:
${pregunta}

LO QUE CONTESTÓ (duró ${segundos} segundos):
${respuesta}

Tu trabajo: decidir si con esta respuesta hay con qué escribir la página de hoy del libro y, si no,
decir QUÉ FALTÓ del tema.

- ALCANZA si hay con qué escribir: dos o tres detalles concretos, con al menos una escena o un
  nombre. El largo no decide: diez segundos pueden valer un capítulo. Si alcanza, no pidas más por
  costumbre, y "falto" queda vacío.
- NO ALCANZA solo si hay poco material (generalidades sin una escena, sin un nombre, sin un hecho),
  o si contó algo fuerte y lo dejó en una frase. Entonces "falto": los pormenores del tema que
  quedaron afuera, tal como están en la fila, hasta 4. Nunca un tema nuevo. Nunca un detalle de un
  detalle: lo que faltó del TEMA, no más precisión sobre lo que ya contó.
- Si dijo "esto ya te lo conté" o parecido: alcanza, "falto" vacío.
- Si se fue a otro tema, está bien: no se lo reencuadra.
${PEDIDOS}

Respondé SOLO con JSON: {"suficiente": true, "falto": []} o {"suficiente": false, "falto": ["..."]},
y sumá "dejarTema", "reservado", "reservadoTramo", "hoyNo" y "quiereParar" cuando corresponda.`;

export function armarPromptEvaluar(
  perfil: Perfil,
  objetivo: Objetivo,
  pregunta: string,
  respuesta: string,
  segundos: number,
  conversacion: { pregunta: string; respuesta: string }[],
  evitar: string[],
): string {
  return PROMPT_EVALUAR_V2(
    encargoDelBiografo(perfil, evitar),
    objetivoEnLinea(objetivo),
    pregunta,
    respuesta,
    segundos,
    conversacion.map((c) => `P: ${c.pregunta}\nR: ${c.respuesta}`).join('\n\n'),
  );
}

const MAX_FALTO = 4;

function leerJson(salida: string): Record<string, unknown> | null {
  try {
    const limpio = salida.trim();
    const c = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1));
    return typeof c === 'object' && c !== null ? (c as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function leerPedidos(c: Record<string, unknown>): Pedidos {
  const p: Pedidos = {};
  if (c.reservado === true) p.reservado = true;
  if (typeof c.reservadoTramo === 'string' && c.reservadoTramo.trim()) p.reservadoTramo = c.reservadoTramo.trim();
  if (typeof c.dejarTema === 'string' && c.dejarTema.trim()) p.dejarTema = c.dejarTema.trim();
  if (c.hoyNo === true) p.hoyNo = true;
  if (c.quiereParar === true) p.quiereParar = true;
  return p;
}

/** Campo por campo. Si viene roto, alcanza (el día no se corta) y no hay nada que pedir. */
export function parsearEvaluacion(salida: string): EvaluacionV2 {
  const c = leerJson(salida);
  if (!c || typeof c.suficiente !== 'boolean') return { suficiente: true, falto: [] };
  const falto = Array.isArray(c.falto) ? c.falto.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim()).slice(0, MAX_FALTO) : [];
  return { suficiente: c.suficiente, falto: c.suficiente ? [] : falto, ...leerPedidos(c) };
}

export const DIAS_SIN_REPREGUNTAR = 3;

/** Cansancio: si las dos últimas repreguntas quedaron sin contestar, no se repregunta por unos días. */
export function hayCansancio(ultimasRepreguntas: { contestada: boolean }[]): boolean {
  const dos = ultimasRepreguntas.slice(-2);
  return dos.length === 2 && dos.every((r) => !r.contestada);
}

/** Una llamada. Sin reintentos: no hay texto para la persona que controlar. */
export async function evaluarV2(
  cliente: Anthropic,
  perfil: Perfil,
  objetivo: Objetivo,
  pregunta: string,
  respuesta: string,
  segundos: number,
  conversacion: { pregunta: string; respuesta: string }[],
  evitar: string[],
): Promise<{ evaluacion: EvaluacionV2; usos: Anthropic.Usage[] }> {
  const r = await cliente.messages.create({ model: MODELO_EVALUACION, max_tokens: 1000, messages: [{ role: 'user', content: armarPromptEvaluar(perfil, objetivo, pregunta, respuesta, segundos, conversacion, evitar) }] });
  const bloque = r.content.find((b) => b.type === 'text');
  return { evaluacion: parsearEvaluacion(bloque && bloque.type === 'text' ? bloque.text : ''), usos: [r.usage] };
}

export const PROMPT_PEDIDOS = (respuesta: string) => `
Sos el biógrafo que entrevista a una persona por WhatsApp para el libro de su vida. Esta es su
respuesta a una repregunta o a un pedido de foto. No tenés que juzgar si alcanza: solo fijate si
PIDE algo.

LO QUE CONTESTÓ:
${respuesta}

${PEDIDOS}

Respondé SOLO con JSON con las claves que correspondan ({} si no pide nada): {"reservado": true,
"reservadoTramo": "...", "dejarTema": "...", "hoyNo": true, "quiereParar": true}.`;

export function armarPromptPedidos(respuesta: string): string {
  return PROMPT_PEDIDOS(respuesta);
}

export async function evaluarPedidos(cliente: Anthropic, respuesta: string): Promise<{ pedidos: Pedidos; usos: Anthropic.Usage[] }> {
  const r = await cliente.messages.create({ model: MODELO_PEDIDOS, max_tokens: 300, messages: [{ role: 'user', content: armarPromptPedidos(respuesta) }] });
  const bloque = r.content.find((b) => b.type === 'text');
  const c = leerJson(bloque && bloque.type === 'text' ? bloque.text : '');
  return { pedidos: c ? leerPedidos(c) : {}, usos: [r.usage] };
}
