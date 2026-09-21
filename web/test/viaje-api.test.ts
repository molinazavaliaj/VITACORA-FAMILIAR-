import { describe, it, expect, vi, beforeEach } from "vitest";

// PATCH /api/viaje: las etapas vivas y, desde el panel de viaje (3t.19), los
// ángulos ("sobre qué te preguntamos"). El bot lee contexto.viaje.angulos al
// mandar cada noche, así que guardar acá alcanza para que cambie mañana.
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({ crearClienteSesion: vi.fn() }));
vi.mock("@/lib/panel", () => ({ narradorDeLaSesion: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { narradorDeLaSesion } from "@/lib/panel";
import { PATCH } from "../src/app/api/viaje/route";

const escrituras: { tabla: string; valores: Record<string, unknown> }[] = [];
const viaje = { salida: "2026-09-20", vuelta: "2026-09-29", etapas: [{ nombre: "Lisboa", desde: "2026-09-20" }], angulos: ["comida", "persona"] };

function admin(narrador: Record<string, unknown>) {
  return {
    from: (tabla: string) => {
      const b: Record<string, unknown> = {};
      const enc = () => b;
      b.select = enc; b.eq = enc; b.gt = enc;
      b.maybeSingle = async () => ({ data: tabla === "narradores" ? narrador : null, error: null });
      b.then = (res: (v: unknown) => void) => res({ data: [], error: null }); // .gt(...) esperado como lista
      b.update = (valores: Record<string, unknown>) => { escrituras.push({ tabla, valores }); return { eq: async () => ({ error: null }) }; };
      return b;
    },
  };
}
function peticion(body: unknown) {
  return { json: async () => body, nextUrl: { searchParams: new URLSearchParams("narrador=n1") } } as never;
}

beforeEach(() => {
  escrituras.length = 0;
  (crearClienteSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ contexto: { modo: "viaje", trato: "vos", viaje }, dia_actual: 2, estado: "activo" }));
  (narradorDeLaSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, narrador: { id: "n1" } });
});

describe("PATCH /api/viaje — ángulos (3t.19)", () => {
  it("guarda los ángulos nuevos sin tocar las etapas ni el resto del contexto", async () => {
    const r = await PATCH(peticion({ angulos: ["vos", "lugar", "vos"] }));
    expect(r.status).toBe(200);
    expect(escrituras).toEqual([{ tabla: "narradores", valores: { contexto: { modo: "viaje", trato: "vos", viaje: { ...viaje, angulos: ["vos", "lugar"] } } } }]);
  });
  it("un ángulo inventado da 400 y no escribe", async () => {
    expect((await PATCH(peticion({ angulos: ["clima"] }))).status).toBe(400);
    expect(escrituras).toEqual([]);
  });
  it("sin etapas ni ángulos en el cuerpo, 400: no se borran las etapas por accidente", async () => {
    expect((await PATCH(peticion({}))).status).toBe(400);
    expect(escrituras).toEqual([]);
  });
  it("las etapas siguen funcionando y conservan los ángulos", async () => {
    const r = await PATCH(peticion({ etapas: [{ nombre: "Lisboa", desde: "2026-09-20" }, { nombre: "Oporto" }] }));
    expect(r.status).toBe(200);
    expect(escrituras[0].valores).toEqual({ contexto: { modo: "viaje", trato: "vos", viaje: { ...viaje, etapas: [{ nombre: "Lisboa", desde: "2026-09-20" }, { nombre: "Oporto" }] } } });
  });
});
