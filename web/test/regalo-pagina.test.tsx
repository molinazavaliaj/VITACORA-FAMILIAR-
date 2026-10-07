import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TEXTOS_REGALO } from "../src/lib/regalo-textos";
import type { RegaloPublico } from "../src/lib/regalo-datos";

// Gift card: la página que abre el QR, renderizada sin base (leerRegalo mockeado).
const estado = vi.hoisted(() => ({
  regalo: null as RegaloPublico | null,
  numero: null as { digitos: string; legible: string } | null,
  codigos: [] as string[],
}));

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
}));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: () => ({}) }));
vi.mock("@/lib/regalo-datos", () => ({
  leerRegalo: async (_admin: unknown, codigo: string) => { estado.codigos.push(codigo); return estado.regalo; },
  numeroPublico: () => estado.numero,
}));

import PaginaRegalo from "../src/app/regalo/[codigo]/page";

const regalo = (extra: Partial<RegaloPublico> = {}): RegaloPublico => ({
  codigo: "VF-7K3M2Q",
  nombre: "Osvaldo",
  comoLeDicen: "abuelo",
  quienRegala: "Lucía",
  mensaje: "Quiero tu historia para siempre.",
  tieneAudio: false,
  usado: false,
  ...extra,
});

async function render(codigo = "VF-7K3M2Q") {
  const el = await (PaginaRegalo as unknown as (p: { params: Promise<{ codigo: string }> }) => Promise<ReactElement>)({
    params: Promise.resolve({ codigo }),
  });
  return renderToStaticMarkup(el);
}

describe("la página del regalo", () => {
  beforeEach(() => {
    estado.regalo = regalo();
    estado.numero = { digitos: "5491100000000", legible: "+54 9 11 0000 0000" };
    estado.codigos = [];
  });

  it("sin usar y con número: el título, el mensaje, lo que va a pasar y el botón a WhatsApp", async () => {
    const html = await render();
    expect(html).toContain("abuelo, Lucía te hizo un regalo.");
    expect(html).toContain("Quiero tu historia para siempre.");
    for (const linea of TEXTOS_REGALO.explica) expect(html).toContain(linea);
    expect(html).toMatch(/href="https:\/\/wa\.me\/5491100000000\?text=/);
    expect(html).toContain(`>${TEXTOS_REGALO.empezar}<`);
    expect(html).not.toContain(TEXTOS_REGALO.yaEmpezo);
  });

  it("usado: dice que ya está en marcha en lugar de explicar", async () => {
    estado.regalo = regalo({ usado: true });
    const html = await render();
    expect(html).toContain(TEXTOS_REGALO.yaEmpezo);
    expect(html).not.toContain(TEXTOS_REGALO.explica[0]);
  });

  it("sin número público: no hay link a wa.me y aparece el código", async () => {
    estado.numero = null;
    const html = await render();
    expect(html).not.toContain("wa.me");
    expect(html).toContain("VF-7K3M2Q");
  });

  it("con audio: un reproductor que apunta al endpoint, sin autoplay y sin precargar", async () => {
    estado.regalo = regalo({ tieneAudio: true });
    const html = await render();
    expect(html).toContain('src="/api/regalo/VF-7K3M2Q/audio"');
    expect(html).toContain('preload="none"');
    expect(html).not.toMatch(/autoplay/i);
  });

  it("sin audio: no hay reproductor", async () => {
    const html = await render();
    expect(html).not.toContain("<audio");
  });

  it("el código de la URL llega decodificado a leerRegalo", async () => {
    await render("vf%207k3m2q");
    expect(estado.codigos).toEqual(["vf 7k3m2q"]);
  });

  it("un % mal formado en la URL no rompe: llega tal cual a leerRegalo", async () => {
    await render("VF-%E0%A4%A");
    expect(estado.codigos).toEqual(["VF-%E0%A4%A"]);
  });

  it("si leerRegalo devuelve null, llama a notFound", async () => {
    estado.regalo = null;
    await expect(render()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
