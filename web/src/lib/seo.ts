import type { MetadataRoute } from "next";
import { regionDeIdioma, ruta, type IdiomaWeb } from "./idioma-web";
import { catalogo, DETALLE_IMPRESO, DETALLE_MARCO, NOMBRES, type Catalogo } from "./productos";

// SEO del rediseño (18/10): /robots.txt y los datos estructurados (JSON-LD) de
// la portada. Antes no había ninguna de las dos cosas: el sitemap existía
// (lib/sitemap.ts) pero ningún buscador sabía de él, y Google no tenía con qué
// armar la ficha del producto.
//
// Todo lo de acá es PURO y lee los precios de lib/productos.ts, la misma fuente
// que la pantalla: si un precio cambia en Vercel, cambia el JSON-LD solo. Nada
// de números escritos a mano.

/** El origen público de la web: una sola URL para robots, sitemap y metadataBase. */
export const URL_BASE = "https://www.vitacorafamiliar.com";

/**
 * Lo que NO se indexa: pantallas privadas (panel, tablero, entrar), las que son
 * de una persona y no de todos (el libro de una familia, el anticipo, el
 * regalo, la voz) y el paso de gracias de la compra (no tiene sentido que
 * aparezca en Google).
 */
export const RUTAS_PRIVADAS = [
  "/admin",
  "/api",
  "/tablero",
  "/entrar",
  "/libro/",
  "/anticipo/",
  "/regalo/",
  "/voz/",
  "/comprar/gracias",
  // 19/10: lo que va adentro del teléfono de la portada (un iframe con datos
  // inventados) y el panel de muestra (en producción da 404, pero que ni lo pida).
  "/telefono-historia",
  "/ar/telefono-historia",
  "/panel-muestra",
] as const;

/** ¿Es el sitio de verdad? Vercel dice "production", "preview" o "development"; local no dice nada. */
export function esProduccion(entorno: string | undefined = process.env.VERCEL_ENV): boolean {
  return entorno === "production";
}

/**
 * La base de las URLs absolutas de los metadatos (`metadataBase` del layout:
 * og:image, twitter:image, og:url). En producción, siempre el dominio real.
 * Fuera de producción, la variable URL_BASE del entorno (en la preview de
 * Vercel es https://vitacora-rediseno.vercel.app, PASO-DE-MANOS.md): así la
 * imagen para compartir de la preview es la de la preview, que ya existe,
 * y no la de producción, que puede no estar todavía. Si falta, el dominio real.
 */
export function origenPublico(
  entorno: string | undefined = process.env.VERCEL_ENV,
  urlDelEntorno: string | undefined = process.env.URL_BASE,
): string {
  if (esProduccion(entorno) || !urlDelEntorno || !/^https?:\/\//.test(urlDelEntorno)) return URL_BASE;
  return urlDelEntorno.replace(/\/+$/, "");
}

/**
 * /robots.txt (app/robots.ts). En producción: todo permitido salvo lo privado,
 * y el sitemap apuntado con el mismo origen que `metadataBase` del layout.
 * En cualquier otro entorno (la preview de Vercel, local): nada se indexa
 * (19/10; además next.config manda `X-Robots-Tag: noindex` en la preview).
 */
export function reglasRobots(entorno: string | undefined = process.env.VERCEL_ENV): MetadataRoute.Robots {
  if (!esProduccion(entorno)) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...RUTAS_PRIVADAS] }],
    sitemap: `${URL_BASE}/sitemap.xml`,
  };
}

type Foto = { libro: string; marco: string };

/**
 * El precio del marco que la portada REALMENTE muestra, o null si la portada no
 * muestra ninguno que venga del catálogo.
 *
 * La trampa (18/10): en es y ca la frase del marco lleva el precio escrito en
 * el texto —«a 19 € cada uno», `_textos/portada.ts`— y NO lee PRECIO_MARCO; en
 * ar sí lo lee (`t.marcos.texto(precio)`). Si el JSON-LD publicara
 * PRECIO_MARCO en los tres idiomas, la ficha de Google podría decir 20 €
 * mientras la página dice 19 € (pasó en el build del 18/10: `.env.local` tiene
 * 20 y el texto dice 19), y un precio que no coincide con el de la página es
 * motivo de sanción de datos estructurados. Hasta que esa frase lea la
 * variable, el marco se anuncia solo donde el número sale del catálogo.
 */
function precioMarcoQueMuestraLaPagina(idioma: IdiomaWeb, cat: Catalogo): number | null {
  if (idioma !== "ar") return null;
  return cat.marco ? cat.marco.precio : null;
}

/**
 * Un producto de la portada. Sin `aggregateRating` ni `review`: todavía no hay
 * opiniones con puntaje y no se inventan (las opiniones de /opiniones son
 * textos, no estrellas).
 */
function producto(datos: { nombre: string; detalle: string; precio: number; moneda: string; foto: string; url: string }) {
  return {
    "@type": "Product",
    name: datos.nombre,
    description: datos.detalle,
    image: `${URL_BASE}${datos.foto}`,
    brand: { "@type": "Brand", name: "Vitácora" },
    offers: {
      "@type": "Offer",
      price: String(datos.precio),
      priceCurrency: datos.moneda,
      availability: "https://schema.org/InStock",
      url: datos.url,
    },
  };
}

/**
 * El JSON-LD de la portada, por idioma: la marca y cada producto que esa
 * portada vende y muestra con precio. Los precios salen de `catalogo()`,
 * igual que en la pantalla (`_portada/portada.tsx`):
 *   · el libro impreso con el PDF y «Su voz»: base + primer impreso
 *   · el marco con el chip: PRECIO_MARCO de la región
 * Si una región no vende alguno (sin precio configurado no existe), ese
 * producto no va: nunca se anuncia algo que la página no muestra.
 */
export function datosEstructurados(idioma: IdiomaWeb, fotos: Foto) {
  const cat = catalogo(regionDeIdioma(idioma));
  const urlComprar = `${URL_BASE}${ruta(idioma, "/comprar")}`;

  const productos = [];
  if (cat.impreso) {
    productos.push(
      producto({
        nombre: NOMBRES.impreso,
        detalle: DETALLE_IMPRESO,
        precio: cat.base.precio + cat.impreso.precio,
        moneda: cat.moneda,
        foto: fotos.libro,
        url: urlComprar,
      }),
    );
  }
  const precioMarco = precioMarcoQueMuestraLaPagina(idioma, cat);
  if (precioMarco !== null) {
    productos.push(
      producto({
        nombre: NOMBRES.marco,
        detalle: DETALLE_MARCO,
        precio: precioMarco,
        moneda: cat.moneda,
        foto: fotos.marco,
        url: urlComprar,
      }),
    );
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Vitácora Familiar",
        url: URL_BASE,
        logo: `${URL_BASE}/mail/vitacora-logo.png`,
        email: "hola@vitacorafamiliar.com",
      },
      ...productos,
    ],
  };
}
