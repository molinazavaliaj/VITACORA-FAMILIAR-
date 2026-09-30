// El flujo de la entrevista (docs/v3/entrevista/banco.md, "Reglas del
// flujo"): qué cuenta como "no" corto, si una pregunta se manda según las
// respuestas, cuál es la próxima, qué acuse va después y qué dudas deja la
// ficha contra las respuestas. Todo puro, sin I/O: el entrevistador guarda el
// estado y llama a estas funciones.

import { estado, type FichaV3 } from '../ficha.js';
import { BANCO, mensajePorId, preguntaPorId, type PreguntaEntrevista } from './banco.js';
import { habilitaLasQueDependen, interpretar, PREGUNTA_COMUN, type Interpretacion, type PreguntaParaInterpretar } from './respuesta.js';

/** Respuesta a una pregunta: el texto (transcripción) o lo que dijo, incluido "paso". */
export type Respuesta = string;
/** Respuestas por ID de pregunta. Solo están las preguntas que se mandaron y se contestaron. */
export type Respuestas = ReadonlyMap<string, Respuesta>;

// ---------------------------------------------------------------- respuestas

// Qué dijo la persona lo decide una sola función, `interpretar` (respuesta.ts;
// Naza, 30/09, simulaciones). Estas son las preguntas que le hacen los demás
// módulos; todas pasan por ahí, con la pregunta para saber el tope del "no".

export { normalizar, PALABRAS_NO_CORTO } from './respuesta.js';

/** La pregunta del banco con ese ID; si no está (una de la familia), una común. */
function preguntaDe(id: string): PreguntaParaInterpretar {
  return preguntaPorId(id) ?? { ...PREGUNTA_COMUN, id };
}

/** ¿Dijo "paso"? (o tocó [Paso esta]). Sin pregunta, se toma como una común. */
export function esPaso(respuesta: Respuesta, pregunta: PreguntaParaInterpretar = PREGUNTA_COMUN): boolean {
  return interpretar(pregunta, respuesta) === 'paso';
}

/**
 * ¿Fue un "no" corto (o tocó un botón de "No")? Hasta 15 palabras en una
 * común y hasta 40 en cierres, LE9, sensibles y las que abren tema (Naza,
 * 30/09, simulaciones; antes: menos de 15 en todas). Sin pregunta, se toma
 * como una común.
 */
export function esNoCorto(respuesta: Respuesta, pregunta: PreguntaParaInterpretar = PREGUNTA_COMUN): boolean {
  return interpretar(pregunta, respuesta) === 'no';
}

/** Qué dijo en la pregunta X (undefined si X no se contestó). */
export function interpretacionDe(respuestas: Respuestas, id: string): Interpretacion | undefined {
  const r = respuestas.get(id);
  return r === undefined ? undefined : interpretar(preguntaDe(id), r);
}

/** X se contestó con un "no" corto o un botón de "No". */
export function respondioNo(respuestas: Respuestas, id: string): boolean {
  return interpretacionDe(respuestas, id) === 'no';
}

/** X se contestó contando algo (o tocando "Sí", o con un "ya te lo conté"): no un "no", un "paso", un olvido ni nada. */
export function contoAlgo(respuestas: Respuestas, id: string): boolean {
  const i = interpretacionDe(respuestas, id);
  return i === 'conto' || i === 'ya-conto';
}

/**
 * ¿Se manda la pregunta, según sus condiciones? Sin condiciones, sí. Con
 * varias, alcanza una (OR). `si:X` pide que X haya sido un "sí": tocó "Sí",
 * contó algo, dijo "ya te lo conté" o no se acordó (un olvido cuenta como
 * "sí": mejor una pregunta de más que un capítulo de menos; Naza, 30/09,
 * simulaciones). `sino:X` pide que X haya sido un "no" corto o un botón de
 * "No". Si X no se mandó o fue "paso", no se cumple ninguna de las dos.
 */
export function cumple(pregunta: Pick<PreguntaEntrevista, 'depende'>, respuestas: Respuestas): boolean {
  if (pregunta.depende.length === 0) return true;
  return pregunta.depende.some((c) => {
    const i = interpretacionDe(respuestas, c.de);
    if (i === undefined) return false;
    return c.tipo === 'si' ? habilitaLasQueDependen(i) : i === 'no';
  });
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
 * Las familias de acuse. Rotan M3 (8), M4 (4), M24 (4), M25 (3) y M27 (3);
 * M28 tiene uno solo en uso (M28.1: M28.2 y M28.3 en reserva); M21, M26 y
 * M29 son uno.
 */
export type FamiliaAcuse = 'M3' | 'M4' | 'M21' | 'M24' | 'M25' | 'M26' | 'M27' | 'M28' | 'M29';

/** Después de PG1 ("tus viejos de grande", a veces su muerte) el acuse es siempre "Gracias, {{nombre}}." (Naza, 30/09, simulaciones). */
export const SIEMPRE_M26 = 'PG1';
/** M29 va una sola vez, al tercer olvido seguido (regla 17). */
export const OLVIDOS_PARA_M29 = 3;

/** ¿Después de esta pregunta puede ir un acuse de olvido? (no en las que no llevan acuse ni en PG1, que lleva M26). */
function llevaAcuseDeOlvido(id: string): boolean {
  const p = preguntaPorId(id);
  return (!p || esperaRespuesta(p)) && !SIN_ACUSE.includes(id) && id !== SIEMPRE_M26;
}

/**
 * ¿Este olvido lleva M29? Solo el primero que llega con 3 o más olvidos
 * seguidos y que lleva acuse; después de eso, nunca más en la entrevista
 * (regla 17). Se recorren las respuestas anteriores en el orden en que
 * llegaron (el Map conserva el orden de inserción).
 */
function esElOlvidoDeM29(pregunta: Pick<PreguntaEntrevista, 'id'>, anteriores: Respuestas): boolean {
  let seguidos = 0;
  let usado = false;
  const toca = (id: string, r: Respuesta) => {
    if (interpretar(preguntaDe(id), r) !== 'olvido') {
      seguidos = 0;
      return false;
    }
    seguidos++;
    if (usado || seguidos < OLVIDOS_PARA_M29 || !llevaAcuseDeOlvido(id)) return false;
    usado = true;
    return true;
  };
  for (const [id, r] of anteriores) if (id !== pregunta.id) toca(id, r);
  return !usado && seguidos + 1 >= OLVIDOS_PARA_M29;
}

/**
 * Qué acuse va después de contestar (textos-finales.md, reglas 26 a 31;
 * Naza, 30/09, simulaciones). El aviso y el final no se contestan: nada;
 * después de LE9 y LE8, nada. Después de PG1, siempre M26. Si no, según lo
 * que dijo (`interpretar`):
 *   - "no" corto o botón de "No", y "ya te lo conté" → M25 (en todas);
 *   - "paso" → M25 en un cierre, M27 en una sensible, M21 en una común;
 *   - olvido → M28 (M28.1), o M29 al tercero seguido, una sola vez: para eso
 *     hacen falta las respuestas anteriores, en orden (`anteriores`);
 *   - contó algo (o tocó "Sí") → M24 en un cierre, M4 en una sensible, M3.
 * Qué acuse de la familia va y si cambia por lo que sigue (M26 antes de un
 * cierre, LE9 o una sensible): `acuseDeTurno` en mensajes.ts; cómo se arma
 * el mensaje: `armarTurno`.
 */
export function mensajesDespues(
  pregunta: Pick<PreguntaEntrevista, 'id' | 'bloque' | 'clase' | 'sensible'> & Pick<PreguntaParaInterpretar, 'botones'>,
  respuesta: Respuesta,
  anteriores: Respuestas = new Map(),
): FamiliaAcuse[] {
  if (!esperaRespuesta(pregunta)) return [];
  if (SIN_ACUSE.includes(pregunta.id)) return [];
  if (pregunta.id === SIEMPRE_M26) return ['M26'];
  const dijo = interpretar(pregunta, respuesta);
  if (dijo === 'no' || dijo === 'ya-conto') return ['M25'];
  if (dijo === 'paso') return [pregunta.clase === 'cierre' ? 'M25' : pregunta.sensible ? 'M27' : 'M21'];
  if (dijo === 'olvido') return [esElOlvidoDeM29(pregunta, anteriores) ? 'M29' : 'M28'];
  if (pregunta.clase === 'cierre') return ['M24'];
  return [pregunta.sensible ? 'M4' : 'M3'];
}

/** Las familias que rotan y cuántos tienen. */
export const ROTAN = { M3: 8, M4: 4, M24: 4, M25: 3, M27: 3 } as const;

/** El acuse de turno de una familia que rota: M3 tiene 8 (M3.1…M3.8), M4 y M24 tienen 4, M25 y M27 tienen 3. */
export function acuseRotado(familia: keyof typeof ROTAN, n: number): string {
  const total = ROTAN[familia];
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
