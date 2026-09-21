import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion, PUEDE } from "@/lib/panel";
import { aplicarSeleccion, guardarFrases, leerFrases, validarSeleccion } from "@/lib/frases";

// «Su voz» en el panel (spec 2026-09-20-su-voz-design, "El panel de la
// familia"): GET devuelve frases.json tal cual; POST guarda la selección de la
// familia. Solo la dueña cambia (como los nombres); los invitados leen.

const MENSAJE_ERROR_GENERICO = "No pudimos guardar las frases. Intenta de nuevo.";

export async function GET(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { mensajeError: MENSAJE_ERROR_GENERICO });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  if (!PUEDE.verHistoriaCompleta(acceso.rol)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const frases = await leerFrases(admin, acceso.narrador.id);
  if (!frases) return NextResponse.json({ error: "Todavía no hay frases." }, { status: 404 });
  return NextResponse.json(frases, { status: 200 });
}

export async function POST(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    mensajeError: MENSAJE_ERROR_GENERICO, soloDuena: true,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });

  let body: { seleccion?: unknown; confirmar?: unknown };
  try {
    body = (await request.json()) as { seleccion?: unknown; confirmar?: unknown };
  } catch {
    return NextResponse.json({ error: "El pedido llegó mal formado." }, { status: 400 });
  }
  const validada = validarSeleccion(body.seleccion);
  if (!validada.ok) return NextResponse.json({ error: validada.mensaje }, { status: 400 });

  // Se relee justo antes de escribir: el worker de voz puede haber completado
  // audios mientras la familia miraba la página, y esos campos son de él.
  const actual = await leerFrases(admin, acceso.narrador.id);
  if (!actual) return NextResponse.json({ error: "Todavía no hay frases para elegir." }, { status: 404 });

  const resultado = aplicarSeleccion(actual, validada.seleccion, { confirmar: body.confirmar === true });
  if (!resultado.ok) return NextResponse.json({ error: resultado.mensaje }, { status: 400 });

  const { error } = await guardarFrases(admin, resultado.frases);
  if (error) {
    console.error("frases POST: fallo al guardar", error);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
  return NextResponse.json({ ok: true, cambios: resultado.cambios, confirmado_at: resultado.frases.confirmado_at }, { status: 200 });
}
