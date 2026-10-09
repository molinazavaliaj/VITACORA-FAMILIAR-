import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TEXTOS_REGALO } from "../src/lib/regalo-textos";
import type { RegaloPublico } from "../src/lib/regalo-datos";
import { largoEnTarjeta } from "../src/lib/regalo";

// Gift card: la tarjeta imprimible y la imagen para WhatsApp, sin base
// (leerRegalo mockeado) y con un QR de mentira.
const estado = vi.hoisted(() => ({
  regalo: null as RegaloPublico | null,
  numero: null as { digitos: string; legible: string } | null,
  codigos: [] as string[],
  qrs: [] as string[],
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
vi.mock("@/lib/qr", () => ({
  qrDataUri: async (texto: string) => { estado.qrs.push(texto); return "data:image/png;base64,QRFALSO"; },
  urlRegalo: (codigo: string) => `https://www.vitacorafamiliar.com/regalo/${codigo}`,
}));

import PaginaTarjeta from "../src/app/regalo/[codigo]/tarjeta/page";
import { GET } from "../src/app/regalo/[codigo]/imagen/route";

const regalo = (extra: Partial<RegaloPublico> = {}): RegaloPublico => ({
  codigo: "VF-7K3M2Q",
  nombre: "Osvaldo",
  comoLeDicen: "abuelo",
  idioma: "es-AR",
  quienRegala: "Lucía",
  mensaje: "Quiero tu historia para siempre.",
  tieneAudio: false,
  usado: false,
  ...extra,
});

async function render(codigo = "VF-7K3M2Q") {
  const el = await (PaginaTarjeta as unknown as (p: { params: Promise<{ codigo: string }> }) => Promise<ReactElement>)({
    params: Promise.resolve({ codigo }),
  });
  return renderToStaticMarkup(el);
}

describe("la tarjeta imprimible", () => {
  beforeEach(() => {
    estado.regalo = regalo();
    estado.numero = { digitos: "5491100000000", legible: "+54 9 11 0000 0000" };
    estado.codigos = [];
    estado.qrs = [];
  });

  it("lleva la tapa, el mensaje, las líneas aprobadas, el QR y el código", async () => {
    const html = await render();
    expect(html).toContain(TEXTOS_REGALO.tapaSlogan);
    expect(html).toContain("abuelo,");
    expect(html).toContain("Quiero tu historia para siempre.");
    expect(html).toContain(">Lucía<");
    expect(html).toContain(TEXTOS_REGALO.esUnRegalo);
    for (const linea of TEXTOS_REGALO.explica) expect(html).toContain(linea);
    expect(html).toContain(TEXTOS_REGALO.apunta);
    expect(html).toContain(TEXTOS_REGALO.respaldo("+54\u00A09\u00A011\u00A00000\u00A00000"));
    expect(html).toContain(">VF-7K3M2Q<");
    expect(html).toContain('src="data:image/png;base64,QRFALSO"');
    expect(estado.qrs).toEqual(["https://www.vitacorafamiliar.com/regalo/VF-7K3M2Q"]);
  });

  it("el número no se corta en dos renglones", async () => {
    const html = await render();
    expect(html).not.toContain("+54 9 11 0000 0000");
  });

  it("la hoja de adentro va girada 180° solo al imprimir (doble faz por el borde largo)", async () => {
    const html = await render();
    expect(html).toMatch(/class="hoja hoja-interior"/);
    expect(html).toMatch(/@media print \{[^@]*\.hoja-interior \.tarjeta \{ transform: rotate\(180deg\); \}/);
  });

  it("trae los dos botones de pantalla, el de la imagen apunta a ./imagen", async () => {
    const html = await render();
    expect(html).toContain(TEXTOS_REGALO.botonImprimir);
    expect(html).toContain(TEXTOS_REGALO.botonImagen);
    expect(html).toMatch(/href="\/regalo\/VF-7K3M2Q\/imagen"/);
  });

  it("nada violeta: solo negro sobre blanco", async () => {
    const html = (await render()).toLowerCase();
    expect(html).not.toContain("#5d3fd3");
    expect(html).not.toContain("violet");
  });

  it("sin número público no pone la línea de respaldo", async () => {
    estado.numero = null;
    const html = await render();
    expect(html).not.toContain("Si la cámara no te anda");
    expect(html).toContain(">VF-7K3M2Q<");
  });

  it("decodifica el código de la URL y, si el regalo no existe, 404", async () => {
    estado.regalo = null;
    await expect(render("VF%2D7K3M2Q")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(estado.codigos).toEqual(["VF-7K3M2Q"]);
    await expect(render("%E0%A4%A")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("largoEnTarjeta", () => {
  it("cada salto de línea cuenta como 40 letras", () => {
    expect(largoEnTarjeta("hola")).toBe(4);
    expect(largoEnTarjeta("a\nb\nc")).toBe(5 + 80);
  });
});

describe("la imagen para WhatsApp", () => {
  beforeEach(() => {
    estado.regalo = regalo();
    estado.codigos = [];
  });

  it("con un código inexistente devuelve 404", async () => {
    estado.regalo = null;
    const res = await GET(new Request("http://localhost/regalo/VF-XXXXXX/imagen"), {
      params: Promise.resolve({ codigo: "VF-XXXXXX" }),
    });
    expect(res.status).toBe(404);
    expect(estado.codigos).toEqual(["VF-XXXXXX"]);
  });
});
