import { describe, it, expect, vi, beforeEach } from "vitest";

// DELETE /api/fotos/[fotoId]: sacar una foto (01/11, Naza no podía sacar las repetidas en Encargar libro).
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({ crearClienteSesion: vi.fn() }));
vi.mock("@/lib/panel", () => ({ historiaAccesible: vi.fn() }));
vi.mock("@/lib/trato", () => ({ tratoDeLaFamilia: vi.fn(async () => "vos") }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { historiaAccesible } from "@/lib/panel";
import { DELETE } from "../src/app/api/fotos/[fotoId]/route";

const escrituras: { tabla: string; op: string; valores?: Record<string, unknown> }[] = [];
const borradas: string[] = [];
function admin(filas: Record<string, Record<string, unknown>>) {
  return {
    from: (tabla: string) => {
      const b: Record<string, unknown> = {};
      const enc = () => b;
      b.select = enc; b.eq = enc;
      b.maybeSingle = async () => ({ data: filas[tabla] ?? null, error: null });
      b.update = (valores: Record<string, unknown>) => { escrituras.push({ tabla, op: "update", valores }); return { eq: async () => ({ error: null }) }; };
      b.delete = () => { escrituras.push({ tabla, op: "delete" }); return { eq: async () => ({ error: null }) }; };
      return b;
    },
    storage: { from: () => ({ remove: async (p: string[]) => { borradas.push(...p); return { error: null }; } }) },
  };
}
const params = Promise.resolve({ fotoId: "f1" });
const foto = { id: "f1", narrador_id: "n1", storage_path: "n1/fotos/f1.jpg", subida_por: "u1" };
const usar = (narradores: Record<string, unknown>) =>
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ fotos: foto, narradores }));

beforeEach(() => {
  escrituras.length = 0;
  borradas.length = 0;
  (crearClienteSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) } });
  (historiaAccesible as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ historia: { rol: "duena", narrador: { familia_id: "fam" } } });
});

describe("DELETE /api/fotos/[fotoId]", () => {
  it("la dueña la saca: se borra la fila y el archivo, la edición no se toca si no la usaba", async () => {
    usar({ libro_aprobado_at: null, edicion: { portadaFotoId: "otra" } });
    const r = await DELETE({} as never, { params });
    expect(r.status).toBe(200);
    expect(escrituras).toContainEqual({ tabla: "fotos", op: "delete" });
    expect(escrituras.some((e) => e.tabla === "narradores")).toBe(false);
    expect(borradas).toEqual(["n1/fotos/f1.jpg"]);
  });

  it("si era la tapa o un marco, ese lugar queda sin foto y lo demás sigue igual", async () => {
    usar({ libro_aprobado_at: null, edicion: { titulo: "Su vida", portadaFotoId: "f1", contratapaFotoId: "f2", marcoFotoId: "f1", marcosFotoIds: ["f1", "f3"] } });
    expect((await DELETE({} as never, { params })).status).toBe(200);
    expect(escrituras.find((e) => e.tabla === "narradores")?.valores).toEqual({
      edicion: { titulo: "Su vida", portadaFotoId: null, contratapaFotoId: "f2", marcoFotoId: null, marcosFotoIds: [null, "f3"] },
    });
  });

  it("con el libro encargado no se saca nada", async () => {
    usar({ libro_aprobado_at: "2026-10-30", edicion: null });
    const r = await DELETE({} as never, { params });
    expect(r.status).toBe(400);
    expect(escrituras).toEqual([]);
    expect(borradas).toEqual([]);
  });

  it("un invitado no saca la que subió otro", async () => {
    (historiaAccesible as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ historia: { rol: "invitado", narrador: { familia_id: "fam" } } });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ fotos: { ...foto, subida_por: "otro" }, narradores: { libro_aprobado_at: null } }));
    expect((await DELETE({} as never, { params })).status).toBe(403);
    expect(escrituras).toEqual([]);
  });
});
