import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// /viaje, /ca/viaje y /ar/viaje (rediseño 2026-10, fase 4). Describen el Viaje
// V1, que es lo que reciben hoy los clientes (aprobados.md, tanda del 11/10):
// nada del V2 y nada de «cada noche» (PENDIENTES B24). España: vosotros a los
// que viajan; Argentina: de vos, como siempre. Precio de la región del idioma;
// sin precio cargado, la página no vende.

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
const PROHIBIDO = ["cada noche", "Cada noche", "cada nit", "9 días", "RESEÑA", "Kids", "los dos", "álbum de 20", "contigo"];

describe("la página de Viaje por idioma", () => {
  it("es estática en las tres versiones", () => {
    for (const p of [ViajeEs, ViajeCa, ViajeAr]) expect(p()).not.toBeInstanceOf(Promise);
  });

  it("en /viaje (España): vosotros a los que viajan, en euros, a /comprar/viaje", () => {
    const html = renderToStaticMarkup(ViajeEs());
    expect(html).toContain('lang="es-ES"');
    expect(html).toContain(escapar("Un biógrafo que viaja con vosotros por WhatsApp."));
    expect(html).not.toContain("Cada ciudad, un capítulo"); // Naza lo quitó (06/10 y 14/10)
    expect(html).toContain(escapar("Lo pagas una vez, antes de salir."));
    expect(html).toContain(escapar("Si el viaje se cancela, te devolvemos el dinero."));
    expect(html).toContain('href="/comprar/viaje"');
    expect(html).toContain("€");
    // El bot de Viaje V1 escribe en rioplatense: la página de España no promete trato.
    expect(html).not.toContain(escapar("¿Me trata de vos?"));
    expect(html).not.toMatch(/con vos(?!otros)/);
    for (const p of PROHIBIDO) expect(sinSolapas(html), p).not.toContain(escapar(p));
  });

  it("en /ar/viaje: de vos, como siempre, en pesos, a /ar/comprar/viaje", () => {
    const html = renderToStaticMarkup(ViajeAr());
    expect(html).toContain('lang="es-AR"');
    expect(html).toContain(escapar("Un biógrafo que viaja con vos por WhatsApp."));
    expect(html).toContain(escapar("Sí. Es tu biógrafo: te habla como te hablaría un amigo que viaja con vos. En castellano."));
    expect(html).toContain(escapar("Empezar mi Vitácora de viaje"));
    expect(html).toContain('href="/ar/comprar/viaje"');
    expect(html).not.toContain("€");
    for (const p of PROHIBIDO) expect(sinSolapas(html), p).not.toContain(escapar(p));
  });

  it("en /ca/viaje: en catalán, dice que el biógrafo escribe en castellano, a /ca/comprar/viaje", () => {
    const html = renderToStaticMarkup(ViajeCa());
    expect(html).toContain('lang="ca-ES"');
    expect(html).toContain(escapar("En castellà."));
    expect(html).toContain('href="/ca/comprar/viaje"');
    for (const p of PROHIBIDO) expect(sinSolapas(html), p).not.toContain(escapar(p));
  });

  // 15/10: Viaje con su color (noche y azul de la guía), por alcance: el contenedor lleva
  // data-producto="viaje" y _direccion/viaje.css reparte los --viaje-*. La portada de Familiar no
  // lo lleva en la página (solo en su bloque de Viaje), así su papel y su tinta no cambian.
  it("lleva la paleta de Viaje por data-producto en el contenedor, y la portada no", () => {
    for (const p of [ViajeEs, ViajeCa, ViajeAr]) {
      expect(renderToStaticMarkup(p())).toMatch(/<div[^>]*data-producto="viaje"[^>]*class="dir-pagina/);
    }
    const portada = renderToStaticMarkup(Home());
    expect(portada).not.toMatch(/<div[^>]*data-producto="viaje"[^>]*class="dir-pagina/);
    expect(portada.split('data-producto="viaje"').length - 1).toBe(1);
  });

  it("la garantía de Viaje va una sola vez, en las preguntas", () => {
    for (const p of [ViajeEs, ViajeAr]) {
      const html = renderToStaticMarkup(p());
      expect(html.split(escapar("te devolvemos el dinero")).length - 1).toBe(1);
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
