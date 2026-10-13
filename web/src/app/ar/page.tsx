import type { Metadata } from "next";
import { Portada } from "../_portada/portada";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { alternativas } from "@/lib/idioma-web";

// La portada para Argentina (de vos, pesos): a / llega quien viene de fuera de
// Europa y el CDN lo trae acá (next.config.ts). Archivo fino: todo vive en
// _portada/portada.tsx.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_PORTADA.ar.meta.titulo },
  description: TEXTOS_PORTADA.ar.meta.descripcion,
  alternates: alternativas("ar", "/"),
  openGraph: {
    title: TEXTOS_PORTADA.ar.hero.titulo.join(" "),
    description: TEXTOS_PORTADA.ar.meta.descripcion,
    siteName: "Vitácora",
    locale: "es_AR",
    type: "website",
  },
};

export default function PortadaAr() {
  return <Portada idioma="ar" />;
}
