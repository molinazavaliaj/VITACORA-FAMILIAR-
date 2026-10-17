import type { Metadata } from "next";
import { PanelEnTelefono } from "../_portada/panel-telefono";

// Lo que va adentro del teléfono de la portada (/ y /ca): la página de su
// historia con datos inventados, a 390 px. Solo para ese iframe: no se enlaza
// desde ningún lado ni va al sitemap. La de vos: /ar/telefono-historia.

export const metadata: Metadata = {
  title: { absolute: "Vitácora · la página de su historia" },
  robots: { index: false, follow: false },
};

export default function TelefonoHistoria() {
  return <PanelEnTelefono idioma="es" />;
}
