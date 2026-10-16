import { describe, it, expect, vi, beforeEach } from "vitest";

// PATCH /api/viaje (Viaje V2, 16/10): solo las fechas, y solo mientras el bot
// no tomó el viaje (sin fila en viajes_v2). Mismas reglas que la compra.
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({ crearClienteSesion: vi.fn() }));
vi.mock("@/lib/panel", () => ({ narradorDeLaSesion: vi.fn() }));
vi.mock("@/lib/trato", () => ({ tratoDeLaFamilia: vi.fn(async () => "tu") }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { narradorDeLaSesion } from "@/lib/panel";
import { PATCH } from "../src/app/api/viaje/route";

const escrituras: { tabla: string; valores: Record<string, unknown> }[] = [];
const viaje = { v: 2, salida: "2099-06-02", vuelta: "2099-06-09", zonaCasa: "Europe/Madrid", zonaViaje: "Asia/Tokyo", preguntasPropias: [], formato: "pdf", fotosAlbum: 20, idioma: "es-ES" };

function admin(narrador: Record<string, unknown>, filaV2: unknown = null) {
  return {
    from: (tabla: string) => {
      const b: Record<string, unknown> = {};
      const enc = () => b;
      b.select = enc;
      b.eq = enc;
      b.maybeSingle = async () => ({ data: tabla === "narradores" ? narrador : filaV2, error: null });
      b.update = (valores: Record<string, unknown>) => {
        escrituras.push({ tabla, valores });
        return { eq: async () => ({ error: null }) };
      };
      return b;
    },
  };
}
const peticion = (body: unknown) => ({ json: async () => body, nextUrl: { searchParams: new URLSearchParams("narrador=n1") } }) as never;
const usar = (narrador: Record<string, unknown>, filaV2: unknown = null) =>
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin(narrador, filaV2));

beforeEach(() => {
  escrituras.length = 0;
  (crearClienteSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (narradorDeLaSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, narrador: { id: "n1", familia_id: "f1" } });
  usar({ contexto: { modo: "viaje", idioma: "es-ES", viaje }, estado: "invitado" });
});

describe("PATCH /api/viaje — las fechas (V2)", () => {
  it("antes de que el bot tome el viaje, corre salida y vuelta sin tocar lo demás", async () => {
    const r = await PATCH(peticion({ salida: "2099-07-01", vuelta: "2099-07-10" }));
    expect(r.status).toBe(200);
    expect(escrituras).toEqual([
      { tabla: "narradores", valores: { contexto: { modo: "viaje", idioma: "es-ES", viaje: { ...viaje, salida: "2099-07-01", vuelta: "2099-07-10" } } } },
    ]);
  });
  it("menos de 3 días, o la vuelta antes de la salida: 400 y no escribe", async () => {
    expect((await PATCH(peticion({ salida: "2099-07-01", vuelta: "2099-07-02" }))).status).toBe(400);
    expect((await PATCH(peticion({ salida: "2099-07-01", vuelta: "2099-06-20" }))).status).toBe(400);
    expect(escrituras).toEqual([]);
  });
  it("con la fila de viajes_v2 creada, las fechas son del bot: 400 con «escríbenos»", async () => {
    usar({ contexto: { modo: "viaje", viaje }, estado: "activo" }, { narrador_id: "n1" });
    const r = await PATCH(peticion({ vuelta: "2099-06-20" }));
    expect(r.status).toBe(400);
    expect(((await r.json()) as { error: string }).error).toContain("escríbenos");
    expect(escrituras).toEqual([]);
  });
  it("no es un viaje, o ya terminó: 400", async () => {
    usar({ contexto: { modo: "familiar" }, estado: "activo" });
    expect((await PATCH(peticion({ vuelta: "2099-06-20" }))).status).toBe(400);
    usar({ contexto: { modo: "viaje", viaje }, estado: "completado" });
    expect((await PATCH(peticion({ vuelta: "2099-06-20" }))).status).toBe(400);
    expect(escrituras).toEqual([]);
  });
  it("con la salida ya pasada (y el bot sin tomar el viaje), se puede correr la vuelta sin tocar la salida", async () => {
    usar({ contexto: { modo: "viaje", viaje: { ...viaje, salida: "2020-01-01", vuelta: "2020-01-05" } }, estado: "invitado" });
    expect((await PATCH(peticion({ vuelta: "2020-01-10" }))).status).toBe(200);
    expect((await PATCH(peticion({ salida: "2020-01-02", vuelta: "2020-01-10" }))).status).toBe(400);
  });
  it("ya no hay etapas ni ángulos: se ignoran (no llegan al contexto)", async () => {
    await PATCH(peticion({ etapas: [{ nombre: "Lisboa" }], angulos: ["comida"], vuelta: "2099-06-12" }));
    expect(JSON.stringify(escrituras)).not.toMatch(/Lisboa|angulos|etapas/);
  });
});
