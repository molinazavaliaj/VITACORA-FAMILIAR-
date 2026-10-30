import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  calcularCompra,
  catalogo,
  productosDelPedido,
  productosParaPedido,
  validarCarrito,
  ahorroDelPack,
  CARRITO_VACIO,
  NOMBRE_TARJETA,
} from "../src/lib/productos";
import { necesitaEntrega } from "../src/lib/entregas";

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

// El pack con descuento (Naza 14/10: 109 € en España, 190.750 $ en Argentina):
// el PDF, el primer impreso y el primer marco por el precio del pack. Lo cobra
// el servidor con la misma cuenta; el cliente solo manda cantidades.
describe("pack el regalo completo", () => {
  it("un pack mal cargado que no cubre ni el impreso se ignora y se cobra la suma", () => {
    process.env.PRECIO_PACK_EUR = "10.9";
    const c = calcularCompra("ES", { base: "pdf", impresos: 1, marcos: 1 });
    expect(lineas(c).some(([id]) => id === "pack")).toBe(false);
    expect(c.total).toBeGreaterThan(99);
  });

  it("con PRECIO_PACK_EUR el servidor cobra el pack en una sola línea, y manda lo mismo que sueltos", () => {
    process.env.PRECIO_PACK_EUR = "109";
    const c = calcularCompra("ES", { base: "pdf", impresos: 1, marcos: 1 });
    expect(lineas(c)).toEqual([["pack", 1, 109]]);
    expect(c.total).toBe(109);
    expect(productosParaPedido(c)).toMatchObject({ pdf: true, impreso: "color", copias: 1, marcos: 1 });
    expect(ahorroDelPack(catalogo("ES"))).toBe(49 + 49 + 20 - 109);
  });

  it("las copias y los marcos de más se suman encima del pack, a su precio", () => {
    process.env.PRECIO_PACK_EUR = "109";
    const c = calcularCompra("ES", { base: "pdf", impresos: 3, marcos: 2 });
    expect(lineas(c)).toEqual([["pack", 1, 109], ["copia", 2, 40], ["marco_adicional", 1, 15]]);
    expect(c.total).toBe(109 + 80 + 15);
    expect(productosParaPedido(c)).toMatchObject({ copias: 3, marcos: 2 });
  });

  it("sin la variable (o mal escrita, o sin ahorro real) se cobra la suma, como antes", () => {
    const suma = [["pdf", 1, 49], ["impreso", 1, 49], ["marco", 1, 20]];
    expect(lineas(calcularCompra("ES", { base: "pdf", impresos: 1, marcos: 1 }))).toEqual(suma);
    process.env.PRECIO_PACK_EUR = "ciento nueve";
    expect(lineas(calcularCompra("ES", { base: "pdf", impresos: 1, marcos: 1 }))).toEqual(suma);
    process.env.PRECIO_PACK_EUR = "118"; // igual a la suma: no es descuento
    expect(lineas(calcularCompra("ES", { base: "pdf", impresos: 1, marcos: 1 }))).toEqual(suma);
    expect(ahorroDelPack(catalogo("ES"))).toBeNull();
    process.env.PRECIO_PACK_EUR = "150"; // más caro que la suma: tampoco
    expect(calcularCompra("ES", { base: "pdf", impresos: 1, marcos: 1 }).total).toBe(118);
  });

  it("solo con el libro, el impreso y el marco: sin marco, sin impreso, en viaje o en el panel post-venta no hay pack", () => {
    process.env.PRECIO_PACK_EUR = "109";
    process.env.PRECIO_VIAJE_EUR = "59";
    expect(calcularCompra("ES", { base: "pdf", impresos: 1, marcos: 0 }).total).toBe(98);
    expect(calcularCompra("ES", { base: "pdf", impresos: 0, marcos: 1 }).total).toBe(49);
    expect(lineas(calcularCompra("ES", { base: "viaje", impresos: 1, marcos: 1 })).map((l) => l[0])).toEqual(["viaje", "impreso", "marco"]);
    // El panel (Encargar libro): ya tiene la base; el impreso y el marco van a su precio.
    expect(lineas(calcularCompra("ES", { base: null, impresos: 1, marcos: 1 }))).toEqual([["impreso", 1, 49], ["marco", 1, 20]]);
    // Ni con algo comprado antes.
    expect(lineas(calcularCompra("ES", { base: "pdf", impresos: 1, marcos: 1, marcosPrevios: 1 })).some((l) => l[0] === "pack")).toBe(false);
  });

  it("el cliente no puede forzar el precio: lo que manda son cantidades, el precio sale de las variables", () => {
    process.env.PRECIO_PACK_EUR = "109";
    const conPrecioInventado = { base: "pdf", impresos: 1, marcos: 1, precio: 1, pack: { precio: 1 } } as unknown as Parameters<typeof calcularCompra>[1];
    expect(calcularCompra("ES", conPrecioInventado).total).toBe(109);
  });

  it("en Argentina igual, con PRECIO_PACK_ARS", () => {
    process.env.PRECIO_IMPRESO_ARS = "90000";
    process.env.PRECIO_MARCO_ARS = "35000";
    process.env.PRECIO_PACK_ARS = "190750";
    const c = calcularCompra("AR", { base: "pdf", impresos: 1, marcos: 1 });
    expect(lineas(c)).toEqual([["pack", 1, 190750]]);
    expect(catalogo("AR").pack).toEqual({ precio: 190750 });
    delete process.env.PRECIO_PACK_ARS;
    expect(calcularCompra("AR", { base: "pdf", impresos: 1, marcos: 1 }).total).toBe(85750 + 90000 + 35000);
  });
});

describe("la tarjeta impresa del regalo (30/10)", () => {
  it("sin PRECIO_TARJETA_* no existe: catálogo null y no se cobra aunque se pida", () => {
    expect(catalogo("ES").tarjeta).toBeNull();
    const c = calcularCompra("ES", { ...CARRITO_VACIO, tarjeta: true });
    expect(lineas(c)).toEqual([["pdf", 1, 49]]);
    expect(c.total).toBe(49);
  });
  it("con PRECIO_TARJETA_EUR se suma una línea y el total", () => {
    process.env.PRECIO_TARJETA_EUR = "4";
    expect(catalogo("ES").tarjeta).toEqual({ precio: 4 });
    const c = calcularCompra("ES", { ...CARRITO_VACIO, tarjeta: true });
    expect(lineas(c)).toEqual([["pdf", 1, 49], ["tarjeta", 1, 4]]);
    expect(c.lineas[1].nombre).toBe(NOMBRE_TARJETA);
    expect(c.total).toBe(53);
    // Sin pedirla, nada cambia.
    expect(calcularCompra("ES", CARRITO_VACIO).total).toBe(49);
  });
  it("con el pack también va la línea de la tarjeta", () => {
    process.env.PRECIO_TARJETA_EUR = "4";
    process.env.PRECIO_PACK_EUR = "109";
    const c = calcularCompra("ES", { ...CARRITO_VACIO, impresos: 1, marcos: 1, tarjeta: true });
    expect(lineas(c)).toEqual([["pack", 1, 109], ["tarjeta", 1, 4]]);
    expect(c.total).toBe(113);
  });
  it("no es de la fábrica: no cambia lo que va a extras ni pide entrega", () => {
    process.env.PRECIO_TARJETA_EUR = "4";
    const p = productosParaPedido(calcularCompra("ES", { ...CARRITO_VACIO, tarjeta: true }));
    expect(p).toEqual(productosParaPedido(calcularCompra("ES", CARRITO_VACIO)));
    expect(necesitaEntrega(p)).toBe(false);
  });
  it("validarCarrito avisa si se pide y no se vende", () => {
    expect(validarCarrito("ES", { ...CARRITO_VACIO, tarjeta: true })).toEqual({ ok: false, mensaje: "La tarjeta impresa todavía no está disponible." });
    process.env.PRECIO_TARJETA_EUR = "4";
    expect(validarCarrito("ES", { ...CARRITO_VACIO, tarjeta: true })).toEqual({ ok: true });
  });
});
