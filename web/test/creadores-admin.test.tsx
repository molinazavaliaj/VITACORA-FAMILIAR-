import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// 07 · Creadores del panel de la empresa (21/10): las server actions vuelven a
// chequear ADMIN_EMAILS (son endpoints sueltos: el layout no las protege),
// aprobar valida el código y manda la bienvenida, y la pantalla se pinta.

type Op = { tabla: string; op: string; valores?: unknown; filtros: [string, string, unknown][] };

const { estado } = vi.hoisted(() => ({
  estado: {
    email: null as string | null,
    ops: [] as Op[],
    responder: (() => undefined) as (op: Op) => { data: unknown; error: unknown } | undefined,
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({
  crearClienteSesion: async () => ({ auth: { getUser: async () => ({ data: { user: estado.email ? { email: estado.email } : null } }) } }),
}));
vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: () => ({
    from: (tabla: string) => {
      const op: Op = { tabla, op: "select", filtros: [] };
      const b: Record<string, unknown> = {};
      for (const t of ["eq", "in", "is", "gte", "order", "limit"]) {
        b[t] = (col: string, val: unknown) => {
          op.filtros.push([t, col, val]);
          return b;
        };
      }
      b.select = () => b;
      for (const tipo of ["insert", "update"]) {
        b[tipo] = (valores: unknown) => {
          op.op = tipo;
          op.valores = valores;
          return b;
        };
      }
      const resolver = () => {
        estado.ops.push(op);
        return Promise.resolve(estado.responder(op) ?? { data: null, error: null });
      };
      b.single = resolver;
      b.maybeSingle = resolver;
      b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => resolver().then(res, rej);
      return b;
    },
  }),
}));

import { anular, aprobar, cambiar, marcarPagado, pausar, rechazar, reactivar } from "../src/app/admin/creadores/acciones";
import PantallaCreadores from "../src/app/admin/creadores/page";
import type { FilaCreador } from "../src/lib/creadores";

const ID = "11111111-1111-4111-8111-111111111111";

const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
};

function creador(cambios: Partial<FilaCreador> = {}): FilaCreador {
  return {
    id: ID,
    created_at: "2026-10-21T10:00:00Z",
    nombre: "Pruebalia Testina",
    email: "prueba@ejemplo.com",
    red: "tiktok",
    perfil: "tiktok.com/@pruebalia",
    seguidores: "4.000",
    mensaje: "Hago videos de recuerdos.",
    region: "ES",
    idioma: "ca",
    estado: "pendiente",
    codigo: null,
    comision: null,
    descuento: null,
    token_panel: null,
    aprobado_at: null,
    notas: null,
    ...cambios,
  };
}

let mails: { to: string[]; subject: string; html: string; text: string }[] = [];

beforeEach(() => {
  estado.email = "socio@vitacora.com";
  estado.ops = [];
  estado.responder = () => undefined;
  process.env.ADMIN_EMAILS = "socio@vitacora.com, otra@vitacora.com";
  process.env.CREADORES = "1";
  process.env.RESEND_API_KEY = "re_prueba";
  process.env.URL_BASE = "https://vitacorafamiliar.com";
  mails = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: { body: string }) => {
      mails.push(JSON.parse(init.body));
      return { ok: true, text: async () => "" };
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CREADORES;
  delete process.env.ADMIN_EMAILS;
});

const TODAS = { aprobar, rechazar, cambiar, pausar, reactivar, marcarPagado, anular };
const COMPLETO = { id: ID, codigo: "PRUEBALIA", comision: "20", descuento: "10" };

describe("las acciones rechazan a quien no es admin", () => {
  it.each([
    ["sin sesión", null],
    ["con un mail que no está en ADMIN_EMAILS", "intruso@ejemplo.com"],
  ])("%s: ninguna toca la base", async (_caso, email) => {
    estado.email = email;
    for (const accion of Object.values(TODAS)) {
      expect(await accion(form(COMPLETO))).toEqual({ error: "No tenés permiso para esto." });
    }
    expect(estado.ops).toEqual([]);
    expect(mails).toEqual([]);
  });

  it("sin ADMIN_EMAILS no entra nadie (falla cerrado)", async () => {
    delete process.env.ADMIN_EMAILS;
    expect(await aprobar(form(COMPLETO))).toEqual({ error: "No tenés permiso para esto." });
    expect(estado.ops).toEqual([]);
  });

  it("con CREADORES apagado, un admin tampoco toca nada", async () => {
    delete process.env.CREADORES;
    expect((await aprobar(form(COMPLETO))).error).toContain("apagado");
    expect(estado.ops).toEqual([]);
  });
});

describe("aprobar", () => {
  it("valida el código y los porcentajes antes de tocar la base", async () => {
    expect((await aprobar(form({ ...COMPLETO, codigo: "VITACORA10X" }))).error).toContain("código");
    expect((await aprobar(form({ ...COMPLETO, comision: "0" }))).error).toContain("comisión");
    expect((await aprobar(form({ ...COMPLETO, comision: "51" }))).error).toContain("comisión");
    expect((await aprobar(form({ ...COMPLETO, descuento: "60" }))).error).toContain("descuento");
    expect((await aprobar(form({ ...COMPLETO, id: "x" }))).error).toBe("Falta el id.");
    expect(estado.ops).toEqual([]);
  });

  it("deja activo con su código, el token del panel y manda la bienvenida en su idioma", async () => {
    estado.responder = (op) => {
      if (op.op === "update") return { data: [creador({ ...(op.valores as Partial<FilaCreador>) })], error: null };
      return { data: null, error: null };
    };
    const r = await aprobar(form({ ...COMPLETO, codigo: "prueba-lía" }));
    expect(r).toEqual({ error: null, listo: "Aprobado con el código PRUEBALIA. Le mandamos la bienvenida." });
    const update = estado.ops.find((o) => o.op === "update")!;
    const v = update.valores as Record<string, unknown>;
    expect(v).toMatchObject({ estado: "activo", codigo: "PRUEBALIA", comision: 20, descuento: 10 });
    expect(String(v.token_panel)).toMatch(/^[A-Za-z0-9_-]{43}$/);
    // Compare-and-swap: solo si sigue pendiente.
    expect(update.filtros).toContainEqual(["eq", "estado", "pendiente"]);
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toEqual(["prueba@ejemplo.com"]);
    expect(mails[0].text).toContain("PRUEBALIA");
    expect(mails[0].text).toContain("https://vitacorafamiliar.com/ca/comprar?cupon=PRUEBALIA");
    expect(mails[0].text).toContain(`https://vitacorafamiliar.com/creador/${String(v.token_panel)}`);
    expect(mails[0].text).toContain("10 % de descompte");
  });

  it("no deja un código que ya tiene otro creador", async () => {
    estado.responder = (op) => (op.op === "select" ? { data: { id: "otro" }, error: null } : undefined);
    expect((await aprobar(form(COMPLETO))).error).toBe("El código PRUEBALIA ya lo tiene otro creador.");
    expect(estado.ops.some((o) => o.op === "update")).toBe(false);
  });

  it("si otro socio ya lo aprobó, no manda otra bienvenida", async () => {
    estado.responder = (op) => (op.op === "update" ? { data: [], error: null } : undefined);
    expect((await aprobar(form(COMPLETO))).error).toContain("ya no está pendiente");
    expect(mails).toEqual([]);
  });
});

describe("lo demás", () => {
  it("marcar pagado pasa a pagadas solo las pendientes de ese creador", async () => {
    estado.responder = (op) => (op.op === "update" ? { data: [{ id: "k1" }, { id: "k2" }], error: null } : undefined);
    expect(await marcarPagado(form({ id: ID }))).toEqual({ error: null, listo: "2 comisiones marcadas como pagadas." });
    const u = estado.ops[0];
    expect(u.tabla).toBe("comisiones_creadores");
    expect(u.valores).toMatchObject({ estado: "pagada" });
    expect(u.filtros).toEqual(expect.arrayContaining([["eq", "creador_id", ID], ["eq", "estado", "pendiente"]]));
  });

  it("cambiar guarda los números nuevos (las ventas viejas no se tocan)", async () => {
    estado.responder = (op) => (op.op === "update" ? { data: [{ id: ID }], error: null } : undefined);
    const r = await cambiar(form({ ...COMPLETO, comision: "25", notas: "grande" }));
    expect(r.error).toBeNull();
    const u = estado.ops.find((o) => o.op === "update")!;
    expect(u.tabla).toBe("creadores");
    expect(u.valores).toEqual({ codigo: "PRUEBALIA", comision: 25, descuento: 10, notas: "grande" });
    expect(estado.ops.some((o) => o.tabla === "comisiones_creadores")).toBe(false);
  });

  it("pausar solo desde activo y reactivar solo desde pausado", async () => {
    estado.responder = (op) => (op.op === "update" ? { data: [{ id: ID }], error: null } : undefined);
    await pausar(form({ id: ID }));
    await reactivar(form({ id: ID }));
    const [p, r] = estado.ops;
    expect(p.valores).toEqual({ estado: "pausado" });
    expect(p.filtros).toContainEqual(["eq", "estado", "activo"]);
    expect(r.valores).toEqual({ estado: "activo" });
    expect(r.filtros).toContainEqual(["eq", "estado", "pausado"]);
  });
});

describe("la pantalla", () => {
  it("muestra pendientes con el código sugerido, activos con lo que se les debe y las comisiones", async () => {
    estado.responder = (op) => {
      if (op.tabla === "creadores")
        return {
          data: [
            creador(),
            creador({ id: "c2", nombre: "Lucía Activa", email: "lucia@ejemplo.com", estado: "activo", codigo: "LUCIA", comision: 20, descuento: 10, token_panel: "t".repeat(43), idioma: "ar", region: "AR" }),
          ],
          error: null,
        };
      if (op.tabla === "comisiones_creadores")
        return {
          data: [{ id: "k1", created_at: "2026-10-21T12:00:00Z", creador_id: "c2", pedido_id: "p1", codigo: "LUCIA", total: 77175, moneda: "ARS", porcentaje: 20, importe: 15435, estado: "pendiente", pagada_at: null, anulada_at: null }],
          error: null,
        };
      return undefined;
    };
    const h = renderToStaticMarkup(await PantallaCreadores());
    expect(h).toContain("Pruebalia Testina");
    expect(h).toContain('value="PRUEBALIATESTIN"');
    expect(h).toContain("Lucía Activa");
    expect(h).toContain("/ar/comprar?cupon=LUCIA");
    expect(h).toMatch(/15\.435/);
    expect(h).toContain("marcar pagado");
    expect(h).not.toContain("NaN");
    expect(h).not.toContain("undefined");
  });

  it("sin la migración lo dice, sin romper", async () => {
    estado.responder = () => ({ data: null, error: { code: "42P01", message: 'relation "creadores" does not exist' } });
    expect(renderToStaticMarkup(await PantallaCreadores())).toContain("Falta aplicar la migración");
  });
});
