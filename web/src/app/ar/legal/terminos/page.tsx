import { PaginaLegal, metadataLegal } from "../../../legal/pagina";

// Términos del servicio, versión de Argentina (de vos). Archivo fino: todo
// vive en legal/pagina.tsx y _textos/legal.ts.

export const metadata = metadataLegal("ar", "terminos");

export default function TerminosAr() {
  return <PaginaLegal idioma="ar" documento="terminos" />;
}
