// El idioma de un chico de Kids en el bot (CONTRATO, «Vitácora Kids V2 por WhatsApp», `kids_v2.idioma` y
// `ficha.idioma`). El motor habla en el idioma de su ficha (nucleo/idioma.ts): es-AR (vos), es-ES (tú) o ca (catalán,
// de tu). Acá se
// decide qué ficha recibe el motor al arrancar y en qué idioma se transcribe.
//
// - Después del arranque, la verdad es `estado.motor.ficha` (como el resto de la ficha).
// - Al arrancar: `ficha.idioma` si la web lo puso; si no, la columna `kids_v2.idioma`. Si están las dos y no
//   coinciden, o es un idioma que Kids no tiene, tira: mejor no arrancar que mandarle el libro entero en el idioma
//   equivocado (arrancar() avisa a los socios con el error, como con cualquier ficha que el motor rechaza).

import type { Ficha } from './nucleo/compra.js';
import { esIdiomaKids, idiomaDe, type IdiomaKids } from './nucleo/idioma.js';
import type { FilaKids } from './tipos.js';

export function fichaParaArrancar(fila: Pick<FilaKids, 'idioma' | 'ficha'>): Ficha {
  const columna = fila.idioma ?? 'es-AR';
  const enFicha = fila.ficha.idioma;
  if (enFicha !== undefined && enFicha !== columna) {
    throw new Error(`kids_v2.idioma es ${columna} y ficha.idioma es ${enFicha}: no coinciden`);
  }
  if (!esIdiomaKids(columna)) throw new Error(`Kids no tiene textos en ${columna} (hay es-AR, es-ES y ca)`);
  // es-AR sin el campo: la ficha de siempre, tal cual.
  return columna === 'es-AR' && enFicha === undefined ? fila.ficha : { ...fila.ficha, idioma: columna };
}

/** En qué idioma está este chico (para transcribir): el del motor si ya arrancó; si no, el de la compra (es-AR si no se puede saber). */
export function idiomaDeFila(fila: Pick<FilaKids, 'idioma' | 'ficha' | 'estado'>): IdiomaKids {
  if (fila.estado) return idiomaDe(fila.estado.motor.ficha);
  try {
    return idiomaDe(fichaParaArrancar(fila));
  } catch {
    return 'es-AR';
  }
}
