import type Anthropic from '@anthropic-ai/sdk';
import type { Perfil } from './perfil.js';
import type { Tramo } from './plan-preguntas.js';
import { GUION, nombreDeEvento, type FilaObjetivo, type Bloque } from './guion-v2.js';
import { encargoDelBiografo, ENCARGO_FIJO, encargoVariable, perfilEnTexto } from './encargo-entrevista.js';
import { controlarPregunta as controlarSalida, INTENTOS, type Marca } from './control-pregunta.js';
import { MODELO_PREGUNTA, textoDelModelo, contenidoConCache, type PromptPartido } from './modelos-v2.js';

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
  /** `yaNombradoEn` (ajuste E, 25/09): solo al escribir la pregunta (`conNombrado`), el tema corto de donde ya se habló de esto. */
  | ({ tipo: 'nucleo'; yaNombradoEn?: string } & FilaObjetivo)
  | { tipo: 'variable'; id: string; tramo: Tramo; desde: number; hasta: number; anclas: string[] }
  /** `final`: el objeto de cierre (guion §2: "uno al cerrar cada tramo y uno al final"); su tramo es el último vivido, para la época. */
  | { tipo: 'objeto'; id: string; tramo: Tramo; final?: boolean }
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
 * cosa con foto de esa época sin insistir (el final, la que guardaría de toda su vida: arreglo final I3); la variable lleva el tramo y sus anclas; la
 * repregunta pide junto lo que faltó, sin decir que es una repregunta ni pedir resumen; una
 * fila del guion lleva su tema con los pormenores que puede juntar (dos o tres, en una sola
 * pregunta) y, si pide escena, lo dice.
 */
/** Ajuste E (25/09): la línea de una fila que ya se nombró en otra respuesta (texto que aprobó Naza). */
export const yaNombrado = (tema: string) => `Ya contó algo de esto cuando hablaron de «${tema}»: no le pidas que lo repita; andá a lo que todavía no contó de este tema.`;

export function objetivoEnTexto(o: Objetivo, perfil: Perfil): string {
  if (o.tipo === 'objeto' && o.final) {
    return 'Pedile UNA cosa que tenga en casa y que guardaría de toda su vida: un objeto, un papel, una foto vieja, lo que sea. Con una foto, y que cuente por qué esa. Si no tiene, no pasa nada: no se insiste nunca.';
  }
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
  return `${o.tema}${pormenores}${escena}${o.yaNombradoEn ? `\n${yaNombrado(o.yaNombradoEn)}` : ''}`;
}

/** Cuánto entra de cada tema ya hecho y de cada repregunta ya mandada en "TEMAS QUE YA LE PREGUNTASTE". */
export const MAX_TEMA_HECHO = 80;
/** E18 (25/09): era 100; bajó a 80 para que CUÁNDO CONTESTÓ y su regla entren en el techo de 13.800 del prompt de la pregunta 40. */
export const MAX_REPREGUNTA_HECHA = 80;
const PREFIJO_REPREGUNTA = '(repregunta) ';

/**
 * Un texto recortado para la lista de ya hechas: la primera oración entera si entra en `max`; si
 * no, hasta `max` cortando en una palabra entera, con "…". Idempotente.
 */
export function recortarHecha(texto: string, max: number): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  const primera = limpio.match(/^.+?[.?!…](?=\s|$)/)?.[0] ?? limpio;
  if (primera.length <= max) return primera;
  const corte = primera.slice(0, max - 1);
  const espacio = corte.lastIndexOf(' ');
  return `${(espacio > max / 2 ? corte.slice(0, espacio) : corte).replace(/[\s,;:¿¡(]+$/, '')}…`;
}

/** Lo que ya viene corto y marcado (repreguntas, libres, objetos): no se le busca la cabeza. */
const MARCADO = /^\((repregunta|libre|objeto)\) /;
/** ids `historia-grande-*` (ajuste A, 24/09): la cabeza genérica ("Lo grande que le tocó al país...") no distingue pandemia de Mundial ni de los demás eventos. */
const ID_HISTORIA_GRANDE = /^historia-grande-/;

/**
 * Ajuste A: para una fila `historia-grande-*` ya hecha, la línea dice el EVENTO, no la cabeza
 * genérica del tema (que es la misma para todos: "Lo grande que le tocó al país en esa época…").
 * Sin esto, pandemia hecha y Mundial pendiente quedaban con la misma línea y no se distinguían
 * (o, con las dos hechas, se deduplicaban a una sola). El Mundial saca el año de su propio texto
 * ("el de <año>, cuando tenía…"); los demás (pandemia incluida) sacan el nombre por `id` de
 * `nombreDeEvento` (`guion-v2.ts`), la misma tabla que arma el tema — nunca parseando el tema ya
 * armado: fix ronda 1, algunos nombres tienen coma adentro de un paréntesis propio ("el 2001 (el
 * corralito, diciembre)"), y un regex que cortaba en la primera coma lo dejaba a mitad de camino
 * y con un paréntesis sin cerrar ("el 2001 (el corralito").
 */
function lineaHistoriaGrande(q: YaHecha): string | null {
  if (!ID_HISTORIA_GRANDE.test(q.id)) return null;
  if (q.id === 'historia-grande-mundial') {
    const anio = q.tema.match(/el de (\d{4})/)?.[1];
    return anio ? `Historia grande: el Mundial de ${anio}` : 'Historia grande: el Mundial';
  }
  const nombre = nombreDeEvento(q.id.slice('historia-grande-'.length));
  return `Historia grande: ${nombre ?? q.id.slice('historia-grande-'.length)}`;
}

/**
 * Cómo se lista una ya hecha (arreglo final I1: con los temas enteros, la lista llevaba el prompt de
 * la pregunta 40 a 15.400 caracteres, sobre un presupuesto de 13.800). Un tema del guion: su primera
 * oración hasta MAX_TEMA_HECHO y, si tiene cabeza antes de ":", " (" o ", " (de 12 caracteres o más),
 * solo la cabeza ("La casa donde pasó su infancia"). Una repregunta: su texto hasta
 * MAX_REPREGUNTA_HECHA. Una fila `historia-grande-*`: el evento (ajuste A, arriba). Los temas del
 * guion no cambian: solo cómo se listan los ya hechos (para "no vuelvas sobre esto" alcanza con
 * reconocerlo).
 */
export function temaHechoEnLinea(q: YaHecha): string {
  if (q.tema.startsWith(PREFIJO_REPREGUNTA)) return `${PREFIJO_REPREGUNTA}${recortarHecha(q.tema.slice(PREFIJO_REPREGUNTA.length), MAX_REPREGUNTA_HECHA)}`;
  const historia = lineaHistoriaGrande(q);
  if (historia) return historia;
  const corto = recortarHecha(q.tema, MAX_TEMA_HECHO);
  if (MARCADO.test(q.tema)) return corto;
  const partes = corto.split(/:| \(|, /);
  if (partes.length === 1) return corto;
  const cabeza = partes[0].trim();
  return cabeza.length >= 12 ? cabeza : corto;
}

/**
 * La lista de "TEMAS QUE YA LE PREGUNTASTE": una línea por tema, SIN el id (arreglo final I1: los ids
 * sumaban ~500 caracteres que el modelo no usa; con id, ni cortando los temas a 80 entraba en el
 * presupuesto) y sin repetir líneas iguales.
 */
export function listaDeHechas(yaHechas: YaHecha[]): string {
  return [...new Set(yaHechas.map(temaHechoEnLinea))].map((l) => `- ${l}`).join('\n');
}

const DATOS_PREGUNTA = (conversacion: string, yaHechas: string, objetivo: string, cuando: string) => `LO ÚLTIMO QUE HABLARON (cada respuesta con la pregunta que la originó):
${conversacion || '(todavía no hablaron)'}

CUÁNDO CONTESTÓ: ${cuando}.

TEMAS QUE YA LE PREGUNTASTE (no vuelvas sobre ninguno; si algo de ahí sirve de puente, una frase):
${yaHechas || '(ninguno)'}

LO QUE TE TOCA PREGUNTAR HOY:
${objetivo}`;

const TAREA_PREGUNTA = `Tu trabajo hoy es decidir cómo preguntarle esto a ESTA persona, con lo que ya sabés: el guion
te da el tema, no el texto. Si algo que contó sirve de puente, usalo; la pregunta va a lo que
todavía no contó.
No digas "ayer" ni "el otro día" si no coincide con CUÁNDO CONTESTÓ; si no se sabe, no marques el tiempo.`;

/** E18 (25/09): lo que dice CUÁNDO CONTESTÓ si no hay hora de la última respuesta. */
export const CUANDO_NO_SE_SABE = 'no se sabe';

const FORMATO_PREGUNTA = 'Respondé SOLO con la pregunta, sin comillas ni saludo.';

export const PROMPT_PREGUNTA_V2 = (encargo: string, conversacion: string, yaHechas: string, objetivo: string, cuando: string = CUANDO_NO_SE_SABE) => `
${encargo}

${DATOS_PREGUNTA(conversacion, yaHechas, objetivo, cuando)}

${TAREA_PREGUNTA}

${FORMATO_PREGUNTA}`;

const datosDePregunta = (conversacion: { pregunta: string; respuesta: string }[], yaHechas: YaHecha[], objetivo: Objetivo, perfil: Perfil, cuando: string | null) =>
  [conversacion.map((c) => `P: ${c.pregunta}\nR: ${c.respuesta}`).join('\n\n'), listaDeHechas(yaHechas), objetivoEnTexto(objetivo, perfil), cuando ?? CUANDO_NO_SE_SABE] as const;

/** El prompt en el orden de lectura (el que aprobó Naza; `render-textos-v2.ts` y los tests lo miran). */
export function armarPromptPregunta(
  perfil: Perfil,
  objetivo: Objetivo,
  conversacion: { pregunta: string; respuesta: string }[],
  yaHechas: YaHecha[],
  evitar: string[] = [],
  cuando: string | null = null,
): string {
  return PROMPT_PREGUNTA_V2(encargoDelBiografo(perfil, evitar), ...datosDePregunta(conversacion, yaHechas, objetivo, perfil, cuando));
}

/**
 * Ajuste B (caché): lo que se le MANDA al modelo. Mismas palabras que `armarPromptPregunta`, en
 * otro orden: lo fijo primero (el encargo que es igual para todos y la tarea), después la ficha, lo
 * que hablaron, los temas hechos, el objetivo y, al final como antes, el formato de la respuesta.
 */
export function partirPromptPregunta(
  perfil: Perfil,
  objetivo: Objetivo,
  conversacion: { pregunta: string; respuesta: string }[],
  yaHechas: YaHecha[],
  evitar: string[] = [],
  cuando: string | null = null,
): PromptPartido {
  return {
    fijo: `\n${ENCARGO_FIJO}\n\n${TAREA_PREGUNTA}`,
    variable: `\n\n${encargoVariable(perfil, evitar)}\n\n${DATOS_PREGUNTA(...datosDePregunta(conversacion, yaHechas, objetivo, perfil, cuando))}\n\n${FORMATO_PREGUNTA}`,
  };
}

/**
 * Escribe la pregunta (o la repregunta, o el objeto). Hasta `INTENTOS` veces: si el control la
 * rechaza, se lo pide de nuevo diciendo por qué (a partir del 2.º intento). Si el último también
 * falla, se manda esa versión igual —mejor una pregunta imperfecta que ninguna— pero con
 * `ok: false` y una `marca` para que quien llama lo sepa (y, si hace falta, avise).
 * `max_tokens` 4000: Sonnet 5 (el modelo de la pregunta desde el ajuste C, 24/09; antes Opus 5,
 * que también piensa por defecto) piensa por defecto y eso cuenta como salida; con 400 la pregunta
 * salía cortada o vacía (el que no se usa no se cobra). Si igual se corta (`stop_reason:
 * 'max_tokens'`) o no trae bloque de texto, tira (`textoDelModelo`, arreglo final I2): media
 * pregunta no se manda.
 * `modelo` (ajuste C, 24/09): solo para la comparación a ciegas (`scripts/comparar-modelos.ts`),
 * que escribe la misma pregunta con Opus y con Sonnet con el mismo prompt, los mismos parámetros y
 * los mismos controles. Sin pasarlo, es `MODELO_PREGUNTA` como siempre (Sonnet, desde el ajuste C).
 * `cuando` (E18, 25/09): cuándo llegó la última respuesta ("hace unos minutos", "ayer"…, de
 * `cuandoContesto`); sin eso, el prompt le dice que no marque el tiempo.
 */
export async function escribirPregunta(
  cliente: Anthropic,
  perfil: Perfil,
  objetivo: Objetivo,
  conversacion: { pregunta: string; respuesta: string }[],
  yaHechas: YaHecha[],
  evitar: string[] = [],
  modelo: string = MODELO_PREGUNTA,
  cuando: string | null = null,
): Promise<{ texto: string; ok: boolean; marca?: Marca; usos: Anthropic.Usage[] }> {
  const prompt = partirPromptPregunta(perfil, objetivo, conversacion, yaHechas, evitar, cuando);
  const usos: Anthropic.Usage[] = [];
  let texto = '';
  let ultimo: { control: string; motivo: string } | null = null;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    // Lo fijo es el mismo bloque en cada intento: el 2.º y el 3.º lo leen de la caché (ajuste B).
    const motivo = intento === 1 ? '' : `\n\nTu versión anterior no sirvió porque ${ultimo!.motivo}. Escribila de nuevo, cuidando eso.`;
    const r = await cliente.messages.create({ model: modelo, max_tokens: 4000, messages: [{ role: 'user', content: contenidoConCache(prompt, motivo) }] });
    usos.push(r.usage);
    texto = textoDelModelo(r, 'la pregunta', false).trim().replace(/^["«]|["»]$/g, '');
    const control = controlarSalida(texto, perfil, objetivo);
    if (control.ok) return { texto, ok: true, usos };
    ultimo = control;
  }
  // Campo por campo: `ultimo` es un Rechazo y trae "ok: false" de arrastre, que no pertenece a
  // la Marca (fix ronda 1).
  return { texto, ok: false, marca: { control: ultimo!.control, motivo: ultimo!.motivo, intentos: INTENTOS }, usos };
}
