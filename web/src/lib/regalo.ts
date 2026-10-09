// La gift card (spec 2026-10-07-gift-card-design): el código y los datos que
// carga quien regala. Puro: sin red ni Supabase. El entrevistador tiene su copia
// del alfabeto y de la normalización en entrevistador/src/flujo/regalo-codigo.ts
// (son dos servicios aparte): si cambia uno, cambia el otro.

import { randomInt } from "node:crypto";
import { textosAbuelo, type IdiomaRegalo } from "./regalo-textos";
import {
  GENEROS, MENSAJE_MAXIMO, MENSAJE_FECHA_INVALIDA, MENSAJE_IDIOMA_INVALIDO, errorDeFechaEntrega, esIdiomaRegalo, type Genero,
} from "./regalo-reglas";

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
export { GENEROS, MENSAJE_MAXIMO, MENSAJE_FECHA_INVALIDA, errorDeFechaEntrega, type Genero };
export { MENSAJE_FECHA_PASADA } from "./regalo-reglas";

/** Cuánto ocupa el mensaje en la tarjeta: cada salto de línea pesa como 40 letras (un renglón). */
export function largoEnTarjeta(mensaje: string): number {
  return mensaje.length + 40 * (mensaje.match(/\n/g)?.length ?? 0);
}

/** El número de WhatsApp con espacios duros: impreso no se corta en dos renglones. */
export function numeroSinCortes(legible: string): string {
  return legible.replace(/ /g, "\u00A0");
}

/** `idioma`: en qué idioma le habla el biógrafo a quien recibe el regalo. Si no viene, es-AR. */
export type DatosRegalo = { mensaje: string; fechaEntrega: string | null; genero: Genero; idioma: IdiomaRegalo };

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
    if (typeof r.fechaEntrega !== "string") return { ok: false, mensaje: MENSAJE_FECHA_INVALIDA };
    const problema = errorDeFechaEntrega(r.fechaEntrega, hoy);
    if (problema) return { ok: false, mensaje: problema };
    fechaEntrega = r.fechaEntrega;
  }
  let idioma: IdiomaRegalo = "es-AR";
  if (r.idioma !== undefined) {
    if (!esIdiomaRegalo(r.idioma)) return { ok: false, mensaje: MENSAJE_IDIOMA_INVALIDO };
    idioma = r.idioma;
  }
  return { ok: true, regalo: { mensaje, fechaEntrega, genero: r.genero as Genero, idioma } };
}

/** El link a WhatsApp con el mensaje ya escrito, en el idioma del regalo. */
export function linkWhatsApp(numero: string, codigo: string, idioma: IdiomaRegalo): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(textosAbuelo(idioma).mensajeWhatsApp(codigo))}`;
}
