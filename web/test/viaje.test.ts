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

// ── El panel de viaje (3t.19): las etapas como capítulos y el día de hoy ──
import { capitulosDelViaje, diaDeHoy } from "../src/lib/viaje";

describe("Vitácora de viaje — el panel", () => {
  const v = { ...base, etapas: [{ nombre: "Lisboa", desde: "2026-09-20", hasta: "2026-09-23" }, { nombre: "Galicia" }, { nombre: "Oporto", desde: "2026-09-24", hasta: "2026-09-27" }] };

  it("capitulosDelViaje: cada etapa con sus noches, en el orden declarado, y 'Por definir' al final con las que sobran", () => {
    expect(capitulosDelViaje(v)).toEqual([
      { nombre: "Lisboa", desde: "2026-09-20", hasta: "2026-09-23", dias: [1, 2, 3, 4] },
      { nombre: "Galicia", dias: [] },
      { nombre: "Oporto", desde: "2026-09-24", hasta: "2026-09-27", dias: [5, 6, 7, 8] },
      { nombre: SIN_ETAPA, dias: [9, 10] },
    ]);
  });
  it("capitulosDelViaje: sin 'Por definir' cuando todas las noches tienen etapa; una sola etapa sin fechas se lleva todo", () => {
    expect(capitulosDelViaje({ ...base, etapas: [{ nombre: "Lisboa", desde: "2026-09-20" }] })).toEqual([{ nombre: "Lisboa", desde: "2026-09-20", dias: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }]);
    expect(capitulosDelViaje({ ...base, etapas: [{ nombre: "Ruta 40" }] })).toEqual([{ nombre: "Ruta 40", dias: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }]);
  });
  it("diaDeHoy: el día del viaje en su zona horaria; fuera del viaje, null", () => {
    expect(diaDeHoy(v, new Date("2026-09-22T02:00:00Z"), "America/Argentina/Buenos_Aires")).toBe(2); // todavía es 21 en Buenos Aires
    expect(diaDeHoy(v, new Date("2026-09-22T02:00:00Z"), "Europe/Lisbon")).toBe(3);
    expect(diaDeHoy(v, new Date("2026-10-05T12:00:00Z"), "Europe/Lisbon")).toBeNull();
    expect(diaDeHoy(v, new Date("2026-09-10T12:00:00Z"), "Europe/Lisbon")).toBeNull();
  });
});
