// Llena los textos del banco de Kids: {{o/a}} según sea chico o chica, y las
// variables posicionales {{1}}, {{2}}… de mensajes.md. Puro. Si falta una
// variable, tira error: un "{{2}}" no puede llegar a un WhatsApp.

export type Genero = 'chico' | 'chica';

export function conGenero(texto: string, genero: Genero): string {
  return texto.replace(/\{\{o\/a\}\}/g, genero === 'chico' ? 'o' : 'a');
}

export function llenar(texto: string, variables: readonly string[]): string {
  return texto.replace(/\{\{(\d+)\}\}/g, (_m, n: string) => {
    const v = variables[Number(n) - 1];
    if (v === undefined || v.trim() === '') throw new Error(`Falta la variable {{${n}}} para llenar: "${texto.slice(0, 60)}…"`);
    return v;
  });
}

/** "tus papás", "Tus abuelos" → plural (cambian los verbos: BIEN-CHICO-PL, FINAL-CHICO-PL, PADRE-PREG-LINEA-PL). */
export function esPlural(quienRegala: string): boolean {
  return /^tus\s/i.test(quienRegala.trim());
}

/**
 * "Tu mamá" → "tu mamá" (va en el medio de la oración, 05/10). Solo se baja la
 * mayúscula de "Tu"/"Tus": un nombre propio ("Tomás") queda como está.
 */
export function normalizarQuienRegala(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return /^tus?\s/i.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
}

/** "Laura Gómez" → "Laura" (saludo al padre, 05/10). */
export function primerNombre(s: string): string {
  const p = s.trim().split(/\s+/)[0];
  if (!p) throw new Error('Nombre vacío');
  return p;
}

/** ¿Quedó alguna marca sin llenar? */
export const quedanMarcas = (texto: string) => texto.includes('{{');
