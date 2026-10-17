import { describe, it, expect } from "vitest";
import { alternativas, idiomaDeRuta, regionDeIdioma, ruta, tratoDeIdioma } from "../src/lib/idioma-web";
import nextConfig from "../next.config";

// Idioma de la web por ruta (rediseño 2026-10, DECISIONES.md D2).

describe("idioma de la web", () => {
  it("arma la ruta de cada versión", () => {
    expect(ruta("es", "/")).toBe("/");
    expect(ruta("ca", "/")).toBe("/ca");
    expect(ruta("ar", "/comprar")).toBe("/ar/comprar");
    expect(ruta("es", "comprar")).toBe("/comprar");
  });

  it("lee el idioma de una ruta", () => {
    expect(idiomaDeRuta("/ca")).toEqual({ idioma: "ca", camino: "/" });
    expect(idiomaDeRuta("/ar/comprar/viaje")).toEqual({ idioma: "ar", camino: "/comprar/viaje" });
    expect(idiomaDeRuta("/comprar")).toEqual({ idioma: "es", camino: "/comprar" });
    expect(idiomaDeRuta("/cartas")).toEqual({ idioma: "es", camino: "/cartas" });
  });

  it("región y trato: catalán es España y de tú; Argentina de vos", () => {
    expect(regionDeIdioma("ca")).toBe("ES");
    expect(regionDeIdioma("ar")).toBe("AR");
    expect(tratoDeIdioma("ca")).toBe("tu");
    expect(tratoDeIdioma("ar")).toBe("vos");
  });

  it("hreflang con las tres versiones", () => {
    expect(alternativas("ca", "/comprar")).toEqual({
      canonical: "/ca/comprar",
      languages: { "es-ES": "/comprar", "ca-ES": "/ca/comprar", "es-AR": "/ar/comprar", "x-default": "/comprar" },
    });
  });

  it("fuera de Europa y sin idioma elegido, la portada y la compra van a /ar", async () => {
    const reglas = await nextConfig.redirects!();
    const portada = reglas.find((r) => r.source === "/");
    expect(portada?.destination).toBe("/ar");
    expect(reglas.find((r) => r.source === "/comprar")?.destination).toBe("/ar/comprar");
    const pais = portada?.missing?.find((m) => m.type === "header");
    expect(new RegExp(String(pais?.value)).test("ES")).toBe(true);
    expect(new RegExp(String(pais?.value)).test("AR")).toBe(false);
    expect(new RegExp(String(pais?.value)).test("ESX")).toBe(false);
    expect(portada?.missing?.some((m) => m.type === "cookie" && m.key === "idioma")).toBe(true);
  });
});
