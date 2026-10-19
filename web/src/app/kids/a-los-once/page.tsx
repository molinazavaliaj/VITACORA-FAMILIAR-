import type { Metadata } from "next";
import { LandingKidsPagina } from "../../_kids/landing";
import { RUTAS_LANDING_KIDS, TEXTOS_LANDING_KIDS } from "../../_textos/landing-kids";
import { alternativas } from "@/lib/idioma-web";

// /kids/a-los-once: landing de anuncio de Vitácora Kids (castellano de España). La pantalla vive en _kids/landing.tsx. Estática.

const t = TEXTOS_LANDING_KIDS.es.once;

export const metadata: Metadata = {
  title: { absolute: t.meta.titulo },
  description: t.meta.descripcion,
  alternates: alternativas("es", RUTAS_LANDING_KIDS.once),
};

export default function Page() {
  return <LandingKidsPagina idioma="es" landing="once" />;
}
