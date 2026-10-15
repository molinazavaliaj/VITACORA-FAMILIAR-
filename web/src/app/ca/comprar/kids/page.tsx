import { PaginaComprarKids, metadataKids } from "../../../_checkout/pagina-kids";

// /ca/comprar/kids: la compra de Vitácora Kids (la pantalla vive en _checkout).
export const metadata = metadataKids("ca");

export default function Page() {
  return <PaginaComprarKids idioma="ca" />;
}
