// El banco de Vitácora de Viaje V2, tipado. `banco.json` lo genera
// `scripts/viaje-v2-json.ts` desde docs/viajes-v2/banco.md (la fuente); un
// test chequea que estén al día.

import bancoJson from './banco.json' with { type: 'json' };
import type { FilaBanco, Momento } from './banco-md.js';

export type { FilaBanco, Momento } from './banco-md.js';

/** Todas las filas, en el orden del md. */
export const BANCO: readonly FilaBanco[] = bancoJson as FilaBanco[];

const POR_ID = new Map(BANCO.map((f) => [f.id, f]));

/** La fila con ese ID. Tira error si no existe: un ID mal escrito no puede mandar un mensaje vacío. */
export function porId(id: string): FilaBanco {
  const f = POR_ID.get(id);
  if (!f) throw new Error(`El banco de viaje no tiene el ID ${id}`);
  return f;
}

/** Las filas de un momento, por Orden (las que no tienen Orden, al final, en el orden del md). */
export function deMomento(momento: Momento): FilaBanco[] {
  return BANCO.filter((f) => f.momento === momento).sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));
}
