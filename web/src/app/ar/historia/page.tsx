import type { Metadata } from "next";
import { PaginaHistoria } from "../../_historia-producto/pagina";
import { TEXTOS_HISTORIA } from "../../_textos/historia";
import { alternativas } from "@/lib/idioma-web";

// «Vitácora de una historia» (Argentina). Archivo fino: todo vive en _historia-producto/pagina.tsx, igual para
// /historia, /ca/historia y /ar/historia. Estática.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_HISTORIA.ar.meta.titulo },
  description: TEXTOS_HISTORIA.ar.meta.descripcion,
  alternates: alternativas("ar", "/historia"),
  openGraph: {
    title: TEXTOS_HISTORIA.ar.meta.titulo,
    description: TEXTOS_HISTORIA.ar.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_AR",
    type: "website",
  },
};

export default function HistoriaAr() {
  return <PaginaHistoria idioma="ar" />;
}
