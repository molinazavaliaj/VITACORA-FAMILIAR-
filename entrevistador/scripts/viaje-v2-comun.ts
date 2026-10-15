// Lo que comparten los scripts de la Viaje V2 para los socios (alta, cerrar álbum, cambio de país): leer los
// argumentos, la base real y un resumen del calendario para mirar antes de aplicar. Nunca imprime keys.

import type { SupabaseClient } from '@supabase/supabase-js';
import { leerFila } from '../src/viaje-v2/filas.js';
import { aLocal } from '../src/viaje-v2/nucleo/horas.js';
import type { EstadoViaje } from '../src/viaje-v2/nucleo/planificador.js';
import type { Compra } from '../src/viaje-v2/nucleo/tipos.js';
import type { EstadoBotViaje, FilaViaje } from '../src/viaje-v2/tipos.js';
import { cargarEntorno } from './cargar-entorno.js';

export function opcion(args: readonly string[], nombre: string): string | undefined {
  const i = args.indexOf(nombre);
  return i >= 0 ? args[i + 1] : undefined;
}

/** La base real (carga entrevistador/.env antes de importar el cliente) y su host, para que se vea dónde se escribe. */
export async function baseReal(): Promise<{ db: SupabaseClient; host: string }> {
  cargarEntorno();
  let host = '(desconocido)';
  try { host = new URL(process.env.SUPABASE_URL ?? '').host; } catch { /* sin URL válida */ }
  const { db } = await import('../src/db/cliente.js');
  return { db, host };
}

export async function filaDe(db: SupabaseClient, narradorId: string): Promise<FilaViaje> {
  const f = await leerFila<Compra, EstadoBotViaje>(db, narradorId);
  if (!f) throw new Error(`${narradorId} no tiene fila en viajes_v2 (¿no es un viajero V2, o falta la migración?)`);
  return f;
}

/** Lo que falta del calendario, una línea por mensaje, en la hora local de su zona. */
export function pendientesLegibles(plan: EstadoViaje): string[] {
  return plan.calendario
    .filter((g) => g.estado === 'pendiente')
    .map((g) => {
      const l = aLocal(new Date(g.sale), g.zona);
      return `  ${g.clave.padEnd(14)} ${g.ids.join('+').padEnd(16)} ${l.fecha} ${l.hora} (${g.zona})`;
    });
}
