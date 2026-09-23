// Cuánto pesa y cuánto mide el paquete que viaja (3t.26 fase 2).
//
// Cualquier agregador de correos pide estos dos datos para cotizar y para emitir
// la etiqueta. Y como el envío va **incluido en el precio** (decisión 9 del spec),
// equivocarse acá no se lo come el cliente: se lo come el margen.
//
// Las medidas son **config, no base** (spec 21/09, "Datos fijos por país"): el día
// que la imprenta diga las de verdad, se corrigen con una variable de entorno y
// nada más. Los valores de acá abajo son ESTIMADOS —un A5 de tapa dura de unas 150
// páginas y un marco con su chip— y hay que confirmarlos antes del primer envío
// real, porque de ellos sale lo que cuesta cada etiqueta.

/**
 * Los valores de la casa. `estimado: true` es una marca deliberada: mientras siga
 * en true, nadie midió esto de verdad.
 */
export const MEDIDAS_POR_DEFECTO = {
  /** Libro A5 de tapa dura, ~150 páginas. */
  libroG: 600,
  /** Marco con su foto y el chip. */
  marcoG: 400,
  /** La caja, el relleno y la bolsa. */
  cajaG: 150,
  /** Largo y ancho de la caja en cm (el libro más el relleno). */
  largoCm: 24,
  anchoCm: 18,
  /** Alto de cada cosa apilada, en cm. */
  altoLibroCm: 3,
  altoMarcoCm: 3,
  /** El alto que suma la caja vacía. */
  altoCajaCm: 2,
  estimado: true,
} as const;

export type Bulto = {
  pesoG: number;
  /** "largoxanchoxalto" en cm, el formato que piden los agregadores. */
  dimensiones: string;
  /** true mientras las medidas sean las estimadas de la casa. */
  estimado: boolean;
};

/** Un número de una variable de entorno; si no se entiende, vale el de la casa y avisa. */
function numero(clave: string, porDefecto: number): number {
  const crudo = process.env[clave];
  if (crudo === undefined || crudo.trim() === '') return porDefecto;
  const valor = Number(crudo);
  if (!Number.isFinite(valor) || valor <= 0) {
    console.warn(`envio: ${clave}="${crudo}" no es un número válido; se usa ${porDefecto}.`);
    return porDefecto;
  }
  return valor;
}

/**
 * El paquete de un pedido: todo lo físico viaja junto, en una sola caja ("los
 * marcos viajan con el libro", spec del catálogo). Devuelve `null` si no hay nada
 * que mandar — un pedido de solo PDF no tiene envío.
 */
export function calcularBulto(productos: { copias: number; marcos: number }): Bulto | null {
  const copias = Math.max(0, Math.floor(productos.copias ?? 0));
  const marcos = Math.max(0, Math.floor(productos.marcos ?? 0));
  if (copias === 0 && marcos === 0) return null;

  const libroG = numero('PESO_LIBRO_G', MEDIDAS_POR_DEFECTO.libroG);
  const marcoG = numero('PESO_MARCO_G', MEDIDAS_POR_DEFECTO.marcoG);
  const cajaG = numero('PESO_CAJA_G', MEDIDAS_POR_DEFECTO.cajaG);

  // Una sola caja para todo el pedido: su peso se cuenta una vez, no por producto.
  const pesoG = Math.round(copias * libroG + marcos * marcoG + cajaG);

  // Apilar sube el alto; el largo y el ancho los manda la caja, que es la misma
  // lleve uno o cinco libros.
  const alto =
    MEDIDAS_POR_DEFECTO.altoCajaCm +
    copias * MEDIDAS_POR_DEFECTO.altoLibroCm +
    marcos * MEDIDAS_POR_DEFECTO.altoMarcoCm;
  const dimensiones = `${MEDIDAS_POR_DEFECTO.largoCm}x${MEDIDAS_POR_DEFECTO.anchoCm}x${Math.ceil(alto)}`;

  const medidasTocadas = ['PESO_LIBRO_G', 'PESO_MARCO_G', 'PESO_CAJA_G'].some(
    (clave) => process.env[clave] !== undefined && process.env[clave]!.trim() !== ''
  );

  return { pesoG, dimensiones, estimado: !medidasTocadas && MEDIDAS_POR_DEFECTO.estimado };
}
