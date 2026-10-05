// El banco de Kids V2, tipado. `banco.json` lo genera scripts/kids-v2-json.ts
// desde docs/kids/v2/banco.md y mensajes.md (la fuente); un test chequea que
// esté al día.

import bancoJson from './banco.json' with { type: 'json' };
import type { IdMensaje } from './banco-md.js';
import type { BancoKids, Extra, MensajeFijo, Pregunta } from './tipos.js';

export type { IdMensaje } from './banco-md.js';

export const BANCO: BancoKids = bancoJson as BancoKids;

const PREGUNTAS = new Map(BANCO.preguntas.map((p) => [p.id, p]));
const MENSAJES = new Map(BANCO.mensajes.map((m) => [m.id, m]));
const EXTRAS = new Map(BANCO.extras.map((x) => [x.id, x]));

/** La principal con ese ID (K1…K47). Tira error si no existe. */
export function pregunta(id: string): Pregunta {
  const p = PREGUNTAS.get(id);
  if (!p) throw new Error(`El banco de kids no tiene la pregunta ${id}`);
  return p;
}

/** El mensaje fijo con ese ID. Tira error si no existe: nunca un mensaje vacío. */
export function fijo(id: IdMensaje): MensajeFijo {
  const m = MENSAJES.get(id);
  if (!m) throw new Error(`El banco de kids no tiene el mensaje ${id}`);
  return m;
}

export function extra(id: string): Extra {
  const x = EXTRAS.get(id);
  if (!x) throw new Error(`El banco de kids no tiene la extra ${id}`);
  return x;
}
