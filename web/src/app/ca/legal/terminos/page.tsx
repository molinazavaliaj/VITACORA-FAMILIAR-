import { PaginaLegal, metadataLegal } from "../../../legal/pagina";

// Términos del servicio, versión en catalán. Archivo fino: todo
// vive en legal/pagina.tsx y _textos/legal.ts.

export const metadata = metadataLegal("ca", "terminos");

export default function TerminosCa() {
  return <PaginaLegal idioma="ca" documento="terminos" />;
}
