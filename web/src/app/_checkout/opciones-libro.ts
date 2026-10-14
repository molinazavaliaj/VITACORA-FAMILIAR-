import type { Catalogo } from "@/lib/productos";

// Las tres opciones del paso «¿Cómo quieres su libro?» (Naza 14/10): digital,
// impreso + digital, e impreso + digital + su foto enmarcada. Una sola elegida
// a la vez. Por dentro el estado sigue siendo el de siempre (`formato` y
// `marcos`, que arman el carrito `{ base, impresos, marcos }`): la opción se
// lee de ahí y elegir una solo cambia esos dos campos. Así lo guardado antes
// de ir a pagar (volver de un pago fallido, «retomar») sigue sirviendo tal cual.
// Lo usan /comprar y /comprar/viaje: los dos estados tienen los mismos campos.

export type OpcionLibro = "digital" | "impreso" | "marco";

type ConLibro = { formato: "digital" | "impreso"; marcos: number };

/** Las opciones que existen en la región: el impreso si tiene precio; el marco, solo con impreso y con precio. */
export function opcionesDeLibro(cat: Pick<Catalogo, "impreso" | "marco">): OpcionLibro[] {
  if (!cat.impreso) return ["digital"];
  return cat.marco ? ["digital", "impreso", "marco"] : ["digital", "impreso"];
}

/** Cuál está elegida, según el estado. */
export function opcionDe(e: ConLibro): OpcionLibro {
  if (e.formato === "digital") return "digital";
  return e.marcos > 0 ? "marco" : "impreso";
}

/** Lo que cambia al elegir una: digital sin nada, impreso sin marco, o impreso con (al menos) un marco. */
export function eleccionDe(opcion: OpcionLibro, e: ConLibro): ConLibro {
  if (opcion === "digital") return { formato: "digital", marcos: 0 };
  if (opcion === "impreso") return { formato: "impreso", marcos: 0 };
  return { formato: "impreso", marcos: Math.max(1, e.marcos) };
}

/** El precio de cada opción, sumado del catálogo (el mismo que cobra el servidor para una unidad de cada cosa). */
export function precioDeOpcion(opcion: OpcionLibro, base: number, cat: Pick<Catalogo, "impreso" | "marco">): number | null {
  if (opcion === "digital") return base;
  if (!cat.impreso) return null;
  if (opcion === "impreso") return base + cat.impreso.precio;
  return cat.marco ? base + cat.impreso.precio + cat.marco.precio : null;
}
