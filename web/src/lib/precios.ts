// Fuente única del precio por región. pagos.ts (lo que se cobra),
// api/checkout (lo que se guarda en el pedido) y /comprar (lo que se
// muestra) tienen que leer todos de acá — si cada uno tuviera su propio
// default, el precio mostrado y el cobrado podrían divergir en silencio.

export type Region = "ES" | "AR";

export function obtenerPrecio(region: Region): { monto: number; moneda: "EUR" | "ARS" } {
  if (region === "ES") {
    return { monto: Number(process.env.PRECIO_EUR || "49"), moneda: "EUR" };
  }
  return { monto: Number(process.env.PRECIO_ARS || "49999"), moneda: "ARS" };
}

/**
 * El audiolibro por separado (13/09). Sin precio cargado no existe para el
 * cliente — misma regla que los extras: nunca se vende lo que no tiene precio.
 */
export function obtenerPrecioAudiolibro(region: Region): number | null {
  const crudo = process.env[region === "ES" ? "PRECIO_AUDIOLIBRO_EUR" : "PRECIO_AUDIOLIBRO_ARS"];
  if (!crudo) return null;
  const monto = Number(crudo);
  return Number.isFinite(monto) && monto > 0 ? monto : null;
}

/**
 * Vitácora de viaje (18/09): producto aparte, precio propio. Sin precio cargado
 * no existe para el cliente, como los demás.
 */
export function obtenerPrecioViaje(region: Region): number | null {
  const crudo = process.env[region === "ES" ? "PRECIO_VIAJE_EUR" : "PRECIO_VIAJE_ARS"];
  if (!crudo) return null;
  const monto = Number(crudo);
  return Number.isFinite(monto) && monto > 0 ? monto : null;
}
