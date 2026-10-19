import { PaginaComprarKids, metadataKids } from "../../_checkout/pagina-kids";

// /comprar/kids: la compra de Vitácora Kids (la pantalla vive en _checkout).
export const metadata = metadataKids("es");

export default function Page() {
  return <PaginaComprarKids idioma="es" />;
}
