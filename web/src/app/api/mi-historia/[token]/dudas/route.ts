import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenRespuestas } from "@/lib/token-respuestas";
import { ESTADO_DE_LA_FALLA, guardarRespuestasDudas } from "@/lib/dudas-guardar";

// Quien contó contesta las dudas desde su link. Sin sesión: el token firmado es el permiso, y se verifica en cada POST.
// Solo POST, porque WhatsApp abre el link solo para la vista previa y un GET nunca escribe. Lo que diga el navegador
// sobre quién contesta no se usa: lo pone el servidor.

const ERROR = "No pudimos guardar. Probá de nuevo.";
const SIN_CACHE = { "Cache-Control": "no-store" };

const responder = (cuerpo: unknown, status: number) => NextResponse.json(cuerpo, { status, headers: SIN_CACHE });

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }): Promise<NextResponse> {
  const { token } = await params;
  const t = verificarTokenRespuestas(token);
  if (!t.ok) return responder({ error: "Este link ya no sirve." }, 403);

  let body: { correcciones?: unknown };
  try {
    body = (await request.json()) as { correcciones?: unknown };
  } catch {
    return responder({ error: ERROR }, 400);
  }

  const admin = crearClienteServidor();
  const { data, error } = await admin.from("narradores").select("id, como_le_dicen, contexto").eq("id", t.narradorId).maybeSingle();
  if (error) {
    console.error("mi-historia/dudas: fallo la lectura del narrador", error.message);
    return responder({ error: ERROR }, 500);
  }
  const n = data as { id: string; como_le_dicen?: string | null; contexto?: { modo?: unknown } | null } | null;
  // Viaje y Kids no reciben este link: sus dudas siguen en el panel.
  if (!n || n.contexto?.modo === "viaje" || n.contexto?.modo === "kids") return responder({ error: "Este link ya no sirve." }, 404);

  const resultado = await guardarRespuestasDudas(admin, n.id, body.correcciones, { quien: n.como_le_dicen?.trim() || undefined });
  if (resultado.ok) return responder({ ok: true }, 200);
  return responder({ error: resultado.mensaje ?? ERROR }, ESTADO_DE_LA_FALLA[resultado.motivo]);
}
