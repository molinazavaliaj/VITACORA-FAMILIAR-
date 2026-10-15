import type { SupabaseClient } from "@supabase/supabase-js";
import { tratoDeRegion, type RegionComprador, type TratoComprador } from "./regalo-textos";

// El trato (vos/tú) del panel y de los errores de la API: el de la familia dueña
// de la historia, tú si es de España. Si no se puede saber, vos: lo que ve
// Argentina no cambia nunca por una falla.

export async function regionDeLaFamilia(admin: SupabaseClient, familiaId: string | null | undefined): Promise<RegionComprador> {
  if (!familiaId) return "AR";
  try {
    const { data, error } = await admin.from("familias").select("region").eq("id", familiaId).maybeSingle();
    if (error) return "AR";
    return (data as { region?: unknown } | null)?.region === "ES" ? "ES" : "AR";
  } catch {
    return "AR";
  }
}

export async function tratoDeLaFamilia(admin: SupabaseClient, familiaId: string | null | undefined): Promise<TratoComprador> {
  return tratoDeRegion(await regionDeLaFamilia(admin, familiaId));
}

/** «Intentá» o «Intenta», para los errores genéricos de la API. */
export function intenta(trato: TratoComprador): string {
  return trato === "tu" ? "Intenta" : "Intentá";
}
