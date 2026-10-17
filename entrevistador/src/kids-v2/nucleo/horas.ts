// Fechas, horas y zonas horarias, sin librerías: Intl alcanza. Todo puro.
// Sale del motor de Viaje V2 (rama viajes-v2, fabrica/src/viaje-v2/horas.ts)
// con la franja de Kids: nada entre las 22:00 y las 9:00, hora del país del número.

export type Fecha = string; // 'YYYY-MM-DD'
export type Hora = string; // 'HH:MM'
export type Zona = string; // IANA, 'America/Argentina/Buenos_Aires'

export const NOCHE_DESDE: Hora = '22:00';
export const NOCHE_HASTA: Hora = '09:00';

const FORMATOS = new Map<Zona, Intl.DateTimeFormat>();

function formato(zona: Zona): Intl.DateTimeFormat {
  let f = FORMATOS.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    FORMATOS.set(zona, f);
  }
  return f;
}

export function zonaValida(zona: Zona): boolean {
  try {
    formato(zona);
    return true;
  } catch {
    return false;
  }
}

export function aLocal(instante: Date, zona: Zona): { fecha: Fecha; hora: Hora } {
  const p = Object.fromEntries(formato(zona).formatToParts(instante).map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

function partesFecha(fecha: Fecha): [number, number, number] {
  const [a, m, d] = fecha.split('-').map(Number);
  return [a, m, d];
}

function desfase(zona: Zona, instante: Date): number {
  const { fecha, hora } = aLocal(instante, zona);
  const [a, m, d] = partesFecha(fecha);
  const [hh, mm] = hora.split(':').map(Number);
  return Date.UTC(a, m - 1, d, hh, mm) - Math.floor(instante.getTime() / 60000) * 60000;
}

/** El instante de una fecha y hora locales (dos pasadas: aguanta el cambio de horario). */
export function aInstante(fecha: Fecha, hora: Hora, zona: Zona): Date {
  const [a, m, d] = partesFecha(fecha);
  const [hh, mm] = hora.split(':').map(Number);
  const base = Date.UTC(a, m - 1, d, hh, mm);
  let t = base - desfase(zona, new Date(base));
  t = base - desfase(zona, new Date(t));
  return new Date(t);
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

export const esHora = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

export function esDeNoche(instante: Date, zona: Zona): boolean {
  const { hora } = aLocal(instante, zona);
  return hora >= NOCHE_DESDE || hora < NOCHE_HASTA;
}

/** Si es de noche, las 9:00 que siguen; si no, el mismo instante. */
export function finDeLaNoche(instante: Date, zona: Zona): Date {
  const { fecha, hora } = aLocal(instante, zona);
  if (hora >= NOCHE_DESDE) return aInstante(sumarDias(fecha, 1), NOCHE_HASTA, zona);
  if (hora < NOCHE_HASTA) return aInstante(fecha, NOCHE_HASTA, zona);
  return instante;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function diaDeSemana(fecha: Fecha): string {
  const [a, m, d] = partesFecha(fecha);
  return DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
}
