// El catálogo (docs/panel-usuario.md §15.1, "ricitos de oro"): tres productos
// a la vista —el libro en PDF, el audiolibro, el libro impreso— y AL MENOS UNO
// es obligatorio. Los marcos se suman a cualquiera. Lógica pura, sin red, para
// probarla sin mocks.
//
// REGLA: un producto sin precio configurado NO EXISTE para el cliente. No se
// muestra ni se puede comprar. Así nunca vendemos algo que no tiene precio
// decidido ni proveedor detrás ("nunca prometer lo que no hay", brief §7).
// Prender uno es cargar su variable de entorno en Vercel — nada más.

import { obtenerPrecio, obtenerPrecioAudiolibro, obtenerPrecioViaje, precioValido, type Region } from "./precios";

export type Moneda = "EUR" | "ARS";

export type ExtraId = "impreso_bn" | "impreso_color" | "marco";
export type ProductoId = "pdf" | "audiolibro" | "viaje" | ExtraId;

/** Con qué voz se narra el audiolibro. "real" = pedidos anteriores al 13/09 (sus audios, tal cual). */
export type Voz = "clonada" | "narrador" | "real";

export type Extra = {
  id: ExtraId;
  nombre: string;
  detalle: string;
  precio: number;
  /** Los marcos se compran de a varios (uno por primo); el impreso, uno. */
  multiple: boolean;
};

/** Lo que el cliente elige en el último paso del checkout. */
export type ProductosElegidos = {
  pdf: boolean;
  audiolibro: Voz | null;
  impreso: "bn" | "color" | null;
  marcos: number;
  /** Vitácora de viaje (18/09): producto aparte. Incluye el libro para leer en la web. */
  viaje?: boolean;
};

export const NADA_ELEGIDO: ProductosElegidos = { pdf: false, audiolibro: null, impreso: null, marcos: 0 };
export const NOMBRE_VIAJE = "Vitácora de viaje";
export const DETALLE_VIAJE = "Tu biógrafo te escribe cada noche del viaje, guarda tus fotos y, al volver, tu viaje es un libro.";

export const NOMBRE_PDF = "El libro en PDF";
export const NOMBRE_AUDIOLIBRO = "El audiolibro";
export const DETALLE_PDF = "Se lee en la web, capítulo por capítulo, con sus fotos. Siempre disponible.";
export const DETALLE_AUDIOLIBRO = "La historia completa en primera persona: con su voz, clonada de sus audios reales, o con un narrador. Se escucha en la web.";

export const NOMBRE_VOZ: Record<Voz, string> = {
  clonada: "con su voz",
  narrador: "con un narrador",
  real: "con sus audios",
};

const NOMBRES: Record<ExtraId, { nombre: string; detalle: string; multiple: boolean }> = {
  impreso_bn: {
    nombre: "El libro impreso",
    detalle: "Tapa dura, interior en blanco y negro, con un código en la contratapa que hace sonar su voz.",
    multiple: false,
  },
  impreso_color: {
    nombre: "El libro impreso a color",
    detalle: "Tapa dura, con las fotos de la familia a color.",
    multiple: false,
  },
  marco: {
    nombre: "Marco con su voz",
    detalle: "Un marco con su foto y un chip: se acerca el teléfono y suena su voz. Uno por cada primo, cada tío.",
    multiple: true,
  },
};

function precioDeEntorno(id: ExtraId, region: Region): number | null {
  const clave = `PRECIO_${id.toUpperCase()}_${region === "ES" ? "EUR" : "ARS"}`;
  return precioValido(process.env[clave]);
}

/** Los extras disponibles para una región: solo los que tienen precio cargado. */
export function extrasDisponibles(region: Region): Extra[] {
  const ids: ExtraId[] = ["impreso_bn", "impreso_color", "marco"];
  const lista: Extra[] = [];
  for (const id of ids) {
    const precio = precioDeEntorno(id, region);
    if (precio === null) continue;
    lista.push({ id, ...NOMBRES[id], precio });
  }
  return lista;
}

export type LineaDeCompra = {
  id: ProductoId;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  /** Solo en la línea del audiolibro: con qué voz. */
  voz?: Voz;
};

export type Compra = {
  region: Region;
  moneda: Moneda;
  lineas: LineaDeCompra[];
  total: number;
};

export type Catalogo = {
  moneda: Moneda;
  pdf: { nombre: string; detalle: string; precio: number };
  /** null = sin precio cargado: no se ofrece. */
  audiolibro: { nombre: string; detalle: string; precio: number } | null;
  extras: Extra[];
};

/** Todo lo que se puede comprar en una región, con precio. Baja al cliente ya resuelto. */
export function catalogo(region: Region): Catalogo {
  const { monto, moneda } = obtenerPrecio(region);
  const audio = obtenerPrecioAudiolibro(region);
  return {
    moneda,
    pdf: { nombre: NOMBRE_PDF, detalle: DETALLE_PDF, precio: monto },
    audiolibro: audio === null ? null : { nombre: NOMBRE_AUDIOLIBRO, detalle: DETALLE_AUDIOLIBRO, precio: audio },
    extras: extrasDisponibles(region),
  };
}

/** Ricitos de oro: al menos uno de los tres. Los marcos solos no alcanzan. */
export function validarProductos(region: Region, elegidos: ProductosElegidos): { ok: true } | { ok: false; mensaje: string } {
  const compra = calcularCompra(region, elegidos);
  const principal = compra.lineas.some((l) => l.id !== "marco");
  if (elegidos.viaje && !compra.lineas.some((l) => l.id === "viaje")) return { ok: false, mensaje: "La Vitácora de viaje todavía no está disponible en tu región." };
  return principal ? { ok: true } : { ok: false, mensaje: "Elegí al menos uno: el libro en PDF, el audiolibro o el libro impreso." };
}

/**
 * Arma la compra a partir de lo elegido. Ignora en silencio un producto
 * elegido que no esté disponible en esa región: no puede cobrarse algo sin
 * precio.
 */
export function calcularCompra(region: Region, elegidos: ProductosElegidos): Compra {
  const { monto, moneda } = obtenerPrecio(region);
  const disponibles = new Map(extrasDisponibles(region).map((e) => [e.id, e]));
  const lineas: LineaDeCompra[] = [];

  if (elegidos.pdf) lineas.push({ id: "pdf", nombre: NOMBRE_PDF, cantidad: 1, precioUnitario: monto });

  if (elegidos.viaje) {
    const precio = obtenerPrecioViaje(region);
    if (precio !== null) lineas.push({ id: "viaje", nombre: NOMBRE_VIAJE, cantidad: 1, precioUnitario: precio });
  }

  if (elegidos.audiolibro) {
    const precio = obtenerPrecioAudiolibro(region);
    if (precio !== null) lineas.push({ id: "audiolibro", nombre: `${NOMBRE_AUDIOLIBRO}, ${NOMBRE_VOZ[elegidos.audiolibro]}`, cantidad: 1, precioUnitario: precio, voz: elegidos.audiolibro });
  }

  if (elegidos.impreso) {
    const id: ExtraId = elegidos.impreso === "color" ? "impreso_color" : "impreso_bn";
    const extra = disponibles.get(id);
    if (extra) lineas.push({ id, nombre: extra.nombre, cantidad: 1, precioUnitario: extra.precio });
  }

  const marcos = Math.max(0, Math.floor(elegidos.marcos || 0));
  if (marcos > 0) {
    const extra = disponibles.get("marco");
    if (extra) lineas.push({ id: "marco", nombre: extra.nombre, cantidad: marcos, precioUnitario: extra.precio });
  }

  // Redondeo a centavos: precios con decimales dan flotantes sucios.
  const total = Math.round(lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0) * 100) / 100;

  return { region, moneda, lineas, total };
}

/** Lo que va a `pedidos.extras` (CONTRATO.md). Solo lo que efectivamente entró en la compra. */
export type ProductosDelPedido = {
  pdf: boolean;
  audiolibro: Voz | null;
  impreso: "bn" | "color" | null;
  copias: number;
  marcos: number;
  /** 'viaje' = Vitácora de viaje (CONTRATO, 18/09): la fábrica arma el libro de viaje. Sin clave = biografía. */
  tipo?: "viaje";
};

export function productosParaPedido(compra: Compra): ProductosDelPedido {
  const ids = new Set(compra.lineas.map((l) => l.id));
  const impreso = ids.has("impreso_color") ? "color" : ids.has("impreso_bn") ? "bn" : null;
  const viaje = ids.has("viaje");
  return {
    // La Vitácora de viaje incluye el libro para leer en la web: pdf true, y tipo 'viaje'.
    pdf: ids.has("pdf") || viaje,
    audiolibro: compra.lineas.find((l) => l.id === "audiolibro")?.voz ?? null,
    impreso,
    copias: impreso ? 1 : 0,
    marcos: compra.lineas.find((l) => l.id === "marco")?.cantidad ?? 0,
    ...(viaje ? { tipo: "viaje" as const } : {}),
  };
}

/**
 * Lee `pedidos.extras` de cualquier época. Antes del 13/09 la base era "PDF +
 * audiolibro con sus audios" y `extras` solo traía impreso y marcos: sin la
 * clave `pdf`, se interpreta así.
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

// ── Extras después de la compra (docs/panel-usuario.md §7.3) ───────────
//
// Un pedido sin la base: lo que se suma a un libro que ya existe. Impreso si
// no lo compró, pasar a color, marcos, y copias impresas con descuento por
// cantidad. El descuento es por ahorro de producción, así que vale SOLO para
// las copias pedidas juntas en el mismo pedido: 2 → 10 %, 3 → 15 %, 4 o más
// → 20 %, sobre las copias. El primo que compra la suya aparte paga lleno.

export type ExtrasPosteriores = {
  /** El PDF o el audiolibro, si no los compró al principio (13/09). A precio lleno. */
  pdf?: boolean;
  audiolibro?: Voz | null;
  /** Cuántos libros impresos van en este pedido (0 = ninguno). */
  copias: number;
  /** Blanco y negro o color, para todas las copias del pedido. */
  acabado: "bn" | "color";
  marcos: number;
};

export function descuentoPorCopias(copias: number): number {
  if (copias >= 4) return 0.2;
  if (copias === 3) return 0.15;
  if (copias === 2) return 0.1;
  return 0;
}

export function calcularExtras(region: Region, elegidos: ExtrasPosteriores): Compra {
  const { monto, moneda } = obtenerPrecio(region);
  const disponibles = new Map(extrasDisponibles(region).map((e) => [e.id, e]));
  const lineas: LineaDeCompra[] = [];

  if (elegidos.pdf) lineas.push({ id: "pdf", nombre: NOMBRE_PDF, cantidad: 1, precioUnitario: monto });

  if (elegidos.audiolibro) {
    const precio = obtenerPrecioAudiolibro(region);
    if (precio !== null) lineas.push({ id: "audiolibro", nombre: `${NOMBRE_AUDIOLIBRO}, ${NOMBRE_VOZ[elegidos.audiolibro]}`, cantidad: 1, precioUnitario: precio, voz: elegidos.audiolibro });
  }

  const copias = Math.max(0, Math.floor(elegidos.copias || 0));
  if (copias > 0) {
    const id: ExtraId = elegidos.acabado === "color" ? "impreso_color" : "impreso_bn";
    const extra = disponibles.get(id);
    if (extra) {
      const descuento = descuentoPorCopias(copias);
      const unitario = Math.round(extra.precio * (1 - descuento) * 100) / 100;
      const nombre = descuento > 0 ? `${extra.nombre} (−${Math.round(descuento * 100)} % por ${copias} copias)` : extra.nombre;
      lineas.push({ id, nombre, cantidad: copias, precioUnitario: unitario });
    }
  }

  const marcos = Math.max(0, Math.floor(elegidos.marcos || 0));
  if (marcos > 0) {
    const extra = disponibles.get("marco");
    if (extra) lineas.push({ id: "marco", nombre: extra.nombre, cantidad: marcos, precioUnitario: extra.precio });
  }

  const total = Math.round(lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0) * 100) / 100;
  return { region, moneda, lineas, total };
}

/** Lo que va a `pedidos.extras` en un pedido posterior. */
export function extrasPosterioresParaPedido(compra: Compra): ProductosDelPedido {
  const impreso = compra.lineas.find((l) => l.id === "impreso_color" || l.id === "impreso_bn");
  const ids = new Set(compra.lineas.map((l) => l.id));
  return {
    pdf: ids.has("pdf"),
    audiolibro: compra.lineas.find((l) => l.id === "audiolibro")?.voz ?? null,
    impreso: impreso ? (impreso.id === "impreso_color" ? "color" : "bn") : null,
    copias: impreso?.cantidad ?? 0,
    marcos: compra.lineas.find((l) => l.id === "marco")?.cantidad ?? 0,
  };
}
