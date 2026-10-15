import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible } from "@/lib/panel";
import { EstadoError } from "../../ui";

// El próximo paso «Descargá la tarjeta del regalo» del Inicio y el botón «Ver la
// tarjeta» de los mails apuntan acá: la dueña va a la tarjeta de su regalo
// (/regalo/<codigo>/tarjeta). Nadie más la ve: la tarjeta lleva el código que
// canjea el regalo.

export default async function PaginaRegalo({ params }: { params: Promise<{ narradorId: string }> }) {
  const { narradorId } = await params;

  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const admin = crearClienteServidor();
  const { historia, error } = await historiaAccesible(admin, user, narradorId);
  if (error) return <EstadoError />;
  if (!historia || historia.rol !== "duena") notFound();

  const { data: regalo, error: errorRegalo } = await admin
    .from("regalos")
    .select("codigo, usado_at")
    .eq("narrador_id", historia.narrador.id)
    .maybeSingle();
  if (errorRegalo) return <EstadoError />;
  const fila = regalo as { codigo: string; usado_at?: string | null } | null;
  if (!fila?.codigo) notFound();

  // Ya canjeado (Naza, 10/10): la tarjeta cumplió su función y su código no
  // sirve más. Un «Ver la tarjeta» de un mail viejo lleva a la historia.
  if (fila.usado_at) redirect(`/tablero/${historia.narrador.id}`);
  redirect(`/regalo/${fila.codigo}/tarjeta`);
}
