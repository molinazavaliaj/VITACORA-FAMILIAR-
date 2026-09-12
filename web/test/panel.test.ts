import { describe, it, expect, vi } from "vitest";
import { historiasDelUsuario, historiaAccesible, PUEDE } from "../src/lib/panel";

// Base falsa mínima: cada tabla devuelve filas según los filtros que recibió.
// Suficiente para probar la regla de acceso sin red.

type Fila = Record<string, unknown>;

function crearAdmin(tablas: Record<string, Fila[]>, opciones: { sinInvitados?: boolean } = {}) {
  const updates: { tabla: string; valores: Fila; filtros: Fila }[] = [];

  function builder(tabla: string) {
    const filtros: Fila = {};
    let op: "select" | "update" = "select";
    let valores: Fila = {};
    const b: Record<string, unknown> = {};
    const encadenar = () => b;
    b.select = encadenar;
    b.order = encadenar;
    b.eq = (col: string, val: unknown) => { filtros[col] = val; return b; };
    b.is = (col: string, val: unknown) => { filtros[col] = val; return b; };
    b.ilike = (col: string, val: unknown) => { filtros[`${col}~`] = String(val).toLowerCase(); return b; };
    b.in = (col: string, vals: unknown[]) => { filtros[`${col}∈`] = vals; return b; };
    b.update = (v: Fila) => { op = "update"; valores = v; return b; };
    const resolver = () => {
      if (tabla === "invitados" && opciones.sinInvitados) {
        return { data: null, error: { message: 'relation "invitados" does not exist' } };
      }
      if (op === "update") {
        updates.push({ tabla, valores, filtros });
        return { data: null, error: null };
      }
      const filas = (tablas[tabla] ?? []).filter((f) =>
        Object.entries(filtros).every(([k, v]) => {
          if (k.endsWith("~")) return String(f[k.slice(0, -1)]).toLowerCase() === v;
          if (k.endsWith("∈")) return (v as unknown[]).includes(f[k.slice(0, -1)]);
          return f[k] === v;
        }),
      );
      return { data: filas, error: null };
    };
    b.maybeSingle = () => Promise.resolve({ ...resolver(), data: resolver().data?.[0] ?? null });
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolver()).then(res, rej);
    return b;
  }

  return { admin: { from: vi.fn(builder) } as never, updates };
}

const alfredo = { id: "n-alfredo", nombre: "Alfredo", como_le_dicen: "Abuelo", estado: "activo", dia_actual: 4, alerta_silencio: false, familia_id: "fam-martina", created_at: "2026-09-10" };
const dora = { id: "n-dora", nombre: "Dora", como_le_dicen: "Abuela", estado: "invitado", dia_actual: 0, alerta_silencio: false, familia_id: "fam-martina", created_at: "2026-09-12" };
const osvaldo = { id: "n-osvaldo", nombre: "Osvaldo", como_le_dicen: "Don Osvaldo", estado: "completado", dia_actual: 30, alerta_silencio: false, familia_id: "fam-claudia", created_at: "2026-09-01" };

const martina = { id: "u-martina", email: "martina@mail.com" };

describe("historiasDelUsuario", () => {
  it("la dueña ve sus narradores, del más nuevo al más viejo, como dueña", async () => {
    const { admin } = crearAdmin({
      familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
      narradores: [alfredo, dora],
      invitados: [],
    });
    const { panel, error } = await historiasDelUsuario(admin, martina);
    expect(error).toBeNull();
    expect(panel.historias.map((h) => [h.narrador.nombre, h.rol])).toEqual([
      ["Alfredo", "duena"],
      ["Dora", "duena"],
    ]);
  });

  it("una historia compartida aparece después de las propias, como invitado", async () => {
    const { admin } = crearAdmin({
      familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
      narradores: [alfredo, osvaldo],
      invitados: [{ id: "i1", narrador_id: "n-osvaldo", auth_user_id: "u-martina", email: "martina@mail.com" }],
    });
    const { panel } = await historiasDelUsuario(admin, martina);
    expect(panel.historias.map((h) => [h.narrador.nombre, h.rol])).toEqual([
      ["Alfredo", "duena"],
      ["Osvaldo", "invitado"],
    ]);
  });

  it("una invitación por mail todavía no abierta se vincula al entrar", async () => {
    const { admin, updates } = crearAdmin({
      familias: [],
      narradores: [osvaldo],
      invitados: [{ id: "i1", narrador_id: "n-osvaldo", auth_user_id: null, email: "Martina@Mail.com" }],
    });
    const { panel } = await historiasDelUsuario(admin, martina);
    expect(panel.familia).toBeNull(); // nunca compró nada
    expect(panel.historias).toHaveLength(1);
    expect(panel.historias[0].rol).toBe("invitado");
    expect(updates[0]).toMatchObject({ tabla: "invitados", valores: { auth_user_id: "u-martina" } });
  });

  it("si la tabla invitados no existe todavía, el panel funciona igual sin invitados", async () => {
    const { admin } = crearAdmin(
      { familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }], narradores: [alfredo] },
      { sinInvitados: true },
    );
    const { panel, error } = await historiasDelUsuario(admin, martina);
    expect(error).toBeNull();
    expect(panel.historias).toHaveLength(1);
  });
});

describe("historiaAccesible", () => {
  const tablas = {
    familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
    narradores: [alfredo, osvaldo],
    invitados: [{ id: "i1", narrador_id: "n-osvaldo", auth_user_id: "u-martina", email: "martina@mail.com" }],
  };

  it("el propio narrador: dueña", async () => {
    const { historia } = await historiaAccesible(crearAdmin(tablas).admin, martina, "n-alfredo");
    expect(historia?.rol).toBe("duena");
  });

  it("uno compartido: invitado", async () => {
    const { historia } = await historiaAccesible(crearAdmin(tablas).admin, martina, "n-osvaldo");
    expect(historia?.rol).toBe("invitado");
  });

  it("uno ajeno: null (la página responde 404, no 403, para no confirmar que existe)", async () => {
    const ajeno = { ...osvaldo, id: "n-ajeno" };
    const { historia } = await historiaAccesible(
      crearAdmin({ ...tablas, narradores: [alfredo, ajeno] }).admin, martina, "n-ajeno",
    );
    expect(historia).toBeNull();
  });
});

describe("PUEDE", () => {
  it("la dueña puede todo; el invitado solo agrega", () => {
    expect(PUEDE.editarGuion("duena")).toBe(true);
    expect(PUEDE.editarGuion("invitado")).toBe(false);
    expect(PUEDE.agregarPreguntasYFotos("invitado")).toBe(true);
    expect(PUEDE.cerrarLibro("invitado")).toBe(false);
    expect(PUEDE.descargar("invitado")).toBe(false);
  });
});
