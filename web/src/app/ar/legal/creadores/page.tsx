import { notFound } from "next/navigation";
import { creadoresPrendido } from "@/lib/creadores";
import { PaginaLegal, metadataLegal } from "../../../legal/pagina";

// Condiciones del programa de creadores, versión de Argentina (21/10). Archivo fino: el texto
// vive en _textos/legal-creadores.ts y la página en legal/pagina.tsx. Sin
// CREADORES=1 no existe.

export const metadata = metadataLegal("ar", "creadores");

export default function CondicionesCreadoresAr() {
  if (!creadoresPrendido()) notFound();
  return <PaginaLegal idioma="ar" documento="creadores" />;
}
