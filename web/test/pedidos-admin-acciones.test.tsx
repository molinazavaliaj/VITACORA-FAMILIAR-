import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

// Las escrituras y las pantallas de /admin/pedidos, con una base de mentira. Lo que importa:
// una acción es un endpoint suelto, así que el permiso y el paso se revisan ahí; y el estado
// `enviado` se escribe junto con el seguimiento, que es lo que lee el mail de la fábrica.

const { estado, updates, inserts } = vi.hoisted(() => ({
  estado: {
    email: "socio@vitacora.com" as string | null,
    pedido: null as Record<string, unknown> | null,
    pedidos: [] as Record<string, unknown>[],
    errorLectura: null as { code?: string; message: string } | null,
    filasActualizadas: 1,
    candados: [] as string[],
  },
  updates: [] as { cambios: Record<string, unknown>; filtros: Record<string, unknown> }[],
  inserts: [] as Record<string, unknown>[],
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/supabase/sesion", () => ({
  crearClienteSesion: async () => ({ auth: { getUser: async () => ({ data: { user: estado.email ? { email: estado.email } : null } }) } }),
}));
vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: () => ({
    storage: { from: () => ({ list: async () => ({ data: estado.candados.map((name) => ({ name })), error: null }) }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: estado.errorLectura ? null : estado.pedido, error: estado.errorLectura }) }),
        order: () => ({ limit: async () => ({ data: estado.errorLectura ? null : estado.pedidos, error: estado.errorLectura }) }),
      }),
      insert: async (fila: Record<string, unknown>) => {
        inserts.push(fila);
        return { error: null };
      },
      update: (cambios: Record<string, unknown>) => {
        const filtros: Record<string, unknown> = {};
        const cadena = {
          eq: (k: string, v: unknown) => {
            filtros[k] = v;
            return cadena;
          },
          select: async () => {
            updates.push({ cambios, filtros });
            return { data: Array.from({ length: estado.filasActualizadas }, () => ({ id: "e1" })), error: null };
          },
        };
        return cadena;
      },
    }),
  }),
}));

import { corregirSeguimiento, crearEntrega, guardarBulto, marcarEntregado, marcarEnviado, marcarImpreso, marcarProblema, resolverProblema } from "../src/app/admin/pedidos/acciones";
import PantallaPedidos from "../src/app/admin/pedidos/page";
import FichaDelPedido from "../src/app/admin/pedidos/[id]/page";

const ID = "11111111-1111-1111-1111-111111111111";
const ENTREGA = "22222222-2222-2222-2222-222222222222";

const fila = (entrega: Record<string, unknown> | null, cambios: Record<string, unknown> = {}) => ({
  id: ID,
  numero: 1001,
  estado: "pagado",
  monto: "99.00",
  moneda: "EUR",
  proveedor: "stripe",
  extras: { pdf: true, impreso: "color", copias: 1, marcos: 0 },
  created_at: "2026-11-01T10:00:00Z",
  familia_id: "f1",
  narrador_id: "n1",
  comprador: { nombre: "Laura Gómez", email: "laura@mail.com", region: "ES" },
  narrador: { nombre: "Roberto", como_le_dicen: "Abuelo", modo: null },
  entrega: entrega ? { id: ENTREGA, estado: "impreso", origen: "ES", destinatario_nombre: "Ana Pérez", destinatario_telefono: "+34 600", direccion: { linea1: "Mayor 12", ciudad: "Valladolid", cp: "47001", pais: "España" }, peso_g: 750, dimensiones: "24x18x5", produccion_at: "2026-11-02", impreso_at: "2026-11-03", direccion_at: "2026-11-01", ...entrega } : null,
  ...cambios,
});

const form = (campos: Record<string, string> = {}) => {
  const f = new FormData();
  f.set("id", ID);
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
};

beforeEach(() => {
  updates.length = 0;
  inserts.length = 0;
  estado.email = "socio@vitacora.com";
  estado.pedido = fila({});
  estado.pedidos = [];
  estado.errorLectura = null;
  estado.filasActualizadas = 1;
  estado.candados = [];
  process.env.ADMIN_EMAILS = "socio@vitacora.com";
  delete process.env.REMITENTE_ES;
});

describe("el permiso", () => {
  it.each([
    ["marcarImpreso", marcarImpreso],
    ["marcarEnviado", marcarEnviado],
    ["corregirSeguimiento", corregirSeguimiento],
    ["marcarEntregado", marcarEntregado],
    ["marcarProblema", marcarProblema],
    ["resolverProblema", resolverProblema],
    ["guardarBulto", guardarBulto],
    ["crearEntrega", crearEntrega],
  ])("%s no toca nada sin sesión de admin", async (_nombre, accion) => {
    estado.email = "otro@mail.com";
    const r = await accion(form({ transportista: "Correos", peso: "800", medidas: "30x18x8", problema: "x" }));
    expect(r.error).toBe("No tenés permiso para esto.");
    expect(updates).toHaveLength(0);
    expect(inserts).toHaveLength(0);
  });

  it("un id que no es un id no llega a la base", async () => {
    const f = new FormData();
    f.set("id", "1 or 1=1");
    expect((await marcarImpreso(f)).error).toBe("Falta el id.");
  });
});

describe("marcar enviado", () => {
  it("escribe estado, fecha y seguimiento en un solo update, y solo si el estado sigue igual", async () => {
    const r = await marcarEnviado(form({ transportista: "Correos", seguimiento: "PK123", url: "https://correos.es/PK123" }));
    expect(r.error).toBeNull();
    expect(updates).toHaveLength(1);
    expect(updates[0].cambios).toMatchObject({ estado: "enviado", transportista: "Correos", seguimiento: "PK123", seguimiento_url: "https://correos.es/PK123" });
    expect(updates[0].cambios.enviado_at).toEqual(expect.any(String));
    expect(updates[0].filtros).toEqual({ id: ENTREGA, estado: "impreso" });
  });

  it("sin número también sale: el correo ordinario no da seguimiento", async () => {
    const r = await marcarEnviado(form({ transportista: "Correos" }));
    expect(r.error).toBeNull();
    expect(updates[0].cambios.seguimiento).toBeNull();
  });

  it("sin transportista no se marca", async () => {
    expect((await marcarEnviado(form({ seguimiento: "PK123" }))).error).toBe("Falta el transportista.");
    expect(updates).toHaveLength(0);
  });

  it("no despacha lo que la fábrica todavía no mandó a imprenta", async () => {
    estado.pedido = fila({ estado: "lista" });
    expect((await marcarEnviado(form({ transportista: "Correos" }))).error).toMatch(/no se puede dar/);
    expect(updates).toHaveLength(0);
  });

  it("una historia sí sale de lista", async () => {
    estado.pedido = fila({ estado: "lista" }, { narrador: { nombre: "R", como_le_dicen: "R", modo: "historia" } });
    expect((await marcarEnviado(form({ transportista: "Correos" }))).error).toBeNull();
  });

  it("si otro la movió mientras tanto, lo dice", async () => {
    estado.filasActualizadas = 0;
    expect((await marcarEnviado(form({ transportista: "Correos" }))).error).toMatch(/cambió mientras tanto/);
  });
});

describe("corregir el seguimiento", () => {
  it("no cambia el estado", async () => {
    estado.pedido = fila({ estado: "enviado" });
    const r = await corregirSeguimiento(form({ transportista: "SEUR", seguimiento: "S1" }));
    expect(r.error).toBeNull();
    expect(updates[0].cambios).toEqual({ transportista: "SEUR", seguimiento: "S1", seguimiento_url: null });
  });
  it("no se usa para saltear el paso de enviado", async () => {
    expect((await corregirSeguimiento(form({ transportista: "SEUR" }))).error).toMatch(/no se puede dar/);
  });
});

describe("los otros pasos", () => {
  it("impreso, desde imprenta", async () => {
    estado.pedido = fila({ estado: "en_produccion", impreso_at: null });
    expect((await marcarImpreso(form())).error).toBeNull();
    expect(updates[0].cambios).toMatchObject({ estado: "impreso", impreso_at: expect.any(String) });
  });
  it("entregado, solo si ya salió", async () => {
    expect((await marcarEntregado(form())).error).toMatch(/no se puede dar/);
    estado.pedido = fila({ estado: "enviado" });
    expect((await marcarEntregado(form())).error).toBeNull();
    expect(updates[0].cambios).toMatchObject({ estado: "entregado", entregado_at: expect.any(String) });
  });
  it("un problema pide el texto, y al resolverlo vuelve al estado de antes y se borra", async () => {
    expect((await marcarProblema(form())).error).toBe("Escribí cuál es el problema.");
    expect((await marcarProblema(form({ problema: "dirección inexistente" }))).error).toBeNull();
    expect(updates[0].cambios).toEqual({ estado: "con_problema", problema: "dirección inexistente" });
    estado.pedido = fila({ estado: "con_problema", problema: "dirección inexistente" });
    expect((await resolverProblema(form())).error).toBeNull();
    expect(updates[1].cambios).toEqual({ estado: "impreso", problema: null });
    expect(updates[1].filtros.estado).toBe("con_problema");
  });
  it("el peso y las medidas se validan", async () => {
    expect((await guardarBulto(form({ peso: "mucho", medidas: "30x18x8" }))).error).toMatch(/gramos/);
    expect((await guardarBulto(form({ peso: "820", medidas: "30 x 18 x 8,4" }))).error).toBeNull();
    expect(updates[0].cambios).toEqual({ peso_g: 820, dimensiones: "30x18x8.4" });
  });
  it("antes de imprenta no se carga el peso: el portón de la fábrica lo pisaría", async () => {
    estado.pedido = fila({ estado: "lista" });
    expect((await guardarBulto(form({ peso: "820", medidas: "30x18x8" }))).error).toMatch(/no se puede dar/);
    expect(updates).toHaveLength(0);
    expect(await html(ficha())).toContain("Recién ahí se pueden corregir");
    estado.pedido = fila({ estado: "lista" }, { narrador: { nombre: "R", como_le_dicen: "R", modo: "historia" } });
    expect((await guardarBulto(form({ peso: "820", medidas: "30x18x8" }))).error).toBeNull();
  });
  it("crea la entrega que faltó, solo si falta", async () => {
    expect((await crearEntrega(form())).error).toMatch(/no necesita/);
    estado.pedido = fila(null);
    expect((await crearEntrega(form())).error).toBeNull();
    expect(inserts[0]).toEqual({ pedido_id: ID, narrador_id: "n1", familia_id: "f1", estado: "sin_direccion", origen: "ES" });
  });
});

const html = async (pantalla: Promise<ReactElement>) => renderToStaticMarkup(await pantalla);
const lista = (params: Record<string, string> = {}) => PantallaPedidos({ searchParams: Promise.resolve(params), params: Promise.resolve({}) } as never);
const ficha = () => FichaDelPedido({ params: Promise.resolve({ id: ID }), searchParams: Promise.resolve({}) } as never);

describe("la lista", () => {
  it("muestra el número, quien compra, para quién, el producto, el pago y el envío", async () => {
    estado.pedidos = [fila({})];
    const h = await html(lista());
    for (const texto of ["VF-1001", "Laura Gómez", "Ana Pérez", "Libro · 1 impreso", "pagado", "para despachar", `/admin/pedidos/${ID}`]) expect(h).toContain(texto);
    expect(h).not.toMatch(/undefined|NaN/);
  });
  it("el filtro de arriba deja afuera lo que ya salió, y todas las compras lo muestra", async () => {
    estado.pedidos = [fila({ estado: "enviado" })];
    expect(await html(lista())).toContain("No falta despachar nada.");
    expect(await html(lista({ ver: "compras" }))).toContain("VF-1001");
  });
  it("sin la migración, lo dice en vez de romperse", async () => {
    estado.errorLectura = { code: "42703", message: "column pedidos.numero does not exist" };
    expect(await html(lista())).toContain("20261105000000_numero_de_pedido.sql");
  });
  it("un error cualquiera no se hace pasar por falta de migración", async () => {
    estado.errorLectura = { code: "500", message: "se cayó" };
    const h = await html(lista());
    expect(h).toContain("No pude leer los pedidos");
    expect(h).not.toContain("20261105000000");
  });
});

describe("la ficha", () => {
  it("trae la etiqueta y el formulario de despacho; sin remitente, avisa", async () => {
    const h = await html(ficha());
    for (const texto of ["VF-1001", "Ana Pérez", "Mayor 12", "47001 Valladolid", "Tel. +34 600", "750 g", "24 × 18 × 5 cm", "1 libro", "marcar enviado", "REMITENTE_ES"]) expect(h).toContain(texto);
  });
  it("con remitente lo muestra en renglones", async () => {
    process.env.REMITENTE_ES = "Vitácora Familiar|Calle Falsa 1";
    const h = await html(ficha());
    expect(h).toContain("Calle Falsa 1");
    expect(h).not.toContain("REMITENTE_ES");
  });
  it("en lista no ofrece despachar", async () => {
    estado.pedido = fila({ estado: "lista" });
    expect(await html(ficha())).not.toContain("marcar enviado");
  });
  it("ya enviado, dice si salió el mail según el candado de la fábrica", async () => {
    estado.pedido = fila({ estado: "enviado", enviado_at: "2026-11-04T00:00:00Z", transportista: "Correos", seguimiento: "PK1" });
    expect(await html(ficha())).toContain("sale en la próxima vuelta");
    estado.candados = [`entrega_${ENTREGA}_enviado.txt`];
    const h = await html(ficha());
    expect(h).toContain("ya salió");
    expect(h).toContain("marcar entregado");
  });
  it("a Kids le avisa que el mail no sale y no lo promete", async () => {
    estado.pedido = fila({}, { extras: { tipo: "kids", pdf: true, impreso: "color", copias: 1 } });
    const h = await html(ficha());
    expect(h).toContain("hay que avisarle a mano");
    expect(h).not.toContain("le sale el mail");
  });
  it("con una tarjeta del regalo, muestra a dónde va", async () => {
    estado.pedido = fila(null, { extras: { pdf: true, regalo: true, tarjeta: { aNombreDe: "Rosa", direccion: { linea1: "Sol 3", ciudad: "Berga", cp: "08600", pais: "España" } } } });
    const h = await html(ficha());
    expect(h).toContain("Rosa");
    expect(h).toContain("08600 Berga");
  });
  it("un pedido que no existe da 404", async () => {
    estado.pedido = null;
    await expect(ficha()).rejects.toThrow("NOT_FOUND");
  });
});
