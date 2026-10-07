// Gift card: lo que lee la página que abre el QR (/regalo/[codigo]). Solo lo
// público del regalo; si el narrador no está pagado, el regalo no existe.

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizarCodigo } from "./regalo";

export type RegaloPublico = {
  codigo: string; nombre: string; comoLeDicen: string; quienRegala: string;
  mensaje: string; tieneAudio: boolean; usado: boolean;
};

export async function leerRegalo(admin: SupabaseClient, codigoCrudo: string): Promise<RegaloPublico | null> {
  const codigo = normalizarCodigo(codigoCrudo);
  if (!codigo) return null;
  const { data, error } = await admin
    .from("regalos")
    .select("codigo, quien_regala, mensaje, audio_path, usado_at, narradores(nombre, como_le_dicen, estado)")
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) {
    if ((error as { code?: string }).code === "42P01") console.warn("regalo: la tabla regalos todavía no existe");
    else console.error("regalo: falló leer el regalo", error);
    return null;
  }
  const f = data as null | {
    codigo: string; quien_regala: string; mensaje: string; audio_path: string | null; usado_at: string | null;
    narradores: { nombre: string; como_le_dicen: string; estado: string } | null;
  };
  if (!f?.narradores || f.narradores.estado === "pendiente_pago") return null;
  return {
    codigo: f.codigo, nombre: f.narradores.nombre, comoLeDicen: f.narradores.como_le_dicen,
    quienRegala: f.quien_regala, mensaje: f.mensaje, tieneAudio: !!f.audio_path, usado: !!f.usado_at,
  };
}

export function numeroPublico(): { digitos: string; legible: string } | null {
  const digitos = (process.env.WHATSAPP_NUMERO_PUBLICO ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const legible = digitos.length === 13 && digitos.startsWith("549")
    ? `+${digitos.slice(0, 2)} ${digitos.slice(2, 3)} ${digitos.slice(3, 5)} ${digitos.slice(5, 9)} ${digitos.slice(9)}`
    : `+${digitos}`;
  return { digitos, legible };
}
