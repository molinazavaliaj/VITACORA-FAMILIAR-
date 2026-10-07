// La gift card (spec 2026-10-07-gift-card-design): el código y los datos que
// carga quien regala. Puro: sin red ni Supabase. El entrevistador tiene su copia
// del alfabeto y de la normalización en entrevistador/src/flujo/regalo-codigo.ts
// (son dos servicios aparte): si cambia uno, cambia el otro.

import { randomInt } from "node:crypto";
import { TEXTOS_REGALO } from "./regalo-textos";
import { GENEROS, MENSAJE_MAXIMO, type Genero } from "./regalo-reglas";

/** Sin 0/O, 1/I/L: se leen mal en papel y se dictan mal por teléfono. */
export const ALFABETO_CODIGO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LARGO = 6;

export function generarCodigo(azar: (max: number) => number = (max) => randomInt(0, max)): string {
  let s = "";
  for (let i = 0; i < LARGO; i++) s += ALFABETO_CODIGO[azar(ALFABETO_CODIGO.length)];
  return `VF-${s}`;
}

/** "vf 7k3-m2q", "7K3M2Q" → "VF-7K3M2Q". Lo que no puede ser un código → null. */
export function normalizarCodigo(texto: string): string | null {
  const arriba = texto.trim().toUpperCase();
  // El VF es prefijo si va separado ("VF-7K3M", "VF 7K3") o si sobra ("VFVF3K2M").
  // Pegado y sin sobrar, es parte del código: "VF3K2M" es VF-VF3K2M escrito pelado.
  const prefijoSeparado = /^VF[\s-]/.test(arriba);
  let limpio = arriba.replace(/[\s-]/g, "");
  if (prefijoSeparado || (limpio.length === LARGO + 2 && limpio.startsWith("VF"))) limpio = limpio.slice(2);
  if (limpio.length !== LARGO) return null;
  for (const ch of limpio) if (!ALFABETO_CODIGO.includes(ch)) return null;
  return `VF-${limpio}`;
}

// En regalo-reglas.ts porque el formulario de /regalar (cliente) también las usa.
export { GENEROS, MENSAJE_MAXIMO, type Genero };

/** Cuánto ocupa el mensaje en la tarjeta: cada salto de línea pesa como 40 letras (un renglón). */
export function largoEnTarjeta(mensaje: string): number {
  return mensaje.length + 40 * (mensaje.match(/\n/g)?.length ?? 0);
}

/** El número de WhatsApp con espacios duros: impreso no se corta en dos renglones. */
export function numeroSinCortes(legible: string): string {
  return legible.replace(/ /g, "\u00A0");
}

export type DatosRegalo = { mensaje: string; fechaEntrega: string | null; genero: Genero };

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-02-31" no existe: la fecha tiene que volver igual después de pasar por el calendario. */
function esFechaReal(texto: string): boolean {
  if (!FECHA_RE.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

export function validarRegalo(
  crudo: unknown,
  hoy: Date,
): { ok: true; regalo: DatosRegalo } | { ok: false; mensaje: string } {
  const r = (crudo && typeof crudo === "object" ? crudo : {}) as Record<string, unknown>;
  const mensaje = typeof r.mensaje === "string" ? r.mensaje.trim() : "";
  if (!mensaje) return { ok: false, mensaje: "Falta tu mensaje para la tarjeta." };
  if (mensaje.length > MENSAJE_MAXIMO) return { ok: false, mensaje: `El mensaje puede tener hasta ${MENSAJE_MAXIMO} letras.` };
  if (typeof r.genero !== "string" || !(GENEROS as readonly string[]).includes(r.genero)) {
    return { ok: false, mensaje: "Falta elegir si es hombre o mujer." };
  }
  let fechaEntrega: string | null = null;
  if (r.fechaEntrega !== undefined && r.fechaEntrega !== null && r.fechaEntrega !== "") {
    if (typeof r.fechaEntrega !== "string" || !esFechaReal(r.fechaEntrega)) {
      return { ok: false, mensaje: "La fecha no es válida." };
    }
    // Quien regala puede estar en cualquier huso: su "hoy" puede ser el día UTC
    // anterior (Argentina después de las 21). Se acepta desde ayer en UTC.
    const ayerUtc = new Date(hoy.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (r.fechaEntrega < ayerUtc) return { ok: false, mensaje: "La fecha ya pasó." };
    fechaEntrega = r.fechaEntrega;
  }
  return { ok: true, regalo: { mensaje, fechaEntrega, genero: r.genero as Genero } };
}

export function linkWhatsApp(numero: string, codigo: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(TEXTOS_REGALO.mensajeWhatsApp(codigo))}`;
}
