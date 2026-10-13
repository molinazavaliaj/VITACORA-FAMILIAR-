import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esPropia, historiasDelUsuario } from "@/lib/panel";
import { Navegacion } from "./nav";
import { BotonTema, COOKIE_TEMA, type Tema } from "./tema";

// El panel del usuario (docs/panel-usuario.md). Este layout hace tres cosas
// para todas las pantallas de adentro: exige sesión, carga las historias que
// ve este usuario (propias e invitadas) y pinta el cascarón — sidebar en
// desktop, pestañas abajo en el celular — con el tema que eligió (cookie:
// el servidor ya pinta claro u oscuro, sin parpadeo).
//
// Las tipografías vienen del layout raíz (web/src/app/layout.tsx).

export default async function LayoutPanel({ children }: LayoutProps<"/tablero">) {
  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const admin = crearClienteServidor();
  const { panel, error } = await historiasDelUsuario(admin, user);

  if (error) {
    console.error("panel: fallo la carga de historias", error);
  }

  // Sin familia y sin invitaciones: entró con un mail que nunca compró nada.
  if (!panel.familia && panel.historias.length === 0) redirect("/comprar");

  const tema: Tema = (await cookies()).get(COOKIE_TEMA)?.value === "oscuro" ? "oscuro" : "claro";

  const historias = panel.historias.map((h) => ({
    id: h.narrador.id,
    nombre: h.narrador.nombre,
    comoLeDicen: h.narrador.como_le_dicen,
    rol: h.rol,
    propia: esPropia(h.narrador),
  }));

  return (
    <div
      id="panel"
      className={`${tema === "oscuro" ? "oscuro" : ""} flex min-h-full flex-1 flex-col bg-[var(--fondo)] text-[var(--texto)] [font-family:var(--fuente-cuerpo)] md:flex-row`}
    >
      <Navegacion historias={historias} tema={<BotonTema inicial={tema} />} />
      {/* min-w-0: sin esto, una fila ancha de adentro (las miniaturas del
          álbum, que scrollean de costado) estira el main más allá de la
          pantalla y la página entera se corre — el fondo del panel termina
          y se ve el del body al costado. */}
      <main className="relative min-w-0 flex-1 pb-24 md:pb-0">
        {/* El botón del tema, opuesto al logo: arriba a la derecha, siempre. */}
        <div className="absolute right-4 top-4 z-10 hidden md:block">
          <BotonTema inicial={tema} />
        </div>
        {children}
      </main>
    </div>
  );
}
