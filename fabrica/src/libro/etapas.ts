import type Anthropic from '@anthropic-ai/sdk';
import { extraerTexto } from './comun.js';
import { parsearReparto, type CapituloParaRepartir, type Mudanzas, type RespuestaNumerada } from './reparto.js';
import type { Quien } from './encargo.js';

// El libro por etapas de SU vida (decisión de Naza, 23/09 — EXPERIMENTO; producción sigue con los
// capítulos del guion).
//
// Con los capítulos por tema (La infancia, El amor, El oficio…), la vida adulta de alguien de 76
// no tenía dónde caer: quedaba repartida entre "El oficio" y "Los hijos", y todos los libros
// tenían los mismos capítulos. Ahora los capítulos son las etapas de esta persona, con nombres
// que salen de lo que contó ("Tucumán", "La pensión de Once", "Rubén y el taller"), y uno final
// de reflexión.
//
// Dos pasos, los dos con el mismo modelo que escribe el libro:
// 1. `armarEtapas`: lee toda la historia y propone las etapas (nombre, desde, hasta, de qué trata).
// 2. `repartirEnEtapas`: el reparto de siempre (reparto.ts), con las etapas como capítulos. Cada
//    respuesta arranca en la etapa de la época de su pregunta; las de temas que cruzan la vida
//    (el amor, el oficio, las pruebas) arrancan "sin capítulo" y las ubica el modelo.

const MODELO = 'claude-fable-5';
const NOMBRE_REFLEXION = 'Lo que aprendí';

export type Etapa = { nombre: string; desde: number | null; hasta: number | null; deQueTrata: string; reflexion?: boolean };

export const PROMPT_ETAPAS = (nombre: string, historia: string) => `
Estás por escribir el libro de la vida de ${nombre}. Antes hay que decidir sus capítulos: las
etapas de SU vida, en orden.

LO QUE CONTÓ (todas sus respuestas, con la pregunta que las originó):
${historia}

Armá entre 4 y 8 etapas, en orden cronológico, que cubran su vida hasta hoy:
1. Cada etapa es un pedazo de su vida con unidad propia: un lugar, una casa, un trabajo, una
   persona, un cambio que la partió en un antes y un después. Cortá donde cortó su vida, no por
   décadas.
2. El nombre de cada etapa sale de lo que contó: un lugar, una casa, una persona, una frase suya.
   Corto, sin adornos, sin inventar nada que no haya dicho.
3. Para cada una: desde qué edad y hasta cuál (null si no se sabe), y de qué trata en una línea.
4. Una etapa que casi no tiene material no merece capítulo propio: unila a la de al lado.
5. Al final va un capítulo más, de reflexión: lo que aprendió, lo que quiere dejar. Si hay una
   frase suya que lo diga, usala de nombre; si no, "${NOMBRE_REFLEXION}".

Devolvé SOLO un JSON con esta forma:
{"etapas":[{"nombre":"","desde":0,"hasta":12,"deQueTrata":""}],"reflexion":{"nombre":"","deQueTrata":""}}`;

const edad = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);

/** Lee las etapas: al menos dos con nombre, ordenadas por edad, y la reflexión al final. */
export function parsearEtapas(salida: string): { ok: true; etapas: Etapa[] } | { ok: false } {
  let crudo: { etapas?: unknown; reflexion?: { nombre?: unknown; deQueTrata?: unknown } };
  try {
    const limpio = salida.trim();
    crudo = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1));
  } catch {
    return { ok: false };
  }
  if (!Array.isArray(crudo.etapas)) return { ok: false };
  const etapas: Etapa[] = crudo.etapas.map((e: Record<string, unknown>) => ({
    nombre: typeof e?.nombre === 'string' ? e.nombre.trim() : '',
    desde: edad(e?.desde),
    hasta: edad(e?.hasta),
    deQueTrata: typeof e?.deQueTrata === 'string' ? e.deQueTrata.trim() : '',
  }));
  if (etapas.length < 2 || etapas.some((e) => !e.nombre)) return { ok: false };
  // Orden por edad de comienzo; las que no la dicen, donde las puso el modelo.
  const ordenadas = etapas.map((e, i) => ({ e, i })).sort((a, b) =>
    a.e.desde !== null && b.e.desde !== null ? a.e.desde - b.e.desde : a.i - b.i).map((x) => x.e);
  const r = crudo.reflexion;
  ordenadas.push({
    nombre: typeof r?.nombre === 'string' && r.nombre.trim() ? r.nombre.trim() : NOMBRE_REFLEXION,
    desde: null,
    hasta: null,
    deQueTrata: typeof r?.deQueTrata === 'string' ? r.deQueTrata.trim() : 'lo que aprendió, lo que quiere dejar',
    reflexion: true,
  });
  return { ok: true, etapas: ordenadas };
}

/**
 * La época de cada capítulo del guion de hoy: con eso cada respuesta arranca en su etapa. Los
 * que cruzan toda la vida (el amor, el oficio, los hijos, las pruebas) no tienen época: esas
 * respuestas las ubica el modelo. Cuando el guion v2 esté en uso, esto sale del tramo de cada
 * pregunta.
 */
const EPOCA_DEL_CAPITULO_GUION: Record<string, [number, number] | 'reflexion'> = {
  'la infancia': [0, 12],
  'las raices': [0, 12],
  'la juventud': [13, 22],
  'la sabiduria': 'reflexion',
};

const clave = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Las etapas como capítulos del reparto: cada una con las órdenes que arrancan ahí. */
export function capitulosDeEtapas(
  etapas: Etapa[],
  respuestas: { orden: number; capituloGuion: string }[],
): CapituloParaRepartir[] {
  const indiceDe = (capituloGuion: string): number | null => {
    const epoca = EPOCA_DEL_CAPITULO_GUION[clave(capituloGuion)];
    if (!epoca) return null;
    if (epoca === 'reflexion') return etapas.findIndex((e) => e.reflexion);
    const medio = (epoca[0] + epoca[1]) / 2;
    const i = etapas.findIndex((e) => !e.reflexion && e.desde !== null && e.hasta !== null && medio >= e.desde && medio <= e.hasta);
    return i >= 0 ? i : null;
  };
  const capitulos: CapituloParaRepartir[] = etapas.map((e) => ({ nombre: e.nombre, ordenes: [] }));
  for (const r of respuestas) {
    const i = indiceDe(r.capituloGuion);
    if (i !== null && i >= 0 && !capitulos[i].ordenes.includes(r.orden)) capitulos[i].ordenes.push(r.orden);
  }
  return capitulos;
}

export const PROMPT_REPARTO_ETAPAS = (nombre: string, capitulos: string, historia: string) => `
Sos el editor del libro de la vida de ${nombre}. El libro va por las etapas de su vida, y antes
de escribirlo hay que decidir en qué capítulo va cada parte de lo que contó.

LOS CAPÍTULOS:
${capitulos}

LO QUE CONTÓ, oración por oración. Algunas respuestas ya arrancan en un capítulo (el de la época
por la que se le preguntó); las que dicen "sin capítulo" las ubicás vos:
${historia}

Reglas:
1. Cada tramo va a la etapa de la época de la que HABLA, no a la del día en que lo contó.
2. Una historia no se parte: si movés, mové el tramo entero, de la primera a la última oración.
3. Las respuestas "sin capítulo": ubicá TODAS sus oraciones en algún capítulo.
4. Lo que contó como enseñanza o mensaje (no como un hecho de su vida) va al último capítulo.
5. En las respuestas que ya tienen capítulo, mové solo lo que pertenece CLARAMENTE a otra época.

Devolvé SOLO líneas así, una por tramo, sin nada más:
R12.1-R12.10 → 2`;

export function armarPromptRepartoEtapas(
  nombre: string,
  respuestas: RespuestaNumerada[],
  capitulos: CapituloParaRepartir[],
  etapas: Etapa[],
): string {
  const lista = etapas.map((e, i) => {
    const edades = e.desde !== null && e.hasta !== null ? ` (de ${e.desde} a ${e.hasta} años)` : '';
    return `${i + 1}. ${e.nombre}${edades}${e.deQueTrata ? `: ${e.deQueTrata}` : ''}`;
  }).join('\n');
  const capituloDe = (orden: number) => capitulos.findIndex((c) => c.ordenes.includes(orden));
  const historia = respuestas.map((r) => {
    const i = capituloDe(r.orden);
    const cabeza = `[${r.id} · ${i >= 0 ? `capítulo ${i + 1}` : 'sin capítulo'} · "${r.pregunta}"]`;
    return [cabeza, ...r.oraciones.map((o, k) => `${r.id}.${k + 1} ${o}`)].join('\n');
  }).join('\n\n');
  return PROMPT_REPARTO_ETAPAS(nombre, lista, historia);
}

/** Paso 1: las etapas de su vida. */
export async function armarEtapas(
  cliente: Anthropic,
  quien: Quien,
  historia: string,
): Promise<{ resultado: ReturnType<typeof parsearEtapas>; salida: string; usage: Anthropic.Usage }> {
  const stream = cliente.messages.stream({ model: MODELO, max_tokens: 4000, messages: [{ role: 'user', content: PROMPT_ETAPAS(quien.nombre, historia) }] });
  const final = await stream.finalMessage();
  const salida = extraerTexto(final.content as Array<{ type: string; text?: string }>).trim();
  return { resultado: parsearEtapas(salida), salida, usage: final.usage };
}

/** Paso 2: cada oración a su etapa. Lo que igual quede sin ubicar lo devuelve `materialRepartido` en `sinCapitulo`. */
export async function repartirEnEtapas(
  cliente: Anthropic,
  quien: Quien,
  respuestas: RespuestaNumerada[],
  capitulos: CapituloParaRepartir[],
  etapas: Etapa[],
): Promise<{ movidas: Mudanzas; ignoradas: string[]; salida: string; usage: Anthropic.Usage }> {
  const stream = cliente.messages.stream({
    model: MODELO, max_tokens: 12000,
    messages: [{ role: 'user', content: armarPromptRepartoEtapas(quien.nombre, respuestas, capitulos, etapas) }],
  });
  const final = await stream.finalMessage();
  const salida = extraerTexto(final.content as Array<{ type: string; text?: string }>).trim();
  return { ...parsearReparto(salida, respuestas, capitulos), salida, usage: final.usage };
}
