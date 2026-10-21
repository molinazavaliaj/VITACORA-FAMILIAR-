// Llena los textos del banco de Kids: el género según sea chico o chica, y las
// variables posicionales {{1}}, {{2}}… de mensajes.md. Puro. Si falta una
// variable, tira error: un "{{2}}" no puede llegar a un WhatsApp.
//
// El género va como {{chico/chica}}: en castellano es la terminación ({{o/a}} en
// «pequeñ{{o/a}}»), en catalán la palabra entera ({{petit/petita}}, {{sol/sola}};
// banco-ca.md, como {{nen/nena}} en la V3 del Familiar). Es la misma marca: lo de
// antes de la barra para un chico, lo de después para una chica.

export type Genero = 'chico' | 'chica';

/** {{o/a}}, {{petit/petita}}: lo de antes de la barra, chico; lo de después, chica. Sin barra ({{1}}, {{nombre}}) no se toca. */
export const MARCA_GENERO = /\{\{([^{}/]+)\/([^{}/]+)\}\}/g;

export function conGenero(texto: string, genero: Genero): string {
  return texto.replace(MARCA_GENERO, (_m, deChico: string, deChica: string) => (genero === 'chico' ? deChico : deChica));
}

export function llenar(texto: string, variables: readonly string[]): string {
  return texto.replace(/\{\{(\d+)\}\}/g, (_m, n: string) => {
    const v = variables[Number(n) - 1];
    if (v === undefined || v.trim() === '') throw new Error(`Falta la variable {{${n}}} para llenar: "${texto.slice(0, 60)}…"`);
    return v;
  });
}

/** Los posesivos con que empieza quien regala: «tu / tus» en castellano, «la teva / el teu / els teus / les teves» en catalán. */
const POSESIVO = /^(tus?|la teva|el teu|els teus|les teves)\s/i;
const POSESIVO_PLURAL = /^(tus|els teus|les teves)\s/i;

/**
 * "tus papás", "Tus abuelos", "els teus pares", "les teves àvies" → plural (cambian los verbos: BIEN-CHICO-PL,
 * FINAL-CHICO-PL, PADRE-PREG-LINEA-PL).
 */
export function esPlural(quienRegala: string): boolean {
  return POSESIVO_PLURAL.test(quienRegala.trim());
}

/**
 * "Tu mamá" → "tu mamá", "La teva mare" → "la teva mare" (va en el medio de la oración, 05/10). Solo se baja la
 * mayúscula del posesivo: un nombre propio ("Tomás", "La Mercè" sin «teva») queda como está.
 */
export function normalizarQuienRegala(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return POSESIVO.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
}

/**
 * "Laura Gómez" → "Laura" (saludo al padre, 05/10). Si vino todo en minúsculas o todo en mayúsculas, con la
 * primera en mayúscula (20/10: «immaculada colell» saludaba «Hola, immaculada.»).
 */
export function primerNombre(s: string): string {
  const p = s.trim().split(/\s+/)[0];
  if (!p) throw new Error('Nombre vacío');
  if (p !== p.toLowerCase() && p !== p.toUpperCase()) return p;
  const m = p.toLowerCase();
  return m.charAt(0).toUpperCase() + m.slice(1);
}

/** ¿Quedó alguna marca sin llenar? */
export const quedanMarcas = (texto: string) => texto.includes('{{');
