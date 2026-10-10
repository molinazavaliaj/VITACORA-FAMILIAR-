// Las reglas del regalo que también usa el navegador (el formulario de /regalar).
// Sin imports de Node: regalo.ts usa node:crypto y no puede bajar al cliente.
// regalo.ts las re-exporta, así que el servidor las sigue importando de ahí.

import type { IdiomaRegalo } from "./regalo-textos";

export const GENEROS = ["varon", "mujer", "otro"] as const;
export type Genero = (typeof GENEROS)[number];
export const MENSAJE_MAXIMO = 600;

// Los mensajes de la fecha, iguales en el servidor (validarRegalo) y en el formulario.
export const MENSAJE_FECHA_INVALIDA = "La fecha no es válida.";
export const MENSAJE_FECHA_PASADA = "La fecha ya pasó.";

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-02-31" no existe: la fecha tiene que volver igual después de pasar por el calendario. */
function esFechaReal(texto: string): boolean {
  if (!FECHA_RE.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

/**
 * La fecha de entrega, si viene, tiene que ser real y no pasada. Quien regala
 * puede estar en cualquier huso: su "hoy" puede ser el día UTC anterior
 * (Argentina después de las 21). Se acepta desde ayer en UTC.
 * Devuelve el mensaje del problema, o null si está bien.
 */
export function errorDeFechaEntrega(texto: string, hoy: Date): string | null {
  if (!esFechaReal(texto)) return MENSAJE_FECHA_INVALIDA;
  const ayerUtc = new Date(hoy.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (texto < ayerUtc) return MENSAJE_FECHA_PASADA;
  return null;
}

// Los idiomas en que el biógrafo le puede hablar a quien recibe el regalo
// (plan 2026-10-09-regalo-idiomas). Iguales a entrevistador/src/v3/nucleo/entrevista/idioma.ts.
export const IDIOMAS_REGALO = ["es-AR", "es-ES", "ca"] as const satisfies readonly IdiomaRegalo[];
export const MENSAJE_IDIOMA_INVALIDO = "El idioma no es válido.";

export function esIdiomaRegalo(valor: unknown): valor is IdiomaRegalo {
  return typeof valor === "string" && (IDIOMAS_REGALO as readonly string[]).includes(valor);
}

// ── El regalo llega solo el día elegido (spec 2026-10-10-regalo-dia-de-entrega) ──

/** Las horas que se pueden elegir, en punto: de 8 a 22, para no despertar a nadie. */
export const HORAS_ENTREGA: readonly number[] = Array.from({ length: 15 }, (_, i) => 8 + i);

export const CANALES_ENTREGA = ["mail", "whatsapp"] as const;
export type CanalEntrega = (typeof CANALES_ENTREGA)[number];

export type ZonaEntrega = "America/Argentina/Buenos_Aires" | "Europe/Madrid";

/** La hora es la del país de quien recibe, y ese país sale del idioma del regalo. */
export function zonaDeIdioma(idioma: IdiomaRegalo): ZonaEntrega {
  return idioma === "es-AR" ? "America/Argentina/Buenos_Aires" : "Europe/Madrid";
}

/** Cuántos minutos le lleva la zona a UTC en ese instante (Madrid en verano: 120). */
function desfaseMinutos(instante: Date, zona: string): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zona, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(instante);
  const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  const comoUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"));
  return Math.round((comoUtc - instante.getTime()) / 60_000);
}

/**
 * La fecha y la hora en punto en esa zona, como instante. Se corrige dos veces
 * por si el desfase de la hora ingenua no es el del resultado (día del cambio
 * de horario). Copia en entrevistador/src/flujo/regalo-hora.ts: si cambia una, cambia la otra.
 */
export function instanteDeEntrega(fecha: string, hora: number, zona: string): Date {
  const [a, m, d] = fecha.split("-").map(Number);
  const ingenuo = Date.UTC(a, m - 1, d, hora);
  let t = ingenuo - desfaseMinutos(new Date(ingenuo), zona) * 60_000;
  t = ingenuo - desfaseMinutos(new Date(t), zona) * 60_000;
  return new Date(t);
}
