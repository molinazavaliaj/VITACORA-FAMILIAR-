import { PaginaComprarViaje, metadataViaje } from "../../../_checkout/pagina-viaje";

// /ca/comprar/viaje: la compra de viaje en catalán (la pantalla vive en _checkout).
export const metadata = metadataViaje("ca");

export default function Page() {
  return <PaginaComprarViaje idioma="ca" />;
}
