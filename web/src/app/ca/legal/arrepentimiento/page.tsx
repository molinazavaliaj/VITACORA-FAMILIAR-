import { PaginaLegal, metadataLegal } from "../../../legal/pagina";

// Desistimiento (España) / Botón de arrepentimiento (Argentina, Res. 424/2020), versión en catalán. Archivo fino: todo
// vive en legal/pagina.tsx y _textos/legal.ts.

export const metadata = metadataLegal("ca", "arrepentimiento");

export default function ArrepentimientoCa() {
  return <PaginaLegal idioma="ca" documento="arrepentimiento" />;
}
