import { describe, it, expect } from "vitest";
import { conMarcaDeAcceso, familiaVeLibro, familiaVeRespuestas, libroAbierto, llevaAcceso, modoAcceso } from "../src/lib/acceso-contenido";
import type { SupabaseClient } from "@supabase/supabase-js";

const marcado = (extra: Record<string, unknown> = {}) => ({ acceso: { elige: true, ...extra } });

describe("el modo de cada historia", () => {
  it("sin la marca, como siempre: nada cambia para las entrevistas en curso", () => {
    expect(modoAcceso(null)).toBe("clasico");
    expect(modoAcceso({})).toBe("clasico");
    expect(modoAcceso({ acceso: "cualquier cosa" })).toBe("clasico");
    expect(familiaVeRespuestas({})).toBe(true);
    expect(familiaVeLibro({ contexto: {}, rol: "invitado", conImpreso: true, impresoEnCasa: false })).toBe(true);
  });

  it("con la marca y sin contestar, privado: el silencio no abre nada", () => {
    expect(modoAcceso(marcado())).toBe("narrador");
    expect(familiaVeRespuestas(marcado())).toBe(false);
  });

  it("«Prefiero yo» es privado y «Mi familia» abre todo", () => {
    expect(familiaVeRespuestas(marcado({ quien: "narrador" }))).toBe(false);
    expect(modoAcceso(marcado({ quien: "familia" }))).toBe("familia");
    expect(familiaVeRespuestas(marcado({ quien: "familia" }))).toBe(true);
  });
});

describe("a quién le toca la marca", () => {
  it("Familiar e Historia para otra persona, sí", () => {
    expect(llevaAcceso({})).toBe(true);
    expect(llevaAcceso({ modo: "historia" })).toBe(true);
    expect(llevaAcceso({ regalo: true })).toBe(true);
    expect(conMarcaDeAcceso({ trato: "vos" })).toEqual({ trato: "vos", acceso: { elige: true } });
  });

  it("«para mí», Viaje y Kids, no", () => {
    expect(llevaAcceso({ vinculoComprador: "yo mismo" })).toBe(false);
    expect(llevaAcceso({ modo: "historia", vinculoComprador: "yo mismo" })).toBe(false);
    expect(llevaAcceso({ modo: "viaje" })).toBe(false);
    expect(llevaAcceso({ viaje: { salida: "2026-12-01" } })).toBe(false);
    expect(llevaAcceso({ modo: "kids" })).toBe(false);
    expect(conMarcaDeAcceso({ modo: "viaje" })).toEqual({ modo: "viaje" });
  });
});

describe("cuándo se abre el libro en modo narrador", () => {
  const base = { rol: "duena" as const, conImpreso: false, impresoEnCasa: false };

  it("solo digital, con el OK", () => {
    expect(familiaVeLibro({ ...base, contexto: marcado() })).toBe(false);
    expect(familiaVeLibro({ ...base, contexto: marcado({ revisado_at: "2026-11-05" }) })).toBe(true);
  });

  it("con impreso, cuando llega: el OK no alcanza", () => {
    const conImpreso = { ...base, conImpreso: true };
    expect(familiaVeLibro({ ...conImpreso, contexto: marcado({ revisado_at: "2026-11-05" }) })).toBe(false);
    expect(familiaVeLibro({ ...conImpreso, impresoEnCasa: true, contexto: marcado() })).toBe(true);
  });

  it("la revisión que abre soporte es solo para quien compró", () => {
    const contexto = marcado({ revisa_familia_at: "2026-11-05" });
    expect(familiaVeLibro({ ...base, conImpreso: true, contexto })).toBe(true);
    expect(familiaVeLibro({ ...base, conImpreso: true, rol: "invitado", contexto })).toBe(false);
    expect(familiaVeRespuestas(contexto)).toBe(false);
  });
});

describe("libroAbierto", () => {
  const admin = (r: { pedidos?: unknown; entregas?: unknown; falla?: boolean }) =>
    ({
      from: (tabla: string) => ({
        select: () => ({
          eq: async () => (r.falla ? { data: null, error: { message: "x" } } : { data: tabla === "pedidos" ? r.pedidos : r.entregas, error: null }),
        }),
      }),
    }) as unknown as SupabaseClient;

  it("sin modo narrador no consulta nada", async () => {
    const sinBase = {} as SupabaseClient;
    expect(await libroAbierto(sinBase, { id: "n", contexto: {} }, "invitado")).toBe(true);
  });

  it("si la base falla, no abre", async () => {
    expect(await libroAbierto(admin({ falla: true }), { id: "n", contexto: marcado({ revisado_at: "x" }) }, "duena")).toBe(false);
  });

  it("con impreso en camino no abre, y entregado sí", async () => {
    const pedidos = [{ estado: "entregado", extras: { pdf: true, impreso: "color" } }];
    expect(await libroAbierto(admin({ pedidos, entregas: [{ estado: "enviado" }] }), { id: "n", contexto: marcado({ revisado_at: "x" }) }, "duena")).toBe(false);
    expect(await libroAbierto(admin({ pedidos, entregas: [{ estado: "entregado" }] }), { id: "n", contexto: marcado() }, "invitado")).toBe(true);
  });

  it("una copia comprada después no vuelve a cerrar el libro", async () => {
    const pedidos = [{ estado: "entregado", extras: { pdf: true, impreso: "color" } }];
    expect(await libroAbierto(admin({ pedidos, entregas: [{ estado: "entregado" }, { estado: "lista" }] }), { id: "n", contexto: marcado() }, "invitado")).toBe(true);
  });

  it("un pedido fallido no cuenta como impreso", async () => {
    const pedidos = [{ estado: "fallido", extras: { impreso: "color" } }, { estado: "entregado", extras: { pdf: true } }];
    expect(await libroAbierto(admin({ pedidos, entregas: [] }), { id: "n", contexto: marcado({ revisado_at: "x" }) }, "duena")).toBe(true);
  });
});
