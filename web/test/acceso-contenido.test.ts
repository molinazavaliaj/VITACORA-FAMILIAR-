import { describe, it, expect } from "vitest";
import { conMarcaDeAcceso, llevaAcceso, modoAcceso } from "../src/lib/acceso-contenido";

describe("el modo de cada historia", () => {
  it("sin la marca, como siempre: nada cambia para las entrevistas en curso", () => {
    expect(modoAcceso(null)).toBe("clasico");
    expect(modoAcceso({})).toBe("clasico");
    expect(modoAcceso({ acceso: "cualquier cosa" })).toBe("clasico");
  });

  it("con la marca y sin contestar, privado: el silencio no abre nada", () => {
    expect(modoAcceso({ acceso: { elige: true } })).toBe("narrador");
  });

  it("«Solo yo» es privado y «Mi familia» abre todo", () => {
    expect(modoAcceso({ acceso: { elige: true, quien: "narrador" } })).toBe("narrador");
    expect(modoAcceso({ acceso: { elige: true, quien: "familia" } })).toBe("familia");
  });
});

describe("a quién le toca la marca", () => {
  it("Familiar e Historia para otra persona, sí", () => {
    expect(llevaAcceso({})).toBe(true);
    expect(llevaAcceso({ modo: "historia" })).toBe(true);
    expect(llevaAcceso({ regalo: true })).toBe(true);
    expect(conMarcaDeAcceso({ trato: "vos" })).toEqual({ trato: "vos", acceso: { elige: true } });
  });

  it("«para mí» (también la autobiografía), Viaje y Kids, no", () => {
    expect(llevaAcceso({ vinculoComprador: "yo mismo" })).toBe(false);
    expect(llevaAcceso({ modo: "historia", vinculoComprador: "yo mismo" })).toBe(false);
    expect(llevaAcceso({ modo: "viaje" })).toBe(false);
    expect(llevaAcceso({ viaje: { salida: "2026-12-01" } })).toBe(false);
    expect(llevaAcceso({ modo: "kids" })).toBe(false);
    expect(conMarcaDeAcceso({ modo: "viaje" })).toEqual({ modo: "viaje" });
  });
});
