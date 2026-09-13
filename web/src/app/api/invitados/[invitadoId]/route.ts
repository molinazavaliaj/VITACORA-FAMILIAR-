import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible } from "@/lib/panel";

// Sacar a un invitado: solo la dueña de esa historia.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ invitadoId: string }> }) {
  const { invitadoId } = await params;
  const sesion = await crearClienteSesion();
  const { data: { user } } = await sesion.auth.getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión activa." }, { status: 401 });

  const admin = crearClienteServidor();
  const { data: inv } = await admin.from("invitados").select("id, narrador_id").eq("id", invitadoId).maybeSingle();
  const i = inv as { id: string; narrador_id: string } | null;
  if (!i) return NextResponse.json({ error: "No encontramos esa invitación." }, { status: 404 });

  const { historia } = await historiaAccesible(admin, user, i.narrador_id);
  if (!historia || historia.rol !== "duena") return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { error } = await admin.from("invitados").delete().eq("id", i.id);
  if (error) {
    console.error("invitados: fallo al borrar", error);
    return NextResponse.json({ error: "No pudimos sacar la invitación." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
