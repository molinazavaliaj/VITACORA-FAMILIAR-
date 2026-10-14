import type { Metadata } from "next";
import { LandingFamiliar } from "../../_landing/landing";
import { TEXTOS_LANDING_PREGUNTAS } from "../../_textos/landing-preguntas";
import { RUTAS_LANDING } from "../../_textos/landings";
import { alternativasPorCamino } from "@/lib/idioma-web";

// Landing de anuncio (fase 4). Archivo fino: todo vive en _landing/landing.tsx.
// Estática e indexable (robots normal). Sin píxel de Meta (PENDIENTES B26).

export const metadata: Metadata = {
  title: { absolute: TEXTOS_LANDING_PREGUNTAS.ar.meta.titulo },
  description: TEXTOS_LANDING_PREGUNTAS.ar.meta.descripcion,
  alternates: alternativasPorCamino("ar", RUTAS_LANDING.preguntas),
  openGraph: {
    title: TEXTOS_LANDING_PREGUNTAS.ar.titulo,
    description: TEXTOS_LANDING_PREGUNTAS.ar.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_AR",
    type: "website",
  },
};

export default function LandingPreguntasAr() {
  return <LandingFamiliar idioma="ar" landing="preguntas" />;
}
