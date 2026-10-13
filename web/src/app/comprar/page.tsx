import { PaginaComprar, metadataComprar } from "../_checkout/pagina-comprar";

// /comprar: la compra en castellano de España (la pantalla vive en _checkout).
export const metadata = metadataComprar("es");

export default function Page() {
  return <PaginaComprar idioma="es" />;
}
