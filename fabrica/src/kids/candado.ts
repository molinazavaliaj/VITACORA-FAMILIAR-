// El candado de Kids V2 en la fábrica (docs/kids/v2/plan-conexion-bot.md, T4; CONTRATO, «Lo que no tiene que tocar
// a un chico de Kids»). Un narrador con fila en `kids_v2` es un chico: lo que contó no es una biografía y su libro se
// diseña aparte (arranca con `kids_v2.termino_at`). La fábrica no le arma ni le manda nada del libro de siempre:
// anticipo, mails de cierre (terminó, recordatorios 3/7/14, cierre solo a los 30 días), estructura,
// previsualización, paquete, escritor V3, «el libro está listo», recordatorio de frases, imprenta y mails de la
// entrega.
//
// Vive acá y no en `src/kids-v2/`: esa carpeta es el motor puro que se copia byte a byte al entrevistador (sin I/O).

import type { SupabaseClient } from '@supabase/supabase-js';

export const TABLA_KIDS = 'kids_v2';

/** ¿La tabla no existe? (la migración sin aplicar): Postgres 42P01 o PostgREST PGRST205. */
function esTablaAusente(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message ?? '');
}

/**
 * Los narradores que son chicos de Kids. Sin la tabla (migración sin aplicar), ninguno; con otro error, tira: quien
 * llama no puede tratar a un chico como un narrador de siempre por no haber podido leer.
 */
export async function narradoresConKids(db: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await db.from(TABLA_KIDS).select('narrador_id');
  if (error) {
    if (esTablaAusente(error)) return new Set();
    throw new Error(`No pude leer kids_v2: ${error.message}`);
  }
  return new Set(((data as { narrador_id: string }[] | null) ?? []).map((f) => f.narrador_id));
}
