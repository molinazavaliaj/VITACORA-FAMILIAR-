import { crearClienteSesion } from "@/lib/supabase/sesion";
import { esAdmin, mailsDeAdmin } from "./acceso";

// ¿Quien llama a una server action del panel es un admin? Lo mismo que chequea
// el layout de /admin, pero del lado de la acción: una server action es un
// endpoint suelto (se puede llamar con un POST sin pasar por la pantalla) y el
// layout NO la protege. Cada escritura del panel lo llama antes de tocar la
// base. Falla cerrado: sin sesión, sin ADMIN_EMAILS o si algo tira, no es admin.

export async function esAdminQuienLlama(): Promise<boolean> {
  try {
    const supabase = await crearClienteSesion();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return esAdmin(user?.email, mailsDeAdmin(process.env.ADMIN_EMAILS));
  } catch {
    return false;
  }
}
