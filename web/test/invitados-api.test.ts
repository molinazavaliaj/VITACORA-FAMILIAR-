import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/mail", () => ({ enviarMailInvitacion: vi.fn().mockResolvedValue(true) }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { enviarMailInvitacion } from "@/lib/mail";
import { POST } from "../src/app/api/invitados/route";

type Fila = Record<string, unknown>;

function crearAdmin(tablas: Record<string, Fila[]>) {
  const inserts: { tabla: string; valores: Fila }[] = [];
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
    b.insert = (v: Fila) => { op = "insert"; valores = v; return b; };
    b.update = (v: Fila) => { op = "update"; valores = v; return b; };
    b.single = () => { single = true; return b; };
    b.maybeSingle = () => { single = true; return b; };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      let r: { data: unknown; error: unknown };
      if (op === "insert") { inserts.push({ tabla, valores }); r = { data: { id: "inv-nuevo" }, error: null }; }
      else if (op === "update") r = { data: null, error: null };
      else {
        const filas = (tablas[tabla] ?? []).filter((f) =>
          Object.entries(filtros).every(([k, v]) => (k.endsWith("∈") ? (v as unknown[]).includes(f[k.slice(0, -1)]) : f[k] === v)));
        r = { data: single ? (filas[0] ?? null) : filas, error: null };
      }
      return Promise.resolve(r).then(res, rej);
    };
    return b;
  }
  return { admin: { from: vi.fn(builder) }, inserts };
}

function sesion(usuario: { id: string; email: string } | null) {
  (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue(usuario ? { data: { user: usuario }, error: null } : { data: { user: null }, error: { message: "no" } }) },
  });
}
const request = (cuerpo: unknown) => ({ nextUrl: new URL("http://localhost/api/invitados?narrador=n1"), json: async () => cuerpo }) as never;
const martina = { id: "u-martina", email: "martina@mail.com" };
const primo = { id: "u-primo", email: "primo@mail.com" };
const alfredo = { id: "n1", nombre: "Alfredo", como_le_dicen: "Abuelo", estado: "activo", dia_actual: 3, alerta_silencio: false, familia_id: "fam-martina", created_at: "x", libro_aprobado_at: null };

function armar(invitados: Fila[] = []) {
  const { admin, inserts } = crearAdmin({
    familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina", nombre: "Martina" }],
    narradores: [alfredo],
    invitados,
  });
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
  return inserts;
}

beforeEach(() => {
  vi.clearAllMocks();
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ getAll: () => [], set: () => {} });
});

describe("POST /api/invitados", () => {
  it("la dueña invita: se crea la fila y sale el mail con quién invita", async () => {
    sesion(martina);
    const inserts = armar();
    const r = await POST(request({ email: "Tia@Mail.com" }));
    expect(r.status).toBe(200);
    expect(inserts[0].valores).toMatchObject({ narrador_id: "n1", email: "tia@mail.com", invitado_por: "fam-martina" });
    expect(enviarMailInvitacion).toHaveBeenCalledWith({ para: "tia@mail.com", nombreNarrador: "Alfredo", quienInvita: "Martina" });
  });

  it("un invitado no puede invitar → 403", async () => {
    sesion(primo);
    armar([{ id: "i1", narrador_id: "n1", auth_user_id: "u-primo", email: "primo@mail.com" }]);
    expect((await POST(request({ email: "otro@mail.com" }))).status).toBe(403);
  });

  it("con 3 invitados no entra el cuarto → 400", async () => {
    sesion(martina);
    armar([1, 2, 3].map((i) => ({ id: `i${i}`, narrador_id: "n1", auth_user_id: null, email: `p${i}@mail.com` })));
    expect((await POST(request({ email: "cuarto@mail.com" }))).status).toBe(400);
  });

  it("el mismo correo dos veces → 409", async () => {
    sesion(martina);
    armar([{ id: "i1", narrador_id: "n1", auth_user_id: null, email: "tia@mail.com" }]);
    expect((await POST(request({ email: "TIA@mail.com" }))).status).toBe(409);
  });

  it("invitarse a uno mismo → 400", async () => {
    sesion(martina);
    armar();
    expect((await POST(request({ email: "martina@mail.com" }))).status).toBe(400);
  });
});
