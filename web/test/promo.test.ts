import { describe, it, expect, afterEach } from "vitest";
import { promoPorcentaje, precioDeLista } from "../src/lib/promo";

// 8.7 (21/09): la promo es un porcentaje global. Lo que se cobra es siempre el
// precio real cargado; la promo solo agrega el precio de lista tachado y el %.
const ENV = { ...process.env };
afterEach(() => { process.env = { ...ENV }; });

describe("promoPorcentaje", () => {
  it("sin variable, o con basura, no hay promo", () => {
    delete process.env.PROMO_PORCENTAJE;
    expect(promoPorcentaje()).toBeNull();
    for (const v of ["", "0", "abc", "-5", "100", "150", "7.5%"]) { process.env.PROMO_PORCENTAJE = v; expect(promoPorcentaje()).toBeNull(); }
  });
  it("un entero entre 1 y 90 es la promo", () => {
    process.env.PROMO_PORCENTAJE = "7"; expect(promoPorcentaje()).toBe(7);
    process.env.PROMO_PORCENTAJE = "15"; expect(promoPorcentaje()).toBe(15);
  });
});

describe("precioDeLista", () => {
  it("pesos: se redondea a los 50; euros: al entero", () => {
    expect(precioDeLista(79750, "ARS", 7)).toBe(85750);
    expect(precioDeLista(49, "EUR", 7)).toBe(53);
    expect(precioDeLista(79750, "ARS", 15)).toBe(93800);
    expect(precioDeLista(49, "EUR", 15)).toBe(58);
  });
  it("nunca devuelve un precio de lista igual o menor al final", () => {
    expect(precioDeLista(1, "EUR", 1)).toBeGreaterThan(1);
    expect(precioDeLista(50, "ARS", 1)).toBeGreaterThan(50);
  });
});
