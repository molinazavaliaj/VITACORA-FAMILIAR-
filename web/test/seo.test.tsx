import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import PortadaEs from "../src/app/page";
import PortadaCa from "../src/app/ca/page";
import PortadaAr from "../src/app/ar/page";
import robots from "../src/app/robots";
import { datosEstructurados, origenPublico, reglasRobots, RUTAS_PRIVADAS, URL_BASE } from "../src/lib/seo";
import { catalogo } from "../src/lib/productos";
import { localeDeIdioma, regionDeIdioma, type IdiomaWeb } from "../src/lib/idioma-web";

// SEO del rediseño (18/10): /robots.txt y el JSON-LD de la portada.
//
// Lo que se cuida acá: que robots bloquee lo privado y no la web pública, que
// apunte al sitemap con el mismo origen que metadataBase, y que el precio del
// JSON-LD sea EL MISMO que muestra la pantalla — leído del catálogo, no escrito
// a mano. Si alguien sube un precio en Vercel, esto sigue en verde; si alguien
// escribe un número a mano en el JSON-LD, se pone en rojo.

const PAGINAS: Record<IdiomaWeb, () => ReactElement> = { es: PortadaEs, ca: PortadaCa, ar: PortadaAr };

const PRECIOS = {
  es: { PRECIO_EUR: "50", PRECIO_IMPRESO_EUR: "40", PRECIO_MARCO_EUR: "19" },
  ar: { PRECIO_ARS: "90000", PRECIO_IMPRESO_ARS: "110000", PRECIO_MARCO_ARS: "20000" },
} as const;

function cargarPrecios() {
  for (const grupo of Object.values(PRECIOS)) for (const [clave, valor] of Object.entries(grupo)) process.env[clave] = valor;
}

function borrarPrecios() {
  for (const grupo of Object.values(PRECIOS)) for (const clave of Object.keys(grupo)) delete process.env[clave];
}

/** El JSON-LD que quedó en el HTML, ya parseado. */
function jsonLdDe(idioma: IdiomaWeb) {
  const html = renderToStaticMarkup(PAGINAS[idioma]());
  const bloque = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(bloque, `la portada ${idioma} no trae JSON-LD`).not.toBeNull();
  return { html, datos: JSON.parse(bloque![1]) };
}

function productos(datos: { "@graph": Array<Record<string, unknown>> }) {
  return datos["@graph"].filter((n) => n["@type"] === "Product") as Array<{
    name: string;
    image: string;
    offers: { price: string; priceCurrency: string; url: string };
  }>;
}

/** El precio como lo muestra la pantalla (mismo formateador que portada.tsx). */
function comoSeVe(idioma: IdiomaWeb, monto: number, moneda: string) {
  return new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(monto);
}

beforeEach(cargarPrecios);
afterEach(borrarPrecios);

describe("robots.txt en producción", () => {
  const reglas = reglasRobots("production");
  // `rules` es una lista de bloques (uno por user-agent): acá hay uno solo.
  const disallow = (reglas.rules as Array<{ disallow: string[] }>)[0].disallow;

  it("deja entrar a toda la web pública", () => {
    expect(reglas.rules).toEqual([{ userAgent: "*", allow: "/", disallow: [...RUTAS_PRIVADAS] }]);
  });

  it("bloquea las pantallas privadas y personales", () => {
    for (const privada of ["/admin", "/api", "/tablero", "/entrar", "/libro/", "/anticipo/", "/regalo/", "/voz/", "/comprar/gracias"]) {
      expect(disallow).toContain(privada);
    }
  });

  it("no bloquea la portada, el ejemplo ni la compra", () => {
    for (const publica of ["/", "/ejemplo", "/eventos", "/comprar", "/opiniones"]) expect(disallow).not.toContain(publica);
  });

  it("apunta al sitemap con la misma base que metadataBase", () => {
    expect(reglas.sitemap).toBe(`${URL_BASE}/sitemap.xml`);
    // layout.tsx no se puede importar acá (next/font/local no existe fuera de
    // Next): se lee el archivo y se comprueba que use la misma constante.
    const layout = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(layout).toContain("metadataBase: new URL(origenPublico())");
    expect(origenPublico("production", "https://vitacora-rediseno.vercel.app")).toBe(URL_BASE);
  });

  it("es lo que devuelve app/robots.ts", () => {
    process.env.VERCEL_ENV = "production";
    try {
      expect(robots()).toEqual({
        rules: [{ userAgent: "*", allow: "/", disallow: expect.arrayContaining([...RUTAS_PRIVADAS]) }],
        sitemap: `${URL_BASE}/sitemap.xml`,
      });
    } finally {
      delete process.env.VERCEL_ENV;
    }
  });

  it("bloquea lo de adentro del teléfono y el panel de muestra (19/10)", () => {
    for (const privada of ["/telefono-historia", "/ar/telefono-historia", "/panel-muestra"]) expect(disallow).toContain(privada);
  });

  it("no bloquea ninguna página que vende", () => {
    const publicas = [
      "/", "/ar", "/ca", "/viaje", "/kids", "/kids/su-mundo", "/regalar", "/regalo-para-tu-padre", "/ar/regalo-para-tu-papa",
      "/su-voz", "/el-libro-del-viaje", "/lo-que-nunca-le-preguntaste", "/comprar/viaje", "/comprar/kids", "/ejemplo", "/opiniones", "/eventos",
    ];
    // Un Disallow bloquea todo lo que EMPIEZA con él (así lee robots.txt Google).
    for (const publica of publicas) {
      for (const regla of disallow) expect(publica.startsWith(regla), `${regla} bloquea ${publica}`).toBe(false);
    }
  });
});

describe("robots.txt fuera de producción (preview, local)", () => {
  for (const entorno of ["preview", "development", undefined]) {
    it(`no deja indexar nada (${entorno ?? "sin VERCEL_ENV"})`, () => {
      expect(reglasRobots(entorno)).toEqual({ rules: [{ userAgent: "*", disallow: "/" }] });
    });
  }

  it("app/robots.ts sin VERCEL_ENV (local) bloquea todo", () => {
    delete process.env.VERCEL_ENV;
    expect(robots()).toEqual({ rules: [{ userAgent: "*", disallow: "/" }] });
  });
});

describe("JSON-LD de la portada", () => {
  for (const idioma of ["es", "ar", "ca"] as const) {
    describe(idioma, () => {
      const region = regionDeIdioma(idioma);

      it("es JSON válido con la marca de la casa", () => {
        const { datos } = jsonLdDe(idioma);
        expect(datos["@context"]).toBe("https://schema.org");
        const organizacion = datos["@graph"].find((n: { "@type": string }) => n["@type"] === "Organization");
        expect(organizacion).toMatchObject({
          name: "Vitácora Familiar",
          url: URL_BASE,
          email: "hola@vitacorafamiliar.com",
        });
        // El logo que se anuncia tiene que existir de verdad en public/.
        const logo = new URL(organizacion.logo);
        expect(existsSync(path.join(process.cwd(), "public", logo.pathname))).toBe(true);
      });

      it("el precio del libro es el que muestra la pantalla", () => {
        const cat = catalogo(region);
        expect(cat.impreso, "sin PRECIO_IMPRESO no hay libro que anunciar").not.toBeNull();
        const monto = cat.base.precio + cat.impreso!.precio;

        const { html, datos } = jsonLdDe(idioma);
        const libro = productos(datos).find((p) => p.name === "El libro impreso");
        expect(libro).toBeDefined();
        expect(libro!.offers.price).toBe(String(monto));
        expect(libro!.offers.priceCurrency).toBe(cat.moneda);
        // El mismo número, formateado como lo formatea la portada, está en la página.
        expect(html).toContain(comoSeVe(idioma, monto, cat.moneda));
      });

      it("el precio del marco es el que muestra la pantalla", () => {
        const cat = catalogo(region);
        const { html, datos } = jsonLdDe(idioma);
        const marco = productos(datos).find((p) => p.name === "Marco con su voz");

        if (idioma === "ar") {
          // En Argentina la frase del marco lee PRECIO_MARCO: el número de la
          // ficha es el mismo que el de la página.
          expect(cat.marco).not.toBeNull();
          expect(marco).toBeDefined();
          expect(marco!.offers.price).toBe(String(cat.marco!.precio));
          expect(marco!.offers.priceCurrency).toBe(cat.moneda);
          expect(html).toContain(comoSeVe(idioma, cat.marco!.precio, cat.moneda));
        } else {
          // En es y ca el precio está escrito en el texto («a 19 €»), no en el
          // catálogo: publicarlo con PRECIO_MARCO daría una ficha que dice otra
          // cosa que la página. Hasta que la frase lea la variable, no va.
          expect(marco).toBeUndefined();
        }
      });

      it("no inventa reseñas ni puntajes", () => {
        const { html, datos } = jsonLdDe(idioma);
        expect(JSON.stringify(datos)).not.toMatch(/aggregateRating|"review"|ratingValue/);
        expect(html).not.toContain("aggregateRating");
      });

      it("usa el precio de Argentina en pesos y el de España en euros", () => {
        const { datos } = jsonLdDe(idioma);
        expect(productos(datos)[0].offers.priceCurrency).toBe(region === "AR" ? "ARS" : "EUR");
      });
    });
  }

  it("sin precio configurado no anuncia el producto (ni número ni ficha)", () => {
    borrarPrecios();
    const datos = datosEstructurados("es", { libro: "/rediseno/libro-osvaldo-portada.jpg", marco: "/rediseno/marco-en-casa.jpg" });
    expect(datos["@graph"].map((n) => n["@type"])).toEqual(["Organization"]);
  });

  it("ningún precio del JSON-LD es uno que la página no muestre", () => {
    for (const idioma of ["es", "ar", "ca"] as const) {
      const { html, datos } = jsonLdDe(idioma);
      for (const p of productos(datos)) {
        const visible = comoSeVe(idioma, Number(p.offers.price), p.offers.priceCurrency);
        expect(html, `${idioma}: ${p.name} anuncia ${p.offers.price} y la página no lo muestra`).toContain(visible);
      }
    }
  });

  it("las fotos del JSON-LD son las mismas que muestra la portada", () => {
    const { html, datos } = jsonLdDe("es");
    for (const p of productos(datos)) expect(html).toContain(p.image.replace(URL_BASE, ""));
  });
});
