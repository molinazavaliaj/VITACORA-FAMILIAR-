// Lo que guarda el bot en `viajes_v2.estado` (CONTRATO, "Viaje V2 por WhatsApp"). El planificador (núcleo) decide
// qué sale y cuándo; acá vive lo que el planificador no sabe: la cola de lo que ya decidió y todavía no salió por
// WhatsApp, la bienvenida, los fallos de envío y las fotos del álbum (para reconocer un reenvío en AL3).

import type { FilaViajeV2 } from './filas.js';
import type { EstadoViaje, Saliente } from './nucleo/planificador.js';
import type { Compra } from './nucleo/tipos.js';

export type EstadoBotViaje = {
  /** El planificador; null hasta el SÍ a la bienvenida. */
  plan: EstadoViaje | null;
  /** Lo que el planificador ya largó y falta mandar, en orden. Sale de a uno, y se saca recién cuando Meta lo aceptó. */
  salida: Saliente[];
  /** BIEN-1 / BIEN-1R: cuándo salió y por dónde (null = todavía no). */
  bienvenida: { en: string; por: 'plantilla' | 'texto' } | null;
  /** Escribió algo que no es SÍ antes de arrancar: se le repitió la bienvenida una vez (después, silencio y aviso). */
  bienvenidaRepetida: boolean;
  /** ISO del último mensaje de la persona (la ventana de 24 h). Antes del SÍ el planificador no existe: va acá. */
  ultimoEntranteAt: string | null;
  fallosEnvio: number;
  avisoFallos: boolean;
  /** Fotos del álbum: sha256 de Meta → id del mensaje (un reenvío del mismo archivo es una de las que saca, AL3). */
  fotosAlbum: Record<string, string>;
  /** Los últimos ids de WhatsApp ya procesados (el reintento de Meta no suma dos veces). */
  vistos: string[];
};

export type FilaViaje = FilaViajeV2<Compra, EstadoBotViaje>;

/** Cuántos ids recuerda `vistos` (Meta reintenta en minutos, no días). */
export const MAX_VISTOS = 200;

export function estadoInicial(): EstadoBotViaje {
  return { plan: null, salida: [], bienvenida: null, bienvenidaRepetida: false, ultimoEntranteAt: null, fallosEnvio: 0, avisoFallos: false, fotosAlbum: {}, vistos: [] };
}

/** El último mensaje de la persona: el del planificador si ya arrancó (lo actualiza alEntrar), si no el del bot. */
export function ultimoEntrante(e: EstadoBotViaje): string | null {
  const a = e.plan?.ultimoEntranteAt ?? null;
  const b = e.ultimoEntranteAt;
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

export function yaVisto(e: EstadoBotViaje, waId: string): boolean {
  return e.vistos.includes(waId);
}

export function anotarVisto(e: EstadoBotViaje, waId: string): EstadoBotViaje {
  if (e.vistos.includes(waId)) return e;
  return { ...e, vistos: [...e.vistos, waId].slice(-MAX_VISTOS) };
}

/** Lo que salió de Meta se saca de la cola por id (si otro proceso ya lo sacó, no pasa nada). */
export function quitarDeSalida(e: EstadoBotViaje, ids: readonly string[]): EstadoBotViaje {
  return { ...e, salida: e.salida.filter((s) => !ids.includes(s.id)) };
}
