import { describe, it, expect } from "vitest";
import { modoCompartir } from "../src/app/tablero/[narradorId]/compartir";

// El botón Compartir (13/10): terminó de contar y quedan dudas → se puede invitar
// a quien sepa las respuestas. El resto, como antes.

const base = { cerrado: false, aprobado: false, dudasAbiertas: false, linkPublico: null };

describe("modoCompartir", () => {
  it("contando: invita", () => {
    expect(modoCompartir(base)).toBe("invitar");
  });
  it("terminó de contar sin dudas: espera el cierre del libro", () => {
    expect(modoCompartir({ ...base, cerrado: true })).toBe("esperar");
  });
  it("terminó de contar con dudas sin contestar: invita para las dudas", () => {
    expect(modoCompartir({ ...base, cerrado: true, dudasAbiertas: true })).toBe("invitar-dudas");
  });
  it("libro cerrado con link: comparte el link aunque queden dudas", () => {
    expect(modoCompartir({ cerrado: true, aprobado: true, dudasAbiertas: true, linkPublico: "https://x/libro/t" })).toBe("link");
  });
});
