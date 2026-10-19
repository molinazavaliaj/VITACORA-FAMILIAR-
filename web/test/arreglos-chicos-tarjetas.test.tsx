import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { textosAbuelo, textosComprador } from "../src/lib/regalo-textos";
import type { RegaloPublico } from "../src/lib/regalo-datos";
import { largoEnTarjeta } from "../src/lib/regalo";

// La tarjeta del regalo de Kids y de Viaje (arreglos chicos, 18/10; maquetas
// `TarjetaKids` y `TarjetaViaje`): la página y la imagen eligen la tarjeta por
// lo que se regaló (`producto`, de narradores.contexto.modo). Sin base
// (leerRegalo mockeado) y con un QR de mentira, como regalo-tarjeta.test.tsx.
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
  redirect: (url: string) => { throw new Error(`NEXT_REDIRECT ${url}`); },
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

import { textosTarjetaProducto } from "../src/app/_textos/tarjeta-regalo";

const regalo = (extra: Partial<RegaloPublico> = {}): RegaloPublico => ({
  codigo: "VF-7K3M2Q",
  nombre: "Nicolás Rivas",
  comoLeDicen: "Nico",
  idioma: "es-ES",
  region: "ES",
  quienRegala: "Tus padres",
  mensaje: "Para que dentro de muchos años sepas cómo eras a los once.",
  tieneAudio: false,
  usado: false,
  producto: "kids",
  ...extra,
});

async function render() {
  const el = await (PaginaTarjeta as unknown as (p: { params: Promise<{ codigo: string }> }) => Promise<ReactElement>)({
    params: Promise.resolve({ codigo: "VF-7K3M2Q" }),
  });
  return renderToStaticMarkup(el);
}
async function imagen(): Promise<string> {
  estado.imagen = null;
  await GET(new Request("http://localhost/regalo/VF-7K3M2Q/imagen"), { params: Promise.resolve({ codigo: "VF-7K3M2Q" }) });
  return renderToStaticMarkup(estado.imagen as ReactElement);
}
const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const VOSEO = /\b(celular|acá|tenés|Contestás|mandás|Apuntá)\b/;

beforeEach(() => {
  estado.regalo = regalo();
  estado.numero = { digitos: "34600000000", legible: "+34 600 00 00 00" };
  estado.codigos = [];
  estado.qrs = [];
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sin red")));
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("la tarjeta de Kids", () => {
  it("la tapa, el qué es, el mensaje, y el mismo QR y código que Familiar", async () => {
    const html = await render();
    const t = textosTarjetaProducto("kids", "es-ES");
    for (const f of ["Vitácora Kids", "Un regalo de Tus padres", "Nico,", "vas a escribir", "tu primer libro.", t.bajada, t.queEsTitulo, ...t.pasos, "Unas palabras", t.pie, regalo().mensaje]) {
      expect(html, f).toContain(escapar(f));
    }
    expect(html).toContain("QRFALSO");
    expect(estado.qrs).toEqual(["https://www.vitacorafamiliar.com/regalo/VF-7K3M2Q"]);
    expect(html).toContain("VF-7K3M2Q");
    expect(html).toContain(escapar("Apunta la cámara del móvil aquí para empezar."));
    expect(html).toContain("+34");
    // No es la de Familiar.
    expect(html).not.toContain("FAMILIAR");
    expect(html).not.toContain(escapar("Esto es un regalo."));
    expect(html).not.toMatch(VOSEO);
  });

  it("nada de comunión ni de fechas: el regalo empieza cuando escribe", async () => {
    const html = await render();
    expect(html).not.toMatch(/comuni[oó]n|24 de diciembre|cada noche/i);
  });

  it("de vos para la Argentina y en catalán para Cataluña", async () => {
    estado.regalo = regalo({ idioma: "es-AR", region: "AR" });
    const ar = await render();
    expect(ar).toContain(escapar("Solo tenés que contarlo con audios."));
    expect(ar).toContain(escapar("Apuntá la cámara del celular acá para empezar."));
    estado.regalo = regalo({ idioma: "ca" });
    const ca = await render();
    expect(ca).toContain(escapar("Volem saber com és el teu món."));
    expect(ca).toContain('lang="ca"');
  });

  it("la imagen para WhatsApp lleva el titular y el qué es de Kids", async () => {
    const html = await imagen();
    expect(html).toContain("vas a escribir");
    expect(html).toContain(escapar(textosTarjetaProducto("kids", "es-ES").queEsTitulo));
    expect(html).not.toContain(escapar("Esto es un regalo."));
    expect(html).toContain("VF-7K3M2Q");
  });
});

describe("la tarjeta de Viaje", () => {
  beforeEach(() => {
    estado.regalo = regalo({ producto: "viaje", comoLeDicen: "Sara y Dani", quienRegala: "Laura y Pablo", mensaje: "Para la luna de miel que tanto habéis esperado." });
  });

  it("su tapa y sus pasos, sin prometer «cada noche»", async () => {
    const html = await render();
    const t = textosTarjetaProducto("viaje", "es-ES");
    for (const f of ["Vitácora de viaje", "Un regalo para el viaje", "Sara y Dani,", "este viaje", "va a ser un libro.", t.queEsTitulo, ...t.pasos, t.pie, "Laura y Pablo"]) {
      expect(html, f).toContain(escapar(f));
    }
    expect(html).not.toMatch(/cada noche|primer día/i);
    expect(html).not.toMatch(VOSEO);
  });

  it("de vos en la Argentina", async () => {
    estado.regalo = { ...(estado.regalo as RegaloPublico), idioma: "es-AR", region: "AR" };
    const html = await render();
    expect(html).toContain(escapar("Este viaje no se va a quedar en el celular."));
    const img = await imagen();
    expect(img).toContain(escapar("Este viaje no se va a quedar en el celular."));
  });
});

describe("Familiar tiene su propia tarjeta", () => {
  it("con producto familiar sale la tarjeta negra «El libro de tu vida» (19/10), no la de Kids ni Viaje", async () => {
    estado.regalo = regalo({ producto: "familiar", idioma: "es-AR", region: "AR" });
    const html = await render();
    expect(html).toContain("FAMILIAR");
    expect(html).toContain("Regalar una Vitácora");
    expect(html).not.toContain('class="cara prd-');
  });
});

describe("el producto sale de contexto.modo", () => {
  it("viaje y kids; lo demás, familiar", async () => {
    const { productoDeModo } = await vi.importActual<typeof import("../src/lib/regalo-datos")>("../src/lib/regalo-datos");
    expect(productoDeModo("viaje")).toBe("viaje");
    expect(productoDeModo("kids")).toBe("kids");
    expect(productoDeModo(undefined)).toBe("familiar");
    expect(productoDeModo("otra")).toBe("familiar");
  });

  it("ninguna frase nueva lleva dos puntos ni empieza con «Y»", () => {
    for (const producto of ["kids", "viaje"] as const) {
      for (const idioma of ["es-ES", "es-AR", "ca"] as const) {
        const t = textosTarjetaProducto(producto, idioma);
        const frases = [t.bajada, t.queEsTitulo, ...t.pasos, t.pie, t.etiqueta("X"), ...t.titulo("X")];
        for (const f of frases) {
          expect(f, f).not.toContain(":");
          expect(f, f).not.toMatch(/\. Y /);
        }
      }
    }
  });
});
