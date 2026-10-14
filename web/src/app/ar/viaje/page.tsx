import type { Metadata } from "next";
import { PaginaViaje } from "../../_viaje/viaje";
import { TEXTOS_VIAJE } from "../../_textos/viaje";
import { alternativas } from "@/lib/idioma-web";

// La Vitácora de Viaje (Argentina, de vos). Archivo fino: todo vive
// en _viaje/viaje.tsx, igual para /viaje, /ca/viaje y /ar/viaje. Estática.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_VIAJE.ar.meta.titulo },
  description: TEXTOS_VIAJE.ar.meta.descripcion,
  alternates: alternativas("ar", "/viaje"),
  openGraph: {
    title: TEXTOS_VIAJE.ar.meta.titulo,
    description: TEXTOS_VIAJE.ar.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_AR",
    type: "website",
  },
};

export default function ViajeAr() {
  return <PaginaViaje idioma="ar" />;
}
