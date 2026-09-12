import { describe, it, expect, vi } from "vitest";
import { confirmarPago } from "../src/lib/confirmar-pago";
import type { SupabaseClient } from "@supabase/supabase-js";

// Fake mínimo del cliente admin: cada tabla devuelve lo que el test le dice.
// `updates` registra qué se intentó actualizar, para asegurar el orden y la
// idempotencia sin mirar adentro de Supabase.
function construirAdmin(opciones: {
  pedidoActualizado: { id: string; narrador_id: string; familia_id: string } | null;
  errorPedido?: string;
  errorNarrador?: string;
  email?: string | null;
  comoLeDicen?: string;
}) {
  const updates: { tabla: string; valores: Record<string, unknown>; filtros: [string, unknown][] }[] = [];

  const from = vi.fn((tabla: string) => {
    const filtros: [string, unknown][] = [];
    const cadena: Record<string, unknown> = {};
    cadena.update = (valores: Record<string, unknown>) => {
      updates.push({ tabla, valores, filtros });
      return cadena;
    };
    cadena.select = () => cadena;
    cadena.eq = (col: string, val: unknown) => {
      filtros.push([col, val]);
      return cadena;
    };
    cadena.maybeSingle = () => {
      if (tabla === "familias") return Promise.resolve({ data: opciones.email === null ? null : { email: opciones.email ?? "martina@ejemplo.com" }, error: null });
      if (tabla === "narradores") return Promise.resolve({ data: { como_le_dicen: opciones.comoLeDicen ?? "papá" }, error: null });
      return Promise.resolve({ data: null, error: null });
    };
    cadena.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
      let resultado: unknown;
      if (tabla === "pedidos") {
        resultado = opciones.errorPedido
          ? { data: null, error: { message: opciones.errorPedido } }
          : { data: opciones.pedidoActualizado ? [opciones.pedidoActualizado] : [], error: null };
      } else if (tabla === "narradores") {
        resultado = opciones.errorNarrador ? { data: null, error: { message: opciones.errorNarrador } } : { data: null, error: null };
      } else {
        resultado = { data: null, error: null };
      }
      return Promise.resolve(resultado).then(resolve, reject);
    };
    return cadena;
  });

  return { admin: { from } as unknown as SupabaseClient, updates };
}

const PEDIDO = { id: "p1", narrador_id: "n1", familia_id: "f1" };

describe("confirmarPago", () => {
  it("pedido → pagado, narrador → invitado, y manda el mail de acceso", async () => {
    const { admin, updates } = construirAdmin({ pedidoActualizado: PEDIDO });
    const enviarMailAcceso = vi.fn().mockResolvedValue(true);

    const r = await confirmarPago(admin, { pedidoId: "p1", referenciaExterna: "cs_123", enviarMailAcceso });

    expect(r).toEqual({ ok: true, yaEstaba: false, email: "martina@ejemplo.com" });
    expect(updates[0]).toMatchObject({
      tabla: "pedidos",
      valores: { estado: "pagado", referencia_externa: "cs_123" },
      filtros: [["id", "p1"], ["estado", "pendiente"]],
    });
    expect(updates[1]).toMatchObject({
      tabla: "narradores",
      valores: { estado: "invitado" },
      filtros: [["id", "n1"], ["estado", "pendiente_pago"]],
    });
    expect(enviarMailAcceso).toHaveBeenCalledWith({ para: "martina@ejemplo.com", comoLeDicen: "papá" });
  });

  it("es idempotente: si el pedido ya no estaba pendiente, no toca al narrador ni manda mail", async () => {
    const { admin, updates } = construirAdmin({ pedidoActualizado: null });
    const enviarMailAcceso = vi.fn();

    const r = await confirmarPago(admin, { pedidoId: "p1", referenciaExterna: "cs_123", enviarMailAcceso });

    expect(r).toEqual({ ok: true, yaEstaba: true, email: null });
    expect(updates).toHaveLength(1); // solo el intento sobre pedidos
    expect(enviarMailAcceso).not.toHaveBeenCalled();
  });

  it("si la base falla al marcar el pedido, devuelve error (para que el proveedor reintente)", async () => {
    const { admin } = construirAdmin({ pedidoActualizado: null, errorPedido: "conexión caída" });

    const r = await confirmarPago(admin, { pedidoId: "p1", referenciaExterna: "cs_123", enviarMailAcceso: vi.fn() });

    expect(r.ok).toBe(false);
  });

  it("si el mail falla, el pago igual queda confirmado (no se pierde un cobro por un correo)", async () => {
    const { admin } = construirAdmin({ pedidoActualizado: PEDIDO });
    const enviarMailAcceso = vi.fn().mockRejectedValue(new Error("Resend caído"));

    const r = await confirmarPago(admin, { pedidoId: "p1", referenciaExterna: "cs_123", enviarMailAcceso });

    expect(r.ok).toBe(true);
  });

  it("sin mail de familia, confirma igual y no intenta enviar", async () => {
    const { admin } = construirAdmin({ pedidoActualizado: PEDIDO, email: null });
    const enviarMailAcceso = vi.fn();

    const r = await confirmarPago(admin, { pedidoId: "p1", referenciaExterna: "cs_123", enviarMailAcceso });

    expect(r).toEqual({ ok: true, yaEstaba: false, email: null });
    expect(enviarMailAcceso).not.toHaveBeenCalled();
  });
});
