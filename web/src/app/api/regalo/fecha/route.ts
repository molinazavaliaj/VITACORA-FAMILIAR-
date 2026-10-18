import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { intenta, tratoDeLaFamilia } from "@/lib/trato";
import { errorDeNuevaFecha, fechaCambiable, type RegaloConFecha } from "@/lib/regalo-fecha";
import type { TratoComprador } from "@/lib/regalo-textos";

// «Cambiar la fecha de inicio» del panel (rediseño 2026-10, arreglos chicos).
// PATCH /api/regalo/fecha?narrador=<id> con { fecha: "AAAA-MM-DD" }.
//
// Solo la dueña, solo un regalo que todavía no se abrió ni se mandó, y solo
// `regalos.fecha_entrega`: no borra nada ni toca la entrega (canal, contacto,
// hora). La actualización lleva las mismas trabas que la lectura (`usado_at`
// y `entrega_enviada_at` en null), así que si el regalo se abre o sale justo
// en el medio, no se pisa nada y se avisa.

const GENERICO = (t: TratoComprador = "vos") => `No pudimos guardar la fecha. ${intenta(t)} de nuevo.`;
// PROPUESTA (arreglos-chicos/textos.md 2): igual de tú y de vos.
const YA_NO = "Este regalo ya está en marcha y la fecha no se puede cambiar.";

export async function PATCH(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { soloDuena: true, mensajeError: GENERICO() });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const n = acceso.narrador;

  let body: { fecha?: unknown } | null;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = null;
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "No llegó nada para guardar." }, { status: 400 });

  // `*`: las columnas de la entrega llegaron con una migración aparte; sin ellas, el regalo se da en mano.
  // El trato (solo para el error genérico) sale junto con el regalo, no antes.
  const [{ data, error: errorLectura }, trato] = await Promise.all([
    admin.from("regalos").select("*").eq("narrador_id", n.id).maybeSingle(),
    tratoDeLaFamilia(admin, n.familia_id),
  ]);
  if (errorLectura) {
    console.error("regalo/fecha: fallo la lectura", errorLectura);
    return NextResponse.json({ error: GENERICO(trato) }, { status: 500 });
  }
  const regalo = (data as RegaloConFecha | null) ?? null;
  if (!regalo) return NextResponse.json({ error: "Esta historia no es un regalo." }, { status: 404 });
  if (!fechaCambiable(n.estado, regalo)) return NextResponse.json({ error: YA_NO }, { status: 409 });

  const problema = errorDeNuevaFecha(body.fecha, regalo, new Date());
  if (problema) return NextResponse.json({ error: problema }, { status: 400 });
  const fecha = body.fecha as string;

  let cambio = admin.from("regalos").update({ fecha_entrega: fecha }).eq("id", regalo.id).is("usado_at", null);
  if (regalo.entrega_canal) cambio = cambio.is("entrega_enviada_at", null);
  const { data: cambiadas, error } = await cambio.select("id");
  if (error) {
    console.error("regalo/fecha: fallo el cambio", error);
    return NextResponse.json({ error: GENERICO(trato) }, { status: 500 });
  }
  if (!cambiadas || (cambiadas as unknown[]).length === 0) return NextResponse.json({ error: YA_NO }, { status: 409 });

  return NextResponse.json({ ok: true, fecha });
}
