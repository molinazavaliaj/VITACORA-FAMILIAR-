import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Linkear el regalo (Naza, 11/10; desde el 26/10 va a /comprar?regalo=1): un link chico en la landing y una línea en el
// paso 1 de /comprar cuando la historia es de otra persona. Textos aprobados.

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});

import { LinkRegalarLanding, SugerenciaRegalo } from "../src/app/link-regalar";
import PortadaAr from "../src/app/ar/page";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

describe("el link a /regalar", () => {
  it("en la landing, un link chico con el texto aprobado", () => {
    const html = renderToStaticMarkup(<LinkRegalarLanding />);
    expect(html).toMatch(/<a[^>]*href="\/comprar\?regalo=1"/);
    expect(html).toContain(escapar("Regalalo con una tarjeta →"));
  });

  // La portada es por idioma desde el rediseño (13/10): la de Argentina lleva
  // a /regalar en su versión, /ar/regalar.
  it("la landing lo muestra", () => {
    process.env.PRECIO_ARS ??= "65000";
    const html = renderToStaticMarkup(PortadaAr());
    expect(html).toContain('href="/ar/comprar?regalo=1"');
    expect(html).toContain(escapar("Regalalo con una tarjeta →"));
  });

  it("con idioma, va a /regalar en ese idioma", () => {
    expect(renderToStaticMarkup(<LinkRegalarLanding idioma="es" />)).toMatch(/href="\/comprar\?regalo=1"[^>]*>Regálalo con una tarjeta →/);
    expect(renderToStaticMarkup(<LinkRegalarLanding idioma="ca" />)).toContain('href="/ca/comprar?regalo=1"');
  });

  it("en /comprar, la línea para quien regala, con el link en «Regalalo con una tarjeta»", () => {
    const html = renderToStaticMarkup(<SugerenciaRegalo />);
    expect(html.replace(/<[^>]+>/g, "")).toBe(escapar("¿Querés que sea una sorpresa? Regalalo con una tarjeta. No hace falta su WhatsApp."));
    expect(html).toMatch(/<a[^>]*href="\/comprar\?regalo=1"[^>]*>Regalalo con una tarjeta<\/a>/);
  });
});

describe("el regalo es uno solo, en /comprar (26/10)", () => {
  it("?regalo=1 llega con el regalo elegido", async () => {
    const { vieneParaRegalar } = await import("../src/app/_checkout/memoria");
    expect(vieneParaRegalar("?regalo=1")).toBe(true);
    expect(vieneParaRegalar("?regalo=0")).toBe(false);
    expect(vieneParaRegalar("")).toBe(false);
  });

  it("/regalar, /ca/regalar y /ar/regalar van a /comprar de su idioma, antes que el desvío por país", async () => {
    const { default: config } = await import("../next.config");
    const reglas = await config.redirects!();
    const de = (source: string) => reglas.findIndex((r) => r.source === source);
    expect(reglas.find((r) => r.source === "/regalar")?.destination).toBe("/comprar?regalo=1");
    expect(reglas.find((r) => r.source === "/ca/regalar")?.destination).toBe("/ca/comprar?regalo=1");
    expect(reglas.find((r) => r.source === "/ar/regalar")?.destination).toBe("/ar/comprar?regalo=1");
    expect(de("/regalar")).toBeLessThan(de("/comprar"));
  });
});