// La tanda del día (spec 2026-10-07, "Ritmo"): a su hora sale la primera
// pregunta; mientras contesta, las siguientes salen de corrido; el tope por
// día depende del ritmo. Puro: lo usan entrante.ts, reloj.ts y pasar.ts.

import type { Ritmo } from '../flujo/ritmo.js';
import { minutosLocales } from '../flujo/tiempo.js';
import { preguntaPorId } from './nucleo/entrevista/banco.js';
import { leerInferida } from './nucleo/entrevista/respuesta.js';
import type { EstadoV3, FilaV3 } from './tipos.js';

export const TOPE_POR_RITMO: Readonly<Record<Ritmo, number>> = { diario: 4, dos_por_dia: 8, seguido: Number.POSITIVE_INFINITY };

/** De 15 bloques, cuando entra al 8 va por la mitad (el mail de hito 'mitad'). */
export const BLOQUE_DE_LA_MITAD = 8;

export function cuentaDeHoy(fila: Pick<FilaV3, 'tanda_dia' | 'tanda_cuenta'>, hoy: string): number {
  return fila.tanda_dia === hoy ? fila.tanda_cuenta : 0;
}

export function puedeAbrirHoy(fila: Pick<FilaV3, 'tanda_dia' | 'tanda_cuenta'>, ritmo: Ritmo, hoy: string): boolean {
  return cuentaDeHoy(fila, hoy) < TOPE_POR_RITMO[ritmo];
}

export type Tanda = { estado: EstadoV3; tanda_dia: string; tanda_cuenta: number };

/** Después de cerrar (y quizá abrir otra): la cuenta del día y, si abrió una pregunta, desde cuándo está abierta (M8 a los 2 días). */
export function aplicarTanda(fila: Pick<FilaV3, 'tanda_dia' | 'tanda_cuenta'>, estado: EstadoV3, hoy: string, abrio: boolean, ahora: Date): Tanda {
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
export function hitosDe(estado: EstadoV3): ('primera' | 'mitad')[] {
  const contadas = estado.respuestas.filter(([id, r]) => preguntaPorId(id)?.clase === 'historia' && leerInferida(r) === undefined);
  const hitos: ('primera' | 'mitad')[] = [];
  if (contadas.length >= 1) hitos.push('primera');
  if (estado.bloqueActual >= BLOQUE_DE_LA_MITAD) hitos.push('mitad');
  return hitos;
}
