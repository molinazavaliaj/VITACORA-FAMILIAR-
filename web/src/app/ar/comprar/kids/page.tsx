import { PaginaComprarKids, metadataKids } from "../../../_checkout/pagina-kids";

// /ar/comprar/kids: la compra de Vitácora Kids (la pantalla vive en _checkout).
export const metadata = metadataKids("ar");

export default function Page() {
  return <PaginaComprarKids idioma="ar" />;
}
