import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Colabora } from "../../_colabora/colabora";
import { TEXTOS_COLABORA } from "../../_textos/colabora";
import { alternativas } from "@/lib/idioma-web";
import { altaAbiertaEn, creadoresPrendido } from "@/lib/creadores";

// El programa de creadores (21/10). Archivo fino: todo vive en
// _colabora/colabora.tsx, igual para /colabora, /ca/colabora y /ar/colabora.
// Sin CREADORES=1 no existe.
//
// Cerrada por ahora (legal, 21/10): pagar comisiones en Argentina no está
// resuelto, así que da 404 aunque el programa esté prendido. Para abrirla,
// sumar "ar" a IDIOMAS_CON_ALTA (lib/creadores.ts). Los textos siguen en su lugar.

export const metadata: Metadata = {
  title: TEXTOS_COLABORA.ar.meta.titulo,
  description: TEXTOS_COLABORA.ar.meta.descripcion,
  alternates: alternativas("ar", "/colabora"),
};

export default function PaginaColaboraAr() {
  if (!creadoresPrendido() || !altaAbiertaEn("ar")) notFound();
  return <Colabora idioma="ar" />;
}
