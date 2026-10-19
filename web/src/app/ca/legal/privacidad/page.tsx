import { PaginaLegal, metadataLegal } from "../../../legal/pagina";

// Política de privacidad, versión en catalán. Archivo fino: todo
// vive en legal/pagina.tsx y _textos/legal.ts.

export const metadata = metadataLegal("ca", "privacidad");

export default function PrivacidadCa() {
  return <PaginaLegal idioma="ca" documento="privacidad" />;
}
