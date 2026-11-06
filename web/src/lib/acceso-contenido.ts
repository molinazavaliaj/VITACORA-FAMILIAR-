// Quién ve lo que cuenta el narrador (Joaquín y Naza, 05/11). En las ventas nuevas de Familiar e Historia para otra
// persona lo elige el narrador, después del SÍ: «Mi familia» (quien compró y sus invitados ven todo, como siempre) o
// «Solo yo» (lo que cuenta queda privado hasta que el libro esté listo). Si no contesta, es lo mismo que «Prefiero
// yo»: el silencio no abre nada. En los dos casos la familia lee el libro apenas está listo y confirma quien compró.
//
// Vive en `narradores.contexto.acceso`, sin migración. Lo escriben la compra (la marca) y el bot (la elección).
// SIN LA MARCA TODO SIGUE COMO SIEMPRE: las entrevistas anteriores a este cambio conservan lo que se les prometió al
// comprar (términos §12).

export type Acceso = {
  elige: true;
  quien?: "familia" | "narrador";
  /** Cuándo eligió, con qué mensaje y con qué versión del texto: la prueba del permiso. */
  at?: string;
  waMessageId?: string;
  version?: string;
};

export type ModoAcceso = "clasico" | "familia" | "narrador";

export function modoAcceso(contexto: Record<string, unknown> | null | undefined): ModoAcceso {
  const a = contexto?.acceso as Partial<Acceso> | undefined;
  if (!a || typeof a !== "object" || a.elige !== true) return "clasico";
  return a.quien === "familia" ? "familia" : "narrador";
}

/** ¿Lleva la marca? Solo Familiar e Historia para otra persona: ni «para mí», ni Viaje, ni Kids. */
export function llevaAcceso(contexto: Record<string, unknown>): boolean {
  if (contexto.vinculoComprador === "yo mismo") return false;
  if (contexto.modo === "viaje" || contexto.modo === "kids" || contexto.viaje) return false;
  return true;
}

/** El contexto de un narrador que nace con la compra: con la marca, si le toca. */
export function conMarcaDeAcceso<T extends Record<string, unknown>>(contexto: T): T & { acceso?: Acceso } {
  return llevaAcceso(contexto) ? { ...contexto, acceso: { elige: true } } : contexto;
}
