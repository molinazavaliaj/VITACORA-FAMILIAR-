import { describe, it, expect, vi, beforeEach } from "vitest";
import { verificarTokenFotos } from "../src/lib/token-fotos";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba"; // firma el token de fotos

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/pagos", () => ({ crearCheckout: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearCheckout } from "@/lib/pagos";
import { POST } from "../src/app/api/compra/route";

// El mismo doble que compra.test.ts (una cola de resultados por tabla, y se
// guarda qué se insertó), más el registro de los eq() por tabla para asegurar
// que el regalo nunca busca un narrador "retomable" por teléfono.
function crearAdmin(secuencia: Record<string, unknown[]>) {
  const contadores: Record<string, number> = {};
  const inserts: Record<string, unknown[]> = {};
  const updates: Record<string, unknown[]> = {};
  const eqs: Record<string, [string, unknown][]> = {};
  const from = vi.fn((tabla: string) => {
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    const resultado = secuencia[tabla]?.[idx] ?? { data: null, error: null };
    const b: Record<string, unknown> = {};
    for (const m of ["select", "ilike", "is", "single", "maybeSingle"]) b[m] = () => b;
    b.eq = (columna: string, valor: unknown) => {
      (eqs[tabla] ??= []).push([columna, valor]);
      return b;
    };
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
  return { from, inserts, updates, eqs };
}

function peticion(body: unknown) {
  return { json: async () => body } as never;
}

const CUERPO_REGALO = {
  nombreComprador: "Lucía",
  vinculoComprador: "nieta",
  region: "AR",
  email: "lucia@ejemplo.com",
  narrador: { nombre: "Héctor", comoLeDicen: "abuelo" },
  productos: {},
  regalo: { mensaje: "  Abuelo, quiero que cuentes tu vida.  ", fechaEntrega: "2099-12-24", genero: "varon" },
};

function secuenciaFeliz(regalos: unknown[] = [{ data: null, error: null }]) {
  return {
    familias: [{ data: null, error: null }, { data: { id: "fam-1" }, error: null }],
    narradores: [{ data: { id: "nar-1" }, error: null }],
    pedidos: [{ data: { id: "ped-1" }, error: null }],
    regalos,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.PRECIO_ARS = "65000";
  (crearCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ urlPago: "https://pago.example/x" });
});

describe("POST /api/compra con regalo", () => {
  it("sin mensaje responde 400 y no toca la base", async () => {
    const admin = crearAdmin({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion({ ...CUERPO_REGALO, regalo: { ...CUERPO_REGALO.regalo, mensaje: "   " } }));

    expect(r.status).toBe(400);
    expect(((await r.json()) as { error: string }).error).toBe("Falta tu mensaje para la tarjeta.");
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("sin género responde 400", async () => {
    const admin = crearAdmin({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion({ ...CUERPO_REGALO, regalo: { mensaje: "Hola" } }));

    expect(r.status).toBe(400);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("el narrador nace sin teléfono, en pendiente_pago, de vos y marcado como regalo", async () => {
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_REGALO));

    expect(r.status).toBe(200);
    expect(admin.inserts.narradores).toHaveLength(1);
    const narrador = admin.inserts.narradores[0] as Record<string, unknown>;
    expect(narrador).toMatchObject({
      telefono_whatsapp: null,
      estado: "pendiente_pago",
      familia_id: "fam-1",
      nombre: "Héctor",
      como_le_dicen: "abuelo",
      contexto: { regalo: true, trato: "vos", genero: "varon", vinculoComprador: "nieta" },
    });
    expect(narrador.contexto).not.toHaveProperty("idioma");
  });

  it("el trato es vos aunque el cuerpo pida usted", async () => {
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    await POST(peticion({ ...CUERPO_REGALO, narrador: { ...CUERPO_REGALO.narrador, contexto: { trato: "usted" } } }));

    expect(admin.inserts.narradores[0]).toMatchObject({ contexto: { trato: "vos" } });
  });

  it("cualquier región puede regalar (no hay bloqueo por país)", async () => {
    process.env.PRECIO_EUR = "59";
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion({ ...CUERPO_REGALO, region: "ES" }));

    expect(r.status).toBe(200);
    expect(admin.inserts.narradores[0]).toMatchObject({ telefono_whatsapp: null, contexto: { trato: "vos" } });
  });

  it("en catalán el contexto lleva idioma y no trato", async () => {
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion({ ...CUERPO_REGALO, region: "ES", regalo: { ...CUERPO_REGALO.regalo, idioma: "ca" } }));

    expect(r.status).toBe(200);
    const contexto = (admin.inserts.narradores[0] as { contexto: Record<string, unknown> }).contexto;
    expect(contexto).toMatchObject({ idioma: "ca", regalo: true, genero: "varon" });
    expect(contexto).not.toHaveProperty("trato");
  });

  it("en castellano de España el contexto lleva idioma es-ES y no trato, aunque el cuerpo pida vos", async () => {
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    await POST(peticion({
      ...CUERPO_REGALO,
      narrador: { ...CUERPO_REGALO.narrador, contexto: { trato: "vos" } },
      regalo: { ...CUERPO_REGALO.regalo, idioma: "es-ES" },
    }));

    const contexto = (admin.inserts.narradores[0] as { contexto: Record<string, unknown> }).contexto;
    expect(contexto).toMatchObject({ idioma: "es-ES", regalo: true, genero: "varon" });
    expect(contexto).not.toHaveProperty("trato");
  });

  it("con idioma es-AR explícito va de vos y sin idioma, aunque el cuerpo pida otro", async () => {
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    await POST(peticion({
      ...CUERPO_REGALO,
      narrador: { ...CUERPO_REGALO.narrador, contexto: { idioma: "ca" } },
      regalo: { ...CUERPO_REGALO.regalo, idioma: "es-AR" },
    }));

    const contexto = (admin.inserts.narradores[0] as { contexto: Record<string, unknown> }).contexto;
    expect(contexto).toMatchObject({ trato: "vos", regalo: true, genero: "varon" });
    expect(contexto).not.toHaveProperty("idioma");
  });

  it("un idioma desconocido responde 400 y no toca la base", async () => {
    const admin = crearAdmin({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion({ ...CUERPO_REGALO, regalo: { ...CUERPO_REGALO.regalo, idioma: "en" } }));

    expect(r.status).toBe(400);
    expect(((await r.json()) as { error: string }).error).toBe("El idioma no es válido.");
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("el pedido lleva extras.regalo === true", async () => {
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    await POST(peticion(CUERPO_REGALO));

    expect(admin.inserts.pedidos[0]).toMatchObject({
      narrador_id: "nar-1",
      estado: "pendiente",
      monto: 65000,
      extras: { pdf: true, regalo: true },
    });
  });

  it("inserta el regalo con el código, el narrador, el pedido, quién regala, el mensaje y la fecha", async () => {
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    await POST(peticion(CUERPO_REGALO));

    expect(admin.inserts.regalos).toHaveLength(1);
    expect(admin.inserts.regalos[0]).toEqual({
      codigo: expect.stringMatching(/^VF-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/),
      narrador_id: "nar-1",
      pedido_id: "ped-1",
      quien_regala: "Lucía",
      mensaje: "Abuelo, quiero que cuentes tu vida.",
      fecha_entrega: "2099-12-24",
    });
  });

  it("sin fecha de entrega, el regalo va con fecha_entrega null", async () => {
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion({ ...CUERPO_REGALO, regalo: { mensaje: "Hola", genero: "mujer" } }));

    expect(r.status).toBe(200);
    expect(admin.inserts.regalos[0]).toMatchObject({ fecha_entrega: null });
    expect(admin.inserts.narradores[0]).toMatchObject({ contexto: { genero: "mujer" } });
  });

  it("responde el código además de urlPago, narradorId y tokenFotos", async () => {
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_REGALO));
    const json = (await r.json()) as Record<string, string>;

    expect(json).toMatchObject({ urlPago: "https://pago.example/x", narradorId: "nar-1" });
    expect(verificarTokenFotos(json.tokenFotos, "nar-1")).toBe(true);
    expect(json.codigo).toBe((admin.inserts.regalos[0] as { codigo: string }).codigo);
    expect(crearCheckout).toHaveBeenCalledWith({ id: "ped-1", email: "lucia@ejemplo.com" }, expect.objectContaining({ region: "AR" }));
  });

  it("si el código choca (23505) la primera vez, reintenta con otro y sale bien", async () => {
    const admin = crearAdmin(
      secuenciaFeliz([
        { data: null, error: { code: "23505", message: "duplicate key" } },
        { data: null, error: null },
      ]),
    );
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_REGALO));
    const json = (await r.json()) as { codigo: string };

    expect(r.status).toBe(200);
    expect(admin.inserts.regalos).toHaveLength(2);
    expect(json.codigo).toBe((admin.inserts.regalos[1] as { codigo: string }).codigo);
  });

  it("cinco choques seguidos responden 500 y no se va a pagar", async () => {
    const choque = { data: null, error: { code: "23505", message: "duplicate key" } };
    const admin = crearAdmin(secuenciaFeliz([choque, choque, choque, choque, choque]));
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_REGALO));

    expect(r.status).toBe(500);
    expect(admin.inserts.regalos).toHaveLength(5);
    expect(crearCheckout).not.toHaveBeenCalled();
  });

  it("otro error al crear el regalo responde 500 sin reintentar y no se va a pagar", async () => {
    const admin = crearAdmin(secuenciaFeliz([{ data: null, error: { code: "42P01", message: "no existe" } }]));
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_REGALO));

    expect(r.status).toBe(500);
    expect(admin.inserts.regalos).toHaveLength(1);
    expect(crearCheckout).not.toHaveBeenCalled();
  });

  it("nunca busca un narrador retomable por teléfono", async () => {
    const admin = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    await POST(peticion(CUERPO_REGALO));

    const columnas = (admin.eqs.narradores ?? []).map(([c]) => c);
    expect(columnas).not.toContain("telefono_whatsapp");
    expect(admin.updates.narradores).toBeUndefined();
    // una sola llamada a narradores: el insert
    expect(admin.from.mock.calls.filter(([t]) => t === "narradores")).toHaveLength(1);
  });

  it("sin regalo, la compra no inserta en regalos ni responde código", async () => {
    const admin = crearAdmin({
      familias: [{ data: { id: "fam-1" }, error: null }],
      narradores: [{ data: null, error: null }, { data: { id: "nar-1" }, error: null }],
      pedidos: [{ data: { id: "ped-1" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const { regalo: _regalo, ...sinRegalo } = CUERPO_REGALO;
    const r = await POST(peticion({ ...sinRegalo, narrador: { ...sinRegalo.narrador, telefonoWhatsapp: "11 5555 1234", comoLeDicen: "Tito" } }));
    const json = await r.json();

    expect(r.status).toBe(200);
    expect(admin.inserts.regalos).toBeUndefined();
    expect(json).not.toHaveProperty("codigo");
    expect((admin.inserts.pedidos[0] as { extras: object }).extras).not.toHaveProperty("regalo");
  });
});

describe("POST /api/compra con regalo: reintento sin pagar", () => {
  // La misma familia vuelve a intentar el regalo para la misma persona (falló
  // el pago, cerró la pestaña): se retoma el narrador y el regalo que quedaron
  // en pendiente_pago, con el mismo código, en vez de dejar historias fantasma.
  function secuenciaReintento(o: { pendientes?: unknown[]; regalo?: unknown } = {}) {
    return {
      familias: [{ data: { id: "fam-1" }, error: null }],
      narradores: [
        { data: o.pendientes ?? [{ id: "nar-viejo", familia_id: "fam-1", nombre: "  héctor ", contexto: { regalo: true, trato: "vos" } }], error: null },
        { data: { id: "nar-viejo" }, error: null },
      ],
      pedidos: [{ data: { id: "ped-2" }, error: null }],
      regalos: [
        { data: o.regalo === undefined ? { id: "reg-1", codigo: "VF-ABCDEF" } : o.regalo, error: null },
        { data: null, error: null },
      ],
    };
  }

  it("retoma el narrador y el regalo pendientes: no inserta otros, pedido nuevo, mismo código", async () => {
    const admin = crearAdmin(secuenciaReintento());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_REGALO));
    const json = (await r.json()) as { codigo: string; narradorId: string };

    expect(r.status).toBe(200);
    expect(admin.inserts.narradores).toBeUndefined();
    expect(admin.inserts.regalos).toBeUndefined();
    expect(admin.updates.narradores).toHaveLength(1);
    expect(admin.updates.narradores[0]).toMatchObject({
      familia_id: "fam-1",
      estado: "pendiente_pago",
      nombre: "Héctor",
      contexto: { regalo: true, trato: "vos", genero: "varon" },
    });
    expect(admin.eqs.narradores).toEqual(
      expect.arrayContaining([["familia_id", "fam-1"], ["estado", "pendiente_pago"], ["id", "nar-viejo"]]),
    );
    expect(admin.inserts.pedidos[0]).toMatchObject({ narrador_id: "nar-viejo", extras: { regalo: true } });
    expect(admin.updates.regalos).toEqual([
      {
        mensaje: "Abuelo, quiero que cuentes tu vida.",
        fecha_entrega: "2099-12-24",
        quien_regala: "Lucía",
        pedido_id: "ped-2",
      },
    ]);
    expect(admin.eqs.regalos).toEqual(expect.arrayContaining([["narrador_id", "nar-viejo"], ["id", "reg-1"]]));
    expect(json.codigo).toBe("VF-ABCDEF");
    expect(json.narradorId).toBe("nar-viejo");
    expect(crearCheckout).toHaveBeenCalledWith({ id: "ped-2", email: "lucia@ejemplo.com" }, expect.anything());
  });

  it("un reintento con otro idioma actualiza el contexto: idioma nuevo y sin trato", async () => {
    const admin = crearAdmin(secuenciaReintento());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion({ ...CUERPO_REGALO, regalo: { ...CUERPO_REGALO.regalo, idioma: "ca" } }));

    expect(r.status).toBe(200);
    expect(admin.updates.narradores).toHaveLength(1);
    const contexto = (admin.updates.narradores[0] as { contexto: Record<string, unknown> }).contexto;
    expect(contexto).toMatchObject({ idioma: "ca", regalo: true, genero: "varon" });
    expect(contexto).not.toHaveProperty("trato");
  });

  it("dos intentos seguidos dan el mismo código", async () => {
    const primero = crearAdmin(secuenciaFeliz());
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(primero);
    const r1 = (await (await POST(peticion(CUERPO_REGALO))).json()) as { codigo: string };

    const segundo = crearAdmin(secuenciaReintento({ regalo: { id: "reg-1", codigo: r1.codigo } }));
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(segundo);
    const r2 = (await (await POST(peticion(CUERPO_REGALO))).json()) as { codigo: string };

    expect(r2.codigo).toBe(r1.codigo);
    expect(segundo.inserts.regalos).toBeUndefined();
  });

  it("un pendiente de la familia con otro nombre no se retoma: nace otro", async () => {
    const admin = crearAdmin({
      ...secuenciaReintento({ pendientes: [{ id: "nar-otro", familia_id: "fam-1", nombre: "Marta", contexto: { regalo: true } }] }),
      narradores: [
        { data: [{ id: "nar-otro", familia_id: "fam-1", nombre: "Marta", contexto: { regalo: true } }], error: null },
        { data: { id: "nar-nuevo" }, error: null },
      ],
      regalos: [{ data: null, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_REGALO));

    expect(r.status).toBe(200);
    expect(admin.inserts.narradores).toHaveLength(1);
    expect(admin.updates.narradores).toBeUndefined();
    expect(admin.inserts.regalos).toHaveLength(1);
  });

  it("un pendiente con el mismo nombre que no es regalo no se retoma", async () => {
    const admin = crearAdmin({
      ...secuenciaReintento(),
      narradores: [
        { data: [{ id: "nar-compra", familia_id: "fam-1", nombre: "Héctor", contexto: {} }], error: null },
        { data: { id: "nar-nuevo" }, error: null },
      ],
      regalos: [{ data: null, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    await POST(peticion(CUERPO_REGALO));

    expect(admin.inserts.narradores).toHaveLength(1);
    expect(admin.updates.narradores).toBeUndefined();
  });

  it("si el narrador retomado no tenía fila de regalo (quedó a medias), se crea con código nuevo", async () => {
    const admin = crearAdmin(secuenciaReintento({ regalo: null }));
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const r = await POST(peticion(CUERPO_REGALO));
    const json = (await r.json()) as { codigo: string };

    expect(r.status).toBe(200);
    expect(admin.inserts.narradores).toBeUndefined();
    expect(admin.inserts.regalos).toHaveLength(1);
    expect(admin.inserts.regalos[0]).toMatchObject({ narrador_id: "nar-viejo", pedido_id: "ped-2" });
    expect(json.codigo).toBe((admin.inserts.regalos[0] as { codigo: string }).codigo);
  });
});
