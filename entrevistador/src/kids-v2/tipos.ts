// Lo que guarda el bot en `kids_v2.estado` (CONTRATO, "Vitácora Kids V2 por WhatsApp"). El motor (núcleo) decide
// qué sale y cuándo, y es la verdad de la entrevista; acá vive lo que el motor no sabe: la cola de lo que ya decidió
// y todavía no salió por WhatsApp, qué id de WhatsApp tuvo cada `envio` (para los botones viejos), qué ids ya se
// procesaron y los fallos de envío.

import type { FilaKidsV2 } from './filas.js';
import type { Ficha } from './nucleo/compra.js';
import type { Enviado, Estado, Salida } from './nucleo/motor.js';
import type { MotivoMarca } from './nucleo/motor/tipos.js';

/** Un mensaje del motor que falta mandar (el destino se resuelve al mandar: chico → su número, padre → telefono_padre). */
export type Saliente = Enviado;

export type EstadoBotKids = {
  motor: Estado;
  /** Lo que el motor ya largó y falta mandar, en orden. Sale de a uno, y se saca recién cuando Meta lo aceptó. */
  salida: Saliente[];
  /** `envio` del motor ↔ id de WhatsApp (los últimos MAX_ENVIADOS): el `context.id` de un botón tocado → `aMensaje`. */
  enviados: { envio: string; wamid: string }[];
  /** Los últimos ids de WhatsApp ya procesados (el reintento de Meta no suma dos veces). */
  vistos: string[];
  /**
   * Los últimos `recibido` del motor (id de WhatsApp → clave). Se escriben en `respuestas.clave_kids` después de
   * guardar; si eso se pierde (el proceso se cayó en el medio), la reconciliación los encuentra acá.
   */
  recibidos: { id: string; clave: string }[];
  fallosEnvio: number;
  avisoFallos: boolean;
};

/** Lo que el padre cambió en el panel y el motor todavía no tomó (CONTRATO, «Cambios del panel»): listas completas. */
export type CambiosPanel = Partial<Pick<Ficha, 'hora' | 'temasSacados' | 'preguntasPadre'>> & { pedido_at?: string };

/** `kids_v2.avance`: lo que el panel necesita sin leer el motor (`avance()` del motor). */
export type Avance = { capitulo: number; preguntasPadreAbiertas: boolean; terminado: boolean };

/** `kids_v2.marcas`: las salidas `marca` del motor, con cuándo salieron. */
export type MarcaKids = { motivo: MotivoMarca; detalle: string; at: string };

export type FilaKids = FilaKidsV2<Ficha, EstadoBotKids, CambiosPanel, Avance | Record<string, never>, MarcaKids>;

/** Cuántos ids recuerdan `vistos`, `enviados` y `recibidos` (Meta reintenta en minutos; un botón viejo, días). */
export const MAX_VISTOS = 200;
export const MAX_ENVIADOS = 200;
export const MAX_RECIBIDOS = 200;

export function estadoBotInicial(motor: Estado): EstadoBotKids {
  return { motor, salida: [], enviados: [], vistos: [], recibidos: [], fallosEnvio: 0, avisoFallos: false };
}

export function yaVisto(e: EstadoBotKids | null, waId: string): boolean {
  return !!e && e.vistos.includes(waId);
}

export function anotarVisto(e: EstadoBotKids, waId: string): EstadoBotKids {
  if (e.vistos.includes(waId)) return e;
  return { ...e, vistos: [...e.vistos, waId].slice(-MAX_VISTOS) };
}

/** El `envio` del motor que salió con ese id de WhatsApp (undefined si no es nuestro o ya se olvidó). */
export function envioDe(e: EstadoBotKids, wamid: string): string | undefined {
  return e.enviados.find((x) => x.wamid === wamid)?.envio;
}

/** Lo que salió de Meta se saca de la cola y se anota su id (si otro proceso ya lo sacó, no se anota dos veces). */
export function anotarEnviado(e: EstadoBotKids, envio: string, wamid: string): EstadoBotKids {
  const yaEstaba = e.enviados.some((x) => x.envio === envio);
  return {
    ...e,
    salida: e.salida.filter((s) => s.envio !== envio),
    enviados: yaEstaba ? e.enviados : [...e.enviados, { envio, wamid }].slice(-MAX_ENVIADOS),
  };
}

/** Los `mensaje` del motor que todavía no están en la cola ni salieron (sin repetir `envio`). */
export function sumarMensajes(e: EstadoBotKids, salidas: readonly Salida[]): EstadoBotKids {
  const ya = new Set([...e.salida.map((s) => s.envio), ...e.enviados.map((x) => x.envio)]);
  const nuevos: Saliente[] = [];
  for (const s of salidas) {
    if (s.tipo !== 'mensaje' || ya.has(s.envio)) continue;
    const { tipo: _tipo, ...m } = s;
    nuevos.push(m);
    ya.add(s.envio);
  }
  return nuevos.length ? { ...e, salida: [...e.salida, ...nuevos] } : e;
}
