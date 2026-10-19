import { describe, it, expect } from "vitest";
import { TITULARES, faltan } from "../src/app/legal/titulares";

describe("titulares", () => {
  it("un solo titular en los dos países: Joaquín Molina (decisión del 17/10)", () => {
    expect(TITULARES.ES.nombre).toBe("Joaquín Molina");
    expect(TITULARES.AR.nombre).toBe("Joaquín Molina");
    expect(TITULARES.ES.documento.etiqueta).toBe("NIF");
    expect(TITULARES.AR.documento.etiqueta).toBe("CUIT");
  });

  it("faltan() lista solo los campos vacíos", () => {
    expect(faltan({ ...TITULARES.ES, documento: { etiqueta: "NIF", valor: "" }, domicilio: "" })).toEqual(["NIF", "domicilio"]);
    expect(faltan({ ...TITULARES.ES, documento: { etiqueta: "NIF", valor: "X" }, domicilio: "Calle 1" })).toEqual([]);
  });
});
