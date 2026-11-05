import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cajasPortada } from "../src/app/_portada/datos-cajas";
import { catalogo } from "../src/lib/productos";

const eur = (n: number) => `${n} €`;
const filas = (cajas: ReturnType<typeof cajasPortada>, id: string) => cajas.find((c) => c.id === id)!.filas.map((f) => f.valor);

const CLAVES = ["PRECIO_EUR", "PRECIO_IMPRESO_EUR", "PRECIO_VIAJE_EUR", "PRECIO_ARS", "VITACORA_BIOGRAFO"] as const;
const guardadas: Record<string, string | undefined> = {};

describe("las cajitas de la portada", () => {
  beforeEach(() => {
    for (const k of CLAVES) guardadas[k] = process.env[k];
    process.env.PRECIO_EUR = "49";
    process.env.PRECIO_IMPRESO_EUR = "50";
    process.env.PRECIO_VIAJE_EUR = "45";
    delete process.env.VITACORA_BIOGRAFO;
  });

  afterEach(() => {
    for (const k of CLAVES) {
      if (guardadas[k] === undefined) delete process.env[k];
      else process.env[k] = guardadas[k];
    }
  });

  it("Biógrafo no se muestra hasta prenderlo", () => {
    expect(cajasPortada("es", catalogo("ES"), eur).map((c) => c.id)).toEqual(["familiar", "ti", "nino", "viaje", "evento"]);
    expect(cajasPortada("es", catalogo("ES"), eur, true).map((c) => c.id)).toEqual(["familiar", "ti", "nino", "viaje", "evento", "biografo"]);
  });

  it("los precios salen del catálogo, impreso y digital", () => {
    const cajas = cajasPortada("es", catalogo("ES"), eur);
    expect(filas(cajas, "familiar")).toEqual(["99 €", "49 €"]);
    expect(filas(cajas, "ti")).toEqual(["99 €", "49 €"]);
    expect(filas(cajas, "viaje")).toEqual(["95 €", "45 €"]);
  });

  it("sin impreso en la región, solo la fila del digital", () => {
    delete process.env.PRECIO_IMPRESO_EUR;
    expect(filas(cajasPortada("es", catalogo("ES"), eur), "familiar")).toEqual(["49 €"]);
  });

  it("sin Viaje en la región, no hay cajita de Viaje", () => {
    delete process.env.PRECIO_VIAJE_EUR;
    expect(cajasPortada("es", catalogo("ES"), eur).map((c) => c.id)).not.toContain("viaje");
  });

  it("los enlaces van a su lugar y respetan el idioma", () => {
    const es = cajasPortada("es", catalogo("ES"), eur);
    expect(es.find((c) => c.id === "familiar")!.href).toBe("/comprar?regalo=1");
    expect(es.find((c) => c.id === "ti")!.href).toBe("/comprar");
    expect(es.find((c) => c.id === "nino")!.href).toBe("/kids");
    expect(es.find((c) => c.id === "viaje")!.href).toBe("/viaje");
    expect(es.find((c) => c.id === "evento")!.href).toBe("/eventos");
    process.env.PRECIO_ARS = "65000";
    expect(cajasPortada("ar", catalogo("AR"), eur).find((c) => c.id === "familiar")!.href).toBe("/ar/comprar?regalo=1");
  });
});
