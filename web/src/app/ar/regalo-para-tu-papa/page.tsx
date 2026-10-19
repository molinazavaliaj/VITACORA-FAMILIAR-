import type { Metadata } from "next";
import { LandingFamiliar } from "../../_landing/landing";
import { TEXTOS_LANDING_REGALO } from "../../_textos/landing-regalo";
import { RUTAS_LANDING } from "../../_textos/landings";
import { alternativasPorCamino } from "@/lib/idioma-web";

// Landing de anuncio (fase 4). Archivo fino: todo vive en _landing/landing.tsx.
// Estática e indexable (robots normal). Sin píxel de Meta (PENDIENTES B26).

export const metadata: Metadata = {
  title: { absolute: TEXTOS_LANDING_REGALO.ar.meta.titulo },
  description: TEXTOS_LANDING_REGALO.ar.meta.descripcion,
  alternates: alternativasPorCamino("ar", RUTAS_LANDING.regalo),
  openGraph: {
    title: TEXTOS_LANDING_REGALO.ar.titulo,
    description: TEXTOS_LANDING_REGALO.ar.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_AR",
    type: "website",
  },
};

export default function LandingRegaloAr() {
  return <LandingFamiliar idioma="ar" landing="regalo" />;
}
