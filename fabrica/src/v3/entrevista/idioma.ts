// El idioma de la entrevista (Naza, 04/10: la entrevista en catalán si quien
// regala lo elige en la ficha). Cada idioma es un paquete: sus textos
// (banco.md para es-AR, banco-ca.md para ca), las frases del detector
// (respuesta.ts), la transcripción (transcribir.ts) y el cazador
// (cazador.ts). Diseño: docs/v3/entrevista/catala/diseno.md.
//
// Para sumar "tú" de España (pendiente): 'es-ES' acá, un banco-es-ES.md con
// sus textos y su entrada en cada paquete. El castellano rioplatense es el
// de siempre y no cambia.

/** `es-AR`: castellano rioplatense, con vos (el de siempre). `ca`: catalán. */
export type Idioma = 'es-AR' | 'ca';

/** Sin idioma en la ficha, la entrevista es la de siempre. */
export const IDIOMA_POR_DEFECTO: Idioma = 'es-AR';

export const IDIOMAS: readonly Idioma[] = ['es-AR', 'ca'];

export function esIdioma(x: unknown): x is Idioma {
  return typeof x === 'string' && (IDIOMAS as readonly string[]).includes(x);
}

/**
 * El idioma de la ficha (`contexto.idioma` en la base). Vacío → es-AR. Un
 * valor que no se conoce es un error: mejor frenar que entrevistar en el
 * idioma equivocado.
 */
export function idiomaDe(ficha: { idioma?: unknown } | undefined): Idioma {
  const x = ficha?.idioma;
  if (x === undefined || x === null || x === '') return IDIOMA_POR_DEFECTO;
  if (esIdioma(x)) return x;
  throw new Error(`Idioma de la entrevista desconocido: ${JSON.stringify(x)} (se conocen: ${IDIOMAS.join(', ')}).`);
}
