import type { Metadata } from "next";
import { PaginaKidsCompleta } from "../_kids/pagina";
import { TEXTOS_KIDS } from "../_textos/kids";
import { alternativas } from "@/lib/idioma-web";

// Vitácora Kids (castellano de España). Archivo fino: todo vive en _kids/pagina.tsx,
// igual para /kids, /ca/kids y /ar/kids. Estática.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_KIDS.es.meta.titulo },
  description: TEXTOS_KIDS.es.meta.descripcion,
  alternates: alternativas("es", "/kids"),
  openGraph: {
    title: TEXTOS_KIDS.es.meta.titulo,
    description: TEXTOS_KIDS.es.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_ES",
    type: "website",
  },
};

export default function KidsEs() {
  return <PaginaKidsCompleta idioma="es" />;
}
