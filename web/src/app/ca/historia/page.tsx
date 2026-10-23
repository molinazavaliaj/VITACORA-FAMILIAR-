import type { Metadata } from "next";
import { PaginaHistoria } from "../../_historia-producto/pagina";
import { TEXTOS_HISTORIA } from "../../_textos/historia";
import { alternativas } from "@/lib/idioma-web";

// «Vitácora de una historia» (catalán). Archivo fino: todo vive en _historia-producto/pagina.tsx, igual para
// /historia, /ca/historia y /ar/historia. Estática.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_HISTORIA.ca.meta.titulo },
  description: TEXTOS_HISTORIA.ca.meta.descripcion,
  alternates: alternativas("ca", "/historia"),
  openGraph: {
    title: TEXTOS_HISTORIA.ca.meta.titulo,
    description: TEXTOS_HISTORIA.ca.meta.descripcion,
    siteName: "Vitácora",
    locale: "ca_ES",
    type: "website",
  },
};

export default function HistoriaCa() {
  return <PaginaHistoria idioma="ca" />;
}
