import { PaginaLegal, metadataLegal } from "../../../legal/pagina";

// Reclamaciones y atención, versión en catalán. Archivo fino: todo
// vive en legal/pagina.tsx y _textos/legal.ts.

export const metadata = metadataLegal("ca", "reclamaciones");

export default function ReclamacionesCa() {
  return <PaginaLegal idioma="ca" documento="reclamaciones" />;
}
