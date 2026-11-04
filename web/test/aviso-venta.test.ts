import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// Cada venta les llega por mail a los socios (Naza, 04/11): una vez por pedido,
// y si el mail falla el pago queda confirmado igual.

vi.mock("../src/lib/mail", () => ({ enviarMailSocios: vi.fn(), urlBaseMail: () => "https://web.test" }));

import { enviarMailSocios } from "../src/lib/mail";
import { confirmarPago } from "../src/lib/confirmar-pago";
import { mailAvisoVenta } from "../src/lib/aviso-venta";

const socios = enviarMailSocios as unknown as ReturnType<typeof vi.fn>;

function admin(o: { pedido: boolean; extras: Record<string, unknown>; contexto?: Record<string, unknown> | null }) {
  const from = vi.fn((tabla: string) => {
    const c: Record<string, unknown> = {};
    for (const m of ["select", "eq", "update", "insert"]) c[m] = () => c;
    c.maybeSingle = () => {
      if (tabla === "pedidos") return Promise.resolve({ data: { extras: o.extras, familia_id: "f1", monto: 89, moneda: "EUR" }, error: null });
      if (tabla === "familias") return Promise.resolve({ data: { email: "ana@ejemplo.com", region: "ES" }, error: null });
      if (tabla === "narradores") return Promise.resolve({ data: { como_le_dicen: "abuelo", contexto: o.contexto ?? null }, error: null });
      return Promise.resolve({ data: null, error: null });
    };
    c.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      const r = tabla === "pedidos" ? { data: o.pedido ? [{ id: "p1", narrador_id: "n1", familia_id: "f1" }] : [], error: null }
        : tabla === "narradores" ? { data: [{ id: "n1" }], error: null }
        : { data: null, error: null };
      return Promise.resolve(r).then(res, rej);
    };
    return c;
  });
  return { from } as unknown as SupabaseClient;
}

const opciones = () => ({
  pedidoId: "p1", referenciaExterna: "cs_1", enviarMailAcceso: vi.fn().mockResolvedValue(true),
  avisarCompra: vi.fn().mockResolvedValue({ ok: true }),
});

beforeEach(() => {
  vi.clearAllMocks();
  socios.mockResolvedValue(true);
});

describe("el aviso de venta al confirmar el pago", () => {
  it("les llega a los socios cuando entra el pago", async () => {
    const r = await confirmarPago(admin({ pedido: true, extras: { pdf: true } }), opciones());
    expect(r).toMatchObject({ ok: true, yaEstaba: false });
    expect(socios).toHaveBeenCalledTimes(1);
    expect(socios).toHaveBeenCalledWith("Nueva venta · Libro · 89 €", "Compró ana@ejemplo.com. Pedido p1.");
  });

  it("lee del narrador si es Vitácora de una historia", async () => {
    await confirmarPago(admin({ pedido: true, extras: { pdf: true }, contexto: { modo: "historia" } }), opciones());
    expect(socios.mock.calls[0]?.[0]).toBe("Nueva venta · Historia · 89 €");
  });

  it("si ya estaba pagado (reintento del proveedor), no se repite", async () => {
    await confirmarPago(admin({ pedido: false, extras: { pdf: true } }), opciones());
    expect(socios).not.toHaveBeenCalled();
  });

  it("si el mail se rompe, el pago queda confirmado igual y se loguea", async () => {
    socios.mockRejectedValue(new Error("Resend caído"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await confirmarPago(admin({ pedido: true, extras: { pdf: true } }), opciones());
    expect(r).toMatchObject({ ok: true, yaEstaba: false });
    expect(error.mock.calls.some((c) => String(c[0]).includes("aviso de venta"))).toBe(true);
    error.mockRestore();
  });

  it("si no sale (sin MAIL_SOCIOS), también se loguea", async () => {
    socios.mockResolvedValue(false);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await confirmarPago(admin({ pedido: true, extras: { pdf: true } }), opciones());
    expect(r.ok).toBe(true);
    expect(error.mock.calls.some((c) => String(c[0]).includes("aviso de venta"))).toBe(true);
    error.mockRestore();
  });
});

describe("el texto del aviso", () => {
  const base = { pedidoId: "p1", monto: 89, moneda: "EUR", email: "ana@ejemplo.com", extras: { pdf: true } as Record<string, unknown>, modo: null as unknown };

  it("dice si es un regalo", () => {
    expect(mailAvisoVenta({ ...base, extras: { pdf: true, regalo: true } }).texto).toBe("Compró ana@ejemplo.com. Es un regalo. Pedido p1.");
  });

  it("nombra cada producto", () => {
    const nombre = (o: Partial<typeof base>) => mailAvisoVenta({ ...base, ...o }).asunto.split(" · ")[1];
    expect(nombre({})).toBe("Libro");
    expect(nombre({ extras: {} })).toBe("Libro");
    expect(nombre({ extras: { pdf: true, tipo: "kids" } })).toBe("Kids");
    expect(nombre({ extras: { pdf: true, tipo: "viaje" } })).toBe("Viaje");
    expect(nombre({ modo: "historia" })).toBe("Historia");
    expect(nombre({ extras: { pdf: false, copias: 2 } })).toBe("Extras");
  });

  it("muestra los céntimos solo si los hay, y los pesos en pesos", () => {
    expect(mailAvisoVenta({ ...base, monto: 44.1 }).asunto).toBe("Nueva venta · Libro · 44,10 €");
    expect(mailAvisoVenta({ ...base, monto: 89000, moneda: "ARS" }).asunto).toBe("Nueva venta · Libro · $ 89.000");
  });

  it("sin monto o sin mail, sale igual", () => {
    expect(mailAvisoVenta({ ...base, monto: null as unknown as number }).asunto).toBe("Nueva venta · Libro");
    expect(mailAvisoVenta({ ...base, email: null as unknown as string }).texto).toBe("Compró alguien sin mail anotado. Pedido p1.");
  });
});
