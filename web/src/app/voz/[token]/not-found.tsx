import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { EnlaceQueNoSirve } from "../../_publico/hoja-aviso";
import { COOKIE_IDIOMA, idiomaDelVisitante } from "../../_publico/idioma-visitante";

// Cuando el token no verifica (o el libro todavía no está aprobado), la página
// llama a notFound() como siempre y cae acá: «Este enlace ya no sirve», con
// salida para escribirnos o entrar (rediseño 2026-10, fase 3, `Casos` 5). La
// validación no cambia y la respuesta sigue siendo 404.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EnlaceNoEncontrado() {
  const idioma = idiomaDelVisitante(await headers(), (await cookies()).get(COOKIE_IDIOMA)?.value);
  return <EnlaceQueNoSirve idioma={idioma} />;
}
