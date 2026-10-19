import type { Metadata } from "next";
import { PaginaViaje } from "../../_viaje/viaje";
import { TEXTOS_VIAJE } from "../../_textos/viaje";
import { alternativas } from "@/lib/idioma-web";

// La Vitácora de Viaje (catalán). Archivo fino: todo vive
// en _viaje/viaje.tsx, igual para /viaje, /ca/viaje y /ar/viaje. Estática.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_VIAJE.ca.meta.titulo },
  description: TEXTOS_VIAJE.ca.meta.descripcion,
  alternates: alternativas("ca", "/viaje"),
  openGraph: {
    title: TEXTOS_VIAJE.ca.meta.titulo,
    description: TEXTOS_VIAJE.ca.meta.descripcion,
    siteName: "Vitácora",
    locale: "ca_ES",
    type: "website",
  },
};

export default function ViajeCa() {
  return <PaginaViaje idioma="ca" />;
}
