// El idioma de la entrevista (Naza, 04/10: la entrevista en catalán si quien
// regala lo elige en la ficha; 05/10: Argentina va de vos, España de tú,
// catalán en catalán). Cada idioma es un paquete: sus textos (banco.md para
// es-AR, banco-ca.md para ca, banco-es-ES.md para es-ES), las frases del
// detector (respuesta.ts), la transcripción (transcribir.ts) y el cazador
// (cazador.ts, con su prompt entero por idioma). Diseño:
// docs/v3/entrevista/catala/diseno.md (es-ES sigue el mismo molde).
//
// El castellano rioplatense es el de siempre y no cambia. Para sumar otro
// idioma: su código acá, un banco-<idioma>.md con sus textos y su entrada en
// cada paquete (tsc avisa dónde falta).

/** `es-AR`: castellano rioplatense, con vos (el de siempre). `ca`: catalán. `es-ES`: castellano de España, de tú. */
export type Idioma = 'es-AR' | 'ca' | 'es-ES';

/** Cómo se lo nombra en castellano (para la terminal y los informes). */
export const NOMBRE_IDIOMA: Readonly<Record<Idioma, string>> = { 'es-AR': 'castellano rioplatense', ca: 'catalán', 'es-ES': 'castellano de España (de tú)' };

/** Sin idioma en la ficha, la entrevista es la de siempre. */
export const IDIOMA_POR_DEFECTO: Idioma = 'es-AR';

export const IDIOMAS: readonly Idioma[] = ['es-AR', 'ca', 'es-ES'];

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
