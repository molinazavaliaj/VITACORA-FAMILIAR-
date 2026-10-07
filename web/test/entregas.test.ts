import { describe, it, expect } from "vitest";
import { necesitaEntrega, validarDireccion, estadoEnHumano, DIRECCION_CAMPOS, type Direccion } from "../src/lib/entregas";

// Logística de lo físico (3t.26): un pedido con libro impreso o marcos tiene que
// llegar a algún lado. Lo puro: quién necesita entrega, qué dirección vale.
const OK: Direccion = { linea1: "Pelliza 1234", ciudad: "Vicente López", provincia: "Buenos Aires", cp: "1638", pais: "Argentina" };

describe("necesitaEntrega", () => {
  it("con impreso o con marcos, sí; solo PDF o solo viaje, no", () => {
    expect(necesitaEntrega({ impreso: "color", copias: 1, marcos: 0 })).toBe(true);
    expect(necesitaEntrega({ impreso: null, copias: 0, marcos: 2 })).toBe(true);
    expect(necesitaEntrega({ impreso: null, copias: 0, marcos: 0 })).toBe(false);
  });
  it("un pedido viejo con copias pero sin la clave impreso igual viaja", () => {
    expect(necesitaEntrega({ impreso: null, copias: 2, marcos: 0 })).toBe(true);
  });
});

describe("validarDireccion", () => {
  it("acepta una completa y la limpia", () => {
    const r = validarDireccion({ ...OK, linea1: "  Pelliza 1234  ", linea2: "" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.direccion.linea1).toBe("Pelliza 1234");
      expect(r.direccion).not.toHaveProperty("linea2"); // vacío no se guarda
    }
  });
  it("falta cualquier obligatorio → error que nombra el campo", () => {
    for (const campo of DIRECCION_CAMPOS.filter((c) => c.obligatorio)) {
      const r = validarDireccion({ ...OK, [campo.id]: "  " });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.mensaje.toLowerCase()).toContain(campo.nombre.toLowerCase().slice(0, 6));
    }
  });
  it("el piso/depto es opcional y se guarda si viene", () => {
    const r = validarDireccion({ ...OK, linea2: "3º B" });
    expect(r.ok && r.direccion.linea2).toBe("3º B");
  });
  it("rechaza lo que no es objeto y recorta lo larguísimo", () => {
    expect(validarDireccion(null).ok).toBe(false);
    expect(validarDireccion("Pelliza 1234").ok).toBe(false);
    const r = validarDireccion({ ...OK, linea1: "x".repeat(400) });
    expect(r.ok && r.direccion.linea1.length).toBe(200);
  });
});

describe("estadoEnHumano", () => {
  it("cada estado tiene una frase para la familia, sin jerga", () => {
    for (const e of ["sin_direccion", "lista", "en_produccion", "impreso", "enviado", "entregado", "con_problema"] as const) {
      expect(estadoEnHumano(e).length).toBeGreaterThan(8);
      expect(estadoEnHumano(e)).not.toMatch(/_/);
    }
    expect(estadoEnHumano("enviado")).toMatch(/camino|envia|despach/i);
  });
});
