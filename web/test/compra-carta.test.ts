import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/pagos", () => ({ crearCheckout: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearCheckout } from "@/lib/pagos";
import { POST } from "../src/app/api/compra/route";

// El mismo doble que compra-regalo.test.ts: una cola de resultados por tabla y
// se guarda qué se insertó. La tabla codigos_impresos responde por su cola con
// la fila de cada caso (data) en el maybeSingle().
function crearAdmin(secuencia: Record<string, unknown[]>) {
  const contadores: Record<string, number> = {};
  const inserts: Record<string, Record<string, unknown>[]> = {};
  const from = vi.fn((tabla: string) => {
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    const resultado = secuencia[tabla]?.[idx] ?? { data: null, error: null };
    const b: Record<string, unknown> = {};
    for (const m of ["select", "ilike", "is", "eq", "single", "maybeSingle", "update"]) b[m] = () => b;
    b.insert = (valores: Record<string, unknown>) => {
      (inserts[tabla] ??= []).push(valores);
      return b;
    };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(resultado).then(res, rej);
    return b;
  });
  const admin = { from, inserts };
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
  return admin;
}

const pedido = (body: unknown) => ({ json: async () => body }) as never;

const CARTA = { codigo: "VF-7K3M2Q", pedido_id: null, lotes_impresos: { idioma: "es-ES", locales: { id: "loc-1", comision_pct: 20, activo: true } } };

const cuerpoCarta = (extra: Record<string, unknown> = {}) => ({
  nombreComprador: "Lucía", vinculoComprador: "nieta", region: "ES", email: "lucia@ejemplo.com",
  narrador: { nombre: "Osvaldo", comoLeDicen: "abuelo" },
  regalo: { mensaje: "Para vos", genero: "varon", idioma: "es-ES", codigoImpreso: "VF-7K3M2Q", fechaEntrega: "2026-12-24" },
  productos: { impresos: 1, marcos: 0 },
  ...extra,
});

const feliz = (extra: Record<string, unknown[]> = {}) => ({
  familias: [{ data: null }, { data: { id: "fam-1" } }],
  narradores: [{ data: { id: "nar-1" } }],
  pedidos: [{ data: { id: "ped-1" } }],
  regalos: [{ error: null }],
  ...extra,
});

const COMPRA_PROPIA = {
  nombreComprador: "Jordi", vinculoComprador: "yo mismo", region: "ES", email: "jordi@ejemplo.com",
  narrador: { nombre: "Jordi", comoLeDicen: "Jordi", telefonoWhatsapp: "+34600000000", horaPreferida: "10:00", contexto: {} },
  productos: { impresos: 0, marcos: 0 },
};

const propia = (extra: Record<string, unknown[]> = {}) => ({
  familias: [{ data: null }, { data: { id: "fam-1" } }],
  narradores: [{ data: null }, { data: { id: "nar-1" } }],
  pedidos: [{ data: { id: "ped-1" } }],
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Fecha fija: la tarjeta solo se vende hasta el 15/12 y el regalo mira "hoy".
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-17T12:00:00Z"));
  process.env.PRECIO_EUR = "49";
  process.env.PRECIO_IMPRESO_EUR = "50";
  process.env.PRECIO_TARJETA_FISICA_EUR = "9";
  (crearCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ urlPago: "https://pago" });
});

afterEach(() => vi.useRealTimers());

describe("POST /api/compra con carta de un local", () => {
  it("regalo desde carta: pedido con local, comisión y código impreso; sin fecha de entrega", async () => {
    const admin = crearAdmin(feliz({ codigos_impresos: [{ data: CARTA }] }));
    const r = await POST(pedido(cuerpoCarta()));
    expect(r.status).toBe(200);
    const insertPedido = admin.inserts.pedidos[0];
    expect(insertPedido.local_id).toBe("loc-1");
    expect(insertPedido.comision_local).toBe(19.8);
    expect(insertPedido.extras).toMatchObject({ regalo: true, codigo_impreso: "VF-7K3M2Q" });
    expect(admin.inserts.regalos[0].fecha_entrega).toBeNull();
    expect(admin.inserts.regalos[0].codigo).not.toBe("VF-7K3M2Q"); // nace con código generado
  });

  it("carta ya pagada: 409 y no se crea nada", async () => {
    const admin = crearAdmin({ codigos_impresos: [{ data: { ...CARTA, pedido_id: "otro" } }] });
    const r = await POST(pedido(cuerpoCarta()));
    expect(r.status).toBe(409);
    expect(typeof ((await r.json()) as { error: string }).error).toBe("string");
    expect(admin.inserts.pedidos ?? []).toHaveLength(0);
  });

  it("carta inexistente: 404", async () => {
    crearAdmin({ codigos_impresos: [{ data: null }] });
    expect((await POST(pedido(cuerpoCarta()))).status).toBe(404);
  });

  it("carta de un local inactivo: sigue, sin local", async () => {
    const inactiva = { ...CARTA, lotes_impresos: { idioma: "es-ES", locales: { id: "loc-1", comision_pct: 20, activo: false } } };
    const admin = crearAdmin(feliz({ codigos_impresos: [{ data: inactiva }] }));
    const r = await POST(pedido(cuerpoCarta()));
    expect(r.status).toBe(200);
    expect("local_id" in admin.inserts.pedidos[0]).toBe(false);
    expect("comision_local" in admin.inserts.pedidos[0]).toBe(false);
  });

  it("tarjeta negra: necesita carta y dirección; queda en extras y en el total", async () => {
    const sinCarta = cuerpoCarta({ productos: { impresos: 1, marcos: 0, tarjetas: 1 } });
    delete (sinCarta.regalo as Record<string, unknown>).codigoImpreso;
    crearAdmin({});
    expect((await POST(pedido(sinCarta))).status).toBe(400);

    crearAdmin({ codigos_impresos: [{ data: CARTA }] });
    expect((await POST(pedido(cuerpoCarta({ productos: { impresos: 1, marcos: 0, tarjetas: 1 } })))).status).toBe(400); // sin dirección

    const admin = crearAdmin(feliz({ codigos_impresos: [{ data: CARTA }] }));
    const direccion = { linea1: "Carrer Major 3", ciudad: "Berga", cp: "08600", pais: "España" };
    const r = await POST(pedido(cuerpoCarta({ productos: { impresos: 1, marcos: 0, tarjetas: 1 }, tarjeta: { direccion } })));
    expect(r.status).toBe(200);
    expect((admin.inserts.pedidos[0].extras as { tarjeta: unknown }).tarjeta).toEqual({ direccion });
    expect(admin.inserts.pedidos[0].monto).toBe(108);
    expect(admin.inserts.pedidos[0].comision_local).toBe(19.8); // la tarjeta no suma comisión
  });

  it("compra para uno mismo con ?carta: atribuye sin consumir la carta", async () => {
    const admin = crearAdmin(propia({ codigos_impresos: [{ data: CARTA }] }));
    const r = await POST(pedido({ ...COMPRA_PROPIA, carta: "VF-7K3M2Q" }));
    expect(r.status).toBe(200);
    expect(admin.inserts.pedidos[0].local_id).toBe("loc-1");
    expect(admin.inserts.pedidos[0].comision_local).toBe(9.8);
    expect((admin.inserts.pedidos[0].extras as Record<string, unknown>).codigo_impreso).toBeUndefined();
  });

  it("compra para uno mismo con ?carta inexistente: no da error ni atribuye", async () => {
    const admin = crearAdmin(propia({ codigos_impresos: [{ data: null }] }));
    const r = await POST(pedido({ ...COMPRA_PROPIA, carta: "VF-NOEXISTE" }));
    expect(r.status).toBe(200);
    expect("local_id" in admin.inserts.pedidos[0]).toBe(false);
  });

  it("regalo sin carta: el pedido no trae local_id ni comision_local (anda sin la migración)", async () => {
    const admin = crearAdmin(feliz());
    const cuerpo = cuerpoCarta({ productos: { impresos: 0, marcos: 0 } });
    delete (cuerpo.regalo as Record<string, unknown>).codigoImpreso;
    const r = await POST(pedido(cuerpo));
    expect(r.status).toBe(200);
    expect("local_id" in admin.inserts.pedidos[0]).toBe(false);
    expect("comision_local" in admin.inserts.pedidos[0]).toBe(false);
    expect((admin.inserts.pedidos[0].extras as Record<string, unknown>).codigo_impreso).toBeUndefined();
    expect(admin.inserts.regalos[0].fecha_entrega).toBe("2026-12-24"); // sin carta, la fecha se respeta
  });
});
