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

// Las fechas, vivas (12/10): la base falsa guarda las preguntas de verdad para
// ver qué queda después de estirar o acortar.
describe("PATCH /api/viaje — fechas (12/10)", () => {
  type Pregunta = { id: string; orden: number; tipo: string; texto: string; capitulo: string };
  let preguntas: Pregunta[];
  let respuestas: { pregunta_orden: number }[];
  let filaV2: unknown;

  function base(narrador: Record<string, unknown>) {
    return {
      from: (tabla: string) => {
        const filtros: Record<string, unknown> = {};
        let op = "select";
        let ids: string[] = [];
        const b: Record<string, unknown> = {};
        b.select = () => b;
        b.eq = (c: string, v: unknown) => { filtros[c] = v; return b; };
        b.gt = (c: string, v: unknown) => { filtros[`${c}>`] = v; return b; };
        b.limit = () => b;
        b.in = (_c: string, v: string[]) => { ids = v; return b; };
        b.maybeSingle = async () => ({ data: tabla === "narradores" ? narrador : tabla === "viajes_v2" ? filaV2 : null, error: null });
        b.update = (valores: Record<string, unknown>) => {
          escrituras.push({ tabla, valores });
          return { eq: async (_c: string, id: string) => {
            if (tabla === "preguntas") preguntas = preguntas.map((p) => (p.id === id ? { ...p, ...valores } : p));
            return { error: null };
          } };
        };
        b.delete = () => { op = "delete"; return b; };
        b.insert = async (filas: Omit<Pregunta, "id">[]) => {
          preguntas.push(...filas.map((f) => ({ ...f, id: `nueva${f.orden}` })));
          return { error: null };
        };
        b.then = (res: (v: unknown) => void) => {
          if (op === "delete") { preguntas = preguntas.filter((p) => !ids.includes(p.id)); return res({ error: null }); }
          if (tabla === "respuestas") return res({ data: respuestas.filter((r) => r.pregunta_orden === filtros.pregunta_orden), error: null });
          if (tabla === "preguntas") {
            const desde = (filtros["orden>"] as number | undefined) ?? 0;
            const lista = preguntas.filter((p) => p.orden > desde);
            return res({ data: lista, count: lista.length, error: null });
          }
          return res({ data: [], error: null });
        };
        return b;
      },
    };
  }
  // El guion de 10 noches que armó el bot al decir SÍ (20 → 29/09).
  function guionOriginal(): Pregunta[] {
    return Array.from({ length: 10 }, (_, i) => ({ id: `p${i + 1}`, orden: i + 1, tipo: "fija", texto: `T${i + 1}`, capitulo: "Lisboa" }));
  }
  function conNarrador(diaActual: number, estado = "activo") {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(base({ contexto: { modo: "viaje", trato: "vos", viaje }, dia_actual: diaActual, estado }));
  }
  const viajeGuardado = () => (escrituras.find((e) => e.tabla === "narradores")?.valores.contexto as { viaje: typeof viaje } | undefined)?.viaje;

  beforeEach(() => {
    preguntas = guionOriginal();
    respuestas = [];
    filaV2 = null;
  });

  it("antes de la primera pregunta se corren las dos, y el guion se rearma entero", async () => {
    conNarrador(0, "acepto");
    const r = await PATCH(peticion({ salida: "2026-09-25", vuelta: "2026-10-01", etapas: [{ nombre: "Lisboa", desde: "2026-09-25" }] }));
    expect(r.status).toBe(200);
    expect(viajeGuardado()).toMatchObject({ salida: "2026-09-25", vuelta: "2026-10-01" });
    expect(preguntas.map((p) => p.orden)).toEqual([1, 2, 3, 4, 5, 6, 7]); // 7 noches, sobran 3
    expect(preguntas[0].texto).toContain("Día 1 en Lisboa");
  });

  it("con el viaje en marcha, estirar la vuelta suma noches y no toca lo ya mandado", async () => {
    conNarrador(4);
    const r = await PATCH(peticion({ salida: viaje.salida, vuelta: "2026-10-02" }));
    expect(r.status).toBe(200);
    expect((await r.json()).noches).toBe(13);
    expect(preguntas.map((p) => p.orden)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(preguntas.slice(0, 4).map((p) => p.texto)).toEqual(["T1", "T2", "T3", "T4"]);
    expect(preguntas[12].texto).toContain("te vas");
  });

  it("con el viaje en marcha, la salida no se mueve", async () => {
    conNarrador(2);
    const r = await PATCH(peticion({ salida: "2026-09-21", vuelta: viaje.vuelta }));
    expect(r.status).toBe(400);
    expect(escrituras).toEqual([]);
  });

  it("acortar hasta la última noche mandada, si ya la contestó, no: el bot no cerraría nunca", async () => {
    conNarrador(4);
    respuestas = [{ pregunta_orden: 4 }];
    const r = await PATCH(peticion({ salida: viaje.salida, vuelta: "2026-09-23" }));
    expect(r.status).toBe(400);
    expect(escrituras).toEqual([]);
  });

  it("acortar hasta la última noche mandada, sin contestar, sí: al contestarla cierra", async () => {
    conNarrador(4);
    const r = await PATCH(peticion({ salida: viaje.salida, vuelta: "2026-09-23" }));
    expect(r.status).toBe(200);
    expect(preguntas.map((p) => p.orden)).toEqual([1, 2, 3, 4]);
  });

  it("una etapa que queda afuera del viaje nuevo frena el guardado", async () => {
    conNarrador(0, "acepto");
    const r = await PATCH(peticion({ salida: viaje.salida, vuelta: "2026-09-25", etapas: [{ nombre: "Oporto", desde: "2026-09-27" }] }));
    expect(r.status).toBe(400);
    expect(escrituras).toEqual([]);
  });

  it("un viajero de la Viaje V2 no cambia las fechas desde acá", async () => {
    conNarrador(0, "acepto");
    filaV2 = { narrador_id: "n1" };
    const r = await PATCH(peticion({ salida: viaje.salida, vuelta: "2026-10-05" }));
    expect(r.status).toBe(400);
    expect(escrituras).toEqual([]);
  });
});
