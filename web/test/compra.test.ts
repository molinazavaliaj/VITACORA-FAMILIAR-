import { describe, it, expect, vi, beforeEach } from "vitest";
import { verificarTokenFotos } from "../src/lib/token-fotos";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba"; // firma el token de fotos del paso 5

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
  const updates: Record<string, unknown[]> = {};
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
    b.update = (valores: unknown) => {
      (updates[tabla] ??= []).push(valores);
      return b;
    };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(resultado).then(res, rej);
    return b;
  });
  return { from, inserts, updates };
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
  productos: { impresos: 1, marcos: 2 }, // catálogo base + upsells (21/09): la base va siempre
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.PRECIO_ARS = "65000";
  process.env.PRECIO_IMPRESO_ARS = "120000";
  process.env.PRECIO_MARCO_ARS = "30000";
  process.env.PRECIO_MARCO_ADICIONAL_ARS = "20000";
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
    const admin = crearAdmin({
      familias: [{ data: null, error: null }, { data: { id: "fam-1" }, error: null }],
      narradores: [{ data: null, error: null }, { data: { id: "nar-1" }, error: null }],
      pedidos: [{ data: { id: "ped-1" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_VALIDO));

    expect(r.status).toBe(200);
    // Paso 5 (17/09): además de la url de pago, el narrador y un token de una hora para subir fotos sin sesión.
    const json = await r.json();
    expect(json).toMatchObject({ urlPago: "https://pago.example/x", narradorId: "nar-1" });
    expect(verificarTokenFotos(json.tokenFotos, "nar-1")).toBe(true);
    expect(verificarTokenFotos(json.tokenFotos, "otro-narrador")).toBe(false);

    // la familia nace con el correo normalizado y sin usuario
    expect(admin.inserts.familias[0]).toMatchObject({ email: "martina@ejemplo.com", region: "AR", nombre: "Martina" });
    // EL punto del pago por adelantado: el narrador NO nace invitado
    expect(admin.inserts.narradores[0]).toMatchObject({ estado: "pendiente_pago", familia_id: "fam-1", como_le_dicen: "Papá" });
    // el pedido lleva el total y los extras que sí tenían precio
    expect(admin.inserts.pedidos[0]).toMatchObject({
      estado: "pendiente",
      proveedor: "mercadopago",
      moneda: "ARS",
      monto: 65000 + 120000 + 30000 + 20000,
      extras: { pdf: true, audiolibro: null, impreso: "color", copias: 1, marcos: 2 },
    });
    expect(crearCheckout).toHaveBeenCalledWith({ id: "ped-1", email: "martina@ejemplo.com" }, expect.objectContaining({ region: "AR" }));
  });

  it("si la familia ya existe (mismo correo, compra anterior) la reusa y no crea otra", async () => {
    const admin = crearAdmin({
      familias: [{ data: { id: "fam-vieja" }, error: null }],
      narradores: [{ data: null, error: null }, { data: { id: "nar-2" }, error: null }],
      pedidos: [{ data: { id: "ped-2" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_VALIDO));

    expect(r.status).toBe(200);
    expect(admin.inserts.familias).toBeUndefined();
    expect(admin.inserts.narradores[0]).toMatchObject({ familia_id: "fam-vieja" });
  });

  it("un impreso pedido en una región sin precio se rechaza con 400 (no se cobra menos en silencio)", async () => {
    delete process.env.PRECIO_IMPRESO_ARS;
    const admin = crearAdmin({
      familias: [{ data: { id: "fam-1" }, error: null }],
      narradores: [{ data: null, error: null }, { data: { id: "nar-1" }, error: null }],
      pedidos: [{ data: { id: "ped-1" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_VALIDO)); // sin PRECIO_IMPRESO_ARS
    expect(r.status).toBe(400);
    expect(admin.inserts.pedidos ?? []).toEqual([]);
  });

  it("la base sola: el pedido lleva pdf true y nada más", async () => {
    const admin = crearAdmin({
      familias: [{ data: { id: "fam-1" }, error: null }],
      narradores: [{ data: null, error: null }, { data: { id: "nar-1" }, error: null }],
      pedidos: [{ data: { id: "ped-1" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    await POST(peticion({ ...CUERPO_VALIDO, productos: {} }));
    expect(admin.inserts.pedidos[0]).toMatchObject({ monto: 65000, extras: { pdf: true, audiolibro: null, impreso: null, copias: 0, marcos: 0 } });
  });

  it("un WhatsApp que ya tiene libro responde 409 con un mensaje claro", async () => {
    const admin = crearAdmin({
      familias: [{ data: { id: "fam-1" }, error: null }],
      narradores: [{ data: null, error: null }, { data: null, error: { code: "23505", message: "duplicate key" } }],
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
      narradores: [{ data: null, error: null }, { data: { id: "nar-1" }, error: null }],
      pedidos: [{ data: { id: "ped-1" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_VALIDO));

    expect(r.status).toBe(500);
  });

  it("si el mismo correo ya dejó ese WhatsApp en pendiente_pago (falló el pago antes), lo retoma en vez de dar 409", async () => {
    (crearCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ urlPago: "https://mp.example/pay" });
    const admin = crearAdmin({
      familias: [{ data: { id: "fam-1" }, error: null }],
      // 1) la búsqueda del pendiente lo encuentra, de la misma familia · 2) el update devuelve el id
      narradores: [{ data: { id: "nar-viejo", familia_id: "fam-1", estado: "pendiente_pago" }, error: null }, { data: { id: "nar-viejo" }, error: null }],
      pedidos: [{ data: { id: "ped-2" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await POST(peticion(CUERPO_VALIDO));
    expect(respuesta.status).toBe(200);
    expect(admin.inserts.narradores ?? []).toHaveLength(0);
    expect(admin.updates.narradores).toHaveLength(1);
    expect(admin.inserts.pedidos[0]).toMatchObject({ narrador_id: "nar-viejo" });
  });
});
