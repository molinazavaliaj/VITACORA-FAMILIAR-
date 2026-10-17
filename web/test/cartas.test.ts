// web/test/cartas.test.ts
import { describe, it, expect } from "vitest";
import { comisionDelLibro, leerCodigoImpreso, resumenPorMes } from "../src/lib/cartas";
import type { Compra } from "../src/lib/productos";

const compra = (ids: [string, number, number][]): Compra => ({
  region: "ES", moneda: "EUR", total: 0,
  lineas: ids.map(([id, cantidad, precioUnitario]) => ({ id: id as never, nombre: id, cantidad, precioUnitario })),
});

describe("comisionDelLibro", () => {
  it("20 % del libro: digital, impreso", () => {
    expect(comisionDelLibro(compra([["pdf", 1, 49]]), 20)).toBe(9.8);
    expect(comisionDelLibro(compra([["pdf", 1, 49], ["impreso", 1, 50]]), 20)).toBe(19.8);
  });
  it("los extras no cuentan", () => {
    expect(comisionDelLibro(compra([["pdf", 1, 49], ["impreso", 1, 50], ["tarjeta", 1, 9], ["marco", 1, 19], ["copia", 2, 30]]), 20)).toBe(19.8);
  });
  it("redondea a centavos", () => {
    expect(comisionDelLibro(compra([["pdf", 1, 85750]]), 20)).toBe(17150);
    expect(comisionDelLibro(compra([["pdf", 1, 49.99]]), 20)).toBe(10);
  });
});

/** Un admin de mentira: devuelve `fila` para codigos_impresos y anota el código pedido. */
function admin(fila: unknown, error: unknown = null) {
  const pedidos: string[] = [];
  const cadena = {
    select: () => cadena,
    eq: (_c: string, v: string) => { pedidos.push(v); return cadena; },
    maybeSingle: async () => ({ data: fila, error }),
  };
  return { cliente: { from: () => cadena } as never, pedidos };
}

describe("leerCodigoImpreso", () => {
  const fila = { codigo: "VF-7K3M2Q", pedido_id: null, lotes_impresos: { idioma: "ca", locales: { id: "loc-1", comision_pct: "20.00", activo: true } } };

  it("normaliza el código y devuelve la carta libre", async () => {
    const a = admin(fila);
    const c = await leerCodigoImpreso(a.cliente, " vf-7k3m2q ");
    expect(a.pedidos).toEqual(["VF-7K3M2Q"]);
    expect(c).toEqual({ codigo: "VF-7K3M2Q", pagado: false, localId: "loc-1", idioma: "ca", comisionPct: 20, localActivo: true });
  });
  it("pagada si tiene pedido", async () => {
    expect((await leerCodigoImpreso(admin({ ...fila, pedido_id: "p-1" }).cliente, "VF-7K3M2Q"))?.pagado).toBe(true);
  });
  it("null si no existe, si el código es basura o si la tabla falta", async () => {
    expect(await leerCodigoImpreso(admin(null).cliente, "VF-7K3M2Q")).toBeNull();
    expect(await leerCodigoImpreso(admin(fila).cliente, "hola")).toBeNull();
    expect(await leerCodigoImpreso(admin(null, { code: "42P01", message: "no existe" }).cliente, "VF-7K3M2Q")).toBeNull();
  });
});

describe("resumenPorMes", () => {
  it("agrupa por mes en la zona del local, el más nuevo primero", () => {
    const r = resumenPorMes([
      { created_at: "2026-10-31T23:30:00Z", comision_local: "19.80", monto: "99", moneda: "EUR" }, // 1/11 en Madrid
      { created_at: "2026-10-10T10:00:00Z", comision_local: 9.8, monto: 49, moneda: "EUR" },
      { created_at: "2026-10-12T10:00:00Z", comision_local: "19.80", monto: "99", moneda: "EUR" },
    ], "Europe/Madrid");
    expect(r).toEqual([
      { mes: "2026-11", cartas: 1, comision: 19.8, moneda: "EUR" },
      { mes: "2026-10", cartas: 2, comision: 29.6, moneda: "EUR" },
    ]);
  });
});
