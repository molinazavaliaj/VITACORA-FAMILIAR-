import { PaginaComprar, metadataComprar } from "../../_checkout/pagina-comprar";

// /ca/comprar: la compra en catalán (la pantalla vive en _checkout).
export const metadata = metadataComprar("ca");

export default function Page() {
  return <PaginaComprar idioma="ca" />;
}
