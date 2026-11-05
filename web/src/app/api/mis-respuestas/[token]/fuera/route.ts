import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { aplicarFueraDelLibro, leerPedido } from "@/lib/fuera-del-libro";
import { verificarTokenRespuestas } from "@/lib/token-respuestas";

// «Que esto no vaya al libro» desde el link del narrador. Sin sesión: el token firmado es el permiso. No ofrece volver a
// preguntar: esa pregunta aparecería en la lista que ve quien regala, y revelaría de qué habla.

const ERROR = "No pudimos guardar. Probá de nuevo.";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }): Promise<NextResponse> {
  const { token } = await params;
  const t = verificarTokenRespuestas(token);
  if (!t.ok) return NextResponse.json({ error: "Este link ya no sirve." }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: ERROR }, { status: 400 });
  }
  const pedido = leerPedido(body);
  if (!pedido) return NextResponse.json({ error: ERROR }, { status: 400 });
  const sinVolver = pedido.accion === "sacar" ? { ...pedido, volverAPreguntar: false } : pedido;
  const r = await aplicarFueraDelLibro(crearClienteServidor(), { narradorId: t.narradorId, rol: "narrador", usuarioId: null, pedido: sinVolver, error: ERROR });
  return NextResponse.json(r.cuerpo, { status: r.status });
}
