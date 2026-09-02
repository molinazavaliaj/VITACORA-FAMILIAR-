import { redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import FormularioRegistro from "./formulario";

export default async function Registro() {
  const supabase = await crearClienteSesion();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  return <FormularioRegistro />;
}
