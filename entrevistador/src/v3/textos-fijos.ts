// Los textos que el narrador V3 puede leer y que el banco no tiene. Lugar
// único: los aprueba Naza (spec 2026-10-07, "Textos fijos del entrevistador").
// Sin texto aprobado para un idioma, no se manda nada (nunca otro idioma).

import textos from './textos-fijos.json' with { type: 'json' };
import type { Idioma } from './nucleo/entrevista/idioma.js';

export type ClaveTextoFijo = 'fotoSuelta';

const TEXTOS = textos as unknown as Record<ClaveTextoFijo, Partial<Record<Idioma, string>>>;

export function textoFijo(clave: ClaveTextoFijo, idioma: Idioma): string | null {
  const t = TEXTOS[clave]?.[idioma];
  return typeof t === 'string' && t.trim() ? t : null;
}
