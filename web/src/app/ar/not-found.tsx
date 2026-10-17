import type { Metadata } from "next";
import { PaginaNoEncontrada } from "../_publico/hoja-aviso";

// El 404 de la versión /ar: lo que no existe bajo /ar/... (lo atrapa
// ./[...resto]/page.tsx) y los notFound() de sus pantallas. Mismo diseño que el
// de la raíz, con los enlaces y los textos de su idioma.
export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NoEncontrada() {
  return <PaginaNoEncontrada idioma="ar" />;
}
