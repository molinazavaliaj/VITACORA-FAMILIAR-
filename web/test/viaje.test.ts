import { describe, it, expect } from "vitest";
import { etapaDeFecha, validarViaje, validarEtapas, SIN_ETAPA } from "../src/lib/viaje";

const base = { salida: "2026-09-20", vuelta: "2026-09-29" };

describe("Vitácora de viaje — validación", () => {
  it("acepta etapas con y sin fechas, limpia nombres, ignora filas vacías", () => {
    const r = validarViaje({ ...base, etapas: [{ nombre: " Lisboa ", desde: "2026-09-20", hasta: "2026-09-23" }, { nombre: "Galicia" }, { nombre: "" }], compania: "solo", proposito: "publico", angulos: ["comida", "comida", "persona"] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.viaje.etapas).toEqual([{ nombre: "Lisboa", desde: "2026-09-20", hasta: "2026-09-23" }, { nombre: "Galicia" }]);
      expect(r.viaje.angulos).toEqual(["comida", "persona"]);
    }
  });
  it("rechaza vuelta antes de salida, etapas fuera del viaje, nombres repetidos y valores inventados", () => {
    expect(validarViaje({ salida: "2026-09-29", vuelta: "2026-09-20", etapas: [] }).ok).toBe(false);
    expect(validarEtapas([{ nombre: "Roma", desde: "2026-10-05" }], base).ok).toBe(false);
    expect(validarEtapas([{ nombre: "Roma" }, { nombre: "roma" }], base).ok).toBe(false);
    expect(validarViaje({ ...base, etapas: [], compania: "mascota" }).ok).toBe(false);
  });
  it("el capítulo de cada fecha: la etapa vigente, o 'Por definir'", () => {
    const v = { ...base, etapas: [{ nombre: "Lisboa", desde: "2026-09-20", hasta: "2026-09-23" }, { nombre: "Oporto", desde: "2026-09-24" }] };
    expect(etapaDeFecha(v, "2026-09-22")).toBe("Lisboa");
    expect(etapaDeFecha(v, "2026-09-28")).toBe("Oporto");
    expect(etapaDeFecha({ ...base, etapas: [{ nombre: "Lisboa", desde: "2026-09-20", hasta: "2026-09-21" }] }, "2026-09-25")).toBe(SIN_ETAPA);
  });
});
