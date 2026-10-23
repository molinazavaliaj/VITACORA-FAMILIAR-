// Vitácora de una historia (plan 2026-10-21, Task 4.2): /api/compra con `narrador.contexto.historia`. Es una compra de
// Familiar con el tema: el narrador queda con modo historia y el pedido se cobra como Familiar. La fila de
// `historias` la crea el bot.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/pagos", () => ({ crearCheckout: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearCheckout } from "@/lib/pagos";
import { POST } from "../src/app/api/compra/route";

function crearAdmin(secuencia: Record<string, unknown[]>) {
  const contadores: Record<string, number> = {};
  const inserts: Record<string, unknown[]> = {};
  const from = vi.fn((tabla: string) => {
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    const resultado = secuencia[tabla]?.[idx] ?? { data: null, error: null };
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "ilike", "is", "single", "maybeSingle"]) b[m] = () => b;
    b.insert = (valores: unknown) => { (inserts[tabla] ??= []).push(valores); return b; };
    b.update = () => b;
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(resultado).then(res, rej);
    return b;
  });
  return { from, inserts };
}
const peticion = (body: unknown) => ({ json: async () => body }) as never;
const feliz = () => crearAdmin({
  familias: [{ data: null, error: null }, { data: { id: "fam-1" }, error: null }],
  narradores: [{ data: null, error: null }, { data: { id: "nar-1" }, error: null }],
  pedidos: [{ data: { id: "ped-1" }, error: null }],
});

const CUERPO = {
  nombreComprador: "Marta",
  vinculoComprador: "yo mismo",
  region: "AR",
  email: "marta@ejemplo.com",
  narrador: {
    nombre: "Marta Gómez", comoLeDicen: "Marta", telefonoWhatsapp: "11 5555 1234",
    contexto: { genero: "mujer", historia: { tema: "mudanza", preguntasPropias: [] } },
  },
  productos: { impresos: 1, marcos: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("HISTORIA_VENTA", "1");
  process.env.PRECIO_ARS = "65000";
  process.env.PRECIO_IMPRESO_ARS = "120000";
  (crearCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ urlPago: "https://pago.example/x" });
});
afterEach(() => vi.unstubAllEnvs());

describe("compra de historia", () => {
  it("el narrador queda con modo historia y el tema, de vos en Argentina, y se cobra como Familiar", async () => {
    const admin = feliz();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
    const r = await POST(peticion(CUERPO));
    expect(r.status).toBe(200);
    const contexto = (admin.inserts.narradores[0] as { contexto: Record<string, unknown> }).contexto;
    expect(contexto).toMatchObject({ modo: "historia", genero: "mujer", trato: "vos", historia: { tema: "mudanza", preguntasPropias: [] } });
    expect(contexto.idioma).toBeUndefined();
    expect(admin.inserts.pedidos[0]).toMatchObject({ monto: 65000 + 120000 });
  });

  it("en España, de tú: el idioma de la compra (es-ES o ca) va en el contexto", async () => {
    process.env.PRECIO_EUR = "79";
    const admin = feliz();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
    const r = await POST(peticion({ ...CUERPO, region: "ES", productos: {}, narrador: { ...CUERPO.narrador, telefonoWhatsapp: "+34 612 345 678", contexto: { ...CUERPO.narrador.contexto, idioma: "ca" } } }));
    expect(r.status).toBe(200);
    const contexto = (admin.inserts.narradores[0] as { contexto: Record<string, unknown> }).contexto;
    expect(contexto).toMatchObject({ modo: "historia", idioma: "ca" });
    expect(contexto.trato).toBeUndefined();
  });

  it("un regalo puede dejar el tema abierto y hasta 3 preguntas; el género y la voz son los del regalo", async () => {
    const admin = crearAdmin({
      familias: [{ data: null, error: null }, { data: { id: "fam-1" }, error: null }],
      narradores: [{ data: { id: "nar-1" }, error: null }],
      pedidos: [{ data: { id: "ped-1" }, error: null }],
      regalos: [{ data: null, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
    const r = await POST(peticion({
      nombreComprador: "Pablo", vinculoComprador: "hijo", region: "AR", email: "pablo@ejemplo.com", productos: {},
      narrador: { nombre: "Marta Gómez", comoLeDicen: "mamá", contexto: { historia: { temaAbierto: true, preguntasPropias: ["¿Qué extrañabas?"] } } },
      regalo: { mensaje: "Mamá, contá esa historia.", fechaEntrega: "2099-12-24", genero: "mujer" },
    }));
    expect(r.status).toBe(200);
    const contexto = (admin.inserts.narradores[0] as { contexto: Record<string, unknown> }).contexto;
    expect(contexto).toMatchObject({ modo: "historia", regalo: true, genero: "mujer", trato: "vos", historia: { tema: "otra", temaAbierto: true, preguntasPropias: ["¿Qué extrañabas?"] } });
  });

  it("con HISTORIA_VENTA apagado responde 400 y no crea nada", async () => {
    vi.stubEnv("HISTORIA_VENTA", "");
    const admin = feliz();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
    expect((await POST(peticion(CUERPO))).status).toBe(400);
    expect(admin.inserts).toEqual({});
  });

  it("un tema que no es de la lista, o sin género (el bot no arrancaría), responde 400 y no crea nada", async () => {
    const admin = feliz();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
    expect((await POST(peticion({ ...CUERPO, narrador: { ...CUERPO.narrador, contexto: { genero: "mujer", historia: { tema: "viaje" } } } }))).status).toBe(400);
    expect((await POST(peticion({ ...CUERPO, narrador: { ...CUERPO.narrador, contexto: { historia: { tema: "mudanza" } } } }))).status).toBe(400);
    expect(admin.inserts).toEqual({});
  });

  it("preguntas propias o tema abierto sin ser regalo: 400", async () => {
    const admin = feliz();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
    expect((await POST(peticion({ ...CUERPO, narrador: { ...CUERPO.narrador, contexto: { genero: "mujer", historia: { tema: "mudanza", preguntasPropias: ["¿Qué?"] } } } }))).status).toBe(400);
    expect((await POST(peticion({ ...CUERPO, narrador: { ...CUERPO.narrador, contexto: { genero: "mujer", historia: { temaAbierto: true } } } }))).status).toBe(400);
    expect(admin.inserts).toEqual({});
  });
});
