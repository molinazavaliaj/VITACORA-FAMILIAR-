import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { mailsDeAdmin, esAdmin, sinPermiso } from "@/lib/admin/acceso";
import { BotonTema, COOKIE_TEMA, type Tema } from "@/app/tablero/tema";

// El panel de la empresa (docs/superpowers/specs/2026-09-21-panel-de-la-empresa-design.md).
// Es de Naza y Joaquín, no del cliente: el del cliente es /tablero. Este layout hace
// dos cosas para todas las pantallas de adentro: exige sesión y exige estar en la
// lista de mails de `ADMIN_EMAILS`, y recién después pinta el cascarón con el tema.
//
// El permiso se chequea ACÁ, en el servidor, con el mail del usuario logueado: no
// hay nada de esto en el navegador ni en el HTML, y tampoco hay un solo link a
// /admin en el resto del sitio (se entra escribiendo la dirección).

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--fuente-titulo",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--fuente-micro",
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--fuente-cuerpo",
  display: "swap",
});

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const permitidos = mailsDeAdmin(process.env.ADMIN_EMAILS);
  if (!esAdmin(user.email, permitidos)) {
    return (
      <div className="flex min-h-full flex-1 items-start justify-center bg-[var(--fondo)] p-10 text-[var(--texto)]">
        <p className="max-w-[560px] leading-relaxed">{sinPermiso(permitidos)}</p>
      </div>
    );
  }

  const tema: Tema = (await cookies()).get(COOKIE_TEMA)?.value === "oscuro" ? "oscuro" : "claro";

  return (
    <div
      id="panel"
      className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} ${tema === "oscuro" ? "oscuro" : ""} flex min-h-full flex-1 flex-col bg-[var(--fondo)] text-[var(--texto)] [font-family:var(--fuente-cuerpo)]`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--linea)] px-5 py-3">
        <p className="[font-family:var(--fuente-titulo)] text-lg">Vitácora Familiar</p>
        <p className="flex items-center gap-3 text-sm text-[var(--texto-menor)]">
          Panel de la empresa
          {/* La promesa de la casa: de acá no se toca nada. */}
          <span className="rounded-full border border-[var(--linea-fuerte)] px-2 py-0.5 text-xs">
            sólo lectura
          </span>
          <BotonTema inicial={tema} />
        </p>
      </header>
      <main className="flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
