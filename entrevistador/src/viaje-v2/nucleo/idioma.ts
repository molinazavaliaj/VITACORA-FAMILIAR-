// El idioma de la entrevista de viaje (mismo molde que V3:
// docs/v3/entrevista/catala/diseno.md). Cada idioma es un paquete
// (paquete.ts): sus textos, los dos valores de {{formato}}, la plantilla de
// Meta y las palabras que entiende el sistema.
//
// La estructura (IDs, momentos, orden, reglas) sale SIEMPRE de banco.md. Los
// archivos de idioma (docs/viajes-v2/idiomas/banco-<idioma>.md) traen solo el
// texto.

/** `es-AR`: castellano rioplatense, con vos (el de siempre). `es-ES`: castellano de España, con tú. `ca`: catalán. */
export type Idioma = 'es-AR' | 'es-ES' | 'ca';

/** Sin idioma en la compra, la entrevista es la de siempre. */
export const IDIOMA_POR_DEFECTO: Idioma = 'es-AR';

export const IDIOMAS: readonly Idioma[] = ['es-AR', 'es-ES', 'ca'];

export function esIdioma(x: unknown): x is Idioma {
  return typeof x === 'string' && (IDIOMAS as readonly string[]).includes(x);
}

/**
 * El idioma de la compra. Vacío → es-AR. Uno que no se conoce es un error:
 * mejor frenar que mandar un viaje entero en el idioma equivocado.
 */
export function idiomaDe(compra: { idioma?: unknown } | undefined): Idioma {
  const x = compra?.idioma;
  if (x === undefined || x === null || x === '') return IDIOMA_POR_DEFECTO;
  if (esIdioma(x)) return x;
  throw new Error(`Idioma del viaje desconocido: ${JSON.stringify(x)} (se conocen: ${IDIOMAS.join(', ')}).`);
}
