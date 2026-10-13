import type { Region } from "./precios";
import type { TratoComprador } from "./regalo-textos";

// El idioma de la web pública (rediseño 2026-10, DECISIONES.md D2). Tres
// versiones, cada una con su ruta para poder servirla estática y cacheada:
//   es → /        castellano de España, de tú, euros, Stripe
//   ca → /ca/...  catalán, España, euros, Stripe
//   ar → /ar/...  castellano de Argentina, de vos, pesos, Mercado Pago
//
// No confundir con el idioma de la ENTREVISTA (es-ES / es-AR / ca, el que se
// elige para el narrador en el checkout): este es el de quien visita la web.
//
// Todos los textos de las pantallas nuevas salen de diccionarios con esta
// forma: un objeto por idioma con las mismas claves (`Textos<T>`). Nada escrito
// a mano en los componentes.

export type IdiomaWeb = "es" | "ca" | "ar";

export const IDIOMAS_WEB: readonly IdiomaWeb[] = ["es", "ca", "ar"];

/** Un diccionario: los mismos textos en los tres idiomas. */
export type Textos<T> = Record<IdiomaWeb, T>;

export function esIdiomaWeb(valor: unknown): valor is IdiomaWeb {
  return valor === "es" || valor === "ca" || valor === "ar";
}

export function regionDeIdioma(idioma: IdiomaWeb): Region {
  return idioma === "ar" ? "AR" : "ES";
}

/** De vos solo en Argentina; en castellano de España y en catalán, de tú. */
export function tratoDeIdioma(idioma: IdiomaWeb): TratoComprador {
  return idioma === "ar" ? "vos" : "tu";
}

/** El atributo lang de la página. */
export function langDeIdioma(idioma: IdiomaWeb): "es-ES" | "ca-ES" | "es-AR" {
  return idioma === "ca" ? "ca-ES" : idioma === "ar" ? "es-AR" : "es-ES";
}

/** Para Intl (precios, fechas). */
export function localeDeIdioma(idioma: IdiomaWeb): "es-ES" | "ca-ES" | "es-AR" {
  return langDeIdioma(idioma);
}

const PREFIJO: Record<IdiomaWeb, string> = { es: "", ca: "/ca", ar: "/ar" };

/** La ruta de una pantalla pública en un idioma: ruta("ca", "/comprar") → "/ca/comprar". */
export function ruta(idioma: IdiomaWeb, camino: string): string {
  const limpio = camino.startsWith("/") ? camino : `/${camino}`;
  const prefijo = PREFIJO[idioma];
  if (!prefijo) return limpio;
  return limpio === "/" ? prefijo : `${prefijo}${limpio}`;
}

/** Saca el prefijo de idioma de un pathname: "/ca/comprar" → { idioma: "ca", camino: "/comprar" }. */
export function idiomaDeRuta(pathname: string): { idioma: IdiomaWeb; camino: string } {
  for (const idioma of ["ca", "ar"] as const) {
    const prefijo = PREFIJO[idioma];
    if (pathname === prefijo) return { idioma, camino: "/" };
    if (pathname.startsWith(`${prefijo}/`)) return { idioma, camino: pathname.slice(prefijo.length) };
  }
  return { idioma: "es", camino: pathname || "/" };
}

/**
 * Las alternativas de idioma para `metadata.alternates` (hreflang): la misma
 * pantalla en las tres versiones. `camino` sin prefijo ("/", "/comprar").
 */
export function alternativas(idioma: IdiomaWeb, camino: string) {
  return {
    canonical: ruta(idioma, camino),
    languages: {
      "es-ES": ruta("es", camino),
      "ca-ES": ruta("ca", camino),
      "es-AR": ruta("ar", camino),
      "x-default": ruta("es", camino),
    },
  };
}

/**
 * La cookie que deja quien elige idioma a mano en el selector: a partir de ahí
 * no se lo redirige más por país (next.config.ts, `redirects`).
 */
export const COOKIE_IDIOMA = "idioma";
