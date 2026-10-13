import type { Metadata } from "next";
import { Ejemplo } from "../../_ejemplo/ejemplo";
import { TEXTOS_EJEMPLO } from "../../_textos/ejemplo";
import { alternativas } from "@/lib/idioma-web";

// El libro de ejemplo para hojear (rediseño 2026-10). Archivo fino: todo vive
// en _ejemplo/ejemplo.tsx, igual para /ejemplo, /ca/ejemplo y /ar/ejemplo.

export const metadata: Metadata = {
  title: TEXTOS_EJEMPLO.ar.meta.titulo,
  description: TEXTOS_EJEMPLO.ar.meta.descripcion,
  alternates: alternativas("ar", "/ejemplo"),
};

export default function EjemploAr() {
  return <Ejemplo idioma="ar" />;
}
