// El catálogo: base + upsells (spec docs/superpowers/specs/2026-09-22-catalogo-base-y-upsells-design.md,
// decidido el 21/09). El producto es UNO —el libro en PDF con «Su voz»— y
// siempre está en el carrito. Lo demás se suma: el libro impreso (el primero
// paga el adicional; cada copia más, un precio fijo) y los marcos NFC (solo si
// hay impreso, porque viajan juntos; el primero paga la caja, los siguientes
// menos). Envío incluido en todo lo físico. Sin descuentos por cantidad.
//
// Una sola función de precios, `calcularCompra`, sirve para el checkout (con
// base) y para el panel post-venta (sin base: ya la tiene; lo que ya compró
// antes cuenta como "previo" para saber si paga el primero o los siguientes).
//
// El audiolibro salió del catálogo el 21/09 («Su voz» va incluida en el PDF).
// Los pedidos anteriores que lo compraron se siguen leyendo (`productosDelPedido`).
//
// REGLA: una línea sin precio configurado NO EXISTE para el cliente: no se
// muestra ni se cobra. Prender una es cargar su variable en Vercel y re-correr
// el deploy (web/README.md). Lógica pura, sin red, para probarla sin mocks.

import { obtenerPrecio, obtenerPrecioViaje, precioValido, type Region } from "./precios";

export type Moneda = "EUR" | "ARS";

/** Las líneas que pueden aparecer en un ticket. */
export type LineaId = "pdf" | "viaje" | "impreso" | "copia" | "marco" | "marco_adicional";

/**
 * Con qué voz se narraba el audiolibro, en los pedidos que lo compraron antes
 * del 21/09 ("real" = anteriores al 13/09, sus audios tal cual). Ya no se
 * vende; el tipo queda para leer y mostrar esos pedidos (CONTRATO.md).
 */
export type Voz = "clonada" | "narrador" | "real";

export const NOMBRE_VIAJE = "Vitácora de viaje";
export const DETALLE_VIAJE = "Tu biógrafo te escribe cada noche del viaje, guarda tus fotos y, al volver, tu viaje es un libro.";

export const NOMBRE_PDF = "El libro en PDF + Su voz";
export const DETALLE_PDF = "Se lee en la web, capítulo por capítulo, con sus fotos. Incluye «Su voz»: sus mejores frases, en su voz real, para escuchar. Siempre disponible.";

/** ⚠️ Textos a revisar por Naza (21/09). */
export const NOMBRES: Record<Exclude<LineaId, "pdf" | "viaje">, string> = {
  impreso: "El libro impreso",
  copia: "Copia extra del libro impreso",
  marco: "Marco con su voz",
  marco_adicional: "Marco adicional",
};
export const DETALLE_IMPRESO = "Tapa dura, a color, con un código en la contratapa que hace sonar su voz. Envío incluido.";
export const DETALLE_MARCO = "Un marco con su foto y un chip: se acerca el teléfono y suena su voz. Viaja con el libro.";

/** Cómo se nombra la voz de un audiolibro ya comprado (solo pedidos anteriores al 21/09). */
export const NOMBRE_VOZ: Record<Voz, string> = {
  clonada: "con su voz",
  narrador: "con un narrador",
  real: "con sus audios",
};

// ── Precios de las líneas (variables en Vercel) ───────────────────────────

function precioDeEntorno(clave: string, region: Region): number | null {
  return precioValido(process.env[`${clave}_${region === "ES" ? "EUR" : "ARS"}`]);
}

export type Catalogo = {
  moneda: Moneda;
  base: { nombre: string; detalle: string; precio: number };
  viaje: number | null;
  /** El primer impreso (adicional sobre la base) y cada copia más; null = no se vende en la región. */
  impreso: { precio: number; precioCopia: number | null } | null;
  /** El primer marco y cada marco más; null = no se vende. */
  marco: { precio: number; precioAdicional: number | null } | null;
};

/** Todo lo que se puede comprar en una región, con precio. Baja al cliente ya resuelto. */
export function catalogo(region: Region): Catalogo {
  const { monto, moneda } = obtenerPrecio(region);
  const impreso = precioDeEntorno("PRECIO_IMPRESO", region);
  const marco = precioDeEntorno("PRECIO_MARCO", region);
  return {
    moneda,
    base: { nombre: NOMBRE_PDF, detalle: DETALLE_PDF, precio: monto },
    viaje: obtenerPrecioViaje(region),
    impreso: impreso === null ? null : { precio: impreso, precioCopia: precioDeEntorno("PRECIO_COPIA", region) },
    marco: marco === null ? null : { precio: marco, precioAdicional: precioDeEntorno("PRECIO_MARCO_ADICIONAL", region) },
  };
}

// ── El carrito y el ticket ────────────────────────────────────────────────

/**
 * Lo que se está por comprar. `base` es "pdf" (Familiar), "viaje", o null en el
 * panel post-venta (la base ya la tiene). `impresosPrevios` / `marcosPrevios`:
 * lo que ya compró antes, para saber si paga el primero o los siguientes.
 */
export type Carrito = {
  base: "pdf" | "viaje" | null;
  impresos: number;
  marcos: number;
  impresosPrevios?: number;
  marcosPrevios?: number;
};

export const CARRITO_VACIO: Carrito = { base: "pdf", impresos: 0, marcos: 0 };

export type LineaDeCompra = {
  id: LineaId;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

export type Compra = {
  region: Region;
  moneda: Moneda;
  lineas: LineaDeCompra[];
  total: number;
};

const entero = (n: number | undefined) => Math.max(0, Math.floor(n || 0));

/**
 * Arma el ticket. Ignora en silencio lo que no tiene precio en la región
 * (nunca se cobra algo sin precio) y los marcos sin impreso; `validarCarrito`
 * es quien le avisa al cliente.
 */
export function calcularCompra(region: Region, carrito: Carrito): Compra {
  return armarCompra(catalogo(region), region, carrito);
}

/** La misma cuenta, con un catálogo ya resuelto: el navegador la usa para el ticket en vivo. */
export function armarCompra(cat: Catalogo, region: Region, carrito: Carrito): Compra {
  const lineas: LineaDeCompra[] = [];

  if (carrito.base === "pdf") lineas.push({ id: "pdf", nombre: NOMBRE_PDF, cantidad: 1, precioUnitario: cat.base.precio });
  if (carrito.base === "viaje" && cat.viaje !== null) lineas.push({ id: "viaje", nombre: NOMBRE_VIAJE, cantidad: 1, precioUnitario: cat.viaje });

  const impresosPrevios = entero(carrito.impresosPrevios);
  let impresos = entero(carrito.impresos);
  if (impresos > 0 && cat.impreso) {
    if (impresosPrevios === 0) {
      lineas.push({ id: "impreso", nombre: NOMBRES.impreso, cantidad: 1, precioUnitario: cat.impreso.precio });
      impresos -= 1;
    }
    if (impresos > 0 && cat.impreso.precioCopia !== null) {
      lineas.push({ id: "copia", nombre: NOMBRES.copia, cantidad: impresos, precioUnitario: cat.impreso.precioCopia });
    }
  }

  // Los marcos viajan con el libro: solo si hay un impreso (de antes o de ahora).
  const hayImpreso = impresosPrevios > 0 || lineas.some((l) => l.id === "impreso" || l.id === "copia");
  const marcosPrevios = entero(carrito.marcosPrevios);
  let marcos = entero(carrito.marcos);
  if (marcos > 0 && hayImpreso && cat.marco) {
    if (marcosPrevios === 0) {
      lineas.push({ id: "marco", nombre: NOMBRES.marco, cantidad: 1, precioUnitario: cat.marco.precio });
      marcos -= 1;
    }
    if (marcos > 0 && cat.marco.precioAdicional !== null) {
      lineas.push({ id: "marco_adicional", nombre: NOMBRES.marco_adicional, cantidad: marcos, precioUnitario: cat.marco.precioAdicional });
    }
  }

  // Redondeo a centavos: precios con decimales dan flotantes sucios.
  const total = Math.round(lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0) * 100) / 100;
  return { region, moneda: cat.moneda, lineas, total };
}

/** Lo que el cliente pidió tiene que poder cobrarse tal cual; si no, se le dice por qué. */
export function validarCarrito(region: Region, carrito: Carrito): { ok: true } | { ok: false; mensaje: string } {
  const cat = catalogo(region);
  const impresos = entero(carrito.impresos);
  const marcos = entero(carrito.marcos);
  const impresosPrevios = entero(carrito.impresosPrevios);
  if (carrito.base === "viaje" && cat.viaje === null) return { ok: false, mensaje: "La Vitácora de viaje todavía no está disponible en tu región." };
  if (impresos > 0 && !cat.impreso) return { ok: false, mensaje: "El libro impreso todavía no está disponible en tu región." };
  const copiasNuevas = impresosPrevios === 0 ? impresos - 1 : impresos;
  if (copiasNuevas > 0 && cat.impreso?.precioCopia === null) return { ok: false, mensaje: "Las copias extra todavía no están disponibles en tu región." };
  if (marcos > 0 && impresos + impresosPrevios === 0) return { ok: false, mensaje: "Los marcos viajan con el libro impreso: sumá el libro impreso para agregar marcos." };
  if (marcos > 0 && !cat.marco) return { ok: false, mensaje: "Los marcos todavía no están disponibles en tu región." };
  if (carrito.base === null && calcularCompra(region, carrito).lineas.length === 0) return { ok: false, mensaje: "Elegí al menos una cosa." };
  return { ok: true };
}

// ── Lo que va a `pedidos.extras` (CONTRATO.md) ────────────────────────────

export type ProductosDelPedido = {
  pdf: boolean;
  /** Siempre null desde el 21/09 (no se vende). Se conserva porque es CONTRATO con la fábrica y los pedidos viejos lo traen. */
  audiolibro: Voz | null;
  /** "color" desde el 21/09 (siempre a color); "bn" solo en pedidos viejos. */
  impreso: "bn" | "color" | null;
  copias: number;
  marcos: number;
  /** 'viaje' = Vitácora de viaje (CONTRATO, 18/09): la fábrica arma el libro de viaje. Sin clave = biografía. */
  tipo?: "viaje";
};

/** Solo lo que efectivamente entró en la compra. `pdf` = trae la base (PDF o viaje). */
export function productosParaPedido(compra: Compra): ProductosDelPedido {
  const cantidad = (id: LineaId) => compra.lineas.filter((l) => l.id === id).reduce((s, l) => s + l.cantidad, 0);
  const copias = cantidad("impreso") + cantidad("copia");
  const viaje = cantidad("viaje") > 0;
  return {
    pdf: cantidad("pdf") > 0 || viaje,
    audiolibro: null,
    impreso: copias > 0 ? "color" : null,
    copias,
    marcos: cantidad("marco") + cantidad("marco_adicional"),
    ...(viaje ? { tipo: "viaje" as const } : {}),
  };
}

/**
 * Lee `pedidos.extras` de cualquier época. Antes del 13/09 la base era "PDF +
 * audiolibro con sus audios" y `extras` solo traía impreso y marcos: sin la
 * clave `pdf`, se interpreta así. Entre el 13/09 y el 21/09 el audiolibro se
 * vendía aparte con su voz: esos pedidos lo siguen mostrando.
 */
export function productosDelPedido(extras: unknown): ProductosDelPedido {
  const e = (extras && typeof extras === "object" ? extras : {}) as Record<string, unknown>;
  const impreso = e.impreso === "bn" || e.impreso === "color" ? e.impreso : null;
  const marcos = typeof e.marcos === "number" ? Math.max(0, Math.floor(e.marcos)) : 0;
  const copias = typeof e.copias === "number" ? Math.max(0, Math.floor(e.copias)) : impreso ? 1 : 0;
  if (!("pdf" in e)) return { pdf: true, audiolibro: "real", impreso, copias, marcos };
  const voz = e.audiolibro === "clonada" || e.audiolibro === "narrador" || e.audiolibro === "real" ? e.audiolibro : null;
  return { pdf: e.pdf === true, audiolibro: voz, impreso, copias, marcos, ...(e.tipo === "viaje" ? { tipo: "viaje" as const } : {}) };
}
