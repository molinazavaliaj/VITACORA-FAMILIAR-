// Parser de docs/historia/temas.md → los textos de cada tema por idioma. Lo
// usa `scripts/historia-json.ts` para generar `temas.json`; un test compara.

import { IDIOMAS, type Idioma } from './idioma.js';
import { esTema, TEMAS_HISTORIA, type TemaHistoria } from './temas.js';

/**
 * Lo que dice temas.md de un tema en un idioma: la etiqueta y la línea de
 * ayuda de la compra, y cómo se nombra la historia dentro de una pregunta
 * ({{historia}}: en segunda persona y en minúscula; Naza, 23/10).
 */
export type TextoTema = { etiqueta: string; ayuda: string; pregunta: string };
export type TextosTemas = Record<TemaHistoria, Record<Idioma, TextoTema>>;

function celdas(linea: string): string[] {
  return linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

type Tabla = 'compra' | 'pregunta';

/**
 * Las dos tablas de temas.md, cada una con sus columnas buscadas por el
 * encabezado:
 *   - la de la compra (la primera): `clave | es-AR | ayuda es-AR | es-ES |
 *     ayuda es-ES | ca | ayuda ca`;
 *   - la de "## En la pregunta": `clave | es-AR | es-ES | ca`.
 * Tira error si una clave no es de TEMAS_HISTORIA, si se repite en su tabla,
 * si falta alguna en alguna tabla o si una celda está vacía.
 */
export function parsearTemasMd(md: string): TextosTemas {
  const compra: Partial<Record<TemaHistoria, Record<Idioma, { etiqueta: string; ayuda: string }>>> = {};
  const pregunta: Partial<Record<TemaHistoria, Record<Idioma, string>>> = {};
  let tabla: Tabla = 'compra';
  let columnas: string[] | undefined;
  for (const linea of md.split(/\r?\n/)) {
    const s = /^## (.+)$/.exec(linea);
    if (s) {
      tabla = s[1].startsWith('En la pregunta') ? 'pregunta' : 'compra';
      columnas = undefined;
      continue;
    }
    if (!linea.startsWith('|')) continue;
    const c = celdas(linea);
    if (c[0] === 'clave') {
      columnas = c;
      continue;
    }
    if (!columnas || /^-+$/.test(c[0] ?? '')) continue;
    const clave = c[0];
    if (!esTema(clave)) throw new Error(`temas.md: clave desconocida «${clave}»`);
    const destino = tabla === 'compra' ? compra : pregunta;
    if (destino[clave]) throw new Error(`temas.md: «${clave}» está dos veces`);
    const celda = (columna: string) => {
      const texto = c[columnas!.indexOf(columna)];
      if (!texto) throw new Error(`temas.md: a «${clave}» le falta «${columna}»`);
      return texto;
    };
    if (tabla === 'compra') {
      compra[clave] = Object.fromEntries(IDIOMAS.map((i) => [i, { etiqueta: celda(i), ayuda: celda(`ayuda ${i}`) }])) as Record<Idioma, { etiqueta: string; ayuda: string }>;
    } else {
      pregunta[clave] = Object.fromEntries(IDIOMAS.map((i) => [i, celda(i)])) as Record<Idioma, string>;
    }
  }
  const out = {} as TextosTemas;
  for (const tema of TEMAS_HISTORIA) {
    const c = compra[tema];
    const p = pregunta[tema];
    if (!c) throw new Error(`temas.md: falta «${tema}» en la tabla de la compra`);
    if (!p) throw new Error(`temas.md: falta «${tema}» en «En la pregunta»`);
    out[tema] = Object.fromEntries(IDIOMAS.map((i) => [i, { ...c[i], pregunta: p[i] }])) as Record<Idioma, TextoTema>;
  }
  return out;
}
