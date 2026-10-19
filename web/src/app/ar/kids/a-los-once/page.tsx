import type { Metadata } from "next";
import { LandingKidsPagina } from "../../../_kids/landing";
import { RUTAS_LANDING_KIDS, TEXTOS_LANDING_KIDS } from "../../../_textos/landing-kids";
import { alternativas } from "@/lib/idioma-web";

// /ar/kids/a-los-once: landing de anuncio de Vitácora Kids (Argentina). La pantalla vive en _kids/landing.tsx. Estática.

const t = TEXTOS_LANDING_KIDS.ar.once;

export const metadata: Metadata = {
  title: { absolute: t.meta.titulo },
  description: t.meta.descripcion,
  alternates: alternativas("ar", RUTAS_LANDING_KIDS.once),
};

export default function Page() {
  return <LandingKidsPagina idioma="ar" landing="once" />;
}
