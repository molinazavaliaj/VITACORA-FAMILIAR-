import { PaginaComprarViaje, metadataViaje } from "../../_checkout/pagina-viaje";

// /comprar/viaje: la compra de viaje en castellano de España (la pantalla vive en _checkout).
export const metadata = metadataViaje("es");

export default function Page() {
  return <PaginaComprarViaje idioma="es" />;
}
