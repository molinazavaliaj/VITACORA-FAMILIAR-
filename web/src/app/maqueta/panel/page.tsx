import type { Metadata } from "next";
import { PanelEnTelefono } from "../../_maqueta/panel-telefono";

// Lo que va adentro del teléfono de /maqueta: la página de su historia con
// datos inventados, a 390 px. Solo para el iframe de la maqueta.

export const metadata: Metadata = {
  title: { absolute: "Maqueta · la página de su historia" },
  robots: { index: false, follow: false },
};

export default function MaquetaPanel() {
  return <PanelEnTelefono idioma="es" />;
}
