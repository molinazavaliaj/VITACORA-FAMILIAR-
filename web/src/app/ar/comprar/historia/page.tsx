import { PaginaComprarHistoria, metadataHistoria } from "../../../_checkout/pagina-historia";

// /ar/comprar/historia: la compra de «Vitácora de una historia» (la pantalla vive en _checkout).
export const metadata = metadataHistoria("ar");

export default function Page() {
  return <PaginaComprarHistoria idioma="ar" />;
}
