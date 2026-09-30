// El flujo de la entrevista (docs/v3/entrevista/banco.md, "Reglas del
// flujo"): qué cuenta como "no" corto, si una pregunta se manda según las
// respuestas, cuál es la próxima, qué acuse va después y qué dudas deja la
// ficha contra las respuestas. Todo puro, sin I/O: el entrevistador guarda el
// estado y llama a estas funciones.

import { estado, type FichaV3 } from '../ficha.js';
import { BANCO, mensajePorId, type PreguntaEntrevista } from './banco.js';

/** Respuesta a una pregunta: el texto (transcripción) o lo que dijo, incluido "paso". */
export type Respuesta = string;
/** Respuestas por ID de pregunta. Solo están las preguntas que se mandaron y se contestaron. */
export type Respuestas = ReadonlyMap<string, Respuesta>;

// ---------------------------------------------------------------- respuestas

/** Minúsculas, sin tildes y sin signos: "¡No, Nunca!" → "no nunca". */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function palabras(texto: string): string[] {
  const n = normalizar(texto).replace(/(\p{L})\1{2,}/gu, '$1'); // "nooo" → "no"
  return n === '' ? [] : n.split(' ');
}

/** Muletillas de audio que se saltean al buscar la primera palabra ("Eh, no", "Bueno, paso"). */
const MULETILLAS = new Set(['eh', 'em', 'm', 'mm', 'este', 'bueno', 'mira', 'mire', 'ay', 'ah', 'uh', 'pues']);
const MULETILLAS_DOBLES = [['a', 'ver'], ['o', 'sea']];

/** Las palabras sin las muletillas del principio. */
function sinMuletillas(p: string[]): string[] {
  let i = 0;
  for (;;) {
    if (MULETILLAS.has(p[i])) { i++; continue; }
    if (MULETILLAS_DOBLES.some(([a, b]) => p[i] === a && p[i + 1] === b)) { i += 2; continue; }
    return p.slice(i);
  }
}

/** Largo máximo (en palabras, sin muletillas) de un "paso" con algo más ("paso, no quiero hablar"). */
const PALABRAS_PASO = 8;

/**
 * ¿Dijo "paso"? (M1: "decí paso y vamos a otra"). Vale si la primera palabra
 * (sin muletillas) es "paso" y la respuesta es corta: "paso, no quiero
 * hablar" es paso; "Paso a contarte lo del viaje, que fue…" no.
 */
export function esPaso(respuesta: Respuesta): boolean {
  const p = sinMuletillas(palabras(respuesta));
  return p[0] === 'paso' && p.length <= PALABRAS_PASO;
}

/** Límite del "no" corto: menos de 15 palabras. */
export const PALABRAS_NO_CORTO = 15;
const ARRANQUES_NO = new Set(['no', 'nunca', 'jamas', 'ninguno', 'ninguna', 'nada', 'tampoco']);
/** Si aparecen, el "no" viene seguido de algo que contar ("Nunca lo pensé pero…"). */
const CONTRASTES = new Set(['pero', 'aunque']);

/**
 * "No" corto: menos de 15 palabras, empieza (sin muletillas) con no / nunca /
 * jamás / ninguno / nada / tampoco, y no sigue con "pero" o "aunque". Sin
 * importar mayúsculas, tildes, signos ni letras estiradas ("Nooo"). "No
 * sabés lo que fue ese viaje…" largo no cuenta; "paso" tampoco.
 */
export function esNoCorto(respuesta: Respuesta): boolean {
  if (esPaso(respuesta)) return false;
  const p = sinMuletillas(palabras(respuesta));
  return p.length > 0 && p.length < PALABRAS_NO_CORTO && ARRANQUES_NO.has(p[0]) && !p.some((w) => CONTRASTES.has(w));
}

/** X se contestó con un "no" corto. */
export function respondioNo(respuestas: Respuestas, id: string): boolean {
  const r = respuestas.get(id);
  return r !== undefined && esNoCorto(r);
}

/** X se contestó con al menos una palabra y no fue un "no" corto ni "paso": contó algo (una transcripción vacía o un emoji no cuenta). */
export function contoAlgo(respuestas: Respuestas, id: string): boolean {
  const r = respuestas.get(id);
  return r !== undefined && palabras(r).length > 0 && !esPaso(r) && !esNoCorto(r);
}

/**
 * ¿Se manda la pregunta, según sus condiciones? Sin condiciones, sí. Con
 * varias, alcanza una (OR). `si:X` pide que X haya contado algo; `sino:X`,
 * que X haya sido un "no" corto. Si X no se mandó o se contestó "paso", no
 * se cumple ninguna de las dos (ver Dudas del banco).
 */
export function cumple(pregunta: Pick<PreguntaEntrevista, 'depende'>, respuestas: Respuestas): boolean {
  if (pregunta.depende.length === 0) return true;
  return pregunta.depende.some((c) => (c.tipo === 'si' ? contoAlgo(respuestas, c.de) : respondioNo(respuestas, c.de)));
}

// ---------------------------------------------------------------- orden

/** Una pregunta que manda la familia (va con M15, al final). */
export type PreguntaFamilia = { id: string; texto: string };

export type RondaExtra = 'sin-ofrecer' | 'aceptada' | 'rechazada';

export type EstadoEntrevista = {
  /** Preguntas contestadas (incluye "paso"), del banco y de la familia. */
  respuestas: Respuestas;
  /** Lo que se mandó y no espera respuesta (AV11, FIN). */
  enviados?: ReadonlySet<string>;
  /** Si no viene: 'sin-ofrecer' cuando `ofrecerExtra`, y si no 'rechazada' (no se ofrece). */
  rondaExtra?: RondaExtra;
  /** ¿Se ofrece la ronda extra al terminar el núcleo? Por ahora no (Naza, 30/09: "ya dijimos que acá estaba todo"). */
  ofrecerExtra?: boolean;
  /** Preguntas de la familia, en el orden en que llegaron. */
  familia?: readonly PreguntaFamilia[];
};

export type Siguiente =
  /**
   * Mandar la pregunta; si `conM1`, con M1 abajo en línea aparte y en
   * cursiva. Si viene `entrada` (EN2…EN15), mandar antes ese mensaje: es la
   * primera pregunta que se manda de su bloque (Naza, 30/09).
   */
  | { tipo: 'pregunta'; pregunta: PreguntaEntrevista; conM1: boolean; esperaRespuesta: boolean; entrada?: string }
  /** Mandar M15 y después la pregunta de la familia. */
  | { tipo: 'familia'; pregunta: PreguntaFamilia; antes: 'M15' }
  /** Terminó el núcleo: ofrecer la ronda extra (texto a redactar con Fable, pendiente de Naza). */
  | { tipo: 'ofrecer-extra' }
  /** No queda nada por mandar. */
  | { tipo: 'terminada' };

/** Bloque que se manda entero al final (legado: LE1, LE2, FU1, LE7, la familia, FO1, LE9, LE8 y FIN). */
export const BLOQUE_FINAL = 15;
/** Las preguntas de la familia van antes de esta: después de LE7 y antes de FO1, LE9 y LE8 (Naza, 30/09, ronda 2). */
export const FAMILIA_ANTES_DE = 'FO1';

/** ¿Espera respuesta? El aviso y el mensaje final no. */
export function esperaRespuesta(p: Pick<PreguntaEntrevista, 'clase'>): boolean {
  return p.clase !== 'aviso' && p.clase !== 'final';
}

/** M1 va debajo de las primeras preguntas que se mandan: estas. */
export const M1_PRIMERAS = 3;
/** Las preguntas que abren un tema llevan M1 (Naza, 30/09). */
export const M1_ABREN_TEMA: readonly string[] = ['CA6', 'JU8', 'AM0', 'AM9', 'HI0', 'HI8'];
/** Todas las preguntas de historia de este bloque (momentos difíciles) llevan M1. */
export const M1_BLOQUE = 11;

/**
 * ¿Va M1 debajo? Solo en preguntas de historia, y solo en las 3 primeras que
 * se mandan, en las que abren un tema y en las del bloque 11 (Naza, 30/09,
 * después de leer la entrevista de corrido: debajo de todas se repetía).
 */
export function llevaM1(p: Pick<PreguntaEntrevista, 'id' | 'bloque' | 'clase'>, respuestas: Respuestas, banco: readonly PreguntaEntrevista[] = BANCO): boolean {
  if (p.clase !== 'historia') return false;
  if (M1_ABREN_TEMA.includes(p.id) || p.bloque === M1_BLOQUE) return true;
  const yaContestadas = banco.filter((q) => q.clase === 'historia' && respuestas.has(q.id)).length;
  return yaContestadas < M1_PRIMERAS;
}

/** El ID de la frase de entrada de un bloque (EN2…), si el bloque tiene. */
export function entradaDeBloque(bloque: number): string | undefined {
  const id = `EN${bloque}`;
  return mensajePorId(id) ? id : undefined;
}

function comoSiguiente(p: PreguntaEntrevista, respuestas: Respuestas, banco: readonly PreguntaEntrevista[], hecha: (id: string) => boolean): Siguiente {
  const primeraDelBloque = !banco.some((q) => q.bloque === p.bloque && hecha(q.id));
  const entrada = primeraDelBloque ? entradaDeBloque(p.bloque) : undefined;
  return { tipo: 'pregunta', pregunta: p, conM1: llevaM1(p, respuestas, banco), esperaRespuesta: esperaRespuesta(p), ...(entrada ? { entrada } : {}) };
}

/**
 * La próxima cosa para mandar. Orden (banco.md, Reglas del flujo y Dudas 3-4):
 *   1. el núcleo de los bloques 1 a 14, en orden, salteando lo que no cumple;
 *   2. la oferta de la ronda extra;
 *   3. si la aceptó, las extra de los bloques 1 a 14, en orden;
 *   4. el bloque 15 (con LE6 solo si aceptó la extra), y las preguntas de
 *      la familia justo antes de FO1.
 * Una pregunta ya está hecha si tiene respuesta o figura en `enviados`.
 */
export function siguientePregunta(e: EstadoEntrevista, banco: readonly PreguntaEntrevista[] = BANCO): Siguiente {
  const enviados = e.enviados ?? new Set<string>();
  const ronda = e.rondaExtra ?? (e.ofrecerExtra ? 'sin-ofrecer' : 'rechazada');
  const hecha = (id: string) => e.respuestas.has(id) || enviados.has(id);
  const pendiente = (p: PreguntaEntrevista) => !hecha(p.id) && cumple(p, e.respuestas);

  // Desde el 30/09 todos los cierres son del núcleo (llegan siempre), así que
  // ya no hace falta la regla de "paso en una pregunta que abre tema → el
  // cierre va en el núcleo aunque sea extra" (correcciones-lectura.md).
  const vaEnNucleo = (p: PreguntaEntrevista) => p.parte === 'nucleo';

  const principal = banco.filter((p) => p.bloque !== BLOQUE_FINAL);
  for (const p of principal) if (vaEnNucleo(p) && pendiente(p)) return comoSiguiente(p, e.respuestas, banco, hecha);

  if (ronda === 'sin-ofrecer') return { tipo: 'ofrecer-extra' };
  if (ronda === 'aceptada') for (const p of principal) if (p.parte === 'extra' && pendiente(p)) return comoSiguiente(p, e.respuestas, banco, hecha);

  const final = banco.filter((p) => p.bloque === BLOQUE_FINAL && (p.parte === 'nucleo' || ronda === 'aceptada'));
  const ordenFamilia = banco.find((p) => p.id === FAMILIA_ANTES_DE)?.orden ?? Infinity;
  const familia = (e.familia ?? []).find((f) => !e.respuestas.has(f.id));
  for (const p of final) {
    if (familia && p.orden >= ordenFamilia) return { tipo: 'familia', pregunta: familia, antes: 'M15' };
    if (pendiente(p)) return comoSiguiente(p, e.respuestas, banco, hecha);
  }
  if (familia) return { tipo: 'familia', pregunta: familia, antes: 'M15' };
  return { tipo: 'terminada' };
}

/** Después de esta pregunta va directo el mensaje final, sin acuse (Naza, 30/09, ronda 2: el final es LE7 → familia → FO1 → LE9 → LE8 → FIN). */
export const SIN_ACUSE_ANTES_DEL_FINAL = 'LE8';
/** Después de LE9 tampoco va acuse: "Ahora sí, hablale a tu familia…" (LE8) arranca sola (Naza, 30/09, ronda 4). */
export const SIN_ACUSE: readonly string[] = ['LE9', SIN_ACUSE_ANTES_DEL_FINAL];

/**
 * Qué acuse va después de contestar (familias de mensajes; el entrevistador
 * rota M3, M4, M24 y M25): cierre de bloque → M24, o M25 (neutro) si se
 * contestó con un "no" corto o "paso"; "paso" → M21; sensible → M4; si no → M3. El aviso y el final no se contestan: nada. LE8 tampoco lleva
 * acuse: después va directo FIN. Desde el 30/09 (ronda 2) no va M10: la frase
 * de entrada del bloque siguiente hace de pasaje. Cómo se arma el mensaje
 * (pegado a lo que sigue o solo): `armarTurno` en mensajes.ts.
 */
export function mensajesDespues(pregunta: Pick<PreguntaEntrevista, 'id' | 'bloque' | 'clase' | 'sensible'>, respuesta: Respuesta): ('M3' | 'M4' | 'M21' | 'M24' | 'M25')[] {
  if (!esperaRespuesta(pregunta)) return [];
  if (SIN_ACUSE.includes(pregunta.id)) return [];
  // Un cierre contestado con un "no" corto o "paso": acuse neutro, sin agradecer un contenido que no hubo (Naza, 30/09).
  if (pregunta.clase === 'cierre') return esPaso(respuesta) || esNoCorto(respuesta) ? ['M25'] : ['M24'];
  // Lo mismo con una sensible: "Gracias por confiármelo" no va después de un "no" o un "paso" (Naza, 30/09, ronda 3).
  if (pregunta.sensible && (esPaso(respuesta) || esNoCorto(respuesta))) return ['M25'];
  if (esPaso(respuesta)) return ['M21'];
  return [pregunta.sensible ? 'M4' : 'M3'];
}

/** El acuse de turno de una familia que rota: M3 tiene 8 (M3.1…M3.8), M4 y M24 tienen 4, M25 tiene 3. */
export function acuseRotado(familia: 'M3' | 'M4' | 'M24' | 'M25', n: number): string {
  const total = familia === 'M3' ? 8 : familia === 'M25' ? 3 : 4;
  return `${familia}.${(((n % total) + total) % total) + 1}`;
}

// ---------------------------------------------------------------- ficha contra respuestas

/**
 * Una duda para el dashboard (no se manda por WhatsApp: Naza, 30/09). `mensaje`
 * dice qué texto aprobado mostrar (DD1: la ficha dice que sí y contestó que
 * no; DD2: la ficha dice que no y contó algo) y `temaTexto` llena {{tema}}.
 * `texto` es la descripción interna, para el equipo.
 */
export type DudaFicha = {
  tema: 'hermanos' | 'pareja' | 'hijos' | 'nietos' | 'mudarse';
  pregunta: string;
  texto: string;
  mensaje: 'DD1' | 'DD2';
  temaTexto: string;
};

type Tema = { tema: DudaFicha['tema']; pregunta: string; campo: keyof FichaV3; si: string; no: string };

/** Las preguntas que abren un tema y el campo de la ficha que dice lo mismo. */
/** Cómo se nombra el tema en DD1 y DD2 ({{tema}}). "El amor" y no "tu pareja" (Naza, 30/09). */
export const TEMA_TEXTO: Record<DudaFicha['tema'], string> = {
  hermanos: 'tus hermanos',
  pareja: 'el amor',
  hijos: 'tus hijos',
  nietos: 'tus nietos',
  mudarse: 'vivir en otro lugar',
};

const TEMAS: readonly Tema[] = [
  { tema: 'hermanos', pregunta: 'CA6', campo: 'hermanos', si: 'tiene hermanos', no: 'no tiene hermanos' },
  { tema: 'mudarse', pregunta: 'JU8', campo: 'migracion', si: 'se fue a vivir a otro lugar', no: 'no se fue a vivir a otro lugar' },
  { tema: 'pareja', pregunta: 'AM0', campo: 'parejas', si: 'tuvo pareja', no: 'no tuvo pareja' },
  { tema: 'hijos', pregunta: 'HI0', campo: 'hijos', si: 'tiene hijos', no: 'no tiene hijos' },
  { tema: 'nietos', pregunta: 'HI8', campo: 'nietos', si: 'tiene nietos', no: 'no tiene nietos' },
];

/**
 * La ficha no decide qué se manda, pero se compara con las respuestas que
 * abren un tema: si la ficha dice que tiene y contestó un "no" corto, o si la
 * ficha dice que no tiene y contó algo, queda una duda neutral para el
 * dashboard (decide el narrador). Si la ficha no dice nada, o la respuesta
 * fue "paso" o no llegó, no hay duda.
 */
export function contradiccionesConFicha(ficha: FichaV3, respuestas: Respuestas): DudaFicha[] {
  const dudas: DudaFicha[] = [];
  for (const t of TEMAS) {
    const segunFicha = estado(ficha[t.campo]);
    if (segunFicha === 'lleno' && respondioNo(respuestas, t.pregunta)) {
      dudas.push({ tema: t.tema, pregunta: t.pregunta, texto: `La ficha dice que ${t.si} y en la entrevista contestó que no (${t.pregunta}).`, mensaje: 'DD1', temaTexto: TEMA_TEXTO[t.tema] });
    } else if (segunFicha === 'no-tiene' && contoAlgo(respuestas, t.pregunta)) {
      dudas.push({ tema: t.tema, pregunta: t.pregunta, texto: `La ficha dice que ${t.no} y en la entrevista contó algo (${t.pregunta}).`, mensaje: 'DD2', temaTexto: TEMA_TEXTO[t.tema] });
    }
  }
  return dudas;
}
