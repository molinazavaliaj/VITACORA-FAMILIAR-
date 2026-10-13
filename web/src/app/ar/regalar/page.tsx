import { PaginaRegalar, metadataRegalar } from "../../_checkout/pagina-regalar";

// /ar/regalar: el regalo para Argentina, de vos, en pesos (la pantalla vive en _checkout).
export const metadata = metadataRegalar("ar");

export default function Page() {
  return <PaginaRegalar idioma="ar" />;
}
