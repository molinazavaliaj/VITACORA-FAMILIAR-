import type { SupabaseClient } from '@supabase/supabase-js';
import { db as dbReal } from './db/cliente.js';
import type { Servicio } from './costos.js';

// "Estoy vivo". Sin esto no se puede distinguir «no hay trabajo» de «el worker
// se cayó», que es justo lo que el panel tiene que mostrar. Se pisa siempre la
// misma fila: interesa la última vez, no el historial.
//
// Si no se puede latir (Supabase caído, la tabla sin crear), se avisa y el
// worker sigue: el latido no puede tumbar el trabajo.

export async function anotarLatido(
  servicio: Servicio,
  detalle: Record<string, unknown> | null = null,
  db?: SupabaseClient
): Promise<void> {
  try {
    const cliente = db ?? dbReal;
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
