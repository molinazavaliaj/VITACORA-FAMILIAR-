import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Colabora, alternativasColabora } from "../_colabora/colabora";
import { TEXTOS_COLABORA } from "../_textos/colabora";
import { creadoresPrendido } from "@/lib/creadores";

// El programa de creadores (21/10). Archivo fino: todo vive en
// _colabora/colabora.tsx, igual para /colabora, /ca/colabora y /ar/colabora.
// Sin CREADORES=1 no existe.

export const metadata: Metadata = {
  title: TEXTOS_COLABORA.es.meta.titulo,
  description: TEXTOS_COLABORA.es.meta.descripcion,
  alternates: alternativasColabora("es"),
};

export default function PaginaColabora() {
  if (!creadoresPrendido()) notFound();
  return <Colabora idioma="es" />;
}
