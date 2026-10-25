import { PaginaComprarHistoria, metadataHistoria } from "../../_checkout/pagina-historia";

// /comprar/historia: la compra de «Vitácora de una historia» (la pantalla vive en _checkout).
export const metadata = metadataHistoria("es");

export default function Page() {
  return <PaginaComprarHistoria idioma="es" />;
}
