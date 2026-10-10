// «Quiero parar» y «esto que no vaya al libro» (Naza, 07/10). Se detectan con
// las frases fijas del núcleo (pidePausa, pideReserva: sin modelo) en el
// texto escrito o en la transcripción, ANTES de sumarlo a una respuesta. El
// mensaje que lo pide no se suma a nada (fila con SIN_CLAVE_V3).
//
//   - Reserva: se reserva la abierta si tiene borrador o si tocó "Sí" (lo que
//     va a contar); si no, la última respuesta cerrada, salvo que el mensaje
//     sea largo (> PALABRAS_MENSAJE_CORTO): ahí lo único que se deja afuera es
//     el mensaje mismo y se avisa a los socios (revisión del 07/10). Va a
//     `estado.reservadas` (la fábrica la saca entera) y a `respuestas.reservada`
//     en las filas de esa clave y sus derivadas. Sale el texto fijo `reserva`.
//     La entrevista sigue igual.
//   - Pausa: activo → pausado (con alerta_silencio, como el flujo viejo), sale
//     el texto fijo `pausa` y se avisa a los socios (red de seguridad contra
//     una pausa por error). Lo abierto queda abierto. El reloj no trabaja a
//     los pausados (ni M8); al volver a escribir, entrante.ts lo reactiva.
//   - Las dos: se reserva y además se pausa (salen los dos textos).
// Los textos salen de textos-fijos.json: sin texto en su idioma no sale nada
// (la acción igual se hace).

import type { DepsV3 } from './deps.js';
import { conReintento } from './estado.js';
import { marcarReservada, ponerClave, ponerClaveSiFalta } from './filas.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';
import { leerInferida, normalizar, pidePausa, pideReserva } from './nucleo/entrevista/respuesta.js';
import type { FichaTexto } from './nucleo/entrevista/texto.js';
import { textoFijo } from './textos-fijos.js';
import { fichaTexto, SIN_CLAVE_V3, type EstadoV3 } from './tipos.js';
import { anotarVisto, encolar, yaVisto } from './turno.js';

/** `largo`: el mensaje tiene más de PALABRAS_MENSAJE_CORTO palabras. */
export type Pedido = { reserva: boolean; pausa: boolean; largo: boolean };

/** Un mensaje de más palabras que esto es largo: su reserva no alcanza a la respuesta anterior. */
export const PALABRAS_MENSAJE_CORTO = 15;

/** Qué pide el mensaje, o null si es un mensaje común. */
export function pedidoDe(texto: string, idioma: Idioma): Pedido | null {
  const reserva = pideReserva(texto, idioma);
  const pausa = pidePausa(texto, idioma);
  if (!reserva && !pausa) return null;
  const largo = normalizar(texto).split(' ').filter(Boolean).length > PALABRAS_MENSAJE_CORTO;
  return { reserva, pausa, largo };
}

/**
 * La respuesta a la que se refiere «esto que no vaya al libro»: la abierta si
 * tiene borrador o si tocó "Sí" (lo que está por contar); si no, la última
 * cerrada (sin las inferidas, que no las contó). En un mensaje largo sin nada
 * abierto, ninguna: se refiere a lo que cuenta en el mismo mensaje.
 */
export function claveAReservar(e: EstadoV3, largo = false): string | null {
  if (e.esperando && (e.borrador?.trim() || e.tocoSi)) return e.esperando;
  if (largo) return null;
  const cerradas = e.respuestas.filter(([, r]) => leerInferida(r) === undefined);
  return cerradas.at(-1)?.[0] ?? null;
}

export type PedidoAnotado = { estado: EstadoV3; reservada: string | null; reservaLarga: boolean };

/** El estado con el pedido anotado (reservadas y textos a la cola). Puro. */
export function anotarPedido(anterior: EstadoV3, ficha: FichaTexto, idioma: Idioma, pedido: Pedido): PedidoAnotado {
  let e = anterior;
  let reservada: string | null = null;
  let reservaLarga = false;
  if (pedido.reserva) {
    reservada = claveAReservar(e, pedido.largo);
    reservaLarga = reservada === null && pedido.largo;
    if (reservada) e = { ...e, reservadas: [...new Set([...(e.reservadas ?? []), reservada])] };
    const t = textoFijo('reserva', idioma, ficha);
    if (t) e = encolar(e, { texto: t, tipo: 'suelto' });
  }
  if (pedido.pausa) {
    const t = textoFijo('pausa', idioma, ficha);
    if (t) e = encolar(e, { texto: t, tipo: 'suelto' });
  }
  return { estado: e, reservada, reservaLarga };
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
    return { cambio: { estado: anotarVisto(p.estado, guardada.waMessageId) }, resultado: p };
  });
  if (!r) {
    await ponerClaveSiFalta(deps.db, guardada.id, SIN_CLAVE_V3);
    return;
  }
  await ponerClave(deps.db, guardada.id, SIN_CLAVE_V3);
  const nombre = r.fila.ficha.nombre;
  const { reservada, reservaLarga } = r.resultado;
  if (reservada) {
    const error = await marcarReservada(deps.db, narradorId, reservada);
    if (error) {
      const sinColumna = error.code === '42703';
      await deps.avisar(`reserva-${narradorId}-${reservada}`, `No pude marcar una reserva de ${narradorId} en respuestas`,
        `El narrador ${narradorId} pidió que ${reservada} no vaya al libro. Quedó en entrevistas_v3.estado.reservadas (la fábrica la saca igual), `
        + `pero no pude poner respuestas.reservada = true: ${error.message}.`
        + (sinColumna ? ' Falta aplicar la migración 20260920000100_respuestas_reservadas.sql.' : ''));
    }
  }
  if (reservaLarga) {
    await deps.avisar(`reserva-larga-${narradorId}`, `${nombre} pidió que algo no vaya al libro en un mensaje largo`,
      `El narrador ${narradorId} mandó un mensaje largo que pide que algo no vaya al libro, sin una respuesta abierta. Ese mensaje quedó afuera `
      + `(respuestas.id ${guardada.id}, clave_v3 '∅'), pero NO se reservó ninguna respuesta anterior. Si se refería a otra, hay que reservarla a mano.`);
  }
  if (pedido.pausa) {
    // Como el flujo viejo (flujo/procesar.ts): la alerta de silencio queda prendida para la familia.
    const { error } = await deps.db.from('narradores').update({ estado: 'pausado', alerta_silencio: true }).eq('id', narradorId).eq('estado', 'activo');
    if (error) console.error(`V3: no pude pausar a ${narradorId}: ${error.message}`);
    await deps.avisar(`pausa-${narradorId}`, `${nombre} pausó la entrevista V3`,
      `El narrador ${narradorId} pidió parar y quedó pausado. Si fue por error (las frases son fijas, sin modelo), con que escriba cualquier cosa se reactiva.`);
  }
}
