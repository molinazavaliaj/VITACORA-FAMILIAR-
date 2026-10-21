import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { aplicarFueraDelLibro, leerPedido } from "@/lib/fuera-del-libro";
import { idiomaFueraDelLibro, textosFueraDelLibro } from "@/lib/fuera-del-libro-textos";
import { tratoDeLaFamilia } from "@/lib/trato";

// «Que esto no vaya al libro» por respuesta, desde la historia V3 (Naza, 21/10).
//   POST { accion: "sacar", respuestaId, volverAPreguntar? } → la saca (y, si pidió, se la volvemos a hacer)
//   POST { accion: "poner", respuestaId }                    → vuelve al libro
// Solo la dueña, con el libro sin cerrar. Las reglas, en lib/fuera-del-libro.ts.

export async function POST(request: NextRequest): Promise<NextResponse> {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { soloDuena: true });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const { narrador, rol, user } = acceso;
  const T = textosFueraDelLibro(idiomaFueraDelLibro(await tratoDeLaFamilia(admin, narrador.familia_id)));

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: T.error }, { status: 400 });
  }
  const pedido = leerPedido(body);
  if (!pedido) return NextResponse.json({ error: T.error }, { status: 400 });

  const r = await aplicarFueraDelLibro(admin, { narradorId: narrador.id, rol, usuarioId: user.id, pedido, error: T.error });
  return NextResponse.json(r.cuerpo, { status: r.status });
}
