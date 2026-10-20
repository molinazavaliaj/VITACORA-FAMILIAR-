import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/pagos", () => ({ crearCheckout: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearCheckout } from "@/lib/pagos";
import { POST as comprar } from "../src/app/api/compra/route";
import { POST as pedirCupon } from "../src/app/api/cupon/route";
import { POST as validarCupon } from "../src/app/api/cupon/validar/route";
import { POST as confirmar } from "../src/app/api/cupon/confirmar/route";
import { GET as bajaGet, POST as bajaPost } from "../src/app/api/cupon/baja/route";
import { GET as recordatorios } from "../src/app/api/cupon/recordatorios/route";
import { confirmarPago } from "../src/lib/confirmar-pago";
import { firmarToken } from "../src/lib/token-firmado";
import type { FilaCupon } from "../src/lib/cupon";

// Las rutas del cupón de bienvenida (20/10) contra una base falsa: lo que se
// cobra, cuándo queda usado, el doble opt-in, la baja y los recordatorios.

type Op = { tabla: string; op: "select" | "insert" | "update" | "delete" | "upsert"; valores?: unknown; filtros: [string, string, unknown][] };
type Responder = (op: Op) => { data: unknown; error: unknown; count?: number } | undefined;

/** Un cliente falso: cada cadena termina en una `Op` y `responder` decide qué devuelve. */
function crearAdmin(responder: Responder) {
  const ops: Op[] = [];
  const from = vi.fn((tabla: string) => {
    const op: Op = { tabla, op: "select", filtros: [] };
    const b: Record<string, unknown> = {};
    const filtro = (tipo: string) => (col: string, val?: unknown, val2?: unknown) => {
      op.filtros.push([tipo, col, val2 !== undefined ? [val, val2] : val]);
      return b;
    };
    for (const t of ["eq", "ilike", "is", "gte", "lt", "not", "limit", "order"]) b[t] = filtro(t);
    b.select = () => b;
    for (const tipo of ["insert", "update", "upsert"] as const) {
      b[tipo] = (valores: unknown) => {
        op.op = tipo;
        op.valores = valores;
        return b;
      };
    }
    b.delete = () => {
      op.op = "delete";
      return b;
    };
    const resolver = () => {
      ops.push(op);
      return Promise.resolve(responder(op) ?? { data: null, error: null });
    };
    b.single = resolver;
    b.maybeSingle = resolver;
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => resolver().then(res, rej);
    return b;
  });
  return { from, ops };
}

const usar = (admin: ReturnType<typeof crearAdmin>) => (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
const tiene = (op: Op, tipo: string, col: string) => op.filtros.some(([t, c]) => t === tipo && c === col);

function cupon(cambios: Partial<FilaCupon> = {}): FilaCupon {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    codigo: "VITACORA10-ABCDEF",
    email: "ana@ejemplo.com",
    region: "AR",
    idioma: "ar",
    porcentaje: 10,
    acepta_recordatorios: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    confirmado_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    vence_el: "2099-01-01",
    recordatorios_enviados: 0,
    ultimo_recordatorio_at: null,
    baja_at: null,
    usado_at: null,
    ...cambios,
  };
}

const json = (body: unknown) => ({ json: async () => body, headers: new Headers() }) as never;

let mails: { to: string[]; subject: string; headers?: Record<string, string>; from: string }[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RASCA_Y_GANA = "1";
  process.env.PRECIO_ARS = "85750";
  process.env.PRECIO_IMPRESO_ARS = "120000";
  delete process.env.PROMO_PORCENTAJE;
  process.env.RESEND_API_KEY = "re_prueba";
  process.env.URL_BASE = "https://vitacorafamiliar.com";
  process.env.CRON_SECRET = "secreto-del-cron";
  mails = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: { body: string }) => {
      mails.push(JSON.parse(init.body));
      return { ok: true, text: async () => "" };
    }),
  );
  (crearCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ urlPago: "https://pago.example/x" });
});

afterEach(() => vi.unstubAllGlobals());

const COMPRA = {
  nombreComprador: "Martina",
  vinculoComprador: "hija",
  region: "AR",
  idiomaWeb: "ar",
  email: "martina@ejemplo.com",
  narrador: { nombre: "Roberto Fernández", comoLeDicen: "Beto", telefonoWhatsapp: "11 5555 1234", horaPreferida: "09:00" },
  productos: { impresos: 0, marcos: 0 },
};

/** La base de una compra que sale bien, con el cupón que se le pase. */
function baseDeCompra(fila: FilaCupon | null) {
  return crearAdmin((op) => {
    if (op.tabla === "cupones") return { data: fila, error: null };
    if (op.tabla === "familias" && op.op === "insert") return { data: { id: "f1" }, error: null };
    if (op.tabla === "narradores" && op.op === "insert") return { data: { id: "n1" }, error: null };
    if (op.tabla === "pedidos" && op.op === "insert") return { data: { id: "p1" }, error: null };
    return undefined;
  });
}

describe("POST /api/compra con cupón", () => {
  it("cobra el total con el 10 % del digital y guarda el cupón en el pedido", async () => {
    const admin = baseDeCompra(cupon());
    usar(admin);
    const r = await comprar(json({ ...COMPRA, cupon: "vitacora10-abcdef" }));
    expect(r.status).toBe(200);
    const pedido = admin.ops.find((o) => o.tabla === "pedidos" && o.op === "insert")!.valores as { monto: number; extras: { cupon?: unknown } };
    expect(pedido.monto).toBe(77175);
    expect(pedido.extras.cupon).toEqual({ codigo: "VITACORA10-ABCDEF", porcentaje: 10, importe: 8575 });
    const compra = (crearCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(compra.total).toBe(77175);
    expect(compra.descuento.importe).toBe(8575);
    // El cupón NO se marca usado acá: recién cuando el pago entra.
    expect(admin.ops.some((o) => o.tabla === "cupones" && o.op === "update")).toBe(false);
  });

  it.each([
    ["usado", cupon({ usado_at: "2026-10-21T10:00:00Z" })],
    ["vencido", cupon({ vence_el: "2020-01-01" })],
    ["otra_region", cupon({ region: "ES", idioma: "es" })],
    ["sin_confirmar", cupon({ confirmado_at: null, vence_el: null })],
    ["no_existe", null],
  ] as const)("si el cupón no sirve (%s) no se cobra nada y se dice por qué", async (motivo, fila) => {
    const admin = baseDeCompra(fila);
    usar(admin);
    const r = await comprar(json({ ...COMPRA, cupon: "VITACORA10-ABCDEF" }));
    expect(r.status).toBe(400);
    expect((await r.json()).motivoCupon).toBe(motivo);
    expect(admin.ops.some((o) => o.tabla === "pedidos")).toBe(false);
    expect(crearCheckout).not.toHaveBeenCalled();
  });

  it("con la promo global prendida no se suma", async () => {
    process.env.PROMO_PORCENTAJE = "15";
    usar(baseDeCompra(cupon()));
    const r = await comprar(json({ ...COMPRA, cupon: "VITACORA10-ABCDEF" }));
    expect((await r.json()).motivoCupon).toBe("con_promo");
  });

  it("con el rasca y gana apagado, ningún código vale", async () => {
    delete process.env.RASCA_Y_GANA;
    usar(baseDeCompra(cupon()));
    const r = await comprar(json({ ...COMPRA, cupon: "VITACORA10-ABCDEF" }));
    expect(r.status).toBe(400);
    expect(crearCheckout).not.toHaveBeenCalled();
  });

  it("sin cupón, la compra de siempre (sin la clave en extras)", async () => {
    const admin = baseDeCompra(null);
    usar(admin);
    await comprar(json(COMPRA));
    const pedido = admin.ops.find((o) => o.tabla === "pedidos" && o.op === "insert")!.valores as { monto: number; extras: Record<string, unknown> };
    expect(pedido.monto).toBe(85750);
    expect("cupon" in pedido.extras).toBe(false);
    expect(admin.ops.some((o) => o.tabla === "cupones")).toBe(false);
  });
});

describe("POST /api/cupon/validar", () => {
  it("devuelve el importe calculado en el servidor", async () => {
    usar(baseDeCompra(cupon()));
    const r = await validarCupon(json({ codigo: "VITACORA10-ABCDEF", idiomaWeb: "ar", productos: { impresos: 1, marcos: 0 } }));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ codigo: "VITACORA10-ABCDEF", importe: 8575, total: 85750 + 120000 - 8575 });
  });

  it("dice por qué no sirve", async () => {
    usar(baseDeCompra(cupon({ usado_at: "2026-10-21T10:00:00Z" })));
    const r = await validarCupon(json({ codigo: "VITACORA10-ABCDEF", idiomaWeb: "ar" }));
    expect(r.status).toBe(400);
    expect((await r.json()).motivo).toBe("usado");
  });
});

describe("el pago entra: el cupón queda usado", () => {
  it("confirmarPago lo marca con compare-and-swap sobre usado_at", async () => {
    const admin = crearAdmin((op) => {
      if (op.tabla === "pedidos" && op.op === "select") return { data: { extras: { pdf: true, cupon: { codigo: "VITACORA10-ABCDEF", porcentaje: 10, importe: 8575 } }, familia_id: "f1" }, error: null };
      if (op.tabla === "pedidos" && op.op === "update") return { data: [{ id: "p1", narrador_id: "n1", familia_id: "f1" }], error: null };
      if (op.tabla === "cupones") return { data: [{ id: "c1" }], error: null };
      return undefined;
    });
    const r = await confirmarPago(admin as never, { pedidoId: "p1", referenciaExterna: "ref", enviarMailAcceso: async () => true });
    expect(r.ok).toBe(true);
    const marca = admin.ops.find((o) => o.tabla === "cupones")!;
    expect(marca.op).toBe("update");
    expect(marca.valores).toMatchObject({ pedido_id: "p1" });
    expect(tiene(marca, "is", "usado_at")).toBe(true);
    expect(marca.filtros).toContainEqual(["eq", "codigo", "VITACORA10-ABCDEF"]);
  });

  it("un reintento del webhook (ya pagado) no lo vuelve a tocar", async () => {
    const admin = crearAdmin((op) => {
      if (op.tabla === "pedidos" && op.op === "select") return { data: { extras: { cupon: { codigo: "VITACORA10-ABCDEF" } }, familia_id: "f1" }, error: null };
      if (op.tabla === "pedidos" && op.op === "update") return { data: [], error: null };
      return undefined;
    });
    await confirmarPago(admin as never, { pedidoId: "p1", referenciaExterna: "ref", enviarMailAcceso: async () => true });
    expect(admin.ops.some((o) => o.tabla === "cupones")).toBe(false);
  });
});

describe("POST /api/cupon (el popup)", () => {
  const base = () =>
    crearAdmin((op) => {
      if (op.tabla === "cupones" && op.op === "insert") return { data: { ...cupon({ confirmado_at: null, vence_el: null }), ...(op.valores as object) , id: cupon().id, created_at: new Date().toISOString() }, error: null };
      if (op.tabla === "cupones" && op.op === "select" && tiene(op, "eq", "ip")) return { data: null, error: null, count: 0 };
      return undefined;
    });

  it("sin la primera casilla no hay cupón", async () => {
    const admin = base();
    usar(admin);
    const r = await pedirCupon(json({ email: "ana@ejemplo.com", recibir: false, idiomaWeb: "es" }));
    expect(r.status).toBe(400);
    expect(admin.ops).toHaveLength(0);
  });

  it("sin la segunda, el cupón se pide igual y sin recordatorios; sale solo el mail de confirmar", async () => {
    const admin = base();
    usar(admin);
    const r = await pedirCupon(json({ email: " Ana@Ejemplo.com ", recibir: true, idiomaWeb: "es" }));
    expect(r.status).toBe(200);
    const alta = admin.ops.find((o) => o.tabla === "cupones" && o.op === "insert")!.valores as Record<string, unknown>;
    expect(alta).toMatchObject({ email: "ana@ejemplo.com", region: "ES", idioma: "es", acepta_recordatorios: false });
    expect((alta.consentimiento as { textos: string[] }).textos).toEqual(["Quiero recibir el cupón en este mail."]);
    expect(mails).toHaveLength(1);
    expect(mails[0].subject).toBe("Confirma tu correo para recibir tu cupón");
    expect(JSON.stringify(mails[0])).not.toMatch(/VITACORA10-[A-Z0-9]{6}/);
  });

  it("con la segunda, guarda el texto exacto que aceptó", async () => {
    const admin = base();
    usar(admin);
    await pedirCupon(json({ email: "ana@ejemplo.com", recibir: true, recordatorios: true, idiomaWeb: "ar" }));
    const alta = admin.ops.find((o) => o.op === "insert")!.valores as { acepta_recordatorios: boolean; region: string; consentimiento: { textos: string[] } };
    expect(alta.acepta_recordatorios).toBe(true);
    expect(alta.region).toBe("AR");
    expect(alta.consentimiento.textos).toHaveLength(2);
  });

  it("si ya lo pidió hace un minuto, no le manda otro mail, y contesta lo mismo", async () => {
    usar(
      crearAdmin((op) => {
        if (op.tabla === "cupones" && op.op === "select") return { data: { ...cupon({ confirmado_at: null, vence_el: null }), confirmaciones_enviadas: 1, confirmacion_enviada_at: new Date(Date.now() - 60_000).toISOString() }, error: null };
        return undefined;
      }),
    );
    const r = await pedirCupon(json({ email: "ana@ejemplo.com", recibir: true, idiomaWeb: "ar" }));
    expect(r.status).toBe(200);
    expect(mails).toHaveLength(0);
  });

  it("apagado, no existe", async () => {
    delete process.env.RASCA_Y_GANA;
    const r = await pedirCupon(json({ email: "ana@ejemplo.com", recibir: true }));
    expect(r.status).toBe(404);
  });
});

describe("el doble opt-in y la baja", () => {
  const id = cupon().id;
  const form = (c: string, t: string) => {
    const f = new FormData();
    f.set("c", c);
    f.set("t", t);
    return { formData: async () => f, nextUrl: new URL("https://vitacorafamiliar.com/api/cupon/confirmar") } as never;
  };

  it("el botón confirma, pone la fecha de vencimiento y manda el código", async () => {
    const admin = crearAdmin((op) => {
      if (op.tabla === "cupones" && op.op === "select") return { data: cupon({ region: "ES", idioma: "es" }), error: null };
      if (op.tabla === "cupones" && op.op === "update") return { data: [cupon({ region: "ES", idioma: "es", vence_el: "2026-11-19" })], error: null };
      return undefined;
    });
    usar(admin);
    const r = await confirmar(form(id, firmarToken("cupon-confirmar", id, Date.now(), 86400000)));
    expect(r.status).toBe(303);
    const upd = admin.ops.find((o) => o.op === "update")!;
    expect(tiene(upd, "is", "confirmado_at")).toBe(true);
    expect(upd.valores).toHaveProperty("vence_el");
    expect(mails).toHaveLength(1);
    expect(JSON.stringify(mails[0])).toContain("VITACORA10-ABCDEF");
  });

  it("con un token de otro cupón no confirma nada", async () => {
    const admin = crearAdmin(() => undefined);
    usar(admin);
    await confirmar(form(id, firmarToken("cupon-confirmar", "otro", Date.now(), 86400000)));
    expect(admin.ops).toHaveLength(0);
  });

  it("la baja de un clic: el link y el botón de Gmail", async () => {
    const admin = crearAdmin((op) => (op.op === "select" ? { data: cupon(), error: null } : undefined));
    usar(admin);
    const url = new URL(`https://vitacorafamiliar.com/api/cupon/baja?c=${id}&t=${firmarToken("cupon-baja", id, Date.now(), 86400000)}`);
    const r = await bajaGet({ nextUrl: url } as never);
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toContain("/cupon/baja?listo=1&idioma=ar");
    expect(admin.ops.find((o) => o.op === "update")!.valores).toHaveProperty("baja_at");
    expect((await bajaPost({ nextUrl: url } as never)).status).toBe(200);
  });

  it("una baja con token malo no toca la base", async () => {
    const admin = crearAdmin(() => undefined);
    usar(admin);
    const r = await bajaGet({ nextUrl: new URL(`https://vitacorafamiliar.com/api/cupon/baja?c=${id}&t=123.abc`) } as never);
    expect(r.headers.get("location")).toContain("mal=1");
    expect(admin.ops).toHaveLength(0);
  });
});

describe("el cron de recordatorios", () => {
  const pedido = (auth?: string) => ({ headers: new Headers(auth ? { authorization: auth } : {}) }) as never;

  it("sin la clave del cron, no hace nada", async () => {
    const admin = crearAdmin(() => undefined);
    usar(admin);
    expect((await recordatorios(pedido())).status).toBe(401);
    expect((await recordatorios(pedido("Bearer otra"))).status).toBe(401);
    delete process.env.CRON_SECRET;
    expect((await recordatorios(pedido("Bearer "))).status).toBe(401);
    expect(admin.ops).toHaveLength(0);
  });

  it("manda el que toca, cuenta antes de mandar y lleva la baja por cabecera", async () => {
    const admin = crearAdmin((op) => {
      if (op.tabla === "cupones" && op.op === "select") return { data: [cupon(), cupon({ id: "otro", recordatorios_enviados: 4 })], error: null };
      if (op.tabla === "cupones" && op.op === "update") return { data: [{ id: cupon().id }], error: null };
      if (op.tabla === "cupones" && op.op === "delete") return { data: [], error: null };
      return undefined;
    });
    usar(admin);
    const r = await recordatorios(pedido("Bearer secreto-del-cron"));
    expect(await r.json()).toEqual({ enviados: 1, fallidos: 0, borrados: 0 });
    const cuenta = admin.ops.find((o) => o.op === "update")!;
    expect(cuenta.valores).toMatchObject({ recordatorios_enviados: 1 });
    expect(cuenta.filtros).toContainEqual(["eq", "recordatorios_enviados", 0]);
    expect(mails).toHaveLength(1);
    expect(mails[0].subject.startsWith("Publicidad")).toBe(true);
    expect(mails[0].headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(mails[0].headers?.["List-Unsubscribe"]).toContain("/api/cupon/baja?c=");
  });

  it("si otro cron ya lo contó, no lo manda", async () => {
    usar(
      crearAdmin((op) => {
        if (op.op === "select") return { data: [cupon()], error: null };
        if (op.op === "update") return { data: [], error: null };
        if (op.op === "delete") return { data: [], error: null };
        return undefined;
      }),
    );
    await recordatorios(pedido("Bearer secreto-del-cron"));
    expect(mails).toHaveLength(0);
  });
});
