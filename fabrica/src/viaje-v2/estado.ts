// Lo que pasó en la entrevista de un viaje: qué se mandó, qué contestó y
// cuándo. Simple a propósito: una lista de envíos, cada uno con sus
// respuestas. Todo inmutable (cada función devuelve un Estado nuevo).

import type { EstadoAlbum } from './album.js';
import { CADENA_ANTES, type IdAntes, type TipoProgramado } from './calendario.js';
import { ROTACION_INICIAL, type Respuesta as RespuestaMensaje, type Rotacion } from './mensajes.js';

export type Respuesta = RespuestaMensaje & {
  /** ISO. */
  en: string;
};

export type Envio = {
  /** "AS1" en la cadena; "D3-noche" en el viaje (la `clave` del calendario). */
  clave: string;
  tipo: TipoProgramado | 'cadena';
  ids: string[];
  /** ISO. */
  en: string;
  /** Solo en la cadena: salió en su versión "ya de viaje" (AS1 con un SÍ tardío). */
  yaDeViaje?: boolean;
  respuestas: Respuesta[];
};

export type Estado = {
  envios: Envio[];
  /** La rotación de acuses y atrasos, y los TXT usados. */
  rotacion: Rotacion;
  /** Si ya salió el REC1 (va una sola vez). */
  recordatorioAntes: boolean;
  /** Fotos sueltas guardadas fuera del álbum (se guardan siempre). */
  fotosSueltas: number;
  album: EstadoAlbum | null;
};

export function nuevoEstado(): Estado {
  return { envios: [], rotacion: ROTACION_INICIAL, recordatorioAntes: false, fotosSueltas: 0, album: null };
}

export function anotarEnvio(e: Estado, envio: Omit<Envio, 'respuestas'>): Estado {
  return { ...e, envios: [...e.envios, { ...envio, respuestas: [] }] };
}

export function anotarRespuesta(e: Estado, clave: string, r: Respuesta): Estado {
  const i = e.envios.map((x) => x.clave).lastIndexOf(clave);
  if (i < 0) throw new Error(`Respuesta a ${clave}, que no se mandó`);
  const envios = e.envios.slice();
  envios[i] = { ...envios[i], respuestas: [...envios[i].respuestas, r] };
  return { ...e, envios };
}

/** Contestada = alguna respuesta que no sea un audio que llegó mal. "Paso" cuenta. */
export function contestado(envio: Envio): boolean {
  return envio.respuestas.some((r) => !r.audioMal);
}

/**
 * Intentó contestar: cualquier respuesta, aunque sea un audio que llegó mal.
 * Para el ATR alcanza con el intento: no es una noche "sin contestar".
 */
export function intento(envio: Envio): boolean {
  return envio.respuestas.length > 0;
}

/** Las noches del viaje: las que cuentan para el ATR. CA1 no (ya volvió). */
const NOCHES_DEL_VIAJE: ReadonlySet<string> = new Set(['noche', 'antes-en-viaje', 'propia', 'FN1']);

/** Cuántas noches del viaje seguidas, desde la última mandada hacia atrás, quedaron sin contestar. */
export function nochesSinContestar(e: Estado): number {
  let n = 0;
  for (const envio of [...e.envios].reverse()) {
    if (!NOCHES_DEL_VIAJE.has(envio.tipo)) continue;
    if (intento(envio)) break;
    n++;
  }
  return n;
}

/** Las de la cadena de antes de salir que contestó (o pasó). Un audio que llegó mal solo no alcanza: sigue pendiente. */
export function contestadasAntes(e: Estado): Set<string> {
  return new Set(e.envios.filter((x) => x.tipo === 'cadena' && contestado(x)).map((x) => x.clave));
}

/**
 * Las de antes de salir que van a las noches del viaje: las que no contestó
 * (ni pasó), salvo las que ya salieron en su versión "ya de viaje" (AS1 con un
 * SÍ tardío): esas no se repiten.
 */
export function pendientesParaElViaje(e: Estado): IdAntes[] {
  const contestadas = contestadasAntes(e);
  const yaDeViaje = new Set(e.envios.filter((x) => x.tipo === 'cadena' && x.yaDeViaje).map((x) => x.clave));
  return CADENA_ANTES.filter((id) => !contestadas.has(id) && !yaDeViaje.has(id));
}
