// El buzón `narraciones` (CONTRATO.md, "Narraciones (voz clonada)"): la
// fábrica deja acá el pedido de una voz clonada y el worker de la PC de Naza
// lo toma. Los dos se hablan solo por Supabase — la fábrica escribe la fila
// (`pendiente`); el worker escribe estado/motor/muestras/capitulos_paths/
// error/tomada_at/actualizada_at. Lo que lee la fábrica después (listas,
// atascadas) también vive acá.

import type { obtenerClienteDb } from '../db.js';

type Db = ReturnType<typeof obtenerClienteDb>;

/** Lo que narra el worker: lo escribe `generarPaquete` junto con la fila del buzón. */
export const RUTA_NARRACION_JSON = (narradorId: string) => `${narradorId}/paquete/narracion.json`;

/** Estados en los que una narración sigue viva: no hay que crear otra. */
const ESTADOS_VIVOS = ['pendiente', 'procesando', 'lista'];

/** Una pendiente que nadie tomó en un día: la PC está apagada o el worker no corre. */
const HORAS_PENDIENTE = 24;
/**
 * Una procesando sin avance desde hace más de esto se colgó a mitad de
 * camino. "Avance" es `actualizada_at`: el worker la mueve con cada
 * capítulo que sube (su checkpoint). No se mide desde `tomada_at` porque
 * un libro largo con el motor lento tarda más de 6 h narrándose bien.
 */
const HORAS_SIN_AVANCE = 6;

/**
 * Deja la narración de un pedido en el buzón y devuelve su id. Idempotente:
 * si ya hay una viva (pendiente, procesando o lista) para ese pedido, la
 * devuelve sin insertar — un reintento de generarPaquete no tiene que
 * encolar dos veces la misma voz. Una `fallida` sí se vuelve a pedir.
 */
export async function crearNarracion(db: Db, args: { narradorId: string; pedidoId: string }): Promise<string> {
  const { data: vivas, error: errorBusqueda } = await db
    .from('narraciones')
    .select('id')
    .eq('pedido_id', args.pedidoId)
    .in('estado', ESTADOS_VIVOS);
  if (errorBusqueda) {
    throw new Error(`No se pudo buscar la narración del pedido ${args.pedidoId}: ${errorBusqueda.message}`);
  }
  const viva = ((vivas ?? []) as { id: string }[])[0];
  if (viva) return viva.id;

  const { data: creada, error: errorInsert } = await db
    .from('narraciones')
    .insert({ narrador_id: args.narradorId, pedido_id: args.pedidoId, estado: 'pendiente' })
    .select('id')
    .single();
  if (errorInsert || !creada) {
    throw new Error(`No se pudo crear la narración del pedido ${args.pedidoId}: ${errorInsert?.message ?? 'sin datos'}`);
  }
  return (creada as { id: string }).id;
}

export type NarracionLista = { id: string; narrador_id: string; pedido_id: string; capitulos_paths: string[] };

/**
 * Las narraciones que el worker terminó (`lista`) y cuyo pedido sigue
 * `esperando_voz`: lo que la fábrica tiene que ensamblar. Una `lista` cuyo
 * pedido ya salió de ese estado (se entregó, o alguien lo marcó fallido) no
 * se devuelve.
 */
export async function narracionesListas(db: Db): Promise<NarracionLista[]> {
  const { data: listas, error } = await db
    .from('narraciones')
    .select('id, narrador_id, pedido_id, capitulos_paths')
    .eq('estado', 'lista');
  if (error) throw new Error(`No se pudieron leer las narraciones listas: ${error.message}`);
  const filas = (listas ?? []) as { id: string; narrador_id: string; pedido_id: string; capitulos_paths: unknown }[];
  if (filas.length === 0) return [];

  const { data: pedidos, error: errorPedidos } = await db
    .from('pedidos')
    .select('id')
    .in('id', filas.map((f) => f.pedido_id))
    .eq('estado', 'esperando_voz');
  if (errorPedidos) throw new Error(`No se pudieron leer los pedidos esperando voz: ${errorPedidos.message}`);
  const esperando = new Set(((pedidos ?? []) as { id: string }[]).map((p) => p.id));

  return filas
    .filter((f) => esperando.has(f.pedido_id))
    .map((f) => ({
      id: f.id,
      narrador_id: f.narrador_id,
      pedido_id: f.pedido_id,
      capitulos_paths: Array.isArray(f.capitulos_paths) ? (f.capitulos_paths as string[]) : [],
    }));
}

export type MotivoAtascada = 'pendiente_24h' | 'procesando_6h' | 'fallida';
export type NarracionAtascada = { id: string; narrador_id: string; motivo: MotivoAtascada; error: string | null };

type FilaNarracion = {
  id: string;
  narrador_id: string;
  estado: string;
  created_at: string;
  actualizada_at: string;
  error: string | null;
};

const horasDesde = (fecha: string, ahora: Date) => (ahora.getTime() - new Date(fecha).getTime()) / 3_600_000;

/**
 * Qué narraciones necesitan a alguien: una `pendiente` que lleva más de 24 h
 * sin que el worker la tome, una `procesando` sin avance hace más de 6 h (se
 * colgó; ver HORAS_SIN_AVANCE), o cualquier `fallida` (el worker ya dijo por
 * qué en `error`). Pura: recibe las filas y la hora, para probarla con fechas.
 */
export function clasificarAtascadas(filas: FilaNarracion[], ahora: Date): NarracionAtascada[] {
  const atascadas: NarracionAtascada[] = [];
  for (const fila of filas) {
    let motivo: MotivoAtascada | null = null;
    if (fila.estado === 'fallida') {
      motivo = 'fallida';
    } else if (fila.estado === 'pendiente' && horasDesde(fila.created_at, ahora) > HORAS_PENDIENTE) {
      motivo = 'pendiente_24h';
    } else if (fila.estado === 'procesando' && horasDesde(fila.actualizada_at, ahora) > HORAS_SIN_AVANCE) {
      motivo = 'procesando_6h';
    }
    if (motivo) atascadas.push({ id: fila.id, narrador_id: fila.narrador_id, motivo, error: fila.error });
  }
  return atascadas;
}

export async function narracionesAtascadas(db: Db, ahora: Date): Promise<NarracionAtascada[]> {
  const { data, error } = await db
    .from('narraciones')
    .select('id, narrador_id, estado, created_at, actualizada_at, error')
    .in('estado', ['pendiente', 'procesando', 'fallida']);
  if (error) throw new Error(`No se pudieron leer las narraciones: ${error.message}`);
  return clasificarAtascadas((data ?? []) as FilaNarracion[], ahora);
}
