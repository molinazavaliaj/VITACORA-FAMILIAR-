import { describe, it, expect } from "vitest";
import { siguienteEstadoLibro } from "../src/app/_direccion/libro-estado";

describe("el estado del libro al terminar cada animación", () => {
  it("sin cerrar, queda abierto como en las landings", () => {
    expect(siguienteEstadoLibro("l3-girar", false)).toBe("abierto");
    expect(siguienteEstadoLibro("l3-cerrar", false)).toBeNull();
  });
  it("con cierre, se abre, se cierra y queda quieto", () => {
    expect(siguienteEstadoLibro("l3-girar", true)).toBe("cierra");
    expect(siguienteEstadoLibro("l3-cerrar", true)).toBe("quieto");
  });
  it("las otras animaciones no cambian nada", () => {
    expect(siguienteEstadoLibro("l3-abrir", true)).toBeNull();
  });
});
