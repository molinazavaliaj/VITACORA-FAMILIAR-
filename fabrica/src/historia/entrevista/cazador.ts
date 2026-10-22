// El cazador de escenas de historia. Copia de src/v3/entrevista/cazador.ts
// (V3: Naza, 01/10; plan docs/v3/entrevista/cazador/plan-codigo.md, B1) con lo
// que cambia en historia (docs/historia/banco.md, regla 9; spec §4.2): al
// cerrar un bloque, Opus lee sus respuestas y elige; el código toma COMO MUCHO
// UNA (MAX_ELEGIDAS) y nunca repregunta dos veces la misma respuesta. Controla
// lo que devuelve (cita textual, una sola pregunta corta, sin tiempos
// relativos) y descarta lo que falla. Lo que pasa entra a la cola de
// repreguntas (`EstadoEntrevista.repreguntas`, flujo.ts).
//
// Sin lo de V3: los bloques de la vida entera con sus momentos
// (BLOQUES_CAZADOR*), el bloque Hoy (14), el bloque final 15 y las 8 que
// piden un día. El nombre del bloque sale de banco.md y "lo que viene" son
// las preguntas que faltan del banco del narrador (las de su tema).
//
// Todo es puro salvo `cazarBloque`, que llama al modelo por un cliente que se
// le pasa (el SDK de Anthropic, o uno falso en los tests: ningún test llama a
// la API). El prompt lo genera `scripts/historia-cazador-json.ts`: el de
// docs/historia/cazador/ si existe y, mientras no, el de V3; un test compara.

import promptJson from './cazador-prompt.json' with { type: 'json' };
import promptCaJson from './cazador-prompt-ca.json' with { type: 'json' };
import promptEsEsJson from './cazador-prompt-es-ES.json' with { type: 'json' };
import { NOMBRES_BLOQUE, preguntaPorId, textosDe, type PreguntaEntrevista } from './banco.js';
import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';
import { claveRepregunta, type Repregunta, type Respuestas } from './flujo.js';
import type { FichaTexto } from './texto.js';
import { interpretar, leerBoton } from './respuesta.js';

export { extraerPrompt } from './cazador-prompt-md.js';

// ---------------------------------------------------------------- constantes

/** Opus 5.5 con pensamiento medio, como en V3 (Naza, 07/10). */
export const MODELO_CAZADOR = 'claude-opus-5-5';
export const ESFUERZO_CAZADOR = 'medium';
export const MAX_TOKENS_CAZADOR = 16000;
/** USD por token: 4 por millón de entrada, 20 por millón de salida (Opus 5.5). */
export const PRECIO_CAZADOR = { entrada: 4 / 1e6, salida: 20 / 1e6 };
/** Tope de gasto del cazador por entrevista (como en V3): alcanzado, no se llama más y la entrevista sigue sin cazador. */
export const TOPE_GASTO_USD = 3;
/**
 * Cuántas elegidas por bloque se miran: una (spec §4.2, "pide una vez un
 * momento concreto"; plan, Task 1.4). El prompt de V3 dice "como mucho DOS,
 * la más pesada primero": se toma la primera.
 */
export const MAX_ELEGIDAS = 1;
export const MAX_PALABRAS_PREGUNTA = 45;

/** El prompt en castellano rioplatense, tal cual la sección "## Prompt" de su md. */
export const PROMPT_CAZADOR: string = (promptJson as { prompt: string }).prompt;

/** El prompt según el idioma de la entrevista (cada json dice de qué md salió). */
export const PROMPT_CAZADOR_DE: Readonly<Record<Idioma, string>> = {
  'es-AR': PROMPT_CAZADOR,
  ca: (promptCaJson as { prompt: string }).prompt,
  'es-ES': (promptEsEsJson as { prompt: string }).prompt,
};


/** ¿El bloque tiene la pregunta del cierre (HC10)? Ese no se caza: después no hay dónde repreguntar. */
export function esBloqueDelCierre(bloque: number, banco: readonly PreguntaEntrevista[]): boolean {
  return banco.some((p) => p.bloque === bloque && p.clase === 'cierre');
}

/**
 * Lo que el banco del narrador va a preguntar en los bloques que faltan
 * (después de `bloque`), como se le va a mandar: lo que llega solo no se
 * repregunta. El cierre no cuenta (pide otra cosa: qué le diría hoy).
 */
export function loQueViene(bloque: number, banco: readonly PreguntaEntrevista[], textoPregunta: (id: string) => string): string[] {
  return banco.filter((p) => p.bloque > bloque && p.clase !== 'cierre').map((p) => textoPregunta(p.id));
}

// ---------------------------------------------------------------- entrada

/** Una respuesta del bloque como la ve el modelo. `id` es el ID del banco. */
export type RespuestaParaCazar = { id: string; pregunta: string; texto: string; pedidoDia: boolean; paso: boolean };

/**
 * Las respuestas del bloque que se le pasan al cazador, en el orden en que
 * llegaron. Solo las preguntas del banco (FOTO-H, las de quien regala y las
 * repreguntas no se cazan); un botón sin texto no va; de un botón con audio
 * atrás va el audio. `textoPregunta` da la pregunta como se mandó. En
 * historia ninguna pide un día con segunda oportunidad: `pedidoDia` va en
 * false (el prompt de V3 lo lee).
 */
export function respuestasParaCazar(respuestas: Respuestas, bloque: number, textoPregunta: (id: string) => string, idioma: Idioma = IDIOMA_POR_DEFECTO): RespuestaParaCazar[] {
  const out: RespuestaParaCazar[] = [];
  for (const [clave, crudo] of respuestas) {
    const p = preguntaPorId(clave, idioma);
    if (!p || p.bloque !== bloque) continue;
    const texto = leerBoton(crudo).resto.trim();
    if (!texto) continue;
    out.push({ id: clave, pregunta: textoPregunta(clave), texto, pedidoDia: false, paso: interpretar(p, crudo, idioma) === 'paso' });
  }
  return out;
}

/** La ficha que ve el cazador cuando no hay más que nombre y género (la página de prueba y las simulaciones). */
export function fichaCorta(f: Pick<FichaTexto, 'nombre' | 'genero'>): string {
  const genero = f.genero === 'varon' ? 'varón' : f.genero;
  return `<ficha>\nnombre: ${f.nombre}\ngénero: ${genero}\n</ficha>`;
}

export type EntradaCazador = {
  /** La ficha ya armada (`<ficha>…</ficha>`). */
  ficha: string;
  bloque: number;
  respuestas: readonly RespuestaParaCazar[];
  yaRepreguntado: readonly Repregunta[];
  escenasContadas: readonly string[];
  /** Lo que el banco del narrador va a preguntar después (`loQueViene`). */
  loQueViene: readonly string[];
};

/**
 * El mensaje del usuario, en el orden del de V3 (scripts/v3-cazador-prueba-v3.ts):
 * ficha, bloque, ya_repreguntado, escenas_contadas, lo_que_viene y al final
 * las respuestas del bloque. El nombre del bloque es el de banco.md.
 */
export function armarEntrada(e: EntradaCazador): string {
  const respuestas = e.respuestas
    .map((r) => {
      const marcas = (r.pedidoDia ? ' pedido_dia="si"' : '') + (r.paso ? ' paso="si"' : '');
      return `<respuesta id="${r.id}"${marcas}>\n<pregunta>${r.pregunta}</pregunta>\n<texto>${r.texto}</texto>\n</respuesta>`;
    })
    .join('\n');
  return [
    e.ficha,
    `<bloque>${NOMBRES_BLOQUE[e.bloque] ?? `Bloque ${e.bloque}`}</bloque>`,
    `<ya_repreguntado>\n${e.yaRepreguntado.map((r) => `${r.origen}: ${r.tema}`).join('\n')}\n</ya_repreguntado>`,
    `<escenas_contadas>\n${e.escenasContadas.join('\n')}\n</escenas_contadas>`,
    `<lo_que_viene>\n${e.loQueViene.join('\n')}\n</lo_que_viene>`,
    `<respuestas_del_bloque>\n${respuestas}\n</respuestas_del_bloque>`,
  ].join('\n\n');
}

// ---------------------------------------------------------------- salida

/** Lo que devuelve el modelo por cada elegida (por_que y ya_contado_chequeo son para auditar). */
export type Elegida = { id: string; cita: string; pregunta: string; tema?: string; por_que?: string; ya_contado_chequeo?: string };

/** El JSON de la salida (aunque venga con texto alrededor); undefined si no se puede leer. */
export function leerSalida(texto: string): { elegidas: Elegida[]; escenasContadas: string[] } | undefined {
  const desde = texto.indexOf('{');
  const hasta = texto.lastIndexOf('}');
  if (desde < 0 || hasta < desde) return undefined;
  try {
    const json = JSON.parse(texto.slice(desde, hasta + 1)) as { elegidas?: unknown; escenas_contadas_bloque?: unknown };
    // Revisión del 01/10: una elegida con forma rota (null, sin cita o pregunta de texto) se descarta acá; si no, rompía los controles.
    // 04/10: sin "elegidas" (o con otro nombre) no es "cero elegidas": es una salida que no se entiende, y se anota.
    if (!Array.isArray(json.elegidas)) return undefined;
    const elegidas = (json.elegidas as unknown[]).filter(esElegida);
    const escenas = Array.isArray(json.escenas_contadas_bloque) ? (json.escenas_contadas_bloque as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    return { elegidas, escenasContadas: escenas };
  } catch {
    return undefined;
  }
}

function esElegida(x: unknown): x is Elegida {
  if (typeof x !== 'object' || x === null) return false;
  const e = x as Record<string, unknown>;
  return typeof e.id === 'string' && typeof e.cita === 'string' && typeof e.pregunta === 'string';
}

const TIEMPO_RELATIVO = /\b(ayer|anoche|hace un rato|recién|recien|la otra vez|esta semana)\b/i;
/** En catalán (prompt-v3-1-ca.md): "ahir", "ahir a la nit", "fa una estona", "ara mateix", "fa un moment", "l'altre dia", "l'altra vegada", "aquesta setmana". */
const TIEMPO_RELATIVO_CA = /(?<![\p{L}])(ahir|fa una estona|ara mateix|fa un moment|l'altre dia|l'altra vegada|aquesta setmana)(?![\p{L}])/iu;
/** En castellano de España (prompt-v3-1-es-ES.md), además de los de siempre: "el otro día", "hace un momento", "ahora mismo", "anteayer". */
const TIEMPO_RELATIVO_ES = /(?<![\p{L}])(el otro d[ií]a|hace un momento|ahora mismo|anteayer|antes de ayer)(?![\p{L}])/iu;
/** Lo que cada idioma suma a TIEMPO_RELATIVO (que vale para todos). */
const TIEMPO_RELATIVO_DE: Readonly<Record<Idioma, RegExp | undefined>> = { 'es-AR': undefined, ca: TIEMPO_RELATIVO_CA, 'es-ES': TIEMPO_RELATIVO_ES };
/** "Hoy": historia es un capítulo que ya pasó y no tiene bloque Hoy, así que nunca vale en la pregunta. */
const HOY_DE: Readonly<Record<Idioma, RegExp>> = { 'es-AR': /\bhoy\b/i, ca: /(?<![\p{L}])(avui|hoy)(?![\p{L}])/iu, 'es-ES': /\bhoy\b/i };
const sinMarcas = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-zñ0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Los controles de código de V3 (probados contra la API): la cita es textual
 * y contigua de esa respuesta; la pregunta lleva un solo "?", hasta 45
 * palabras, sin "ayer/anoche/hace un rato/recién/la otra vez/esta semana" ni
 * "hoy" (V3 dejaba "hoy" en su bloque Hoy; historia no tiene).
 */
export function controlarElegida(e: Pick<Elegida, 'cita' | 'pregunta'>, respuesta: string, idioma: Idioma = IDIOMA_POR_DEFECTO): string[] {
  const fallas: string[] = [];
  const cita = sinMarcas(e.cita ?? '');
  if (!cita || !` ${sinMarcas(respuesta)} `.includes(` ${cita} `)) fallas.push('la cita no es textual');
  const pregunta = e.pregunta ?? '';
  if ((pregunta.match(/\?/g) ?? []).length !== 1) fallas.push('la pregunta no tiene un solo "?"');
  if (pregunta.split(/\s+/).filter(Boolean).length > MAX_PALABRAS_PREGUNTA) fallas.push(`pregunta de más de ${MAX_PALABRAS_PREGUNTA} palabras`);
  // En catalán, el apóstrofo curvo (’) cuenta como el recto, y "d'ahir" es "de ayer" (revisión del 04/10).
  const recta = pregunta.replace(/’/g, "'");
  const relativo = TIEMPO_RELATIVO.test(pregunta) || (TIEMPO_RELATIVO_DE[idioma]?.test(recta) ?? false);
  if (relativo || HOY_DE[idioma].test(recta)) fallas.push('tiempo relativo');
  return fallas;
}

/** Una elegida descartada, con por qué (se registra; no se manda). */
export type Descartada = { id: string; cita: string; pregunta: string; tema?: string; fallas: string[] };

/**
 * Pasa las elegidas (hasta MAX_ELEGIDAS, una) por los controles: además de los de
 * `controlarElegida`, la respuesta tiene que ser de este bloque, no puede
 * haber dos de la misma ni una ya repreguntada. La que falla se descarta
 * (plan, B1: hoy no se reintenta).
 */
export function revisarElegidas(
  elegidas: readonly Elegida[],
  delBloque: readonly RespuestaParaCazar[],
  bloque: number,
  yaRepreguntado: readonly Repregunta[],
  idioma: Idioma = IDIOMA_POR_DEFECTO,
): { repreguntas: Repregunta[]; descartadas: Descartada[] } {
  const repreguntas: Repregunta[] = [];
  const descartadas: Descartada[] = [];
  const vistas = new Set<string>();
  for (const e of elegidas.slice(0, MAX_ELEGIDAS)) {
    const suya = delBloque.find((r) => r.id === e.id);
    const fallas = controlarElegida(e, suya?.texto ?? '', idioma);
    if (!suya) fallas.push('la respuesta no es de este bloque');
    if (vistas.has(e.id)) fallas.push('dos de la misma respuesta');
    else if (yaRepreguntado.some((r) => r.origen === e.id)) fallas.push('ya repreguntado');
    vistas.add(e.id);
    if (fallas.length > 0) descartadas.push({ id: e.id, cita: e.cita, pregunta: e.pregunta, ...(e.tema !== undefined ? { tema: e.tema } : {}), fallas });
    else repreguntas.push({ clave: claveRepregunta(e.id), origen: e.id, bloque, cita: e.cita, pregunta: e.pregunta, tema: e.tema ?? '' });
  }
  return { repreguntas, descartadas };
}

/**
 * El mensaje que le llega al narrador: mitad fijo, mitad escrito por el
 * modelo (V3, Naza, 01/10). En castellano rioplatense vive acá, como en V3;
 * en otro idioma sale de docs/historia/idiomas/ (copiado de V3). Va con
 * el botón [Ya lo conté todo] (BOTON_YA_LO_CONTE en flujo.ts).
 */
export function mensajeRepregunta(e: Pick<Repregunta, 'cita' | 'pregunta'>, idioma: Idioma = IDIOMA_POR_DEFECTO): string {
  // Las dos marcas en una sola pasada: si la cita dice "{pregunta}", no se pisa.
  if (idioma !== 'es-AR') return textosDe(idioma).repregunta.mensaje.replace(/\{(cita|pregunta)\}/g, (_m, k: string) => (k === 'cita' ? e.cita : e.pregunta));
  return `Me quedé pensando en algo que me contaste: «${e.cita}». ${e.pregunta} Y si no te vuelve, o ya me lo contaste todo, decímelo nomás y seguimos con otra.`;
}

// ---------------------------------------------------------------- la llamada

/** Lo que se le pide al modelo (el subconjunto de messages.create que usamos). */
export type PedidoModelo = {
  model: string;
  max_tokens: number;
  /** Opus 5.5 no deja apagar el pensamiento: se regula con el esfuerzo. */
  thinking: { type: 'adaptive' };
  output_config: { effort: typeof ESFUERZO_CAZADOR };
  system: string;
  messages: { role: 'user'; content: string }[];
};

/** El cliente: el SDK de Anthropic cumple esta forma; los tests pasan uno falso. */
export type ClienteModelo = {
  messages: {
    create(p: PedidoModelo): Promise<{ content: readonly { type: string; text?: string }[]; usage: { input_tokens: number; output_tokens: number } }>;
  };
};

export function costoUsd(usage: { input_tokens: number; output_tokens: number }): number {
  return usage.input_tokens * PRECIO_CAZADOR.entrada + usage.output_tokens * PRECIO_CAZADOR.salida;
}

export type PedidoCaza = {
  cliente: ClienteModelo;
  /** La ficha ya armada (`fichaCorta`, o la del pedido). */
  ficha: string;
  /** El bloque que acaba de cerrar. */
  bloque: number;
  /** El banco del narrador (`bancoHistoria`): de ahí salen el cierre y lo que viene. */
  banco: readonly PreguntaEntrevista[];
  /** Todas las respuestas de la entrevista hasta acá, en orden. */
  respuestas: Respuestas;
  /** La pregunta como se le mandó o se le va a mandar, renderizada (por ID del banco). */
  textoPregunta: (id: string) => string;
  /** Las repreguntas que ya entraron a la cola (mandadas o no). */
  yaRepreguntado: readonly Repregunta[];
  /** Las escenas que el cazador ya vio bien contadas en bloques anteriores. */
  escenasContadas: readonly string[];
  /** Lo gastado en el cazador en esta entrevista, antes de esta llamada. */
  gastoUsd: number;
  /** Para probar otra versión del prompt; si no, el del idioma (PROMPT_CAZADOR_DE). */
  prompt?: string;
  /** El idioma de la entrevista: elige el prompt y los controles. Sin idioma, es-AR. */
  idioma?: Idioma;
};

export type ResultadoCaza = {
  bloque: number;
  /** ¿Se llamó al modelo? */
  llamo: boolean;
  /** Por qué no cazó nada, si no cazó. */
  motivo?: 'cierre' | 'sin-respuestas' | 'tope' | 'error' | 'salida-ilegible';
  repreguntas: Repregunta[];
  descartadas: Descartada[];
  /** Las escenas bien contadas de este bloque (para sumar a `escenasContadas`). */
  escenasContadas: string[];
  tokens?: { entrada: number; salida: number };
  /** Lo que costó esta llamada. */
  costoUsd: number;
  /** Lo gastado en la entrevista, con esta llamada. */
  gastoUsd: number;
  error?: string;
};

/**
 * Caza un bloque: arma la entrada, llama al modelo (un reintento si falla; si
 * vuelve a fallar, ese bloque no caza y la entrevista sigue igual: nunca tira
 * error), lee la salida y la pasa por los controles. No llama si el bloque es
 * el del cierre, si no hay respuestas con texto, o si ya se alcanzó el tope de
 * USD 3.
 */
export async function cazarBloque(p: PedidoCaza): Promise<ResultadoCaza> {
  const vacio = { bloque: p.bloque, repreguntas: [], descartadas: [], escenasContadas: [], costoUsd: 0, gastoUsd: p.gastoUsd };
  if (esBloqueDelCierre(p.bloque, p.banco)) return { ...vacio, llamo: false, motivo: 'cierre' };
  const idioma = p.idioma ?? IDIOMA_POR_DEFECTO;
  const delBloque = respuestasParaCazar(p.respuestas, p.bloque, p.textoPregunta, idioma);
  if (delBloque.length === 0) return { ...vacio, llamo: false, motivo: 'sin-respuestas' };
  if (p.gastoUsd >= TOPE_GASTO_USD) return { ...vacio, llamo: false, motivo: 'tope' };

  const pedido: PedidoModelo = {
    model: MODELO_CAZADOR,
    max_tokens: MAX_TOKENS_CAZADOR,
    thinking: { type: 'adaptive' },
    output_config: { effort: ESFUERZO_CAZADOR },
    system: p.prompt ?? PROMPT_CAZADOR_DE[idioma],
    messages: [
      {
        role: 'user',
        content: armarEntrada({
          ficha: p.ficha,
          bloque: p.bloque,
          respuestas: delBloque,
          yaRepreguntado: p.yaRepreguntado,
          escenasContadas: p.escenasContadas,
          loQueViene: loQueViene(p.bloque, p.banco, p.textoPregunta),
        }),
      },
    ],
  };
  let msg: Awaited<ReturnType<ClienteModelo['messages']['create']>> | undefined;
  let error: unknown;
  for (let intento = 0; intento < 2 && !msg; intento++) {
    try {
      msg = await p.cliente.messages.create(pedido);
    } catch (err) {
      error = err;
    }
  }
  if (!msg) return { ...vacio, llamo: true, motivo: 'error', error: error instanceof Error ? error.message : String(error) };

  const costo = costoUsd(msg.usage);
  const conGasto = { ...vacio, llamo: true, tokens: { entrada: msg.usage.input_tokens, salida: msg.usage.output_tokens }, costoUsd: costo, gastoUsd: p.gastoUsd + costo };
  const salida = leerSalida(msg.content.flatMap((b) => (b.type === 'text' && b.text ? [b.text] : [])).join(''));
  if (!salida) return { ...conGasto, motivo: 'salida-ilegible' };
  const { repreguntas, descartadas } = revisarElegidas(salida.elegidas, delBloque, p.bloque, p.yaRepreguntado, idioma);
  return { ...conGasto, repreguntas, descartadas, escenasContadas: salida.escenasContadas };
}
