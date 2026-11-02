import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { mailsDeAdmin, esAdmin, sinPermiso } from "@/lib/admin/acceso";
import { rutaDeEntrada } from "@/lib/destino";
import { NavegacionAdmin } from "./nav";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { contarSinVer } from "@/lib/admin/notificaciones";
import { BotonTema, COOKIE_TEMA, type Tema } from "@/app/tablero/tema";
import "../_direccion/tokens.css";
import "./panel.css";

// El panel de la empresa (docs/superpowers/specs/2026-09-21-panel-de-la-empresa-design.md).
// Es de Naza y Joaquín, no del cliente: el del cliente es /tablero. Este layout hace
// dos cosas para todas las pantallas de adentro: exige sesión y exige estar en la
// lista de mails de `ADMIN_EMAILS`, y recién después pinta el cascarón con el tema.
//
// El permiso se chequea ACÁ, en el servidor, con el mail del usuario logueado: no
// hay nada de esto en el navegador ni en el HTML, y tampoco hay un solo link a
// /admin en el resto del sitio (se entra escribiendo la dirección).
//
// El cascarón (rediseño 02/11) es el del libro: el lomo de tinta a la izquierda con
// las pantallas, y la hoja de papel a la derecha. Los colores, en ./panel.css (.adm).

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Sin sesión se entra por /entrar y se vuelve acá: el panel de la empresa es
  // adonde iba (el proxy ya lo manda con la vuelta puesta; esto es el respaldo
  // por si el render llega sin proxy delante).
  if (!user) redirect(rutaDeEntrada("/admin"));

  const permitidos = mailsDeAdmin(process.env.ADMIN_EMAILS);
  if (!esAdmin(user.email, permitidos)) {
    return (
      <div className="adm flex min-h-full flex-1 items-start justify-center p-10 text-[var(--texto)] [font-family:var(--fuente-cuerpo)]">
        <p className="adm-hoja max-w-[560px] px-6 py-5 leading-relaxed">{sinPermiso(permitidos)}</p>
      </div>
    );
  }

  // El número de la pestaña Notificaciones. Si no se puede saber (la tabla sin migrar), sin número.
  let sinVer: number | null = null;
  try {
    sinVer = await contarSinVer(crearClienteServidor());
  } catch {
    // sin número: el panel se ve igual
  }

  const tema: Tema = (await cookies()).get(COOKIE_TEMA)?.value === "oscuro" ? "oscuro" : "claro";

  return (
    <div
      id="panel"
      className={`adm ${tema === "oscuro" ? "oscuro" : ""} flex min-h-full flex-1 flex-col text-[var(--texto)] lg:flex-row [font-family:var(--fuente-cuerpo)]`}
    >
      <aside className="adm-lomo">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4 lg:block lg:px-6 lg:pb-4 lg:pt-7">
          <div>
            <p className="adm-marca">VITÁCORA</p>
            <p className="mt-1 text-[13px] text-[var(--texto-menor)] [font-family:var(--fuente-titulo)] italic">
              Panel de la empresa
            </p>
          </div>
          {/* El chip «sólo lectura» se fue: desde Gastos, Creadores y Contenido ya
              se cargan cosas, y cada una de esas pantallas lo dice donde pasa. */}
          <div className="lg:mt-5">
            <BotonTema inicial={tema} />
          </div>
        </div>
        <NavegacionAdmin sinVer={sinVer} />
      </aside>
      <main className="min-w-0 flex-1 px-4 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-12">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
