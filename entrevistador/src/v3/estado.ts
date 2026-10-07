// La fila de `entrevistas_v3` (spec 2026-10-07, "Datos" y "Errores"). Toda
// escritura es compare-and-swap sobre `version`: si otro proceso escribió en el
// medio (un audio que llega mientras el reloj cierra), se relee y se vuelve a
// aplicar el cambio. Nada vive en memoria: si Railway se cae, el tick siguiente
// retoma desde la base. Recibe la base por parámetro: no importa db/cliente.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FilaV3 } from './tipos.js';

export const TABLA_V3 = 'entrevistas_v3';
/** La toma del turno dura esto: si el proceso muere mandando, a los 2 minutos otro retoma. */
export const TOMA_MS = 2 * 60_000;
export const INTENTOS_CAS = 5;

type ErrorDeBase = { code?: string; message?: string } | null;

/** ¿La tabla no existe? (la migración sin aplicar): Postgres 42P01 o PostgREST PGRST205. */
export function esTablaAusente(error: ErrorDeBase): boolean {
  if (!error) return false;
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message ?? '');
}

/** Los narradores con V3 prendida. Sin la tabla, ninguno; con cualquier otro error, tira (mejor frenar que mandarle la pregunta vieja). */
export async function narradoresV3(db: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await db.from(TABLA_V3).select('narrador_id');
  if (error) {
    if (esTablaAusente(error)) return new Set();
    throw new Error(`No pude leer entrevistas_v3: ${error.message}`);
  }
  return new Set(((data as { narrador_id: string }[] | null) ?? []).map((f) => f.narrador_id));
}

export async function esNarradorV3(db: SupabaseClient, narradorId: string): Promise<boolean> {
  const { data, error } = await db.from(TABLA_V3).select('narrador_id').eq('narrador_id', narradorId).maybeSingle();
  if (error) {
    if (esTablaAusente(error)) return false;
    throw new Error(`No pude saber si ${narradorId} tiene entrevista V3: ${error.message}`);
  }
  return data !== null && data !== undefined;
}

export async function leerFila(db: SupabaseClient, narradorId: string): Promise<FilaV3 | null> {
  const { data, error } = await db.from(TABLA_V3).select('*').eq('narrador_id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer la entrevista V3 de ${narradorId}: ${error.message}`);
  return (data as FilaV3 | null) ?? null;
}

export async function listarFilas(db: SupabaseClient): Promise<FilaV3[]> {
  const { data, error } = await db.from(TABLA_V3).select('*');
  if (error) {
    if (esTablaAusente(error)) return [];
    throw new Error(`No pude listar las entrevistas V3: ${error.message}`);
  }
  return (data as FilaV3[] | null) ?? [];
}

export type FilaNueva = Omit<FilaV3, 'version' | 'creada_at' | 'enviando_hasta'>;

export async function crearFila(db: SupabaseClient, fila: FilaNueva): Promise<'creada' | 'ya-existia'> {
  const { error } = await db.from(TABLA_V3).insert({ ...fila, version: 0, enviando_hasta: null });
  if (!error) return 'creada';
  if (error.code === '23505') return 'ya-existia';
  throw new Error(`No pude crear la entrevista V3 de ${fila.narrador_id}: ${error.message}`);
}

export type CambioFila = Partial<Pick<FilaV3, 'estado' | 'ultimo_audio_at' | 'tanda_dia' | 'tanda_cuenta' | 'enviando_hasta'>>;

/** UPDATE … WHERE version = n. Devuelve la fila nueva, o null si otro escribió primero. */
export async function guardarSiNoCambio(db: SupabaseClient, fila: FilaV3, cambio: CambioFila): Promise<FilaV3 | null> {
  const { data, error } = await db.from(TABLA_V3)
    .update({ ...cambio, version: fila.version + 1 })
    .eq('narrador_id', fila.narrador_id)
    .eq('version', fila.version)
    .select('*');
  if (error) throw new Error(`No pude guardar la entrevista V3 de ${fila.narrador_id}: ${error.message}`);
  const filas = (data as FilaV3[] | null) ?? [];
  return filas.length === 1 ? filas[0] : null;
}

/** Lo que hay que escribir y lo que se devuelve; null = no hay nada que hacer. */
export type Paso<T> = { cambio: CambioFila; resultado: T } | null;

/**
 * Lee la fila, aplica `paso` y guarda con compare-and-swap; si perdió, relee
 * y vuelve a aplicar (hasta INTENTOS_CAS). `paso` tiene que ser puro: se puede
 * llamar más de una vez. Null si no hay fila o si `paso` dijo que no.
 */
export async function conReintento<T>(db: SupabaseClient, narradorId: string, paso: (fila: FilaV3) => Paso<T>): Promise<{ fila: FilaV3; resultado: T } | null> {
  for (let intento = 0; intento < INTENTOS_CAS; intento++) {
    const fila = await leerFila(db, narradorId);
    if (!fila) return null;
    const p = paso(fila);
    if (!p) return null;
    const nueva = await guardarSiNoCambio(db, fila, p.cambio);
    if (nueva) return { fila: nueva, resultado: p.resultado };
  }
  throw new Error(`Entrevista V3 de ${narradorId}: ${INTENTOS_CAS} escrituras seguidas perdieron contra otra; se reintenta en el próximo tick.`);
}

export function tomaVigente(fila: Pick<FilaV3, 'enviando_hasta'>, ahora: Date): boolean {
  return !!fila.enviando_hasta && Date.parse(fila.enviando_hasta) > ahora.getTime();
}

/** Toma el turno por TOMA_MS. Null si otro lo tiene: ese manda, este no. */
export async function tomarTurno(db: SupabaseClient, narradorId: string, ahora: Date): Promise<FilaV3 | null> {
  const r = await conReintento(db, narradorId, (f) =>
    tomaVigente(f, ahora) ? null : { cambio: { enviando_hasta: new Date(ahora.getTime() + TOMA_MS).toISOString() }, resultado: true });
  return r?.fila ?? null;
}

export async function soltarTurno(db: SupabaseClient, narradorId: string): Promise<void> {
  await conReintento(db, narradorId, () => ({ cambio: { enviando_hasta: null }, resultado: true }));
}
