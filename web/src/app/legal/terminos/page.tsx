import { PaginaLegal, metadataLegal } from "../pagina";

// Términos del servicio. Requisito duro de la API de WhatsApp (Meta revisa el
// sitio antes de aprobar el negocio) y obligación legal para vender online en
// los dos mercados. Dos titulares, uno por mercado (../titulares.ts). La
// política de devolución es el mínimo legal de cada país (Naza, 16/09/2026)
// más la garantía de cada línea (DECISIONES D1, PENDIENTE DE REVISIÓN DEL
// ABOGADO). El texto vive en _textos/legal.ts; la página, en ../pagina.tsx.

export const metadata = metadataLegal("es", "terminos");

export default function Terminos() {
  return <PaginaLegal idioma="es" documento="terminos" />;
}
