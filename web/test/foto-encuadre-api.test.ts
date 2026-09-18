import { describe, it, expect, vi, beforeEach } from "vitest";

// PATCH /api/fotos/[fotoId] con {foco, posicion} (3b.6): encuadrar sin mover.
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({ crearClienteSesion: vi.fn() }));
vi.mock("@/lib/panel", () => ({ historiaAccesible: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { historiaAccesible } from "@/lib/panel";
import { PATCH } from "../src/app/api/fotos/[fotoId]/route";

const escrituras: { tabla: string; valores: Record<string, unknown> }[] = [];
function admin(filas: Record<string, Record<string, unknown>>) {
  return {
    from: (tabla: string) => {
      const b: Record<string, unknown> = {};
      const enc = () => b;
      b.select = enc; b.eq = enc; b.is = enc;
      b.maybeSingle = async () => ({ data: filas[tabla] ?? null, error: null });
      b.update = (valores: Record<string, unknown>) => { escrituras.push({ tabla, valores }); return { eq: async () => ({ error: null }) }; };
      return b;
    },
  };
}

function peticion(body: unknown) {
  return { json: async () => body } as never;
}
const params = Promise.resolve({ fotoId: "f1" });

beforeEach(() => {
  escrituras.length = 0;
  (crearClienteSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) } });
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({
    fotos: { id: "f1", narrador_id: "n1" },
    narradores: { libro_aprobado_at: null },
  }));
  (historiaAccesible as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ historia: { rol: "duena" } });
});

describe("PATCH /api/fotos/[fotoId] — encuadre (3b.6)", () => {
  it("guarda foco y posición sin tocar capítulo ni principal", async () => {
    const r = await PATCH(peticion({ foco: { x: 0.3, y: 0.2 }, posicion: "abajo" }), { params });
    expect(r.status).toBe(200);
    expect(escrituras).toEqual([{ tabla: "fotos", valores: { foco: { x: 0.3, y: 0.2 }, posicion: "abajo" } }]);
  });

  it("un foco fuera de 0..1 o una posición inventada dan 400 y no escriben", async () => {
    expect((await PATCH(peticion({ foco: { x: 1.5, y: 0.2 } }), { params })).status).toBe(400);
    expect((await PATCH(peticion({ posicion: "centro" }), { params })).status).toBe(400);
    expect(escrituras).toEqual([]);
  });

  it("un cuerpo sin capítulo ni encuadre da 400", async () => {
    expect((await PATCH(peticion({}), { params })).status).toBe(400);
  });

  it("solo la dueña encuadra; con el libro encargado ya no", async () => {
    (historiaAccesible as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ historia: { rol: "invitado" } });
    expect((await PATCH(peticion({ foco: { x: 0.5, y: 0.5 } }), { params })).status).toBe(403);
    (historiaAccesible as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ historia: { rol: "duena" } });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ fotos: { id: "f1", narrador_id: "n1" }, narradores: { libro_aprobado_at: "2026-09-18" } }));
    expect((await PATCH(peticion({ foco: { x: 0.5, y: 0.5 } }), { params })).status).toBe(400);
  });
});
