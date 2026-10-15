// Corre un chico inventado de punta a punta contra el motor, con un reloj
// simulado: la usan la lectura corrida y la simulación. Pura (sin I/O).
//
// Chicos INVENTADOS. Nunca usar acá la vida de un narrador real.

import type { Ficha } from './compra.js';
import { nuevoEstado, paso, proximoDespertar, type Enviado, type Estado, type Evento, type Salida } from './motor.js';

/**
 * Lo que hace el chico (o el padre): un evento, tantos ms después, y qué "dice" (para leer).
 * `viejo`: toca un botón de un mensaje que ya quedó atrás (el motor no tiene que hacer nada).
 */
export type Accion = { trasMs: number; evento: Evento; dice: string; viejo?: boolean };

/** Ve lo que le acaba de llegar y decide. `todo`: todos los mensajes que le llegaron hasta ahora. */
export type Conducta = (llegaron: Enviado[], ctx: { estado: Estado; ahora: Date; todo: Enviado[] }) => Accion[];

export type Linea =
  | { en: Date; de: 'bot'; mensaje: Enviado }
  /** `efecto`: el paso sacó mensajes o movió el flujo; `conRafaga`: había algo contado sin procesar (el botón lo procesa). */
  | { en: Date; de: 'chico'; dice: string; evento: Evento; viejo: boolean; efecto: boolean; conRafaga: boolean }
  | { en: Date; de: 'marca'; motivo: string; detalle: string };

export type Corrida = { lineas: Linea[]; estado: Estado; pasos: number };

/** Tope de pasos por corrida: si se llega, algo da vueltas sin terminar. */
export const MAX_PASOS = 20_000;

export function correr(ficha: Ficha, conducta: Conducta, o: { desde: string; dias: number; maxPasos?: number }): Corrida {
  const maxPasos = o.maxPasos ?? MAX_PASOS;
  let estado = nuevoEstado(ficha);
  const lineas: Linea[] = [];
  const todo: Enviado[] = [];
  const fin = new Date(o.desde).getTime() + o.dias * 86_400_000;
  const cola: { en: number; accion: Accion }[] = [];
  let ahora = new Date(o.desde);
  let pasos = 0;

  /** Lo que mueve el flujo (para ver si un botón viejo hizo algo). */
  const flujo = (e: Estado) => JSON.stringify([e.fase, e.cursor, e.extra, e.fotosVencidas, e.reenviar]);

  const aplicar = (ev: Evento, t: Date): boolean => {
    // El estado va y vuelve por JSON en cada paso, como lo va a guardar quien conecte el motor.
    const antes = JSON.parse(JSON.stringify(estado)) as Estado;
    const r = paso(antes, ev, t.toISOString());
    estado = r.estado;
    pasos++;
    const llegaron: Enviado[] = [];
    for (const s of r.salidas as Salida[]) {
      if (s.tipo === 'marca') lineas.push({ en: t, de: 'marca', motivo: s.motivo, detalle: s.detalle });
      else {
        const { tipo: _t, ...m } = s;
        lineas.push({ en: t, de: 'bot', mensaje: m });
        llegaron.push(m);
        todo.push(m);
      }
    }
    if (llegaron.length) {
      for (const a of conducta(llegaron, { estado, ahora: t, todo })) cola.push({ en: t.getTime() + a.trasMs, accion: a });
      cola.sort((a, b) => a.en - b.en);
    }
    return r.salidas.length > 0 || flujo(antes) !== flujo(estado);
  };

  aplicar({ tipo: 'inicio' }, ahora);
  for (;;) {
    if (pasos >= maxPasos) throw new Error(`La corrida llegó al tope de ${maxPasos} pasos a las ${ahora.toISOString()} sin terminar (¿da vueltas?)`);
    const despertar = proximoDespertar(estado, ahora)?.getTime() ?? Infinity;
    const siguiente = Math.min(cola[0]?.en ?? Infinity, despertar);
    if (!Number.isFinite(siguiente) || siguiente > fin) break;
    ahora = new Date(Math.max(siguiente, ahora.getTime()));
    if (cola.length && cola[0].en <= siguiente) {
      const { accion } = cola.shift()!;
      const linea: Extract<Linea, { de: 'chico' }> = { en: ahora, de: 'chico', dice: accion.dice, evento: accion.evento, viejo: accion.viejo ?? false, efecto: false, conRafaga: estado.rafaga !== null };
      lineas.push(linea);
      linea.efecto = aplicar(accion.evento, ahora);
    } else {
      const antes = JSON.stringify(estado);
      aplicar({ tipo: 'reloj' }, ahora);
      if (JSON.stringify(estado) === antes && (proximoDespertar(estado, ahora)?.getTime() ?? Infinity) <= ahora.getTime()) {
        throw new Error(`El motor pide reloj otra vez a las ${ahora.toISOString()} (o antes) sin cambiar nada (se trabaría)`);
      }
    }
  }
  return { lineas, estado, pasos };
}
