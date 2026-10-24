// Lo que el escritor de historia lee de la Carpeta además de lo de Familiar (escritor/lectura.ts, que no se toca):
// las respuestas con su origen (en historia el origen dice el tramo y si la dejó escrita quien regala, y el modelo
// lo necesita), el idioma con el castellano de España, el hueco {{TEMA}} y los títulos fijos.
import type { Carpeta } from '../escritor/carpeta.js';
import { materialDe } from './material/carpeta.js';

export type RespuestaHistoria = { id: string; pregunta: string; texto: string; origen: string };
export type IdiomaHistoria = 'es-AR' | 'es-ES' | 'ca';

export function respuestasConOrigen(c: Carpeta): RespuestaHistoria[] {
  const out: RespuestaHistoria[] = [];
  for (const m of c.leer('entradas/respuestas.xml').matchAll(/<respuesta id="(R\d+)"([^>]*)>([\s\S]*?)<\/respuesta>/g)) {
    const origen = (m[2].match(/origen="([^"]*)"/) || [])[1] || '';
    const pregunta = (m[3].match(/<pregunta>([\s\S]*?)<\/pregunta>/) || [])[1] || '';
    const texto = (m[3].match(/<texto>([\s\S]*?)<\/texto>/) || [])[1] || '';
    if (/^\s*paso\s*$/i.test(texto)) continue;
    out.push({ id: m[1], pregunta: pregunta.trim(), texto: texto.trim(), origen: origen.trim() });
  }
  return out;
}

/** El idioma del libro, de la ficha («Idioma del libro: catalán» o «castellano de España»). */
export function idiomaHistoria(c: Carpeta): IdiomaHistoria {
  const f = c.leer('entradas/ficha.xml');
  if (/^\s*idioma[^:\n]*:\s*(catal|ca\b)/im.test(f)) return 'ca';
  if (/^\s*idioma[^:\n]*:\s*castellano de espa/im.test(f)) return 'es-ES';
  return 'es-AR';
}

/** {{TEMA}} (receta, sección 2): la historia en sus palabras si la hay; si no, la etiqueta del tema con minúscula inicial. */
export function temaHueco(c: Carpeta): string {
  const m = materialDe(c);
  if (m.temaLibre) return m.temaLibre;
  return m.etiqueta.charAt(0).toLowerCase() + m.etiqueta.slice(1);
}

/** Los títulos que imprime el código (receta, sección 1), en el idioma del libro. */
export const titulosFijosHistoria = (idioma: IdiomaHistoria): { frases: string; carta: string } =>
  idioma === 'ca' ? { frases: 'Les seves frases', carta: 'A qui era abans' } : { frases: 'Sus frases', carta: 'A quien era antes' };
