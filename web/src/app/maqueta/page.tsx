import type { Metadata } from "next";
import { MaquetaArriba } from "../_maqueta/maqueta";

// Maqueta escondida de la parte de arriba de la portada nueva (15/10), para
// que Naza la mire en el celular. No se enlaza desde ningún lado ni va al
// sitemap. La versión de vos: /ar/maqueta.

export const metadata: Metadata = {
  title: { absolute: "Maqueta · portada nueva" },
  robots: { index: false, follow: false },
};

export default function Maqueta() {
  return <MaquetaArriba idioma="es" />;
}
