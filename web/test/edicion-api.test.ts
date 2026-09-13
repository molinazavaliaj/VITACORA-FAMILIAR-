import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PATCH, POST } from "../src/app/api/edicion/route";

type Fila = Record<string, unknown>;

function crearAdmin(tablas: Record<string, Fila[]>) {
  const updates: { tabla: string; valores: Fila; filtros: Fila }[] = [];
  function builder(tabla: string) {
    const filtros: Fila = {};
    let op = "select";
    let valores: Fila = {};
    let single = false;
    const b: Record<string, unknown> = {};
    const enc = () => b;
    b.select = enc; b.order = enc;
    b.eq = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.is = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.ilike = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.in = (c: string, v: unknown[]) => { filtros[`${c}∈`] = v; return b; };
    b.update = (v: Fila) => { op = "update"; valores = v; return b; };
    b.single = () => { single = true; return b; };
    b.maybeSingle = () => { single = true; return b; };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      let r: { data: unknown; error: unknown };
      if (op === "update") {
        updates.push({ tabla, valores, filtros });
        // el cerrar usa compare-and-swap: devuelve fila solo si libro_aprobado_at era null
        const filas = (tablas[tabla] ?? []).filter((f) => Object.entries(filtros).every(([k, v]) => f[k] === v));
        r = { data: filas.map(() => ({ libro_aprobado_at: valores.libro_aprobado_at ?? null })), error: null };
      } else {
        const filas = (tablas[tabla] ?? []).filter((f) =>
          Object.entries(filtros).every(([k, v]) => (k.endsWith("∈") ? (v as unknown[]).includes(f[k.slice(0, -1)]) : f[k] === v)));
        r = { data: single ? (filas[0] ?? null) : filas, error: null };
      }
      return Promise.resolve(r).then(res, rej);
    };
    return b;
  }
  return { admin: { from: vi.fn(builder) }, updates };
}

function sesion(usuario: { id: string; email: string } | null) {
  (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue(usuario ? { data: { user: usuario }, error: null } : { data: { user: null }, error: { message: "no" } }) },
  });
}
const req = (cuerpo: unknown) => ({ nextUrl: new URL("http://localhost/api/edicion?narrador=n1"), json: async () => cuerpo }) as never;
const martina = { id: "u-martina", email: "martina@mail.com" };

function armar(narrador: Fila) {
  const { admin, updates } = crearAdmin({
    familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
    narradores: [{ id: "n1", nombre: "Alfredo", como_le_dicen: "Abuelo", alerta_silencio: false, familia_id: "fam-martina", created_at: "x", dia_actual: 30, edicion: {}, libro_aprobado_at: null, estado: "completado", ...narrador }],
    preguntas: [{ narrador_id: "n1", capitulo: "La infancia" }, { narrador_id: "n1", capitulo: "El amor" }],
    respuestas: [{ narrador_id: "n1", id: "r1" }, { narrador_id: "n1", id: "r2" }],
    invitados: [],
  });
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
  return updates;
}

beforeEach(() => {
  vi.clearAllMocks();
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ getAll: () => [], set: () => {} });
});

describe("PATCH /api/edicion", () => {
  it("guarda la edición encima de lo que ya había", async () => {
    sesion(martina);
    const updates = armar({ edicion: { titulo: "Viejo" } });
    const r = await PATCH(req({ subtitulo: "Alfredo Pérez", excluidas: ["r2"] }));
    expect(r.status).toBe(200);
    expect(updates[0]!.valores).toEqual({ edicion: { titulo: "Viejo", subtitulo: "Alfredo Pérez", excluidas: ["r2"] } });
  });
  it("mientras la entrevista sigue, no se edita → 400", async () => {
    sesion(martina);
    armar({ estado: "activo" });
    expect((await PATCH(req({ titulo: "x" }))).status).toBe(400);
  });
  it("con el libro cerrado, no se cambia más → 400", async () => {
    sesion(martina);
    armar({ libro_aprobado_at: "2026-09-13T00:00:00Z" });
    expect((await PATCH(req({ titulo: "Otro título" }))).status).toBe(400);
  });
});

describe("POST /api/edicion (cerrar)", () => {
  it("con la confirmación, escribe libro_aprobado_at una sola vez", async () => {
    sesion(martina);
    const updates = armar({});
    const r = await POST(req({ accion: "cerrar", confirmo: true }));
    expect(r.status).toBe(200);
    expect(updates[0]!.filtros).toMatchObject({ id: "n1", libro_aprobado_at: null });
    expect(typeof updates[0]!.valores.libro_aprobado_at).toBe("string");
  });
  it("sin la confirmación explícita no cierra → 400", async () => {
    sesion(martina);
    const updates = armar({});
    expect((await POST(req({ accion: "cerrar" }))).status).toBe(400);
    expect(updates).toHaveLength(0);
  });
});
