import { PaginaLegal, metadataLegal } from "../pagina";

// Política de privacidad. Requisito duro de la API de WhatsApp y del RGPD /
// ley 25.326. Todo lo que se afirma es lo que el código hace de verdad: si se
// suma un proveedor, un dato o una cookie, el texto (_textos/legal.ts) cambia
// en el mismo PR. Región de Railway: hoy Estados Unidos; si se mueve a
// Europa, corregir la tabla de la sección 5.

export const metadata = metadataLegal("es", "privacidad");

export default function Privacidad() {
  return <PaginaLegal idioma="es" documento="privacidad" />;
}
