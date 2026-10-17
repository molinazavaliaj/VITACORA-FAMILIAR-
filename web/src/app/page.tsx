import type { Metadata } from "next";
import { Portada } from "./_portada/portada";
import { TEXTOS_PORTADA } from "./_textos/portada";
import { alternativas } from "@/lib/idioma-web";

// La portada en castellano de España (rediseño 2026-10). Archivo fino: todo
// vive en _portada/portada.tsx, igual para /ca y /ar. Estática: los precios se
// leen al construir (antes leía el país en cada visita con headers()).

export const metadata: Metadata = {
  title: { absolute: TEXTOS_PORTADA.es.meta.titulo },
  description: TEXTOS_PORTADA.es.meta.descripcion,
  alternates: alternativas("es", "/"),
  openGraph: {
    title: TEXTOS_PORTADA.es.hero.titulo.join(" "),
    description: TEXTOS_PORTADA.es.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_ES",
    type: "website",
  },
  // Sin esto, twitter:* sale del layout (que dice «tu papá»).
  twitter: { title: TEXTOS_PORTADA.es.hero.titulo.join(" "), description: TEXTOS_PORTADA.es.meta.descripcion },
};

export default function Home() {
  return <Portada idioma="es" />;
}
