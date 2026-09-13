import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PATCH } from "../src/app/api/guion/route";

// Base falsa por tablas, con filtros reales y captura de escrituras.
type Fila = Record<string, unknown>;

function crearAdmin(tablas: Record<string, Fila[]>) {
  const escrituras: { tabla: string; op: string; valores?: Fila; filtros: Fila }[] = [];
  function builder(tabla: string) {
    const filtros: Fila = {};
    let op = "select";
    let valores: Fila | Fila[] = {};
    const b: Record<string, unknown> = {};
    const enc = () => b;
    b.select = enc; b.order = enc; b.single = enc; b.maybeSingle = enc;
    b.eq = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.is = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.ilike = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.in = (c: string, v: unknown[]) => { filtros[`${c}∈`] = v; return b; };
    b.insert = (v: Fila | Fila[]) => { op = "insert"; valores = v; return b; };
    b.update = (v: Fila) => { op = "update"; valores = v; return b; };
    b.delete = () => { op = "delete"; return b; };
    const resolver = () => {
      if (op !== "select") {
        escrituras.push({ tabla, op, valores: Array.isArray(valores) ? { filas: valores } : valores, filtros });
        if (op === "insert" && !Array.isArray(valores)) return { data: { id: "nueva", orden: (valores as Fila).orden }, error: null };
        return { data: null, error: null };
      }
      const filas = (tablas[tabla] ?? []).filter((f) =>
        Object.entries(filtros).every(([k, v]) => (k.endsWith("∈") ? (v as unknown[]).includes(f[k.slice(0, -1)]) : f[k] === v)),
      );
      return { data: filas, error: null };
    };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      const r = resolver();
      // maybeSingle/single devuelven una fila, no una lista
      const usoSingle = (b as { _single?: boolean })._single;
      return Promise.resolve(usoSingle && Array.isArray(r.data) ? { ...r, data: r.data[0] ?? null } : r).then(res, rej);
    };
    const marcarSingle = () => { (b as { _single?: boolean })._single = true; return b; };
    b.single = marcarSingle; b.maybeSingle = marcarSingle;
    return b;
  }
  return { admin: { from: vi.fn(builder) }, escrituras };
}

function sesion(usuario: { id: string; email: string } | null) {
  (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue(usuario ? { data: { user: usuario }, error: null } : { data: { user: null }, error: { message: "no" } }) },
  });
}

function request(cuerpo: unknown, narrador = "n1") {
  return { nextUrl: new URL(`http://localhost/api/guion?narrador=${narrador}`), json: async () => cuerpo } as never;
}

const martina = { id: "u-martina", email: "martina@mail.com" };
const invitado = { id: "u-primo", email: "primo@mail.com" };

const narrador = (extra: Fila = {}) => ({
  id: "n1", nombre: "Alfredo", como_le_dicen: "Abuelo", estado: "activo", dia_actual: 3,
  alerta_silencio: false, familia_id: "fam-martina", created_at: "2026-09-10", contexto: {}, ...extra,
});
const fijas = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, narrador_id: "n1", orden: i + 1, texto: `Pregunta ${i + 1} del guion, larga`, capitulo: "La infancia", tipo: "fija", foto_id: null }));

function armar(opciones: { preguntas?: Fila[]; narrador?: Fila; invitados?: Fila[] } = {}) {
  const { admin, escrituras } = crearAdmin({
    familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
    narradores: [opciones.narrador ?? narrador()],
    preguntas: opciones.preguntas ?? fijas(26),
    invitados: opciones.invitados ?? [{ id: "i1", narrador_id: "n1", auth_user_id: "u-primo", email: "primo@mail.com" }],
  });
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
  return escrituras;
}

beforeEach(() => {
  vi.clearAllMocks();
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ getAll: () => [], set: () => {} });
});

describe("PATCH /api/guion", () => {
  it("sin sesión → 401", async () => {
    sesion(null);
    armar();
    expect((await PATCH(request({ accion: "editar", id: "p5", texto: "x" }))).status).toBe(401);
  });

  it("un invitado no edita el guion → 403", async () => {
    sesion(invitado);
    armar();
    const r = await PATCH(request({ accion: "editar", id: "p5", texto: "¿Cómo era su barrio de chico?" }));
    expect(r.status).toBe(403);
  });

  it("la dueña edita una pregunta futura", async () => {
    sesion(martina);
    const escrituras = armar();
    const r = await PATCH(request({ accion: "editar", id: "p5", texto: "  ¿Cómo era   su barrio de chico?  " }));
    expect(r.status).toBe(200);
    expect(escrituras).toContainEqual(expect.objectContaining({ tabla: "preguntas", op: "update", valores: { texto: "¿Cómo era su barrio de chico?" }, filtros: { id: "p5" } }));
  });

  it("una pregunta ya enviada no se edita → 400", async () => {
    sesion(martina);
    armar(); // dia_actual = 3
    const r = await PATCH(request({ accion: "editar", id: "p2", texto: "¿Cómo era su barrio de chico?" }));
    expect(r.status).toBe(400);
  });

  it("un invitado sí puede agregar; va al final con tipo familia y quién la agregó", async () => {
    sesion(invitado);
    const escrituras = armar();
    const r = await PATCH(request({ accion: "agregar", texto: "¿Cómo conoció a la abuela Dora?", capitulo: "El amor" }));
    expect(r.status).toBe(200);
    const insert = escrituras.find((e) => e.tabla === "preguntas" && e.op === "insert");
    expect(insert?.valores).toMatchObject({ orden: 27, tipo: "familia", agregada_por: "u-primo", capitulo: "El amor" });
  });

  it("con 36 de la familia no entra otra → 400", async () => {
    sesion(martina);
    armar({ preguntas: fijas(36) });
    const r = await PATCH(request({ accion: "agregar", texto: "¿Cómo conoció a la abuela Dora?", capitulo: "El amor" }));
    expect(r.status).toBe(400);
  });

  it("sacar la 5 la borra y corre las siguientes en dos pasos (provisorio y definitivo)", async () => {
    sesion(martina);
    const escrituras = armar({ preguntas: fijas(17) }); // 17 → queda en 16, por encima del piso de 15
    const r = await PATCH(request({ accion: "saltar", id: "p5" }));
    expect(r.status).toBe(200);
    expect(escrituras).toContainEqual(expect.objectContaining({ tabla: "preguntas", op: "delete", filtros: { id: "p5" } }));
    const ordenes = escrituras.filter((e) => e.op === "update" && e.valores && "orden" in e.valores).map((e) => [e.filtros.id, e.valores!.orden]);
    // 12 futuras se corren (p6..p17), cada una dos veces: provisorio y definitivo, en ese orden.
    expect(ordenes).toHaveLength(24);
    expect(ordenes.slice(0, 2)).toEqual([["p6", 1005], ["p7", 1006]]);
    expect(ordenes.slice(12, 14)).toEqual([["p6", 5], ["p7", 6]]);
    expect(ordenes[23]).toEqual(["p17", 16]);
  });

  it("no se baja de 15 → 400", async () => {
    sesion(martina);
    armar({ preguntas: fijas(15) });
    expect((await PATCH(request({ accion: "saltar", id: "p10" }))).status).toBe(400);
  });

  it("el ritmo 'seguido' también prende modoRapido, por compatibilidad con los pilotos", async () => {
    sesion(martina);
    const escrituras = armar();
    const r = await PATCH(request({ accion: "ritmo", ritmo: "seguido" }));
    expect(r.status).toBe(200);
    expect(escrituras).toContainEqual(expect.objectContaining({ tabla: "narradores", op: "update", valores: { contexto: { ritmo: "seguido", modoRapido: true } } }));
  });

  it("con la entrevista terminada, nada se cambia → 400", async () => {
    sesion(martina);
    armar({ narrador: narrador({ estado: "completado", dia_actual: 30 }) });
    expect((await PATCH(request({ accion: "evitar", texto: "nada" }))).status).toBe(400);
  });
});
