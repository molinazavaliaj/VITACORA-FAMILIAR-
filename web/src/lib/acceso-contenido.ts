import type { SupabaseClient } from "@supabase/supabase-js";
import { productosDelPedido } from "./productos";

// Quién ve lo que cuenta el narrador (Joaquín, 05/11). En las ventas nuevas de
// Familiar e Historia para otra persona lo elige el narrador, después del SÍ:
// «Mi familia» (quien compró y sus invitados ven todo, como siempre) o «Prefiero
// yo» (la familia no ve audios ni respuestas, y el libro le llega cuando corresponde).
// Si no contesta, es lo mismo que «Prefiero yo»: el silencio no abre nada.
//
// Vive en `narradores.contexto.acceso`, sin migración. Lo escriben la compra
// (la marca), el bot (la elección) y la revisión del libro (el OK).
// SIN LA MARCA TODO SIGUE COMO SIEMPRE: las entrevistas anteriores a este cambio
// conservan lo que se les prometió al comprar (términos §12).

export type Acceso = {
  elige: true;
  quien?: "familia" | "narrador";
  /** Cuándo eligió, con qué mensaje y con qué versión del texto: la prueba del permiso. */
  at?: string;
  waMessageId?: string;
  version?: string;
  /** El OK del narrador al libro terminado. */
  revisado_at?: string;
  /** Soporte le abrió la revisión a quien compró: lee el libro (nunca audios ni respuestas) y da el OK. */
  revisa_familia_at?: string;
};

export type ModoAcceso = "clasico" | "familia" | "narrador";

type ConContexto = { contexto?: Record<string, unknown> | null };

function accesoDe(contexto: ConContexto["contexto"]): Partial<Acceso> | null {
  const a = contexto?.acceso;
  return a && typeof a === "object" && (a as Partial<Acceso>).elige === true ? (a as Partial<Acceso>) : null;
}

export function modoAcceso(contexto: ConContexto["contexto"]): ModoAcceso {
  const a = accesoDe(contexto);
  if (!a) return "clasico";
  return a.quien === "familia" ? "familia" : "narrador";
}

/** ¿La familia puede escuchar los audios y leer las respuestas? */
export function familiaVeRespuestas(contexto: ConContexto["contexto"]): boolean {
  return modoAcceso(contexto) !== "narrador";
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

/**
 * ¿La familia puede leer el libro y escuchar sus frases? Sin el modo narrador,
 * siempre (lo demás lo deciden las reglas de cada pantalla). Con el modo narrador:
 * con impreso, cuando llega a casa; solo digital, con el OK. Quien compró puede
 * antes si soporte le abrió la revisión; los invitados no.
 */
export function familiaVeLibro(e: {
  contexto: ConContexto["contexto"];
  rol: "duena" | "invitado" | "visitante";
  conImpreso: boolean;
  impresoEnCasa: boolean;
}): boolean {
  if (modoAcceso(e.contexto) !== "narrador") return true;
  const a = accesoDe(e.contexto);
  if (e.rol === "duena" && a?.revisa_familia_at) return true;
  return e.conImpreso ? e.impresoEnCasa : Boolean(a?.revisado_at);
}

/**
 * Lo mismo, leyendo el pedido y el envío. Solo consulta en modo narrador: el resto
 * de las historias no hace ninguna consulta de más. Si algo falla, no abre: nunca
 * se muestra lo que cuenta alguien por las dudas.
 */
export async function libroAbierto(
  admin: SupabaseClient,
  n: { id: string; contexto?: Record<string, unknown> | null },
  rol: "duena" | "invitado" | "visitante",
): Promise<boolean> {
  if (modoAcceso(n.contexto) !== "narrador") return true;
  try {
    const [pedidos, entregas] = await Promise.all([
      admin.from("pedidos").select("estado, extras").eq("narrador_id", n.id),
      admin.from("entregas").select("estado").eq("narrador_id", n.id),
    ]);
    if (pedidos.error || entregas.error) return false;
    const validos = ((pedidos.data as { estado: string; extras: unknown }[] | null) ?? []).filter((p) => p.estado !== "fallido" && p.estado !== "pendiente");
    const conImpreso = validos.some((p) => {
      const q = productosDelPedido(p.extras);
      return Boolean(q.impreso) || q.marcos > 0;
    });
    const filas = (entregas.data as { estado: string }[] | null) ?? [];
    // Alcanza con que haya llegado uno: una copia comprada después no vuelve a cerrar lo que la familia ya tenía abierto.
    const impresoEnCasa = filas.some((e) => e.estado === "entregado");
    return familiaVeLibro({ contexto: n.contexto, rol, conImpreso, impresoEnCasa });
  } catch (err) {
    console.error("acceso: no pude leer el pedido o el envío", err);
    return false;
  }
}

/** Con el libro ya impreso, el código tiene que sonar: puede estar en camino o recién llegado, sin que nadie lo haya marcado. */
const ESTADOS_CON_LIBRO_IMPRESO = ["impreso", "enviado", "entregado"];

/** ¿Abre el código de «Su voz»? Lo que ya abre el libro, o un libro que ya salió de imprenta. Si algo falla, no abre. */
export async function codigoImpresoAbierto(
  admin: SupabaseClient,
  n: { id: string; contexto?: Record<string, unknown> | null },
): Promise<boolean> {
  if (modoAcceso(n.contexto) !== "narrador") return true;
  if (await libroAbierto(admin, n, "invitado")) return true;
  try {
    const { data, error } = await admin.from("entregas").select("estado").eq("narrador_id", n.id);
    if (error) return false;
    return ((data as { estado: string }[] | null) ?? []).some((e) => ESTADOS_CON_LIBRO_IMPRESO.includes(e.estado));
  } catch {
    return false;
  }
}
