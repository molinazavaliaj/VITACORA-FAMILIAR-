import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { POST } from "../src/app/api/sugeridas/route";

// "Sugerime preguntas" (spec §6.2 y §11.7): la web le pide al entrevistador 5
// ideas para este narrador. La web no piensa: pasa la pregunta con la clave
// compartida y devuelve lo que vuelve. Quien puede agregar preguntas puede pedir.

type Fila = Record<string, unknown>;
function crearAdmin(tablas: Record<string, Fila[]>) {
  function builder(tabla: string) {
    const filtros: Fila = {};
    let single = false;
    const b: Record<string, unknown> = {};
    const enc = () => b;
    b.select = enc; b.order = enc;
    b.eq = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.is = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.ilike = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.in = (c: string, v: unknown[]) => { filtros[`${c}∈`] = v; return b; };
    b.single = () => { single = true; return b; };
    b.maybeSingle = () => { single = true; return b; };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      const filas = (tablas[tabla] ?? []).filter((f) =>
        Object.entries(filtros).every(([k, v]) => (k.endsWith("∈") ? (v as unknown[]).includes(f[k.slice(0, -1)]) : f[k] === v)));
      return Promise.resolve({ data: single ? (filas[0] ?? null) : filas, error: null }).then(res, rej);
    };
    return b;
  }
  return { from: vi.fn(builder) };
}

function sesion(usuario: { id: string; email: string } | null) {
  (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue(usuario ? { data: { user: usuario }, error: null } : { data: { user: null }, error: { message: "no" } }) },
  });
}
const request = () => ({ nextUrl: new URL("http://localhost/api/sugeridas?narrador=n1"), json: async () => ({}) }) as never;
const martina = { id: "u-martina", email: "martina@mail.com" };
const vecino = { id: "u-vecino", email: "vecino@mail.com" };
const alfredo = { id: "n1", nombre: "Alfredo", como_le_dicen: "Abuelo", estado: "activo", dia_actual: 3, alerta_silencio: false, familia_id: "fam-martina", created_at: "x" };

function armar(invitados: Fila[] = []) {
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(crearAdmin({
    familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
    narradores: [alfredo],
    invitados,
  }));
}

const fetchOriginal = globalThis.fetch;
beforeEach(() => {
  vi.clearAllMocks();
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ getAll: () => [], set: () => {} });
  process.env.ENTREVISTADOR_URL = "https://entrevistador.test";
  process.env.SUGERIDAS_CLAVE = "clave-compartida";
});
afterEach(() => {
  globalThis.fetch = fetchOriginal;
  delete process.env.ENTREVISTADOR_URL;
  delete process.env.SUGERIDAS_CLAVE;
});

describe("POST /api/sugeridas", () => {
  it("sin sesión → 401", async () => {
    sesion(null); armar();
    expect((await POST(request())).status).toBe(401);
  });

  it("la dueña pide y la web le pasa la pregunta al entrevistador con la clave", async () => {
    sesion(martina); armar();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ sugeridas: [{ texto: "¿Y su hermano Rubén?", capitulo: "Las raíces" }] }), { status: 200 }));
    globalThis.fetch = fetchMock as never;

    const r = await POST(request());
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ sugeridas: [{ texto: "¿Y su hermano Rubén?", capitulo: "Las raíces" }] });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://entrevistador.test/sugeridas");
    expect((init.headers as Record<string, string>)["x-clave"]).toBe("clave-compartida");
    expect(JSON.parse(init.body as string)).toEqual({ narradorId: "n1" });
  });

  it("un visitante (guardó el link) no puede pedir → 403", async () => {
    sesion(vecino); armar([{ id: "i1", narrador_id: "n1", auth_user_id: "u-vecino", email: "vecino@mail.com", rol: "visitante" }]);
    globalThis.fetch = vi.fn() as never;
    expect((await POST(request())).status).toBe(403);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("sin ENTREVISTADOR_URL o sin clave configurada → 503, sin llamar a nadie", async () => {
    sesion(martina); armar();
    delete process.env.SUGERIDAS_CLAVE;
    globalThis.fetch = vi.fn() as never;
    expect((await POST(request())).status).toBe(503);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("si el entrevistador falla, 502 con un mensaje para la familia", async () => {
    sesion(martina); armar();
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "x" }), { status: 500 })) as never;
    const r = await POST(request());
    expect(r.status).toBe(502);
    expect(((await r.json()) as { error: string }).error).toMatch(/intent/i);
  });
});
