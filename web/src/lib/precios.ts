// Fuente única del precio por región. pagos.ts (lo que se cobra),
// api/checkout (lo que se guarda en el pedido) y /comprar (lo que se
// muestra) tienen que leer todos de acá — si cada uno tuviera su propio
// default, el precio mostrado y el cobrado podrían divergir en silencio.
//
// REGLA (21/09): un precio que no se puede leer del entorno es como si no
// estuviera cargado. `Number('"49"')` y `Number('49,00')` dan NaN, y el
// catálogo llegó a producción con `$NaN` en las dos regiones; como el PDF es
// obligatorio, un typo en Vercel tumbaba el checkout entero. La validación
// vive acá, en la fuente, y no en cada pantalla.
//
// OJO, trampa que NINGUNA validación puede cazar: si alguien carga el precio
// con separador de miles de punto, `Number('85.750')` da 85,75 — un número
// válido, y la tienda vendería a la milésima parte sin un solo error en los
// logs. Los precios van SIN separadores: 85.750 se carga 85750.

export type Region = "ES" | "AR";

/**
 * Un precio válido es un número finito y mayor que cero. Todo lo demás no es un
 * precio: sin valor, con comillas, con coma (decimal o de miles), con símbolo,
 * con texto, cero, negativo o infinito (`docs/panel-usuario.md` §15.1: nunca se
 * vende lo que no tiene precio).
 */
export function precioValido(crudo: string | undefined | null): number | null {
  if (!crudo) return null;
  const monto = Number(crudo);
  return Number.isFinite(monto) && monto > 0 ? monto : null;
}

/**
 * El precio de la casa: lo que vale el PDF cuando su variable no está cargada.
 * Decisión de los socios del 12/09 (`docs/GASTOS.md`, la tabla de verdad, y
 * `docs/panel-usuario.md` §15.1). No bajarlo: el default de AR era ARS 49.999
 * contra un precio de la casa de ARS 85.750, así que una PRECIO_ARS rota vendía
 * el PDF al 58 % sin que nadie se enterara. Un subprecio silencioso es peor que
 * un error visible.
 */
const PRECIO_DE_LA_CASA: Record<Region, { monto: number; moneda: "EUR" | "ARS" }> = {
  ES: { monto: 49, moneda: "EUR" },
  AR: { monto: 85750, moneda: "ARS" },
};

/**
 * El PDF: es obligatorio, o sea que SIEMPRE tiene precio. Si la variable no está
 * cargada vale el precio de la casa — y si está mal escrita, lo mismo, con un
 * aviso en los logs: un precio mal cargado no puede pasar en silencio ni mostrar
 * `$NaN`. La regla de las hermanas (viaje, extras) es "sin precio configurado no
 * existe"; acá esa salida no sirve: sin PDF no hay nada que comprar, así que un
 * typo dejaría la tienda vacía.
 */
export function obtenerPrecio(region: Region): { monto: number; moneda: "EUR" | "ARS" } {
  const porDefecto = PRECIO_DE_LA_CASA[region];
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
 * Vitácora de viaje (18/09): producto aparte, precio propio. Sin precio válido
 * no existe para el cliente, como los demás.
 */
export function obtenerPrecioViaje(region: Region): number | null {
  return precioValido(process.env[region === "ES" ? "PRECIO_VIAJE_EUR" : "PRECIO_VIAJE_ARS"]);
}

/**
 * Vitácora Kids — «Mi Primer Capítulo» (22/09, `docs/kids/mi-primer-capitulo-design.md`):
 * línea aparte, precio propio. Misma regla de las hermanas: sin precio válido el producto
 * no existe para el cliente, y la landing muestra «Próximamente» en vez de un CTA a la nada.
 * No cargar estas variables hasta que exista /comprar/kids.
 */
export function obtenerPrecioKids(region: Region): number | null {
  return precioValido(process.env[region === "ES" ? "PRECIO_KIDS_EUR" : "PRECIO_KIDS_ARS"]);
}
