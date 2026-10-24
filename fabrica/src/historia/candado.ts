// El candado de «Vitácora de una historia» en la fábrica (plan 2026-10-21, Task 5.3). Un narrador con fila en
// `historias` cuenta una sola historia: su libro lo escribe el escritor de historia
// (escritor-historia/produccion/libro-historia.ts). La fábrica no le arma ni le manda nada del libro de siempre:
// anticipo, estructura, previsualización, paquete, escritor V3, mails de cierre, «el libro está listo»,
// recordatorio de frases ni audios originales (las mismas ramas que Kids, worker.ts).
//
// Como src/kids/candado.ts: vive acá y no en `src/historia/entrevista/`, que es el núcleo puro que se copia al
// entrevistador (sin I/O).
import type { SupabaseClient } from '@supabase/supabase-js';

export const TABLA_HISTORIAS = 'historias';

/** ¿La tabla no existe? (la migración sin aplicar): Postgres 42P01 o PostgREST PGRST205. */
export function esTablaAusente(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42P01' || error.code === 'PGRST205' || /relation "(public\.)?historias" does not exist|could not find the table/i.test(error.message ?? '');
}

/**
 * El idioma de cada narrador de historia (`historias.idioma`), para los mails de cierre. Sin la tabla, ninguno; con
 * otro error, tira (como narradoresConHistoria).
 */
export async function idiomasHistoria(db: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await db.from(TABLA_HISTORIAS).select('narrador_id, idioma');
  if (error) {
    if (esTablaAusente(error)) return new Map();
    throw new Error(`No pude leer historias: ${error.message}`);
  }
  return new Map(((data as { narrador_id: string; idioma: string | null }[] | null) ?? []).map((f) => [f.narrador_id, f.idioma ?? 'es-AR']));
}

/**
 * Los narradores que cuentan una historia. Sin la tabla (migración sin aplicar), ninguno; con otro error, tira:
 * quien llama no puede tratar a uno de historia como un narrador de siempre por no haber podido leer.
 */
export async function narradoresConHistoria(db: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await db.from(TABLA_HISTORIAS).select('narrador_id');
  if (error) {
    if (esTablaAusente(error)) return new Set();
    throw new Error(`No pude leer historias: ${error.message}`);
  }
  return new Set(((data as { narrador_id: string }[] | null) ?? []).map((f) => f.narrador_id));
}
