// El banco de Vitácora de Viaje V2, tipado. `banco.json` lo genera
// `scripts/viaje-v2-json.ts` desde docs/viajes-v2/banco.md (la fuente); un
// test chequea que estén al día.
//
// Otros idiomas: `banco-ca.json` y `banco-es-ES.json` salen de
// docs/viajes-v2/idiomas/banco-<idioma>.md y traen solo los textos.
// `bancoDe(idioma)` es el mismo banco (mismas filas, momentos y orden) con
// los textos de ese idioma.

import bancoJson from './banco.json' with { type: 'json' };
import bancoCaJson from './banco-ca.json' with { type: 'json' };
import bancoEsEsJson from './banco-es-ES.json' with { type: 'json' };
import type { FilaBanco, Momento } from './banco-md.js';
import type { TextosIdioma } from './banco-idioma-md.js';
import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';

export type { FilaBanco, Momento } from './banco-md.js';
export type { Idioma } from './idioma.js';

/** Todas las filas, en el orden del md (es-AR). */
export const BANCO: readonly FilaBanco[] = bancoJson as FilaBanco[];

/** Los textos de cada idioma que no es el de banco.md. */
export const TEXTOS_IDIOMA: Readonly<Record<Exclude<Idioma, 'es-AR'>, TextosIdioma>> = {
  ca: bancoCaJson as TextosIdioma,
  'es-ES': bancoEsEsJson as TextosIdioma,
};

type Armado = { banco: readonly FilaBanco[]; porId: ReadonlyMap<string, FilaBanco> };

const ARMADOS = new Map<Idioma, Armado>([[IDIOMA_POR_DEFECTO, { banco: BANCO, porId: new Map(BANCO.map((f) => [f.id, f])) }]]);

/**
 * El banco de banco.md con los textos de otro idioma. Si a una fila le falta
 * su texto (o su variante "ya de viaje"), error: nunca sale un texto en
 * castellano rioplatense en un viaje en catalán.
 */
function armar(idioma: Exclude<Idioma, 'es-AR'>): Armado {
  const t = TEXTOS_IDIOMA[idioma];
  const banco = BANCO.map((f): FilaBanco => {
    const texto = t.textos[f.id];
    if (texto === undefined) throw new Error(`${idioma}: falta el texto de ${f.id}`);
    let yaDeViaje: string | null = null;
    if (f.yaDeViaje !== null) {
      yaDeViaje = t.yaDeViaje[f.id] ?? null;
      if (yaDeViaje === null) throw new Error(`${idioma}: falta la variante "ya de viaje" de ${f.id}`);
    }
    return { ...f, texto, yaDeViaje };
  });
  return { banco, porId: new Map(banco.map((f) => [f.id, f])) };
}

function armado(idioma: Idioma): Armado {
  let a = ARMADOS.get(idioma);
  if (!a) {
    a = armar(idioma as Exclude<Idioma, 'es-AR'>);
    ARMADOS.set(idioma, a);
  }
  return a;
}

/** Todas las filas en ese idioma, en el orden del md (es-AR: BANCO). */
export function bancoDe(idioma: Idioma = IDIOMA_POR_DEFECTO): readonly FilaBanco[] {
  return armado(idioma).banco;
}

/** La fila con ese ID. Tira error si no existe: un ID mal escrito no puede mandar un mensaje vacío. */
export function porId(id: string, idioma: Idioma = IDIOMA_POR_DEFECTO): FilaBanco {
  const f = armado(idioma).porId.get(id);
  if (!f) throw new Error(`El banco de viaje no tiene el ID ${id}`);
  return f;
}

/** Las filas de un momento, por Orden (las que no tienen Orden, al final, en el orden del md). */
export function deMomento(momento: Momento, idioma: Idioma = IDIOMA_POR_DEFECTO): FilaBanco[] {
  return bancoDe(idioma)
    .filter((f) => f.momento === momento)
    .sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));
}
