import { redirect } from "next/navigation";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiasDelUsuario } from "@/lib/panel";
import { Navegacion } from "./nav";

// El panel del usuario (docs/panel-usuario.md). Este layout hace tres cosas
// para todas las pantallas de adentro: exige sesión, carga las historias que
// ve este usuario (propias e invitadas) y pinta el cascarón — sidebar oscuro
// en desktop, pestañas abajo en el celular.
//
// Las tipografías se cargan acá igual que en la landing (web/src/app/page.tsx):
// el panel es la segunda pantalla pasada al sistema visual de docs/design.md.

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

  const historias = panel.historias.map((h) => ({
    id: h.narrador.id,
    nombre: h.narrador.nombre,
    comoLeDicen: h.narrador.como_le_dicen,
    rol: h.rol,
  }));

  return (
    <div
      className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} flex min-h-full flex-1 flex-col bg-[var(--fondo)] text-[var(--texto)] [font-family:var(--fuente-cuerpo)] md:flex-row`}
    >
      <Navegacion historias={historias} />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
    </div>
  );
}
