import type { Metadata } from "next";
import { Eventos } from "../../_eventos/eventos";
import { TEXTOS_EVENTOS } from "../../_textos/eventos";
import { alternativas } from "@/lib/idioma-web";

// Vitácora Eventos (17/10). Archivo fino: todo vive en _eventos/eventos.tsx,
// igual para /eventos, /ca/eventos y /ar/eventos.

export const metadata: Metadata = {
  title: TEXTOS_EVENTOS.ca.meta.titulo,
  description: TEXTOS_EVENTOS.ca.meta.descripcion,
  alternates: alternativas("ca", "/eventos"),
};

export default function PaginaEventos() {
  return <Eventos idioma="ca" />;
}
