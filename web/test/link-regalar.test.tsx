import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Linkear /regalar (Naza, 11/10): un link chico en la landing y una línea en el
// paso 1 de /comprar cuando la historia es de otra persona. Textos aprobados.

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-vercel-ip-country": "AR" }) }));

import { LinkRegalarLanding, SugerenciaRegalo } from "../src/app/link-regalar";
import Home from "../src/app/page";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

describe("el link a /regalar", () => {
  it("en la landing, un link chico con el texto aprobado", () => {
    const html = renderToStaticMarkup(<LinkRegalarLanding />);
    expect(html).toMatch(/<a[^>]*href="\/regalar"/);
    expect(html).toContain(escapar("Regalalo con una tarjeta →"));
  });

  it("la landing lo muestra", async () => {
    process.env.PRECIO_ARS ??= "65000";
    const html = renderToStaticMarkup(await (Home as unknown as () => Promise<ReactElement>)());
    expect(html).toContain('href="/regalar"');
    expect(html).toContain(escapar("Regalalo con una tarjeta →"));
  });

  it("en /comprar, la línea para quien regala, con el link en «Regalalo con una tarjeta»", () => {
    const html = renderToStaticMarkup(<SugerenciaRegalo />);
    expect(html.replace(/<[^>]+>/g, "")).toBe(escapar("¿Querés que sea una sorpresa? Regalalo con una tarjeta. No hace falta su WhatsApp."));
    expect(html).toMatch(/<a[^>]*href="\/regalar"[^>]*>Regalalo con una tarjeta<\/a>/);
  });
});
