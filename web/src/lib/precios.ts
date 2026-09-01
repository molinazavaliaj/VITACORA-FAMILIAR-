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
