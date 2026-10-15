import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verificarTokenFotos } from "../src/lib/token-fotos";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba"; // firma el token de fotos

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/pagos", () => ({ crearCheckout: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearCheckout } from "@/lib/pagos";
import { POST } from "../src/app/api/compra/route";
import { KIDS_TODAVIA_NO, KIDS_REGIONES, cuerpoKids, estadoKidsInicial, type EstadoKids } from "../src/lib/kids";
import { validarFichaKids, type FichaKids } from "../src/lib/kids-compra";
import { CHECKOUT_KIDS } from "../src/app/_textos/checkout-kids";

// La compra de Vitácora Kids (K4, 15/10): /api/compra con `producto: "kids"`
// crea familia, narrador (pendiente_pago, contexto.modo = "kids"), la fila de
// kids_v2 con la ficha y el pedido (extras.tipo = "kids"), como dice el
// CONTRATO («Vitácora Kids V2 por WhatsApp»).

// Fake del admin: cada tabla tiene una cola de resultados (uno por llamada a
// from()) y se registra cada escritura, para asegurar lo que nace y lo que se borra.
function crearAdmin(secuencia: Record<string, unknown[]>) {
  const contadores: Record<string, number> = {};
  const inserts: Record<string, unknown[]> = {};
  const updates: Record<string, unknown[]> = {};
  const upserts: Record<string, unknown[]> = {};
  const borrados: Record<string, string[]> = {};
  const from = vi.fn((tabla: string) => {
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    const resultado = secuencia[tabla]?.[idx] ?? { data: null, error: null };
    let borrando = false;
    const b: Record<string, unknown> = {};
    for (const m of ["select", "ilike", "is", "single", "maybeSingle"]) b[m] = () => b;
    b.eq = (_col: string, valor: string) => {
      if (borrando) (borrados[tabla] ??= []).push(valor);
      return b;
    };
    b.insert = (v: unknown) => ((inserts[tabla] ??= []).push(v), b);
    b.update = (v: unknown) => ((updates[tabla] ??= []).push(v), b);
    b.upsert = (v: unknown) => ((upserts[tabla] ??= []).push(v), b);
    b.delete = () => ((borrando = true), b);
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(borrando ? { error: null } : resultado).then(res, rej);
    return b;
  });
  return { from, inserts, updates, upserts, borrados };
}

const peticion = (body: unknown) => ({ json: async () => body }) as never;
const usar = (admin: ReturnType<typeof crearAdmin>) =>
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

const LLENO: EstadoKids = {
  ...estadoKidsInicial(),
  tuNombre: "Laura Gómez",
  tuWhatsapp: "11 5555 1234",
  email: "Laura@Ejemplo.com",
  nombre: "Nico Rivas",
  apodo: "Nico",
  genero: "chico",
  edad: "11",
  quien: "papas",
  canal: "B",
  temas: ["escuela", "mama"],
};

/** Familia nueva, sin pendiente, narrador y pedido creados. */
const compraNueva = (extra: Record<string, unknown[]> = {}) =>
  crearAdmin({
    familias: [{ data: null, error: null }, { data: { id: "fam-1" }, error: null }],
    narradores: [{ data: null, error: null }, { data: { id: "nar-1" }, error: null }],
    kids_v2: [{ data: null, error: null }],
    pedidos: [{ data: { id: "ped-1" }, error: null }],
    ...extra,
  });

const CLAVES = ["KIDS_VENTA", "PRECIO_KIDS_EUR", "PRECIO_KIDS_ARS", "URL_BASE"] as const;
const viejos: Record<string, string | undefined> = {};
beforeEach(() => {
  vi.clearAllMocks();
  for (const k of CLAVES) viejos[k] = process.env[k];
  process.env.KIDS_VENTA = "1";
  process.env.PRECIO_KIDS_ARS = "90000";
  process.env.PRECIO_KIDS_EUR = "59";
  process.env.URL_BASE = "https://vitacora.test";
  (crearCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ urlPago: "https://pago.example/k" });
});
afterEach(() => {
  for (const k of CLAVES) {
    if (viejos[k] === undefined) delete process.env[k];
    else process.env[k] = viejos[k];
  }
});

describe("POST /api/compra con producto kids", () => {
  it("canal B: el número de las preguntas es el del padre; narrador, kids_v2 y pedido como dice el CONTRATO", async () => {
    const admin = compraNueva();
    usar(admin);

    const r = await POST(peticion(cuerpoKids(LLENO, "AR", "ar")));

    expect(r.status).toBe(200);
    const json = await r.json();
    expect(json).toMatchObject({ urlPago: "https://pago.example/k", narradorId: "nar-1" });
    expect(verificarTokenFotos(json.tokenFotos, "nar-1")).toBe(true);

    expect(admin.inserts.familias[0]).toEqual({ nombre: "Laura Gómez", region: "AR", email: "laura@ejemplo.com" });
    expect(admin.inserts.narradores[0]).toEqual({
      nombre: "Nico Rivas",
      como_le_dicen: "Nico",
      telefono_whatsapp: "+5491155551234",
      hora_preferida: "18:00",
      zona_horaria: "America/Argentina/Buenos_Aires",
      contexto: { modo: "kids" },
      familia_id: "fam-1",
      estado: "pendiente_pago",
    });
    expect(admin.upserts.kids_v2[0]).toEqual({
      narrador_id: "nar-1",
      idioma: "es-AR",
      canal: "B",
      telefono_padre: "+5491155551234",
      ficha: {
        nombre: "Nico Rivas",
        apodo: "Nico",
        genero: "chico",
        edad: 11,
        quienRegala: "tus papás",
        canal: "B",
        nombrePadre: "Laura Gómez",
        linkPanel: "https://vitacora.test/tablero/nar-1",
        hora: "18:00",
        zona: "America/Argentina/Buenos_Aires",
        temasSacados: ["mama", "escuela"],
        fotosConOtrosChicos: false,
        preguntasPadre: [],
      },
    });
    expect(admin.inserts.pedidos[0]).toMatchObject({
      familia_id: "fam-1",
      narrador_id: "nar-1",
      proveedor: "mercadopago",
      estado: "pendiente",
      monto: 90000,
      moneda: "ARS",
      extras: { tipo: "kids", pdf: true, impreso: null, copias: 0, marcos: 0 },
    });
    // La pasarela cobra el precio de Kids y, si no cobra, vuelve a /ar/comprar/kids.
    const [, compra, origen] = (crearCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(compra).toMatchObject({ total: 90000, moneda: "ARS", lineas: [{ cantidad: 1, precioUnitario: 90000 }] });
    expect(origen).toEqual({ idioma: "ar", pantalla: "kids" });
  });

  it("canal A: las preguntas van al WhatsApp del chico y el del padre queda en kids_v2", async () => {
    const admin = compraNueva();
    usar(admin);

    const r = await POST(peticion(cuerpoKids({ ...LLENO, canal: "A", suWhatsapp: "011 15 4444-9876" }, "AR", "ar")));

    expect(r.status).toBe(200);
    expect(admin.inserts.narradores[0]).toMatchObject({ telefono_whatsapp: "+5491144449876" });
    expect(admin.upserts.kids_v2[0]).toMatchObject({ canal: "A", telefono_padre: "+5491155551234", ficha: { canal: "A" } });
  });

  it("el servidor no cree lo que manda el cliente: zona, nombre del padre y preguntas del padre salen de la compra", async () => {
    const admin = compraNueva();
    usar(admin);
    const cuerpo = cuerpoKids(LLENO, "AR", "ar");
    const trucho = {
      ...cuerpo,
      kids: { ...cuerpo.kids, zona: "Asia/Tokyo", nombrePadre: "Otro", preguntasPadre: [{ texto: "¿Hola?", conLinea: true }], linkPanel: "https://malo.example", extra: 1 },
    };

    const r = await POST(peticion(trucho));

    expect(r.status).toBe(200);
    const { ficha } = admin.upserts.kids_v2[0] as { ficha: FichaKids & { extra?: unknown } };
    expect(ficha.zona).toBe("America/Argentina/Buenos_Aires");
    expect(ficha.nombrePadre).toBe("Laura Gómez");
    expect(ficha.preguntasPadre).toEqual([]);
    expect(ficha.linkPanel).toBe("https://vitacora.test/tablero/nar-1");
    expect(ficha.extra).toBeUndefined();
  });

  it("teléfono repetido (otro libro en marcha) responde 409 y borra la familia recién creada", async () => {
    const admin = compraNueva({
      narradores: [{ data: null, error: null }, { data: null, error: { code: "23505", message: "duplicate key" } }],
    });
    usar(admin);

    const r = await POST(peticion(cuerpoKids(LLENO, "AR", "ar")));

    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe("Ese WhatsApp ya tiene un libro en marcha. Si es tuyo, entrá con tu correo.");
    expect(admin.borrados.familias).toEqual(["fam-1"]);
    expect(admin.upserts.kids_v2).toBeUndefined();
    expect(admin.inserts.pedidos).toBeUndefined();
  });

  it("un pendiente de Kids de la misma familia se retoma; uno de biografía no", async () => {
    const deKids = crearAdmin({
      familias: [{ data: { id: "fam-1" }, error: null }],
      narradores: [
        { data: { id: "nar-viejo", familia_id: "fam-1", estado: "pendiente_pago", contexto: { modo: "kids" } }, error: null },
        { data: { id: "nar-viejo" }, error: null },
      ],
      pedidos: [{ data: { id: "ped-2" }, error: null }],
    });
    usar(deKids);
    expect((await POST(peticion(cuerpoKids(LLENO, "AR", "ar")))).status).toBe(200);
    expect(deKids.updates.narradores[0]).toMatchObject({ estado: "pendiente_pago", contexto: { modo: "kids" } });
    expect(deKids.inserts.narradores).toBeUndefined();
    expect(deKids.upserts.kids_v2[0]).toMatchObject({ narrador_id: "nar-viejo" });

    const deBiografia = crearAdmin({
      familias: [{ data: { id: "fam-1" }, error: null }],
      narradores: [
        { data: { id: "nar-adulto", familia_id: "fam-1", estado: "pendiente_pago", contexto: {} }, error: null },
        { data: null, error: { code: "23505", message: "duplicate key" } },
      ],
    });
    usar(deBiografia);
    expect((await POST(peticion(cuerpoKids(LLENO, "AR", "ar")))).status).toBe(409);
    expect(deBiografia.updates.narradores).toBeUndefined();
    // La familia ya existía: no se borra.
    expect(deBiografia.borrados.familias).toBeUndefined();
  });

  it("España no vende Kids (KIDS_REGIONES), aunque KIDS_VENTA y el precio estén", async () => {
    expect(KIDS_REGIONES).toEqual(["AR"]);
    const admin = compraNueva();
    usar(admin);

    const r = await POST(peticion(cuerpoKids({ ...LLENO, tuWhatsapp: "+34 612 34 56 78" }, "ES", "es")));

    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe(KIDS_TODAVIA_NO);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("con KIDS_VENTA apagado responde 409 de vos y no toca la base", async () => {
    delete process.env.KIDS_VENTA;
    const admin = compraNueva();
    usar(admin);

    const r = await POST(peticion(cuerpoKids(LLENO, "AR", "ar")));

    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe(CHECKOUT_KIDS.ar.proximamenteTexto);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("ficha inválida (hora de noche, tema que no existe, sin género, edad rara, sin canal A con número) responde 400 sin tocar la base", async () => {
    const malos: unknown[] = [
      cuerpoKids({ ...LLENO, hora: "22:00" }, "AR", "ar"),
      cuerpoKids({ ...LLENO, hora: "08:59" }, "AR", "ar"),
      { ...cuerpoKids(LLENO, "AR", "ar"), kids: { ...cuerpoKids(LLENO, "AR", "ar").kids, temasSacados: ["futbol"] } },
      cuerpoKids({ ...LLENO, genero: "" }, "AR", "ar"),
      cuerpoKids({ ...LLENO, edad: "40" }, "AR", "ar"),
      cuerpoKids({ ...LLENO, apodo: "  " }, "AR", "ar"),
      { ...cuerpoKids(LLENO, "AR", "ar"), kids: "no" },
    ];
    for (const cuerpo of malos) {
      const admin = compraNueva();
      usar(admin);
      const r = await POST(peticion(cuerpo));
      expect(r.status, JSON.stringify(cuerpo)).toBe(400);
      expect((await r.json()).error).toBe("El pedido llegó mal formado.");
      expect(admin.from).not.toHaveBeenCalled();
    }
    // Canal A sin el número del chico, o un número que no es un WhatsApp: 400 con el aviso del número.
    for (const cuerpo of [cuerpoKids({ ...LLENO, canal: "A", suWhatsapp: "" }, "AR", "ar"), cuerpoKids({ ...LLENO, tuWhatsapp: "abc" }, "AR", "ar")]) {
      const admin = compraNueva();
      usar(admin);
      const r = await POST(peticion(cuerpo));
      expect(r.status).toBe(400);
      expect((await r.json()).error).toBe("El WhatsApp no parece un número válido. Revisalo e intentá de nuevo.");
      expect(admin.from).not.toHaveBeenCalled();
    }
  });

  it("canal A con el mismo WhatsApp que el padre responde 400 sin tocar la base", async () => {
    const admin = compraNueva();
    usar(admin);
    const r = await POST(peticion(cuerpoKids({ ...LLENO, canal: "A", suWhatsapp: "+54 9 11 5555 1234" }, "AR", "ar")));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("El WhatsApp no parece un número válido. Revisalo e intentá de nuevo.");
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("nombre, apodo, quién se lo regala y tu nombre de más de 60 caracteres: 400 mal formado", async () => {
    const largo = "a".repeat(61);
    for (const e of [{ nombre: largo }, { apodo: largo }, { quien: "otra" as const, quienOtra: largo }, { tuNombre: largo }]) {
      const admin = compraNueva();
      usar(admin);
      const r = await POST(peticion(cuerpoKids({ ...LLENO, ...e }, "AR", "ar")));
      expect(r.status, JSON.stringify(e)).toBe(400);
      expect((await r.json()).error).toBe("El pedido llegó mal formado.");
      expect(admin.from).not.toHaveBeenCalled();
    }
    // 60 justos entran.
    const admin = compraNueva();
    usar(admin);
    expect((await POST(peticion(cuerpoKids({ ...LLENO, nombre: "a".repeat(60) }, "AR", "ar")))).status).toBe(200);
  });

  it("busca la familia por el correo exacto en minúsculas (eq, no ilike)", async () => {
    const admin = compraNueva();
    const eqs: [string, unknown][] = [];
    const original = admin.from.getMockImplementation()!;
    admin.from.mockImplementation((tabla: string) => {
      const b = original(tabla) as Record<string, unknown>;
      const eq = b.eq as (c: string, v: unknown) => unknown;
      b.ilike = () => {
        throw new Error("ilike en Kids");
      };
      b.eq = (c: string, v: unknown) => {
        if (tabla === "familias") eqs.push([c, v]);
        return eq(c, v);
      };
      return b;
    });
    usar(admin);
    expect((await POST(peticion(cuerpoKids(LLENO, "AR", "ar")))).status).toBe(200);
    expect(eqs[0]).toEqual(["email", "laura@ejemplo.com"]);
  });

  it("sin la tabla kids_v2 (migración sin aplicar): borra narrador y familia y responde 409", async () => {
    const admin = compraNueva({ kids_v2: [{ data: null, error: { code: "PGRST205", message: "Could not find the table 'public.kids_v2'" } }] });
    usar(admin);

    const r = await POST(peticion(cuerpoKids(LLENO, "AR", "ar")));

    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe(CHECKOUT_KIDS.ar.proximamenteTexto);
    expect(admin.borrados.narradores).toEqual(["nar-1"]);
    expect(admin.borrados.familias).toEqual(["fam-1"]);
    expect(admin.inserts.pedidos).toBeUndefined();
    expect(crearCheckout).not.toHaveBeenCalled();
  });

  it("si falla el pedido, se borran la fila de kids_v2, el narrador y la familia (500)", async () => {
    const admin = compraNueva({ pedidos: [{ data: null, error: { code: "XX000", message: "boom" } }] });
    usar(admin);

    const r = await POST(peticion(cuerpoKids(LLENO, "AR", "ar")));

    expect(r.status).toBe(500);
    expect(admin.borrados.kids_v2).toEqual(["nar-1"]);
    expect(admin.borrados.narradores).toEqual(["nar-1"]);
    expect(admin.borrados.familias).toEqual(["fam-1"]);
  });
});

describe("validarFichaKids (copia de validarFicha del motor)", () => {
  const base: FichaKids = {
    nombre: " Nico ",
    apodo: "Nico",
    genero: "chico",
    edad: 11,
    quienRegala: "Tu madrina",
    canal: "A",
    nombrePadre: "Laura",
    linkPanel: "https://x/tablero/1",
    hora: "09:00",
    zona: "America/Argentina/Buenos_Aires",
    temasSacados: ["mama", "mama"],
    fotosConOtrosChicos: true,
    preguntasPadre: [
      { texto: " ¿Qué querés ser? ", conLinea: true, quien: "Tu papá" },
      { texto: "  ", conLinea: false },
    ],
  };

  it("normaliza como el motor", () => {
    const f = validarFichaKids(base);
    expect(f.nombre).toBe("Nico");
    expect(f.quienRegala).toBe("tu madrina");
    expect(f.temasSacados).toEqual(["mama"]);
    expect(f.preguntasPadre).toEqual([{ texto: "¿Qué querés ser?", conLinea: true, quien: "tu papá" }]);
  });

  it("tira con los mismos mensajes que el motor", () => {
    expect(() => validarFichaKids({ ...base, linkPanel: "" })).toThrow("Ficha: falta linkPanel");
    expect(() => validarFichaKids({ ...base, hora: "21:59" })).not.toThrow();
    expect(() => validarFichaKids({ ...base, hora: "22:00" })).toThrow("Ficha: hora 22:00 fuera de 09:00–21:59");
    expect(() => validarFichaKids({ ...base, zona: "Marte/Olympus" })).toThrow("Ficha: zona desconocida Marte/Olympus");
    const cuatro = Array.from({ length: 4 }, (_, i) => ({ texto: `p${i}`, conLinea: true }));
    expect(() => validarFichaKids({ ...base, preguntasPadre: cuatro })).toThrow("Ficha: hasta 3 preguntas del padre");
  });
});
