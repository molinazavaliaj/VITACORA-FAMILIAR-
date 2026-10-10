import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { textosAbuelo, textosComprador } from "../src/lib/regalo-textos";
import type { RegaloPublico } from "../src/lib/regalo-datos";
import { largoEnTarjeta } from "../src/lib/regalo";

// Gift card: la tarjeta imprimible y la imagen para WhatsApp, sin base
// (leerRegalo mockeado) y con un QR de mentira.
const estado = vi.hoisted(() => ({
  regalo: null as RegaloPublico | null,
  numero: null as { digitos: string; legible: string } | null,
  codigos: [] as string[],
  qrs: [] as string[],
  imagen: null as unknown,
  tratos: [] as string[],
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
// La imagen: se guarda el árbol que recibe ImageResponse para leer sus textos.
vi.mock("next/og", () => ({
  ImageResponse: class {
    status = 200;
    constructor(public elemento: unknown) { estado.imagen = elemento; }
  },
}));
// Los botones de pantalla dicen lo mismo en vos y en tú: se mira con qué trato se pidieron.
vi.mock("@/lib/regalo-textos", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/lib/regalo-textos")>();
  return {
    ...real,
    textosComprador: (trato: Parameters<typeof real.textosComprador>[0]) => { estado.tratos.push(trato); return real.textosComprador(trato); },
  };
});
vi.mock("@/lib/qr", () => ({
  qrDataUri: async (texto: string) => { estado.qrs.push(texto); return "data:image/png;base64,QRFALSO"; },
  urlRegalo: (codigo: string) => `https://www.vitacorafamiliar.com/regalo/${codigo}`,
}));

import PaginaTarjeta from "../src/app/regalo/[codigo]/tarjeta/page";
import { GET } from "../src/app/regalo/[codigo]/imagen/route";

const AR = textosAbuelo("es-AR");
const VOS = textosComprador("vos");

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
    estado.tratos = [];
  });

  it("lleva la tapa, el mensaje, las líneas aprobadas, el QR y el código", async () => {
    const html = await render();
    expect(html).toContain(AR.tapaSlogan);
    expect(html).toContain("abuelo,");
    expect(html).toContain("Quiero tu historia para siempre.");
    expect(html).toContain(">Lucía<");
    expect(html).toContain(AR.esUnRegalo);
    for (const linea of AR.explica) expect(html).toContain(linea);
    expect(html).toContain(AR.apunta);
    expect(html).toContain(AR.respaldo("+54\u00A09\u00A011\u00A00000\u00A00000"));
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
    expect(html).toContain(VOS.botonImprimir);
    expect(html).toContain(VOS.botonImagen);
    expect(html).toMatch(/href="\/regalo\/VF-7K3M2Q\/imagen"/);
  });

  it("en catalán: las frases impresas en catalán y nada de vos", async () => {
    estado.regalo = regalo({ idioma: "ca" });
    const html = await render();
    expect(html).toContain("A cada família hi ha un llibre per escriure.");
    expect(html).toContain("Tu li respons amb àudios, quan puguis.");
    expect(html).toContain("Apunta la càmera del mòbil aquí per començar.");
    expect(html).toContain(textosAbuelo("ca").respaldo("+54 9 11 0000 0000"));
    expect(html).toContain("Això és un regal.");
    expect(html).not.toContain("Vos");
    expect(html).not.toContain(AR.apunta);
  });

  it("en castellano de España: las frases de tú y nada de vos", async () => {
    estado.regalo = regalo({ idioma: "es-ES" });
    const html = await render();
    expect(html).toContain("En cada familia hay un libro sin escribir.");
    expect(html).toContain("Tú le contestas con audios, cuando puedas.");
    expect(html).toContain("Apunta la cámara del móvil aquí para empezar.");
    expect(html).toContain(textosAbuelo("es-ES").respaldo("+54 9 11 0000 0000"));
    expect(html).not.toContain("Vos");
    expect(html).not.toContain(AR.apunta);
  });

  it("en catalán: solo la tarjeta va en lang=ca; los botones y los nombres de las hojas, en es", async () => {
    estado.regalo = regalo({ idioma: "ca" });
    const html = await render();
    expect(html).toMatch(/^<div lang="es"/);
    expect(html.match(/class="tarjeta" lang="ca"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Lado de afuera"');
  });

  // Revisión final (09/10): los botones los lee quien compra, así que siguen su
  // región (familias.region), no el idioma del regalo.
  for (const [region, idioma, trato] of [
    ["ES", "es-AR", "tu"],
    ["ES", "ca", "tu"],
    ["AR", "ca", "vos"],
    ["AR", "es-ES", "vos"],
    [null, "es-ES", "vos"],
  ] as const) {
    it(`los botones de pantalla siguen a quien compra: región ${region ?? "sin dato"}, regalo en ${idioma} → ${trato}`, async () => {
      estado.regalo = regalo({ idioma, region });
      const html = await render();
      expect(estado.tratos).toEqual([trato]);
      expect(html).toContain(textosComprador(trato).botonImprimir);
      expect(html).toContain(textosComprador(trato).botonImagen);
    });
  }

  it("es-AR sigue idéntica a hoy, con las frases aprobadas literales", async () => {
    const html = await render();
    expect(html).toContain("En cada familia hay un libro sin escribir.");
    expect(html).toContain("Vos le contestás con audios, cuando puedas.");
    expect(html).toContain("Apuntá la cámara del celular acá para empezar.");
    expect(html).toContain("Si la cámara no te anda, mandá un WhatsApp al +54 9 11 0000 0000 con este código.");
    expect(html).toContain("Imprimir o guardar en PDF");
    expect(html).toContain("Descargar la imagen para WhatsApp");
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
    estado.numero = { digitos: "5491100000000", legible: "+54 9 11 0000 0000" };
    estado.codigos = [];
    // Las fuentes de Google no se bajan en los tests: la imagen sale con la de next/og.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sin red")));
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  async function textoDeLaImagen(): Promise<string> {
    estado.imagen = null;
    await GET(new Request("http://localhost/regalo/VF-7K3M2Q/imagen"), { params: Promise.resolve({ codigo: "VF-7K3M2Q" }) });
    return renderToStaticMarkup(estado.imagen as ReactElement);
  }

  it("en catalán: las frases de la tarjeta en catalán, sin vos", async () => {
    estado.regalo = regalo({ idioma: "ca" });
    estado.numero = { digitos: "34600000000", legible: "+34 600 00 00 00" };
    const html = await textoDeLaImagen();
    expect(html).toContain("Això és un regal.");
    expect(html).toContain("Tu li respons amb àudios, quan puguis.");
    expect(html).toContain("Apunta la càmera del mòbil aquí per començar.");
    expect(html).toContain("envia un WhatsApp al");
    expect(html).not.toContain("Vos");
  });

  it("en castellano de España: las frases de tú", async () => {
    estado.regalo = regalo({ idioma: "es-ES" });
    const html = await textoDeLaImagen();
    expect(html).toContain("Tú le contestas con audios, cuando puedas.");
    expect(html).toContain("Apunta la cámara del móvil aquí para empezar.");
    expect(html).not.toContain("Vos");
  });

  it("es-AR sigue con las frases aprobadas", async () => {
    const html = await textoDeLaImagen();
    expect(html).toContain("Vos le contestás con audios, cuando puedas.");
    expect(html).toContain("Apuntá la cámara del celular acá para empezar.");
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
