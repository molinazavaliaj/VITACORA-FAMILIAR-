import { describe, it, expect } from "vitest";
import { TITULARES, faltan } from "../src/app/legal/titulares";

describe("titulares", () => {
  it("España es Immaculada Collel y Argentina Joaquín Molina", () => {
    expect(TITULARES.ES.nombre).toBe("Immaculada Collel");
    expect(TITULARES.AR.nombre).toBe("Joaquín Molina");
    expect(TITULARES.ES.documento.etiqueta).toBe("NIF");
    expect(TITULARES.AR.documento.etiqueta).toBe("CUIT");
  });

  it("faltan() lista solo los campos vacíos", () => {
    expect(faltan({ ...TITULARES.ES, documento: { etiqueta: "NIF", valor: "" }, domicilio: "" })).toEqual(["NIF", "domicilio"]);
    expect(faltan({ ...TITULARES.ES, documento: { etiqueta: "NIF", valor: "X" }, domicilio: "Calle 1" })).toEqual([]);
  });
});
