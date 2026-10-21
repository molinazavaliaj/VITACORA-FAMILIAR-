import { notFound } from "next/navigation";
import { creadoresPrendido } from "@/lib/creadores";
import { PaginaLegal, metadataLegal } from "../../legal/pagina";

// Condiciones del programa de creadores (21/10). Archivo fino: el texto
// vive en _textos/legal-creadores.ts y la página en legal/pagina.tsx. Sin
// CREADORES=1 no existe.

export const metadata = metadataLegal("es", "creadores");

export default function CondicionesCreadores() {
  if (!creadoresPrendido()) notFound();
  return <PaginaLegal idioma="es" documento="creadores" />;
}
