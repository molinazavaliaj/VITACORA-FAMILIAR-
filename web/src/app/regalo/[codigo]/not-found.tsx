import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { RegaloQueNoSeEncuentra } from "../../_publico/hoja-aviso";
import { COOKIE_IDIOMA, idiomaDelVisitante } from "../../_publico/idioma-visitante";

// El código del regalo no existe o el pago no entró: la página (y la de la
// tarjeta, que está debajo) llama a notFound() como siempre y cae acá, con
// salida para escribirnos (rediseño 2026-10, fase 3, `Casos` 5). Sigue sin
// revelar nada del código y la respuesta sigue siendo 404.
export const metadata: Metadata = { title: "Regalo no encontrado", robots: { index: false, follow: false } };

export default async function RegaloNoEncontrado() {
  const idioma = idiomaDelVisitante(await headers(), (await cookies()).get(COOKIE_IDIOMA)?.value);
  return <RegaloQueNoSeEncuentra idioma={idioma} />;
}
