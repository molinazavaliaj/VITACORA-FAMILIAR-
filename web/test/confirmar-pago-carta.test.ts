import { describe, it, expect, vi } from "vitest";
import { confirmarPago } from "../src/lib/confirmar-pago";
import type { SupabaseClient } from "@supabase/supabase-js";

// Regalo en locales (17/10): al pagar, la carta impresa se toma (compare-and-swap
// sobre codigos_impresos) y la tarjeta negra avisa a los socios.
type Llamada = { tabla: string; valores: Record<string, unknown>; filtros: [string, unknown][] };

function construirAdmin(opciones: { extras: Record<string, unknown>; cartaLibre?: boolean; codigoGenerado?: string; pedidoActualizado?: boolean; regalosError?: boolean }) {
  const updates: Llamada[] = [];
  const from = vi.fn((tabla: string) => {
    const filtros: [string, unknown][] = [];
    const cadena: Record<string, unknown> = {};
    cadena.update = (valores: Record<string, unknown>) => {
      updates.push({ tabla, valores, filtros });
      return cadena;
    };
    cadena.select = () => cadena;
    cadena.eq = (col: string, val: unknown) => { filtros.push([col, val]); return cadena; };
    cadena.is = (col: string, val: unknown) => { filtros.push([`is:${col}`, val]); return cadena; };
    cadena.maybeSingle = () => {
      if (tabla === "familias") return Promise.resolve({ data: { email: "martina@ejemplo.com", region: "AR" }, error: null });
      if (tabla === "narradores") return Promise.resolve({ data: { como_le_dicen: "abuelo" }, error: null });
      if (tabla === "pedidos") return Promise.resolve({ data: { extras: opciones.extras, familia_id: "f1" }, error: null });
      if (tabla === "regalos") {
        // Lo que lee el paso del mail: el código vigente (el impreso si el update de regalos ya corrió).
        const tomado = updates.find((u) => u.tabla === "regalos");
        return Promise.resolve({ data: { codigo: (tomado?.valores.codigo as string) ?? opciones.codigoGenerado ?? "VF-GENERADO" }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    };
    cadena.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
      let resultado: unknown = { data: null, error: null };
      if (tabla === "pedidos") resultado = { data: opciones.pedidoActualizado === false ? [] : [{ id: "ped-1", narrador_id: "nar-1", familia_id: "f1" }], error: null };
      else if (tabla === "regalos" && opciones.regalosError) resultado = { data: null, error: { message: "regalos caído" } };
      else if (tabla === "narradores") resultado = { data: [{ id: "nar-1" }], error: null };
      else if (tabla === "codigos_impresos") resultado = { data: opciones.cartaLibre === false ? [] : [{ codigo: "VF-7K3M2Q" }], error: null };
      return Promise.resolve(resultado).then(resolve, reject);
    };
    return cadena;
  });
  return { admin: { from } as unknown as SupabaseClient, updates };
}

const DIRECCION = { linea1: "Calle Falsa 123", ciudad: "Rosario", provincia: "Santa Fe", cp: "2000", pais: "Argentina" };

describe("confirmarPago — carta impresa y tarjeta negra", () => {
  it("regalo con la carta libre: la toma, el regalo pasa a su código y el mail sale con él", async () => {
    const { admin, updates } = construirAdmin({ extras: { regalo: true, codigo_impreso: "VF-7K3M2Q" } });
    const enviarMailRegalo = vi.fn().mockResolvedValue(true);
    const avisarSocios = vi.fn().mockResolvedValue(true);
    const r = await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "ref", enviarMailAcceso: vi.fn(), enviarMailRegalo, avisarSocios });
    const carta = updates.find((u) => u.tabla === "codigos_impresos");
    expect(carta?.valores).toEqual({ pedido_id: "ped-1" });
    expect(carta?.filtros).toContainEqual(["codigo", "VF-7K3M2Q"]);
    expect(carta?.filtros).toContainEqual(["is:pedido_id", null]);
    const regalo = updates.find((u) => u.tabla === "regalos");
    expect(regalo?.valores).toEqual({ codigo: "VF-7K3M2Q" });
    expect(regalo?.filtros).toContainEqual(["narrador_id", "nar-1"]);
    // La carta se toma ANTES de tocar regalos (el trigger lo exige).
    expect(updates.indexOf(carta!)).toBeLessThan(updates.indexOf(regalo!));
    expect(r).toMatchObject({ ok: true, codigoRegalo: "VF-7K3M2Q" });
    expect(enviarMailRegalo).toHaveBeenCalledWith(expect.objectContaining({ codigo: "VF-7K3M2Q" }));
    expect(avisarSocios).not.toHaveBeenCalled();
  });

  it("la carta ya la tomó otro pedido: el regalo no cambia y se avisa a los socios", async () => {
    const { admin, updates } = construirAdmin({ extras: { regalo: true, codigo_impreso: "VF-7K3M2Q" }, cartaLibre: false, codigoGenerado: "VF-GENERADO" });
    const avisarSocios = vi.fn().mockResolvedValue(true);
    const r = await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "ref", enviarMailAcceso: vi.fn(), enviarMailRegalo: vi.fn().mockResolvedValue(true), avisarSocios });
    expect(updates.find((u) => u.tabla === "regalos")).toBeUndefined();
    expect(avisarSocios).toHaveBeenCalledTimes(1);
    expect(avisarSocios.mock.calls[0][0]).toContain("VF-7K3M2Q");
    expect(r).toMatchObject({ ok: true, codigoRegalo: "VF-GENERADO" });
    // Y al pedido perdedor se le quita la comisión del local.
    const quitada = updates.find((u) => u.tabla === "pedidos" && "comision_local" in u.valores);
    expect(quitada?.valores).toEqual({ local_id: null, comision_local: null });
    expect(quitada?.filtros).toContainEqual(["id", "ped-1"]);
    expect(avisarSocios.mock.calls[0][1]).toContain("comisión del local se quitó");
  });

  it("la carta se tomó pero el regalo no cambió de código: avisa con el SQL para repararlo y el pago sigue ok", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { admin, updates } = construirAdmin({ extras: { regalo: true, codigo_impreso: "VF-7K3M2Q" }, regalosError: true });
    const avisarSocios = vi.fn().mockResolvedValue(true);
    const r = await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "ref", enviarMailAcceso: vi.fn(), enviarMailRegalo: vi.fn().mockResolvedValue(true), avisarSocios });
    expect(r.ok).toBe(true);
    expect(avisarSocios).toHaveBeenCalledTimes(1);
    const [asunto, texto] = avisarSocios.mock.calls[0];
    expect(asunto).toContain("tomada pero el regalo sigue con otro código");
    expect(texto).toContain("update regalos set codigo = 'VF-7K3M2Q' where narrador_id = 'nar-1';");
    expect(texto).toContain("ped-1");
    expect(texto).toContain("regalos caído");
    expect(updates.find((u) => u.tabla === "pedidos" && "comision_local" in u.valores)).toBeUndefined();
    error.mockRestore();
  });

  it("con tarjeta negra avisa a los socios con la dirección y la región", async () => {
    const { admin } = construirAdmin({ extras: { regalo: true, tarjeta: { direccion: DIRECCION } } });
    const avisarSocios = vi.fn().mockResolvedValue(true);
    await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "ref", enviarMailAcceso: vi.fn(), enviarMailRegalo: vi.fn().mockResolvedValue(true), avisarSocios });
    expect(avisarSocios).toHaveBeenCalledTimes(1);
    const [asunto, texto] = avisarSocios.mock.calls[0];
    expect(asunto).toContain("Tarjeta negra");
    expect(asunto).toContain("AR");
    expect(texto).toContain("Calle Falsa 123");
    expect(texto).toContain("2000 Rosario");
    expect(texto).toContain("Santa Fe");
  });

  it("si avisarSocios tira error, el pago igual queda confirmado", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { admin } = construirAdmin({ extras: { regalo: true, tarjeta: { direccion: DIRECCION } } });
    const r = await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "ref", enviarMailAcceso: vi.fn(), enviarMailRegalo: vi.fn().mockResolvedValue(true), avisarSocios: vi.fn().mockRejectedValue(new Error("boom")) });
    expect(r.ok).toBe(true);
    error.mockRestore();
  });

  it("reintento (yaEstaba): no toca codigos_impresos ni avisa", async () => {
    const { admin, updates } = construirAdmin({ extras: { regalo: true, codigo_impreso: "VF-7K3M2Q", tarjeta: { direccion: DIRECCION } }, pedidoActualizado: false });
    const avisarSocios = vi.fn();
    const r = await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "ref", enviarMailAcceso: vi.fn(), avisarSocios });
    expect(r).toMatchObject({ ok: true, yaEstaba: true });
    expect(updates.find((u) => u.tabla === "codigos_impresos")).toBeUndefined();
    expect(avisarSocios).not.toHaveBeenCalled();
  });

  it("pedido sin carta ni tarjeta: no avisa a nadie", async () => {
    const { admin } = construirAdmin({ extras: { regalo: true } });
    const avisarSocios = vi.fn();
    await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "ref", enviarMailAcceso: vi.fn(), enviarMailRegalo: vi.fn().mockResolvedValue(true), avisarSocios });
    expect(avisarSocios).not.toHaveBeenCalled();
  });
});

describe("confirmarPago — aviso del impreso en el mail del regalo", () => {
  it("regalo con impreso: enviarMailRegalo recibe conImpreso true; digital, false", async () => {
    for (const [extras, esperado] of [[{ regalo: true, impreso: "color" }, true], [{ regalo: true }, false]] as const) {
      const { admin } = construirAdmin({ extras });
      const enviarMailRegalo = vi.fn().mockResolvedValue(true);
      await confirmarPago(admin, { pedidoId: "ped-1", referenciaExterna: "ref", enviarMailAcceso: vi.fn(), enviarMailRegalo, avisarSocios: vi.fn().mockResolvedValue(true) });
      expect(enviarMailRegalo).toHaveBeenCalledWith(expect.objectContaining({ conImpreso: esperado }));
    }
  });
});
