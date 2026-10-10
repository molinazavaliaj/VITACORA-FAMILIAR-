import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible } from "@/lib/panel";
import { EstadoError } from "../../ui";

// El próximo paso «Descargá la tarjeta del regalo» del Inicio apunta acá: la
// dueña va a la tarjeta de su regalo (/regalo/<codigo>/tarjeta). Nadie más la
// ve: la tarjeta lleva el código que canjea el regalo.

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
    .select("codigo")
    .eq("narrador_id", historia.narrador.id)
    .maybeSingle();
  if (errorRegalo) return <EstadoError />;
  const codigo = (regalo as { codigo: string } | null)?.codigo;
  if (!codigo) notFound();

  redirect(`/regalo/${codigo}/tarjeta`);
}
