import type { Metadata } from "next";
import { PaginaKidsCompleta } from "../../_kids/pagina";
import { TEXTOS_KIDS } from "../../_textos/kids";
import { alternativas } from "@/lib/idioma-web";

// Vitácora Kids (catalán). Archivo fino: todo vive en _kids/pagina.tsx,
// igual para /kids, /ca/kids y /ar/kids. Estática.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_KIDS.ca.meta.titulo },
  description: TEXTOS_KIDS.ca.meta.descripcion,
  alternates: alternativas("ca", "/kids"),
  openGraph: {
    title: TEXTOS_KIDS.ca.meta.titulo,
    description: TEXTOS_KIDS.ca.meta.descripcion,
    siteName: "Vitácora",
    locale: "ca_ES",
    type: "website",
  },
};

export default function KidsCa() {
  return <PaginaKidsCompleta idioma="ca" />;
}
