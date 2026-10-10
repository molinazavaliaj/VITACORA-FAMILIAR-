// El banco V3 tipado. `banco-v3.json` lo genera `scripts/v3-banco-json.ts`
// desde docs/v3/banco-v3.md (la fuente); un test chequea que estén al día.

import bancoJson from './banco-v3.json' with { type: 'json' };
import type { PreguntaBanco } from './banco-md.js';

export type { PreguntaBanco, Tamanio, Clase } from './banco-md.js';

export const BANCO: PreguntaBanco[] = bancoJson as PreguntaBanco[];

const POR_ID = new Map(BANCO.map((p) => [p.id, p]));

export function preguntaPorId(id: string): PreguntaBanco | undefined {
  return POR_ID.get(id);
}

/**
 * ¿La fila entra en ese tamaño de libro, sin mirar gates? B entra en los
 * tres; E en Estándar y Completo; E-joven en Estándar solo con menos de 45
 * (si no, solo en Completo); C solo en Completo.
 */
export function entraEnTamanio(p: Pick<PreguntaBanco, 'tamanio'>, tamanio: 'B' | 'E' | 'C', joven: boolean): boolean {
  if (tamanio === 'C') return true;
  if (tamanio === 'B') return p.tamanio === 'B';
  return p.tamanio === 'B' || p.tamanio === 'E' || (p.tamanio === 'E-joven' && joven);
}
