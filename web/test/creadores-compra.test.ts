import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/pagos", () => ({ crearCheckout: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearCheckout } from "@/lib/pagos";
import { POST as comprar } from "../src/app/api/compra/route";
import { POST as validarCupon } from "../src/app/api/cupon/validar/route";
import { confirmarPago } from "../src/lib/confirmar-pago";
import { lineasParaCobrar } from "../src/lib/cupon";
import { calcularCompra } from "../src/lib/productos";
import type { FilaCreador } from "../src/lib/creadores";

// El código de un creador en el casillero del checkout (21/10): lo que se
// cobra, lo que se guarda en el pedido (nunca como `extras.cupon`) y la
// comisión que nace cuando el pago entra, congelada y una sola por pedido.

type Op = { tabla: string; op: "select" | "insert" | "update" | "delete" | "upsert"; valores?: unknown; filtros: [string, string, unknown][] };
type Responder = (op: Op) => { data: unknown; error: unknown; count?: number } | undefined;

/** Un cliente falso: cada cadena termina en una `Op` y `responder` decide qué devuelve. */
function crearAdmin(responder: Responder) {
  const ops: Op[] = [];
  const from = vi.fn((tabla: string) => {
    const op: Op = { tabla, op: "select", filtros: [] };
    const b: Record<string, unknown> = {};
    const filtro = (tipo: string) => (col: string, val?: unknown) => {
      op.filtros.push([tipo, col, val]);
      return b;
    };
    for (const t of ["eq", "ilike", "in", "is", "gte", "lt", "not", "limit", "order"]) b[t] = filtro(t);
    b.select = () => b;
    for (const tipo of ["insert", "update", "upsert"] as const) {
      b[tipo] = (valores: unknown) => {
        op.op = tipo;
        op.valores = valores;
        return b;
      };
    }
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
const valor = (op: Op, tipo: string, col: string) => op.filtros.find(([t, c]) => t === tipo && c === col)?.[2];

function creador(cambios: Partial<FilaCreador> = {}): FilaCreador {
  return {
    id: "c1",
    created_at: "2026-10-21T10:00:00Z",
    nombre: "Lucía",
    email: "lucia@ejemplo.com",
    red: "instagram",
    perfil: "instagram.com/lucia",
    seguidores: null,
    mensaje: null,
    region: "AR",
    idioma: "ar",
    estado: "activo",
    codigo: "LUCIA",
    comision: 20,
    descuento: 10,
    token_panel: "t".repeat(43),
    aprobado_at: "2026-10-21T11:00:00Z",
    notas: null,
    ...cambios,
  };
}

/** La base de una compra que sale bien, con el creador que se le pase (o ninguno). */
function baseDeCompra(fila: FilaCreador | null) {
  return crearAdmin((op) => {
    if (op.tabla === "creadores") {
      // Como PostgREST: el filtro `estado = activo` deja afuera a los pausados.
      const ok = fila && valor(op, "eq", "codigo") === fila.codigo && valor(op, "eq", "estado") === fila.estado;
      return { data: ok ? fila : null, error: null };
    }
    if (op.tabla === "cupones") return { data: null, error: null };
    if (op.tabla === "familias" && op.op === "insert") return { data: { id: "f1" }, error: null };
    if (op.tabla === "narradores" && op.op === "insert") return { data: { id: "n1" }, error: null };
    if (op.tabla === "pedidos" && op.op === "insert") return { data: { id: "p1" }, error: null };
    return undefined;
  });
}

const json = (body: unknown) => ({ json: async () => body, headers: new Headers() }) as never;

let mails: { to: string[]; subject: string }[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CREADORES = "1";
  delete process.env.RASCA_Y_GANA;
  process.env.PRECIO_ARS = "85750";
  process.env.PRECIO_IMPRESO_ARS = "120000";
  delete process.env.PROMO_PORCENTAJE;
  process.env.RESEND_API_KEY = "re_prueba";
  process.env.MAIL_SOCIOS = "socios@ejemplo.com";
  process.env.URL_BASE = "https://vitacorafamiliar.com";
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

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CREADORES;
  delete process.env.MAIL_SOCIOS;
});

const COMPRA = {
  nombreComprador: "Martina",
  vinculoComprador: "hija",
  region: "AR",
  idiomaWeb: "ar",
  email: "martina@ejemplo.com",
  narrador: { nombre: "Roberto Fernández", comoLeDicen: "Beto", telefonoWhatsapp: "11 5555 1234", horaPreferida: "09:00" },
  productos: { impresos: 0, marcos: 0 },
};

const pedidoInsertado = (admin: ReturnType<typeof crearAdmin>) =>
  admin.ops.find((o) => o.tabla === "pedidos" && o.op === "insert")!.valores as { monto: number; extras: Record<string, unknown> };

describe("POST /api/compra con el código de un creador", () => {
  it("cobra con su descuento y guarda el creador aparte, NUNCA como cupón", async () => {
    const admin = baseDeCompra(creador());
    usar(admin);
    const r = await comprar(json({ ...COMPRA, cupon: " lucía " }));
    expect(r.status).toBe(200);
    const pedido = pedidoInsertado(admin);
    expect(pedido.monto).toBe(77175);
    expect(pedido.extras.creador).toEqual({ id: "c1", codigo: "LUCIA", comision: 20 });
    expect(pedido.extras.descuento_creador).toEqual({ codigo: "LUCIA", porcentaje: 10, importe: 8575 });
    expect("cupon" in pedido.extras).toBe(false);
    const compra = (crearCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(compra.total).toBe(77175);
    expect(compra.creador).toEqual({ id: "c1", codigo: "LUCIA", comision: 20, descuento: 10 });
    // Ni se busca en la tabla del rasca.
    expect(admin.ops.some((o) => o.tabla === "cupones")).toBe(false);
  });

  it("con descuento 0 cobra el precio entero y atribuye igual la venta", async () => {
    const admin = baseDeCompra(creador({ descuento: 0 }));
    usar(admin);
    const r = await comprar(json({ ...COMPRA, cupon: "LUCIA" }));
    expect(r.status).toBe(200);
    const pedido = pedidoInsertado(admin);
    expect(pedido.monto).toBe(85750);
    expect(pedido.extras.creador).toEqual({ id: "c1", codigo: "LUCIA", comision: 20 });
    expect("descuento_creador" in pedido.extras).toBe(false);
    expect("cupon" in pedido.extras).toBe(false);
  });

  it.each(["pausado", "pendiente", "rechazado"] as const)("un creador %s no vale: no se cobra nada", async (estado) => {
    const admin = baseDeCompra(creador({ estado }));
    usar(admin);
    const r = await comprar(json({ ...COMPRA, cupon: "LUCIA" }));
    expect(r.status).toBe(400);
    expect((await r.json()).motivoCupon).toBe("no_existe");
    expect(admin.ops.some((o) => o.tabla === "pedidos")).toBe(false);
  });

  it("con CREADORES apagado ningún código de creador vale (ni se busca)", async () => {
    delete process.env.CREADORES;
    const admin = baseDeCompra(creador());
    usar(admin);
    const r = await comprar(json({ ...COMPRA, cupon: "LUCIA" }));
    expect(r.status).toBe(400);
    expect(admin.ops.some((o) => o.tabla === "creadores")).toBe(false);
    expect(crearCheckout).not.toHaveBeenCalled();
  });

  it("no se suma con la promo global", async () => {
    process.env.PROMO_PORCENTAJE = "15";
    usar(baseDeCompra(creador()));
    const r = await comprar(json({ ...COMPRA, cupon: "LUCIA" }));
    expect((await r.json()).motivoCupon).toBe("con_promo");
  });

  it("con el rasca también prendido, un código VITACORA10 sigue yendo a los cupones", async () => {
    process.env.RASCA_Y_GANA = "1";
    const admin = baseDeCompra(creador());
    usar(admin);
    await comprar(json({ ...COMPRA, cupon: "VITACORA10-ABCDEF" }));
    expect(admin.ops.some((o) => o.tabla === "cupones")).toBe(true);
    expect(admin.ops.some((o) => o.tabla === "creadores")).toBe(false);
  });
});

describe("POST /api/cupon/validar con el código de un creador", () => {
  it("contesta igual que el cupón, con la línea del código y el aviso", async () => {
    usar(baseDeCompra(creador()));
    const r = await validarCupon(json({ codigo: "lucia", idiomaWeb: "ar" }));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({
      codigo: "LUCIA",
      importe: 8575,
      total: 77175,
      linea: "Código LUCIA · 10 % del libro digital",
      aviso: "Código LUCIA aplicado.",
    });
  });

  it("sin descuento, importe 0 y sin línea", async () => {
    usar(baseDeCompra(creador({ descuento: 0 })));
    const r = await validarCupon(json({ codigo: "LUCIA", idiomaWeb: "ar" }));
    expect(await r.json()).toMatchObject({ codigo: "LUCIA", importe: 0, total: 85750, linea: null });
  });
});

describe("la línea en la pasarela", () => {
  it("dice el código y el %, no «Cupón de bienvenida», y la suma da el total", () => {
    process.env.PRECIO_EUR = "49";
    const base = calcularCompra("ES", { base: "pdf", impresos: 0, marcos: 0 });
    const compra = { ...base, total: 44.1, descuento: { codigo: "LUCIA", porcentaje: 10, importe: 4.9 }, creador: { id: "c1", codigo: "LUCIA", comision: 20, descuento: 10 } };
    const lineas = lineasParaCobrar(compra);
    expect(lineas[0].nombre).toContain("Código LUCIA · 10 % del libro digital");
    expect(lineas[0].nombre).not.toContain("bienvenida");
    expect(lineas.reduce((s, l) => s + l.precioUnitario * l.cantidad, 0)).toBeCloseTo(44.1, 2);
  });
});

// ── Cuando el pago entra ──────────────────────────────────────────────────

const PEDIDO = { id: "p1", narrador_id: "n1", familia_id: "f1" };

function baseDePago(opciones: { extras: Record<string, unknown>; monto?: number; moneda?: string; yaPagado?: boolean; errorComision?: { code?: string; message: string } }) {
  return crearAdmin((op) => {
    if (op.tabla === "pedidos" && op.op === "select") return { data: { extras: opciones.extras, familia_id: "f1", monto: opciones.monto ?? 77175, moneda: opciones.moneda ?? "ARS" }, error: null };
    if (op.tabla === "pedidos" && op.op === "update") return { data: opciones.yaPagado ? [] : [PEDIDO], error: null };
    if (op.tabla === "narradores" && op.op === "update") return { data: [{ id: "n1" }], error: null };
    if (op.tabla === "familias") return { data: { email: "martina@ejemplo.com", region: "AR" }, error: null };
    if (op.tabla === "comisiones_creadores") return { data: null, error: opciones.errorComision ?? null };
    return undefined;
  });
}

const confirmar = (admin: ReturnType<typeof crearAdmin>) =>
  confirmarPago(admin as never, { pedidoId: "p1", referenciaExterna: "mp_1", enviarMailAcceso: vi.fn().mockResolvedValue(true) });

describe("confirmarPago con el código de un creador", () => {
  const EXTRAS = { pdf: true, creador: { id: "c1", codigo: "LUCIA", comision: 20 }, descuento_creador: { codigo: "LUCIA", porcentaje: 10, importe: 8575 } };

  it("anota la comisión sobre lo cobrado, con el % congelado de la compra (pesos al entero)", async () => {
    const admin = baseDePago({ extras: EXTRAS });
    const r = await confirmar(admin);
    expect(r).toMatchObject({ ok: true, yaEstaba: false });
    const insert = admin.ops.find((o) => o.tabla === "comisiones_creadores" && o.op === "insert")!;
    expect(insert.valores).toMatchObject({ creador_id: "c1", pedido_id: "p1", codigo: "LUCIA", total: 77175, moneda: "ARS", porcentaje: 20, importe: 15435 });
    // Nunca toca la tabla del rasca: no hay «cupón usado dos veces».
    expect(admin.ops.some((o) => o.tabla === "cupones")).toBe(false);
    expect(mails).toEqual([]);
  });

  it("en euros, a los céntimos", async () => {
    const admin = baseDePago({ extras: { ...EXTRAS, creador: { id: "c1", codigo: "LUCIA", comision: 15 } }, monto: 44.1, moneda: "EUR" });
    await confirmar(admin);
    const insert = admin.ops.find((o) => o.tabla === "comisiones_creadores")!;
    expect(insert.valores).toMatchObject({ total: 44.1, moneda: "EUR", porcentaje: 15, importe: 6.62 });
  });

  it("confirmar dos veces no duplica: el reintento ni llega a la comisión", async () => {
    const admin = baseDePago({ extras: EXTRAS, yaPagado: true });
    const r = await confirmar(admin);
    expect(r).toMatchObject({ ok: true, yaEstaba: true });
    expect(admin.ops.some((o) => o.tabla === "comisiones_creadores")).toBe(false);
  });

  it("si la comisión ya estaba (pedido_id único), no pasa nada ni se avisa", async () => {
    const admin = baseDePago({ extras: EXTRAS, errorComision: { code: "23505", message: "duplicate key value violates unique constraint" } });
    const r = await confirmar(admin);
    expect(r).toMatchObject({ ok: true, yaEstaba: false });
    expect(mails.some((m) => m.to.includes("socios@ejemplo.com"))).toBe(false);
  });

  it("si la base falla, el pago sigue confirmado y se avisa a los socios", async () => {
    const admin = baseDePago({ extras: EXTRAS, errorComision: { message: "se cayó la base" } });
    const errores = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await confirmar(admin);
    expect(r).toMatchObject({ ok: true, yaEstaba: false, email: "martina@ejemplo.com" });
    expect(mails.some((m) => m.to.includes("socios@ejemplo.com") && m.subject === "Comisión de creador sin anotar")).toBe(true);
    // El narrador arrancó igual.
    expect(admin.ops.some((o) => o.tabla === "narradores" && o.op === "update")).toBe(true);
    errores.mockRestore();
  });

  it("sin creador en el pedido, ni se mira la tabla", async () => {
    const admin = baseDePago({ extras: { pdf: true } });
    await confirmar(admin);
    expect(admin.ops.some((o) => o.tabla === "comisiones_creadores")).toBe(false);
  });
});
