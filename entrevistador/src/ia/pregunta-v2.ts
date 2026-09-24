import type Anthropic from '@anthropic-ai/sdk';
import type { Perfil } from './perfil.js';
import type { Tramo } from './plan-preguntas.js';
import { GUION, type FilaObjetivo, type Bloque } from './guion-v2.js';
import { encargoDelBiografo, perfilEnTexto } from './encargo-entrevista.js';
import { controlarPregunta as controlarSalida, INTENTOS, type Marca } from './control-pregunta.js';
import { MODELO_PREGUNTA } from './modelos-v2.js';

export { perfilEnTexto };
export type { Bloque };

// La pregunta del día (esqueleto v2, 24/09). El guion (`guion-v2.ts`) decide QUÉ se pregunta y si
// entra para esta persona; acá el modelo decide CÓMO preguntárselo: con la ficha corta, las últimas
// respuestas, los temas ya hechos (no sus textos: el prompt no crece) y el tema con sus pormenores.
// Lo que devuelve pasa por los controles (trato, largo, que pregunte, lugar, supuestos), tres
// intentos, marcada si falla el último. La repregunta es un objetivo más: "lo que faltó, junto".

/** Las filas del guion tal como las leen los tests y la fábrica (`contexto-v2.ts`): id, tramo, bloque, tema. */
export const NUCLEO: readonly { id: string; tramo: Tramo | null; bloque: Bloque; tema: string }[] = GUION.map((f) => ({
  id: f.id, tramo: f.tramo, bloque: f.id === 'presentacion' ? 'presentacion' : f.etapa, tema: f.tema,
}));

export type Objetivo =
  | ({ tipo: 'nucleo' } & FilaObjetivo)
  | { tipo: 'variable'; id: string; tramo: Tramo; desde: number; hasta: number; anclas: string[] }
  | { tipo: 'objeto'; id: string; tramo: Tramo }
  | { tipo: 'repregunta'; id: string; tramo: Tramo | null; pregunta: string; falto: string[] };

export const BLOQUES = ['presentacion', 'inicio', 'infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad', 'hoy', 'futuro', 'reflexion'] as const;

export type YaHecha = { id: string; tema: string };

/** Si el objetivo es la presentación: no es una pregunta del día, es la bienvenida. */
export const esPresentacion = (o: Objetivo): boolean => o.tipo === 'nucleo' && o.id === 'presentacion';

/** Cuánto entra de cada ancla de una libre: una línea, no un párrafo. */
const MAX_ANCLA = 160;

/**
 * El texto que le llega al modelo para este objetivo. La presentación reemplaza sus huecos
 * ({TRATOS}, {EDAD}) según el perfil (castellano, si ya sabemos la edad); el objeto pide UNA
 * cosa con foto de esa época sin insistir; la variable lleva el tramo y sus anclas; la
 * repregunta pide junto lo que faltó, sin decir que es una repregunta ni pedir resumen; una
 * fila del guion lleva su tema con los pormenores que puede juntar (dos o tres, en una sola
 * pregunta) y, si pide escena, lo dice.
 */
export function objetivoEnTexto(o: Objetivo, perfil: Perfil): string {
  if (o.tipo === 'objeto') {
    return `Pedile UNA cosa que tenga en casa de esa época (${o.tramo}): un objeto, un papel, una foto vieja, lo que haya guardado. Con una foto, y que cuente de dónde salió. Si no tiene, no pasa nada: no se insiste nunca.`;
  }
  if (o.tipo === 'repregunta') {
    return [
      `Es una repregunta a lo de hoy. Le preguntaste: "${o.pregunta}". De eso faltó: ${o.falto.map((f) => `"${f}"`).join(', ')}.`,
      'Pedilo junto, en UNA sola pregunta corta, como quien sigue la charla. No digas que es una repregunta, no le pidas que resuma ni que repita lo que ya dijo, no abras un tema nuevo.',
    ].join('\n');
  }
  if (o.tipo === 'variable') {
    const cuando = o.tramo === 'hoy' ? 'su vida de hoy' : `su vida entre los ${o.desde} y los ${o.hasta} años`;
    const anclas = o.anclas.map((a) => a.slice(0, MAX_ANCLA));
    return `Algo de ${cuando} que nombró y no contó: ${anclas.map((a) => `"${a}"`).join('; ')}. Preguntale por eso, como una escena o una persona concreta.`;
  }
  if (o.id === 'presentacion') {
    const tratos = perfil.castellano === 'españa' ? 'de tú o de usted' : 'de vos o de usted';
    const edad = perfil.persona.edad || perfil.persona.anioNacimiento ? '' : 'cuántos años tiene, ';
    return o.tema.replace('{TRATOS}', tratos).replace('{EDAD}', edad);
  }
  const pormenores = o.pormenores.length
    ? `\nPormenores que podés juntar en la misma pregunta (elegí dos o tres según lo que ya contó y pedilos juntos, en una sola pregunta): ${o.pormenores.join('; ')}.`
    : '';
  const escena = o.pideEscena ? '\nPedila como una escena: un día, un lugar, quién estaba.' : '';
  return `${o.tema}${pormenores}${escena}`;
}

export const PROMPT_PREGUNTA_V2 = (encargo: string, conversacion: string, yaHechas: string, objetivo: string) => `
${encargo}

LO ÚLTIMO QUE HABLARON (cada respuesta con la pregunta que la originó):
${conversacion || '(todavía no hablaron)'}

TEMAS QUE YA LE PREGUNTASTE (no vuelvas sobre ninguno; si algo de ahí sirve de puente, una frase):
${yaHechas || '(ninguno)'}

LO QUE TE TOCA PREGUNTAR HOY:
${objetivo}

Tu trabajo hoy es decidir cómo preguntarle esto a ESTA persona, con lo que ya sabés: el guion
te da el tema, no el texto. Si algo que contó sirve de puente, usalo; la pregunta va a lo que
todavía no contó.

Respondé SOLO con la pregunta, sin comillas ni saludo.`;

export function armarPromptPregunta(
  perfil: Perfil,
  objetivo: Objetivo,
  conversacion: { pregunta: string; respuesta: string }[],
  yaHechas: YaHecha[],
  evitar: string[] = [],
): string {
  return PROMPT_PREGUNTA_V2(
    encargoDelBiografo(perfil, evitar),
    conversacion.map((c) => `P: ${c.pregunta}\nR: ${c.respuesta}`).join('\n\n'),
    yaHechas.map((q) => `- ${q.id}: ${q.tema}`).join('\n'),
    objetivoEnTexto(objetivo, perfil),
  );
}

/**
 * Escribe la pregunta (o la repregunta, o el objeto). Hasta `INTENTOS` veces: si el control la
 * rechaza, se lo pide de nuevo diciendo por qué (a partir del 2.º intento). Si el último también
 * falla, se manda esa versión igual —mejor una pregunta imperfecta que ninguna— pero con
 * `ok: false` y una `marca` para que quien llama lo sepa (y, si hace falta, avise).
 * `max_tokens` 1500: Opus 5 piensa por defecto y eso cuenta como salida; con 400 la pregunta
 * salía cortada o vacía.
 */
export async function escribirPregunta(
  cliente: Anthropic,
  perfil: Perfil,
  objetivo: Objetivo,
  conversacion: { pregunta: string; respuesta: string }[],
  yaHechas: YaHecha[],
  evitar: string[] = [],
): Promise<{ texto: string; ok: boolean; marca?: Marca; usos: Anthropic.Usage[] }> {
  const prompt = armarPromptPregunta(perfil, objetivo, conversacion, yaHechas, evitar);
  const usos: Anthropic.Usage[] = [];
  let texto = '';
  let ultimo: { control: string; motivo: string } | null = null;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    const contenido = intento === 1 ? prompt : `${prompt}\n\nTu versión anterior no sirvió porque ${ultimo!.motivo}. Escribila de nuevo, cuidando eso.`;
    const r = await cliente.messages.create({ model: MODELO_PREGUNTA, max_tokens: 1500, messages: [{ role: 'user', content: contenido }] });
    usos.push(r.usage);
    const bloque = r.content.find((b) => b.type === 'text');
    texto = (bloque && bloque.type === 'text' ? bloque.text : '').trim().replace(/^["«]|["»]$/g, '');
    const control = controlarSalida(texto, perfil, objetivo);
    if (control.ok) return { texto, ok: true, usos };
    ultimo = control;
  }
  // Campo por campo: `ultimo` es un Rechazo y trae "ok: false" de arrastre, que no pertenece a
  // la Marca (fix ronda 1).
  return { texto, ok: false, marca: { control: ultimo!.control, motivo: ultimo!.motivo, intentos: INTENTOS }, usos };
}
