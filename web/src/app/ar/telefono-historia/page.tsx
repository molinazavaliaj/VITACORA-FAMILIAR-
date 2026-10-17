import type { Metadata } from "next";
import { PanelEnTelefono } from "../../_portada/panel-telefono";

// Lo que va adentro del teléfono de /ar (de vos). Solo para ese iframe.

export const metadata: Metadata = {
  title: { absolute: "Vitácora · la página de su historia" },
  robots: { index: false, follow: false },
};

export default function TelefonoHistoriaAr() {
  return <PanelEnTelefono idioma="ar" />;
}
