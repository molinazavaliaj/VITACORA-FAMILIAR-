import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/pagos", () => ({ crearCheckout: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearCheckout } from "@/lib/pagos";
import { POST } from "../src/app/api/compra/route";

// Fake del admin: cada tabla tiene una cola de resultados (uno por llamada a
// from()), y se registra qué se insertó para poder asegurar el ESTADO con el
// que nace cada cosa — que es lo que importa en el pago por adelantado.
function crearAdmin(secuencia: Record<string, unknown[]>) {
  const contadores: Record<string, number> = {};
  const inserts: Record<string, unknown[]> = {};
  const from = vi.fn((tabla: string) => {
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    const resultado = secuencia[tabla]?.[idx] ?? { data: null, error: null };
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "ilike", "is", "single", "maybeSingle"]) b[m] = () => b;
    b.insert = (valores: unknown) => {
      (inserts[tabla] ??= []).push(valores);
      return b;
    };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(resultado).then(res, rej);
    return b;
  });
  return { from, inserts };
}

function peticion(body: unknown) {
  return { json: async () => body } as never;
}

const CUERPO_VALIDO = {
  nombreComprador: "Martina",
  vinculoComprador: "hija",
  region: "AR",
  email: "Martina@Ejemplo.com",
  narrador: { nombre: "Roberto Fernández", comoLeDicen: "Papá", telefonoWhatsapp: "11 5555 1234", horaPreferida: "09:00" },
  extras: { impreso: "bn", marcos: 2 },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.PRECIO_ARS = "65000";
  delete process.env.PRECIO_IMPRESO_BN_ARS;
  delete process.env.PRECIO_MARCO_ARS;
  (crearCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ urlPago: "https://pago.example/x" });
});

describe("POST /api/compra", () => {
  it("sin correo válido responde 400 y no toca la base", async () => {
    const admin = crearAdmin({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion({ ...CUERPO_VALIDO, email: "no-es-un-mail" }));

    expect(r.status).toBe(400);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("sin datos del narrador responde 400 (reusa la validación del registro)", async () => {
    const admin = crearAdmin({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion({ ...CUERPO_VALIDO, narrador: { nombre: "" } }));

    expect(r.status).toBe(400);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("camino feliz: familia nueva, narrador en pendiente_pago, pedido pendiente con extras, y la url de pago", async () => {
    process.env.PRECIO_IMPRESO_BN_ARS = "120000";
    process.env.PRECIO_MARCO_ARS = "30000";
    const admin = crearAdmin({
      familias: [{ data: null, error: null }, { data: { id: "fam-1" }, error: null }],
      narradores: [{ data: { id: "nar-1" }, error: null }],
      pedidos: [{ data: { id: "ped-1" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_VALIDO));

    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ urlPago: "https://pago.example/x" });

    // la familia nace con el correo normalizado y sin usuario
    expect(admin.inserts.familias[0]).toMatchObject({ email: "martina@ejemplo.com", region: "AR", nombre: "Martina" });
    // EL punto del pago por adelantado: el narrador NO nace invitado
    expect(admin.inserts.narradores[0]).toMatchObject({ estado: "pendiente_pago", familia_id: "fam-1", como_le_dicen: "Papá" });
    // el pedido lleva el total y los extras que sí tenían precio
    expect(admin.inserts.pedidos[0]).toMatchObject({
      estado: "pendiente",
      proveedor: "mercadopago",
      moneda: "ARS",
      monto: 65000 + 120000 + 2 * 30000,
      extras: { impreso: "bn", marcos: 2 },
    });
    expect(crearCheckout).toHaveBeenCalledWith({ id: "ped-1", email: "martina@ejemplo.com" }, expect.objectContaining({ region: "AR" }));
  });

  it("si la familia ya existe (mismo correo, compra anterior) la reusa y no crea otra", async () => {
    const admin = crearAdmin({
      familias: [{ data: { id: "fam-vieja" }, error: null }],
      narradores: [{ data: { id: "nar-2" }, error: null }],
      pedidos: [{ data: { id: "ped-2" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_VALIDO));

    expect(r.status).toBe(200);
    expect(admin.inserts.familias).toBeUndefined();
    expect(admin.inserts.narradores[0]).toMatchObject({ familia_id: "fam-vieja" });
  });

  it("un extra elegido sin precio en la región no se cobra ni se anota", async () => {
    const admin = crearAdmin({
      familias: [{ data: { id: "fam-1" }, error: null }],
      narradores: [{ data: { id: "nar-1" }, error: null }],
      pedidos: [{ data: { id: "ped-1" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    await POST(peticion(CUERPO_VALIDO)); // sin PRECIO_IMPRESO_BN_ARS ni PRECIO_MARCO_ARS

    expect(admin.inserts.pedidos[0]).toMatchObject({ monto: 65000, extras: { impreso: null, marcos: 0 } });
  });

  it("un WhatsApp que ya tiene libro responde 409 con un mensaje claro", async () => {
    const admin = crearAdmin({
      familias: [{ data: { id: "fam-1" }, error: null }],
      narradores: [{ data: null, error: { code: "23505", message: "duplicate key" } }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_VALIDO));

    expect(r.status).toBe(409);
    expect(((await r.json()) as { error: string }).error).toMatch(/ya tiene un libro/);
    expect(crearCheckout).not.toHaveBeenCalled();
  });

  it("si el proveedor de pago falla responde 500", async () => {
    (crearCheckout as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("stripe caído"));
    const admin = crearAdmin({
      familias: [{ data: { id: "fam-1" }, error: null }],
      narradores: [{ data: { id: "nar-1" }, error: null }],
      pedidos: [{ data: { id: "ped-1" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_VALIDO));

    expect(r.status).toBe(500);
  });
});
