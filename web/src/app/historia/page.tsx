import type { Metadata } from "next";
import { PaginaHistoria } from "../_historia-producto/pagina";
import { TEXTOS_HISTORIA } from "../_textos/historia";
import { alternativas } from "@/lib/idioma-web";

// «Vitácora de una historia» (castellano de España). Archivo fino: todo vive en _historia-producto/pagina.tsx, igual para
// /historia, /ca/historia y /ar/historia. Estática.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_HISTORIA.es.meta.titulo },
  description: TEXTOS_HISTORIA.es.meta.descripcion,
  alternates: alternativas("es", "/historia"),
  openGraph: {
    title: TEXTOS_HISTORIA.es.meta.titulo,
    description: TEXTOS_HISTORIA.es.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_ES",
    type: "website",
  },
};

export default function HistoriaEs() {
  return <PaginaHistoria idioma="es" />;
}
