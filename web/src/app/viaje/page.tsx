import type { Metadata } from "next";
import { PaginaViaje } from "../_viaje/viaje";
import { TEXTOS_VIAJE } from "../_textos/viaje";
import { alternativas } from "@/lib/idioma-web";

// La Vitácora de Viaje (castellano de España). Archivo fino: todo vive
// en _viaje/viaje.tsx, igual para /viaje, /ca/viaje y /ar/viaje. Estática.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_VIAJE.es.meta.titulo },
  description: TEXTOS_VIAJE.es.meta.descripcion,
  alternates: alternativas("es", "/viaje"),
  openGraph: {
    title: TEXTOS_VIAJE.es.meta.titulo,
    description: TEXTOS_VIAJE.es.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_ES",
    type: "website",
  },
};

export default function ViajeEs() {
  return <PaginaViaje idioma="es" />;
}
