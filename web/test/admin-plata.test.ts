import { describe, it, expect } from "vitest";
import { cuentaDelPeriodo, ventaPorVenta, costoPorLibro, aEuros, COMISION_POR_PASARELA } from "../src/lib/admin/plata";
import type { DatosDelPanel, NarradorPanel, PedidoPanel, ConsumoPanel } from "../src/lib/admin/datos";

const CAMBIO = { eurArs: 1250, usdEur: 1.08, fecha: "2026-09-21" };
const datos = (p: Partial<DatosDelPanel>): DatosDelPanel => ({
  narradores: [], familias: [], pedidos: [], respuestas: [], envios: [],
  narraciones: [], fotos: [], consumo: [], latidos: [], gastos: [], ...p,
});
const DESDE = new Date("2026-09-01T00:00:00Z");
const HASTA = new Date("2026-09-21T23:59:59Z");

const pedido = (p: Partial<PedidoPanel> = {}): PedidoPanel => ({
  id: "p1", narrador_id: "n1", familia_id: "f1", estado: "entregado", monto: 49,
  moneda: "EUR", extras: {}, created_at: "2026-09-10T00:00:00Z", proveedor: "stripe", ...p,
});
const narrador = (n: Partial<NarradorPanel> = {}): NarradorPanel => ({
  id: "n1", nombre: "Rosa", como_le_dicen: null, estado: "activo", dia_actual: 10,
  familia_id: "f1", ultima_respuesta_at: null, alerta_silencio: false, libro_aprobado_at: null,
  contexto: null, ...n,
});
const consumo = (c: Partial<ConsumoPanel> = {}): ConsumoPanel => ({
  fecha: "2026-09-18T12:00:00Z", servicio: "fabrica", paso: "capitulo", modelo: "claude-fable-5",
  proveedor: "anthropic", cuenta: "naza", narrador_id: "n1", input_tokens: 100,
  output_tokens: 100, cantidad: null, unidad: null, usd: 10, ...c,
});

describe("la cuenta del mes", () => {
  it("convierte pesos y dólares a euros y deja la cuenta cerrada", () => {
    expect(aEuros(1250, "ARS", CAMBIO)).toBe(1);
    expect(aEuros(1.08, "USD", CAMBIO)).toBe(1);
    expect(aEuros(49, "EUR", CAMBIO)).toBe(49);
  });

  it("sin tipo de cambio no inventa: no convierte y lo dice", () => {
    const sinCambio = { eurArs: 0, usdEur: 0, fecha: "" };
    expect(aEuros(1250, "ARS", sinCambio)).toBeNull();

    const cuenta = cuentaDelPeriodo(
      datos({ pedidos: [pedido({ estado: "pagado", monto: 85750, moneda: "ARS", proveedor: "mercadopago" })] }),
      sinCambio, DESDE, HASTA,
    );
    expect(cuenta.sinConvertir).toBe(true);
    expect(cuenta.entro).toBe(0);
  });

  it("el pedido pendiente de un narrador que ya tiene libro entregado no es ingreso y no se cuenta por cobrar", () => {
    const cuenta = cuentaDelPeriodo(datos({
      narradores: [narrador({ estado: "completado", libro_aprobado_at: "2026-09-18T00:00:00Z" })],
      pedidos: [pedido({ estado: "pendiente", created_at: "2026-09-02T00:00:00Z" })],
    }), CAMBIO, DESDE, HASTA);
    expect(cuenta.entro).toBe(0);
    expect(cuenta.porCobrar).toBe(0);
  });

  it("el pendiente de un narrador que todavía no tiene libro SÍ se cuenta por cobrar", () => {
    // La otra cara de la regla de arriba: sin esto, "por cobrar" siempre daría cero.
    const cuenta = cuentaDelPeriodo(datos({
      narradores: [narrador()],
      pedidos: [pedido({ estado: "pendiente", created_at: "2026-09-02T00:00:00Z" })],
    }), CAMBIO, DESDE, HASTA);
    expect(cuenta.porCobrar).toBe(49);
    expect(cuenta.entro).toBe(0);
  });

  it("la ganancia limpia es entró menos gastó, con las comisiones adentro", () => {
    const cuenta = cuentaDelPeriodo(datos({
      pedidos: [pedido({ estado: "entregado", monto: 89 })],
      consumo: [consumo({ usd: 10 })],
      gastos: [{ fecha: "2026-09-01", concepto: "Railway", monto: 5, moneda: "USD", categoria: "suscripcion", quien: "naza" }],
    }), CAMBIO, DESDE, HASTA);
    expect(cuenta.entro).toBe(89);
    expect(cuenta.comisiones).toBeCloseTo(89 * COMISION_POR_PASARELA.stripe, 2);
    expect(cuenta.gastoIa).toBeCloseTo(10 / 1.08, 2);
    expect(cuenta.fijos).toBeCloseTo(5 / 1.08, 2);
    expect(cuenta.limpia).toBeCloseTo(89 - cuenta.comisiones - cuenta.gastoIa - cuenta.fijos, 2);
  });

  it("lo vendido y todavía no entregado está en la caja pero se muestra aparte", () => {
    const cuenta = cuentaDelPeriodo(datos({
      pedidos: [pedido({ estado: "pagado", monto: 100 })],
    }), CAMBIO, DESDE, HASTA);
    expect(cuenta.entro).toBe(100);
    expect(cuenta.comprometido).toBeCloseTo(100 - 3, 2);
    expect(cuenta.limpiaDeVerdad).toBeCloseTo(cuenta.limpia - cuenta.comprometido, 2);
  });

  it("sin ventas no divide por cero: de cada 100 queda `null`", () => {
    const cuenta = cuentaDelPeriodo(datos({}), CAMBIO, DESDE, HASTA);
    expect(cuenta.porCada100).toBeNull();
    expect(cuenta.limpia).toBe(0);
  });

  it("lo vendido fuera del período no entra en la cuenta", () => {
    const cuenta = cuentaDelPeriodo(datos({
      pedidos: [pedido({ estado: "entregado", monto: 49, created_at: "2026-08-15T00:00:00Z" })],
    }), CAMBIO, DESDE, HASTA);
    expect(cuenta.entro).toBe(0);
  });
});

describe("el costo por libro", () => {
  it("suma por narrador y desglosa por paso, del más caro al más barato", () => {
    const libros = costoPorLibro([
      consumo({ narrador_id: "n1", paso: "capitulo", usd: 4 }),
      consumo({ narrador_id: "n1", paso: "editor", usd: 1 }),
      consumo({ narrador_id: "n2", paso: "estructura", usd: 2 }),
      consumo({ narrador_id: null, paso: "trato", usd: 9 }), // una llamada suelta no es de ningún libro
    ]);
    expect(libros).toHaveLength(2);
    expect(libros[0]).toMatchObject({ narradorId: "n1", usd: 5, porPaso: { capitulo: 4, editor: 1 } });
    expect(libros[1]).toMatchObject({ narradorId: "n2", usd: 2 });
  });

  it("una venta muestra la familia, la pasarela y lo que quedó", () => {
    const ventas = ventaPorVenta(datos({
      familias: [{ id: "f1", region: "ES", email: "maria@mail.com", nombre: "María" }],
      pedidos: [pedido({ estado: "entregado", monto: 49, proveedor: "stripe" })],
      consumo: [consumo({ usd: 5.4 })], // 5,4 USD = 5 € con el cambio de 1,08
    }), CAMBIO);

    expect(ventas).toHaveLength(1);
    expect(ventas[0]).toMatchObject({ familia: "María", region: "ES", pasarela: "stripe", pago: 49, moneda: "EUR" });
    expect(ventas[0].costoIa).toBeCloseTo(5, 2);
    expect(ventas[0].quedo).toBeCloseTo(49 - 49 * 0.03 - 5, 2);
  });

  it("una venta en pesos sin tipo de cambio no inventa lo que quedó: queda en `null`", () => {
    const ventas = ventaPorVenta(datos({
      pedidos: [pedido({ monto: 61250, moneda: "ARS", proveedor: "mercadopago" })],
    }), { eurArs: 0, usdEur: 0, fecha: "" });
    expect(ventas[0].quedo).toBeNull();
    expect(ventas[0].pago).toBe(61250); // el número crudo se muestra igual
  });
});
