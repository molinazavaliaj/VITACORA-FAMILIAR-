import type { Metadata } from "next";
import { MaquetaArriba } from "../../_maqueta/maqueta";

// Maqueta escondida de la parte de arriba de la portada nueva, de vos (15/10).
// No se enlaza desde ningún lado ni va al sitemap.

export const metadata: Metadata = {
  title: { absolute: "Maqueta · arriba de la portada" },
  robots: { index: false, follow: false },
};

export default function MaquetaAr() {
  return <MaquetaArriba idioma="ar" />;
}
