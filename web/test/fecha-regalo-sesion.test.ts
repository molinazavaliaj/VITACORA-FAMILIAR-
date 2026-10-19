import { describe, it, expect, vi, beforeEach } from "vitest";

// La fecha del regalo que no se guardaba a la primera (19/10). En Vercel,
// el PATCH fallaba con «AuthRefreshDiscardedError: Refresh result discarded:
// session state changed mid-flight»: con el token vencido, dos renovaciones a
// la vez sobre las mismas cookies, auth-js descarta una, getUser() vuelve sin
// usuario y la API contesta 401. La segunda vez andaba porque el navegador ya
// tenía el token nuevo. Tres arreglos, uno por test:
//   1. un solo cliente de sesión por request (no dos renovando a la vez),
//   2. si igual se descarta, la API vuelve a leer la sesión,
//   3. la pantalla reintenta una vez y, si igual falla, dice que no se guardó.

const estado = vi.hoisted(() => ({ almacen: {} as object, creados: 0 }));

vi.mock("next/headers", () => ({ cookies: async () => estado.almacen }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => {
    estado.creados++;
    return { id: estado.creados };
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));

import { crearClienteSesion } from "../src/lib/supabase/sesion";
import { narradorDeLaSesion, refrescoDescartado } from "../src/lib/panel";
import { pedirCambioDeFecha } from "../src/app/tablero/_historia/fecha";

const ERROR = "No pudimos guardar la fecha. Intentá de nuevo.";
const respuesta = (status: number, cuerpo: unknown = {}) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
const descartado = Object.assign(new Error("Refresh result discarded: session state changed mid-flight (e.g., concurrent signOut)"), {
  name: "AuthRefreshDiscardedError",
});

describe("un solo cliente de sesión por request", () => {
  beforeEach(() => {
    estado.creados = 0;
    estado.almacen = {};
  });

  it("dos pedidos del cliente en la misma request reciben el mismo (no renuevan el token dos veces)", async () => {
    const a = await crearClienteSesion();
    const b = await crearClienteSesion();
    expect(a).toBe(b);
    expect(estado.creados).toBe(1);
  });

  it("otra request (otras cookies) tiene su propio cliente", async () => {
    const a = await crearClienteSesion();
    estado.almacen = {};
    const b = await crearClienteSesion();
    expect(a).not.toBe(b);
    expect(estado.creados).toBe(2);
  });
});

describe("la API vuelve a leer la sesión si la renovación se descartó", () => {
  it("reconoce el error de auth-js por su nombre", () => {
    expect(refrescoDescartado(descartado)).toBe(true);
    expect(refrescoDescartado(new Error("otra cosa"))).toBe(false);
    expect(refrescoDescartado(null)).toBe(false);
  });

  it("descartada la primera, la segunda lectura encuentra al usuario", async () => {
    const getUser = vi
      .fn()
      .mockResolvedValueOnce({ data: { user: null }, error: descartado })
      .mockResolvedValueOnce({ data: { user: { id: "u1", email: "a@b.c" } }, error: null });
    // Sin narrador pedido ni historias: no llega a autorizar, pero ya pasó la sesión (404, no 401).
    const admin = {
      from: () => ({
        select: () => ({ ilike: () => ({ maybeSingle: async () => ({ data: null, error: null }) }), eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      }),
    };
    const r = await narradorDeLaSesion({ auth: { getUser } }, admin as never, null).catch(() => ({ ok: false, status: 0 }));
    expect(getUser).toHaveBeenCalledTimes(2);
    expect(r.ok === false && r.status).not.toBe(401);
  });

  it("sin sesión de verdad no insiste: una sola lectura y 401", async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("Auth session missing!") });
    const r = await narradorDeLaSesion({ auth: { getUser } }, {} as never, null);
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ ok: false, status: 401, error: "No hay sesión activa." });
  });
});

describe("la pantalla guarda a la primera y, si no puede, lo dice", () => {
  it("si el primer pedido vuelve sin sesión (401), reintenta solo y guarda", async () => {
    const pedir = vi.fn().mockResolvedValueOnce(respuesta(401, { error: "No hay sesión activa." })).mockResolvedValueOnce(respuesta(200, { ok: true }));
    expect(await pedirCambioDeFecha("n1", "2026-12-24", ERROR, pedir)).toEqual({ ok: true });
    expect(pedir).toHaveBeenCalledTimes(2);
    const [url, init] = pedir.mock.calls[1];
    expect(url).toBe("/api/regalo/fecha?narrador=n1");
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ fecha: "2026-12-24" }));
  });

  it("si el pedido no llega (sin red), también reintenta", async () => {
    const pedir = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(respuesta(200, { ok: true }));
    expect(await pedirCambioDeFecha("n1", "2026-12-24", ERROR, pedir)).toEqual({ ok: true });
  });

  it("si falla dos veces, dice que no se guardó (con el texto del panel, no «No hay sesión activa.»)", async () => {
    const pedir = vi.fn().mockResolvedValue(respuesta(401, { error: "No hay sesión activa." }));
    expect(await pedirCambioDeFecha("n1", "2026-12-24", ERROR, pedir)).toEqual({ ok: false, error: ERROR });
    expect(pedir).toHaveBeenCalledTimes(2);
  });

  it("un error del servidor que explica algo (regalo ya abierto) se muestra tal cual y no se reintenta", async () => {
    const yaNo = "Este regalo ya está en marcha y la fecha no se puede cambiar.";
    const pedir = vi.fn().mockResolvedValue(respuesta(409, { error: yaNo }));
    expect(await pedirCambioDeFecha("n1", "2026-12-24", ERROR, pedir)).toEqual({ ok: false, error: yaNo });
    expect(pedir).toHaveBeenCalledTimes(1);
  });

  it("una caída del servidor (500) muestra el error del panel", async () => {
    const pedir = vi.fn().mockResolvedValue(respuesta(500, { error: "x" }));
    expect(await pedirCambioDeFecha("n1", "2026-12-24", ERROR, pedir)).toEqual({ ok: false, error: ERROR });
  });
});
