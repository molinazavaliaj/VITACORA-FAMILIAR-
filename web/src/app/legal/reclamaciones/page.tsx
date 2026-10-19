import { PaginaLegal, metadataLegal } from "../pagina";

// Reclamaciones y atención (tanda 5 de fase-5/textos-legales-nuevos.md): el
// canal, el horario, el plazo de respuesta, la hoja oficial y la posición
// sobre el arbitraje (Ley 7/2017 art. 40; en Argentina, Disp. 954/2025).
// El texto vive en _textos/legal.ts; la página, en ../pagina.tsx.

export const metadata = metadataLegal("es", "reclamaciones");

export default function Reclamaciones() {
  return <PaginaLegal idioma="es" documento="reclamaciones" />;
}
