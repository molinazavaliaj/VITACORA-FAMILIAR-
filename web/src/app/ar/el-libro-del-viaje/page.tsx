import type { Metadata } from "next";
import { LandingViaje } from "../../_landing/landing";
import { TEXTOS_LANDING_VIAJE } from "../../_textos/landing-viaje";
import { RUTAS_LANDING } from "../../_textos/landings";
import { alternativasPorCamino } from "@/lib/idioma-web";

// Landing de anuncio (fase 4). Archivo fino: todo vive en _landing/landing.tsx.
// Estática e indexable (robots normal). Sin píxel de Meta (PENDIENTES B26).

export const metadata: Metadata = {
  title: { absolute: TEXTOS_LANDING_VIAJE.ar.meta.titulo },
  description: TEXTOS_LANDING_VIAJE.ar.meta.descripcion,
  alternates: alternativasPorCamino("ar", RUTAS_LANDING.viaje),
  openGraph: {
    title: TEXTOS_LANDING_VIAJE.ar.titulo,
    description: TEXTOS_LANDING_VIAJE.ar.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_AR",
    type: "website",
  },
};

export default function LandingViajeAr() {
  return <LandingViaje idioma="ar" />;
}
