// web/test/productos-tarjeta.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { armarCompra, catalogo, productosParaPedido, tarjetaEnFecha, validarCarrito } from "../src/lib/productos";

const ENTORNO = { ...process.env };

describe("tarjeta negra (regalo en locales)", () => {
  beforeEach(() => {
    process.env.PRECIO_EUR = "49";
    process.env.PRECIO_IMPRESO_EUR = "50";
    process.env.PRECIO_TARJETA_FISICA_EUR = "9";
    process.env.PRECIO_TARJETA_FISICA_ARS = "15000";
  });
  afterEach(() => { process.env = { ...ENTORNO }; });

  it("se puede pedir hasta el 15/12 inclusive, en la hora del país", () => {
    // 15/12 23:30 en Madrid = 22:30 UTC
    expect(tarjetaEnFecha("ES", new Date("2026-12-15T22:30:00Z"))).toBe(true);
    // 16/12 00:30 en Madrid = 15/12 23:30 UTC
    expect(tarjetaEnFecha("ES", new Date("2026-12-15T23:30:00Z"))).toBe(false);
    // 16/12 en Buenos Aires
    expect(tarjetaEnFecha("AR", new Date("2026-12-16T12:00:00Z"))).toBe(false);
    expect(tarjetaEnFecha("AR", new Date("2027-01-02T12:00:00Z"))).toBe(true);
    expect(tarjetaEnFecha("ES", new Date("2026-10-17T12:00:00Z"))).toBe(true);
  });

  it("el catálogo trae el precio solo con variable y en fecha", () => {
    expect(catalogo("ES", new Date("2026-10-17T12:00:00Z")).tarjeta).toBe(9);
    expect(catalogo("AR", new Date("2026-10-17T12:00:00Z")).tarjeta).toBe(15000);
    expect(catalogo("ES", new Date("2026-12-20T12:00:00Z")).tarjeta).toBeNull();
    delete process.env.PRECIO_TARJETA_FISICA_EUR;
    expect(catalogo("ES", new Date("2026-10-17T12:00:00Z")).tarjeta).toBeNull();
  });

  it("suma la línea tarjeta y la anota en el pedido", () => {
    const cat = catalogo("ES", new Date("2026-10-17T12:00:00Z"));
    const compra = armarCompra(cat, "ES", { base: "pdf", impresos: 1, marcos: 0, tarjetas: 1 });
    expect(compra.lineas.map((l) => l.id)).toEqual(["pdf", "impreso", "tarjeta"]);
    expect(compra.total).toBe(108);
    expect(productosParaPedido(compra).tarjetas).toBe(1);
  });

  it("sin tarjeta, el pedido no trae la clave (los pedidos de hoy no cambian)", () => {
    const cat = catalogo("ES", new Date("2026-10-17T12:00:00Z"));
    const compra = armarCompra(cat, "ES", { base: "pdf", impresos: 0, marcos: 0 });
    expect("tarjetas" in productosParaPedido(compra)).toBe(false);
  });

  it("validarCarrito rechaza la tarjeta si no está disponible", () => {
    delete process.env.PRECIO_TARJETA_FISICA_EUR;
    const r = validarCarrito("ES", { base: "pdf", impresos: 0, marcos: 0, tarjetas: 1 });
    expect(r.ok).toBe(false);
  });
});
