// El cazador de escenas en la entrevista (Naza, 01/10, chat "La entrevista
// trae escenas"; plan: docs/v3/entrevista/cazador/plan-codigo.md, parte B1).
// Al cerrar un bloque, Opus lee sus respuestas y elige hasta 2 de las que
// valga la pena pedir un momento concreto; el código controla lo que devuelve
// (cita textual, una sola pregunta corta, sin tiempos relativos, ids
// distintos y no repetidos) y descarta lo que falla. Lo que pasa entra a la
// cola de repreguntas (`EstadoEntrevista.repreguntas`, flujo.ts).
//
// Todo es puro salvo `cazarBloque`, que llama al modelo por un cliente que se
// le pasa (el SDK de Anthropic, o uno falso en los tests: ningún test llama a
// la API). El prompt sale de docs/v3/entrevista/cazador/prompt-v3-1.md:
// `scripts/v3-cazador-json.ts` genera cazador-prompt.json y un test compara.

import promptJson from './cazador-prompt.json' with { type: 'json' };
import promptCaJson from './cazador-prompt-ca.json' with { type: 'json' };
import promptEsEsJson from './cazador-prompt-es-ES.json' with { type: 'json' };
import { preguntaPorId, textosDe } from './banco.js';
import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';
import { BLOQUE_FINAL, claveRepregunta, deSegunda, PIDEN_DIA, type Repregunta, type Respuestas } from './flujo.js';
import type { FichaTexto } from './texto.js';
import { interpretar, leerBoton, leerInferida } from './respuesta.js';

// ---------------------------------------------------------------- constantes

/** Opus 5.5 con pensamiento medio (Naza, 07/10: ahorro; antes Opus 5, que es más caro y pensaba en alto por defecto). */
export const MODELO_CAZADOR = 'claude-opus-5-5';
export const ESFUERZO_CAZADOR = 'medium';
export const MAX_TOKENS_CAZADOR = 16000;
/** USD por token: 4 por millón de entrada, 20 por millón de salida (Opus 5.5). */
export const PRECIO_CAZADOR = { entrada: 4 / 1e6, salida: 20 / 1e6 };
/** Tope de gasto del cazador por entrevista (Naza, 01/10): alcanzado, no se llama más y la entrevista sigue sin cazador. */
export const TOPE_GASTO_USD = 3;
/** Hasta cuántas elegidas por bloque se miran (el prompt dice "como mucho DOS"). */
export const MAX_ELEGIDAS = 2;
export const MAX_PALABRAS_PREGUNTA = 45;

/** El prompt v3.1 (Fable, 01/10), tal cual la sección "## Prompt" del md. */
export const PROMPT_CAZADOR: string = (promptJson as { prompt: string }).prompt;

/**
 * El prompt según el idioma de la entrevista: en catalán,
 * docs/v3/entrevista/cazador/prompt-v3-1-ca.md (Naza, 04/10); en castellano de
 * España, prompt-v3-1-es-ES.md (Naza, 05/10). El original no se toca.
 */
export const PROMPT_CAZADOR_DE: Readonly<Record<Idioma, string>> = {
  'es-AR': PROMPT_CAZADOR,
  ca: (promptCaJson as { prompt: string }).prompt,
  'es-ES': (promptEsEsJson as { prompt: string }).prompt,
};

/** La sección "## Prompt" del md: lo que va entre el primer par de ``` después del título. */
export function extraerPrompt(md: string): string {
  const despues = md.replace(/\r\n/g, '\n').split('## Prompt')[1];
  if (despues === undefined) throw new Error('el md del cazador no tiene "## Prompt"');
  const bloque = despues.split('```')[1];
  if (bloque === undefined) throw new Error('el md del cazador no tiene el prompt entre ```');
  return bloque.trim();
}

/**
 * Los bloques del banco con un nombre corto y los momentos concretos que
 * piden sus preguntas del núcleo (los de scripts/v3-cazador-prueba-v3.ts, ya
 * probados contra la API). El índice es el bloque menos uno.
 */
export const BLOQUES_CAZADOR: readonly { nombre: string; momentos: readonly string[] }[] = [
  { nombre: 'Origen', momentos: ['la época en que naciste', 'la historia de la familia de los de antes', 'cómo se conocieron tus padres'] },
  { nombre: 'La casa de chico', momentos: ['el primer recuerdo de la casa de chico', 'una anécdota con tu mamá de chico', 'una vez con tu papá trabajando', 'una aventura con tus hermanos', 'un día de chico que esperabas con ganas', 'un momento difícil de chico'] },
  { nombre: 'Escuela', momentos: ['el primer día de escuela', 'una vez con una maestra que te marcó', 'una tarde con tu mejor amigo de chico', 'una travesura', 'qué querías ser de grande', 'la religión en tu casa'] },
  { nombre: 'Adolescencia', momentos: ['dónde pasabas los días a los trece', 'una noche con la barra de amigos', 'la primera salida de noche', 'el primer amor', 'cuándo dejaste de ser chico', 'un momento duro de la adolescencia'] },
  { nombre: 'Juventud', momentos: ['el día que te fuiste de la casa de tus padres', 'qué hiciste después del colegio', 'aprender tu oficio', 'la llegada a vivir a otra ciudad o país', 'el primer lugar propio y su primera noche', 'las mudanzas de tu vida', 'un momento duro de la juventud'] },
  { nombre: 'Amor', momentos: ['el día que conociste a tu pareja', 'la vida juntos', 'un momento de los dos'] },
  { nombre: 'Trabajo', momentos: ['el primer trabajo', 'un día común de trabajo', 'quién te dio una mano en el trabajo', 'el día de trabajo del que estás orgulloso', 'una época sin trabajo o con la plata justa', 'el negocio propio', 'el último día de trabajo'] },
  { nombre: 'Hijos y nietos', momentos: ['tus padres de grande', 'el nacimiento del primer hijo', 'cómo era cada hijo de chico', 'el día que conociste al primer nieto'] },
  { nombre: 'Lugares', momentos: ['el viaje más importante', 'tu pasión'] },
  { nombre: 'Amistades', momentos: ['cómo conociste al amigo de grande', 'tus hermanos de grandes', 'alguien que te ayudó', 'la cena con quien quisieras'] },
  { nombre: 'Momentos difíciles', momentos: ['una pérdida', 'la salud', 'una época dura de grande'] },
  { nombre: 'Historia grande', momentos: ['algo grande del país que te tocó', 'un día de la pandemia', 'lo que antes no se podía', 'la política'] },
  { nombre: 'Giros', momentos: ['el día que volverías a vivir', 'el día que te cambió algo', 'algo que no se dio', 'sentirte chiquito frente a algo enorme', 'la soledad', 'el paso del tiempo', 'lo heredado'] },
  { nombre: 'Hoy', momentos: ['un día cualquiera de ahora', 'la última vez que te reíste con ganas', 'una marca en el cuerpo con historia', 'tu plato', 'la música de ahora', 'el lugar donde vivís'] },
  { nombre: 'Legado', momentos: ['de qué estás orgulloso', 'tu consejo', 'lo que todavía querés hacer'] },
];

/**
 * Lo mismo para la entrevista en catalán (Naza, 04/10): el modelo lee en
 * catalán lo que viene. El bloque 14 se llama "Avui", como dice el prompt.
 */
export const BLOQUES_CAZADOR_CA: readonly { nombre: string; momentos: readonly string[] }[] = [
  { nombre: 'Origen', momentos: ["l'època en què vas néixer", "la història de la família, dels d'abans", 'com es van conèixer els teus pares'] },
  { nombre: 'La casa de petit', momentos: ['el primer record de la casa de quan eres petit', 'una anècdota amb la teva mare de petit', 'una vegada amb el teu pare treballant', 'una aventura amb els teus germans', 'un dia de petit que esperaves amb ganes', 'un moment difícil de petit'] },
  { nombre: 'Escola', momentos: ["el primer dia d'escola", 'una vegada amb una mestra que et va marcar', 'una tarda amb el teu millor amic de petit', 'una entremaliadura', 'què volies ser de gran', 'la religió a casa teva'] },
  { nombre: 'Adolescència', momentos: ['on passaves els dies als tretze anys', 'una nit amb la colla', 'la primera sortida de nit', 'el primer amor', 'quan vas deixar de ser un nen', "un moment dur de l'adolescència"] },
  { nombre: 'Joventut', momentos: ['el dia que vas marxar de casa dels teus pares', "què vas fer després de l'escola", 'aprendre el teu ofici', "l'arribada a viure a una altra ciutat o país", 'el primer lloc propi i la primera nit', 'les mudances de la teva vida', 'un moment dur de la joventut'] },
  { nombre: 'Amor', momentos: ['el dia que vas conèixer la teva parella', 'la vida junts', 'un moment de tots dos'] },
  { nombre: 'Feina', momentos: ['la primera feina', 'un dia normal de feina', 'qui et va donar un cop de mà a la feina', 'el dia de feina del qual estàs orgullós', 'una època sense feina o amb els diners justos', 'el negoci propi', "l'últim dia de feina"] },
  { nombre: 'Fills i nets', momentos: ['els teus pares de grans', 'el naixement del primer fill', 'com era cada fill de petit', 'el dia que vas conèixer el primer net'] },
  { nombre: 'Llocs', momentos: ['el viatge més important', 'la teva passió'] },
  { nombre: 'Amistats', momentos: ["com vas conèixer l'amic de gran", 'els teus germans de grans', "algú que et va ajudar", 'el sopar amb qui voldries'] },
  { nombre: 'Moments difícils', momentos: ['una pèrdua', 'la salut', 'una època dura de gran'] },
  { nombre: 'Història gran', momentos: ['alguna cosa gran del país que et va tocar', 'un dia de la pandèmia', 'el que abans no es podia fer', 'la política'] },
  { nombre: 'Girs', momentos: ['el dia que tornaries a viure', 'el dia que et va canviar alguna cosa', 'alguna cosa que no va sortir', "sentir-te petit davant d'una cosa enorme", 'la soledat', 'el pas del temps', 'el que has heretat'] },
  { nombre: 'Avui', momentos: ["un dia qualsevol d'ara", "l'última vegada que vas riure de debò", 'una marca al cos amb història', 'el teu plat', "la música d'ara", 'el lloc on vius'] },
  { nombre: 'Llegat', momentos: ['de què estàs orgullós', 'el teu consell', 'el que encara vols fer'] },
];

/** Lo mismo para la entrevista en castellano de España, de tú (Naza, 05/10): pequeño, madre, instituto, dinero, sitio. */
export const BLOQUES_CAZADOR_ES: readonly { nombre: string; momentos: readonly string[] }[] = [
  { nombre: 'Origen', momentos: ['la época en que naciste', 'la historia de la familia de los de antes', 'cómo se conocieron tus padres'] },
  { nombre: 'La casa de pequeño', momentos: ['el primer recuerdo de la casa de pequeño', 'una anécdota con tu madre de pequeño', 'una vez con tu padre trabajando', 'una aventura con tus hermanos', 'un día de pequeño que esperabas con ganas', 'un momento difícil de pequeño'] },
  { nombre: 'Escuela', momentos: ['el primer día de colegio', 'una vez con una maestra que te marcó', 'una tarde con tu mejor amigo de pequeño', 'una travesura', 'qué querías ser de mayor', 'la religión en tu casa'] },
  { nombre: 'Adolescencia', momentos: ['dónde pasabas los días a los trece', 'una noche con la pandilla', 'la primera salida de noche', 'el primer amor', 'cuándo dejaste de ser un niño', 'un momento duro de la adolescencia'] },
  { nombre: 'Juventud', momentos: ['el día que te fuiste de casa de tus padres', 'qué hiciste después del instituto', 'aprender tu oficio', 'la llegada a vivir a otra ciudad o país', 'el primer sitio propio y su primera noche', 'las mudanzas de tu vida', 'un momento duro de la juventud'] },
  { nombre: 'Amor', momentos: ['el día que conociste a tu pareja', 'la vida juntos', 'un momento de los dos'] },
  { nombre: 'Trabajo', momentos: ['el primer trabajo', 'un día normal de trabajo', 'quién te echó una mano en el trabajo', 'el día de trabajo del que estás orgulloso', 'una época sin trabajo o con el dinero justo', 'el negocio propio', 'el último día de trabajo'] },
  { nombre: 'Hijos y nietos', momentos: ['tus padres de mayores', 'el nacimiento del primer hijo', 'cómo era cada hijo de pequeño', 'el día que conociste al primer nieto'] },
  { nombre: 'Lugares', momentos: ['el viaje más importante', 'tu pasión'] },
  { nombre: 'Amistades', momentos: ['cómo conociste al amigo de mayor', 'tus hermanos de mayores', 'alguien que te ayudó', 'la cena con quien quisieras'] },
  { nombre: 'Momentos difíciles', momentos: ['una pérdida', 'la salud', 'una época dura de mayor'] },
  { nombre: 'Historia grande', momentos: ['algo grande del país que te tocó', 'un día de la pandemia', 'lo que antes no se podía', 'la política'] },
  { nombre: 'Giros', momentos: ['el día que volverías a vivir', 'el día que te cambió algo', 'algo que no salió', 'sentirte pequeño frente a algo enorme', 'la soledad', 'el paso del tiempo', 'lo heredado'] },
  { nombre: 'Hoy', momentos: ['un día cualquiera de ahora', 'la última vez que te reíste con ganas', 'una marca en el cuerpo con historia', 'tu plato', 'la música de ahora', 'el sitio donde vives'] },
  { nombre: 'Legado', momentos: ['de qué estás orgulloso', 'tu consejo', 'lo que todavía quieres hacer'] },
];

const BLOQUES_CAZADOR_DE: Readonly<Record<Idioma, typeof BLOQUES_CAZADOR>> = { 'es-AR': BLOQUES_CAZADOR, ca: BLOQUES_CAZADOR_CA, 'es-ES': BLOQUES_CAZADOR_ES };

/** El bloque Hoy: ahí "hoy" sí vale en la pregunta. */
export const BLOQUE_HOY = 14;

/** Los momentos que el banco va a pedir en los bloques que faltan (después de `bloque`): lo que llega solo, no se repregunta. */
export function loQueViene(bloque: number, idioma: Idioma = IDIOMA_POR_DEFECTO): string[] {
  return BLOQUES_CAZADOR_DE[idioma].slice(bloque).flatMap((b) => b.momentos);
}

// ---------------------------------------------------------------- entrada

/** Una respuesta del bloque como la ve el modelo. `id` es el ID del banco. */
export type RespuestaParaCazar = { id: string; pregunta: string; texto: string; pedidoDia: boolean; paso: boolean };

/**
 * Las respuestas del bloque que se le pasan al cazador, en el orden en que
 * llegaron. No se caza el bloque 15 (legado), ni las respuestas a
 * repreguntas, ni un botón sin texto; de un botón con audio atrás va el
 * audio. La segunda oportunidad ("X~2") va pegada a su X, en otra línea
 * (plan, B1). `textoPregunta` da la pregunta como se mandó.
 */
export function respuestasParaCazar(respuestas: Respuestas, bloque: number, textoPregunta: (id: string) => string, idioma: Idioma = IDIOMA_POR_DEFECTO): RespuestaParaCazar[] {
  if (bloque === BLOQUE_FINAL) return [];
  const out: RespuestaParaCazar[] = [];
  for (const [clave, crudo] of respuestas) {
    const x = deSegunda(clave);
    if (x) {
      const suya = out.find((r) => r.id === x);
      const texto = leerBoton(crudo).resto.trim();
      if (suya && texto) suya.texto = suya.texto ? `${suya.texto}\n${texto}` : texto;
      continue;
    }
    // Solo las del banco (las repreguntas y las de la familia no tienen fila en el banco).
    const p = preguntaPorId(clave, idioma);
    if (!p || p.bloque !== bloque) continue;
    // AMH inferida de AM0 (Naza, 06/10): no se le preguntó, no es algo que contó.
    if (leerInferida(crudo) !== undefined) continue;
    const texto = leerBoton(crudo).resto.trim();
    if (!texto) continue;
    out.push({ id: clave, pregunta: textoPregunta(clave), texto, pedidoDia: PIDEN_DIA[clave] !== undefined, paso: interpretar(p, crudo, idioma) === 'paso' });
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
  /** El idioma de la entrevista (nombres de bloque y lo que viene). Sin idioma, es-AR. */
  idioma?: Idioma;
};

/**
 * El mensaje del usuario, en el orden de la prueba contra la API
 * (scripts/v3-cazador-prueba-v3.ts): ficha, bloque, ya_repreguntado,
 * escenas_contadas, lo_que_viene y al final las respuestas del bloque.
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
    `<bloque>${BLOQUES_CAZADOR_DE[e.idioma ?? IDIOMA_POR_DEFECTO][e.bloque - 1]?.nombre ?? `Bloque ${e.bloque}`}</bloque>`,
    `<ya_repreguntado>\n${e.yaRepreguntado.map((r) => `${r.origen}: ${r.tema}`).join('\n')}\n</ya_repreguntado>`,
    `<escenas_contadas>\n${e.escenasContadas.join('\n')}\n</escenas_contadas>`,
    `<lo_que_viene>\n${loQueViene(e.bloque, e.idioma).join('\n')}\n</lo_que_viene>`,
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
const HOY_DE: Readonly<Record<Idioma, RegExp>> = { 'es-AR': /\bhoy\b/i, ca: /(?<![\p{L}])(avui|hoy)(?![\p{L}])/iu, 'es-ES': /\bhoy\b/i };
const sinMarcas = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-zñ0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Los controles de código de la v3 (movidos de scripts/v3-cazador-prueba-v3.ts,
 * probados contra la API): la cita es textual y contigua de esa respuesta; la
 * pregunta lleva un solo "?", hasta 45 palabras, sin "ayer/anoche/hace un
 * rato/recién/la otra vez/esta semana" ni "hoy" fuera del bloque Hoy.
 */
export function controlarElegida(e: Pick<Elegida, 'cita' | 'pregunta'>, respuesta: string, bloqueHoy: boolean, idioma: Idioma = IDIOMA_POR_DEFECTO): string[] {
  const fallas: string[] = [];
  const cita = sinMarcas(e.cita ?? '');
  if (!cita || !` ${sinMarcas(respuesta)} `.includes(` ${cita} `)) fallas.push('la cita no es textual');
  const pregunta = e.pregunta ?? '';
  if ((pregunta.match(/\?/g) ?? []).length !== 1) fallas.push('la pregunta no tiene un solo "?"');
  if (pregunta.split(/\s+/).filter(Boolean).length > MAX_PALABRAS_PREGUNTA) fallas.push(`pregunta de más de ${MAX_PALABRAS_PREGUNTA} palabras`);
  // En catalán, el apóstrofo curvo (’) cuenta como el recto, y "d'ahir" es "de ayer" (revisión del 04/10).
  const recta = pregunta.replace(/’/g, "'");
  const relativo = TIEMPO_RELATIVO.test(pregunta) || (TIEMPO_RELATIVO_DE[idioma]?.test(recta) ?? false);
  if (relativo || (!bloqueHoy && HOY_DE[idioma].test(recta))) fallas.push('tiempo relativo');
  return fallas;
}

/** Una elegida descartada, con por qué (se registra; no se manda). */
export type Descartada = { id: string; cita: string; pregunta: string; tema?: string; fallas: string[] };

/**
 * Pasa las elegidas (hasta 2) por los controles: además de los de
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
    const fallas = controlarElegida(e, suya?.texto ?? '', bloque === BLOQUE_HOY, idioma);
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
 * modelo (Naza, 01/10). Va con el botón [Ya lo conté todo] (BOTON_YA_LO_CONTE
 * en flujo.ts).
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
  /** Todas las respuestas de la entrevista hasta acá, en orden. */
  respuestas: Respuestas;
  /** La pregunta como se le mandó (por ID del banco). */
  textoPregunta: (id: string) => string;
  /** Las repreguntas que ya entraron a la cola (mandadas o no). */
  yaRepreguntado: readonly Repregunta[];
  /** Las escenas que el cazador ya vio bien contadas en bloques anteriores. */
  escenasContadas: readonly string[];
  /** Lo gastado en el cazador en esta entrevista, antes de esta llamada. */
  gastoUsd: number;
  /** Para probar otra versión del prompt; si no, el del idioma (PROMPT_CAZADOR_DE). */
  prompt?: string;
  /** El idioma de la entrevista (Naza, 04/10): elige el prompt, los nombres de bloque y los controles. Sin idioma, es-AR. */
  idioma?: Idioma;
};

export type ResultadoCaza = {
  bloque: number;
  /** ¿Se llamó al modelo? */
  llamo: boolean;
  /** Por qué no cazó nada, si no cazó. */
  motivo?: 'legado' | 'sin-respuestas' | 'tope' | 'error' | 'salida-ilegible';
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
 * el 15, si no hay respuestas con texto, o si ya se alcanzó el tope de USD 3
 * (Naza, 01/10).
 */
export async function cazarBloque(p: PedidoCaza): Promise<ResultadoCaza> {
  const vacio = { bloque: p.bloque, repreguntas: [], descartadas: [], escenasContadas: [], costoUsd: 0, gastoUsd: p.gastoUsd };
  if (p.bloque === BLOQUE_FINAL) return { ...vacio, llamo: false, motivo: 'legado' };
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
    messages: [{ role: 'user', content: armarEntrada({ ficha: p.ficha, bloque: p.bloque, respuestas: delBloque, yaRepreguntado: p.yaRepreguntado, escenasContadas: p.escenasContadas, idioma }) }],
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
