import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  calcularCompra,
  catalogo,
  productosDelPedido,
  productosParaPedido,
  validarCarrito,
  CARRITO_VACIO,
} from "../src/lib/productos";

// El catálogo base + upsells (spec 2026-09-22-catalogo-base-y-upsells-design):
// la base (PDF + Su voz) siempre va; el impreso se suma (+49 el primero, +40
// cada copia más); los marcos solo con impreso (+20 el primero, +15 los demás).
// Una sola función para el checkout y para el panel post-venta.

const ENV_ORIGINAL = { ...process.env };

beforeEach(() => {
  for (const k of Object.keys(process.env)) if (k.startsWith("PRECIO_")) delete process.env[k];
  process.env.PRECIO_EUR = "49";
  process.env.PRECIO_ARS = "85750";
  process.env.PRECIO_IMPRESO_EUR = "49";
  process.env.PRECIO_COPIA_EUR = "40";
  process.env.PRECIO_MARCO_EUR = "20";
  process.env.PRECIO_MARCO_ADICIONAL_EUR = "15";
});
afterEach(() => { process.env = { ...ENV_ORIGINAL }; });

const lineas = (c: ReturnType<typeof calcularCompra>) => c.lineas.map((l) => [l.id, l.cantidad, l.precioUnitario]);

describe("catálogo", () => {
  it("la base siempre tiene precio; impreso y marcos solo si sus variables están cargadas", () => {
    const es = catalogo("ES");
    expect(es.base.precio).toBe(49);
    expect(es.impreso).toEqual({ precio: 49, precioCopia: 40 });
    expect(es.marco).toEqual({ precio: 20, precioAdicional: 15 });
    const ar = catalogo("AR"); // sin variables de AR cargadas en este test
    expect(ar.base.precio).toBe(85750);
    expect(ar.impreso).toBeNull();
    expect(ar.marco).toBeNull();
  });
  it("sin precio de copia no hay copias (pero sí el primer impreso); sin marco adicional, un solo marco", () => {
    delete process.env.PRECIO_COPIA_EUR;
    delete process.env.PRECIO_MARCO_ADICIONAL_EUR;
    const es = catalogo("ES");
    expect(es.impreso).toEqual({ precio: 49, precioCopia: null });
    expect(es.marco).toEqual({ precio: 20, precioAdicional: null });
  });
});

describe("calcularCompra — el checkout", () => {
  it("la base sola: 49", () => {
    const c = calcularCompra("ES", CARRITO_VACIO);
    expect(lineas(c)).toEqual([["pdf", 1, 49]]);
    expect(c.total).toBe(49);
  });
  it("base + impreso = 98; con una copia 138; los ejemplos del spec", () => {
    expect(calcularCompra("ES", { ...CARRITO_VACIO, impresos: 1 }).total).toBe(98);
    const c = calcularCompra("ES", { ...CARRITO_VACIO, impresos: 2 });
    expect(lineas(c)).toEqual([["pdf", 1, 49], ["impreso", 1, 49], ["copia", 1, 40]]);
    expect(c.total).toBe(138);
    const d = calcularCompra("ES", { ...CARRITO_VACIO, impresos: 2, marcos: 2 });
    expect(lineas(d)).toEqual([["pdf", 1, 49], ["impreso", 1, 49], ["copia", 1, 40], ["marco", 1, 20], ["marco_adicional", 1, 15]]);
    expect(d.total).toBe(173);
  });
  it("los marcos sin impreso no entran (viajan con el libro)", () => {
    const c = calcularCompra("ES", { ...CARRITO_VACIO, marcos: 3 });
    expect(lineas(c)).toEqual([["pdf", 1, 49]]);
  });
  it("sin precio de copia, solo entra el primer impreso; sin marco adicional, un solo marco", () => {
    delete process.env.PRECIO_COPIA_EUR;
    delete process.env.PRECIO_MARCO_ADICIONAL_EUR;
    const c = calcularCompra("ES", { ...CARRITO_VACIO, impresos: 3, marcos: 3 });
    expect(lineas(c)).toEqual([["pdf", 1, 49], ["impreso", 1, 49], ["marco", 1, 20]]);
  });
  it("viaje: la base es el viaje, con los mismos adicionales", () => {
    process.env.PRECIO_VIAJE_EUR = "45";
    const c = calcularCompra("ES", { ...CARRITO_VACIO, base: "viaje", impresos: 1, marcos: 1 });
    expect(lineas(c)).toEqual([["viaje", 1, 45], ["impreso", 1, 49], ["marco", 1, 20]]);
    expect(c.total).toBe(114);
  });
  it("cantidades negativas o decimales se sanean; redondea a centavos", () => {
    process.env.PRECIO_COPIA_EUR = "19.99";
    const c = calcularCompra("ES", { ...CARRITO_VACIO, impresos: 4.7, marcos: -2 });
    expect(lineas(c)).toEqual([["pdf", 1, 49], ["impreso", 1, 49], ["copia", 3, 19.99]]);
    expect(c.total).toBe(157.97);
  });
});

describe("calcularCompra — el panel post-venta (ya tiene la base)", () => {
  it("quien compró solo el PDF y pide el impreso paga el adicional (+49), no la base", () => {
    const c = calcularCompra("ES", { base: null, impresos: 1, marcos: 0 });
    expect(lineas(c)).toEqual([["impreso", 1, 49]]);
    expect(c.total).toBe(49);
  });
  it("quien ya tiene impreso paga copias (+40) y, si ya tenía marco, solo adicionales (+15)", () => {
    const c = calcularCompra("ES", { base: null, impresos: 2, marcos: 2, impresosPrevios: 1, marcosPrevios: 1 });
    expect(lineas(c)).toEqual([["copia", 2, 40], ["marco_adicional", 2, 15]]);
    expect(c.total).toBe(110);
  });
  it("marcos sin impreso previo ni nuevo: no entran", () => {
    expect(lineas(calcularCompra("ES", { base: null, impresos: 0, marcos: 2 }))).toEqual([]);
    expect(lineas(calcularCompra("ES", { base: null, impresos: 0, marcos: 2, impresosPrevios: 1 }))).toEqual([["marco", 1, 20], ["marco_adicional", 1, 15]]);
  });
});

describe("validarCarrito", () => {
  it("el checkout siempre puede pagar la base; el viaje sin precio en la región no", () => {
    expect(validarCarrito("ES", CARRITO_VACIO)).toEqual({ ok: true });
    expect(validarCarrito("ES", { ...CARRITO_VACIO, base: "viaje" }).ok).toBe(false);
  });
  it("marcos sin impreso, o cosas sin precio en la región, se rechazan con mensaje", () => {
    expect(validarCarrito("ES", { ...CARRITO_VACIO, marcos: 1 }).ok).toBe(false);
    expect(validarCarrito("AR", { ...CARRITO_VACIO, impresos: 1 }).ok).toBe(false); // sin PRECIO_IMPRESO_ARS
  });
  it("el panel: sin base y sin nada elegido, nada que cobrar", () => {
    expect(validarCarrito("ES", { base: null, impresos: 0, marcos: 0 }).ok).toBe(false);
    expect(validarCarrito("ES", { base: null, impresos: 0, marcos: 1, impresosPrevios: 1 })).toEqual({ ok: true });
  });
});

describe("productosParaPedido (lo que va a pedidos.extras, CONTRATO)", () => {
  it("checkout: pdf siempre true, impreso 'color' con las copias del pedido, marcos", () => {
    const c = calcularCompra("ES", { ...CARRITO_VACIO, impresos: 2, marcos: 3 });
    expect(productosParaPedido(c)).toEqual({ pdf: true, audiolibro: null, impreso: "color", copias: 2, marcos: 3 });
  });
  it("viaje: tipo 'viaje'", () => {
    process.env.PRECIO_VIAJE_EUR = "45";
    expect(productosParaPedido(calcularCompra("ES", { ...CARRITO_VACIO, base: "viaje" }))).toEqual({ pdf: true, audiolibro: null, impreso: null, copias: 0, marcos: 0, tipo: "viaje" });
  });
  it("panel: un pedido posterior sin base lleva pdf false (la base ya la tiene)", () => {
    const c = calcularCompra("ES", { base: null, impresos: 1, marcos: 1, impresosPrevios: 1 });
    expect(productosParaPedido(c)).toEqual({ pdf: false, audiolibro: null, impreso: "color", copias: 1, marcos: 1 });
  });
});

describe("productosDelPedido — lee pedidos viejos y nuevos", () => {
  it("un pedido anterior al 13/09 (sin 'pdf') era PDF + audiolibro con su voz real", () => {
    expect(productosDelPedido({ impreso: "bn", marcos: 1 })).toEqual({ pdf: true, audiolibro: "real", impreso: "bn", copias: 1, marcos: 1 });
    expect(productosDelPedido(null)).toEqual({ pdf: true, audiolibro: "real", impreso: null, copias: 0, marcos: 0 });
  });
  it("un pedido nuevo se lee tal cual, y 'bn' viejo sigue leyéndose", () => {
    expect(productosDelPedido({ pdf: false, audiolibro: null, impreso: null, copias: 0, marcos: 3 })).toEqual({ pdf: false, audiolibro: null, impreso: null, copias: 0, marcos: 3 });
    expect(productosDelPedido({ pdf: true, audiolibro: "clonada", impreso: "bn", copias: 1, marcos: 0 })).toEqual({ pdf: true, audiolibro: "clonada", impreso: "bn", copias: 1, marcos: 0 });
  });
  it("viaje se conserva", () => {
    expect(productosDelPedido({ pdf: true, tipo: "viaje", copias: 0, marcos: 0, impreso: null })).toMatchObject({ pdf: true, tipo: "viaje" });
  });
});
