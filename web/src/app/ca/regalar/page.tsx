import { PaginaRegalar, metadataRegalar } from "../../_checkout/pagina-regalar";

// /ca/regalar: el regalo en catalán (la pantalla vive en _checkout).
export const metadata = metadataRegalar("ca");

export default function Page() {
  return <PaginaRegalar idioma="ca" />;
}
