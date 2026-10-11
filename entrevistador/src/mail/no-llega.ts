// Cuando Meta no le puede entregar un mensaje al narrador y lo puede destrabar
// la familia (11/10), le llega un mail a quien compró:
//   130472 → su número está «en un experimento» de Meta: le llega si escribe él.
//   131026 → no tiene WhatsApp, tiene una versión vieja o nos bloqueó.
// Los demás errores son nuestros o se arreglan solos: esos solo van a los socios.
// Una vez por semana por narrador (marca en Storage). No sale para «La mía»
// (compró su propio libro): no tiene a quién pedirle que escriba.

import type { SupabaseClient } from '@supabase/supabase-js';
import { tratoDeComprador, type TratoComprador } from '../flujo/regalo-textos.js';
import type { MandarMailFamilia } from '../flujo/regalo.js';
import type { Marca } from '../v3/avisos.js';

export const CODIGOS_FAMILIA = [130472, 131026] as const;

// Aprobados por Naza el 11/10.
export const NO_LLEGA: Readonly<Record<TratoComprador, { asunto: (como: string) => string; cuerpo: (codigo: number, como: string) => string }>> = {
  vos: {
    asunto: (como) => `A ${como} no le están llegando los mensajes`,
    cuerpo: (codigo, como) => codigo === 130472
      ? `Le mandamos un mensaje a ${como} por WhatsApp y no le llegó. Pasa con algunos números y se arregla fácil. Pedile que nos mande un mensaje cualquiera, con un hola alcanza, y le llega enseguida.`
      : `Le mandamos un mensaje a ${como} por WhatsApp y no le llegó. Puede ser que ese número no tenga WhatsApp, que tenga una versión vieja o que nos haya bloqueado sin querer. ¿Te fijás con ${como}? Si el número está mal, escribinos a hola@vitacorafamiliar.com y lo cambiamos.`,
  },
  tu: {
    asunto: (como) => `A ${como} no le están llegando los mensajes`,
    cuerpo: (codigo, como) => codigo === 130472
      ? `Le hemos enviado un mensaje a ${como} por WhatsApp y no le ha llegado. Pasa con algunos números y se arregla fácil. Pídele que nos envíe un mensaje cualquiera, con un hola basta, y le llega enseguida.`
      : `Le hemos enviado un mensaje a ${como} por WhatsApp y no le ha llegado. Puede ser que ese número no tenga WhatsApp, que tenga una versión antigua o que nos haya bloqueado sin querer. ¿Lo miras con ${como}? Si el número está mal, escríbenos a hola@vitacorafamiliar.com y lo cambiamos.`,
  },
};

/** La semana ISO 8601 ('2026-W41'): de lunes a domingo, en UTC. */
export function semanaIso(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dia = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dia); // el jueves de esa semana define el año
  const inicio = Date.UTC(t.getUTCFullYear(), 0, 1);
  const semana = Math.ceil(((t.getTime() - inicio) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`;
}

export type DepsNoLlega = {
  db: SupabaseClient;
  mandarMailFamilia: MandarMailFamilia;
  /** La marca de una vez (avisos.ts marcaEnStorage), por período y clave. */
  marca: Marca;
  ahora?: Date;
};

/** Devuelve true si mandó el mail. Nunca tira: corre en el webhook. */
export async function avisarFamiliaNoLlega(deps: DepsNoLlega, narradorId: string, codigo: number | undefined): Promise<boolean> {
  try {
    if (codigo === undefined || !(CODIGOS_FAMILIA as readonly number[]).includes(codigo)) return false;
    const { data: n } = await deps.db.from('narradores').select('familia_id, como_le_dicen, contexto').eq('id', narradorId).maybeSingle();
    const narrador = n as { familia_id: string; como_le_dicen: string; contexto?: Record<string, unknown> | null } | null;
    if (!narrador) return false;
    if (narrador.contexto?.vinculoComprador === 'yo mismo') return false;
    if ((await deps.marca(`semana-${semanaIso(deps.ahora ?? new Date())}`, `familia-no-llega:${narradorId}`)) === 'ya') return false;
    const { data: familia } = await deps.db.from('familias').select('region').eq('id', narrador.familia_id).maybeSingle();
    const t = NO_LLEGA[tratoDeComprador((familia as { region?: unknown } | null)?.region)];
    return await deps.mandarMailFamilia(narrador.familia_id, t.asunto(narrador.como_le_dicen), t.cuerpo(codigo, narrador.como_le_dicen), narradorId, { boton: false });
  } catch (err) {
    console.error(`no-llega: no pude avisar a la familia de ${narradorId}:`, err instanceof Error ? err.message : err);
    return false;
  }
}
