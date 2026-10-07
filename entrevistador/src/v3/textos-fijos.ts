// Los textos que el narrador V3 puede leer y que el banco no tiene. Lugar
// único: los aprueba Naza (spec 2026-10-07, "Textos fijos del entrevistador").
// Sin texto aprobado para un idioma, no se manda nada (nunca otro idioma).

import textos from './textos-fijos.json' with { type: 'json' };
import type { Idioma } from './nucleo/entrevista/idioma.js';
import { renderizar, type FichaTexto } from './nucleo/entrevista/texto.js';

export type ClaveTextoFijo = 'fotoSuelta' | 'pausa' | 'reserva';

const TEXTOS = textos as unknown as Record<ClaveTextoFijo, Partial<Record<Idioma, string>>>;

/** El texto aprobado; con la ficha, renderizado igual que los del banco ({{nombre}}, {{o/a}}…). */
export function textoFijo(clave: ClaveTextoFijo, idioma: Idioma, ficha?: FichaTexto): string | null {
  const t = TEXTOS[clave]?.[idioma];
  if (typeof t !== 'string' || !t.trim()) return null;
  return ficha ? renderizar(t, ficha) : t;
}
