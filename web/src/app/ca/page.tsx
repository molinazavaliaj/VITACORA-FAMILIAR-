import type { Metadata } from "next";
import { Portada } from "../_portada/portada";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { alternativas } from "@/lib/idioma-web";

// La portada en catalán (rediseño 2026-10, DECISIONES D2). Archivo fino: todo
// vive en _portada/portada.tsx.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_PORTADA.ca.meta.titulo },
  description: TEXTOS_PORTADA.ca.meta.descripcion,
  alternates: alternativas("ca", "/"),
  openGraph: {
    title: TEXTOS_PORTADA.ca.hero.titulo.join(" "),
    description: TEXTOS_PORTADA.ca.meta.descripcion,
    siteName: "Vitácora",
    locale: "ca_ES",
    type: "website",
  },
};

export default function PortadaCa() {
  return <Portada idioma="ca" />;
}
