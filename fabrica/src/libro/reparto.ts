import type Anthropic from '@anthropic-ai/sdk';
import { registrarUso } from '../costos.js';
import { obtenerClienteDb } from '../db.js';
import { extraerTexto } from './comun.js';

// El reparto del material (biógrafo v2, 23/09 — EXPERIMENTO, todavía no lo usa producción).
//
// Medido sobre el libro de Joaquín: el 11,6 % de sus palabras eran una frase dicha UNA vez e
// impresa en 2 o 3 capítulos (18,1 % en los borradores, antes del editor). Causa: cada
// capítulo se escribía solo, con la historia completa y la orden de "traer lo que le
// pertenezca"; ninguno sabía qué había contado el otro.
//
// Ahora, antes de escribir, cada respuesta se parte en oraciones numeradas y cada oración vive
// en UN capítulo: por defecto el de su pregunta. El modelo lee toda la historia y dice SOLO qué
// tramos se mudan a otro capítulo. Lo que devuelve y no se entiende se ignora: la oración se
// queda donde estaba. Repetir entre capítulos deja de ser posible por construcción, y ninguna
// historia se pierde por un error del modelo.

const MODELO = 'claude-fable-5';

export type RespuestaParaRepartir = { orden: number; pregunta: string; texto: string };
export type RespuestaNumerada = RespuestaParaRepartir & { id: string; oraciones: string[] };
export type CapituloParaRepartir = { nombre: string; ordenes: number[] };
/** id de oración (`R12.3`) → número de capítulo (1..n) al que se muda. */
export type Mudanzas = Map<string, number>;

/**
 * Oraciones de una transcripción: corta después de . ? ! cuando lo que sigue empieza una
 * oración nueva (mayúscula, ¿, ¡, comillas). "Y bueno... así fue" no se corta: sigue la idea.
 */
export function partirEnOraciones(texto: string): string[] {
  return texto
    .replace(/\s+/g, ' ')
    .split(/(?<=[.?!…])\s+(?=[A-ZÁÉÍÓÚÑÜ¿¡"«“])/u)
    .map((o) => o.trim())
    .filter(Boolean);
}

/** R1..Rn en el orden dado; cada oración es `R{n}.{k}`. */
export function numerarRespuestas(respuestas: RespuestaParaRepartir[]): RespuestaNumerada[] {
  return respuestas.map((r, i) => ({ ...r, id: `R${i + 1}`, oraciones: partirEnOraciones(r.texto) }));
}

const LINEA = /^R(\d+)\.(\d+)(?:\s*-\s*R(\d+)\.(\d+))?\s*(?:→|->)\s*(\d+)\s*$/;

/**
 * Lee la salida del modelo. Cada línea válida muda un tramo de UNA respuesta a un capítulo
 * que existe; una oración se muda una sola vez (gana la primera línea). Todo lo demás va a
 * `ignoradas`, para poder leerlo, y no mueve nada.
 */
export function parsearReparto(
  salida: string,
  respuestas: RespuestaNumerada[],
  capitulos: CapituloParaRepartir[],
): { movidas: Mudanzas; ignoradas: string[] } {
  const movidas: Mudanzas = new Map();
  const ignoradas: string[] = [];
  for (const cruda of salida.split('\n')) {
    const linea = cruda.trim();
    if (!linea || linea === 'NADA') continue;
    const m = LINEA.exec(linea);
    if (!m) { ignoradas.push(linea); continue; }
    const [r, desde, rHasta, hasta, cap] = [Number(m[1]), Number(m[2]), Number(m[3] ?? m[1]), Number(m[4] ?? m[2]), Number(m[5])];
    const respuesta = respuestas[r - 1];
    const valida = respuesta && rHasta === r && desde >= 1 && hasta >= desde && hasta <= respuesta.oraciones.length
      && cap >= 1 && cap <= capitulos.length;
    if (!valida) { ignoradas.push(linea); continue; }
    for (let k = desde; k <= hasta; k++) {
      const id = `R${r}.${k}`;
      if (!movidas.has(id)) movidas.set(id, cap);
    }
  }
  return { movidas, ignoradas };
}

/** El capítulo (1..n) donde vive cada orden: el primero que la tenga. */
function capituloDeCadaOrden(capitulos: CapituloParaRepartir[]): Map<number, number> {
  const mapa = new Map<number, number>();
  capitulos.forEach((c, i) => c.ordenes.forEach((o) => { if (!mapa.has(o)) mapa.set(o, i + 1); }));
  return mapa;
}

/**
 * Las oraciones de una respuesta que van a `capitulo`, unidas. Donde se saltean oraciones
 * (se mudaron a otro lado) queda "[…]": pegar lo de antes con lo de después sin marca sería
 * fundir dos momentos en uno, que es la fusión del hallazgo 40.
 */
function texto(r: RespuestaNumerada, destino: (k: number) => number | undefined, capitulo: number): string {
  const partes: string[] = [];
  let hueco = false;
  r.oraciones.forEach((o, i) => {
    if (destino(i + 1) === capitulo) {
      if (hueco && partes.length) partes.push('[…]');
      partes.push(o);
      hueco = false;
    } else {
      hueco = true;
    }
  });
  return partes.join(' ');
}

/**
 * El material de cada capítulo (en el orden de `capitulos`) con las mudanzas aplicadas: cada
 * oración aparece en exactamente uno. Lo mudado entra marcado "(lo contó respondiendo otra
 * pregunta)", como la marca `tema_de_orden`. Las respuestas de una orden que no está en ningún
 * capítulo y que el reparto no mudó vuelven en `sinCapitulo`: quien llama decide, pero no se
 * pierden calladas.
 */
export function materialRepartido(
  respuestas: RespuestaNumerada[],
  capitulos: CapituloParaRepartir[],
  movidas: Mudanzas,
): { porCapitulo: string[]; sinCapitulo: RespuestaNumerada[] } {
  const propio = capituloDeCadaOrden(capitulos);
  const destinoDe = (r: RespuestaNumerada) => (k: number) => movidas.get(`${r.id}.${k}`) ?? propio.get(r.orden);

  const porCapitulo = capitulos.map((c, i) => {
    const numero = i + 1;
    const bloques: string[] = [];
    for (const orden of c.ordenes) {
      if (propio.get(orden) !== numero) continue;
      for (const r of respuestas.filter((x) => x.orden === orden)) {
        const t = texto(r, destinoDe(r), numero);
        if (t) bloques.push(`P: ${r.pregunta}\nR: ${t}`);
      }
    }
    for (const r of respuestas) {
      if (propio.get(r.orden) === numero) continue;
      const t = texto(r, destinoDe(r), numero);
      if (t) bloques.push(`P: ${r.pregunta} (lo contó respondiendo otra pregunta)\nR: ${t}`);
    }
    return bloques.join('\n\n');
  });

  const sinCapitulo = respuestas.filter((r) => r.oraciones.some((_, k) => destinoDe(r)(k + 1) === undefined));
  return { porCapitulo, sinCapitulo };
}

export const PROMPT_REPARTO = (nombre: string, capitulos: string, historia: string) => `
Sos el editor del libro de la vida de ${nombre}. Antes de que se escriba, tu trabajo es
decidir en qué capítulo va cada parte de lo que contó.

LOS CAPÍTULOS DEL LIBRO, con las preguntas de cada uno:
${capitulos}

LO QUE CONTÓ, oración por oración. Cada respuesta está en el capítulo de su pregunta:
${historia}

Por defecto, todo se queda donde está. Tu única tarea es encontrar los tramos que
pertenecen CLARAMENTE a otro capítulo: un recuerdo de la infancia que apareció
contestando sobre el trabajo, una historia de amor contada en medio de otra cosa.

Reglas:
1. Una historia no se parte: si movés, mové el tramo entero, de la primera a la
   última oración de esa historia.
2. Lo que responde a la pregunta que le hicieron se queda, aunque también encajara
   en otro lado.
3. «Las pruebas» y «La sabiduría» reciben lo que contó como prueba o como
   enseñanza, no cualquier cosa que tenga una lección adentro.
4. Ante la duda, no muevas.

Devolvé SOLO líneas así, una por tramo, sin nada más:
R12.8-R12.10 → 2
Si no hay nada que mover, devolvé: NADA`;

/** Arma los dos bloques del prompt: la lista de capítulos y la historia numerada. */
export function armarPromptReparto(nombre: string, respuestas: RespuestaNumerada[], capitulos: CapituloParaRepartir[]): string {
  const propio = capituloDeCadaOrden(capitulos);
  const listaCapitulos = capitulos.map((c, i) => {
    const preguntas = respuestas.filter((r) => c.ordenes.includes(r.orden)).map((r) => `«${r.pregunta}»`);
    return `${i + 1}. ${c.nombre} — preguntas: ${[...new Set(preguntas)].join(' / ') || '(sin respuestas)'}`;
  }).join('\n');
  const historia = respuestas.map((r) => {
    const cap = propio.get(r.orden);
    const cabeza = `[${r.id} · ${cap ? `capítulo ${cap}` : 'sin capítulo'} · "${r.pregunta}"]`;
    return [cabeza, ...r.oraciones.map((o, k) => `${r.id}.${k + 1} ${o}`)].join('\n');
  }).join('\n\n');
  return PROMPT_REPARTO(nombre, listaCapitulos, historia);
}

/**
 * La llamada al modelo. Si `narrador.id` viene, el costo se anota en su costos.json como
 * `reparto` (la prueba no lo pasa: no escribe nada en Storage).
 */
export async function repartir(
  cliente: Anthropic,
  narrador: { nombre: string; id?: string },
  respuestas: RespuestaNumerada[],
  capitulos: CapituloParaRepartir[],
): Promise<{ movidas: Mudanzas; ignoradas: string[]; salida: string; usage: unknown }> {
  const stream = cliente.messages.stream({
    model: MODELO,
    max_tokens: 8000,
    messages: [{ role: 'user', content: armarPromptReparto(narrador.nombre, respuestas, capitulos) }],
  });
  const final = await stream.finalMessage();
  if (narrador.id) await registrarUso(obtenerClienteDb, narrador.id, { modelo: MODELO, paso: 'reparto', usage: final.usage });
  const salida = extraerTexto(final.content as Array<{ type: string; text?: string }>).trim();
  return { ...parsearReparto(salida, respuestas, capitulos), salida, usage: final.usage };
}
