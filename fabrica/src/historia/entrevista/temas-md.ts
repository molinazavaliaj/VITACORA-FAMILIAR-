// Parser de docs/historia/temas.md → los textos de cada tema por idioma. Lo
// usa `scripts/historia-json.ts` para generar `temas.json`; un test compara.

import { IDIOMAS, type Idioma } from './idioma.js';
import { esTema, TEMAS_HISTORIA, type TemaHistoria } from './temas.js';

/** Lo que dice temas.md de un tema en un idioma: la etiqueta y la línea de ayuda. */
export type TextoTema = { etiqueta: string; ayuda: string };
export type TextosTemas = Record<TemaHistoria, Record<Idioma, TextoTema>>;

function celdas(linea: string): string[] {
  return linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/**
 * La tabla de temas.md: `clave | es-AR | ayuda es-AR | es-ES | ayuda es-ES |
 * ca | ayuda ca`. Las columnas se buscan por su encabezado. Tira error si una
 * clave no es de TEMAS_HISTORIA, si se repite, si falta alguna o si una celda
 * está vacía.
 */
export function parsearTemasMd(md: string): TextosTemas {
  const out: Partial<TextosTemas> = {};
  let columnas: string[] | undefined;
  for (const linea of md.split(/\r?\n/)) {
    if (!linea.startsWith('|')) continue;
    const c = celdas(linea);
    if (c[0] === 'clave') {
      columnas = c;
      continue;
    }
    if (!columnas || /^-+$/.test(c[0] ?? '')) continue;
    const clave = c[0];
    if (!esTema(clave)) throw new Error(`temas.md: clave desconocida «${clave}»`);
    if (out[clave]) throw new Error(`temas.md: «${clave}» está dos veces`);
    const textos = {} as Record<Idioma, TextoTema>;
    for (const idioma of IDIOMAS) {
      const etiqueta = c[columnas.indexOf(idioma)];
      const ayuda = c[columnas.indexOf(`ayuda ${idioma}`)];
      if (!etiqueta || !ayuda) throw new Error(`temas.md: a «${clave}» le falta el texto en ${idioma}`);
      textos[idioma] = { etiqueta, ayuda };
    }
    out[clave] = textos;
  }
  const faltan = TEMAS_HISTORIA.filter((t) => !out[t]);
  if (faltan.length > 0) throw new Error(`temas.md: faltan ${faltan.join(', ')}`);
  return out as TextosTemas;
}
