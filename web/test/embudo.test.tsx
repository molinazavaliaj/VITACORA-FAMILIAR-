import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});
const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: () => ({ rpc }) }));

import { POST } from "../src/app/api/embudo/route";
import { armarEmbudo, validarEmbudo } from "@/lib/embudo";
import { contarPagado, contarPaso } from "@/lib/embudo-cliente";
import { catalogo } from "@/lib/productos";
import { Checkout } from "../src/app/comprar/formulario";

// El contador del embudo (checkout etapa 1): sin cookies, sin IP, sin correo. Nunca rompe la compra.

const BUENO = { compra: "familiar", paso: "entro", region: "ES", dispositivo: "celular" };
const pedir = (cuerpo: unknown, headers?: Record<string, string>) =>
  POST(new Request("http://localhost/api/embudo", { method: "POST", headers, body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo) }));

describe("validarEmbudo", () => {
  it("acepta cada valor permitido y descarta los campos de más", () => {
    expect(validarEmbudo({ ...BUENO, correo: "x@y.z" })).toEqual(BUENO);
    for (const paso of ["entro", "para_quien", "pago", "pagar", "pagado"]) expect(validarEmbudo({ ...BUENO, paso })).not.toBeNull();
    for (const region of ["ES", "AR"]) expect(validarEmbudo({ ...BUENO, region })).not.toBeNull();
    for (const dispositivo of ["celular", "compu"]) expect(validarEmbudo({ ...BUENO, dispositivo })).not.toBeNull();
  });
  it("rechaza lo demás", () => {
    expect(validarEmbudo(null)).toBeNull();
    expect(validarEmbudo("entro")).toBeNull();
    expect(validarEmbudo({ ...BUENO, compra: "viaje" })).toBeNull();
    expect(validarEmbudo({ ...BUENO, paso: "otro" })).toBeNull();
    expect(validarEmbudo({ ...BUENO, region: "es" })).toBeNull();
    expect(validarEmbudo({ ...BUENO, dispositivo: "tablet" })).toBeNull();
    expect(validarEmbudo({ paso: "entro" })).toBeNull();
  });
});

describe("POST /api/embudo", () => {
  beforeEach(() => rpc.mockReset().mockResolvedValue({ error: null }));

  it("suma el paso válido y contesta 204", async () => {
    const r = await pedir(BUENO);
    expect(r.status).toBe(204);
    expect(rpc).toHaveBeenCalledWith("sumar_embudo", { p_compra: "familiar", p_paso: "entro", p_region: "ES", p_dispositivo: "celular" });
  });
  it("contesta 204 y no inserta lo inválido o roto", async () => {
    expect((await pedir({ ...BUENO, paso: "hackeo" })).status).toBe(204);
    expect((await pedir("no es json")).status).toBe(204);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("descarta en silencio lo que no viene del mismo sitio, sin tocar la base", async () => {
    for (const sitio of ["cross-site", "same-site", "none"]) {
      const r = await pedir(BUENO, { "Sec-Fetch-Site": sitio });
      expect(r.status).toBe(204);
    }
    expect(rpc).not.toHaveBeenCalled();
    expect((await pedir(BUENO, { "Sec-Fetch-Site": "same-origin" })).status).toBe(204);
    expect(rpc).toHaveBeenCalledTimes(1);
    // Sin la cabecera (navegador viejo) se cuenta.
    await pedir(BUENO);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it("el JSON roto no escribe en el registro de errores", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await pedir("no es json")).status).toBe(204);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
  it("contesta 204 aunque la base falle o tire", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    rpc.mockResolvedValueOnce({ error: { message: "boom" } });
    expect((await pedir(BUENO)).status).toBe(204);
    rpc.mockRejectedValueOnce(new Error("caída"));
    expect((await pedir(BUENO)).status).toBe(204);
  });
});

describe("armarEmbudo", () => {
  it("suma por región y dispositivo y calcula el porcentaje respecto de «entro»", () => {
    const fila = (dia: string, paso: string, cuenta: number) => ({ dia, compra: "familiar", paso, region: "ES", dispositivo: "celular", cuenta });
    const lineas = armarEmbudo([fila("2026-11-01", "entro", 60), fila("2026-11-02", "entro", 40), fila("2026-11-02", "pagado", 5)]);
    expect(lineas).toHaveLength(4);
    const es = lineas.find((l) => l.region === "ES" && l.dispositivo === "celular")!;
    expect(es.cuentas.entro).toBe(100);
    expect(es.porcentajes.pagado).toBe(5);
    expect(lineas.find((l) => l.region === "AR")!.porcentajes.pagado).toBeNull();
  });
});

describe("contarPaso en el navegador", () => {
  const original = { window: (globalThis as { window?: unknown }).window, navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator") };
  afterEach(() => {
    (globalThis as { window?: unknown }).window = original.window;
    if (original.navigator) Object.defineProperty(globalThis, "navigator", original.navigator);
  });
  const sesion = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
  };

  it("no falla sin sendBeacon ni sin window", () => {
    expect(() => contarPaso("entro", "ES")).not.toThrow();
    (globalThis as { window?: unknown }).window = { sessionStorage: sesion(), matchMedia: () => ({ matches: true }) };
    Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });
    expect(() => contarPaso("entro", "ES")).not.toThrow();
  });
  it("no falla si sessionStorage tira", () => {
    const sendBeacon = vi.fn();
    (globalThis as { window?: unknown }).window = { sessionStorage: { getItem: () => { throw new Error("bloqueado"); } }, matchMedia: () => ({ matches: false }) };
    Object.defineProperty(globalThis, "navigator", { value: { sendBeacon }, configurable: true });
    expect(() => contarPaso("entro", "AR")).not.toThrow();
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });
  it("manda una vez por paso por pestaña, y «pagado» una vez por pedido", () => {
    const sendBeacon = vi.fn();
    (globalThis as { window?: unknown }).window = { sessionStorage: sesion(), matchMedia: () => ({ matches: true }) };
    Object.defineProperty(globalThis, "navigator", { value: { sendBeacon }, configurable: true });
    contarPaso("entro", "ES");
    contarPaso("entro", "ES");
    contarPaso("pagado", "ES", "p1");
    contarPaso("pagado", "ES", "p1");
    contarPaso("pagado", "ES", "p2");
    expect(sendBeacon).toHaveBeenCalledTimes(3);
    expect(sendBeacon.mock.calls[0][0]).toBe("/api/embudo");
  });
});

describe("contarPagado", () => {
  const original = { window: (globalThis as { window?: unknown }).window, navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator") };
  afterEach(() => {
    (globalThis as { window?: unknown }).window = original.window;
    if (original.navigator) Object.defineProperty(globalThis, "navigator", original.navigator);
  });
  const preparar = (sessionStorage: unknown) => {
    const sendBeacon = vi.fn();
    (globalThis as { window?: unknown }).window = { sessionStorage, matchMedia: () => ({ matches: true }) };
    Object.defineProperty(globalThis, "navigator", { value: { sendBeacon }, configurable: true });
    return sendBeacon;
  };
  const sesion = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
  };

  it("sin la marca de «pagar» en la pestaña no cuenta (Mercado Pago en otro contexto)", () => {
    const sendBeacon = preparar(sesion());
    contarPagado("AR", "p1");
    expect(sendBeacon).not.toHaveBeenCalled();
  });
  it("con la marca que deja «pagar» cuenta una vez, y reabrir gracias no suma", () => {
    const s = sesion();
    const sendBeacon = preparar(s);
    contarPaso("pagar", "ES");
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    contarPagado("ES", "p1");
    expect(sendBeacon).toHaveBeenCalledTimes(2);
    expect(s.getItem("vf-embudo-pagar")).toBeNull();
    contarPagado("ES", "p1");
    contarPagado("ES", "p2");
    expect(sendBeacon).toHaveBeenCalledTimes(2);
  });
  it("sin sessionStorage no cuenta ni rompe", () => {
    const sendBeacon = preparar({ getItem: () => { throw new Error("bloqueado"); } });
    expect(() => contarPagado("ES", "p1")).not.toThrow();
    expect(sendBeacon).not.toHaveBeenCalled();
  });
});

describe("el formulario con embudo", () => {
  it("se pinta igual con el embudo prendido y sin sendBeacon", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} embudo />);
    expect(html.length).toBeGreaterThan(500);
  });
});
