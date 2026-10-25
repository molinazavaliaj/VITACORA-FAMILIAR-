// La fila de `historias` (supabase/CONTRATO.md, "Vitácora de una historia").
// Copia de src/v3/estado.ts sobre la tabla nueva: toda escritura es
// compare-and-swap sobre `version`; si otro proceso escribió en el medio, se
// relee y se vuelve a aplicar el cambio. Nada vive en memoria: si Railway se
// cae, el tick siguiente retoma desde la base. Recibe la base por parámetro:
// no importa db/cliente.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FilaHistoria } from './tipos.js';
import { esChicoKids } from '../kids-v2/filas.js';
import { esNarradorV3 } from '../v3/estado.js';

export const TABLA_HISTORIA = 'historias';
/** La toma del turno dura esto: si el proceso muere mandando, a los 2 minutos otro retoma. */
export const TOMA_MS = 2 * 60_000;
export const INTENTOS_CAS = 5;

type ErrorDeBase = { code?: string; message?: string } | null;

/** ¿La tabla no existe? (la migración sin aplicar): Postgres 42P01 o PostgREST PGRST205. */
export function esTablaAusente(error: ErrorDeBase): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  return /relation "(public\.)?historias" does not exist|could not find the table/i.test(error.message ?? '');
}

/** ¿Tiene fila en `historias`? Sin la tabla (la migración sin aplicar), no; con cualquier otro error, tira. */
export async function esNarradorHistoria(db: SupabaseClient, narradorId: string): Promise<boolean> {
  const { data, error } = await db.from(TABLA_HISTORIA).select('narrador_id').eq('narrador_id', narradorId).maybeSingle();
  if (error) {
    if (esTablaAusente(error)) return false;
    throw new Error(`No pude saber si ${narradorId} tiene una historia: ${error.message}`);
  }
  return data !== null && data !== undefined;
}

export async function leerFila(db: SupabaseClient, narradorId: string): Promise<FilaHistoria | null> {
  const { data, error } = await db.from(TABLA_HISTORIA).select('*').eq('narrador_id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer la historia de ${narradorId}: ${error.message}`);
  return (data as FilaHistoria | null) ?? null;
}

/** Las filas de `historias`; con `ids`, solo las de esos narradores (el reloj pide solo las de los activos). */
export async function listarFilas(db: SupabaseClient, ids?: readonly string[]): Promise<FilaHistoria[]> {
  if (ids && ids.length === 0) return [];
  const consulta = db.from(TABLA_HISTORIA).select('*');
  const { data, error } = ids ? await consulta.in('narrador_id', [...ids]) : await consulta;
  if (error) {
    if (esTablaAusente(error)) return [];
    throw new Error(`No pude listar las historias: ${error.message}`);
  }
  return (data as FilaHistoria[] | null) ?? [];
}

export type FilaHistoriaNueva = Omit<FilaHistoria, 'version' | 'creada_at' | 'enviando_hasta'>;

/**
 * Todo camino que crea la fila pasa por acá. Un chico de Kids (fila en kids_v2) o un narrador con entrevista V3 nunca
 * entra a una historia: si la base no deja saberlo, esChicoKids o esNarradorV3 tiran y no se crea nada.
 */
export async function crearFila(db: SupabaseClient, fila: FilaHistoriaNueva): Promise<'creada' | 'ya-existia'> {
  if (await esChicoKids(db, fila.narrador_id)) throw new Error(`${fila.narrador_id} es un chico de Kids: no entra a una historia.`);
  if (await esNarradorV3(db, fila.narrador_id)) throw new Error(`${fila.narrador_id} tiene entrevista V3: no entra a una historia.`);
  const { error } = await db.from(TABLA_HISTORIA).insert({ ...fila, version: 0, enviando_hasta: null });
  if (!error) return 'creada';
  if (error.code === '23505') return 'ya-existia';
  throw new Error(`No pude crear la historia de ${fila.narrador_id}: ${error.message}`);
}

/** `ficha`: se reescribe una sola vez, cuando elige su historia en TEMA-ABIERTO (`temaLibre`). */
export type CambioFila = Partial<Pick<FilaHistoria, 'estado' | 'ficha' | 'ultimo_audio_at' | 'tanda_dia' | 'tanda_cuenta' | 'enviando_hasta'>>;

/** UPDATE … WHERE version = n. Devuelve la fila nueva, o null si otro escribió primero. */
export async function guardarSiNoCambio(db: SupabaseClient, fila: FilaHistoria, cambio: CambioFila): Promise<FilaHistoria | null> {
  const { data, error } = await db.from(TABLA_HISTORIA)
    .update({ ...cambio, version: fila.version + 1 })
    .eq('narrador_id', fila.narrador_id)
    .eq('version', fila.version)
    .select('*');
  if (error) throw new Error(`No pude guardar la historia de ${fila.narrador_id}: ${error.message}`);
  const filas = (data as FilaHistoria[] | null) ?? [];
  return filas.length === 1 ? filas[0] : null;
}

/** Lo que hay que escribir y lo que se devuelve; null = no hay nada que hacer. */
export type Paso<T> = { cambio: CambioFila; resultado: T } | null;

/**
 * Lee la fila, aplica `paso` y guarda con compare-and-swap; si perdió, relee
 * y vuelve a aplicar (hasta INTENTOS_CAS). `paso` tiene que ser puro: se puede
 * llamar más de una vez. Null si no hay fila o si `paso` dijo que no.
 */
export async function conReintento<T>(db: SupabaseClient, narradorId: string, paso: (fila: FilaHistoria) => Paso<T>): Promise<{ fila: FilaHistoria; resultado: T } | null> {
  for (let intento = 0; intento < INTENTOS_CAS; intento++) {
    const fila = await leerFila(db, narradorId);
    if (!fila) return null;
    const p = paso(fila);
    if (!p) return null;
    const nueva = await guardarSiNoCambio(db, fila, p.cambio);
    if (nueva) return { fila: nueva, resultado: p.resultado };
  }
  throw new Error(`Historia de ${narradorId}: ${INTENTOS_CAS} escrituras seguidas perdieron contra otra; se reintenta en el próximo tick.`);
}

export function tomaVigente(fila: Pick<FilaHistoria, 'enviando_hasta'>, ahora: Date): boolean {
  return !!fila.enviando_hasta && Date.parse(fila.enviando_hasta) > ahora.getTime();
}

/**
 * Toma el turno por TOMA_MS. Null si otro lo tiene: ese manda, este no. Puede
 * tirar si pierde INTENTOS_CAS rondas seguidas de compare-and-swap (mucha
 * contención): el tick siguiente reintenta.
 */
export async function tomarTurno(db: SupabaseClient, narradorId: string, ahora: Date): Promise<FilaHistoria | null> {
  const r = await conReintento(db, narradorId, (f) =>
    tomaVigente(f, ahora) ? null : { cambio: { enviando_hasta: new Date(ahora.getTime() + TOMA_MS).toISOString() }, resultado: true });
  return r?.fila ?? null;
}

/** Compara instantes, no textos: PostgREST devuelve un timestamptz como `+00:00` donde JS escribió `Z`. */
function mismoInstante(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const ta = Date.parse(a);
  return !Number.isNaN(ta) && ta === Date.parse(b);
}

/**
 * Suelta el turno solo si sigue siendo el que `tomada` tomó (mismo
 * `enviando_hasta`). Si venció y otro lo retomó, no se toca: devuelve null.
 * OJO: la toma no tiene fencing (un dueño vencido todavía puede escribir estado
 * por CAS), así que quien envía tiene que terminar bien por debajo de TOMA_MS.
 */
export async function soltarTurno(db: SupabaseClient, narradorId: string, tomada: FilaHistoria): Promise<FilaHistoria | null> {
  const r = await conReintento(db, narradorId, (f) =>
    mismoInstante(f.enviando_hasta, tomada.enviando_hasta) ? { cambio: { enviando_hasta: null }, resultado: true } : null);
  return r?.fila ?? null;
}
