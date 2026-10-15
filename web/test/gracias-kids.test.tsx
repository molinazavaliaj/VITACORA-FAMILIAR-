import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// «Pedido confirmado» de Vitácora Kids (15/10): con la sesión de quien compró,
// si el narrador tiene su fila en kids_v2 la lista de qué pasa ahora es la de
// Kids, según el canal (A = su WhatsApp, B = «Lo hago yo»). Sin fila, la de la
// biografía de siempre. Textos aprobados por Naza el 15/10, literales.

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));
vi.mock("@/lib/supabase/sesion", () => ({ usuarioDeLaSesion: vi.fn(async () => ({ id: "u1", email: "martina@ejemplo.com" })), crearClienteSesion: vi.fn() }));

const NARRADOR = "11111111-2222-4333-8444-555555555555";
const base = vi.hoisted(() => ({ canal: null as "A" | "B" | null, entrega: false }));

vi.mock("@/lib/panel", async (original) => ({
  ...(await original<typeof import("@/lib/panel")>()),
  esPropia: () => false,
  historiaAccesible: async () => ({
    historia: { rol: "duena", narrador: { id: "11111111-2222-4333-8444-555555555555", nombre: "Tomás", como_le_dicen: "Tomi", estado: "invitado" } },
  }),
}));

vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: () => ({
    from: (tabla: string) => {
      const cadena: Record<string, unknown> = {};
      for (const m of ["select", "eq", "order", "limit"]) cadena[m] = () => cadena;
      cadena.maybeSingle = async () => ({
        data: tabla === "kids_v2" && base.canal ? { canal: base.canal } : tabla === "entregas" && base.entrega ? { id: "ent-1", estado: "sin_direccion" } : null,
        error: null,
      });
      return cadena;
    },
  }),
}));

import Gracias from "../src/app/comprar/gracias/page";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const pagina = async () =>
  renderToStaticMarkup(
    await (Gracias as unknown as (p: { searchParams: Promise<Record<string, string>> }) => Promise<ReactElement>)({ searchParams: Promise.resolve({ n: NARRADOR, idioma: "ar" }) }),
  );

const A = "A la hora que elegiste le llega a Tomi un mensaje nuestro por WhatsApp. Avisale que le va a escribir «Vitácora».";
const B = "Te llega un mensaje nuestro a tu WhatsApp. La primera pregunta sale cuando toquen el botón, juntos.";
const BIOGRAFIA_HOY = "En un rato le llega un mensaje nuestro por WhatsApp, contándole de qué se trata. Arranca cuando quiera.";
const BIOGRAFIA_ANTES = "Avisale a Tomi que le va a escribir «Vitácora» por WhatsApp.";

beforeEach(() => {
  base.canal = null;
  base.entrega = false;
});

describe("«Pedido confirmado» de Vitácora Kids", () => {
  it("canal A: la fila del A, sin las de la biografía", async () => {
    base.canal = "A";
    const html = await pagina();
    expect(html).toContain(escapar(A));
    expect(html).not.toContain(escapar(B));
    expect(html).not.toContain(escapar(BIOGRAFIA_HOY));
    expect(html).not.toContain(escapar(BIOGRAFIA_ANTES));
    expect(html).toContain(escapar("Listo. El libro de Tomi está en marcha."));
  });

  it("canal B: la fila del B, sin las de la biografía", async () => {
    base.canal = "B";
    const html = await pagina();
    expect(html).toContain(escapar(B));
    expect(html).not.toContain(escapar(A));
    expect(html).not.toContain(escapar(BIOGRAFIA_HOY));
    expect(html).not.toContain(escapar(BIOGRAFIA_ANTES));
  });

  it("con el libro impreso (tanda 3, punto 10): «Al terminar» suma la línea de la imprenta de la casa", async () => {
    const IMPRENTA = "Te avisamos cuando salga de imprenta y te mandamos el seguimiento.";
    base.canal = "B";
    expect(await pagina()).not.toContain(escapar(IMPRENTA));
    base.entrega = true;
    const html = await pagina();
    expect(html).toContain(escapar(B));
    expect(html).toContain(escapar(IMPRENTA));
  });

  it("sin fila en kids_v2 (la biografía): la lista de siempre", async () => {
    const html = await pagina();
    expect(html).toContain(escapar(BIOGRAFIA_HOY));
    expect(html).toContain(escapar(BIOGRAFIA_ANTES));
    expect(html).not.toContain(escapar(A));
    expect(html).not.toContain(escapar(B));
  });
});
