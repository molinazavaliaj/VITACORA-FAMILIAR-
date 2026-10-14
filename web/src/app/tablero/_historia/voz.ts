import type { BloqueHistoriaV3 } from "@/lib/v3";

// «Lo último que contó» y las cifras de la cabecera (respuestas y minutos de
// su voz), sacados de lo MISMO que muestra la historia: así nunca dicen otra
// cosa que la lista de abajo, y en V3 respetan lo que el narrador pidió que no
// vaya al libro (historiaV3 ya lo saca). Funciones puras: se prueban solas.

export type AudioReciente = {
  id: string;
  /** La pregunta como le llegó, «Noche 3 · 22 de septiembre», o null si no se sabe. */
  titulo: string | null;
  duracion: number | null;
  recibidoAt: string;
};

export type ResumenVoz = { respuestas: number; segundos: number; ultimas: AudioReciente[] };

const CUANTAS = 3;

function lasUltimas(lista: AudioReciente[]): AudioReciente[] {
  return [...lista].sort((a, b) => (a.recibidoAt < b.recibidoAt ? 1 : a.recibidoAt > b.recibidoAt ? -1 : 0)).slice(0, CUANTAS);
}

type RespuestaFila = {
  id: string;
  pregunta_orden: number;
  audio_path: string | null;
  duracion_segundos: number | null;
  es_repregunta: boolean;
  recibido_at: string;
};

/** Guion clásico: una respuesta por pregunta del guion; el título es la pregunta (o la que de verdad se le mandó). */
export function vozClasica(respuestas: RespuestaFila[], preguntaDe: (orden: number) => string | null): ResumenVoz {
  const ordenes = new Set(respuestas.map((r) => r.pregunta_orden));
  return {
    respuestas: ordenes.size,
    segundos: respuestas.reduce((acc, r) => acc + (r.duracion_segundos ?? 0), 0),
    ultimas: lasUltimas(
      respuestas.filter((r) => r.audio_path).map((r) => ({ id: r.id, titulo: preguntaDe(r.pregunta_orden), duracion: r.duracion_segundos, recibidoAt: r.recibido_at })),
    ),
  };
}

/** Viaje: las noches contadas (1..noches); el título es la noche y su fecha. */
export function vozViaje(respuestas: RespuestaFila[], noches: number, tituloDe: (orden: number) => string): ResumenVoz {
  const contadas = new Set(respuestas.map((r) => r.pregunta_orden).filter((o) => o >= 1 && o <= noches));
  return {
    respuestas: contadas.size,
    segundos: respuestas.reduce((acc, r) => acc + (r.duracion_segundos ?? 0), 0),
    ultimas: lasUltimas(
      respuestas.filter((r) => r.audio_path).map((r) => ({ id: r.id, titulo: tituloDe(r.pregunta_orden), duracion: r.duracion_segundos, recibidoAt: r.recibido_at })),
    ),
  };
}

/** V3: por pregunta contestada (o reservada, que también cuenta para el cierre); los audios, solo de lo que se muestra. */
export function vozV3(bloques: BloqueHistoriaV3[]): ResumenVoz {
  const preguntas = bloques.flatMap((b) => b.preguntas);
  const respuestas = preguntas.filter((p) => p.respuestas.length > 0 || p.reservada).length;
  const visibles = preguntas.filter((p) => !p.reservada).flatMap((p) => p.respuestas.map((r) => ({ p, r })));
  return {
    respuestas,
    segundos: preguntas.flatMap((p) => p.respuestas).reduce((acc, r) => acc + (r.duracion ?? 0), 0),
    ultimas: lasUltimas(visibles.filter(({ r }) => r.audio).map(({ p, r }) => ({ id: r.id, titulo: p.pregunta, duracion: r.duracion, recibidoAt: r.recibidoAt }))),
  };
}

/** «Hoy», «Ayer», «Hace 4 días» (en días de calendario de Madrid o Buenos Aires: alcanza con UTC−3/+2 de diferencia). */
export function diasDesde(iso: string, ahora: Date): number {
  const dia = (d: Date) => Math.floor(d.getTime() / 86_400_000);
  return Math.max(0, dia(ahora) - dia(new Date(iso)));
}

export function mmss(segundos: number | null): string {
  if (!segundos || !Number.isFinite(segundos) || segundos < 0) return "";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
