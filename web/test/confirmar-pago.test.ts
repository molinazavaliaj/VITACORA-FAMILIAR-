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
  /** false = el narrador NO estaba en pendiente_pago (pedido de extras): el update no toca filas. */
  narradorArranca?: boolean;
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
        resultado = opciones.errorNarrador
          ? { data: null, error: { message: opciones.errorNarrador } }
          : { data: opciones.narradorArranca === false ? [] : [{ id: "n1" }], error: null };
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

  it("un pedido de extras (el narrador ya no está en pendiente_pago) se cobra pero NO manda el mail de 'hoy le escribimos'", async () => {
    const { admin, updates } = construirAdmin({ pedidoActualizado: PEDIDO, narradorArranca: false });
    const enviarMailAcceso = vi.fn().mockResolvedValue(true);

    const r = await confirmarPago(admin, { pedidoId: "p1", referenciaExterna: "mp_9", enviarMailAcceso });

    expect(r).toEqual({ ok: true, yaEstaba: false, email: "martina@ejemplo.com" });
    expect(updates.find((u) => u.tabla === "pedidos")?.valores).toMatchObject({ estado: "pagado" });
    expect(enviarMailAcceso).not.toHaveBeenCalled();
  });
});
// 3t.26 (22/09): un pedido con algo físico necesita una entrega, que nace acá
// en `sin_direccion` — la familia la completa desde Encargar libro.
function adminConEntrega(opciones: { extras: Record<string, unknown>; region: "ES" | "AR"; fallaEntrega?: boolean }) {
  const inserts: { tabla: string; valores: Record<string, unknown> }[] = [];
  const from = vi.fn((tabla: string) => {
    const cadena: Record<string, unknown> = {};
    cadena.update = () => cadena;
    cadena.select = () => cadena;
    cadena.eq = () => cadena;
    cadena.insert = (valores: Record<string, unknown>) => {
      inserts.push({ tabla, valores });
      return Promise.resolve({ error: opciones.fallaEntrega ? { message: "boom" } : null });
    };
    cadena.maybeSingle = () => {
      if (tabla === "pedidos") return Promise.resolve({ data: { extras: opciones.extras }, error: null });
      if (tabla === "familias") return Promise.resolve({ data: { email: "martina@ejemplo.com", region: opciones.region }, error: null });
      if (tabla === "narradores") return Promise.resolve({ data: { como_le_dicen: "papá" }, error: null });
      return Promise.resolve({ data: null, error: null });
    };
    cadena.then = (resolve: (v: unknown) => unknown) => {
      const resultado = tabla === "pedidos"
        ? { data: [{ id: "ped-1", narrador_id: "nar-1", familia_id: "fam-1" }], error: null }
        : tabla === "narradores" ? { data: [{ id: "nar-1" }], error: null } : { data: null, error: null };
      return Promise.resolve(resultado).then(resolve);
    };
    return cadena;
  });
  return { admin: { from } as unknown as SupabaseClient, inserts };
}

describe("confirmarPago — la entrega de lo físico", () => {
  it("con impreso o marcos crea la fila de entregas, con el origen de la región", async () => {
    const { admin, inserts } = adminConEntrega({ extras: { pdf: true, impreso: "color", copias: 1, marcos: 2 }, region: "ES" });
    await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "pay-1", enviarMailAcceso: async () => true });
    const entrega = inserts.find((e) => e.tabla === "entregas");
    expect(entrega?.valores).toMatchObject({ pedido_id: "ped-1", narrador_id: "nar-1", familia_id: "fam-1", estado: "sin_direccion", origen: "ES" });
  });

  it("un pedido de solo PDF no crea entrega: no hay nada que mandar", async () => {
    const { admin, inserts } = adminConEntrega({ extras: { pdf: true, impreso: null, copias: 0, marcos: 0 }, region: "AR" });
    await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "pay-1", enviarMailAcceso: async () => true });
    expect(inserts.find((e) => e.tabla === "entregas")).toBeUndefined();
  });

  it("si la entrega no se puede crear, el pago igual queda confirmado", async () => {
    const { admin } = adminConEntrega({ extras: { pdf: true, impreso: "color", copias: 1, marcos: 0 }, region: "AR", fallaEntrega: true });
    const r = await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "pay-1", enviarMailAcceso: async () => true });
    expect(r.ok).toBe(true);
  });
});
