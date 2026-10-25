import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { avanceV3 } from "../src/lib/v3";
import { CifrasHistoria } from "../src/app/tablero/_historia/portada";

// Cuánto del libro lleva (Naza, 25/10): por bloque, sobre los 15 de la V3.

describe("avanceV3", () => {
  it("sin estado o sin bloque todavía, no hay número", () => {
    expect(avanceV3(null)).toBeNull();
    expect(avanceV3({ charla: [] })).toBeNull();
  });

  it("va por el bloque en el que está, y nunca llega a 100 antes de terminar", () => {
    expect(avanceV3({ bloqueActual: 1 })).toBe(7);
    expect(avanceV3({ bloqueActual: 8 })).toBe(53);
    expect(avanceV3({ bloqueActual: 15 })).toBe(95);
  });

  it("en la foto del final, 97; terminada, 100", () => {
    expect(avanceV3({ bloqueActual: 15, esperando: "FO1" })).toBe(97);
    expect(avanceV3({ bloqueActual: 15, terminada: true })).toBe(100);
  });
});

describe("CifrasHistoria con el avance", () => {
  const quien = { propia: false, viaje: false, como: "Nitin" } as Parameters<typeof CifrasHistoria>[0]["quien"];
  it("muestra el porcentaje «del libro» al lado de las respuestas y los minutos", () => {
    const html = renderToStaticMarkup(<CifrasHistoria idioma="ar" quien={quien} respuestas={105} segundos={85 * 60} avance={73} />);
    expect(html).toContain("73%");
    expect(html).toContain("del libro");
  });
  it("sin avance no lo muestra", () => {
    const html = renderToStaticMarkup(<CifrasHistoria idioma="ar" quien={quien} respuestas={105} segundos={85 * 60} />);
    expect(html).not.toContain("del libro");
  });
});
