import type { SupabaseClient } from "@supabase/supabase-js";
import { esKids, fichaVigente, idiomaDeFila } from "./kids-panel";
import type { IdiomaKids } from "./kids";
import { leerFilaKids, leerListo } from "./kids-panel-base";

// Quién abre «Su voz» (`/voz/<token>`, su audio y su libro online). El token
// firmado 'voz' ya se verificó antes de llamar acá: esto decide si el libro
// está para mostrarse.
//
// - La casa: con el libro CERRADO (`libro_aprobado_at`), como siempre.
// - Kids (`contexto.modo = "kids"` y fila en `kids_v2`): desde que la fábrica
//   dejó `{id}/escritor-kids/listo.json`. Los QR van en el PDF que el padre
//   revisa ANTES de aprobar, y tienen que abrir ahí (CONTRATO, «El libro de Kids
//   en la fábrica»). Ya aprobado abre aunque falte listo.json: el libro impreso
//   tiene los códigos.
//
// Si algo de la base falla, no abre (nunca se muestra un audio por las dudas).

export type AccesoVoz =
  | { abre: false }
  | { abre: true; producto: "casa"; nombre: string; comoLeDicen: string }
  | { abre: true; producto: "kids"; nombre: string; apodo: string; idioma: IdiomaKids };

type NarradorVoz = { nombre: string; como_le_dicen: string | null; libro_aprobado_at: string | null; contexto: Record<string, unknown> | null };

export async function accesoVoz(admin: SupabaseClient, narradorId: string): Promise<AccesoVoz> {
  const { data, error } = await admin.from("narradores").select("nombre, como_le_dicen, libro_aprobado_at, contexto").eq("id", narradorId).maybeSingle();
  if (error || !data) return { abre: false };
  const n = data as NarradorVoz;

  if (esKids(n)) {
    const { fila, error: errorKids } = await leerFilaKids(admin, narradorId);
    if (errorKids) return { abre: false };
    if (fila) {
      if (!n.libro_aprobado_at && !(await leerListo(admin, narradorId))) return { abre: false };
      return { abre: true, producto: "kids", nombre: n.nombre, apodo: n.como_le_dicen?.trim() || fichaVigente(fila).apodo, idioma: idiomaDeFila(fila) };
    }
  }

  if (!n.libro_aprobado_at) return { abre: false };
  return { abre: true, producto: "casa", nombre: n.nombre, comoLeDicen: n.como_le_dicen ?? n.nombre };
}
