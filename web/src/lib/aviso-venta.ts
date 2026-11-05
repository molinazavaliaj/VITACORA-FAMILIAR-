// El mail a los socios por cada venta (Naza, 04/11). Solo arma el texto, sin
// red: lo manda confirmarPago, una sola vez por pedido.
//
//   Asunto: Nueva venta · Libro · 89 €
//   Texto:  Compró ana@ejemplo.com. Es un regalo. Pedido 1234.

export type VentaParaAviso = {
  pedidoId: string;
  monto: number | null;
  moneda: string | null;
  email: string | null;
  extras: Record<string, unknown> | undefined;
  /** `narradores.contexto.modo`: Vitácora de una historia es una compra de Familiar con un tema. */
  modo: unknown;
};

/** Qué se vendió. Sin `pdf: true` son copias o marcos sobre un libro que ya existe. */
export function nombreDelProducto(venta: Pick<VentaParaAviso, "extras" | "modo">): string {
  const { extras, modo } = venta;
  if (extras?.tipo === "kids") return "Kids";
  if (extras?.tipo === "viaje") return "Viaje";
  if (modo === "historia") return "Historia";
  // Los pedidos anteriores al 13/09 no traen la clave `pdf` y sí llevan el libro (productosDelPedido).
  if (extras && "pdf" in extras && extras.pdf !== true) return "Extras";
  return "Libro";
}

function formatearMonto(monto: number, moneda: string): string {
  const decimales = Math.round(monto * 100) % 100 !== 0 ? 2 : 0;
  try {
    return new Intl.NumberFormat(moneda === "EUR" ? "es-ES" : "es-AR", {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(monto).replace(/ /g, " ");
  } catch {
    return `${monto} ${moneda}`;
  }
}

export function mailAvisoVenta(venta: VentaParaAviso): { asunto: string; texto: string } {
  const partes = ["Nueva venta", nombreDelProducto(venta)];
  if (venta.monto !== null && Number.isFinite(venta.monto) && venta.moneda) partes.push(formatearMonto(venta.monto, venta.moneda));
  const frases = [
    venta.email ? `Compró ${venta.email}.` : "Compró alguien sin mail anotado.",
    ...(venta.extras?.regalo === true ? ["Es un regalo."] : []),
    `Pedido ${venta.pedidoId}.`,
  ];
  return { asunto: partes.join(" · "), texto: frases.join(" ") };
}
