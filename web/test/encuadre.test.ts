import { describe, it, expect } from "vitest";
import { focoDe, objectPosition, validarFoco, validarPosicion } from "../src/lib/encuadre";

describe("encuadre (3b.6)", () => {
  it("valida el foco: números entre 0 y 1, redondeados a 3 decimales", () => {
    expect(validarFoco({ x: 0.25, y: 0.33333 })).toEqual({ x: 0.25, y: 0.333 });
    expect(validarFoco({ x: 1.2, y: 0.5 })).toBeNull();
    expect(validarFoco({ x: "0.5", y: 0.5 })).toBeNull();
    expect(validarFoco(null)).toBeNull();
  });
  it("focoDe: lo que venga de la base siempre da un foco usable (centro si falta o está roto)", () => {
    expect(focoDe(undefined)).toEqual({ x: 0.5, y: 0.5 });
    expect(focoDe({ x: 0.2, y: 0.9 })).toEqual({ x: 0.2, y: 0.9 });
    expect(focoDe("basura")).toEqual({ x: 0.5, y: 0.5 });
  });
  it("objectPosition: el CSS que usan la miniatura y la fábrica", () => {
    expect(objectPosition({ x: 0.5, y: 0.5 })).toBe("50% 50%");
    expect(objectPosition({ x: 0.25, y: 0.1 })).toBe("25% 10%");
    expect(objectPosition(null)).toBe("50% 50%");
  });
  it("posicion: arriba o abajo, nada más", () => {
    expect(validarPosicion("arriba")).toBe(true);
    expect(validarPosicion("abajo")).toBe(true);
    expect(validarPosicion("centro")).toBe(false);
  });
});
