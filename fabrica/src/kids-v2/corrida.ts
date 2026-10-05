// Corre un chico inventado de punta a punta contra el motor, con un reloj
// simulado: la usan la lectura corrida y la simulación. Pura (sin I/O).
//
// Chicos INVENTADOS. Nunca usar acá la vida de un narrador real.

import type { Ficha } from './compra.js';
import { nuevoEstado, paso, proximoDespertar, type Estado, type Evento, type Mensaje, type Salida } from './motor.js';

/** Lo que hace el chico (o el padre): un evento, tantos ms después, y qué "dice" (para leer). */
export type Accion = { trasMs: number; evento: Evento; dice: string };

/** Ve lo que le acaba de llegar y decide. `todo`: todos los mensajes que le llegaron hasta ahora. */
export type Conducta = (llegaron: Mensaje[], ctx: { estado: Estado; ahora: Date; todo: Mensaje[] }) => Accion[];

export type Linea =
  | { en: Date; de: 'bot'; mensaje: Mensaje }
  | { en: Date; de: 'chico'; dice: string; evento: Evento }
  | { en: Date; de: 'marca'; motivo: string; detalle: string };

export type Corrida = { lineas: Linea[]; estado: Estado; pasos: number };

export function correr(ficha: Ficha, conducta: Conducta, o: { desde: string; dias: number }): Corrida {
  let estado = nuevoEstado(ficha);
  const lineas: Linea[] = [];
  const todo: Mensaje[] = [];
  const fin = new Date(o.desde).getTime() + o.dias * 86_400_000;
  let cola: { en: number; accion: Accion }[] = [];
  let ahora = new Date(o.desde);
  let pasos = 0;

  const aplicar = (ev: Evento, t: Date) => {
    const r = paso(estado, ev, t.toISOString());
    estado = r.estado;
    pasos++;
    const llegaron: Mensaje[] = [];
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
  };

  aplicar({ tipo: 'inicio' }, ahora);
  while (pasos < 20_000) {
    const despertar = proximoDespertar(estado, ahora)?.getTime() ?? Infinity;
    const siguiente = Math.min(cola[0]?.en ?? Infinity, despertar);
    if (!Number.isFinite(siguiente) || siguiente > fin) break;
    ahora = new Date(Math.max(siguiente, ahora.getTime()));
    if (cola.length && cola[0].en <= siguiente) {
      const { accion } = cola.shift()!;
      lineas.push({ en: ahora, de: 'chico', dice: accion.dice, evento: accion.evento });
      aplicar(accion.evento, ahora);
    } else {
      const antes = JSON.stringify(estado);
      aplicar({ tipo: 'reloj' }, ahora);
      if (JSON.stringify(estado) === antes && proximoDespertar(estado, ahora)?.getTime() === ahora.getTime()) {
        throw new Error(`El motor pide reloj otra vez a las ${ahora.toISOString()} sin cambiar nada (se trabaría)`);
      }
    }
  }
  return { lineas, estado, pasos };
}
