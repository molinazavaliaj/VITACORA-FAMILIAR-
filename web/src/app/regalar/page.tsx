import { PaginaRegalar, metadataRegalar } from "../_checkout/pagina-regalar";

// /regalar: el regalo en castellano de España (la pantalla vive en _checkout).
export const metadata = metadataRegalar("es");

export default function Page() {
  return <PaginaRegalar idioma="es" />;
}
