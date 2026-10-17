import type { Metadata } from "next";
import { Opiniones } from "../../_opiniones/opiniones";
import { TEXTOS_OPINIONES } from "../../_textos/opiniones";
import { alternativas } from "@/lib/idioma-web";

// Opiniones de clientes (rediseño 2026-10). Archivo fino: todo vive en
// _opiniones/opiniones.tsx, igual para /opiniones, /ca/opiniones y
// /ar/opiniones. Con menos de tres opiniones reales en lib/opiniones.ts, 404.

export const metadata: Metadata = {
  title: TEXTOS_OPINIONES.ca.meta.titulo,
  description: TEXTOS_OPINIONES.ca.meta.descripcion,
  alternates: alternativas("ca", "/opiniones"),
};

export default function OpinionesCa() {
  return <Opiniones idioma="ca" />;
}
