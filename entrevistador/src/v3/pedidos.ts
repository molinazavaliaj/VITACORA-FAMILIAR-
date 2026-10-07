// «Quiero parar» y «esto que no vaya al libro» (Naza, 07/10). Se detectan con
// las frases fijas del núcleo (pidePausa, pideReserva: sin modelo) en el
// texto escrito o en la transcripción, ANTES de sumarlo a una respuesta. El
// mensaje que lo pide no se suma a nada (fila con SIN_CLAVE_V3).
//
//   - Reserva: se reserva la abierta si tiene borrador; si no, la última
//     respuesta cerrada. Va a `estado.reservadas` (la fábrica la saca entera)
//     y a `respuestas.reservada` en todas las filas de esa clave. Sale el
//     texto fijo `reserva`. La entrevista sigue igual.
//   - Pausa: activo → pausado y sale el texto fijo `pausa`. Lo abierto queda
//     abierto. El reloj no trabaja a los pausados (ni M8); al volver a
//     escribir, entrante.ts lo reactiva.
//   - Las dos: se reserva y además se pausa (salen los dos textos).
// Los textos salen de textos-fijos.json: sin texto en su idioma no sale nada
// (la acción igual se hace).

import type { DepsV3 } from './deps.js';
import { conReintento } from './estado.js';
import { marcarReservada, ponerClave, ponerClaveSiFalta } from './filas.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';
import { leerInferida, pidePausa, pideReserva } from './nucleo/entrevista/respuesta.js';
import type { FichaTexto } from './nucleo/entrevista/texto.js';
import { textoFijo } from './textos-fijos.js';
import { fichaTexto, SIN_CLAVE_V3, type EstadoV3 } from './tipos.js';
import { anotarVisto, encolar, yaVisto } from './turno.js';

export type Pedido = { reserva: boolean; pausa: boolean };

/** Qué pide el mensaje, o null si es un mensaje común. */
export function pedidoDe(texto: string, idioma: Idioma): Pedido | null {
  const reserva = pideReserva(texto, idioma);
  const pausa = pidePausa(texto, idioma);
  return reserva || pausa ? { reserva, pausa } : null;
}

/**
 * La respuesta a la que se refiere «esto que no vaya al libro»: la abierta si
 * tiene borrador; si no, la última cerrada. No cuentan las inferidas (no las
 * contó) ni la marca del "Sí" de la abierta (todavía no contó nada).
 */
export function claveAReservar(e: EstadoV3): string | null {
  if (e.esperando && e.borrador?.trim()) return e.esperando;
  const cerradas = e.respuestas.filter(([k, r], i) =>
    leerInferida(r) === undefined && !(e.tocoSi && k === e.esperando && i === e.respuestas.length - 1));
  return cerradas.at(-1)?.[0] ?? null;
}

/** El estado con el pedido anotado (reservadas y textos a la cola). Puro. */
export function anotarPedido(anterior: EstadoV3, ficha: FichaTexto, idioma: Idioma, pedido: Pedido): { estado: EstadoV3; reservada: string | null } {
  let e = anterior;
  let reservada: string | null = null;
  if (pedido.reserva) {
    reservada = claveAReservar(e);
    if (reservada) e = { ...e, reservadas: [...new Set([...(e.reservadas ?? []), reservada])] };
    const t = textoFijo('reserva', idioma, ficha);
    if (t) e = encolar(e, { texto: t, tipo: 'suelto' });
  }
  if (pedido.pausa) {
    const t = textoFijo('pausa', idioma, ficha);
    if (t) e = encolar(e, { texto: t, tipo: 'suelto' });
  }
  return { estado: e, reservada };
}

/**
 * Cumple el pedido de un mensaje ya guardado en `respuestas`: estado primero
 * (con el wamid entre los vistos: el reintento no lo repite), después la
 * clave SIN_CLAVE_V3 de la fila, las filas reservadas y la pausa. No drena:
 * lo hace quien llama.
 */
export async function cumplirPedido(deps: DepsV3, narradorId: string, pedido: Pedido, guardada: { id: string; waMessageId: string }): Promise<void> {
  const r = await conReintento(deps.db, narradorId, (f) => {
    if (yaVisto(f.estado, guardada.waMessageId)) return null;
    const p = anotarPedido(f.estado, fichaTexto(f), f.idioma, pedido);
    return { cambio: { estado: anotarVisto(p.estado, guardada.waMessageId) }, resultado: p.reservada };
  });
  if (!r) {
    await ponerClaveSiFalta(deps.db, guardada.id, SIN_CLAVE_V3);
    return;
  }
  await ponerClave(deps.db, guardada.id, SIN_CLAVE_V3);
  if (r.resultado) {
    const error = await marcarReservada(deps.db, narradorId, r.resultado);
    if (error) {
      const sinColumna = error.code === '42703';
      await deps.avisar(`reserva-${narradorId}-${r.resultado}`, `No pude marcar una reserva de ${narradorId} en respuestas`,
        `El narrador ${narradorId} pidió que ${r.resultado} no vaya al libro. Quedó en entrevistas_v3.estado.reservadas (la fábrica la saca igual), `
        + `pero no pude poner respuestas.reservada = true: ${error.message}.`
        + (sinColumna ? ' Falta aplicar la migración 20260920000100_respuestas_reservadas.sql.' : ''));
    }
  }
  if (pedido.pausa) {
    const { error } = await deps.db.from('narradores').update({ estado: 'pausado' }).eq('id', narradorId).eq('estado', 'activo');
    if (error) console.error(`V3: no pude pausar a ${narradorId}: ${error.message}`);
  }
}
