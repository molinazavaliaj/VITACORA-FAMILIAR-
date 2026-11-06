import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { siguienteEstadoLibro } from "../src/app/_direccion/libro-estado";

describe("el estado del libro al terminar cada animación", () => {
  it("sin cerrar, queda abierto como en las landings", () => {
    expect(siguienteEstadoLibro("l3-girar", false)).toBe("abierto");
    expect(siguienteEstadoLibro("l3-viaje", false)).toBeNull();
  });
  it("con cierre hay una sola animación, y termina quieto", () => {
    expect(siguienteEstadoLibro("l3-viaje", true)).toBe("quieto");
    expect(siguienteEstadoLibro("l3-girar", true)).toBeNull();
  });
  it("las otras animaciones no cambian nada", () => {
    expect(siguienteEstadoLibro("l3-viaje-tapa", true)).toBeNull();
  });
  it("el viaje termina en la pose inicial y gira en un solo tramo", () => {
    const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const viaje = css.slice(css.indexOf("@keyframes l3-viaje {"), css.indexOf("@keyframes l3-viaje-tapa"));
    expect(viaje.match(/rotateY\(/g)?.length).toBe(3);
    expect(viaje).toContain("rotateY(32deg)");
    expect(viaje).toContain("rotateY(-328deg)");
  });
});
