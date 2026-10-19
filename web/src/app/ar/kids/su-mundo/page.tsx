import type { Metadata } from "next";
import { LandingKidsPagina } from "../../../_kids/landing";
import { RUTAS_LANDING_KIDS, TEXTOS_LANDING_KIDS } from "../../../_textos/landing-kids";
import { alternativas } from "@/lib/idioma-web";

// /ar/kids/su-mundo: landing de anuncio de Vitácora Kids (Argentina). La pantalla vive en _kids/landing.tsx. Estática.

const t = TEXTOS_LANDING_KIDS.ar.mundo;

export const metadata: Metadata = {
  title: { absolute: t.meta.titulo },
  description: t.meta.descripcion,
  alternates: alternativas("ar", RUTAS_LANDING_KIDS.mundo),
};

export default function Page() {
  return <LandingKidsPagina idioma="ar" landing="mundo" />;
}
