// El banco de la entrevista tipado. `banco.json` lo genera
// `scripts/v3-entrevista-json.ts` desde docs/v3/entrevista/banco.md (la
// fuente); un test chequea que estén al día.

import bancoJson from './banco.json' with { type: 'json' };
import type { BancoEntrevista, MensajeEntrevista, PreguntaEntrevista } from './banco-md.js';

export type { BancoEntrevista, MensajeEntrevista, PreguntaEntrevista, Condicion, Parte, Clase } from './banco-md.js';

const DATOS = bancoJson as BancoEntrevista;

/** Todas las preguntas, en orden de envío. */
export const BANCO: readonly PreguntaEntrevista[] = DATOS.preguntas;

/** Arranque y mensajes fijos (BIEN, M6, M1, M3.1…M3.8, M4.1…M4.4, M8…). */
export const MENSAJES: readonly MensajeEntrevista[] = DATOS.mensajes;

/** Nombre de cada bloque, como en el md ("Amor y pareja"). */
export const NOMBRES_BLOQUE: Readonly<Record<number, string>> = DATOS.nombresBloque;

const POR_ID = new Map(BANCO.map((p) => [p.id, p]));
const MENSAJE_POR_ID = new Map(MENSAJES.map((m) => [m.id, m]));

export function preguntaPorId(id: string): PreguntaEntrevista | undefined {
  return POR_ID.get(id);
}

export function mensajePorId(id: string): MensajeEntrevista | undefined {
  return MENSAJE_POR_ID.get(id);
}
