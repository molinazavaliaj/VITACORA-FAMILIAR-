import type { SupabaseClient } from '@supabase/supabase-js';
import { obtenerClienteDb } from './db.js';

// "Estoy viva": el mismo latido que el entrevistador y la PC de música, para
// que el panel pueda distinguir «no hay trabajo» de «la fábrica se cayó».
// Se pisa siempre la misma fila: interesa la última vez, no el historial.
//
// Si no puede latir (Supabase caído, la tabla sin crear), avisa y sigue: el
// latido no puede tumbar el tick.

export async function anotarLatido(
  servicio: 'entrevistador' | 'fabrica' | 'voz',
  detalle: Record<string, unknown> | null = null,
  db?: SupabaseClient
): Promise<void> {
  try {
    const cliente = db ?? obtenerClienteDb();
    const { error } = await cliente.from('latidos').upsert({
      servicio,
      ultimo_ping: new Date().toISOString(),
      detalle,
    });
    if (error) console.warn(`latido: ${servicio} no pudo latir: ${error.message}`);
  } catch (err) {
    console.warn(`latido: ${servicio} no pudo latir: ${(err as Error).message}`);
  }
}
