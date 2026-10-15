import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { leerCambioKids } from "@/lib/kids-panel";
import { guardarCambiosPanel } from "@/lib/kids-panel-base";
import { errorCambioKids, PANEL_KIDS } from "../../../_textos/panel-kids";

// Lo que el padre cambia en el panel de Kids (K5): la hora, los temas que no
// se tocan y sus preguntas para el libro. Va a `kids_v2.cambios_panel`,
// fusionado con lo pendiente y con el compare-and-swap del CONTRATO; el
// entrevistador lo pasa al motor en su próxima escritura. Solo quien compró.
//
// PATCH /api/kids/panel?narrador=<id>   { hora?, temasSacados?, preguntasPadre? }

const STATUS: Record<string, number> = { noKids: 404, ocupado: 409, "preguntas-cerradas": 409, terminado: 409, base: 500 };

export async function PATCH(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    soloDuena: true,
    mensajeError: PANEL_KIDS.errores.generico,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: PANEL_KIDS.errores.generico }, { status: 400 });
  }
  const leido = leerCambioKids(body);
  if (!leido.ok) return NextResponse.json({ error: errorCambioKids(leido.falla), falla: leido.falla }, { status: 400 });

  const r = await guardarCambiosPanel(admin, acceso.narrador.id, leido.cambio, new Date().toISOString());
  if (!r.ok) return NextResponse.json({ error: errorCambioKids(r.falla), falla: r.falla }, { status: STATUS[r.falla] ?? 400 });
  return NextResponse.json({ ok: true, pendiente: r.cambios });
}
