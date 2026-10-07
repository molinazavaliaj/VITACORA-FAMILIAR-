// La gift card (spec 2026-10-07-gift-card-design): el código y los datos que
// carga quien regala. Puro: sin red ni Supabase. El entrevistador tiene su copia
// del alfabeto y de la normalización en entrevistador/src/flujo/regalo-codigo.ts
// (son dos servicios aparte): si cambia uno, cambia el otro.

import { randomInt } from "node:crypto";
import { TEXTOS_REGALO } from "./regalo-textos";

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
  let limpio = texto.toUpperCase().replace(/[\s-]/g, "");
  if (limpio.startsWith("VF")) limpio = limpio.slice(2);
  if (limpio.length !== LARGO) return null;
  for (const ch of limpio) if (!ALFABETO_CODIGO.includes(ch)) return null;
  return `VF-${limpio}`;
}

export const GENEROS = ["varon", "mujer", "otro"] as const;
export type Genero = (typeof GENEROS)[number];
export const MENSAJE_MAXIMO = 600;

export type DatosRegalo = { mensaje: string; fechaEntrega: string | null; genero: Genero };

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

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
    if (typeof r.fechaEntrega !== "string" || !FECHA_RE.test(r.fechaEntrega) || Number.isNaN(Date.parse(r.fechaEntrega))) {
      return { ok: false, mensaje: "La fecha no es válida." };
    }
    if (r.fechaEntrega < hoy.toISOString().slice(0, 10)) return { ok: false, mensaje: "La fecha ya pasó." };
    fechaEntrega = r.fechaEntrega;
  }
  return { ok: true, regalo: { mensaje, fechaEntrega, genero: r.genero as Genero } };
}

export function linkWhatsApp(numero: string, codigo: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(TEXTOS_REGALO.mensajeWhatsApp(codigo))}`;
}
