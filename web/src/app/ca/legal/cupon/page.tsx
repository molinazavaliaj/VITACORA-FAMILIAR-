import { notFound } from "next/navigation";
import { rascaPrendido } from "@/lib/cupon";
import { PaginaLegal, metadataLegal } from "../../../legal/pagina";

// Bases del cupón de bienvenida, versión en catalán (rasca y gana, 20/10). Archivo fino: el
// texto vive en _textos/legal-cupon.ts y la página en legal/pagina.tsx. Sin
// RASCA_Y_GANA=1 no existe.

export const metadata = metadataLegal("ca", "cupon");

export default function BasesCuponCa() {
  if (!rascaPrendido()) notFound();
  return <PaginaLegal idioma="ca" documento="cupon" />;
}
