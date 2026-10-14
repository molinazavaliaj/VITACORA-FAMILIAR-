import { PaginaLegal, metadataLegal } from "../../../legal/pagina";

// Desistimiento (España) / Botón de arrepentimiento (Argentina, Res. 424/2020), versión de Argentina (de vos). Archivo fino: todo
// vive en legal/pagina.tsx y _textos/legal.ts.

export const metadata = metadataLegal("ar", "arrepentimiento");

export default function ArrepentimientoAr() {
  return <PaginaLegal idioma="ar" documento="arrepentimiento" />;
}
