// El idioma de un chico de Kids (mismo molde que la Viaje V2, src/viaje-v2/idioma.ts).
//
// es-AR: castellano rioplatense, con vos (el de siempre; sale de docs/kids/v2/banco.md y mensajes.md).
// es-ES: castellano de España, con tú (docs/kids/v2/idiomas/banco-es-ES.md, solo los textos por ID).
//
// La estructura (orden, ramas, qué vale cada botón, fotos, marcas, reglas) sale SIEMPRE de banco.md y
// mensajes.md. El idioma solo cambia lo que se lee: textos, botones, títulos y el nombre de las plantillas.
// No hay Kids en catalán.

export type IdiomaKids = 'es-AR' | 'es-ES';

/** Sin idioma en la ficha, Kids es el de siempre. */
export const IDIOMA_POR_DEFECTO: IdiomaKids = 'es-AR';

export const IDIOMAS_KIDS: readonly IdiomaKids[] = ['es-AR', 'es-ES'];

export function esIdiomaKids(x: unknown): x is IdiomaKids {
  return typeof x === 'string' && (IDIOMAS_KIDS as readonly string[]).includes(x);
}

/**
 * El idioma de la ficha. Sin el campo → es-AR. Uno que no se conoce es un error: mejor frenar que mandarle
 * a un chico todo el libro en el idioma equivocado.
 */
export function idiomaDe(ficha: { idioma?: unknown } | undefined): IdiomaKids {
  const x = ficha?.idioma;
  if (x === undefined || x === null || x === '') return IDIOMA_POR_DEFECTO;
  if (esIdiomaKids(x)) return x;
  throw new Error(`Idioma de Kids desconocido: ${JSON.stringify(x)} (se conocen: ${IDIOMAS_KIDS.join(', ')}).`);
}

/** Las plantillas de Meta de cada idioma: mismo nombre con un sufijo (plantillas-meta-kids-es-ES.md). */
export const PLANTILLA_KIDS_IDIOMA: Readonly<Record<IdiomaKids, { sufijo: string; idiomaMeta: string }>> = {
  'es-AR': { sufijo: '', idiomaMeta: 'es' },
  'es-ES': { sufijo: '_es_es', idiomaMeta: 'es_ES' },
};

/** `kids_final` → `kids_final_es_es` en es-ES. */
export function nombrePlantilla(nombre: string, idioma: IdiomaKids): string {
  return `${nombre}${PLANTILLA_KIDS_IDIOMA[idioma].sufijo}`;
}
