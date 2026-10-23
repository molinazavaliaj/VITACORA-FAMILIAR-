// Llena un texto del banco de historia (docs/historia/banco.md, "Notación").
// Copia de src/v3/entrevista/texto.ts: {{o/a}} (y en catalán la palabra
// entera, {{sol/sola}}) según el género, {{nombre}}, {{quien_regala}} y la
// variante «sino:X: a ‖ b» según la respuesta a X. Suma {{historia}} (el
// tema en segunda persona, de temas.md) y {{pregunta}} (la que dejó escrita
// quien regala, tal cual). Sin lo de V3: {{nombre_pila}} (OR6), {{etapa}} y
// {{tema}} (DD1/DD2).
// Puro: no lee nada de afuera.

import type { FichaHistoria } from '../ficha.js';
import { PATRON_ID } from './banco-md.js';
import { nombreDelTema } from './banco.js';
import { respondioNo, type Respuestas } from './flujo.js';
import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';

/**
 * Lo que la entrevista necesita de la ficha, además de FichaHistoria: quién
 * regaló ({{quien_regala}}: TEMA-ABIERTO, PR-H, M9) y el idioma.
 */
export type FichaEntrevista = FichaHistoria & {
  quienRegala?: string;
  /** El idioma de la entrevista. Sin idioma, es-AR. */
  idioma?: Idioma;
};

/** Los campos de la ficha que usan los textos. */
export type FichaTexto = Pick<FichaEntrevista, 'nombre' | 'genero' | 'formaTrato' | 'quienRegala' | 'idioma' | 'tema' | 'temaLibre'>;

export type OpcionesTexto = {
  /** {{pregunta}} en PR-H1…PR-H3: la que dejó escrita quien regala. Va tal cual, sin revisión (banco.md, regla 7). */
  pregunta?: string;
};

/** ¿Se le habla en masculino? Varón, u "otro" que prefiere trato masculino; si no, femenino (como en V3). */
export function tratoMasculino(ficha: Pick<FichaHistoria, 'genero' | 'formaTrato'>): boolean {
  return ficha.genero === 'varon' || (ficha.genero === 'otro' && ficha.formaTrato === 'masculino');
}

/**
 * {{historia}}: el tema en segunda persona (temas.md, «En la pregunta»). Lo
 * que escribieron con sus palabras (`temaLibre`) no entra en una pregunta:
 * suele venir en primera persona («cuando me quebré la pierna»), y por eso con
 * `otra` va HC1-A, que no nombra la historia (Naza, 23/10).
 */
export function historiaDe(ficha: Pick<FichaTexto, 'tema' | 'idioma'>): string {
  return nombreDelTema(ficha.tema, ficha.idioma ?? IDIOMA_POR_DEFECTO);
}

const VARIANTE = new RegExp(`«sino:(${PATRON_ID}): (.*?) ‖ (.*?)»`, 'g');

/** Los IDs que usa una variante «sino:X: …» dentro del texto. */
export function idsEnVariantes(texto: string): string[] {
  return [...texto.matchAll(VARIANTE)].map((m) => m[1]);
}

/**
 * Llena el texto. Lo que no tiene valor (quien_regala sin dato, pregunta sin
 * pasar) queda como {{campo}}, para que se vea. {{pregunta}} se llena al
 * final y de una sola pasada: lo que escribió quien regala no se toca, aunque
 * traiga llaves.
 */
export function renderizar(texto: string, ficha: FichaTexto, respuestas?: Respuestas, opciones: OpcionesTexto = {}): string {
  const varon = tratoMasculino(ficha);
  const r: Respuestas = respuestas ?? new Map();
  const valores: Record<string, string | undefined> = {
    nombre: ficha.nombre,
    quien_regala: ficha.quienRegala,
    historia: historiaDe(ficha),
    pregunta: opciones.pregunta,
  };
  let t = texto;
  // Variante según la respuesta a otra pregunta: si fue un "no" corto, la primera forma.
  t = t.replace(VARIANTE, (_m, id: string, a: string, b: string) => (respondioNo(r, id, ficha.idioma) ? a : b));
  // Género del narrador: {{o/a}}, {{sol/sola}}.
  t = t.replace(/\{\{([^{}/]+)\/([^{}/]+)\}\}/g, (_m, m: string, f: string) => (varon ? m : f));
  // Campos simples.
  t = t.replace(/\{\{(\w+)\}\}/g, (m, campo: string) => valores[campo] ?? m);
  return t;
}
