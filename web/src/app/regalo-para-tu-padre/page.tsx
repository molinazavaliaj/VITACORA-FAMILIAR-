import type { Metadata } from "next";
import { LandingFamiliar } from "../_landing/landing";
import { TEXTOS_LANDING_REGALO } from "../_textos/landing-regalo";
import { RUTAS_LANDING } from "../_textos/landings";
import { alternativasPorCamino } from "@/lib/idioma-web";

// Landing de anuncio (fase 4). Archivo fino: todo vive en _landing/landing.tsx.
// Estática e indexable (robots normal). Sin píxel de Meta (PENDIENTES B26).

export const metadata: Metadata = {
  title: { absolute: TEXTOS_LANDING_REGALO.es.meta.titulo },
  description: TEXTOS_LANDING_REGALO.es.meta.descripcion,
  alternates: alternativasPorCamino("es", RUTAS_LANDING.regalo),
  openGraph: {
    title: TEXTOS_LANDING_REGALO.es.titulo,
    description: TEXTOS_LANDING_REGALO.es.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_ES",
    type: "website",
  },
};

export default function LandingRegaloEs() {
  return <LandingFamiliar idioma="es" landing="regalo" />;
}
