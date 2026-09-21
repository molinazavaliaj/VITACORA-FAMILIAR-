import { describe, it, expect } from "vitest";
import { frenosDe, contarPorGravedad, horasEntre, type DatosDelPanel } from "../src/lib/admin/frenos";

const AHORA = new Date("2026-09-21T12:00:00Z");
const hace = (horas: number) => new Date(AHORA.getTime() - horas * 3600_000).toISOString();

function datos(parcial: Partial<DatosDelPanel>): DatosDelPanel {
  return { narradores: [], pedidos: [], narraciones: [], latidos: [], ...parcial };
}

describe("los frenos", () => {
  it("el narrador que no contesta hace 4 días es ámbar y dice cuántos días", () => {
    const f = frenosDe(datos({ narradores: [{
      id: "n1", nombre: "Osvaldo", estado: "activo", dia_actual: 17,
      ultima_respuesta_at: hace(96), alerta_silencio: true,
    }] }), AHORA);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ gravedad: "ambar", quien: "Osvaldo" });
    expect(f[0].detalle).toContain("4");
  });

  it("el que contestó hace 6 horas no es un freno", () => {
    const f = frenosDe(datos({ narradores: [{
      id: "n1", nombre: "Rosa", estado: "activo", dia_actual: 12,
      ultima_respuesta_at: hace(6), alerta_silencio: false,
    }] }), AHORA);
    expect(f).toEqual([]);
  });

  it("un pago sin confirmar hace 26 h es rojo; hace 3 h no", () => {
    const pedidos = [
      { id: "p1", estado: "pendiente", created_at: hace(26), narrador_id: "n1", monto: 49, moneda: "EUR" },
      { id: "p2", estado: "pendiente", created_at: hace(3), narrador_id: "n2", monto: 49, moneda: "EUR" },
    ];
    const f = frenosDe(datos({ pedidos: pedidos as never }), AHORA);
    expect(f).toHaveLength(1);
    expect(f[0].gravedad).toBe("rojo");
    expect(f[0].detalle).toContain("pago");
  });

  it("una narración sin avanzar hace 9 h es roja (el criterio del repo son 6)", () => {
    const f = frenosDe(datos({ narraciones: [{
      id: "x1", narrador_id: "n1", estado: "procesando", actualizada_at: hace(9), created_at: hace(40),
    }] }), AHORA);
    expect(f[0].gravedad).toBe("rojo");
    expect(f[0].detalle).toContain("voz");
  });

  it("un pedido pagado hace 30 h que la fábrica no tomó es rojo", () => {
    const f = frenosDe(datos({ pedidos: [{
      id: "p3", estado: "pagado", created_at: hace(30), narrador_id: "n1", monto: 49, moneda: "EUR",
    }] as never }), AHORA);
    expect(f[0].gravedad).toBe("rojo");
    expect(f[0].detalle).toContain("sin arrancar");
  });

  it("un pedido pendiente viejo de un narrador con libro entregado NO es un freno", () => {
    const f = frenosDe(datos({
      pedidos: [{ id: "p4", estado: "pendiente", created_at: hace(200), narrador_id: "n1", monto: 49, moneda: "EUR" }] as never,
      narradores: [{ id: "n1", nombre: "Ferrer", estado: "completado", dia_actual: 30, ultima_respuesta_at: hace(48), alerta_silencio: false, libro_aprobado_at: hace(72) }],
    }), AHORA);
    expect(f.some((freno) => freno.detalle.includes("pago"))).toBe(false);
  });

  it("sin base, sin frenos: la pantalla muestra el vacío, no un error", () => {
    expect(frenosDe(datos({}), AHORA)).toEqual([]);
    expect(contarPorGravedad([])).toEqual({ rojo: 0, ambar: 0, verde: 0 });
  });

  it("ordena primero los rojos y, adentro, el más viejo", () => {
    const f = frenosDe(datos({
      pedidos: [{ id: "p1", estado: "pendiente", created_at: hace(26), narrador_id: "n2", monto: 49, moneda: "EUR" }] as never,
      narraciones: [{ id: "x1", narrador_id: "n1", estado: "procesando", actualizada_at: hace(9), created_at: hace(40) }],
    }), AHORA);
    expect(f.map((x) => x.gravedad)).toEqual(["rojo", "rojo"]);
    expect(f[0].horas! >= f[1].horas!).toBe(true);
  });

  it("la voz que está narrando NO se declara caída por media hora sin latido", () => {
    // Review Focus 4: mientras narra un capítulo la PC de música no late (14-33 min
    // medidos). Sin esta excepción el panel mostraría "se cayó" con la máquina trabajando.
    const f = frenosDe(datos({
      latidos: [{ servicio: "voz", ultimo_ping: hace(0.6) }],                 // 36 min sin latir
      narraciones: [{
        id: "x1", narrador_id: "n1", estado: "procesando",
        actualizada_at: hace(0.2), created_at: hace(1),                  // avanzó hace 12 min
      }],
    }), AHORA);
    expect(f).toEqual([]);
  });

  it("la PC de música apagada y sin nada que narrar no es un freno", () => {
    const f = frenosDe(datos({ latidos: [{ servicio: "voz", ultimo_ping: hace(30) }], narraciones: [] }), AHORA);
    expect(f).toEqual([]);
  });

  it("la PC de música que no late con una narración esperando SÍ es un freno", () => {
    const f = frenosDe(datos({
      latidos: [{ servicio: "voz", ultimo_ping: hace(30) }],
      narraciones: [{ id: "x1", narrador_id: "n1", estado: "procesando", actualizada_at: hace(20), created_at: hace(40) }],
    }), AHORA);
    expect(f.some((x) => x.que === "latido")).toBe(true);
  });

  it("la fábrica que no late hace 4 minutos sí está roja (su vuelta es de un minuto)", () => {
    const f = frenosDe(datos({ latidos: [{ servicio: "fabrica", ultimo_ping: hace(4 / 60) }] }), AHORA);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ gravedad: "rojo" });
    expect(f[0].detalle).toContain("latido");
  });

  it("horasEntre devuelve null cuando la fecha no se puede leer", () => {
    expect(horasEntre("", AHORA)).toBeNull();
    expect(horasEntre("no es una fecha", AHORA)).toBeNull();
    expect(horasEntre(hace(5), AHORA)).toBeCloseTo(5, 3);
  });
});
