import { PaginaComprarViaje, metadataViaje } from "../../../_checkout/pagina-viaje";

// /ar/comprar/viaje: la compra de viaje para Argentina, de vos (la pantalla vive en _checkout).
export const metadata = metadataViaje("ar");

export default function Page() {
  return <PaginaComprarViaje idioma="ar" />;
}
