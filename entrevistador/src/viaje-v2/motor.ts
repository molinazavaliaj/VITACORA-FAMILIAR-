// Entre el planificador (puro) y la base: lo que devuelve un paso se suma al estado guardado (la cola de salida
// crece; el plan se reemplaza) y, recién cuando la escritura ganó, salen los avisos a los socios.

import type { DepsViaje } from './deps.js';
import type { Aviso, Nota, Paso } from './nucleo/planificador.js';
import type { EstadoBotViaje } from './tipos.js';

export function sumarPaso(e: EstadoBotViaje, p: Pick<Paso, 'estado' | 'salientes'>): EstadoBotViaje {
  const ya = new Set(e.salida.map((s) => s.id));
  return { ...e, plan: p.estado, salida: [...e.salida, ...p.salientes.filter((s) => !ya.has(s.id))] };
}

/** Los avisos del planificador ya vienen sin repetir por viaje (avisosPedidos); la clave suma el narrador. */
export async function mandarAvisos(deps: DepsViaje, narradorId: string, avisos: readonly Aviso[]): Promise<void> {
  for (const a of avisos) await deps.avisar(`viaje-${narradorId}-${a.clave}`, a.asunto, `${a.detalle} (narrador ${narradorId})`);
}

/** Las notas son para leer: van a la consola de Railway, nunca a nadie. */
export function anotarNotas(narradorId: string, notas: readonly Nota[]): void {
  for (const n of notas) console.log(`viaje V2 ${narradorId}: ${n.texto}`);
}
