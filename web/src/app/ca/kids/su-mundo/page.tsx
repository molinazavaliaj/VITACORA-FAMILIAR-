import type { Metadata } from "next";
import { LandingKidsPagina } from "../../../_kids/landing";
import { RUTAS_LANDING_KIDS, TEXTOS_LANDING_KIDS } from "../../../_textos/landing-kids";
import { alternativas } from "@/lib/idioma-web";

// /ca/kids/su-mundo: landing de anuncio de Vitácora Kids (catalán). La pantalla vive en _kids/landing.tsx. Estática.

const t = TEXTOS_LANDING_KIDS.ca.mundo;

export const metadata: Metadata = {
  title: { absolute: t.meta.titulo },
  description: t.meta.descripcion,
  alternates: alternativas("ca", RUTAS_LANDING_KIDS.mundo),
};

export default function Page() {
  return <LandingKidsPagina idioma="ca" landing="mundo" />;
}
