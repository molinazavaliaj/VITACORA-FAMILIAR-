import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { textosAbuelo } from "../src/lib/regalo-textos";
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

const AR = textosAbuelo("es-AR");

const regalo = (extra: Partial<RegaloPublico> = {}): RegaloPublico => ({
  codigo: "VF-7K3M2Q",
  nombre: "Osvaldo",
  comoLeDicen: "abuelo",
  idioma: "es-AR",
  region: "AR",
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
    for (const linea of AR.explica) expect(html).toContain(linea);
    expect(html).toMatch(/href="https:\/\/wa\.me\/5491100000000\?text=/);
    expect(html).toContain(`>${AR.empezar}<`);
    expect(html).not.toContain(AR.yaEmpezo);
  });

  it("en catalán: el título, lo que va a pasar, el botón y el mensaje de WhatsApp en catalán", async () => {
    estado.regalo = regalo({ idioma: "ca" });
    const html = await render();
    expect(html).toContain("abuelo, Lucía t&#x27;ha fet un regal.");
    expect(html).toContain("Tu li respons amb àudios, quan puguis.");
    expect(html).toContain(">Començar<");
    expect(html).toContain(`href="https://wa.me/5491100000000?text=${encodeURIComponent("Hola, vull començar el meu llibre. VF-7K3M2Q")}"`);
    expect(html).not.toContain("Vos");
  });

  it("en catalán y usado: «ja està en marxa»", async () => {
    estado.regalo = regalo({ idioma: "ca", usado: true });
    const html = await render();
    expect(html).toContain("Aquest regal ja està en marxa. Per continuar, escriu-li al biògraf per WhatsApp.");
  });

  it("en catalán con audio: el botón se llama en catalán", async () => {
    estado.regalo = regalo({ idioma: "ca", tieneAudio: true });
    const html = await render();
    expect(html).toContain('aria-label="Escoltar l&#x27;àudio de Lucía"');
  });

  it("en castellano de España: el título y el mensaje de WhatsApp de tú", async () => {
    estado.regalo = regalo({ idioma: "es-ES" });
    const html = await render();
    expect(html).toContain("abuelo, Lucía te ha hecho un regalo.");
    expect(html).toContain("Tú le contestas con audios, cuando puedas.");
    expect(html).toContain(`text=${encodeURIComponent("Hola, quiero empezar mi libro. VF-7K3M2Q")}"`);
  });

  it("usado: dice que ya está en marcha en lugar de explicar", async () => {
    estado.regalo = regalo({ usado: true });
    const html = await render();
    expect(html).toContain(AR.yaEmpezo);
    expect(html).not.toContain(AR.explica[0]);
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
    expect(html).toContain('aria-label="Escuchar el audio de Lucía"');
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
