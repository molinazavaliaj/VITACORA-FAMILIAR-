import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { usuarioDeLaSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esPropia, historiasDelUsuario } from "@/lib/panel";
import { Navegacion } from "./nav";
import { BotonTema, COOKIE_TEMA, type Tema } from "./tema";
import { estadoCorto } from "./riel";
import { CascaronHueco } from "./esqueleto";
import { esKids } from "@/lib/kids-panel";
import { estadoCortoKids } from "../_textos/panel-kids";
import "../_direccion/tokens.css";
import "./panel.css";

// El panel del usuario (docs/panel-usuario.md). Este layout hace tres cosas
// para todas las pantallas de adentro: exige sesión, carga las historias que
// ve este usuario (propias e invitadas) y pinta el cascarón —la cabecera de
// tinta arriba, las pestañas abajo en el celular— con el tema que eligió
// (cookie: el servidor ya pinta papel o tinta, sin parpadeo).
//
// Rediseño 2026-10 (fase 2): la sesión y las historias van adentro de un
// Suspense. Al entrar desde afuera (carga completa) el navegador recibe al
// instante el cascarón vacío con su esqueleto, y la cabecera de verdad y la
// página llegan después por streaming. Antes, la pantalla quedaba en blanco
// hasta tener todo. Los colores, en ./panel.css (clase .pnl).
//
// Las tipografías vienen del layout raíz (web/src/app/layout.tsx).

export default async function LayoutPanel({ children }: LayoutProps<"/tablero">) {
  const tema: Tema = (await cookies()).get(COOKIE_TEMA)?.value === "oscuro" ? "oscuro" : "claro";
  return (
    <div id="panel" className={`pnl ${tema === "oscuro" ? "oscuro" : ""} flex min-h-full flex-1 flex-col text-[var(--texto)] [font-family:var(--fuente-cuerpo)]`}>
      <Suspense fallback={<CascaronHueco />}>
        <Cascaron tema={tema}>{children}</Cascaron>
      </Suspense>
    </div>
  );
}

async function Cascaron({ tema, children }: { tema: Tema; children: ReactNode }) {
  const user = await usuarioDeLaSesion();

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
    propia: esPropia(h.narrador),
    // Vitácora Kids (K5): sus estados se dicen de otra forma (no hay invitación que aceptar).
    estadoCorto: esKids(h.narrador) ? estadoCortoKids(h.narrador.estado) : estadoCorto(h.narrador.estado, esPropia(h.narrador)),
  }));
  // La letra del círculo de la cuenta: la del nombre de quien compró, o la del correo.
  const inicial = (panel.familia?.nombre?.trim() || user.email || "").charAt(0).toLocaleUpperCase("es");

  return (
    <>
      <Navegacion historias={historias} tema={<BotonTema inicial={tema} />} correo={user.email} inicial={inicial} />
      {/* min-w-0: sin esto, una fila ancha de adentro (las miniaturas del
          álbum, que scrollean de costado) estira el main más allá de la
          pantalla y la página entera se corre. */}
      <main className="relative min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
    </>
  );
}
