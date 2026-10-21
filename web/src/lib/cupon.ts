import { randomInt } from "node:crypto";
import type { Catalogo, Compra, LineaDeCompra } from "./productos";
import type { Region } from "./precios";
import { lineaCreadorPasarela } from "@/app/_textos/colabora";

// El cupón de bienvenida del rasca y gana (20/10; reglas en
// docs/rediseno-2026-10/fase-5/textos-legales-nuevos.md tandas 1, 2 y 3 y
// respuesta-19-10.md §1). Lógica pura, sin red, para probarla sin mocks; lo que
// toca la base vive en ./cupon-base.ts.
//
// Las reglas, en corto:
//   - 10 % del libro digital (el precio del PDF de la región), también cuando
//     va dentro del pack. Nunca del impreso, las copias ni los marcos.
//   - Un código por correo y por país, de un solo uso, que vale solo en la web
//     del país donde se pidió.
//   - Vale 30 días desde que llega (desde que se confirma el correo); el último
//     día también vale, en la fecha del país.
//   - No se suma a otros cupones ni a precios ya rebajados: con la promo global
//     (PROMO_PORCENTAJE) prendida, no se aplica.
//   - El premio es igual para todos: el rasca es solo visual (no hay azar, no es juego).
//
// Todo apagado hasta que Naza prenda RASCA_Y_GANA=1 en Vercel (con la migración
// 20261020000000 aplicada y los textos aprobados).

export const PORCENTAJE_CUPON = 10;
export const DIAS_DE_VIGENCIA = 30;
/** Los días (desde la confirmación) en que sale cada uno de los 4 recordatorios: todos dentro de los 14. */
export const DIAS_RECORDATORIOS = [2, 5, 9, 13] as const;
export const DIAS_VENTANA_RECORDATORIOS = 14;

/** ¿Está prendido el rasca y gana? Sin la variable, ni popup ni campo en el checkout ni recordatorios. */
export function rascaPrendido(): boolean {
  return process.env.RASCA_Y_GANA?.trim() === "1";
}

// ── El código ──────────────────────────────────────────────────────────────

const PREFIJO = "VITACORA10-";
// Sin 0/O, 1/I/L: se dictan y se copian a mano.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LARGO = 6;
const CODIGO_RE = new RegExp(`^${PREFIJO}[${ALFABETO}]{${LARGO}}$`);

export function generarCodigoCupon(azar: (max: number) => number = randomInt): string {
  let cola = "";
  for (let i = 0; i < LARGO; i++) cola += ALFABETO[azar(ALFABETO.length)];
  return `${PREFIJO}${cola}`;
}

/**
 * Lo que escribió la persona, como se guarda: mayúsculas, sin espacios, con el
 * guion aunque lo haya olvidado. null si no tiene forma de código.
 */
export function normalizarCodigo(crudo: unknown): string | null {
  if (typeof crudo !== "string") return null;
  const limpio = crudo.toUpperCase().replace(/[\s_]/g, "").replace(/^VITACORA10(?!-)/, PREFIJO);
  return CODIGO_RE.test(limpio) ? limpio : null;
}

// ── Las fechas, en el calendario del país ─────────────────────────────────

const ZONA: Record<Region, string> = { ES: "Europe/Madrid", AR: "America/Argentina/Buenos_Aires" };

/** La fecha de hoy (AAAA-MM-DD) en el país. */
export function hoyEn(region: Region, ahora: Date): string {
  // en-CA da AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA[region], year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

/** El último día que vale (inclusive): el día de la confirmación, en el país, más 30. */
export function venceEl(region: Region, confirmado: Date): string {
  const [a, m, d] = hoyEn(region, confirmado).split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d + DIAS_DE_VIGENCIA));
  return fecha.toISOString().slice(0, 10);
}

/** ¿Sigue valiendo hoy? El último día también vale. */
export function vigente(venceElFecha: string, region: Region, ahora: Date): boolean {
  return hoyEn(region, ahora) <= venceElFecha;
}

// ── ¿Se puede usar? ───────────────────────────────────────────────────────

/** La fila de `cupones` que hace falta para decidir (supabase/CONTRATO.md). */
export type FilaCupon = {
  id: string;
  codigo: string;
  email: string;
  region: Region;
  idioma: "es" | "ca" | "ar";
  porcentaje: number;
  acepta_recordatorios: boolean;
  created_at: string;
  confirmado_at: string | null;
  vence_el: string | null;
  recordatorios_enviados: number;
  ultimo_recordatorio_at: string | null;
  baja_at: string | null;
  usado_at: string | null;
};

export type MotivoRechazo = "no_existe" | "sin_confirmar" | "vencido" | "usado" | "otra_region" | "no_aplica" | "con_promo";

export type ValidacionCupon = { ok: true; codigo: string; porcentaje: number } | { ok: false; motivo: MotivoRechazo };

/** El cupón vale para esta compra (sin mirar qué se compra: eso lo dice `aplicarCupon`). */
export function validarCupon(fila: FilaCupon | null, region: Region, ahora: Date, promo: number | null): ValidacionCupon {
  if (!fila) return { ok: false, motivo: "no_existe" };
  if (fila.region !== region) return { ok: false, motivo: "otra_region" };
  if (!fila.confirmado_at || !fila.vence_el) return { ok: false, motivo: "sin_confirmar" };
  if (fila.usado_at) return { ok: false, motivo: "usado" };
  if (!vigente(fila.vence_el, region, ahora)) return { ok: false, motivo: "vencido" };
  // «No se suma a otros cupones ni a precios ya rebajados» (bases, arreglo del #17).
  if (promo !== null) return { ok: false, motivo: "con_promo" };
  return { ok: true, codigo: fila.codigo, porcentaje: fila.porcentaje };
}

// ── La cuenta ─────────────────────────────────────────────────────────────

/** El descuento sobre el libro digital de la región: euros a los céntimos, pesos al entero. */
export function importeDelCupon(cat: Pick<Catalogo, "base" | "moneda">, porcentaje: number): number {
  const crudo = (cat.base.precio * porcentaje) / 100;
  return cat.moneda === "ARS" ? Math.round(crudo) : Math.round(crudo * 100) / 100;
}

/** La línea de la compra que lleva el libro digital: el PDF suelto o el pack. */
const lineaDigital = (lineas: LineaDeCompra[]) => lineas.find((l) => (l.id === "pdf" || l.id === "pack") && l.cantidad === 1);

/**
 * La compra con el cupón aplicado, o null si no lleva el libro digital (un
 * viaje, un pedido de extras desde el panel): ahí el cupón no aplica.
 */
export function aplicarCupon(compra: Compra, cat: Pick<Catalogo, "base" | "moneda">, cupon: { codigo: string; porcentaje: number }): Compra | null {
  const linea = lineaDigital(compra.lineas);
  if (!linea) return null;
  const importe = Math.min(importeDelCupon(cat, cupon.porcentaje), linea.precioUnitario);
  if (!(importe > 0)) return null;
  const total = Math.round((compra.total - importe) * 100) / 100;
  return { ...compra, total, descuento: { codigo: cupon.codigo, porcentaje: cupon.porcentaje, importe } };
}

/** El nombre de la línea con el cupón en las pasarelas (Stripe y Mercado Pago la muestran). */
export const LINEA_CUPON_PASARELA = "Cupón de bienvenida · 10 % del libro digital";

/**
 * Las líneas que van a la pasarela: las de siempre, con el descuento restado
 * de la línea del libro digital (las pasarelas no aceptan líneas negativas).
 * La suma da exactamente `compra.total`.
 */
export function lineasParaCobrar(compra: Compra): LineaDeCompra[] {
  if (!compra.descuento) return compra.lineas;
  const digital = lineaDigital(compra.lineas);
  if (!digital) throw new Error("Una compra con cupón tiene que llevar el libro digital.");
  const { importe } = compra.descuento;
  // El código de un creador dice su código y su %, no «Cupón de bienvenida».
  const etiqueta = compra.creador ? lineaCreadorPasarela(compra.descuento.codigo, compra.descuento.porcentaje) : LINEA_CUPON_PASARELA;
  return compra.lineas.map((l) =>
    l === digital ? { ...l, nombre: `${l.nombre} (${etiqueta})`, precioUnitario: Math.round((l.precioUnitario - importe) * 100) / 100 } : l,
  );
}

// ── Los recordatorios ─────────────────────────────────────────────────────

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Qué recordatorio le toca hoy (1 a 4), o null. Solo a quien confirmó y aceptó
 * los recordatorios, sin baja, sin usar el cupón y sin vencer; dentro de los 14
 * días; uno por vez (aunque el cron se haya salteado días, nunca dos juntos) y
 * nunca más de 4.
 */
export function recordatorioQueToca(fila: FilaCupon, ahora: Date): 1 | 2 | 3 | 4 | null {
  if (!fila.acepta_recordatorios || !fila.confirmado_at || !fila.vence_el || fila.baja_at || fila.usado_at) return null;
  if (!vigente(fila.vence_el, fila.region, ahora)) return null;
  const enviados = fila.recordatorios_enviados;
  if (enviados >= DIAS_RECORDATORIOS.length) return null;
  const desde = ahora.getTime() - new Date(fila.confirmado_at).getTime();
  if (desde > DIAS_VENTANA_RECORDATORIOS * DIA_MS) return null;
  if (desde < DIAS_RECORDATORIOS[enviados] * DIA_MS) return null;
  // Entre dos recordatorios, al menos un día (si el cron atrasado los junta).
  if (fila.ultimo_recordatorio_at && ahora.getTime() - new Date(fila.ultimo_recordatorio_at).getTime() < DIA_MS - 60 * 60 * 1000) return null;
  return (enviados + 1) as 1 | 2 | 3 | 4;
}
