import { describe, it, expect } from "vitest";
import { datosDelPanel } from "../src/lib/admin/datos";
import { crearAdmin } from "./dobles"; // el mismo doble filtrador que usa panel.test.ts

describe("las consultas del panel", () => {
  it("una tabla nueva y vacía devuelve listas vacías, no un error", async () => {
    const { admin } = crearAdmin({ narradores: [{ id: "n1", nombre: "Rosa", estado: "activo" }], consumo_ia: [], latidos: [], gastos_manuales: [] });
    const datos = await datosDelPanel(admin, new Date("2026-09-21T12:00:00Z"));
    expect(datos.narradores).toHaveLength(1);
    expect(datos.consumo).toEqual([]);
    expect(datos.latidos).toEqual([]);
  });

  it("pide el gasto de los últimos 31 días, no toda la historia", async () => {
    const { admin, pedidosA } = crearAdmin({ consumo_ia: [] });
    await datosDelPanel(admin, new Date("2026-09-21T12:00:00Z"));
    const pedido = pedidosA("consumo_ia")[0];
    expect(pedido.filtros.fecha).toBeDefined(); // gte con la fecha de corte
  });

  it("trae las respuestas de los narradores activos y no de todos", async () => {
    const { admin, pedidosA } = crearAdmin({ narradores: [{ id: "n1", estado: "activo" }], respuestas: [] });
    await datosDelPanel(admin, new Date("2026-09-21T12:00:00Z"));
    expect(pedidosA("respuestas")[0].filtros.narrador_id).toEqual(["n1"]);
  });

  it("si una consulta se cae, esa lista vuelve vacía y las otras igual llegan", async () => {
    // La regla del spec (Review Focus 2): una tabla que no está no puede romper la página.
    const { admin } = crearAdmin({
      narradores: [{ id: "n1", nombre: "Rosa", estado: "activo" }],
      pedidos: [{ id: "p1", estado: "pagado", narrador_id: "n1", created_at: "2026-09-20T10:00:00Z" }],
    });
    const caido = {
      from: (tabla: string) => {
        if (tabla === "consumo_ia") throw new Error('relation "consumo_ia" does not exist');
        return (admin as unknown as { from: (t: string) => unknown }).from(tabla);
      },
    };
    const datos = await datosDelPanel(caido as never, new Date("2026-09-21T12:00:00Z"));
    expect(datos.consumo).toEqual([]);
    expect(datos.narradores).toHaveLength(1);
    expect(datos.pedidos).toHaveLength(1);
  });

  it("sin narradores en curso no se piden respuestas ni envíos (no se consulta `in` vacío)", async () => {
    const { admin, pedidosA } = crearAdmin({ narradores: [] });
    await datosDelPanel(admin, new Date("2026-09-21T12:00:00Z"));
    expect(pedidosA("respuestas")).toEqual([]);
    expect(pedidosA("envios")).toEqual([]);
  });
});
