import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { POST } from "../src/app/api/fotos/route";
import { MENSAJE_HEIC } from "../src/lib/guion";

// Base falsa por tablas (misma idea que guion-api.test.ts), más un Storage que registra subidas.
type Fila = Record<string, unknown>;

function crearAdmin(tablas: Record<string, Fila[]>) {
  const escrituras: { tabla: string; op: string; valores?: Fila; filtros: Fila }[] = [];
  const subidas: string[] = [];
  function builder(tabla: string) {
    const filtros: Fila = {};
    let op = "select";
    let valores: Fila | Fila[] = {};
    const b: Record<string, unknown> = {};
    const enc = () => b;
    b.select = enc; b.order = enc;
    b.eq = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.is = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.in = (c: string, v: unknown[]) => { filtros[`${c}∈`] = v; return b; };
    b.insert = (v: Fila | Fila[]) => { op = "insert"; valores = v; return b; };
    b.update = (v: Fila) => { op = "update"; valores = v; return b; };
    const resolver = () => {
      if (op !== "select") {
        escrituras.push({ tabla, op, valores: Array.isArray(valores) ? { filas: valores } : valores, filtros });
        return { data: null, error: null };
      }
      const filas = (tablas[tabla] ?? []).filter((f) =>
        Object.entries(filtros).every(([k, v]) => (k.endsWith("∈") ? (v as unknown[]).includes(f[k.slice(0, -1)]) : f[k] === v)),
      );
      return { data: filas, error: null };
    };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      const r = resolver();
      const usoSingle = (b as { _single?: boolean })._single;
      return Promise.resolve(usoSingle && Array.isArray(r.data) ? { ...r, data: r.data[0] ?? null } : r).then(res, rej);
    };
    const marcarSingle = () => { (b as { _single?: boolean })._single = true; return b; };
    b.single = marcarSingle; b.maybeSingle = marcarSingle;
    return b;
  }
  const storage = {
    from: () => ({
      upload: vi.fn(async (path: string) => { subidas.push(path); return { error: null }; }),
      remove: vi.fn(async () => ({ error: null })),
    }),
  };
  return { admin: { from: vi.fn(builder), storage }, escrituras, subidas };
}

const martina = { id: "u-martina", email: "martina@mail.com" };

function sesion(usuario: { id: string; email: string } | null) {
  (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue(usuario ? { data: { user: usuario }, error: null } : { data: { user: null }, error: { message: "no" } }) },
  });
}

function armar() {
  const armado = crearAdmin({
    familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
    narradores: [{
      id: "n1", nombre: "Alfredo", como_le_dicen: "Abuelo", estado: "activo", dia_actual: 3,
      alerta_silencio: false, familia_id: "fam-martina", created_at: "2026-09-10", contexto: {}, libro_aprobado_at: null,
    }],
    preguntas: [],
    invitados: [],
  });
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(armado.admin);
  return armado;
}

function requestConFoto(archivo: File, capitulo = "La infancia") {
  const form = new FormData();
  form.set("archivo", archivo);
  form.set("capitulo", capitulo);
  return { nextUrl: new URL("http://localhost/api/fotos?narrador=n1"), formData: async () => form } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ getAll: () => [], set: () => {} });
});

describe("POST /api/fotos — tipo de archivo", () => {
  it("una foto HEIC se rechaza con el aviso de exportar a JPG y no se sube nada", async () => {
    sesion(martina);
    const { subidas, escrituras } = armar();
    const r = await POST(requestConFoto(new File([new Uint8Array([1, 2, 3])], "IMG_0001.HEIC", { type: "image/heic" })));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: MENSAJE_HEIC });
    expect(subidas).toEqual([]);
    expect(escrituras.filter((e) => e.tabla === "fotos")).toEqual([]);
  });

  it("un PDF se rechaza como no-imagen", async () => {
    sesion(martina);
    armar();
    const r = await POST(requestConFoto(new File([new Uint8Array([1])], "doc.pdf", { type: "application/pdf" })));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Tiene que ser una imagen (JPG, PNG o WebP)." });
  });

  it("un JPG entra: se sube con extensión jpg y queda la fila", async () => {
    sesion(martina);
    const { subidas, escrituras } = armar();
    const r = await POST(requestConFoto(new File([new Uint8Array([1])], "foto.jpg", { type: "image/jpeg" })));
    expect(r.status).toBe(200);
    expect(subidas).toHaveLength(1);
    expect(subidas[0]).toMatch(/^n1\/fotos\/[0-9a-f-]+\.jpg$/);
    expect(escrituras).toContainEqual(expect.objectContaining({ tabla: "fotos", op: "insert" }));
  });
});
