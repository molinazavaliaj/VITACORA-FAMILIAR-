// La fila de `kids_v2` (docs/kids/v2/plan-conexion-bot.md, T2; CONTRATO "Vitácora Kids V2 por WhatsApp"). Mismo
// molde que viaje-v2/filas.ts: toda escritura del entrevistador es compare-and-swap sobre `version` (un audio que
// llega mientras el reloj manda no pisa al otro), nada vive en memoria y la base llega por parámetro (no importa
// db/cliente.ts). La fila la crea la web al comprar: acá no hay crearFila.
//
// `cambios_panel` lo escribe la web sin tocar `version` (así nunca hace perder una escritura del entrevistador a
// mitad de un envío). Por eso la escritura que lo aplica (la que lo pone en null) lleva una condición más: que siga
// siendo el que se leyó. Si la web fusionó otro cambio en el medio, pierde, se relee y se aplica el nuevo.

import type { SupabaseClient } from '@supabase/supabase-js';

export const TABLA_KIDS = 'kids_v2';
/** La toma del turno dura esto: si el proceso muere mandando, a los 2 minutos otro retoma. */
export const TOMA_MS = 2 * 60_000;
export const INTENTOS_CAS = 5;

/** `ficha`, `estado` y `cambios_panel` son jsonb; sus tipos de verdad están en tipos.ts (los del motor). */
export type FilaKidsV2<Ficha = unknown, Estado = unknown, Cambios = unknown, Avance = unknown, Marca = unknown> = {
  narrador_id: string;
  idioma: 'es-AR' | 'es-ES' | 'ca';
  canal: 'A' | 'B';
  telefono_padre: string;
  ficha: Ficha;
  /** Null hasta el arranque. */
  estado: Estado | null;
  cambios_panel: Cambios | null;
  cambios_error: string | null;
  avance: Avance;
  marcas: Marca[];
  version: number;
  enviando_hasta: string | null;
  despertar_at: string | null;
  creada_at: string;
  empezo_at: string | null;
  termino_at: string | null;
};

type ErrorDeBase = { code?: string; message?: string } | null;

/** ¿La tabla no existe? (la migración sin aplicar): Postgres 42P01 o PostgREST PGRST205. */
export function esTablaAusente(error: ErrorDeBase): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  return /relation "(public\.)?kids_v2" does not exist|could not find the table/i.test(error.message ?? '');
}

/** ¿Este narrador es un chico de Kids? Sin la tabla, no; con cualquier otro error, tira (mejor frenar que mandarle el flujo viejo a un chico). */
export async function esChicoKids(db: SupabaseClient, narradorId: string): Promise<boolean> {
  const { data, error } = await db.from(TABLA_KIDS).select('narrador_id').eq('narrador_id', narradorId).maybeSingle();
  if (error) {
    if (esTablaAusente(error)) return false;
    throw new Error(`No pude saber si ${narradorId} es de Kids: ${error.message}`);
  }
  return data !== null && data !== undefined;
}

/** Los narradores que son chicos de Kids (para que el flujo viejo no les mande nada). */
export async function chicosKids(db: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await db.from(TABLA_KIDS).select('narrador_id');
  if (error) {
    if (esTablaAusente(error)) return new Set();
    throw new Error(`No pude leer kids_v2: ${error.message}`);
  }
  return new Set(((data as { narrador_id: string }[] | null) ?? []).map((f) => f.narrador_id));
}

export async function leerFila<F extends FilaKidsV2 = FilaKidsV2>(db: SupabaseClient, narradorId: string): Promise<F | null> {
  const { data, error } = await db.from(TABLA_KIDS).select('*').eq('narrador_id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer el Kids de ${narradorId}: ${error.message}`);
  return (data as F | null) ?? null;
}

/** Las filas de esos narradores. */
export async function listarFilas<F extends FilaKidsV2 = FilaKidsV2>(db: SupabaseClient, ids: readonly string[]): Promise<F[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db.from(TABLA_KIDS).select('*').in('narrador_id', [...ids]);
  if (error) {
    if (esTablaAusente(error)) return [];
    throw new Error(`No pude listar los Kids: ${error.message}`);
  }
  return (data as F[] | null) ?? [];
}

/**
 * Las filas que el reloj tiene que mirar ahora, sin leer el jsonb de todos: las que despiertan (`despertar_at`
 * vencido; una cola sin vaciar deja `despertar_at` = el momento en que se guardó), las que tienen un cambio del
 * panel sin tomar y las que todavía no arrancaron. Tres consultas chicas (el índice parcial cubre la primera).
 */
export async function filasDelReloj<F extends FilaKidsV2 = FilaKidsV2>(db: SupabaseClient, ahora: Date): Promise<F[]> {
  const consultas = [
    () => db.from(TABLA_KIDS).select('*').lte('despertar_at', ahora.toISOString()),
    () => db.from(TABLA_KIDS).select('*').not('cambios_panel', 'is', null),
    () => db.from(TABLA_KIDS).select('*').is('empezo_at', null),
  ];
  const porId = new Map<string, F>();
  for (const consulta of consultas) {
    const { data, error } = await consulta();
    if (error) {
      if (esTablaAusente(error)) return [];
      throw new Error(`No pude leer los Kids que despiertan: ${error.message}`);
    }
    for (const f of (data as F[] | null) ?? []) porId.set(f.narrador_id, f);
  }
  return [...porId.values()];
}

/** Lo que escribe el entrevistador (CONTRATO: `ficha` es de la web y no se toca después de comprar). */
export type CambioFila<F extends FilaKidsV2 = FilaKidsV2> = Partial<Pick<F,
  'estado' | 'avance' | 'marcas' | 'despertar_at' | 'empezo_at' | 'termino_at' | 'cambios_panel' | 'cambios_error' | 'enviando_hasta'>>;

/**
 * UPDATE … WHERE version = n. Devuelve la fila nueva, o null si otro escribió primero. Si el cambio toca
 * `cambios_panel`, además WHERE cambios_panel IS NOT DISTINCT FROM <lo que se leyó> (null → `is`; un objeto → `eq`
 * de jsonb con el texto JSON, que Postgres compara como jsonb: sin importar el orden de las claves).
 */
export async function guardarSiNoCambio<F extends FilaKidsV2>(db: SupabaseClient, fila: F, cambio: CambioFila<F>): Promise<F | null> {
  let q = db.from(TABLA_KIDS)
    .update({ ...cambio, version: fila.version + 1 })
    .eq('narrador_id', fila.narrador_id)
    .eq('version', fila.version);
  if ('cambios_panel' in cambio) {
    q = fila.cambios_panel === null || fila.cambios_panel === undefined
      ? q.is('cambios_panel', null)
      : q.filter('cambios_panel', 'eq', JSON.stringify(fila.cambios_panel));
  }
  const { data, error } = await q.select('*');
  if (error) throw new Error(`No pude guardar el Kids de ${fila.narrador_id}: ${error.message}`);
  const filas = (data as F[] | null) ?? [];
  return filas.length === 1 ? filas[0] : null;
}

/** Lo que hay que escribir y lo que se devuelve; null = no hay nada que hacer. */
export type Paso<F extends FilaKidsV2, T> = { cambio: CambioFila<F>; resultado: T } | null;

/**
 * Lee la fila, aplica `paso` y guarda con compare-and-swap; si perdió, relee y vuelve a aplicar (hasta INTENTOS_CAS).
 * `paso` tiene que ser puro: se puede llamar más de una vez. Null si no hay fila o si `paso` dijo que no.
 */
export async function conReintento<F extends FilaKidsV2, T>(db: SupabaseClient, narradorId: string, paso: (fila: F) => Paso<F, T>): Promise<{ fila: F; resultado: T } | null> {
  for (let intento = 0; intento < INTENTOS_CAS; intento++) {
    const fila = await leerFila<F>(db, narradorId);
    if (!fila) return null;
    const p = paso(fila);
    if (!p) return null;
    const nueva = await guardarSiNoCambio(db, fila, p.cambio);
    if (nueva) return { fila: nueva, resultado: p.resultado };
  }
  throw new Error(`Kids de ${narradorId}: ${INTENTOS_CAS} escrituras seguidas perdieron contra otra; se reintenta en el próximo tick.`);
}

export function tomaVigente(fila: Pick<FilaKidsV2, 'enviando_hasta'>, ahora: Date): boolean {
  return !!fila.enviando_hasta && Date.parse(fila.enviando_hasta) > ahora.getTime();
}

/** Toma el turno por TOMA_MS. Null si otro lo tiene: ese manda, este no. */
export async function tomarTurno<F extends FilaKidsV2>(db: SupabaseClient, narradorId: string, ahora: Date): Promise<F | null> {
  const r = await conReintento<F, true>(db, narradorId, (f) =>
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
export async function soltarTurno<F extends FilaKidsV2>(db: SupabaseClient, narradorId: string, tomada: F): Promise<F | null> {
  const r = await conReintento<F, true>(db, narradorId, (f) =>
    mismoInstante(f.enviando_hasta, tomada.enviando_hasta) ? { cambio: { enviando_hasta: null }, resultado: true } : null);
  return r?.fila ?? null;
}
