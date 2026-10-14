import { PaginaLegal, metadataLegal } from "../../../legal/pagina";

// Política de privacidad, versión de Argentina (de vos). Archivo fino: todo
// vive en legal/pagina.tsx y _textos/legal.ts.

export const metadata = metadataLegal("ar", "privacidad");

export default function PrivacidadAr() {
  return <PaginaLegal idioma="ar" documento="privacidad" />;
}
