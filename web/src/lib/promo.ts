import type { Moneda } from "./productos";

// Promociones (8.7, 21/09): UN porcentaje global, `PROMO_PORCENTAJE` en Vercel.
// Lo que se cobra es siempre el precio real cargado (PRECIO_*); la promo solo
// agrega, en las pantallas, el precio de lista tachado y el "-N %". Sin la
// variable no hay promo y nada cambia. Prender o apagar = cargar o borrar la
// variable (y re-correr el deploy, ver web/README.md).

/** El porcentaje de la promo (entero entre 1 y 90), o null si no hay promo. */
export function promoPorcentaje(): number | null {
  const crudo = process.env.PROMO_PORCENTAJE;
  if (!crudo || !/^\d{1,2}$/.test(crudo.trim())) return null;
  const n = Number(crudo.trim());
  return n >= 1 && n <= 90 ? n : null;
}

/**
 * El precio de lista "desde el que se descuenta", redondeado para que se lea
 * como un precio y no como una cuenta: pesos a los 50, euros al entero.
 * Siempre mayor que el final.
 */
export function precioDeLista(precioFinal: number, moneda: Moneda, porcentaje: number): number {
  const crudo = precioFinal / (1 - porcentaje / 100);
  const paso = moneda === "ARS" ? 50 : 1;
  const lista = Math.round(crudo / paso) * paso;
  return lista > precioFinal ? lista : precioFinal + paso;
}
