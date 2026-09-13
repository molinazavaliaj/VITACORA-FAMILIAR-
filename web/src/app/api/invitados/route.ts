import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { enviarMailInvitacion } from "@/lib/mail";

// Invitar a alguien a una historia (docs/panel-usuario.md §8): solo la dueña,
// hasta 3, mientras el libro está abierto. La invitación es por mail; entra con
// el login de siempre y lib/panel.ts la vincula al usuario cuando aparece.

export const MAXIMO_INVITADOS = 3;
const GENERICO = "No pudimos mandar la invitación. Intenta de nuevo.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    soloDuena: true,
    mensajeError: GENERICO,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const { narrador, user } = acceso;

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Falta el correo." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Ese correo no parece válido." }, { status: 400 });
  if (user.email && email === user.email.toLowerCase()) {
    return NextResponse.json({ error: "Ese es tu propio correo." }, { status: 400 });
  }

  const { data: filaNarrador } = await admin
    .from("narradores")
    .select("libro_aprobado_at, estado")
    .eq("id", narrador.id)
    .maybeSingle();
  const n = filaNarrador as { libro_aprobado_at: string | null; estado: string } | null;
  if (n?.libro_aprobado_at) {
    return NextResponse.json({ error: "El libro ya está cerrado: ya no se invita, se comparte." }, { status: 400 });
  }

  const { data: actuales, error: errorLista } = await admin
    .from("invitados")
    .select("id, email")
    .eq("narrador_id", narrador.id);
  if (errorLista) {
    console.error("invitados: fallo la lista (¿falta la migración?)", errorLista);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }
  const lista = (actuales as { id: string; email: string }[] | null) ?? [];
  if (lista.some((i) => i.email.toLowerCase() === email)) {
    return NextResponse.json({ error: "Ya está invitado con ese correo." }, { status: 409 });
  }
  if (lista.length >= MAXIMO_INVITADOS) {
    return NextResponse.json({ error: `Se pueden invitar hasta ${MAXIMO_INVITADOS} personas por historia.` }, { status: 400 });
  }

  const { data: creado, error: errorAlta } = await admin
    .from("invitados")
    .insert({ narrador_id: narrador.id, email, invitado_por: narrador.familia_id })
    .select("id")
    .single();
  if (errorAlta || !creado) {
    console.error("invitados: fallo el alta", errorAlta);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }

  // Quién invita: el nombre de la familia (lo que puso al comprar).
  const { data: familia } = await admin.from("familias").select("nombre").eq("id", narrador.familia_id).maybeSingle();
  const quienInvita = (familia as { nombre?: string } | null)?.nombre ?? "Alguien de la familia";

  try {
    await enviarMailInvitacion({ para: email, nombreNarrador: narrador.nombre, quienInvita });
  } catch (err) {
    // La invitación existe igual: si el mail falla, entra con su correo cuando quiera.
    console.error("invitados: fallo el mail", err);
  }

  return NextResponse.json({ ok: true, id: (creado as { id: string }).id }, { status: 200 });
}
