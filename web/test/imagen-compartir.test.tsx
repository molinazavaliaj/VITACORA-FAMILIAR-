import { describe, it, expect, afterEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";

import nextConfig, { cabecerasSinIndexar } from "../next.config";
import { origenPublico, URL_BASE } from "../src/lib/seo";
import { altDe, titularDe } from "../src/app/_compartir/imagen";
import * as PortadaEs from "../src/app/page";
import * as PortadaAr from "../src/app/ar/page";
import * as PortadaCa from "../src/app/ca/page";
import * as ViajeEs from "../src/app/viaje/page";
import * as KidsEs from "../src/app/kids/page";
import { TEXTOS_PORTADA } from "../src/app/_textos/portada";

// La imagen para compartir (19/10) y la preview sin indexar.
//
// Lo que se cuida: que la portada (es/ar/ca), /viaje y /kids tengan su
// opengraph-image (la de su producto e idioma), que su URL salga absoluta y
// con el dominio real en producción, que ninguna página la pise con un
// openGraph.images propio, que el texto sea el titular aprobado (no uno
// escrito a mano) y que producción NO mande X-Robots-Tag.

const APP = path.join(process.cwd(), "src/app");

const PAGINAS = [
  { ruta: "/", carpeta: "", producto: "familiar", idioma: "es", modulo: PortadaEs },
  { ruta: "/ar", carpeta: "ar", producto: "familiar", idioma: "ar", modulo: PortadaAr },
  { ruta: "/ca", carpeta: "ca", producto: "familiar", idioma: "ca", modulo: PortadaCa },
  { ruta: "/viaje", carpeta: "viaje", producto: "viaje", idioma: "es", modulo: ViajeEs },
  { ruta: "/kids", carpeta: "kids", producto: "kids", idioma: "es", modulo: KidsEs },
] as const;

afterEach(() => {
  delete process.env.VERCEL_ENV;
  delete process.env.URL_BASE;
});

describe("imagen para compartir", () => {
  for (const { ruta, carpeta, producto, idioma, modulo } of PAGINAS) {
    describe(ruta, () => {
      const archivo = path.join(APP, carpeta, "opengraph-image.tsx");

      it(`tiene su opengraph-image: ${producto}, ${idioma}`, () => {
        expect(existsSync(archivo), `falta ${archivo}`).toBe(true);
        const fuente = readFileSync(archivo, "utf8");
        expect(fuente).toContain(`imagenParaCompartir("${producto}", "${idioma}")`);
        expect(fuente).toContain(`altDe("${producto}", "${idioma}")`);
        expect(fuente).toContain("export const size = TAMANO_IMAGEN");
      });

      it("la página no la pisa con un openGraph.images propio", () => {
        const metadata = (modulo as { metadata?: Metadata }).metadata;
        expect(metadata?.openGraph && "images" in metadata.openGraph).toBeFalsy();
        expect(metadata?.twitter && "images" in metadata.twitter).toBeFalsy();
      });

      it("su URL sale absoluta, con el dominio real en producción", () => {
        // Next arma og:image como new URL("<ruta>/opengraph-image?<hash>", metadataBase).
        const url = new URL(`${ruta === "/" ? "" : ruta}/opengraph-image`, origenPublico("production", "https://vitacora-rediseno.vercel.app"));
        expect(url.href).toBe(`${URL_BASE}${ruta === "/" ? "" : ruta}/opengraph-image`);
      });
    });
  }

  it("en la preview la URL es la de la preview (la imagen ya existe ahí)", () => {
    expect(origenPublico("preview", "https://vitacora-rediseno.vercel.app/")).toBe("https://vitacora-rediseno.vercel.app");
    // Sin URL_BASE (o con algo que no es una URL), el dominio real: nunca relativa.
    expect(origenPublico("preview", undefined)).toBe(URL_BASE);
    expect(origenPublico(undefined, "localhost:3000")).toBe(URL_BASE);
  });

  it("el layout usa esa base para metadataBase", () => {
    const layout = readFileSync(path.join(APP, "layout.tsx"), "utf8");
    expect(layout).toContain("metadataBase: new URL(origenPublico())");
  });

  it("el texto es el titular aprobado de cada página, no uno escrito a mano", () => {
    expect(titularDe("familiar", "es").join(" ")).toBe(TEXTOS_PORTADA.es.hero.titulo.join(" "));
    expect(titularDe("familiar", "ar")).toEqual(titularDe("familiar", "es"));
    expect(titularDe("familiar", "ca").join(" ")).toBe("En cada família hi ha un llibre per escriure.");
    expect(altDe("viaje", "es")).toBe("Vitácora de Viaje. En cada viaje hay un libro sin escribir.");
    expect(altDe("kids", "es")).toBe("Vitácora Kids. Un día no vas a recordar cómo pensabas a los once.");
    const imagen = readFileSync(path.join(APP, "_compartir/imagen.tsx"), "utf8");
    expect(imagen).not.toMatch(/libro sin escribir|llibre per escriure|pensabas a los once/);
  });

  it("las demás páginas de cada producto heredan la suya", () => {
    // Viaje y Kids (y sus compras y landings) en los tres idiomas; el resto cae en la de su portada.
    for (const carpeta of [
      "el-libro-del-viaje", "comprar/viaje", "comprar/kids",
      "ar/viaje", "ar/el-libro-del-viaje", "ar/comprar/viaje", "ar/kids", "ar/comprar/kids",
      "ca/viaje", "ca/el-libro-del-viaje", "ca/comprar/viaje", "ca/kids", "ca/comprar/kids",
    ]) {
      const fuente = readFileSync(path.join(APP, carpeta, "opengraph-image.tsx"), "utf8");
      const producto = carpeta.includes("viaje") ? "viaje" : "kids";
      const idioma = carpeta.startsWith("ar/") ? "ar" : carpeta.startsWith("ca/") ? "ca" : "es";
      expect(fuente, carpeta).toContain(`imagenParaCompartir("${producto}", "${idioma}")`);
    }
  });
});

describe("la preview no se indexa (X-Robots-Tag)", () => {
  it("en producción no se manda ninguna cabecera", async () => {
    expect(cabecerasSinIndexar("production")).toEqual([]);
    process.env.VERCEL_ENV = "production";
    expect(await nextConfig.headers!()).toEqual([]);
  });

  for (const entorno of ["preview", "development", undefined]) {
    it(`fuera de producción va en todas las respuestas (${entorno ?? "local"})`, async () => {
      const esperado = [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
      expect(cabecerasSinIndexar(entorno)).toEqual(esperado);
      if (entorno) process.env.VERCEL_ENV = entorno;
      else delete process.env.VERCEL_ENV;
      expect(await nextConfig.headers!()).toEqual(esperado);
    });
  }
});
