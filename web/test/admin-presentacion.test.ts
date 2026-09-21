import { describe, it, expect } from "vitest";
import { euros, horasEnPalabras, fechaCorta, cuando } from "../src/app/admin/ui";

// Lo que se puede romper sin que se vea: los formateadores. El resto de las pantallas es
// JSX que el build y la mirada verifican.

it("los euros se muestran con dos decimales y moneda", () => {
  expect(euros(6.1)).toBe("6,10 €");
  expect(euros(0)).toBe("0,00 €");
});

it("los tiempos se dicen como los dice una persona", () => {
  expect(horasEnPalabras(9)).toBe("9 hs");
  expect(horasEnPalabras(4 * 24)).toBe("4 días");
  expect(horasEnPalabras(0.5)).toBe("30 min");
});

it("sin dato no inventa la fecha", () => {
  expect(fechaCorta(null)).toBe("—");
  expect(cuando(null)).toBe("sin uso");
});

it("un número roto no se muestra como NaN en la pantalla", () => {
  expect(euros(Number.NaN)).toBe("0,00 €");
  expect(horasEnPalabras(Number.NaN)).toBe("—");
  expect(fechaCorta("no es una fecha")).toBe("—");
  expect(cuando("no es una fecha")).toBe("sin uso");
});

it("el tiempo relativo se dice en la unidad que corresponde", () => {
  const ahora = new Date("2026-09-21T12:00:00Z");
  expect(cuando(new Date("2026-09-21T11:40:00Z").toISOString(), ahora)).toBe("hace 20 min");
  expect(cuando(new Date("2026-09-21T06:00:00Z").toISOString(), ahora)).toBe("hace 6 hs");
  expect(cuando(new Date("2026-09-18T12:00:00Z").toISOString(), ahora)).toBe("hace 3 días");
});

it("la fecha corta sale en día/mes y con año cuando se pide", () => {
  expect(fechaCorta("2026-09-18T12:00:00Z")).toBe("18/09");
  expect(fechaCorta("2026-09-18T12:00:00Z", true)).toBe("18/09/2026");
});
