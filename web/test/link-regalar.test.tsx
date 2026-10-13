import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Linkear /regalar (Naza, 11/10): un link chico en la landing y una línea en el
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
    expect(html).toMatch(/<a[^>]*href="\/regalar"/);
    expect(html).toContain(escapar("Regalalo con una tarjeta →"));
  });

  // La portada es por idioma desde el rediseño (13/10): la de Argentina lleva
  // a /regalar en su versión, /ar/regalar.
  it("la landing lo muestra", () => {
    process.env.PRECIO_ARS ??= "65000";
    const html = renderToStaticMarkup(PortadaAr());
    expect(html).toContain('href="/ar/regalar"');
    expect(html).toContain(escapar("Regalalo con una tarjeta →"));
  });

  it("con idioma, va a /regalar en ese idioma", () => {
    expect(renderToStaticMarkup(<LinkRegalarLanding idioma="es" />)).toMatch(/href="\/regalar"[^>]*>Regálalo con una tarjeta →/);
    expect(renderToStaticMarkup(<LinkRegalarLanding idioma="ca" />)).toContain('href="/ca/regalar"');
  });

  it("en /comprar, la línea para quien regala, con el link en «Regalalo con una tarjeta»", () => {
    const html = renderToStaticMarkup(<SugerenciaRegalo />);
    expect(html.replace(/<[^>]+>/g, "")).toBe(escapar("¿Querés que sea una sorpresa? Regalalo con una tarjeta. No hace falta su WhatsApp."));
    expect(html).toMatch(/<a[^>]*href="\/regalar"[^>]*>Regalalo con una tarjeta<\/a>/);
  });
});
