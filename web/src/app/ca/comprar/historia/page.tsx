import { PaginaComprarHistoria, metadataHistoria } from "../../../_checkout/pagina-historia";

// /ca/comprar/historia: la compra de «Vitácora de una historia» (la pantalla vive en _checkout).
export const metadata = metadataHistoria("ca");

export default function Page() {
  return <PaginaComprarHistoria idioma="ca" />;
}
