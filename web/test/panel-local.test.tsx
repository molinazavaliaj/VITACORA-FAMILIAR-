import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { textosPanelLocal } from "../src/lib/carta-textos";

// Panel del local: server component sin login, con la base mockeada por tabla.
const TOKEN_BUENO = "token-bueno";
const tablas: Record<string, unknown[]> = {
  lotes_impresos: [{ cantidad: 10 }, { cantidad: 5 }],
  pedidos: [
    { created_at: "2026-10-03T12:00:00Z", comision_local: 1.5, monto: 19, moneda: "EUR" },
    { created_at: "2026-10-10T12:00:00Z", comision_local: 1.5, monto: 19, moneda: "EUR" },
  ],
};

const errores: Record<string, string> = {};
const filtrosNeq: Record<string, unknown> = {};

function consulta(tabla: string) {
  const q: Record<string, unknown> = {};
  const fila = () => (tabla === "locales" ? (q._token === TOKEN_BUENO ? { id: "L1", nombre: "Copistería Berga", idioma: "ca", pais: "ES" } : null) : null);
  q.select = () => q;
  q.eq = (col: string, val: unknown) => { if (col === "token_panel") q._token = val; return q; };
  q.in = () => q;
  q.neq = (col: string, val: unknown) => { q._neq = [col, val]; return q; };
  q.maybeSingle = async () => ({ data: fila(), error: null });
  q.then = (res: (v: unknown) => unknown) => {
    if (errores[tabla]) return res({ data: null, error: { message: errores[tabla] } });
    filtrosNeq[tabla] = q._neq;
    return res({ data: tablas[tabla] ?? [], error: null });
  };
  return q;
}

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
}));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: () => ({ from: consulta }) }));

import PanelLocal from "../src/app/local/[token]/page";

async function render(token: string) {
  const el = await (PanelLocal as unknown as (p: { params: Promise<{ token: string }> }) => Promise<ReactElement>)({
    params: Promise.resolve({ token }),
  });
  return renderToStaticMarkup(el);
}

describe("el panel del local", () => {
  it("con el token bueno muestra sobres, el mes con sus cartas y lo que le toca", async () => {
    const html = await render(TOKEN_BUENO);
    const t = textosPanelLocal("ca");
    expect(html).toContain(t.titulo("Copistería Berga"));
    expect(html).toContain(t.sobres(15));
    expect(html).toContain("2026-10");
    expect(html).toContain(">2<");
    const total = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(3);
    expect(html).toContain(total);
    expect(html).toContain(t.pago);
  });

  it("con un token desconocido da 404", async () => {
    await expect(render("otro")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("sin ventas dice que todavía no hay", async () => {
    tablas.pedidos = [];
    const html = await render(TOKEN_BUENO);
    expect(html).toContain(textosPanelLocal("ca").sinVentas.replace("'", "&#x27;"));
  });

  it("cuenta todo lo que no está pendiente (también fallido)", async () => {
    await render(TOKEN_BUENO);
    expect(filtrosNeq.pedidos).toEqual(["estado", "pendiente"]);
  });

  it.each(["lotes_impresos", "pedidos"])("si falla la consulta de %s, no muestra ceros: tira el error", async (tabla) => {
    errores[tabla] = "base caída";
    try {
      await expect(render(TOKEN_BUENO)).rejects.toThrow("base caída");
    } finally {
      delete errores[tabla];
    }
  });
});
