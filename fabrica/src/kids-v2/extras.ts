// Qué extras pueden salir (banco.md, "Extras" y "Reglas del flujo"): una
// antes de cerrar cada capítulo del 1 al 4 y el resto al final. Puro.

import { BANCO } from './banco.js';
import { temaDeExtra, type Ficha } from './compra.js';
import type { Cap, Extra } from './tipos.js';

export type HistorialExtras = {
  /** Principales cuya otra puerta ya salió: esa OP no vuelve como extra. */
  opsUsadas: readonly string[];
  /** Extras que ya salieron (en una "una más" o en el final). */
  extrasUsadas: readonly string[];
  /** Rama de K12: true "Tengo hermanos", false "No tengo hermanos", null si no tocó ninguna. */
  hermanos: boolean | null;
  /** K36 contada (no pasada) y sin su otra puerta. */
  peleaK36: boolean;
};

/** En orden del banco. `cap` filtra un capítulo; `soloLivianas` deja las dos marcadas (cap. 4 después de K39). */
export function extrasDisponibles(f: Ficha, h: HistorialExtras, filtro: { cap?: Cap; soloLivianas?: boolean } = {}): Extra[] {
  return BANCO.extras.filter((x) => {
    if (filtro.cap !== undefined && x.cap !== filtro.cap) return false;
    if (filtro.soloLivianas && !x.liviana) return false;
    if (h.extrasUsadas.includes(x.id)) return false;
    if (x.deOp && h.opsUsadas.includes(x.deOp)) return false;
    const tema = temaDeExtra(x);
    if (tema && f.temasSacados.includes(tema)) return false;
    if (x.soloSi === 'hermanos' && h.hermanos !== true) return false;
    if (x.soloSi === 'pelea-k36' && !h.peleaK36) return false;
    return true;
  });
}
