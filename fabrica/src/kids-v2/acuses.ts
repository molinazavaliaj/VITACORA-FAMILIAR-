// Rotación de acuses (mensajes.md §3, "Reglas de rotación"). Las reglas son
// código; los textos salen del banco por ID.

export const ACUSES = ['ACUSE-1', 'ACUSE-2', 'ACUSE-3', 'ACUSE-4', 'ACUSE-5', 'ACUSE-6', 'ACUSE-7'] as const;
export const ACUSES_FOTO = ['ACUSE-FOTO-1', 'ACUSE-FOTO-2', 'ACUSE-FOTO-3'] as const;
export const ACUSES_DIA_FEO = ['B-DIAFEO-ACUSE-1', 'B-DIAFEO-ACUSE-2'] as const;

const DICEN_ESCUCHE = ['ACUSE-1', 'ACUSE-4', 'ACUSE-6'];
const DICEN_LIBRO = ['ACUSE-3', 'ACUSE-6'];

/** Escrito: sin los que dicen "escuché" (quedan 2, 3, 5, 7). Cápsula: sin los que dicen "libro" (quedan 1, 2, 4, 5, 7). */
export function opcionesAcuse(c: { capsula: boolean; escrito: boolean }): string[] {
  return ACUSES.filter((id) => !(c.escrito && DICEN_ESCUCHE.includes(id)) && !(c.capsula && DICEN_LIBRO.includes(id)));
}

/** El siguiente en el orden después del último usado, entre los permitidos. Nunca el mismo dos veces seguidas (si hay más de uno). */
export function siguienteDe(orden: readonly string[], permitidos: readonly string[], ultimo: string | null): string {
  const i = ultimo === null ? -1 : orden.indexOf(ultimo);
  for (let k = 1; k <= orden.length; k++) {
    const c = orden[(i + k) % orden.length];
    if (permitidos.includes(c)) return c;
  }
  throw new Error('No hay acuse permitido');
}
