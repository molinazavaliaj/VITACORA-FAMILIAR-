import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  calcularCompra,
  extrasDisponibles,
  extrasParaPedido,
  EXTRAS_VACIOS,
  NOMBRE_BASE,
} from "../src/lib/productos";

const ENV_ORIGINAL = { ...process.env };

beforeEach(() => {
  delete process.env.PRECIO_IMPRESO_BN_EUR;
  delete process.env.PRECIO_IMPRESO_COLOR_EUR;
  delete process.env.PRECIO_MARCO_EUR;
  delete process.env.PRECIO_IMPRESO_BN_ARS;
  process.env.PRECIO_EUR = "49";
  process.env.PRECIO_ARS = "65000";
});

afterEach(() => {
  process.env = { ...ENV_ORIGINAL };
});

describe("extrasDisponibles", () => {
  it("sin precios cargados no hay ningún extra: no se vende lo que no tiene precio", () => {
    expect(extrasDisponibles("ES")).toEqual([]);
    expect(extrasDisponibles("AR")).toEqual([]);
  });

  it("un extra aparece solo cuando su precio está cargado para ESA región", () => {
    process.env.PRECIO_IMPRESO_BN_EUR = "99";
    expect(extrasDisponibles("ES").map((e) => e.id)).toEqual(["impreso_bn"]);
    expect(extrasDisponibles("AR")).toEqual([]);
  });

  it("un precio basura (0, negativo, texto) no habilita el extra", () => {
    process.env.PRECIO_IMPRESO_BN_EUR = "0";
    process.env.PRECIO_IMPRESO_COLOR_EUR = "-5";
    process.env.PRECIO_MARCO_EUR = "gratis";
    expect(extrasDisponibles("ES")).toEqual([]);
  });

  it("los marcos son múltiples; el impreso no", () => {
    process.env.PRECIO_IMPRESO_BN_EUR = "99";
    process.env.PRECIO_MARCO_EUR = "29";
    const porId = Object.fromEntries(extrasDisponibles("ES").map((e) => [e.id, e.multiple]));
    expect(porId).toEqual({ impreso_bn: false, marco: true });
  });
});

describe("calcularCompra", () => {
  it("la compra mínima es la base sola, al precio de la región", () => {
    const compra = calcularCompra("ES", EXTRAS_VACIOS);
    expect(compra).toEqual({
      region: "ES",
      moneda: "EUR",
      lineas: [{ id: "base", nombre: NOMBRE_BASE, cantidad: 1, precioUnitario: 49 }],
      total: 49,
    });
  });

  it("suma el impreso y los marcos con sus cantidades", () => {
    process.env.PRECIO_IMPRESO_BN_EUR = "99";
    process.env.PRECIO_MARCO_EUR = "29";
    const compra = calcularCompra("ES", { impreso: "bn", marcos: 3 });
    expect(compra.lineas.map((l) => [l.id, l.cantidad, l.precioUnitario])).toEqual([
      ["base", 1, 49],
      ["impreso_bn", 1, 99],
      ["marco", 3, 29],
    ]);
    expect(compra.total).toBe(49 + 99 + 3 * 29);
  });

  it("un extra elegido pero SIN precio en la región se ignora: nunca se cobra sin precio", () => {
    const compra = calcularCompra("AR", { impreso: "color", marcos: 2 });
    expect(compra.lineas.map((l) => l.id)).toEqual(["base"]);
    expect(compra.total).toBe(65000);
  });

  it("marcos negativos o decimales se sanean", () => {
    process.env.PRECIO_MARCO_EUR = "29";
    expect(calcularCompra("ES", { impreso: null, marcos: -2 }).lineas.map((l) => l.id)).toEqual(["base"]);
    expect(calcularCompra("ES", { impreso: null, marcos: 2.9 }).lineas.find((l) => l.id === "marco")?.cantidad).toBe(2);
  });

  it("redondea el total a centavos", () => {
    process.env.PRECIO_EUR = "19.99";
    process.env.PRECIO_MARCO_EUR = "0.1";
    expect(calcularCompra("ES", { impreso: null, marcos: 3 }).total).toBe(20.29);
  });
});

describe("extrasParaPedido", () => {
  it("refleja SOLO lo que entró en la compra, no lo que se pidió", () => {
    process.env.PRECIO_IMPRESO_BN_EUR = "99";
    const compra = calcularCompra("ES", { impreso: "bn", marcos: 4 }); // marcos sin precio
    expect(extrasParaPedido(compra)).toEqual({ impreso: "bn", marcos: 0 });
  });

  it("base sola → sin extras", () => {
    expect(extrasParaPedido(calcularCompra("ES", EXTRAS_VACIOS))).toEqual({ impreso: null, marcos: 0 });
  });
});
