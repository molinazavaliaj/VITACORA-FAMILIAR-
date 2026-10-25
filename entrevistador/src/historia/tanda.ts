// La tanda del día (como src/v3/tanda.ts): a su hora sale la pregunta; mientras contesta, las siguientes salen de
// corrido, sin tope. Puro: lo usan entrante.ts y reloj.ts.

import { minutosLocales } from '../flujo/tiempo.js';
import { preguntaPorId } from './nucleo/entrevista/banco.js';
import type { EstadoHistoria, FilaHistoria } from './tipos.js';

/**
 * De los 7 bloques de banco.md, cuando entra al 4 («Lo más difícil», HC5) va por la mitad (el mail de hito 'mitad').
 * En V3 era el 8 de 15.
 */
export const BLOQUE_DE_LA_MITAD = 4;

export function cuentaDeHoy(fila: Pick<FilaHistoria, 'tanda_dia' | 'tanda_cuenta'>, hoy: string): number {
  return fila.tanda_dia === hoy ? fila.tanda_cuenta : 0;
}

export type Tanda = { estado: EstadoHistoria; tanda_dia: string; tanda_cuenta: number };

/** Después de cerrar (y quizá abrir otra): la cuenta del día y, si abrió algo, desde cuándo está abierto (M8 a los 2 días). */
export function aplicarTanda(fila: Pick<FilaHistoria, 'tanda_dia' | 'tanda_cuenta'>, estado: EstadoHistoria, hoy: string, abrio: boolean, ahora: Date): Tanda {
  return {
    estado: abrio ? { ...estado, abiertaDesde: ahora.toISOString() } : estado,
    tanda_dia: hoy,
    tanda_cuenta: cuentaDeHoy(fila, hoy) + (abrio ? 1 : 0),
  };
}

/** "10:00:00" → 600. */
export function minutosDeHora(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** ¿Ya pasó su hora preferida hoy, en su zona? */
export function yaEsLaHora(horaPreferida: string, zona: string, ahora: Date): boolean {
  return minutosLocales(ahora, zona) >= minutosDeHora(horaPreferida);
}

/** Los mails de hito que ya existen (mail/hitos.ts) y que tocan: mandarHito no repite. */
export function hitosDe(estado: EstadoHistoria): ('primera' | 'mitad')[] {
  const contadas = estado.respuestas.filter(([id]) => preguntaPorId(id) !== undefined);
  const hitos: ('primera' | 'mitad')[] = [];
  if (contadas.length >= 1) hitos.push('primera');
  if (estado.bloqueActual >= BLOQUE_DE_LA_MITAD) hitos.push('mitad');
  return hitos;
}
