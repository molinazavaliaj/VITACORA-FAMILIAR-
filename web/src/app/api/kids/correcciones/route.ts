import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { leerCorreccion } from "@/lib/kids-panel";
import { guardarCorreccion } from "@/lib/kids-panel-base";
import { errorCambioKids, PANEL_KIDS } from "../../../_textos/panel-kids";

// Cómo se escribe un nombre (K5, banco.md: «cómo los escribe no importa: se
// corrigen en el panel»). Va a `kids_v2.correcciones` como
// `{ respuesta_id, dice, es, at }`, con el compare-and-swap del CONTRATO. No
// cambia lo guardado en `respuestas`: la fábrica las aplica al escribir el libro.
// Solo quien compró.
//
// POST   /api/kids/correcciones?narrador=<id>   { respuestaId, dice, es }
// DELETE /api/kids/correcciones?narrador=<id>   { respuestaId, dice }

const STATUS: Record<string, number> = { noKids: 404, respuesta: 404, ocupado: 409, base: 500 };

async function manejar(request: NextRequest, modo: "agregar" | "quitar") {
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
  const leida = leerCorreccion(body, modo === "quitar");
  if (!leida.ok) return NextResponse.json({ error: errorCambioKids(leida.falla), falla: leida.falla }, { status: 400 });

  const r = await guardarCorreccion(admin, acceso.narrador.id, leida, modo, new Date().toISOString());
  if (!r.ok) return NextResponse.json({ error: errorCambioKids(r.falla), falla: r.falla }, { status: STATUS[r.falla] ?? 400 });
  return NextResponse.json({ ok: true, correcciones: r.correcciones });
}

export function POST(request: NextRequest) {
  return manejar(request, "agregar");
}

export function DELETE(request: NextRequest) {
  return manejar(request, "quitar");
}
