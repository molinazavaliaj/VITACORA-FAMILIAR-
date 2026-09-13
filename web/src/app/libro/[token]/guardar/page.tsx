import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenLibro } from "@/lib/token-libro";
import { historiaAccesible } from "@/lib/panel";

// Después del login, el visitante vuelve acá: se guarda el libro en su cuenta
// (una fila de invitados con rol 'visitante') y sigue al panel. Con ?comprar=1
// aterriza directo en Encargar libro. Si ya tenía acceso (dueña, invitado),
// no se crea nada.

export default async function GuardarLibro({ params, searchParams }: PageProps<"/libro/[token]/guardar">) {
  const { token } = await params;
  const { comprar } = await searchParams;
  const datos = verificarTokenLibro(token);
  if (!datos) notFound();

  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?volver=${encodeURIComponent(`/libro/${token}/guardar${comprar ? "?comprar=1" : ""}`)}`);

  const admin = crearClienteServidor();
  const { data: n } = await admin.from("narradores").select("id, familia_id, libro_aprobado_at").eq("id", datos.narradorId).maybeSingle();
  const narrador = n as { id: string; familia_id: string; libro_aprobado_at: string | null } | null;
  if (!narrador || !narrador.libro_aprobado_at) notFound();

  const { historia } = await historiaAccesible(admin, user, narrador.id);
  if (!historia) {
    const { error } = await admin.from("invitados").insert({
      narrador_id: narrador.id,
      email: (user.email ?? "").toLowerCase(),
      auth_user_id: user.id,
      invitado_por: narrador.familia_id,
      aceptado_at: new Date().toISOString(),
      rol: "visitante",
    });
    if (error) console.error("guardar libro: fallo la fila de visitante", error);
  }

  redirect(comprar ? `/tablero/${narrador.id}/libro` : `/tablero/${narrador.id}`);
}
