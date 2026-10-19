import { PaginaLegal, metadataLegal } from "../../../legal/pagina";

// Reclamaciones y atención, versión de Argentina (de vos). Archivo fino: todo
// vive en legal/pagina.tsx y _textos/legal.ts.

export const metadata = metadataLegal("ar", "reclamaciones");

export default function ReclamacionesAr() {
  return <PaginaLegal idioma="ar" documento="reclamaciones" />;
}
