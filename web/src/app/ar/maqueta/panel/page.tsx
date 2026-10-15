import type { Metadata } from "next";
import { PanelEnTelefono } from "../../../_maqueta/panel-telefono";

// Lo que va adentro del teléfono de /ar/maqueta (de vos). Solo para el iframe.

export const metadata: Metadata = {
  title: { absolute: "Maqueta · la página de su historia" },
  robots: { index: false, follow: false },
};

export default function MaquetaPanelAr() {
  return <PanelEnTelefono idioma="ar" />;
}
