import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// La tarjeta impresa (30/10): cuando entra el pago de un regalo que la lleva,
// a los socios les llega un mail con todo para imprimirla y mandarla.

vi.mock("../src/lib/mail", () => ({ enviarMailSocios: vi.fn(), urlBaseMail: () => "https://web.test" }));

import { enviarMailSocios } from "../src/lib/mail";
import { confirmarPago } from "../src/lib/confirmar-pago";
import { mailTarjetaImpresa, mandarAntesDe } from "../src/lib/tarjeta-impresa";

const TARJETA = { aNombreDe: "Lucía", direccion: { linea1: "Calle Mayor 12", linea2: "3º B", ciudad: "Valladolid", cp: "47001", pais: "España" } };

function admin(o: { pedido: boolean; extras: Record<string, unknown>; regalo?: Record<string, unknown> | null }) {
  const from = vi.fn((tabla: string) => {
    const c: Record<string, unknown> = {};
    for (const m of ["select", "eq", "update", "insert"]) c[m] = () => c;
    c.maybeSingle = () => {
      if (tabla === "pedidos") return Promise.resolve({ data: { extras: o.extras, familia_id: "f1", monto: 63, moneda: "EUR" }, error: null });
      if (tabla === "familias") return Promise.resolve({ data: { email: "lucia@ejemplo.com", region: "ES" }, error: null });
      if (tabla === "narradores") return Promise.resolve({ data: { como_le_dicen: "abuelo" }, error: null });
      if (tabla === "regalos") return Promise.resolve({ data: o.regalo === undefined ? { codigo: "VF-ABC123", quien_regala: "Lucía Pérez", fecha_entrega: "2026-12-24" } : o.regalo, error: null });
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
  pedidoId: "p1", referenciaExterna: "cs_1", enviarMailAcceso: vi.fn(), enviarMailRegalo: vi.fn().mockResolvedValue(true),
  avisarCompra: vi.fn().mockResolvedValue({ ok: true }),
});
const socios = enviarMailSocios as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  socios.mockResolvedValue(true);
});

describe("confirmarPago con la tarjeta impresa", () => {
  it("manda un mail a los socios, una vez, con la dirección, la fecha y el link para imprimir", async () => {
    const r = await confirmarPago(admin({ pedido: true, extras: { pdf: true, regalo: true, tarjeta: TARJETA } }), opciones());

    expect(r).toMatchObject({ ok: true, yaEstaba: false, codigoRegalo: "VF-ABC123" });
    expect(socios).toHaveBeenCalledTimes(1);
    const [asunto, texto] = socios.mock.calls[0] as [string, string];
    expect(asunto).toBe("Tarjeta impresa para mandar · VF-ABC123");
    expect(texto).toContain("Lucía Pérez");
    expect(texto).toContain("lucia@ejemplo.com");
    expect(texto).toContain("Calle Mayor 12, 3º B");
    expect(texto).toContain("47001 Valladolid");
    expect(texto).toContain("24/12/2026");
    expect(texto).toContain("Mandala antes del 20/12/2026.");
    expect(texto).toContain("https://web.test/regalo/VF-ABC123/tarjeta");
  });

  it("si ya estaba pagado (reintento del webhook), no lo manda de nuevo", async () => {
    await confirmarPago(admin({ pedido: false, extras: { pdf: true, regalo: true, tarjeta: TARJETA } }), opciones());
    expect(socios).not.toHaveBeenCalled();
  });

  it("sin tarjeta, no hay mail a los socios", async () => {
    await confirmarPago(admin({ pedido: true, extras: { pdf: true, regalo: true } }), opciones());
    expect(socios).not.toHaveBeenCalled();
  });

  it("si el mail falla, el pago queda confirmado igual y se loguea para hacerlo a mano", async () => {
    socios.mockRejectedValue(new Error("Resend caído"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await confirmarPago(admin({ pedido: true, extras: { pdf: true, regalo: true, tarjeta: TARJETA } }), opciones());
    expect(r).toMatchObject({ ok: true, yaEstaba: false });
    expect(error.mock.calls.some((c) => String(c[0]).includes("tarjeta impresa"))).toBe(true);
    error.mockRestore();
  });

  it("si el mail no sale (sin MAIL_SOCIOS), también se loguea", async () => {
    socios.mockResolvedValue(false);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await confirmarPago(admin({ pedido: true, extras: { pdf: true, regalo: true, tarjeta: TARJETA } }), opciones());
    expect(error.mock.calls.some((c) => String(c[0]).includes("tarjeta impresa"))).toBe(true);
    error.mockRestore();
  });

  it("sin código del regalo no hay link: se loguea y no se manda", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await confirmarPago(admin({ pedido: true, extras: { pdf: true, regalo: true, tarjeta: TARJETA }, regalo: null }), opciones());
    expect(r.ok).toBe(true);
    expect(socios).not.toHaveBeenCalled();
    expect(error.mock.calls.some((c) => String(c[0]).includes("tarjeta impresa"))).toBe(true);
    error.mockRestore();
  });
});

describe("mailTarjetaImpresa", () => {
  it("sin fecha dice «sin fecha» y «apenas puedas»", () => {
    const { texto } = mailTarjetaImpresa({ codigo: "VF-1", quienRegala: "Ana", email: "a@b.com", tarjeta: TARJETA, fechaEntrega: null, urlBase: "https://x" });
    expect(texto).toContain("sin fecha");
    expect(texto).toContain("Mandala apenas puedas.");
  });
  it("mandarAntesDe resta 4 días, también al cambiar de mes", () => {
    expect(mandarAntesDe("2026-12-24")).toBe("2026-12-20");
    expect(mandarAntesDe("2026-12-02")).toBe("2026-11-28");
  });
});
