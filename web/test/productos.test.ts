import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  calcularCompra,
  calcularExtras,
  catalogo,
  descuentoPorCopias,
  extrasDisponibles,
  extrasPosterioresParaPedido,
  NADA_ELEGIDO,
  NOMBRE_PDF,
  productosDelPedido,
  productosParaPedido,
  validarProductos,
} from "../src/lib/productos";

const SOLO_PDF = { ...NADA_ELEGIDO, pdf: true };

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
  it("la compra mínima es el PDF solo, al precio de la región", () => {
    const compra = calcularCompra("ES", SOLO_PDF);
    expect(compra).toEqual({
      region: "ES",
      moneda: "EUR",
      lineas: [{ id: "pdf", nombre: NOMBRE_PDF, cantidad: 1, precioUnitario: 49 }],
      total: 49,
    });
  });

  // El audiolibro salió del catálogo el 21/09 («Su voz» va incluida en el PDF):
  // aunque un cliente viejo mande la clave, no existe ninguna línea que cobrar.
  it("el audiolibro ya no existe: una clave 'audiolibro' en lo elegido no genera ninguna línea", () => {
    process.env.PRECIO_AUDIOLIBRO_EUR = "35";
    const compra = calcularCompra("ES", { ...SOLO_PDF, audiolibro: "clonada" } as never);
    expect(compra.lineas.map((l) => l.id)).toEqual(["pdf"]);
    expect(compra.total).toBe(49);
    expect(catalogo("ES")).not.toHaveProperty("audiolibro");
    delete process.env.PRECIO_AUDIOLIBRO_EUR;
  });

  it("los dos juntos, más marcos", () => {
    process.env.PRECIO_IMPRESO_COLOR_EUR = "46";
    process.env.PRECIO_MARCO_EUR = "20";
    const compra = calcularCompra("ES", { pdf: true, impreso: "color", marcos: 2 });
    expect(compra.lineas.map((l) => l.id)).toEqual(["pdf", "impreso_color", "marco"]);
    expect(compra.total).toBe(49 + 46 + 40);
  });

  it("suma el impreso y los marcos con sus cantidades", () => {
    process.env.PRECIO_IMPRESO_BN_EUR = "99";
    process.env.PRECIO_MARCO_EUR = "29";
    const compra = calcularCompra("ES", { ...SOLO_PDF, impreso: "bn", marcos: 3 });
    expect(compra.lineas.map((l) => [l.id, l.cantidad, l.precioUnitario])).toEqual([
      ["pdf", 1, 49],
      ["impreso_bn", 1, 99],
      ["marco", 3, 29],
    ]);
    expect(compra.total).toBe(49 + 99 + 3 * 29);
  });

  it("un extra elegido pero SIN precio en la región se ignora: nunca se cobra sin precio", () => {
    const compra = calcularCompra("AR", { ...SOLO_PDF, impreso: "color", marcos: 2 });
    expect(compra.lineas.map((l) => l.id)).toEqual(["pdf"]);
    expect(compra.total).toBe(65000);
  });

  it("marcos negativos o decimales se sanean", () => {
    process.env.PRECIO_MARCO_EUR = "29";
    expect(calcularCompra("ES", { ...SOLO_PDF, marcos: -2 }).lineas.map((l) => l.id)).toEqual(["pdf"]);
    expect(calcularCompra("ES", { ...SOLO_PDF, marcos: 2.9 }).lineas.find((l) => l.id === "marco")?.cantidad).toBe(2);
  });

  it("redondea el total a centavos", () => {
    process.env.PRECIO_EUR = "19.99";
    process.env.PRECIO_MARCO_EUR = "0.1";
    expect(calcularCompra("ES", { ...SOLO_PDF, marcos: 3 }).total).toBe(20.29);
  });
});

describe("validarProductos — ricitos de oro: al menos uno de los tres", () => {
  it("marcos solos no alcanzan", () => {
    process.env.PRECIO_MARCO_EUR = "20";
    expect(validarProductos("ES", { ...NADA_ELEGIDO, marcos: 2 }).ok).toBe(false);
    expect(validarProductos("ES", NADA_ELEGIDO).ok).toBe(false);
  });
  it("con PDF o impreso (con precio) alcanza", () => {
    process.env.PRECIO_IMPRESO_BN_EUR = "40";
    expect(validarProductos("ES", SOLO_PDF).ok).toBe(true);
    expect(validarProductos("ES", { ...NADA_ELEGIDO, impreso: "bn" }).ok).toBe(true);
  });
  it("un producto elegido que no tiene precio no cuenta", () => {
    expect(validarProductos("ES", { ...NADA_ELEGIDO, impreso: "bn" }).ok).toBe(false);
    expect(validarProductos("ES", NADA_ELEGIDO)).toEqual({ ok: false, mensaje: "Elegí al menos uno: el libro en PDF o el libro impreso." });
  });
});

describe("productosParaPedido", () => {
  it("refleja SOLO lo que entró en la compra, no lo que se pidió", () => {
    process.env.PRECIO_IMPRESO_BN_EUR = "99";
    const elegidos = { ...SOLO_PDF, impreso: "bn" as const, marcos: 4 }; // marcos sin precio
    expect(productosParaPedido(calcularCompra("ES", elegidos))).toEqual({ pdf: true, audiolibro: null, impreso: "bn", copias: 1, marcos: 0 });
  });

  it("PDF solo → nada más", () => {
    expect(productosParaPedido(calcularCompra("ES", SOLO_PDF))).toEqual({ pdf: true, audiolibro: null, impreso: null, copias: 0, marcos: 0 });
  });
});

describe("productosDelPedido — lee pedidos viejos y nuevos", () => {
  it("un pedido anterior al 13/09 (sin 'pdf') era PDF + audiolibro con su voz real", () => {
    expect(productosDelPedido({ impreso: "bn", marcos: 1 })).toEqual({ pdf: true, audiolibro: "real", impreso: "bn", copias: 1, marcos: 1 });
    expect(productosDelPedido(null)).toEqual({ pdf: true, audiolibro: "real", impreso: null, copias: 0, marcos: 0 });
  });
  it("un pedido nuevo se lee tal cual", () => {
    expect(productosDelPedido({ pdf: false, audiolibro: null, impreso: null, copias: 0, marcos: 3 })).toEqual({ pdf: false, audiolibro: null, impreso: null, copias: 0, marcos: 3 });
  });
  // Entre el 13/09 y el 21/09 el audiolibro se vendió aparte: esos pedidos se
  // siguen leyendo con su voz (el panel muestra qué compraron y la fábrica lo lee).
  it("un pedido del 13-21/09 con audiolibro conserva la voz que compró", () => {
    expect(productosDelPedido({ pdf: true, audiolibro: "clonada", impreso: null, copias: 0, marcos: 0 })).toMatchObject({ pdf: true, audiolibro: "clonada" });
  });
});

describe("calcularExtras — después de la compra, con descuento por cantidad", () => {
  beforeEach(() => {
    process.env.PRECIO_IMPRESO_BN_ARS = "70000";
    process.env.PRECIO_IMPRESO_COLOR_ARS = "80500";
    process.env.PRECIO_MARCO_ARS = "35000";
  });

  it("una copia paga lleno, dos −10 %, tres −15 %, cuatro o más −20 %", () => {
    expect(descuentoPorCopias(1)).toBe(0);
    expect(descuentoPorCopias(2)).toBe(0.1);
    expect(descuentoPorCopias(3)).toBe(0.15);
    expect(descuentoPorCopias(4)).toBe(0.2);
    expect(descuentoPorCopias(9)).toBe(0.2);
  });

  it("tres copias en B/N: 70.000 × 0,85 × 3", () => {
    const c = calcularExtras("AR", { copias: 3, acabado: "bn", marcos: 0 });
    expect(c.lineas[0]).toMatchObject({ id: "impreso_bn", cantidad: 3, precioUnitario: 59500 });
    expect(c.lineas[0].nombre).toContain("−15 %");
    expect(c.total).toBe(178500);
  });

  it("los marcos no tienen descuento y no hay línea de base", () => {
    const c = calcularExtras("AR", { copias: 1, acabado: "color", marcos: 4 });
    expect(c.lineas.map((l) => l.id)).toEqual(["impreso_color", "marco"]);
    expect(c.total).toBe(80500 + 4 * 35000);
  });

  it("sin nada elegido, total cero", () => {
    expect(calcularExtras("AR", { copias: 0, acabado: "bn", marcos: 0 }).total).toBe(0);
  });

  it("después se puede sumar el PDF, a precio lleno (el audiolibro ya no)", () => {
    process.env.PRECIO_ARS = "85750";
    process.env.PRECIO_AUDIOLIBRO_ARS = "61250";
    const c = calcularExtras("AR", { pdf: true, audiolibro: "clonada", copias: 0, acabado: "bn", marcos: 0 } as never);
    expect(c.lineas.map((l) => l.id)).toEqual(["pdf"]);
    expect(c.total).toBe(85750);
    expect(extrasPosterioresParaPedido(c)).toMatchObject({ pdf: true, audiolibro: null });
    delete process.env.PRECIO_AUDIOLIBRO_ARS;
  });

  it("lo que va al pedido incluye copias", () => {
    const c = calcularExtras("AR", { copias: 2, acabado: "bn", marcos: 1 });
    expect(extrasPosterioresParaPedido(c)).toEqual({ pdf: false, audiolibro: null, impreso: "bn", copias: 2, marcos: 1 });
  });
});
