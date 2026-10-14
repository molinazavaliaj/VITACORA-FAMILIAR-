import type { Metadata } from "next";
import { PaginaNoEncontrada } from "../_publico/hoja-aviso";

// El 404 de la versión /ca: lo que no existe bajo /ca/... (lo atrapa
// ./[...resto]/page.tsx) y los notFound() de sus pantallas. Mismo diseño que el
// de la raíz, con los enlaces y los textos de su idioma.
export const metadata: Metadata = {
  title: "Pàgina no trobada",
  robots: { index: false, follow: false },
};

export default function NoEncontrada() {
  return <PaginaNoEncontrada idioma="ca" />;
}
