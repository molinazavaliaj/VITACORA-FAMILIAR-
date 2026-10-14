import type { Catalogo } from "@/lib/productos";

// Las tres opciones del paso «¿Cómo quieres su libro?» (Naza 14/10): impreso +
// digital + su foto enmarcada (arranca elegida), impreso + digital, y digital.
// Una sola elegida a la vez. Por dentro el carrito sigue siendo el de siempre (`formato` y
// `marcos` arman `{ base, impresos, marcos }`); `opcion` solo recuerda cuál
// eligió, porque con marcos para regalar el carrito de la 2 y el de la 3 pueden
// ser iguales (impreso + 2 marcos = la 2 con dos marcos o la 3 con uno más).
// Lo guardado antes de ir a pagar (volver de un pago fallido, «retomar») trae
// los tres campos; si viene de antes, sin `opcion`, la opción se deduce.
// Lo usan /comprar y /comprar/viaje: los dos estados tienen los mismos campos.
//
// Los marcos para regalar (Naza 14/10, 2.ª vuelta): con la 2 y la 3 hay un
// contador de marcos con foto. En la 2 cuenta todos los marcos (el primero a
// `marco.precio`, los demás a `marco.precioAdicional`); en la 3 el primero ya
// va en la opción y el contador suma solo los demás. Siempre la misma cuenta
// que `armarCompra`: sin precio adicional, el servidor no cobra (ni manda) un
// segundo marco, así que el contador no deja pedirlo.

export type OpcionLibro = "digital" | "impreso" | "marco";

type ConLibro = { formato: "digital" | "impreso"; marcos: number; opcion?: OpcionLibro };

/**
 * Las opciones que existen en la región, en el orden en que se muestran
 * (Naza 14/10): primero el libro completo con el marco, que es lo que más se
 * quiere vender; después el impreso; al final el digital. El impreso existe si
 * tiene precio; el marco, solo con impreso y con precio.
 */
export function opcionesDeLibro(cat: Pick<Catalogo, "impreso" | "marco">): OpcionLibro[] {
  if (!cat.impreso) return ["digital"];
  return cat.marco ? ["marco", "impreso", "digital"] : ["impreso", "digital"];
}

/** Con qué arranca el paso 1: la primera opción que exista (el libro completo, si no el impreso, si no el digital). */
export function eleccionInicial(cat: Pick<Catalogo, "impreso" | "marco">): Required<ConLibro> {
  const primera = opcionesDeLibro(cat)[0];
  if (primera === "marco") return { formato: "impreso", marcos: 1, opcion: "marco" };
  if (primera === "impreso") return { formato: "impreso", marcos: 0, opcion: "impreso" };
  return { formato: "digital", marcos: 0, opcion: "digital" };
}

/** Cuál está elegida, según el estado. */
export function opcionDe(e: ConLibro): OpcionLibro {
  if (e.formato === "digital") return "digital";
  if (e.opcion === "impreso") return "impreso";
  if (e.opcion === "marco") return e.marcos > 0 ? "marco" : "impreso";
  return e.marcos > 0 ? "marco" : "impreso";
}

/**
 * Lo que cambia al elegir una. Los marcos para regalar que ya había se
 * conservan al pasar de la 2 a la 3 y al revés; con digital no hay marcos.
 */
export function eleccionDe(opcion: OpcionLibro, e: ConLibro): Required<ConLibro> {
  const actual = opcionDe(e);
  if (opcion === actual) return { formato: e.formato, marcos: e.marcos, opcion };
  if (opcion === "digital") return { formato: "digital", marcos: 0, opcion };
  const extras = marcosParaRegalar(e);
  return { formato: "impreso", marcos: opcion === "marco" ? extras + 1 : extras, opcion };
}

/** Los marcos del contador: todos en la 2; en la 3, los que van además del incluido. */
export function marcosParaRegalar(e: ConLibro): number {
  const o = opcionDe(e);
  if (o === "digital") return 0;
  return o === "marco" ? Math.max(0, e.marcos - 1) : Math.max(0, e.marcos);
}

/** El estado con `n` marcos para regalar, en la opción elegida. */
export function conMarcosParaRegalar(e: ConLibro, n: number): Required<ConLibro> {
  const o = opcionDe(e);
  const m = Math.max(0, Math.floor(n));
  return { formato: e.formato, marcos: o === "marco" ? m + 1 : o === "impreso" ? m : 0, opcion: o };
}

/**
 * El contador de marcos para regalar: si se muestra, hasta cuántos y qué
 * cuestan (calculado del catálogo, como `armarCompra`). null = no va.
 * `primero` es el precio del primero del contador y `demas` el de los
 * siguientes (iguales en la 3, donde el primero ya va en la opción).
 */
export function contadorDeMarcos(
  opcion: OpcionLibro,
  cat: Pick<Catalogo, "marco">,
): { primero: number; demas: number | null; max: number } | null {
  if (opcion === "digital" || !cat.marco) return null;
  const adicional = cat.marco.precioAdicional;
  if (opcion === "impreso") return { primero: cat.marco.precio, demas: adicional, max: adicional === null ? 1 : 19 };
  if (adicional === null) return null;
  return { primero: adicional, demas: adicional, max: 19 };
}

/** El precio de cada opción, sumado del catálogo (el mismo que cobra el servidor para una unidad de cada cosa). */
export function precioDeOpcion(opcion: OpcionLibro, base: number, cat: Pick<Catalogo, "impreso" | "marco">): number | null {
  if (opcion === "digital") return base;
  if (!cat.impreso) return null;
  if (opcion === "impreso") return base + cat.impreso.precio;
  return cat.marco ? base + cat.impreso.precio + cat.marco.precio : null;
}
