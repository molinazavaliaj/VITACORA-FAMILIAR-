// La hora y la zona horaria de la pregunta del día (3t.23, 21/09). Lo puro,
// compartido por los dos checkouts (donde se eligen al comprar) y por Ajustes
// (donde se ven y se cambian después). El scheduler del entrevistador lee
// `hora_preferida` y `zona_horaria` en cada corrida: un cambio rige desde el
// próximo envío, sin tocar nada más.

export type Hora = { valor: string; nombre: string };

/** El Familiar: el narrador contesta de día. */
export const HORAS_FAMILIAR: Hora[] = [
  { valor: "09:00", nombre: "A la mañana (9:00)" },
  { valor: "11:00", nombre: "Media mañana (11:00)" },
  { valor: "16:00", nombre: "A la tarde (16:00)" },
  { valor: "19:00", nombre: "Al final del día (19:00)" },
];

/** El viaje: la pregunta es de la noche, cuando terminó el día. */
export const HORAS_VIAJE: Hora[] = [
  { valor: "20:30", nombre: "Después de cenar (20:30)" },
  { valor: "21:30", nombre: "A la noche (21:30)" },
  { valor: "22:30", nombre: "Tarde en la noche (22:30)" },
  { valor: "08:30", nombre: "A la mañana siguiente (8:30)" },
];

export const ZONAS: [string, string][] = [
  ["Europe/Madrid", "España, Francia, Italia, Alemania (Europa central)"],
  ["Europe/Lisbon", "Portugal, Reino Unido, Irlanda"],
  ["America/Argentina/Buenos_Aires", "Argentina, Uruguay, Brasil (este)"],
  ["America/Santiago", "Chile"],
  ["America/Lima", "Perú, Colombia, Ecuador"],
  ["America/Mexico_City", "México"],
  ["America/New_York", "Estados Unidos (este)"],
  ["America/Los_Angeles", "Estados Unidos (oeste)"],
  ["Asia/Bangkok", "Tailandia, Vietnam"],
  ["Asia/Tokyo", "Japón"],
  ["Australia/Sydney", "Australia (este)"],
];

export function nombreDeZona(zona: string): string {
  return ZONAS.find(([z]) => z === zona)?.[1] ?? zona;
}

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function esZonaValida(zona: unknown): zona is string {
  if (typeof zona !== "string" || !zona) return false;
  try {
    new Intl.DateTimeFormat("es", { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

/** Valida lo que llega del panel: HH:MM de 24 hs y una zona IANA que el sistema conozca. */
export function validarHorario(entrada: { hora?: unknown; zona?: unknown }): { ok: true; hora: string; zona: string } | { ok: false; mensaje: string } {
  if (typeof entrada.hora !== "string" || !HORA_RE.test(entrada.hora)) return { ok: false, mensaje: "La hora tiene que ser HH:MM (por ejemplo 19:00)." };
  if (!esZonaValida(entrada.zona)) return { ok: false, mensaje: "La zona horaria no es válida." };
  return { ok: true, hora: entrada.hora, zona: entrada.zona };
}
