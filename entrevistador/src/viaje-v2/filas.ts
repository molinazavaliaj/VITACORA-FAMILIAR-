// La fila de `viajes_v2` (docs/viajes-v2/plan-conexion-bot.md, CONTRATO "Viaje V2 por WhatsApp"). Mismo molde que
// v3/estado.ts: toda escritura es compare-and-swap sobre `version` (un audio que llega mientras el reloj manda no
// pisa al otro), nada vive en memoria y la base llega por parámetro (no importa db/cliente.ts).

import type { SupabaseClient } from '@supabase/supabase-js';

export const TABLA_VIAJE_V2 = 'viajes_v2';
/** La toma del turno dura esto: si el proceso muere mandando, a los 2 minutos otro retoma. */
export const TOMA_MS = 2 * 60_000;
export const INTENTOS_CAS = 5;

/** `compra` y `estado` son del núcleo (nucleo/tipos.ts y nucleo/planificador.ts); acá viajan como jsonb. */
export type FilaViajeV2<Compra = unknown, Estado = unknown> = {
  narrador_id: string;
  idioma: 'es-AR' | 'es-ES' | 'ca';
  compra: Compra;
  estado: Estado;
  version: number;
  enviando_hasta: string | null;
  creada_at: string;
};

type ErrorDeBase = { code?: string; message?: string } | null;

/** ¿La tabla no existe? (la migración sin aplicar): Postgres 42P01 o PostgREST PGRST205. */
export function esTablaAusente(error: ErrorDeBase): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  return /relation "(public\.)?viajes_v2" does not exist|could not find the table/i.test(error.message ?? '');
}

/** ¿Este narrador tiene la Viaje V2 prendida? Sin la tabla, no; con cualquier otro error, tira (mejor frenar que mandarle el viaje viejo). */
export async function esViajeroV2(db: SupabaseClient, narradorId: string): Promise<boolean> {
  const { data, error } = await db.from(TABLA_VIAJE_V2).select('narrador_id').eq('narrador_id', narradorId).maybeSingle();
  if (error) {
    if (esTablaAusente(error)) return false;
    throw new Error(`No pude saber si ${narradorId} tiene Viaje V2: ${error.message}`);
  }
  return data !== null && data !== undefined;
}

/** Los narradores con Viaje V2 prendida (para que el flujo viejo no les mande nada). */
export async function viajerosV2(db: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await db.from(TABLA_VIAJE_V2).select('narrador_id');
  if (error) {
    if (esTablaAusente(error)) return new Set();
    throw new Error(`No pude leer viajes_v2: ${error.message}`);
  }
  return new Set(((data as { narrador_id: string }[] | null) ?? []).map((f) => f.narrador_id));
}

export async function leerFila<C, E>(db: SupabaseClient, narradorId: string): Promise<FilaViajeV2<C, E> | null> {
  const { data, error } = await db.from(TABLA_VIAJE_V2).select('*').eq('narrador_id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer el Viaje V2 de ${narradorId}: ${error.message}`);
  return (data as FilaViajeV2<C, E> | null) ?? null;
}

/** Las filas de esos narradores (el reloj pide solo las de los activos). */
export async function listarFilas<C, E>(db: SupabaseClient, ids: readonly string[]): Promise<FilaViajeV2<C, E>[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db.from(TABLA_VIAJE_V2).select('*').in('narrador_id', [...ids]);
  if (error) {
    if (esTablaAusente(error)) return [];
    throw new Error(`No pude listar los Viajes V2: ${error.message}`);
  }
  return (data as FilaViajeV2<C, E>[] | null) ?? [];
}

export type FilaNueva<C, E> = Pick<FilaViajeV2<C, E>, 'narrador_id' | 'idioma' | 'compra' | 'estado'>;

export async function crearFila<C, E>(db: SupabaseClient, fila: FilaNueva<C, E>): Promise<'creada' | 'ya-existia'> {
  const { error } = await db.from(TABLA_VIAJE_V2).insert({ ...fila, version: 0, enviando_hasta: null });
  if (!error) return 'creada';
  if (error.code === '23505') return 'ya-existia';
  throw new Error(`No pude crear el Viaje V2 de ${fila.narrador_id}: ${error.message}`);
}

export type CambioFila<C, E> = Partial<Pick<FilaViajeV2<C, E>, 'estado' | 'compra' | 'enviando_hasta'>>;

/** UPDATE … WHERE version = n. Devuelve la fila nueva, o null si otro escribió primero. */
export async function guardarSiNoCambio<C, E>(db: SupabaseClient, fila: FilaViajeV2<C, E>, cambio: CambioFila<C, E>): Promise<FilaViajeV2<C, E> | null> {
  const { data, error } = await db.from(TABLA_VIAJE_V2)
    .update({ ...cambio, version: fila.version + 1 })
    .eq('narrador_id', fila.narrador_id)
    .eq('version', fila.version)
    .select('*');
  if (error) throw new Error(`No pude guardar el Viaje V2 de ${fila.narrador_id}: ${error.message}`);
  const filas = (data as FilaViajeV2<C, E>[] | null) ?? [];
  return filas.length === 1 ? filas[0] : null;
}

/** Lo que hay que escribir y lo que se devuelve; null = no hay nada que hacer. */
export type Paso<C, E, T> = { cambio: CambioFila<C, E>; resultado: T } | null;

/**
 * Lee la fila, aplica `paso` y guarda con compare-and-swap; si perdió, relee y vuelve a aplicar (hasta INTENTOS_CAS).
 * `paso` tiene que ser puro: se puede llamar más de una vez. Null si no hay fila o si `paso` dijo que no.
 */
export async function conReintento<C, E, T>(db: SupabaseClient, narradorId: string, paso: (fila: FilaViajeV2<C, E>) => Paso<C, E, T>): Promise<{ fila: FilaViajeV2<C, E>; resultado: T } | null> {
  for (let intento = 0; intento < INTENTOS_CAS; intento++) {
    const fila = await leerFila<C, E>(db, narradorId);
    if (!fila) return null;
    const p = paso(fila);
    if (!p) return null;
    const nueva = await guardarSiNoCambio(db, fila, p.cambio);
    if (nueva) return { fila: nueva, resultado: p.resultado };
  }
  throw new Error(`Viaje V2 de ${narradorId}: ${INTENTOS_CAS} escrituras seguidas perdieron contra otra; se reintenta en el próximo tick.`);
}

export function tomaVigente(fila: Pick<FilaViajeV2, 'enviando_hasta'>, ahora: Date): boolean {
  return !!fila.enviando_hasta && Date.parse(fila.enviando_hasta) > ahora.getTime();
}

/** Toma el turno por TOMA_MS. Null si otro lo tiene: ese manda, este no. */
export async function tomarTurno<C, E>(db: SupabaseClient, narradorId: string, ahora: Date): Promise<FilaViajeV2<C, E> | null> {
  const r = await conReintento<C, E, true>(db, narradorId, (f) =>
    tomaVigente(f, ahora) ? null : { cambio: { enviando_hasta: new Date(ahora.getTime() + TOMA_MS).toISOString() }, resultado: true });
  return r?.fila ?? null;
}

/** Compara instantes, no textos: PostgREST devuelve un timestamptz como `+00:00` donde JS escribió `Z`. */
function mismoInstante(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const ta = Date.parse(a);
  return !Number.isNaN(ta) && ta === Date.parse(b);
}

/** Suelta el turno solo si sigue siendo el que `tomada` tomó (mismo `enviando_hasta`). */
export async function soltarTurno<C, E>(db: SupabaseClient, narradorId: string, tomada: FilaViajeV2<C, E>): Promise<FilaViajeV2<C, E> | null> {
  const r = await conReintento<C, E, true>(db, narradorId, (f) =>
    mismoInstante(f.enviando_hasta, tomada.enviando_hasta) ? { cambio: { enviando_hasta: null }, resultado: true } : null);
  return r?.fila ?? null;
}
