// El catálogo: la base (PDF + audiolibro) y los extras que se pueden sumar en
// el checkout. Lógica pura, sin red, para probarla sin mocks.
//
// REGLA: un extra sin precio configurado NO EXISTE para el cliente. No se
// muestra ni se puede comprar. Así nunca vendemos algo que no tiene precio
// decidido ni proveedor detrás ("nunca prometer lo que no hay", brief §7).
// Prender un extra es cargar su variable de entorno en Vercel — nada más.

import { obtenerPrecio, type Region } from "./precios";

export type Moneda = "EUR" | "ARS";

export type ExtraId = "impreso_bn" | "impreso_color" | "marco";

export type Extra = {
  id: ExtraId;
  nombre: string;
  detalle: string;
  precio: number;
  /** Los marcos se compran de a varios (uno por primo); el impreso, uno. */
  multiple: boolean;
};

/** Lo que el cliente eligió en el paso "Extras" del checkout. */
export type ExtrasElegidos = {
  impreso: "bn" | "color" | null;
  marcos: number;
};

export const EXTRAS_VACIOS: ExtrasElegidos = { impreso: null, marcos: 0 };

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
  const crudo = process.env[clave];
  if (!crudo) return null;
  const monto = Number(crudo);
  return Number.isFinite(monto) && monto > 0 ? monto : null;
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
  id: "base" | ExtraId;
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

export const NOMBRE_BASE = "El libro y el audiolibro de su vida";

/**
 * Arma la compra a partir de lo elegido. Ignora en silencio un extra elegido
 * que no esté disponible en esa región: no puede cobrarse algo sin precio.
 */
export function calcularCompra(region: Region, elegidos: ExtrasElegidos): Compra {
  const { monto, moneda } = obtenerPrecio(region);
  const disponibles = new Map(extrasDisponibles(region).map((e) => [e.id, e]));

  const lineas: LineaDeCompra[] = [
    { id: "base", nombre: NOMBRE_BASE, cantidad: 1, precioUnitario: monto },
  ];

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

/** Lo que va a `pedidos.extras`: solo lo que efectivamente entró en la compra. */
export function extrasParaPedido(compra: Compra): { impreso: "bn" | "color" | null; marcos: number } {
  const ids = new Set(compra.lineas.map((l) => l.id));
  const marcos = compra.lineas.find((l) => l.id === "marco")?.cantidad ?? 0;
  return {
    impreso: ids.has("impreso_color") ? "color" : ids.has("impreso_bn") ? "bn" : null,
    marcos,
  };
}

// ── Extras después de la compra (docs/panel-usuario.md §7.3) ───────────
//
// Un pedido sin la base: lo que se suma a un libro que ya existe. Impreso si
// no lo compró, pasar a color, marcos, y copias impresas con descuento por
// cantidad. El descuento es por ahorro de producción, así que vale SOLO para
// las copias pedidas juntas en el mismo pedido: 2 → 10 %, 3 → 15 %, 4 o más
// → 20 %, sobre las copias. El primo que compra la suya aparte paga lleno.

export type ExtrasPosteriores = {
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
  const { moneda } = obtenerPrecio(region);
  const disponibles = new Map(extrasDisponibles(region).map((e) => [e.id, e]));
  const lineas: LineaDeCompra[] = [];

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

/** Lo que va a `pedidos.extras` en un pedido posterior. `copias` es nuevo (12/09), aditivo. */
export function extrasPosterioresParaPedido(compra: Compra): { impreso: "bn" | "color" | null; marcos: number; copias: number } {
  const impreso = compra.lineas.find((l) => l.id === "impreso_color" || l.id === "impreso_bn");
  return {
    impreso: impreso ? (impreso.id === "impreso_color" ? "color" : "bn") : null,
    copias: impreso?.cantidad ?? 0,
    marcos: compra.lineas.find((l) => l.id === "marco")?.cantidad ?? 0,
  };
}
