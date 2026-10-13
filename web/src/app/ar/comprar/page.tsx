import { PaginaComprar, metadataComprar } from "../../_checkout/pagina-comprar";

// /ar/comprar: la compra para Argentina, de vos, en pesos (la pantalla vive en _checkout).
export const metadata = metadataComprar("ar");

export default function Page() {
  return <PaginaComprar idioma="ar" />;
}
