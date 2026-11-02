// Un mismo WhatsApp puede tener varios narradores (02/11): quien terminó su Familiar puede hacer después una
// Historia, un Viaje o recibir un regalo con el mismo número. La base deja uno solo sin terminar por número (índice
// `narradores_telefono_vigente`, migración 20261102000000). Cuando escribe, el mensaje va al que está en curso.

/** Los estados de un narrador que ya terminó: no toman el número. Los mismos del índice de la migración. */
export const ESTADOS_TERMINADOS = ['completado', 'cerrado_anticipado'] as const;

type Candidato = { estado: string; created_at?: string | null };

function masNuevoPrimero<T extends Candidato>(a: T, b: T): number {
  return (b.created_at ?? '').localeCompare(a.created_at ?? '');
}

/**
 * De los narradores de un número, a cuál va el mensaje: primero el que está en curso (invitado, activo, pausado…),
 * después el terminado más nuevo y, al final, una compra sin pagar (que no tiene entrevista a la que contestar).
 */
export function elegirNarrador<T extends Candidato>(filas: readonly T[]): T | null {
  const terminado = (n: T) => (ESTADOS_TERMINADOS as readonly string[]).includes(n.estado);
  const enCurso = filas.filter((n) => !terminado(n) && n.estado !== 'pendiente_pago').sort(masNuevoPrimero);
  if (enCurso.length > 0) return enCurso[0];
  const terminados = filas.filter(terminado).sort(masNuevoPrimero);
  if (terminados.length > 0) return terminados[0];
  return [...filas].sort(masNuevoPrimero)[0] ?? null;
}
