import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { esArchivoLibroKids, esKids } from "@/lib/kids-panel";
import { aprobarLibroKids, urlArchivoKids } from "@/lib/kids-panel-base";
import { errorLibroKids, PANEL_KIDS } from "../../../_textos/panel-kids";

// El libro de Kids ya escrito (decisión 9 de Naza, 15/10): el padre lo ve y lo
// aprueba desde su panel. Solo quien compró, solo un chico de Kids, solo cuando
// la fábrica dejó `{id}/escritor-kids/listo.json`.
//
// GET  /api/kids/libro?narrador=<id>&archivo=libro|sobre[&descargar=1]  → URL firmada (302)
// POST /api/kids/libro?narrador=<id>   { confirmo: true }               → libro_aprobado_at (una sola vez)

const STATUS: Record<string, number> = { noKids: 404, noListo: 409, yaAprobado: 409, confirmar: 400, archivo: 400, base: 500 };

async function acceso(request: NextRequest) {
  const admin = crearClienteServidor();
  const a = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    soloDuena: true,
    mensajeError: PANEL_KIDS.errores.generico,
  });
  return { admin, a };
}

const fallo = (falla: keyof typeof STATUS) => NextResponse.json({ error: errorLibroKids(falla as never), falla }, { status: STATUS[falla] });

export async function GET(request: NextRequest) {
  const { admin, a } = await acceso(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  if (!esKids(a.narrador)) return fallo("noKids");
  const archivo = request.nextUrl.searchParams.get("archivo");
  if (!esArchivoLibroKids(archivo)) return fallo("archivo");
  const r = await urlArchivoKids(admin, a.narrador.id, archivo, request.nextUrl.searchParams.get("descargar") === "1");
  if (!r.ok) return fallo(r.falla);
  return NextResponse.redirect(r.url, 302);
}

export async function POST(request: NextRequest) {
  const { admin, a } = await acceso(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  if (!esKids(a.narrador)) return fallo("noKids");
  let body: { confirmo?: unknown } | null = null;
  try {
    body = (await request.json()) as { confirmo?: unknown } | null;
  } catch {
    body = null;
  }
  // El cliente manda confirmo:true solo después de la confirmación en pantalla.
  if (body?.confirmo !== true) return fallo("confirmar");
  const r = await aprobarLibroKids(admin, a.narrador.id, new Date().toISOString());
  if (!r.ok) return fallo(r.falla);
  return NextResponse.json({ ok: true, aprobadoAt: r.aprobadoAt });
}
