import type { SupabaseClient } from "@supabase/supabase-js";
import { loContadoEsPrivado } from "./panel";
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

/** Lo armado desde lo contado (muestra, estructura, previsualización): si es privado, solo con el libro listo. */
export async function puedeVerLoArmado(admin: SupabaseClient, narrador: { id: string; contexto?: Record<string, unknown> | null }): Promise<boolean> {
  return !loContadoEsPrivado(narrador) || hayLibroListo(admin, narrador.id);
}
