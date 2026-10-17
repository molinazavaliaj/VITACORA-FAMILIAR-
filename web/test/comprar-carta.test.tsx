import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("../src/app/comprar/formulario", () => ({
  Checkout: (p: { carta?: string | null }) => `<carta:${p.carta ?? "null"}>`,
}));

import PaginaComprar from "../src/app/comprar/page";

type Pagina = (p?: { searchParams?: Promise<{ carta?: string | string[] }> }) => Promise<ReactElement>;
async function render(searchParams?: { carta?: string | string[] }) {
  const el = await (PaginaComprar as unknown as Pagina)(searchParams ? { searchParams: Promise.resolve(searchParams) } : undefined);
  return renderToStaticMarkup(el);
}

describe("/comprar?carta=", () => {
  it("con un código válido, Checkout lo recibe", async () => {
    expect(await render({ carta: "VF-7K3M2Q" })).toContain("&lt;carta:VF-7K3M2Q&gt;");
  });
  it("sin parámetro o sin llamar con args, recibe null", async () => {
    expect(await render({})).toContain("&lt;carta:null&gt;");
    expect(await render()).toContain("&lt;carta:null&gt;");
  });
  it("un código mal formado o repetido se descarta", async () => {
    expect(await render({ carta: "hola" })).toContain("&lt;carta:null&gt;");
    expect(await render({ carta: "VF-7K3M2Q9" })).toContain("&lt;carta:null&gt;");
    expect(await render({ carta: ["VF-7K3M2Q", "VF-AAAAAA"] })).toContain("&lt;carta:null&gt;");
  });
});
