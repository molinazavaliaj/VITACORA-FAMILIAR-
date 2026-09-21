// Fuente única del precio por región. pagos.ts (lo que se cobra),
// api/checkout (lo que se guarda en el pedido) y /comprar (lo que se
// muestra) tienen que leer todos de acá — si cada uno tuviera su propio
// default, el precio mostrado y el cobrado podrían divergir en silencio.
//
// REGLA (21/09): un precio que no se puede leer del entorno es como si no
// estuviera cargado. `Number('"49"')` y `Number('49,00')` dan NaN, y el
// catálogo llegó a producción con `$NaN` en las dos regiones; como el PDF es
// obligatorio, un typo en Vercel tumbaba el checkout entero. Se valida acá, en
// la fuente, y no en cada pantalla.

export type Region = "ES" | "AR";

/**
 * Un precio válido es un número finito y mayor que cero. Todo lo demás no es un
 * precio: sin valor, con comillas, con coma decimal, con símbolo, cero,
 * negativo o infinito (`docs/panel-usuario.md` §15.1: nunca se vende lo que no
 * tiene precio).
 */
export function precioValido(crudo: string | undefined | null): number | null {
  if (!crudo) return null;
  const monto = Number(crudo);
  return Number.isFinite(monto) && monto > 0 ? monto : null;
}

/** El precio de la casa por región: el que vale si la variable no está cargada. */
const PRECIO_POR_DEFECTO: Record<Region, { monto: number; moneda: "EUR" | "ARS" }> = {
  ES: { monto: 49, moneda: "EUR" },
  AR: { monto: 49999, moneda: "ARS" },
};

/**
 * El PDF: es obligatorio, o sea que SIEMPRE tiene precio. Si la variable no está
 * cargada vale el default de la casa — y si está mal escrita, lo mismo, con un
 * aviso en los logs: un precio mal cargado no puede pasar en silencio ni
 * mostrar `$NaN` (la regla de las hermanas es "sin precio configurado no
 * existe"; acá esa salida no sirve: sin PDF no hay nada que comprar).
 */
export function obtenerPrecio(region: Region): { monto: number; moneda: "EUR" | "ARS" } {
  const porDefecto = PRECIO_POR_DEFECTO[region];
  const clave = region === "ES" ? "PRECIO_EUR" : "PRECIO_ARS";
  const crudo = process.env[clave];
  const monto = precioValido(crudo);
  if (monto !== null) return { monto, moneda: porDefecto.moneda };
  if (crudo) {
    console.warn(`[precios] ${clave}="${crudo}" no es un precio válido: la tienda usa ${porDefecto.monto} ${porDefecto.moneda}.`);
  }
  return { ...porDefecto };
}

/**
 * El audiolibro por separado (13/09). Sin precio cargado no existe para el
 * cliente — misma regla que los extras: nunca se vende lo que no tiene precio.
 */
export function obtenerPrecioAudiolibro(region: Region): number | null {
  return precioValido(process.env[region === "ES" ? "PRECIO_AUDIOLIBRO_EUR" : "PRECIO_AUDIOLIBRO_ARS"]);
}

/**
 * Vitácora de viaje (18/09): producto aparte, precio propio. Sin precio cargado
 * no existe para el cliente, como los demás.
 */
export function obtenerPrecioViaje(region: Region): number | null {
  return precioValido(process.env[region === "ES" ? "PRECIO_VIAJE_EUR" : "PRECIO_VIAJE_ARS"]);
}
