import { randomBytes } from "node:crypto";
import type { IdiomaWeb } from "./idioma-web";
import type { Region } from "./precios";

// El programa de creadores, «Colabora con Vitácora» (21/10; diseño en
// docs/superpowers/specs/2026-10-21-programa-creadores-design.md). Lógica pura,
// sin red, para probarla sin mocks; lo que toca la base vive en ./creadores-base.ts.
//
// Las reglas, en corto:
//   - El creador se anota en /colabora y queda pendiente. Los socios lo aprueban
//     en /admin/creadores y eligen su código, su comisión y el descuento para su
//     comunidad (los dos por creador, editables después).
//   - El código va en el mismo casillero que el cupón de bienvenida. El descuento
//     se calcula igual que el del cupón (% del libro digital). Con descuento 0, o
//     sin libro digital en la compra, el código igual atribuye la venta.
//   - La comisión es sobre lo que el cliente pagó de verdad (`compra.total`, ya
//     con el descuento) y se congela en el momento de la compra.
//   - No se suma con la promo global ni con otro cupón: un solo código por compra.
//
// Todo apagado hasta que Naza prenda CREADORES=1 en Vercel (con la migración
// 20261021000000 aplicada y los textos aprobados).

/** ¿Está prendido el programa? Sin la variable, ni /colabora ni códigos ni panel ni resumen. */
export function creadoresPrendido(): boolean {
  return process.env.CREADORES?.trim() === "1";
}

export const COMISION_SUGERIDA = 20;
export const DESCUENTO_SUGERIDO = 10;
export const COMISION_MAXIMA = 50;
export const DESCUENTO_MAXIMO = 50;

// ── El código ──────────────────────────────────────────────────────────────

const CODIGO_RE = /^[A-Z0-9]{3,20}$/;
/** El prefijo del cupón del rasca y gana: un código de creador nunca lo lleva (no se confunden). */
const PREFIJO_RASCA = "VITACORA10";

/** Mayúsculas, sin tildes, sin espacios, guiones ni guiones bajos («Lucía-M» → «LUCIAM»). */
function limpiar(crudo: string): string {
  return crudo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
}

/** ¿Tiene forma de código de creador? */
export function codigoCreadorValido(codigo: string): boolean {
  return CODIGO_RE.test(codigo) && !codigo.startsWith(PREFIJO_RASCA);
}

/**
 * Lo que escribió la persona (en el checkout o los socios al aprobar), como se
 * guarda. null si no tiene forma de código de creador.
 */
export function normalizarCodigoCreador(crudo: unknown): string | null {
  if (typeof crudo !== "string") return null;
  const limpio = limpiar(crudo);
  return codigoCreadorValido(limpio) ? limpio : null;
}

/** La sugerencia del panel al aprobar: el nombre, sin lo que no es letra ni número, hasta 15. */
export function sugerirCodigo(nombre: string): string {
  const base = limpiar(nombre).replace(/[^A-Z0-9]/g, "").slice(0, 15);
  return codigoCreadorValido(base) ? base : "";
}

/** El link privado del panel del creador: 32 bytes al azar, en base64url. */
export function generarTokenPanel(): string {
  return randomBytes(32).toString("base64url");
}

/** ¿Tiene forma de token de panel? (antes de ir a la base con lo que vino en la URL) */
export function pareceTokenPanel(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

// ── La cuenta ─────────────────────────────────────────────────────────────

/** La comisión de una venta: euros a los céntimos, pesos al entero (como el resto de la casa). */
export function importeComision(total: number, moneda: string, porcentaje: number): number {
  const crudo = (total * porcentaje) / 100;
  return moneda === "ARS" ? Math.round(crudo) : Math.round(crudo * 100) / 100;
}

/** Un porcentaje escrito en el panel: entero entre `min` y `max`, o null. */
export function leerPorcentaje(crudo: unknown, min: number, max: number): number | null {
  if (typeof crudo !== "string" && typeof crudo !== "number") return null;
  const texto = String(crudo).trim();
  if (!/^\d{1,3}$/.test(texto)) return null;
  const n = Number(texto);
  return n >= min && n <= max ? n : null;
}

// ── Las filas ─────────────────────────────────────────────────────────────

export type EstadoCreador = "pendiente" | "activo" | "pausado" | "rechazado";
export type RedCreador = "instagram" | "tiktok" | "youtube" | "otra";
export const REDES: readonly RedCreador[] = ["instagram", "tiktok", "youtube", "otra"];

/** La fila de `creadores` (supabase/CONTRATO.md «Programa de creadores»). */
export type FilaCreador = {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  red: RedCreador;
  perfil: string;
  seguidores: string | null;
  mensaje: string | null;
  region: Region;
  idioma: IdiomaWeb;
  estado: EstadoCreador;
  codigo: string | null;
  comision: number | null;
  descuento: number | null;
  token_panel: string | null;
  aprobado_at: string | null;
  notas: string | null;
};

export type EstadoComision = "pendiente" | "pagada" | "anulada";

/** La fila de `comisiones_creadores`. */
export type FilaComision = {
  id: string;
  created_at: string;
  creador_id: string;
  pedido_id: string;
  codigo: string;
  total: number;
  moneda: string;
  porcentaje: number;
  importe: number;
  estado: EstadoComision;
  pagada_at: string | null;
  anulada_at: string | null;
};

/** Lo que el creador lleva en la compra (`compra.creador`), y lo que va a `pedidos.extras.creador`. */
export type CreadorEnLaCompra = { id: string; codigo: string; comision: number; descuento: number };

// ── Las sumas ─────────────────────────────────────────────────────────────

/** Una suma por moneda (un creador de España puede vender en Argentina). */
export type PorMoneda = Record<string, number>;

const sumar = (a: PorMoneda, moneda: string, n: number): PorMoneda => ({ ...a, [moneda]: Math.round(((a[moneda] ?? 0) + Number(n)) * 100) / 100 });

/** Ventas, pendiente y pagado de un creador (las anuladas no cuentan). */
export function resumenDeComisiones(comisiones: Pick<FilaComision, "estado" | "moneda" | "importe">[]): { ventas: number; pendiente: PorMoneda; pagado: PorMoneda } {
  let ventas = 0;
  let pendiente: PorMoneda = {};
  let pagado: PorMoneda = {};
  for (const c of comisiones) {
    if (c.estado === "anulada") continue;
    ventas++;
    if (c.estado === "pendiente") pendiente = sumar(pendiente, c.moneda, c.importe);
    else pagado = sumar(pagado, c.moneda, c.importe);
  }
  return { ventas, pendiente, pagado };
}

// ── El alta (/colabora) ───────────────────────────────────────────────────

export type AltaCreador = {
  idioma: IdiomaWeb;
  nombre: string;
  email: string;
  red: RedCreador;
  perfil: string;
  seguidores: string;
  mensaje: string;
};

export type ErrorAlta = "faltan" | "email" | "perfil" | "condiciones";

const CORTO = 200;
export const MENSAJE_MAXIMO = 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** El campo trampa del formulario: un robot lo llena, una persona no lo ve. */
export const CAMPO_TRAMPA_COLABORA = "sitio";

export function esRobotColabora(cuerpo: unknown): boolean {
  const c = (cuerpo && typeof cuerpo === "object" ? cuerpo : {}) as Record<string, unknown>;
  return typeof c[CAMPO_TRAMPA_COLABORA] === "string" && c[CAMPO_TRAMPA_COLABORA].trim() !== "";
}

/**
 * El cuerpo del formulario de /colabora, limpio. Nombre, correo, red, perfil y
 * la casilla de las condiciones son obligatorios; seguidores y mensaje no.
 */
export function validarAltaCreador(cuerpo: unknown): { ok: true; alta: AltaCreador } | { ok: false; error: ErrorAlta } {
  const c = (cuerpo && typeof cuerpo === "object" ? cuerpo : {}) as Record<string, unknown>;
  const nombre = texto(c.nombre, CORTO);
  const email = texto(c.email, 254).toLowerCase();
  const red = REDES.find((r) => r === c.red);
  const perfil = texto(c.perfil, 300);
  if (!nombre || !email || !red || !perfil) return { ok: false, error: "faltan" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "email" };
  // Un link o un @usuario: lo que no tenga ni un punto ni una arroba no se puede buscar.
  if (!/[.@]/.test(perfil) || /\s/.test(perfil)) return { ok: false, error: "perfil" };
  if (c.condiciones !== true && c.condiciones !== "on") return { ok: false, error: "condiciones" };
  const idioma: IdiomaWeb = c.idioma === "ca" || c.idioma === "ar" ? c.idioma : "es";
  return {
    ok: true,
    alta: { idioma, nombre, email, red, perfil, seguidores: texto(c.seguidores, CORTO), mensaje: texto(c.mensaje, MENSAJE_MAXIMO) },
  };
}
