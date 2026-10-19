import { COOKIE_IDIOMA, esIdiomaWeb, type IdiomaWeb } from "@/lib/idioma-web";
import { regionDelRequest } from "@/lib/region";

// El idioma de quien abre una pantalla sin idioma en la URL (los enlaces que
// llegan por correo o por QR: el libro, su voz, el regalo). Manda la cookie
// `idioma` si eligió uno en la web; si no, el país, como ya hacían esas
// pantallas con el trato (España de tú, el resto de vos). Solo para pantallas
// que ya son dinámicas: leer la cabecera las haría dinámicas.
export function idiomaDelVisitante(cabeceras: Headers, cookie?: string | null): IdiomaWeb {
  if (esIdiomaWeb(cookie)) return cookie;
  return regionDelRequest(cabeceras) === "ES" ? "es" : "ar";
}

export { COOKIE_IDIOMA };
