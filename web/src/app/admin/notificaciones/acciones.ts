"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esAdminQuienLlama } from "@/lib/admin/quien-llama";

// Marcar avisos como vistos: la única escritura de esta pantalla (sólo `avisos.visto_at`).
// Como en gastos/acciones.ts, la acción es un endpoint suelto: chequea ADMIN_EMAILS ella misma.

export type ResultadoVisto = { error: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function marcarVisto(id: string): Promise<ResultadoVisto> {
  if (!(await esAdminQuienLlama())) return { error: "No tenés permiso para esto." };
  if (!UUID.test(id)) return { error: "Ese aviso no existe." };
  const { error } = await crearClienteServidor()
    .from("avisos")
    .update({ visto_at: new Date().toISOString() })
    .eq("id", id)
    .is("visto_at", null);
  if (error) {
    console.error("panel: no se pudo marcar el aviso como visto", error);
    return { error: "No se pudo marcar. Probá de nuevo en un rato." };
  }
  revalidatePath("/admin", "layout");
  return { error: null };
}

export async function marcarTodosVistos(): Promise<ResultadoVisto> {
  if (!(await esAdminQuienLlama())) return { error: "No tenés permiso para esto." };
  const { error } = await crearClienteServidor()
    .from("avisos")
    .update({ visto_at: new Date().toISOString() })
    .is("visto_at", null);
  if (error) {
    console.error("panel: no se pudieron marcar los avisos como vistos", error);
    return { error: "No se pudieron marcar. Probá de nuevo en un rato." };
  }
  revalidatePath("/admin", "layout");
  return { error: null };
}
