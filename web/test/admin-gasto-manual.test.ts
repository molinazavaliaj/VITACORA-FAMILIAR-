import { describe, it, expect, vi, beforeEach } from "vitest";

const { insertadas, estado } = vi.hoisted(() => ({
  insertadas: [] as Record<string, unknown>[],
  estado: { falla: false },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: () => ({
    from: () => ({
      insert: async (fila: Record<string, unknown>) => {
        if (estado.falla) return { error: { message: 'new row violates check constraint "moneda"' } };
        insertadas.push(fila);
        return { error: null };
      },
    }),
  }),
}));

import { cargarGastoManual } from "../src/app/admin/gastos/acciones";

const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
};

beforeEach(() => {
  insertadas.length = 0;
  estado.falla = false;
});

describe("cargar un gasto a mano (la única escritura del panel)", () => {
  it("no acepta un gasto sin concepto ni con monto cero o negativo", async () => {
    await expect(cargarGastoManual(form({ concepto: "", monto: "10" }))).resolves.toMatchObject({
      error: expect.stringContaining("concepto"),
    });
    await expect(cargarGastoManual(form({ concepto: "Railway", monto: "0" }))).resolves.toMatchObject({
      error: expect.stringContaining("monto"),
    });
    await expect(cargarGastoManual(form({ concepto: "Railway", monto: "-5" }))).resolves.toMatchObject({
      error: expect.stringContaining("monto"),
    });
    await expect(cargarGastoManual(form({ concepto: "Railway", monto: "cinco" }))).resolves.toMatchObject({
      error: expect.stringContaining("monto"),
    });
    expect(insertadas).toEqual([]);
  });

  it("no acepta una moneda que no sea EUR, USD o ARS", async () => {
    await expect(
      cargarGastoManual(form({ concepto: "x", monto: "5", moneda: "GBP" })),
    ).resolves.toMatchObject({ error: expect.stringContaining("moneda") });
    expect(insertadas).toEqual([]);
  });

  it("con los datos bien, inserta una fila", async () => {
    const r = await cargarGastoManual(
      form({ concepto: "Railway", monto: "5", moneda: "USD", categoria: "suscripcion", quien: "naza" }),
    );
    expect(r.error).toBeNull();
    expect(insertadas[0]).toMatchObject({ concepto: "Railway", monto: 5, moneda: "USD", categoria: "suscripcion", quien: "naza" });
  });

  it("acepta la coma como separador decimal (como se escribe acá)", async () => {
    const r = await cargarGastoManual(form({ concepto: "Dominio", monto: "12,50" }));
    expect(r.error).toBeNull();
    expect(insertadas[0]).toMatchObject({ monto: 12.5, moneda: "EUR" });
  });

  it("si la base rechaza la fila, avisa con una frase y no rompe la pantalla", async () => {
    estado.falla = true;
    const r = await cargarGastoManual(form({ concepto: "Railway", monto: "5" }));
    expect(r.error).toBe("No se pudo guardar el gasto. Probá de nuevo en un rato.");
    expect(insertadas).toEqual([]);
  });

  it("no acepta una categoría que no existe ni una fecha con otro formato", async () => {
    await expect(
      cargarGastoManual(form({ concepto: "x", monto: "5", categoria: "helados" })),
    ).resolves.toMatchObject({ error: expect.stringContaining("categoría") });
    await expect(
      cargarGastoManual(form({ concepto: "x", monto: "5", fecha: "21/09/2026" })),
    ).resolves.toMatchObject({ error: expect.stringContaining("fecha") });
    expect(insertadas).toEqual([]);
  });
});
