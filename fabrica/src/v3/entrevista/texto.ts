// Llena un texto del banco de la entrevista (docs/v3/entrevista/banco.md,
// sección "Notación"): {{o/a}} y {{padre/madre}} según el género, {{nombre}},
// {{etapa}}, {{quien_regala}} y la variante «sino:X: a ‖ b» según la
// respuesta a X. Puro: no lee nada de afuera.

import type { FichaV3 } from '../ficha.js';
import { respondioNo, type Respuestas } from './flujo.js';

/**
 * Lo que la entrevista necesita de la ficha, además de FichaV3 (que no se
 * toca): quién regaló, para el aviso M9 ({{quien_regala}}).
 */
export type FichaEntrevista = FichaV3 & { quienRegala?: string };

/** Los campos de la ficha que usan los textos (metodo-entrevista.md §21). */
export type FichaTexto = Pick<FichaEntrevista, 'nombre' | 'genero' | 'formaTrato' | 'quienRegala'>;

export type OpcionesTexto = {
  /** Cómo se nombra la etapa en M10 y CI2 ("tu infancia"…). Sin texto aprobado todavía: si no llega, queda {{etapa}}. */
  etapa?: string;
  /** El tema de una duda del dashboard (DD1, DD2): "tus hijos", "el amor"… */
  tema?: string;
};

/** ¿Se le habla en masculino? Varón, u "otro" que prefiere trato masculino; si no, femenino (mismo criterio que seleccion.ts viejo). */
export function tratoMasculino(ficha: Pick<FichaV3, 'genero' | 'formaTrato'>): boolean {
  return ficha.genero === 'varon' || (ficha.genero === 'otro' && ficha.formaTrato === 'masculino');
}

const VARIANTE = /«sino:([A-Z]{1,4}\d*(?:\.\d+)?b?): (.*?) ‖ (.*?)»/g;

/** Los IDs que usa una variante «sino:X: …» dentro del texto. */
export function idsEnVariantes(texto: string): string[] {
  return [...texto.matchAll(VARIANTE)].map((m) => m[1]);
}

/**
 * Llena el texto. Lo que no tiene valor (quien_regala sin dato, etapa sin
 * pasar) queda como {{campo}}, para que se vea.
 */
export function renderizar(texto: string, ficha: FichaTexto, respuestas?: Respuestas, opciones: OpcionesTexto = {}): string {
  const varon = tratoMasculino(ficha);
  const r: Respuestas = respuestas ?? new Map();
  const valores: Record<string, string | undefined> = {
    nombre: ficha.nombre,
    etapa: opciones.etapa,
    quien_regala: ficha.quienRegala,
    tema: opciones.tema,
  };
  let t = texto;
  // Variante según la respuesta a otra pregunta: si fue un "no" corto, la primera forma.
  t = t.replace(VARIANTE, (_m, id: string, a: string, b: string) => (respondioNo(r, id) ? a : b));
  // Género del narrador: {{o/a}}, {{padre/madre}}.
  t = t.replace(/\{\{([^{}/]+)\/([^{}/]+)\}\}/g, (_m, m: string, f: string) => (varon ? m : f));
  // Campos simples.
  t = t.replace(/\{\{(\w+)\}\}/g, (m, campo: string) => valores[campo] ?? m);
  return t;
}
