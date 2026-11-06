import type { SupabaseClient } from "@supabase/supabase-js";
import { loContadoEsPrivado, type Rol } from "./panel";
import { libroAbierto } from "./acceso-contenido";
import { pedidoAMostrar } from "./pedido-a-mostrar";

// «Libro listo» (Naza, 05/11): el pedido está `entregado`. No es `libro_aprobado_at`: eso es encargarlo, y el libro
// se escribe después. El orden es terminar de contar, dudas, encargar, escribir, libro listo, confirmar, imprenta.

/** ¿El libro de este narrador ya está listo? Si la base falla, no: ante la duda, se muestra menos. */
export async function hayLibroListo(admin: SupabaseClient, narradorId: string): Promise<boolean> {
  const { pedido, error } = await pedidoAMostrar(admin, narradorId);
  if (error) {
    console.error("libro-listo: fallo la lectura del pedido", error);
    return false;
  }
  return pedido?.estado === "entregado";
}

/**
 * ¿La familia ya puede leer el libro y escuchar sus frases? Sin privacidad, siempre. Si es privado, «libro listo» no alcanza
 * (Joaquín, 05/11): con impreso, cuando llega a casa; solo digital, con el OK. Quien compró puede antes si soporte le abrió
 * la revisión (lib/acceso-contenido). Si la base falla, no: ante la duda, se muestra menos.
 */
export async function familiaPuedeVerElLibro(admin: SupabaseClient, narrador: { id: string; contexto?: Record<string, unknown> | null }, rol: Rol): Promise<boolean> {
  if (!loContadoEsPrivado(narrador)) return true;
  return (await hayLibroListo(admin, narrador.id)) && (await libroAbierto(admin, narrador, rol));
}

/** Lo armado desde lo contado (muestra, estructura, previsualización). */
export async function puedeVerLoArmado(admin: SupabaseClient, narrador: { id: string; contexto?: Record<string, unknown> | null }, rol: Rol = "invitado"): Promise<boolean> {
  return familiaPuedeVerElLibro(admin, narrador, rol);
}
