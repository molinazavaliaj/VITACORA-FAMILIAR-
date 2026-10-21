import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// /viaje, /ca/viaje y /ar/viaje. Desde el 16/10 describen la Vitácora de Viaje
// V2, la única que se vende: nada del viaje viejo (etapas, ciudades, «con
// quién viajás», «se lee en la web») y nada de «cada noche» (B24). España de
// tú, Argentina de vos. Precio de la región del idioma; sin precio cargado, la
// página no vende.

import ViajeEs, { metadata as metaEs } from "../src/app/viaje/page";
import ViajeCa from "../src/app/ca/viaje/page";
import ViajeAr from "../src/app/ar/viaje/page";
import Home from "../src/app/page";
import PortadaCa from "../src/app/ca/page";
import PortadaAr from "../src/app/ar/page";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

const viejos: Record<string, string | undefined> = {};
const ENTORNO = { PRECIO_ARS: "65000", PRECIO_EUR: "79", PRECIO_VIAJE_EUR: "59", PRECIO_VIAJE_ARS: "70000" };
beforeEach(() => {
  for (const [k, v] of Object.entries(ENTORNO)) {
    viejos[k] = process.env[k];
    process.env[k] = v;
  }
});
afterEach(() => {
  for (const k of Object.keys(ENTORNO)) {
    if (viejos[k] === undefined) delete process.env[k];
    else process.env[k] = viejos[k];
  }
});

/** La cabecera pública lleva la solapa «Kids» desde el 15/10: el resto de la página no la nombra. */
const sinSolapas = (h: string) => h.replace(/<nav[^>]*m-solapas[\s\S]*?<\/nav>/g, "");
// «Lisboa» solo puede estar en el libro de ejemplo que gira (19/10): se mira la página sin él.
const sinLibro = (h: string) => h.slice(0, h.indexOf('<div class="l3-escena')) + h.slice(h.indexOf("Las fotos quedan."));
const PROHIBIDO = ["cada noche", "Cada noche", "cada nit", "9 días", "RESEÑA", "Kids", "los dos", "álbum de 20", "contigo", "etapa", "Lisboa", "con quién viaj", "vosotros", "vuestro", "en la web"];

describe("la página de Viaje por idioma", () => {
  it("es estática en las tres versiones", () => {
    for (const p of [ViajeEs, ViajeCa, ViajeAr]) expect(p()).not.toBeInstanceOf(Promise);
  });

  it("en /viaje (España): de tú, en euros, a /comprar/viaje", () => {
    const html = renderToStaticMarkup(ViajeEs());
    expect(html).toContain('lang="es-ES"');
    expect(html).toContain(escapar("Tú le cuentas el viaje con audios"));
    expect(html).toContain(escapar("Antes de salir"));
    expect(html).toContain(escapar("¿Tengo que saber las ciudades?"));
    expect(html).not.toContain("Cada ciudad, un capítulo"); // Naza lo quitó (06/10 y 14/10)
    expect(html).toContain(escapar("Lo pagas una vez, antes de salir."));
    expect(html).toContain(escapar("Si nos avisas antes de que la persona que viaja acepte la entrevista, te devolvemos todo. Si ya aceptó y contesta menos de diez preguntas, también te devolvemos todo."));
    expect(html).toContain('href="/comprar/viaje"');
    expect(html).toContain("€");
    expect(html).not.toContain(escapar("¿Me trata de vos?"));
    expect(html).not.toMatch(/con vos/);
    for (const p of PROHIBIDO) expect(sinLibro(sinSolapas(html)), p).not.toContain(escapar(p));
  });

  it("en /ar/viaje: de vos, como siempre, en pesos, a /ar/comprar/viaje", () => {
    const html = renderToStaticMarkup(ViajeAr());
    expect(html).toContain('lang="es-AR"');
    expect(html).toContain(escapar("Vos le contás el viaje con audios"));
    expect(html).toContain(escapar("En castellano de Argentina, de España o en catalán."));
    expect(html).toContain(escapar("Empezar mi Vitácora de viaje"));
    expect(html).toContain('href="/ar/comprar/viaje"');
    expect(html).not.toContain("€");
    for (const p of PROHIBIDO) expect(sinLibro(sinSolapas(html)), p).not.toContain(escapar(p));
  });

  it("en /ca/viaje: en catalán, el biógrafo también escribe en catalán, a /ca/comprar/viaje", () => {
    const html = renderToStaticMarkup(ViajeCa());
    expect(html).toContain('lang="ca-ES"');
    expect(html).toContain(escapar("En català, en castellà d'Espanya o d'Argentina."));
    expect(html).toContain('href="/ca/comprar/viaje"');
    for (const p of PROHIBIDO) expect(sinLibro(sinSolapas(html)), p).not.toContain(escapar(p));
  });

  // 15/10: Viaje con su color (noche y azul de la guía), por alcance: el contenedor lleva
  // data-producto="viaje" y _direccion/viaje.css reparte los --viaje-*. La portada de Familiar no
  // lo lleva (el bloque de Viaje se fue de la portada el 15/10), así su papel y su tinta no cambian.
  it("lleva la paleta de Viaje por data-producto en el contenedor, y la portada no", () => {
    for (const p of [ViajeEs, ViajeCa, ViajeAr]) {
      expect(renderToStaticMarkup(p())).toMatch(/<div[^>]*data-producto="viaje"[^>]*class="dir-pagina/);
    }
    const portada = renderToStaticMarkup(Home());
    expect(portada).not.toMatch(/<div[^>]*data-producto="viaje"[^>]*class="dir-pagina/);
    // Desde el 15/10 la portada ya no lleva el bloque de Viaje.
    expect(portada.split('data-producto="viaje"').length - 1).toBe(0);
  });

  it("la garantía de Viaje va una sola vez, en las preguntas", () => {
    for (const p of [ViajeEs, ViajeAr]) {
      const html = renderToStaticMarkup(p());
      expect(html.split(escapar("menos de diez preguntas")).length - 1).toBe(1);
    }
  });

  it("sin PRECIO_VIAJE_* la página no vende", () => {
    delete process.env.PRECIO_VIAJE_EUR;
    const html = renderToStaticMarkup(ViajeEs());
    expect(html).toContain("Próximamente");
    expect(html).not.toContain(escapar("Empezar el libro del viaje"));
  });

  it("hreflang entre las tres", () => {
    expect(metaEs.alternates).toMatchObject({ canonical: "/viaje", languages: { "ca-ES": "/ca/viaje", "es-AR": "/ar/viaje" } });
  });

  it("la portada de cada idioma lleva a la página de Viaje de su idioma", () => {
    expect(renderToStaticMarkup(Home())).toContain('href="/viaje"');
    expect(renderToStaticMarkup(PortadaCa())).toContain('href="/ca/viaje"');
    expect(renderToStaticMarkup(PortadaAr())).toContain('href="/ar/viaje"');
    expect(renderToStaticMarkup(PortadaAr())).not.toContain('href="/viaje"');
  });
});
