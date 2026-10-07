import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { validarDireccion, type EstadoEntrega } from "@/lib/entregas";

// La dirección de envío de lo físico (3t.26, CONTRATO "Entregas"). Dos cosas:
//
//   1. La familia carga o corrige la dirección → la entrega pasa a `lista`.
//      Se puede hasta que la fábrica la ponga `en_produccion`; después no,
//      porque la etiqueta ya está impresa.
//   2. "Ya me llegó": la familia marca `entregado` cuando estaba `enviado`.
//      (El panel la lleva después a dejar la reseña.)
//
// Solo el comprador de ESE pedido: la entrega es de su familia, no del
// narrador. Un primo no toca la entrega de la dueña ni al revés.

const GENERICO = "No pudimos guardar la dirección. Intenta de nuevo.";
const EDITABLES: EstadoEntrega[] = ["sin_direccion", "lista", "con_problema"];

export async function PATCH(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { mensajeError: GENERICO });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const { user } = acceso;

  const entregaId = request.nextUrl.searchParams.get("entrega");
  if (!entregaId) return NextResponse.json({ error: "Falta la entrega." }, { status: 400 });

  let body: { destinatarioNombre?: unknown; destinatarioTelefono?: unknown; direccion?: unknown; nota?: unknown; accion?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "No llegó nada para guardar." }, { status: 400 });
  }

  const { data: fila } = await admin.from("entregas").select("id, familia_id, estado").eq("id", entregaId).maybeSingle();
  const entrega = fila as { id: string; familia_id: string; estado: EstadoEntrega } | null;
  if (!entrega) return NextResponse.json({ error: "Esa entrega no existe." }, { status: 404 });

  // La entrega es de la familia que compró ese pedido.
  const { data: familia } = await admin.from("familias").select("id").ilike("email", user.email ?? "").maybeSingle();
  if (!familia || (familia as { id: string }).id !== entrega.familia_id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  // "Ya me llegó": solo tiene sentido si ya se despachó.
  if (body.accion === "ya_llego") {
    if (entrega.estado !== "enviado") return NextResponse.json({ error: "Todavía no salió de acá: cuando se despache vas a poder marcarlo." }, { status: 400 });
    const { error } = await admin.from("entregas").update({ estado: "entregado", entregado_at: new Date().toISOString() }).eq("id", entrega.id);
    if (error) { console.error("entrega: fallo marcar entregado", error); return NextResponse.json({ error: GENERICO }, { status: 500 }); }
    return NextResponse.json({ ok: true, estado: "entregado" });
  }

  if (!EDITABLES.includes(entrega.estado)) {
    return NextResponse.json({ error: "El libro ya entró en producción con esta dirección: escribinos si hay que cambiarla." }, { status: 400 });
  }

  const nombre = typeof body.destinatarioNombre === "string" ? body.destinatarioNombre.trim().replace(/\s+/g, " ").slice(0, 120) : "";
  const telefono = typeof body.destinatarioTelefono === "string" ? body.destinatarioTelefono.trim().slice(0, 40) : "";
  if (!nombre) return NextResponse.json({ error: "Falta el nombre de quien recibe." }, { status: 400 });
  if (!telefono) return NextResponse.json({ error: "Falta un teléfono: el correo lo pide para entregar." }, { status: 400 });

  const d = validarDireccion(body.direccion);
  if (!d.ok) return NextResponse.json({ error: d.mensaje }, { status: 400 });

  const { error } = await admin.from("entregas").update({
    destinatario_nombre: nombre,
    destinatario_telefono: telefono,
    destinatario_email: user.email ?? null,
    direccion: d.direccion,
    nota: typeof body.nota === "string" ? body.nota.trim().slice(0, 200) || null : null,
    estado: "lista",
    direccion_at: new Date().toISOString(),
  }).eq("id", entrega.id);
  if (error) {
    console.error("entrega: fallo guardar la dirección", error);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }
  return NextResponse.json({ ok: true, estado: "lista" });
}
