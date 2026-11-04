import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba";

import { entradasSitemap } from "../src/lib/sitemap";
import { URL_BASE } from "../src/lib/seo";
import { metadataHistoria } from "../src/app/_checkout/pagina-historia";
import { metadataKids } from "../src/app/_checkout/pagina-kids";
import { metadataViaje } from "../src/app/_checkout/pagina-viaje";
import { Pie } from "../src/app/_publico/pie";

// Lo que va a Google (04/11): el sitemap lleva lo que se vende y se puede
// buscar, la compra y /colabora no se indexan, y el pie enlaza las landings.

describe("lo que va a Google", () => {
  const urls = entradasSitemap().map((e) => e.url);

  it("el sitemap lleva Viaje y las landings, cada una con su camino por idioma", () => {
    for (const camino of ["/viaje", "/regalo-para-tu-padre", "/lo-que-nunca-le-preguntaste", "/su-voz", "/el-libro-del-viaje"]) {
      expect(urls).toContain(`${URL_BASE}${camino}`);
    }
    expect(urls).toContain(`${URL_BASE}/ca/regalo-para-tu-padre`);
    expect(urls).toContain(`${URL_BASE}/ar/regalo-para-tu-papa`);
    expect(urls).not.toContain(`${URL_BASE}/ar/regalo-para-tu-padre`);
  });

  it("no lleva lo que todavía no se vende ni lo que no se busca", () => {
    for (const camino of ["/kids", "/historia", "/comprar", "/colabora", "/cuaderno"]) {
      expect(urls.some((u) => u.includes(camino))).toBe(false);
    }
  });

  it("todo lo del sitemap existe como página", () => {
    for (const url of urls) {
      const camino = url.slice(URL_BASE.length).replace(/^\//, "");
      expect(existsSync(path.join(process.cwd(), "src/app", camino, "page.tsx")), url).toBe(true);
    }
  });

  it("la compra de cada producto no se indexa, pero se siguen sus enlaces", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      for (const metadata of [metadataHistoria(idioma), metadataKids(idioma), metadataViaje(idioma)]) {
        expect(metadata.robots).toEqual({ index: false, follow: true });
      }
    }
  });

  it("/colabora no se indexa en ningún idioma", () => {
    for (const archivo of ["colabora", "ca/colabora", "ar/colabora"]) {
      const pagina = readFileSync(path.join(process.cwd(), "src/app", archivo, "page.tsx"), "utf8");
      expect(pagina).toContain("robots: { index: false, follow: false }");
    }
  });

  it("el pie enlaza solo las landings que la página pide, con el camino de cada idioma", () => {
    const pie = (idioma: "es" | "ca" | "ar") => renderToStaticMarkup(<Pie idioma={idioma} camino="/" landings={["regalo", "voz"]} />);
    expect(pie("es")).toContain('href="/regalo-para-tu-padre"');
    expect(pie("ca")).toContain('href="/ca/regalo-para-tu-padre"');
    expect(pie("ar")).toContain('href="/ar/regalo-para-tu-papa"');
    expect(pie("es")).not.toContain("/lo-que-nunca-le-preguntaste");
    expect(renderToStaticMarkup(<Pie idioma="es" camino="/" />)).not.toContain("/su-voz");
  });

  it("cada página enlaza las suyas: la portada sin el padre, Viaje solo lo suyo", () => {
    const leer = (archivo: string) => readFileSync(path.join(process.cwd(), "src/app", archivo), "utf8");
    expect(leer("_portada/portada.tsx")).toContain('landings={["preguntas", "voz"]}');
    expect(leer("_ejemplo/ejemplo.tsx")).toContain('landings={["regalo", "preguntas", "voz"]}');
    expect(leer("_viaje/viaje.tsx")).toContain('landings={["viaje"]}');
  });
});
