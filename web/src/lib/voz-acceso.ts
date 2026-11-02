import type { SupabaseClient } from "@supabase/supabase-js";
import { esKids, fichaVigente, idiomaDeFila } from "./kids-panel";
import type { IdiomaKids } from "./kids";
import { leerFilaKids, leerListo } from "./kids-panel-base";
import { nombrePropio } from "./nombre-propio";
import type { Edicion } from "./edicion";
import type { ProductoTapa } from "./tapa";

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
// El nombre y el apodo salen con mayúscula aunque la familia los haya cargado en
// minúscula (lib/nombre-propio, Naza 02/11).

export type AccesoVoz =
  | { abre: false }
  | { abre: true; producto: "casa"; nombre: string; comoLeDicen: string; tapa: TapaVoz }
  | { abre: true; producto: "kids"; nombre: string; apodo: string; idioma: IdiomaKids };

/** Lo que hace falta para dibujar la tapa como en el panel (tapa-libro.tsx). */
export type TapaVoz = { titulo: string; conPortada: boolean; catalan: boolean; producto: ProductoTapa };

type NarradorVoz = { nombre: string; como_le_dicen: string | null; libro_aprobado_at: string | null; contexto: Record<string, unknown> | null; edicion?: Edicion | null };

export async function accesoVoz(admin: SupabaseClient, narradorId: string): Promise<AccesoVoz> {
  const { data, error } = await admin.from("narradores").select("nombre, como_le_dicen, libro_aprobado_at, contexto, edicion").eq("id", narradorId).maybeSingle();
  if (error || !data) return { abre: false };
  const n = data as NarradorVoz;

  if (esKids(n)) {
    const { fila, error: errorKids } = await leerFilaKids(admin, narradorId);
    if (errorKids) return { abre: false };
    if (fila) {
      if (!n.libro_aprobado_at && !(await leerListo(admin, narradorId))) return { abre: false };
      return { abre: true, producto: "kids", nombre: nombrePropio(n.nombre), apodo: nombrePropio(n.como_le_dicen?.trim() || fichaVigente(fila).apodo), idioma: idiomaDeFila(fila) };
    }
  }

  if (!n.libro_aprobado_at) return { abre: false };
  const nombre = nombrePropio(n.nombre);
  const tapa: TapaVoz = {
    titulo: n.edicion?.titulo?.trim() || nombre,
    conPortada: Boolean(n.edicion?.portadaFotoId),
    catalan: n.contexto?.idioma === "ca",
    producto: n.contexto?.modo === "historia" ? "historia" : "familiar",
  };
  return { abre: true, producto: "casa", nombre, comoLeDicen: n.como_le_dicen?.trim() ? nombrePropio(n.como_le_dicen) : nombre, tapa };
}
