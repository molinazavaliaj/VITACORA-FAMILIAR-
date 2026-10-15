import type { Metadata } from "next";
import { PaginaKidsCompleta } from "../../_kids/pagina";
import { TEXTOS_KIDS } from "../../_textos/kids";
import { alternativas } from "@/lib/idioma-web";

// Vitácora Kids (Argentina, de vos). Archivo fino: todo vive en _kids/pagina.tsx,
// igual para /kids, /ca/kids y /ar/kids. Estática.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_KIDS.ar.meta.titulo },
  description: TEXTOS_KIDS.ar.meta.descripcion,
  alternates: alternativas("ar", "/kids"),
  openGraph: {
    title: TEXTOS_KIDS.ar.meta.titulo,
    description: TEXTOS_KIDS.ar.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_AR",
    type: "website",
  },
};

export default function KidsAr() {
  return <PaginaKidsCompleta idioma="ar" />;
}
