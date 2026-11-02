import { describe, expect, it } from "vitest";
import { nombrePropio } from "../src/lib/nombre-propio";

// La página del QR mostraba «nitín» y «juan domingo mateos» tal como los cargó la familia (Naza, 02/11).
describe("nombrePropio", () => {
  it("pone mayúscula inicial a lo que vino todo en minúscula", () => {
    expect(nombrePropio("juan domingo mateos")).toBe("Juan Domingo Mateos");
    expect(nombrePropio("nitín")).toBe("Nitín");
    expect(nombrePropio("  ángel   ruiz ")).toBe("Ángel Ruiz");
  });

  it("deja en minúscula las partículas del medio y respeta los guiones", () => {
    expect(nombrePropio("maría-josé de la fuente")).toBe("María-José de la Fuente");
    expect(nombrePropio("la nena")).toBe("La Nena");
  });

  it("si la familia puso alguna mayúscula, queda como la escribió", () => {
    expect(nombrePropio("el Negro")).toBe("el Negro");
    expect(nombrePropio("JD")).toBe("JD");
    expect(nombrePropio("Imma Colell")).toBe("Imma Colell");
  });
});
