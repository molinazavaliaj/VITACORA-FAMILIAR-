// Fechas, horas y zonas horarias, sin librerías: Intl alcanza. Todo puro.
//
// Regla de fondo (banco.md, "Horas"): nunca se manda nada entre las 23:00 y
// las 8:00 locales; si algo cae ahí, espera a las 8:00.

import type { Fecha, Hora, Zona } from './tipos.js';

export const FRANJA_DESDE = '23:00';
export const FRANJA_HASTA = '08:00';

const FORMATOS = new Map<Zona, Intl.DateTimeFormat>();

function formato(zona: Zona): Intl.DateTimeFormat {
  let f = FORMATOS.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone: zona,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    FORMATOS.set(zona, f);
  }
  return f;
}

/** ¿Existe la zona? (Intl tira RangeError si no.) */
export function zonaValida(zona: Zona): boolean {
  try {
    formato(zona);
    return true;
  } catch {
    return false;
  }
}

/** Fecha y hora local de un instante en una zona. */
export function aLocal(instante: Date, zona: Zona): { fecha: Fecha; hora: Hora } {
  const p = Object.fromEntries(formato(zona).formatToParts(instante).map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

function partesFecha(fecha: Fecha): [number, number, number] {
  const [a, m, d] = fecha.split('-').map(Number);
  return [a, m, d];
}

/** Diferencia (ms) entre la hora local de la zona y UTC, en ese instante. */
function desfase(zona: Zona, instante: Date): number {
  const { fecha, hora } = aLocal(instante, zona);
  const [a, m, d] = partesFecha(fecha);
  const [hh, mm] = hora.split(':').map(Number);
  const comoUtc = Date.UTC(a, m - 1, d, hh, mm);
  return comoUtc - Math.floor(instante.getTime() / 60000) * 60000;
}

/** El instante de una fecha y hora locales en una zona (dos pasadas: aguanta el cambio de horario). */
export function aInstante(fecha: Fecha, hora: Hora, zona: Zona): Date {
  const [a, m, d] = partesFecha(fecha);
  const [hh, mm] = hora.split(':').map(Number);
  const base = Date.UTC(a, m - 1, d, hh, mm);
  let t = base - desfase(zona, new Date(base));
  t = base - desfase(zona, new Date(t));
  return new Date(t);
}

/**
 * Si el instante cae entre las 23:00 y las 8:00 locales, lo corre a la mañana
 * siguiente: a las 8:00, o a la hora que se pida (el álbum usa las 10:00).
 */
export function respetarFranja(instante: Date, zona: Zona, a: Hora = FRANJA_HASTA): Date {
  const { fecha, hora } = aLocal(instante, zona);
  if (hora >= FRANJA_DESDE) return aInstante(sumarDias(fecha, 1), a, zona);
  if (hora < FRANJA_HASTA) return aInstante(fecha, a, zona);
  return instante;
}

/** La franja en varias zonas a la vez (ID1: ni de madrugada en casa ni en el viaje). */
export function respetarFranjas(instante: Date, zonas: readonly Zona[]): Date {
  let t = instante;
  for (let vuelta = 0; vuelta < 6; vuelta++) {
    const antes = t.getTime();
    for (const z of zonas) t = respetarFranja(t, z);
    if (t.getTime() === antes) return t;
  }
  throw new Error(`No hay hora fuera de la franja en ${zonas.join(' y ')}`);
}

export function sumarDias(fecha: Fecha, dias: number): Fecha {
  const [a, m, d] = partesFecha(fecha);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Días de calendario de `desde` a `hasta` (0 si son el mismo día). */
export function diasEntre(desde: Fecha, hasta: Fecha): number {
  const [a1, m1, d1] = partesFecha(desde);
  const [a2, m2, d2] = partesFecha(hasta);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000);
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function diaDeSemana(fecha: Fecha): string {
  const [a, m, d] = partesFecha(fecha);
  return DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
}

/** 'America/Argentina/Buenos_Aires' → 'Buenos Aires'. Solo para leer. */
export function nombreDeZona(zona: Zona): string {
  return zona.split('/').pop()!.replace(/_/g, ' ');
}

export const esFecha = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && sumarDias(s, 0) === s;
export const esHora = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
