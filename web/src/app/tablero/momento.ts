// En qué momento está una historia y cómo va su línea de tiempo (rediseño
// 2026-10, fase 2; PASO-DE-MANOS §4.2). Lógica pura, sin React ni base: la usan
// la cabecera de la historia, el Inicio y la muestra del panel, y se prueba sola.
//
// Los tres momentos salen de `narradores.estado` (supabase/CONTRATO.md):
//   antes   → pendiente_pago, regalo_pendiente, invitado, acepto
//   marcha  → activo, pausado, y también completado / cerrado_anticipado
//             mientras la familia no encargó el libro (terminó de contar pero
//             todavía falta elegir la tapa: el libro no se escribe hasta ahí)
//   listo   → completado / cerrado_anticipado con `libro_aprobado_at`
// Un estado que no se conoce cae en «marcha»: es lo que menos promete.

export type Momento = "antes" | "marcha" | "listo";

const ANTES = ["pendiente_pago", "regalo_pendiente", "invitado", "acepto"];
const CERRADOS = ["completado", "cerrado_anticipado"];

export function momentoDe(estado: string, aprobado: boolean): Momento {
  if (ANTES.includes(estado)) return "antes";
  if (CERRADOS.includes(estado) && aprobado) return "listo";
  return "marcha";
}

export const terminoDeContar = (estado: string) => CERRADOS.includes(estado);

/** La que cuenta es mujer: el checkout guarda `contexto.genero = "mujer"` (madre, abuela, o «ella» en Otra persona). */
export function esElla(contexto: Record<string, unknown> | null | undefined): boolean {
  return (contexto as { genero?: unknown } | null | undefined)?.genero === "mujer";
}

export type EstadoPaso = "hecho" | "actual" | "pendiente";
export type ClavePaso = "pagado" | "primer" | "contando" | "listo" | "impreso";
export type PasoLinea = { clave: ClavePaso; estado: EstadoPaso };

/**
 * Pagado → Primer mensaje → Contándolo → Libro listo → Impreso en casa. Sin
 * «Anticipo» (DECISIONES D4). «Impreso en casa» solo si compró el impreso.
 * - `libroEntregado`: el pedido del libro está `entregado` (la fábrica lo terminó).
 * - `impresoEnCasa`: la entrega del impreso está `entregado`.
 */
export function lineaDeTiempo(e: {
  estado: string;
  aprobado: boolean;
  libroEntregado: boolean;
  conImpreso: boolean;
  impresoEnCasa: boolean;
}): PasoLinea[] {
  const { estado } = e;
  const pagado: EstadoPaso = estado === "pendiente_pago" ? "actual" : "hecho";
  const primer: EstadoPaso =
    estado === "pendiente_pago" ? "pendiente" : estado === "regalo_pendiente" ? "actual" : "hecho";
  const contando: EstadoPaso = CERRADOS.includes(estado)
    ? "hecho"
    : ["invitado", "acepto", "activo", "pausado"].includes(estado)
      ? "actual"
      : "pendiente";
  const listo: EstadoPaso = e.libroEntregado ? "hecho" : CERRADOS.includes(estado) ? "actual" : "pendiente";
  const pasos: PasoLinea[] = [
    { clave: "pagado", estado: pagado },
    { clave: "primer", estado: primer },
    { clave: "contando", estado: contando },
    { clave: "listo", estado: listo },
  ];
  if (e.conImpreso) {
    const impreso: EstadoPaso = e.impresoEnCasa ? "hecho" : listo === "hecho" ? "actual" : "pendiente";
    pasos.push({ clave: "impreso", estado: impreso });
  }
  return pasos;
}

/** El titular de la cabecera, como clave: el texto lo pone el diccionario (app/_textos/panel.ts). */
export type Titular = "antes" | "creciendo" | "pausa" | "termino" | "escribiendo" | "listo";

export function titularDe(estado: string, aprobado: boolean, libroEntregado: boolean): Titular {
  const m = momentoDe(estado, aprobado);
  if (m === "antes") return "antes";
  if (m === "listo") return libroEntregado ? "listo" : "escribiendo";
  if (estado === "pausado") return "pausa";
  if (CERRADOS.includes(estado)) return "termino";
  return "creciendo";
}

/** «Hola, Laura.»: el primer nombre de quien compró. Nada si no se sabe (un invitado ve la historia de otra familia). */
export function primerNombre(nombre: string | null | undefined): string | null {
  const limpio = (nombre ?? "").trim().split(/\s+/)[0];
  return limpio ? limpio : null;
}
